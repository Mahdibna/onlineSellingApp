import { Platform } from 'react-native';

/** Change this single IP when switching environments */
const DEV_HOST = '192.168.0.183';
const DEV_PORT = 8080;
const PRODUCTION_URL = 'https://your-production-api.com';

export const getApiBaseUrl = () => {
  if (__DEV__) {
    return Platform.select({
      android: `http://${DEV_HOST}:${DEV_PORT}`,
      ios: `http://localhost:${DEV_PORT}`,
      default: `http://${DEV_HOST}:${DEV_PORT}`,
    });
  }
  return PRODUCTION_URL;
};

export const API_URL = getApiBaseUrl();
export const API_BASE_URL = `${API_URL}/api`;

export const getUploadUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  const clean = filename.replace(/^\/+/, '');
  return `${API_URL}/${clean.startsWith('uploads/') ? clean : `uploads/${clean}`}`;
};

export const getAssetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const clean = path.replace(/^\/+/, '');
  return `${API_URL}/${clean}`;
};
