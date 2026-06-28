import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from 'config/api';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import React, { useState, memo, useEffect } from 'react';
import {
  Dimensions,
  Image,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Typo from './Typo';
import { normalizeX, normalizeY } from 'utils/normalize';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useQueryClient } from 'react-query';
import { trackWishlist } from '../utils/RecommendationUtils';
import { useCart } from './CartContext';

const { width } = Dimensions.get('screen');
const CARD_WIDTH = width / 2 - spacingX._25;

const ProductCard = memo(({
  item,
  favoritesData,
  refetchFavorites,
  onPress,
}) => {
  const navigation = useNavigation();
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const queryClient = useQueryClient();
  const isPartner = user?.roles?.includes('ROLE_USERPARTNER');

  useEffect(() => {
    if (favoritesData && Array.isArray(favoritesData)) {
      const isInFavorites = favoritesData.some(
        (fav) =>
          fav.productId === item.id ||
          fav.produitId === item.id ||
          fav.productId?.toString() === item.id?.toString() ||
          fav.produitId?.toString() === item.id?.toString()
      );
      setIsFavorite(isInFavorites);
    }
  }, [favoritesData, item?.id]);

  const toggleFavorite = async () => {
    if (!token) {
      Alert.alert('Login Required', 'Please log in to save items to your wishlist.');
      return;
    }
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      if (isFavorite) {
        await axios.delete(`${API_URL}/api/favorites/products/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorite(false);
        Toast.show({ type: 'success', text1: 'Removed from wishlist', position: 'bottom' });
      } else {
        await axios.post(`${API_URL}/api/favorites/products/${item.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorite(true);
        if (user) trackWishlist(user.id, item.id);
        Toast.show({ type: 'success', text1: 'Added to wishlist', position: 'bottom' });
      }
      queryClient.invalidateQueries('favorites');
      refetchFavorites?.();
    } catch (error) {
      Alert.alert("Couldn't update wishlist", 'Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProductPress = () => {
    if (onPress) onPress(item);
    else navigation.navigate('ItemDetails', item);
  };

  // ==================== PROMOTION LOGIC ====================
  const getPromotionInfo = () => {
    if (!item.prix) {
      return {
        originalPrice: item.price || '0.00 TND',
        finalPrice: item.price || '0.00 TND',
        percentage: '0%',
        isDiscount: false,
        isMarkup: false,
      };
    }

    const basePrice = parseFloat(item.prix);

    if (isPartner && item.promotionPartenaire != null) {
      const partnerPromo = parseFloat(item.promotionPartenaire);
      if (partnerPromo > 1) {
        const finalPrice = basePrice * partnerPromo;
        return {
          originalPrice: `${basePrice.toFixed(2)} TND`,
          finalPrice: `${finalPrice.toFixed(2)} TND`,
          percentage: `${((partnerPromo - 1) * 100).toFixed(0)}%`,
          isDiscount: false,
          isMarkup: true,
        };
      }
      if (partnerPromo > 0) {
        const finalPrice = basePrice * (1 - partnerPromo);
        return {
          originalPrice: `${basePrice.toFixed(2)} TND`,
          finalPrice: `${finalPrice.toFixed(2)} TND`,
          percentage: `${(partnerPromo * 100).toFixed(0)}%`,
          isDiscount: true,
          isMarkup: false,
        };
      }
    }

    if (item.promotionParticulier != null) {
      const individualPromo = parseFloat(item.promotionParticulier);
      if (individualPromo > 0) {
        const finalPrice = basePrice * (1 - individualPromo);
        return {
          originalPrice: `${basePrice.toFixed(2)} TND`,
          finalPrice: `${finalPrice.toFixed(2)} TND`,
          percentage: `${(individualPromo * 100).toFixed(0)}%`,
          isDiscount: true,
          isMarkup: false,
        };
      }
    }

    return {
      originalPrice: `${basePrice.toFixed(2)} TND`,
      finalPrice: `${basePrice.toFixed(2)} TND`,
      percentage: '0%',
      isDiscount: false,
      isMarkup: false,
    };
  };

  const promotionInfo = getPromotionInfo();
  const hasPromotion = promotionInfo.isDiscount || promotionInfo.isMarkup;

  return (
    <TouchableOpacity style={styles.container} onPress={handleProductPress} activeOpacity={0.85}>
      <View style={styles.imageWrapper}>
        {isImageLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
        <Image
          source={imageError ? require('../assets/products/item1.png') : item.url}
          style={styles.img}
          onLoadStart={() => setIsImageLoading(true)}
          onLoadEnd={() => setIsImageLoading(false)}
          onError={() => {
            setImageError(true);
            setIsImageLoading(false);
          }}
        />

        {hasPromotion && (
          <View style={styles.saleBadge}>
            <Typo size={10} weight="700" style={styles.saleBadgeText}>
              {promotionInfo.isDiscount ? `-${promotionInfo.percentage}` : `+${promotionInfo.percentage}`}
            </Typo>
          </View>
        )}

        <TouchableOpacity
          style={[styles.heartBtn, isFavorite && styles.heartBtnActive]}
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={isFavorite ? colors.white : colors.primary} />
          ) : (
            <FontAwesome5 name="heart" solid={isFavorite} size={13} color={isFavorite ? colors.white : colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        {item.category ? (
          <Typo size={10} weight="500" style={styles.category} numberOfLines={1}>
            {item.category.toUpperCase()}
          </Typo>
        ) : null}

        <Typo size={14} weight="600" style={styles.name} numberOfLines={2}>
          {item.name}
        </Typo>

        <View style={styles.priceRowContainer}>
          <View style={styles.priceTextWrapper}>
            {hasPromotion ? (
              <>
                <Typo size={15} weight="700" style={styles.finalPrice}>
                  {promotionInfo.finalPrice}
                </Typo>
                <Typo size={11} style={styles.originalPrice}>
                  {promotionInfo.originalPrice}
                </Typo>
              </>
            ) : (
              <Typo size={15} weight="700" style={styles.finalPrice}>
                {item.price}
              </Typo>
            )}
          </View>

          {item.available && (
            <TouchableOpacity
              style={styles.addCartBtn}
              onPress={(e) => {
                e.stopPropagation();
                addToCart(item, 1);
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addCartGradient}
              >
                <FontAwesome5 name="plus" size={11} color={colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: radius._16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  imageWrapper: {
    width: '100%',
    height: normalizeY(210),
    backgroundColor: colors.offWhite,
    position: 'relative',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  img: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  saleBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#111111',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius._6,
    zIndex: 3,
  },
  saleBadgeText: {
    color: colors.white,
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white90,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  heartBtnActive: {
    backgroundColor: colors.primary,
  },

  infoSection: {
    paddingHorizontal: spacingX._14,
    paddingTop: spacingY._12,
    paddingBottom: spacingY._16,        // Better spacing
  },
  category: {
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  name: {
    color: colors.text,
    lineHeight: normalizeY(19),
    marginBottom: spacingY._8,
  },
  priceRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceTextWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacingX._6,
  },
  finalPrice: {
    color: colors.text,
  },
  originalPrice: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  addCartBtn: {
    borderRadius: radius._15,
    overflow: 'hidden',
  },
  addCartGradient: {
    width: normalizeY(32),
    height: normalizeY(32),
    borderRadius: normalizeY(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProductCard;