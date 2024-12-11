import axios from 'axios';
import { TokenStorage } from '../utils/TokenStorage';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export class AuthService {
  static async login(username: string, password: string): Promise<void> {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      password,
      username,
    });

    const { accessToken, refreshToken } = response.data;
    TokenStorage.setAccessToken(accessToken);
    TokenStorage.setRefreshToken(refreshToken);
  }

  static async refreshToken(): Promise<string | null> {
    const refreshToken = TokenStorage.getRefreshToken();

    if (!refreshToken) {
      await AuthService.logout();
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken,
      });
      const { accessToken } = response.data;

      TokenStorage.setAccessToken(accessToken);
      return accessToken;
    } catch (error) {
      await AuthService.logout();
      throw new Error('Failed to refresh token: ' + error);
    }
  }

  static logout(): void {
    TokenStorage.clearTokens();
    window.location.href = '/login';
  }
}
