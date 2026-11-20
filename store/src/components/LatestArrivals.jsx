import React, { useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CATEGORIES } from '../data/products';

export default function LatestArrivals() {
  const { products, addToCart } = useStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(10);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter((p) => {
      if (Array.isArray(p.categories)) {
        return p.categories.some((c) => c.toLowerCase() === activeCategory.toLowerCase());
      }
      return p.category.toLowerCase() === activeCategory.toLowerCase();
    });
  }, [products, activeCategory]);

  const displayed = filtered.slice(0, visibleCount);

  const scrollCategories = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -180 : 180,
        behavior: 'smooth'
      });
    }
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <section className="py-6 sm:py-10 bg-white font-['Lexend_Deca'] text-[#202027]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <h2 className="text-[23px] sm:text-[29px] font-semibold text-[#202027] leading-[1.3] mb-4">
          Latest <span className="text-[#ff673c]">Arrivals</span>
        </h2>

        {/* Category Navigation with Arrows */}
        <div className="flex items-center gap-2 w-full mb-7">
          <button
            onClick={() => scrollCategories('left')}
            className="flex-shrink-0 w-[29px] h-[29px] rounded-[8px] border border-[#e4e4e4] bg-white text-[#333] hover:text-[#ff673c] hover:border-[#ff673c] flex items-center justify-center transition-colors"
            aria-label="Previous categories"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            ref={scrollRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 flex-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory.toLowerCase() === cat.id.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setVisibleCount(10);
                  }}
                  className={`flex-shrink-0 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-[9px] border text-[10px] sm:text-[11px] font-medium leading-[1.2] whitespace-nowrap transition-all ${
                    isActive
                      ? 'border-[#ff673c] text-[#ff673c] bg-[#fff8f5]'
                      : 'border-[#e7e7e7] text-[#32323a] bg-white hover:border-[#ff673c] hover:text-[#ff673c]'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollCategories('right')}
            className="flex-shrink-0 w-[29px] h-[29px] rounded-[8px] border border-[#e4e4e4] bg-white text-[#333] hover:text-[#ff673c] hover:border-[#ff673c] flex items-center justify-center transition-colors"
            aria-label="Next categories"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Product Cards 5-Column Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
          {displayed.map((product) => (
            <div
              key={product.id}
              className="flex flex-col border border-[#e6e6e6] rounded-[12px] bg-white overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_9px_22px_rgba(0,0,0,0.06)] relative group"
            >
              {/* Discount Badge */}
              <div className="absolute top-[9px] left-[9px] z-10 bg-[#252525] text-white text-[10px] font-semibold px-2 py-1 rounded-[6px] leading-[1.2]">
                {product.badge}
              </div>

              {/* Product Thumbnail */}
              <Link to={`/product/${product.slug}`} className="block relative aspect-square w-full overflow-hidden bg-[#f7f7f7]">
                <img
                  src={product.image}
                  alt={product.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Link>

              {/* Product Info */}
              <div className="p-[11px] pb-[10px] flex-1 flex flex-col justify-between min-h-[90px]">
                <div>
                  <span className="block text-[10px] text-[#999999] leading-[1.5] mb-1 line-clamp-1">
                    {product.category}
                  </span>
                  <Link to={`/product/${product.slug}`} className="block">
                    <h3
                      className="text-[12px] font-medium text-[#25252b] leading-[1.5] line-clamp-2 hover:text-[#ff673c] transition-colors"
                      title={product.title}
                    >
                      {product.title}
                    </h3>
                  </Link>
                </div>
              </div>

              {/* Product Bottom Bar */}
              <div className="min-h-[46px] px-[11px] py-2 border-t border-[#ececec] flex items-center justify-between gap-1.5">
                <div className="text-[12px] font-semibold text-[#ff673c] font-['Montserrat'] whitespace-nowrap">
                  <del className="text-[10px] text-[#aaaaaa] font-normal mr-1">
                    ₹{product.regularPrice}
                  </del>
                  <ins className="no-underline text-[#ff673c]">
                    ₹{product.salePrice}
                  </ins>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleAddToCart(e, product)}
                  className="w-[30px] h-[30px] rounded-[6px] p-1 flex items-center justify-center text-[#292929] hover:bg-[#fff2eb] hover:text-[#ff673c] transition-colors flex-shrink-0"
                  title="Add to Cart"
                  aria-label="Add to Cart"
                >
                  <ShoppingBag size={17} />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Load More Button */}
        {visibleCount < filtered.length && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#ff9b7a] rounded-[7px] bg-[#fff8f5] text-[#d65c31] text-[11px] font-medium hover:bg-[#ff673c] hover:text-white transition-colors"
            >
              <span>Load More Products</span>
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
