import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import React from 'react';
import Animated, { FadeInRight } from 'react-native-reanimated';
import Typo from './Typo';
import { normalizeX, normalizeY } from 'utils/normalize';
import { radius, spacingY } from 'config/spacing';
import colors from 'config/colors';

const CategoryItem = ({ item, isSelected, onPress, index, keyValue }) => {
  return (
    <Animated.View
      key={`${keyValue}-${index}`}
      style={styles.pillContainer}
      entering={FadeInRight.delay(index * 80).duration(600).damping(14).springify()}
    >
      <TouchableOpacity 
        style={[styles.pill, isSelected ? styles.pillSelected : styles.pillUnselected]} 
        onPress={() => onPress(item.name)} 
        activeOpacity={0.8}
      >
        {item.image && (
          <Image source={item.image} style={styles.pillImg} />
        )}
        <Typo
          size={13}
          weight={isSelected ? '600' : '500'}
          style={[styles.catName, isSelected ? styles.catNameSelected : styles.catNameUnselected]}
          numberOfLines={1}
        >
          {item.name}
        </Typo>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pillContainer: {
    marginHorizontal: normalizeX(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalizeX(16),
    paddingVertical: normalizeY(6),
    borderRadius: radius._20,
    borderWidth: 1,
    height: normalizeY(38),
  },
  pillSelected: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  pillUnselected: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E5E7EB',
  },
  pillImg: {
    width: normalizeY(20),
    height: normalizeY(20),
    borderRadius: normalizeY(10),
    marginRight: normalizeX(8),
    resizeMode: 'cover',
  },
  catName: {
    textAlign: 'center',
  },
  catNameSelected: {
    color: colors.white,
  },
  catNameUnselected: {
    color: colors.text,
  },
});

export default CategoryItem;
