import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Box,
  Alert,
  Card,
  CardContent,
  Chip,
  Grid,
  CircularProgress
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { fetchActiveAlerts, checkAlerts } from "../api/alerts";

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchActiveAlerts();
      console.log('Fetched alerts:', response.data);
      
      const alertsData = response.data?.data || response.data || [];
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
      setError('Failed to load alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAlerts = async () => {
    try {
      setChecking(true);
      setError('');
      await checkAlerts();
      await loadAlerts(); // Reload alerts after checking
      
    } catch (error) {
      console.error('Failed to check alerts:', error);
      setError('Failed to check alerts');
    } finally {
      setChecking(false);
    }
  };

  const getAlertIcon = (type) => {
    return type === 'low_stock' ? <WarningIcon /> : <ErrorOutlineIcon />;
  };

  const getAlertColor = (type) => {
    return type === 'low_stock' ? 'warning' : 'error';
  };

  const getAlertLabel = (type) => {
    return type === 'low_stock' ? 'Low Stock' : 'Expiring Soon';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Alerts & Notifications</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadAlerts} disabled={loading}>
            Refresh
          </Button>
          <Button variant="contained" onClick={handleCheckAlerts} disabled={checking}>
            {checking ? <CircularProgress size={24} /> : 'Check Alerts'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" color="text.secondary">✅ No Active Alerts</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              All inventory levels are within acceptable thresholds
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {alerts.map((alert, index) => (
            <Grid item xs={12} key={`${alert.alert_type}-${alert.batch_id || index}`}>
              <Card sx={{ borderLeft: 4, borderColor: `${getAlertColor(alert.alert_type)}.main` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ color: `${getAlertColor(alert.alert_type)}.main`, mt: 0.5 }}>
                      {getAlertIcon(alert.alert_type)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                        <Chip
                          label={getAlertLabel(alert.alert_type)}
                          color={getAlertColor(alert.alert_type)}
                          size="small"
                        />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {alert.product_name} ({alert.sku})
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 0.5 }}>
                        Warehouse: <strong>{alert.warehouse_name}</strong>
                      </Typography>
                      {alert.alert_type === 'low_stock' && (
                        <Typography color="text.secondary">
                          Current Stock: <strong style={{ color: '#ed6c02' }}>{alert.qty_available}</strong> units
                          (Threshold: {alert.threshold})
                        </Typography>
                      )}
                      {alert.alert_type === 'expiry' && (
                        <Typography color="text.secondary">
                          Batch: <strong>{alert.batch_no}</strong> - 
                          Expires in <strong style={{ color: '#d32f2f' }}>{alert.days_to_expire}</strong> days
                          ({alert.qty_available} units)
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                        {alert.alert_message}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Alert Rules:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          • <strong>Low Stock:</strong> Triggers when quantity falls below <strong>50 units</strong> (Priority)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>Expiring Soon:</strong> Triggers when products with 50+ units expire within <strong>7 days</strong>
        </Typography>
      </Box>
    </Box>
  );
};

export default AlertsPage;
