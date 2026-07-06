'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

interface OrderStatusResponse {
  order_id: string;
  token_number: number;
  overall_status: string;
  items: Array<{
    id: string;
    vendor_name: string;
    vendor_color: string;
    item_name: string;
    status: string;
    estimated_prep_time_minutes: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#888888',
  accepted: '#3B82F6',
  confirmed: '#3B82F6',
  preparing: '#8B5CF6',
  ready: '#10B981',
  completed: '#10B981',
  rejected: '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  confirmed: 'Confirmed',
  preparing: 'Preparing...',
  ready: 'Ready!',
  completed: 'Completed',
  rejected: 'Rejected',
};

const STEPS = ['pending', 'preparing', 'ready'];

function StatusStep({ step, current }: { step: string; current: string }) {
  const idx = STEPS.indexOf(step);
  const curIdx = STEPS.indexOf(current === 'accepted' || current === 'confirmed' ? 'pending' : current);
  const done = curIdx > idx;
  const active = curIdx === idx;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
          done ? 'bg-green-500 text-white' : active ? 'bg-brand-orange text-white ring-4 ring-brand-orange/30' : 'bg-white/10 text-brand-dim'
        }`}
      >
        {done ? '✓' : idx + 1}
      </div>
      <span className={`text-[10px] font-mono ${active ? 'text-brand-orange' : done ? 'text-green-400' : 'text-brand-dim'}`}>
        {step.toUpperCase()}
      </span>
    </div>
  );
}

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchOrder() {
    try {
      const data = await apiFetch<OrderStatusResponse>(`/orders/${orderId}/status`);
      setOrder(data);
      if (data.overall_status === 'completed') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();
    pollRef.current = setInterval(fetchOrder, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl">😕</div>
        <p className="text-brand-dim">Order not found</p>
        <button onClick={() => router.push('/order')} className="text-brand-orange text-sm hover:underline">
          Start new order →
        </button>
      </div>
    );
  }

  const STATUS_RANK: Record<string, number> = { pending: 0, accepted: 1, confirmed: 1, preparing: 2, ready: 3, completed: 4, rejected: 4 };
  const vendorMap = new Map<string, { vendor_name: string; vendor_color: string; status: string }>();
  for (const item of order.items) {
    const existing = vendorMap.get(item.vendor_name);
    if (!existing || STATUS_RANK[item.status] < STATUS_RANK[existing.status]) {
      vendorMap.set(item.vendor_name, { vendor_name: item.vendor_name, vendor_color: item.vendor_color, status: item.status });
    }
  }
  const vendorRows = Array.from(vendorMap.values());
  const allReady = order.items.every((i) => ['ready', 'completed', 'rejected'].includes(i.status));
  const tokenStr = String(order.token_number).padStart(3, '0');

  return (
    <div className="max-w-sm mx-auto px-4 py-8">
      {/* Token */}
      <div className="text-center mb-8">
        <p className="text-brand-dim font-mono text-xs tracking-widest mb-1">ORDER TOKEN</p>
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-heading text-[80px] leading-none text-brand-orange token-glow"
        >
          #{tokenStr}
        </motion.h1>
        <AnimatePresence mode="wait">
          <motion.p
            key={order.overall_status}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 text-brand-chrome text-sm font-body"
          >
            {allReady ? 'Your order is ready! Come collect it.' : 'Your order is being prepared...'}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress steps */}
      <div className="glass rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4 relative">
          <div className="absolute left-4 right-4 top-4 h-0.5 bg-white/10 z-0" />
          {STEPS.map((s) => <StatusStep key={s} step={s} current={order.overall_status} />)}
        </div>
      </div>

      {/* Per-vendor status */}
      <div className="glass rounded-2xl p-4 space-y-3 mb-6">
        <h3 className="font-heading text-sm text-brand-dim tracking-widest">BY VENDOR</h3>
        {vendorRows.map((v) => (
          <div key={v.vendor_name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.vendor_color }} />
              <span className="text-sm font-body text-brand-chrome">{v.vendor_name}</span>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ color: STATUS_COLORS[v.status] ?? '#888', backgroundColor: `${STATUS_COLORS[v.status] ?? '#888'}18` }}
            >
              {STATUS_LABELS[v.status] ?? v.status}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-brand-dim text-xs mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Auto-refreshing every 5s
      </div>

      <button
        onClick={() => router.push('/order')}
        className="w-full text-center text-brand-dim text-sm hover:text-brand-white transition-colors py-2"
      >
        Start a new order →
      </button>
    </div>
  );
}
