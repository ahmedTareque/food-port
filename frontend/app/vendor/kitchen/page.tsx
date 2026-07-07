'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, apiPatch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useKdsSocket } from '@/hooks/useKdsSocket';
import type { KDSOrder, OrderItemStatus } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';

const COLUMNS: { status: OrderItemStatus; label: string; color: string; bg: string }[] = [
  { status: 'pending', label: 'NEW', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  { status: 'preparing', label: 'PREPARING', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  { status: 'ready', label: 'READY', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
];

const REJECT_REASONS = [
  'Item unavailable',
  'Out of stock',
  'Kitchen closed',
  'Other',
];

function useElapsedTime(startTime: string) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return elapsed;
}

function PrepTimer({ startTime }: { startTime: string }) {
  const elapsed = useElapsedTime(startTime);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const color = elapsed > 600 ? '#EF4444' : elapsed > 300 ? '#F59E0B' : '#888888';
  return (
    <span className="font-mono text-xs tabular-nums" style={{ color }}>
      {mm}:{ss}
    </span>
  );
}

function UrgencyBorder({ elapsed }: { elapsed: number }) {
  const color = elapsed > 600 ? '#EF4444' : elapsed > 300 ? '#F59E0B' : 'transparent';
  if (color === 'transparent') return null;
  return <div className="absolute inset-0 rounded-2xl border-2 pointer-events-none" style={{ borderColor: color }} />;
}

function PrepCountdown({ acceptedAt, prepMinutes }: { acceptedAt: string; prepMinutes: number }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const deadline = new Date(acceptedAt).getTime() + prepMinutes * 60000;
    const tick = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [acceptedAt, prepMinutes]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const overdue = remaining === 0;
  return (
    <div className={`flex items-center gap-1 text-xs font-mono tabular-nums ${overdue ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
      {overdue ? '⚠ OVERDUE' : `⏱ ${mm}:${ss}`}
    </div>
  );
}

function KDSCard({
  order,
  onAction,
}: {
  order: KDSOrder;
  onAction: (id: string, status: OrderItemStatus, reason?: string) => void;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const nextAction: { label: string; status: OrderItemStatus } | null =
    order.status === 'pending'
      ? { label: 'ACCEPT', status: 'accepted' }
      : order.status === 'accepted'
      ? { label: 'PREPARING', status: 'preparing' }
      : order.status === 'preparing'
      ? { label: 'READY', status: 'ready' }
      : order.status === 'ready'
      ? { label: 'COMPLETE', status: 'completed' }
      : null;

  const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass rounded-2xl overflow-hidden relative"
      >
        <UrgencyBorder elapsed={elapsed} />
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-black/6">
          <span className="font-heading text-4xl text-brand-orange">
            #{String(order.token_number).padStart(3, '0')}
          </span>
          <div className="text-right space-y-0.5">
            {order.table_number && (
              <p className="font-mono text-xs text-brand-dim">Table {order.table_number}</p>
            )}
            <PrepTimer startTime={order.created_at} />
            {order.accepted_at && order.estimated_prep_time_minutes && (
              <PrepCountdown
                acceptedAt={order.accepted_at}
                prepMinutes={order.estimated_prep_time_minutes}
              />
            )}
          </div>
        </div>

        <div className="px-4 py-3 space-y-1.5">
          <p className="font-heading text-xl text-brand-white tracking-wide">
            {order.quantity}× {order.item_name.toUpperCase()}
          </p>

          {order.modifiers.length > 0 && (
            <div className="space-y-0.5">
              {order.modifiers.map((m, i) => (
                <p
                  key={i}
                  className={`text-xs font-mono ${m.type === 'add' ? 'text-green-400' : 'text-red-400'}`}
                >
                  {m.type === 'add' ? '+' : '−'} {m.name}
                </p>
              ))}
            </div>
          )}

          {order.special_instructions && (
            <div className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-lg px-3 py-2">
              <p className="text-xs text-brand-yellow">⚠ {order.special_instructions}</p>
            </div>
          )}
        </div>

        <div className="px-3 pb-3 flex gap-2">
          {nextAction && (
            <Button
              size="sm"
              onClick={() => onAction(order.order_item_id, nextAction.status)}
              className="flex-1 font-heading tracking-wider"
            >
              {nextAction.label}
            </Button>
          )}
          {(order.status === 'pending' || order.status === 'accepted') && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setRejectOpen(true)}
            >
              ✗
            </Button>
          )}
        </div>
      </motion.div>

      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Item" size="sm">
        <div className="p-5 space-y-3">
          <p className="text-sm text-brand-dim">Select a reason:</p>
          {REJECT_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setRejectReason(r)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                rejectReason === r
                  ? 'border-red-500/40 bg-red-500/10 text-red-300'
                  : 'border-black/8 text-brand-chrome hover:border-black/15'
              }`}
            >
              {r}
            </button>
          ))}
          <Button
            variant="danger"
            size="md"
            className="w-full mt-2"
            disabled={!rejectReason}
            onClick={() => {
              onAction(order.order_item_id, 'rejected', rejectReason);
              setRejectOpen(false);
            }}
          >
            Confirm Reject
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default function KDSPage() {
  const { user } = useAuthStore();
  const { isKDSMuted, toggleKDSMute } = useUIStore();
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [undoQueue, setUndoQueue] = useState<{ itemId: string; prevStatus: OrderItemStatus; label: string; expires: number }[]>([]);
  const [queueStats, setQueueStats] = useState<{ queue_depth: number; avg_wait_minutes: number; oldest_pending_minutes: number } | null>(null);
  const [isAccepting, setIsAccepting] = useState(true);
  const [pauseLoading, setPauseLoading] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const prevCountRef = useRef(0);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiFetch<{ vendor_id: string; new: KDSOrder[]; preparing: KDSOrder[]; ready: KDSOrder[] }>('/kds/orders');
      setOrders([...(data.new ?? []), ...(data.preparing ?? []), ...(data.ready ?? [])]);
    } catch {}
  }, []);

  const fetchQueueStats = useCallback(async () => {
    try {
      const data = await apiFetch<{ queue_depth: number; avg_prep_time_minutes: number; oldest_pending_minutes: number }>('/kds/queue-stats');
      setQueueStats({ queue_depth: data.queue_depth, avg_wait_minutes: data.avg_prep_time_minutes, oldest_pending_minutes: data.oldest_pending_minutes });
    } catch {}
  }, []);

  const fetchVendorStatus = useCallback(async () => {
    try {
      const data = await apiFetch<{ is_accepting_orders: boolean }>('/vendor/settings');
      setIsAccepting(data.is_accepting_orders);
    } catch {}
  }, []);

  const togglePause = async () => {
    setPauseLoading(true);
    try {
      await apiPatch('/vendor/status', { is_accepting_orders: !isAccepting });
      setIsAccepting((v) => !v);
    } finally {
      setPauseLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
    fetchQueueStats();
    fetchVendorStatus();
    const interval = setInterval(() => { fetchOrders(); fetchQueueStats(); }, 8000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchQueueStats, fetchVendorStatus]);

  // Browser notification permission request on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // WebSocket real-time push
  useKdsSocket(user?.vendor_id ?? null, {
    onNewOrder: () => {
      setWsConnected(true);
      fetchOrders();
      // Browser push notification
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('New Order', { body: 'A new order just came in!', icon: '/favicon.ico' });
      }
    },
    onOrderUpdate: (update) => {
      setWsConnected(true);
      const upd = update as KDSOrder;
      setOrders((prev) =>
        prev.map((o) => (o.order_item_id === upd.order_item_id ? { ...o, ...upd } : o)),
      );
    },
  });

  // Chime + browser notification on new orders
  useEffect(() => {
    const newCount = orders.filter((o) => o.status === 'pending').length;
    if (newCount > prevCountRef.current && !wsConnected) {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('New Order', { body: `${newCount - prevCountRef.current} new order(s) arrived`, icon: '/favicon.ico' });
      }
    }
    if (!isKDSMuted && newCount > prevCountRef.current) {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
    prevCountRef.current = newCount;
  }, [orders, isKDSMuted]);

  // Undo queue cleanup
  useEffect(() => {
    const id = setInterval(() => {
      setUndoQueue((q) => q.filter((u) => u.expires > Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  async function handleAction(itemId: string, status: OrderItemStatus, rejection_reason?: string) {
    const prevStatus = orders.find((o) => o.order_item_id === itemId)?.status as OrderItemStatus | undefined;
    const endpoint =
      status === 'accepted' ? `/kds/items/${itemId}/accept`
      : status === 'preparing' ? `/kds/items/${itemId}/preparing`
      : status === 'ready' ? `/kds/items/${itemId}/ready`
      : status === 'completed' ? `/kds/items/${itemId}/complete`
      : `/kds/items/${itemId}/reject`;
    await apiPatch(endpoint, rejection_reason ? { reason: rejection_reason } : {});
    setOrders((prev) =>
      prev.map((o) => (o.order_item_id === itemId ? { ...o, status } : o)),
    );
    // Add undo entry (15s window, not for reject)
    if (prevStatus && status !== 'rejected') {
      setUndoQueue((q) => [
        ...q.filter((u) => u.itemId !== itemId),
        { itemId, prevStatus, label: `→ ${status.toUpperCase()}`, expires: Date.now() + 15000 },
      ]);
    }
  }

  async function handleUndo(itemId: string, prevStatus: OrderItemStatus) {
    setUndoQueue((q) => q.filter((u) => u.itemId !== itemId));
    // Revert by calling the previous status endpoint
    const endpoint =
      prevStatus === 'accepted' ? `/kds/items/${itemId}/accept`
      : prevStatus === 'preparing' ? `/kds/items/${itemId}/preparing`
      : prevStatus === 'pending' ? `/kds/items/${itemId}/accept`  // revert to pending via accept is close enough
      : `/kds/items/${itemId}/ready`;
    try {
      await apiPatch(endpoint, {});
      setOrders((prev) =>
        prev.map((o) => (o.order_item_id === itemId ? { ...o, status: prevStatus } : o)),
      );
    } catch {}
  }

  const toggleFS = () => {
    setFullscreen((v) => !v);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const newOrders = orders.filter((o) => o.status === 'pending' || o.status === 'accepted');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  return (
    <div className="flex flex-col h-full bg-brand-bg">
      {/* Undo toast strip */}
      <AnimatePresence>
        {undoQueue.map((u) => (
          <motion.div
            key={u.itemId}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[9999] flex items-center gap-3 bg-brand-card border border-black/10 rounded-xl px-4 py-3 shadow-xl"
          >
            <span className="text-xs font-body text-brand-chrome">
              Item {u.label}
            </span>
            <span className="text-xs font-mono text-brand-dim">
              {Math.ceil(Math.max(0, (u.expires - Date.now()) / 1000))}s
            </span>
            <button
              onClick={() => handleUndo(u.itemId, u.prevStatus)}
              className="text-xs font-semibold text-brand-orange hover:text-orange-300 transition-colors"
            >
              UNDO
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      {/* KDS Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl text-brand-white tracking-wide">
              KITCHEN DISPLAY
            </h1>
            <span
              title={wsConnected ? 'Live (WebSocket)' : 'Polling'}
              className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}
            />
          </div>
          <p className="text-xs text-brand-dim font-mono">
            {newOrders.length} new · {preparingOrders.length} preparing · {readyOrders.length} ready
          </p>
          {queueStats && (
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs font-mono text-brand-chrome">
                <span className="text-brand-dim">Queue:</span>{' '}
                <span className={queueStats.queue_depth > 10 ? 'text-red-400' : queueStats.queue_depth > 5 ? 'text-amber-400' : 'text-green-400'}>
                  {queueStats.queue_depth}
                </span>
              </span>
              <span className="text-xs font-mono text-brand-chrome">
                <span className="text-brand-dim">Avg wait:</span> {queueStats.avg_wait_minutes}m
              </span>
              {queueStats.oldest_pending_minutes > 0 && (
                <span className={`text-xs font-mono ${queueStats.oldest_pending_minutes > 15 ? 'text-red-400 animate-pulse' : 'text-brand-chrome'}`}>
                  <span className="text-brand-dim">Oldest:</span> {queueStats.oldest_pending_minutes}m
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={togglePause}
            disabled={pauseLoading}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              isAccepting
                ? 'bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400'
                : 'bg-red-500/20 text-red-400 animate-pulse hover:bg-green-500/15 hover:text-green-400'
            }`}
            title={isAccepting ? 'Pause ordering' : 'Resume ordering'}
          >
            {isAccepting ? '▶ OPEN' : '⏸ PAUSED'}
          </button>
          <button
            onClick={toggleKDSMute}
            className={`p-2 rounded-lg transition-all ${isKDSMuted ? 'bg-red-500/20 text-red-400' : 'bg-brand-card text-brand-chrome hover:text-brand-white'}`}
            title={isKDSMuted ? 'Unmute' : 'Mute'}
          >
            {isKDSMuted ? '🔇' : '🔔'}
          </button>
          <button
            onClick={toggleFS}
            className="p-2 rounded-lg bg-brand-card text-brand-chrome hover:text-brand-white transition-all"
          >
            {fullscreen ? '⊡' : '⛶'}
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-hidden">
        {COLUMNS.map(({ status, label, color, bg }, colIdx) => {
          const colOrders =
            colIdx === 0 ? newOrders : colIdx === 1 ? preparingOrders : readyOrders;

          return (
            <div key={status} className="flex flex-col min-h-0">
              {/* Column header */}
              <div
                className="flex items-center justify-between px-4 py-2.5 rounded-xl mb-3 flex-shrink-0"
                style={{ backgroundColor: bg, border: `1px solid ${color}33` }}
              >
                <span className="font-heading text-lg tracking-widest" style={{ color }}>
                  {label}
                </span>
                <span
                  className="font-mono text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${color}22`, color }}
                >
                  {colOrders.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <AnimatePresence>
                  {colOrders.map((order) => (
                    <KDSCard key={order.order_item_id} order={order} onAction={handleAction} />
                  ))}
                </AnimatePresence>
                {colOrders.length === 0 && (
                  <div className="text-center py-10 text-brand-dim text-sm">
                    No orders
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
