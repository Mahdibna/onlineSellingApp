// CartUtils.js
// Utility functions for cart management in the frontend

import axios from 'axios';

import { useAuth } from '../auth/AuthContext';
import { trackAddToCart } from './RecommendationUtils';
import { API_URL } from '../config/api';

// ===== ADD THESE FUNCTIONS TO YOUR EXISTING CARTUTILS =====

/**
 * Track product addition to cart for recommendation system
 * This function should be called after successfully adding an item to cart
 *
 * @param {number|string} userId - The user's ID
 * @param {number|string} productId - The product's ID
 * @returns {Promise<void>}
 */
export const trackCartAddition = async (userId, productId) => {
  if (!userId || !productId) {
    console.warn('Missing userId or productId for recommendation tracking');
    return;
  }

  try {
    await trackAddToCart(userId, productId);
    console.log('Successfully tracked cart addition for recommendations');
  } catch (error) {
    // Log error but don't disrupt user experience
    console.error('Error tracking cart addition for recommendations:', error);
  }
};

/**
 * Track add to cart action for recommendations
 * @param {number} userId - Client ID
 * @param {number} productId - Product ID
 */
const trackAddToCartForRecommendations = async (userId, productId) => {
  if (!userId || !productId) return;

  try {
    const token = await getAuthToken();
    if (!token) return;

    await axios.post(
      `${API_URL}/api/recommendations/track/cart`,
      { clientId: userId, productId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`Tracked add to cart for product ${productId} by user ${userId}`);
  } catch (err) {
    console.error('Error tracking add to cart for recommendations:', err);
    // Don't throw - this is just for analytics
  }
};

/**
 * Helper to get auth token from AsyncStorage
 */
const getAuthToken = async () => {
  try {
    // Import AsyncStorage dynamically to avoid circular dependencies
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    let token = await AsyncStorage.getItem('token');
    if (!token) {
      token = await AsyncStorage.getItem('authToken');
    }
    return token;
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

/**
 * Fetch cart for a client
 * @param {number} userId - Client ID
 * @param {string} token - Authentication token
 * @returns {Promise<object>} - Cart data
 */
export const fetchCart = async (userId, token) => {
  try {
    const response = await axios.get(`${API_URL}/api/cart/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch cart:', error);
    throw error;
  }
};

/**
 * Add an item to the cart
 * @param {number} userId - Client ID
 * @param {number|null} productId - Product ID (null if adding a pack)
 * @param {number|null} packId - Pack ID (null if adding a product)
 * @param {number} quantity - Quantity to add
 * @param {string} token - Authentication token
 * @returns {Promise<object>} - Updated cart data
 */
export const addToCart = async (userId, productId, packId, quantity, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/cart/${userId}/add`,
      {
        productId,
        packId,
        quantity: quantity || 1,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Track for recommendation system if it's a product
    if (productId) {
      trackAddToCartForRecommendations(userId, productId);
    }

    return response.data;
  } catch (error) {
    console.error('Failed to add to cart:', error);
    throw error;
  }
};

/**
 * Update item quantity in cart
 * @param {number} userId - Client ID
 * @param {number} cartItemId - Cart item ID
 * @param {number} quantity - New quantity
 * @param {string} token - Authentication token
 * @returns {Promise<object>} - Updated cart data
 */
export const updateCartItemQuantity = async (userId, cartItemId, quantity, token) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/cart/${userId}/items/${cartItemId}?quantity=${quantity}`,
      null,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to update cart item:', error);
    throw error;
  }
};

/**
 * Remove an item from cart
 * @param {number} userId - Client ID
 * @param {number} cartItemId - Cart item ID
 * @param {string} token - Authentication token
 * @returns {Promise<object>} - Updated cart data
 */
export const removeCartItem = async (userId, cartItemId, token) => {
  try {
    const response = await axios.delete(`${API_URL}/api/cart/${userId}/items/${cartItemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to remove cart item:', error);
    throw error;
  }
};

/**
 * Clear cart
 * @param {number} userId - Client ID
 * @param {string} token - Authentication token
 * @returns {Promise<object>} - Empty cart data
 */
export const clearCart = async (userId, token) => {
  try {
    const response = await axios.delete(`${API_URL}/api/cart/${userId}/clear`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to clear cart:', error);
    throw error;
  }
};

/**
 * Manually clear cart after order (as a backup)
 * This can be called after successful order creation if needed
 * @param {number} userId - Client ID
 * @param {string} token - Authentication token
 */
export const clearCartAfterOrder = async (userId, token) => {
  try {
    await axios.post(`${API_URL}/api/cart/${userId}/clear-after-order`, null, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error('Error clearing cart after order:', error);
    // Silently fail - this is a cleanup operation
  }
};

/**
 * Format time (minutes:seconds) with leading zeros
 * @param {number} minutes - Minutes
 * @param {number} seconds - Seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (minutes, seconds) => {
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format time remaining for display with text
 * @param {number} minutes - Minutes
 * @param {number} seconds - Seconds
 * @returns {string} - Human-readable time string
 */
export const formatTimeWithText = (minutes, seconds) => {
  if (minutes <= 0 && seconds <= 0) {
    return '0 seconds';
  }

  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds > 0 ? `and ${seconds} second${seconds !== 1 ? 's' : ''}` : ''}`;
  }

  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
};

/**
 * Calculate the applied price based on product/pack information and user role
 * @param {Object} item - Product or pack item
 * @param {boolean} isPartner - Whether the user is a partner
 * @returns {number} - The applied price after promotions
 */
export const calculateAppliedPrice = (item, user) => {
  if (!item) return 0;

  // If prixApplique is available from the backend, use it directly
  if (item.prixApplique !== undefined && item.prixApplique !== null) {
    return parseFloat(item.prixApplique);
  }

  const basePrice = parseFloat(item.prix || item.unitPrice || 0);

  // Check if user is a partner based on type property
  const isPartner = user?.roles?.includes('ROLE_USERPARTNER');

  // For partners, check partner promotion
  if (isPartner && item.promotionPartenaire) {
    const partnerPromo = parseFloat(item.promotionPartenaire);

    if (partnerPromo > 1) {
      // This is a markup
      return basePrice * partnerPromo;
    } else if (partnerPromo > 0) {
      // This is a discount
      return basePrice * (1 - partnerPromo);
    }
  }
  // For regular customers, check regular promotion
  else if (!isPartner && item.promotionParticulier) {
    const regularPromo = parseFloat(item.promotionParticulier);

    if (regularPromo > 0) {
      return basePrice * (1 - regularPromo);
    }
  }

  // No promotion applies
  return basePrice;
};

/**
 * Get promotion information for display
 * @param {Object} item - Product or cart item
 * @param {boolean} isPartner - Whether the user is a partner
 * @returns {Object} - Object with promotion details
 */
export const getPromotionInfo = (item, isPartner) => {
  // Base price is either unitPrice or prix
  const basePrice = parseFloat(item.unitPrice || item.prix || 0);
  if (!basePrice) {
    return {
      originalPrice: '$0.00',
      finalPrice: '$0.00',
      percentage: '0%',
      isDiscount: false,
      isMarkup: false,
    };
  }

  // First priority: check for server-calculated price (prixApplique)
  if (
    item.prixApplique !== undefined &&
    item.prixApplique !== null &&
    parseFloat(item.prixApplique) > 0
  ) {
    const appliedPrice = parseFloat(item.prixApplique);

    if (Math.abs(appliedPrice - basePrice) > 0.01) {
      const isDiscount = appliedPrice < basePrice;
      const percentDiff = isDiscount
        ? (((basePrice - appliedPrice) / basePrice) * 100).toFixed(0)
        : (((appliedPrice - basePrice) / basePrice) * 100).toFixed(0);

      return {
        originalPrice: `$${basePrice.toFixed(2)}`,
        finalPrice: `$${appliedPrice.toFixed(2)}`,
        percentage: `${percentDiff}%`,
        isDiscount,
        isMarkup: !isDiscount,
      };
    }
  }

  // Second priority: Partner-specific discount
  if (isPartner && item.promotionPartenaire !== undefined && item.promotionPartenaire !== null) {
    const partnerPromo = parseFloat(item.promotionPartenaire);

    // Partner pricing calculation
    if (partnerPromo > 1) {
      // Markup
      const finalPrice = basePrice * partnerPromo;
      const percentage = ((partnerPromo - 1) * 100).toFixed(0);

      return {
        originalPrice: `$${basePrice.toFixed(2)}`,
        finalPrice: `$${finalPrice.toFixed(2)}`,
        percentage: `${percentage}%`,
        isDiscount: false,
        isMarkup: true,
      };
    } else if (partnerPromo > 0) {
      // Discount
      const finalPrice = basePrice * (1 - partnerPromo);
      const percentage = (partnerPromo * 100).toFixed(0);

      return {
        originalPrice: `$${basePrice.toFixed(2)}`,
        finalPrice: `$${finalPrice.toFixed(2)}`,
        percentage: `${percentage}%`,
        isDiscount: true,
        isMarkup: false,
      };
    }
  }

  // Third priority: Regular customer discount
  if (item.promotionParticulier !== undefined && item.promotionParticulier !== null) {
    const individualPromo = parseFloat(item.promotionParticulier);

    if (individualPromo > 0) {
      const finalPrice = basePrice * (1 - individualPromo);
      const percentage = (individualPromo * 100).toFixed(0);

      return {
        originalPrice: `$${basePrice.toFixed(2)}`,
        finalPrice: `$${finalPrice.toFixed(2)}`,
        percentage: `${percentage}%`,
        isDiscount: true,
        isMarkup: false,
      };
    }
  }

  // No promotion
  return {
    originalPrice: `$${basePrice.toFixed(2)}`,
    finalPrice: `$${basePrice.toFixed(2)}`,
    percentage: '0%',
    isDiscount: false,
    isMarkup: false,
  };
};

/**
 * Custom hook to add a product to cart with toast notification
 * @param {object} navigation - Navigation object
 * @param {function} showToast - Function to show toast notifications
 * @returns {function} - Function to add product to cart
 */
export const useAddToCart = (navigation, showToast) => {
  const { user, token } = useAuth();

  return async (productId, quantity = 1) => {
    const currentUserId = user?.id ?? user?.userId;

    if (!currentUserId) {
      showToast('error', 'Please log in to add items to your cart');
      return false;
    }

    try {
      await addToCart(currentUserId, productId, null, quantity, token);
      showToast('success', 'Item added to cart');
      return true;
    } catch (error) {
      const errorMsg = error.response?.data || 'Failed to add item to cart';
      showToast('error', errorMsg);
      return false;
    }
  };
};
