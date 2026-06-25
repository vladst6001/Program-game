import client from './client';

export const authApi = {
  register: (data: { name: string; phone?: string; password: string }) =>
    client.post<{ access_token: string }>('/api/auth/register', data),

  login: (data: { phone: string; password: string }) =>
    client.post<{ access_token: string }>('/api/auth/login', data),

  me: () =>
    client.get('/api/auth/me'),

  autoRegister: (name: string, telegram_id: number) =>
    client.post<{ access_token: string }>('/api/auth/auto-register', { name, telegram_id }),
};
