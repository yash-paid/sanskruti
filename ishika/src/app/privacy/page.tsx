import Link from 'next/link';
import { BRAND } from '@/lib/constants';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-secondary leading-relaxed text-sm">
      <div className="space-y-2 border-b border-border/40 pb-6">
        <h1 className="text-3xl sm:text-5xl font-black text-foreground">Privacy Policy</h1>
        <p className="text-xs text-muted">Last Updated: November 25, 2026 • Effective Worldwide</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">1. Introduction</h2>
        <p>
          Welcome to {BRAND.name} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We deeply respect your privacy and are committed to protecting the personal data of our fans, members, and customers. This Privacy Policy details the types of information we collect, how it is safeguarded, and your choices regarding your data.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">2. Information We Collect</h2>
        <p>We may collect information when you interact with our platform, including:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Account Details:</strong> Name, email address, password, and profile preferences when you register.</li>
          <li><strong>Transaction Data:</strong> Merchandise orders, shipping addresses, phone numbers, and payment verification records.</li>
          <li><strong>Usage Activity:</strong> Video watch history, community chat contributions, and membership tier activity.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">3. How We Use Your Information</h2>
        <p>
          Your information is used solely to deliver a high-quality creator experience: processing your orders, granting VIP video access, facilitating community chat rooms, sending important platform updates, and improving our streaming services.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">4. Data Sharing &amp; Third Parties</h2>
        <p>
          We never sell your personal information. We only share minimal necessary information with vetted providers (e.g. shipping carriers for physical merchandise delivery, secure payment processors).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">5. Data Security</h2>
        <p>
          All communications are secured using industry-standard TLS/SSL 256-bit encryption. Account data is housed in protected cloud environments with multi-factor administrative controls.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">6. Contact Us</h2>
        <p>
          If you have questions regarding this Privacy Policy, please email our data protection desk at{' '}
          <a href={`mailto:${BRAND.email}`} className="text-rose-light hover:underline font-semibold">
            {BRAND.email}
          </a>.
        </p>
      </section>
    </div>
  );
}
