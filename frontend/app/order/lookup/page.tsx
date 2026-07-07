'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

export default function OrderLookupPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLookup() {
    const num = parseInt(token.trim(), 10);
    if (!num || num < 1) {
      setError('Enter a valid token number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
      const res = await fetch(`${base}/orders/by-token/${num}`);
      if (!res.ok) { setError('Order not found'); setLoading(false); return; }
      const data = await res.json() as { id: string };
      router.push(`/order/track/${data.id}`);
    } catch {
      setError('Could not look up order');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="w-full max-w-sm p-8 space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-3xl text-brand-white tracking-widest mb-1">FIND ORDER</h1>
          <p className="text-sm text-brand-dim">Enter your token number to track your order</p>
        </div>

        <div>
          <input
            type="number"
            value={token}
            onChange={(e) => { setToken(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            placeholder="Token #"
            autoFocus
            className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-3 text-2xl font-mono text-brand-orange text-center focus:outline-none focus:border-brand-orange/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {error && <p className="text-xs text-red-400 mt-1.5 text-center">{error}</p>}
        </div>

        <Button onClick={handleLookup} size="lg" loading={loading} className="w-full font-heading tracking-widest" disabled={!token.trim()}>
          TRACK ORDER
        </Button>
      </GlassCard>
    </div>
  );
}
