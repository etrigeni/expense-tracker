import api from './api';
import { Expense, Trip, TripCreate } from '@/types';

export const tripService = {
  async getTrips(): Promise<Trip[]> {
    const response = await api.get<Trip[]>('/trips/');
    return response.data;
  },

  async getTrip(id: string): Promise<Trip> {
    const response = await api.get<Trip>(`/trips/${id}`);
    return response.data;
  },

  async getTripExpenses(id: string): Promise<Expense[]> {
    const response = await api.get<Expense[]>('/expenses/', { params: { trip_id: id } });
    return response.data;
  },

  async createTrip(data: TripCreate): Promise<Trip> {
    const response = await api.post<Trip>('/trips/', data);
    return response.data;
  },

  async updateTrip(id: string, data: TripCreate): Promise<Trip> {
    const response = await api.put<Trip>(`/trips/${id}`, data);
    return response.data;
  },

  async deleteTrip(id: string): Promise<void> {
    await api.delete(`/trips/${id}`);
  },
};
