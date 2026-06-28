import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthAPI from './AuthAPI';
import AuthContext from './AuthContext';
import apiClient, { setupInterceptors } from '../api/apiClient';

export const AuthProvider = ({ children }) => {
    const [state, setState] = useState({
      user: null,
      token: null,
      isLoading: true
    });
  
    // Define logout function early so we can use it in setupInterceptors
    const logout = async () => {
      try {
        await Promise.all([
          AsyncStorage.removeItem('token'),
          AsyncStorage.removeItem('user')
        ]);
        setState({
          user: null,
          token: null,
          isLoading: false
        });
      } catch (error) {
        console.error('Logout failed', error);
      }
    };

    useEffect(() => {
        // Setup API interceptors with our logout function
        setupInterceptors(logout);
        
        const loadUserFromStorage = async () => {
          try {
            const [token, userData] = await Promise.all([
              AsyncStorage.getItem('token'),
              AsyncStorage.getItem('user')
            ]);
      
            if (token && userData) {
              setState({
                user: JSON.parse(userData),
                token,
                isLoading: false
              });
            } else {
              setState(prev => ({ ...prev, isLoading: false }));
            }
          } catch (error) {
            console.error('Auth load error:', error);
            setState(prev => ({ ...prev, isLoading: false }));
          }
        };
        
        loadUserFromStorage();
      }, []);
    const login = async (email, password) => {
        try {
          setState(prev => ({ ...prev, isLoading: true }));
          
          console.log('AuthProvider: Starting login process');
          
          // Test connection first
          try {
            await AuthAPI.testConnection();
            console.log('AuthProvider: Connection test successful');
          } catch (error) {
            console.error('AuthProvider: Connection test failed', error);
            setState(prev => ({ ...prev, isLoading: false }));
            throw {
              message: 'Cannot connect to server. Please check your network connection.',
              status: 0
            };
          }
          
          console.log('AuthProvider: Calling login API');
          const { token, user } = await AuthAPI.login(email, password);
          console.log('AuthProvider: Login successful, received token and user data');
          
          await Promise.all([
            AsyncStorage.setItem('token', token),
            AsyncStorage.setItem('user', JSON.stringify(user))
          ]);
          console.log('AuthProvider: Credentials stored in AsyncStorage');
          
          setState({
            user,
            token,
            isLoading: false
          });
          
          return true;
        } catch (error) {
          console.error('AuthProvider: Login process failed', error);
          setState(prev => ({ ...prev, isLoading: false }));
          
          let errorMessage = error.message;
          if (error.status === 401) {
            errorMessage = 'Invalid email or password';
          } else if (error.status === 0) {
            errorMessage = 'Network error, please check your connection';
          }
      
          throw { ...error, message: errorMessage };
        }
      };

    const setUser = async (userData) => {
      try {
        if (userData) {
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          setState(prev => ({ ...prev, user: userData }));
        } else {
          await AsyncStorage.removeItem('user');
          setState(prev => ({ ...prev, user: null }));
        }
      } catch (error) {
        console.error('Error setting user data', error);
      }
    };

    return (
      <AuthContext.Provider
        value={{
          user: state.user,
          token: state.token,
          isLoading: state.isLoading,
          isAuthenticated: !!state.user,
          login,
          logout,
          setUser
        }}
      >
        {children}
      </AuthContext.Provider>
    );
};

export default AuthProvider;