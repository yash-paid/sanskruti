'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Lock, 
  RotateCcw, 
  AlertCircle, 
  ShieldAlert, 
  Package, 
  ChevronRight, 
  Sparkles, 
  Banknote,
  Clock,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { submitPayUPayment } from '@/lib/payu-client';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import type { Order } from '@/types';

type CheckoutStage = 'shipping' | 'payment' | 'processing' | 'failed' | 'success';

const STORE_REJECTION_REASONS = [
  {
    id: 'bank_timeout',
    title: 'Bank Server Timeout / OTP Expired',
    description: 'Issuing bank did not respond within the 3D Secure session window (Error: TIMEOUT_504).',
  },
  {
    id: 'insufficient_funds',
    title: 'Insufficient Balance in Bank Account',
    description: 'Transaction declined due to inadequate funds in your linked bank/card account (Error: INSUFFICIENT_FUNDS_01).',
  },
  {
    id: 'bank_declined',
    title: 'Card Declined by Bank Security Policy',
    description: 'The transaction was blocked by your card issuing bank’s automated fraud prevention system (Error: BANK_DECLINED_SEC).',
  },
  {
    id: 'upi_pin',
    title: 'Incorrect UPI PIN Entered 3 Times',
    description: 'UPI authorization failed due to invalid MPIN entered on the gateway (Error: UPI_AUTH_FAILED).',
  },
];

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useUser();

  const [stage, setStage] = useState<CheckoutStage>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<'payu' | 'upi' | 'card' | 'netbanking' | 'cod'>('payu');
  const [upiId, setUpiId] = useState('ishq@okhdfcbank');

  // PayU Gateway Loading & Error State
  const [isPayULoading, setIsPayULoading] = useState<boolean>(false);
  const [payUError, setPayUError] = useState<string | null>(null);

  // Customer Shipping Information
  const [formData, setFormData] = useState({
    name: user?.name || 'Ananya Verma',
    email: user?.email || 'ananya@example.com',
    phone: '9876543210',
    address: '14B Silver Beach Towers, Juhu Tara Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    zip: '400049',
    country: 'India',
  });

  // Rejection & Success tracking state
  const [selectedReasonId, setSelectedReasonId] = useState<string>(STORE_REJECTION_REASONS[0].id);
  const [customFailureReason, setCustomFailureReason] = useState<string>(STORE_REJECTION_REASONS[0].description);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>('');
  const [confirmedTrackingId, setConfirmedTrackingId] = useState<string>('');
  const [placedOrderItems, setPlacedOrderItems] = useState(items);
  const [placedOrderTotal, setPlacedOrderTotal] = useState(total);

  // Handle incoming PayU callback params on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      const txnid = searchParams.get('txnid') || 'IW-PAYU-' + Date.now();
      const amt = Number(searchParams.get('amount')) || total;
      const trackingNum = 'BD-' + Math.floor(10000000 + Math.random() * 90000000) + '-IN';
      setConfirmedOrderId(txnid);
      setConfirmedTrackingId(trackingNum);
      setPlacedOrderTotal(amt);

      const newOrder: Order = {
        id: txnid,
        date: new Date().toISOString().split('T')[0],
        status: 'processing',
        total: amt,
        items: items.length > 0 ? items.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          size: item.selectedSize,
          color: item.selectedColor,
          image: item.product.images[0] || '/logo.png',
        })) : [{
          productName: "Ishika's World Official Merchandise",
          quantity: 1,
          price: amt,
          image: '/logo.png',
        }],
        shippingAddress: `${formData.name}, ${formData.address}, ${formData.city}, ${formData.state} - ${formData.zip} (Phone: +91 ${formData.phone})`,
        paymentMethod: 'PayU India Hosted Gateway (Paid)',
        trackingNumber: trackingNum,
        carrier: 'BlueDart Express',
        estimatedDelivery: '2-3 Business Days',
      };

      try {
        const existing = localStorage.getItem('ishika_user_orders');
        const currentList = existing ? JSON.parse(existing) : [];
        localStorage.setItem('ishika_user_orders', JSON.stringify([newOrder, ...currentList]));
      } catch {}

      clearCart();
      setStage('success');
    } else if (payment === 'failed') {
      const reason = searchParams.get('reason') || 'Transaction was declined by issuing bank or cancelled on PayU.';
      setCustomFailureReason(reason);
      setStage('failed');
    }
  }, []);

  // Form validations
  const isNameValid = formData.name.trim().length >= 2;
  const isPhoneValid = /^\d{10}$/.test(formData.phone.replace(/\D/g, ''));
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const isAddressValid = formData.address.trim().length >= 5;
  const isCityValid = formData.city.trim().length >= 2;
  const isZipValid = formData.zip.trim().length >= 4;
  const isShippingValid = isNameValid && isPhoneValid && isEmailValid && isAddressValid && isCityValid && isZipValid;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isShippingValid) return;
    setStage('payment');
  };

  // PayU Official Gateway Checkout
  const handlePayUCheckout = async () => {
    if (!isShippingValid) {
      setStage('shipping');
      return;
    }
    setIsPayULoading(true);
    setPayUError(null);

    try {
      const productSummary = items.map(i => i.product.name).join(', ').substring(0, 70);
      const res = await fetch('/api/payu/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'merch',
          planId: 'merch_cart',
          amount: total,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          productTitle: productSummary || "Ishika's World Merch",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate PayU payment.');
      }

      // Submit hidden form to PayU Hosted Checkout!
      submitPayUPayment(data.actionUrl, data.params);
    } catch (err: any) {
      console.error('[PAYU MERCH CHECKOUT ERROR]', err);
      setPayUError(err.message || 'Payment initiation failed. Please try again.');
      setIsPayULoading(false);
    }
  };

  // Execute payment transaction
  const executePayment = (shouldSucceed: boolean) => {
    setStage('processing');
    const orderNum = 'IW-2026-' + Math.floor(100000 + Math.random() * 900000);
    const trackingNum = 'BD-' + Math.floor(10000000 + Math.random() * 90000000) + '-IN';

    setConfirmedOrderId(orderNum);
    setConfirmedTrackingId(trackingNum);
    setPlacedOrderItems([...items]);
    setPlacedOrderTotal(total);

    setTimeout(() => {
      if (shouldSucceed) {
        // Create new live order record
        const newOrder: Order = {
          id: orderNum,
          date: new Date().toISOString().split('T')[0],
          status: 'processing',
          total: total,
          items: items.map(item => ({
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            size: item.selectedSize,
            color: item.selectedColor,
            image: item.product.images[0],
          })),
          shippingAddress: `${formData.name}, ${formData.address}, ${formData.city}, ${formData.state} - ${formData.zip} (Phone: +91 ${formData.phone})`,
          trackingNumber: trackingNum,
          carrier: 'BlueDart Express',
          estimatedDelivery: '2-3 Business Days',
          paymentMethod: paymentMethod.toUpperCase(),
        };

        // Persist order into localStorage
        try {
          const existing = localStorage.getItem('ishika_user_orders');
          const currentList = existing ? JSON.parse(existing) : [];
          localStorage.setItem('ishika_user_orders', JSON.stringify([newOrder, ...currentList]));
        } catch {}

        clearCart();
        setStage('success');
      } else {
        const found = STORE_REJECTION_REASONS.find(r => r.id === selectedReasonId);
        setCustomFailureReason(found ? `${found.title}: ${found.description}` : STORE_REJECTION_REASONS[0].description);
        setStage('failed');
      }
    }, 1400);
  };

  // If cart is empty and not on success screen
  if (items.length === 0 && stage !== 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 rounded-full glass border border-border/60 mx-auto flex items-center justify-center">
          <Truck className="w-10 h-10 text-muted" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Shopping Bag is Empty</h1>
          <p className="text-secondary text-sm max-w-sm mx-auto">
            Add merchandise products to your cart before proceeding to checkout.
          </p>
        </div>
        <Link href="/store">
          <Button variant="primary">Explore Merchandise</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header & Breadcrumb */}
      <div>
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Bag</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
          <h1 className="text-2xl sm:text-4xl font-black text-foreground">
            Official Store <span className="text-gradient-rose">Checkout</span>
          </h1>
          {/* Step Progress Tracker */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className={`px-2.5 py-1 rounded-full ${stage === 'shipping' ? 'bg-rose text-white' : 'bg-white/10 text-muted'}`}>
              1. Address
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted" />
            <span className={`px-2.5 py-1 rounded-full ${stage === 'payment' || stage === 'processing' ? 'bg-rose text-white' : stage === 'success' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-muted'}`}>
              2. Payment
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted" />
            <span className={`px-2.5 py-1 rounded-full ${stage === 'success' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-muted'}`}>
              3. Confirmation
            </span>
          </div>
        </div>
      </div>

      {/* ===================== STAGE 1: SHIPPING & CONTACT FORM ===================== */}
      {stage === 'shipping' && (
        <form onSubmit={handleProceedToPayment} className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass p-6 sm:p-8 rounded-3xl border border-border/50 space-y-5">
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
                <Truck className="w-5 h-5 text-gold" />
                <span>Shipping &amp; Delivery Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Yashvi Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:border-rose"
                  />
                  {!isNameValid && formData.name.length > 0 && (
                    <span className="text-[10px] text-rose">Please enter your name</span>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted">Mobile Number (Delivery SMS / OTP) *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-muted select-none">🇮🇳 +91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="98765 43210"
                      className="w-full pl-16 pr-3.5 py-2.5 rounded-xl bg-elevated border border-border text-foreground text-xs sm:text-sm font-mono focus:outline-none focus:border-rose"
                    />
                  </div>
                  {!isPhoneValid && formData.phone.length > 0 && (
                    <span className="text-[10px] text-rose">Enter a valid 10-digit number</span>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-muted">Email Address (Tax Invoice &amp; Tracking Link) *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="yashvi@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:border-rose"
                  />
                  {!isEmailValid && formData.email.length > 0 && (
                    <span className="text-[10px] text-rose">Enter a valid email address</span>
                  )}
                </div>

                {/* Street Address */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-muted">Delivery Street Address (Flat / House / Landmark) *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="14B Silver Beach Towers, Near Juhu Beach"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:border-rose"
                  />
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Mumbai"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:border-rose"
                  />
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:border-rose"
                  />
                </div>

                {/* PIN Code */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted">Postal PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value.replace(/\D/g, '') })}
                    placeholder="400049"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border text-foreground text-xs sm:text-sm font-mono focus:outline-none focus:border-rose"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:border-gold"
                  >
                    <option value="India">India (Pan-India Express)</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="UAE">United Arab Emirates</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Proceed Button */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-3xl border border-border/50 space-y-5">
              <h3 className="text-base font-bold text-foreground border-b border-border/40 pb-3">
                Order Summary ({items.length} items)
              </h3>

              <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center text-xs">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border/40">
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-semibold truncate">{item.product.name}</p>
                      <p className="text-[10px] text-muted">
                        Qty: {item.quantity} {item.selectedSize ? `• Size: ${item.selectedSize}` : ''}
                      </p>
                    </div>
                    <span className="text-foreground font-bold shrink-0">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/50 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-secondary">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>Shipping (Tracked)</span>
                  <span className="text-emerald-400 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>GST / VAT</span>
                  <span className="text-muted">Included</span>
                </div>
                <div className="flex justify-between font-black text-base text-foreground pt-2 border-t border-border/30">
                  <span>Total Amount</span>
                  <span className="text-gold text-lg">{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                variant="primary"
                disabled={!isShippingValid}
                className="w-full py-3 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose/25"
              >
                <span>Proceed to Payment</span>
                <ChevronRight className="w-4 h-4" />
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>256-Bit Bank Grade Security</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ===================== STAGE 2: PAYMENT GATEWAY (UPI, CARD, NETBANKING, COD) ===================== */}
      {stage === 'payment' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Address Recap */}
            <div className="p-4 rounded-2xl bg-[#0f0f18] border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose" />
                  <span>Delivering to: {formData.name}</span>
                </p>
                <p className="text-[11px] text-muted">
                  {formData.address}, {formData.city}, {formData.state} - {formData.zip}
                </p>
                <p className="text-[10px] text-muted">+91 {formData.phone} • {formData.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setStage('shipping')}
                className="text-[11px] text-rose-light hover:underline font-bold self-start sm:self-center"
              >
                Edit Address
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="glass p-6 sm:p-8 rounded-3xl border border-border/50 space-y-6">
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
                <CreditCard className="w-5 h-5 text-rose" />
                <span>Select Payment Method</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('payu')}
                  className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 relative ${
                    paymentMethod === 'payu'
                      ? 'bg-rose/15 border-rose text-rose-light shadow-md'
                      : 'bg-[#121220] border-border/50 text-muted hover:text-foreground'
                  }`}
                >
                  <span className="absolute -top-2 px-1.5 py-0.2 rounded bg-gold text-black text-[9px] font-black uppercase">Official</span>
                  <Lock className="w-5 h-5 text-rose-light" />
                  <span>PayU Gateway</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${
                    paymentMethod === 'upi'
                      ? 'bg-rose/15 border-rose text-rose-light shadow-md'
                      : 'bg-[#121220] border-border/50 text-muted hover:text-foreground'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span>Direct UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${
                    paymentMethod === 'card'
                      ? 'bg-rose/15 border-rose text-rose-light shadow-md'
                      : 'bg-[#121220] border-border/50 text-muted hover:text-foreground'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-gold" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${
                    paymentMethod === 'netbanking'
                      ? 'bg-rose/15 border-rose text-rose-light shadow-md'
                      : 'bg-[#121220] border-border/50 text-muted hover:text-foreground'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <span>NetBanking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${
                    paymentMethod === 'cod'
                      ? 'bg-rose/15 border-rose text-rose-light shadow-md'
                      : 'bg-[#121220] border-border/50 text-muted hover:text-foreground'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-purple-400" />
                  <span>Pay on Delivery</span>
                </button>
              </div>

              {/* PayU Hosted Gateway Details & Action */}
              {paymentMethod === 'payu' && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#181224] to-[#121220] border border-rose/40 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>PayU India Official Hosted Gateway</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      RBI Licensed &amp; Safe
                    </span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Redirects to PayU India official encrypted gateway page. Supports Google Pay, PhonePe, Paytm, BHIM, all Visa / Mastercard / RuPay credit &amp; debit cards, and 50+ NetBanking options.
                  </p>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handlePayUCheckout}
                    disabled={isPayULoading}
                    className="w-full py-3.5 text-xs sm:text-sm font-black flex items-center justify-center gap-2 bg-gradient-to-r from-rose via-rose-light to-gold text-white shadow-xl shadow-rose/30 hover:opacity-95"
                  >
                    {isPayULoading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Connecting to PayU India...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-white" />
                        <span>Proceed to PayU Official Gateway ({formatPrice(total)})</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  {payUError && (
                    <div className="p-2.5 rounded-xl bg-rose/15 border border-rose/40 text-[11px] text-rose flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{payUError}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[10px] text-muted">
                    <span className="px-2 py-0.5 rounded bg-white/5">UPI (GPay / PhonePe / Paytm)</span>
                    <span className="px-2 py-0.5 rounded bg-white/5">Cards (Visa / Master / RuPay)</span>
                    <span className="px-2 py-0.5 rounded bg-white/5">50+ Banks NetBanking</span>
                  </div>
                </div>
              )}

              {/* Method Details Form */}
              {paymentMethod === 'upi' && (
                <div className="p-4 rounded-2xl bg-[#141422] border border-border/50 space-y-3 text-xs">
                  <span className="text-[11px] font-semibold text-muted block">
                    Enter Virtual Payment Address (VPA / UPI ID):
                  </span>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@okaxis"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e18] border border-border/60 text-foreground text-xs focus:outline-none focus:border-rose font-mono"
                  />
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted">
                    <span className="px-2 py-1 rounded bg-white/5">Google Pay</span>
                    <span className="px-2 py-1 rounded bg-white/5">PhonePe</span>
                    <span className="px-2 py-1 rounded bg-white/5">Paytm UPI</span>
                    <span className="px-2 py-1 rounded bg-white/5">BHIM</span>
                    <span className="px-2 py-1 rounded bg-white/5">Cred UPI</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="p-4 rounded-2xl bg-[#141422] border border-border/50 space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-muted block mb-1">Card Number</span>
                    <input
                      type="text"
                      disabled
                      value="•••• •••• •••• 8824"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e18] border border-border/60 text-foreground text-xs font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-muted block mb-1">Expiry Date</span>
                      <input
                        type="text"
                        disabled
                        value="11 / 28"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e18] border border-border/60 text-foreground text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-muted block mb-1">CVV / CVC</span>
                      <input
                        type="text"
                        disabled
                        value="•••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e18] border border-border/60 text-foreground text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="p-4 rounded-2xl bg-[#141422] border border-border/50 space-y-2.5 text-xs">
                  <span className="text-[11px] font-semibold text-muted block">Select Your NetBanking Provider:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="p-2.5 rounded-xl bg-[#0e0e18] border border-border/50 text-left text-xs font-bold text-foreground hover:border-gold">
                      HDFC Bank
                    </button>
                    <button type="button" className="p-2.5 rounded-xl bg-[#0e0e18] border border-border/50 text-left text-xs font-bold text-foreground hover:border-gold">
                      State Bank of India
                    </button>
                    <button type="button" className="p-2.5 rounded-xl bg-[#0e0e18] border border-border/50 text-left text-xs font-bold text-foreground hover:border-gold">
                      ICICI Bank
                    </button>
                    <button type="button" className="p-2.5 rounded-xl bg-[#0e0e18] border border-border/50 text-left text-xs font-bold text-foreground hover:border-gold">
                      Axis Bank
                    </button>
                  </div>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-secondary space-y-1">
                  <p className="font-bold text-emerald-400">Cash on Delivery Verified</p>
                  <p className="text-[11px] text-muted">
                    Pay with Cash or UPI QR to the BlueDart courier partner at your doorstep upon package inspection.
                  </p>
                </div>
              )}

              {/* Interactive Gateway Test Controls */}
              <div className="p-4 rounded-2xl bg-[#10101c] border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gold flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Payment Gateway Sandbox (Test Mode)</span>
                  </span>
                  <span className="text-[10px] text-muted">Real-time simulator</span>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-muted block">If testing payment rejection, select bank failure reason:</span>
                  <select
                    value={selectedReasonId}
                    onChange={(e) => setSelectedReasonId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#161626] border border-border/60 text-foreground text-xs focus:outline-none"
                  >
                    {STORE_REJECTION_REASONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        ❌ {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dual Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => executePayment(true)}
                    className="py-3 text-xs font-bold flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pay {formatPrice(total)} (Approve)</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => executePayment(false)}
                    className="py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-rose/50 text-rose-light hover:bg-rose/15 hover:text-white"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose" />
                    <span>Simulate Reject</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Column */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-3xl border border-border/50 space-y-4 text-xs">
              <h3 className="text-base font-bold text-foreground border-b border-border/40 pb-3">Final Payment</h3>
              <div className="space-y-2 text-secondary">
                <div className="flex justify-between">
                  <span>Items Total ({items.length})</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping &amp; Handling</span>
                  <span className="text-emerald-400 font-bold">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="text-foreground uppercase font-bold">{paymentMethod}</span>
                </div>
                <div className="flex justify-between font-black text-base text-foreground pt-3 border-t border-border/30">
                  <span>Payable Now</span>
                  <span className="text-gold text-lg">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-muted space-y-1">
                <p className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Authorized by RBI &amp; NPCI</span>
                </p>
                <p>Instant SMS &amp; WhatsApp dispatch notification upon payment.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== STAGE 2.5: PROCESSING SPINNER ===================== */}
      {stage === 'processing' && (
        <div className="max-w-md mx-auto py-20 text-center space-y-5">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-rose/20 border-t-rose animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-gold/20 border-b-gold animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
            <Lock className="w-7 h-7 text-gold absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-foreground">Authorizing with Payment Gateway...</h2>
            <p className="text-xs text-muted">
              Securely processing {formatPrice(total)} through 256-Bit SSL encryption. Please do not refresh.
            </p>
          </div>
        </div>
      )}

      {/* ===================== STAGE 3A: PAYMENT REJECTED ===================== */}
      {stage === 'failed' && (
        <div className="max-w-2xl mx-auto glass p-8 sm:p-10 rounded-3xl border border-rose/50 space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose/20 border-2 border-rose/60 flex items-center justify-center text-rose shadow-xl shadow-rose/20 mx-auto animate-bounce">
            <AlertCircle className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose/20 text-rose-light border border-rose/40">
              Payment Failed • Error 402
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground pt-1">
              Payment Rejected / Transaction Failed
            </h2>
            <p className="text-xs sm:text-sm text-secondary max-w-md mx-auto">
              Your transaction of <strong className="text-foreground">{formatPrice(total)}</strong> could not be authorized by your bank.
            </p>
          </div>

          {/* Exact Reason Box */}
          <div className="p-4 rounded-2xl bg-rose/10 border border-rose/40 text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-rose-light font-bold">
              <ShieldAlert className="w-4 h-4 text-rose shrink-0" />
              <span>Exact Rejection Reason:</span>
            </div>
            <p className="text-secondary text-xs leading-relaxed bg-[#100a12] p-3 rounded-xl border border-rose/30 font-medium">
              {customFailureReason}
            </p>
            <div className="flex items-center justify-between text-[11px] text-muted pt-1">
              <span>Account Status: <strong>₹0 Debited</strong></span>
              <span>Time: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Safe Reassurance */}
          <p className="text-[11px] text-muted leading-relaxed">
            🔒 <strong>Safe Guarantee:</strong> No money was charged. If any amount got deducted from your account, it will be automatically refunded within 24 business hours.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => setStage('payment')}
              className="py-3 px-6 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose/25"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Payment</span>
            </Button>

            <button
              type="button"
              onClick={() => setStage('shipping')}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs text-secondary hover:text-white transition-colors"
            >
              Change Address / Method
            </button>

            <Link href="/cart">
              <button
                type="button"
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs text-muted hover:text-white transition-colors"
              >
                Return to Bag
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* ===================== STAGE 3B: PAYMENT SUCCESS & ORDER CONFIRMATION ===================== */}
      {stage === 'success' && (
        <div className="max-w-2xl mx-auto glass p-8 sm:p-10 rounded-3xl border-2 border-emerald-500/50 space-y-6 text-center shadow-2xl">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-full h-full rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20 animate-pulse">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <Sparkles className="w-6 h-6 text-gold absolute -top-1 -right-1 animate-bounce" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              Payment Verified • Order Confirmed
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground pt-1">
              Order Placed Successfully! 🎉
            </h2>
            <p className="text-xs sm:text-sm text-secondary max-w-md mx-auto">
              Thank you for shopping at <strong className="text-gold">ISHIKA&apos;S WORLD</strong>! We have emailed order confirmation &amp; tax invoice to <span className="text-rose-light font-bold">{formData.email}</span>.
            </p>
          </div>

          {/* Order Details Receipt */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0f0f18] border border-border/50 text-left space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
              <div>
                <span className="text-[10px] text-muted uppercase font-bold block">Order Number</span>
                <span className="font-mono font-bold text-foreground text-sm">{confirmedOrderId}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted uppercase font-bold block">Air Waybill (Tracking)</span>
                <span className="font-mono font-bold text-emerald-400 text-xs">{confirmedTrackingId}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted uppercase font-bold block">Amount Paid</span>
                <span className="font-bold text-gold text-sm">{formatPrice(placedOrderTotal)}</span>
              </div>
            </div>

            {/* Delivery Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-foreground">Shipment Status: Express Dispatch</span>
              <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-1 font-semibold">
                <span className="py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  ✓ Paid
                </span>
                <span className="py-1 rounded bg-rose/20 text-rose-light border border-rose/40 animate-pulse">
                  Packing
                </span>
                <span className="py-1 rounded bg-white/5 text-muted">
                  Shipped
                </span>
                <span className="py-1 rounded bg-white/5 text-muted">
                  Delivered
                </span>
              </div>
            </div>

            {/* Delivery Address Pill */}
            <div className="pt-2 border-t border-border/30 text-[11px] text-secondary">
              <strong>Delivery to:</strong> {formData.name}, {formData.address}, {formData.city} ({formData.zip}) • +91 {formData.phone}
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link href="/orders" className="flex-1">
              <Button variant="primary" className="w-full py-3 text-xs font-bold shadow-lg shadow-rose/25">
                <Package className="w-4 h-4 mr-1.5" />
                <span>Track My Order in Real-Time</span>
              </Button>
            </Link>

            <Link href="/store" className="flex-1">
              <Button variant="outline" className="w-full py-3 text-xs font-bold">
                <span>Continue Shopping</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
