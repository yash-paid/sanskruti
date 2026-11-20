import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#f5f5f5] border-t border-[#e6e6e6] pt-12 pb-8 text-[#303030] font-['Montserrat']">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top 4-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 pb-10 border-b border-[#e6e6e6]">
          
          {/* Column 1: Brand & Bio (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <Link to="/" className="inline-block">
              <img
                src="/assets/sanskruti-logo.png"
                alt="Sanskruti Store"
                className="h-9 sm:h-11 w-auto object-contain"
              />
            </Link>
            <p className="text-[13px] text-[#444444] leading-[1.65] max-w-sm">
              Sanskruti Store offers premium digital products, ready-made reels bundles and creative resources for your digital needs.
            </p>
          </div>

          {/* Column 2: Useful Links (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[14px] font-bold text-[#202027] font-['Lexend_Deca'] tracking-tight">Useful Links</h4>
            <ul className="space-y-2 text-[13px] text-[#444444]">
              <li>
                <Link to="/contact" className="hover:text-[#ff673c] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-[#ff673c] transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-[#ff673c] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#ff673c] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-[#ff673c] transition-colors">
                  Refund & Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Popular Categories (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[14px] font-bold text-[#202027] font-['Lexend_Deca'] tracking-tight">Popular Categories</h4>
            <ul className="space-y-2 text-[13px] text-[#444444]">
              <li>
                <Link to="/shop?category=all" className="hover:text-[#ff673c] transition-colors">
                  Digital Products
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Reel+Bundle" className="hover:text-[#ff673c] transition-colors">
                  Reels Bundle
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Entertainment" className="hover:text-[#ff673c] transition-colors">
                  AI Reel Bundles
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Infographics" className="hover:text-[#ff673c] transition-colors">
                  Infographic Slides
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Worksheet" className="hover:text-[#ff673c] transition-colors">
                  Printable Worksheets
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: WhatsApp Channel Card (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-gradient-to-br from-[#ff5269] to-[#ff831f] rounded-[16px] p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/90 mb-1.5">
                <MessageCircle size={14} />
                <span>SANSKRUTI STORE WHATSAPP CHANNEL</span>
              </div>
              <h3 className="text-[18px] sm:text-[20px] font-extrabold text-white mb-1.5 leading-snug font-['Lexend_Deca']">
                Get Latest Product Updates
              </h3>
              <p className="text-[11px] sm:text-[12px] text-white/95 leading-[1.5] mb-3.5">
                Follow Sanskruti Store for new products, reels bundles, exclusive deals and digital product updates.
              </p>
              <a
                href="https://wa.me/918820182713?text=Hello%20Sanskruti%20Store%2C%20I%20want%20to%20join%20the%20updates%20channel"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25d366] hover:bg-[#20ba59] text-white text-[11px] font-bold px-4 py-2 rounded-full transition-all shadow-sm"
              >
                <MessageCircle size={14} />
                <span>Join WhatsApp Channel →</span>
              </a>
            </div>
          </div>
        </div>

        {/* Payment Methods Bar */}
        <div className="py-6 text-center space-y-2.5">
          <div className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider">
            Payment methods
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <div className="bg-white border border-[#e4e4e4] rounded-[6px] px-3 py-1.5 flex items-center justify-center h-9 w-24 shadow-sm">
              <span className="text-[11px] font-bold text-[#5f259f]">PhonePe</span>
            </div>
            <div className="bg-white border border-[#e4e4e4] rounded-[6px] px-3 py-1.5 flex items-center justify-center h-9 w-24 shadow-sm">
              <span className="text-[11px] font-bold text-[#4285F4]">G<span className="text-[#EA4335]">P</span><span className="text-[#FBBC05]">a</span><span className="text-[#34A853]">y</span></span>
            </div>
            <div className="bg-white border border-[#e4e4e4] rounded-[6px] px-3 py-1.5 flex items-center justify-center h-9 w-24 shadow-sm">
              <span className="text-[11px] font-bold text-[#00b9f5]">Paytm</span>
            </div>
            <div className="bg-white border border-[#e4e4e4] rounded-[6px] px-3 py-1.5 flex items-center justify-center h-9 w-24 shadow-sm">
              <span className="text-[11px] font-bold text-[#097939]">Ru<span className="text-[#ec6624]">Pay</span></span>
            </div>
            <div className="bg-white border border-[#e4e4e4] rounded-[6px] px-3 py-1.5 flex items-center justify-center h-9 w-24 shadow-sm">
              <span className="text-[11px] font-bold text-[#eb001b]">Master<span className="text-[#f79e1b]">card</span></span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center pt-3 border-t border-[#e6e6e6] text-[11px] text-[#777777]">
          © 2026 Sanskruti Store. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
