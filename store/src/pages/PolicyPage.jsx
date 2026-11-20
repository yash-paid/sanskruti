import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, FileText, RefreshCw, Truck } from 'lucide-react';

const POLICY_DATA = {
  '/privacy-policy': {
    title: 'Privacy Policy',
    subtitle: 'How Sanskruti Store protects and manages your personal information',
    icon: ShieldCheck,
    sections: [
      {
        heading: 'Information We Collect',
        content: 'When you purchase digital products on Sanskruti Store, we collect your name, email address, and WhatsApp mobile number solely to provide digital product downloads, order invoices, and customer support.'
      },
      {
        heading: 'How We Use Your Data',
        content: 'Your contact details are used strictly to send instant Google Drive download links, transaction receipts, and vital product update notices. We never sell, rent, or trade your personal data with third-party advertising brokers.'
      },
      {
        heading: 'Payment Security',
        content: 'We do not store your credit/debit card numbers or UPI PINs on our servers. All financial transactions are securely processed through RBI-approved Indian payment gateways using 256-bit bank-grade SSL encryption.'
      },
      {
        heading: 'Cookies & Analytics',
        content: 'We use basic performance cookies to remember shopping cart items and improve website navigation speed. You can disable cookies in your browser settings at any time.'
      }
    ]
  },
  '/terms': {
    title: 'Terms & Conditions',
    subtitle: 'Terms governing the purchase and licensing of Sanskruti Store digital products',
    icon: FileText,
    sections: [
      {
        heading: 'Digital Product Licensing',
        content: 'Upon successful purchase, Sanskruti Store grants you a non-exclusive, worldwide commercial license to use, publish, and monetize the video reels, PowerPoint infographics, and worksheets on your social media channels (Instagram, YouTube, Facebook, TikTok) or client projects.'
      },
      {
        heading: 'Restrictions on Reselling Raw Files',
        content: 'You may monetize the final content across social platforms. However, you are strictly prohibited from reselling or distributing the raw bundled files as an identical standalone competitor store pack.'
      },
      {
        heading: 'Lifetime Cloud Access',
        content: 'Buyers receive permanent cloud link access to their purchased bundles. We reserve the right to periodically update file links to maintain server speed and security.'
      },
      {
        heading: 'Governing Law',
        content: 'These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the competent courts in India.'
      }
    ]
  },
  '/refund-policy': {
    title: 'Refund & Returns Policy',
    subtitle: 'Our digital delivery refund guidelines and customer satisfaction guarantee',
    icon: RefreshCw,
    sections: [
      {
        heading: 'Digital Products Policy',
        content: 'Because Sanskruti Store sells irrevocable digital goods that are delivered instantly via cloud download links, standard physical return policies do not apply once the files have been accessed.'
      },
      {
        heading: 'Eligibility for Full Refund or Replacement',
        content: 'We provide an unconditional 100% full refund or replacement under the following conditions: (1) Corrupt or unplayable file archive that our technical support cannot rectify within 24 hours; (2) Duplicate payment charged by the gateway for a single order.'
      },
      {
        heading: 'How to Request Assistance',
        content: 'To request support or report an issue with your download, contact us on WhatsApp (+91 88201 82713) or email support@sanskrutiservice.in with your Order ID and screenshot. Our team will resolve it within a few hours.'
      }
    ]
  },
  '/shipping-policy': {
    title: 'Shipping & Delivery Policy',
    subtitle: 'Instant digital delivery details for all purchases',
    icon: Truck,
    sections: [
      {
        heading: '100% Digital Delivery (Zero Physical Shipping)',
        content: 'Sanskruti Store deals exclusively in downloadable digital resources (video packs, worksheets, PowerPoint slide decks). No physical CDs, USB drives, or parcels are shipped to your physical address.'
      },
      {
        heading: 'Delivery Timeframe',
        content: 'Instant! The moment your payment is confirmed by the payment gateway, you are immediately redirected to your download confirmation screen with direct Google Drive access buttons.'
      },
      {
        heading: 'Backup Delivery via Email & WhatsApp',
        content: 'A permanent digital delivery receipt containing your folder download URL is also dispatched to your registered email address and WhatsApp number within 60 seconds.'
      }
    ]
  }
};

export default function PolicyPage() {
  const location = useLocation();
  const policy = POLICY_DATA[location.pathname] || POLICY_DATA['/privacy-policy'];
  const Icon = policy.icon;

  return (
    <div className="py-12 sm:py-20 bg-gray-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Link to="/" className="hover:text-febric-coral">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">{policy.title}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-febric-coral/10 text-febric-coral flex items-center justify-center">
            <Icon size={24} />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
            {policy.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            {policy.subtitle}
          </p>
        </div>

        {/* Content Sections */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm space-y-8 text-sm text-gray-700 leading-relaxed">
          {policy.sections.map((sec, idx) => (
            <div key={idx} className="space-y-2 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
              <h2 className="text-base font-bold text-gray-900">
                {idx + 1}. {sec.heading}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {sec.content}
              </p>
            </div>
          ))}

          <div className="pt-4 text-xs text-gray-400">
            Last Updated: November 2026 • Sanskruti Store Legal Team
          </div>
        </div>

      </div>
    </div>
  );
}
