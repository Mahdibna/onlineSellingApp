import { Entypo } from '@expo/vector-icons';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity 
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenComponent from 'components/ScreenComponent';
import SearchBar from 'components/SearchBar';
import Typo from 'components/Typo';
import CategoryItem from 'components/CategoryItem';
import ProductCard from 'components/ProductCard';
import ImageSlideShow from 'components/ImageSlideShow';
import FilterModal from 'model/FilterModal';
import PremiumBanner from 'components/PremiumBanner';
import ProductRecommendations from 'components/ProductRecommendations';
import NotificationBadge from 'components/NotificationBadge';
import { trackProductView } from 'utils/RecommendationUtils';
// Config imports
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import api from 'services/api';


function HomeScreen({ navigation, route }) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selected, setSelected] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [key, setKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const isPartner = user?.roles?.includes("ROLE_USERPARTNER");
  const initialCategoryName = route.params?.categoryName;

  // Only set selected category when initialCategoryName changes
  useEffect(() => {
    if (initialCategoryName) {
      setSelected(initialCategoryName);
    }
  }, [initialCategoryName]);

  // Memoized formatCategories function
  const formatCategories = useCallback((categoriesData) => {
    const allCategory = {
      id: 'all',
      name: 'All',
      image: require('../assets/categories/All.png'),
    };
    if (!categoriesData || !Array.isArray(categoriesData)) {
      return [allCategory];
    }
    const mappedCategories = categoriesData.map(category => ({
      id: category.id.toString(),
      name: category.nom,
      image: category.photo 
        ? { uri: getAssetUrl(category.photo) } 
        : require('../assets/categories/All.png'),
    }));
    
    return [allCategory, ...mappedCategories];
  }, []);

  // Memoized formatProducts function
  const formatProducts = useCallback((productsData) => {
    if (!productsData || !Array.isArray(productsData)) return [];
    
    return productsData.map(product => ({
      id: product.id.toString(),
      name: product.nom,
      description: product.description,
      price: `${product.prix ? `${product.prix.toFixed(2)} TND` : "0.00"}`,
      prix: product.prix,
      promotionPartenaire: product.promotionPartenaire,
      promotionParticulier: product.promotionParticulier,
      category: product.categories && product.categories.length > 0 
        ? product.categories[0].nom 
        : 'Uncategorized',
      url: product.photos && product.photos.length > 0 
        ? { uri: getUploadUrl(product.photos[0]) }
        : require('../assets/products/item1.png'),
      photos: product.photos,
      quantity: product.quantite,
      available: product.disponibilite,
      rating: product.averageRating || 0,
      categories: product.categories || [],
      reference: product.reference || '', // Added reference field
    }));
  }, []);

  // Favorites query
  const { 
    data: favoritesData = [],
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

  // Categories query
  const { 
    data: categoriesData = [], 
    isLoading: isCategoriesLoading,
    error: categoriesError
  } = useQuery(
    'categories', 
    api.getCategories, 
    {
      staleTime: 5 * 60 * 1000,
      onError: (error) => console.error('Categories fetch error:', error)
    }
  );

  // Memoized categories
  const categories = useMemo(() => formatCategories(categoriesData), [categoriesData, formatCategories]);

  // Products query
  const { 
    data: productsData = [], 
    isLoading: isProductsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useQuery(
    ['products', selected],
    () => {
      if (selected === 'All') {
        return api.getAllProducts();
      } 
      const category = categories.find(cat => cat.name === selected);
      if (category && category.id !== 'all') {
        return api.getProductsByCategory(category.id);
      }
      return [];
    },
    {
      enabled: categories.length > 0,
      staleTime: 2 * 60 * 1000,
      onError: (error) => console.error('Products fetch error:', error)
    }
  );

  // Memoized products
  const products = useMemo(() => formatProducts(productsData), [productsData, formatProducts]);

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    if (!activeFilters || products.length === 0) return [];
    
    return products.filter(product => {
      // Category filter
      if (activeFilters.categories && activeFilters.categories.length > 0) {
        const productCategories = product.categories?.map(c => c.id.toString()) || [];
        const hasMatchingCategory = activeFilters.categories.some(catId => 
          productCategories.includes(catId)
        );
        if (!hasMatchingCategory) return false;
      }
      
      // Brand filter
      if (activeFilters.brands && activeFilters.brands.length > 0) {
        const productBrand = product.name.split(' ')[0];
        if (!activeFilters.brands.includes(productBrand)) return false;
      }
      
      // Rating filter
      if (activeFilters.minRating > 0 && (product.rating || 0) < activeFilters.minRating) {
        return false;
      }
      
      // Discount filter
      if (activeFilters.hasDiscount && 
          !product.promotionPartenaire && 
          !product.promotionParticulier) {
        return false;
      }
      
      // Price filter
      if (product.prix < activeFilters.minPrice || product.prix > activeFilters.maxPrice) {
        return false;
      }
      
      return true;
    });
  }, [activeFilters, products]);

  // Memoized search results
  const searchResults = useMemo(() => {
    if (searchQuery.trim() === '') return [];
    
    const query_lower = searchQuery.toLowerCase().trim();
    const productsToSearch = activeFilters ? filteredProducts : products;
    
    return productsToSearch.filter(
      product => 
        product.name.toLowerCase().includes(query_lower) || 
        product.description?.toLowerCase().includes(query_lower) ||
        product.category?.toLowerCase().includes(query_lower) ||
        (product.reference && product.reference.toLowerCase().includes(query_lower)) // Added reference search
    );
  }, [searchQuery, activeFilters, filteredProducts, products]);

  // Handle search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setIsSearchActive(query.trim() !== '');
  }, []);

  // Handle view all search results
  const handleViewAllSearchResults = useCallback(() => {
    navigation.navigate('SearchResults', {
      searchTerm: searchQuery,
      results: searchResults
    });
  }, [navigation, searchQuery, searchResults]);

  // Handle category filter
  const handleFilter = useCallback((categoryName) => {
    setSelected(categoryName);
    setActiveFilters(null);
    setSearchQuery('');
    setIsSearchActive(false);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries('categories'),
      queryClient.invalidateQueries(['products', selected]),
      queryClient.invalidateQueries('favorites')
    ]);
    setIsRefreshing(false);
  }, [queryClient, selected]);

  // Handle Premium Banner Press
  const handlePremiumBannerPress = useCallback(() => {
    navigation.navigate('PartnerApplication');
  }, [navigation]);

  // Handle filters
  const handleApplyFilters = useCallback((filters) => {
    setActiveFilters(filters);
    setFilterModalVisible(false);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setActiveFilters(null);
  }, []);

  // Navigate to all products
  const handleSeeAllPress = useCallback(() => {
    navigation.navigate('AllProducts', { 
      title: 'All Products',
      fetchFunction: 'getAllProducts'
    });
  }, [navigation]);

  // Handle product item press
  const handleProductPress = useCallback((product) => {
    // Track the view for recommendations if we have a user ID
    if (user) {
      trackProductView(user.id, product.id);
    }
    
    // Navigate to product detail
    navigation.navigate('ItemDetails', product);
  }, [navigation, user]);

  // Combined error state
  const error = categoriesError || productsError;
  const isLoading = (isCategoriesLoading || isProductsLoading) && !isRefreshing && products.length === 0;

  // Determine which products to display
  const displayProducts = isSearchActive 
    ? searchResults.slice(0, 4) 
    : activeFilters 
      ? filteredProducts 
      : products;

  const hasActiveFilters = activeFilters !== null;

  if (isLoading) {
    return (
      <ScreenComponent style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Typo style={styles.loadingText}>Loading products...</Typo>
      </ScreenComponent>
    );
  }

  return (
    <ScreenComponent style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandBlock}>
          <Typo size={22} weight="700" style={styles.brandTitle}>
            StyleHub
          </Typo>
          <Typo size={13} weight="400" style={styles.brandSubtitle}>
            {user?.prenom ? `Hi, ${user.prenom}` : 'Discover your next look'}
          </Typo>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.iconBg}
            onPress={() => navigation.navigate('Categories')}>
            <Entypo name="grid" size={22} color={colors.primary} />
          </TouchableOpacity>
          <NotificationBadge 
            onPress={() => navigation.navigate('Notifications')}
            iconSize={22}
          />
        </View>
      </View>

      {/* Search bar */}
      <SearchBar 
        onPress={() => setFilterModalVisible(true)} 
        onSearch={handleSearch}
        placeholder="Search clothing, brands, styles..."
      />
      
      {/* Premium Banner */}
      {!isSearchActive && !isPartner && (
        <PremiumBanner onPress={handlePremiumBannerPress} />
      )}

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <Typo style={styles.activeFiltersText}>Filters Applied</Typo>
          <TouchableOpacity onPress={clearFilters}>
            <Typo style={styles.clearFiltersText}>Clear</Typo>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacingY._60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }>
        
        {/* Image slider */}
        {!isSearchActive && <ImageSlideShow />}

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Typo style={styles.errorText}>
              {error.message || 'Failed to load data. Please try again.'}
            </Typo>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Typo style={styles.retryText}>Retry</Typo>
            </TouchableOpacity>
          </View>
        )}

        {/* Categories */}
        {!isSearchActive && categories.length > 0 && (
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catContainer}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <CategoryItem
                item={item}
                onPress={handleFilter}
                isSelected={selected === item.name}
                index={index}
                key={index}
                keyValue={key}
              />
            )}
          />
        )}

        {/* Products section header */}
        <View style={styles.headingContainer}>
          <View>
            <Typo size={20} weight="700" style={styles.sectionTitle}>
              {isSearchActive ? `Results (${searchResults.length})` : 'Trending Now'}
            </Typo>
            {!isSearchActive && (
              <Typo size={13} weight="400" style={styles.sectionSubtitle}>
                Curated pieces for every occasion
              </Typo>
            )}
          </View>
          {isSearchActive && searchResults.length > 0 && (
            <TouchableOpacity onPress={handleViewAllSearchResults}>
              <Typo style={styles.seeAllText}>See all</Typo>
            </TouchableOpacity>
          )}
          {!isSearchActive && (
            <TouchableOpacity onPress={handleSeeAllPress}>
              <Typo style={styles.seeAllText}>See all</Typo>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Products grid */}
        {isProductsLoading && !isSearchActive && products.length > 0 ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isSearchActive ? (
          searchResults.length > 0 ? (
            <FlatList
              scrollEnabled={false}
              numColumns={2}
              data={searchResults.slice(0, 4)}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{
                gap: spacingX._20,
                paddingHorizontal: spacingX._20,
                paddingTop: spacingY._15,
              }}
              columnWrapperStyle={{ gap: spacingX._20 }}
              renderItem={({ item, index }) => (
                <Animated.View
                  key={`${key}-${index}`}
                  entering={FadeInDown.delay(index * 100)
                    .duration(600)
                    .damping(13)
                    .springify()}>
                  <ProductCard 
                    item={item} 
                    favoritesData={favoritesData} 
                    refetchFavorites={refetchFavorites}
                    onPress={() => handleProductPress(item)}
                  />
                </Animated.View>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Typo style={styles.emptyText}>No products matching "{searchQuery}"</Typo>
              <TouchableOpacity style={styles.clearSearchButton} onPress={() => handleSearch('')}>
                <Typo style={styles.clearSearchText}>Clear Search</Typo>
              </TouchableOpacity>
            </View>
          )
        ) : displayProducts.length > 0 ? (
          <FlatList
            scrollEnabled={false}
            numColumns={2}
            data={displayProducts}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{
              gap: spacingX._20,
              paddingHorizontal: spacingX._20,
              paddingTop: spacingY._15,
            }}
            columnWrapperStyle={{ gap: spacingX._20 }}
            renderItem={({ item, index }) => (
              <Animated.View
                key={`${key}-${index}`}
                entering={FadeInDown.delay(index * 100)
                  .duration(600)
                  .damping(13)
                  .springify()}>
                <ProductCard 
                  item={item} 
                  favoritesData={favoritesData} 
                  refetchFavorites={refetchFavorites}
                  onPress={() => handleProductPress(item)}
                />
              </Animated.View>
            )}
          />
        ) : !isProductsLoading && !error ? (
          <View style={styles.emptyContainer}>
            <Typo style={styles.emptyText}>
              {hasActiveFilters ? "No products match your filters" : "No products found"}
            </Typo>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearSearchButton} onPress={clearFilters}>
                <Typo style={styles.clearSearchText}>Clear Filters</Typo>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Recommendations */}
        {!isSearchActive && user && (
          <ProductRecommendations
            userId={user.id}
            type="hybrid"
            title="Recommended For You"
            limit={8}
            favoritesData={favoritesData}
            refetchFavorites={refetchFavorites}
            style={{ marginTop: spacingY._20 }}
          />
        )}
        
        {/* Popular products */}
        {!isSearchActive && (
          <ProductRecommendations
            type="popular"
            title="Best Sellers"
            limit={8}
            favoritesData={favoritesData}
            refetchFavorites={refetchFavorites}
            style={{ marginTop: spacingY._10 }}
          />
        )}
      </ScrollView>
      
      {/* Filter modal */}
      <FilterModal 
        visible={filterModalVisible} 
        setVisible={setFilterModalVisible}
        onApplyFilters={handleApplyFilters}
      />
    </ScreenComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacingY._20,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacingY._10,
    color: colors.textSecondary,
  },
  loadingOverlay: {
    padding: spacingY._20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._5,
    paddingBottom: spacingY._10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandBlock: {
    flex: 1,
    gap: spacingY._3,
  },
  brandTitle: {
    color: colors.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
  },
  iconBg: {
    backgroundColor: colors.white,
    padding: spacingY._8,
    borderRadius: radius._20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catContainer: {
    paddingHorizontal: spacingX._15,
    marginTop: spacingY._15,
  },
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacingY._25,
    marginHorizontal: spacingX._20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    marginTop: spacingY._3,
  },
  seeAllText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  errorContainer: {
    marginHorizontal: spacingX._20,
    marginVertical: spacingY._10,
    padding: spacingY._12,
    backgroundColor: colors.offWhite,
    borderRadius: radius._12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacingY._5,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._7,
    borderRadius: radius._10,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    marginTop: spacingY._20,
    alignItems: 'center',
    padding: spacingY._20,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacingY._10,
    textAlign: 'center',
  },
  clearSearchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacingX._18,
    paddingVertical: spacingY._10,
    borderRadius: radius._12,
  },
  clearSearchText: {
    color: colors.white,
    fontWeight: '600',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._10,
    backgroundColor: colors.accentLight,
    marginHorizontal: spacingX._15,
    borderRadius: radius._12,
    marginTop: spacingY._10,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  activeFiltersText: {
    color: colors.primary,
    fontWeight: '600',
  },
  clearFiltersText: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default HomeScreen;