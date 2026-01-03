import api from './api';
import { WishlistItem, WishlistCreate, WishlistUpdate, WishlistTotal } from '@/types';

export const wishlistService = {
  async getWishlistItems(): Promise<WishlistItem[]> {
    const response = await api.get<WishlistItem[]>('/wishlist/');
    return response.data;
  },

  async getWishlistItem(id: string): Promise<WishlistItem> {
    const response = await api.get<WishlistItem>(`/wishlist/${id}`);
    return response.data;
  },

  async createWishlistItem(data: WishlistCreate): Promise<WishlistItem> {
    const response = await api.post<WishlistItem>('/wishlist/', data);
    return response.data;
  },

  async updateWishlistItem(id: string, data: WishlistUpdate): Promise<WishlistItem> {
    const response = await api.put<WishlistItem>(`/wishlist/${id}`, data);
    return response.data;
  },

  async deleteWishlistItem(id: string): Promise<void> {
    await api.delete(`/wishlist/${id}`);
  },

  async markAsPurchased(id: string, data?: { purchase_date?: string; category?: string }): Promise<void> {
    await api.post(`/wishlist/${id}/purchase`, data);
  },

  async getTotal(): Promise<WishlistTotal> {
    const response = await api.get<WishlistTotal>('/wishlist/total');
    return response.data;
  },
};
