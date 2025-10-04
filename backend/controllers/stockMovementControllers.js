const pool = require('../db');

exports.createStockMovement = async (req, res) => {
  try {
    console.log('📦 Stock movement request received:', JSON.stringify(req.body, null, 2));

    // Extract parameters matching your table structure exactly
    const {
      movement_type, // ENUM('IN', 'OUT', 'TRANSFER', 'ADJUST') - REQUIRED
      reference_type, // VARCHAR(50) - Optional
      reference_id, // INT - Optional
      product_id, // INT NOT NULL - REQUIRED
      warehouse_from, // INT - Optional
      warehouse_to, // INT - Optional
      batch_id, // INT - Optional
      qty, // DECIMAL(12,3) NOT NULL - REQUIRED
      unit_cost, // DECIMAL(12,2) - Optional
      total_value // DECIMAL(14,2) - Optional
    } = req.body;

    // Validate REQUIRED fields
    if (!movement_type || !product_id || !qty) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['movement_type', 'product_id', 'qty'],
        received: req.body
      });
    }

    // Validate movement_type enum
    const validMovementTypes = ['IN', 'OUT', 'TRANSFER', 'ADJUST'];
    if (!validMovementTypes.includes(movement_type)) {
      return res.status(400).json({
        error: 'Invalid movement_type',
        valid_types: validMovementTypes,
        received: movement_type
      });
    }

    // Get user ID from auth middleware (REQUIRED field)
    const created_by = req.user?.id;
    if (!created_by) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Convert undefined to null for optional fields
    const sanitizeValue = (value) => value === undefined ? null : value;

    // Prepare parameters in exact order for SQL query
    const queryParams = [
      movement_type, // REQUIRED
      sanitizeValue(reference_type), // Optional
      sanitizeValue(reference_id), // Optional
      product_id, // REQUIRED
      sanitizeValue(warehouse_from), // Optional
      sanitizeValue(warehouse_to), // Optional
      sanitizeValue(batch_id), // Optional
      qty, // REQUIRED
      sanitizeValue(unit_cost), // Optional
      sanitizeValue(total_value), // Optional
      created_by // REQUIRED
    ];

    console.log('📝 Sanitized parameters:', queryParams);

    // SQL INSERT query matching your table structure
    const query = `
      INSERT INTO stock_movements (
        movement_type, reference_type, reference_id, product_id,
        warehouse_from, warehouse_to, batch_id, qty,
        unit_cost, total_value, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, queryParams);

    console.log('✅ Stock movement created successfully:', result.insertId);

    res.status(201).json({
      message: 'Stock movement created successfully',
      id: result.insertId,
      movement: {
        id: result.insertId,
        movement_type,
        product_id,
        qty,
        warehouse_from,
        warehouse_to,
        created_by,
        created_at: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error creating stock movement:', error);
    res.status(500).json({
      error: 'Failed to create stock movement',
      details: error.message
    });
  }
};

// GET /api/v1/stock-movements - Get all stock movements
exports.getAllStockMovements = async (req, res) => {
  try {
    const query = `
      SELECT sm.*, 
             p.name as product_name, 
             p.sku,
             wf.name as from_warehouse_name,
             wt.name as to_warehouse_name,
             u.username as created_by_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN warehouses wf ON sm.warehouse_from = wf.id
      LEFT JOIN warehouses wt ON sm.warehouse_to = wt.id
      LEFT JOIN users u ON sm.created_by = u.id
      ORDER BY sm.created_at DESC
      LIMIT 100
    `;
    
    const [rows] = await pool.execute(query);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching stock movements:', error);
    res.status(500).json({
      error: 'Failed to fetch stock movements',
      details: error.message
    });
  }
};

// GET /api/v1/stock-movements/product/:productId - Get movements for specific product
exports.getMovementsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const query = `
      SELECT sm.*, 
             p.name as product_name, 
             p.sku,
             wf.name as from_warehouse_name,
             wt.name as to_warehouse_name,
             u.username as created_by_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN warehouses wf ON sm.warehouse_from = wf.id
      LEFT JOIN warehouses wt ON sm.warehouse_to = wt.id
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE sm.product_id = ?
      ORDER BY sm.created_at DESC
    `;
    
    const [rows] = await pool.execute(query, [productId]);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      product_id: parseInt(productId)
    });
    
  } catch (error) {
    console.error('❌ Error fetching movements for product:', error);
    res.status(500).json({
      error: 'Failed to fetch product movements',
      details: error.message
    });
  }
};
