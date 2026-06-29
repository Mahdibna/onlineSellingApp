// src/screens/ProductList.js

import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Text,
  RefreshControl,
} from 'react-native';
import ProductCard from '../components/ProductCard';
import theme from '../styles/theme';

const ProductList = ({ navigation, products = [], onAddToCart, refreshing, onRefresh }) => {
  const renderItem = useCallback(
    ({ item }) => (
      <ProductCard
        product={item}
        onPress={(p) => navigation?.navigate?.('ProductDetails', { product: p })}
        onAddToCart={onAddToCart}
      />
    ),
    [navigation, onAddToCart]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
      </View>

      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        numColumns={1}
        refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No products found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimaryStart,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.s,
  },
  empty: {
    padding: theme.spacing.l,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.muted,
  },
});

export default ProductList;
