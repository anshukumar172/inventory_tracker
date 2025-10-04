import React, { useEffect, useState } from "react";
import { Typography, Button, Box, Modal, TextField, Autocomplete } from "@mui/material";
import DataTable from "../components/DataTable";
import { fetchBatches, createBatch } from "../api/batches";
import { fetchProducts } from "../api/products";

const style = {
  position: "absolute",
  top: '50%',
  left: '50%',
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const columns = [
  { field: "batch_no", headerName: "Batch No", width: 150 },
  { field: "product_name", headerName: "Product", width: 200 },
  { field: "manufacturing_date", headerName: "Manufactured", width: 130 },
  { field: "expiry_date", headerName: "Expiry", width: 130 },
  { field: "qty_available", headerName: "Quantity", width: 100 },
];

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    batch_no: "",
    manufacturing_date: "",
    expiry_date: "",
    qty_received: 0,
  });

  // Load all batches and products on component mount
  useEffect(() => {
    loadBatches();
    loadProducts();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const response = await fetchBatches(); // Fetch all batches
      setBatches(response.data || []);
    } catch (error) {
      console.error('Failed to load batches:', error);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetchProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(data => ({ ...data, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    if (!formData.batch_no) {
      alert('Please enter a batch number');
      return;
    }

    try {
      const batchData = {
        ...formData,
        product_id: selectedProduct.id
      };

      await createBatch(selectedProduct.id, batchData);
      
      // Reload batches and close modal
      loadBatches();
      handleClose();
      
    } catch (error) {
      console.error('Failed to create batch:', error);
      alert('Failed to create batch. Please try again.');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      batch_no: "",
      manufacturing_date: "",
      expiry_date: "",
      qty_received: 0,
    });
    setSelectedProduct(null);
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Batch Management
      </Typography>

      <Button 
        variant="contained" 
        onClick={() => setOpen(true)} 
        sx={{ mb: 2 }}
        disabled={loading}
      >
        Add New Batch
      </Button>

      <DataTable 
        rows={batches} 
        columns={columns} 
        loading={loading}
      />

      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Typography variant="h6" gutterBottom>
            Add New Batch
          </Typography>

          {/* Product Selection */}
          <Autocomplete
            options={products}
            getOptionLabel={(option) => `${option.name} (${option.sku})`}
            value={selectedProduct}
            onChange={(event, newValue) => setSelectedProduct(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Product"
                margin="normal"
                required
                fullWidth
              />
            )}
          />

          {/* Batch Number */}
          <TextField
            fullWidth
            label="Batch Number"
            name="batch_no"
            value={formData.batch_no}
            onChange={handleChange}
            margin="normal"
            required
          />

          {/* Manufacturing Date */}
          <TextField
            fullWidth
            type="date"
            label="Manufacturing Date"
            name="manufacturing_date"
            value={formData.manufacturing_date}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          {/* Expiry Date */}
          <TextField
            fullWidth
            type="date"
            label="Expiry Date"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          {/* Quantity */}
          <TextField
            fullWidth
            type="number"
            label="Quantity Received"
            name="qty_received"
            value={formData.qty_received}
            onChange={handleChange}
            margin="normal"
            inputProps={{ min: 0, step: 1 }}
          />

          {/* Action Buttons */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={handleClose} variant="outlined">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={!selectedProduct}
            >
              Save Batch
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default BatchManagement;
