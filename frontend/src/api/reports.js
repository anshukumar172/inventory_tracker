import axiosClient from "./axiosClient";

// ✅ Map state codes to names
const stateCodeMap = {
  '27': 'Maharashtra',
  '07': 'Delhi',
  '24': 'Gujarat',
  '32': 'Kerala',
  '19': 'West Bengal',
  '33': 'Tamil Nadu',
  '29': 'Karnataka',
};

export const fetchGstReport = (fromDate, toDate, stateCode) => {
  console.log('📊 fetchGstReport called with:', { fromDate, toDate, stateCode });
  
  const stateName = stateCodeMap[stateCode] || 'All';
  
  console.log('🗺️ Mapped state:', { stateCode, stateName });
  
  const params = {
    fromDate,
    toDate,
    state: stateName,
    format: 'csv'
  };
  
  console.log('📤 API params:', params);
  
  return axiosClient.get("/reports/gst", { 
    params,
    responseType: 'blob' // Important for CSV download
  });
};
