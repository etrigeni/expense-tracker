import api from './api';
import { Income, IncomeCreate, IncomeUpdate, IncomeTotal } from '@/types';

export const incomeService = {
  async getIncomes(params?: { date_from?: string; date_to?: string; is_recurring?: boolean }): Promise<Income[]> {
    const response = await api.get<Income[]>('/incomes/', { params });
    return response.data;
  },

  async createIncome(data: IncomeCreate): Promise<Income> {
    const response = await api.post<Income>('/incomes/', data);
    return response.data;
  },

  async updateIncome(id: string, data: IncomeUpdate): Promise<Income> {
    const response = await api.put<Income>(`/incomes/${id}`, data);
    return response.data;
  },

  async deleteIncome(id: string): Promise<void> {
    await api.delete(`/incomes/${id}`);
  },

  async getTotal(): Promise<IncomeTotal> {
    const response = await api.get<IncomeTotal>('/incomes/total');
    return response.data;
  },
};
