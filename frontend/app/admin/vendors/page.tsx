'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import type { AdminVendor } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';

const BOOTH_COLORS = ['#E63946','#457B9D','#F4A261','#E9C46A','#2A9D8F','#E76F51','#264653','#6A994E','#9B5DE5','#CB4335'];

interface StaffData {
  users: { id: string; full_name: string; email: string; role: string; is_active: boolean }[];
  pins: { id: string; label: string; role: string; is_active: boolean }[];
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<AdminVendor | null>(null);
  const [staffVendor, setStaffVendor] = useState<AdminVendor | null>(null);
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const data = await apiFetch<AdminVendor[]>(`/admin/vendors${params}`);
      setVendors(data);
    } catch {}
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function loadStaff(vendor: AdminVendor) {
    setStaffVendor(vendor);
    try {
      const data = await apiFetch<StaffData>(`/admin/vendors/${vendor.id}/staff`);
      setStaffData(data);
    } catch {
      setStaffData(null);
    }
  }

  async function removeStaff(vendorId: string, userId: string) {
    try {
      await apiDelete(`/admin/vendors/${vendorId}/staff/${userId}`);
      addToast({ message: 'Staff removed', type: 'success' });
      if (staffVendor) loadStaff(staffVendor);
    } catch {
      addToast({ message: 'Failed to remove staff', type: 'error' });
    }
  }

  async function suspendVendor(vendor: AdminVendor) {
    const nextStatus = vendor.status === 'suspended' ? 'online' : 'suspended';
    try {
      await apiPatch(`/admin/vendors/${vendor.id}/status`, { status: nextStatus });
      addToast({ message: `Vendor ${nextStatus}`, type: 'success' });
      load();
    } catch {
      addToast({ message: 'Failed to update status', type: 'error' });
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full py-20"><Spinner size="lg" /></div>;

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-4xl text-brand-white tracking-widest">VENDORS</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ Add Vendor</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {['', 'online', 'offline', 'suspended'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${statusFilter === s ? 'bg-brand-orange text-white' : 'bg-brand-card text-brand-dim hover:text-brand-white'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Vendor grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map((vendor) => (
          <GlassCard key={vendor.id} className="overflow-hidden">
            <div className="h-1" style={{ backgroundColor: vendor.booth_color }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-heading text-xl text-brand-white tracking-wide">{vendor.name}</p>
                  <p className="text-xs text-brand-dim mt-0.5">{vendor.cuisine_type} · Booth #{vendor.booth_number}</p>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                  style={{
                    backgroundColor: vendor.status === 'online' ? '#10B98122' : vendor.status === 'suspended' ? '#EF444422' : '#88888822',
                    color: vendor.status === 'online' ? '#10B981' : vendor.status === 'suspended' ? '#EF4444' : '#888888',
                  }}
                >
                  {vendor.status}
                </span>
              </div>

              <div className="flex gap-4 text-sm mb-4">
                <div>
                  <p className="text-xs text-brand-dim">Today Revenue</p>
                  <p className="font-mono text-brand-yellow">${vendor.revenue_today.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-dim">Orders</p>
                  <p className="font-mono text-brand-white">{vendor.order_count_today}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-dim">Staff</p>
                  <p className="font-mono text-brand-white">{vendor.staff_count}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/admin/vendors/${vendor.id}`} className="flex-1">
                  <Button size="sm" variant="secondary" className="w-full">Detail</Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={() => setEditVendor(vendor)}>Edit</Button>
                <Button size="sm" variant="secondary" onClick={() => loadStaff(vendor)}>Staff</Button>
                <Button
                  size="sm"
                  variant={vendor.status === 'suspended' ? 'secondary' : 'danger'}
                  onClick={() => suspendVendor(vendor)}
                >
                  {vendor.status === 'suspended' ? 'Restore' : 'Suspend'}
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Create/Edit modal */}
      <VendorFormModal
        isOpen={createOpen || !!editVendor}
        vendor={editVendor}
        colors={BOOTH_COLORS}
        onClose={() => { setCreateOpen(false); setEditVendor(null); }}
        onSaved={() => { setCreateOpen(false); setEditVendor(null); load(); }}
      />

      {/* Staff modal */}
      <Modal isOpen={!!staffVendor} onClose={() => { setStaffVendor(null); setStaffData(null); }} title={`Staff — ${staffVendor?.name}`} size="lg">
        <div className="p-5">
          {!staffData ? <Spinner size="md" /> : (
            <div className="space-y-2">
              {staffData.users.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-2.5 glass rounded-xl">
                  <div>
                    <p className="text-sm text-brand-white">{u.full_name}</p>
                    <p className="text-xs text-brand-dim font-mono">{u.email} · {u.role}</p>
                  </div>
                  <button
                    onClick={() => removeStaff(staffVendor!.id, u.id)}
                    className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {staffData.pins.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5 glass rounded-xl opacity-60">
                  <div>
                    <p className="text-sm text-brand-white">{p.label} (PIN)</p>
                    <p className="text-xs text-brand-dim font-mono">{p.role}</p>
                  </div>
                </div>
              ))}
              {staffData.users.length === 0 && staffData.pins.length === 0 && (
                <p className="text-brand-dim text-sm text-center py-4">No staff accounts</p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function VendorFormModal({ isOpen, vendor, colors, onClose, onSaved }: {
  isOpen: boolean;
  vendor: AdminVendor | null;
  colors: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const addToast = useUIStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', cuisine_type: '', booth_number: '', booth_color: colors[0], avg_prep_time_minutes: '10' });

  useEffect(() => {
    if (vendor) {
      setForm({ name: vendor.name, cuisine_type: vendor.cuisine_type, booth_number: String(vendor.booth_number), booth_color: vendor.booth_color, avg_prep_time_minutes: '10' });
    } else {
      setForm({ name: '', cuisine_type: '', booth_number: '', booth_color: colors[0], avg_prep_time_minutes: '10' });
    }
  }, [vendor, isOpen]);

  async function handleSave() {
    if (!form.name || !form.cuisine_type || !form.booth_number) {
      addToast({ message: 'Name, cuisine, and booth number are required', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, cuisine_type: form.cuisine_type, booth_number: parseInt(form.booth_number), booth_color: form.booth_color, avg_prep_time_minutes: parseInt(form.avg_prep_time_minutes) };
      if (vendor) {
        await apiPatch(`/admin/vendors/${vendor.id}`, payload);
      } else {
        await apiPost('/admin/vendors', payload);
      }
      addToast({ message: `Vendor ${vendor ? 'updated' : 'created'}`, type: 'success' });
      onSaved();
    } catch {
      addToast({ message: 'Failed to save vendor', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={vendor ? 'Edit Vendor' : 'New Vendor'} size="md">
      <div className="p-5 space-y-4">
        {[
          { label: 'Vendor Name', key: 'name', type: 'text' },
          { label: 'Cuisine Type', key: 'cuisine_type', type: 'text' },
          { label: 'Booth Number', key: 'booth_number', type: 'number' },
          { label: 'Avg Prep Time (min)', key: 'avg_prep_time_minutes', type: 'number' },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
            />
          </div>
        ))}

        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-2 uppercase tracking-wider">Booth Color</label>
          <div className="flex gap-2 flex-wrap">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setForm((f) => ({ ...f, booth_color: c }))}
                className={`w-8 h-8 rounded-lg transition-all border-2 ${form.booth_color === c ? 'border-brand-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <Button onClick={handleSave} loading={saving} size="lg" className="w-full font-heading tracking-widest">
          {vendor ? 'SAVE CHANGES' : 'CREATE VENDOR'}
        </Button>
      </div>
    </Modal>
  );
}
