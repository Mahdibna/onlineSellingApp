import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Cache for storing responses to reduce redundant API calls
const responseCache = {
  categories: null,
  allProducts: null,
  productsByCategory: {},
  productDetails: {},
  notifications: null,
  unreadCount: null
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  categories: 5 * 60 * 1000, // 5 minutes
  products: 2 * 60 * 1000,   // 2 minutes
  productDetails: 5 * 60 * 1000, // 5 minutes
  notifications: 1 * 60 * 1000, // 1 minute
  unreadCount: 1 * 60 * 1000 // 1 minute
};

// Timestamps for cache entries
const cacheTimestamps = {
  categories: 0,
  allProducts: 0,
  productsByCategory: {},
  productDetails: {},
  notifications: 0,
  unreadCount: 0
};

// Helper function to get token from AsyncStorage
const getToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Add a request interceptor to include token in all requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error adding auth token to request:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration or unauthorized errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear token from storage
      await AsyncStorage.removeItem('token');
      // Dispatch logout action if available
      if (global.authDispatch) {
        global.authDispatch({ type: 'LOGOUT' });
      }
      return Promise.reject(new Error('Authentication expired. Please sign in again.'));
    }
    return Promise.reject(error);
  }
);

// Helper function to check if cache is valid
const isCacheValid = (cacheKey, id = null) => {
  const now = Date.now();
  
  switch (cacheKey) {
    case 'categories':
      return responseCache.categories !== null && 
            (now - cacheTimestamps.categories) < CACHE_EXPIRATION.categories;
    case 'allProducts':
      return responseCache.allProducts !== null && 
            (now - cacheTimestamps.allProducts) < CACHE_EXPIRATION.products;
    case 'productsByCategory':
      return id && responseCache.productsByCategory[id] !== undefined && 
            (now - cacheTimestamps.productsByCategory[id]) < CACHE_EXPIRATION.products;
    case 'productDetails':
      return id && responseCache.productDetails[id] !== undefined && 
            (now - cacheTimestamps.productDetails[id]) < CACHE_EXPIRATION.productDetails;
    case 'notifications':
      return responseCache.notifications !== null && 
            (now - cacheTimestamps.notifications) < CACHE_EXPIRATION.notifications;
    case 'unreadCount':
      return responseCache.unreadCount !== null && 
            (now - cacheTimestamps.unreadCount) < CACHE_EXPIRATION.unreadCount;
    default:
      return false;
  }
};

// Helper to clear all cache
const clearCache = () => {
  responseCache.categories = null;
  responseCache.allProducts = null;
  responseCache.productsByCategory = {};
  responseCache.productDetails = {};
  responseCache.notifications = null;
  responseCache.unreadCount = null;
  
  cacheTimestamps.categories = 0;
  cacheTimestamps.allProducts = 0;
  cacheTimestamps.productsByCategory = {};
  cacheTimestamps.productDetails = {};
  cacheTimestamps.notifications = 0;
  cacheTimestamps.unreadCount = 0;
};

// API service functions
const api = {
  // Auth functions
  login: async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        clearCache(); // Clear cache on login
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      clearCache(); // Clear cache on logout
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  // Categories
  getCategories: async (forceRefresh = false) => {
    try {
      if (!forceRefresh && isCacheValid('categories')) {
        return responseCache.categories;
      }
      const response = await apiClient.get('/categories');
      responseCache.categories = response.data;
      cacheTimestamps.categories = Date.now();
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
  // Products
  getProductsByCategory: async (categoryId, forceRefresh = false) => {

    try {
      if (!forceRefresh && isCacheValid('productsByCategory', categoryId)) {
        return responseCache.productsByCategory[categoryId];
      }
      const response = await apiClient.get(`/categories/products/${categoryId}`);
      responseCache.productsByCategory[categoryId] = response.data;
      cacheTimestamps.productsByCategory[categoryId] = Date.now();
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for category ${categoryId}:`, error);
      throw error;
    }
  },

  getAllProducts: async (forceRefresh = false) => {
    try {
      if (!forceRefresh && isCacheValid('allProducts')) {
        return responseCache.allProducts;
      }
      const response = await apiClient.get('/Products/available');
      responseCache.allProducts = response.data;
      cacheTimestamps.allProducts = Date.now();
      return response.data;
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw error;
    }
  },

  getProductById: async (productId, forceRefresh = false) => {
    try {
      if (!forceRefresh && isCacheValid('productDetails', productId)) {
        return responseCache.productDetails[productId];
      }
      const response = await apiClient.get(`/Products/${productId}`);
      responseCache.productDetails[productId] = response.data;
      cacheTimestamps.productDetails[productId] = Date.now();
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  },

  // Notifications
  fetchNotifications: async (forceRefresh = false) => {
    try {
      if (!forceRefresh && isCacheValid('notifications')) {
        return responseCache.notifications;
      }
      const response = await apiClient.get('/notifications');
      responseCache.notifications = response.data;
      cacheTimestamps.notifications = Date.now();
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  getUnreadCount: async (forceRefresh = false) => {
    try {
      if (!forceRefresh && isCacheValid('unreadCount')) {
        return responseCache.unreadCount;
      }
      const response = await apiClient.get('/notifications/unread-count');
      responseCache.unreadCount = response.data.count;
      cacheTimestamps.unreadCount = Date.now();
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      // Invalidate notifications cache
      responseCache.notifications = null;
      cacheTimestamps.notifications = 0;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      await apiClient.put('/notifications/read-all');
      // Invalidate notifications cache
      responseCache.notifications = null;
      responseCache.unreadCount = 0;
      cacheTimestamps.notifications = 0;
      cacheTimestamps.unreadCount = 0;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  },

  // Cache management
  invalidateCache: (cacheType, id = null) => {
    switch (cacheType) {
      case 'categories':
        responseCache.categories = null;
        cacheTimestamps.categories = 0;
        break;
      case 'allProducts':
        responseCache.allProducts = null;
        cacheTimestamps.allProducts = 0;
        break;
      case 'productsByCategory':
        if (id) {
          delete responseCache.productsByCategory[id];
          delete cacheTimestamps.productsByCategory[id];
        } else {
          responseCache.productsByCategory = {};
          cacheTimestamps.productsByCategory = {};
        }
        break;
      case 'productDetails':
        if (id) {
          delete responseCache.productDetails[id];
          delete cacheTimestamps.productDetails[id];
        } else {
          responseCache.productDetails = {};
          cacheTimestamps.productDetails = {};
        }
        break;
      case 'notifications':
        case 'unreadCount':
          responseCache[cacheType] = null;
          cacheTimestamps[cacheType] = 0;
          break;
      case 'all':
        clearCache();
        break;
      default:
        break;
    }
  }
};

export default api;