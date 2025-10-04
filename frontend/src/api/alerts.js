import axiosClient from "./axiosClient";

export const fetchAlerts = () => axiosClient.get("/alerts");

export const dismissAlert = (id) => axiosClient.post(`/alerts/${id}/dismiss`);

export const checkAlerts = () => axiosClient.post("/alerts/check");
