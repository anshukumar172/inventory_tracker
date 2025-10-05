const productModel = require('../models/productModel');
const pool = require('../db');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await productModel.getAll();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { sku, name, description, hsn_code, unit, default_tax_rate, cost_price, selling_price } = req.body;
    
    if (!sku || !name) {
      return res.status(400).json({ error: 'SKU and Name are required' });
    }

    const insertedId = await productModel.create({ 
      sku, 
      name, 
      description, 
      hsn_code, 
      unit, 
      default_tax_rate,
      cost_price: cost_price || 0,
      selling_price: selling_price || 0
    });
    
    res.status(201).json({ 
      message: 'Product created successfully', 
      productId: insertedId 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await productModel.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`🔄 Updating product ${productId}:`, req.body);
    
    const { name, description, hsn_code, unit, default_tax_rate, cost_price, selling_price } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const updated = await productModel.updateById(productId, {
      name, 
      description, 
      hsn_code, 
      unit, 
      default_tax_rate,
      cost_price,
      selling_price
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Return the updated product data
    const updatedProduct = await productModel.findById(productId);
    
    res.json({ 
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`🗑️ Attempting to delete product ${productId}`);
    
    // ✅ Check if product has batches
    const [batches] = await pool.query(
      'SELECT COUNT(*) as batch_count FROM batches WHERE product_id = ?',
      [productId]
    );
    
    if (batches[0].batch_count > 0) {
      console.log(`❌ Product ${productId} has ${batches[0].batch_count} batch(es)`);
      return res.status(400).json({ 
        error: `Cannot delete product. It has ${batches[0].batch_count} batch(es) associated with it. Please delete or transfer all batches first.`
      });
    }
    
    // ✅ Check if product has been used in sales invoices
    const [invoiceItems] = await pool.query(`
      SELECT COUNT(*) as item_count 
      FROM sales_invoice_items 
      WHERE product_id = ?
    `, [productId]);
    
    if (invoiceItems[0].item_count > 0) {
      console.log(`❌ Product ${productId} used in ${invoiceItems[0].item_count} invoice(s)`);
      return res.status(400).json({ 
        error: `Cannot delete product. It has been used in ${invoiceItems[0].item_count} sales invoice(s). Products with transaction history cannot be deleted for audit purposes.`
      });
    }
    
    // ✅ Check if product has stock movements
    const [movements] = await pool.query(
      'SELECT COUNT(*) as movement_count FROM stock_movements WHERE product_id = ?',
      [productId]
    );
    
    if (movements[0].movement_count > 0) {
      console.log(`❌ Product ${productId} has ${movements[0].movement_count} stock movement(s)`);
      return res.status(400).json({ 
        error: `Cannot delete product. It has ${movements[0].movement_count} stock movement record(s). Products with movement history cannot be deleted.`
      });
    }
    
    // ✅ If all checks pass, delete the product
    const deleted = await productModel.deleteById(productId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log(`✅ Product ${productId} deleted successfully`);
    res.json({ message: 'Product deleted successfully' });
    
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    
    // Handle foreign key constraint errors
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({ 
        error: 'Cannot delete product. It is referenced by other records in the system. Please ensure all batches, invoices, and stock movements are removed first.'
      });
    }
    
    res.status(500).json({ error: 'Failed to delete product. Please try again.' });
  }
};
