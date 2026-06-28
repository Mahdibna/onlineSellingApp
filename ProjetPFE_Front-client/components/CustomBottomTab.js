import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Keyboard, Image } from 'react-native';
import { FontAwesome5, Ionicons, AntDesign, Feather } from '@expo/vector-icons'; // Import necessary icon sets
import { normalizeX, normalizeY } from '../utils/normalize';
import colors from 'config/colors';

const CustomBottomTab = ({ state, navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const tabs = [
    { name: 'Favouties', iconSet: FontAwesome5, iconName: 'heart' },
    { name: 'Home', iconSet: AntDesign, iconName: 'home' },
    { name: 'Cart', iconSet: Feather, iconName: 'shopping-cart' },
    { name: 'Profile', iconSet: Ionicons, iconName: 'person-outline' },
  ];

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // if (isKeyboardVisible) {
  //   return <View style={{ marginVertical: -100 }}></View>;
  // }

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/navbar.png')}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          resizeMode: 'stretch',
          left: 0,
        }}
      />
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;
        const routeName = state.routes[index].name;
        const IconComponent = tab.iconSet;
        return (
          <TouchableOpacity
            key={index}
            style={styles.tabContent}
            onPress={() => {
              // console.log('===>', routeName);
              if (routeName == 'Cart') navigation.navigate('CartScreen');
              else navigation.navigate(routeName);
            }}>
            {tab.name == 'Home' ? (
              <View
                style={{
                  backgroundColor: colors.primary,
                  height: normalizeX(60),
                  width: normalizeX(60),
                  borderRadius: normalizeX(30),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 85,
                }}>
                <IconComponent name={tab.iconName} size={24} color={colors.white} />
              </View>
            ) : (
              <IconComponent
                name={tab.iconName}
                size={24}
                color={isFocused ? colors.primary : colors.gray}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CustomBottomTab;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    bottom: 0,
    height: 70,
    // paddingBottom: normalizeY(20),
    // paddingTop: normalizeY(10),
    position: 'absolute',
    justifyContent: 'space-evenly',
    // shadowColor: colors.black,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.1,
    elevation: 10,
  },
  tabContent: {
    justifyContent: 'space-around',
    alignItems: 'center',
    height: normalizeY(35),
    paddingHorizontal: normalizeX(8),
  },
  icon: {
    width: normalizeY(15),
    height: normalizeY(15),
  },
});
