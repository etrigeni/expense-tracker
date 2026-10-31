import api from './api';
import { LoginRequest, TokenResponse } from '@/types';

export const authService = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/login', data);
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    return response.data;
  },

  async changePassword(current_password: string, new_password: string): Promise<void> {
    await api.post('/auth/change-password', { current_password, new_password });
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },
};
