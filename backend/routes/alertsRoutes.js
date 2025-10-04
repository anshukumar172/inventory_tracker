const express = require('express');
const router = express.Router();

// Dummy data or logic to list active alerts
router.get('/', (req, res) => {
  // Example: Return sample active alerts
  const activeAlerts = [
    { id: 1, type: 'stock_low', message: 'Product SKU1234 stock below threshold' },
    { id: 2, type: 'expiry_soon', message: 'Batch BATCH001 expiring in 7 days' }
  ];
  res.json(activeAlerts);
});

// Manual trigger to check alert thresholds
router.post('/check', (req, res) => {
  // Example: Perform alert checks here; for now return success
  res.json({ message: 'Alert check triggered successfully' });
});

module.exports = router;
