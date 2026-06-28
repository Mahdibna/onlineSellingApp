import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

export const setupInterceptors = (logoutCallback) => {
  apiClient.interceptors.request.use(
    async (config) => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Setting Authorization header with token');
        } else {
          console.log('No token found for request');
        }
      } catch (error) {
        console.error('Error accessing token:', error);
      }
      return config;
    },
    error => Promise.reject(error)
  );
  
  apiClient.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        console.error('Authentication error - token may be invalid or expired');
        logoutCallback?.();
      }
      return Promise.reject(error);
    }
  );
};

export { apiClient };