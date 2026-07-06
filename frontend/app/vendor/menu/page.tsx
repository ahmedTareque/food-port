'use client';
import { useEffect, useState, useRef } from 'react';
import { apiFetch, apiPatch, apiPost, apiDelete } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/store/uiStore';
import type { MenuCategory, MenuItem, ModifierGroup, Modifier } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';
import Spinner from '@/components/ui/Spinner';

interface VendorMenuData {
  vendor: { id: string; name: string; booth_color: string };
  categories: MenuCategory[];
}

export default function MenuManagementPage() {
  const [data, setData] = useState<VendorMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [modifierItem, setModifierItem] = useState<MenuItem | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  async function load() {
    try {
      const d = await apiFetch<VendorMenuData>('/vendor/menu');
      setData(d);
      if (!activeCategory && d.categories[0]) setActiveCategory(d.categories[0].id);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleAvailability(itemId: string, current: boolean) {
    try {
      await apiPatch(`/vendor/menu-items/${itemId}/availability`, { is_available: !current });
      addToast({ message: `Item ${!current ? 'enabled' : 'disabled'}`, type: 'success' });
      load();
    } catch {
      addToast({ message: 'Failed to update', type: 'error' });
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Delete this item?')) return;
    try {
      await apiDelete(`/vendor/menu-items/${itemId}`);
      addToast({ message: 'Item deleted', type: 'success' });
      load();
    } catch {
      addToast({ message: 'Failed to delete', type: 'error' });
    }
  }

  async function createCategory() {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      await apiPost('/vendor/categories', { name: newCatName.trim(), sort_order: (data?.categories.length ?? 0) + 1 });
      setNewCatName('');
      addToast({ message: 'Category created', type: 'success' });
      load();
    } catch {
      addToast({ message: 'Failed to create category', type: 'error' });
    } finally {
      setAddingCat(false);
    }
  }

  async function deleteCat(catId: string, catName: string) {
    if (!confirm(`Delete category "${catName}"? Only possible if it has no items.`)) return;
    try {
      await apiDelete(`/vendor/categories/${catId}`);
      if (activeCategory === catId) setActiveCategory(data?.categories.find((c) => c.id !== catId)?.id ?? null);
      addToast({ message: 'Category deleted', type: 'success' });
      load();
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? 'Failed to delete';
      addToast({ message: msg, type: 'error' });
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;
  if (!data) return <div className="text-center py-20 text-brand-dim">Failed to load menu.</div>;

  const activeCat = data.categories.find((c) => c.id === activeCategory);
  const filteredItems = (activeCat?.menu_items ?? []).filter((item) =>
    !menuSearch || item.name.toLowerCase().includes(menuSearch.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Category sidebar */}
      <aside className="w-52 border-r border-white/6 flex flex-col pt-6 shrink-0">
        <div className="px-4 pb-3">
          <p className="text-xs text-brand-dim uppercase tracking-wider">Categories</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {data.categories.map((cat) => (
            <div
              key={cat.id}
              className={`group flex items-center border-r-2 transition-all ${
                activeCategory === cat.id
                  ? 'border-brand-orange bg-brand-orange/5'
                  : 'border-transparent'
              }`}
            >
              <button
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-1 px-4 py-2.5 text-left text-sm font-semibold transition-all ${
                  activeCategory === cat.id ? 'text-brand-white' : 'text-brand-dim hover:text-brand-white'
                }`}
              >
                {cat.name}
              </button>
              <button
                onClick={() => deleteCat(cat.id, cat.name)}
                className="opacity-0 group-hover:opacity-100 pr-3 text-red-400/60 hover:text-red-400 transition-all text-xs"
                title="Delete category"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {/* Add category */}
        <div className="border-t border-white/6 p-3 space-y-2">
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createCategory()}
            placeholder="New category…"
            className="w-full bg-brand-bg border border-white/10 rounded-lg px-3 py-1.5 text-xs text-brand-white focus:outline-none focus:border-brand-orange/60"
          />
          <button
            onClick={createCategory}
            disabled={addingCat || !newCatName.trim()}
            className="w-full text-xs font-semibold text-brand-orange hover:text-orange-300 disabled:opacity-40 transition-colors py-1"
          >
            + Add Category
          </button>
        </div>
      </aside>

      {/* Items list */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <h1 className="font-heading text-3xl text-brand-white tracking-wide">
              {activeCat?.name.toUpperCase() ?? 'MENU'}
            </h1>
            <div className="flex items-center gap-2">
              <input
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Search items…"
                className="bg-brand-bg border border-white/10 rounded-lg px-3 py-1.5 text-xs text-brand-white focus:outline-none focus:border-brand-orange/60 w-36"
              />
              {activeCategory && (
                <>
                  <button
                    onClick={async () => {
                      if (!confirm('Mark ALL items in this category as sold out (86)?')) return;
                      try {
                        await apiPatch(`/vendor/categories/${activeCategory}/bulk-availability`, { is_available: false });
                        addToast({ message: '86\'d all items in category', type: 'success' });
                        load();
                      } catch { addToast({ message: 'Failed', type: 'error' }); }
                    }}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg border border-red-400/30 hover:border-red-400/60"
                    title="Mark all items in this category as unavailable (86)"
                  >
                    86 ALL
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await apiPatch(`/vendor/categories/${activeCategory}/bulk-availability`, { is_available: true });
                        addToast({ message: 'All items re-enabled', type: 'success' });
                        load();
                      } catch { addToast({ message: 'Failed', type: 'error' }); }
                    }}
                    className="text-xs font-semibold text-green-400 hover:text-green-300 transition-colors px-3 py-1.5 rounded-lg border border-green-400/30 hover:border-green-400/60"
                  >
                    RESTORE
                  </button>
                </>
              )}
              <Button size="sm" onClick={() => setCreateOpen(true)}>+ New Item</Button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div key={item.id} className="glass rounded-xl px-4 py-3 flex items-center gap-4">
                {/* Thumbnail */}
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-heading text-base text-brand-white tracking-wide">{item.name.toUpperCase()}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-mono text-brand-orange text-sm">${item.base_price.toFixed(2)}</p>
                    {item.modifier_groups.length > 0 && (
                      <span className="text-xs font-mono text-brand-dim">
                        {item.modifier_groups.length} mod group{item.modifier_groups.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Availability toggle */}
                <button
                  onClick={() => toggleAvailability(item.id, item.is_available)}
                  className={`relative w-10 h-5 rounded-full transition-all shrink-0 ${
                    item.is_available ? 'bg-green-500' : 'bg-brand-steel'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      item.is_available ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>

                <button
                  onClick={async () => {
                    try {
                      await apiPost(`/vendor/menu-items/${item.id}/duplicate`, {});
                      addToast({ message: 'Item duplicated (disabled)', type: 'success' });
                      load();
                    } catch { addToast({ message: 'Failed to duplicate', type: 'error' }); }
                  }}
                  className="text-brand-dim hover:text-brand-chrome transition-colors text-xs shrink-0"
                  title="Duplicate item"
                >
                  ⧉
                </button>
                <button
                  onClick={() => setModifierItem(item)}
                  className="text-brand-dim hover:text-kds-preparing transition-colors text-xs font-semibold shrink-0"
                >
                  Modifiers
                </button>
                <button
                  onClick={() => setEditingItem(item)}
                  className="text-brand-dim hover:text-brand-white transition-colors text-sm shrink-0"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-red-400/60 hover:text-red-400 transition-colors text-sm shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
            {(activeCat?.menu_items ?? []).length === 0 && (
              <p className="text-brand-dim text-sm py-8 text-center">No items in this category yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit/Create modal */}
      <MenuItemFormModal
        isOpen={!!editingItem || createOpen}
        item={editingItem}
        categoryId={activeCategory ?? ''}
        categories={data.categories}
        onClose={() => { setEditingItem(null); setCreateOpen(false); }}
        onSaved={() => { setEditingItem(null); setCreateOpen(false); load(); }}
      />

      {/* Modifier group management modal */}
      {modifierItem && (
        <ModifierGroupModal
          item={modifierItem}
          onClose={() => { setModifierItem(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── Menu Item Form Modal ─────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  base_price: string;
  category_id: string;
  prep_time_minutes: string;
  dietary_tags: string[];
  image_url: string;
}

const DIETARY_OPTIONS = ['vegan', 'vegetarian', 'spicy', 'gluten-free', 'halal'];

function MenuItemFormModal({
  isOpen, item, categoryId, categories, onClose, onSaved,
}: {
  isOpen: boolean;
  item: MenuItem | null;
  categoryId: string;
  categories: MenuCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const addToast = useUIStore((s) => s.addToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: '', description: '', base_price: '', category_id: categoryId,
    prep_time_minutes: '', dietary_tags: [], image_url: '',
  });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        description: item.description ?? '',
        base_price: String(item.base_price),
        category_id: item.category_id,
        prep_time_minutes: String(item.prep_time_minutes ?? ''),
        dietary_tags: item.dietary_tags,
        image_url: item.image_url ?? '',
      });
    } else {
      setForm({ name: '', description: '', base_price: '', category_id: categoryId, prep_time_minutes: '', dietary_tags: [], image_url: '' });
    }
  }, [item, categoryId, isOpen]);

  function toggleTag(tag: string) {
    setForm((f) => ({
      ...f,
      dietary_tags: f.dietary_tags.includes(tag)
        ? f.dietary_tags.filter((t) => t !== tag)
        : [...f.dietary_tags, tag],
    }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // supabase already imported at top
      const ext = file.name.split('.').pop();
      const path = `menu-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('menu-images').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
      addToast({ message: 'Image uploaded', type: 'success' });
    } catch {
      addToast({ message: 'Image upload failed', type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.name || !form.base_price) {
      addToast({ message: 'Name and price are required', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.base_price),
        category_id: form.category_id,
        prep_time_minutes: form.prep_time_minutes ? parseInt(form.prep_time_minutes) : null,
        dietary_tags: form.dietary_tags,
        image_url: form.image_url || null,
      };
      if (item) {
        await apiPatch(`/vendor/menu-items/${item.id}`, payload);
      } else {
        await apiPost('/vendor/menu-items', payload);
      }
      addToast({ message: `Item ${item ? 'updated' : 'created'}`, type: 'success' });
      onSaved();
    } catch {
      addToast({ message: 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Item' : 'New Item'} size="lg">
      <div className="p-5 space-y-4">
        {/* Image upload */}
        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-2 uppercase tracking-wider">Item Image</label>
          <div className="flex items-center gap-3">
            {form.image_url && (
              <img src={form.image_url} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
            )}
            <div className="flex-1">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-sm text-brand-dim hover:border-brand-orange/40 hover:text-brand-white transition-all"
              >
                {uploading ? 'Uploading…' : form.image_url ? 'Change Image' : 'Upload Image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
            {form.image_url && (
              <button
                onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
                className="text-red-400/60 hover:text-red-400 text-xs"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Price ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.base_price}
              onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Prep Time (min)</label>
            <input
              type="number"
              min="1"
              value={form.prep_time_minutes}
              onChange={(e) => setForm((f) => ({ ...f, prep_time_minutes: e.target.value }))}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-1.5 uppercase tracking-wider">Category</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-chrome mb-2 uppercase tracking-wider">Dietary Tags</label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  form.dietary_tags.includes(tag)
                    ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30'
                    : 'bg-brand-card text-brand-dim border border-white/8 hover:border-white/15'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} loading={saving} size="lg" className="w-full font-heading tracking-widest">
          {item ? 'SAVE CHANGES' : 'CREATE ITEM'}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Modifier Group Modal ─────────────────────────────────────────────────────

interface NewGroupForm { name: string; is_required: boolean; max_selections: string; }
interface NewModifierForm { name: string; price_adjustment: string; }

function ModifierGroupModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const addToast = useUIStore((s) => s.addToast);
  const [groups, setGroups] = useState<ModifierGroup[]>(item.modifier_groups);
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState<NewGroupForm>({ name: '', is_required: false, max_selections: '1' });
  const [savingGroup, setSavingGroup] = useState(false);
  const [addingModifier, setAddingModifier] = useState<string | null>(null);
  const [newMod, setNewMod] = useState<NewModifierForm>({ name: '', price_adjustment: '0' });

  async function createGroup() {
    if (!newGroup.name) return;
    setSavingGroup(true);
    try {
      const maxSel = parseInt(newGroup.max_selections) || 1;
      const created = await apiPost<ModifierGroup & { id: string }>('/vendor/modifier-groups', {
        name: newGroup.name,
        is_required: newGroup.is_required,
        min_selections: newGroup.is_required ? 1 : 0,
        max_selections: maxSel,
        modifiers: [],
      });
      // Link to item
      await apiPost(`/vendor/menu-items/${item.id}/modifier-groups/${created.id}`, {});
      addToast({ message: 'Modifier group created', type: 'success' });
      const updated = await apiFetch<{ modifier_groups: ModifierGroup[] }>(`/vendor/menu-items/${item.id}/modifiers`).catch(() => null);
      if (updated) setGroups(updated.modifier_groups);
      else setGroups((g) => [...g, created]);
      setNewGroup({ name: '', is_required: false, max_selections: '1' });
      setAddingGroup(false);
    } catch {
      addToast({ message: 'Failed to create group', type: 'error' });
    } finally {
      setSavingGroup(false);
    }
  }

  async function deleteGroup(groupId: string) {
    if (!confirm('Delete this modifier group?')) return;
    try {
      await apiDelete(`/vendor/modifier-groups/${groupId}`);
      setGroups((g) => g.filter((gr) => gr.id !== groupId));
      addToast({ message: 'Group deleted', type: 'success' });
    } catch {
      addToast({ message: 'Failed to delete group', type: 'error' });
    }
  }

  async function addModifier(groupId: string) {
    if (!newMod.name) return;
    try {
      const created = await apiPost<Modifier>(`/vendor/modifier-groups/${groupId}/modifiers`, {
        name: newMod.name,
        price_adjustment: parseFloat(newMod.price_adjustment) || 0,
      });
      setGroups((gs) =>
        gs.map((g) =>
          g.id === groupId
            ? { ...g, modifiers: [...g.modifiers, { id: created.id, name: created.name, price_delta: (created as unknown as { price_adjustment: number }).price_adjustment ?? 0, is_available: true }] }
            : g
        )
      );
      setNewMod({ name: '', price_adjustment: '0' });
      setAddingModifier(null);
      addToast({ message: 'Modifier added', type: 'success' });
    } catch {
      addToast({ message: 'Failed to add modifier', type: 'error' });
    }
  }

  async function removeModifier(groupId: string, modId: string) {
    try {
      await apiDelete(`/vendor/modifier-groups/${groupId}/modifiers/${modId}`);
      setGroups((gs) =>
        gs.map((g) => g.id === groupId ? { ...g, modifiers: g.modifiers.filter((m) => m.id !== modId) } : g)
      );
    } catch {
      addToast({ message: 'Failed to remove', type: 'error' });
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={`Modifiers — ${item.name}`} size="lg">
      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        {groups.length === 0 && !addingGroup && (
          <p className="text-brand-dim text-sm text-center py-4">No modifier groups yet.</p>
        )}

        {groups.map((group) => (
          <GlassCard key={group.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-heading text-base text-brand-white tracking-wide">{group.name.toUpperCase()}</p>
                <p className="text-xs font-mono text-brand-dim mt-0.5">
                  {group.selection_type} · max {group.max_selections}
                  {group.min_selections > 0 ? ' · required' : ''}
                </p>
              </div>
              <button onClick={() => deleteGroup(group.id)} className="text-red-400/50 hover:text-red-400 text-xs">
                Delete Group
              </button>
            </div>

            {/* Modifier list */}
            <div className="space-y-1.5 mb-3">
              {group.modifiers.map((mod) => (
                <div key={mod.id} className="flex items-center justify-between px-3 py-1.5 bg-brand-bg/60 rounded-lg">
                  <span className="text-sm text-brand-white">{mod.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-brand-orange">
                      {mod.price_delta > 0 ? `+$${mod.price_delta.toFixed(2)}` : mod.price_delta < 0 ? `-$${Math.abs(mod.price_delta).toFixed(2)}` : 'free'}
                    </span>
                    <button onClick={() => removeModifier(group.id, mod.id)} className="text-red-400/50 hover:text-red-400 text-xs">×</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add modifier */}
            {addingModifier === group.id ? (
              <div className="flex gap-2 mt-2">
                <input
                  placeholder="Option name"
                  value={newMod.name}
                  onChange={(e) => setNewMod((m) => ({ ...m, name: e.target.value }))}
                  className="flex-1 bg-brand-bg border border-white/10 rounded-lg px-3 py-1.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="+$0.00"
                  value={newMod.price_adjustment}
                  onChange={(e) => setNewMod((m) => ({ ...m, price_adjustment: e.target.value }))}
                  className="w-20 bg-brand-bg border border-white/10 rounded-lg px-3 py-1.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
                />
                <Button size="sm" onClick={() => addModifier(group.id)}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingModifier(null)}>Cancel</Button>
              </div>
            ) : (
              <button
                onClick={() => { setAddingModifier(group.id); setNewMod({ name: '', price_adjustment: '0' }); }}
                className="text-xs text-brand-dim hover:text-brand-orange transition-colors"
              >
                + Add option
              </button>
            )}
          </GlassCard>
        ))}

        {/* New group form */}
        {addingGroup ? (
          <GlassCard className="p-4 border border-brand-orange/20">
            <p className="text-xs font-semibold text-brand-chrome uppercase tracking-wider mb-3">New Modifier Group</p>
            <div className="space-y-3">
              <input
                placeholder="Group name (e.g. Size, Extras, Sauces)"
                value={newGroup.name}
                onChange={(e) => setNewGroup((g) => ({ ...g, name: e.target.value }))}
                className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
              />
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="text-xs text-brand-dim mb-1 block">Max selections</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newGroup.max_selections}
                    onChange={(e) => setNewGroup((g) => ({ ...g, max_selections: e.target.value }))}
                    className="w-full bg-brand-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={newGroup.is_required}
                    onChange={(e) => setNewGroup((g) => ({ ...g, is_required: e.target.checked }))}
                    className="accent-brand-orange"
                  />
                  <span className="text-sm text-brand-chrome">Required</span>
                </label>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={createGroup} loading={savingGroup} className="flex-1">
                  Create Group
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingGroup(false)}>Cancel</Button>
              </div>
            </div>
          </GlassCard>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setAddingGroup(true)} className="w-full">
            + Add Modifier Group
          </Button>
        )}
      </div>
    </Modal>
  );
}
