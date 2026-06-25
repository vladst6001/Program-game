import client from './client';

export interface Game {
  id: string;
  name: string;
  author_id: string;
  code: Record<string, unknown>;
  is_published: boolean;
  likes: number;
  price: number;
  creator_name: string | null;
  is_hidden: boolean;
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

export interface CreatorInfo {
  creator_id: string;
  creator_name: string;
  bio: string | null;
  games_count: number;
}

export const gamesApi = {
  list: () => client.get<GameListResponse>('/api/games'),

  get: (id: string) => client.get<Game>(`/api/games/${id}`),

  create: (name: string) => client.post<Game>('/api/games', { name }),

  update: (id: string, data: { name?: string; code?: Record<string, unknown>; price?: number; is_hidden?: boolean }) =>
    client.put<Game>(`/api/games/${id}`, data),

  delete: (id: string) => client.delete(`/api/games/${id}`),

  publish: (id: string) => client.post<PublishResponse>(`/api/games/${id}/publish`),

  like: (id: string) => client.post(`/api/games/${id}/like`),

  pay: (id: string) => client.post<{ success: boolean; coins_left?: number; already_purchased?: boolean }>(`/api/games/${id}/pay`),

  getCreator: (id: string) => client.get<CreatorInfo>(`/api/games/${id}/creator`),
};
