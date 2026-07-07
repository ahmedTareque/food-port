'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import type { Promotion } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';

interface PromoStats { uses: number; total_discount: number; orders: { order_id: string; token_number: number; discount: number; order_total: number; date: string }[]; }

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [statsPromo, setStatsPromo] = useState<Promotion | null>(null);
  const [stats, setStats] = useState<PromoStats | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeFilter !== 'all' ? `?active=${activeFilter}` : '';
      const data = await apiFetch<{ promotions: Promotion[] }>(`/admin/promotions${params}`);
      setPromotions(data.promotions);
    } catch {}
    setLoading(false);
  }, [activeFilter]);

  useEffect(() => { load(); }, [load]);

  async function loadStats(promo: Promotion) {
    setStatsPromo(promo);
    try {
      const data = await apiFetch<PromoStats>(`/admin/promotions/${promo.id}/stats`);
      setStats(data);
    } catch { setStats(null); }
  }

  async function togglePromo(id: string) {
    try {
      await apiPatch(`/admin/promotions/${id}/toggle`, {});
      load();
    } catch {
      addToast({ message: 'Failed to toggle', type: 'error' });
    }
  }

  async function deletePromo(id: string) {
    if (!confirm('Delete this promotion?')) return;
    try {
      await apiDelete(`/admin/promotions/${id}`);
      addToast({ message: 'Promotion deleted', type: 'success' });
      load();
    } catch {
      addToast({ message: 'Failed to delete', type: 'error' });
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-4xl text-brand-white tracking-widest">PROMOTIONS</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ New Promo</Button>
      </div>

      <div className="flex gap-2 mb-5">
        {(['all', 'true', 'false'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${activeFilter === f ? 'bg-brand-orange text-white' : 'bg-brand-card text-brand-dim hover:text-brand-white'}`}
          >
            {f === 'all' ? 'All' : f === 'true' ? 'Active' : 'Inactive'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promotions.map((promo) => (
            <GlassCard key={promo.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-2xl text-brand-orange font-bold tracking-widest">{promo.code}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-steel text-brand-chrome capitalize">{promo.type}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-yellow/20 text-brand-yellow">
                      {promo.type === 'percent' ? `${promo.value}%` : `$${promo.value.toFixed(2)}`} off
                    </span>
                  </div>
                </div>

                {/* Active toggle */}
                <button
                  onClick={() => togglePromo(promo.id)}
                  className={`relative w-10 h-5 rounded-full transition-all shrink-0 ${promo.is_active ? 'bg-green-500' : 'bg-brand-steel'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${promo.is_active ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Usage bar */}
              {promo.max_uses && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-brand-dim mb-1">
                    <span>Uses: {promo.current_uses} / {promo.max_uses}</span>
                    <span>{Math.round((promo.current_uses / promo.max_uses) * 100)}%</span>
                  </div>
                  <div className="h-1 bg-brand-steel rounded-full overflow-hidden">
                    <div className="h-full bg-brand-orange rounded-full" style={{ width: `${Math.min((promo.current_uses / promo.max_uses) * 100, 100)}%` }} />
                  </div>
                </div>
              )}

              <div className="text-xs text-brand-dim font-mono mb-3">
                {new Date(promo.valid_from).toLocaleDateString()} → {new Date(promo.valid_to).toLocaleDateString()}
                {promo.min_order_amount && <span className="ml-2">Min ${promo.min_order_amount}</span>}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditPromo(promo)} className="flex-1">Edit</Button>
                <Button size="sm" variant="secondary" onClick={() => loadStats(promo)} className="flex-1">Stats</Button>
                <Button size="sm" variant="danger" onClick={() => deletePromo(promo.id)}>Delete</Button>
              </div>
            </GlassCard>
          ))}
          {promotions.length === 0 && (
            <div className="col-span-2 text-center py-16 text-brand-dim">No promotions yet</div>
          )}
        </div>
      )}

      {/* Create/Edit modal */}
      <PromoFormModal
        isOpen={createOpen || !!editPromo}
        promo={editPromo}
        onClose={() => { setCreateOpen(false); setEditPromo(null); }}
        onSaved={() => { setCreateOpen(false); setEditPromo(null); load(); }}
      />

      {/* Stats modal */}
      <Modal isOpen={!!statsPromo} onClose={() => { setStatsPromo(null); setStats(null); }} title={`Stats — ${statsPromo?.code}`} size="lg">
        <div className="p-5">
          {!stats ? <Spinner size="md" /> : (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <GlassCard className="p-4">
                  <p className="text-xs text-brand-dim mb-1">Total Uses</p>
                  <p className="font-heading text-3xl text-brand-white">{stats.uses}</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs text-brand-dim mb-1">Total Discount Given</p>
                  <p className="font-heading text-3xl text-brand-yellow">${stats.total_discount.toFixed(2)}</p>
                </GlassCard>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {stats.orders.map((o) => (
                  <div key={o.order_id} className="flex justify-between px-3 py-2 bg-brand-bg/60 rounded-lg text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-brand-orange text-lg">#{String(o.token_number).padStart(3,'0')}</span>
                      <span className="text-brand-dim text-xs font-mono">{new Date(o.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-red-400 font-mono text-sm">-${o.discount.toFixed(2)}</span>
                      <span className="text-brand-dim text-xs ml-2">(${o.order_total.toFixed(2)} total)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function PromoFormModal({ isOpen, promo, onClose, onSaved }: { isOpen: boolean; promo: Promotion | null; onClose: () => void; onSaved: () => void }) {
  const addToast = useUIStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percent' as 'percent' | 'fixed', value: '', min_order_amount: '', max_uses: '', valid_from: '', valid_to: '' });

  useEffect(() => {
    if (promo) {
      setForm({ code: promo.code, type: promo.type, value: String(promo.value), min_order_amount: promo.min_order_amount ? String(promo.min_order_amount) : '', max_uses: promo.max_uses ? String(promo.max_uses) : '', valid_from: promo.valid_from.slice(0, 10), valid_to: promo.valid_to.slice(0, 10) });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      setForm({ code: '', type: 'percent', value: '', min_order_amount: '', max_uses: '', valid_from: today, valid_to: nextMonth });
    }
  }, [promo, isOpen]);

  async function handleSave() {
    if (!form.code || !form.value || !form.valid_from || !form.valid_to) {
      addToast({ message: 'Code, value, and dates are required', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = { code: form.code.toUpperCase(), type: form.type, value: parseFloat(form.value), min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null, max_uses: form.max_uses ? parseInt(form.max_uses) : null, valid_from: form.valid_from, valid_to: form.valid_to };
      if (promo) {
        await apiPatch(`/admin/promotions/${promo.id}`, payload);
      } else {
        await apiPost('/admin/promotions', payload);
      }
      addToast({ message: `Promotion ${promo ? 'updated' : 'created'}`, type: 'success' });
      onSaved();
    } catch {
      addToast({ message: 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={promo ? 'Edit Promotion' : 'New Promotion'} size="md">
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Promo Code</label>
          <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE10" className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm font-mono text-brand-orange focus:outline-none focus:border-brand-orange/60" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))} className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60">
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Value</label>
            <input type="number" step="0.01" min="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percent' ? '10' : '5.00'} className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Min Order ($)</label>
            <input type="number" step="0.01" min="0" value={form.min_order_amount} onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))} placeholder="Optional" className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Max Uses</label>
            <input type="number" min="1" value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Valid From</label>
            <input type="date" value={form.valid_from} onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))} className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Valid To</label>
            <input type="date" value={form.valid_to} onChange={(e) => setForm((f) => ({ ...f, valid_to: e.target.value }))} className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
          </div>
        </div>

        <Button onClick={handleSave} loading={saving} size="lg" className="w-full font-heading tracking-widest">
          {promo ? 'SAVE CHANGES' : 'CREATE PROMOTION'}
        </Button>
      </div>
    </Modal>
  );
}
