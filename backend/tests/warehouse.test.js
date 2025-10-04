const request = require('supertest');
const app = require('../app');  // Correct import from app.js

describe('Warehouse API', () => {

  it('GET /api/v1/warehouses should return 200 and JSON array', async () => {
    const res = await request(app).get('/api/v1/warehouses');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/v1/warehouses should create a warehouse', async () => {
    const uniqueCode = `TEST-WH-${Date.now()}`;

    const res = await request(app)
      .post('/api/v1/warehouses')
      .send({
        code: uniqueCode,
        name: 'Test Warehouse'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('warehouseId');
  });

  afterAll(() => {
    // Add any teardown logic here if needed, e.g., closing DB connections
  });

});
