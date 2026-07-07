'use client';
import { useEffect, useRef, useState } from 'react';
import { apiFetch, apiPatch, apiPut } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/store/uiStore';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import Spinner from '@/components/ui/Spinner';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type Day = typeof DAYS[number];
const DAY_LABELS: Record<Day, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

interface DayHours { open: string; close: string; closed: boolean }
type OperatingHours = Record<Day, DayHours>;

const DEFAULT_HOURS: OperatingHours = Object.fromEntries(
  DAYS.map((d) => [d, { open: '09:00', close: '22:00', closed: false }])
) as OperatingHours;

interface VendorSettings {
  id: string;
  name: string;
  description: string | null;
  cuisine_type: string;
  avg_prep_time_minutes: number;
  is_accepting_orders: boolean;
  operating_hours: OperatingHours | null;
  logo_url: string | null;
  booth_color: string;
}

export default function SettingsPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [settings, setSettings] = useState<VendorSettings | null>(null);
  const [hours, setHours] = useState<OperatingHours>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<VendorSettings>('/vendor/settings')
      .then((data) => {
        setSettings(data);
        if (data.operating_hours) setHours(data.operating_hours);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function setDay(day: Day, patch: Partial<DayHours>) {
    setHours((h) => ({ ...h, [day]: { ...h[day], ...patch } }));
  }

  async function uploadLogo(file: File) {
    if (!settings) return;
    setLogoUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `vendor-logos/${settings.id}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('menu-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(path);
      const logoUrl = urlData.publicUrl;
      await apiPut('/vendor/settings', { logo_url: logoUrl });
      setSettings((s) => s ? { ...s, logo_url: logoUrl } : s);
      addToast({ message: 'Logo updated', type: 'success' });
    } catch {
      addToast({ message: 'Logo upload failed', type: 'error' });
    } finally {
      setLogoUploading(false);
    }
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      await apiPut('/vendor/settings', {
        name: settings.name,
        cuisine_type: settings.cuisine_type,
        avg_prep_time_minutes: settings.avg_prep_time_minutes,
        operating_hours: hours,
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
            className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Description</label>
          <textarea
            value={settings.description ?? ''}
            onChange={(e) => setSettings({ ...settings, description: e.target.value })}
            rows={2}
            className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Cuisine Type</label>
            <input
              value={settings.cuisine_type}
              onChange={(e) => setSettings({ ...settings, cuisine_type: e.target.value })}
              className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Avg Prep (min)</label>
            <input
              type="number"
              value={settings.avg_prep_time_minutes}
              onChange={(e) => setSettings({ ...settings, avg_prep_time_minutes: parseInt(e.target.value) })}
              className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
            />
          </div>
        </div>

        <Button onClick={save} loading={saving} size="lg" className="w-full font-heading tracking-widest">
          SAVE SETTINGS
        </Button>
      </GlassCard>

      <GlassCard className="space-y-4">
        <h2 className="font-heading text-xl text-brand-white tracking-wide">Booth Logo</h2>
        <div className="flex items-center gap-4">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-black/10" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-brand-bg border border-black/10 flex items-center justify-center text-brand-dim text-2xl">🏪</div>
          )}
          <div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLogo(file);
              }}
            />
            <Button
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              loading={logoUploading}
            >
              {logoUploading ? 'Uploading…' : settings.logo_url ? 'Change Logo' : 'Upload Logo'}
            </Button>
            <p className="text-xs text-brand-dim mt-1">PNG, JPG up to 2MB</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="space-y-4">
        <h2 className="font-heading text-xl text-brand-white tracking-wide">Operating Hours</h2>
        <div className="space-y-2">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-3">
              <span className="w-10 text-xs font-semibold text-brand-chrome uppercase">{DAY_LABELS[day]}</span>
              <button
                onClick={() => setDay(day, { closed: !hours[day].closed })}
                className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${hours[day].closed ? 'bg-brand-steel' : 'bg-green-500'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${hours[day].closed ? 'left-0.5' : 'left-5'}`} />
              </button>
              {hours[day].closed ? (
                <span className="text-xs text-brand-dim">Closed</span>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={hours[day].open}
                    onChange={(e) => setDay(day, { open: e.target.value })}
                    className="bg-brand-bg border border-black/10 rounded-lg px-2 py-1 text-xs text-brand-white focus:outline-none focus:border-brand-orange/60"
                  />
                  <span className="text-brand-dim text-xs">–</span>
                  <input
                    type="time"
                    value={hours[day].close}
                    onChange={(e) => setDay(day, { close: e.target.value })}
                    className="bg-brand-bg border border-black/10 rounded-lg px-2 py-1 text-xs text-brand-white focus:outline-none focus:border-brand-orange/60"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <Button onClick={save} loading={saving} size="lg" className="w-full font-heading tracking-widest">
          SAVE HOURS
        </Button>
      </GlassCard>

      <NotificationPrefs />
      <StaffPinSection />
    </div>
  );
}

function NotificationPrefs() {
  const { isKDSMuted, toggleKDSMute, kdsVolume, setKDSVolume } = useUIStore();

  return (
    <GlassCard className="space-y-5">
      <h2 className="font-heading text-xl text-brand-white tracking-wide">Notification Preferences</h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-brand-chrome font-semibold">KDS Audio Alerts</p>
          <p className="text-xs text-brand-dim mt-0.5">Chime when new orders arrive in kitchen</p>
        </div>
        <button
          onClick={toggleKDSMute}
          className={`relative w-12 h-6 rounded-full transition-all ${!isKDSMuted ? 'bg-green-500' : 'bg-brand-steel'}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${!isKDSMuted ? 'left-7' : 'left-1'}`} />
        </button>
      </div>
      {!isKDSMuted && (
        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-2 uppercase tracking-wider">
            Volume: {Math.round(kdsVolume * 100)}%
          </label>
          <input
            type="range" min={0} max={1} step={0.1} value={kdsVolume}
            onChange={(e) => setKDSVolume(parseFloat(e.target.value))}
            className="w-full accent-brand-orange"
          />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-brand-chrome font-semibold">Browser Notifications</p>
          <p className="text-xs text-brand-dim mt-0.5">Desktop push when tab is in background</p>
        </div>
        <button
          onClick={async () => {
            if (typeof Notification !== 'undefined') {
              await Notification.requestPermission();
            }
          }}
          className="text-xs font-semibold text-brand-orange hover:text-orange-300 transition-colors px-3 py-1.5 rounded-lg border border-brand-orange/30 hover:border-brand-orange/60"
        >
          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' ? 'Enabled' : 'Enable'}
        </button>
      </div>
    </GlassCard>
  );
}

interface StaffPinEntry { id: string; label: string; role: string; is_active: boolean; created_at: string }

function StaffPinSection() {
  const addToast = useUIStore((s) => s.addToast);
  const [pins, setPins] = useState<StaffPinEntry[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newPin, setNewPin] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    try { setPins(await apiFetch<StaffPinEntry[]>('/vendor/staff-pins')); } catch {}
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!newLabel.trim() || !newPin.trim()) return;
    setAdding(true);
    try {
      await apiFetch('/vendor/staff-pins', { method: 'POST', body: JSON.stringify({ label: newLabel.trim(), pin: newPin.trim() }), headers: { 'Content-Type': 'application/json' } });
      setNewLabel(''); setNewPin('');
      addToast({ message: 'Staff PIN created', type: 'success' });
      load();
    } catch { addToast({ message: 'Failed to create PIN', type: 'error' }); }
    finally { setAdding(false); }
  }

  async function toggle(id: string, is_active: boolean) {
    try {
      await apiPatch(`/vendor/staff-pins/${id}/toggle`, { is_active });
      load();
    } catch {}
  }

  async function del(id: string) {
    if (!confirm('Delete this staff PIN?')) return;
    try { await apiFetch(`/vendor/staff-pins/${id}`, { method: 'DELETE' }); load(); } catch {}
  }

  return (
    <GlassCard className="space-y-4">
      <h2 className="font-heading text-xl text-brand-white tracking-wide">STAFF PINs</h2>
      <p className="text-xs text-brand-dim">Kitchen staff log in using a 4–6 digit PIN at the KDS screen.</p>
      <div className="space-y-2">
        {pins.map((p) => (
          <div key={p.id} className="flex items-center gap-3 py-2 border-b border-black/5">
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-white">{p.label}</p>
              <p className="text-xs text-brand-dim capitalize">{p.role.replace('vendor_', '')}</p>
            </div>
            <button
              onClick={() => toggle(p.id, !p.is_active)}
              className={`relative w-10 h-5 rounded-full transition-all ${p.is_active ? 'bg-green-500' : 'bg-brand-steel'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${p.is_active ? 'left-5' : 'left-0.5'}`} />
            </button>
            <button onClick={() => del(p.id)} className="text-red-400/60 hover:text-red-400 transition-colors text-xs">Delete</button>
          </div>
        ))}
        {pins.length === 0 && <p className="text-xs text-brand-dim py-2">No staff PINs yet.</p>}
      </div>
      <div className="flex gap-2 pt-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Name (e.g. Chef Rahim)"
          className="flex-1 bg-brand-bg border border-black/10 rounded-xl px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
        />
        <input
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
          placeholder="PIN"
          type="password"
          maxLength={6}
          className="w-24 bg-brand-bg border border-black/10 rounded-xl px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
        />
        <Button size="sm" onClick={add} loading={adding}>Add</Button>
      </div>
    </GlassCard>
  );
}
