import api from './api';
import { CategoryBudget, CategoryBudgetUpsert } from '@/types';

export const budgetService = {
  async getBudgets(params?: { month?: string }): Promise<CategoryBudget[]> {
    const response = await api.get<CategoryBudget[]>('/budgets/', { params });
    return response.data;
  },

  async upsertBudget(data: CategoryBudgetUpsert): Promise<CategoryBudget> {
    const response = await api.put<CategoryBudget>('/budgets/', data);
    return response.data;
  },
};
