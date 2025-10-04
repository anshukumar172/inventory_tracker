const request = require('supertest');
const app = require('../app');

describe('Product API', () => {

  it('GET /api/v1/products should return 200 and JSON array', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/v1/products should create a product with unique SKU', async () => {
    const uniqueSku = `TEST-SKU-${Date.now()}`;  // Unique SKU per test run

    const res = await request(app)
      .post('/api/v1/products')
      .send({
        sku: uniqueSku,
        name: 'Test Product'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('productId');
  });
});
