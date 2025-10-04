const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // ✅ ADD: Allow cross-origin for file downloads
}));

// ✅ ENHANCED CORS middleware for file downloads
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  exposedHeaders: ['content-disposition', 'content-type'], // ✅ Important for CSV downloads
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
const stockMovementRoutes = require('./routes/stockMovementRoutes');
const reportRoutes = require('./routes/reportRoutes'); // ✅ Reports route

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
app.use('/api/v1/stock-movements', stockMovementRoutes);
app.use('/api/v1/reports', reportRoutes); // ✅ Reports mounted

console.log('🔗 All routes mounted');

// Health check route
app.get('/health', (req, res) => {
  console.log('💓 Health check requested');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ ADD: Test route for CSV downloads (for debugging)
app.get('/api/v1/test-csv', (req, res) => {
  console.log('📊 Test CSV download requested');
  const csvContent = 'Name,Age,City\nJohn,25,Mumbai\nJane,30,Delhi';
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="test.csv"');
  res.send(csvContent);
});

// ✅ ADD: Request logging middleware (for debugging)
app.use((req, res, next) => {
  if (req.url.includes('/reports/')) {
    console.log(`📊 Report request: ${req.method} ${req.url}`);
    console.log('📊 Query params:', req.query);
    console.log('📊 Headers:', {
      authorization: req.headers.authorization ? '***TOKEN***' : 'none',
      'content-type': req.headers['content-type']
    });
  }
  next();
});

// 404 handler (must be after all routes)
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not Found' });
});

// Error handler middleware (must be after all)
app.use((err, req, res, next) => {
  console.error('❌ Internal Server Error:', err);
  
  // Don't send HTML error pages for API routes
  if (req.url.startsWith('/api/')) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } else {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`📊 Reports API: http://localhost:${PORT}/api/v1/reports/gst`);
  console.log(`🧪 Test CSV: http://localhost:${PORT}/api/v1/test-csv`);
  console.log(`🎯 Frontend CORS allowed from: http://localhost:3001`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
