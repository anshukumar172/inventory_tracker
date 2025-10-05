import axiosClient from "./axiosClient";

export const fetchActiveAlerts = () => axiosClient.get('/alerts/active');
export const fetchAlertSummary = () => axiosClient.get('/alerts/summary');
export const checkAlerts = () => axiosClient.post('/alerts/check');
