'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Crown, Check, Sparkles, HelpCircle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MOCK_PLANS, MOCK_FAQS } from '@/lib/mock-data';
import { useUser } from '@/context/UserContext';
import { MembershipPurchaseModal } from '@/components/membership/MembershipPurchaseModal';
import type { MembershipPlan } from '@/types';

export default function MembershipPage() {
  const { user } = useUser();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState<MembershipPlan | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleOpenPurchase = (plan: MembershipPlan) => {
    setSelectedPlanForPurchase(plan);
    setIsPurchaseModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="gold">
          <Crown className="w-3.5 h-3.5 mr-1" />
          VIP Experience
        </Badge>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-foreground">
          Choose Your Level of Access
        </h1>
        <p className="text-secondary text-sm sm:text-base leading-relaxed">
          Support Ishika directly and unlock unfiltered journal entries, private monthly livestreams, exclusive merch discounts, and direct community rooms.
        </p>

        {/* Billing Toggle */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span className={`text-xs font-semibold ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted'}`}>
            Billed Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-12 h-6 rounded-full bg-elevated border border-border p-1 relative transition-colors"
          >
            <div
              className={`w-4 h-4 rounded-full bg-rose transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-semibold flex items-center gap-1 ${billingCycle === 'yearly' ? 'text-foreground' : 'text-muted'}`}>
            <span>Billed Annually</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose/20 text-rose-light font-bold">2 Months Free</span>
          </span>
        </div>
      </div>

      {/* 3 Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {MOCK_PLANS.map((plan) => {
          const isCurrentTier = user?.membershipTier === plan.name;
          const displayPrice = billingCycle === 'yearly' ? Math.round(plan.price * 10) : plan.price;
          const periodText = billingCycle === 'yearly' ? 'yr' : 'mo';

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.highlighted
                  ? 'glass border-2 border-rose/60 shadow-2xl shadow-rose/15 md:-translate-y-4 bg-card/90'
                  : 'glass border border-border/60 hover:border-border bg-card/60'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-rose text-white text-xs font-bold shadow-lg shadow-rose/30">
                  Most Popular Choice
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted mt-1">{plan.description}</p>
                  </div>
                  <span className="text-2xl font-serif text-gold">{plan.badge}</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-foreground">₹{displayPrice}</span>
                  <span className="text-xs text-muted">/{periodText}</span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-border/40 text-xs">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-secondary">
                      <Check className="w-4 h-4 text-rose shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                {isCurrentTier ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Current Active Plan</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full text-xs font-bold hover:bg-white/10"
                      onClick={() => handleOpenPurchase(plan)}
                    >
                      Renew / Extend Pass
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant={plan.highlighted ? 'primary' : plan.name.includes('Elite') ? 'gold' : 'outline'}
                    className="w-full text-xs font-bold shadow-md shadow-rose/15"
                    onClick={() => handleOpenPurchase(plan)}
                  >
                    {user?.membershipTier && user.membershipTier !== 'Free'
                      ? `Switch to ${plan.name}`
                      : `Subscribe to ${plan.name}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <section className="glass rounded-3xl p-8 sm:p-12 border border-border/50 space-y-6">
        <h2 className="text-2xl font-bold text-foreground text-center">Comprehensive Tier Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-4 font-semibold text-muted">Benefit Feature</th>
                <th className="py-4 font-bold text-purple-400 text-center">Explorer</th>
                <th className="py-4 font-bold text-rose-light text-center">VIP</th>
                <th className="py-4 font-bold text-gold-light text-center">Elite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-secondary">
              {[
                { feature: 'Public Video Streams', e: 'Unlimited', v: 'Unlimited', el: 'Unlimited' },
                { feature: 'Exclusive VIP Vault Access', e: '5/mo', v: 'Unlimited', el: 'Unlimited' },
                { feature: 'Community Chat Access', e: 'General', v: 'VIP Lounges', el: 'All + Elite Circle' },
                { feature: 'Merchandise Discount', e: '—', v: '10% OFF', el: '25% OFF' },
                { feature: 'Worldwide Shipping', e: 'Standard', v: 'Standard', el: '100% Free' },
                { feature: 'Personal Video Messages', e: '—', v: '—', el: 'Monthly Private' },
                { feature: 'Quarterly Shoutouts', e: '—', v: '—', el: 'Included' },
                { feature: 'Annual Care Package', e: '—', v: '—', el: 'Delivered Home' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-medium text-foreground">{row.feature}</td>
                  <td className="py-3 text-center">{row.e}</td>
                  <td className="py-3 text-center font-semibold text-rose-light">{row.v}</td>
                  <td className="py-3 text-center font-semibold text-gold-light">{row.el}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-muted">Everything you need to know about billing, cancellations, and perks.</p>
        </div>

        <div className="space-y-3">
          {MOCK_FAQS.map((faq, idx) => (
            <div key={idx} className="rounded-2xl glass border border-border/50 overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-foreground hover:text-rose-light transition-colors"
              >
                <span>{faq.question}</span>
                {expandedFaq === idx ? <ChevronUp className="w-4 h-4 text-rose shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted shrink-0" />}
              </button>
              {expandedFaq === idx && (
                <div className="px-5 pb-5 text-xs text-secondary leading-relaxed border-t border-border/40 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Membership Purchase & Verification Checkout Modal */}
      <MembershipPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        plan={selectedPlanForPurchase}
        billingCycle={billingCycle}
      />
    </div>
  );
}
