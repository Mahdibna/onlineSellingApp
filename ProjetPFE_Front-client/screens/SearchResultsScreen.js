import React from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typo from '../components/Typo';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';
import ProductCard from '../components/ProductCard';
import ScreenComponent from '../components/ScreenComponent';
import SearchBar from '../components/SearchBar';
import Animated, { FadeIn } from 'react-native-reanimated';

const SearchResultsScreen = ({ route, navigation }) => {
  const { searchTerm = '', results = [] } = route.params || {};
  
  // Handle new search
  const handleSearch = (newSearchTerm, newResults) => {
    // Update route params with new search results
    navigation.setParams({
      searchTerm: newSearchTerm,
      results: newResults
    });
  };

  // Render product item
  const renderProductItem = ({ item, index }) => (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
      style={styles.productCardContainer}
    >
      <ProductCard item={item} />
    </Animated.View>
  );

  return (
    <ScreenComponent style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>
        <Typo style={styles.headerTitle}>Search Results</Typo>
        <View style={styles.placeholderRight} />
      </View>

      {/* Search Bar */}
      <SearchBar 
        placeholder="Search products..." 
        onSearch={handleSearch}
        initialValue={searchTerm}
      />

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Typo style={styles.resultsCount}>
          {results.length} result{results.length !== 1 ? 's' : ''} for "{searchTerm}"
        </Typo>
      </View>

      {/* Results List */}
      <FlatList
        data={results}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsContainer}
        columnWrapperStyle={styles.productRow}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Typo style={styles.emptyText}>No results found for "{searchTerm}"</Typo>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Typo style={styles.browseButtonText}>Browse All Products</Typo>
            </TouchableOpacity>
          </View>
        }
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
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginLeft: -40, // To center the title correctly
  },
  placeholderRight: {
    width: 40, // Same width as back button for alignment
  },
  resultsHeader: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighterGray,
  },
  resultsCount: {
    fontSize: 14,
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
  emptyContainer: {
    padding: spacingY._20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
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

export default SearchResultsScreen;