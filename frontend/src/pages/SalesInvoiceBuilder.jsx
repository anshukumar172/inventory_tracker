// SalesInvoiceBuilder.js
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
  IconButton
} from "@mui/material";
import { fetchCustomers } from "../api/customers";
import { fetchProducts } from "../api/products";
import { fetchBatches } from "../api/batches"; // You need to create this API util
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
    // reset batch if product changed
    if (field === "product") {
      newItems[index].batch = null;
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

  const totalAmount = items.reduce((acc, item) => acc + (item.qty * item.unit_price), 0);

  const handleSubmit = () => {
    if (!selectedCustomer) {
      alert("Please select a customer");
      return;
    }
    const invoiceData = {
      customer_id: selectedCustomer.id,
      billing_address: billingAddress,
      shipping_address: shippingAddress,
      items: items.map(i => ({
        product_id: i.product ? i.product.id : null,
        batch_id: i.batch ? i.batch.id : null,
        qty: i.qty,
        unit_price: i.unit_price
      }))
    };
    createInvoice(invoiceData)
      .then(() => alert("Invoice created successfully"))
      .catch(() => alert("Failed to create invoice"));
  };

  return (
    <Box sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Sales Invoice Builder</Typography>
      <Autocomplete
        options={customers}
        getOptionLabel={c => c.name || ""}
        onChange={(e, v) => setSelectedCustomer(v)}
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
            <TableCell>Remove</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell sx={{ minWidth: 120 }}>
                <Autocomplete
                  options={products}
                  getOptionLabel={p => p.name || ""}
                  value={item.product}
                  onChange={(e, v) => handleItemChange(index, "product", v)}
                  renderInput={(params) => <TextField {...params} label="Product" />}
                />
              </TableCell>
              <TableCell sx={{ minWidth: 120 }}>
                <Autocomplete
                  options={batchesList[index] || []}
                  getOptionLabel={b => b.batch_no || ""}
                  value={item.batch}
                  onChange={(e, v) => handleItemChange(index, "batch", v)}
                  renderInput={(params) => <TextField {...params} label="Batch" />}
                  disabled={!item.product}
                />
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={item.qty}
                  onChange={e => handleItemChange(index, "qty", Number(e.target.value))}
                  inputProps={{ min: 1 }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={item.unit_price}
                  onChange={e => handleItemChange(index, "unit_price", Number(e.target.value))}
                  inputProps={{ min: 0 }}
                />
              </TableCell>
              <TableCell>
                <IconButton onClick={() => removeItem(index)}>
                  <RemoveCircleOutlineIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button startIcon={<AddCircleOutlineIcon />} onClick={addItem} sx={{ mt: 1 }}>
        Add Item
      </Button>
      <Typography variant="h6" sx={{ mt: 3 }}>
        Total: ₹{totalAmount.toFixed(2)}
      </Typography>
      <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSubmit}>
        Save Invoice
      </Button>
    </Box>
  );
};

export default SalesInvoiceBuilder;
