'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { apiPost } from '@/lib/api';
import type { Order } from '@/types';
import Button from '@/components/ui/Button';
import PageTransition from '@/components/ui/PageTransition';

interface PromoResult {
  promotion_id: string;
  code: string;
  type: string;
  value: number;
  discount_amount: number;
}

export default function CartPage() {
  const router = useRouter();
  const { items, sessionId, tableId, updateQuantity, removeItem, clearCart, subtotal, tax, total, itemsByVendor } =
    useCartStore();
  const addToast = useUIStore((s) => s.addToast);
  const [placing, setPlacing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const vendorGroups = itemsByVendor();
  const isEmpty = items.length === 0;

  const discountedTotal = promoResult
    ? Math.max(0, total() - promoResult.discount_amount)
    : total();

  async function applyPromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const result = await apiPost<PromoResult>('/promos/validate', {
        code: promoCode.trim(),
        subtotal: subtotal(),
      });
      setPromoResult(result);
      addToast({ message: `${result.code} applied — $${result.discount_amount.toFixed(2)} off!`, type: 'success' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid promo code';
      addToast({ message: msg, type: 'error' });
      setPromoResult(null);
    } finally {
      setPromoLoading(false);
    }
  }

  async function placeOrder() {
    setPlacing(true);
    try {
      const orderItems = items.map((item) => ({
        vendor_id: item.vendorId,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        modifiers: item.selectedModifiers.map((m) => ({ modifier_id: m.modifierId, quantity: 1 })),
        special_instructions: item.specialInstructions || undefined,
      }));

      const order = await apiPost<Order>('/orders', {
        session_id: sessionId,
        table_id: tableId,
        items: orderItems,
        promotion_id: promoResult?.promotion_id,
        idempotency_key: crypto.randomUUID(),
      });

      clearCart();
      router.push(`/order/confirmation/${order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order';
      addToast({ message: msg, type: 'error' });
      setPlacing(false);
    }
  }

  if (isEmpty) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="font-heading text-3xl text-brand-white tracking-wide mb-2">YOUR CART IS EMPTY</h2>
          <p className="text-brand-dim text-sm mb-8">Add some delicious food from our booths</p>
          <Button onClick={() => router.push('/order/vendors')}>Browse Vendors</Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="px-4 py-5 max-w-lg mx-auto space-y-4 pb-40">
        <h1 className="font-heading text-4xl text-brand-white tracking-widest">YOUR ORDER</h1>

        {/* Cart items grouped by vendor */}
        {Object.entries(vendorGroups).map(([vendorId, vendorItems]) => (
          <div key={vendorId} className="glass rounded-2xl overflow-hidden">
            {/* Vendor header */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b border-black/6"
              style={{ backgroundColor: `${vendorItems[0].vendorColor}18` }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: vendorItems[0].vendorColor }}
              />
              <span className="font-heading text-base text-brand-white tracking-wide">
                {vendorItems[0].vendorName.toUpperCase()}
              </span>
              <span className="text-xs text-brand-dim ml-auto font-mono">
                {vendorItems.length} item{vendorItems.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-white/4">
              <AnimatePresence>
                {vendorItems.map((item) => {
                  const modTotal = item.selectedModifiers.reduce((s, m) => s + m.priceDelta, 0);
                  const linePrice = (item.unitPrice + modTotal) * item.quantity;

                  return (
                    <motion.div
                      key={item.itemKey}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 py-3 flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-base text-brand-white tracking-wide">
                          {item.itemName.toUpperCase()}
                        </p>
                        {item.selectedModifiers.length > 0 && (
                          <p className="text-xs text-brand-dim mt-0.5">
                            {item.selectedModifiers.map((m) => m.name).join(', ')}
                          </p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-xs text-brand-yellow/70 mt-0.5 italic">
                            {item.specialInstructions}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="font-mono text-brand-orange text-sm font-semibold">
                          ${linePrice.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1.5 bg-brand-steel rounded-lg px-2 py-1">
                          <button
                            onClick={() => updateQuantity(item.itemKey, item.quantity - 1)}
                            className="text-brand-dim hover:text-brand-white w-5 h-5 flex items-center justify-center text-sm"
                          >
                            −
                          </button>
                          <span className="font-mono text-xs text-brand-white w-3 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.itemKey, item.quantity + 1)}
                            className="text-brand-dim hover:text-brand-white w-5 h-5 flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.itemKey)}
                          className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {/* Promo code */}
        <div className="glass rounded-2xl p-4">
          <p className="text-xs font-mono text-brand-dim tracking-widest mb-2">PROMO CODE</p>
          {promoResult ? (
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
              <div>
                <span className="text-green-400 font-mono font-bold text-sm">{promoResult.code}</span>
                <span className="text-green-400/70 text-xs ml-2">
                  −${promoResult.discount_amount.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => { setPromoResult(null); setPromoCode(''); }}
                className="text-red-400/70 hover:text-red-400 text-xs transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                placeholder="ENTER CODE"
                className="flex-1 bg-black/5 border border-black/10 rounded-xl px-3 py-2 text-brand-white font-mono text-sm placeholder:text-brand-dim/40 outline-none focus:border-brand-orange/40 transition-colors"
              />
              <button
                onClick={applyPromo}
                disabled={promoLoading || !promoCode.trim()}
                className="bg-brand-orange/20 border border-brand-orange/30 text-brand-orange font-semibold text-sm px-4 py-2 rounded-xl hover:bg-brand-orange/30 disabled:opacity-40 transition-all"
              >
                {promoLoading ? '...' : 'Apply'}
              </button>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="glass rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-sm font-body text-brand-chrome">
            <span>Subtotal</span>
            <span className="font-mono">${subtotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-body text-brand-dim">
            <span>Tax (8.25%)</span>
            <span className="font-mono">${tax().toFixed(2)}</span>
          </div>
          {promoResult && (
            <div className="flex justify-between text-sm font-body text-green-400">
              <span>Promo ({promoResult.code})</span>
              <span className="font-mono">−${promoResult.discount_amount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-black/8 pt-2 mt-2 flex justify-between font-heading text-xl text-brand-white">
            <span>TOTAL</span>
            <span className="font-mono text-brand-orange">${discountedTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={placeOrder}
            loading={placing}
            size="lg"
            className="w-full font-heading tracking-widest text-base"
          >
            PLACE ORDER
          </Button>
          <Button
            onClick={() => router.push('/order/vendors')}
            variant="ghost"
            size="md"
            className="w-full"
          >
            + Add More Items
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
