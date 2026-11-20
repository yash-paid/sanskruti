import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function BestSelling() {
  const { products, addToCart } = useStore();
  const trackRef = useRef(null);

  const bestSellers = products.filter((p) => p.bestseller);

  const scroll = (direction) => {
    if (trackRef.current) {
      const scrollAmount = 260;
      trackRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
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
    <section className="py-6 sm:py-10 bg-white font-['Lexend_Deca'] text-[#202027] border-t border-[#f0f0f0]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title & Navigation Controls */}
        <div className="flex items-center justify-between gap-3 w-full mb-4">
          <h2 className="text-[23px] sm:text-[29px] font-semibold text-[#202027] leading-[1.3]">
            Best <span className="text-[#ff673c]">Selling</span>
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-[29px] h-[29px] rounded-[8px] border border-[#e4e4e4] bg-white text-[#333] hover:text-[#ff673c] hover:border-[#ff673c] flex items-center justify-center transition-colors"
              aria-label="Previous bestselling products"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-[29px] h-[29px] rounded-[8px] border border-[#e4e4e4] bg-white text-[#333] hover:text-[#ff673c] hover:border-[#ff673c] flex items-center justify-center transition-colors"
              aria-label="Next bestselling products"
            >
              <ChevronRight size={16} />
            </button>

            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-1 px-3 sm:px-3.5 py-2 border border-[#e7e7e7] rounded-[9px] bg-white text-[#32323a] text-[10px] font-medium hover:bg-[#fff8f5] hover:text-[#ff673c] hover:border-[#ff673c] transition-colors whitespace-nowrap"
            >
              <span>All Products</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Carousel Track (5 Cards on large screen) */}
        <div
          ref={trackRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none pb-3 pt-1 snap-x scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {bestSellers.map((product) => (
            <div
              key={product.id}
              className="w-[170px] sm:w-[220px] md:w-[240px] lg:w-[276px] flex-shrink-0 snap-start flex flex-col border border-[#e6e6e6] rounded-[12px] bg-white overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_9px_22px_rgba(0,0,0,0.06)] relative group"
            >
              {/* Discount Tag */}
              <div className="absolute top-[9px] left-[9px] z-10 bg-[#252525] text-white text-[10px] font-semibold px-2 py-1 rounded-[6px] leading-[1.2]">
                {product.badge}
              </div>

              {/* Thumbnail */}
              <Link to={`/product/${product.slug}`} className="block relative aspect-square w-full overflow-hidden bg-[#f7f7f7]">
                <img
                  src={product.image}
                  alt={product.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Link>

              {/* Details */}
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

              {/* Bottom bar */}
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

      </div>
    </section>
  );
}
