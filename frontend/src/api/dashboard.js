import axiosClient from './axiosClient';

export function getKpis() {
  return axiosClient.get("/dashboard/kpis").then(res => res.data);
}

export function getRecentInvoices() {
  return axiosClient.get("/sales/invoices?recent=true").then(res => res.data);
}
