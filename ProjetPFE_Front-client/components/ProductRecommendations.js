// components/ProductRecommendations.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import Typo from './Typo';
import ProductCard from './ProductCard';
import colors from '../config/colors';
import { spacingX, spacingY, radius } from '../config/spacing';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { trackProductView } from '../utils/RecommendationUtils';
import { Platform } from 'react-native';
import axios from 'axios';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { API_URL } from 'config/api';

const recommendationTypeInfo = {
  'popular': {
    label: 'Popular Products',
    subTitle: 'Top picks among our customers',
    icon: props => <Ionicons name="star" {...props} />,
    color: '#FF9800', // orange
    badgeLabel: 'Popular'
  },
  'hybrid': {
    label: 'Recommended For You',
    subTitle: 'Personally selected for you',
    icon: props => <Ionicons name="thumbs-up" {...props} />,
    color: '#4CAF50', // green
    badgeLabel: 'For You'
  },
  'collaborative': {
    label: 'Customers Like You Also Bought',
    subTitle: 'Based on similar shopping patterns',
    icon: props => <Ionicons name="people" {...props} />,
    color: '#2196F3', // blue
    badgeLabel: 'Others Bought'
  },
  'content-based': {
    label: 'Based On Your History',
    subTitle: 'Matches your browsing history',
    icon: props => <Ionicons name="time" {...props} />,
    color: '#9C27B0', // purple
    badgeLabel: 'For You'
  },
  'similar': {
    label: 'Similar Products',
    subTitle: 'Products you might also like',
    icon: props => <Ionicons name="copy" {...props} />,
    color: '#FF5722', // deep orange
    badgeLabel: 'Similar'
  }
};

// Get info for a recommendation type, with fallbacks
const getTypeInfo = (type) => {
  return recommendationTypeInfo[type] || recommendationTypeInfo['popular'];
};

// Tracking cache to prevent duplicate view tracking
const viewTrackingCache = new Map();
const TRACKING_COOLDOWN = 30 * 60 * 1000; // 30 minutes

const ProductRecommendations = ({ 
  productId,
  userId,
  type = 'popular', // popular, hybrid, collaborative, content-based, similar
  title, // Optional custom title (will use default from type if not provided)
  limit = 8,
  favoritesData = [],
  refetchFavorites,
  style,
  showSubtitle = true
}) => {
  const navigation = useNavigation();
  const { user, token } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get type info for styling
  const typeInfo = getTypeInfo(type);
  
  // Use provided title or default from type info
  const displayTitle = title || typeInfo.label;

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let url;
        
        switch (type) {
          case 'popular':
            url = `${API_URL}/api/advanced-recommendations/popular?limit=${limit}`;
            break;
          case 'hybrid':
            if (!userId && !user?.id) {
              setIsLoading(false);
              return;
            }
            url = `${API_URL}/api/advanced-recommendations/hybrid/${userId || user.id}?limit=${limit}`;
            break;
          case 'collaborative':
            if (!userId && !user?.id) {
              setIsLoading(false);
              return;
            }
            url = `${API_URL}/api/advanced-recommendations/collaborative/${userId || user.id}?limit=${limit}`;
            break;
          case 'content-based':
            if (!userId && !user?.id) {
              setIsLoading(false);
              return;
            }
            url = `${API_URL}/api/advanced-recommendations/content-based/${userId || user.id}?limit=${limit}`;
            break;
          case 'similar':
            if (!productId) {
              setIsLoading(false);
              return;
            }
            url = `${API_URL}/api/advanced-recommendations/similar/${productId}?limit=${limit}`;
            break;
          default:
            url = `${API_URL}/api/advanced-recommendations/popular?limit=${limit}`;
        }
        
        // Make the request with Authorization header
        const headers = { 'Authorization': `Bearer ${token}` };
        const response = await axios.get(url, { headers });
        const recommendationData = response.data;
        
        // Format the recommendations to match what the ProductCard expects
        const formattedRecommendations = recommendationData.map(item => ({
          id: item.id.toString(),
          name: item.nom,
          description: item.description,
          price: `${item.prix.toFixed(2)} TND`,
          prix: item.prix,
          promotionPartenaire: item.promotionPartenaire,
          promotionParticulier: item.promotionParticulier,
          category: item.categoryName || 'Uncategorized',
          url: item.imageUrl 
            ? { uri: item.imageUrl }
            : item.photos && item.photos.length > 0 
                ? { uri: `${API_URL}/uploads/${item.photos[0]}` }
                : require('../assets/products/item1.png'),
          photos: item.photos || [],
          quantity: item.quantite,
          available: item.disponibilite,
          rating: item.averageRating || 0,
          categories: item.categories || [{id: item.categoryId, nom: item.categoryName}], // Use full categories if available
          recommendationType: item.recommendationType || type,
          recommendationBadge: {
            label: typeInfo.badgeLabel,
            color: typeInfo.color,
            icon: typeInfo.icon
          }
        }));
        
        setRecommendations(formattedRecommendations);
      } catch (err) {
        console.error(`Error fetching ${type} recommendations:`, err);
        setError(`Couldn't load recommendations`);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      // Only fetch if we have a token
      fetchRecommendations();
    } else {
      setIsLoading(false);
      setError("Authentication required");
    }
  }, [type, productId, userId, limit, user?.id, token]);

  const handleProductPress = (product) => {
    // Track the product view if we have a user ID with cache check
    if (user?.id) {
      const trackingKey = `${user.id}-${product.id}`;
      const now = Date.now();
      const lastTracked = viewTrackingCache.get(trackingKey);
      
      // Only track if not tracked recently
      if (!lastTracked || (now - lastTracked > TRACKING_COOLDOWN)) {
        viewTrackingCache.set(trackingKey, now);
        trackProductView(user.id, product.id);
      }
    }
    
    // Navigate to product detail
    navigation.navigate('ItemDetails', product);
  };

  // Don't render anything if there are no recommendations
  if (!isLoading && (recommendations.length === 0 || error)) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: typeInfo.color }]}>
            {typeInfo.icon({ size: 16, color: 'white' })}
          </View>
          <View style={styles.textContainer}>
            <Typo size={18} style={styles.title}>{displayTitle}</Typo>
            {showSubtitle && (
              <Typo size={12} style={styles.subtitle}>{typeInfo.subTitle}</Typo>
            )}
          </View>
        </View>

      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={typeInfo.color} />
        </View>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={recommendations}
          keyExtractor={(item) => `${type}-${item.id}`}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 100).duration(400)}
              style={styles.cardContainer}
            >
              <ProductCard 
                item={item}
                favoritesData={favoritesData}
                refetchFavorites={refetchFavorites}
                onPress={() => handleProductPress(item)}
              />
            </Animated.View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacingY._15,
    paddingTop: spacingY._10,
    backgroundColor: colors.white,
    borderRadius: radius._15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacingX._15,
    marginBottom: spacingY._10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacingX._10, // Increased margin between icon and text
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    marginLeft: spacingX._2, // Added margin to ensure spacing
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    color: colors.gray,
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacingY._5,
    paddingHorizontal: spacingX._8,
    borderRadius: radius._10,
    backgroundColor: colors.lighterGray,
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '500',
    marginRight: spacingX._4,
  },
  list: {
    paddingHorizontal: spacingX._10,
    paddingBottom: spacingY._15,
  },
  cardContainer: {
    marginHorizontal: spacingX._5,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default ProductRecommendations;