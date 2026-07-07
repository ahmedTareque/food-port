'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch, apiPost } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import type { CashLog } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';

interface DailySummary { date: string; total_orders: number; gross_revenue: number; tax_collected: number; net_revenue: number; }
interface VendorRevenue { vendor_id: string; vendor_name: string; orders: number; revenue: number; tax: number; net: number; }
interface CashLogResult { logs: CashLog[]; total: number; page: number; pages: number; }

const TABS = ['Daily Summary', 'By Vendor', 'Cash Log'];

export default function AdminFinancePage() {
  const [tab, setTab] = useState(0);
  const [daily, setDaily] = useState<DailySummary[]>([]);
  const [byVendor, setByVendor] = useState<VendorRevenue[]>([]);
  const [cashLog, setCashLog] = useState<CashLogResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [cashLogOpen, setCashLogOpen] = useState(false);
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10); });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const addToast = useUIStore((s) => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, v, cl] = await Promise.all([
        apiFetch<DailySummary[]>(`/admin/finance/daily?from=${from}&to=${to}`),
        apiFetch<VendorRevenue[]>(`/admin/finance/by-vendor?from=${from}&to=${to}`),
        apiFetch<CashLogResult>(`/admin/finance/cash-log?limit=50&from=${from}&to=${to}`),
      ]);
      setDaily(d);
      setByVendor(v);
      setCashLog(cl);
    } catch {}
    setLoading(false);
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = daily.reduce((s, d) => s + d.gross_revenue, 0);
  const totalOrders = daily.reduce((s, d) => s + d.total_orders, 0);
  const totalTax = daily.reduce((s, d) => s + d.tax_collected, 0);

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-4xl text-brand-white tracking-widest">FINANCE</h1>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/admin/finance/export?from=${from}&to=${to}`}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-xl border border-black/10 text-xs text-brand-dim hover:text-brand-white hover:border-black/20 transition-all font-semibold uppercase tracking-wider"
        >
          Export CSV
        </a>
      </div>

      {/* Date range */}
      <div className="flex gap-3 items-center mb-6">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-brand-card border border-black/10 rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
        <span className="text-brand-dim">to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-brand-card border border-black/10 rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Gross Revenue', value: `$${totalRevenue.toFixed(2)}`, yellow: true },
          { label: 'Tax Collected', value: `$${totalTax.toFixed(2)}` },
          { label: 'Total Orders', value: String(totalOrders) },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4">
            <p className="text-xs text-brand-dim uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`font-heading text-3xl tracking-wide ${s.yellow ? 'text-brand-yellow' : 'text-brand-white'}`}>{s.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-brand-card rounded-xl p-1 w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === i ? 'bg-brand-orange text-white' : 'text-brand-dim hover:text-brand-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Daily Summary */}
          {tab === 0 && (
            <GlassCard className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-black/6">
                  <tr className="text-brand-dim text-xs uppercase tracking-wider">
                    {['Date', 'Orders', 'Gross', 'Tax', 'Net'].map((h) => (
                      <th key={h} className="text-left px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {daily.map((d) => (
                    <tr key={d.date} className="hover:bg-black/2 transition-colors">
                      <td className="px-5 py-3 font-mono text-brand-dim text-xs">{d.date}</td>
                      <td className="px-5 py-3 text-brand-white">{d.total_orders}</td>
                      <td className="px-5 py-3 font-mono text-brand-yellow">${d.gross_revenue.toFixed(2)}</td>
                      <td className="px-5 py-3 font-mono text-brand-dim">${d.tax_collected.toFixed(2)}</td>
                      <td className="px-5 py-3 font-mono text-brand-white">${d.net_revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}

          {/* By Vendor */}
          {tab === 1 && (
            <GlassCard className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-black/6">
                  <tr className="text-brand-dim text-xs uppercase tracking-wider">
                    {['Vendor', 'Orders', 'Revenue', 'Tax', 'Net'].map((h) => (
                      <th key={h} className="text-left px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {byVendor.map((v) => (
                    <tr key={v.vendor_id} className="hover:bg-black/2 transition-colors">
                      <td className="px-5 py-3 text-brand-white font-semibold">{v.vendor_name}</td>
                      <td className="px-5 py-3 text-brand-chrome">{v.orders}</td>
                      <td className="px-5 py-3 font-mono text-brand-yellow">${v.revenue.toFixed(2)}</td>
                      <td className="px-5 py-3 font-mono text-brand-dim">${v.tax.toFixed(2)}</td>
                      <td className="px-5 py-3 font-mono text-brand-white">${v.net.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}

          {/* Cash Log */}
          {tab === 2 && (
            <div>
              <div className="flex justify-end mb-3">
                <Button size="sm" onClick={() => setCashLogOpen(true)}>+ Log Cash</Button>
              </div>
              <GlassCard className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-black/6">
                    <tr className="text-brand-dim text-xs uppercase tracking-wider">
                      {['Token', 'Amount', 'Collected By', 'Notes', 'Time'].map((h) => (
                        <th key={h} className="text-left px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4">
                    {(cashLog?.logs ?? []).map((l) => (
                      <tr key={l.id} className="hover:bg-black/2 transition-colors">
                        <td className="px-5 py-3 font-heading text-xl text-brand-orange">#{String(l.token_number).padStart(3,'0')}</td>
                        <td className="px-5 py-3 font-mono text-brand-yellow">${l.amount.toFixed(2)}</td>
                        <td className="px-5 py-3 text-brand-chrome">{l.collected_by}</td>
                        <td className="px-5 py-3 text-brand-dim text-xs">{l.notes ?? '—'}</td>
                        <td className="px-5 py-3 font-mono text-brand-dim text-xs">{new Date(l.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {(cashLog?.logs ?? []).length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-brand-dim">No cash log entries</td></tr>
                    )}
                  </tbody>
                </table>
              </GlassCard>
            </div>
          )}
        </>
      )}

      {/* Cash log entry modal */}
      <CashLogModal isOpen={cashLogOpen} onClose={() => setCashLogOpen(false)} onSaved={() => { setCashLogOpen(false); load(); }} />
    </div>
  );
}

function CashLogModal({ isOpen, onClose, onSaved }: { isOpen: boolean; onClose: () => void; onSaved: () => void }) {
  const addToast = useUIStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ order_id: '', amount: '', collected_by: '', notes: '' });

  async function handleSave() {
    if (!form.order_id || !form.amount || !form.collected_by) {
      addToast({ message: 'Order ID, amount, and collector name required', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await apiPost('/admin/finance/cash-log', { order_id: form.order_id, amount: parseFloat(form.amount), collected_by: form.collected_by, notes: form.notes || null });
      addToast({ message: 'Cash logged', type: 'success' });
      onSaved();
    } catch {
      addToast({ message: 'Failed to log cash', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Cash Collection" size="sm">
      <div className="p-5 space-y-4">
        {[
          { label: 'Order ID', key: 'order_id', placeholder: 'UUID or order ID' },
          { label: 'Amount ($)', key: 'amount', placeholder: '0.00' },
          { label: 'Collected By', key: 'collected_by', placeholder: 'Staff name' },
          { label: 'Notes', key: 'notes', placeholder: 'Optional' },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">{label}</label>
            <input
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              type={key === 'amount' ? 'number' : 'text'}
              step={key === 'amount' ? '0.01' : undefined}
              className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
            />
          </div>
        ))}
        <Button onClick={handleSave} loading={saving} size="lg" className="w-full font-heading tracking-widest">LOG CASH</Button>
      </div>
    </Modal>
  );
}
