'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';

const typeStyles = {
  success: 'border-brand-orange/40 bg-brand-primary-light text-emerald-700',
  error: 'border-brand-danger/40 bg-brand-danger-light text-red-700',
  warning: 'border-amber-400/50 bg-amber-50 text-amber-700',
  info: 'border-brand-info/40 bg-blue-50 text-blue-700',
};

const typeIcons = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border glass text-sm font-body max-w-sm ${typeStyles[t.type]}`}
            onClick={() => removeToast(t.id)}
          >
            <span className="text-base font-bold">{typeIcons[t.type]}</span>
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
