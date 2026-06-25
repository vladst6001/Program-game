import client from './client';

export interface Game {
  id: string;
  name: string;
  author_id: string;
  code: Record<string, unknown>;
  is_published: boolean;
  likes: number;
  created_at: string;
  updated_at: string;
}

export interface GameListResponse {
  games: Game[];
}

export interface PublishResponse {
  success: boolean;
  game_id: string;
}

export const gamesApi = {
  list: () => client.get<GameListResponse>('/api/games'),

  get: (id: string) => client.get<Game>(`/api/games/${id}`),

  create: (name: string) => client.post<Game>('/api/games', { name }),

  update: (id: string, data: { name?: string; code?: Record<string, unknown> }) =>
    client.put<Game>(`/api/games/${id}`, data),

  delete: (id: string) => client.delete(`/api/games/${id}`),

  publish: (id: string) => client.post<PublishResponse>(`/api/games/${id}/publish`),

  like: (id: string) => client.post(`/api/games/${id}/like`),
};
