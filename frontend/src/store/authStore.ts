import { create } from 'zustand';
import { authApi } from '../api/auth';

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  autoRegister: () => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  autoRegister: async () => {
    if (get().token) return;
    try {
      const name = 'Player_' + Math.random().toString(36).slice(2, 8);
      const tgId = Math.floor(Math.random() * 99999999) + 10000000;
      const { data } = await authApi.autoRegister(name, tgId);
      localStorage.setItem('token', data.access_token);
      set({ token: data.access_token, isAuthenticated: true });
      await get().fetchUser();
    } catch {
      // Silent fail
    }
  },

  login: async (phone, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login({ phone, password });
      localStorage.setItem('token', data.access_token);
      set({ token: data.access_token, isAuthenticated: true });
      await get().fetchUser();
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, phone, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.register({ name, phone, password });
      localStorage.setItem('token', data.access_token);
      set({ token: data.access_token, isAuthenticated: true });
      await get().fetchUser();
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      const { data } = await authApi.me();
      set({ user: data });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
