import axiosClient from "./axiosClient";

export const fetchCustomers = () => axiosClient.get("/customers");
export const fetchCustomerById = (id) => axiosClient.get(`/customers/${id}`);
export const createCustomer = (data) => axiosClient.post("/customers", data);
export const updateCustomer = (id, data) => axiosClient.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => axiosClient.delete(`/customers/${id}`);
