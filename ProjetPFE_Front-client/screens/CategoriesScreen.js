import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import ScreenComponent from 'components/ScreenComponent';
import Typo from 'components/Typo';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  Image,
  Animated,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { normalizeX, normalizeY } from 'utils/normalize';
import { useQuery, useQueryClient } from 'react-query';
import api from 'services/api'; // Import the API service

function CategoriesScreen({ navigation }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [animation] = useState(new Animated.Value(0));
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);

  // Fetch categories with React Query for caching and performance
  const { 
    data: categories = [], 
    isLoading: isLoadingCategories, 
    error: categoriesError,
    refetch: refetchCategories
  } = useQuery(
    'categories',
    api.getCategories,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      onError: (err) => console.error('Error fetching categories:', err)
    }
  );

  // Query for products by category, only fetched when a category is expanded
  const { 
    data: categoryProductsData = {}, 
    isLoading: isLoadingProducts,
  } = useQuery(
    ['categoryProducts'],
    () => ({}), // Initial empty object
    {
      staleTime: 2 * 60 * 1000, // 2 minutes cache
      // Don't refetch automatically
      refetchOnWindowFocus: false,
      refetchOnMount: false
    }
  );

  // Fetch products for a specific category
  const fetchCategoryProducts = async (categoryId) => {
    // If we already have products for this category, don't fetch again
    if (categoryProductsData[categoryId]) return;
    
    try {
      const productsData = await api.getProductsByCategory(categoryId);
      // Format products data
      const formattedProducts = productsData.map(product => ({
        id: product.id.toString(),
        name: product.nom,
        price: `${product.prix.toFixed(2)} TND`,
        prix: product.prix, // Raw price for calculations
        promotionPartenaire: product.promotionPartenaire,
        promotionParticulier: product.promotionParticulier,
        description: product.description,
        category: product.categories && product.categories.length > 0 
          ? product.categories[0].nom 
          : 'Uncategorized',
        url: product.photos && product.photos.length > 0 
          ? { uri: `${getUploadUrl(product.photos[0])}` }
          : require('../assets/products/item1.png'),
        photos: product.photos, // Full photos array
        quantity: product.quantite,
        available: product.disponibilite,
        rating: product.averageRating || 0,
      }));
      
      // Update the query cache with the new products for this category
      queryClient.setQueryData(['categoryProducts'], old => ({
        ...old,
        [categoryId]: formattedProducts 
      }));
    } catch (err) {
      console.error(`Error fetching products for category ${categoryId}:`, err);
    }
  };

  // Filtered categories based on search query
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => 
      cat.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.subCategories && cat.subCategories.some(sub => 
        sub.nom?.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    );
  }, [categories, searchQuery]);

  // Toggle category expansion
  const toggleExpand = (id) => {
    if (expandedCategory === id) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      }).start(() => setExpandedCategory(null));
    } else {
      setExpandedCategory(id);
      // Fetch products for this category
      fetchCategoryProducts(id);
      
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false
      }).start();
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const focusSearch = () => {
    searchInputRef.current.focus();
  };

  const goBack = () => {
    navigation.goBack();
  };

  // Render product item
  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ItemDetails', item)}
      activeOpacity={0.7}
    >
      <View style={styles.productImageContainer}>
        <Image 
          source={item.url} 
          style={styles.productImage}
          defaultSource={require('../assets/products/item1.png')}
        />
      </View>
      <View style={styles.productInfo}>
        <Typo style={styles.productName} numberOfLines={1}>{item.name}</Typo>
        <Typo style={styles.productPrice}>{item.price}</Typo>
      </View>
    </TouchableOpacity>
  );

  // Render subcategory item
  const renderSubcategoryItem = ({ item, parentCategory }) => {
    // Format image source
    const imageSource = item.photo 
      ? { uri: `${getAssetUrl(item.photo)}` }
      : require('../assets/google.png');
      
    return (
      <TouchableOpacity 
        style={styles.subcategoryCard}
        onPress={() => navigation.navigate('CategoryDetail', { 
          category: item,
          parentCategoryName: parentCategory ? parentCategory.nom : null
        })}
        activeOpacity={0.7}
      >
        <Image source={imageSource} style={styles.subcategoryImage} />
        <Typo style={styles.subcategoryText}>{item.nom}</Typo>
      </TouchableOpacity>
    );
  };

  // Render category item
  const renderCategoryItem = ({ item }) => {
    const isExpanded = expandedCategory === item.id;
    const hasSubcategories = item.subCategories && item.subCategories.length > 0;
    
    // Format image source
    const imageSource = item.photo 
      ? { uri: `${getAssetUrl(item.photo)}` }
      : require('../assets/google.png');
    
    return (
      <View style={styles.categoryContainer}>
        <TouchableOpacity 
          style={styles.categoryHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.8}
        >
          <View style={styles.categoryImageContainer}>
            <Image source={imageSource} style={styles.categoryImage} />
          </View>
          <View style={styles.categoryTitleContainer}>
            <Typo style={styles.categoryName}>{item.nom}</Typo>
            <Typo style={styles.categoryItemCount}>
              {hasSubcategories ? `${item.subCategories.length} subcategories` : 'Tap to view products'}
            </Typo>
          </View>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color={colors.primary} 
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={[
            styles.expandedContent,
            { opacity: animation }
          ]}>
            {/* Display products if they've been loaded */}
            {categoryProductsData[item.id] ? (
              <View>
                <Typo style={styles.subtitle}>Popular Products</Typo>
                <FlatList
                  horizontal
                  data={categoryProductsData[item.id]}
                  renderItem={renderProductItem}
                  keyExtractor={product => product.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.productsContainer}
                  ListEmptyComponent={
                    <Typo style={styles.emptyText}>No products found</Typo>
                  }
                />
              </View>
            ) : (
              <View style={styles.loadingProductsContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Typo style={styles.loadingText}>Loading products...</Typo>
              </View>
            )}

            {/* Display subcategories if they exist */}
            {hasSubcategories && (
              <View style={styles.subcategoriesSection}>
                <Typo style={styles.subtitle}>Browse by Category</Typo>
                <FlatList
                  horizontal
                  data={item.subCategories}
                  renderItem={({ item: subcategory }) => renderSubcategoryItem({ 
                    item: subcategory,
                    parentCategory: item // Pass the parent category
                  })}
                  keyExtractor={(subcat) => subcat.id.toString()}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.subcategoriesContainer}
                />
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('CategoryDetail', {
                category: item,
                parentCategoryName: null
              })}
            >
              <Typo style={styles.viewAllText}>View All</Typo>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  };

  // Render loading state
  if (isLoadingCategories && categories.length === 0) {
    return (
      <ScreenComponent style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Typo style={styles.loadingText}>Loading categories...</Typo>
      </ScreenComponent>
    );
  }

  return (
    <ScreenComponent style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={goBack}
          >
            <Ionicons name="arrow-back" size={24} color={colors.black} />
          </TouchableOpacity>
          <Typo style={styles.screenTitle}>Categories</Typo>
        </View>
        
        <View style={[
          styles.searchContainer,
          isSearchFocused && styles.searchContainerFocused
        ]}>
          <TouchableOpacity 
            style={styles.searchIconContainer}
            onPress={focusSearch}
          >
            <Ionicons name="search" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor={colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
          
          {searchQuery !== '' && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearSearch}
            >
              <Ionicons name="close-circle" size={20} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Error message */}
      {categoriesError && (
        <View style={styles.errorContainer}>
          <Typo style={styles.errorText}>Failed to load categories. Please try again.</Typo>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={refetchCategories}
          >
            <Typo style={styles.retryText}>Retry</Typo>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={10}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="folder-search-outline" size={80} color={colors.lightGray} />
            <Typo style={styles.emptyText}>No categories found</Typo>
          </View>
        }
      />
    </ScreenComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._10,
    paddingBottom: spacingY._20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lighterGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacingX._15,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lighterGray,
    borderRadius: radius._25,
    borderWidth: 1,
    borderColor: colors.lightGray,
    overflow: 'hidden',
  },
  searchContainerFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIconContainer: {
    height: 48,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._25,
    borderBottomLeftRadius: radius._25,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacingX._10,
    fontSize: 16,
    color: colors.black,
  },
  clearButton: {
    height: 48,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    margin: spacingX._20,
    padding: spacingY._10,
    backgroundColor: colors.lighterGray,
    borderRadius: radius._10,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: spacingY._5,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._5,
    borderRadius: radius._5,
  },
  retryText: {
    color: colors.white,
  },
  listContainer: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._20,
  },
  categoryContainer: {
    marginBottom: spacingY._20,
    borderRadius: radius._16,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacingX._15,
  },
  categoryImageContainer: {
    width: 60,
    height: 60,
    borderRadius: radius._12,
    backgroundColor: colors.lighterGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacingX._15,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryName: {
    fontWeight: '700',
    fontSize: 18,
    color: colors.black,
    marginBottom: 4,
  },
  categoryItemCount: {
    fontSize: 14,
    color: colors.gray,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lighterGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    paddingHorizontal: spacingX._15,
    paddingBottom: spacingY._15,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  subtitle: {
    fontWeight: '600',
    fontSize: 16,
    marginTop: spacingY._15,
    marginBottom: spacingY._10,
    color: colors.darkGray,
  },
  productsContainer: {
    paddingVertical: spacingY._5,
  },
  loadingProductsContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacingY._10,
    color: colors.gray,
  },
  productCard: {
    width: 160,
    marginRight: spacingX._15,
    backgroundColor: colors.white,
    borderRadius: radius._12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    height: 130,
    backgroundColor: colors.lighterGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  productInfo: {
    padding: spacingX._10,
  },
  productName: {
    fontWeight: '500',
    fontSize: 14,
    marginBottom: spacingY._4,
  },
  productPrice: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  subcategoriesSection: {
    marginTop: spacingY._5,
  },
  subcategoriesContainer: {
    paddingVertical: spacingY._5,
  },
  subcategoryCard: {
    width: 100,
    marginRight: spacingX._15,
    alignItems: 'center',
  },
  subcategoryImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: spacingY._8,
    borderWidth: 2,
    borderColor: colors.lightGray,
  },
  subcategoryText: {
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 13,
    color: colors.darkGray,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._20,
    borderRadius: radius._25,
    marginTop: spacingY._15,
  },
  viewAllText: {
    color: colors.white,
    fontWeight: '600',
    marginRight: spacingX._5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: spacingY._15,
    fontSize: 16,
    color: colors.gray,
  }
});

export default CategoriesScreen;