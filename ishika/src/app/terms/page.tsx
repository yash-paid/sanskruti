import Link from 'next/link';
import { BRAND } from '@/lib/constants';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-secondary leading-relaxed text-sm">
      <div className="space-y-2 border-b border-border/40 pb-6">
        <h1 className="text-3xl sm:text-5xl font-black text-foreground">Terms &amp; Conditions</h1>
        <p className="text-xs text-muted">Last Updated: November 25, 2026 • Governing Digital Access &amp; Commerce</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
        <p>
          By accessing or using {BRAND.name}, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please do not use the service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">2. Membership Subscriptions</h2>
        <p>
          Membership plans (Explorer, VIP, Elite) provide access to tiered digital content, community chat privileges, and merchandise discounts. Subscriptions renew automatically unless cancelled prior to the renewal date via your account settings.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">3. Intellectual Property Rights</h2>
        <p>
          All video streams, behind-the-scenes recordings, photography, artwork, audio tracks, and merchandise designs published on {BRAND.name} are the exclusive intellectual property of Ishika and her production entity. Unauthorized reproduction, re-uploading, or public broadcasting is strictly prohibited.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">4. Merchandise Sales &amp; Worldwide Shipping</h2>
        <p>
          All merchandise purchases are subject to item availability. Prices are stated in Indian Rupees (INR) with worldwide shipping options. Physical orders damaged during transit are eligible for replacement within 14 days of delivery.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">5. Community Guidelines</h2>
        <p>
          Our community rooms are designed as respectful, positive spaces. Any harassment, spamming, unauthorized advertising, hate speech, or sharing of explicit material will result in immediate termination of account access without refund.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">6. Contact Information</h2>
        <p>
          For legal inquiries regarding these terms, contact{' '}
          <a href={`mailto:${BRAND.email}`} className="text-rose-light hover:underline font-semibold">
            {BRAND.email}
          </a>.
        </p>
      </section>
    </div>
  );
}
