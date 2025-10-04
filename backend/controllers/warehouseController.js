const warehouseModel = require('../models/warehouseModel');

exports.getAllWarehouses = async (req, res) => {
    try {
        const warehouses = await warehouseModel.getAll();
        res.json(warehouses);
    } catch (error) {
        console.error('Error fetching warehouses:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createWarehouse = async (req, res) => {
    try {
        const { code, name } = req.body;
        if (!code || !name) {
            return res.status(400).json({ error: 'Code and Name are required' });
        }
        const id = await warehouseModel.create(req.body);
        res.status(201).json({ warehouseId: id });
    } catch (error) {
        console.error('Error creating warehouse:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
