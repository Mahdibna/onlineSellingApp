import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

let isRedirecting = false;

export const setupAxiosInterceptors = (navigate) => {
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("jwt");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle 401 errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401 && !isRedirecting) {
        isRedirecting = true;
        
        localStorage.removeItem("jwt");
        
        window.location.href = "/login";
        
        setTimeout(() => {
          isRedirecting = false;
        }, 100);
      }
      return Promise.reject(error);
    }
  );
};

export const resetRedirectFlag = () => {
  isRedirecting = false;
};

export default api;