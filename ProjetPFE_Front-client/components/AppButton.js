import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import colors from 'config/colors';
import { height, radius, spacingY } from 'config/spacing';
import Typo from './Typo';

function AppButton({ label, style, onPress }) {
  return (
    <TouchableOpacity style={[styles.button, { ...style }]} onPress={onPress}>
      <Typo style={{ color: colors.white, fontWeight: '500' }} size={18}>
        {label}
      </Typo>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  button: {
    height: height.btn,
    backgroundColor: colors.primary,
    width: '100%',
    marginTop: spacingY._15,
    borderRadius: radius._15,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
export default AppButton;
