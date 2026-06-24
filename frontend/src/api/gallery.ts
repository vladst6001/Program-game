import client from './client';
import { Game } from './games';

export interface GalleryResponse {
  games: Game[];
}

export const galleryApi = {
  getPublished: (params?: { page?: number; limit?: number }) =>
    client.get<GalleryResponse>('/api/gallery', { params }),

  getPopular: () =>
    client.get<GalleryResponse>('/api/gallery/popular'),

  getRecent: () =>
    client.get<GalleryResponse>('/api/gallery/recent'),

  getByAuthor: (authorId: string) =>
    client.get<GalleryResponse>(`/api/gallery/author/${authorId}`),
};
