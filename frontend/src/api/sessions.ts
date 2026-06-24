import client from './client';

export interface Session {
  id: string;
  user1_id: string;
  user2_id: string;
  game_id: string | null;
  created_at: string;
}

export const sessionsApi = {
  create: (data: { friend_id: string; game_id?: string }) =>
    client.post<Session>('/api/sessions', data),

  get: (id: string) =>
    client.get<Session>(`/api/sessions/${id}`),

  list: () =>
    client.get<{ sessions: Session[] }>('/api/sessions'),

  join: (id: string) =>
    client.post<Session>(`/api/sessions/${id}/join`),
};
