import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function CartPage() {
  const {
    cart,
    cartCount,
    cartSubtotal,
    cartOriginalTotal,
    cartTotal,
    discountAmount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    updateQuantity,
    removeFromCart
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const navigate = useNavigate();

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput.trim());
      setCouponInput('');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="py-20 bg-white min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4 space-y-4">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
            <ShoppingBag size={40} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Your shopping cart is empty</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            You don't have any digital video packs or worksheet bundles in your cart. Check out our latest viral arrivals!
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-febric-coral hover:bg-febric-pink text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-full transition-all shadow-md"
          >
            <span>Explore Store Bundles</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-16 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Link to="/" className="hover:text-febric-coral">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">Shopping Cart ({cartCount} items)</span>
        </nav>

        <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Shopping <span className="text-febric-coral">Cart</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cart Table / Items (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item.id} className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-gray-100 flex-shrink-0"
                    />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        {item.category}
                      </span>
                      <Link to={`/product/${item.slug}`} className="block">
                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 hover:text-febric-coral transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-gray-900">₹{item.salePrice}</span>
                        <span className="text-xs text-gray-400 line-through">₹{item.regularPrice}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0">
                    {/* Qty controls */}
                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1.5 hover:bg-gray-200 text-gray-600"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="px-3 text-xs font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1.5 hover:bg-gray-200 text-gray-600"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <div className="text-sm font-black text-gray-900">
                        ₹{item.salePrice * item.quantity}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="pt-6 border-t border-gray-100">
              <form onSubmit={handleApplyCoupon} className="flex gap-2 max-w-sm">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. SANSKRUTI10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-febric-coral"
                  />
                  <Tag size={14} className="absolute right-3 top-3 text-gray-400" />
                </div>
                <button
                  type="submit"
                  className="bg-febric-dark hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors"
                >
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl mt-3">
                  <span>Coupon <strong>{appliedCoupon.code}</strong> applied ({appliedCoupon.discountPct}% OFF)!</span>
                  <button onClick={removeCoupon} className="text-red-600 hover:underline font-bold text-[11px]">
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-base font-extrabold text-gray-900 pb-3 border-b border-gray-100">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Original Total</span>
                <span className="line-through text-gray-400">₹{cartOriginalTotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Bundle Discount</span>
                <span className="text-emerald-600 font-bold">-₹{cartOriginalTotal - cartSubtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge</span>
                <span className="text-emerald-600 font-extrabold uppercase text-[10px]">Instant Digital Access (FREE)</span>
              </div>
              <div className="flex justify-between text-base font-black text-gray-900 pt-3 border-t border-gray-100">
                <span>Total Amount</span>
                <span className="text-febric-coral text-lg font-black">₹{cartTotal}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-gradient-to-r from-febric-coral to-febric-pink hover:opacity-95 text-white font-black py-4 rounded-full text-xs uppercase tracking-wider shadow-xl shadow-febric-coral/25 flex items-center justify-center gap-2 transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>100% Guaranteed Secure Indian Payment</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
