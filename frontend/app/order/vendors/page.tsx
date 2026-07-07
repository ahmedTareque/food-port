'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import type { Vendor } from '@/types';
import Spinner from '@/components/ui/Spinner';
import PageTransition from '@/components/ui/PageTransition';
import VendorCard from '@/components/ui/VendorCard';

const CUISINE_FILTERS = ['All', 'Fast Food', 'Asian', 'Mexican', 'Drinks', 'Desserts', 'Healthy'];

export default function VendorBrowsingPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch<Vendor[]>('/vendors?status=active')
      .then(setVendors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter((v) => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === 'All' ||
      v.cuisine_type.toLowerCase().includes(activeFilter.toLowerCase());
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="px-4 py-5 max-w-2xl mx-auto">
        {/* Search */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dim"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search booths..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-card border border-black/8 rounded-xl pl-9 pr-4 py-3 text-sm text-brand-white placeholder:text-brand-dim focus:outline-none focus:border-brand-orange/50 font-body"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
          {CUISINE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === f
                  ? 'bg-brand-orange text-white'
                  : 'bg-brand-card text-brand-dim border border-black/8 hover:text-brand-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <h2 className="font-heading text-3xl text-brand-white tracking-wide mb-4">
          {filtered.length} BOOTHS OPEN
        </h2>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {filtered.map((vendor, i) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <VendorCard
                variant={i % 2 === 0 ? 'photo' : 'white'}
                name={vendor.name}
                cuisine={vendor.cuisine_type}
                prepTimeMinutes={vendor.avg_prep_time_minutes}
                boothNumber={vendor.booth_number}
                isOpen={vendor.is_accepting_orders}
                orderLabel="Order now"
                onOrder={() => router.push(`/order/vendors/${vendor.id}/menu`)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
