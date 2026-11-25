'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShoppingBag, 
  Search, 
  Sparkles, 
  Globe, 
  Filter, 
  X, 
  SlidersHorizontal, 
  Check, 
  ArrowUpDown,
  RotateCcw,
  Truck,
  PackageCheck
} from 'lucide-react';
import { ProductCard } from '@/components/store/ProductCard';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

type PriceRange = 'all' | 'under-1000' | '1000-1999' | '2000-2999' | '3000-plus';
type SortOption = 'bestseller' | 'newest' | 'price-low' | 'price-high' | 'rating';

export default function StorePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange>('all');
  const [sortBy, setSortBy] = useState<SortOption>('bestseller');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlySpecial, setOnlySpecial] = useState<'all' | 'bestsellers' | 'new'>('all');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: MOCK_PRODUCTS.length };
    MOCK_PRODUCTS.forEach((prod) => {
      counts[prod.category] = (counts[prod.category] || 0) + 1;
    });
    return counts;
  }, []);

  const filteredProducts = useMemo(() => {
    let result = MOCK_PRODUCTS.filter((prod) => {
      // Category filter
      const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;

      // Search filter
      const matchesSearch =
        searchQuery.trim() === '' ||
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Price filter
      let matchesPrice = true;
      if (selectedPriceRange === 'under-1000') {
        matchesPrice = prod.price < 1000;
      } else if (selectedPriceRange === '1000-1999') {
        matchesPrice = prod.price >= 1000 && prod.price <= 1999;
      } else if (selectedPriceRange === '2000-2999') {
        matchesPrice = prod.price >= 2000 && prod.price <= 2999;
      } else if (selectedPriceRange === '3000-plus') {
        matchesPrice = prod.price >= 3000;
      }

      // In stock filter
      const matchesStock = !onlyInStock || prod.inStock;

      // Special badge filter
      let matchesSpecial = true;
      if (onlySpecial === 'bestsellers') {
        matchesSpecial = !!prod.isBestseller;
      } else if (onlySpecial === 'new') {
        matchesSpecial = !!prod.isNew;
      }

      return matchesCategory && matchesSearch && matchesPrice && matchesStock && matchesSpecial;
    });

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else if (sortBy === 'bestseller') {
      result.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
    }

    return result;
  }, [selectedCategory, searchQuery, selectedPriceRange, sortBy, onlyInStock, onlySpecial]);

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    searchQuery.trim() !== '' ||
    selectedPriceRange !== 'all' ||
    onlyInStock ||
    onlySpecial !== 'all';

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSelectedPriceRange('all');
    setSortBy('bestseller');
    setOnlyInStock(false);
    setOnlySpecial('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Store Hero Banner */}
      <div className="relative rounded-3xl p-6 sm:p-10 glass border border-gold/30 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold-light text-xs font-semibold border border-gold/20">
              <Globe className="w-3.5 h-3.5" />
              <span>Official Creator Brand • Worldwide Express Shipping</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              Official <span className="text-gradient-gold">Merchandise</span> &amp; Apparel
            </h1>
            <p className="text-secondary text-sm sm:text-base leading-relaxed">
              Curated luxury fashion, relaxed linen shirts, heavyweight joggers, couple jewelry, and signed collector pieces designed for Ishq Army and fans of Shiddat, Pretending To Be Yours &amp; Not My Type.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-gold-light text-xs font-bold transition-all shadow-sm"
              >
                <PackageCheck className="w-4 h-4" />
                <span>View My Orders &amp; Track Packages</span>
              </Link>
              <span className="text-xs text-muted">
                🚚 Free shipping on orders above ₹1,999
              </span>
            </div>
          </div>

          {/* Official Logo Badge Card */}
          <div className="shrink-0 flex items-center gap-4 p-4 rounded-2xl glass border border-gold/30 bg-surface/50 shadow-inner">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-gold/50 shadow-md shadow-gold/20 shrink-0">
              <Image
                src="/logo.png"
                alt="Ishika's World Brand Seal"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gold">Official Seal</span>
              <p className="text-sm font-bold text-foreground">100% Authentic Merch</p>
              <p className="text-xs text-muted">Signed &amp; Verified by Ishika</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Hub */}
      <div className="space-y-6">
        {/* Top Control Bar: Search + Quick Toggles + Sort */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shirts, pants, hoodies, jewelry, prints..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-elevated border border-border text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Price Range + In Stock + Sort */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-elevated border border-border text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-gold shrink-0" />
              <span className="text-muted hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort products"
                className="bg-transparent text-foreground text-xs focus:outline-none cursor-pointer"
              >
                <option value="bestseller" className="bg-card text-foreground">Featured &amp; Bestselling</option>
                <option value="newest" className="bg-card text-foreground">Newest Drops First</option>
                <option value="price-low" className="bg-card text-foreground">Price: Low to High</option>
                <option value="price-high" className="bg-card text-foreground">Price: High to Low</option>
                <option value="rating" className="bg-card text-foreground">Highest Customer Rating</option>
              </select>
            </div>

            {/* Filter Toggle Button for More Controls */}
            <button
              onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                isFilterDrawerOpen || selectedPriceRange !== 'all' || onlyInStock || onlySpecial !== 'all'
                  ? 'bg-gold/20 border-gold text-gold-light'
                  : 'bg-elevated border-border text-secondary hover:text-foreground'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(selectedPriceRange !== 'all' || onlyInStock || onlySpecial !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-rose animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Filter Expansion Tray */}
        {isFilterDrawerOpen && (
          <div className="glass rounded-2xl p-5 border border-border/60 bg-surface/40 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Price Range Filter */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Price Range</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under-1000', label: 'Under ₹1,000' },
                    { id: '1000-1999', label: '₹1,000 - ₹1,999' },
                    { id: '2000-2999', label: '₹2,000 - ₹2,999' },
                    { id: '3000-plus', label: '₹3,000+' },
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedPriceRange(tier.id as PriceRange)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                        selectedPriceRange === tier.id
                          ? 'bg-gold text-background font-bold shadow'
                          : 'bg-elevated text-secondary hover:text-foreground border border-border/40'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Badges Filter */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Product Highlights</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'All Items' },
                    { id: 'bestsellers', label: '⭐ Bestsellers' },
                    { id: 'new', label: '✨ New Drops' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setOnlySpecial(item.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                        onlySpecial === item.id
                          ? 'bg-rose text-white font-bold shadow'
                          : 'bg-elevated text-secondary hover:text-foreground border border-border/40'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Availability Toggle */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Availability</span>
                <div>
                  <button
                    onClick={() => setOnlyInStock(!onlyInStock)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      onlyInStock
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-elevated border-border text-secondary hover:text-foreground'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${onlyInStock ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-muted'}`}>
                      {onlyInStock && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span>In-Stock Ready to Ship</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter Pills with Badges */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-border/40">
          {PRODUCT_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gold text-background font-bold shadow-md shadow-gold/20 scale-[1.02]'
                    : 'bg-surface hover:bg-elevated text-secondary hover:text-foreground border border-border/40'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-background/20 text-background' : 'bg-white/10 text-muted'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Filter Chips & Results Count Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-secondary font-medium">
              Showing <strong className="text-foreground">{filteredProducts.length}</strong> of {MOCK_PRODUCTS.length} merchandise items
            </span>

            {/* Active chips */}
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/15 text-gold-light border border-gold/30">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('All')} className="hover:text-white" title="Remove category filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedPriceRange !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose/15 text-rose-light border border-rose/30">
                Price: {selectedPriceRange}
                <button onClick={() => setSelectedPriceRange('all')} className="hover:text-white" title="Remove price filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {onlyInStock && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                In Stock Only
                <button onClick={() => setOnlyInStock(false)} className="hover:text-white" title="Remove stock filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {onlySpecial !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/15 text-gold border border-gold/30">
                {onlySpecial === 'bestsellers' ? 'Bestsellers' : 'New Drops'}
                <button onClick={() => setOnlySpecial('all')} className="hover:text-white" title="Remove highlight filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-foreground border border-white/20">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery('')} className="hover:text-white" title="Clear search query">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 text-gold hover:text-gold-light transition-colors font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <section className="space-y-6">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 glass rounded-3xl border border-border/50 space-y-4 max-w-xl mx-auto p-8">
            <ShoppingBag className="w-16 h-16 text-muted mx-auto stroke-[1.2]" />
            <h3 className="text-xl font-bold text-foreground">No matching merchandise found</h3>
            <p className="text-sm text-muted">
              We couldn&apos;t find any merchandise matching your current filter criteria. Try resetting filters or exploring other categories.
            </p>
            <div className="pt-2">
              <button
                onClick={resetAllFilters}
                className="px-6 py-2.5 rounded-xl bg-gold text-background font-bold text-xs hover:bg-gold-light transition-all shadow-lg shadow-gold/20"
              >
                Show All Merchandise
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Trust & Guarantee Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-border/40">
        <div className="flex items-center gap-4 p-5 rounded-2xl glass border border-border/40">
          <Truck className="w-8 h-8 text-gold shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-foreground">Insured Express Delivery</h4>
            <p className="text-xs text-muted">Dispatched with live tracking via BlueDart &amp; Delhivery.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 rounded-2xl glass border border-border/40">
          <Sparkles className="w-8 h-8 text-rose-light shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-foreground">Premium Creator Craftsmanship</h4>
            <p className="text-xs text-muted">Heavyweight French terry cotton &amp; 18K gold vermeil plating.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 rounded-2xl glass border border-border/40">
          <PackageCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-foreground">Direct Order Tracking</h4>
            <p className="text-xs text-muted">Track all your shipments in real-time on your Orders dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
