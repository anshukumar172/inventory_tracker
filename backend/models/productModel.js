const pool = require('../db');

class ProductModel {
  async getAll(filters = {}) {
    try {
      let query = `
        SELECT p.*, 
               COALESCE(SUM(b.qty_available), 0) as total_stock
        FROM products p
        LEFT JOIN batches b ON p.id = b.product_id
      `;

      const params = [];
      const conditions = [];

      if (filters.sku) {
        conditions.push('p.sku LIKE ?');
        params.push(`%${filters.sku}%`);
      }

      if (filters.name) {
        conditions.push('p.name LIKE ?');
        params.push(`%${filters.name}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY p.id ORDER BY p.created_at DESC';

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async findById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT p.*, 
                COALESCE(SUM(b.qty_available), 0) as total_stock
         FROM products p
         LEFT JOIN batches b ON p.id = b.product_id
         WHERE p.id = ?
         GROUP BY p.id`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  async findBySku(sku) {
    try {
      const [rows] = await pool.query('SELECT * FROM products WHERE sku = ?', [sku]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  async create(productData) {
    try {
      const { sku, name, description, hsn_code, unit, default_tax_rate } = productData;
      const [result] = await pool.query(
        `INSERT INTO products (sku, name, description, hsn_code, unit, default_tax_rate) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sku, name, description || '', hsn_code || '', unit || 'nos', default_tax_rate || 18.00]
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
        `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  async deleteById(id) {
    try {
      const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  async search(searchTerm) {
    try {
      const [rows] = await pool.query(
        `SELECT p.*, COALESCE(SUM(b.qty_available), 0) as total_stock
         FROM products p
         LEFT JOIN batches b ON p.id = b.product_id
         WHERE p.sku LIKE ? OR p.name LIKE ?
         GROUP BY p.id
         ORDER BY p.name
         LIMIT 20`,
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProductModel();