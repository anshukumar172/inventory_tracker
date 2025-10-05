const pool = require('../db');

class SalesInvoiceModel {
  async createInvoice(invoiceData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { customer_id, billing_address, shipping_address, invoice_date, items } = invoiceData;

      // Get customer details for state calculation
      const [customerRows] = await connection.query(
        'SELECT * FROM customers WHERE id = ?', 
        [customer_id]
      );

      if (customerRows.length === 0) {
        throw new Error('Customer not found');
      }

      const customer = customerRows[0];

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(connection);

      // Calculate totals and taxes
      let taxableValue = 0;
      let totalAmount = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      // Check if intra-state or inter-state transaction
      const companyStateCode = '27'; // Assuming Maharashtra - should come from config
      const isIntraState = customer.state_code === companyStateCode;

      // Process each item
      const processedItems = [];
      for (const item of items) {
        const { product_id, batch_id, qty, unit_price } = item;

        // Verify product and get tax rate
        const [productRows] = await connection.query(
          'SELECT * FROM products WHERE id = ?', 
          [product_id]
        );

        if (productRows.length === 0) {
          throw new Error(`Product with id ${product_id} not found`);
        }

        const product = productRows[0];
        const itemTaxableValue = qty * unit_price;
        const taxRate = product.default_tax_rate;

        let itemCgst = 0, itemSgst = 0, itemIgst = 0;

        if (isIntraState) {
          itemCgst = (itemTaxableValue * taxRate) / 200; // CGST = tax_rate/2
          itemSgst = (itemTaxableValue * taxRate) / 200; // SGST = tax_rate/2
        } else {
          itemIgst = (itemTaxableValue * taxRate) / 100; // IGST = full tax_rate
        }

        processedItems.push({
          ...item,
          taxable_value: itemTaxableValue,
          tax_rate: taxRate,
          cgst_amount: itemCgst,
          sgst_amount: itemSgst,
          igst_amount: itemIgst
        });

        taxableValue += itemTaxableValue;
        cgstAmount += itemCgst;
        sgstAmount += itemSgst;
        igstAmount += itemIgst;
      }

      totalAmount = taxableValue + cgstAmount + sgstAmount + igstAmount;

      // Insert main invoice
      const [invoiceResult] = await connection.query(`
        INSERT INTO sales_invoices 
        (invoice_number, customer_id, billing_address, shipping_address, invoice_date, 
         total_amount, taxable_value, cgst_amount, sgst_amount, igst_amount, state_code, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invoiceNumber,
        customer_id,
        billing_address || customer.address,
        shipping_address || customer.address,
        invoice_date || new Date(),
        totalAmount,
        taxableValue,
        cgstAmount,
        sgstAmount,
        igstAmount,
        customer.state_code,
        1 // Should come from authenticated user
      ]);

      const invoiceId = invoiceResult.insertId;

      // Insert invoice items and update stock
      for (const item of processedItems) {
        // Insert invoice item
        await connection.query(`
          INSERT INTO sales_invoice_items 
          (sales_invoice_id, product_id, batch_id, qty, unit_price, taxable_value, 
           tax_rate, cgst_amount, sgst_amount, igst_amount) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          invoiceId,
          item.product_id,
          item.batch_id,
          item.qty,
          item.unit_price,
          item.taxable_value,
          item.tax_rate,
          item.cgst_amount,
          item.sgst_amount,
          item.igst_amount
        ]);

        // Update batch quantity
        const [batchRows] = await connection.query(
  'SELECT qty_available FROM batches WHERE id = ?', [item.batch_id]
);
if (batchRows.length === 0) {
  throw new Error(`Batch with ID ${item.batch_id} not found`);
}
if (batchRows[0].qty_available < item.qty) {
  throw new Error(`Insufficient stock in batch ${item.batch_id}: only ${batchRows[0].qty_available} units available`);
}

        await connection.query(
          'UPDATE batches SET qty_available = qty_available - ? WHERE id = ?',
          [item.qty, item.batch_id]
        );

        // Create stock movement record
        await connection.query(`
          INSERT INTO stock_movements 
          (movement_type, reference_type, reference_id, product_id, warehouse_from, 
           batch_id, qty, unit_cost, total_value, created_by) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          'OUT',
          'invoice',
          invoiceId,
          item.product_id,
          null, // Will be determined from batch
          item.batch_id,
          item.qty,
          item.unit_price,
          item.taxable_value,
          1 // Should come from authenticated user
        ]);
      }

      await connection.commit();
      return invoiceId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async generateInvoiceNumber(connection) {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}`;

    // Get the last invoice number for this year
    const [rows] = await connection.query(
      'SELECT invoice_number FROM sales_invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1',
      [`${prefix}%`]
    );

    let sequence = 1;
    if (rows.length > 0) {
      const lastNumber = rows[0].invoice_number;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${sequence.toString().padStart(4, '0')}`;
  }

  async getInvoiceById(id) {
    try {
      // Get invoice details
      const [invoiceRows] = await pool.query(`
        SELECT si.*, c.name as customer_name, c.gstin as customer_gstin
        FROM sales_invoices si
        INNER JOIN customers c ON si.customer_id = c.id
        WHERE si.id = ?
      `, [id]);

      if (invoiceRows.length === 0) {
        return null;
      }

      const invoice = invoiceRows[0];

      // Get invoice items
      const [itemRows] = await pool.query(`
        SELECT sii.*, p.sku, p.name as product_name, p.hsn_code, p.unit,
               b.batch_no
        FROM sales_invoice_items sii
        INNER JOIN products p ON sii.product_id = p.id
        INNER JOIN batches b ON sii.batch_id = b.id
        WHERE sii.sales_invoice_id = ?
      `, [id]);

      invoice.items = itemRows;
      return invoice;

    } catch (error) {
      throw error;
    }
  }

  async getAllInvoices(filters = {}) {
    try {
      let query = `
        SELECT si.*, c.name as customer_name
        FROM sales_invoices si
        INNER JOIN customers c ON si.customer_id = c.id
      `;

      const conditions = [];
      const params = [];

      if (filters.customer_id) {
        conditions.push('si.customer_id = ?');
        params.push(filters.customer_id);
      }

      if (filters.from_date) {
        conditions.push('si.invoice_date >= ?');
        params.push(filters.from_date);
      }

      if (filters.to_date) {
        conditions.push('si.invoice_date <= ?');
        params.push(filters.to_date);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY si.invoice_date DESC, si.id DESC';

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getGstReport(fromDate, toDate, stateCode = null) {
    try {
      let query = `
        SELECT 
          si.invoice_date,
          si.invoice_number,
          c.name as customer_name,
          c.gstin,
          si.taxable_value,
          si.cgst_amount,
          si.sgst_amount,
          si.igst_amount,
          si.total_amount,
          si.state_code
        FROM sales_invoices si
        INNER JOIN customers c ON si.customer_id = c.id
        WHERE si.invoice_date BETWEEN ? AND ?
      `;

      const params = [fromDate, toDate];

      if (stateCode) {
        query += ' AND si.state_code = ?';
        params.push(stateCode);
      }

      query += ' ORDER BY si.invoice_date, si.invoice_number';

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SalesInvoiceModel();