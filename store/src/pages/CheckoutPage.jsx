import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, CheckCircle2, ArrowRight, Smartphone, CreditCard, QrCode } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function CheckoutPage() {
  const { cart, cartTotal, cartSubtotal, discountAmount, appliedCoupon, createOrder, showToast } = useStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  if (cart.length === 0) {
    navigate('/shop');
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Please enter your full name');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      showToast('Please enter a valid 10-digit WhatsApp number');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      showToast('Please enter a valid email address');
      return;
    }

    setIsProcessing(true);

    // Simulate fast verified server checkout
    setTimeout(() => {
      const order = createOrder({
        customer: formData,
        paymentMethod,
        items: cart,
        total: cartTotal
      });
      setIsProcessing(false);
      navigate(`/order-confirmation/${order.orderId}`);
    }, 1200);
  };

  return (
    <div className="py-10 sm:py-16 bg-gray-50/60 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Link to="/" className="hover:text-febric-coral">Home</Link>
          <span>/</span>
          <Link to="/cart" className="hover:text-febric-coral">Cart</Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">Secure Checkout</span>
        </nav>

        <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Checkout & <span className="text-febric-coral">Instant Delivery</span>
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Customer Details Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Contact Details */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-febric-coral text-white text-xs flex items-center justify-center">1</span>
                <span>Contact & Delivery Details</span>
              </h2>

              <p className="text-xs text-gray-500">
                Download access link will be delivered instantly to this WhatsApp number & Email.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-febric-coral focus:ring-1 focus:ring-febric-coral"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    WhatsApp Phone Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xs font-bold text-gray-500">+91</span>
                    <input
                      type="tel"
                      name="phone"
                      required
                      maxLength="10"
                      placeholder="10-digit WhatsApp number"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-febric-coral focus:ring-1 focus:ring-febric-coral"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email Address * (For Google Drive Download Link)
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-febric-coral focus:ring-1 focus:ring-febric-coral"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-febric-coral text-white text-xs flex items-center justify-center">2</span>
                <span>Select Payment Method</span>
              </h2>

              <div className="space-y-3">
                {/* UPI Option */}
                <label
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-febric-coral bg-rose-50/20 ring-1 ring-febric-coral'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                      {paymentMethod === 'upi' && <div className="w-3 h-3 rounded-full bg-febric-coral" />}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span>UPI / QR Code (Google Pay, PhonePe, Paytm, BHIM)</span>
                      </div>
                      <span className="text-[11px] text-gray-500">Fastest & zero transaction fee</span>
                    </div>
                  </div>
                  <Smartphone size={20} className="text-gray-400" />
                </label>

                {/* Cards / NetBanking */}
                <label
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-febric-coral bg-rose-50/20 ring-1 ring-febric-coral'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                      {paymentMethod === 'card' && <div className="w-3 h-3 rounded-full bg-febric-coral" />}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900">
                        Credit / Debit Card / NetBanking
                      </div>
                      <span className="text-[11px] text-gray-500">Visa, MasterCard, RuPay & 50+ Banks</span>
                    </div>
                  </div>
                  <CreditCard size={20} className="text-gray-400" />
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-base font-extrabold text-gray-900 pb-3 border-b border-gray-100">
              Your Order ({cart.length} Products)
            </h3>

            {/* Items list */}
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1 divide-y divide-gray-50">
              {cart.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.title}</h4>
                      <span className="text-[11px] text-gray-500">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-xs font-black text-gray-900">
                    ₹{item.salePrice * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing math */}
            <div className="space-y-2.5 pt-4 border-t border-gray-100 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">₹{cartSubtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Digital Delivery</span>
                <span className="text-emerald-600 font-bold uppercase text-[10px]">Instant Download (FREE)</span>
              </div>
              <div className="flex justify-between text-base font-black text-gray-900 pt-3 border-t border-gray-100">
                <span>Total Payable</span>
                <span className="text-febric-coral text-lg font-black">₹{cartTotal}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-febric-coral to-febric-pink hover:opacity-95 text-white font-black py-4 rounded-full text-xs uppercase tracking-wider shadow-xl shadow-febric-coral/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Verifying Secure Payment Gateway...</span>
              ) : (
                <>
                  <Lock size={15} />
                  <span>Pay & Get Instant Access (₹{cartTotal})</span>
                </>
              )}
            </button>

            <div className="text-center text-[11px] text-gray-400 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-semibold">
                <ShieldCheck size={14} />
                <span>256-Bit Bank Grade SSL Encrypted Checkout</span>
              </div>
              <p>Instant Google Drive download link opens right after payment.</p>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
