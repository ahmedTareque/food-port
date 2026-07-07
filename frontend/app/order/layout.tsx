'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';

const IDLE_SECONDS = 90;
const COUNTDOWN_SECONDS = 10;

function IdleOverlay({ countdown, onStay }: { countdown: number; onStay: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onStay}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="text-7xl mb-6">😴</div>
        <h2 className="font-heading text-4xl text-brand-orange mb-2 tracking-widest">STILL THERE?</h2>
        <p className="text-brand-dim font-body text-base mb-8">Your cart will be cleared in</p>
        <motion.div
          key={countdown}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-heading text-[96px] leading-none text-brand-orange token-glow mb-8"
        >
          {countdown}
        </motion.div>
        <button
          onClick={(e) => { e.stopPropagation(); onStay(); }}
          className="bg-brand-orange text-white font-heading text-xl px-10 py-4 rounded-2xl tracking-widest hover:bg-brand-primary-hover transition-colors"
        >
          TAP TO CONTINUE
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const itemCount = useCartStore((s) => s.itemCount());
  const total = useCartStore((s) => s.total());
  const tableNumber = useCartStore((s) => s.tableNumber);
  const clearCart = useCartStore((s) => s.clearCart);

  const isWelcome = pathname === '/order';
  const isConfirmation = pathname.startsWith('/order/confirmation');
  const showCartBar = !isWelcome && !isConfirmation && itemCount > 0;

  // Accessibility mode
  const [a11y, setA11y] = useState(false);

  // Idle detection
  const [showIdle, setShowIdle] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function resetIdle() {
    setShowIdle(false);
    setCountdown(COUNTDOWN_SECONDS);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (!isWelcome && !isConfirmation) {
      idleTimer.current = setTimeout(() => {
        setShowIdle(true);
        setCountdown(COUNTDOWN_SECONDS);
        let c = COUNTDOWN_SECONDS;
        countdownTimer.current = setInterval(() => {
          c -= 1;
          setCountdown(c);
          if (c <= 0) {
            clearInterval(countdownTimer.current!);
            clearCart();
            router.push('/order');
            setShowIdle(false);
          }
        }, 1000);
      }, IDLE_SECONDS * 1000);
    }
  }

  useEffect(() => {
    resetIdle();
    const events = ['touchstart', 'click', 'keydown', 'mousemove', 'scroll'];
    events.forEach((e) => window.addEventListener(e, resetIdle));
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      events.forEach((e) => window.removeEventListener(e, resetIdle));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWelcome, isConfirmation]);

  return (
    <div className={`min-h-screen bg-brand-bg flex flex-col ${a11y ? 'text-[110%] a11y-mode' : ''}`}>
      <AnimatePresence>
        {showIdle && (
          <IdleOverlay countdown={countdown} onStay={resetIdle} />
        )}
      </AnimatePresence>

      {/* Accessibility toggle */}
      <button
        onClick={() => setA11y((v) => !v)}
        aria-label={a11y ? 'Disable accessibility mode' : 'Enable accessibility mode'}
        title="Accessibility mode"
        className={`fixed bottom-24 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center text-base shadow-lg transition-all ${
          a11y
            ? 'bg-yellow-400 text-black border-2 border-yellow-500'
            : 'bg-black/10 text-brand-dim border border-black/10 hover:bg-black/20'
        }`}
      >
        ♿
      </button>
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-black/6 px-4 py-3 flex items-center gap-3">
        {!isWelcome && (
          <button
            onClick={() => router.back()}
            className="text-brand-dim hover:text-brand-white transition-colors p-1.5 rounded-lg hover:bg-black/5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex-1">
          <span className="font-heading text-xl text-brand-orange tracking-widest">
            FOOD VILLAGE
          </span>
          {tableNumber && (
            <span className="ml-3 text-xs font-mono text-brand-dim">
              Table {tableNumber}
            </span>
          )}
        </div>
        {!isConfirmation && (
          <Link href="/order/cart" className="relative p-2">
            <svg className="w-6 h-6 text-brand-chrome" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.35 2.7A2 2 0 007.5 19h9a2 2 0 001.85-2.3L17 13M9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 pb-24">{children}</main>

      {/* Cart bottom bar */}
      {showCartBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
          <Link
            href="/order/cart"
            className="flex items-center justify-between w-full bg-brand-orange rounded-2xl px-5 py-4 shadow-xl shadow-orange-900/40"
          >
            <div className="flex items-center gap-3">
              <span className="bg-black/20 text-white text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center font-mono">
                {itemCount}
              </span>
              <span className="text-white font-semibold text-sm">View Cart</span>
            </div>
            <span className="text-white font-mono font-bold text-sm">
              ${total.toFixed(2)}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
