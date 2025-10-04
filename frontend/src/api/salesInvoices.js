import axiosClient from "./axiosClient";

export const createInvoice = (data) =>
  axiosClient.post("/sales/invoices", data);

export const fetchInvoiceById = (id) =>
  axiosClient.get(`/sales/invoices/${id}`);

export const fetchInvoices = (params) =>
  axiosClient.get("/sales/invoices", { params });
