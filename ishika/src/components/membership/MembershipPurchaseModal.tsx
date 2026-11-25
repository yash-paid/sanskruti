'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  X, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Phone, 
  Mail, 
  ArrowRight, 
  RotateCcw, 
  Lock, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Radio, 
  Flame, 
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useUser } from '@/context/UserContext';
import { submitPayUPayment } from '@/lib/payu-client';
import type { MembershipPlan } from '@/types';

interface MembershipPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: MembershipPlan | null;
  billingCycle: 'monthly' | 'yearly';
}

type Stage = 'details' | 'payment' | 'processing' | 'failed' | 'success';

const REJECTION_REASONS = [
  {
    id: 'timeout',
    title: 'Bank Server Timeout / OTP Expired',
    description: 'The issuing bank did not respond within the 3D Secure session window (Error: TIMEOUT_504).',
  },
  {
    id: 'insufficient',
    title: 'Insufficient Balance in Account',
    description: 'Transaction declined due to inadequate funds in the selected bank account (Error: INSUFFICIENT_FUNDS_01).',
  },
  {
    id: 'bank_declined',
    title: 'Declined by Issuing Bank Security',
    description: 'Card or account security policy blocked the payment. Please contact your bank (Error: BANK_DECLINED_SEC).',
  },
  {
    id: 'upi_pin',
    title: 'Incorrect UPI PIN Entered',
    description: 'Authentication failed because the UPI MPIN entered was incorrect (Error: UPI_AUTH_FAILED).',
  },
];

export function MembershipPurchaseModal({
  isOpen,
  onClose,
  plan,
  billingCycle,
}: MembershipPurchaseModalProps) {
  const { user, updateProfile, setMembershipTier } = useUser();

  const [stage, setStage] = useState<Stage>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('ishq@okhdfcbank');
  
  // Rejection simulation options
  const [selectedReasonId, setSelectedReasonId] = useState<string>(REJECTION_REASONS[0].id);
  const [customFailureReason, setCustomFailureReason] = useState<string>(REJECTION_REASONS[0].description);
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [showTestSandbox, setShowTestSandbox] = useState<boolean>(false);

  // PayU Gateway Integration State
  const [isPayULoading, setIsPayULoading] = useState<boolean>(false);
  const [payUError, setPayUError] = useState<string | null>(null);

  // Check URL callback parameters on mount (PayU return)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      const txnid = params.get('txnid') || 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
      const purchasedTier = params.get('tier') || (params.get('plan') === 'elite' ? 'Elite' : 'VIP');
      setTransactionRef(txnid);
      setMembershipTier(purchasedTier);
      updateProfile({ membershipTier: purchasedTier });
      setStage('success');
    } else if (payment === 'failed') {
      const reason = params.get('reason') || 'Transaction was declined by issuing bank or cancelled on PayU.';
      setCustomFailureReason(reason);
      setTransactionRef(params.get('txnid') || 'TXN-' + Math.floor(10000000 + Math.random() * 90000000));
      setStage('failed');
    }
  }, [setMembershipTier, updateProfile]);

  // Pre-fill user data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('payment') === 'success') {
          setStage('success');
          return;
        } else if (params.get('payment') === 'failed') {
          setStage('failed');
          return;
        }
      }
      setStage('details');
      setName(user?.name || 'Ananya Verma');
      setEmail(user?.email || 'ananya@example.com');
      setPhone('9876543210');
      setTransactionRef('TXN-' + Math.floor(10000000 + Math.random() * 90000000));
      setPayUError(null);
    }
  }, [isOpen, user]);

  const displayPrice = useMemo(() => {
    if (!plan) return 0;
    if (plan.id === 'elite') return 1;
    return billingCycle === 'yearly' ? Math.round(plan.price * 10) : plan.price;
  }, [plan, billingCycle]);

  // Form validations
  const isNameValid = name.trim().length >= 2;
  const isPhoneValid = /^\d{10}$/.test(phone.replace(/\D/g, ''));
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isDetailsComplete = isNameValid && isPhoneValid && isEmailValid;

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDetailsComplete || isPayULoading) return;
    await handlePayUCheckout();
  };

  // PayU Hosted Gateway Checkout
  const handlePayUCheckout = async () => {
    if (!plan) return;
    setIsPayULoading(true);
    setPayUError(null);

    try {
      const response = await fetch('/api/payu/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'membership',
          planId: plan.id,
          amount: displayPrice,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          productTitle: `ISHIKA WORLD ${plan.name} Membership`,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate PayU payment.');
      }

      // Submit hidden form to PayU Hosted Checkout!
      submitPayUPayment(data.actionUrl, data.params);
    } catch (err: any) {
      console.error('[PAYU MEMBERSHIP CHECKOUT ERROR]', err);
      setPayUError(err.message || 'Payment gateway connection error. Please try again.');
      setIsPayULoading(false);
    }
  };

  // Execution: simulate payment outcome
  const executePayment = (shouldSucceed: boolean) => {
    setStage('processing');
    const newRef = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
    setTransactionRef(newRef);

    setTimeout(() => {
      if (shouldSucceed) {
        // Unlock benefits across entire app
        const tierName = plan?.name === 'Ishq Explorer' ? 'Explorer' : plan?.name.includes('Elite') ? 'Elite' : 'VIP';
        setMembershipTier(tierName);
        updateProfile({
          name: name.trim(),
          email: email.trim(),
          membershipTier: tierName,
        });
        setStage('success');
      } else {
        const found = REJECTION_REASONS.find((r) => r.id === selectedReasonId);
        setCustomFailureReason(found ? `${found.title}: ${found.description}` : REJECTION_REASONS[0].description);
        setStage('failed');
      }
    }, 1400);
  };

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-xl rounded-3xl border border-rose/30 bg-[#0a0a12] shadow-2xl overflow-hidden my-auto"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/40 bg-[#0d0d18]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gold/30 to-rose/30 border border-gold/40 flex items-center justify-center text-gold shadow-md">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                Membership Pass Checkout
              </span>
              <h2 className="text-base sm:text-lg font-black text-foreground">
                {plan.name} ({billingCycle === 'yearly' ? 'Annual Pass' : 'Monthly Pass'})
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-foreground transition-colors"
            title="Close Checkout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ===================== STAGE 1: USER DETAILS (NAAM, NUMBER, EMAIL) ===================== */}
        {stage === 'details' && (
          <form onSubmit={handleProceedToPayment} className="p-5 sm:p-6 space-y-5">
            {/* Plan Summary Badge */}
            <div className="p-3.5 rounded-2xl bg-[#121220] border border-border/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{plan.name}</span>
                  <span className="text-xs">{plan.badge}</span>
                  {billingCycle === 'yearly' && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose/20 text-rose-light font-bold">
                      2 Months Free
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted">
                  Billed {billingCycle === 'yearly' ? 'Annually' : 'Monthly'} • Cancel anytime
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-foreground">₹{displayPrice}</span>
                <span className="text-[10px] text-muted block">GST Included</span>
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-3.5">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>Enter Your Details for VIP Activation</span>
                <span className="text-rose">*</span>
              </p>

              {/* 1. Name Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gold" />
                  <span>Full Name (Apna Naam Likhe)</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yashvi Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141422] border border-border/60 text-foreground text-xs sm:text-sm focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose transition-all"
                />
                {!isNameValid && name.length > 0 && (
                  <p className="text-[10px] text-rose">Please enter your real full name.</p>
                )}
              </div>

              {/* 2. Mobile Number Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-rose-light" />
                  <span>Mobile Number (WhatsApp &amp; UPI Updates)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-secondary select-none">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    className="w-full pl-16 pr-3.5 py-2.5 rounded-xl bg-[#141422] border border-border/60 text-foreground text-xs sm:text-sm focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose transition-all tracking-wider font-mono"
                  />
                </div>
                {!isPhoneValid && phone.length > 0 && (
                  <p className="text-[10px] text-rose">Please enter a valid 10-digit mobile number.</p>
                )}
              </div>

              {/* 3. Email Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Email Address (VIP Pass &amp; Invoice will be sent here)</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141422] border border-border/60 text-foreground text-xs sm:text-sm focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose transition-all"
                />
                {!isEmailValid && email.length > 0 && (
                  <p className="text-[10px] text-rose">Please enter a valid email address.</p>
                )}
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-border/30 flex items-center gap-2 text-[11px] text-muted">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant activation right after payment. Safe &amp; 100% encrypted.</span>
            </div>

            {/* Proceed to Pay Button - Immediate Redirect to PayU */}
            <div className="pt-2 space-y-2">
              <Button
                type="submit"
                variant={plan.highlighted ? 'primary' : 'gold'}
                disabled={!isDetailsComplete || isPayULoading}
                className="w-full py-3.5 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-rose/25 bg-gradient-to-r from-rose via-rose-light to-gold text-white hover:opacity-95 transition-all"
              >
                {isPayULoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Redirecting to PayU India...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Proceed to Pay ₹{displayPrice} (PayU)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-muted">
                <span className="font-bold text-foreground">Official PayU Gateway</span>
                <span>•</span>
                <span>UPI (GPay / PhonePe / Paytm)</span>
                <span>•</span>
                <span>Cards &amp; NetBanking</span>
              </div>

              {payUError && (
                <div className="p-2.5 rounded-xl bg-rose/15 border border-rose/40 text-[11px] text-rose flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payUError}</span>
                </div>
              )}
            </div>

            {/* Optional Simulation Controls for testing reject & success without real payment */}
            <div className="pt-2 border-t border-border/30">
              <button
                type="button"
                onClick={() => setShowTestSandbox(!showTestSandbox)}
                className="w-full text-center text-[10px] text-muted hover:text-gold flex items-center justify-center gap-1.5 py-1 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-gold" />
                <span>{showTestSandbox ? 'Hide Test Simulation' : 'Test Mode: Simulate Payment Success / Reject'}</span>
              </button>

              {showTestSandbox && (
                <div className="mt-2 p-3 rounded-2xl bg-[#121220] border border-border/60 space-y-2.5 text-xs animate-fadeIn">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted block">Simulate bank failure reason:</span>
                    <select
                      value={selectedReasonId}
                      onChange={(e) => setSelectedReasonId(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-[#181828] border border-border/60 text-foreground text-xs focus:outline-none"
                    >
                      {REJECTION_REASONS.map((r) => (
                        <option key={r.id} value={r.id}>
                          ❌ {r.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => executePayment(true)}
                      className="py-2 text-[11px] font-bold flex items-center justify-center gap-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Simulate Success</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => executePayment(false)}
                      className="py-2 text-[11px] font-bold flex items-center justify-center gap-1 border-rose/50 text-rose-light hover:bg-rose/15"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose" />
                      <span>Simulate Reject</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}

        {/* ===================== STAGE 2: PAYMENT GATEWAY & SIMULATION ===================== */}
        {stage === 'payment' && (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Customer Summary Pill */}
            <div className="p-3 rounded-xl bg-[#121220] border border-border/50 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <p className="font-bold text-foreground">{name}</p>
                <p className="text-[11px] text-muted">+91 {phone} • {email}</p>
              </div>
              <button
                type="button"
                onClick={() => setStage('details')}
                className="text-[11px] text-rose-light hover:underline font-bold"
              >
                Edit
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'upi'
                      ? 'bg-rose/15 border-rose text-rose-light shadow-md'
                      : 'bg-[#141422] border-border/50 text-muted hover:text-foreground'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Instant UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'card'
                      ? 'bg-rose/15 border-rose text-rose-light shadow-md'
                      : 'bg-[#141422] border-border/50 text-muted hover:text-foreground'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-gold" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'netbanking'
                      ? 'bg-rose/15 border-rose text-rose-light shadow-md'
                      : 'bg-[#141422] border-border/50 text-muted hover:text-foreground'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>NetBanking</span>
                </button>
              </div>
            </div>

            {/* Selected Method Details */}
            {paymentMethod === 'upi' && (
              <div className="p-3.5 rounded-2xl bg-[#141422] border border-border/50 space-y-2 text-xs">
                <span className="text-[11px] text-muted block">Enter UPI ID (Google Pay, PhonePe, Paytm, BHIM):</span>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@okaxis"
                  className="w-full px-3 py-2 rounded-xl bg-[#0e0e18] border border-border/60 text-foreground text-xs focus:outline-none focus:border-rose font-mono"
                />
                <div className="flex items-center gap-2 pt-1 text-[10px] text-muted">
                  <span className="px-2 py-0.5 rounded bg-white/5">GPay</span>
                  <span className="px-2 py-0.5 rounded bg-white/5">PhonePe</span>
                  <span className="px-2 py-0.5 rounded bg-white/5">Paytm</span>
                  <span className="px-2 py-0.5 rounded bg-white/5">BHIM</span>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="p-3.5 rounded-2xl bg-[#141422] border border-border/50 space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-muted block mb-1">Card Number:</span>
                  <input
                    type="text"
                    disabled
                    value="•••• •••• •••• 4242"
                    className="w-full px-3 py-2 rounded-xl bg-[#0e0e18] border border-border/60 text-foreground text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    disabled
                    value="12 / 29"
                    className="w-full px-3 py-2 rounded-xl bg-[#0e0e18] border border-border/60 text-foreground text-xs font-mono"
                  />
                  <input
                    type="text"
                    disabled
                    value="•••"
                    className="w-full px-3 py-2 rounded-xl bg-[#0e0e18] border border-border/60 text-foreground text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'netbanking' && (
              <div className="p-3.5 rounded-2xl bg-[#141422] border border-border/50 space-y-2 text-xs">
                <span className="text-[11px] text-muted block">Select Bank:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="p-2 rounded-lg bg-[#0e0e18] border border-border/50 text-left text-xs font-bold text-foreground">
                    HDFC Bank
                  </button>
                  <button type="button" className="p-2 rounded-lg bg-[#0e0e18] border border-border/50 text-left text-xs font-bold text-foreground">
                    State Bank of India
                  </button>
                  <button type="button" className="p-2 rounded-lg bg-[#0e0e18] border border-border/50 text-left text-xs font-bold text-foreground">
                    ICICI Bank
                  </button>
                  <button type="button" className="p-2 rounded-lg bg-[#0e0e18] border border-border/50 text-left text-xs font-bold text-foreground">
                    Axis Bank
                  </button>
                </div>
              </div>
            )}

            {/* PayU Official Hosted Gateway Action */}
            <div className="space-y-2 pt-1">
              <Button
                type="button"
                variant="primary"
                onClick={handlePayUCheckout}
                disabled={isPayULoading}
                className="w-full py-3.5 text-xs sm:text-sm font-black flex items-center justify-center gap-2 bg-gradient-to-r from-rose via-rose-light to-gold text-white shadow-xl shadow-rose/30 hover:opacity-95 transition-all"
              >
                {isPayULoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Connecting to PayU India...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-white" />
                    <span>Pay ₹{displayPrice} with PayU Gateway</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-muted">
                <span className="font-bold text-foreground">PayU India Official</span>
                <span>•</span>
                <span>UPI (GPay, PhonePe, Paytm, BHIM)</span>
                <span>•</span>
                <span>Cards &amp; NetBanking</span>
              </div>

              {payUError && (
                <div className="p-2.5 rounded-xl bg-rose/15 border border-rose/40 text-[11px] text-rose flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payUError}</span>
                </div>
              )}
            </div>

            {/* Test Simulation Controls: Success vs Reject with Reason */}
            <div className="p-3.5 rounded-2xl bg-[#121220] border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-gold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Payment Test Sandbox (Demo Mode)</span>
                </span>
                <span className="text-[10px] text-muted">Test both cases instantly</span>
              </div>

              {/* Rejection Reason Selector */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted block">If testing rejection, choose reason:</span>
                <select
                  value={selectedReasonId}
                  onChange={(e) => setSelectedReasonId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#181828] border border-border/60 text-foreground text-xs focus:outline-none"
                >
                  {REJECTION_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      ❌ {r.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dual Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => executePayment(true)}
                  className="py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-md shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pay ₹{displayPrice} (Success)</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => executePayment(false)}
                  className="py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-rose/50 text-rose-light hover:bg-rose/15 hover:text-white"
                >
                  <ShieldAlert className="w-4 h-4 text-rose" />
                  <span>Simulate Reject</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted pt-1">
              <button
                type="button"
                onClick={() => setStage('details')}
                className="hover:underline text-secondary"
              >
                ← Back to Details
              </button>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                256-Bit Bank Grade SSL
              </span>
            </div>
          </div>
        )}

        {/* ===================== STAGE 2.5: PROCESSING SPINNER ===================== */}
        {stage === 'processing' && (
          <div className="p-10 sm:p-14 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-rose/20 border-t-rose animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-gold/20 border-b-gold animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
              <Crown className="w-6 h-6 text-gold absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Contacting Bank Gateway...</h3>
              <p className="text-xs text-muted">Securing VIP transaction of ₹{displayPrice}. Please do not refresh.</p>
            </div>
          </div>
        )}

        {/* ===================== STAGE 3A: PAYMENT REJECTED (REASON DIKHAYE) ===================== */}
        {stage === 'failed' && (
          <div className="p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-rose/20 border-2 border-rose/60 flex items-center justify-center text-rose shadow-xl shadow-rose/20 animate-bounce">
                <AlertCircle className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose/20 text-rose-light border border-rose/40">
                  Payment Failed • Ref #{transactionRef}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-foreground pt-1">
                  Payment Rejected / Transaction Failed
                </h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Your payment of <strong className="text-foreground">₹{displayPrice}</strong> for {plan.name} could not be completed by the bank.
                </p>
              </div>
            </div>

            {/* Rejection Reason Card */}
            <div className="p-4 rounded-2xl bg-rose/10 border border-rose/40 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-light font-bold">
                <ShieldAlert className="w-4 h-4 text-rose shrink-0" />
                <span>Exact Rejection Reason:</span>
              </div>
              <p className="text-secondary text-xs leading-relaxed bg-[#100a12] p-3 rounded-xl border border-rose/30 font-medium">
                {customFailureReason}
              </p>
              <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                <span>Account Status: <strong>₹0 Deducted</strong></span>
                <span>Time: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Reassurance */}
            <p className="text-[11px] text-muted text-center leading-relaxed">
              🔒 <strong>Safe Guarantee:</strong> No money was charged. If any amount got debited from your bank account, it will be automatically refunded within 24 hours.
            </p>

            {/* Action Buttons to Retry or Close */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => setStage('payment')}
                className="flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose/25"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Payment</span>
              </Button>

              <button
                type="button"
                onClick={() => setStage('details')}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs text-secondary hover:text-white transition-colors"
              >
                Change Details
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs text-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ===================== STAGE 3B: PAYMENT SUCCESS & BENEFITS UNLOCKED ===================== */}
        {stage === 'success' && (
          <div className="p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-3">
              {/* Confetti & Golden Sparkles Animation Header */}
              <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20">
                <div className="w-full h-full rounded-3xl bg-gradient-to-tr from-gold/30 via-rose/20 to-gold/40 border-2 border-gold/60 flex items-center justify-center text-gold shadow-2xl shadow-gold/25 animate-pulse">
                  <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-gold" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center text-white shadow">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-gradient-to-r from-gold/20 via-rose/20 to-gold/20 text-gold-light border border-gold/40 shadow-sm">
                  ★ VIP ACCESS UNLOCKED • ACTIVE NOW ★
                </span>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground pt-1">
                  Congratulations, {name}! 🎉
                </h3>
                <p className="text-xs sm:text-sm text-secondary max-w-md mx-auto">
                  You are now an official member of <strong className="text-gold-light">ISHIKA&apos;S WORLD {plan.name}</strong>!
                </p>
              </div>

              {/* Receipt Summary */}
              <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-border/40 text-[11px] text-muted">
                <span>Ref: <strong className="text-foreground">{transactionRef}</strong></span>
                <span>•</span>
                <span>Paid: <strong className="text-emerald-400">₹{displayPrice}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-emerald-400">Verified ✅</strong></span>
              </div>
            </div>

            {/* All Benefits Unlocked Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#141424] to-[#0c0c16] border border-gold/40 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  <span>All Benefits Unlocked On Your Account:</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  All Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-secondary">
                <div className="flex items-start gap-2 p-2 rounded-xl bg-white/5">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground block text-xs">VIP Creator Terrace Chat</strong>
                    <span className="text-[10px] text-muted">Direct messaging room with Ishika</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-xl bg-white/5">
                  <CheckCircle2 className="w-4 h-4 text-rose-light shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground block text-xs">Uncut Secret Audio Vault</strong>
                    <span className="text-[10px] text-muted">Raw takes &amp; alternate story endings</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-xl bg-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground block text-xs">4K Ultra HD &amp; Early Access</strong>
                    <span className="text-[10px] text-muted">All locked video episodes unlocked</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-xl bg-white/5">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground block text-xs">20% Off Creator Merch</strong>
                    <span className="text-[10px] text-muted">VIP discount auto-applied in store</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-xl bg-white/5 sm:col-span-2">
                  <CheckCircle2 className="w-4 h-4 text-gold-light shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground block text-xs">Golden Creator Crown Badge</strong>
                    <span className="text-[10px] text-muted">Displayed beside your name across community &amp; profile</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="space-y-2 pt-1">
              <Link href="/community" onClick={onClose} className="block">
                <Button
                  variant="gold"
                  className="w-full py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-gold/25"
                >
                  <Crown className="w-4 h-4" />
                  <span>Enter VIP Creator Terrace Now (Chat)</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/videos" onClick={onClose} className="block">
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs font-bold text-foreground transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Watch VIP Videos</span>
                  </button>
                </Link>

                <Link href="/my-membership" onClick={onClose} className="block">
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs font-bold text-foreground transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>View VIP Pass</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
