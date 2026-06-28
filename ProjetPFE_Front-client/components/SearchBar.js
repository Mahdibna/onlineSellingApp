import React, { useState, useEffect, useRef } from 'react';
import { API_URL, getUploadUrl } from 'config/api';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Keyboard,
  FlatList,
  Text
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from 'react-query';
import api from '../services/api';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';
import { fontFamily } from '../config/typography';
import Typo from '../components/Typo';

const SearchBar = ({ onPress, onSearch, placeholder = "Search clothing, brands...", initialQuery = '' }) => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [showClearButton, setShowClearButton] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);
  
  // Get all products for search functionality
  const { data: allProducts = [], isLoading } = useQuery(
    'allProductsForSearch',
    api.getAllProducts,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      select: (data) => {
        if (!data || !Array.isArray(data)) return [];
        
        return data.map(product => ({
          id: product.id.toString(),
          name: product.nom,
          description: product.description,
          price: product.prix,
          category: product.categories && product.categories.length > 0 
            ? product.categories[0].nom 
            : 'Uncategorized',
          url: product.photos && product.photos.length > 0 
            ? { uri: `${getUploadUrl(product.photos[0])}`}
            : require('../assets/products/item1.png'),
          searchTerm: `${product.nom} ${product.description} ${product.categories?.map(c => c.nom).join(' ') || ''}`.toLowerCase()
        }));
      },
      onError: (error) => console.error('Error fetching products for search:', error)
    }
  );

  // Set initial search text if provided
  useEffect(() => {
    if (initialQuery) {
      setSearchText(initialQuery);
      setShowClearButton(initialQuery.length > 0);
    }
  }, [initialQuery]);

  // Filter products based on search text
  const filteredProducts = searchText.trim() 
    ? allProducts.filter(product => product.searchTerm.includes(searchText.toLowerCase()))
    : [];

  // Handle text input change
  const handleTextChange = (text) => {
    setSearchText(text);
    setShowClearButton(text.length > 0);
    
    if (text.length > 0) {
      setIsSearching(true);
      setShowResults(true);
    } else {
      setIsSearching(false);
      setShowResults(false);
    }
    
    // If onSearch prop is provided (for parent component to handle search)
    if (onSearch) {
      onSearch(text);
    }
  };

  // Clear search text
  const handleClear = () => {
    setSearchText('');
    setShowClearButton(false);
    setIsSearching(false);
    setShowResults(false);
    if (onSearch) {
      onSearch('');
    }
    Keyboard.dismiss();
  };

  // Perform search and navigate to results
  const performSearch = () => {
    if (!searchText.trim()) return;
    
    Keyboard.dismiss();
    setIsSearching(false);
    setShowResults(false);
    
    // Navigate to search results screen
    navigation.navigate('SearchResults', {
      searchTerm: searchText,
      results: filteredProducts
    });
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    performSearch();
  };

  // Handle filter icon press
  const handleFilterPress = () => {
    if (onPress) {
      onPress();
    }
  };

  // Handle selecting a search result
  const handleSelectResult = (item) => {
    navigation.navigate('ItemDetails', { productId: item.id });
    setShowResults(false);
    Keyboard.dismiss();
  };

  // Hide results when component unmounts
  useEffect(() => {
    return () => {
      setShowResults(false);
      setIsSearching(false);
    };
  }, []);

  // Render search result item
  const renderSearchResult = ({ item }) => (
    <TouchableOpacity 
      style={styles.resultItem} 
      onPress={() => handleSelectResult(item)}
    >
      <Typo style={styles.resultItemTitle} numberOfLines={1}>{item.name}</Typo>
      <Typo style={styles.resultItemCategory}>{item.category}</Typo>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchContainer, 
        isFocused && styles.searchContainerFocused
      ]}>
        <TouchableOpacity 
          style={styles.searchIcon}
          onPress={handleSearchSubmit}
        >
          <Ionicons name="search" size={20} color={colors.gray} />
        </TouchableOpacity>
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          value={searchText}
          onChangeText={handleTextChange}
          onFocus={() => {
            setIsFocused(true);
            if (searchText.trim().length > 0) {
              setShowResults(true);
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            // Use timeout to allow result selection before hiding
            setTimeout(() => {
              setShowResults(false);
            }, 200);
          }}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        
        {isLoading && isSearching && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIndicator} />
        )}
        
        {showClearButton && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Ionicons name="close-circle" size={18} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.filterGradient}
        >
          <Feather name="sliders" size={18} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Live search results dropdown */}
      {showResults && filteredProducts.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={filteredProducts.slice(0, 5)} // Limit to 5 results for better UX
            renderItem={renderSearchResult}
            keyExtractor={item => item.id}
            scrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          />
          <TouchableOpacity style={styles.viewAllButton} onPress={performSearch}>
            <Typo style={styles.viewAllText}>View all {filteredProducts.length} results</Typo>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    alignItems: 'center',
    zIndex: 10, // Ensure dropdown appears above other content
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius._25,
    alignItems: 'center',
    paddingHorizontal: spacingX._15,
    height: 48,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  searchIcon: {
    marginRight: spacingX._10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: colors.text,
    fontFamily,
  },
  loadingIndicator: {
    marginHorizontal: spacingX._5,
  },
  clearButton: {
    padding: spacingX._5,
  },
  filterButton: {
    marginLeft: spacingX._10,
    width: 48,
    height: 48,
    borderRadius: radius._25,
    overflow: 'hidden',
  },
  filterGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    position: 'absolute',
    top: 70, // Position below search bar
    left: spacingX._15,
    right: spacingX._15,
    backgroundColor: 'white',
    borderRadius: radius._10,
    borderWidth: 1,
    borderColor: colors.lighterGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 300,
    zIndex: 5,
  },
  resultItem: {
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighterGray,
  },
  resultItemTitle: {
    fontSize: 14,
    color: colors.black,
    fontWeight: '500',
  },
  resultItemCategory: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  viewAllButton: {
    paddingVertical: spacingY._12,
    alignItems: 'center',
    backgroundColor: colors.lighterGray,
    borderBottomLeftRadius: radius._10,
    borderBottomRightRadius: radius._10,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default SearchBar;