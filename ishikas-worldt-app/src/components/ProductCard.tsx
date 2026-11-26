import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Star, ShoppingBag } from 'lucide-react-native';
import { Product } from '../types';
import { COLORS } from '../theme/colors';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onQuickAdd?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onQuickAdd,
}) => {
  const discountPct = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Product Image */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Badges */}
        {product.isBestseller && (
          <View style={styles.bestsellerBadge}>
            <Text style={styles.badgeText}>BESTSELLER</Text>
          </View>
        )}
        {product.isNew && !product.isBestseller && (
          <View style={styles.newBadge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        )}

        {discountPct > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPct}% OFF</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.content}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Star size={12} color="#f59e0b" fill="#f59e0b" />
          <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
          <Text style={styles.reviewsText}>({product.reviews})</Text>
        </View>

        {/* Price & Quick Add */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
            {product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={onQuickAdd || onPress}
            activeOpacity={0.8}
          >
            <ShoppingBag size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.black.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.black.border,
    marginBottom: 14,
    flex: 1,
    marginHorizontal: 4,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.black.surface,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bestsellerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.gold.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.rose.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  discountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#6ee7b7',
    fontSize: 9,
    fontWeight: '800',
  },
  content: {
    padding: 10,
  },
  category: {
    color: COLORS.text.muted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  name: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    height: 32,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  ratingText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
  },
  reviewsText: {
    color: COLORS.text.muted,
    fontSize: 9,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  originalPrice: {
    color: COLORS.text.muted,
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.rose.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
