'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Crown, Check, ArrowRight, ShieldCheck, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useUser } from '@/context/UserContext';
import { MOCK_PLANS } from '@/lib/mock-data';
import { MembershipPurchaseModal } from '@/components/membership/MembershipPurchaseModal';

export default function MyMembershipPage() {
  const { user } = useUser();
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const currentPlan = MOCK_PLANS.find((p) => p.name === user?.membershipTier) || MOCK_PLANS[1];
  const elitePlan = useMemo(() => MOCK_PLANS.find((p) => p.id === 'elite') || MOCK_PLANS[2], []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div>
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Profile</span>
        </Link>
        <h1 className="text-2xl sm:text-4xl font-black text-foreground mt-2">My Membership Subscription</h1>
      </div>

      {/* Active Membership Hero Card */}
      <div className="glass rounded-3xl p-8 sm:p-10 border-2 border-rose/50 relative overflow-hidden shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="premium">Active Subscription</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">{currentPlan.name} Plan</h2>
            <p className="text-xs text-muted">₹{currentPlan.price}/month • Auto-renews on Dec 15, 2026</p>
          </div>
          <Button variant="gold" size="sm" onClick={() => setIsPurchaseModalOpen(true)}>
            <Crown className="w-4 h-4" />
            <span>Upgrade to Elite Tier</span>
          </Button>
        </div>

        <div className="pt-4 border-t border-border/40">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Included Benefits</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-secondary">
            {currentPlan.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-rose shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Billing Invoices Table */}
      <div className="glass rounded-3xl p-6 sm:p-8 border border-border/50 space-y-4">
        <h3 className="text-base font-bold text-foreground">Recent Subscription Billing History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted">
                <th className="py-3">Invoice ID</th>
                <th className="py-3">Date</th>
                <th className="py-3">Plan</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-secondary">
              {[
                { id: 'INV-2026-1145', date: 'Nov 15, 2026', plan: 'VIP Monthly', amount: '₹799', status: 'Paid' },
                { id: 'INV-2026-1021', date: 'Oct 15, 2026', plan: 'VIP Monthly', amount: '₹799', status: 'Paid' },
                { id: 'INV-2026-0911', date: 'Sep 15, 2026', plan: 'VIP Monthly', amount: '₹799', status: 'Paid' },
              ].map((inv) => (
                <tr key={inv.id}>
                  <td className="py-3 font-mono text-foreground">{inv.id}</td>
                  <td className="py-3">{inv.date}</td>
                  <td className="py-3">{inv.plan}</td>
                  <td className="py-3 font-semibold text-foreground">{inv.amount}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-[10px]">
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 flex justify-between items-center text-xs text-muted border-t border-border/40">
          <button
            onClick={() => alert('Subscription cancellation is demo-protected.')}
            className="text-rose hover:underline"
          >
            Cancel Subscription
          </button>
          <span>Need help? Contact hello@ishikasworld.com</span>
        </div>
      </div>

      {/* Upgrade Payment Gateway Modal */}
      <MembershipPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        plan={elitePlan}
        billingCycle="monthly"
      />
    </div>
  );
}
