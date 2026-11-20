import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Download, MessageCircle, ArrowRight, ShieldCheck, FileCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { orders } = useStore();

  const order = orders.find((o) => o.orderId === orderId) || orders[0] || {
    orderId: orderId || 'SKT-882018',
    date: new Date().toISOString(),
    customer: { name: 'Valued Customer', phone: '8820182713', email: 'customer@gmail.com' },
    items: [],
    total: 147,
    status: 'Completed (Verified)',
    downloadReady: true
  };

  return (
    <div className="py-14 sm:py-20 bg-gray-50/50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Success Banner */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={36} />
          </div>
          
          <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider">
            Payment Verified & Completed
          </span>

          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Thank You for Your Order!
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
            Order <strong className="text-gray-900">#{order.orderId}</strong> has been successfully placed. Your digital files are ready for instant download below.
          </p>

          {/* Instant Cloud Download CTA */}
          <div className="pt-4 max-w-md mx-auto">
            <a
              href="https://drive.google.com/drive/folders/febric-instant-downloads"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-black py-4 px-6 rounded-full text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Download size={18} />
              <span>⚡ Access & Download Your Bundle (Google Drive)</span>
            </a>
          </div>

          <p className="text-[11px] text-gray-400">
            A permanent backup link has also been sent to <strong>{order.customer?.email}</strong> and WhatsApp.
          </p>
        </div>

        {/* Order Details Receipt */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Order Receipt</h2>
              <span className="text-xs text-gray-400">{new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {order.status}
            </span>
          </div>

          {/* Purchased Items */}
          <div className="space-y-3 divide-y divide-gray-50">
            {order.items.map((item, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{item.title}</h4>
                    <span className="text-[11px] text-gray-400">Qty: {item.quantity || 1} • Lifetime Access</span>
                  </div>
                </div>
                <span className="text-xs font-black text-gray-900">
                  ₹{(item.salePrice || 147) * (item.quantity || 1)}
                </span>
              </div>
            ))}
          </div>

          {/* Customer & Total info */}
          <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Customer Name</span>
              <span className="font-bold text-gray-800">{order.customer?.name}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>WhatsApp Contact</span>
              <span className="font-bold text-gray-800">{order.customer?.phone}</span>
            </div>
            <div className="flex justify-between text-base font-black text-gray-900 pt-3 border-t border-gray-100">
              <span>Total Paid</span>
              <span className="text-febric-coral text-lg font-black">₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Customer Support CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-emerald-50 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <MessageCircle size={20} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-emerald-900">Need Help Accessing Files?</h4>
              <p className="text-xs text-emerald-700">Chat with our dedicated WhatsApp support team anytime.</p>
            </div>
          </div>
          <a
            href={`https://wa.me/918820182713?text=Hello%20Sanskruti%20Store%2C%20I%20have%20an%20inquiry%20regarding%20my%20Order%20${order.orderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-full whitespace-nowrap shadow-sm transition-colors"
          >
            Chat on WhatsApp
          </a>
        </div>

        <div className="text-center pt-2">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-febric-coral"
          >
            <span>Continue Shopping for More Bundles</span>
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </div>
  );
}
