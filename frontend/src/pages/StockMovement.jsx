import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { createStockMovement } from "../api/stockMovements";
import { fetchProducts } from "../api/products";
import { fetchWarehouses } from "../api/warehouses";

const movementTypes = [
  "Purchase In",
  "Sales Out",
  "Transfer In",
  "Transfer Out",
  "Adjustment"
];

const StockMovement = () => {
  const [movementType, setMovementType] = useState("");
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [fromWarehouse, setFromWarehouse] = useState(null);
  const [toWarehouse, setToWarehouse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts().then(({ data }) => setProducts(data));
    fetchWarehouses().then(({ data }) => setWarehouses(data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!movementType || !selectedProduct || !quantity) {
      alert("Please fill required fields.");
      return;
    }
    setLoading(true);
    try {
      await createStockMovement({
        movement_type: movementType,
        product_id: selectedProduct.id,
        from_warehouse_id: fromWarehouse ? fromWarehouse.id : undefined,
        to_warehouse_id: toWarehouse ? toWarehouse.id : undefined,
        batch_id: selectedBatch ? selectedBatch.id : undefined,
        qty: Number(quantity),
      });
      alert("Stock movement recorded.");
    } catch (err) {
      alert("Error occurred: " + err.message || "Unknown error");
    }
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Stock Movement
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          select
          label="Movement Type"
          value={movementType}
          onChange={(e) => setMovementType(e.target.value)}
          fullWidth
          required
          margin="normal"
        >
          {movementTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>

        <Autocomplete
          options={products}
          getOptionLabel={(option) => option.name || ""}
          onChange={(event, value) => setSelectedProduct(value)}
          renderInput={(params) => (
            <TextField {...params} label="Product" margin="normal" required />
          )}
        />

        {/* batch selection can be implemented similar to product autocomplete */}

        <TextField
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          fullWidth
          required
          margin="normal"
          inputProps={{ min: 0 }}
        />

        <Autocomplete
          options={warehouses}
          getOptionLabel={(option) => option.name || ""}
          onChange={(event, value) => setFromWarehouse(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="From Warehouse"
              margin="normal"
              required={movementType === "Sales Out" || movementType === "Transfer Out"}
            />
          )}
        />

        <Autocomplete
          options={warehouses}
          getOptionLabel={(option) => option.name || ""}
          onChange={(event, value) => setToWarehouse(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="To Warehouse"
              margin="normal"
              required={movementType === "Purchase In" || movementType === "Transfer In"}
            />
          )}
        />

        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 3 }}
          disabled={loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : "Submit"}
        </Button>
      </form>
    </Box>
  );
};

export default StockMovement;
