import React, { useEffect, useState } from "react";
import { Typography, Select, MenuItem, FormControl, InputLabel, Button } from "@mui/material";
import DataTable from "../components/DataTable";
import { fetchWarehouses, fetchWarehouseBatches } from "../api/warehouses";

const columns = [
  { field: "product_name", headerName: "Product", width: 200 }, // ✅ Fixed field name
  { field: "batch_no", headerName: "Batch No", width: 150 },    // ✅ Fixed field name
  { field: "qty_available", headerName: "Quantity", width: 120 }, // ✅ Fixed field name
  {
    field: "actions",
    headerName: "Actions",
    width: 120,
    renderCell: () => <Button size="small">Transfer</Button>
  },
];

const WarehouseView = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ Add loading state

  useEffect(() => {
    fetchWarehouses().then(res => {
      setWarehouses(res.data);
      if (res.data.length > 0) setSelectedWarehouse(res.data[0].id);
    });
  }, []);

  // ✅ FIXED: Implement the missing API call
  useEffect(() => {
    if (!selectedWarehouse) return;
    
    setLoading(true);
    console.log(`🏢 Fetching batches for warehouse: ${selectedWarehouse}`);
    
    fetchWarehouseBatches(selectedWarehouse)
      .then(response => {
        console.log('✅ API Response:', response.data);
        
        // ✅ Map backend response to frontend format
        const batches = response.data.data || [];
        const mappedBatches = batches.map((batch, index) => ({
          id: batch.id || index, // DataTable needs an ID
          product_name: batch.product_name,
          batch_no: batch.batch_no,
          qty_available: batch.qty_available,
          product_id: batch.product_id,
          warehouse_name: batch.warehouse_name
        }));
        
        setStockList(mappedBatches);
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ Error fetching warehouse batches:', error);
        setStockList([]);
        setLoading(false);
      });
  }, [selectedWarehouse]);

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Warehouse View
      </Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="warehouse-select-label">Select Warehouse</InputLabel>
        <Select
          labelId="warehouse-select-label"
          value={selectedWarehouse}
          label="Select Warehouse"
          onChange={(e) => setSelectedWarehouse(e.target.value)}
        >
          {warehouses.map(w => (
            <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {/* ✅ Add loading indicator and data count */}
      {loading && <Typography>Loading batches...</Typography>}
      {!loading && selectedWarehouse && (
        <Typography sx={{ mb: 1 }}>
          Found {stockList.length} batches in selected warehouse
        </Typography>
      )}
      
      <DataTable rows={stockList} columns={columns} />
    </>
  );
};

export default WarehouseView;
