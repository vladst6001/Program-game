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
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  verifyCode: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: async (phone, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login({ phone, password });
      localStorage.setItem('token', data.access_token);
      set({ token: data.access_token, isAuthenticated: true });
      await useAuthStore.getState().fetchUser();
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
      await useAuthStore.getState().fetchUser();
    } finally {
      set({ isLoading: false });
    }
  },

  verifyCode: async (phone, code) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.verifyCode({ phone, code });
      localStorage.setItem('token', data.access_token);
      set({ token: data.access_token, isAuthenticated: true });
      await useAuthStore.getState().fetchUser();
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
