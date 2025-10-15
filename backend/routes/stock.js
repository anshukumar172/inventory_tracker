// backend/routes/stock.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Get Low Stock Items
router.get('/low-stock', async (req, res) => {
  try {
    console.log('📊 Fetching low stock items...');
    
    const query = `
      SELECT 
        p.id,
        p.name as product_name,
        p.sku,
        p.min_stock,
        COALESCE(SUM(b.qty_available), 0) as current_stock,
        w.name as warehouse_name
      FROM products p
      LEFT JOIN batches b ON p.id = b.product_id
      LEFT JOIN warehouses w ON b.warehouse_id = w.id
      WHERE p.min_stock IS NOT NULL
      GROUP BY p.id, p.name, p.sku, p.min_stock, w.name
      HAVING current_stock < p.min_stock
      ORDER BY current_stock ASC
    `;
    
    const [rows] = await db.query(query);
    console.log(`✅ Found ${rows.length} low stock items`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching low stock items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Expiring Items
router.get('/expiring-items', async (req, res) => {
  try {
    console.log('📅 Fetching expiring items...');
    
    const query = `
      SELECT 
        p.name as product_name,
        p.sku,
        b.batch_no as batch_number,
        b.expiry_date,
        b.qty_available as quantity,
        b.unit_cost,
        w.name as warehouse_name
      FROM batches b
      JOIN products p ON b.product_id = p.id
      JOIN warehouses w ON b.warehouse_id = w.id
      WHERE b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
        AND b.qty_available > 0
      ORDER BY b.expiry_date ASC
    `;
    
    const [rows] = await db.query(query);
    console.log(`✅ Found ${rows.length} expiring items`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching expiring items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Total Stock Value
router.get('/total-value', async (req, res) => {
  try {
    console.log('💰 Calculating total stock value...');
    
    const query = `
      SELECT 
        COALESCE(SUM(b.qty_available * b.unit_cost), 0) as total_value,
        COUNT(DISTINCT p.id) as total_products,
        SUM(b.qty_available) as total_quantity
      FROM batches b
      JOIN products p ON b.product_id = p.id
      WHERE b.qty_available > 0
    `;
    
    const [rows] = await db.query(query);
    console.log(`✅ Total stock value: ₹${rows[0].total_value}`);
    
    res.json({
      totalValue: Math.round(rows[0].total_value || 0),
      totalProducts: rows[0].total_products || 0,
      totalQuantity: rows[0].total_quantity || 0
    });
  } catch (error) {
    console.error('❌ Error calculating stock value:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
