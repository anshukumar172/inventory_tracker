import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // ✅ Import useNavigate
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Paper,
  Button // ✅ Import Button
} from '@mui/material';
import {
  Warning as WarningIcon,
  Inventory as Package,
  AddCircle as AddIcon // ✅ Import AddIcon
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const LowStockItems = () => {
  const navigate = useNavigate(); // ✅ Initialize navigate
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    try {
      console.log('🔍 Fetching low stock items from:', `${API_BASE_URL}/stock/low-stock`);
      
      const response = await axios.get(`${API_BASE_URL}/stock/low-stock`);
      
      console.log('✅ Response:', response.data);
      setLowStockItems(response.data);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error:', err);
      
      let errorMessage = 'Failed to fetch low stock items';
      if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Make sure backend is running on http://localhost:3000';
      } else if (err.response) {
        errorMessage = `Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Add Stock Button */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box flex={1}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                Low Stock Items
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Items requiring immediate restocking
              </Typography>
            </Box>
            
            {/* ✅ ADD STOCK BUTTON */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/batches')}
              sx={{
                bgcolor: 'white',
                color: '#ff6b6b',
                fontWeight: 'bold',
                mr: 2,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                }
              }}
            >
              ADD NEW STOCK
            </Button>

            <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 2 }}>
              <WarningIcon sx={{ fontSize: 48, color: 'white' }} />
            </Box>
          </Box>
          <Box sx={{ mt: 3, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 2 }}>
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
              {lowStockItems.length}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              Items Below Threshold
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Success - No Low Stock Items */}
      {!error && lowStockItems.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Package sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" color="success.main" gutterBottom>
              All Items Well Stocked!
            </Typography>
            <Typography color="text.secondary">
              No items are running low on stock.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      {!error && lowStockItems.length > 0 && (
        <>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>{lowStockItems.length}</strong> items are running low. Please reorder soon to avoid stockouts.
          </Alert>

          <Paper elevation={3}>
            <List sx={{ width: '100%' }}>
              {lowStockItems.map((item, index) => {
                const stockPercentage = item.min_stock > 0 
                  ? Math.round((item.current_stock / item.min_stock) * 100) 
                  : 0;
                
                return (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        py: 2,
                        bgcolor: item.current_stock === 0 ? 'error.lighter' : 'transparent',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" component="span" fontWeight="bold">
                              {item.product_name}
                            </Typography>
                            <Chip 
                              label={`${item.current_stock} / ${item.min_stock}`}
                              color={item.current_stock === 0 ? 'error' : 'warning'}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" component="div">
                              <strong>SKU:</strong> {item.sku}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="div">
                              <strong>Current Stock:</strong> {item.current_stock} units
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="div">
                              <strong>Minimum Stock:</strong> {item.min_stock} units
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="div">
                              <strong>Stock Level:</strong> {stockPercentage}%
                            </Typography>
                            {item.warehouse_name && (
                              <Typography variant="body2" color="text.secondary" component="div">
                                <strong>Location:</strong> {item.warehouse_name}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < lowStockItems.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default LowStockItems;
