const pool = require('../db');

// Audit logging middleware
const auditLog = async (req, res, next) => {
  const originalSend = res.send;
  let action = `${req.method} ${req.originalUrl}`;
  let oldValues = null;
  let newValues = req.body;

  // Override response send to log only when successful response
  res.send = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      logAudit(req, action, oldValues, newValues);
    }
    originalSend.call(this, body);
  };

  next();
};

// Function to log audit trail
const logAudit = async (req, action, oldValues, newValues) => {
  try {
    const userId = req.user ? req.user.id : null;
    const pathParts = req.originalUrl.split('/');
    let tableName = null;
    let recordId = null;

    if (pathParts.includes('products')) {
      tableName = 'products';
      recordId = pathParts[pathParts.indexOf('products') + 1];
    } else if (pathParts.includes('warehouses')) {
      tableName = 'warehouses';
      recordId = pathParts[pathParts.indexOf('warehouses') + 1];
    } else if (pathParts.includes('batches')) {
      tableName = 'batches';
    } else if (pathParts.includes('customers')) {
      tableName = 'customers';
      recordId = pathParts[pathParts.indexOf('customers') + 1];
    }

    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, table_name, record_id, old_values, new_values) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        tableName,
        recordId ? parseInt(recordId) : null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null
      ]
    );
  } catch (error) {
    console.error('Audit logging error:', error);
  }
};

module.exports = {
  auditLog
};


