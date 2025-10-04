import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

console.log('🌐 API Base URL:', API_BASE_URL);

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Adding auth token to request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 API Error:', error.response?.status, error.response?.data);
    
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
