// frontend/src/pages/ExpiringItems.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Paper
} from '@mui/material';
import {
  AccessTime as Clock,
  Inventory as Package
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const ExpiringItems = () => {
  const [expiringItems, setExpiringItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExpiringItems();
  }, []);

  const fetchExpiringItems = async () => {
    try {
      console.log('🔍 Fetching expiring items from:', `${API_BASE_URL}/stock/expiring-items`);
      
      const response = await axios.get(`${API_BASE_URL}/stock/expiring-items`);
      
      console.log('✅ Response:', response.data);
      
      // Filter for items expiring within 7 days
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const criticalItems = response.data.filter(item => {
        const expiryDate = new Date(item.expiry_date);
        return expiryDate <= sevenDaysFromNow;
      });
      
      setExpiringItems(criticalItems);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error:', err);
      
      let errorMessage = 'Failed to fetch expiring items';
      if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Make sure backend is running on http://localhost:3000';
      } else if (err.response) {
        errorMessage = `Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryColor = (daysUntilExpiry) => {
    if (daysUntilExpiry < 0) return 'error';
    if (daysUntilExpiry <= 3) return 'error';
    if (daysUntilExpiry <= 7) return 'warning';
    return 'info';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      {/* Header */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #ff6b9d 0%, #c06c84 100%)' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                Expiring Items
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Critical items expiring within the next 7 days
              </Typography>
            </Box>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 2 }}>
              <Clock sx={{ fontSize: 48, color: 'white' }} />
            </Box>
          </Box>
          <Box sx={{ mt: 3, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 2 }}>
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
              {expiringItems.length}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              Items Expiring Soon
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

      {/* Success - No Expiring Items */}
      {!error && expiringItems.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Package sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" color="success.main" gutterBottom>
              No Items Expiring Soon!
            </Typography>
            <Typography color="text.secondary">
              No items are expiring within the next 7 days.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      {!error && expiringItems.length > 0 && (
        <>
          <Alert severity="error" sx={{ mb: 3 }}>
            <strong>{expiringItems.length}</strong> items are expiring within 7 days. Take immediate action!
          </Alert>

          <Paper elevation={3}>
            <List sx={{ width: '100%' }}>
              {expiringItems.map((item, index) => {
                const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date);
                
                return (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        py: 2,
                        bgcolor: daysUntilExpiry < 0 ? 'error.lighter' : 'transparent',
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
                              label={daysUntilExpiry < 0 ? 'EXPIRED' : `${daysUntilExpiry} days left`}
                              color={getExpiryColor(daysUntilExpiry)}
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
                              <strong>Batch:</strong> {item.batch_number}
                            </Typography>
                            <Typography variant="body2" color="error.main" component="div">
                              <strong>Expiry Date:</strong> {formatDate(item.expiry_date)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="div">
                              <strong>Quantity:</strong> {item.quantity} units
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="div">
                              <strong>Location:</strong> {item.warehouse_name}
                            </Typography>
                            {item.unit_cost && (
                              <Typography variant="body2" color="text.secondary" component="div">
                                <strong>Unit Cost:</strong> ₹{item.unit_cost}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < expiringItems.length - 1 && <Divider />}
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

export default ExpiringItems;
