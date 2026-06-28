import AsyncStorage from '@react-native-async-storage/async-storage';
import jwt_decode from 'jwt-decode';

// Enum for client types (matching backend)
export const ClientType = {
  INDIVIDUAL: 'ROLE_USERSTANDARD',
  PARTNER: 'ROLE_USERPARTNER'
};

/**
 * Function to decode JWT token and get user information
 * @returns {Promise<Object>} User information from token
 */
export const getUserFromToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return null;
    
    const decodedToken = jwt_decode(token);
    
    // Extract roles - handle both single role string and array of roles
    let roles = [];
    if (decodedToken.roles) {
      // If roles is an array, use it directly
      if (Array.isArray(decodedToken.roles)) {
        roles = decodedToken.roles;
      } 
      // If roles is a string, try to parse it as JSON
      else if (typeof decodedToken.roles === 'string') {
        try {
          roles = JSON.parse(decodedToken.roles);
        } catch (e) {
          roles = [decodedToken.roles];
        }
      }
    }
    
    const isPartner = roles.includes(ClientType.PARTNER);
    const isIndividual = roles.includes(ClientType.INDIVIDUAL);
    
    return {
      userId: decodedToken.sub || decodedToken.userId,
      username: decodedToken.username,
      email: decodedToken.email,
      roles: roles, 
      isPartner,
      isIndividual,
      exp: decodedToken.exp,
      tokenExpired: Date.now() >= decodedToken.exp * 1000
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};
export const isAuthenticated = async () => {
  const user = await getUserFromToken();
  return user !== null && !user.tokenExpired;
};

export const isPartner = async () => {
  const user = await getUserFromToken();
  return user !== null && user.isPartner;
};

export const isIndividual = async () => {
  const user = await getUserFromToken();
  return user !== null && user.isIndividual;
};

export default {
  getUserFromToken,
  isAuthenticated,
  isPartner,
  isIndividual,
  ClientType
};