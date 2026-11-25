'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'ISHIKA10') {
      setDiscount(0.1);
      setPromoApplied(true);
    } else {
      alert('Invalid promo code. Try "ISHIKA10" for 10% off!');
    }
  };

  const discountAmount = total * discount;
  const finalTotal = total - discountAmount;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 rounded-full glass border border-border/60 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-muted" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Shopping Bag is Empty</h1>
          <p className="text-secondary text-sm max-w-sm mx-auto">
            Explore Ishika&apos;s signature hoodies, jewelry, art prints, and digital packs to fill your cart.
          </p>
        </div>
        <Link href="/store">
          <Button variant="primary" size="lg">
            <span>Explore Merchandise</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Your Shopping Bag</h1>
          <p className="text-xs text-muted mt-1">{items.length} unique item(s) selected</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-light hover:text-rose transition-colors"
        >
          Clear All Items
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, idx) => (
            <div
              key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${idx}`}
              className="p-5 rounded-2xl glass border border-border/50 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
            >
              <div className="flex gap-4 items-center">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-border/40">
                  <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">{item.product.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                    {item.selectedSize && item.selectedColor && <span>•</span>}
                    {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                  </div>
                  <p className="text-sm font-semibold text-gold">{formatPrice(item.product.price)}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 self-end sm:self-center">
                <div className="flex items-center border border-border rounded-xl bg-elevated">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="px-2.5 py-1 text-secondary hover:text-foreground text-xs"
                  >
                    -
                  </button>
                  <span className="px-2 text-xs font-bold text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="px-2.5 py-1 text-secondary hover:text-foreground text-xs"
                  >
                    +
                  </button>
                </div>

                <p className="text-sm font-bold text-foreground min-w-[70px] text-right">
                  {formatPrice(item.product.price * item.quantity)}
                </p>

                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-2 text-muted hover:text-rose transition-colors"
                  title="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <Link href="/store" className="inline-flex items-center gap-2 text-xs text-muted hover:text-foreground pt-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border border-border/50 space-y-6">
            <h2 className="text-lg font-bold text-foreground">Order Summary</h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between text-secondary">
                <span>Subtotal</span>
                <span className="text-foreground font-semibold">{formatPrice(total)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promo Discount (10%)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-secondary">
                <span>Shipping Worldwide</span>
                <span className="text-emerald-400 font-semibold">FREE</span>
              </div>
              <div className="border-t border-border/50 pt-3 flex justify-between font-bold text-base text-foreground">
                <span>Total Amount</span>
                <span className="text-gold text-lg">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Promo Code (ISHIKA10)"
                  className="flex-1 px-3 py-2 rounded-xl bg-elevated border border-border text-foreground text-xs uppercase placeholder:normal-case focus:outline-none focus:border-rose"
                />
                <Button type="submit" variant="secondary" size="sm">
                  Apply
                </Button>
              </div>
              {promoApplied && (
                <p className="text-[11px] text-emerald-400">✓ Promo code ISHIKA10 applied successfully!</p>
              )}
            </form>

            <Link href="/checkout" className="block">
              <Button size="lg" variant="primary" className="w-full">
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <div className="flex items-center justify-center gap-2 text-[11px] text-muted text-center pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Encrypted 256-Bit Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
