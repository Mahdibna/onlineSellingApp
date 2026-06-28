// utils/RecommendationUtils.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';

// Add a tracking cache to prevent duplicate tracking in a short time window
const trackingCache = {
  views: new Map(), // Map to store recent view tracking
  expiryTime: 30 * 60 * 1000 // 30 minutes (in milliseconds)
};

/**
 * Get authentication token from AsyncStorage
 * @returns {Promise<string|null>} The authentication token or null
 */
// In RecommendationUtils.js
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.log('No token found in storage');
      return null;
    }
    
    // Trim any whitespace to prevent issues
    const cleanToken = token.trim();
    
    console.log('Token retrieved, length:', cleanToken.length);
    console.log('Token starts with:', cleanToken.substring(0, 10));
    console.log('Token ends with:', cleanToken.substring(cleanToken.length - 10));
    
    return cleanToken;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Make an authenticated API request
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data (for POST, PUT)
 * @returns {Promise<any>} Response data
 */
// Add to RecommendationUtils.js
const refreshAuthToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.warn('No refresh token available');
      return null;
    }
    
    console.log('Attempting to refresh auth token');
    const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
      refreshToken
    });
    
    if (response.data && response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      console.log('Auth token refreshed successfully');
      return response.data.token;
    }
    
    console.warn('Token refresh response did not contain a new token');
    return null;
  } catch (error) {
    console.error('Error refreshing auth token:', error);
    return null;
  }
};

const makeAuthenticatedRequest = async (method, endpoint, data = null) => {
    try {
        let token = await getAuthToken();
        if (!token) throw new Error('No authentication token available');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };

        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            headers,
            data: data ? JSON.stringify(data) : undefined,
        };

        const response = await axios(config);
        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            const newToken = await refreshToken(); // Implement refreshToken function
            if (newToken) {
                await AsyncStorage.setItem('token', newToken);
                const headers = {
                    'Authorization': `Bearer ${newToken}`,
                    'Content-Type': 'application/json',
                };
                const config = {
                    method,
                    url: `${API_URL}${endpoint}`,
                    headers,
                    data: data ? JSON.stringify(data) : undefined,
                };
                const response = await axios(config);
                return response.data;
            } else {
                // Redirect to login
                console.log('Token refresh failed, redirecting to login...');
                // Implement navigation to login screen
            }
        }
        console.error(`Error in ${method} request to ${endpoint}:`, error.response?.data);
        throw error;
    }
};

const refreshToken = async () => {
    try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        return response.data.token;
    } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
    }
};
/**
 * Track when a user views a product with caching to prevent duplicates
 * @param {number|string} clientId - User's client ID
 * @param {number|string} productId - Product ID being viewed
 * @returns {Promise}
 */
export const trackProductView = async (clientId, productId) => {
  try {
    // Create a unique key for this client-product combination
    const trackingKey = `${clientId}-${productId}`;
    
    // Check if we've already tracked this view recently
    const lastTracked = trackingCache.views.get(trackingKey);
    const now = Date.now();
    
    if (lastTracked && (now - lastTracked < trackingCache.expiryTime)) {
      // We've tracked this view recently, skip to prevent duplicates
      console.log('Skipping duplicate view tracking for product:', productId);
      return;
    }
    
    // Update tracking cache with current timestamp
    trackingCache.views.set(trackingKey, now);
    
    await makeAuthenticatedRequest(
      'POST', 
      `/api/advanced-recommendations/track/view/${clientId}/${productId}`
    );
    console.log('Product view tracked:', productId);
  } catch (error) {
    console.error('Error tracking product view:', error);
    // Don't throw error to avoid disrupting user experience
  }
};

/**
 * Track when a user adds a product to cart
 * @param {number|string} clientId - User's client ID
 * @param {number|string} productId - Product ID being added to cart
 * @returns {Promise}
 */
export const trackAddToCart = async (clientId, productId) => {
    try {
        const response = await makeAuthenticatedRequest(
            'POST',
            `/api/advanced-recommendations/track/cart/${clientId}/${productId}`
        );
        console.log('Add to cart tracked successfully:', productId, response);
    } catch (error) {
        console.error('Error tracking add to cart:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers,
            config: error.config,
        });
        throw error;
    }
};
/**
 * Track when a user purchases a product
 * @param {number|string} clientId - User's client ID
 * @param {number|string} productId - Product ID being purchased
 * @returns {Promise}
 */
export const trackPurchase = async (clientId, productId) => {
  try {
    await makeAuthenticatedRequest(
      'POST', 
      `/api/advanced-recommendations/track/purchase/${clientId}/${productId}`
    );
    console.log('Purchase tracked:', productId);
  } catch (error) {
    console.error('Error tracking purchase:', error);
    // Don't throw error to avoid disrupting user experience
  }
};

/**
 * Track when a user adds a product to wishlist
 * @param {number|string} clientId - User's client ID
 * @param {number|string} productId - Product ID being added to wishlist
 * @returns {Promise}
 */
export const trackWishlist = async (clientId, productId) => {
  try {
    await makeAuthenticatedRequest(
      'POST', 
      `/api/advanced-recommendations/track/wishlist/${clientId}/${productId}`
    );
    console.log('Wishlist tracked:', productId);
  } catch (error) {
    console.error('Error tracking wishlist:', error);
    // Don't throw error to avoid disrupting user experience
  }
};

/**
 * Track multiple purchased products at once (e.g., during checkout)
 * @param {number|string} clientId - User's client ID
 * @param {Array<{id: number|string, quantity: number}>} products - Array of products 
 * @returns {Promise}
 */
export const trackMultiplePurchases = async (clientId, products) => {
  try {
    if (!clientId || !products || !products.length) {
      console.warn('Missing data for purchase tracking');
      return;
    }
    
    // Track each product purchased
    await Promise.all(
      products.map(product => 
        trackPurchase(clientId, product.id || product.id_product)
          .catch(err => console.error(`Error tracking purchase for product ${product.id || product.id_product}:`, err))
      )
    );
    
    console.log(`${products.length} purchases tracked successfully`);
  } catch (error) {
    console.error('Error tracking purchases:', error);
    // Don't throw error to avoid disrupting user experience
  }
};

/**
 * Get recommendations from the API
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - URL parameters
 * @returns {Promise<Array>} Array of recommendations
 */
export const getRecommendations = async (endpoint, params = {}) => {
  try {
    // Build the query string from params
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const url = `/api/advanced-recommendations/${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    // Make authenticated request
    return await makeAuthenticatedRequest('GET', url);
  } catch (error) {
    console.error(`Error fetching recommendations from ${endpoint}:`, error);
    throw error;
  }
};
// Add this to your app initialization or auth context
const verifyToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('Stored token:', token);
    return token;
  } catch (error) {
    console.error('Error reading token:', error);
    return null;
  }
};
/**
 * Get collaborative filtering recommendations for a user
 * @param {number|string} clientId - User's client ID
 * @param {number} limit - Number of recommendations to return
 * @returns {Promise<Array>} Array of recommended products
 */
export const getCollaborativeRecommendations = async (clientId, limit = 10) => {
  return getRecommendations(`collaborative/${clientId}`, { limit });
};

/**
 * Get content-based recommendations for a user
 * @param {number|string} clientId - User's client ID
 * @param {number} limit - Number of recommendations to return
 * @returns {Promise<Array>} Array of recommended products
 */
export const getContentBasedRecommendations = async (clientId, limit = 10) => {
  return getRecommendations(`content-based/${clientId}`, { limit });
};

/**
 * Get hybrid recommendations for a user (combines multiple techniques)
 * @param {number|string} clientId - User's client ID
 * @param {number} limit - Number of recommendations to return
 * @returns {Promise<Array>} Array of recommended products
 */
export const getHybridRecommendations = async (clientId, limit = 10) => {
  return getRecommendations(`hybrid/${clientId}`, { limit });
};

/**
 * Get popular product recommendations
 * @param {number} limit - Number of recommendations to return
 * @returns {Promise<Array>} Array of popular products
 */
export const getPopularRecommendations = async (limit = 10) => {
  return getRecommendations('popular', { limit });
};

/**
 * Get similar product recommendations
 * @param {number|string} productId - Product ID to find similar products for
 * @param {number} limit - Number of recommendations to return
 * @returns {Promise<Array>} Array of similar products
 */
export const getSimilarProducts = async (productId, limit = 10) => {
  return getRecommendations(`similar/${productId}`, { limit });
};

export default {
  trackProductView,
  trackAddToCart,
  trackPurchase,
  trackWishlist,
  trackMultiplePurchases,
  getCollaborativeRecommendations,
  getContentBasedRecommendations,
  getHybridRecommendations,
  getPopularRecommendations,
  getSimilarProducts
};