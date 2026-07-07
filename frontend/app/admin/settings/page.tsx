'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useUIStore, type FontChoice } from '@/store/uiStore';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface SystemSettings {
  id?: string;
  name: string;
  tagline?: string;
  tax_rate: number;
  logo_url?: string;
  address?: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', tagline: '', tax_rate: '8.25', address: '' });
  const addToast = useUIStore((s) => s.addToast);
  const font = useUIStore((s) => s.font);
  const setFont = useUIStore((s) => s.setFont);

  useEffect(() => {
    apiFetch<SystemSettings>('/admin/settings')
      .then((s) => {
        setSettings(s);
        setForm({ name: s.name, tagline: s.tagline ?? '', tax_rate: ((s.tax_rate ?? 0.0825) * 100).toFixed(2), address: s.address ?? '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth-storage') ?? '{}')?.state?.token ?? '' : ''}`,
        },
        body: JSON.stringify({ food_village_name: form.name, tax_rate: parseFloat(form.tax_rate) / 100 }),
      });
      if (!res.ok) throw new Error();
      addToast({ message: 'Settings saved', type: 'success' });
    } catch {
      addToast({ message: 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-heading text-4xl text-brand-white tracking-widest mb-6">SETTINGS</h1>

      <GlassCard className="p-6 space-y-5">
        <h2 className="font-heading text-xl text-brand-white tracking-wide">Food Village Config</h2>

        {[
          { label: 'Food Village Name', key: 'name', type: 'text', placeholder: 'Food Village' },
          { label: 'Tagline', key: 'tagline', type: 'text', placeholder: 'Your food court tagline' },
          { label: 'Address', key: 'address', type: 'text', placeholder: '123 Main St...' },
          { label: 'Tax Rate (%)', key: 'tax_rate', type: 'number', placeholder: '8.25' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">{label}</label>
            <input type={type} value={form[key as keyof typeof form]} placeholder={placeholder}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
          </div>
        ))}

        {settings && (
          <div className="bg-brand-steel rounded-xl p-4 text-sm space-y-1">
            <p className="text-brand-dim text-xs uppercase tracking-wider mb-2">Current Values</p>
            <p className="text-brand-chrome">Name: <span className="text-brand-white">{settings.name}</span></p>
            <p className="text-brand-chrome">Tax Rate: <span className="text-brand-white">{((settings.tax_rate ?? 0.0825) * 100).toFixed(2)}%</span></p>
          </div>
        )}

        <Button onClick={handleSave} loading={saving} size="lg" className="w-full font-heading tracking-widest">
          SAVE SETTINGS
        </Button>
      </GlassCard>

      <GlassCard className="p-6 space-y-4 mt-6">
        <h2 className="font-heading text-xl text-brand-white tracking-wide">Appearance</h2>
        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-2 uppercase tracking-wider">Font</label>
          <div className="flex gap-2">
            {(['poppins', 'inter', 'manrope'] as FontChoice[]).map((f) => (
              <button
                key={f}
                onClick={() => setFont(f)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors capitalize ${
                  font === f
                    ? 'bg-brand-orange text-white border-brand-orange'
                    : 'bg-white text-brand-chrome border-brand-border hover:bg-brand-steel'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
