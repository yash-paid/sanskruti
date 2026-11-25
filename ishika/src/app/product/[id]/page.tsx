'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShieldCheck, Truck, RefreshCcw, ShoppingBag, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/store/ProductCard';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { formatPrice, getDiscountPercentage } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const { addItem } = useCart();

  const product = MOCK_PRODUCTS.find((p) => p.id === productId) || MOCK_PRODUCTS[0];
  const relatedProducts = MOCK_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes ? product.sizes[0] : undefined);
  const [selectedColor, setSelectedColor] = useState(product.colors ? product.colors[0].name : undefined);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  const handleAddToCart = () => {
    addItem(product, quantity, selectedSize, selectedColor);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Breadcrumb */}
      <div>
        <Link href="/store" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Store Collection</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Product Images Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden glass border border-border/60 shadow-xl">
            <Image
              src={product.images[selectedImage] || product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {(product.isBestseller || product.isNew) && (
              <div className="absolute top-4 left-4 z-10">
                {product.isBestseller ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-gold border border-gold/40 shadow-lg">
                    ★ Bestseller
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-rose-light border border-rose/40 shadow-lg">
                    ✨ New Drop
                  </span>
                )}
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === idx ? 'border-rose scale-105' : 'border-transparent opacity-60'
                  }`}
                >
                  <Image src={img} alt="Thumb" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info & Purchase Options */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gold uppercase tracking-wider">{product.category}</span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">{product.name}</h1>
            <div className="flex items-center gap-2">
              <div className="flex text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <span className="text-xs text-secondary">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-foreground">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <>
                <span className="text-base text-muted line-through">{formatPrice(product.originalPrice)}</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-rose/15 text-rose-light border border-rose/30">
                  {getDiscountPercentage(product.originalPrice, product.price)}% OFF
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-secondary leading-relaxed">{product.description}</p>

          {/* Color Selector */}
          {product.colors && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Color: {selectedColor}</label>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedColor === c.name ? 'border-rose scale-110 shadow-md' : 'border-border/60'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {selectedColor === c.name && <Check className="w-3.5 h-3.5 text-white mix-blend-difference" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Select Size</label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedSize === s
                        ? 'bg-rose text-white border-rose shadow-md'
                        : 'bg-elevated text-secondary border-border hover:border-rose/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Controls */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Quantity</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-xl bg-elevated">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-secondary hover:text-foreground"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-foreground">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-secondary hover:text-foreground"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Button size="lg" variant="primary" className="flex-1" onClick={handleAddToCart}>
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </Button>
            <Link href="/cart" className="flex-1">
              <Button size="lg" variant="gold" className="w-full" onClick={handleAddToCart}>
                <span>Buy Now</span>
              </Button>
            </Link>
          </div>

          {addedToast && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium text-center">
              ✓ Added to your shopping cart!
            </div>
          )}

          {/* Guarantees Strip */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/40 text-center text-xs text-muted">
            <div className="space-y-1">
              <Truck className="w-4 h-4 mx-auto text-gold" />
              <p className="font-semibold text-foreground">Worldwide Shipping</p>
              <p className="text-[10px]">Tracked &amp; Insured</p>
            </div>
            <div className="space-y-1">
              <ShieldCheck className="w-4 h-4 mx-auto text-rose" />
              <p className="font-semibold text-foreground">Authentic Drop</p>
              <p className="text-[10px]">100% Genuine</p>
            </div>
            <div className="space-y-1">
              <RefreshCcw className="w-4 h-4 mx-auto text-purple-400" />
              <p className="font-semibold text-foreground">Hassle-Free Return</p>
              <p className="text-[10px]">14 Days Window</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="space-y-6 pt-12 border-t border-border/40">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">You Might Also Love</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {relatedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
