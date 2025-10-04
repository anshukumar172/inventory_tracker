const request = require('supertest');
const app = require('../app');

const productId = 1;  // Ensure this product exists in your DB

describe('Batch API', () => {

  it(`GET /api/v1/products/${productId}/batches should return 200 and JSON array`, async () => {
    const res = await request(app).get(`/api/v1/products/${productId}/batches`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it(`POST /api/v1/products/${productId}/batches should create a batch`, async () => {
    const uniqueBatchNo = `TEST-BATCH-${Date.now()}`;

    const res = await request(app)
      .post(`/api/v1/products/${productId}/batches`)
      .send({
        warehouse_id: 1,
        batch_no: uniqueBatchNo,
        manufacturing_date: '2025-07-01',
        expiry_date: '2026-07-01',
        qty_received: 50,
        qty_available: 50
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('batchId');
  });

  afterAll(() => {
    // Teardown if needed
  });

});
