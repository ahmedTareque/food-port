'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setToken, clearToken } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  vendor_id: string | null;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: (token, user) => {
        setToken(token);
        set({ token, user });
      },

      logout: () => {
        clearToken();
        set({ token: null, user: null });
      },

      isAuthenticated: () => !!get().token,
    }),
    { name: 'fv-auth' },
  ),
);
