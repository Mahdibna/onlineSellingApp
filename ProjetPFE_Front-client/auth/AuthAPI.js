import axios from 'axios';
import base64 from 'base-64';
import { API_URL } from '../config/api';

console.log('Current API base URL:', API_URL);

axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.timeout = 10000; // 10 second timeout

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method, config.url, config.data);
    return config;
  },
  (error) => {
    console.log('Request error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.log('Response error:', error.message, error.config);
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        message: 'Request timeout, please try again',
        status: 0,
      });
    }
    return Promise.reject(error);
  }
);

const decodeJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');

    const payload = parts[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');

    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

    const decodedStr = base64.decode(padded);
    const decoded = JSON.parse(decodedStr);

    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      console.warn('JWT expired');
      return null;
    }

    return decoded;
  } catch (e) {
    console.error('JWT decoding error:', e);
    return null;
  }
};

export const AuthAPI = {
  testConnection: async () => {
    try {
      console.log('Attempting to connect to:', `${API_URL}/api/test/ping`);
      const response = await apiClient.get(`/api/test/ping`, {
        timeout: 5000,
      });
      console.log('Connection successful:', response.data);
      return response.data;
    } catch (error) {
      const errorDetails = {
        config: error.config,
        response: error.response?.data,
        message: error.message,
      };
      console.error('Connection failed:', errorDetails);
      throw new Error(`Cannot connect to server: ${error.message}`);
    }
  },

  register: async (userData) => {
    try {
      console.log('Registering new user:', userData.email);
      const response = await apiClient.post(`/api/clients/register`, {
        nom: userData.name,
        email: userData.email,
        tel: userData.mobile,
        motDePasse: userData.password,
        type: 'Individual',
        actif: true,
        profil: userData.profil || 'default',
      });
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response) {
        throw {
          message:
            error.response.data.message || error.response.data.error || 'Registration failed',
          status: error.response.status,
          data: error.response.data,
        };
      } else if (error.request) {
        throw {
          message: 'Network error, please check your connection',
          status: 0,
        };
      } else {
        throw {
          message: error.message || 'An unexpected error occurred',
          status: 0,
        };
      }
    }
  },

  login: async (email, password) => {
    try {
      console.log('Attempting login with email:', email);
      const response = await apiClient.post('/api/auth/login', {
        email: email.trim(),
        password: password.trim(),
      });
      console.log('Login response full data:', JSON.stringify(response.data, null, 2));
      console.log('Login response received:', response.status);

      const responseData = response.data.data || response.data;
      if (!responseData.token) {
        throw new Error('Authentication failed: No token received');
      }

      const token = responseData.token;
      const decoded = decodeJWT(token);

      if (!decoded) {
        throw new Error('Failed to decode user information');
      }

      const rawUser = responseData.user || {
        id: decoded.userId,
        email: decoded.sub,
        roles: decoded.roles,
      };

      const normalizedUser = {
        ...rawUser,
        id: rawUser.id ?? rawUser.userId ?? decoded.userId,
        userId: rawUser.userId ?? rawUser.id ?? decoded.userId,
        email: rawUser.email ?? decoded.sub,
        roles: rawUser.roles ?? decoded.roles ?? [],
      };

      return {
        token: token,
        user: normalizedUser,
      };
    } catch (error) {
      console.error('Login error details:', error);
      if (error.response) {
        if (error.response.status === 403) {
          throw {
            message: 'Account is inactive. Please verify your email address.',
            status: 403,
            data: error.response.data,
            requiresVerification: true,
            email,
          };
        }
        const errorMessage = error.response.data?.message || 'Login failed';
        throw {
          message: errorMessage,
          status: error.response.status,
          data: error.response.data,
        };
      } else if (error.request) {
        throw {
          message: 'Network error, please check your connection',
          status: 0,
        };
      } else {
        throw {
          message: error.message || 'An unexpected error occurred',
          status: 0,
        };
      }
    }
  },

  verifyOTP: async (email, otp) => {
    try {
      const response = await apiClient.post(`/api/auth/verify-otp`, { email, otp });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw {
          message: error.response.data.message || 'OTP verification failed',
          status: error.response.status,
        };
      } else {
        throw {
          message: 'Network error, please check your connection',
          status: 0,
        };
      }
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    try {
      const response = await apiClient.post(`/api/auth/reset-password`, {
        email,
        otp,
        newPassword,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw {
          message: error.response.data.message || 'Password reset failed',
          status: error.response.status,
        };
      } else {
        throw {
          message: 'Network error, please check your connection',
          status: 0,
        };
      }
    }
  },

  verifyEmail: async (email, code) => {
    try {
      const response = await apiClient.post(`/api/clients/verify-email`, null, {
        params: { email, code },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw {
          message: error.response.data.message || 'Email verification failed',
          status: error.response.status,
          data: error.response.data,
        };
      } else {
        throw {
          message: 'Network error, please check your connection',
          status: 0,
        };
      }
    }
  },

  resendVerificationEmail: async (email) => {
    console.log('the destination for the mail is ', email);
    try {
      const response = await apiClient.post(`/api/clients/resend-verification`, null, {
        params: { email },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw {
          message: error.response.data.message || 'Failed to resend verification email',
          status: error.response.status,
          data: error.response.data,
        };
      } else {
        throw {
          message: 'Network error, please check your connection',
          status: 0,
        };
      }
    }
  },
};

export default AuthAPI;
