import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Clock, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function ContactPage() {
  const { showToast } = useStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Your message has been sent successfully!');
  };

  return (
    <div className="py-12 sm:py-20 bg-gray-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Link to="/" className="hover:text-febric-coral">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">Contact Support</span>
        </nav>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-febric-coral bg-febric-coral/10 px-3 py-1 rounded-full">
            We're Here To Help You
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Get in <span className="text-febric-coral">Touch</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Have a question about our digital reels bundles, worksheets or need assistance accessing your downloads? Our team is available 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Details Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* WhatsApp Card */}
            <a
              href="https://wa.me/918820182713?text=Hello%20Sanskruti%20Store%2C%20I%20need%20assistance%20with%20my%20digital%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-start gap-4 hover:shadow-md transition-all group block"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <MessageCircle size={24} />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Fastest Support</span>
                <h3 className="text-base font-black text-gray-900">WhatsApp Support</h3>
                <p className="text-xs text-gray-600 font-semibold">+91 88201 82713</p>
                <p className="text-[11px] text-gray-500">Average response time: Under 10 minutes</p>
              </div>
            </a>

            {/* Email Card */}
            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-febric-coral/10 text-febric-coral flex items-center justify-center flex-shrink-0">
                <Mail size={24} />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email Inquiry</span>
                <h3 className="text-base font-black text-gray-900">Email Support</h3>
                <p className="text-xs text-gray-700 font-semibold">support@sanskrutiservice.in</p>
                <p className="text-[11px] text-gray-500">For billing, enterprise licenses & general questions</p>
              </div>
            </div>

            {/* Working Hours */}
            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0">
                <Clock size={24} />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Availability</span>
                <h3 className="text-base font-black text-gray-900">24/7 Digital Delivery</h3>
                <p className="text-xs text-gray-600">Downloads are automated 24 hours a day, 7 days a week.</p>
              </div>
            </div>

          </div>

          {/* Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 mb-2">Send Us a Direct Message</h2>
            <p className="text-xs text-gray-500 mb-6">Fill out the quick form below and our customer team will get back to you promptly.</p>

            {submitted ? (
              <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold text-emerald-900">Message Received!</h3>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                  Thank you! Our support executive will reply to your email or WhatsApp number shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-bold text-emerald-800 underline pt-2"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-febric-coral"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      WhatsApp Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-febric-coral"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-febric-coral"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Your Message / Inquiry *
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder="How can we help you regarding your order or digital bundles?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-febric-coral"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-febric-dark hover:bg-black text-white font-black py-4 rounded-full text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Send size={15} />
                  <span>Send Inquiry</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
