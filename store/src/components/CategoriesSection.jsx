import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { CATEGORIES } from '../data/products';

export default function CategoriesSection() {
  const displayCats = CATEGORIES.filter((c) => c.id !== 'all');

  return (
    <section className="py-6 sm:py-10 bg-white font-['Lexend_Deca'] text-[#202027] border-t border-[#f0f0f0]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center justify-between gap-3 w-full mb-6">
          <div>
            <h2 className="text-[23px] sm:text-[29px] font-semibold text-[#202027] leading-[1.3]">
              Shop By <span className="text-[#ff673c]">Categories</span>
            </h2>
            <p className="text-[12px] text-[#777777] font-normal mt-1">
              Explore specialized niches designed to reach targeted viral audiences
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-1 px-3 sm:px-3.5 py-2 border border-[#e7e7e7] rounded-[9px] bg-white text-[#32323a] text-[10px] font-medium hover:bg-[#fff8f5] hover:text-[#ff673c] hover:border-[#ff673c] transition-colors whitespace-nowrap"
          >
            <span>Browse All</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayCats.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${encodeURIComponent(cat.name)}`}
              className="group relative rounded-[12px] overflow-hidden bg-white border border-[#e6e6e6] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_9px_22px_rgba(0,0,0,0.06)] flex flex-col"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-[#f7f7f7] relative">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                  <span className="text-[10px] font-medium text-white/90 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-[5px] inline-flex items-center gap-1 mb-1">
                    <Layers size={10} />
                    <span>{cat.count} Products</span>
                  </span>
                  <h3 className="text-[13px] sm:text-[14px] font-semibold leading-tight text-white drop-shadow-sm">
                    {cat.name}
                  </h3>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 bg-white flex items-center justify-between text-[11px] font-medium text-[#32323a] group-hover:text-[#ff673c] transition-colors">
                <span>Explore Products</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
