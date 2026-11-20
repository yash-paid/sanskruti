import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, SlidersHorizontal, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CATEGORIES } from '../data/products';

export default function ShopPage() {
  const { products, addToCart } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlCategory = searchParams.get('category') || 'all';
  const urlSearch = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    if (urlCategory) setSelectedCategory(urlCategory);
    if (urlSearch) setSearchTerm(urlSearch);
  }, [urlCategory, urlSearch]);

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCat =
          selectedCategory === 'all' ||
          (Array.isArray(p.categories)
            ? p.categories.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())
            : p.category.toLowerCase() === selectedCategory.toLowerCase());
        const matchesSearch =
          !searchTerm ||
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.shortDescription && p.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCat && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.salePrice - b.salePrice;
        if (sortBy === 'price-high') return b.salePrice - a.salePrice;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0;
      });
  }, [products, selectedCategory, searchTerm, sortBy]);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <div className="py-6 sm:py-10 bg-white min-h-screen font-['Lexend_Deca'] text-[#202027]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb & Header */}
        <div className="space-y-1.5 border-b border-[#f0f0f0] pb-6">
          <div className="text-[11px] font-['Montserrat'] font-medium text-[#777777] flex items-center gap-1.5">
            <Link to="/" className="hover:text-[#ff673c] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#202027] font-semibold">Shop All Products</span>
          </div>
          <h1 className="text-[24px] sm:text-[32px] font-semibold text-[#202027] leading-[1.3]">
            Digital Products & Viral Reels <span className="text-[#ff673c]">Store</span>
          </h1>
          <p className="text-[12px] sm:text-[13px] text-[#777777] font-['Montserrat'] max-w-2xl font-normal">
            Browse our entire collection of 4K AI video reels bundles, infographic templates, and printable education worksheets with lifetime access.
          </p>
        </div>

        {/* Filter & Search Bar Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#fbfbfb] p-3 sm:p-4 rounded-[12px] border border-[#e6e6e6] font-['Montserrat']">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search products in shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2 rounded-[8px] border border-[#d6d6d6] text-[12px] sm:text-[13px] bg-white focus:outline-none focus:border-[#ff673c]"
            />
            <Search size={15} className="absolute right-3.5 top-2.5 text-[#999999]" />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#666666] uppercase tracking-wider whitespace-nowrap">
              Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-[#d6d6d6] rounded-[8px] px-3 py-1.5 text-[12px] font-medium text-[#333333] focus:outline-none focus:border-[#ff673c]"
            >
              <option value="featured">Featured / Best Match</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Main Content: Category Sidebar + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-['Montserrat']">
          
          {/* Categories Sidebar (3 cols) */}
          <div className="lg:col-span-3 bg-[#fbfbfb] p-4 rounded-[12px] border border-[#e6e6e6] space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#202027] tracking-wider pb-2 border-b border-[#e6e6e6]">
              <SlidersHorizontal size={13} />
              <span>Filter Categories</span>
            </div>

            <div className="space-y-1">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#ff673c] text-white shadow-sm'
                        : 'text-[#444444] hover:bg-[#f0f0f0]'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-[4px] ${isSelected ? 'bg-white/20 text-white font-semibold' : 'bg-gray-200 text-gray-600'}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Products Grid (9 cols) */}
          <div className="lg:col-span-9 space-y-5">
            <div className="flex items-center justify-between text-[11px] text-[#777777] font-medium">
              <span>Showing {filtered.length} products</span>
              {(selectedCategory !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchTerm('');
                  }}
                  className="text-[#ff673c] hover:underline"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-[#fbfbfb] rounded-[12px] border border-dashed border-[#d6d6d6] space-y-2.5">
                <p className="text-[14px] font-bold text-[#202027]">No products match your search or filter</p>
                <p className="text-[12px] text-[#777777]">Try searching with a different term or choose 'All' categories.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 bg-[#202027] text-white text-[11px] font-bold rounded-[6px]"
                >
                  Show All Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 font-['Lexend_Deca']">
                {filtered.map((product) => (
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
                        <span className="block text-[10px] text-[#999999] leading-[1.5] mb-1 line-clamp-1 font-['Lexend_Deca']">
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
                    <div className="min-h-[46px] px-[11px] py-2 border-t border-[#ececec] flex items-center justify-between gap-1.5 font-['Montserrat']">
                      <div className="text-[12px] font-semibold text-[#ff673c] whitespace-nowrap">
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
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
