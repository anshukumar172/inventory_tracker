const pool = require('../db');
const batchModel = require('../models/batchModel');

console.log('📦 Batch controller loaded');

exports.getBatchesByProductId = async (req, res) => {
  const productId = req.params.id;
  try {
    const batches = await batchModel.getByProductId(productId);
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createBatch = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      warehouse_id,
      batch_no,
      manufacturing_date,
      expiry_date,
      qty_received,
      qty_available
    } = req.body;

    console.log('📦 Creating batch with data:', {
      productId,
      warehouse_id,
      batch_no,
      manufacturing_date,
      expiry_date,
      qty_received,
      qty_available
    });

    // ✅ Enhanced validation with warehouse auto-selection
    if (!productId) {
      return res.status(400).json({ 
        success: false,
        error: 'Product ID is required',
        field: 'productId' 
      });
    }

    // ✅ MODIFIED: Always prioritize Main Warehouse
    let selectedWarehouseId = warehouse_id;
    let warehouseName = 'Main Warehouse';
    
    if (!selectedWarehouseId) {
      console.log('⚠️ No warehouse selected, searching for Main Warehouse...');
      
      try {
        // ✅ First: Look for warehouse with "Main" in name
        const [mainWarehouses] = await pool.execute(`
          SELECT id, name FROM warehouses 
          WHERE name LIKE '%Main%' OR name LIKE '%main%' OR name LIKE '%MAIN%'
          ORDER BY 
            CASE 
              WHEN name = 'Main Warehouse' THEN 1
              WHEN name LIKE 'Main%' THEN 2
              ELSE 3
            END,
            id ASC 
          LIMIT 1
        `);
        
        if (mainWarehouses.length > 0) {
          selectedWarehouseId = mainWarehouses[0].id;
          warehouseName = mainWarehouses[0].name;
          console.log(`✅ Found and using: ${warehouseName} (ID: ${selectedWarehouseId})`);
        } else {
          // ✅ Second: Create Main Warehouse if it doesn't exist
          console.log('📦 Main Warehouse not found, creating Main Warehouse...');
          
          const [createResult] = await pool.execute(`
            INSERT INTO warehouses (name, code, address) 
            VALUES ('Main Warehouse', 'MAIN-001', 'Primary Storage Location')
          `);
          
          selectedWarehouseId = createResult.insertId;
          warehouseName = 'Main Warehouse';
          console.log(`✅ Created Main Warehouse with ID: ${selectedWarehouseId}`);
        }
      } catch (err) {
        console.error('Error setting up Main Warehouse:', err);
        
        // ✅ Fallback: Use any available warehouse
        try {
          console.log('🔄 Fallback: Using any available warehouse...');
          const [fallbackWarehouses] = await pool.execute(`
            SELECT id, name FROM warehouses 
            ORDER BY id ASC 
            LIMIT 1
          `);
          
          if (fallbackWarehouses.length > 0) {
            selectedWarehouseId = fallbackWarehouses[0].id;
            warehouseName = fallbackWarehouses[0].name;
            console.log(`✅ Using fallback warehouse: ${warehouseName} (ID: ${selectedWarehouseId})`);
          } else {
            return res.status(400).json({ 
              success: false,
              error: 'No warehouses found. Please create a warehouse first.',
              field: 'warehouse_id'
            });
          }
        } catch (fallbackErr) {
          console.error('Fallback warehouse selection failed:', fallbackErr);
          return res.status(400).json({ 
            success: false,
            error: 'Unable to select any warehouse. Please try again.',
            field: 'warehouse_id'
          });
        }
      }
    } else {
      // ✅ Get warehouse name for selected warehouse
      try {
        const [selectedWarehouse] = await pool.execute(
          'SELECT name FROM warehouses WHERE id = ?', 
          [selectedWarehouseId]
        );
        warehouseName = selectedWarehouse[0]?.name || 'Selected Warehouse';
        console.log(`✅ Using specified warehouse: ${warehouseName} (ID: ${selectedWarehouseId})`);
      } catch (err) {
        console.error('Error getting selected warehouse name:', err);
        warehouseName = 'Selected Warehouse';
      }
    }

    if (!batch_no || batch_no.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Batch number is required',
        field: 'batch_no'
      });
    }

    if (!qty_received || qty_received <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Quantity received must be greater than 0',
        field: 'qty_received'
      });
    }

    // ✅ Create batch using batchModel
    const newBatchId = await batchModel.create({
      product_id: parseInt(productId),
      warehouse_id: parseInt(selectedWarehouseId),
      batch_no: batch_no.trim(),
      manufacturing_date: manufacturing_date || null,
      expiry_date: expiry_date || null,
      qty_received: parseFloat(qty_received),
      qty_available: qty_available ? parseFloat(qty_available) : parseFloat(qty_received)
    });

    console.log(`✅ Batch created successfully with ID: ${newBatchId}`);
    console.log(`📦 Batch assigned to: ${warehouseName} (ID: ${selectedWarehouseId})`);

    res.status(201).json({ 
      success: true,
      message: `Batch created successfully in ${warehouseName}`,
      batchId: newBatchId,
      warehouse_used: warehouseName,
      warehouse_id: selectedWarehouseId,
      data: {
        batch_id: newBatchId,
        product_id: parseInt(productId),
        warehouse_id: selectedWarehouseId,
        warehouse_name: warehouseName,
        batch_no: batch_no.trim(),
        qty_received: parseFloat(qty_received),
        qty_available: qty_available ? parseFloat(qty_available) : parseFloat(qty_received)
      }
    });

  } catch (error) {
    console.error('❌ Error creating batch:', error);

    // ✅ Enhanced error handling
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false,
        error: 'Batch number already exists for this product',
        field: 'batch_no',
        suggestion: 'Try a different batch number like BATCH-' + Date.now()
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid product or warehouse ID',
        field: 'foreign_key'
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to create batch. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ FIXED: All functions with proper syntax
exports.getAllBatches = async (req, res) => {
  try {
    const [batches] = await pool.execute(`
      SELECT 
        b.*,
        p.name as product_name,
        p.sku,
        w.name as warehouse_name
      FROM batches b
      LEFT JOIN products p ON b.product_id = p.id
      LEFT JOIN warehouses w ON b.warehouse_id = w.id
      ORDER BY b.created_at DESC
    `);
    
    res.json(batches);
  } catch (error) {
    console.error('Error fetching all batches:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [batches] = await pool.execute(`
      SELECT 
        b.*,
        p.name as product_name,
        w.name as warehouse_name
      FROM batches b
      LEFT JOIN products p ON b.product_id = p.id
      LEFT JOIN warehouses w ON b.warehouse_id = w.id
      WHERE b.id = ?
    `, [id]);
    
    if (batches.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.json(batches[0]);
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      warehouse_id,
      batch_no,
      manufacturing_date,
      expiry_date,
      qty_received,
      qty_available
    } = req.body;

    const [result] = await pool.execute(`
      UPDATE batches 
      SET warehouse_id = ?, batch_no = ?, manufacturing_date = ?, 
          expiry_date = ?, qty_received = ?, qty_available = ?
      WHERE id = ?
    `, [warehouse_id, batch_no, manufacturing_date, expiry_date, qty_received, qty_available, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    res.json({ message: 'Batch updated successfully' });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    const batchId = req.params.id;
    console.log(`🗑️ Attempting to delete batch ${batchId}`);
    
    // ✅ Check if batch has been used in sales invoices
    const [invoiceItems] = await pool.execute(`
      SELECT COUNT(*) as item_count 
      FROM sales_invoice_items 
      WHERE batch_id = ?
    `, [batchId]);
    
    if (invoiceItems[0].item_count > 0) {
      console.log(`❌ Batch ${batchId} used in ${invoiceItems[0].item_count} invoice(s)`);
      return res.status(400).json({ 
        success: false,
        error: `Cannot delete batch. It has been used in ${invoiceItems[0].item_count} sales invoice(s). Batches with transaction history cannot be deleted for audit purposes.`
      });
    }
    
    // ✅ Check if batch has stock movements
    const [movements] = await pool.execute(`
      SELECT COUNT(*) as movement_count 
      FROM stock_movements 
      WHERE batch_id = ?
    `, [batchId]);
    
    if (movements[0].movement_count > 0) {
      console.log(`❌ Batch ${batchId} has ${movements[0].movement_count} stock movement(s)`);
      return res.status(400).json({ 
        success: false,
        error: `Cannot delete batch. It has ${movements[0].movement_count} stock movement record(s). Batches with movement history cannot be deleted.`
      });
    }
    
    // ✅ If all checks pass, delete the batch
    const [result] = await pool.execute('DELETE FROM batches WHERE id = ?', [batchId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Batch not found' 
      });
    }
    
    console.log(`✅ Batch ${batchId} deleted successfully`);
    res.json({ 
      success: true,
      message: 'Batch deleted successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error deleting batch:', error);
    
    // Handle foreign key constraint errors
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete batch. It is referenced by sales invoices or other records. Please ensure all related transactions are removed first.'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete batch. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

