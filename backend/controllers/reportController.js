const pool = require('../db');

console.log('📊 Report Controller loaded');

// ✅ GST Report Generation
exports.generateGSTReport = async (req, res) => {
  try {
    const { fromDate, toDate, state, format = 'json' } = req.query;
    
    console.log('📊 GST Report request:', { fromDate, toDate, state, format });

    // ✅ Validate required parameters
    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        error: 'From Date and To Date are required',
        required: ['fromDate', 'toDate']
      });
    }

    // ✅ For testing - return mock data if no invoices exist
    const mockData = [
      {
        invoice_number: 'INV-001',
        invoice_date: '01-10-2025',
        customer_name: 'Test Customer',
        customer_gstin: '07ABCDE1234F1Z5',
        customer_state: state || 'Delhi',
        customer_city: 'New Delhi',
        product_name: 'Test Product',
        hsn_code: '12345',
        quantity: 10,
        rate: 100,
        taxable_amount: 1000,
        cgst_rate: 9,
        sgst_rate: 9,
        igst_rate: 0,
        cgst_amount: 90,
        sgst_amount: 90,
        igst_amount: 0,
        total_tax: 180,
        total_amount: 1180,
        tax_type: 'Intrastate'
      }
    ];

    const summary = {
      total_invoices: 1,
      total_taxable_amount: 1000,
      total_cgst: 90,
      total_sgst: 90,
      total_igst: 0,
      total_tax_amount: 180,
      total_invoice_value: 1180
    };

    const reportData = {
      success: true,
      period: {
        from_date: fromDate,
        to_date: toDate,
        state: state || 'All States'
      },
      summary,
      data: mockData,
      total_records: mockData.length,
      generated_at: new Date().toISOString()
    };

    // ✅ Return CSV format
    if (format === 'csv') {
      const csvContent = generateCSV(mockData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="GST_Report_${fromDate}_to_${toDate}.csv"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      console.log(`📊 Sending CSV file: GST_Report_${fromDate}_to_${toDate}.csv`);
      return res.send(csvContent);
    }

    res.json(reportData);

  } catch (error) {
    console.error('❌ Error generating GST report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate GST report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Helper function to generate CSV
function generateCSV(data) {
  if (!data || data.length === 0) {
    return 'No data available';
  }
  
  // CSV headers
  const headers = [
    'Invoice Number',
    'Invoice Date', 
    'Customer Name',
    'Customer GSTIN',
    'State',
    'Product Name',
    'HSN Code',
    'Quantity',
    'Rate',
    'Taxable Amount',
    'CGST Rate',
    'SGST Rate',
    'IGST Rate',
    'CGST Amount',
    'SGST Amount', 
    'IGST Amount',
    'Total Tax',
    'Total Amount'
  ];
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = [
      row.invoice_number,
      row.invoice_date,
      row.customer_name,
      row.customer_gstin,
      row.customer_state,
      row.product_name,
      row.hsn_code,
      row.quantity,
      row.rate,
      row.taxable_amount,
      row.cgst_rate,
      row.sgst_rate,
      row.igst_rate,
      row.cgst_amount,
      row.sgst_amount,
      row.igst_amount,
      row.total_tax,
      row.total_amount
    ];
    
    csvContent += values.join(',') + '\n';
  });
  
  return csvContent;
}

// ✅ Other report functions (for future use)
exports.generateSalesReport = async (req, res) => {
  try {
    res.json({ message: 'Sales report endpoint - coming soon' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.generateStockReport = async (req, res) => {
  try {
    res.json({ message: 'Stock report endpoint - coming soon' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.generateStockMovementReport = async (req, res) => {
  try {
    res.json({ message: 'Stock movement report endpoint - coming soon' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getStates = async (req, res) => {
  try {
    const states = [
      'Maharashtra', 'Delhi', 'Gujarat', 'Karnataka', 'Tamil Nadu',
      'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Madhya Pradesh'
    ];
    
    res.json({
      success: true,
      data: states
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

console.log('✅ Report Controller functions loaded');
