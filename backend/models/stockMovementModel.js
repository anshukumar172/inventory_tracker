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
        total_value,
        created_by
      } = movementData;

      console.log('📋 Creating movement with data:', movementData);

      // ✅ Insert stock movement record
      const [result] = await connection.execute(`
        INSERT INTO stock_movements 
        (movement_type, reference_type, reference_id, product_id, warehouse_from, 
         warehouse_to, batch_id, qty, unit_cost, total_value, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        movement_type,
        reference_type,
        reference_id,
        product_id,
        warehouse_from,
        warehouse_to,
        batch_id,
        qty,
        unit_cost,
        total_value,
        created_by
      ]);

      const movementId = result.insertId;
      console.log('✅ Movement record created with ID:', movementId);

      // ✅ Update batch quantities if batch_id is provided
      if (batch_id) {
        console.log(`📦 Updating batch ${batch_id} for movement type: ${movement_type}`);
        
        // ✅ Check current batch stock first
        const [currentBatch] = await connection.execute(
          'SELECT qty_available, batch_no FROM batches WHERE id = ?',
          [batch_id]
        );

        if (currentBatch.length === 0) {
          throw new Error(`Batch with ID ${batch_id} not found`);
        }

        const currentStock = parseFloat(currentBatch[0].qty_available);
        const batchNo = currentBatch[0].batch_no;

        console.log(`📊 Current batch ${batchNo} stock: ${currentStock}`);

        // ✅ Update batch quantities based on movement type
        if (movement_type === 'IN') {
          // Increase quantity
          await connection.execute(
            'UPDATE batches SET qty_available = qty_available + ? WHERE id = ?',
            [qty, batch_id]
          );
          console.log(`✅ Increased batch ${batchNo} by ${qty} units`);

        } else if (movement_type === 'OUT') {
          // Decrease quantity - check if sufficient stock
          if (currentStock < qty) {
            throw new Error(`Insufficient stock in batch ${batchNo}. Available: ${currentStock}, Required: ${qty}`);
          }
          
          await connection.execute(
            'UPDATE batches SET qty_available = qty_available - ? WHERE id = ?',
            [qty, batch_id]
          );
          console.log(`✅ Decreased batch ${batchNo} by ${qty} units`);

        } else if (movement_type === 'TRANSFER') {
          // For transfers, typically decrease from source batch
          if (warehouse_from && currentStock < qty) {
            throw new Error(`Insufficient stock in batch ${batchNo}. Available: ${currentStock}, Required: ${qty}`);
          }
          
          await connection.execute(
            'UPDATE batches SET qty_available = qty_available - ? WHERE id = ?',
            [qty, batch_id]
          );
          console.log(`✅ Transferred ${qty} units from batch ${batchNo}`);

        } else if (movement_type === 'ADJUST') {
          // Set specific quantity (qty can be positive or negative for adjustments)
          await connection.execute(
            'UPDATE batches SET qty_available = qty_available + ? WHERE id = ?',
            [qty, batch_id]
          );
          console.log(`✅ Adjusted batch ${batchNo} by ${qty} units`);
        }

        // ✅ Log updated stock
        const [updatedBatch] = await connection.execute(
          'SELECT qty_available FROM batches WHERE id = ?',
          [batch_id]
        );
        console.log(`📊 Updated batch ${batchNo} stock: ${updatedBatch[0].qty_available}`);
      }

      await connection.commit();
      console.log('✅ Stock movement transaction completed successfully');
      return movementId;

    } catch (error) {
      await connection.rollback();
      console.error('❌ Stock movement transaction failed:', error);
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
               u.username as created_by_name,
               DATE_FORMAT(sm.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
        FROM stock_movements sm
        INNER JOIN products p ON sm.product_id = p.id
        LEFT JOIN warehouses wf ON sm.warehouse_from = wf.id
        LEFT JOIN warehouses wt ON sm.warehouse_to = wt.id
        LEFT JOIN batches b ON sm.batch_id = b.id
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

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getStockLedger(productId, warehouseId = null) {
    try {
      let query = `
        SELECT 
          sm.id,
          sm.created_at,
          sm.movement_type,
          sm.reference_type,
          sm.reference_id,
          sm.qty,
          sm.unit_cost,
          sm.total_value,
          b.batch_no,
          COALESCE(wf.name, wt.name) as warehouse_name,
          u.username as created_by_name,
          DATE_FORMAT(sm.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
        FROM stock_movements sm
        LEFT JOIN batches b ON sm.batch_id = b.id
        LEFT JOIN warehouses wf ON sm.warehouse_from = wf.id
        LEFT JOIN warehouses wt ON sm.warehouse_to = wt.id
        LEFT JOIN users u ON sm.created_by = u.id
        WHERE sm.product_id = ?
      `;

      const params = [productId];

      if (warehouseId) {
        query += ' AND (sm.warehouse_from = ? OR sm.warehouse_to = ?)';
        params.push(warehouseId, warehouseId);
      }

      query += ' ORDER BY sm.created_at DESC';

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getMovementById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT sm.*, 
               p.sku, p.name as product_name,
               wf.name as warehouse_from_name,
               wt.name as warehouse_to_name,
               b.batch_no,
               u.username as created_by_name,
               DATE_FORMAT(sm.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
        FROM stock_movements sm
        INNER JOIN products p ON sm.product_id = p.id
        LEFT JOIN warehouses wf ON sm.warehouse_from = wf.id
        LEFT JOIN warehouses wt ON sm.warehouse_to = wt.id
        LEFT JOIN batches b ON sm.batch_id = b.id
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
          SUM(CASE 
            WHEN sm.movement_type = 'IN' THEN sm.qty 
            WHEN sm.movement_type = 'OUT' THEN -sm.qty 
            WHEN sm.movement_type = 'ADJUST' THEN sm.qty 
            ELSE 0 
          END) as current_stock,
          AVG(CASE WHEN sm.unit_cost > 0 THEN sm.unit_cost ELSE NULL END) as avg_cost,
          SUM(CASE 
            WHEN sm.movement_type = 'IN' THEN sm.qty 
            WHEN sm.movement_type = 'OUT' THEN -sm.qty 
            WHEN sm.movement_type = 'ADJUST' THEN sm.qty 
            ELSE 0 
          END) * AVG(CASE WHEN sm.unit_cost > 0 THEN sm.unit_cost ELSE NULL END) as stock_value
        FROM products p
        LEFT JOIN stock_movements sm ON p.id = sm.product_id
      `;

      const params = [];

      if (warehouseId) {
        query += ' AND (sm.warehouse_from = ? OR sm.warehouse_to = ?)';
        params.push(warehouseId, warehouseId);
      }

      query += `
        GROUP BY p.id, p.sku, p.name
        HAVING current_stock > 0
        ORDER BY p.name
      `;

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new StockMovementModel();
