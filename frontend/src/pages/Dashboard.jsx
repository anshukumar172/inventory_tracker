import React, { useEffect, useState } from "react";
import { Grid, Typography } from "@mui/material";
import KpiCard from "../components/KpiCard";
import DataTable from "../components/DataTable";
import { getKpis, getRecentInvoices } from "../api/dashboard";

const invoiceColumns = [
  { field: "id", headerName: "Invoice #", width: 120 },
  { field: "date", headerName: "Date", width: 130 },
  { field: "customerName", headerName: "Customer", width: 200 },
  { field: "totalAmount", headerName: "Amount", width: 130 }
];

export default function Dashboard() {
  const [kpis, setKpis] = useState({});
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    getKpis().then(setKpis);
    getRecentInvoices().then(setInvoices);
  }, []);

  return (
    <Grid container spacing={2} sx={{ p: 2 }}>
      <Grid item xs={12} sm={3}>
        <KpiCard title="Total Stock Value" value={kpis.stockValue || 0} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <KpiCard title="Low Stock Items" value={kpis.lowStock || 0} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <KpiCard title="Expiring Items" value={kpis.expiringItems || 0} />
      </Grid>
      <Grid item xs={12} sm={12}>
        <Typography variant="h6">Recent Invoices</Typography>
        <DataTable rows={invoices} columns={invoiceColumns} />
      </Grid>
    </Grid>
  );
}
