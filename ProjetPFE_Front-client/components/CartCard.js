import React, { useState } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { MaterialCommunityIcons, MaterialIcons, AntDesign } from '@expo/vector-icons';
import colors from 'config/colors';
import { View, Image, Dimensions, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Typo from './Typo';
import { normalizeX, normalizeY } from 'utils/normalize';
import { spacingY, spacingX } from 'config/spacing';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { calculateAppliedPrice } from '../utils/CartUtils';

const { width } = Dimensions.get('screen');

function CartCard({ item, onRemove, onUpdateQuantity }) {
  const imgSize = width * 0.2;
  const { user, token } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Check if user is a partner
  const isPartner = user?.roles?.includes("ROLE_USERPARTNER");


  // Image source handling
  const imageSource = (() => {
    if (item.imageUrl) {
      return { uri: `${API_URL}/uploads/${item.imageUrl}` };
    } else if (item.url && typeof item.url === 'string' && item.url.startsWith('http')) {
      return { uri: item.url };
    } else if (item.url) {
      return item.url;
    } else {
      return require('../assets/products/item1.png');
    }
  })();

  // Calculate promotion price based on user role
  const getPromotionInfo = () => {
    // Base price is unitPrice
    const basePrice = parseFloat(item.unitPrice || 0);
    if (!basePrice) {
      return {
        originalPrice: '$0.00',
        finalPrice: '$0.00',
        percentage: '0%',
        isDiscount: false,
        isMarkup: false
      };
    }
    
    // First priority: check for server-calculated price (prixApplique)
    if (item.prixApplique !== undefined && item.prixApplique !== null && parseFloat(item.prixApplique) > 0) {
      const appliedPrice = parseFloat(item.prixApplique);
      
      if (Math.abs(appliedPrice - basePrice) > 0.01) {
        const isDiscount = appliedPrice < basePrice;
        const percentDiff = isDiscount 
          ? ((basePrice - appliedPrice) / basePrice * 100).toFixed(0)
          : ((appliedPrice - basePrice) / basePrice * 100).toFixed(0);
        
        return {
          originalPrice: `$${basePrice.toFixed(2)}`,
          finalPrice: `$${appliedPrice.toFixed(2)}`,
          percentage: `${percentDiff}%`,
          isDiscount: isDiscount,
          isMarkup: !isDiscount
        };
      }
    }
    
    // Second priority: Calculate based on promotion fields
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
          isMarkup: true
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
          isMarkup: false
        };
      }
    }
    
    // Third priority: Regular customer discount
    if (!isPartner && item.promotionParticulier !== undefined && item.promotionParticulier !== null) {
      const individualPromo = parseFloat(item.promotionParticulier);
      
      if (individualPromo > 0) {
        const finalPrice = basePrice * (1 - individualPromo);
        const percentage = (individualPromo * 100).toFixed(0);
        
        return {
          originalPrice: `$${basePrice.toFixed(2)}`,
          finalPrice: `$${finalPrice.toFixed(2)}`,
          percentage: `${percentage}%`,
          isDiscount: true,
          isMarkup: false
        };
      }
    }
    
    // No promotion
    return {
      originalPrice: `$${basePrice.toFixed(2)}`,
      finalPrice: `$${basePrice.toFixed(2)}`,
      percentage: '0%',
      isDiscount: false,
      isMarkup: false
    };
  };

  const promotionInfo = getPromotionInfo();
  const hasPromotion = promotionInfo.isDiscount || promotionInfo.isMarkup;

  // Calculate item subtotal using final price
  const calculateSubtotal = () => {
    const quantity = item.quantity || 1;
    // Remove '$' from the finalPrice string and convert to number
    const priceValue = parseFloat(promotionInfo.finalPrice.replace('$', ''));
    const subtotal = priceValue * quantity;
    return `$${subtotal.toFixed(2)}`;
  };

  // Handle quantity change
  const handleQuantityChange = async (newQuantity) => {
    if (isUpdating) return;
    
    if (newQuantity <= 0) {
      handleRemoveItem();
      return;
    }
    
    // Make sure we don't exceed available stock
    const maxQuantity = item.stockRemaining || 10;
    if (newQuantity > maxQuantity) {
      Toast.show({
        type: 'error',
        text1: 'Maximum quantity reached',
        text2: `Only ${maxQuantity} items available in stock`,
      });
      return;
    }
    
    try {
      setIsUpdating(true);
      
      // Call API to update cart item quantity
      await axios.put(`${API_URL}/api/cart/${user.id}/items/${item.cartItemId}?quantity=${newQuantity}`, 
        null,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Call the parent component's update function
      if (onUpdateQuantity) {
        onUpdateQuantity(item.cartItemId, newQuantity);
      }
      
    } catch (error) {
      console.error('Failed to update quantity:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update quantity',
        text2: error.response?.data?.message || 'Please try again later',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle remove item
  const handleRemoveItem = async () => {
    if (isRemoving) return;
    
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            try {
              setIsRemoving(true);
              
              // Call API to remove item from cart
              await axios.delete(`${API_URL}/api/cart/${user.id}/items/${item.cartItemId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              // Call the parent component's remove function
              if (onRemove) {
                onRemove(item.cartItemId);
              }
              
              Toast.show({
                type: 'success',
                text1: 'Item removed from cart',
              });
            } catch (error) {
              console.error('Failed to remove item:', error);
              Toast.show({
                type: 'error',
                text1: 'Failed to remove item',
                text2: error.response?.data?.message || 'Please try again later',
              });
            } finally {
              setIsRemoving(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.imgContainer}>
        <Image
          source={imageSource}
          resizeMode="contain"
          style={{
            width: imgSize,
            height: imgSize,
          }}
        />
      </View>
      
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View style={styles.row}>
          <Typo size={17} style={{ fontWeight: 'bold', flex: 1 }} numberOfLines={1}>
            {item.name}
          </Typo>
          <TouchableOpacity 
            onPress={handleRemoveItem}
            disabled={isRemoving}
            style={styles.deleteButton}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialIcons name="delete-outline" size={normalizeY(24)} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        
        <Typo style={styles.catText}>
          {item.type === 'PACK' ? 'Pack' : (item.category || 'Product')}
        </Typo>
        
        {/* Price section with promotion display */}
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            {hasPromotion ? (
              <View>
                <View style={styles.discountRow}>
                  <Typo style={[
                    styles.finalPrice, 
                    { color: promotionInfo.isDiscount ? colors.green : colors.orange }
                  ]}>
                    {promotionInfo.finalPrice}
                  </Typo>
                  
                  <View style={[
                    styles.promoBadge,
                    { backgroundColor: promotionInfo.isDiscount ? colors.green : colors.orange }
                  ]}>
                    <Typo size={10} style={styles.promoText}>
                      {promotionInfo.isDiscount ? `-${promotionInfo.percentage}` : `+${promotionInfo.percentage}`}
                    </Typo>
                  </View>
                </View>
                
                <Typo size={12} style={styles.originalPrice}>
                  {promotionInfo.originalPrice}
                </Typo>
              </View>
            ) : (
              <Typo style={styles.finalPrice}>
                {promotionInfo.finalPrice}
              </Typo>
            )}
          </View>
          
          <View style={styles.countContainer}>
            {isUpdating ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
            ) : (
              <>
                <TouchableOpacity 
                  onPress={() => handleQuantityChange(item.quantity - 1)}
                  style={styles.quantityButton}
                >
                  <Typo style={styles.quantityText}>-</Typo>
                </TouchableOpacity>
                
                <Typo style={styles.quantityValue}>{item.quantity || 1}</Typo>
                
                <TouchableOpacity 
                  onPress={() => handleQuantityChange(item.quantity + 1)}
                  style={styles.quantityButton}
                >
                  <Typo style={styles.quantityText}>+</Typo>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        {/* Subtotal */}
        <View style={styles.subtotalRow}>
          <Typo size={12} style={styles.subtotalLabel}>Subtotal:</Typo>
          <Typo style={styles.subtotalValue}>{calculateSubtotal()}</Typo>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: normalizeY(17),
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    padding: normalizeY(15),
    borderRadius: normalizeY(12),
    gap: normalizeX(10),
  },
  imgContainer: {
    padding: spacingY._10,
    backgroundColor: colors.lighterGray,
    borderRadius: normalizeY(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacingY._5,
  },
  priceContainer: {
    flex: 1,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  finalPrice: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  originalPrice: {
    color: colors.gray,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  promoBadge: {
    paddingHorizontal: spacingX._6,
    paddingVertical: spacingY._2,
    borderRadius: normalizeY(10),
    marginLeft: spacingX._5,
  },
  promoText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  catText: {
    color: colors.lightGray,
    fontWeight: 'bold',
    marginBottom: normalizeY(3),
  },
  countContainer: {
    backgroundColor: colors.grayBG,
    minWidth: '35%',
    height: normalizeY(30),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: normalizeY(20),
    paddingHorizontal: spacingX._5,
  },
  quantityButton: {
    width: normalizeX(30),
    height: normalizeY(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  quantityValue: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteButton: {
    padding: 5,
  },
  spinner: {
    padding: 5,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacingY._5,
  },
  subtotalLabel: {
    color: colors.gray,
  },
  subtotalValue: {
    fontWeight: 'bold',
    marginLeft: spacingX._5,
  },
});

export default CartCard;