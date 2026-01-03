import api from './api';
import { LoginRequest, RegisterRequest, TokenResponse, User } from '@/types';

export const authService = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/login', data);
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<User> {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  async requestPasswordReset(email: string): Promise<void> {
    await api.post('/auth/password-reset', { email });
  },

  async confirmPasswordReset(token: string, new_password: string): Promise<void> {
    await api.post('/auth/password-reset/confirm', { token, new_password });
  },
};
