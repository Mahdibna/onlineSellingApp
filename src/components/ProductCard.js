// src/components/ProductCard.js

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import theme from '../styles/theme';

const ProductCard = ({ product, onPress, onAddToCart }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress && onPress(product)}
      style={styles.wrapper}
      accessibilityRole="button"
      accessibilityLabel={`View ${product.title}`}
    >
      <View style={styles.card}>
        <View style={styles.imageWrap}>
          {/* Use resizeMode 'cover' to fill width while preserving aspect ratio */}
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>

        <View style={styles.content}>
          <Text numberOfLines={2} style={styles.title}>
            {product.title}
          </Text>

          <Text style={styles.price}>${product.price?.toFixed?.(2) ?? product.price}</Text>

          <TouchableOpacity
            onPress={() => onAddToCart && onAddToCart(product)}
            style={styles.addButton}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.title} to cart`}
          >
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: theme.spacing.s,
    minWidth: 0,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    // elevation/shadow
    ...theme.shadows.card,
  },
  imageWrap: {
    width: '100%',
    height: 220,
    backgroundColor: '#f6f6f6',
    overflow: 'hidden', // ensure image corners don't clip aesthetic
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: theme.spacing.m,
  },
  title: {
    color: theme.colors.textPrimaryStart,
    fontSize: theme.typography.heading.fontSize,
    fontWeight: theme.typography.heading.fontWeight,
    marginBottom: theme.spacing.s,
  },
  price: {
    color: theme.colors.textPrimaryEnd,
    fontSize: theme.typography.subheading.fontSize,
    fontWeight: theme.typography.subheading.fontWeight,
    marginBottom: theme.spacing.m,
  },
  addButton: {
    backgroundColor: theme.colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44, // accessible touch target
  },
  addButtonText: {
    color: theme.colors.primaryButtonContrast,
    fontWeight: theme.typography.button.fontWeight,
    fontSize: theme.typography.button.fontSize,
  },
});

export default ProductCard;
