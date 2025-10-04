const customerModel = require('../models/customerModel');

exports.getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let customers;

    if (search) {
      customers = await customerModel.search(search);
    } else {
      customers = await customerModel.getAll();
    }

    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await customerModel.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const customerId = await customerModel.create(req.body);
    res.status(201).json({ message: 'Customer created successfully', customerId });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const updated = await customerModel.updateById(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
