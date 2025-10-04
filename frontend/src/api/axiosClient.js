import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

console.log('🌐 API Base URL:', API_BASE_URL);

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // ✅ ADD: 30 second timeout for reports
});

// Request interceptor to add auth token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Adding auth token to request:', config.url);
    }
    
    // ✅ ADD: Handle blob responses for CSV downloads
    if (config.responseType === 'blob') {
      console.log('📊 Blob response requested for:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
axiosClient.interceptors.response.use(
  (response) => {
    // ✅ ADD: Log successful blob downloads
    if (response.config.responseType === 'blob') {
      console.log('✅ Blob response received:', response.headers['content-type']);
    }
    return response;
  },
  (error) => {
    console.error('🚨 API Error:', error.response?.status, error.response?.data);
    
    // ✅ IMPROVED: Handle blob error responses (like CSV download errors)
    if (error.response?.data instanceof Blob) {
      // Convert blob to text to see actual error message
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            console.error('🔴 Blob error details:', errorData);
            error.response.data = errorData;
          } catch (e) {
            error.response.data = { error: reader.result };
          }
          reject(error);
        };
        reader.readAsText(error.response.data);
      });
    }
    
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🔴 Authentication failed, clearing local storage');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
