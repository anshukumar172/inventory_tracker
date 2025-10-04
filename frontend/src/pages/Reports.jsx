import React, { useState } from "react";
import {
  Typography,
  TextField,
  MenuItem,
  Button,
  Box,
} from "@mui/material";
import { fetchGstReport } from "../api/reports";

const states = [
  { code: "27", name: "Maharashtra" },
  { code: "07", name: "Delhi" },
  // Add more states as needed
];

const Reports = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [stateCode, setStateCode] = useState("");

  const handleDownload = async () => {
    if (!fromDate || !toDate || !stateCode) {
      alert("Please fill all fields");
      return;
    }
    try {
      const response = await fetchGstReport(fromDate, toDate, stateCode);
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GST_Report_${fromDate}_to_${toDate}_${stateCode}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert("Failed to fetch report");
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", p: 2 }}>
      <Typography variant="h5" gutterBottom>GST Report</Typography>
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
      <TextField
        select
        label="State"
        value={stateCode}
        onChange={(e) => setStateCode(e.target.value)}
        fullWidth
        margin="normal"
      >
        {states.map((state) => (
          <MenuItem key={state.code} value={state.code}>
            {state.name}
          </MenuItem>
        ))}
      </TextField>
      <Button variant="contained" onClick={handleDownload} fullWidth sx={{ mt: 2 }}>
        Download CSV
      </Button>
    </Box>
  );
};

export default Reports;
