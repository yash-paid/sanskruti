import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { ChevronLeft, Package, Truck, CheckCircle2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const MyOrdersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { orders } = useApp();

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 36 }} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={48} color={COLORS.text.muted} />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySub}>
            You haven't ordered any creator merchandise yet. Check out our store!
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('Store')}
          >
            <Text style={styles.shopBtnText}>VISIT STORE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderDate}>Placed on {order.date}</Text>
                </View>

                {/* Status Pill */}
                <View
                  style={[
                    styles.statusPill,
                    order.status === 'Delivered'
                      ? styles.deliveredPill
                      : order.status === 'Shipped'
                      ? styles.shippedPill
                      : styles.processingPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      order.status === 'Delivered'
                        ? styles.deliveredText
                        : order.status === 'Shipped'
                        ? styles.shippedText
                        : styles.processingText,
                    ]}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>

              {/* Order Items */}
              <View style={styles.itemsWrap}>
                {order.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Image source={{ uri: item.image }} style={styles.itemThumb} />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemMeta}>
                        Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                      </Text>
                      <Text style={styles.itemPrice}>
                        ₹{item.price.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Order Footer */}
              <View style={styles.orderFooter}>
                <Text style={styles.paymentMethod}>
                  Paid via {order.paymentMethod}
                </Text>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total: </Text>
                  <Text style={styles.totalAmount}>
                    ₹{order.total.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black.primary,
  },
  topHeader: {
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
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
    color: COLORS.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  shopBtn: {
    backgroundColor: COLORS.rose.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  shopBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  orderCard: {
    backgroundColor: COLORS.black.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.black.border,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  orderId: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  orderDate: {
    color: COLORS.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deliveredPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  deliveredText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
  },
  shippedPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  shippedText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: '800',
  },
  processingPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  processingText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemsWrap: {
    paddingVertical: 12,
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: COLORS.black.surface,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  itemMeta: {
    color: COLORS.text.muted,
    fontSize: 10,
    marginTop: 2,
  },
  itemPrice: {
    color: COLORS.rose.primary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  paymentMethod: {
    color: COLORS.text.muted,
    fontSize: 10,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
  },
  totalAmount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
});
