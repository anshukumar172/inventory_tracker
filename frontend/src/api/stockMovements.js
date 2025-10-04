import axiosClient from "./axiosClient";

// ✅ Fixed endpoint to match backend routes
export const createStockMovement = (data) =>
  axiosClient.post("/stock-movements", data);

// Optional: Add other stock movement API calls
export const getAllStockMovements = () =>
  axiosClient.get("/stock-movements");

export const getStockMovementsByProduct = (productId) =>
  axiosClient.get(`/stock-movements/product/${productId}`);
