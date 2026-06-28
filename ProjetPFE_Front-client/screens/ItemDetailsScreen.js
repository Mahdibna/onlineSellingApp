import React, { useState, useMemo, useEffect, useRef } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import {
  View,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from 'react-query';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import Typo from 'components/Typo';
import ItemImageSlider from 'components/ItemImageSlider';
import ScreenComponent from '../components/ScreenComponent';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import { normalizeX, normalizeY } from 'utils/normalize';
import { useAuth } from '../auth/AuthContext';
import { addToCart } from '../utils/CartUtils';
import EnhancedReviewsSection from '../components/EnhancedReviewsSection';
import ProductRecommendations from 'components/ProductRecommendations';
import { trackProductView, trackAddToCart, trackWishlist } from 'utils/RecommendationUtils';

const { height, width } = Dimensions.get('screen');

// Constants
const ICON_SIZE = normalizeX(18);
const BUTTON_HEIGHT = normalizeY(40);
const BORDER_RADIUS = radius._15;

// Custom Add to Cart Button Component
const CartButton = ({ onPress, label, isDisabled = false, isLoading = false, style }) => {
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isDisabled && !isLoading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isDisabled, isLoading]);

  const handlePressIn = () => {
    Animated.timing(buttonScaleAnim, {
      toValue: 0.97,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(buttonScaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }).start();
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: buttonScaleAnim }, { scale: pulseAnim }] },
        styles.cartButtonContainer,
        style,
        isDisabled && styles.cartButtonDisabled,
      ]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={isDisabled || isLoading}
        activeOpacity={0.8}
        style={styles.cartButtonTouchable}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled || isLoading }}>
        <LinearGradient
          colors={
            isDisabled || isLoading
              ? [colors.lightGray, colors.lightGray]
              : [colors.gradientStart, colors.gradientEnd]
          }
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            styles.cartButtonInner,
            isDisabled || isLoading ? styles.cartButtonDisabledInner : styles.cartButtonEnabledInner,
          ]}
        >
          <View style={styles.cartButtonContent}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} style={styles.buttonLoader} />
            ) : (
              <AntDesign name="shoppingcart" size={18} color={colors.white} style={styles.cartIcon} />
            )}
            <Typo style={styles.cartButtonText} size={16} weight="700">
              {label}
            </Typo>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

function ItemDetailsScreen({ route, navigation }) {
  const item = route.params;
  const [quantity, setQuantity] = useState(1);
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Description');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const quantityButtonScale = useRef(new Animated.Value(1)).current;

  const isPartner = user?.roles?.includes('ROLE_USERPARTNER');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adding, setAdding] = useState(false);

  const scrollViewRef = useRef(null);

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // Query for product details
  const {
    data: productDetails,
    isLoading,
    error,
  } = useQuery(
    ['productDetails', item.id],
    async () => {
      const response = await axios.get(`${API_URL}/api/products/${item.id}`, {
        headers: getHeaders(),
      });
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000,
      initialData: item,
      enabled: !!item?.id,
      onError: (err) => {
        console.error('Error fetching product details:', err);
      },
    }
  );

  // Query for favorites
  const {
    data: favoritesData,
    refetch: refetchFavorites,
    isError: isFavoritesError,
  } = useQuery(
    'favorites',
    async () => {
      if (!token) return [];
      try {
        const response = await axios.get(`${API_URL}/api/favorites`, {
          headers: getHeaders(),
        });
        return response.data || [];
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('User session expired or unauthorized for favorites');
          return [];
        }
        throw error;
      }
    },
    {
      enabled: !!token,
      staleTime: 60 * 1000,
      retry: (failureCount, error) => error.response?.status !== 401 && failureCount < 2,
      onError: (err) => {
        console.error('Error fetching favorites:', err);
      },
    }
  );

  // Query for reviews
  const {
    data: reviews,
    isLoading: isLoadingReviews,
    refetch: refetchReviews,
  } = useQuery(
    ['productReviews', item.id],
    async () => {
      try {
        const response = await axios.get(`${API_URL}/api/Products/${item.id}/reviews`, {
          headers: token ? getHeaders() : undefined,
        });
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching product reviews:', error);
        return [];
      }
    },
    {
      staleTime: 60 * 1000,
      enabled: !!item?.id,
    }
  );

  // Track product view
  useEffect(() => {
    if (user && item?.id) {
      trackProductView(user.id, item.id);
    }
  }, [user, item]);

  // Update favorite status
  useEffect(() => {
    if (token && Array.isArray(favoritesData)) {
      const isInFavorites = favoritesData.some(
        (fav) =>
          fav.productId === item.id ||
          fav.produitId === item.id ||
          fav.productId?.toString() === item.id?.toString() ||
          fav.produitId?.toString() === item.id?.toString()
      );
      setIsFavorite(isInFavorites);
    }
  }, [favoritesData, item?.id, token]);

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!token) {
      Toast.show({
        type: 'info',
        text1: 'Login Required',
        text2: 'Please log in to add items to your favorites',
        position: 'bottom',
      });
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    try {
      if (isFavorite) {
        await axios.delete(`${API_URL}/api/favorites/products/${item.id}`, {
          headers: getHeaders(),
        });
        setIsFavorite(false);
        Toast.show({
          type: 'success',
          text1: 'Removed from favorites',
          position: 'bottom',
        });
      } else {
        await axios.post(
          `${API_URL}/api/favorites/products/${item.id}`,
          {},
          {
            headers: getHeaders(),
          }
        );
        setIsFavorite(true);
        if (user) {
          trackWishlist(user.id, item.id);
        }
        Toast.show({
          type: 'success',
          text1: 'Added to favorites',
          position: 'bottom',
        });
      }
      queryClient.invalidateQueries('favorites');
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      Toast.show({
        type: 'error',
        text1: 'Could not update favorites',
        text2: 'Please try again later',
        position: 'bottom',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate promotion info
  const getPromotionInfo = useMemo(() => {
    if (!productDetails?.prix) {
      return {
        originalPrice: item.price || '0.00TND',
        finalPrice: item.price || '0.00TND',
        percentage: '0%',
        isDiscount: false,
        isMarkup: false,
      };
    }

    const basePrice = parseFloat(productDetails.prix);
    const originalPrice = `${basePrice.toFixed(2)} TND`;
    const finalPrice = item.price || originalPrice;

    if (isPartner && productDetails.promotionPartenaire != null) {
      const partnerPromo = parseFloat(productDetails.promotionPartenaire);
      if (partnerPromo > 1) {
        const calculatedPrice = basePrice * partnerPromo;
        const percentage = ((partnerPromo - 1) * 100).toFixed(0);
        return {
          originalPrice,
          finalPrice: `${calculatedPrice.toFixed(2)} TND`,
          percentage: `${percentage}%`,
          isDiscount: false,
          isMarkup: true,
        };
      } else if (partnerPromo > 0) {
        const calculatedPrice = basePrice * (1 - partnerPromo);
        const percentage = (partnerPromo * 100).toFixed(0);
        return {
          originalPrice,
          finalPrice: `${calculatedPrice.toFixed(2)} TND`,
          percentage: `${percentage}%`,
          isDiscount: true,
          isMarkup: false,
        };
      }
    }

    if (productDetails.promotionParticulier != null) {
      const individualPromo = parseFloat(productDetails.promotionParticulier);
      if (individualPromo > 0) {
        const calculatedPrice = basePrice * (1 - individualPromo);
        const percentage = (individualPromo * 100).toFixed(0);
        return {
          originalPrice,
          finalPrice: `${calculatedPrice.toFixed(2)} TND`,
          percentage: `${percentage}%`,
          isDiscount: true,
          isMarkup: false,
        };
      }
    }

    return {
      originalPrice,
      finalPrice,
      percentage: '0%',
      isDiscount: false,
      isMarkup: false,
    };
  }, [productDetails, isPartner, item.price]);

  const hasPromotion = getPromotionInfo.isDiscount || getPromotionInfo.isMarkup;
  const isAvailable = productDetails?.disponibilite || item.available;
  const maxQuantity = productDetails?.quantite || item.quantity || 10;

  // Animations
  const animateQuantityChange = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateQuantityButton = () => {
    Animated.sequence([
      Animated.timing(quantityButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(quantityButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const incrementQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
      animateQuantityChange();
      animateQuantityButton();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Maximum quantity reached',
        text2: `Only ${maxQuantity} items available in stock`,
      });
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      animateQuantityChange();
      animateQuantityButton();
    }
  };
  // Handle add to cart
  const handleAddToCart = async () => {
      console.log('TOKEN:', token);  
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Please sign in',
        text2: 'You need to be signed in to add items to your cart',
      });
      navigation.navigate('Signin');
      return;
    }

    if (!isAvailable) {
      Toast.show({
        type: 'error',
        text1: 'Product unavailable',
        text2: 'This item is currently out of stock',
      });
      return;
    }

    try {
      const currentUserId = user?.id ?? user?.userId;
      setAdding(true);
      await addToCart(currentUserId, item.id, null, quantity, token);
      await trackAddToCart(currentUserId, item.id).catch(() =>
        console.warn('Note: Recommendation tracking failed but item was added to cart')
      );
      Toast.show({
        type: 'success',
        text1: 'Added to cart',
        text2: `${productDetails?.nom || item.name} has been added to your cart`,
      });
      navigation.navigate('CartScreen');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to add to cart',
        text2: 'Please try again later',
      });
    } finally {
      setAdding(false);
    }
  };

  // Scroll to reviews
  const handleViewAllReviews = () => {
    setActiveTab('Reviews');
    scrollViewRef.current?.scrollTo({ y: normalizeY(400), animated: true });
  };

  // Memoized slider images
  const sliderImages = useMemo(() => {
    if (!productDetails) {
      return item.url ? [item.url] : [require('../assets/products/item1.png')];
    }
    if (Array.isArray(productDetails.photos) && productDetails.photos.length > 0) {
      return productDetails.photos.map((photo) => ({ uri: getUploadUrl(photo) }));
    }
    return productDetails.url ? [productDetails.url] : [require('../assets/products/item1.png')];
  }, [productDetails, item.url]);

  // Render star rating
  const renderStarRating = (rating) => {
    if (!Number.isFinite(rating) || rating === 0) return null;

    const clampedRating = Math.max(0, Math.min(5, rating));
    const fullStars = Math.floor(clampedRating);
    const hasHalfStar = clampedRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.starRatingContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <AntDesign key={`full-${i}`} name="star" size={16} color="#FFD700" />
        ))}
        {hasHalfStar && <AntDesign key="half" name="star" size={16} color="#FFD700" />}
        {[...Array(emptyStars)].map((_, i) => (
          <AntDesign key={`empty-${i}`} name="staro" size={16} color="#FFD700" />
        ))}
        <Typo size={14} style={styles.ratingText}>
          {clampedRating.toFixed(1)}
        </Typo>
      </View>
    );
  };

  // Render content based on active tab
  const renderContent = () => (
    <View style={styles.contentSection}>
      {activeTab === 'Description' ? (
        <>
          <Typo style={styles.descriptionText}>
            {productDetails?.description || 'Product description not available.'}
          </Typo>
          <EnhancedReviewsSection
            productId={item.id}
            reviews={reviews || []}
            isLoading={isLoadingReviews}
            compact
            onViewAllReviews={handleViewAllReviews}
            navigation={navigation}
          />
        </>
      ) : (
        <EnhancedReviewsSection
          productId={item.id}
          reviews={reviews || []}
          isLoading={isLoadingReviews}
          compact={false}
          onRefresh={refetchReviews}
          navigation={navigation}
        />
      )}
    </View>
  );

  // Tab selector component
 // Inside ItemDetailsScreen component
const TabSelector = () => (
  <View style={styles.tabsContainer}>
    {['Description', 'Reviews'].map((tab) => (
      <TouchableOpacity
        key={tab}
        style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
        onPress={() => setActiveTab(tab)}
      >
        <Typo
          style={[styles.tabText, activeTab === tab && styles.activeTabText]}
          weight={activeTab === tab ? '700' : '600'}
        >
          {tab}
        </Typo>
        {tab === 'Reviews' && reviews?.length > 0 && (
          <View style={styles.reviewCountBadge}>
            <Typo style={styles.reviewCountText}>{reviews.length}</Typo>
          </View>
        )}
      </TouchableOpacity>
    ))}
  </View>
);

  // Handle error state
  if (error && !productDetails) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Typo style={styles.errorText}>Failed to load product details. Please try again.</Typo>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Typo style={styles.goBackText}>Go Back</Typo>
        </TouchableOpacity>
      </View>
    );
  }

  // Handle loading state
  if (isLoading && !productDetails) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Typo style={styles.loadingText}>Loading product details...</Typo>
      </View>
    );
  }

  const averageRating = Number.isFinite(productDetails?.averageRating)
    ? productDetails.averageRating
    : Number.isFinite(item?.rating)
      ? item.rating
      : null;

  return (
    <ScreenComponent style={styles.container}>
      {/* Image Slider */}
      <ItemImageSlider images={sliderImages} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBg}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back-ios-new" size={ICON_SIZE} color="black" />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={[styles.iconBg, isFavorite && styles.heartActive]}
          onPress={toggleFavorite}
          disabled={isProcessing}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          accessibilityState={{ busy: isProcessing }}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={isFavorite ? 'white' : 'black'} />
          ) : (
            <AntDesign
              name={isFavorite ? 'heart' : 'hearto'}
              size={ICON_SIZE}
              color={isFavorite ? 'white' : 'black'}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.bottomContainer}>
        {isLoading && (
          <View style={styles.overlayLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.productInfo}>
            {item.category ? (
              <View style={styles.categoryPill}>
                <Typo size={11} weight="600" style={styles.categoryPillText}>
                  {item.category.toUpperCase()}
                </Typo>
              </View>
            ) : null}

            <Typo size={26} weight="700" style={styles.productTitle}>
              {productDetails?.nom || item.name}
            </Typo>

            <View style={styles.pricingSection}>
              {hasPromotion ? (
                <View style={styles.promotionContainer}>
                  <View style={styles.priceRow}>
                    <Typo size={28} weight="700" style={styles.discountedPrice}>
                      {getPromotionInfo.finalPrice}
                    </Typo>
                    <View style={styles.discountBadge}>
                      <Typo size={12} weight="700" style={styles.discountText}>
                        {getPromotionInfo.isDiscount ? `-${getPromotionInfo.percentage}` : `+${getPromotionInfo.percentage}`}
                      </Typo>
                    </View>
                  </View>
                  <Typo size={15} style={styles.originalPrice}>
                    {getPromotionInfo.originalPrice}
                  </Typo>
                </View>
              ) : (
                <Typo size={28} weight="700" style={styles.regularPrice}>
                  {productDetails?.prix ? `${productDetails.prix.toFixed(2)} TND` : item.price}
                </Typo>
              )}
            </View>

            <View style={styles.metaRow}>
              {averageRating != null && averageRating > 0 ? (
                <View style={styles.ratingContainer}>
                  {renderStarRating(averageRating)}
                  {reviews?.length > 0 && (
                    <TouchableOpacity onPress={handleViewAllReviews} style={styles.reviewCountContainer}>
                      <Typo size={13} weight="500" style={styles.reviewCountText}>
                        ({reviews.length})
                      </Typo>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => navigation.navigate('ReviewSubmissionScreen', { productId: item.id })}
                  style={styles.noRatingContainer}
                >
                  <Typo size={13} weight="500" style={styles.noRatingText}>
                    Rate this item
                  </Typo>
                  <AntDesign name="staro" size={14} color={colors.accentDark} />
                </TouchableOpacity>
              )}

              {maxQuantity === 0 ? (
                <View style={[styles.stockBadge, styles.outOfStockBadge]}>
                  <Typo size={11} weight="600" style={styles.outOfStockText}>
                    Sold Out
                  </Typo>
                </View>
              ) : (
                <View style={styles.stockBadge}>
                  <Typo size={11} weight="500" style={styles.inStockText}>
                    In Stock
                  </Typo>
                </View>
              )}
            </View>
          </View>

          <TabSelector />
          {renderContent()}

          <View style={styles.recommendationsBlock}>
            <ProductRecommendations
              productId={item.id}
              type="similar"
              title="You May Also Like"
              limit={8}
              favoritesData={favoritesData}
              refetchFavorites={refetchFavorites}
            />
            {user && (
              <ProductRecommendations
                userId={user.id}
                type="hybrid"
                title="Complete Your Look"
                limit={8}
                favoritesData={favoritesData}
                refetchFavorites={refetchFavorites}
                style={styles.secondRecommendation}
              />
            )}
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.bottomActionContainer}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              onPress={decrementQuantity}
              disabled={quantity <= 1 || adding}
              activeOpacity={0.7}
              style={[styles.quantityButton, quantity <= 1 && styles.disabledQuantityButton]}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity">
              <Animated.View style={{ transform: [{ scale: quantityButtonScale }] }}>
                <Typo
                  size={20}
                  style={[styles.quantityButtonText, quantity <= 1 && styles.disabledQuantityText]}>
                  -
                </Typo>
              </Animated.View>
            </TouchableOpacity>
            <Animated.View style={[styles.quantityValue, { transform: [{ scale: scaleAnim }] }]}>
              <Typo size={18} style={styles.quantityText}>
                {quantity}
              </Typo>
            </Animated.View>
            <TouchableOpacity
              onPress={incrementQuantity}
              disabled={quantity >= maxQuantity || !isAvailable || adding}
              activeOpacity={0.7}
              style={[
                styles.quantityButton,
                (quantity >= maxQuantity || !isAvailable) && styles.disabledQuantityButton,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity">
              <Animated.View style={{ transform: [{ scale: quantityButtonScale }] }}>
                <Typo
                  size={20}
                  style={[
                    styles.quantityButtonText,
                    (quantity >= maxQuantity || !isAvailable) && styles.disabledQuantityText,
                  ]}>
                  +
                </Typo>
              </Animated.View>
            </TouchableOpacity>
          </View>
          <CartButton
            onPress={handleAddToCart}
            label={adding ? 'Adding...' : 'Add to Cart'}
            isDisabled={!isAvailable || adding}
            isLoading={adding}
            style={styles.addToCartButtonContainer}
          />
        </View>
      </View>
    </ScreenComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bottomContainer: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: -spacingY._25,
    borderTopLeftRadius: BORDER_RADIUS + 8,
    borderTopRightRadius: BORDER_RADIUS + 8,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
    paddingBottom: normalizeY(20),
    gap: spacingY._20,
  },
  productInfo: {
    gap: spacingY._12,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._5,
    borderRadius: radius._20,
  },
  categoryPillText: {
    color: colors.primary,
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 10,
    top: Platform.OS === 'ios' ? normalizeY(50) : normalizeY(20),
    width: '100%',
    paddingHorizontal: spacingX._20,
    justifyContent: 'space-between',
  },
  headerSpacer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  bottomActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: colors.white,
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._20,
    borderTopWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 8,
  },
  quantityButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  disabledQuantityButton: {
    opacity: 0.5,
  },
  disabledQuantityText: {
    color: colors.gray,
    fontWeight: '500',
  },
  quantityContainer: {
    width: '32%',
    flexDirection: 'row',
    height: BUTTON_HEIGHT + 4,
    borderRadius: BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.offWhite,
  },
  quantityValue: {
    flex: 1,
    alignItems: 'center',
  },
  quantityText: {
    color: colors.text,
    fontWeight: '600',
  },

  // Cart Button
  addToCartButtonContainer: {
    width: '62%',
  },
  cartButtonContainer: {
    borderRadius: BORDER_RADIUS + 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  cartButtonTouchable: {
    height: BUTTON_HEIGHT + 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButtonDisabled: {
    opacity: 0.6,
  },
  cartButtonInner: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderRadius: BORDER_RADIUS + 4,
  },
  cartButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacingX._12,
  },
  cartButtonText: {
    color: colors.white,
    marginLeft: spacingX._8,
    letterSpacing: 0.3,
  },
  cartIcon: {
    marginRight: spacingX._8,
  },
  buttonLoader: {
    marginRight: spacingX._5,
  },

  // Loading and Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingY._20,
  },
  overlayLoading: {
    position: 'absolute',
    top: normalizeY(10),
    right: normalizeX(10),
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: normalizeY(8),
    borderRadius: radius._15,
    zIndex: 10,
  },
  loadingText: {
    marginTop: spacingY._10,
    color: colors.darkGray,
  },
  errorText: {
    color: colors.red,
    marginBottom: spacingY._10,
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._10,
    borderRadius: BORDER_RADIUS,
  },
  goBackText: {
    color: colors.white,
    fontWeight: '600',
  },

  iconBg: {
    backgroundColor: colors.white,
    padding: normalizeY(10),
    borderRadius: radius._15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heartActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  productTitle: {
    color: colors.text,
    lineHeight: normalizeY(32),
  },
  descriptionText: {
    lineHeight: normalizeY(24),
    color: colors.textSecondary,
    fontSize: normalizeY(15),
  },
  regularPrice: {
    color: colors.text,
  },
  discountedPrice: {
    color: colors.text,
  },
  originalPrice: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginTop: spacingY._4,
  },
  ratingText: {
    marginLeft: spacingX._5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  reviewCountText: {
    color: colors.textSecondary,
  },
  noRatingText: {
    color: colors.primary,
    marginRight: spacingX._5,
  },

  pricingSection: {
    marginTop: spacingY._4,
  },
  promotionContainer: {
    gap: spacingY._4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._12,
  },
  discountBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._5,
    borderRadius: radius._20,
  },
  discountText: {
    color: colors.primary,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacingY._4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  starRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCountContainer: {
    marginLeft: spacingX._5,
  },
  noRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._5,
  },
  stockBadge: {
    backgroundColor: colors.offWhite,
    paddingVertical: spacingY._5,
    paddingHorizontal: spacingX._10,
    borderRadius: radius._20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outOfStockBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.error,
  },
  outOfStockText: {
    color: colors.error,
  },
  inStockText: {
    color: colors.success,
  },

tabsContainer: {
  flexDirection: 'row',
  backgroundColor: colors.inputField,
  borderRadius: radius._20,
  padding: normalizeY(5),
  marginVertical: spacingY._15,
},
tabButton: {
  flex: 1,
  paddingVertical: spacingY._14,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radius._16,
},
activeTabButton: {
  backgroundColor: colors.primary,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 4,
},
tabText: {
  color: colors.textSecondary,
  fontSize: 15,
},
activeTabText: {
  color: colors.white,
},

contentSection: {
  gap: spacingY._22,
  paddingBottom: spacingY._20,
},
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCountBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacingX._8,
    paddingHorizontal: spacingX._5,
  },

  contentSection: {
    gap: spacingY._15,
  },
  cartButtonEnabledInner: {},
  cartButtonDisabledInner: {},
  recommendationsBlock: {
    gap: spacingY._25,
    marginTop: spacingY._5,
  },
  secondRecommendation: {
    marginTop: 0,
  },
});

export default ItemDetailsScreen;
