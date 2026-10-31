import api from './api';
import { CategoryPeriodTotal, Expense, ExpenseCreate, ExpenseUpdate, ExpenseStats } from '@/types';

export const expenseService = {
  /** With `month` (any day in it), returns that month's expenses with recurring ones included. */
  async getExpenses(params?: {
    month?: string;
    date_from?: string;
    date_to?: string;
    category?: string;
    skip?: number;
    limit?: number;
  }): Promise<Expense[]> {
    const response = await api.get<Expense[]>('/expenses/', { params });
    return response.data;
  },

  /** One category in each of the last 12 pay periods ending at `month` (YYYY-MM-DD). */
  async getCategoryHistory(category: string, month: string): Promise<CategoryPeriodTotal[]> {
    const response = await api.get<CategoryPeriodTotal[]>('/expenses/history', { params: { category, month } });
    return response.data;
  },

  async getRecurring(): Promise<Expense[]> {
    const response = await api.get<Expense[]>('/expenses/recurring');
    return response.data;
  },

  async setPaid(id: string, month: string, paid: boolean): Promise<void> {
    await api.put(`/expenses/${id}/paid`, { month, paid });
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
