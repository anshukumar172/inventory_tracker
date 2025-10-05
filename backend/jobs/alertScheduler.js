const cron = require('node-cron');
const alertModel = require('../models/alertModel');

console.log('🕐 Alert scheduler initialized');

// ✅ Run alert checks every hour
cron.schedule('0 * * * *', async () => {
  try {
    const timestamp = new Date().toLocaleString('en-IN');
    console.log(`\n⏰ [${timestamp}] Running scheduled alert check...`);
    
    const summary = await alertModel.getAlertSummary();
    
    console.log(`✅ Alert check complete:`);
    console.log(`   📊 Total alerts: ${summary.total}`);
    console.log(`   📦 Low stock alerts: ${summary.low_stock_count}`);
    console.log(`   ⏱️  Expiry alerts: ${summary.expiry_count}`);
    
    if (summary.low_stock_count > 0) {
      console.log('\n📦 LOW STOCK ITEMS:');
      summary.low_stock_alerts.forEach(alert => {
        console.log(`   - ${alert.product_name} (${alert.sku}): ${alert.qty_available} units in ${alert.warehouse_name}`);
      });
    }
    
    if (summary.expiry_count > 0) {
      console.log('\n⏱️  EXPIRING ITEMS:');
      summary.expiry_alerts.forEach(alert => {
        console.log(`   - Batch ${alert.batch_no} of ${alert.product_name}: expires in ${alert.days_to_expire} days`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error running scheduled alert check:', error);
  }
});

// ✅ Run initial check on startup
(async () => {
  try {
    console.log('🚀 Running initial alert check on startup...');
    const summary = await alertModel.getAlertSummary();
    console.log(`✅ Initial check: ${summary.total} active alert(s) found`);
  } catch (error) {
    console.error('❌ Error in initial alert check:', error);
  }
})();

module.exports = cron;
