import axiosClient from "./axiosClient";

export const fetchProducts = () => axiosClient.get("/products");
export const fetchProductById = (id) => axiosClient.get(`/products/${id}`);
export const createProduct = (data) => axiosClient.post("/products", data);
export const updateProduct = (id, data) => axiosClient.put(`/products/${id}`, data);
export const deleteProduct = (id) => axiosClient.delete(`/products/${id}`);
