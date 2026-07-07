'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Toast } from '@/types';

export type FontChoice = 'poppins' | 'inter' | 'manrope';

interface UIStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  isKDSMuted: boolean;
  toggleKDSMute: () => void;
  kdsVolume: number;
  setKDSVolume: (v: number) => void;
  font: FontChoice;
  setFont: (f: FontChoice) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      toasts: [],

      addToast: (toast) => {
        const id = crypto.randomUUID();
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 4000);
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      isKDSMuted: false,
      toggleKDSMute: () => set((state) => ({ isKDSMuted: !state.isKDSMuted })),

      kdsVolume: 0.7,
      setKDSVolume: (v) => set({ kdsVolume: v }),

      font: 'poppins',
      setFont: (f) => set({ font: f }),
    }),
    {
      name: 'ui-prefs',
      partialize: (state) => ({ isKDSMuted: state.isKDSMuted, kdsVolume: state.kdsVolume, font: state.font }),
    }
  )
);
