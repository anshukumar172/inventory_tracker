const pool = require('../db');
const stockMovementModel = require('../models/stockMovementModel');

console.log('📦 Stock Movement Controller loaded');

// POST /api/v1/stock-movements - Create stock movement
exports.createStockMovement = async (req, res) => {
  try {
    console.log('📦 Stock movement request received:', JSON.stringify(req.body, null, 2));

    // ✅ FIXED: Map frontend field names to database column names
    const {
      movement_type,
      reference_type,
      reference_id,
      product_id,
      from_warehouse_id,    // Frontend sends this
      to_warehouse_id,      // Frontend sends this  
      warehouse_from,       // Alternative name
      warehouse_to,         // Alternative name
      batch_id,
      qty,
      unit_cost,
      total_value
    } = req.body;

    // ✅ FIXED: Map frontend movement types to backend types
    const movementTypeMapping = {
      'Purchase In': 'IN',
      'Sales Out': 'OUT', 
      'Transfer In': 'TRANSFER',
      'Transfer Out': 'TRANSFER',  // ✅ This was missing!
      'Adjustment': 'ADJUST',
      // Also handle direct backend types
      'IN': 'IN',
      'OUT': 'OUT',
      'TRANSFER': 'TRANSFER',
      'ADJUST': 'ADJUST'
    };

    const mappedMovementType = movementTypeMapping[movement_type] || movement_type;
    console.log(`📋 Movement type mapping: "${movement_type}" → "${mappedMovementType}"`);

    // ✅ Map to correct database field names
    const warehouseFrom = warehouse_from || from_warehouse_id;
    const warehouseTo = warehouse_to || to_warehouse_id;

    console.log('📝 Mapped warehouse fields:', {
      warehouseFrom,
      warehouseTo,
      original_from: from_warehouse_id,
      original_to: to_warehouse_id
    });

    // ✅ Validate REQUIRED fields
    if (!movement_type) {
      return res.status(400).json({
        success: false,
        error: 'Movement type is required',
        field: 'movement_type',
        valid_types: ['Purchase In', 'Sales Out', 'Transfer In', 'Transfer Out', 'Adjustment']
      });
    }

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required',
        field: 'product_id'
      });
    }

    if (!qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be greater than 0',
        field: 'qty'
      });
    }

    // ✅ FIXED: Validate movement_type with frontend terms
    const validFrontendTypes = ['Purchase In', 'Sales Out', 'Transfer In', 'Transfer Out', 'Adjustment'];
    const validBackendTypes = ['IN', 'OUT', 'TRANSFER', 'ADJUST'];
    
    if (!validFrontendTypes.includes(movement_type) && !validBackendTypes.includes(movement_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid movement type',
        field: 'movement_type',
        valid_types: validFrontendTypes,
        received: movement_type
      });
    }

    // ✅ FIXED: Transfer validation - require both warehouses for transfers
    if (movement_type === 'Transfer Out' || movement_type === 'Transfer In' || mappedMovementType === 'TRANSFER') {
      if (!warehouseFrom || !warehouseTo) {
        return res.status(400).json({
          success: false,
          error: 'Transfer requires both From and To warehouses',
          field: 'warehouses',
          missing: {
            from: !warehouseFrom,
            to: !warehouseTo
          }
        });
      }

      if (warehouseFrom === warehouseTo) {
        return res.status(400).json({
          success: false,
          error: 'From and To warehouses must be different',
          field: 'warehouses'
        });
      }
    }

    // ✅ Get user ID from auth middleware or use default
    const created_by = req.user?.id || 1; // Default to user 1 if no auth

    // ✅ FIXED: Auto-select batch for transfers and outbound movements
    let selectedBatchId = batch_id;
    if (!selectedBatchId && (mappedMovementType === 'OUT' || mappedMovementType === 'TRANSFER')) {
      try {
        // ✅ For transfers, find batch in the source warehouse
        const warehouseCondition = warehouseFrom ? 'AND b.warehouse_id = ?' : '';
        const params = warehouseFrom ? [product_id, warehouseFrom] : [product_id];
        
        const [availableBatches] = await pool.execute(`
          SELECT b.id, b.batch_no, b.qty_available, w.name as warehouse_name
          FROM batches b
          LEFT JOIN warehouses w ON b.warehouse_id = w.id
          WHERE b.product_id = ? AND b.qty_available > 0 
          ${warehouseCondition}
          ORDER BY b.expiry_date ASC, b.created_at ASC 
          LIMIT 1
        `, params);

        if (availableBatches.length > 0) {
          selectedBatchId = availableBatches[0].id;
          console.log(`✅ Auto-selected batch: ${availableBatches[0].batch_no} from ${availableBatches[0].warehouse_name} (ID: ${selectedBatchId})`);
        } else {
          const warehouseName = warehouseFrom ? `warehouse ${warehouseFrom}` : 'any warehouse';
          return res.status(400).json({
            success: false,
            error: `No available batches found for this product in ${warehouseName}`,
            field: 'batch_id',
            suggestion: 'Please ensure the product has stock in the source warehouse'
          });
        }
      } catch (err) {
        console.error('Error finding available batch:', err);
        return res.status(400).json({
          success: false,
          error: 'Unable to find available batches',
          field: 'batch_id'
        });
      }
    }

    // ✅ Calculate total_value if unit_cost provided
    const calculatedTotalValue = total_value || (unit_cost ? (parseFloat(qty) * parseFloat(unit_cost)) : null);

    // ✅ Prepare movement data with mapped movement type
    const movementData = {
      movement_type: mappedMovementType, // ✅ Use mapped type for database
      reference_type: reference_type || null,
      reference_id: reference_id || null,
      product_id: parseInt(product_id),
      warehouse_from: warehouseFrom ? parseInt(warehouseFrom) : null,
      warehouse_to: warehouseTo ? parseInt(warehouseTo) : null,
      batch_id: selectedBatchId ? parseInt(selectedBatchId) : null,
      qty: parseFloat(qty),
      unit_cost: unit_cost ? parseFloat(unit_cost) : null,
      total_value: calculatedTotalValue ? parseFloat(calculatedTotalValue) : null,
      created_by: parseInt(created_by)
    };

    console.log('📋 Final movement data:', movementData);

    // ✅ Create stock movement using model
    const movementId = await stockMovementModel.createMovement(movementData);

    console.log('✅ Stock movement created successfully with ID:', movementId);

    res.status(201).json({
      success: true,
      message: 'Stock movement created successfully',
      data: {
        id: movementId,
        movement_type: movement_type, // ✅ Return original frontend type
        mapped_type: mappedMovementType,
        product_id: parseInt(product_id),
        qty: parseFloat(qty),
        warehouse_from: warehouseFrom,
        warehouse_to: warehouseTo,
        batch_id: selectedBatchId,
        created_by: parseInt(created_by),
        created_at: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error creating stock movement:', error);
    
    // ✅ Enhanced error handling
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product, warehouse, or batch ID',
        field: 'foreign_key',
        suggestion: 'Please check that the product and warehouses exist'
      });
    }

    if (error.message && error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        field: 'qty'
      });
    }

    if (error.message && error.message.includes('Batch with ID')) {
      return res.status(400).json({
        success: false,
        error: 'Selected batch not found',
        field: 'batch_id'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create stock movement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Keep all your existing GET methods unchanged
exports.getAllStockMovements = async (req, res) => {
  try {
    const { page = 1, limit = 50, product_id, movement_type, warehouse_id } = req.query;
    
    const filters = {
      product_id: product_id ? parseInt(product_id) : null,
      movement_type,
      warehouse_id: warehouse_id ? parseInt(warehouse_id) : null
    };

    const movements = await stockMovementModel.getMovements(filters);
    
    // ✅ Pagination
    const offset = (page - 1) * limit;
    const paginatedMovements = movements.slice(offset, offset + limit);
    
    res.json({
      success: true,
      data: paginatedMovements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: movements.length,
        pages: Math.ceil(movements.length / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching stock movements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock movements',
      details: error.message
    });
  }
};

exports.getMovementsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const movements = await stockMovementModel.getMovements({
      product_id: parseInt(productId)
    });
    
    res.json({
      success: true,
      data: movements,
      count: movements.length,
      product_id: parseInt(productId)
    });
    
  } catch (error) {
    console.error('❌ Error fetching movements for product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product movements',
      details: error.message
    });
  }
};

exports.getStockLedger = async (req, res) => {
  try {
    const { productId } = req.params;
    const { warehouse_id } = req.query;
    
    const ledger = await stockMovementModel.getStockLedger(
      parseInt(productId),
      warehouse_id ? parseInt(warehouse_id) : null
    );
    
    res.json({
      success: true,
      data: ledger,
      count: ledger.length,
      product_id: parseInt(productId),
      warehouse_id: warehouse_id ? parseInt(warehouse_id) : null
    });
    
  } catch (error) {
    console.error('❌ Error fetching stock ledger:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock ledger',
      details: error.message
    });
  }
};

exports.getStockValuation = async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    
    const valuation = await stockMovementModel.getStockValuation(
      warehouse_id ? parseInt(warehouse_id) : null
    );
    
    const totalValue = valuation.reduce((sum, item) => sum + (item.stock_value || 0), 0);
    
    res.json({
      success: true,
      data: valuation,
      summary: {
        total_products: valuation.length,
        total_stock_value: Math.round(totalValue * 100) / 100
      },
      warehouse_id: warehouse_id ? parseInt(warehouse_id) : null
    });
    
  } catch (error) {
    console.error('❌ Error fetching stock valuation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock valuation',
      details: error.message
    });
  }
};

exports.getMovementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movement = await stockMovementModel.getMovementById(parseInt(id));
    
    if (!movement) {
      return res.status(404).json({
        success: false,
        error: 'Stock movement not found'
      });
    }
    
    res.json({
      success: true,
      data: movement
    });
    
  } catch (error) {
    console.error('❌ Error fetching movement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movement',
      details: error.message
    });
  }
};
