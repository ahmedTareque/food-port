'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, apiPost } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import type { AdminOrder, OrderStatus } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';

interface OrderDetail extends AdminOrder {
  history: { id: string; from_status: string | null; to_status: string; reason: string | null; created_at: string }[];
  promotions?: { promotion: { code: string; discount_type: string; discount_value: number } }[];
}

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'partially_ready', 'ready', 'completed', 'cancelled'];
const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B', confirmed: '#F59E0B', partially_ready: '#8B5CF6',
  ready: '#10B981', completed: '#6B7280', cancelled: '#EF4444',
};

interface OrdersResult {
  orders: AdminOrder[];
  total: number;
  page: number;
  pages: number;
}

export default function AdminOrdersPage() {
  const [data, setData] = useState<OrdersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [vendorList, setVendorList] = useState<{ id: string; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (vendorFilter) params.set('vendor_id', vendorFilter);
      const res = await apiFetch<OrdersResult>(`/admin/orders?${params}`);
      setData(res);
    } catch {}
    setLoading(false);
  }, [page, statusFilter, vendorFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    apiFetch<{ id: string; name: string }[]>('/admin/vendors?limit=100')
      .then((d) => setVendorList(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  async function openDetail(order: AdminOrder) {
    setSelected(order);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await apiFetch<OrderDetail>(`/admin/orders/${order.id}`);
      setDetail(d);
    } catch {}
    setDetailLoading(false);
  }

  function closeDetail() {
    setSelected(null);
    setDetail(null);
    setCancelOpen(false);
  }

  async function handleCancel() {
    if (!selected || !cancelReason) return;
    setCancelling(true);
    try {
      await apiPost(`/admin/orders/${selected.id}/cancel`, { reason: cancelReason });
      addToast({ message: `Order #${String(selected.token_number).padStart(3,'0')} cancelled`, type: 'success' });
      setCancelOpen(false);
      setSelected(null);
      load();
    } catch {
      addToast({ message: 'Failed to cancel order', type: 'error' });
    } finally {
      setCancelling(false);
    }
  }

  function exportCSV() {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/export${statusFilter ? `?status=${statusFilter}` : ''}`, '_blank');
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-4xl text-brand-white tracking-widest">ORDERS</h1>
        <Button variant="secondary" size="sm" onClick={exportCSV}>Export CSV</Button>
      </div>

      {/* Vendor filter */}
      {vendorList.length > 0 && (
        <div className="mb-3">
          <select
            value={vendorFilter}
            onChange={(e) => { setVendorFilter(e.target.value); setPage(1); }}
            className="bg-brand-card border border-white/10 rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
          >
            <option value="">All Vendors</option>
            {vendorList.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      )}

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!statusFilter ? 'bg-brand-orange text-white' : 'bg-brand-card text-brand-dim hover:text-brand-white'}`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${statusFilter === s ? 'bg-brand-orange text-white' : 'bg-brand-card text-brand-dim hover:text-brand-white'}`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <GlassCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/6">
                <tr className="text-brand-dim text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Token</th>
                  <th className="text-left px-4 py-3">Table</th>
                  <th className="text-left px-4 py-3">Items</th>
                  <th className="text-left px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {(data?.orders ?? []).map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openDetail(order)}
                    className="hover:bg-white/2 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 font-heading text-2xl text-brand-orange">
                      #{String(order.token_number).padStart(3, '0')}
                    </td>
                    <td className="px-4 py-3 text-brand-chrome">T{order.table_number}</td>
                    <td className="px-4 py-3 text-brand-dim">{order.item_count} item{order.item_count !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3 font-mono text-brand-yellow">${order.total.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                        style={{ backgroundColor: `${STATUS_COLOR[order.status] ?? '#888'}22`, color: STATUS_COLOR[order.status] ?? '#888' }}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-brand-dim text-xs font-mono">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-brand-dim font-mono">{data.total} total</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <span className="px-3 py-1.5 text-brand-dim">{page} / {data.pages}</span>
                <Button size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page >= data.pages}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Slide-in order detail panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={closeDetail}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[420px] max-w-full bg-brand-card border-l border-white/8 z-50 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/6 shrink-0">
                <div>
                  <h2 className="font-heading text-2xl text-brand-orange tracking-widest">
                    #{String(selected.token_number).padStart(3, '0')}
                  </h2>
                  <p className="text-xs text-brand-dim font-mono">{new Date(selected.created_at).toLocaleString()}</p>
                </div>
                <button onClick={closeDetail} className="text-brand-dim hover:text-brand-white text-xl p-1">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Table', value: `T${selected.table_number}` },
                    { label: 'Status', value: selected.status.replace('_', ' '), color: STATUS_COLOR[selected.status] },
                    { label: 'Total', value: `$${selected.total.toFixed(2)}`, color: '#F59E0B' },
                  ].map((s) => (
                    <div key={s.label} className="bg-brand-bg/50 rounded-xl p-3">
                      <p className="text-xs text-brand-dim mb-0.5">{s.label}</p>
                      <p className="font-semibold capitalize text-sm font-mono" style={{ color: s.color ?? undefined }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Items */}
                <div>
                  <p className="text-xs text-brand-dim uppercase tracking-wider mb-2">Items</p>
                  {detailLoading ? (
                    <div className="flex justify-center py-6"><Spinner size="sm" /></div>
                  ) : (
                    <div className="space-y-1.5">
                      {(detail?.items ?? selected.items).map((item) => (
                        <div key={item.id} className="flex justify-between items-center px-3 py-2.5 bg-brand-bg/60 rounded-xl">
                          <div>
                            <p className="text-sm text-brand-white">{item.quantity}× {item.item_name}</p>
                            <p className="text-xs font-mono" style={{ color: item.vendor?.booth_color ?? '#888' }}>{item.vendor?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-brand-yellow text-sm">${item.total_price.toFixed(2)}</p>
                            <span className="text-xs capitalize" style={{ color: STATUS_COLOR[item.status] ?? '#888' }}>{item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status history */}
                {detail?.history && detail.history.length > 0 && (
                  <div>
                    <p className="text-xs text-brand-dim uppercase tracking-wider mb-2">Status History</p>
                    <div className="relative pl-4 border-l border-white/8 space-y-3">
                      {detail.history.map((h) => (
                        <div key={h.id} className="relative">
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-white/20 bg-brand-card" />
                          <p className="text-xs font-mono text-brand-dim">{new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-sm text-brand-chrome capitalize">
                            {h.from_status ? (
                              <><span style={{ color: STATUS_COLOR[h.from_status] ?? '#888' }}>{h.from_status.replace('_',' ')}</span>{' → '}</>
                            ) : null}
                            <span style={{ color: STATUS_COLOR[h.to_status] ?? '#888' }}>{h.to_status.replace('_',' ')}</span>
                          </p>
                          {h.reason && <p className="text-xs text-brand-dim italic">{h.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selected.status !== 'cancelled' && selected.status !== 'completed' && (
                <div className="p-5 border-t border-white/6 shrink-0">
                  <Button variant="danger" size="md" className="w-full" onClick={() => setCancelOpen(true)}>
                    Cancel Order
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cancel reason modal */}
      <Modal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Order" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-brand-dim">Provide a reason for cancellation:</p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            placeholder="e.g. Customer request, kitchen closed…"
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60 resize-none"
          />
          <div className="flex gap-2">
            <Button variant="danger" size="md" className="flex-1" loading={cancelling} onClick={handleCancel} disabled={!cancelReason}>
              Confirm Cancel
            </Button>
            <Button variant="ghost" size="md" onClick={() => setCancelOpen(false)}>Back</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
