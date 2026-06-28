import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Animated, StyleSheet, Dimensions, View } from 'react-native';
import Typo from './Typo';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
const { width } = Dimensions.get('screen');
const containerWidth = width - 30;

function StartSelector({ selected, setSelected }) {
  const animatedValue = new Animated.Value(0);
  const navigation = useNavigation();
  const [startRange, setStartRange] = useState(0);
  const [endRange, setEndRange] = useState(0);

  const handleSelect = (text) => {
    const range = text == 'Register' ? 0 : text == 'Sign in' ? containerWidth * 0.45 : 0;
    setStartRange(endRange);
    setEndRange(range);
    setSelected(text);
    const screen = text == 'Register' ? 'Register' : 'Signin';
    setTimeout(() => {
      navigation.navigate(screen);
    }, 200);
  };

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 6,
      useNativeDriver: false,
    }).start();
  }, [selected]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startRange, endRange],
  });

  return (
    <View style={styles.container} tint="extra-light">
      <Animated.View
        style={[
          styles.selectedView,
          {
            transform: [{ translateX }],
          },
        ]}
      />
      <TouchableOpacity style={styles.textContainer} onPress={() => handleSelect('Register')}>
        <Typo size={16} numberOfLines={1} adjustsFontSizeToFit style={{ fontWeight: '500' }}>
          Register
        </Typo>
      </TouchableOpacity>
      <TouchableOpacity style={styles.textContainer} onPress={() => handleSelect('Sign in')}>
        <Typo size={16} numberOfLines={1} adjustsFontSizeToFit style={{ fontWeight: '500' }}>
          Sign in
        </Typo>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedView: {
    backgroundColor: colors.white,
    width: containerWidth / 2 - spacingX._10,
    height: '100%',
    position: 'absolute',
    borderRadius: radius._15,
    borderCurve: 'continuous',
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: radius._15,
    borderCurve: 'continuous',
    // overflow: 'hidden',
    backgroundColor: colors.lightprimary,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    width: '90%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  textContainer: {
    flex: 1,
    paddingVertical: spacingY._15,
    alignItems: 'center',
  },
});

export default StartSelector;
