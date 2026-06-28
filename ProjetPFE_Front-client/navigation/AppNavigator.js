import React from 'react';
import TabNavigator from './TabNavigator';
import { createStackNavigator } from '@react-navigation/stack';
import ItemDetailsScreen from 'screens/ItemDetailsScreen';
import CartScreen from 'screens/CartScreen';
import SigninScreen from '../screens/SigninScreen';
import NotificationsScreen from 'screens/NotificationsScreen';
import CheckoutScreen from 'screens/CheckoutScreen';
import EditProfileScreen from 'screens/EditProfileScreen';
import SavedAddressesScreen from 'screens/SavedAddressesScreen';
import MyOrdersScreen from 'screens/MyOrdersScreen';
import EditAddressScreen from 'screens/EditAddressScreen';
import CategoriesScreen from 'screens/CategoriesScreen';
import OrderDetailsScreen from 'screens/OrderDetailsScreen';
import CreateComplaintScreen from 'screens/CreateComplaintScreen '; 
import ComplaintsScreen from 'screens/ComplaintsScreen'
import PackDetailsScreen from 'screens/PackDetailsScreen';
import CategoryDetailScreen from 'screens/CategoryDetailScreen';
import AllProductsScreen from 'screens/AllProductsScreen';
import AddDeliveryAddress from 'screens/AddDeliveryAddress';
import SearchResultsScreen from 'screens/SearchResultsScreen';
import PartnerApplicationScreen from 'screens/PartnerApplicationScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import ChatbotScreen from 'screens/ChatbotScreen'; // Add this import

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={'Splash'}
      screenOptions={{ headerShown: false, orientation: 'portrait' }}>
      <Stack.Screen name="TabNavigator" component={TabNavigator} />
      <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} />
      <Stack.Screen name="CartScreen" component={CartScreen} />
      <Stack.Screen name="Chatbot" component={ChatbotScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ headerShown: false,}}/>
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen}/>
      <Stack.Screen name="AddDeliveryAddress" component={AddDeliveryAddress} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="EditAddress" component={EditAddressScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="CreateComplaint" component={CreateComplaintScreen} />
      <Stack.Screen name="Complaints" component={ComplaintsScreen} />
      <Stack.Screen name="PackDetails" component={PackDetailsScreen} />
      <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
      <Stack.Screen name="AllProducts" component={AllProductsScreen} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
      <Stack.Screen name="PartnerApplication" component={PartnerApplicationScreen} options={{ title: 'Become a Partner' }}/>
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
     <Stack.Screen name="Signin" component={SigninScreen} />
      

    </Stack.Navigator>
  );
};

export default AppNavigator;
