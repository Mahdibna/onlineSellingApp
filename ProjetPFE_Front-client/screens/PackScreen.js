import React, { useState, useEffect, useCallback } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from 'react-native';
import { Entypo, Feather, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import colors from 'config/colors';
import { spacingX, spacingY, radius } from 'config/spacing';
import useAuth from 'auth/useAuth';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Header from 'components/Header';
import ScreenComponent from 'components/ScreenComponent';
import Typo from 'components/Typo';

const { width } = Dimensions.get('window');

// Enhanced color palette
const extendedColors = {
  primary: '#EB1011',
  primaryLight: '#FFEBEB',
  secondaryText: '#6B7280',
  cardBg: '#FFFFFF',
  background: '#F9FAFB',
  border: '#E5E7EB',
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
};

const PackScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [packs, setPacks] = useState([]);
  const [filteredPacks, setFilteredPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPacks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/api/packs/available`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Calculate total value for each pack if it's not provided by the API
      const packsWithTotalValue = response.data.map(pack => {
        if (!pack.totalValue && pack.products && pack.products.length > 0) {
          const totalValue = pack.products.reduce(
            (total, product) => total + (product.unitPrice * product.quantity), 
            0
          );
          return { ...pack, totalValue };
        }
        return pack;
      });
      
      setPacks(packsWithTotalValue);
      setFilteredPacks(packsWithTotalValue);
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || 'An error occurred while fetching packs');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchPacks();
    }
  }, [fetchPacks, token, refreshKey]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = packs.filter(pack => 
        pack.name && pack.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPacks(filtered);
    } else {
      setFilteredPacks(packs);
    }
  };

  const renderPackItem = ({ item, index }) => {
    const productCount = item.productCount || (item.products ? item.products.length : 0);
    
    // Calculate total value properly
    const totalValue = item.totalValue 
      ? item.totalValue 
      : (item.products && item.products.length > 0
        ? item.products.reduce((total, product) => total + (product.unitPrice * product.quantity), 0)
        : 0);
    
    const unitPrice = item.unitPrice || item.price || 0;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 80)
          .duration(400)
          .springify()}
        style={styles.cardContainer}
      >
        <TouchableOpacity
          style={styles.packCard}
          onPress={() => navigation.navigate('PackDetails', { packId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={styles.imageContainer}>
              {item.photos && item.photos.length > 0 ? (
                <Image
                  source={{ uri: `${API_URL}/uploads/${item.photos[0]}` }}
                  style={styles.packImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.packImage, styles.noImage]}>
                  <Entypo name="image" size={28} color="#D1D1D1" />
                </View>
              )}
            </View>
            
            <View style={styles.infoContainer}>
              <View style={styles.centeredContent}>
                <Text style={styles.packName} numberOfLines={2}>{item.name}</Text>
                
                <View style={styles.detailsRow}>
                  <View style={styles.productCountContainer}>
                    <MaterialIcons name="inventory-2" size={16} color={extendedColors.secondaryText} />
                    <Text style={styles.productCountText}>{productCount} products</Text>
                  </View>
                </View>
                
                <View style={styles.priceRow}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.currentPrice}>{unitPrice.toFixed(2)} TND</Text>
                    <View style={styles.originalPriceContainer}>
                      <Text style={styles.originalPrice}>{totalValue.toFixed(2)} TND</Text>
                      <View style={styles.strikethrough} />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ScreenComponent style={styles.container}>
      <View style={styles.header}>
        <Header label="Special Offers" />
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Feather name="search" size={18} color={extendedColors.secondaryText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search special offers..."
            placeholderTextColor={extendedColors.secondaryText}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
              <Feather name="x" size={18} color={extendedColors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={extendedColors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={extendedColors.primary} />
          <Text style={styles.errorTitle}>Couldn't Load Offers</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => setRefreshKey(k => k + 1)}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPacks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="inventory" size={64} color="#BDBDBD" />
          <Text style={styles.emptyTitle}>No Offers Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? "We couldn't find any offers matching your search" 
              : "No special offers available at the moment"}
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => setRefreshKey(k => k + 1)}
          >
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredPacks}
          renderItem={renderPackItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={() => setRefreshKey(k => k + 1)}
        />
      )}
    </ScreenComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: extendedColors.background,
  },
  header: {
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._5,
  },
  searchContainer: {
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._15,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: extendedColors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: extendedColors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: extendedColors.textPrimary,
  },
  clearButton: {
    padding: 8,
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
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: extendedColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: extendedColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: extendedColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: extendedColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: extendedColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: extendedColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  refreshText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacingX._20,
    paddingBottom: 80,
    paddingTop: 8,
  },
  cardContainer: {
    width: '100%',
    marginBottom: 16,
  },
  packCard: {
    backgroundColor: extendedColors.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: extendedColors.border,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  imageContainer: {
    width: 110,
    height: 110,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 14,
  },
  packImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  centeredContent: {
    justifyContent: 'center', // Center the content vertically
    flex: 1, // Take up the full height of the infoContainer
  },
  packName: {
    fontSize: 16,
    fontWeight: '600',
    color: extendedColors.textPrimary,
    marginBottom: 6,
    lineHeight: 22,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  productCountText: {
    fontSize: 13,
    color: extendedColors.secondaryText,
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'column',
  },
  currentPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: extendedColors.primary,
  },
  originalPriceContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  originalPrice: {
    fontSize: 14,
    color: extendedColors.secondaryText,
  },
  strikethrough: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: extendedColors.secondaryText,
  },
});

export default PackScreen;