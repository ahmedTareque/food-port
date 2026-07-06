'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Toast } from '@/types';

interface UIStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  isKDSMuted: boolean;
  toggleKDSMute: () => void;
  kdsVolume: number;
  setKDSVolume: (v: number) => void;
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
    }),
    {
      name: 'ui-prefs',
      partialize: (state) => ({ isKDSMuted: state.isKDSMuted, kdsVolume: state.kdsVolume }),
    }
  )
);
