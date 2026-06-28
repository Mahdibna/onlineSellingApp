// src/components/EmptyState.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Typo from './Typo';
import colors from '../config/colors';
import { spacingY } from '../config/spacing';

const EmptyState = ({ icon, title, message, iconSize = 60, iconColor = colors.primary }) => {
  return (
    <View style={styles.container}>
      <MaterialIcons name={icon} size={iconSize} color={iconColor} />
      <Typo size={18} style={styles.title}>{title}</Typo>
      <Typo style={styles.message}>{message}</Typo>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingY._20,
  },
  title: {
    fontWeight: 'bold',
    marginTop: spacingY._16,
    marginBottom: spacingY._8,
  },
  message: {
    textAlign: 'center',
    color: colors.darkGray,
  }
});

export default EmptyState;