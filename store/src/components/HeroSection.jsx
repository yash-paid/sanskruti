import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const WORDS = [
  'Unique & Creative',
  'Viral Video Packs',
  'Ready to Post Today',
  'Pick a Story. Grow.'
];

export default function HeroSection() {
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullText = WORDS[currentWordIdx];
    const speed = isDeleting ? 35 : 75;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(fullText.substring(0, displayText.length + 1));
        if (displayText === fullText) {
          setTimeout(() => setIsDeleting(true), 2200);
        }
      } else {
        setDisplayText(fullText.substring(0, displayText.length - 1));
        if (displayText === '') {
          setIsDeleting(false);
          setCurrentWordIdx((prev) => (prev + 1) % WORDS.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentWordIdx]);

  return (
    <section className="relative w-full bg-[#fdf8f6] font-['Lexend_Deca'] overflow-hidden border-b border-[#f3e7e4]">
      <div className="relative max-w-[1500px] min-h-[580px] lg:min-h-[620px] mx-auto px-5 sm:px-8 lg:px-14 py-12 lg:py-20">
        
        {/* Top Eyebrow Accent */}
        <div className="absolute top-6 sm:top-8 right-6 sm:right-12 text-[10px] uppercase font-bold tracking-[2px] text-[#a65c55] z-10">
          ✦ LATEST ARRIVALS
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center min-h-[460px]">
          
          {/* Left Hero Content (lg:col-span-6) */}
          <div className="lg:col-span-6 z-10 pr-0 lg:pr-6">
            
            <p className="text-[11px] font-medium tracking-[2px] text-[#b94845] uppercase mb-4">
              FRESH IDEAS. CREATIVE COLLECTIONS.
            </p>

            <h1 className="text-[34px] sm:text-[46px] lg:text-[62px] font-bold text-[#252233] leading-[1.18] tracking-[-1.5px] lg:tracking-[-1.8px] mb-4">
              Viral-Ready Reels,
              <span className="block text-[0.76em] tracking-[-1px] mt-2 font-bold text-[#252233]">
                Creative Digital Products
              </span>
            </h1>

            {/* Live Typing changing text */}
            <div className="min-h-[44px] flex items-center mb-3">
              <span className="text-[20px] sm:text-[26px] lg:text-[32px] font-medium text-[#ff5268]">
                {displayText}
              </span>
              <span className="inline-block w-[2px] h-[24px] sm:h-[30px] bg-[#ff5268] ml-1.5 animate-pulse" />
            </div>

            <p className="text-[14px] font-light leading-[2] text-[#946d6a] max-w-[480px] mb-7">
              Discover creative AI reels and ready-made digital bundles for your next big idea. Pick a story. Make it part of your feed.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 mb-7">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-3 min-h-[54px] px-7 rounded-full bg-[#ff5268] hover:bg-[#ff3b54] text-white text-[13px] font-medium transition-transform hover:-translate-y-0.5 shadow-md shadow-[#ff5268]/20"
              >
                <span>Explore Bundles</span>
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-3 min-h-[54px] px-7 rounded-full border border-[#e9c9ca] hover:bg-white text-[#97585d] text-[13px] font-medium transition-transform hover:-translate-y-0.5 bg-transparent"
              >
                <span>Watch Previews</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <p className="text-[11px] text-[#a7817d]">
              Creative collections · Digital video assets · Instant Cloud Access
            </p>

          </div>

          {/* Right Product Graphic (3 Overlapping Tilted Cards - Exact Febric Proportions) */}
          <div className="lg:col-span-6 relative h-[360px] sm:h-[420px] lg:h-[480px] w-full flex items-center justify-center">
            
            {/* Card 1 (Left Tilt -10deg) */}
            <Link
              to="/product/baby-podcast-reels"
              className="absolute left-[2%] sm:left-[5%] top-[35px] sm:top-[45px] w-[45%] sm:w-[35%] lg:w-[34%] p-2 sm:p-2.5 pb-3.5 sm:pb-4 bg-white rounded-[16px] shadow-[0_18px_40px_rgba(81,49,46,0.12)] transition-all duration-300 transform -rotate-10 hover:rotate-0 hover:-translate-y-2 hover:z-20 z-10 block"
            >
              <div className="w-full aspect-square rounded-[11px] overflow-hidden bg-gray-100">
                <img
                  src="/assets/febric/baby-podcast-800x800-1.avif"
                  alt="Baby Podcast Reels"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pt-2">
                <span className="block text-[8px] sm:text-[9px] font-bold text-[#b94845] tracking-[1px] uppercase">
                  LATEST ARRIVAL
                </span>
                <h2 className="text-[11px] sm:text-[13px] font-bold text-[#252233] leading-[1.35] line-clamp-2 mt-0.5">
                  Baby Podcast Reels With Bonus
                </h2>
                <span className="block text-[10px] sm:text-[11px] font-semibold text-[#ff5268] mt-1">
                  Explore bundle →
                </span>
              </div>
            </Link>

            {/* Card 2 (Center Tilt +3deg, Elevated) */}
            <Link
              to="/product/monkey-vlog-reels"
              className="absolute left-[32%] sm:left-[35%] top-[5px] sm:top-[10px] w-[46%] sm:w-[36%] lg:w-[35%] p-2 sm:p-2.5 pb-3.5 sm:pb-4 bg-white rounded-[16px] shadow-[0_20px_45px_rgba(81,49,46,0.15)] transition-all duration-300 transform rotate-3 hover:rotate-0 hover:-translate-y-2 hover:z-20 z-30 block"
            >
              <div className="w-full aspect-square rounded-[11px] overflow-hidden bg-gray-100">
                <img
                  src="/assets/febric/monkey-vlog-800x800-1.avif"
                  alt="Monkey Vlog Reels"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pt-2">
                <span className="block text-[8px] sm:text-[9px] font-bold text-[#b94845] tracking-[1px] uppercase">
                  LATEST ARRIVAL
                </span>
                <h2 className="text-[11px] sm:text-[13px] font-bold text-[#252233] leading-[1.35] line-clamp-2 mt-0.5">
                  Monkey Vlog Reels With Courses
                </h2>
                <span className="block text-[10px] sm:text-[11px] font-semibold text-[#ff5268] mt-1">
                  Explore bundle →
                </span>
              </div>
            </Link>

            {/* Card 3 (Right Tilt +10deg) */}
            <Link
              to="/product/sheru-bhai-reels-bundle"
              className="absolute left-[62%] sm:left-[64%] top-[40px] sm:top-[50px] w-[45%] sm:w-[35%] lg:w-[34%] p-2 sm:p-2.5 pb-3.5 sm:pb-4 bg-white rounded-[16px] shadow-[0_18px_40px_rgba(81,49,46,0.12)] transition-all duration-300 transform rotate-10 hover:rotate-0 hover:-translate-y-2 hover:z-20 z-20 block"
            >
              <div className="w-full aspect-square rounded-[11px] overflow-hidden bg-gray-100">
                <img
                  src="/assets/febric/Sheru-Bhai-Viral-Reels-Bundle-1024x1024-1.webp"
                  alt="Sheru Bhai Reels"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pt-2">
                <span className="block text-[8px] sm:text-[9px] font-bold text-[#b94845] tracking-[1px] uppercase">
                  LATEST ARRIVAL
                </span>
                <h2 className="text-[11px] sm:text-[13px] font-bold text-[#252233] leading-[1.35] line-clamp-2 mt-0.5">
                  Sheru Bhai Viral Reels Bundle
                </h2>
                <span className="block text-[10px] sm:text-[11px] font-semibold text-[#ff5268] mt-1">
                  Explore bundle →
                </span>
              </div>
            </Link>

          </div>

        </div>

      </div>
    </section>
  );
}
