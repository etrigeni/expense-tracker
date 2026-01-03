import api from './api';
import { Expense, ExpenseCreate, ExpenseUpdate, ExpenseStats } from '@/types';

export const expenseService = {
  async getExpenses(params?: {
    date_from?: string;
    date_to?: string;
    category?: string;
    skip?: number;
    limit?: number;
  }): Promise<Expense[]> {
    const response = await api.get<Expense[]>('/expenses/', { params });
    return response.data;
  },

  async getExpense(id: string): Promise<Expense> {
    const response = await api.get<Expense>(`/expenses/${id}`);
    return response.data;
  },

  async createExpense(data: ExpenseCreate): Promise<Expense> {
    const response = await api.post<Expense>('/expenses/', data);
    return response.data;
  },

  async updateExpense(id: string, data: ExpenseUpdate): Promise<Expense> {
    const response = await api.put<Expense>(`/expenses/${id}`, data);
    return response.data;
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  async getStats(params?: { date_from?: string; date_to?: string }): Promise<ExpenseStats> {
    const response = await api.get<ExpenseStats>('/expenses/stats', { params });
    return response.data;
  },
};
