import React, { useEffect } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import Typo from '../components/Typo';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'react-query';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import ScreenComponent from '../components/ScreenComponent';

const CategoryDetailScreen = ({ route, navigation }) => {
  const { category, parentCategoryName = '' } = route.params;

  // Define the formatProducts function
  const formatProducts = (productsData) => {
    if (!productsData || !Array.isArray(productsData)) return [];
    
    return productsData.map(product => ({
      id: product.id.toString(),
      name: product.nom,
      description: product.description,
      price: `${product.prix?.toFixed(2) || "0.00"} TND`,
      prix: product.prix, // Raw price for calculations
      promotionPartenaire: product.promotionPartenaire,
      promotionParticulier: product.promotionParticulier,
      category: product.categories && product.categories.length > 0 
        ? product.categories[0].nom 
        : category.nom || 'Uncategorized',
      url: product.photos && product.photos.length > 0 
        ? { uri: `${getUploadUrl(product.photos[0])}`}
        : require('../assets/products/item1.png'),
      photos: product.photos, // Include all photos
      quantity: product.quantite,
      available: product.disponibilite,
      rating: product.averageRating || 0,
    }));
  };

  // Use React Query for products
  const { 
    data: products = [], 
    isLoading, 
    error,
    refetch
  } = useQuery(
    ['categoryProducts', category.id],
    () => api.getProductsByCategory(category.id),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      select: (data) => formatProducts(data)
    }
  );

  // Handle product item press
  const handleProductPress = (product) => {
    navigation.navigate('ItemDetails', product);
  };

  // Render product item
  const renderProductItem = ({ item, index }) => (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
      style={styles.productCardContainer}
    >
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => handleProductPress(item)}
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
          <Typo style={styles.productName} numberOfLines={2}>{item.name}</Typo>
          <Typo style={styles.productPrice}>{item.price}</Typo>
          
          {/* Availability indicator */}
          <View style={styles.availabilityRow}>
            <View 
              style={[
                styles.availabilityDot, 
                { backgroundColor: item.available ? colors.green : colors.red }
              ]} 
            />
            <Typo style={styles.availabilityText} size={12}>
              {item.available ? 'In Stock' : 'Out of Stock'}
            </Typo>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  // Render header with category info
  const renderHeader = () => (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={styles.headerContainer}
    >
      {/* Category image header */}
      <View style={styles.categoryImageHeader}>
        <Image 
          source={
            category.photo
              ? { uri: `${getAssetUrl(category.photo)}` }
              : require('../assets/google.png')
          }
          style={styles.categoryImage}
        />
        <View style={styles.categoryOverlay}>
          <Typo style={styles.categoryTitle}>{category.nom}</Typo>
          {parentCategoryName ? (
            <Typo style={styles.parentCategoryName}>
              From: {parentCategoryName}
            </Typo>
          ) : null}
        </View>
      </View>

      {/* Category description */}
      {category.description ? (
        <View style={styles.descriptionContainer}>
          <Typo style={styles.descriptionTitle}>Description</Typo>
          <Typo style={styles.descriptionText}>{category.description}</Typo>
        </View>
      ) : null}

      {/* Products count */}
      <View style={styles.productsHeaderContainer}>
        <Typo style={styles.productsTitle}>Products</Typo>
        <Typo style={styles.productsCount}>
          {isLoading ? 'Loading...' : `${products.length} items`}
        </Typo>
      </View>
    </Animated.View>
  );

  return (
    <ScreenComponent style={styles.container}>
      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.white} />
      </TouchableOpacity>

      {isLoading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typo style={styles.loadingText}>Loading products...</Typo>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Typo style={styles.errorText}>Failed to load products. Please try again.</Typo>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Typo style={styles.retryButtonText}>Retry</Typo>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsContainer}
          columnWrapperStyle={styles.productRow}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Typo style={styles.emptyText}>No products found in this category</Typo>
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Typo style={styles.browseButtonText}>Browse All Products</Typo>
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
  backButton: {
    position: 'absolute',
    top: spacingY._10,
    left: spacingX._15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
  headerContainer: {
    marginBottom: spacingY._15,
  },
  categoryImageHeader: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacingY._15,
  },
  categoryTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '600',
  },
  parentCategoryName: {
    color: colors.white,
    fontSize: 14,
    opacity: 0.8,
    marginTop: spacingY._5,
  },
  descriptionContainer: {
    padding: spacingX._15,
    backgroundColor: colors.lighterGray,
    borderRadius: radius._10,
    marginHorizontal: spacingX._15,
    marginTop: spacingY._15,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacingY._5,
  },
  descriptionText: {
    color: colors.gray,
    lineHeight: 20,
  },
  productsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacingY._20,
    marginBottom: spacingY._10,
    paddingHorizontal: spacingX._15,
  },
  productsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  productsCount: {
    color: colors.gray,
  },
  productsContainer: {
    padding: spacingX._15,
    paddingBottom: spacingY._80, // Extra padding at bottom
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: spacingY._15,
  },
  productCardContainer: {
    width: '48%',
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: radius._12,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    height: 140,
    backgroundColor: colors.lighterGray,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacingY._10,
  },
  productImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  productInfo: {
    padding: spacingX._10,
    paddingBottom: spacingY._15,
  },
  productName: {
    fontWeight: '500',
    fontSize: 14,
    marginVertical: spacingY._5,
    height: 40, // Fixed height for 2 lines
  },
  productPrice: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacingY._5,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacingX._5,
  },
  availabilityText: {
    color: colors.gray,
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

export default CategoryDetailScreen;