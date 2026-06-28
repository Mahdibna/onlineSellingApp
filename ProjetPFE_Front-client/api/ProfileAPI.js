import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ProfileAPI = {
  getCurrentProfile: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await apiClient.get('/api/clients/profile');
      console.log("data nom :",  response.data)
      return response.data;
    } catch (error) {
      console.error('Profile fetch detailed error:', error.message);
      if (error.response) {
        throw {
          message: error.response.data?.message || error.response.data || 'Failed to fetch profile',
          status: error.response.status,
          data: error.response.data
        };
      } else if (error.request) {
        throw {
          message: 'Network error, please check your connection',
          status: 0
        };
      } else {
        throw {
          message: error.message || 'An unexpected error occurred',
          status: 0
        };
      }
    }
  },
  
  updateProfile: async (formData) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
  
      const response = await apiClient.put('/api/clients/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        transformRequest: (data) => data, 
      });
  
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (error.response) {
        console.error('Server response:', error.response.data);
        throw {
          message: error.response.data?.message || 'Failed to update profile',
          status: error.response.status,
          data: error.response.data
        };
      } else if (error.request) {
        throw {
          message: 'Network error, please check your connection',
          status: 0
        };
      } else {
        throw {
          message: error.message || 'An unexpected error occurred',
          status: 0
        };
      }
    }
  }
};

export default ProfileAPI;