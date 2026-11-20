import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Zap,
  Star,
  CheckCircle2,
  ShieldCheck,
  CloudDownload,
  Infinity,
  Share2,
  Lock,
  Play
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { products, addToCart, showToast } = useStore();
  const navigate = useNavigate();

  const product = products.find((p) => p.slug === slug) || products[0];
  const [selectedImage, setSelectedImage] = useState(product?.image);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product?.slug]);

  const relatedProducts = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.bestseller))
    .slice(0, 5);

  const handleBuyNow = () => {
    addToCart(product, 1);
    navigate('/checkout');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!');
    }
  };

  return (
    <div className="py-6 sm:py-10 bg-white min-h-screen text-[#202027]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumbs */}
        <nav className="text-[11px] font-['Montserrat'] font-medium text-[#777777] flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-[#ff673c] transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#ff673c] transition-colors">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-[#ff673c] transition-colors">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-[#202027] font-semibold truncate">{product.title}</span>
        </nav>

        {/* Product Hero Split (Two Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Image Gallery (lg:col-span-6) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative aspect-square w-full rounded-[6px] overflow-hidden bg-[#f7f7f7] border border-[#e6e6e6]">
              <span className="absolute top-[10px] left-[10px] z-10 bg-[#252525] text-white text-[11px] font-semibold px-2.5 py-1 rounded-[6px] shadow-sm">
                {product.badge}
              </span>
              <img
                src={selectedImage || product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Gallery Thumbnails (if multiple images) */}
            {product.galleryImages && product.galleryImages.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedImage(product.image)}
                  className={`w-16 h-16 rounded-[6px] overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === product.image
                      ? 'border-[#ff673c]'
                      : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={product.image} alt="main" className="w-full h-full object-cover" />
                </button>
                {product.galleryImages.slice(0, 5).map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-[6px] overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImage === img
                        ? 'border-[#ff673c]'
                        : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`gallery-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Points Bar */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 font-['Montserrat']">
              <div className="p-3 rounded-[8px] bg-[#fff8f5] border border-[#ffeedd] text-center space-y-1">
                <CloudDownload size={18} className="mx-auto text-[#ff673c]" />
                <span className="text-[10px] sm:text-[11px] font-bold text-[#202027] block">Instant Download</span>
              </div>
              <div className="p-3 rounded-[8px] bg-[#fff8f5] border border-[#ffeedd] text-center space-y-1">
                <Infinity size={18} className="mx-auto text-[#ff673c]" />
                <span className="text-[10px] sm:text-[11px] font-bold text-[#202027] block">Lifetime Access</span>
              </div>
              <div className="p-3 rounded-[8px] bg-[#fff8f5] border border-[#ffeedd] text-center space-y-1">
                <ShieldCheck size={18} className="mx-auto text-[#3bb54a]" />
                <span className="text-[10px] sm:text-[11px] font-bold text-[#202027] block">100% Verified Safe</span>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Purchase Controls (lg:col-span-6) */}
          <div className="lg:col-span-6 space-y-5 font-['Montserrat']">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#b94845] tracking-[1.5px] bg-[#ffeedd]/60 px-2.5 py-0.5 rounded-[5px]">
                {product.category}
              </span>
              <h1 className="text-[20px] sm:text-[24px] lg:text-[26px] font-bold text-[#222222] font-['Lexend_Deca'] mt-2.5 leading-[1.3]">
                {product.title}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2 text-[12px]">
                <div className="flex items-center text-[#ff9800]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-current" />
                  ))}
                </div>
                <span className="font-bold text-[#202027]">{product.rating}</span>
                <span className="text-gray-400">({product.reviewsCount} verified reviews)</span>
                <span className="text-gray-300">|</span>
                <span className="text-[#3bb54a] font-semibold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 size={13} /> Instant Digital Delivery
                </span>
              </div>
            </div>

            {/* Pricing Box (Exact febric styling) */}
            <div className="p-4 sm:p-5 rounded-[10px] bg-[#fff8f5] border border-[#ffeedd] space-y-1.5">
              <div className="flex items-baseline gap-3">
                <span className="text-[28px] sm:text-[32px] font-[800] text-[#222222] font-['Montserrat'] leading-none">
                  ₹{product.salePrice}
                </span>
                <span className="text-[18px] sm:text-[20px] text-[#000000] opacity-80 font-[500] line-through font-['Montserrat']">
                  ₹{product.regularPrice}
                </span>
                <span className="text-[11px] font-bold text-white bg-[#ff673c] px-2 py-0.5 rounded-[5px]">
                  SAVE ₹{product.regularPrice - product.salePrice} ({product.badge})
                </span>
              </div>
              <p className="text-[12px] text-[#666666] font-normal">
                One-time payment • Lifetime cloud link access • Zero subscription fees
              </p>
            </div>

            {/* Short Description */}
            <p className="text-[13px] text-[#555555] leading-[1.8] font-normal">
              {product.shortDescription}
            </p>

            {/* Key Deliverables Bullet Points */}
            <div className="space-y-2 p-4 rounded-[10px] bg-[#fbfbfb] border border-[#ececec]">
              <div className="text-[11px] font-bold text-[#202027] uppercase tracking-wider">
                What's Included in this Bundle:
              </div>
              <ul className="space-y-1.5 text-[12px] text-[#444444]">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#ef5151] font-bold flex-shrink-0">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Primary High-converting Buy Now CTA (Exact .febric-main-buy-button) */}
              <button
                type="button"
                onClick={handleBuyNow}
                className="febric-main-buy-button"
              >
                <span>⚡ Buy Now - Just ₹{product.salePrice}/- Only</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => addToCart(product, 1)}
                  className="w-full bg-[#202027] hover:bg-black text-white font-semibold py-3 px-4 rounded-[6px] text-[12px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingBag size={15} />
                  <span>Add To Cart</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full border border-[#d6d6d6] hover:border-gray-400 text-[#444444] font-semibold py-3 px-4 rounded-[6px] text-[12px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors bg-white"
                >
                  <Share2 size={14} />
                  <span>Share Product</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#777777] pt-1">
              <Lock size={13} className="text-[#777777]" />
              <span>Guaranteed 256-Bit SSL Encrypted Indian Gateway Checkout</span>
            </div>
          </div>

        </div>

        {/* SAMPLE VIDEOS 🔥 SECTION (Pixel-perfect reproduction of Elementor Video Grid) */}
        {product.previewVideos && product.previewVideos.length > 0 && (
          <div className="pt-10 sm:pt-14 border-t border-[#f0f0f0]">
            <h2 className="febric-sample-videos-heading">
              SAMPLE VIDEOS 🔥
            </h2>

            <div className="febric-sample-videos-grid max-w-[1200px] mx-auto">
              {product.previewVideos.map((vidUrl, idx) => (
                <div key={idx} className="relative aspect-[9/16] w-full bg-black overflow-hidden border-r last:border-r-0 border-[#222]">
                  <video
                    src={vidUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    controlsList="nodownload"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slide Deck Visual Previews (for Infographics) */}
        {product.galleryImages && product.galleryImages.length > 0 && (
          <div className="pt-8 border-t border-[#f0f0f0]">
            <h3 className="text-[18px] sm:text-[22px] font-bold text-[#202027] font-['Lexend_Deca'] text-center mb-6">
              Infographic Slide Previews & Icon Sets
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-[1200px] mx-auto">
              {product.galleryImages.map((img, idx) => (
                <div key={idx} className="aspect-[4/3] rounded-[8px] overflow-hidden border border-[#e6e6e6] bg-[#f9f9f9]">
                  <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DETAILED PRODUCT DETAILS (.fsb-container) */}
        <div className="pt-8 border-t border-[#f0f0f0]">
          <div className="fsb-container max-w-[1200px] mx-auto">
            
            {/* Main Heading */}
            <div className="fsb-heading">
              <span>🦁✨</span>
              <h2>{product.title}</h2>
            </div>

            {/* Story / About Section */}
            <section className="fsb-section">
              <h3>🦁 What Makes This Bundle Special?</h3>
              <p>
                Every high-growth page needs captivating content. {product.title} delivers hyper-engaging, algorithm-optimized creative assets that keep your audience hooked from the very first second.
              </p>
              <p>
                Whether you're starting a new Instagram page from scratch or scaling an existing YouTube channel, this ready-to-post bundle saves you countless hours of editing, rendering, and sound syncing.
              </p>

              {/* Soft Highlight Box */}
              <div className="fsb-box space-y-1">
                <div className="fsb-story-line">❤️ Stories and reels filled with viral emotions & hooks</div>
                <div className="fsb-story-line">🎬 Full 1080x1920 4K Ultra-HD 60FPS vertical format</div>
                <div className="fsb-story-line">🔥 Pre-synced dynamic animated subtitles & trending sound effects</div>
                <div className="fsb-story-line">💪 Zero copyright strikes — 100% monetizable commercial license</div>
                <div className="fsb-story-line">⚡ Instant on-screen and email Google Drive link delivery</div>
              </div>
            </section>

            {/* What's Inside the Bundle Section */}
            <section className="fsb-section">
              <h3>🌟 What's Inside the Bundle?</h3>
              <div className="space-y-1 pt-1">
                {product.features.map((feat, idx) => (
                  <div key={idx} className="fsb-check">
                    {feat}
                  </div>
                ))}
              </div>
            </section>

            {/* Perfect For Section */}
            <section className="fsb-section">
              <h3>💼 Perfect For:</h3>
              <div className="space-y-1 pt-1">
                <div className="fsb-check">Instagram Creators & Theme Page Owners wanting rapid follower growth</div>
                <div className="fsb-check">YouTube Shorts creators looking for automated high-retention video content</div>
                <div className="fsb-check">Digital marketing agencies running client viral campaigns</div>
                <div className="fsb-check">Freelancers & video editors building social media management portfolios</div>
              </div>
            </section>

            {/* Why Choose Section */}
            <section className="fsb-section">
              <h3>💡 Why Choose Sanskruti Store?</h3>
              <div className="space-y-1 pt-1">
                <div className="fsb-check">Lifetime Access with a single one-time payment — zero hidden fees</div>
                <div className="fsb-check">Free future updates — newly added videos in this bundle are 100% free</div>
                <div className="fsb-check">Friendly customer support available via WhatsApp for instant assistance</div>
              </div>
            </section>

            {/* Final Callout Box */}
            <div className="fsb-final">
              🚀 Instant Google Drive download link delivered right after payment with lifetime access!
            </div>

          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="pt-8 border-t border-[#f0f0f0] max-w-[1200px] mx-auto font-['Montserrat']">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-bold text-[#202027] font-['Lexend_Deca']">
              Verified Customer Reviews ({product.reviewsCount})
            </h3>
            <span className="text-[11px] font-semibold text-[#ff673c]">
              ⭐ 4.9 out of 5 Rating
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-[10px] bg-[#fbfbfb] border border-[#ececec] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[12px] text-[#202027]">Praveen M.</span>
                <span className="text-[10px] text-gray-400">12 Nov 2026</span>
              </div>
              <div className="flex text-[#ff9800]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="fill-current" />
                ))}
              </div>
              <p className="text-[12px] text-[#555555] leading-[1.6]">
                "Super high quality! The download link was active within seconds of payment. Will buy more packs soon."
              </p>
            </div>

            <div className="p-4 rounded-[10px] bg-[#fbfbfb] border border-[#ececec] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[12px] text-[#202027]">Rohit Sharma</span>
                <span className="text-[10px] text-gray-400">08 Nov 2026</span>
              </div>
              <div className="flex text-[#ff9800]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="fill-current" />
                ))}
              </div>
              <p className="text-[12px] text-[#555555] leading-[1.6]">
                "Amazing bundle. Videos are crisp 1080p without any watermark. One reel hit 200k views in 4 days!"
              </p>
            </div>
          </div>
        </div>

        {/* Related Products Carousel */}
        <div className="pt-10 border-t border-[#f0f0f0] font-['Lexend_Deca']">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[20px] sm:text-[24px] font-semibold text-[#202027]">
              Related Digital <span className="text-[#ff673c]">Bundles</span>
            </h2>
            <Link
              to="/shop"
              className="text-[11px] font-medium text-[#ff673c] hover:underline"
            >
              Browse All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                className="flex flex-col border border-[#e6e6e6] rounded-[12px] bg-white overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_9px_22px_rgba(0,0,0,0.06)] relative group"
              >
                <div className="absolute top-[9px] left-[9px] z-10 bg-[#252525] text-white text-[10px] font-semibold px-2 py-1 rounded-[6px] leading-[1.2]">
                  {p.badge}
                </div>

                <Link to={`/product/${p.slug}`} className="block relative aspect-square w-full overflow-hidden bg-[#f7f7f7]">
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>

                <div className="p-[11px] pb-[10px] flex-1 flex flex-col justify-between min-h-[90px]">
                  <div>
                    <span className="block text-[10px] text-[#999999] leading-[1.5] mb-1 line-clamp-1">
                      {p.category}
                    </span>
                    <Link to={`/product/${p.slug}`} className="block">
                      <h3
                        className="text-[12px] font-medium text-[#25252b] leading-[1.5] line-clamp-2 hover:text-[#ff673c] transition-colors"
                        title={p.title}
                      >
                        {p.title}
                      </h3>
                    </Link>
                  </div>
                </div>

                <div className="min-h-[46px] px-[11px] py-2 border-t border-[#ececec] flex items-center justify-between gap-1.5 font-['Montserrat']">
                  <div className="text-[12px] font-semibold text-[#ff673c] whitespace-nowrap">
                    <del className="text-[10px] text-[#aaaaaa] font-normal mr-1">
                      ₹{p.regularPrice}
                    </del>
                    <ins className="no-underline text-[#ff673c]">
                      ₹{p.salePrice}
                    </ins>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(p, 1)}
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

      </div>

      {/* Sticky Bottom Buy Now Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#e6e6e6] py-2.5 px-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-4 max-w-[1500px] mx-auto font-['Montserrat']">
        <div className="hidden sm:flex items-center gap-3">
          <img src={product.image} alt={product.title} className="w-10 h-10 rounded-[6px] object-cover border border-[#e6e6e6]" />
          <div>
            <div className="text-[12px] font-bold text-[#202027] truncate max-w-sm">{product.title}</div>
            <div className="text-[12px] font-bold text-[#ff673c]">
              ₹{product.salePrice}{' '}
              <span className="text-[#aaaaaa] line-through font-normal text-[10px] ml-1">
                ₹{product.regularPrice}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 sm:flex-initial flex items-center gap-2 justify-end w-full sm:w-auto">
          <button
            type="button"
            onClick={() => addToCart(product, 1)}
            className="px-4 py-2 border border-[#d6d6d6] hover:bg-gray-50 text-[#32323a] rounded-[6px] text-[11px] font-semibold transition-colors"
          >
            Add to Cart
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="flex-1 sm:flex-initial px-6 py-2 bg-[#e60055] hover:bg-[#d0004d] text-white rounded-[6px] text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Zap size={14} className="fill-current" />
            <span>⚡ Buy Now (₹{product.salePrice})</span>
          </button>
        </div>
      </div>

    </div>
  );
}
