import React, { useState, useEffect } from "react";
import {
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  CircularProgress,
} from "@mui/material";
import { fetchAlerts, dismissAlert, checkAlerts } from "../api/alerts";

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const loadAlerts = () => {
    setLoading(true);
    fetchAlerts()
      .then((res) => setAlerts(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleDismiss = (id) => {
    dismissAlert(id).then(() => loadAlerts());
  };

  const handleCheckAlerts = () => {
    setChecking(true);
    checkAlerts()
      .then(() => loadAlerts())
      .finally(() => setChecking(false));
  };

  return (
    <Box sx={{ p: 2, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Alerts & Notifications
      </Typography>
      <Button
        variant="contained"
        onClick={handleCheckAlerts}
        disabled={checking}
        sx={{ mb: 2 }}
      >
        {checking ? <CircularProgress size={20} /> : "Check Alerts Now"}
      </Button>
      {loading ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Last Triggered</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No alerts found.
                </TableCell>
              </TableRow>
            )}
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>{alert.type}</TableCell>
                <TableCell>{alert.message}</TableCell>
                <TableCell>
                  {alert.last_triggered
                    ? new Date(alert.last_triggered).toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleDismiss(alert.id)}
                  >
                    Dismiss
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default AlertsPage;
