const pool = require('../db');

class StockMovementModel {
  async createMovement(movementData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const {
        movement_type,
        reference_type,
        reference_id,
        product_id,
        warehouse_from,
        warehouse_to,
        batch_id,
        qty,
        unit_cost,
        created_by
      } = movementData;

      const total_value = unit_cost ? (qty * unit_cost) : null;

      // Insert stock movement record
      const [result] = await connection.query(`
        INSERT INTO stock_movements 
        (movement_type, reference_type, reference_id, product_id, warehouse_from, 
         warehouse_to, batch_id, qty, unit_cost, total_value, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        movement_type,
        reference_type || null,
        reference_id || null,
        product_id,
        warehouse_from || null,
        warehouse_to || null,
        batch_id,
        qty,
        unit_cost || null,
        total_value,
        created_by
      ]);

      const movementId = result.insertId;

      // Update batch quantities based on movement type
      if (movement_type === 'IN' || movement_type === 'TRANSFER_IN') {
        // Increase quantity
        await connection.query(
          'UPDATE batches SET qty_available = qty_available + ? WHERE id = ?',
          [qty, batch_id]
        );
      } else if (movement_type === 'OUT' || movement_type === 'TRANSFER_OUT') {
        // Decrease quantity
        await connection.query(
          'UPDATE batches SET qty_available = qty_available - ? WHERE id = ?',
          [qty, batch_id]
        );
      } else if (movement_type === 'ADJUST') {
        // Set specific quantity (qty can be negative for adjustments)
        await connection.query(
          'UPDATE batches SET qty_available = qty_available + ? WHERE id = ?',
          [qty, batch_id]
        );
      }

      await connection.commit();
      return movementId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getMovements(filters = {}) {
    try {
      let query = `
        SELECT sm.*, 
               p.sku, p.name as product_name,
               wf.name as warehouse_from_name,
               wt.name as warehouse_to_name,
               b.batch_no,
               u.full_name as created_by_name
        FROM stock_movements sm
        INNER JOIN products p ON sm.product_id = p.id
        LEFT JOIN warehouses wf ON sm.warehouse_from = wf.id
        LEFT JOIN warehouses wt ON sm.warehouse_to = wt.id
        INNER JOIN batches b ON sm.batch_id = b.id
        LEFT JOIN users u ON sm.created_by = u.id
      `;

      const conditions = [];
      const params = [];

      if (filters.product_id) {
        conditions.push('sm.product_id = ?');
        params.push(filters.product_id);
      }

      if (filters.warehouse_id) {
        conditions.push('(sm.warehouse_from = ? OR sm.warehouse_to = ?)');
        params.push(filters.warehouse_id, filters.warehouse_id);
      }

      if (filters.movement_type) {
        conditions.push('sm.movement_type = ?');
        params.push(filters.movement_type);
      }

      if (filters.from_date) {
        conditions.push('DATE(sm.created_at) >= ?');
        params.push(filters.from_date);
      }

      if (filters.to_date) {
        conditions.push('DATE(sm.created_at) <= ?');
        params.push(filters.to_date);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY sm.created_at DESC';

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getStockLedger(productId, warehouseId = null) {
    try {
      let query = `
        SELECT 
          sm.created_at,
          sm.movement_type,
          sm.reference_type,
          sm.reference_id,
          sm.qty,
          sm.unit_cost,
          sm.total_value,
          b.batch_no,
          w.name as warehouse_name,
          u.full_name as created_by_name
        FROM stock_movements sm
        INNER JOIN batches b ON sm.batch_id = b.id
        INNER JOIN warehouses w ON (sm.warehouse_from = w.id OR sm.warehouse_to = w.id)
        LEFT JOIN users u ON sm.created_by = u.id
        WHERE sm.product_id = ?
      `;

      const params = [productId];

      if (warehouseId) {
        query += ' AND (sm.warehouse_from = ? OR sm.warehouse_to = ?)';
        params.push(warehouseId, warehouseId);
      }

      query += ' ORDER BY sm.created_at DESC';

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getMovementById(id) {
    try {
      const [rows] = await pool.query(`
        SELECT sm.*, 
               p.sku, p.name as product_name,
               wf.name as warehouse_from_name,
               wt.name as warehouse_to_name,
               b.batch_no,
               u.full_name as created_by_name
        FROM stock_movements sm
        INNER JOIN products p ON sm.product_id = p.id
        LEFT JOIN warehouses wf ON sm.warehouse_from = wf.id
        LEFT JOIN warehouses wt ON sm.warehouse_to = wt.id
        INNER JOIN batches b ON sm.batch_id = b.id
        LEFT JOIN users u ON sm.created_by = u.id
        WHERE sm.id = ?
      `, [id]);

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  async getStockValuation(warehouseId = null) {
    try {
      let query = `
        SELECT 
          p.id,
          p.sku,
          p.name,
          p.unit,
          SUM(CASE WHEN sm.movement_type IN ('IN', 'TRANSFER_IN') OR 
                        (sm.movement_type = 'ADJUST' AND sm.qty > 0) 
                   THEN sm.qty 
                   ELSE 0 END) -
          SUM(CASE WHEN sm.movement_type IN ('OUT', 'TRANSFER_OUT') OR 
                        (sm.movement_type = 'ADJUST' AND sm.qty < 0) 
                   THEN ABS(sm.qty) 
                   ELSE 0 END) as current_stock,
          AVG(sm.unit_cost) as avg_cost,
          (SUM(CASE WHEN sm.movement_type IN ('IN', 'TRANSFER_IN') OR 
                         (sm.movement_type = 'ADJUST' AND sm.qty > 0) 
                    THEN sm.qty 
                    ELSE 0 END) -
           SUM(CASE WHEN sm.movement_type IN ('OUT', 'TRANSFER_OUT') OR 
                         (sm.movement_type = 'ADJUST' AND sm.qty < 0) 
                    THEN ABS(sm.qty) 
                    ELSE 0 END)) * AVG(sm.unit_cost) as stock_value
        FROM products p
        LEFT JOIN stock_movements sm ON p.id = sm.product_id
      `;

      const params = [];

      if (warehouseId) {
        query += ' AND (sm.warehouse_from = ? OR sm.warehouse_to = ?)';
        params.push(warehouseId, warehouseId);
      }

      query += `
        GROUP BY p.id
        HAVING current_stock > 0
        ORDER BY p.name
      `;

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new StockMovementModel();