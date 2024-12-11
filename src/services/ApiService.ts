import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import { TokenStorage } from '../utils/TokenStorage';
import { AuthService } from './AuthService';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
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
    return Promise.reject(error);
  },
);

export default apiClient;
