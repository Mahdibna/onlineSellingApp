import React, { useState, useEffect } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Typo from '../components/Typo';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import ScreenComponent from '../components/ScreenComponent';
import { useAuth } from '../auth/AuthContext';


const FavouriteScreen = ({ route, navigation }) => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  const { 
    title = 'Favourites', 
    fetchFunction = 'getAllProducts',
  } = route.params || {};
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState([]);

  const handleGoBack = () => {
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const { 
    data: favoritesData = [],
    isLoading: isFavoritesLoading,
    error: favoritesError,
    refetch: refetchFavorites
  } = useQuery(
    'favorites',
    async () => {
      if (!token) return [];
      
      try {
        const response = await axios.get(`${API_URL}/api/favorites`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data || [];
      } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
      }
    },
    {
      enabled: !!token,
      staleTime: 2 * 60 * 1000,
    }
  );

  const formatProducts = (productsData) => {
    if (!productsData || !Array.isArray(productsData)) return [];
    
    return productsData.map(product => ({
      id: product.id.toString(),
      name: product.nom,
      description: product.description,
      price: `${product.prix?.toFixed(2) + " TND" || "0.00"}`,
      prix: product.prix,
      promotionPartenaire: product.promotionPartenaire,
      promotionParticulier: product.promotionParticulier,
      category: product.categories && product.categories.length > 0 
        ? product.categories[0].nom 
        : 'Uncategorized',
      url: product.photos && product.photos.length > 0 
        ? { uri: `${API_URL}/uploads/${product.photos[0]}`}
        : require('../assets/products/item1.png'),
      photos: product.photos,
      quantity: product.quantite,
      available: product.disponibilite,
      rating: product.averageRating || 0,
    }));
  };

  const fetchProducts = () => {
    return api.getAllProducts();
  };

  const { 
    data: allProducts = [], 
    isLoading: isProductsLoading, 
    error: productsError,
    refetch: refetchProducts,
  } = useQuery(
    ['allProducts'],
    fetchProducts,
    {
      staleTime: 2 * 60 * 1000,
      select: (data) => formatProducts(data),
    }
  );

  // Filter products to show only favorites
  useEffect(() => {
    if (allProducts.length > 0 && favoritesData.length > 0) {
      // Create a set of favorite product IDs for faster lookup
      const favoriteIds = new Set(favoritesData.map(fav => fav.productId.toString()));
      
      // Filter the products to include only those in favorites
      const favorites = allProducts.filter(product => favoriteIds.has(product.id));
      setFavoriteProducts(favorites);
    } else {
      setFavoriteProducts([]);
    }
  }, [allProducts, favoritesData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchProducts(),
      refetchFavorites()
    ]);
    setIsRefreshing(false);
  };

  const handleFavoriteChange = (productId, isFavorite) => {
    // If a product is removed from favorites, remove it from the display
    if (!isFavorite) {
      setFavoriteProducts(prev => prev.filter(product => product.id !== productId));
    }
    console.log(`Product ${productId} favorite status changed to ${isFavorite}`);
  };

  const isLoading = (isProductsLoading || isFavoritesLoading) && !isRefreshing && favoriteProducts.length === 0;
  const error = productsError || favoritesError;

  const renderProductItem = ({ item, index }) => (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
      style={styles.productCardContainer}
    >
      <ProductCard 
        item={item} 
        favoritesData={favoritesData} 
        refetchFavorites={refetchFavorites}
        onFavoriteChange={handleFavoriteChange}
      />
    </Animated.View>
  );

  return (
    <ScreenComponent style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
          testID="backButton"
        >
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>
        <Typo style={styles.headerTitle}>{title}</Typo>
        <View style={styles.placeholderRight} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typo style={styles.loadingText}>Loading favorites...</Typo>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Typo style={styles.errorText}>Failed to load favorites. Please try again.</Typo>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Typo style={styles.retryButtonText}>Retry</Typo>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favoriteProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsContainer}
          columnWrapperStyle={styles.productRow}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Typo style={styles.emptyText}>No favorites found</Typo>
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Typo style={styles.browseButtonText}>Browse Products</Typo>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </ScreenComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighterGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lighterGray,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginLeft: -40,
  },
  placeholderRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingY._20,
  },
  loadingText: {
    marginTop: spacingY._15,
    color: colors.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingY._20,
  },
  errorText: {
    color: 'red',
    marginBottom: spacingY._10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._10,
    borderRadius: radius._20,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  productsContainer: {
    padding: spacingX._15,
    paddingBottom: spacingY._80,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: spacingY._15,
  },
  productCardContainer: {
    width: '48%',
  },
  emptyContainer: {
    padding: spacingY._20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: spacingY._15,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._10,
    borderRadius: radius._20,
  },
  browseButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default FavouriteScreen;