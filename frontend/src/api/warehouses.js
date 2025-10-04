import axiosClient from "./axiosClient";

export const fetchWarehouses = () => axiosClient.get("/warehouses");
export const fetchWarehouseById = (id) => axiosClient.get(`/warehouses/${id}`);
export const createWarehouse = (data) => axiosClient.post("/warehouses", data);
export const updateWarehouse = (id, data) => axiosClient.put(`/warehouses/${id}`, data);
export const deleteWarehouse = (id) => axiosClient.delete(`/warehouses/${id}`);

// ✅ ADD THIS: New function to fetch warehouse batches
export const fetchWarehouseBatches = (warehouseId) => 
  axiosClient.get(`/warehouses/${warehouseId}/batches`);
