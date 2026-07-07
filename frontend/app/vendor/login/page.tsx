'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiPost } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

type Tab = 'email' | 'pin';

const PIN_PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '↵'];

interface AuthResponse {
  access_token: string;
  user: { id: string; email: string; role: string; vendor_id: string | null };
}

interface PinAuthResponse {
  access_token: string;
  staff: { pin_id: string; vendor_id: string; vendor_name: string; role: string; label: string };
}

export default function VendorLoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const addToast = useUIStore((s) => s.addToast);
  const [tab, setTab] = useState<Tab>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // PIN form state
  const [vendorId, setVendorId] = useState('');
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    try {
      const res = await apiPost<AuthResponse>('/auth/login', { email, password });
      login(res.access_token, res.user);
      router.replace('/vendor/kitchen');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      addToast({ message: msg, type: 'error' });
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePinLogin() {
    if (pin.length !== 4 || !vendorId) return;
    setPinLoading(true);
    try {
      const res = await apiPost<PinAuthResponse>('/auth/pin-login', {
        vendor_id: vendorId,
        pin,
      });
      login(res.access_token, {
        id: res.staff.pin_id,
        email: `${res.staff.label} @ ${res.staff.vendor_name}`,
        role: res.staff.role,
        vendor_id: res.staff.vendor_id,
      });
      router.replace('/vendor/kitchen');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid PIN';
      addToast({ message: msg, type: 'error' });
      setPin('');
    } finally {
      setPinLoading(false);
    }
  }

  function handlePinKey(key: string) {
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
    } else if (key === '↵') {
      handlePinLogin();
    } else if (pin.length < 4) {
      setPin((p) => p + key);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-brand-bg">
      {/* Decoration */}
      <div className="absolute top-[-100px] right-[-80px] w-72 h-72 rounded-full bg-brand-orange/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-60px] w-60 h-60 rounded-full bg-brand-yellow/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-heading text-5xl text-brand-orange tracking-widest">FOOD VILLAGE</h1>
          <p className="text-brand-dim text-sm mt-1 font-body">Vendor Portal</p>
        </div>

        <GlassCard>
          {/* Tabs */}
          <div className="flex gap-1 bg-brand-bg/60 rounded-xl p-1 mb-6">
            {(['email', 'pin'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  tab === t
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'text-brand-dim hover:text-brand-white'
                }`}
              >
                {t === 'pin' ? 'PIN Login' : 'Email Login'}
              </button>
            ))}
          </div>

          {tab === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vendor@example.com"
                  className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-3 text-sm text-brand-white placeholder:text-brand-dim focus:outline-none focus:border-brand-orange/60"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-3 text-sm text-brand-white placeholder:text-brand-dim focus:outline-none focus:border-brand-orange/60"
                />
              </div>
              <Button
                type="submit"
                loading={emailLoading}
                size="lg"
                className="w-full font-heading tracking-widest mt-2"
              >
                LOGIN
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">
                  Vendor ID
                </label>
                <input
                  type="text"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  placeholder="Enter your vendor ID"
                  className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-3 text-sm text-brand-white placeholder:text-brand-dim focus:outline-none focus:border-brand-orange/60"
                />
              </div>

              {/* PIN dots */}
              <div className="flex justify-center gap-4 py-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      i < pin.length
                        ? 'bg-brand-orange border-brand-orange'
                        : 'border-brand-dim'
                    }`}
                  />
                ))}
              </div>

              {/* PIN pad */}
              <div className="grid grid-cols-3 gap-2">
                {PIN_PAD.map((key) => (
                  <button
                    key={key}
                    onClick={() => handlePinKey(key)}
                    disabled={pinLoading}
                    className={`py-4 rounded-xl text-lg font-mono font-semibold transition-all active:scale-95 ${
                      key === '↵'
                        ? 'bg-brand-orange text-white'
                        : key === '⌫'
                        ? 'bg-brand-steel text-brand-chrome'
                        : 'bg-brand-bg border border-black/8 text-brand-white hover:bg-brand-steel'
                    } disabled:opacity-50`}
                  >
                    {pinLoading && key === '↵' ? '...' : key}
                  </button>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
