import React, { useEffect, useState } from "react";
import { 
  Typography, 
  Button, 
  Box, 
  Modal, 
  TextField, 
  Autocomplete,
  Chip,
  IconButton,
  Alert
} from "@mui/material";
import DataTable from "../components/DataTable";
import { fetchBatches, createBatch, deleteBatch } from "../api/batches";
import { fetchProducts } from "../api/products";
import { fetchWarehouses } from "../api/warehouses";
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const style = {
  position: "absolute",
  top: '50%',
  left: '50%',
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto'
};

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    batch_no: "",
    manufacturing_date: "",
    expiry_date: "",
    qty_received: 0,
  });

  // Define columns with actions and formatted dates
  const columns = [
    { field: "batch_no", headerName: "Batch No", width: 150 },
    { field: "product_name", headerName: "Product", width: 200 },
    { field: "warehouse_name", headerName: "Warehouse", width: 180 },
    { 
      field: "manufacturing_date", 
      headerName: "Manufactured", 
      width: 130,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString('en-IN') : 'N/A';
      }
    },
    { 
      field: "expiry_date", 
      headerName: "Expiry", 
      width: 130,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString('en-IN') : 'N/A';
      }
    },
    {
      field: "qty_available",
      headerName: "Quantity",
      width: 120,
      renderCell: (params) => {
        const qty = params.value;
        const color = qty === 0 ? 'error' : qty < 10 ? 'warning' : 'success';
        return (
          <Chip 
            label={qty} 
            color={color} 
            size="small" 
          />
        );
      }
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => handleDelete(params.row.id)}
            title="Delete Batch"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  // Load all batches, products, and warehouses on component mount
  useEffect(() => {
    loadBatches();
    loadProducts();
    loadWarehouses();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const response = await fetchBatches();
      console.log('Batches loaded:', response.data);
      setBatches(response.data || []);
    } catch (error) {
      console.error('Failed to load batches:', error);
      setError('Failed to load batches');
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

  const loadWarehouses = async () => {
    try {
      const response = await fetchWarehouses();
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
      setWarehouses([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(data => ({ ...data, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (!selectedWarehouse) {
      setError('Please select a warehouse');
      return;
    }

    if (!formData.batch_no) {
      setError('Please enter a batch number');
      return;
    }

    if (formData.qty_received <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    try {
      const batchData = {
        ...formData,
        product_id: selectedProduct.id,
        warehouse_id: selectedWarehouse.id
      };

      await createBatch(selectedProduct.id, batchData);
      
      // Reload batches and close modal
      await loadBatches();
      handleClose();
      setError('');
      
    } catch (error) {
      console.error('Failed to create batch:', error);
      setError(error.response?.data?.error || 'Failed to create batch. Please try again.');
    }
  };

  const handleDelete = async (batchId) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        await deleteBatch(batchId);
        await loadBatches();
        setError('');
      } catch (error) {
        console.error('Failed to delete batch:', error);
        setError(error.response?.data?.error || 'Failed to delete batch');
      }
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
    setSelectedWarehouse(null);
    setError('');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Batch Management
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setOpen(true)} 
          disabled={loading}
          startIcon={<AddCircleOutlineIcon />}
        >
          Add New Batch
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

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

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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

          {/* Warehouse Selection */}
          <Autocomplete
            options={warehouses}
            getOptionLabel={(option) => option.name}
            value={selectedWarehouse}
            onChange={(event, newValue) => setSelectedWarehouse(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Warehouse"
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
            required
          />

          {/* Action Buttons */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={handleClose} variant="outlined">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={!selectedProduct || !selectedWarehouse}
            >
              Save Batch
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default BatchManagement;
