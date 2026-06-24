import client from './client';

export interface Friend {
  user_id: string;
  friend_id: string;
  friend_name: string;
  status: string;
  created_at: string;
}

export interface FriendListResponse {
  friends: Friend[];
}

export const friendsApi = {
  list: () => client.get<FriendListResponse>('/api/friends'),

  add: (data: { user_id?: string; name?: string }) =>
    client.post<Friend>('/api/friends', data),

  remove: (friendId: string) =>
    client.delete(`/api/friends/${friendId}`),

  search: (query: string) =>
    client.get<FriendListResponse>('/api/friends/search', { params: { q: query } }),
};
