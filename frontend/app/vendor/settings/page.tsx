'use client';
import { useEffect, useState } from 'react';
import { apiFetch, apiPut } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import Spinner from '@/components/ui/Spinner';

interface VendorSettings {
  id: string;
  name: string;
  description: string | null;
  cuisine_type: string;
  avg_prep_time: number;
  is_accepting_orders: boolean;
}

export default function SettingsPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [settings, setSettings] = useState<VendorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<VendorSettings>('/vendor/settings')
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      await apiPut('/vendor/settings', {
        name: settings.name,
        description: settings.description,
        cuisine_type: settings.cuisine_type,
        avg_prep_time: settings.avg_prep_time,
        is_accepting_orders: settings.is_accepting_orders,
      });
      addToast({ message: 'Settings saved', type: 'success' });
    } catch {
      addToast({ message: 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;
  if (!settings) return <div className="text-center py-20 text-brand-dim">Failed to load settings.</div>;

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="font-heading text-4xl text-brand-white tracking-widest">SETTINGS</h1>

      <GlassCard className="space-y-4">
        <h2 className="font-heading text-xl text-brand-white tracking-wide">Booth Info</h2>

        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Booth Name</label>
          <input
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Description</label>
          <textarea
            value={settings.description ?? ''}
            onChange={(e) => setSettings({ ...settings, description: e.target.value })}
            rows={2}
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Cuisine Type</label>
            <input
              value={settings.cuisine_type}
              onChange={(e) => setSettings({ ...settings, cuisine_type: e.target.value })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Avg Prep (min)</label>
            <input
              type="number"
              value={settings.avg_prep_time}
              onChange={(e) => setSettings({ ...settings, avg_prep_time: parseInt(e.target.value) })}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
            />
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="font-semibold text-brand-white text-sm">Accepting Orders</p>
            <p className="text-xs text-brand-dim">Toggle to open/close your booth</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, is_accepting_orders: !settings.is_accepting_orders })}
            className={`relative w-12 h-6 rounded-full transition-all ${
              settings.is_accepting_orders ? 'bg-green-500' : 'bg-brand-steel'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                settings.is_accepting_orders ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        <Button onClick={save} loading={saving} size="lg" className="w-full font-heading tracking-widest">
          SAVE SETTINGS
        </Button>
      </GlassCard>
    </div>
  );
}
