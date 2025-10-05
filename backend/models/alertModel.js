const pool = require('../db');

class AlertModel {
  async checkLowStockAlerts() {
    const LOW_STOCK_THRESHOLD = 50;
    
    const [results] = await pool.query(`
      SELECT 
        b.id as batch_id,
        b.product_id,
        b.warehouse_id,
        b.batch_no,
        b.qty_available,
        b.expiry_date,
        p.name as product_name,
        p.sku,
        w.name as warehouse_name,
        'low_stock' as alert_type,
        DATEDIFF(b.expiry_date, CURDATE()) as days_to_expire,
        CONCAT(p.name, ' (', p.sku, ') in ', w.name, ' - Low stock: ', b.qty_available, ' units available') as alert_message
      FROM batches b
      INNER JOIN products p ON b.product_id = p.id
      INNER JOIN warehouses w ON b.warehouse_id = w.id
      WHERE b.qty_available < ? AND b.qty_available > 0
      ORDER BY b.qty_available ASC
    `, [LOW_STOCK_THRESHOLD]);
    
    return results.map(alert => ({
      ...alert,
      threshold: LOW_STOCK_THRESHOLD,
      triggered_at: new Date()
    }));
  }

  async checkExpiryAlerts() {
    const EXPIRY_THRESHOLD_DAYS = 7;
    const LOW_STOCK_THRESHOLD = 50;
    
    const [results] = await pool.query(`
      SELECT 
        b.id as batch_id,
        b.product_id,
        b.warehouse_id,
        b.batch_no,
        b.expiry_date,
        b.qty_available,
        p.name as product_name,
        p.sku,
        w.name as warehouse_name,
        DATEDIFF(b.expiry_date, CURDATE()) as days_to_expire,
        'expiry' as alert_type,
        CONCAT('Batch ', b.batch_no, ' of ', p.name, ' (', p.sku, ') in ', w.name, 
               ' expires in ', DATEDIFF(b.expiry_date, CURDATE()), ' days - ', b.qty_available, ' units') as alert_message
      FROM batches b
      INNER JOIN products p ON b.product_id = p.id
      INNER JOIN warehouses w ON b.warehouse_id = w.id
      WHERE b.expiry_date IS NOT NULL
        AND b.qty_available >= ?
        AND DATEDIFF(b.expiry_date, CURDATE()) <= ?
        AND DATEDIFF(b.expiry_date, CURDATE()) >= 0
      ORDER BY b.expiry_date ASC
    `, [LOW_STOCK_THRESHOLD, EXPIRY_THRESHOLD_DAYS]);
    
    return results.map(alert => ({
      ...alert,
      threshold: EXPIRY_THRESHOLD_DAYS,
      triggered_at: new Date()
    }));
  }

  async getActiveAlerts() {
    const lowStockAlerts = await this.checkLowStockAlerts();
    const expiryAlerts = await this.checkExpiryAlerts();
    return [...lowStockAlerts, ...expiryAlerts];
  }

  async getAlertSummary() {
    const lowStockAlerts = await this.checkLowStockAlerts();
    const expiryAlerts = await this.checkExpiryAlerts();
    
    return {
      total: lowStockAlerts.length + expiryAlerts.length,
      low_stock_count: lowStockAlerts.length,
      expiry_count: expiryAlerts.length,
      low_stock_alerts: lowStockAlerts,
      expiry_alerts: expiryAlerts
    };
  }
}

module.exports = new AlertModel();
