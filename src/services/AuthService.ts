import axios from 'axios';
import log from '../utils/logger';
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

  static async register(data: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
    await axios.post(`${API_BASE_URL}/auth/register`, data);
  }

  static async verifyEmail(token: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/auth/verify-email`, { token });
  }

  static async forgotPassword(email: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
  }

  static async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<void> {
    await axios.post(`${API_BASE_URL}/auth/reset-password`, data);
  }

  static async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const accessToken = TokenStorage.getAccessToken();
    await axios.post(
      `${API_BASE_URL}/auth/change-password`,
      { oldPassword, newPassword },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    await AuthService.logout();
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

  static async logout(): Promise<void> {
    try {
      const accessToken = TokenStorage.getAccessToken();
      await axios.post(`${API_BASE_URL}/auth/logout`, null, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (error) {
      log.error('Failed to logout: ' + error);
    }

    TokenStorage.clearTokens();
    window.location.href = '/login';
  }
}
