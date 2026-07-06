'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import GlassCard from '@/components/ui/GlassCard';
import Spinner from '@/components/ui/Spinner';

interface SalesDay { date: string; orders: number; revenue: number }
interface SalesSummary { days: SalesDay[]; total_revenue: number; total_orders: number }
interface TopItem { item_name: string; count: number; revenue: number }
interface PeakHour { day_of_week: number; hour: number; count: number }

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function VendorReportsPage() {
  const [tab, setTab] = useState<'sales' | 'items' | 'peak'>('sales');
  const [from, setFrom] = useState(dateOffset(29));
  const [to, setTo] = useState(dateOffset(0));
  const [sales, setSales] = useState<SalesSummary | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [peak, setPeak] = useState<PeakHour[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = `?from=${from}&to=${to}`;
      const [s, t, p] = await Promise.all([
        apiFetch<SalesSummary>(`/vendor/reports/sales${qs}`),
        apiFetch<TopItem[]>(`/vendor/reports/top-items${qs}&limit=15`),
        apiFetch<PeakHour[]>(`/vendor/reports/peak-hours${qs}`),
      ]);
      setSales(s);
      setTopItems(t);
      setPeak(p);
    } catch {}
    setLoading(false);
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  function downloadCSV() {
    if (!sales) return;
    const rows = [['Date', 'Orders', 'Revenue'], ...sales.days.map((d) => [d.date, d.orders, d.revenue])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `sales-${from}-${to}.csv`;
    a.click();
  }

  const maxRev = Math.max(...(sales?.days.map((d) => d.revenue) ?? [1]), 1);
  const maxItemCount = Math.max(...topItems.map((i) => i.count), 1);
  const maxPeak = Math.max(...peak.map((p) => p.count), 1);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-4xl text-brand-white tracking-widest">REPORTS</h1>
        <div className="flex gap-2 items-center">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="bg-brand-card border border-white/10 rounded-lg px-3 py-1.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/50" />
          <span className="text-brand-dim text-sm">to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="bg-brand-card border border-white/10 rounded-lg px-3 py-1.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/50" />
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => { setFrom(dateOffset(d - 1)); setTo(dateOffset(0)); }}
              className="px-3 py-1.5 text-xs font-semibold bg-brand-card text-brand-dim hover:text-brand-white rounded-lg transition-colors">
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2">
        {(['sales', 'items', 'peak'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-heading tracking-wide transition-all capitalize ${tab === t ? 'bg-brand-orange text-white' : 'bg-brand-card text-brand-dim hover:text-brand-white'}`}>
            {t === 'sales' ? 'Sales' : t === 'items' ? 'Top Items' : 'Peak Hours'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : tab === 'sales' && sales ? (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Revenue', value: `$${sales.total_revenue.toFixed(2)}`, yellow: true },
              { label: 'Total Orders', value: String(sales.total_orders), yellow: false },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <GlassCard>
                  <p className="text-xs text-brand-dim uppercase tracking-wider mb-1">{s.label}</p>
                  <p className={`text-3xl font-bold font-mono ${s.yellow ? 'text-brand-yellow' : 'text-brand-white'}`}>{s.value}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Revenue bar chart */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl text-brand-white tracking-wide">DAILY REVENUE</h2>
              <button onClick={downloadCSV} className="text-xs text-brand-orange hover:underline">Export CSV</button>
            </div>
            <div className="flex items-end gap-1 h-32">
              {sales.days.map((d, i) => (
                <div key={d.date} className="flex-1 min-w-0 relative group"
                  style={{ height: `${Math.max(2, (d.revenue / maxRev) * 100)}%` }}>
                  <div className="w-full h-full rounded-t-sm bg-brand-orange/40 hover:bg-brand-orange transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-brand-card px-2 py-1 rounded text-xs font-mono text-brand-white opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                    {d.date}: ${d.revenue.toFixed(0)} ({d.orders} orders)
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-brand-dim font-mono">
              <span>{sales.days[0]?.date?.slice(5)}</span>
              <span>{sales.days[sales.days.length - 1]?.date?.slice(5)}</span>
            </div>
          </GlassCard>

          {/* Daily breakdown table */}
          <GlassCard>
            <h2 className="font-heading text-xl text-brand-white tracking-wide mb-4">DAILY BREAKDOWN</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-brand-dim text-xs uppercase tracking-wider border-b border-white/6">
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-right py-2 pr-4">Orders</th>
                    <th className="text-right py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {[...sales.days].reverse().map((d) => (
                    <tr key={d.date} className="hover:bg-white/2 transition-colors">
                      <td className="py-2 pr-4 font-mono text-brand-chrome">{d.date}</td>
                      <td className="py-2 pr-4 text-right text-brand-white">{d.orders}</td>
                      <td className="py-2 text-right font-mono text-brand-yellow">${d.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      ) : tab === 'items' ? (
        <GlassCard>
          <h2 className="font-heading text-xl text-brand-white tracking-wide mb-4">TOP ITEMS</h2>
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <div key={item.item_name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-brand-chrome">
                    <span className="text-brand-dim font-mono mr-2">#{i + 1}</span>
                    {item.item_name}
                  </span>
                  <div className="flex gap-4 text-right">
                    <span className="text-brand-dim font-mono">{item.count} sold</span>
                    <span className="text-brand-yellow font-mono">${item.revenue.toFixed(0)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-brand-steel rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / maxItemCount) * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.04 }}
                    className="h-full bg-brand-orange rounded-full"
                  />
                </div>
              </div>
            ))}
            {topItems.length === 0 && <p className="text-brand-dim text-sm text-center py-6">No data for this period</p>}
          </div>
        </GlassCard>
      ) : tab === 'peak' ? (
        <GlassCard>
          <h2 className="font-heading text-xl text-brand-white tracking-wide mb-4">PEAK HOURS</h2>
          <p className="text-xs text-brand-dim mb-4">Order density by day and hour. Darker = more orders.</p>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Hour labels */}
              <div className="flex gap-0.5 mb-1 pl-8">
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="flex-1 text-center text-xs text-brand-dim font-mono">
                    {h % 4 === 0 ? `${h}h` : ''}
                  </div>
                ))}
              </div>
              {DAY_LABELS.map((day, d) => (
                <div key={day} className="flex items-center gap-0.5 mb-0.5">
                  <div className="w-7 text-xs text-brand-dim text-right pr-1 shrink-0">{day}</div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const cell = peak.find((p) => p.day_of_week === d && p.hour === h);
                    const count = cell?.count ?? 0;
                    const opacity = maxPeak > 0 ? count / maxPeak : 0;
                    return (
                      <div key={h} className="flex-1 h-6 rounded-sm relative group cursor-default"
                        style={{ backgroundColor: `rgba(255, 107, 53, ${Math.max(0.05, opacity)})` }}>
                        {count > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-brand-card px-2 py-1 rounded text-xs font-mono text-brand-white opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                            {day} {h}:00 — {count} orders
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
