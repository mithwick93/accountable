import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import { toast } from 'react-toastify';
import { TokenStorage } from '../utils/TokenStorage';
import { AuthService } from './AuthService';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = TokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === StatusCodes.UNAUTHORIZED) {
      try {
        const newToken = await AuthService.refreshToken();
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return axios.request(error.config);
      } catch {
        await AuthService.logout();
      }
    }
    if (error.response?.status === StatusCodes.TOO_MANY_REQUESTS) {
      toast.error(
        'You are sending requests too quickly. Please wait and try again.',
      );
    }
    return Promise.reject(error);
  },
);

export default apiClient;
