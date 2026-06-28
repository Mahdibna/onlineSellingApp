import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Typo from './Typo';
import { Octicons } from '@expo/vector-icons';
import colors from '../config/colors';

const ErrorToast = ({ message }) => {
  return (
    <Animated.View style={styles.container}>
      <View style={styles.content}>
        <Octicons name="alert" size={20} color={colors.white} />
        <Typo style={styles.text}>{message}</Typo>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: 15,
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    color: colors.white,
    flex: 1,
  },
});

export default ErrorToast;