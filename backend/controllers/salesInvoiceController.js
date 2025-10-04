const pool = require('../db');
const salesInvoiceModel = require('../models/salesInvoiceModel');

console.log('📋 Sales Invoice controller loaded');

// GET /api/v1/sales/invoices?recent=true
exports.getInvoices = async (req, res) => {
  try {
    const { recent } = req.query;
    
    let query = `
      SELECT 
        si.id,
        si.invoice_number,
        si.invoice_date,
        si.total_amount,
        si.created_at,
        c.name as customer_name
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
    `;
    
    if (recent === 'true') {
      query += ` WHERE si.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
    }
    
    query += ` ORDER BY si.created_at DESC`;
    
    if (recent === 'true') {
      query += ` LIMIT 10`;
    }

    const [invoices] = await pool.execute(query);
    
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/v1/sales/invoices
exports.createInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;
    if (!invoiceData.items || invoiceData.items.length === 0) {
      return res.status(400).json({ error: 'Invoice must have at least one item' });
    }
    
    const invoiceId = await salesInvoiceModel.createInvoice(invoiceData);
    res.status(201).json({ message: 'Invoice created', invoiceId });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/v1/sales/invoices/:id
exports.getInvoiceById = async (req, res) => {
  try {
    const id = req.params.id;
    const invoice = await salesInvoiceModel.getInvoiceById(id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
