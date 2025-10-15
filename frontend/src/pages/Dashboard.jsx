import React, { useEffect, useState } from "react";
import { Grid, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import KpiCard from "../components/KpiCard";
import DataTable from "../components/DataTable";
import { getKpis, getRecentInvoices } from "../api/dashboard";

// ✅ UPDATED: Added Products column
const invoiceColumns = [
  { field: "id", headerName: "Invoice #", width: 100 },
  { field: "date", headerName: "Date", width: 120 },
  { field: "customerName", headerName: "Customer", width: 150 },
  { 
    field: "products", 
    headerName: "Products", 
    minWidth: 250, 
    flex: 1,
    renderCell: (params) => (
      <div style={{ 
        whiteSpace: 'normal', 
        wordWrap: 'break-word',
        lineHeight: '1.5',
        padding: '8px 0'
      }}>
        {params.value || 'No items'}
      </div>
    )
  },
  { 
    field: "quantities", 
    headerName: "Quantity", 
    width: 120,
    renderCell: (params) => (
      <div style={{ 
        whiteSpace: 'normal', 
        wordWrap: 'break-word',
        lineHeight: '1.5',
        padding: '8px 0'
      }}>
        {params.value || '-'}
      </div>
    )
  },
  { 
    field: "totalAmount", 
    headerName: "Amount", 
    width: 130,
    valueFormatter: (params) => `₹${parseFloat(params.value || 0).toFixed(2)}`
  }
];


export default function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpisData, invoicesData] = await Promise.all([
        getKpis(),
        getRecentInvoices()
      ]);
      
      console.log('📊 KPIs loaded:', kpisData);
      console.log('📋 Invoices loaded:', invoicesData);
      
      setKpis(kpisData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const handleLowStockClick = () => {
    navigate('/low-stock');
  };

  const handleExpiringClick = () => {
    navigate('/expiring-items');
  };

  return (
    <Grid container spacing={2} sx={{ p: 2 }}>
      <Grid item xs={12} sm={3}>
        <KpiCard title="Total Stock Value" value={kpis.stockValue || 0} />
      </Grid>
      <Grid item xs={12} sm={3} onClick={handleLowStockClick}>
        <KpiCard 
          title="Low Stock Items" 
          value={kpis.lowStock || 0} 
          clickable={true}
        />
      </Grid>
      <Grid item xs={12} sm={3} onClick={handleExpiringClick}>
        <KpiCard 
          title="Expiring Items" 
          value={kpis.expiringItems || 0}
          clickable={true}
        />
      </Grid>
      <Grid item xs={12} sm={12}>
        <Typography variant="h6" sx={{ mb: 2 }}>Recent Invoices</Typography>
        <DataTable 
          rows={invoices} 
          columns={invoiceColumns}
          loading={loading}
        />
      </Grid>
    </Grid>
  );
}
