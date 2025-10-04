const pool = require('../db');

class WarehouseModel {
  async getAll() {
    try {
      const [rows] = await pool.query(`
        SELECT w.*, 
               COUNT(DISTINCT b.product_id) as total_products,
               COALESCE(SUM(b.qty_available), 0) as total_stock_units
        FROM warehouses w
        LEFT JOIN batches b ON w.id = b.warehouse_id
        GROUP BY w.id
        ORDER BY w.name
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async findById(id) {
    try {
      const [rows] = await pool.query(`
        SELECT w.*, 
               COUNT(DISTINCT b.product_id) as total_products,
               COALESCE(SUM(b.qty_available), 0) as total_stock_units
        FROM warehouses w
        LEFT JOIN batches b ON w.id = b.warehouse_id
        WHERE w.id = ?
        GROUP BY w.id
      `, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  async findByCode(code) {
    try {
      const [rows] = await pool.query('SELECT * FROM warehouses WHERE code = ?', [code]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  async create(warehouseData) {
    try {
      const { code, name, address, city, state, state_code, pincode, phone } = warehouseData;
      const [result] = await pool.query(
        `INSERT INTO warehouses (code, name, address, city, state, state_code, pincode, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [code, name, address || '', city || '', state || '', state_code || '', pincode || '', phone || '']
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  async updateById(id, updateData) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        if (key !== 'id' && updateData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      if (fields.length === 0) return false;

      values.push(id);
      const [result] = await pool.query(
        `UPDATE warehouses SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  async deleteById(id) {
    try {
      // Check if warehouse has any stock
      const [batches] = await pool.query(
        'SELECT COUNT(*) as count FROM batches WHERE warehouse_id = ? AND qty_available > 0',
        [id]
      );

      if (batches[0].count > 0) {
        throw new Error('Cannot delete warehouse with existing stock');
      }

      const [result] = await pool.query('DELETE FROM warehouses WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  async getStockSummary(warehouseId) {
    try {
      const [rows] = await pool.query(`
        SELECT p.id, p.sku, p.name, p.unit,
               SUM(b.qty_available) as available_qty,
               COUNT(b.id) as batch_count,
               MIN(b.expiry_date) as earliest_expiry
        FROM products p
        INNER JOIN batches b ON p.id = b.product_id
        WHERE b.warehouse_id = ? AND b.qty_available > 0
        GROUP BY p.id
        ORDER BY p.name
      `, [warehouseId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new WarehouseModel();