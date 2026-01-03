import api from './api';
import { Savings, SavingsUpsert } from '@/types';

export const savingsService = {
  async getSavings(params?: { month?: string }): Promise<Savings | null> {
    const response = await api.get<Savings | null>('/savings/', { params });
    return response.data ?? null;
  },

  async upsertSavings(data: SavingsUpsert): Promise<Savings> {
    const response = await api.put<Savings>('/savings/', data);
    return response.data;
  },
};
