// Enhanced DetailsSelector.js
import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import colors from '../config/colors';
import { normalizeX, normalizeY } from '../utils/normalize';
import Typo from './Typo';
import { radius, spacingX, spacingY } from '../config/spacing';
import { AntDesign } from '@expo/vector-icons';

const { width } = Dimensions.get('screen');
const containerWidth = width - 2 * spacingX._20;

function DetailsSelector({ selected, setSelected, reviewCount = 0 }) {
  const animatedValue = useRef(new Animated.Value(selected === 'Description' ? 0 : 1)).current;
  
  const handleSelect = (tab) => {
    Animated.spring(animatedValue, {
      toValue: tab === 'Description' ? 0 : 1,
      friction: 8,
      tension: 50,
      useNativeDriver: false,
    }).start();
    
    setSelected(tab);
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, containerWidth * 0.5],
  });

  return (
    <View style={styles.containerWrapper}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.selectedView,
            {
              transform: [{ translateX }],
            },
          ]}
        />
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.textContainer}
          onPress={() => handleSelect('Description')}
        >
          <Typo
            size={14}
            style={{
              fontWeight: '600',
              color: selected === 'Description' ? colors.white : colors.darkGray,
            }}>
            Description
          </Typo>
        </TouchableOpacity>
        
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.textContainer}
          onPress={() => handleSelect('Reviews')}
        >
          <View style={styles.reviewsTabContent}>
            <Typo
              size={14}
              style={{
                fontWeight: '600',
                color: selected === 'Reviews' ? colors.white : colors.darkGray,
              }}>
              Reviews
            </Typo>
            
            {reviewCount > 0 && (
              <View style={styles.reviewCountBadge}>
                <Typo size={10} style={styles.reviewCountText}>
                  {reviewCount}
                </Typo>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    marginHorizontal: spacingX._20,
    marginVertical: spacingY._20,
  },
  container: {
    flexDirection: 'row',
    borderRadius: radius._30,
    overflow: 'hidden',
    backgroundColor: colors.inputField,
    height: 48,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectedView: {
    backgroundColor: colors.primary,
    width: containerWidth * 0.5,
    height: '100%',
    position: 'absolute',
    borderRadius: radius._30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    zIndex: 1,
  },
  reviewsTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCountBadge: {
    backgroundColor: colors.white,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  reviewCountText: {
    color: colors.primary,
    fontWeight: 'bold',
  }
});

export default DetailsSelector;