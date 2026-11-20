import React from 'react';
import { Link } from 'react-router-dom';
import { User, Package, Download, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function MyAccountPage() {
  const { orders } = useStore();

  return (
    <div className="py-12 sm:py-20 bg-gray-50/60 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-febric-coral/10 text-febric-coral flex items-center justify-center">
              <User size={28} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">Customer Dashboard</h1>
              <p className="text-xs text-gray-500">Manage your digital purchases, downloads & invoices</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/shop"
              className="bg-febric-dark hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors"
            >
              Shop More
            </Link>
          </div>
        </div>

        {/* Orders & Downloads List */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Package size={18} className="text-febric-coral" />
              <span>Your Purchased Digital Bundles ({orders.length})</span>
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Package size={36} className="mx-auto text-gray-300" />
              <h3 className="text-sm font-bold text-gray-800">No orders placed yet</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Once you place an order, your Google Drive download access links and receipts will appear here permanently.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-febric-coral hover:underline pt-2"
              >
                <span>Browse Digital Products</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.orderId}
                  className="rounded-2xl border border-gray-100 p-5 bg-gray-50/50 space-y-4 hover:border-gray-200 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200/60 text-xs">
                    <div>
                      <span className="font-extrabold text-gray-900">Order #{order.orderId}</span>
                      <span className="text-gray-400 ml-2">
                        • {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {order.status}
                      </span>
                      <span className="font-black text-gray-900">₹{order.total}</span>
                    </div>
                  </div>

                  {/* Items in this order */}
                  <div className="space-y-3">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <img src={it.image} alt={it.title} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                          <span className="font-bold text-gray-800 line-clamp-1">{it.title}</span>
                        </div>
                        <a
                          href={it.downloadUrl || "https://drive.google.com/drive/folders/febric-downloads"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-febric-coral hover:bg-febric-pink text-white font-bold text-[11px] px-3.5 py-1.5 rounded-full transition-all flex-shrink-0 shadow-sm"
                        >
                          <Download size={13} />
                          <span>Download Files</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
