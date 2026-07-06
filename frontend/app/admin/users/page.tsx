'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch, apiPost, apiPut } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  vendor_id: string | null;
  created_at: string;
  vendor?: { name: string; booth_number: number } | null;
}

const ROLES = ['super_admin', 'admin', 'vendor_owner', 'vendor_kitchen', 'vendor_cashier', 'waiter'];

const ROLE_COLOR: Record<string, string> = {
  super_admin: '#EF4444',
  admin: '#F59E0B',
  vendor_owner: '#8B5CF6',
  vendor_kitchen: '#3B82F6',
  vendor_cashier: '#10B981',
  waiter: '#6B7280',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (roleFilter) qs.set('role', roleFilter);
      const data = await apiFetch<{ users: User[]; total: number; pages: number }>(`/admin/users?${qs}`);
      setUsers(data.users);
      setTotal(data.total);
    } catch {}
    setLoading(false);
  }, [page, roleFilter]);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(user: User) {
    try {
      await apiPut(`/admin/users/${user.id}`, { is_active: !user.is_active });
      addToast({ message: `User ${user.is_active ? 'deactivated' : 'activated'}`, type: 'success' });
      load();
    } catch {
      addToast({ message: 'Failed to update user', type: 'error' });
    }
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-4xl text-brand-white tracking-widest">USERS</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ Add User</Button>
      </div>

      {/* Role filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['', ...ROLES].map((r) => (
          <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${roleFilter === r ? 'bg-brand-orange text-white' : 'bg-brand-card text-brand-dim hover:text-brand-white'}`}>
            {r || 'All'}
          </button>
        ))}
      </div>

      <GlassCard>
        {loading ? <div className="flex justify-center py-10"><Spinner size="md" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-brand-dim text-xs uppercase tracking-wider border-b border-white/6">
                  <th className="text-left py-3 pr-4">Name</th>
                  <th className="text-left py-3 pr-4">Email</th>
                  <th className="text-left py-3 pr-4">Role</th>
                  <th className="text-left py-3 pr-4">Vendor</th>
                  <th className="text-left py-3 pr-4">Status</th>
                  <th className="text-right py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3 pr-4 text-brand-white font-semibold">{u.full_name}</td>
                    <td className="py-3 pr-4 text-brand-dim font-mono text-xs">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                        style={{ color: ROLE_COLOR[u.role] ?? '#888', backgroundColor: `${ROLE_COLOR[u.role] ?? '#888'}22` }}>
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-brand-dim text-xs">{u.vendor?.name ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditUser(u)} className="text-xs text-brand-orange hover:underline">Edit</button>
                        <button onClick={() => toggleActive(u)} className={`text-xs ${u.is_active ? 'text-red-400 hover:underline' : 'text-green-400 hover:underline'}`}>
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-white/6 mt-2 px-2">
          <p className="text-xs text-brand-dim">{total} users total</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 text-xs bg-brand-card rounded-lg disabled:opacity-40 hover:bg-white/5">Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={users.length < 20} className="px-3 py-1 text-xs bg-brand-card rounded-lg disabled:opacity-40 hover:bg-white/5">Next</button>
          </div>
        </div>
      </GlassCard>

      <UserFormModal isOpen={createOpen || !!editUser} user={editUser} onClose={() => { setCreateOpen(false); setEditUser(null); }} onSaved={() => { setCreateOpen(false); setEditUser(null); load(); }} />
    </div>
  );
}

function UserFormModal({ isOpen, user, onClose, onSaved }: { isOpen: boolean; user: User | null; onClose: () => void; onSaved: () => void }) {
  const addToast = useUIStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'waiter' });

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name, email: user.email, password: '', role: user.role });
    else setForm({ full_name: '', email: '', password: '', role: 'waiter' });
  }, [user, isOpen]);

  async function handleSave() {
    setSaving(true);
    try {
      if (user) {
        await apiPut(`/admin/users/${user.id}`, { full_name: form.full_name, role: form.role });
      } else {
        if (!form.password) { addToast({ message: 'Password required', type: 'error' }); setSaving(false); return; }
        await apiPost('/admin/users', form);
      }
      addToast({ message: `User ${user ? 'updated' : 'created'}`, type: 'success' });
      onSaved();
    } catch {
      addToast({ message: 'Failed to save user', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'New User'} size="md">
      <div className="p-5 space-y-4">
        {[
          { label: 'Full Name', key: 'full_name', type: 'text' },
          ...(!user ? [{ label: 'Email', key: 'email', type: 'email' }, { label: 'Password', key: 'password', type: 'password' }] : []),
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">{label}</label>
            <input type={type} value={form[key as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
          </div>
        ))}
        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Role</label>
          <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60">
            {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <Button onClick={handleSave} loading={saving} size="lg" className="w-full font-heading tracking-widest">
          {user ? 'SAVE CHANGES' : 'CREATE USER'}
        </Button>
      </div>
    </Modal>
  );
}
