const alertModel = require('../models/alertModel');

exports.getActiveAlerts = async (req, res) => {
  try {
    const alerts = await alertModel.getActiveAlerts();
    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.checkAlerts = async (req, res) => {
  try {
    const summary = await alertModel.getAlertSummary();
    res.json({
      success: true,
      message: 'Alert check completed',
      summary: {
        total_alerts: summary.total,
        low_stock_alerts: summary.low_stock_count,
        expiry_alerts: summary.expiry_count
      },
      alerts: {
        low_stock: summary.low_stock_alerts,
        expiry: summary.expiry_alerts
      }
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getAlertSummary = async (req, res) => {
  try {
    const summary = await alertModel.getAlertSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting alert summary:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
