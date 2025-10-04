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
  const productId = req.params.id;
  const {
    warehouse_id,
    batch_no,
    manufacturing_date,
    expiry_date,
    qty_received,
    qty_available
  } = req.body;

  if (!productId || !warehouse_id || !batch_no || !qty_received) {
    return res.status(400).json({ error: 'Mandatory fields missing' });
  }

  try {
    const newBatchId = await batchModel.create({
      product_id: productId,
      warehouse_id,
      batch_no,
      manufacturing_date,
      expiry_date,
      qty_received,
      qty_available: qty_available || qty_received
    });
    res.status(201).json({ batchId: newBatchId });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ✅ NEW METHODS - Add these to your existing file:

// GET /api/v1/batches
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

// GET /api/v1/batches/:id
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

// PUT /api/v1/batches/:id
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

// DELETE /api/v1/batches/:id
exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM batches WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
