import React, { useEffect, useState } from "react";
import { Typography, Select, MenuItem, FormControl, InputLabel, Button } from "@mui/material";
import DataTable from "../components/DataTable";
import { fetchWarehouses } from "../api/warehouses";

const columns = [
  { field: "productName", headerName: "Product", width: 200 },
  { field: "batchNo", headerName: "Batch No", width: 150 },
  { field: "quantity", headerName: "Quantity", width: 120 },
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
  const [stockList, setStockList] = useState([]); // fetch stock per warehouse from API

  useEffect(() => {
    fetchWarehouses().then(res => {
      setWarehouses(res.data);
      if (res.data.length > 0) setSelectedWarehouse(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedWarehouse) return;
    // TODO: call API to fetch stock list for selectedWarehouse
    // For example: fetchStockList(selectedWarehouse).then(setStockList);
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
      <DataTable rows={stockList} columns={columns} />
    </>
  );
};

export default WarehouseView;
