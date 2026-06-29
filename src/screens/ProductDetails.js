// src/screens/ProductDetails.js

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import theme from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Chip = ({ label, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}
    activeOpacity={0.85}
    accessibilityRole="button"
    accessibilityState={{ selected }}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

const ProductDetails = ({ route, navigation, onAddToCart }) => {
  const product = route?.params?.product ?? {};
  const [selectedSize, setSelectedSize] = useState(
    product.sizes && product.sizes.length ? product.sizes[0] : null
  );
  const [selectedColor, setSelectedColor] = useState(
    product.colors && product.colors.length ? product.colors[0] : null
  );

  // Simple fade-in for image
  const imageOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, [imageOpacity]);

  const handleAddToCart = () => {
    onAddToCart && onAddToCart({ ...product, size: selectedSize, color: selectedColor });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.imageContainer, { opacity: imageOpacity }]}>
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        </Animated.View>

        <View style={styles.info}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>${product.price?.toFixed?.(2) ?? product.price}</Text>

          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{product.description ?? 'No description.'}</Text>

          {product.sizes && product.sizes.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Size</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
                {product.sizes.map((size) => (
                  <Chip
                    key={size}
                    label={size}
                    selected={selectedSize === size}
                    onPress={() => setSelectedSize(size)}
                  />
                ))}
              </ScrollView>
            </>
          )}

          {product.colors && product.colors.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
                {product.colors.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color },
                        isSelected && styles.colorSwatchSelected,
                      ]}
                      activeOpacity={0.9}
                      accessibilityRole="button"
                      accessibilityLabel={`Select color ${color}`}
                    />
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>

        {/* Add some bottom padding so content is not hidden behind floating button */}
        <View style={{ height: 92 }} />
      </ScrollView>

      <View style={styles.floatingContainer}>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={handleAddToCart}
          activeOpacity={0.9}
          accessibilityRole="button"
        >
          <Text style={styles.cartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: SCREEN_WIDTH * 0.95,
    backgroundColor: '#f6f6f6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    padding: theme.spacing.m,
  },
  title: {
    color: theme.colors.textPrimaryStart,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: theme.spacing.s,
  },
  price: {
    color: theme.colors.textPrimaryEnd,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.m,
  },
  sectionLabel: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s / 2,
  },
  description: {
    color: theme.colors.textPrimaryEnd,
    fontSize: theme.typography.body.fontSize,
    lineHeight: 20,
  },
  row: {
    marginVertical: theme.spacing.s,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginRight: theme.spacing.s,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: theme.colors.primaryButton,
  },
  chipUnselected: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipText: {
    fontSize: 14,
    color: theme.colors.textPrimaryEnd,
  },
  chipTextSelected: {
    color: theme.colors.primaryButtonContrast,
    fontWeight: '700',
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: theme.spacing.s,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: theme.colors.primaryButton,
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  cartButton: {
    width: '100%',
    backgroundColor: theme.colors.primaryButton,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    // shadow
    ...theme.shadows.elevated,
    minHeight: 56,
  },
  cartButtonText: {
    color: theme.colors.primaryButtonContrast,
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
  },
});

export default ProductDetails;
