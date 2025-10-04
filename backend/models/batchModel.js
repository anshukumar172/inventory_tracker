const pool = require('../db');

class BatchModel {
  async getAll(filters = {}) {
    try {
      let query = `
        SELECT b.*, p.sku, p.name as product_name, w.name as warehouse_name
        FROM batches b
        INNER JOIN products p ON b.product_id = p.id
        INNER JOIN warehouses w ON b.warehouse_id = w.id
      `;

      const conditions = [];
      const params = [];

      if (filters.product_id) {
        conditions.push('b.product_id = ?');
        params.push(filters.product_id);
      }

      if (filters.warehouse_id) {
        conditions.push('b.warehouse_id = ?');
        params.push(filters.warehouse_id);
      }

      if (filters.expiring_soon) {
        conditions.push('b.expiry_date IS NOT NULL AND b.expiry_date <= DATE_ADD(NOW(), INTERVAL ? DAY)');
        params.push(filters.expiring_soon);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY b.expiry_date ASC, b.created_at DESC';

      // ✅ FIXED: Use pool.execute instead of pool.query
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getByProductId(productId) {
    try {
      // ✅ FIXED: Use pool.execute instead of pool.query
      const [rows] = await pool.execute(`
        SELECT b.*, w.name as warehouse_name, w.code as warehouse_code
        FROM batches b
        INNER JOIN warehouses w ON b.warehouse_id = w.id
        WHERE b.product_id = ?
        ORDER BY b.expiry_date ASC, b.created_at DESC
      `, [productId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async findById(id) {
    try {
      // ✅ FIXED: Use pool.execute instead of pool.query
      const [rows] = await pool.execute(`
        SELECT b.*, p.sku, p.name as product_name, w.name as warehouse_name
        FROM batches b
        INNER JOIN products p ON b.product_id = p.id
        INNER JOIN warehouses w ON b.warehouse_id = w.id
        WHERE b.id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  async create(batchData) {
    try {
      const { 
        product_id, 
        warehouse_id, 
        batch_no, 
        manufacturing_date, 
        expiry_date, 
        qty_received, 
        qty_available 
      } = batchData;

      console.log('📦 BatchModel.create called with:', batchData);

      // ✅ FIXED: Use pool.execute instead of pool.query
      const [result] = await pool.execute(
        `INSERT INTO batches 
         (product_id, warehouse_id, batch_no, manufacturing_date, expiry_date, qty_received, qty_available) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          product_id, 
          warehouse_id, 
          batch_no, 
          manufacturing_date || null, 
          expiry_date || null, 
          qty_received, 
          qty_available || qty_received
        ]
      );
      
      console.log('✅ BatchModel.create result:', result);
      return result.insertId;
    } catch (error) {
      console.error('❌ BatchModel.create error:', error);
      throw error;
    }
  }

  async updateQuantity(id, newQtyAvailable) {
    try {
      // ✅ FIXED: Use pool.execute instead of pool.query
      const [result] = await pool.execute(
        'UPDATE batches SET qty_available = ? WHERE id = ?',
        [newQtyAvailable, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  async getAvailableBatches(productId, warehouseId, strategy = 'FIFO') {
    try {
      let orderBy = 'b.created_at ASC'; // FIFO default

      if (strategy === 'FEFO') {
        orderBy = 'b.expiry_date ASC, b.created_at ASC';
      } else if (strategy === 'LIFO') {
        orderBy = 'b.created_at DESC';
      }

      // ✅ FIXED: Use pool.execute instead of pool.query
      const [rows] = await pool.execute(`
        SELECT b.*
        FROM batches b
        WHERE b.product_id = ? 
          AND b.warehouse_id = ? 
          AND b.qty_available > 0
        ORDER BY ${orderBy}
      `, [productId, warehouseId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getExpiringBatches(daysAhead = 30) {
    try {
      // ✅ FIXED: Use pool.execute instead of pool.query
      const [rows] = await pool.execute(`
        SELECT b.*, p.sku, p.name as product_name, w.name as warehouse_name
        FROM batches b
        INNER JOIN products p ON b.product_id = p.id
        INNER JOIN warehouses w ON b.warehouse_id = w.id
        WHERE b.expiry_date IS NOT NULL 
          AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
          AND b.qty_available > 0
        ORDER BY b.expiry_date ASC
      `, [daysAhead]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async deleteById(id) {
    try {
      // Check if batch has available quantity
      const batch = await this.findById(id);
      if (batch && batch.qty_available > 0) {
        throw new Error('Cannot delete batch with available stock');
      }

      // ✅ FIXED: Use pool.execute instead of pool.query
      const [result] = await pool.execute('DELETE FROM batches WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BatchModel();
