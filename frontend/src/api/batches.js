import axiosClient from "./axiosClient";

// Fetch ALL batches (for general batch management)
export const fetchBatches = () => axiosClient.get('/batches');

// Fetch batches for a specific product
export const fetchBatchesByProduct = (productId) =>
  axiosClient.get(`/products/${productId}/batches`);

// Create a new batch for a product
export const createBatch = (productId, data) =>
  axiosClient.post(`/products/${productId}/batches`, data);

// Update batch (optional)
export const updateBatch = (batchId, data) =>
  axiosClient.put(`/batches/${batchId}`, data);

// Delete batch (optional)
export const deleteBatch = (batchId) =>
  axiosClient.delete(`/batches/${batchId}`);

// ... any other batch-related functions you need
