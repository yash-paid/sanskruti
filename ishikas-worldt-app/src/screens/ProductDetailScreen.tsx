import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import {
  ChevronLeft,
  Star,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Product, ProductColor } from '../types';
import { COLORS } from '../theme/colors';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export const ProductDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { product } = route.params as { product: Product };
  const { addToCart } = useApp();

  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0]);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  const discountPct = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    navigation.navigate('Cart');
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {product.name}
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <ShoppingBag size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Product Image Carousel */}
        <View style={styles.imageCarouselWrap}>
          <Image
            source={{ uri: product.images[selectedImageIdx] || product.images[0] }}
            style={styles.mainImage}
            resizeMode="cover"
          />

          {/* Thumbnails row if multiple images */}
          {product.images.length > 1 && (
            <View style={styles.thumbnailRow}>
              {product.images.map((img, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.thumbWrap,
                    selectedImageIdx === i && styles.thumbWrapActive,
                  ]}
                  onPress={() => setSelectedImageIdx(i)}
                >
                  <Image source={{ uri: img }} style={styles.thumbImage} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.contentWrap}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Rating & Stock */}
          <View style={styles.ratingStockRow}>
            <View style={styles.ratingBadge}>
              <Star size={12} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
              <Text style={styles.reviewsText}>({product.reviews} reviews)</Text>
            </View>
            <Text style={styles.stockText}>In Stock • Ready to Dispatch</Text>
          </View>

          {/* Pricing */}
          <View style={styles.pricingRow}>
            <Text style={styles.price}>
              ₹{product.price.toLocaleString('en-IN')}
            </Text>
            {product.originalPrice > product.price && (
              <>
                <Text style={styles.originalPrice}>
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPct}% OFF</Text>
                </View>
              </>
            )}
          </View>

          {/* Color Selector */}
          <View style={styles.selectorSection}>
            <Text style={styles.selectorHeading}>
              Color: <Text style={styles.selectorValue}>{selectedColor.name}</Text>
            </Text>
            <View style={styles.colorsRow}>
              {product.colors.map((color) => (
                <TouchableOpacity
                  key={color.name}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color.hex },
                    selectedColor.name === color.name && styles.colorCircleActive,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor.name === color.name && (
                    <Check size={14} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Size Selector */}
          <View style={styles.selectorSection}>
            <Text style={styles.selectorHeading}>
              Size: <Text style={styles.selectorValue}>{selectedSize}</Text>
            </Text>
            <View style={styles.sizesRow}>
              {product.sizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeBox,
                    selectedSize === size && styles.sizeBoxActive,
                  ]}
                  onPress={() => setSelectedSize(size)}
                >
                  <Text
                    style={[
                      styles.sizeText,
                      selectedSize === size && styles.sizeTextActive,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quantity Selector */}
          <View style={styles.selectorSection}>
            <Text style={styles.selectorHeading}>Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.descHeading}>Product Description</Text>
            <Text style={styles.descText}>{product.description}</Text>
          </View>

          {/* Delivery & Assurance */}
          <View style={styles.assurances}>
            <View style={styles.assuranceItem}>
              <Truck size={16} color={COLORS.emerald.primary} />
              <Text style={styles.assuranceText}>
                Fast Pan-India Delivery (3-5 business days)
              </Text>
            </View>
            <View style={styles.assuranceItem}>
              <ShieldCheck size={16} color={COLORS.gold.primary} />
              <Text style={styles.assuranceText}>
                100% Genuine Ishq Army Creator Merchandise
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <ShoppingBag size={18} color="#fff" />
          <Text style={styles.addToCartText}>
            {addedToast ? 'Added to Bag! ✅' : 'Add to Bag'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyNowBtn}
          onPress={handleBuyNow}
          activeOpacity={0.88}
        >
          <Text style={styles.buyNowText}>Instant Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black.primary,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '70%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  imageCarouselWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.black.surface,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrapActive: {
    borderColor: COLORS.rose.primary,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  contentWrap: {
    padding: 18,
  },
  category: {
    color: COLORS.rose.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  ratingStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '800',
  },
  reviewsText: {
    color: COLORS.text.muted,
    fontSize: 11,
  },
  stockText: {
    color: COLORS.emerald.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  price: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  originalPrice: {
    color: COLORS.text.muted,
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountText: {
    color: COLORS.emerald.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  selectorSection: {
    marginBottom: 16,
  },
  selectorHeading: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectorValue: {
    color: '#fff',
    fontWeight: '800',
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: '#fff',
  },
  sizesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeBox: {
    minWidth: 44,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.black.surface,
    borderWidth: 1,
    borderColor: COLORS.black.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBoxActive: {
    backgroundColor: COLORS.rose.primary,
    borderColor: COLORS.rose.primary,
  },
  sizeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  sizeTextActive: {
    fontWeight: '900',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.black.surface,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.black.border,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  qtyValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  descSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  descHeading: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  descText: {
    color: COLORS.text.secondary,
    fontSize: 12,
    lineHeight: 18,
  },
  assurances: {
    backgroundColor: COLORS.black.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.black.border,
    gap: 10,
  },
  assuranceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assuranceText: {
    color: COLORS.text.secondary,
    fontSize: 11,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.black.card,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.black.border,
    gap: 10,
  },
  addToCartBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.black.surface,
    borderWidth: 1,
    borderColor: COLORS.rose.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  buyNowBtn: {
    flex: 1.2,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.rose.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
