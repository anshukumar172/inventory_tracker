const pool = require('../db');  // ✅ Correct path for your setup

const getDashboardKpis = async (req, res) => {
  try {
    console.log('📊 Calculating dashboard KPIs...');

    // Calculate total stock value - FIXED to match your enum values
    const stockValueQuery = `
      SELECT COALESCE(SUM(
        CASE 
          WHEN sm.movement_type = 'IN' THEN sm.qty * COALESCE(sm.unit_cost, 0)
          WHEN sm.movement_type = 'OUT' THEN -(sm.qty * COALESCE(sm.unit_cost, 0))
          WHEN sm.movement_type = 'TRANSFER' THEN sm.qty * COALESCE(sm.unit_cost, 0)
          WHEN sm.movement_type = 'ADJUST' THEN sm.qty * COALESCE(sm.unit_cost, 0)
          ELSE 0 
        END
      ), 0) as total_stock_value
      FROM stock_movements sm
      WHERE sm.unit_cost IS NOT NULL AND sm.unit_cost > 0
    `;

    // Low stock count using batches table directly
    const lowStockQuery = `
      SELECT COUNT(*) as low_stock_count
      FROM (
        SELECT 
          p.id,
          p.name,
          COALESCE(SUM(b.qty_available), 0) as current_stock
        FROM products p
        LEFT JOIN batches b ON p.id = b.product_id
        GROUP BY p.id, p.name
        HAVING current_stock < 10
      ) as low_stock_products
    `;

    // Count expiring items
    const expiringQuery = `
      SELECT COUNT(*) as expiring_count
      FROM batches
      WHERE expiry_date IS NOT NULL 
        AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND expiry_date > CURDATE()
        AND qty_available > 0
    `;

    // Execute queries with proper error handling
    let stockValue = 0;
    let lowStock = 0;
    let expiringItems = 0;

    try {
      const [stockResult] = await pool.execute(stockValueQuery);
      stockValue = parseFloat(stockResult[0]?.total_stock_value || 0);
      console.log('✅ Stock value calculated:', stockValue);
    } catch (err) {
      console.log('⚠️ Stock value query failed:', err.message);
    }

    try {
      const [lowStockResult] = await pool.execute(lowStockQuery);
      lowStock = parseInt(lowStockResult[0]?.low_stock_count || 0);
      console.log('✅ Low stock calculated:', lowStock);
    } catch (err) {
      console.log('⚠️ Low stock query failed:', err.message);
    }

    try {
      const [expiringResult] = await pool.execute(expiringQuery);
      expiringItems = parseInt(expiringResult[0]?.expiring_count || 0);
      console.log('✅ Expiring items calculated:', expiringItems);
    } catch (err) {
      console.log('⚠️ Expiring items query failed:', err.message);
    }

    const kpis = {
      stockValue: Math.round(stockValue * 100) / 100, // Round to 2 decimals
      lowStock: lowStock,
      expiringItems: expiringItems
    };

    console.log('✅ Final KPIs calculated:', kpis);
    res.json(kpis);

  } catch (error) {
    console.error('❌ Error calculating KPIs:', error);
    
    // Return default values if everything fails
    const fallbackKpis = {
      stockValue: 0,
      lowStock: 0,
      expiringItems: 0
    };
    
    res.json(fallbackKpis);
  }
};

const getRecentInvoices = async (req, res) => {
  try {
    console.log('📋 Fetching recent invoices...');

    const recentInvoicesQuery = `
      SELECT 
        si.id,
        DATE_FORMAT(si.invoice_date, '%Y-%m-%d') as date,
        COALESCE(c.name, 'Unknown Customer') as customerName,
        COALESCE(si.total_amount, 0) as totalAmount
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      ORDER BY si.created_at DESC
      LIMIT 10
    `;

    const [invoices] = await pool.execute(recentInvoicesQuery);
    
    console.log('✅ Recent invoices fetched:', invoices.length);
    res.json(invoices);

  } catch (error) {
    console.error('❌ Error fetching recent invoices:', error);
    
    // Return empty array if database query fails
    res.json([]);
  }
};

module.exports = {
  getDashboardKpis,
  getRecentInvoices
};
