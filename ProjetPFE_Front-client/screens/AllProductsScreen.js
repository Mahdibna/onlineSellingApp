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
import SearchBar from '../components/SearchBar';
import CategoryItem from '../components/CategoryItem';
import FilterModal from '../model/FilterModal';
import { useAuth } from '../auth/AuthContext';


const AllProductsScreen = ({ route, navigation }) => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selected, setSelected] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [key, setKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState(route.params?.searchQuery || '');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeFilters, setActiveFilters] = useState(null);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const { 
    title = 'All Products', 
    fetchFunction = 'getAllProducts',
    categoryId: initialCategoryId,
  } = route.params || {};

  const handleGoBack = () => {
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  useEffect(() => {
    if (searchQuery) {
      setIsSearchActive(true);
    }
    
    if (initialCategoryId) {
      const category = categories.find(cat => cat.id === initialCategoryId);
      if (category) {
        setSelected(category.name);
      }
    }
  }, [searchQuery, initialCategoryId]);

  // Handle filters
  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    setFilterModalVisible(false);
  };

  // Clear filters
  const clearFilters = () => {
    setActiveFilters(null);
    setFilteredProducts([]);
    if (isSearchActive) {
      setSearchQuery('');
      setIsSearchActive(false);
    }
  };

  // Check if filters are active
  const hasActiveFilters = activeFilters !== null;

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

  // Format categories
  const formatCategories = (categoriesData) => {
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
        ? { uri: `${API_URL}/${category.photo}` } 
        : require('../assets/categories/All.png'),
    }));
    return [allCategory, ...mappedCategories];
  };

  // Categories query
  const { 
    data: categories = [], 
    isLoading: isCategoriesLoading,
    error: categoriesError
  } = useQuery(
    'categories', 
    api.getCategories, 
    {
      staleTime: 5 * 60 * 1000,
      select: formatCategories,
      onError: (error) => console.error('Error fetching categories:', error)
    }
  );
  
  // Format products
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
      categories: product.categories || [],
      reference: product.reference || '', // Added reference field
    }));
  };

  // Apply filters to products
  const applyFiltersToProducts = (products, filters) => {
    if (!filters) return products;
    
    return products.filter(product => {
      // Category filter
      if (filters.categories.length > 0) {
        const productCategories = product.categories?.map(c => c.id.toString()) || [];
        const hasMatchingCategory = filters.categories.some(catId => 
          productCategories.includes(catId)
        );
        if (!hasMatchingCategory) return false;
      }
      
      // Brand filter
      if (filters.brands.length > 0) {
        const productBrand = product.name.split(' ')[0];
        if (!filters.brands.includes(productBrand)) return false;
      }
      
      // Rating filter
      if (filters.minRating > 0 && (product.rating || 0) < filters.minRating) {
        return false;
      }
      
      // Discount filter
      if (filters.hasDiscount && 
          !product.promotionPartenaire && 
          !product.promotionParticulier) {
        return false;
      }
      
      // Price filter
      if (product.prix < filters.minPrice || product.prix > filters.maxPrice) {
        return false;
      }
      
      return true;
    });
  };

  // Determine which API function to call
  const fetchProducts = () => {
    if (selected === 'All') {
      return api.getAllProducts();
    }
    const category = categories.find(cat => cat.name === selected);
    if (category && category.id !== 'all') {
      return api.getProductsByCategory(category.id);
    }
    return [];
  };

  // Products query
  const { 
    data: products = [], 
    isLoading: isProductsLoading, 
    error: productsError,
    refetch,
    isRefetching
  } = useQuery(
    ['allProducts', selected],
    fetchProducts,
    {
      staleTime: 2 * 60 * 1000,
      select: formatProducts,
      enabled: categories.length > 0
    }
  );

  // Filter products based on active filters and search
  useEffect(() => {
    let result = [...products];
    
    // Apply active filters
    if (activeFilters) {
      result = applyFiltersToProducts(result, activeFilters);
    }
    
    // Apply search query
    if (isSearchActive && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        product => 
          product.name.toLowerCase().includes(query) || 
          product.description?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          (product.reference && product.reference.toLowerCase().includes(query)) // Added reference search
      );
    }
    
    setFilteredProducts(result);
  }, [products, activeFilters, searchQuery, isSearchActive]);

  // Handle filter by category
  const handleFilter = async (categoryName) => {
    setSelected(categoryName);
    clearFilters();
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setIsSearchActive(query.trim() !== '');
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries('categories'),
      queryClient.invalidateQueries(['allProducts', selected]),
      queryClient.invalidateQueries('favorites')
    ]);
    setIsRefreshing(false);
  };

  // Combined error state
  const error = categoriesError || productsError;
  const isLoading = (isCategoriesLoading || isProductsLoading) && !isRefreshing;

  // Render product item
  const renderProductItem = ({ item, index }) => (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
      style={styles.productCardContainer}
    >
      <ProductCard 
        item={item} 
        favoritesData={favoritesData} 
        refetchFavorites={refetchFavorites}
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

      {/* Search Bar */}
      <SearchBar 
        onPress={() => setFilterModalVisible(true)} 
        onSearch={handleSearch}
        initialQuery={searchQuery}
        placeholder="name or reference.."
      />

      {/* Active filters indicator */}
      {(hasActiveFilters || isSearchActive) && (
        <View style={styles.activeFiltersContainer}>
          <Typo style={styles.activeFiltersText}>
            {isSearchActive 
              ? `Search: "${searchQuery}"`
              : 'Filters Applied'}
          </Typo>
          <TouchableOpacity onPress={clearFilters}>
            <Typo style={styles.clearFiltersText}>Clear</Typo>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typo style={styles.loadingText}>Loading products...</Typo>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Typo style={styles.errorText}>Failed to load data. Please try again.</Typo>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Typo style={styles.retryButtonText}>Retry</Typo>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
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
          ListHeaderComponent={
            <>
              {/* Categories list */}
              {categories.length > 0 && (
                <FlatList
                  data={categories}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.catContainer}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item, index }) => {
                    const isSelected = selected === item.name;
                    return (
                      <CategoryItem
                        item={item}
                        onPress={handleFilter}
                        isSelected={isSelected}
                        index={index}
                        key={index}
                        keyValue={key}
                      />
                    );
                  }}
                />
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Typo style={styles.emptyText}>
                {isSearchActive 
                  ? `No products matching "${searchQuery}"` 
                  : hasActiveFilters
                    ? "No products match your filters"
                    : "No products found"}
              </Typo>
              {(isSearchActive || hasActiveFilters) && (
                <TouchableOpacity 
                  style={styles.browseButton}
                  onPress={clearFilters}
                >
                  <Typo style={styles.browseButtonText}>
                    {isSearchActive ? "Clear Search" : "Clear Filters"}
                  </Typo>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
      
      <FilterModal 
        visible={filterModalVisible} 
        setVisible={setFilterModalVisible}
        onApplyFilters={handleApplyFilters}
      />
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
  catContainer: {
    paddingHorizontal: spacingX._10,
    marginTop: spacingY._10,
    marginBottom: spacingY._15,
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
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._10,
    backgroundColor: colors.lightPrimary,
    marginHorizontal: spacingX._10,
    borderRadius: radius._10,
    marginTop: spacingY._10,
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

export default AllProductsScreen;