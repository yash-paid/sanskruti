'use client';

import { useState } from 'react';
import { Mail, Camera, MessageCircle, Send, CheckCircle2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { BRAND } from '@/lib/constants';
import { MOCK_FAQS } from '@/lib/mock-data';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="premium">Direct Creator Care</Badge>
        <h1 className="text-3xl sm:text-5xl font-black text-foreground">Contact &amp; Support</h1>
        <p className="text-secondary text-sm sm:text-base leading-relaxed">
          Have questions about your merchandise order, VIP membership, or brand partnerships? Ishika&apos;s team is here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact Channels */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border border-border/50 space-y-4">
            <h3 className="text-base font-bold text-foreground">Direct Inquiries</h3>
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 text-secondary">
                <Mail className="w-4 h-4 text-rose shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">General &amp; Orders</p>
                  <p className="text-muted">{BRAND.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-secondary">
                <Camera className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Official Instagram</p>
                  <p className="text-muted">{BRAND.instagram}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-secondary">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">VIP Priority Desk</p>
                  <p className="text-muted">Response guaranteed within 6 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 glass p-6 sm:p-10 rounded-3xl border border-border/50">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-xl font-bold text-foreground">Message Sent Successfully!</h3>
              <p className="text-xs text-secondary max-w-sm mx-auto">
                Thank you for reaching out. A representative from Ishika&apos;s team will respond to your email within 24 hours.
              </p>
              <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-bold text-foreground mb-4">Send a Message</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Your Name" required placeholder="e.g. Rahul Sharma" />
                <Input label="Email Address" type="email" required placeholder="e.g. rahul@example.com" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-secondary">Inquiry Category</label>
                <select className="w-full px-4 py-3 bg-elevated border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-rose">
                  <option>Merchandise Order Tracking / Returns</option>
                  <option>VIP / Elite Membership Support</option>
                  <option>Business Collaboration / Brand Sponsorship</option>
                  <option>General Feedback for Ishika</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-secondary">Your Message</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tell us how we can help..."
                  className="w-full px-4 py-3 bg-elevated border border-border rounded-xl text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose"
                />
              </div>
              <Button type="submit" variant="primary" size="lg">
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* FAQs */}
      <section className="space-y-6 max-w-3xl mx-auto pt-8">
        <h2 className="text-2xl font-bold text-foreground text-center">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {MOCK_FAQS.slice(0, 5).map((faq, idx) => (
            <div key={idx} className="rounded-2xl glass border border-border/50 overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
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
    </div>
  );
}
