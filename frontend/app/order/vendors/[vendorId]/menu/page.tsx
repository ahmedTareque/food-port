'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import type { CartItem, MenuItem, ModifierGroup, Vendor } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import PageTransition from '@/components/ui/PageTransition';

function ImageZoomOverlay({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.img
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          src={src}
          alt={alt}
          className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none"
        >
          ×
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// Types matching actual public menu API response shape
interface PubItemSummary {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  prep_time_minutes: number | null;
  dietary_tags: string[];
  allergens: string[];
  is_available: boolean;
  has_modifiers: boolean;
  category_id: string;
}

interface PubCategoryEntry {
  category: { id: string; name: string; slug: string; sort_order: number; item_count: number };
  items: PubItemSummary[];
}

interface PubVendorMenuData {
  vendor: Vendor;
  categories: PubCategoryEntry[];
}

interface PubItemDetail extends PubItemSummary {
  modifier_groups: Array<{
    id: string;
    name: string;
    is_required: boolean;
    min_selections: number;
    max_selections: number;
    modifiers: Array<{
      id: string;
      name: string;
      price_adjustment: number;
      is_available: boolean;
    }>;
  }>;
}

function toMenuItem(d: PubItemDetail, vendorId: string): MenuItem {
  return {
    id: d.id,
    vendor_id: vendorId,
    category_id: d.category_id,
    name: d.name,
    description: d.description,
    base_price: d.price,
    image_url: d.image_url,
    is_available: d.is_available,
    is_featured: false,
    dietary_tags: d.dietary_tags,
    prep_time_minutes: d.prep_time_minutes,
    modifier_groups: d.modifier_groups.map((g) => ({
      id: g.id,
      name: g.name,
      selection_type: g.max_selections === 1 ? 'single' : 'multiple',
      min_selections: g.min_selections,
      max_selections: g.max_selections,
      modifiers: g.modifiers.map((m) => ({
        id: m.id,
        name: m.name,
        price_delta: m.price_adjustment,
        is_available: m.is_available,
      })),
    })),
  };
}

const DIETARY_ICONS: Record<string, string> = {
  vegan: '🌱',
  vegetarian: '🥦',
  spicy: '🌶️',
  'gluten-free': 'GF',
  halal: '☪',
};

export default function VendorMenuPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [data, setData] = useState<PubVendorMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const addItem = useCartStore((s) => s.addItem);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    apiFetch<PubVendorMenuData>(`/vendors/${vendorId}/menu`)
      .then((d) => {
        setData(d);
        const first = d.categories.find((c) => c.items.length > 0);
        if (first) setActiveCategory(first.category.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vendorId]);

  function scrollToCategory(catId: string) {
    setActiveCategory(catId);
    categoryRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleItemClick(item: PubItemSummary) {
    if (!item.is_available) return;
    setLoadingItemId(item.id);
    try {
      const detail = await apiFetch<PubItemDetail>(`/menu-items/${item.id}`);
      setSelectedItem(toMenuItem(detail, vendorId));
    } catch {
      addToast({ message: 'Failed to load item details', type: 'error' });
    } finally {
      setLoadingItemId(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }
  if (!data) {
    return <div className="text-center py-20 text-brand-dim">Failed to load menu.</div>;
  }

  const { vendor } = data;
  const categories = data.categories.filter((c) => c.items.length > 0);

  return (
    <PageTransition>
      {/* Hero */}
      <div
        className="h-28 flex items-end px-4 pb-4 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${vendor.booth_color}33 0%, transparent 60%)` }}
      >
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: vendor.booth_color }} />
        <div>
          <h1 className="font-heading text-4xl text-brand-white tracking-widest">
            {vendor.name.toUpperCase()}
          </h1>
          <p className="text-brand-dim text-sm font-body">
            {vendor.cuisine_type} · ~{vendor.avg_prep_time_minutes} min
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="sticky top-[57px] z-30 bg-brand-bg/90 backdrop-blur-md border-b border-black/6">
        <div className="flex gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.category.id}
              onClick={() => scrollToCategory(cat.category.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeCategory === cat.category.id
                  ? 'text-brand-orange border-b-2 border-brand-orange'
                  : 'text-brand-dim hover:text-brand-white'
              }`}
            >
              {cat.category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items by category */}
      <div className="px-4 py-4 max-w-2xl mx-auto space-y-8">
        {categories.map((cat) => (
          <div
            key={cat.category.id}
            ref={(el) => { categoryRefs.current[cat.category.id] = el; }}
          >
            <h2 className="font-heading text-2xl text-brand-white tracking-wide mb-3">
              {cat.category.name.toUpperCase()}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {cat.items.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => item.is_available && handleItemClick(item)}
                  className={`text-left glass rounded-2xl overflow-hidden transition-all ${
                    item.is_available
                      ? 'hover:border-black/15 active:scale-95'
                      : 'opacity-50 cursor-not-allowed'
                  } ${loadingItemId === item.id ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <div
                    className="h-24 w-full relative flex items-center justify-center text-3xl"
                    style={{ backgroundColor: `${vendor.booth_color}18` }}
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : '🍽️'}
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-xs font-semibold text-red-400">SOLD OUT</span>
                      </div>
                    )}
                    {loadingItemId === item.id && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Spinner size="sm" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-heading text-base text-brand-white tracking-wide leading-tight mb-1">
                      {item.name.toUpperCase()}
                    </h3>
                    {item.dietary_tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-1.5">
                        {item.dietary_tags.map((tag) => (
                          <span key={tag} className="text-[10px] text-brand-dim">
                            {DIETARY_ICONS[tag] ?? tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="font-mono text-brand-orange text-sm font-semibold">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          vendor={vendor}
          onClose={() => setSelectedItem(null)}
          onAdd={(item) => {
            addItem(item);
            addToast({ message: `${item.itemName} added to cart`, type: 'success' });
            setSelectedItem(null);
          }}
        />
      )}
    </PageTransition>
  );
}

interface ItemDetailModalProps {
  item: MenuItem;
  vendor: Vendor;
  onClose: () => void;
  onAdd: (item: Omit<CartItem, 'itemKey'>) => void;
}

function ItemDetailModal({ item, vendor, onClose, onAdd }: ItemDetailModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [zoomImage, setZoomImage] = useState(false);

  function toggleModifier(group: ModifierGroup, modifierId: string) {
    setSelectedModifiers((prev) => {
      const current = prev[group.id] ?? [];
      if (group.selection_type === 'single') {
        return { ...prev, [group.id]: [modifierId] };
      }
      if (current.includes(modifierId)) {
        return { ...prev, [group.id]: current.filter((id) => id !== modifierId) };
      }
      if (current.length >= group.max_selections) return prev;
      return { ...prev, [group.id]: [...current, modifierId] };
    });
  }

  const allModifiers = item.modifier_groups.flatMap((g) =>
    (selectedModifiers[g.id] ?? []).map((id) => {
      const mod = g.modifiers.find((m) => m.id === id)!;
      return { modifierId: id, name: mod.name, priceDelta: mod.price_delta };
    }),
  );

  const modTotal = allModifiers.reduce((s, m) => s + m.priceDelta, 0);
  const unitPrice = item.base_price + modTotal;
  const lineTotal = unitPrice * quantity;

  function handleAdd() {
    onAdd({
      menuItemId: item.id,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorColor: vendor.booth_color,
      itemName: item.name,
      unitPrice: item.base_price,
      selectedModifiers: allModifiers,
      quantity,
      specialInstructions: instructions,
    });
  }

  return (
    <Modal isOpen onClose={onClose} size="lg">
      {zoomImage && item.image_url && (
        <ImageZoomOverlay src={item.image_url} alt={item.name} onClose={() => setZoomImage(false)} />
      )}
      <div
        className="h-44 w-full flex items-center justify-center text-6xl relative cursor-pointer group"
        style={{ backgroundColor: `${vendor.booth_color}18` }}
        onClick={() => item.image_url && setZoomImage(true)}
      >
        {item.image_url ? (
          <>
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">Tap to zoom</span>
            </div>
          </>
        ) : '🍽️'}
      </div>

      <div className="p-5 space-y-5">
        <div>
          <h2 className="font-heading text-3xl text-brand-white tracking-wide">
            {item.name.toUpperCase()}
          </h2>
          {item.description && (
            <p className="text-brand-dim text-sm mt-1">{item.description}</p>
          )}
          <p className="font-mono text-brand-orange mt-2">${item.base_price.toFixed(2)}</p>
        </div>

        {/* Modifier groups */}
        {item.modifier_groups.map((group) => (
          <div key={group.id}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading text-lg text-brand-white tracking-wide">
                {group.name.toUpperCase()}
              </h3>
              {group.min_selections > 0 && (
                <Badge label="Required" className="bg-brand-orange/20 text-brand-orange border-brand-orange/30" />
              )}
            </div>
            <div className="space-y-1.5">
              {group.modifiers.map((mod) => {
                const selected = (selectedModifiers[group.id] ?? []).includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => toggleModifier(group, mod.id)}
                    disabled={!mod.is_available}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                      selected
                        ? 'bg-brand-orange/15 border-brand-orange/40 text-brand-white'
                        : 'bg-brand-card border-black/6 text-brand-chrome hover:border-black/15'
                    } disabled:opacity-40`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selected ? 'border-brand-orange bg-brand-orange' : 'border-brand-dim'
                        }`}
                      >
                        {selected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={1.5} fill="none" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-body">{mod.name}</span>
                    </div>
                    {mod.price_delta !== 0 && (
                      <span className="text-xs font-mono text-brand-dim">
                        {mod.price_delta > 0 ? '+' : ''}${mod.price_delta.toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Special instructions */}
        <div>
          <label className="block text-sm font-semibold text-brand-chrome mb-1.5">
            Special Instructions
          </label>
          <div className="relative">
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value.slice(0, 200))}
              rows={2}
              placeholder="Any allergies or requests?"
              className="w-full bg-brand-card border border-black/8 rounded-xl px-3 py-2 text-sm text-brand-white placeholder:text-brand-dim focus:outline-none focus:border-brand-orange/50 resize-none font-body"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-brand-dim font-mono">
              {instructions.length}/200
            </span>
          </div>
        </div>

        {/* Quantity + add to cart */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-brand-card rounded-xl px-3 py-2 border border-black/8">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="text-brand-dim hover:text-brand-white transition-colors w-7 h-7 flex items-center justify-center"
            >
              −
            </button>
            <span className="font-mono text-brand-white w-4 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              className="text-brand-dim hover:text-brand-white transition-colors w-7 h-7 flex items-center justify-center"
            >
              +
            </button>
          </div>

          <Button onClick={handleAdd} size="lg" className="flex-1 font-heading tracking-wider">
            ADD TO CART · ${lineTotal.toFixed(2)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
