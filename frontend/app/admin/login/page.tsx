'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiPost } from '@/lib/api';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import Button from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiPost<{ access_token: string; user: { id: string; email: string; role: string; full_name: string } }>(
        '/auth/login',
        { email, password },
      );
      if (res.user.role !== 'super_admin' && res.user.role !== 'admin') {
        setError('Access denied — admin account required');
        return;
      }
      login(res.access_token, res.user);
      router.push('/admin/dashboard');
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
      <div className="absolute top-[-100px] right-[-60px] w-64 h-64 rounded-full bg-brand-orange/6 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-40px] w-48 h-48 rounded-full bg-brand-yellow/4 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <p className="font-mono text-xs text-brand-dim uppercase tracking-widest mb-2">Food Port</p>
          <h1 className="font-heading text-5xl text-brand-white tracking-widest">ADMIN</h1>
          <div className="w-8 h-0.5 bg-brand-orange mx-auto mt-3" />
        </div>

        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full font-heading tracking-widest mt-2">
              SIGN IN
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-brand-dim mt-6">
          Vendor login? <a href="/vendor/login" className="text-brand-orange hover:underline">Go here</a>
        </p>
      </motion.div>
    </div>
  );
}
