const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({
    error: 'Validation error',
    details: error.details.map(detail => detail.message)
  });
  next();
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    full_name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'warehouse_user', 'accountant').required()
  }),
  
  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  })
};

// Product validation schemas
const productSchemas = {
  create: Joi.object({
    sku: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().allow(''),
    hsn_code: Joi.string().allow(''),
    unit: Joi.string().default('nos'),
    default_tax_rate: Joi.number().min(0).max(100).default(18.0)
  }),

  update: Joi.object({
    name: Joi.string(),
    description: Joi.string().allow(''),
    hsn_code: Joi.string().allow(''),
    unit: Joi.string(),
    default_tax_rate: Joi.number().min(0).max(100)
  })
};

// Warehouse validation schemas
const warehouseSchemas = {
  create: Joi.object({
    code: Joi.string().required(),
    name: Joi.string().required(),
    address: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    state_code: Joi.string().length(2).allow(''),
    pincode: Joi.string().allow(''),
    phone: Joi.string().allow('')
  })
};

// Batch validation schemas
const batchSchemas = {
  create: Joi.object({
    warehouse_id: Joi.number().integer().positive().required(),
    batch_no: Joi.string().required(),
    manufacturing_date: Joi.date().allow(''),
    expiry_date: Joi.date().allow(''),
    qty_received: Joi.number().positive().required(),
    qty_available: Joi.number().positive()
  })
};

const stockMovementSchemas = {
  create: Joi.object({
    movement_type: Joi.string().valid('IN', 'OUT', 'TRANSFER', 'ADJUST').required(),
    reference_type: Joi.string().valid('invoice', 'purchase', 'transfer', 'adjustment').allow(''),
    reference_id: Joi.number().integer().allow(null),
    product_id: Joi.number().integer().positive().required(),
    warehouse_from: Joi.number().integer().positive().allow(null),
    warehouse_to: Joi.number().integer().positive().allow(null),
    batch_id: Joi.number().integer().positive().required(),
    qty: Joi.number().positive().required(),
    unit_cost: Joi.number().positive().allow(null),
    total_value: Joi.number().allow(null)
  })
};

const customerSchemas = {
  create: Joi.object({
    name: Joi.string().required(),
    gstin: Joi.string().length(15).allow(''),
    address: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    state_code: Joi.string().length(2).allow(''),
    pincode: Joi.string().allow(''),
    phone: Joi.string().allow(''),
    email: Joi.string().email().allow('')
  })
};

const invoiceSchemas = {
  create: Joi.object({
    customer_id: Joi.number().integer().positive().required(),
    billing_address: Joi.string().allow(''),
    shipping_address: Joi.string().allow(''),
    invoice_date: Joi.date().default(new Date()),
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        batch_id: Joi.number().integer().positive().required(),
        qty: Joi.number().positive().required(),
        unit_price: Joi.number().positive().required()
      })
    ).min(1).required()
  })
};

module.exports = {
  validate,
  userSchemas,
  productSchemas,
  warehouseSchemas,
  batchSchemas,
  stockMovementSchemas,
  customerSchemas,
  invoiceSchemas
};
