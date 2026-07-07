'use client';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { apiPost } from '@/lib/api';
import Button from '@/components/ui/Button';

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useCartStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);

  const tableId = searchParams.get('table') ?? '1';
  const autoStart = searchParams.get('autostart') === '1';

  useEffect(() => {
    if (autoStart) handleStart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await apiPost<{ id: string; table_number: number }>(
        '/sessions',
        { table_id: tableId },
      );
      setSession(res.id, tableId, String(res.table_number));
    } catch {
      /* continue without session */
    } finally {
      setLoading(false);
      router.push('/order/vendors');
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Background decoration circles */}
      <div className="absolute top-[-120px] right-[-80px] w-80 h-80 rounded-full bg-brand-orange/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-60px] w-64 h-64 rounded-full bg-brand-yellow/6 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-black/3 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-black/4 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 text-center max-w-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-24 h-24 rounded-3xl bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center mx-auto mb-8"
        >
          <span className="text-5xl">🍽️</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="font-heading text-7xl text-brand-white tracking-widest leading-none mb-2"
        >
          FOOD
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          className="font-heading text-7xl text-brand-orange tracking-widest leading-none mb-6"
        >
          VILLAGE
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-brand-dim font-body text-base mb-12"
        >
          10 booths · Fresh food · Order your way
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Button
            size="lg"
            onClick={handleStart}
            loading={loading}
            className="w-full text-base font-heading tracking-widest"
          >
            START ORDERING
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="mt-6 text-xs text-brand-dim font-mono"
        >
          {searchParams.get('table') ? (
            <span className="text-brand-orange font-semibold">Table {tableId}</span>
          ) : (
            'Walk-up order'
          )}
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bg" />}>
      <WelcomeContent />
    </Suspense>
  );
}
