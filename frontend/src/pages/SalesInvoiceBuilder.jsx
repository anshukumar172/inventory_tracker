import React, { useState, useEffect } from "react";
import {
  Typography,
  TextField,
  Button,
  Box,
  Autocomplete,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  IconButton,
  Paper,
  Divider
} from "@mui/material";
import { fetchCustomers } from "../api/customers";
import { fetchProducts } from "../api/products";
import { fetchBatches } from "../api/batches";
import { createInvoice } from "../api/salesInvoices";
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const SalesInvoiceBuilder = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [items, setItems] = useState([{ product: null, batch: null, qty: '', unit_price: 0 }]);
  const [batchesList, setBatchesList] = useState({});
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  useEffect(() => {
    fetchCustomers().then(res => setCustomers(res.data || []));
    fetchProducts().then(res => setProducts(res.data || []));
  }, []);

  // ✅ UPDATED: Fetch batches when product is selected - Filter by product_id AND qty > 0
  useEffect(() => {
    const loadBatchesForItems = async () => {
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        
        if (item.product && item.product.id) {
          try {
            console.log(`\n🔍 Loading batches for: ${item.product.name} (ID: ${item.product.id})`);
            
            const response = await fetchBatches(item.product.id);
            const allBatches = response.data || [];
            
            console.log(`   📦 Total batches from API: ${allBatches.length}`);
            
            // ✅ FILTER: Only batches for THIS product with qty > 0
            const availableBatches = allBatches.filter(batch => {
              const isCorrectProduct = batch.product_id === item.product.id;
              const hasStock = batch.qty_available > 0;
              
              return isCorrectProduct && hasStock;
            });
            
            console.log(`   ✅ Available batches with stock: ${availableBatches.length}`);
            availableBatches.forEach(b => {
              console.log(`      • ${b.batch_no}: ${b.qty_available} units (Warehouse: ${b.warehouse_name || 'N/A'})`);
            });
            
            setBatchesList(prev => ({ ...prev, [idx]: availableBatches }));
            
          } catch (error) {
            console.error(`   ❌ Failed to load batches for product ${item.product.id}:`, error);
            setBatchesList(prev => ({ ...prev, [idx]: [] }));
          }
        } else {
          // Clear batches if no product selected
          setBatchesList(prev => {
            const updated = { ...prev };
            delete updated[idx];
            return updated;
          });
        }
      }
    };
    
    loadBatchesForItems();
    // eslint-disable-next-line
  }, [JSON.stringify(items.map(i => i.product?.id))]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto-populate unit price when product is selected
    if (field === "product" && value) {
      newItems[index].batch = null;
      newItems[index].unit_price = value.selling_price || value.cost_price || 0;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product: null, batch: null, qty: '', unit_price: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      
      // Remove batches for deleted row
      setBatchesList(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }
  };

  // Calculate GST breakdown
  const calculateTotals = () => {
    const companyStateCode = '27'; // Maharashtra - should come from config
    const isIntraState = selectedCustomer?.state_code === companyStateCode;
    
    let taxableValue = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    items.forEach(item => {
      if (item.product) {
        const itemTaxableValue = item.qty * item.unit_price;
        const taxRate = item.product.default_tax_rate || 18;
        
        taxableValue += itemTaxableValue;
        
        if (isIntraState) {
          cgstAmount += (itemTaxableValue * taxRate) / 200; // CGST = tax_rate/2
          sgstAmount += (itemTaxableValue * taxRate) / 200; // SGST = tax_rate/2
        } else {
          igstAmount += (itemTaxableValue * taxRate) / 100; // IGST = full tax_rate
        }
      }
    });

    const totalAmount = taxableValue + cgstAmount + sgstAmount + igstAmount;

    return {
      taxableValue,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      isIntraState
    };
  };

  const totals = calculateTotals();

  const handleSubmit = () => {
    if (!selectedCustomer) {
      alert("Please select a customer");
      return;
    }
    
    // Validate all items have product and batch selected
    const hasInvalidItems = items.some(i => !i.product || !i.batch || i.qty <= 0);
    if (hasInvalidItems) {
      alert("Please ensure all items have product, batch, and valid quantity");
      return;
    }
    
    // Check if quantity exceeds available stock
    const exceedsStock = items.some(i => i.batch && i.qty > i.batch.qty_available);
    if (exceedsStock) {
      alert("Some items exceed available stock quantity!");
      return;
    }
    
    const invoiceData = {
      customer_id: selectedCustomer.id,
      billing_address: billingAddress,
      shipping_address: shippingAddress,
      items: items.map(i => ({
        product_id: i.product.id,
        batch_id: i.batch.id,
        qty: i.qty,
        unit_price: i.unit_price
      }))
    };
    
    createInvoice(invoiceData)
      .then(() => {
        alert("Invoice created successfully!");
        // Reset form
        setSelectedCustomer(null);
        setBillingAddress("");
        setShippingAddress("");
        setItems([{ product: null, batch: null, qty: '', unit_price: 0 }]);
        setBatchesList({});
      })
      .catch((error) => {
        console.error('Invoice creation error:', error);
        alert(error.response?.data?.error || "Failed to create invoice");
      });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sales Invoice Builder
      </Typography>
      
      {/* Customer Details Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Customer Details</Typography>
        
        <Autocomplete
          options={customers}
          getOptionLabel={c => `${c.name}${c.email ? ` (${c.email})` : ''}`}
          onChange={(e, v) => {
            setSelectedCustomer(v);
            if (v) {
              setBillingAddress(v.billing_address || "");
              setShippingAddress(v.shipping_address || "");
            } else {
              setBillingAddress("");
              setShippingAddress("");
            }
          }}
          value={selectedCustomer}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Select Customer *" 
              margin="normal" 
              required 
              helperText={!selectedCustomer ? "Please select a customer to create invoice" : ""}
            />
          )}
        />
        
        <TextField
          label="Billing Address"
          value={billingAddress}
          multiline
          rows={2}
          fullWidth
          margin="normal"
          onChange={(e) => setBillingAddress(e.target.value)}
        />
        
        <TextField
          label="Shipping Address"
          value={shippingAddress}
          multiline
          rows={2}
          fullWidth
          margin="normal"
          onChange={(e) => setShippingAddress(e.target.value)}
        />
      </Paper>
      
      {/* Invoice Items Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Invoice Items</Typography>
        
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Remove</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  {/* Product Selection */}
                  <TableCell sx={{ minWidth: 200 }}>
                    <Autocomplete
                      options={products}
                      getOptionLabel={p => `${p.name} (${p.sku})`}
                      value={item.product}
                      onChange={(e, v) => handleItemChange(index, "product", v)}
                      renderInput={(params) => (
                        <TextField {...params} label="Product *" size="small" required />
                      )}
                    />
                  </TableCell>
                  
                  {/* Batch Selection */}
                  <TableCell sx={{ minWidth: 250 }}>
                    <Autocomplete
                      options={batchesList[index] || []}
                      getOptionLabel={b => `${b.batch_no} (Stock: ${b.qty_available})`}
                      value={item.batch}
                      onChange={(e, v) => handleItemChange(index, "batch", v)}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Batch *" 
                          size="small"
                          required
                          helperText={
                            !item.product 
                              ? "Select product first" 
                              : (batchesList[index] || []).length === 0 
                                ? "⚠️ No stock available" 
                                : `${(batchesList[index] || []).length} batch(es) with stock`
                          }
                        />
                      )}
                      disabled={!item.product || (batchesList[index] || []).length === 0}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {option.batch_no}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Stock: {option.qty_available} units
                              {option.warehouse_name && ` • ${option.warehouse_name}`}
                              {option.expiry_date && ` • Exp: ${new Date(option.expiry_date).toLocaleDateString('en-IN')}`}
                            </Typography>
                          </Box>
                        </li>
                      )}
                    />
                  </TableCell>
                  
                  {/* Quantity */}
                  <TableCell>
                    <TextField
                      type="number"
                      value={item.qty}
                      onChange={e => handleItemChange(index, "qty", Number(e.target.value) || 1)}
                      inputProps={{ 
                        min: 0,
                        max: item.batch?.qty_available || 999999,
                        step:1
                      }}
                      size="small"
                      sx={{ width: 90 }}
                      helperText={item.batch ? `Max: ${item.batch.qty_available}` : ''}
                      error={item.batch && item.qty > item.batch.qty_available}
                    />
                  </TableCell>
                  
                  {/* Unit Price */}
                  <TableCell>
                    <TextField
                      type="number"
                      value={item.unit_price}
                      onChange={e => handleItemChange(index, "unit_price", Number(e.target.value) || 0)}
                      size="small"
                      sx={{ width: 110 }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </TableCell>

                  {/* Line Amount */}
                  <TableCell>
                    <Typography fontWeight="bold" color="primary">
                      ₹{(item.qty * item.unit_price).toFixed(2)}
                    </Typography>
                  </TableCell>
                  
                  {/* Remove Button */}
                  <TableCell>
                    <IconButton 
                      onClick={() => removeItem(index)} 
                      color="error"
                      disabled={items.length === 1}
                      title="Remove item"
                    >
                      <RemoveCircleOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        
        <Button 
          startIcon={<AddCircleOutlineIcon />} 
          onClick={addItem} 
          sx={{ mt: 2 }}
          variant="outlined"
        >
          Add Item
        </Button>
      </Paper>
      
      {/* GST Breakdown Summary */}
      <Paper elevation={2} sx={{ p: 2, maxWidth: 400, ml: 'auto', mb: 2 }}>
        <Typography variant="h6" gutterBottom>Invoice Summary</Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Taxable Value:</Typography>
          <Typography fontWeight="bold">₹{totals.taxableValue.toFixed(2)}</Typography>
        </Box>
        
        {totals.isIntraState ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>CGST (9%):</Typography>
              <Typography>₹{totals.cgstAmount.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>SGST (9%):</Typography>
              <Typography>₹{totals.sgstAmount.toFixed(2)}</Typography>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>IGST (18%):</Typography>
            <Typography>₹{totals.igstAmount.toFixed(2)}</Typography>
          </Box>
        )}
        
        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Total Amount:</Typography>
          <Typography variant="h6" color="primary">
            ₹{totals.totalAmount.toFixed(2)}
          </Typography>
        </Box>
      </Paper>
      
      {/* Submit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined" 
          size="large"
          onClick={() => {
            if (window.confirm('Are you sure you want to reset the form?')) {
              setSelectedCustomer(null);
              setBillingAddress("");
              setShippingAddress("");
              setItems([{ product: null, batch: null, qty: 1, unit_price: 0 }]);
              setBatchesList({});
            }
          }}
        >
          Reset Form
        </Button>
        
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={handleSubmit}
          disabled={!selectedCustomer || items.length === 0}
        >
          Generate Invoice
        </Button>
      </Box>
    </Box>
  );
};

export default SalesInvoiceBuilder;
