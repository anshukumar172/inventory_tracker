const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const salesInvoiceModel = require('../models/salesInvoiceModel');

// GET /api/v1/reports/gst - Overall GST Report (no state filter)
router.get('/gst', authenticateToken, async (req, res) => {
  try {
    const { fromDate, toDate, format } = req.query;
    
    console.log('📊 GST Report request:', { fromDate, toDate, format });
    
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'From date and To date are required' });
    }

    // Fetch ALL invoices (no state filter)
    const reportData = await salesInvoiceModel.getGstReport(fromDate, toDate, null);

    // If CSV format requested, generate CSV
    if (format === 'csv') {
      const csvRows = [
        ['Invoice Date', 'Invoice Number', 'Customer Name', 'GSTIN', 'State Code', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Amount']
      ];

      reportData.forEach(row => {
        csvRows.push([
          row.invoice_date,
          row.invoice_number,
          row.customer_name,
          row.gstin || 'N/A',
          row.state_code,
          row.taxable_value,
          row.cgst_amount,
          row.sgst_amount,
          row.igst_amount,
          row.total_amount
        ]);
      });

      const csvContent = csvRows.map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="GST_Report_${fromDate}_to_${toDate}.csv"`);
      return res.send(csvContent);
    }

    // Calculate summary
    const summary = {
      totalTaxableValue: reportData.reduce((sum, r) => sum + parseFloat(r.taxable_value || 0), 0),
      totalCGST: reportData.reduce((sum, r) => sum + parseFloat(r.cgst_amount || 0), 0),
      totalSGST: reportData.reduce((sum, r) => sum + parseFloat(r.sgst_amount || 0), 0),
      totalIGST: reportData.reduce((sum, r) => sum + parseFloat(r.igst_amount || 0), 0),
      totalAmount: reportData.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0)
    };

    // Return JSON data
    res.json({
      success: true,
      data: reportData,
      summary
    });

  } catch (error) {
    console.error('❌ Error generating GST report:', error);
    res.status(500).json({ error: 'Failed to generate GST report' });
  }
});

module.exports = router;
