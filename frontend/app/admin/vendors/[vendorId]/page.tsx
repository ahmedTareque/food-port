'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, apiPost, apiDelete } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';

interface VendorDetail {
  id: string;
  name: string;
  cuisine_type: string;
  booth_number: number;
  booth_color: string;
  status: string;
  is_accepting_orders: boolean;
  categories: { id: string; name: string; items: { id: string; name: string; price: number; is_available: boolean }[] }[];
  users: { id: string; full_name: string; email: string; role: string; is_active: boolean }[];
  staffPins: { id: string; label: string; role: string; is_active: boolean }[];
  stats: { orders_today: number; total_orders: number; total_revenue: number };
}

const STAFF_ROLES = ['vendor_owner', 'vendor_kitchen', 'vendor_cashier'];

export default function AdminVendorDetailPage() {
  const params = useParams<{ vendorId: string }>();
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', role: 'vendor_kitchen', pin: '' });
  const [savingStaff, setSavingStaff] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<VendorDetail>(`/admin/vendors/${params.vendorId}/detail`);
      setVendor(data);
    } catch { router.push('/admin/vendors'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [params.vendorId]);

  async function handleAddStaff() {
    setSavingStaff(true);
    try {
      await apiPost(`/admin/vendors/${params.vendorId}/staff`, staffForm);
      addToast({ message: 'Staff member added', type: 'success' });
      setAddStaffOpen(false);
      setStaffForm({ name: '', email: '', role: 'vendor_kitchen', pin: '' });
      load();
    } catch {
      addToast({ message: 'Failed to add staff', type: 'error' });
    } finally {
      setSavingStaff(false);
    }
  }

  async function handleRemoveStaff(userId: string) {
    try {
      await apiDelete(`/admin/vendors/${params.vendorId}/staff/${userId}`);
      addToast({ message: 'Staff removed', type: 'success' });
      load();
    } catch {
      addToast({ message: 'Failed to remove staff', type: 'error' });
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!vendor) return null;

  const totalItems = vendor.categories.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/admin/vendors" className="text-brand-dim hover:text-brand-white text-sm">← Vendors</Link>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: vendor.booth_color }} />
            <h1 className="font-heading text-4xl text-brand-white tracking-widest">{vendor.name}</h1>
          </div>
          <p className="text-brand-dim text-sm">{vendor.cuisine_type} · Booth #{vendor.booth_number}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${vendor.status === 'online' ? 'text-green-400 bg-green-400/10' : vendor.status === 'suspended' ? 'text-red-400 bg-red-400/10' : 'text-gray-400 bg-gray-400/10'}`}>
          {vendor.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Orders Today', value: vendor.stats.orders_today },
          { label: 'Total Orders', value: vendor.stats.total_orders },
          { label: 'Total Revenue', value: `$${vendor.stats.total_revenue.toFixed(2)}`, yellow: true },
        ].map((s) => (
          <GlassCard key={s.label}>
            <p className="text-xs text-brand-dim uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-bold font-mono ${s.yellow ? 'text-brand-yellow' : 'text-brand-white'}`}>{s.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Staff */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl text-brand-white tracking-wide">STAFF ({vendor.users.length})</h2>
          <Button size="sm" onClick={() => setAddStaffOpen(true)}>+ Add Staff</Button>
        </div>
        <div className="space-y-2">
          {vendor.users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3 glass rounded-xl">
              <div>
                <p className="text-sm text-brand-white font-semibold">{u.full_name}</p>
                <p className="text-xs text-brand-dim font-mono">{u.email} · {u.role.replace(/_/g, ' ')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {u.is_active ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => handleRemoveStaff(u.id)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Remove</button>
              </div>
            </div>
          ))}
          {vendor.staffPins.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 glass rounded-xl opacity-60">
              <div>
                <p className="text-sm text-brand-white">{p.label} <span className="text-xs text-brand-dim">(PIN)</span></p>
                <p className="text-xs text-brand-dim">{p.role.replace(/_/g, ' ')}</p>
              </div>
            </div>
          ))}
          {vendor.users.length === 0 && vendor.staffPins.length === 0 && (
            <p className="text-brand-dim text-sm text-center py-4">No staff</p>
          )}
        </div>
      </GlassCard>

      {/* Menu */}
      <GlassCard>
        <h2 className="font-heading text-xl text-brand-white tracking-wide mb-4">MENU ({vendor.categories.length} categories · {totalItems} items)</h2>
        <div className="space-y-4">
          {vendor.categories.map((cat) => (
            <div key={cat.id}>
              <p className="text-xs text-brand-dim uppercase tracking-wider mb-2 font-semibold">{cat.name}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {cat.items.slice(0, 6).map((item) => (
                  <div key={item.id} className={`px-3 py-2 glass rounded-lg text-xs ${!item.is_available ? 'opacity-40' : ''}`}>
                    <p className="text-brand-white truncate">{item.name}</p>
                    <p className="text-brand-yellow font-mono">${item.price.toFixed(2)}</p>
                  </div>
                ))}
                {cat.items.length > 6 && (
                  <div className="px-3 py-2 glass rounded-lg text-xs flex items-center justify-center text-brand-dim">
                    +{cat.items.length - 6} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Add Staff Modal */}
      <Modal isOpen={addStaffOpen} onClose={() => setAddStaffOpen(false)} title="Add Staff Member" size="md">
        <div className="p-5 space-y-4">
          {[
            { label: 'Full Name', key: 'name', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'Temporary Password / PIN', key: 'pin', type: 'password' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">{label}</label>
              <input type={type} value={staffForm[key as keyof typeof staffForm]}
                onChange={(e) => setStaffForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Role</label>
            <select value={staffForm.role} onChange={(e) => setStaffForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full bg-brand-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60">
              {STAFF_ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <Button onClick={handleAddStaff} loading={savingStaff} size="lg" className="w-full font-heading tracking-widest">ADD STAFF</Button>
        </div>
      </Modal>
    </div>
  );
}
