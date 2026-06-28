import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { normalizeY } from '../utils/normalize';
import colors from '../config/colors';
import { fontFamily } from '../config/typography';

const Typo = ({ size, weight, alignCenter, style, children, ...props }) => {
  return (
    <Text
      allowFontScaling={false}
      style={[
        styles.default,
        {
          fontSize: size ? normalizeY(size) : normalizeY(14),
          fontWeight: weight || '400',
          textAlign: alignCenter ? 'center' : 'auto',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  default: {
    color: colors.text,
    fontFamily,
  },
});

export default Typo;
