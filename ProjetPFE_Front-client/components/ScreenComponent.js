import { Platform, View, Dimensions } from 'react-native';
import React from 'react';
import colors from 'config/colors';

const { height } = Dimensions.get('window');

export default function ScreenComponent({ style, children }) {
  let paddingTop = Platform.OS === 'ios' ? height * 0.06 : 10;

  return (
    <View style={[{ paddingTop, backgroundColor: colors.background }, { ...style }]} flex={1}>
      {children}
    </View>
  );
}
