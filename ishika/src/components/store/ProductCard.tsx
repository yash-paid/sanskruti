'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { formatPrice, getDiscountPercentage } from '@/lib/utils';
import type { Product } from '@/types';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-gold/30 transition-all duration-300 hover:shadow-lg hover:shadow-gold/5 flex flex-col">
        {/* Product Image Area */}
        <div className="relative aspect-square overflow-hidden bg-surface">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Top Left: Single Sleek Micro-Badge (No Clutter, Never Overlaps Photo) */}
          {(product.isBestseller || product.isNew) && (
            <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
              {product.isBestseller ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-gold border border-gold/40 shadow-sm">
                  ★ Bestseller
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-rose-light border border-rose/40 shadow-sm">
                  ✨ New
                </span>
              )}
            </div>
          )}

          {/* Top Right: Wishlist Icon Button */}
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/50 backdrop-blur-md text-white/80 hover:bg-rose hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10 shadow"
            title="Add to Wishlist"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>

          {/* Quick Add on Hover */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-10">
            <button 
              type="button"
              className="w-full py-2 bg-white text-black text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-rose hover:text-white transition-colors shadow-lg"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Quick View
            </button>
          </div>
        </div>

        {/* Product Info Section (Clean & Organized) */}
        <div className="p-3.5 sm:p-4 space-y-1.5 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-muted uppercase font-bold tracking-wider">{product.category}</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-gold fill-gold" />
                <span className="font-semibold text-secondary">{product.rating}</span>
                <span className="text-muted">({product.reviews})</span>
              </div>
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-1 group-hover:text-gold-light transition-colors">
              {product.name}
            </h3>
          </div>

          {/* Price Row: Discount Badge cleanly integrated beside original price */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-sm sm:text-base font-extrabold text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-xs text-muted line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-rose/15 text-rose-light border border-rose/30">
                  {getDiscountPercentage(product.originalPrice, product.price)}% OFF
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
