import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useAuth } from '../auth/useAuth';

// Create context
const WishlistContext = createContext({
  wishlist: [],
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  clearWishlist: () => {},
  isInWishlist: () => false,
  getWishlistCount: () => 0,
  loading: false
});

// Wishlist Provider Component
export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Load wishlist from AsyncStorage on mount
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        setLoading(true);
        const userId = user?.userId || 'guest';
        const storedWishlist = await AsyncStorage.getItem(`wishlist_${userId}`);
        
        if (storedWishlist) {
          setWishlist(JSON.parse(storedWishlist));
        }
      } catch (error) {
        console.error('Error loading wishlist from storage:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadWishlist();
  }, [user]);
  
  // Save wishlist to AsyncStorage whenever it changes
  useEffect(() => {
    const saveWishlist = async () => {
      try {
        const userId = user?.userId || 'guest';
        await AsyncStorage.setItem(`wishlist_${userId}`, JSON.stringify(wishlist));
      } catch (error) {
        console.error('Error saving wishlist to storage:', error);
      }
    };
    
    if (!loading) {
      saveWishlist();
    }
  }, [wishlist, loading, user]);
  
  // Add a product to wishlist
  const addToWishlist = (product) => {
    // Check if product is already in wishlist
    if (isInWishlist(product.id)) {
      Alert.alert('Already in Favorites', `${product.name || 'Product'} is already in your favorites`);
      return;
    }
    
    setWishlist(prevWishlist => [...prevWishlist, product]);
    Alert.alert('Added to Favorites', `${product.name || 'Product'} added to your favorites`);
  };
  
  // Remove a product from wishlist
  const removeFromWishlist = (productId) => {
    setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== productId));
  };
  
  // Clear the entire wishlist
  const clearWishlist = () => {
    setWishlist([]);
  };
  
  // Check if a product is in wishlist
  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };
  
  // Get total count of wishlist items
  const getWishlistCount = () => {
    return wishlist.length;
  };
  
  // Context value
  const contextValue = {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    getWishlistCount,
    loading
  };
  
  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

// Custom hook to use wishlist context
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;