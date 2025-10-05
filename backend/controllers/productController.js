const productModel = require('../models/productModel');

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
    console.log(`🗑️ Deleting product ${productId}`);
    
    const deleted = await productModel.deleteById(productId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'Cannot delete product with existing batches or transactions' 
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};
