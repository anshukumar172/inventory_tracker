import React, { useEffect, useState } from "react";
import { 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  Grid,
  Box,
  Alert
} from "@mui/material";
import DataTable from "../components/DataTable";
import { 
  fetchProducts, 
  fetchProductById, 
  updateProduct, 
  createProduct, 
  deleteProduct 
} from "../api/products";

const ProductMaster = () => {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    hsn_code: '',
    unit: 'nos',
    default_tax_rate: 18.00,
    cost_price: 0,
    selling_price: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Define columns with working Edit button
  const columns = [
    { field: 'sku', headerName: 'SKU', width: 120 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'hsn_code', headerName: 'HSN', width: 100 },
    { field: 'default_tax_rate', headerName: 'Tax Rate', width: 100 },
    { field: 'cost_price', headerName: 'Cost Price', width: 120 },
    { field: 'selling_price', headerName: 'Selling Price', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            size="small" 
            variant="outlined"
            onClick={() => handleEdit(params.row)}
          >
            Edit
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </Box>
      )
    }
  ];

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetchProducts();
      console.log('Products loaded:', response.data);
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (product) => {
    console.log('Editing product:', product);
    setEditingProduct(product);
    setFormData({
      sku: product.sku || '',
      name: product.name || '',
      description: product.description || '',
      hsn_code: product.hsn_code || '',
      unit: product.unit || 'nos',
      default_tax_rate: product.default_tax_rate || 18.00,
      cost_price: product.cost_price || 0,
      selling_price: product.selling_price || 0
    });
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      hsn_code: '',
      unit: 'nos',
      default_tax_rate: 18.00,
      cost_price: 0,
      selling_price: 0
    });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.sku.trim() || !formData.name.trim()) {
        setError('SKU and Product Name are required');
        return;
      }

      console.log('Saving product:', formData);

      if (editingProduct) {
        // Update existing product
        console.log('Updating product ID:', editingProduct.id);
        const response = await updateProduct(editingProduct.id, formData);
        console.log('Update response:', response);
      } else {
        // Create new product
        const response = await createProduct(formData);
        console.log('Create response:', response);
      }

      // Reload products list
      await loadProducts();
      handleClose();
      
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.response?.data?.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        await loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('Failed to delete product');
      }
    }
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      hsn_code: '',
      unit: 'nos',
      default_tax_rate: 18.00,
      cost_price: 0,
      selling_price: 0
    });
    setOpen(true);
    setError('');
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Product Master
        </Typography>
        <Button variant="contained" onClick={handleAddNew}>
          Add New Product
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable 
        rows={products} 
        columns={columns} 
        loading={loading}
      />

      {/* Edit/Add Product Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                required
                disabled={editingProduct} // Don't allow SKU editing for existing products
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="HSN Code"
                name="hsn_code"
                value={formData.hsn_code}
                onChange={handleInputChange}
                placeholder="e.g., 6109"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                placeholder="e.g., nos, kg, ltr"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tax Rate (%)"
                name="default_tax_rate"
                type="number"
                value={formData.default_tax_rate}
                onChange={handleInputChange}
                inputProps={{ step: "0.01", min: "0", max: "100" }}
              />
            </Grid>
            {/* ✅ NEW: Cost Price and Selling Price Fields */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cost Price"
                name="cost_price"
                type="number"
                value={formData.cost_price}
                onChange={handleInputChange}
                inputProps={{ step: "0.01", min: "0" }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Selling Price"
                name="selling_price"
                type="number"
                value={formData.selling_price}
                onChange={handleInputChange}
                inputProps={{ step: "0.01", min: "0" }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductMaster;
