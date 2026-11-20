import React, { useRef } from 'react';
import { Star, CheckCircle2, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { TESTIMONIALS } from '../data/products';

export default function TestimonialsSection() {
  const trackRef = useRef(null);

  const scroll = (direction) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({
        left: direction === 'left' ? -340 : 340,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Customer <span className="text-febric-coral">Reviews</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
              Real creators and educators sharing their results with Sanskruti Store assets
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-black hover:border-gray-400 transition-colors"
              aria-label="Previous review"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-black hover:border-gray-400 transition-colors"
              aria-label="Next review"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="flex gap-6 overflow-x-auto scrollbar-none pb-4 pt-1 snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="w-80 sm:w-96 flex-shrink-0 snap-start bg-gray-50/70 border border-gray-100 rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div className="space-y-4">
                {/* Rating & Quote */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={16} className="fill-current" />
                    ))}
                  </div>
                  <Quote size={24} className="text-febric-coral/30" />
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium italic">
                  "{t.text}"
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3.5 pt-6 mt-6 border-t border-gray-200/60">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm bg-gray-200"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-gray-900">{t.name}</span>
                    <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-100" title="Verified Customer" />
                  </div>
                  <span className="text-[11px] text-gray-500 block leading-tight">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
