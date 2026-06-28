import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Animated,
  Dimensions,
} from 'react-native';
import { FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';
import { normalizeX, normalizeY } from '../utils/normalize';
import colors from 'config/colors';
import { spacingY } from 'config/spacing';
const { width } = Dimensions.get('screen');
const NewBottomTab = ({ state, navigation, isPartner }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  // Define base tabs that all users will see
  const tabs = [
    { name: 'Home', iconSet: FontAwesome5, iconName: 'home' },
    { name: 'Cart', iconSet: Feather, iconName: 'shopping-cart' },
  ];
  // Conditionally add Pack tab for partners
  if (isPartner) {
    tabs.push({ name: 'Pack', iconSet: Feather, iconName: 'package' });
  }
  // Add remaining tabs (excluding Notifications)
  tabs.push(
    { name: 'Favourites', iconSet: FontAwesome5, iconName: 'heart' },
    { name: 'Profile', iconSet: Ionicons, iconName: 'person-outline' }
  );
  // Calculate the tab width based on the number of tabs
  const tabWidth = width / tabs.length;
  const handleSelect = (routeName) => {
    navigation.navigate(routeName);
  };
  const openChatbot = () => {
    navigation.navigate('Chatbot');
  };
  // Update the animated value when the focused route changes
  useEffect(() => {
    const focusedRouteIndex = state.routes.findIndex(
      route => route.name === state.routes[state.index].name
    );
    
    Animated.spring(animatedValue, {
      toValue: focusedRouteIndex,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [state.index, state.routes, animatedValue]);

  // Calculate the translation based on the current index
  const translateX = animatedValue.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => i * tabWidth + tabWidth / 2 - normalizeX(3)),
  });

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

  // Don't show the tab bar when keyboard is visible
  if (isKeyboardVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Floating chatbot button */}
      <TouchableOpacity 
        style={styles.chatbotButton}
        onPress={openChatbot}
      >
        <FontAwesome5 name="robot" size={24} color={colors.white} />
      </TouchableOpacity>
      
      <Animated.View
        style={[
          styles.animationBar,
          {
            transform: [{ translateX }],
            position: 'absolute',
            bottom: normalizeY(18),
          },
        ]}
      />
      
      {tabs.map((tab, index) => {
        // Find the corresponding route in state.routes
        const route = state.routes.find(r => r.name === tab.name);
        if (!route) return null;
        
        const isFocused = state.index === state.routes.findIndex(r => r.name === tab.name);
        const IconComponent = tab.iconSet;
        
        return (
          <TouchableOpacity
            key={index}
            style={styles.tabContent}
            onPress={() => handleSelect(tab.name)}>
            <IconComponent
              name={tab.iconName}
              size={24}
              color={isFocused ? colors.primary : colors.black}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    bottom: 0,
    height: 75,
    backgroundColor: colors.white,
    position: 'absolute',
    justifyContent: 'space-evenly',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.1,
    elevation: 10,
    paddingBottom: spacingY._15,
  },
  tabContent: {
    justifyContent: 'space-around',
    alignItems: 'center',
    height: normalizeY(35),
    paddingHorizontal: normalizeX(8),
    flex: 1,
  },
  animationBar: {
    backgroundColor: colors.primary,
    width: normalizeX(6),
    height: normalizeY(6),
    borderRadius: normalizeY(8),
  },
  chatbotButton: {
    position: 'absolute',
    bottom: normalizeY(65),
    right: normalizeX(20),
    backgroundColor: colors.orange,
    width: normalizeY(50),
    height: normalizeY(50),
    borderRadius: normalizeY(25),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
});

export default NewBottomTab;