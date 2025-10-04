import axiosClient from "./axiosClient";

export const fetchGstReport = (from, to, stateCode) =>
  axiosClient.get("/reports/gst", { params: { from, to, state_code: stateCode } });
