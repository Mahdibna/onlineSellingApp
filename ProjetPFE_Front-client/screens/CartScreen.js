import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import {
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  AppState,
  SafeAreaView,
} from 'react-native';
import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import AppButton from '../components/AppButton';
import Header from '../components/Header';
import ScreenComponent from '../components/ScreenComponent';
import Typo from '../components/Typo';
import colors from '../config/colors';
import { height, radius, spacingX, spacingY } from '../config/spacing';
import { normalizeY, normalizeX } from '../utils/normalize';
import { useAuth } from '../auth/AuthContext';
import { 
  fetchCart, 
  updateCartItemQuantity, 
  removeCartItem, 
  clearCart,
  formatTime,
  getPromotionInfo
} from '../utils/CartUtils';


function CartScreen({ navigation }) {
  const { user, token } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingItems, setProcessingItems] = useState([]);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  
  // Store absolute expiry time to handle app backgrounding
  const expiryTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Function to fetch cart data
  const loadCart = useCallback(async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const cartData = await fetchCart(user.id, token);
      setCart(cartData);
      
      // Store the expiry date and update timer
      if (cartData && cartData.expiresAt) {
        const expiryDate = new Date(cartData.expiresAt);
        expiryTimeRef.current = expiryDate;
        updateTimerFromExpiryDate(expiryDate);
      } else {
        expiryTimeRef.current = null;
        setTimerMinutes(0);
        setTimerSeconds(0);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load your cart. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, token]);

  // Function to update timer from expiry date
  const updateTimerFromExpiryDate = (expiryDate) => {
    if (!expiryDate) return;
    
    const currentTime = new Date();
    const timeDifference = expiryDate - currentTime;
    
    if (timeDifference <= 0) {
      // Cart has already expired
      setTimerMinutes(0);
      setTimerSeconds(0);
      // Reload cart as it might be expired in backend
      loadCart();
      return;
    }
    
    // Convert to minutes and seconds
    const totalSeconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    setTimerMinutes(minutes);
    setTimerSeconds(seconds);
  };

  // Handle app state changes (background/foreground)
  const handleAppStateChange = useCallback((nextAppState) => {
    if (
      appStateRef.current.match(/inactive|background/) && 
      nextAppState === "active" && 
      expiryTimeRef.current
    ) {
      // App has come back to foreground - update timer based on current time
      updateTimerFromExpiryDate(expiryTimeRef.current);
    }
    appStateRef.current = nextAppState;
  }, []);

  // Setup app state change listener
  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  // Set up countdown timer that updates every second
  useEffect(() => {
    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    if (expiryTimeRef.current) {
      timerIntervalRef.current = setInterval(() => {
        updateTimerFromExpiryDate(expiryTimeRef.current);
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [expiryTimeRef.current]);

  // Fetch cart when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCart();
      // If we have an expiry time, update the timer immediately
      if (expiryTimeRef.current) {
        updateTimerFromExpiryDate(expiryTimeRef.current);
      }
      return () => {}; // Cleanup function
    }, [loadCart])
  );

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadCart();
  };

  // Handle updating item quantity
  const handleUpdateQuantity = async (cartItemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }

    try {
      // Add this item to processing items
      setProcessingItems(prev => [...prev, cartItemId]);
      
      const updatedCart = await updateCartItemQuantity(user.id, cartItemId, newQuantity, token);
      setCart(updatedCart);
      
      // Update expiry time reference and timer
      if (updatedCart && updatedCart.expiresAt) {
        const expiryDate = new Date(updatedCart.expiresAt);
        expiryTimeRef.current = expiryDate;
        updateTimerFromExpiryDate(expiryDate);
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      const errorMsg = err.response?.data || 'Failed to update quantity';
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: errorMsg,
      });
    } finally {
      // Remove this item from processing items
      setProcessingItems(prev => prev.filter(id => id !== cartItemId));
    }
  };

  // Handle removing an item
  const handleRemoveItem = async (cartItemId) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Add this item to processing items
              setProcessingItems(prev => [...prev, cartItemId]);
              
              const updatedCart = await removeCartItem(user.id, cartItemId, token);
              
              // Update cart with the new data
              setCart(updatedCart);
              
              // Update expiry time reference and timer
              if (updatedCart && updatedCart.expiresAt) {
                const expiryDate = new Date(updatedCart.expiresAt);
                expiryTimeRef.current = expiryDate;
                updateTimerFromExpiryDate(expiryDate);
              }
              
              Toast.show({
                type: 'success',
                text1: 'Item removed from cart',
              });
            } catch (err) {
              console.error('Error removing item:', err);
              const errorMsg = err.response?.data || 'Failed to remove item';
              Toast.show({
                type: 'error',
                text1: 'Failed to remove item',
                text2: errorMsg,
              });
            } finally {
              // Remove this item from processing items
              setProcessingItems(prev => prev.filter(id => id !== cartItemId));
            }
          }
        }
      ]
    );
  };

  // Handle clearing cart
  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear your cart? This will remove all items.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              const emptyCart = await clearCart(user.id, token);
              
              // Reset cart and timer
              setCart(emptyCart);
              expiryTimeRef.current = null;
              setTimerMinutes(0);
              setTimerSeconds(0);
              
              Toast.show({
                type: 'success',
                text1: 'Cart cleared',
              });
            } catch (err) {
              console.error('Error clearing cart:', err);
              const errorMsg = err.response?.data || 'Failed to clear cart';
              Toast.show({
                type: 'error',
                text1: 'Failed to clear cart',
                text2: errorMsg,
              });
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  // Handle applying discount
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please enter a discount code',
      });
      return;
    }
    
    try {
      setProcessing(true);
      // This would typically communicate with an API
      // Example API call (you'll need to implement the actual endpoint)
      /*
      const response = await axios.post(
        `${API_URL}/api/cart/${user.id}/discount`,
        { code: discountCode },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      setCart(response.data);
      */
      
      // For now, just show a toast
      Toast.show({
        type: 'info',
        text1: 'Discount code applied',
        text2: `Code "${discountCode}" applied to your cart`,
      });
      
      // Clear the discount code field
      setDiscountCode('');
    } catch (err) {
      console.error('Error applying discount:', err);
      Toast.show({
        type: 'error',
        text1: 'Failed to apply discount',
        text2: err.response?.data?.message || 'Please try again',
      });
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle proceeding to checkout
  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Cart is empty',
        text2: 'Please add items to your cart before checkout',
      });
      return;
    }
    
    // Format cart items for the checkout screen
    const formattedItems = cart.items.map(item => ({
      id: item.productId || item.packId,
      name: item.name,
      price: item.prixApplique || item.unitPrice,
      quantity: item.quantity,
      imageUrl: item.imageUrl
    }));
    
    navigation.navigate('Checkout', { 
      cartItems: formattedItems, 
      cartTotal: cart.total,
      cartId: cart.cartId 
    });
  };
  
  // Render cart item
  const renderCartItem = ({ item, index }) => {
    const imageUri = item.imageUrl 
      ? `${API_URL}/uploads/${item.imageUrl}`
      : `https://via.placeholder.com/150?text=${encodeURIComponent(item.name)}`;
    
    // Check if this item is currently being processed
    const isProcessing = processingItems.includes(item.cartItemId);

    // Get price information based on user role and promotion
    const getPromotionInfo = () => {
      // Base price is unitPrice
      const basePrice = parseFloat(item.unitPrice || 0);
      if (!basePrice) {
        return {
          basePrice: 0,
          appliedPrice: 0,
          discount: 0,
          isDiscount: false,
          isMarkup: false
        };
      }
      
      // First priority: check for server-calculated price (prixApplique)
      if (item.prixApplique !== undefined && item.prixApplique !== null && parseFloat(item.prixApplique) > 0) {
        const appliedPrice = parseFloat(item.prixApplique);
        
        if (Math.abs(appliedPrice - basePrice) > 0.01) {
          const isDiscount = appliedPrice < basePrice;
          const discountPercent = isDiscount 
            ? ((basePrice - appliedPrice) / basePrice * 100)
            : ((appliedPrice - basePrice) / basePrice * 100);
          
          return {
            basePrice,
            appliedPrice,
            discount: discountPercent,
            isDiscount,
            isMarkup: !isDiscount
          };
        }
      }
      
      // Second priority: Calculate based on promotion fields and user type
      // Check if user is a partner based on type property
      const isPartner = user?.type === 'Partner';
      
      if (isPartner && item.promotionPartenaire !== undefined && item.promotionPartenaire !== null) {
        const partnerPromo = parseFloat(item.promotionPartenaire);
        
        // Partner pricing calculation
        if (partnerPromo > 1) {
          // Markup
          const appliedPrice = basePrice * partnerPromo;
          const markupPercent = (partnerPromo - 1) * 100;
          
          return {
            basePrice,
            appliedPrice,
            discount: markupPercent,
            isDiscount: false,
            isMarkup: true
          };
        } else if (partnerPromo > 0) {
          // Discount
          const appliedPrice = basePrice * (1 - partnerPromo);
          const discountPercent = partnerPromo * 100;
          
          return {
            basePrice,
            appliedPrice,
            discount: discountPercent,
            isDiscount: true,
            isMarkup: false
          };
        }
      }
      
      // Third priority: Regular customer discount
      if (!isPartner && item.promotionParticulier !== undefined && item.promotionParticulier !== null) {
        const individualPromo = parseFloat(item.promotionParticulier);
        
        if (individualPromo > 0) {
          const appliedPrice = basePrice * (1 - individualPromo);
          const discountPercent = individualPromo * 100;
          
          return {
            basePrice,
            appliedPrice,
            discount: discountPercent,
            isDiscount: true,
            isMarkup: false
          };
        }
      }
      
      // No promotion
      return {
        basePrice,
        appliedPrice: basePrice,
        discount: 0,
        isDiscount: false,
        isMarkup: false
      };
    };
  
    const priceInfo = getPromotionInfo();
    const hasPromotion = priceInfo.isDiscount || priceInfo.isMarkup;
    const displayPrice = priceInfo.appliedPrice.toFixed(2);
    const displayOriginalPrice = priceInfo.basePrice.toFixed(2);
    const displayDiscount = Math.round(priceInfo.discount);
    const subtotal = (priceInfo.appliedPrice * item.quantity).toFixed(2);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(400)}
        exiting={FadeOutDown.duration(300)}
        style={[
          styles.cartItemContainer, 
          isProcessing && styles.processingItem
        ]}>
        <View style={styles.cartItem}>
          {/* Item Image */}
          <Image 
            source={{ uri: imageUri }}
            style={styles.itemImage}
            resizeMode="cover"
          />
          
          {/* Item Details */}
          <View style={styles.itemDetails}>
            <View style={styles.itemHeader}>
              <Typo size={16} weight="500" style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Typo>
              
              <TouchableOpacity 
                onPress={() => handleRemoveItem(item.cartItemId)}
                disabled={isProcessing}
                style={[styles.removeButton, isProcessing && styles.disabledButton]}
              >
                <MaterialIcons 
                  name="delete-outline" 
                  size={22} 
                  color={isProcessing ? colors.lightGray : colors.gray} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Price display - show promotion if applicable */}
            <View style={styles.priceRow}>
              {hasPromotion ? (
                <View>
                  <View style={styles.priceWithBadge}>
                    <Typo size={16} weight="600" style={[
                      styles.itemPrice,
                      { color: priceInfo.isDiscount ? colors.green : colors.orange }
                    ]}>
                      {displayPrice} TND
                    </Typo>
                    
                    <View style={[
                      styles.promotionBadge,
                      { backgroundColor: priceInfo.isDiscount ? colors.green : colors.orange }
                    ]}>
                      <Typo size={10} style={styles.promotionText}>
                        {priceInfo.isDiscount ? `-${displayDiscount}%` : `+${displayDiscount}%`}
                      </Typo>
                    </View>
                  </View>
                  
                  <Typo size={12} style={styles.originalPrice}>
                    {displayOriginalPrice} TND
                  </Typo>
                </View>
              ) : (
                <Typo size={16} weight="600" style={styles.itemPrice}>
                  {displayPrice} TND
                </Typo>
              )}
              
              {item.stockRemaining <= 5 && (
                <Typo size={12} style={styles.lowStock}>
                  Only {item.stockRemaining} left
                </Typo>
              )}
            </View>
            
            {/* Quantity Controls */}
            <View style={styles.quantityControl}>
              <TouchableOpacity 
                style={[
                  styles.quantityButton, 
                  (item.quantity <= 1 || isProcessing) && styles.disabledButton
                ]}
                onPress={() => handleUpdateQuantity(item.cartItemId, item.quantity, -1)}
                disabled={isProcessing || item.quantity <= 1}
              >
                <AntDesign 
                  name="minus" 
                  size={16} 
                  color={(item.quantity <= 1 || isProcessing) ? colors.lightGray : colors.dark} 
                />
              </TouchableOpacity>
              
              <View style={styles.quantityDisplay}>
                <Typo size={16} weight="500">
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    item.quantity
                  )}
                </Typo>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.quantityButton, 
                  (item.stockRemaining <= 0 || isProcessing) && styles.disabledButton
                ]}
                onPress={() => handleUpdateQuantity(item.cartItemId, item.quantity, 1)}
                disabled={isProcessing || item.stockRemaining <= 0}
              >
                <AntDesign 
                  name="plus" 
                  size={16} 
                  color={(item.stockRemaining <= 0 || isProcessing) ? colors.lightGray : colors.dark} 
                />
              </TouchableOpacity>
              
              <Typo size={16} weight="600" style={styles.subtotal}>
                {subtotal} TND
              </Typo>
            </View>
          </View>
        </View>
        
        {/* Item-specific loading overlay */}
        {isProcessing && (
          <View style={styles.itemProcessingOverlay}>
            <ActivityIndicator size="small" color={colors.white} />
          </View>
        )}
      </Animated.View>
    );
  };
  
  // Helper component for price rows
  const Row = ({ title, price, isBold }) => {
    return (
      <View style={styles.row}>
        <Typo
          size={15}
          style={{ 
            color: isBold ? colors.black : colors.gray, 
            fontWeight: isBold ? '600' : '500' 
          }}>
          {title}
        </Typo>
        <Typo size={18} style={{ fontWeight: isBold ? '700' : '600' }}>
          {price}
        </Typo>
      </View>
    );
  };
  
  // Loading State
  if (loading && !cart) {
    return (
      <ScreenComponent style={styles.container}>
        <Header label="My Cart" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typo style={{ marginTop: 20 }}>Loading your cart...</Typo>
        </View>
      </ScreenComponent>
    );
  }
  
  // Error State
  if (error && !cart) {
    return (
      <ScreenComponent style={styles.container}>
        <Header label="My Cart" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.danger} />
          <Typo size={18} style={styles.errorText}>{error}</Typo>
          <TouchableOpacity style={styles.retryButton} onPress={loadCart}>
            <Typo style={styles.retryButtonText}>Retry</Typo>
          </TouchableOpacity>
        </View>
      </ScreenComponent>
    );
  }

  // Empty Cart
  if (!cart || cart.items.length === 0) {
    return (
      <ScreenComponent style={styles.container}>
        <Header label="My Cart" />
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={colors.gray} />
          <Typo size={18} weight="500" style={styles.emptyText}>Your cart is empty</Typo>
          <Typo size={16} style={styles.emptySubtext}>
            Looks like you haven't added any products to your cart yet.
          </Typo>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Typo size={16} weight="600" style={styles.shopButtonText}>
              Start Shopping
            </Typo>
          </TouchableOpacity>
        </View>
      </ScreenComponent>
    );
  }

  return (
    <ScreenComponent style={styles.container}>
      <Header 
        label="My Cart" 
        rightComponent={
          <TouchableOpacity onPress={handleClearCart} disabled={processing}>
            <Typo size={14} style={{ color: colors.danger }}>Clear All</Typo>
          </TouchableOpacity>
        }
      />
      
      {/* Reservation Timer */}
      {(timerMinutes > 0 || timerSeconds > 0) && (
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={20} color={colors.warning} />
          <Typo size={14} style={styles.timerText}>
            Items reserved for {formatTime(timerMinutes, timerSeconds)}
          </Typo>
        </View>
      )}
      
      {/* Main content with FlatList */}
      <View style={styles.contentContainer}>
        <FlatList
          data={cart.items}
          keyExtractor={(item) => item.cartItemId.toString()}
          renderItem={renderCartItem}
          contentContainerStyle={styles.listContentContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Typo>Your cart is empty</Typo>
            </View>
          }
        />
      </View>
      
      {/* Fixed Checkout Section - adjusted to be higher than bottom tab bar */}
      <View style={styles.checkoutContainerWrapper}>
        <View style={styles.checkoutContainer}>
          <View style={styles.priceSummary}>
            <Row title="Subtotal" price={`${cart.total.toFixed(2)} TND`} />
            <View style={styles.separator} />
            <Row title="Total" price={`${cart.total.toFixed(2)} TND`} isBold />
          </View>
          <AppButton 
            label="Checkout" 
            onPress={handleCheckout}
            disabled={processing}
          />
        </View>
      </View>
      
      {/* Processing Overlay */}
      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      )}
    </ScreenComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grayBG,
  },
  contentContainer: {
    flex: 1,
    marginBottom: 180, // Space for the checkout container
  },
  listContentContainer: {
    padding: spacingX._20,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._20,
  },
  checkoutContainerWrapper: {
    position: 'absolute',
    bottom: 60, // Increased bottom position to avoid tab bar overlap
    left: 0,
    right: 0,
    zIndex: 10,
  },
  checkoutContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._20,
    borderTopRightRadius: radius._20,
    shadowColor: colors.black,
    shadowOffset: { height: -2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    padding: spacingX._20,
    paddingBottom: spacingY._20,
    elevation: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 20,
    color: colors.danger,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    textAlign: 'center',
    color: colors.gray,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  shopButtonText: {
    color: colors.white,
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
  },
  cartItemContainer: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
    position: 'relative', // For positioning the overlay
  },
  processingItem: {
    opacity: 0.7,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    flex: 1,
    marginRight: 5,
  },
  removeButton: {
    padding: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    justifyContent: 'space-between',
  },
  priceWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    color: colors.primary,
  },
  originalPrice: {
    color: colors.gray,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  promotionBadge: {
    paddingHorizontal: spacingX._6,
    paddingVertical: spacingY._2,
    borderRadius: 10,
    marginLeft: 5,
  },
  promotionText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  lowStock: {
    color: colors.danger,
    marginLeft: 10,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  quantityButton: {
    width: 30,
    height: 30,
    backgroundColor: colors.lighterGray,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  quantityDisplay: {
    paddingHorizontal: 15,
    minWidth: 40,
    alignItems: 'center',
  },
  subtotal: {
    marginLeft: 'auto',
    color: colors.dark,
  },
  priceSummary: {
    marginBottom: 15,
  },
  row: {
    height: height.btn / 1.5,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  separator: {
    height: normalizeY(1),
    width: '100%',
    backgroundColor: colors.grayBG,
    marginVertical: 5,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: 12,
    marginHorizontal: spacingX._20,
    marginTop: spacingY._10,
    borderRadius: 8,
  },
  timerText: {
    color: colors.warning,
    marginLeft: 8,
    fontWeight: '500',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  itemProcessingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 10,
  },
});

export default CartScreen;