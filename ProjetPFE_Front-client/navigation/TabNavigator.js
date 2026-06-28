import React from 'react'; 
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; 
import FavouritesScreen from 'screens/FavouritesScreen'; 
import HomeScreen from 'screens/HomeScreen'; 
import CartScreen from 'screens/CartScreen'; 
import ProfileScreen from 'screens/ProfileScreen'; 
import PackScreen from 'screens/PackScreen';
import NotificationsScreen from 'screens/NotificationsScreen';
import NewBottomTab from 'components/NewBottomTab'; 
import useAuth from 'auth/useAuth';
import { useNotifications } from 'auth/NotificationsContext'; 

const Tab = createBottomTabNavigator(); 

const TabNavigator = () => { 
  // Use the existing useAuth hook to get user information 
  const { user } = useAuth();
  // Get unread notification count
  const { unreadCount } = useNotifications();
  
  // Check if user has partner authorization by examining the roles array 
  const isPartner = user?.roles?.includes("ROLE_USERPARTNER");

  
  return (
    <Tab.Navigator 
      initialRouteName="Home" 
      tabBar={(props) => <NewBottomTab {...props} isPartner={isPartner} unreadCount={unreadCount} />}
      screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      {isPartner && <Tab.Screen name="Pack" component={PackScreen} />}
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Favourites" component={FavouritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  ); 
}; 

export default TabNavigator;