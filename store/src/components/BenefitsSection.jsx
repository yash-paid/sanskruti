import React, { useState, useEffect } from 'react';
import {
  Infinity,
  RefreshCw,
  GraduationCap,
  FolderGit2,
  Headphones,
  Zap,
  Globe2,
  FileCode2,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const BENEFITS = [
  {
    icon: Infinity,
    title: 'Lifetime Access',
    desc: 'One-time payment with zero recurring or hidden subscription fees.'
  },
  {
    icon: RefreshCw,
    title: 'Free Future Updates',
    desc: 'Get all upcoming video reels and bonus additions automatically.'
  },
  {
    icon: GraduationCap,
    title: 'Specialized Courses',
    desc: 'Masterclass video tutorials on Instagram and YouTube monetization.'
  },
  {
    icon: FolderGit2,
    title: 'Project-Based Learning',
    desc: 'Ready-to-use editable source files and Canva/PPT templates.'
  },
  {
    icon: Headphones,
    title: 'Customer Support',
    desc: 'Quick assistance via WhatsApp and email for any download inquiry.'
  },
  {
    icon: Zap,
    title: 'Instant Digital Delivery',
    desc: 'Immediate on-screen and email cloud link delivery upon checkout.'
  },
  {
    icon: Globe2,
    title: 'Learn Anytime, Anywhere',
    desc: 'Stream or download to your phone, tablet, laptop, or desktop.'
  },
  {
    icon: FileCode2,
    title: 'Free Learning Templates',
    desc: 'Includes hook prompts, hashtags, and viral title cheat sheets.'
  }
];

export default function BenefitsSection() {
  const [timeLeft, setTimeLeft] = useState(() => {
    try {
      let target = localStorage.getItem('febric_sale_end');
      if (!target || Number(target) < Date.now()) {
        target = String(Date.now() + 8 * 60 * 60 * 1000 + 43 * 60 * 1000);
        localStorage.setItem('febric_sale_end', target);
      }
      return Math.max(0, Math.floor((Number(target) - Date.now()) / 1000));
    } catch {
      return 8 * 3600;
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <section className="py-8 sm:py-14 bg-white font-['Lexend_Deca'] text-[#202027] border-t border-[#f0f0f0]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Promotional Countdown Banner (Exact Febric styling) */}
        <div className="relative rounded-[16px] overflow-hidden bg-gradient-to-r from-[#202027] via-[#1a1a20] to-[#202027] text-white p-6 sm:p-10 shadow-lg border border-[#33333d]">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 bg-[#ff673c] text-white text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-[5px] tracking-wider">
                <Sparkles size={11} />
                Flash Sale Ending Soon
              </span>
              <h3 className="text-[20px] sm:text-[28px] font-semibold text-white leading-tight">
                Get Mega Bundle Discounts up to <span className="text-[#ff673c]">94% OFF</span>
              </h3>
              <p className="text-[12px] sm:text-[13px] text-gray-300 max-w-xl font-['Montserrat'] font-normal">
                Limited-time creator pricing. Grab all viral reels bundles, PowerPoint infographic slides & courses before price resets!
              </p>
            </div>

            {/* Countdown Box */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 font-['Montserrat']">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[8px] p-2 sm:p-3 text-center min-w-[58px]">
                  <span className="text-[18px] sm:text-[24px] font-bold text-white leading-none block font-mono">
                    {String(hours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-semibold text-gray-300 uppercase tracking-widest mt-1 block">Hours</span>
                </div>
                <span className="text-[18px] font-bold text-[#ff673c]">:</span>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[8px] p-2 sm:p-3 text-center min-w-[58px]">
                  <span className="text-[18px] sm:text-[24px] font-bold text-white leading-none block font-mono">
                    {String(minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-semibold text-gray-300 uppercase tracking-widest mt-1 block">Mins</span>
                </div>
                <span className="text-[18px] font-bold text-[#ff673c]">:</span>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[8px] p-2 sm:p-3 text-center min-w-[58px]">
                  <span className="text-[18px] sm:text-[24px] font-bold text-[#ff673c] leading-none block font-mono">
                    {String(seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-semibold text-gray-300 uppercase tracking-widest mt-1 block">Secs</span>
                </div>
              </div>

              <Link
                to="/shop"
                className="bg-[#ff673c] hover:bg-[#ff5268] text-white font-medium text-[11px] uppercase tracking-wider px-5 py-3 rounded-[7px] transition-colors whitespace-nowrap"
              >
                Claim Deal Now →
              </Link>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-[23px] sm:text-[29px] font-semibold text-[#202027] leading-[1.3]">
              Why Creators Choose <span className="text-[#ff673c]">Sanskruti Store</span>
            </h2>
            <p className="text-[12px] text-[#777777] font-normal mt-1 font-['Montserrat']">
              Everything you need to launch and scale viral social media pages with ease
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-['Montserrat']">
            {BENEFITS.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-[12px] bg-white border border-[#e6e6e6] hover:border-[#ff673c]/50 transition-all space-y-2 group"
                >
                  <div className="w-9 h-9 rounded-[8px] bg-[#fff8f5] text-[#ff673c] flex items-center justify-center transition-transform group-hover:scale-105">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-[13px] font-bold text-[#202027] group-hover:text-[#ff673c] transition-colors">
                    {b.title}
                  </h3>
                  <p className="text-[11px] text-[#666666] leading-[1.6]">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
