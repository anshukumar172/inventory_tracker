const pool = require('../db');

class AlertModel {
  async createAlert(alertData) {
    try {
      const { product_id, warehouse_id, type, threshold } = alertData;
      const [result] = await pool.query(
        `INSERT INTO alerts (product_id, warehouse_id, type, threshold) 
         VALUES (?, ?, ?, ?)`,
        [product_id, warehouse_id, type, threshold]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  async getActiveAlerts() {
    try {
      const [rows] = await pool.query(`
        SELECT a.*, 
               p.sku, p.name as product_name,
               w.name as warehouse_name,
               COALESCE(b.total_available, 0) as current_stock
        FROM alerts a
        INNER JOIN products p ON a.product_id = p.id
        INNER JOIN warehouses w ON a.warehouse_id = w.id
        LEFT JOIN (
          SELECT product_id, warehouse_id, SUM(qty_available) as total_available
          FROM batches 
          GROUP BY product_id, warehouse_id
        ) b ON a.product_id = b.product_id AND a.warehouse_id = b.warehouse_id
        WHERE a.triggered = true
        ORDER BY a.last_triggered DESC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async checkLowStockAlerts() {
    try {
      // Get all low stock alerts and check current stock levels
      const [alerts] = await pool.query(`
        SELECT a.*, 
               p.sku, p.name as product_name,
               w.name as warehouse_name,
               COALESCE(b.total_available, 0) as current_stock
        FROM alerts a
        INNER JOIN products p ON a.product_id = p.id
        INNER JOIN warehouses w ON a.warehouse_id = w.id
        LEFT JOIN (
          SELECT product_id, warehouse_id, SUM(qty_available) as total_available
          FROM batches 
          GROUP BY product_id, warehouse_id
        ) b ON a.product_id = b.product_id AND a.warehouse_id = b.warehouse_id
        WHERE a.type = 'low_stock'
      `);

      const triggeredAlerts = [];

      for (const alert of alerts) {
        const shouldTrigger = alert.current_stock <= alert.threshold;

        if (shouldTrigger && !alert.triggered) {
          // Trigger the alert
          await pool.query(
            'UPDATE alerts SET triggered = true, last_triggered = NOW() WHERE id = ?',
            [alert.id]
          );
          triggeredAlerts.push({
            ...alert,
            alert_message: `Low stock alert: ${alert.product_name} in ${alert.warehouse_name} has ${alert.current_stock} units (threshold: ${alert.threshold})`
          });
        } else if (!shouldTrigger && alert.triggered) {
          // Reset the alert
          await pool.query(
            'UPDATE alerts SET triggered = false WHERE id = ?',
            [alert.id]
          );
        }
      }

      return triggeredAlerts;
    } catch (error) {
      throw error;
    }
  }

  async checkExpiryAlerts() {
    try {
      const [alerts] = await pool.query(`
        SELECT a.*, 
               p.sku, p.name as product_name,
               w.name as warehouse_name,
               b.batch_no,
               b.expiry_date,
               b.qty_available,
               DATEDIFF(b.expiry_date, CURDATE()) as days_to_expire
        FROM alerts a
        INNER JOIN products p ON a.product_id = p.id
        INNER JOIN warehouses w ON a.warehouse_id = w.id
        INNER JOIN batches b ON a.product_id = b.product_id 
                            AND a.warehouse_id = b.warehouse_id
        WHERE a.type = 'expiry'
          AND b.expiry_date IS NOT NULL
          AND b.qty_available > 0
          AND DATEDIFF(b.expiry_date, CURDATE()) <= a.threshold
      `);

      const triggeredAlerts = [];

      for (const alert of alerts) {
        const alertKey = `${alert.product_id}-${alert.warehouse_id}-expiry`;

        if (!alert.triggered) {
          await pool.query(
            'UPDATE alerts SET triggered = true, last_triggered = NOW() WHERE id = ?',
            [alert.id]
          );
        }

        triggeredAlerts.push({
          ...alert,
          alert_message: `Expiry alert: ${alert.product_name} (Batch: ${alert.batch_no}) in ${alert.warehouse_name} expires in ${alert.days_to_expire} days`
        });
      }

      return triggeredAlerts;
    } catch (error) {
      throw error;
    }
  }

  async dismissAlert(alertId) {
    try {
      const [result] = await pool.query(
        'UPDATE alerts SET triggered = false WHERE id = ?',
        [alertId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  async getAllAlerts() {
    try {
      const [rows] = await pool.query(`
        SELECT a.*, 
               p.sku, p.name as product_name,
               w.name as warehouse_name
        FROM alerts a
        INNER JOIN products p ON a.product_id = p.id
        INNER JOIN warehouses w ON a.warehouse_id = w.id
        ORDER BY a.triggered DESC, a.last_triggered DESC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async updateAlert(id, updateData) {
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
        `UPDATE alerts SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  async deleteAlert(id) {
    try {
      const [result] = await pool.query('DELETE FROM alerts WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AlertModel();