'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import type { DisplayBoardVendor } from '@/types';

function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function DisplayBoardPage() {
  const [vendors, setVendors] = useState<DisplayBoardVendor[]>([]);
  const [offline, setOffline] = useState(false);
  const [vendorFilter, setVendorFilter] = useState<string | null>(null);
  const clock = useClock();

  async function fetchBoard() {
    try {
      const data = await apiFetch<DisplayBoardVendor[]>('/display/board');
      setVendors(data);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }

  useEffect(() => {
    fetchBoard();
    const interval = setInterval(fetchBoard, 10000);
    // Auto-reload every 6 hours to clear any memory leaks on TV screens
    const reload = setTimeout(() => window.location.reload(), 6 * 60 * 60 * 1000);
    return () => { clearInterval(interval); clearTimeout(reload); };
  }, []);

  const activeVendors = vendors.filter((v) => v.preparing.length > 0 || v.ready.length > 0);
  const displayVendors = vendorFilter ? activeVendors.filter((v) => v.vendor_id === vendorFilter) : activeVendors;
  const hasAny = activeVendors.length > 0;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col overflow-hidden">
      {/* Offline overlay */}
      {offline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-sm text-red-400">Updates paused — reconnecting…</span>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-10 py-5 border-b border-white/6">
        <h1 className="font-heading text-5xl text-brand-orange tracking-[0.2em]">
          FOOD VILLAGE
        </h1>
        <div className="text-right">
          <p className="font-mono text-4xl text-brand-white">{clock}</p>
          <p className="text-brand-dim text-xs mt-0.5 tracking-widest uppercase">
            {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Vendor filter chips */}
      {activeVendors.length > 1 && (
        <div className="flex gap-2 px-10 pt-4 pb-0 flex-wrap">
          <button
            onClick={() => setVendorFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${!vendorFilter ? 'bg-brand-orange text-white' : 'bg-white/5 text-brand-dim hover:text-brand-white'}`}
          >
            All
          </button>
          {activeVendors.map((v) => (
            <button
              key={v.vendor_id}
              onClick={() => setVendorFilter(v.vendor_id === vendorFilter ? null : v.vendor_id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all`}
              style={vendorFilter === v.vendor_id
                ? { backgroundColor: v.booth_color, color: '#fff' }
                : { backgroundColor: `${v.booth_color}22`, color: v.booth_color }}
            >
              {v.vendor_name}
            </button>
          ))}
        </div>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-0 px-10 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-kds-preparing" />
          <span className="font-heading text-xl tracking-widest text-kds-preparing">PREPARING</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-kds-ready animate-pulse" />
          <span className="font-heading text-xl tracking-widest text-kds-ready">READY TO COLLECT</span>
        </div>
      </div>

      {/* Vendor sections */}
      {!hasAny ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-7xl mb-6">🍽️</p>
            <p className="font-heading text-3xl text-brand-dim tracking-widest">
              NO ORDERS IN PROGRESS
            </p>
            <p className="text-brand-dim/60 text-sm mt-2 font-mono">
              Orders will appear here when placed
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-10 py-4 space-y-6">
          {displayVendors.map((vendor) => (
              <div key={vendor.vendor_id}>
                {/* Vendor header */}
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg mb-3"
                  style={{ backgroundColor: `${vendor.booth_color}22`, border: `1px solid ${vendor.booth_color}44` }}
                >
                  <span className="font-heading text-lg tracking-wide" style={{ color: vendor.booth_color }}>
                    {vendor.vendor_name.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Preparing tokens */}
                  <div className="flex flex-wrap gap-3">
                    <AnimatePresence>
                      {vendor.preparing.map((token) => (
                        <motion.div
                          key={token}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="glass rounded-2xl px-5 py-3 border border-kds-preparing/20"
                        >
                          <p className="font-heading text-5xl text-brand-white leading-none">
                            #{String(token).padStart(3, '0')}
                          </p>
                        </motion.div>
                      ))}
                      {vendor.preparing.length === 0 && (
                        <p className="text-brand-dim/40 text-sm font-mono">—</p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Ready tokens */}
                  <div className="flex flex-wrap gap-3">
                    <AnimatePresence>
                      {vendor.ready.map((token) => (
                        <motion.div
                          key={token}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="rounded-2xl px-5 py-3 border border-kds-ready/40 bg-kds-ready/10"
                        >
                          <p className="font-heading text-5xl text-kds-ready leading-none">
                            #{String(token).padStart(3, '0')}
                          </p>
                        </motion.div>
                      ))}
                      {vendor.ready.length === 0 && (
                        <p className="text-brand-dim/40 text-sm font-mono">—</p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Footer ticker */}
      <div className="border-t border-white/6 py-3 overflow-hidden">
        <motion.p
          animate={{ x: [1200, -1200] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="font-mono text-sm text-brand-dim whitespace-nowrap"
        >
          🔔 &nbsp; Please listen for your token number to be called &nbsp; · &nbsp;
          Collect your order from the respective booth &nbsp; · &nbsp;
          Thank you for dining with us at Food Village! &nbsp; 🍽️
        </motion.p>
      </div>
    </div>
  );
}
