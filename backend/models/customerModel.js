const pool = require('../db');

class CustomerModel {
  async getAll() {
    try {
      const [rows] = await pool.query(`
        SELECT c.*, 
               COUNT(si.id) as total_invoices,
               COALESCE(SUM(si.total_amount), 0) as total_business
        FROM customers c
        LEFT JOIN sales_invoices si ON c.id = si.customer_id
        GROUP BY c.id
        ORDER BY c.name
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async findById(id) {
    try {
      const [rows] = await pool.query(`
        SELECT c.*, 
               COUNT(si.id) as total_invoices,
               COALESCE(SUM(si.total_amount), 0) as total_business
        FROM customers c
        LEFT JOIN sales_invoices si ON c.id = si.customer_id
        WHERE c.id = ?
        GROUP BY c.id
      `, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  async search(searchTerm) {
    try {
      const [rows] = await pool.query(`
        SELECT c.*, 
               COUNT(si.id) as total_invoices,
               COALESCE(SUM(si.total_amount), 0) as total_business
        FROM customers c
        LEFT JOIN sales_invoices si ON c.id = si.customer_id
        WHERE c.name LIKE ? OR c.gstin LIKE ? OR c.phone LIKE ?
        GROUP BY c.id
        ORDER BY c.name
        LIMIT 20
      `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async create(customerData) {
  try {
    const { name, gstin, address, city, state, state_code, pincode, phone } = customerData;
    const [result] = await pool.query(
      `INSERT INTO customers (name, gstin, address, city, state, state_code, pincode, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        gstin || '',
        address || '',
        city || '',
        state || '',
        state_code || '',
        pincode || '',
        phone || ''
      ]
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
        `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  async deleteById(id) {
    try {
      // Check if customer has any invoices
      const [invoices] = await pool.query(
        'SELECT COUNT(*) as count FROM sales_invoices WHERE customer_id = ?',
        [id]
      );

      if (invoices[0].count > 0) {
        throw new Error('Cannot delete customer with existing invoices');
      }

      const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  async findByGstin(gstin) {
    try {
      const [rows] = await pool.query('SELECT * FROM customers WHERE gstin = ?', [gstin]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  async getTopCustomers(limit = 10) {
    try {
      const [rows] = await pool.query(`
        SELECT c.*, 
               COUNT(si.id) as total_invoices,
               SUM(si.total_amount) as total_business
        FROM customers c
        INNER JOIN sales_invoices si ON c.id = si.customer_id
        GROUP BY c.id
        ORDER BY total_business DESC
        LIMIT ?
      `, [limit]);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CustomerModel();