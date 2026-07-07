'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import type { RevenuePoint, PeakHourPoint } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import Spinner from '@/components/ui/Spinner';

interface TopItem { item_name: string; vendor_name: string; count: number; revenue: number; }
interface CuisineData { cuisine_type: string; order_count: number; revenue: number; }
interface PrepTimeData { vendor_id: string; vendor_name: string; avg_prep_time: number; p50: number; p90: number; sample_count: number; }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TABS = ['Revenue', 'Peak Hours', 'Top Items', 'By Cuisine', 'Prep Times'];

export default function AdminAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHourPoint[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [cuisine, setCuisine] = useState<CuisineData[]>([]);
  const [prepTimes, setPrepTimes] = useState<PrepTimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10); });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = `from=${from}&to=${to}`;
      const [rev, ph, ti, cu, pt] = await Promise.all([
        apiFetch<RevenuePoint[]>(`/admin/analytics/revenue?interval=day&${q}`),
        apiFetch<PeakHourPoint[]>(`/admin/analytics/peak-hours?${q}`),
        apiFetch<TopItem[]>(`/admin/analytics/top-items?limit=15&${q}`),
        apiFetch<CuisineData[]>(`/admin/analytics/by-cuisine?${q}`),
        apiFetch<PrepTimeData[]>(`/admin/analytics/prep-times?${q}`),
      ]);
      setRevenue(rev);
      setPeakHours(ph);
      setTopItems(ti);
      setCuisine(cu);
      setPrepTimes(pt);
    } catch {}
    setLoading(false);
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const maxRevenue = Math.max(...revenue.map((r) => r.revenue), 1);
  const maxPeak = Math.max(...peakHours.map((p) => p.count), 1);
  const maxItems = Math.max(...topItems.map((i) => i.count), 1);
  const totalCuisineRevenue = cuisine.reduce((s, c) => s + c.revenue, 0);

  // Build heatmap grid: day × hour
  const heatmap: Record<string, number> = {};
  peakHours.forEach((p) => { heatmap[`${p.day_of_week}:${p.hour}`] = p.count; });

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="font-heading text-4xl text-brand-white tracking-widest mb-6">ANALYTICS</h1>

      {/* Date range */}
      <div className="flex gap-3 items-center mb-5">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-brand-card border border-black/10 rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
        <span className="text-brand-dim">to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-brand-card border border-black/10 rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
        <div className="flex gap-1">
          {['Today', '7d', '30d'].map((q) => (
            <button key={q} onClick={() => {
              const d = new Date();
              const start = new Date(d);
              if (q === 'Today') start.setHours(0,0,0,0);
              else if (q === '7d') start.setDate(d.getDate() - 6);
              else start.setDate(d.getDate() - 29);
              setFrom(start.toISOString().slice(0, 10));
              setTo(d.toISOString().slice(0, 10));
            }} className="px-3 py-1.5 rounded-lg text-xs text-brand-dim hover:text-brand-white bg-brand-card hover:bg-brand-steel transition-all">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-brand-card rounded-xl p-1 w-fit flex-wrap">
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
          {/* Revenue tab */}
          {tab === 0 && (
            <GlassCard className="p-6">
              <p className="text-xs text-brand-dim uppercase tracking-wider mb-4">Daily Revenue</p>
              <div className="flex items-end gap-1 h-48">
                {revenue.map((point) => (
                  <div
                    key={point.date}
                    className="flex-1 min-w-0 rounded-t-sm bg-brand-orange/30 hover:bg-brand-orange/70 transition-all relative group"
                    style={{ height: `${Math.max((point.revenue / maxRevenue) * 100, 2)}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-brand-card px-2 py-1 rounded text-xs font-mono text-brand-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {point.date}: ${point.revenue.toFixed(2)} · {point.order_count} orders
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-brand-dim font-mono mt-2">
                <span>{revenue[0]?.date?.slice(5) ?? ''}</span>
                <span>{revenue[revenue.length - 1]?.date?.slice(5) ?? ''}</span>
              </div>
            </GlassCard>
          )}

          {/* Peak Hours heatmap */}
          {tab === 1 && (
            <GlassCard className="p-6 overflow-auto">
              <p className="text-xs text-brand-dim uppercase tracking-wider mb-4">Order Density by Hour & Day</p>
              <div className="flex gap-2">
                <div className="flex flex-col gap-1 pt-6">
                  {DAYS.map((d) => (
                    <div key={d} className="h-6 flex items-center text-xs text-brand-dim w-8">{d}</div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-1 mb-1">
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="w-6 text-center text-xs text-brand-dim">{h % 6 === 0 ? h : ''}</div>
                    ))}
                  </div>
                  {DAYS.map((_, dayIdx) => (
                    <div key={dayIdx} className="flex gap-1 mb-1">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const count = heatmap[`${dayIdx}:${hour}`] ?? 0;
                        const opacity = count > 0 ? 0.1 + (count / maxPeak) * 0.9 : 0.05;
                        return (
                          <div
                            key={hour}
                            className="w-6 h-6 rounded-sm relative group transition-all"
                            style={{ backgroundColor: `rgba(255,92,0,${opacity})` }}
                          >
                            {count > 0 && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-brand-card px-2 py-1 rounded text-xs font-mono text-brand-white opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                                {DAYS[dayIdx]} {hour}:00 — {count} orders
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
          )}

          {/* Top Items */}
          {tab === 2 && (
            <GlassCard className="p-6">
              <p className="text-xs text-brand-dim uppercase tracking-wider mb-4">Best-Selling Items</p>
              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div key={item.item_name}>
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="text-xs text-brand-dim mr-2">#{i + 1}</span>
                        <span className="text-sm text-brand-white font-semibold">{item.item_name}</span>
                        <span className="text-xs text-brand-dim ml-2">— {item.vendor_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-brand-yellow text-sm">${item.revenue.toFixed(0)}</span>
                        <span className="text-brand-dim text-xs ml-2">{item.count}×</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-brand-steel rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / maxItems) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.03 }}
                        className="h-full bg-brand-orange rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* By Cuisine */}
          {tab === 3 && (
            <GlassCard className="p-6">
              <p className="text-xs text-brand-dim uppercase tracking-wider mb-4">Revenue by Cuisine</p>
              <div className="space-y-3">
                {cuisine.map((c) => {
                  const pct = totalCuisineRevenue > 0 ? (c.revenue / totalCuisineRevenue) * 100 : 0;
                  return (
                    <div key={c.cuisine_type}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-brand-white">{c.cuisine_type}</span>
                        <div className="text-right">
                          <span className="font-mono text-brand-yellow text-sm">${c.revenue.toFixed(0)}</span>
                          <span className="text-brand-dim text-xs ml-2">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-brand-steel rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-brand-yellow/70 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Prep Times */}
          {tab === 4 && (
            <GlassCard className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-black/6">
                  <tr className="text-brand-dim text-xs uppercase tracking-wider">
                    {['Vendor', 'Avg', 'P50', 'P90', 'Samples'].map((h) => (
                      <th key={h} className="text-left px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {prepTimes.map((v) => (
                    <tr key={v.vendor_id} className="hover:bg-black/2 transition-colors">
                      <td className="px-5 py-3 text-brand-white font-semibold">{v.vendor_name}</td>
                      <td className="px-5 py-3 font-mono text-brand-orange">{v.avg_prep_time}m</td>
                      <td className="px-5 py-3 font-mono text-brand-chrome">{v.p50}m</td>
                      <td className="px-5 py-3 font-mono text-brand-chrome">{v.p90}m</td>
                      <td className="px-5 py-3 text-brand-dim">{v.sample_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
