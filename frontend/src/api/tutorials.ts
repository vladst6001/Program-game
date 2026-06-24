import client from './client';

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  content: string;
  created_at: string;
}

export const tutorialsApi = {
  list: (params?: { category?: string; difficulty?: string }) =>
    client.get<{ tutorials: Tutorial[] }>('/api/tutorials', { params }),

  get: (id: string) =>
    client.get<Tutorial>(`/api/tutorials/${id}`),

  getCategories: () =>
    client.get<{ categories: string[] }>('/api/tutorials/categories'),
};
