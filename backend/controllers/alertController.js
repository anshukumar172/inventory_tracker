const alertModel = require('../models/alertModel');

// GET /api/v1/alerts
exports.getAllAlerts = async (req, res) => {
  try {
    const alerts = await alertModel.getAllAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/v1/alerts/active
exports.getActiveAlerts = async (req, res) => {
  try {
    const activeAlerts = await alertModel.getActiveAlerts();
    res.json(activeAlerts);
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/v1/alerts
exports.createAlert = async (req, res) => {
  try {
    const { product_id, warehouse_id, type, threshold } = req.body;

    if (!product_id || !warehouse_id || !type || threshold === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['product_id', 'warehouse_id', 'type', 'threshold']
      });
    }

    if (!['low_stock', 'expiry'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid alert type',
        allowed: ['low_stock', 'expiry']
      });
    }

    const alertId = await alertModel.createAlert({
      product_id,
      warehouse_id,
      type,
      threshold
    });

    res.status(201).json({
      message: 'Alert created successfully',
      alertId
    });

  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/v1/alerts/:id
exports.updateAlert = async (req, res) => {
  try {
    const alertId = req.params.id;
    const updateData = req.body;

    const updated = await alertModel.updateAlert(alertId, updateData);

    if (!updated) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert updated successfully' });

  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/v1/alerts/:id
exports.deleteAlert = async (req, res) => {
  try {
    const alertId = req.params.id;

    const deleted = await alertModel.deleteAlert(alertId);

    if (!deleted) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert deleted successfully' });

  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/v1/alerts/check
exports.checkAlerts = async (req, res) => {
  try {
    const lowStockAlerts = await alertModel.checkLowStockAlerts();
    const expiryAlerts = await alertModel.checkExpiryAlerts();

    const newAlerts = [...lowStockAlerts, ...expiryAlerts];

    res.json({
      message: 'Alert check completed',
      new_alerts_count: newAlerts.length,
      new_alerts: newAlerts
    });

  } catch (error) {
    console.error('Error checking alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/v1/alerts/:id/dismiss
exports.dismissAlert = async (req, res) => {
  try {
    const alertId = req.params.id;

    const dismissed = await alertModel.dismissAlert(alertId);

    if (!dismissed) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert dismissed successfully' });

  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};