const warehouseModel = require('../models/warehouseModel');
const pool = require('../db');

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

// ✅ NEW: Get batches for a specific warehouse
exports.getWarehouseBatches = async (req, res) => {
    try {
        const warehouseId = req.params.id;
        
        console.log(`📦 Fetching batches for warehouse ID: ${warehouseId}`);
        
        const [batches] = await pool.execute(`
            SELECT 
                b.id,
                b.batch_no,
                b.qty_available,
                b.qty_received,
                b.manufacturing_date,
                b.expiry_date,
                b.created_at,
                p.id as product_id,
                p.name as product_name,
                p.sku,
                p.unit,
                w.name as warehouse_name
            FROM batches b
            INNER JOIN products p ON b.product_id = p.id  
            INNER JOIN warehouses w ON b.warehouse_id = w.id
            WHERE b.warehouse_id = ? AND b.qty_available > 0
            ORDER BY p.name ASC, b.expiry_date ASC
        `, [warehouseId]);
        
        console.log(`✅ Found ${batches.length} batches in warehouse ${warehouseId}`);
        
        res.json({
            success: true,
            data: batches,
            count: batches.length,
            warehouse_id: parseInt(warehouseId)
        });
        
    } catch (error) {
        console.error('❌ Error fetching warehouse batches:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch warehouse batches',
            details: error.message
        });
    }
};

// ✅ NEW: Get warehouse details  
exports.getWarehouseById = async (req, res) => {
    try {
        const warehouseId = req.params.id;
        const warehouse = await warehouseModel.findById(warehouseId);
        
        if (!warehouse) {
            return res.status(404).json({ 
                success: false,
                error: 'Warehouse not found' 
            });
        }
        
        res.json({
            success: true,
            data: warehouse
        });
        
    } catch (error) {
        console.error('Error fetching warehouse:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            details: error.message
        });
    }
};
