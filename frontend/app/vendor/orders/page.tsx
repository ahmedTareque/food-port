'use client';
import { useEffect, useState } from 'react';
import { apiFetch, apiFetchPaginated } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';

interface VendorOrder {
  id: string;
  token_number: number;
  table_number: string | null;
  item_count: number;
  total: number;
  status: string;
  created_at: string;
}

interface OrderDetail {
  id: string;
  token_number: number;
  table_number: string | null;
  status: string;
  created_at: string;
  special_notes: string | null;
  total: number;
  items: {
    id: string;
    item_name: string;
    quantity: number;
    base_price: number;
    total_price: number;
    status: string;
    special_instructions: string | null;
    modifiers: { name: string; price: number }[];
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#888888',
  confirmed: '#3B82F6',
  preparing: '#8B5CF6',
  ready: '#10B981',
  completed: '#6EE7B7',
  cancelled: '#EF4444',
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [tokenSearch, setTokenSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (statusFilter) params.set('status', statusFilter);
    apiFetchPaginated<VendorOrder[]>(`/vendor/orders?${params}`)
      .then(({ data, meta }) => {
        setOrders(data);
        setTotal(meta.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  async function openOrder(orderId: string) {
    setDetailLoading(true);
    try {
      const detail = await apiFetch<OrderDetail>(`/vendor/orders/${orderId}`);
      setSelectedOrder(detail);
    } catch {} finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-heading text-4xl text-brand-white tracking-widest mb-5">ORDER HISTORY</h1>

      {/* Order detail modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={selectedOrder ? `Order #${String(selectedOrder.token_number).padStart(3, '0')}` : ''}>
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-brand-dim">Table:</span>
              <span className="text-brand-chrome">{selectedOrder.table_number ?? '—'}</span>
              <span className="text-brand-dim">Status:</span>
              <span className="font-semibold capitalize" style={{ color: STATUS_COLORS[selectedOrder.status] ?? '#888' }}>{selectedOrder.status}</span>
              <span className="text-brand-dim ml-auto font-mono text-xs">{new Date(selectedOrder.created_at).toLocaleString()}</span>
            </div>
            {selectedOrder.special_notes && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 text-xs text-amber-300">
                Note: {selectedOrder.special_notes}
              </div>
            )}
            <div className="space-y-2">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="glass rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading text-brand-white">{item.quantity}× {item.item_name}</p>
                      {item.modifiers.length > 0 && (
                        <p className="text-xs text-brand-dim mt-0.5">
                          {item.modifiers.map((m) => m.name).join(', ')}
                        </p>
                      )}
                      {item.special_instructions && (
                        <p className="text-xs text-amber-300 mt-0.5">"{item.special_instructions}"</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-brand-orange">${item.total_price.toFixed(2)}</p>
                      <p className="text-xs text-brand-dim capitalize">{item.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-black/10">
              <span className="font-heading text-brand-dim">TOTAL</span>
              <span className="font-heading text-xl text-brand-orange">${selectedOrder.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Token search */}
      <div className="mb-3">
        <input
          value={tokenSearch}
          onChange={(e) => setTokenSearch(e.target.value)}
          placeholder="Search by token # (e.g. 42)…"
          className="bg-brand-bg border border-black/10 rounded-xl px-4 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60 w-full max-w-xs"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              statusFilter === s
                ? 'bg-brand-orange text-white'
                : 'bg-brand-card text-brand-dim border border-black/8 hover:text-brand-white'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner /></div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/6 text-xs text-brand-dim uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Token</th>
                  <th className="px-4 py-3 text-left">Table</th>
                  <th className="px-4 py-3 text-right">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {orders.filter((o) => !tokenSearch || String(o.token_number).includes(tokenSearch)).map((order) => (
                  <tr key={order.id} className="hover:bg-black/2 transition-colors cursor-pointer" onClick={() => openOrder(order.id)}>
                    <td className="px-4 py-3 font-heading text-xl text-brand-orange">
                      #{String(order.token_number).padStart(3, '0')}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-brand-chrome">
                      {order.table_number ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-brand-dim">
                      {order.item_count}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-brand-orange">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-md capitalize"
                        style={{
                          color: STATUS_COLORS[order.status] ?? '#888',
                          backgroundColor: `${STATUS_COLORS[order.status] ?? '#888'}18`,
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-brand-dim">
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-black/6">
              <span className="text-xs text-brand-dim font-mono">
                {total} orders total
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-brand-card text-brand-dim border border-black/8 disabled:opacity-40 hover:text-brand-white"
                >
                  Previous
                </button>
                <button
                  disabled={page * LIMIT >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-brand-card text-brand-dim border border-black/8 disabled:opacity-40 hover:text-brand-white"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
