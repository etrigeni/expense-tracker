import api from './api';
import { PayPeriod } from '@/types';

export const periodService = {
  async getCurrent(): Promise<PayPeriod> {
    const response = await api.get<PayPeriod>('/periods/current');
    return response.data;
  },

  /** `month` is the period's label as YYYY-MM-DD (any day in that month). */
  async getPeriod(month: string): Promise<PayPeriod> {
    const response = await api.get<PayPeriod>(`/periods/${month}`);
    return response.data;
  },
};
