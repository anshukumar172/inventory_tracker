const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('🔄 Loading routes...');

// Import routes
const productRoutes = require('./routes/productRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const batchRoutes = require('./routes/batchRoutes');
const salesInvoiceRoutes = require('./routes/salesInvoiceRoutes');
const authRouter = require('./routes/authRoutes');
const customerRouter = require('./routes/customerRoutes');
const alertsRoutes = require('./routes/alertsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const batchStandaloneRoutes = require('./routes/batchStandaloneRoutes');
const stockMovementRoutes = require('./routes/stockMovementRoutes'); // ADD THIS

console.log('✅ All route files loaded');

// Mount routes with base paths
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/products/:id/batches', batchRoutes);
app.use('/api/v1/sales/invoices', salesInvoiceRoutes);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/batches', batchStandaloneRoutes);
app.use('/api/v1/stock-movements', stockMovementRoutes); // ADD THIS

console.log('🔗 All routes mounted');

// Health check route
app.get('/health', (req, res) => {
  console.log('💓 Health check requested');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler (must be after all routes)
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not Found' });
});

// Error handler middleware (must be after all)
app.use((err, req, res, next) => {
  console.error('❌ Internal Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`🎯 Frontend CORS allowed from: http://localhost:3001`);
});

module.exports = app;
