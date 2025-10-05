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
  const [items, setItems] = useState([{ product: null, batch: null, qty: 1, unit_price: 0 }]);
  const [batchesList, setBatchesList] = useState({});
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  useEffect(() => {
    fetchCustomers().then(res => setCustomers(res.data));
    fetchProducts().then(res => setProducts(res.data));
  }, []);

  // Fetch batches when a product is selected or changed
  useEffect(() => {
    items.forEach((item, idx) => {
      if (item.product) {
        fetchBatches(item.product.id).then(res =>
          setBatchesList(prev => ({ ...prev, [idx]: res.data }))
        );
      }
    });
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
    setItems([...items, { product: null, batch: null, qty: 1, unit_price: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    // Remove batches for deleted row
    setBatchesList(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  // ✅ Calculate GST breakdown
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
        alert("Invoice created successfully");
        // Reset form
        setSelectedCustomer(null);
        setBillingAddress("");
        setShippingAddress("");
        setItems([{ product: null, batch: null, qty: 1, unit_price: 0 }]);
        setBatchesList({});
      })
      .catch((error) => {
        console.error('Invoice creation error:', error);
        alert(error.response?.data?.error || "Failed to create invoice");
      });
  };

  return (
    <Box sx={{ p: 2, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Sales Invoice Builder</Typography>
      
      <Autocomplete
        options={customers}
        getOptionLabel={c => c.name || ""}
        onChange={(e, v) => setSelectedCustomer(v)}
        value={selectedCustomer}
        renderInput={(params) => <TextField {...params} label="Select Customer" margin="normal" required />}
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
      
      <Table sx={{ mt: 2 }}>
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
              <TableCell sx={{ minWidth: 150 }}>
                <Autocomplete
                  options={products}
                  getOptionLabel={p => p.name || ""}
                  value={item.product}
                  onChange={(e, v) => handleItemChange(index, "product", v)}
                  renderInput={(params) => <TextField {...params} label="Product" size="small" />}
                />
              </TableCell>
              
              <TableCell sx={{ minWidth: 150 }}>
                <Autocomplete
                  options={batchesList[index] || []}
                  getOptionLabel={b => b.batch_no || ""}
                  value={item.batch}
                  onChange={(e, v) => handleItemChange(index, "batch", v)}
                  renderInput={(params) => <TextField {...params} label="Batch" size="small" />}
                  disabled={!item.product}
                />
              </TableCell>
              
              <TableCell>
                <TextField
                  type="number"
                  value={item.qty}
                  onChange={e => handleItemChange(index, "qty", Number(e.target.value))}
                  inputProps={{ min: 1 }}
                  size="small"
                  sx={{ width: 80 }}
                />
              </TableCell>
              
              <TableCell>
                <TextField
                  type="number"
                  value={item.unit_price}
                  InputProps={{ readOnly: true }}
                  size="small"
                  sx={{ width: 100 }}
                  disabled
                />
              </TableCell>

              {/* ✅ Line Item Amount */}
              <TableCell>
                <Typography>₹{(item.qty * item.unit_price).toFixed(2)}</Typography>
              </TableCell>
              
              <TableCell>
                <IconButton onClick={() => removeItem(index)} color="error">
                  <RemoveCircleOutlineIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <Button 
        startIcon={<AddCircleOutlineIcon />} 
        onClick={addItem} 
        sx={{ mt: 1 }}
        variant="outlined"
      >
        Add Item
      </Button>
      
      {/* ✅ GST Breakdown Summary */}
      <Paper elevation={2} sx={{ mt: 3, p: 2, maxWidth: 400, ml: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Taxable Value:</Typography>
          <Typography>₹{totals.taxableValue.toFixed(2)}</Typography>
        </Box>
        
        {totals.isIntraState ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>CGST:</Typography>
              <Typography>₹{totals.cgstAmount.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>SGST:</Typography>
              <Typography>₹{totals.sgstAmount.toFixed(2)}</Typography>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>IGST:</Typography>
            <Typography>₹{totals.igstAmount.toFixed(2)}</Typography>
          </Box>
        )}
        
        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Total Amount:</Typography>
          <Typography variant="h6">₹{totals.totalAmount.toFixed(2)}</Typography>
        </Box>
      </Paper>
      
      <Button 
        variant="contained" 
        color="primary" 
        sx={{ mt: 2 }} 
        onClick={handleSubmit}
        disabled={!selectedCustomer || items.length === 0}
      >
        Save Invoice
      </Button>
    </Box>
  );
};

export default SalesInvoiceBuilder;
