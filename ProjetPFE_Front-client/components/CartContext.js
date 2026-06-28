import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useAuth } from '../auth/useAuth';

// Create context
const CartContext = createContext({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getCartTotal: () => 0,
  getCartCount: () => 0,
  isInCart: () => false,
  loading: false
});

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        const userId = user?.userId || 'guest';
        const storedCart = await AsyncStorage.getItem(`cart_${userId}`);
        
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
      } catch (error) {
        console.error('Error loading cart from storage:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCart();
  }, [user]);
  
  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        const userId = user?.userId || 'guest';
        await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to storage:', error);
      }
    };
    
    if (!loading) {
      saveCart();
    }
  }, [cart, loading, user]);
  
  // Add a product to cart
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      // Check if product already exists in cart
      const existingItemIndex = prevCart.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Product exists, update quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return updatedCart;
      } else {
        // Product doesn't exist, add new item
        return [...prevCart, { ...product, quantity }];
      }
    });
    
    // Show success message
    Alert.alert('Added to Cart', `${product.name || 'Product'} added to your cart`);
  };
  
  // Remove a product from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };
  
  // Update product quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      // If quantity is 0 or less, remove item
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => {
      return prevCart.map(item => 
        item.id === productId ? { ...item, quantity } : item
      );
    });
  };
  
  // Clear the entire cart
  const clearCart = () => {
    setCart([]);
  };
  
  // Calculate total price of items in cart
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      // Use sale price if available, otherwise use regular price
      const price = item.salePrice || item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };
  
  // Get total number of items in cart
  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };
  
  // Check if a product is already in cart
  const isInCart = (productId) => {
    return cart.some(item => item.id === productId);
  };
  
  // Context value
  const contextValue = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    isInCart,
    loading
  };
  
  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;