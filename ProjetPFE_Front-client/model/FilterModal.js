import { AntDesign, Entypo } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import Typo from 'components/Typo';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  FlatList,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from 'react-query';
import api from 'services/api';

const { height } = Dimensions.get('screen');

function FilterModal({ visible, setVisible, onApplyFilters }) {
  // State for selected filters
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);

  // Fetch categories
  const { data: categories = [] } = useQuery(
    'categories',
    api.getCategories,
    {
      select: (data) => {
        // Flatten categories and subcategories into a single array with parent references
        const allCategories = [];
        const processCategories = (cats, level = 0, parentId = null) => {
          cats.forEach(cat => {
            allCategories.push({
              ...cat,
              level,
              name: cat.nom,
              id: cat.id.toString(),
              parentId,
            });
            if (cat.subCategories && cat.subCategories.length > 0) {
              processCategories(cat.subCategories, level + 1, cat.id.toString());
            }
          });
        };
        processCategories(data);
        return allCategories;
      },
    }
  );

  // Fetch brands
  const { data: brands = [] } = useQuery(
    'brands',
    () =>
      api.getAllProducts().then(products => {
        const brandSet = new Set();
        products.forEach(product => {
          if (product.nom) {
            const brandMatch = product.nom.split(' ')[0];
            if (brandMatch) brandSet.add(brandMatch);
          }
        });
        return Array.from(brandSet).map((brand, index) => ({
          id: index.toString(),
          name: brand,
        }));
      }),
    {
      enabled: visible,
    }
  );

  // Get max price for slider
  const { data: maxPrice = 1000 } = useQuery(
    'maxPrice',
    () =>
      api.getAllProducts().then(products => {
        if (!products || products.length === 0) return 1000;
        return Math.ceil(Math.max(...products.map(p => p.prix || 0)) * 1.1);
      }),
    {
      enabled: visible,
      initialData: 1000,
    }
  );

  // Handle category selection
  const handleSelectCategories = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Handle brand selection
  const handleSelectBrands = (name) => {
    setSelectedBrands(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  // Handle rating selection
  const handleSelectRating = (rating) => {
    setMinRating(rating === minRating ? 0 : rating);
  };

  // Get all relevant category IDs (including subcategories)
  const getAllCategoryIds = (selectedCatIds) => {
    const allIds = new Set(selectedCatIds);
    selectedCatIds.forEach(catId => {
      // Add all subcategories of selected categories
      categories.forEach(cat => {
        if (cat.parentId === catId || allIds.has(cat.parentId)) {
          allIds.add(cat.id);
        }
      });
    });
    return Array.from(allIds);
  };

  // Apply filters
  const applyFilters = async () => {
    try {
      // Get all relevant category IDs including subcategories
      const allCategoryIds = getAllCategoryIds(selectedCategories);

      // Fetch products for all selected categories
      let allProducts = [];
      if (allCategoryIds.length > 0) {
        const productPromises = allCategoryIds.map(catId =>
          api.getProductsByCategory(catId, true)
        );
        const productResults = await Promise.all(productPromises);
        // Flatten and remove duplicates based on product ID
        const productMap = new Map();
        productResults.forEach(products =>
          products.forEach(product => {
            if (!productMap.has(product.id)) {
              productMap.set(product.id, product);
            }
          })
        );
        allProducts = Array.from(productMap.values());
      } else {
        // If no categories selected, get all products
        allProducts = await api.getAllProducts(true);
      }

      // Apply filters
      const filteredProducts = allProducts.filter(product => {
        // Brand filter
        if (selectedBrands.length > 0) {
          const productBrand = product.nom.split(' ')[0];
          if (!selectedBrands.includes(productBrand)) return false;
        }

        // Rating filter
        if (minRating > 0 && product.averageRating != null) {
          if (product.averageRating < minRating) return false;
        }

        // Discount filter
        if (
          hasDiscount &&
          product.promotionPartenaire === 0 &&
          product.promotionParticulier === 0
        ) {
          return false;
        }

        // Price filter
        const price = product.prix || 0;
        if (price < priceRange[0] || price > priceRange[1]) return false;

        return true;
      });

      // Pass filtered products and filter parameters to parent
      const filters = {
        categories: allCategoryIds,
        brands: selectedBrands,
        minRating,
        hasDiscount,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        filteredProducts,
      };
      onApplyFilters(filters);
      setVisible(false);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setMinRating(0);
    setHasDiscount(false);
    setPriceRange([0, maxPrice]);
  };

  // Update price range when maxPrice changes
  useEffect(() => {
    if (maxPrice && maxPrice !== priceRange[1]) {
      setPriceRange([0, maxPrice]);
    }
  }, [maxPrice]);

  return (
    <Modal transparent visible={visible} animationType="slide">
      <TouchableOpacity
        onPress={() => setVisible(false)}
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          height: height * 0.2,
        }}
      />
      <View activeOpacity={1} style={styles.container}>
        <View style={styles.filters}>
          <Typo size={25} style={{ fontWeight: '700' }}>
            Filters
          </Typo>
          <TouchableOpacity
            style={styles.crossIcon}
            onPress={() => setVisible(false)}
          >
          <Entypo name="cross" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={{ paddingBottom: '15%' }}
          showsVerticalScrollIndicator={false}
        >
          {/* Categories Filter */}
          <Heading title={'Categories'} index={1} />
          <Animated.ScrollView
            horizontal
            entering={FadeInDown.delay(1 * 130)
              .duration(300)
              .springify()
              .damping(12)
              .stiffness(80)}
          >
            <FlatList
              scrollEnabled={false}
              data={categories}
              numColumns={3}
              contentContainerStyle={{ gap: spacingY._10 }}
              columnWrapperStyle={{ gap: spacingX._10 }}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    {
                      marginLeft: item.level * 15,
                      backgroundColor: selectedCategories.includes(item.id)
                        ? colors.lightPrimary
                        : 'transparent',
                    },
                  ]}
                  onPress={() => handleSelectCategories(item.id)}
                >
                  {selectedCategories.includes(item.id) ? (
                    <AntDesign
                      name="checkcircle"
                      size={18}
                      color={colors.primary}
                    />
                  ) : (
                    <View style={styles.circle} />
                  )}
                  <Typo>{item.name}</Typo>
                </TouchableOpacity>
              )}
            />
          </Animated.ScrollView>

          {/* Brands Filter */}
          {brands.length > 0 && (
            <>
              <Heading title={'Sub categories'} index={2} />
              <Animated.ScrollView
                horizontal
                entering={FadeInDown.delay(2 * 130)
                  .duration(300)
                  .springify()
                  .damping(12)
                  .stiffness(80)}
              >
                <FlatList
                  scrollEnabled={false}
                  data={brands}
                  numColumns={3}
                  contentContainerStyle={{ gap: spacingY._10 }}
                  columnWrapperStyle={{ gap: spacingX._10 }}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.listItem,
                        {
                          backgroundColor: selectedBrands.includes(item.name)
                            ? colors.lightPrimary
                            : 'transparent',
                        },
                      ]}
                      onPress={() => handleSelectBrands(item.name)}
                    >
                      {selectedBrands.includes(item.name) ? (
                        <AntDesign
                          name="checkcircle"
                          size={18}
                          color={colors.primary}
                        />
                      ) : (
                        <View style={styles.circle} />
                      )}
                      <Typo>{item.name}</Typo>
                    </TouchableOpacity>
                  )}
                />
              </Animated.ScrollView>
            </>
          )}

          {/* Rating Filter */}
          <Heading title={'Minimum Rating'} index={3} />
          <Animated.View
            entering={FadeInDown.delay(3 * 130)
              .duration(300)
              .springify()
              .damping(12)
              .stiffness(80)}
            style={styles.ratingContainer}
          >
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => handleSelectRating(star)}
                style={styles.starButton}
              >
                <AntDesign
                  name={star <= minRating ? 'star' : 'staro'}
                  size={24}
                  color={star <= minRating ? '#FFC300' : colors.lightGray}
                />
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Discount Filter */}
          <Heading title={'Discount'} index={4} />
          <Animated.View
            entering={FadeInDown.delay(4 * 130)
              .duration(300)
              .springify()
              .damping(12)
              .stiffness(80)}
            style={styles.discountContainer}
          >
            <TouchableOpacity
              style={[
                styles.discountButton,
                hasDiscount && { backgroundColor: colors.lightPrimary },
              ]}
              onPress={() => setHasDiscount(!hasDiscount)}
            >
              {hasDiscount ? (
                <AntDesign
                  name="checkcircle"
                  size={18}
                  color={colors.primary}
                />
              ) : (
                <View style={styles.circle} />
              )}
              <Typo>Show only discounted items</Typo>
            </TouchableOpacity>
          </Animated.View>

          {/* Price Range Filter */}
          <Heading title={'Price Range'} index={5} />
          <Animated.View
            entering={FadeInDown.delay(5 * 130)
              .duration(300)
              .springify()
              .damping(12)
              .stiffness(80)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Typo>{priceRange[0].toFixed(2)} TND</Typo>
              <Typo>{priceRange[1].toFixed(2)} TND</Typo>
            </View>
            <Slider
              minimumValue={0}
              maximumValue={maxPrice}
              step={1}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.lightGray}
              thumbTintColor={colors.primary}
              value={priceRange}
              onValueChange={value => setPriceRange(value)}
            />
          </Animated.View>

          {/* Apply/Reset Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={applyFilters}
              style={[styles.footerButton, { backgroundColor: colors.primary }]}
            >
              <Typo
                size={13}
                style={{ color: colors.white, fontWeight: '600' }}
              >
                Apply Filters
              </Typo>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={resetFilters}
              style={[
                styles.footerButton,
                { backgroundColor: colors.lighterGray },
              ]}
            >
              <Typo
                size={13}
                style={{ color: colors.black, fontWeight: '600' }}
              >
                Reset
              </Typo>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const Heading = ({ title, index }) => {
  return (
    <Animated.View
      style={{ marginBottom: 11 }}
      entering={FadeInDown.delay(index * 130)
        .duration(300)
        .springify()
        .damping(12)
        .stiffness(80)}
    >
      <Typo size={16} style={styles.heading}>
        {title}
      </Typo>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopRightRadius: radius._20,
    borderTopLeftRadius: radius._20,
    marginTop: -spacingY._20,
    paddingHorizontal: spacingX._20,
  },
  heading: {
    fontWeight: '700',
    marginTop: spacingY._20,
  },
  crossIcon: {
    backgroundColor: colors.lighterGray,
    borderRadius: radius._10,
    padding: spacingY._5,
    marginTop: spacingY._10,
  },
  circle: {
    height: 17,
    width: 17,
    borderRadius: radius._10,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  listItem: {
    flexDirection: 'row',
    borderWidth: 1,
    padding: spacingY._5,
    paddingHorizontal: spacingY._7,
    borderRadius: spacingY._20,
    gap: spacingX._5,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: spacingY._20,
  },
  footerButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    marginTop: spacingY._10,
    borderRadius: radius._15,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: spacingY._5,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._10,
  },
  starButton: {
    padding: spacingY._5,
  },
  discountContainer: {
    paddingHorizontal: spacingX._10,
    marginBottom: spacingY._10,
  },
  discountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._5,
    padding: spacingY._10,
    borderRadius: radius._10,
  },
});

export default FilterModal;