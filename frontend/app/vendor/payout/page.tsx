'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import GlassCard from '@/components/ui/GlassCard';
import Spinner from '@/components/ui/Spinner';

interface PayoutData {
  revenue_this_month: number;
  deductions_this_month: number;
  net_this_month: number;
  all_time_revenue: number;
  transactions: {
    id: string;
    type: string;
    month: string;
    amount: number | null;
    is_paid: boolean;
    due_date: string | null;
    paid_at: string | null;
    notes: string | null;
  }[];
}

const TYPE_LABELS: Record<string, string> = {
  rent: 'Rent', electricity: 'Electricity', water: 'Water', other: 'Other',
};

export default function PayoutPage() {
  const [data, setData] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PayoutData>('/vendor/payout/summary')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;
  if (!data) return <div className="text-center py-20 text-brand-dim">Failed to load payout data.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="font-heading text-4xl text-brand-white tracking-widest">PAYOUT SUMMARY</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Revenue This Month', value: `$${data.revenue_this_month.toFixed(2)}`, color: 'text-brand-orange' },
          { label: 'Deductions', value: `-$${data.deductions_this_month.toFixed(2)}`, color: 'text-red-400' },
          { label: 'Net This Month', value: `$${data.net_this_month.toFixed(2)}`, color: data.net_this_month >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'All-Time Revenue', value: `$${data.all_time_revenue.toFixed(2)}`, color: 'text-brand-chrome' },
        ].map((s) => (
          <GlassCard key={s.label}>
            <p className="text-xs text-brand-dim uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Transactions */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-black/6">
          <h2 className="font-heading text-xl text-brand-white tracking-wide">DEDUCTIONS HISTORY</h2>
        </div>
        {data.transactions.length === 0 ? (
          <p className="text-center py-8 text-brand-dim text-sm">No deductions recorded.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-brand-dim uppercase tracking-wider border-b border-black/6">
                <th className="px-4 py-3 text-left">Month</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {data.transactions.map((t) => (
                <tr key={t.id} className="hover:bg-black/2 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm text-brand-chrome">{t.month}</td>
                  <td className="px-4 py-3 text-sm text-brand-white capitalize">{TYPE_LABELS[t.type] ?? t.type}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-brand-orange">
                    {t.amount != null ? `$${t.amount.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${t.is_paid ? 'text-green-400 bg-green-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                      {t.is_paid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  );
}
