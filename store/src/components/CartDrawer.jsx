import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, cartCount, cartTotal, cartOriginalTotal, updateQuantity, removeFromCart } = useStore();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const totalSaved = Math.max(0, cartOriginalTotal - cartTotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-febric-coral" />
              <h2 className="text-base font-bold text-gray-900">Your Cart</h2>
              <span className="bg-febric-coral text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                  <ShoppingBag size={32} />
                </div>
                <h3 className="text-base font-bold text-gray-800">Your cart is empty</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Looks like you haven't added any digital reels or worksheet bundles to your cart yet.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/shop');
                  }}
                  className="inline-flex items-center gap-2 bg-febric-coral hover:bg-febric-pink text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all"
                >
                  <span>Explore Bundles</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-3.5 p-3 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-gray-50 transition-colors">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate" title={item.title}>
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-black text-febric-dark">₹{item.salePrice}</span>
                      <span className="text-[11px] text-gray-400 line-through">₹{item.regularPrice}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                        {item.badge}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:bg-gray-100 text-gray-600"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white space-y-3">
              {totalSaved > 0 && (
                <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg text-center">
                  🎉 You are saving <strong>₹{totalSaved}</strong> on this order!
                </div>
              )}

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery</span>
                  <span className="font-bold text-emerald-600 uppercase text-[10px]">Instant Digital Access (FREE)</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total Amount</span>
                  <span className="text-febric-coral text-base font-black">₹{cartTotal}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full bg-gradient-to-r from-febric-coral to-febric-pink hover:opacity-95 text-white font-bold py-3 rounded-full text-xs uppercase tracking-wider shadow-lg shadow-febric-coral/20 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/cart');
                  }}
                  className="w-full text-center text-xs font-semibold text-gray-600 hover:text-febric-coral py-1.5 transition-colors"
                >
                  View Full Shopping Cart & Enter Coupon
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>100% Verified Secure Cloud Access</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
