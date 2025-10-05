import React, { useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from "@mui/material";
import axiosClient from "../api/axiosClient";

const Reports = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleViewReport = async () => {
    if (!fromDate || !toDate) {
      alert("Please select from date and to date");
      return;
    }
    
    try {
      setLoading(true);
      const response = await axiosClient.get("/reports/gst", {
        params: { fromDate, toDate }
      });
      
      console.log('Report response:', response.data);
      setReportData(response.data.data || []);
      setSummary(response.data.summary || null);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      alert("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!fromDate || !toDate) {
      alert("Please select from date and to date");
      return;
    }
    
    try {
      const response = await axiosClient.get("/reports/gst", {
        params: { fromDate, toDate, format: 'csv' },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GST_Report_${fromDate}_to_${toDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download CSV:', error);
      alert("Failed to download CSV");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>GST Report</Typography>
      
      <Paper sx={{ p: 3, mb: 3, maxWidth: 500 }}>
        <TextField
          label="From Date"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To Date"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button 
            variant="outlined" 
            onClick={handleViewReport} 
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'View Report'}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleDownloadCSV} 
            fullWidth
          >
            Download CSV
          </Button>
        </Box>
      </Paper>

      {/* Report Table */}
      {reportData.length > 0 && (
        <Paper sx={{ p: 2, overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            GST Report ({reportData.length} invoices)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Invoice No</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>GSTIN</TableCell>
                <TableCell>State</TableCell>
                <TableCell align="right">Taxable Value</TableCell>
                <TableCell align="right">CGST</TableCell>
                <TableCell align="right">SGST</TableCell>
                <TableCell align="right">IGST</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(row.invoice_date).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>{row.invoice_number}</TableCell>
                  <TableCell>{row.customer_name}</TableCell>
                  <TableCell>{row.gstin || 'N/A'}</TableCell>
                  <TableCell>{row.state_code}</TableCell>
                  <TableCell align="right">₹{parseFloat(row.taxable_value).toFixed(2)}</TableCell>
                  <TableCell align="right">₹{parseFloat(row.cgst_amount).toFixed(2)}</TableCell>
                  <TableCell align="right">₹{parseFloat(row.sgst_amount).toFixed(2)}</TableCell>
                  <TableCell align="right">₹{parseFloat(row.igst_amount).toFixed(2)}</TableCell>
                  <TableCell align="right">₹{parseFloat(row.total_amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Summary */}
          {summary && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>Summary</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box>
                  <Typography color="text.secondary">Total Taxable Value</Typography>
                  <Typography variant="h6">₹{summary.totalTaxableValue.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography color="text.secondary">Total CGST</Typography>
                  <Typography variant="h6">₹{summary.totalCGST.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography color="text.secondary">Total SGST</Typography>
                  <Typography variant="h6">₹{summary.totalSGST.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography color="text.secondary">Total IGST</Typography>
                  <Typography variant="h6">₹{summary.totalIGST.toFixed(2)}</Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography color="text.secondary">Grand Total (Including GST)</Typography>
                <Typography variant="h5" color="primary">₹{summary.totalAmount.toFixed(2)}</Typography>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {reportData.length === 0 && !loading && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Select date range and click "View Report" to see GST data
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Reports;
