import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, View, ActivityIndicator, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from 'react-query';

import { AuthProvider } from './auth/AuthProvider';
import { NotificationsProvider } from './auth/NotificationsContext';
import { useAuth } from './auth/useAuth';
import AppNavigator from './navigation/AppNavigator';
import AuthNavigator from './navigation/AuthNavigator';

const queryClient = new QueryClient();

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

// Create this component to conditionally render navigators
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Return either the authenticated navigator or the auth navigator
  return isAuthenticated ? (
    <NotificationsProvider>
      <AppNavigator />
    </NotificationsProvider>
  ) : (
    <AuthNavigator />
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" />
            <AppContent />
          </NavigationContainer>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
