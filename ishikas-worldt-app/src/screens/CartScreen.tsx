import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  ChevronLeft,
  Trash2,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { cart, removeFromCart, updateCartQuantity, cartTotal, placeOrder, clearCart } =
    useApp();
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [placedOrderId, setPlacedOrderId] = useState<string>('');

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const order = placeOrder('PayU Online Gateway');
    setPlacedOrderId(order.id);
    setShowSuccessModal(true);
  };

  if (cart.length === 0 && !showSuccessModal) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Shopping Bag</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.emptyContainer}>
          <ShoppingBag size={56} color={COLORS.text.muted} />
          <Text style={styles.emptyTitle}>Your Bag is Empty</Text>
          <Text style={styles.emptySub}>
            Discover luxury creator hoodies, tees, and embroidered satin jackets.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('Store')}
            activeOpacity={0.85}
          >
            <Text style={styles.exploreBtnText}>EXPLORE MERCH STORE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <Text style={styles.topBarTitle}>Shopping Bag ({cart.length})</Text>
        <TouchableOpacity style={styles.backBtn} onPress={clearCart}>
          <Trash2 size={16} color={COLORS.text.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Items List */}
        <View style={styles.itemsList}>
          {cart.map((item) => (
            <View key={item.id} style={styles.cartItemCard}>
              <Image
                source={{ uri: item.product.images[0] }}
                style={styles.itemImage}
                resizeMode="cover"
              />

              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemVariants}>
                  Size: {item.selectedSize} • Color: {item.selectedColor.name}
                </Text>
                <Text style={styles.itemPrice}>
                  ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                </Text>

                <View style={styles.itemBottomRow}>
                  {/* Quantity Counter */}
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateCartQuantity(item.id, -1)}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateCartQuantity(item.id, 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Remove Button */}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removeFromCart(item.id)}
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Bill Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeading}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bag Subtotal</Text>
            <Text style={styles.summaryVal}>
              ₹{cartTotal.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping (Ishq Army Special)</Text>
            <Text style={[styles.summaryVal, { color: '#10b981' }]}>FREE</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalVal}>
              ₹{cartTotal.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.payuBadgeRow}>
            <ShieldCheck size={14} color="#10b981" />
            <Text style={styles.payuBadgeText}>
              Instant PayU Checkout (Cards, UPI, NetBanking)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Checkout Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotalWrap}>
          <Text style={styles.bottomTotalLabel}>Total</Text>
          <Text style={styles.bottomTotalAmount}>
            ₹{cartTotal.toLocaleString('en-IN')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handleCheckout}
          activeOpacity={0.88}
        >
          <Text style={styles.checkoutBtnText}>PLACE ORDER (PAYU)</Text>
        </TouchableOpacity>
      </View>

      {/* Order Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successSheet}>
            <View style={styles.successIconCircle}>
              <Sparkles size={36} color="#d4a853" />
            </View>
            <Text style={styles.successTitle}>Order Confirmed! 🎉</Text>
            <Text style={styles.orderIdBadge}>Order #{placedOrderId}</Text>
            <Text style={styles.successSub}>
              Thank you for ordering official Ishq Army merchandise! You can track shipping updates directly in your My Orders section.
            </Text>

            <TouchableOpacity
              style={styles.viewOrdersBtn}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('MyOrders');
              }}
            >
              <Text style={styles.viewOrdersText}>VIEW IN MY ORDERS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  emptySub: {
    color: COLORS.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  exploreBtn: {
    backgroundColor: COLORS.rose.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  itemsList: {
    gap: 12,
    marginBottom: 20,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.black.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.black.border,
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.black.surface,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  itemVariants: {
    color: COLORS.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
  itemPrice: {
    color: COLORS.rose.primary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.black.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.black.border,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  qtyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 6,
  },
  summaryCard: {
    backgroundColor: COLORS.black.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.black.border,
    gap: 10,
  },
  summaryHeading: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
  },
  summaryVal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  totalVal: {
    color: COLORS.rose.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  payuBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  payuBadgeText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.black.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.black.border,
    gap: 16,
  },
  bottomTotalWrap: {
    flex: 1,
  },
  bottomTotalLabel: {
    color: COLORS.text.muted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  bottomTotalAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  checkoutBtn: {
    flex: 1.6,
    backgroundColor: COLORS.rose.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  successSheet: {
    backgroundColor: COLORS.black.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.black.border,
    gap: 10,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(212, 168, 83, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gold.primary,
  },
  successTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  orderIdBadge: {
    color: COLORS.gold.primary,
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: 'rgba(212, 168, 83, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  successSub: {
    color: COLORS.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  viewOrdersBtn: {
    backgroundColor: COLORS.rose.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  viewOrdersText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
