import React, { useState, useEffect } from "react";
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
  fetchCustomers, 
  fetchCustomerById, 
  updateCustomer, 
  createCustomer, 
  deleteCustomer 
} from "../api/customers";

const CustomerMaster = () => {
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    state_code: '',
    pincode: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Define columns with working Edit button
  const columns = [
    { field: "name", headerName: "Name", width: 200 },
    { field: "gstin", headerName: "GSTIN", width: 180 },
    { field: "city", headerName: "City", width: 120 },
    { field: "state", headerName: "State", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
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

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetchCustomers();
      console.log('Customers loaded:', response.data);
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (customer) => {
    console.log('Editing customer:', customer);
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      gstin: customer.gstin || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      state_code: customer.state_code || '',
      pincode: customer.pincode || '',
      phone: customer.phone || ''
    });
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      gstin: '',
      address: '',
      city: '',
      state: '',
      state_code: '',
      pincode: '',
      phone: ''
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

      if (!formData.name.trim()) {
        setError('Customer name is required');
        return;
      }

      console.log('Saving customer:', formData);

      if (editingCustomer) {
        // Update existing customer
        console.log('Updating customer ID:', editingCustomer.id);
        const response = await updateCustomer(editingCustomer.id, formData);
        console.log('Update response:', response);
      } else {
        // Create new customer
        const response = await createCustomer(formData);
        console.log('Create response:', response);
      }

      // Reload customers list
      await loadCustomers();
      handleClose();
      
    } catch (error) {
      console.error('Error saving customer:', error);
      setError(error.response?.data?.error || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(customerId);
        await loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        setError('Failed to delete customer');
      }
    }
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      gstin: '',
      address: '',
      city: '',
      state: '',
      state_code: '',
      pincode: '',
      phone: ''
    });
    setOpen(true);
    setError('');
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Customer Master
        </Typography>
        <Button variant="contained" onClick={handleAddNew}>
          Add New Customer
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable 
        rows={customers} 
        columns={columns} 
        loading={loading}
      />

      {/* Edit/Add Customer Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GSTIN"
                name="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State Code"
                name="state_code"
                value={formData.state_code}
                onChange={handleInputChange}
                placeholder="e.g., 27"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
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

export default CustomerMaster;
