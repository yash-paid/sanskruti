'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Truck, 
  PackageCheck, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Check, 
  FileText, 
  ExternalLink,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  X,
  MapPin,
  CreditCard
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';

type OrderTab = 'all' | 'active' | 'delivered' | 'cancelled';

export default function OrdersPage() {
  const [selectedTab, setSelectedTab] = useState<OrderTab>('all');
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<Order | null>(null);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);
  const [ordersList, setOrdersList] = useState<Order[]>(MOCK_ORDERS);

  // Load newly placed orders from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ishika_user_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge newly placed orders at the top, avoiding duplicate IDs
          const existingIds = new Set(parsed.map((o: Order) => o.id));
          const rest = MOCK_ORDERS.filter(o => !existingIds.has(o.id));
          setOrdersList([...parsed, ...rest]);
        }
      }
    } catch {}
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = ordersList.length;
    const active = ordersList.filter(o => o.status === 'processing' || o.status === 'shipped').length;
    const delivered = ordersList.filter(o => o.status === 'delivered').length;
    const totalSpent = ordersList.reduce((acc, o) => acc + o.total, 0);
    return { total, active, delivered, totalSpent };
  }, [ordersList]);

  // Filtered orders based on selected tab
  const filteredOrders = useMemo(() => {
    if (selectedTab === 'active') {
      return ordersList.filter(o => o.status === 'processing' || o.status === 'shipped');
    }
    if (selectedTab === 'delivered') {
      return ordersList.filter(o => o.status === 'delivered');
    }
    if (selectedTab === 'cancelled') {
      return ordersList.filter(o => o.status === 'cancelled');
    }
    return ordersList;
  }, [selectedTab, ordersList]);

  const handleCopyTracking = (tracking: string) => {
    navigator.clipboard?.writeText(tracking);
    setCopiedTracking(tracking);
    setTimeout(() => setCopiedTracking(null), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb & Header */}
      <div className="space-y-3">
        <Link 
          href="/store" 
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-gold transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Creator Store</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              My Merchandise <span className="text-gradient-gold">Orders</span>
            </h1>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              Real-time shipment tracking, dispatch updates, and verified VAT tax receipts for Ishika&apos;s World apparel &amp; collectibles.
            </p>
          </div>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-gold-light text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4 border border-border/50 bg-surface/40 space-y-1">
          <p className="text-[11px] text-muted uppercase font-bold tracking-wider">Total Orders</p>
          <p className="text-2xl font-black text-foreground">{stats.total}</p>
        </div>
        <div className="glass rounded-2xl p-4 border border-gold/30 bg-gold/5 space-y-1">
          <p className="text-[11px] text-gold uppercase font-bold tracking-wider">Active Shipments</p>
          <p className="text-2xl font-black text-gold-light">{stats.active}</p>
        </div>
        <div className="glass rounded-2xl p-4 border border-emerald-500/30 bg-emerald-500/5 space-y-1">
          <p className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider">Delivered Packages</p>
          <p className="text-2xl font-black text-emerald-400">{stats.delivered}</p>
        </div>
        <div className="glass rounded-2xl p-4 border border-rose/30 bg-rose/5 space-y-1">
          <p className="text-[11px] text-rose-light uppercase font-bold tracking-wider">Total Invested</p>
          <p className="text-2xl font-black text-foreground">{formatPrice(stats.totalSpent)}</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-border/40 text-xs">
        {[
          { id: 'all', label: 'All Orders', count: stats.total },
          { id: 'active', label: 'In Transit & Active', count: stats.active },
          { id: 'delivered', label: 'Delivered', count: stats.delivered },
          { id: 'cancelled', label: 'Cancelled', count: 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as OrderTab)}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedTab === tab.id
                ? 'bg-gold text-background font-bold shadow-md shadow-gold/20'
                : 'bg-surface hover:bg-elevated text-secondary hover:text-foreground border border-border/40'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedTab === tab.id ? 'bg-background/20 text-background' : 'bg-white/10 text-muted'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const isDelivered = order.status === 'delivered';
            const isShipped = order.status === 'shipped';
            const isProcessing = order.status === 'processing';

            return (
              <div 
                key={order.id} 
                className="glass rounded-3xl p-6 sm:p-8 border border-border/60 hover:border-gold/30 transition-all duration-300 bg-surface/30 space-y-6 shadow-xl"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono font-bold text-foreground text-sm tracking-wide">
                        {order.id}
                      </span>
                      {isDelivered && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>DELIVERED</span>
                        </Badge>
                      )}
                      {isShipped && (
                        <Badge variant="gold" className="gap-1 animate-pulse">
                          <Truck className="w-3 h-3" />
                          <span>IN TRANSIT</span>
                        </Badge>
                      )}
                      {isProcessing && (
                        <Badge variant="premium" className="gap-1">
                          <Clock className="w-3 h-3" />
                          <span>PROCESSING</span>
                        </Badge>
                      )}
                      {order.carrier && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 border border-border/50 text-secondary">
                          via {order.carrier}
                        </span>
                      )}
                    </div>
                    <p className="text-muted text-[11px]">
                      Ordered on <strong className="text-foreground">{order.date}</strong> • Expected by <strong className="text-gold-light">{order.estimatedDelivery || 'In Transit'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center sm:items-end justify-between sm:flex-col gap-2">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] text-muted">Total Paid</p>
                      <p className="text-lg font-black text-gold">{formatPrice(order.total)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setInvoiceModalOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-elevated border border-border text-xs text-secondary hover:text-foreground transition-colors"
                        title="View Tax Invoice"
                      >
                        <FileText className="w-3.5 h-3.5 text-muted" />
                        <span>Invoice</span>
                      </button>
                      {order.trackingNumber && (
                        <button
                          onClick={() => setTrackingModalOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/15 hover:bg-gold/25 border border-gold/40 text-xs font-bold text-gold-light transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track Package</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Visual Shipment Timeline Tracker */}
                <div className="p-4 sm:p-5 rounded-2xl bg-surface/50 border border-border/40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Delivery Milestone</span>
                    <span className="text-muted text-[11px]">
                      {isDelivered ? 'Delivered safely to doorstep' : `Status: ${order.status.toUpperCase()}`}
                    </span>
                  </div>

                  {/* Stepped Progress Bar */}
                  <div className="relative pt-2">
                    <div className="h-1.5 w-full bg-border/60 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose to-gold transition-all duration-700 rounded-full"
                        style={{
                          width: isDelivered ? '100%' : isShipped ? '70%' : '35%'
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-semibold text-secondary pt-2">
                      <div className="flex flex-col items-start">
                        <span className="text-gold">● Order Placed</span>
                        <span className="text-muted text-[9px]">{order.date}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className={isShipped || isDelivered ? 'text-gold' : 'text-muted'}>
                          ● Packed &amp; Dispatched
                        </span>
                        <span className="text-muted text-[9px]">Verified QC</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className={isShipped || isDelivered ? 'text-rose-light' : 'text-muted'}>
                          ● In Transit
                        </span>
                        <span className="text-muted text-[9px]">{order.carrier || 'Express'}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={isDelivered ? 'text-emerald-400 font-bold' : 'text-muted'}>
                          ● Delivered
                        </span>
                        <span className="text-muted text-[9px]">
                          {isDelivered ? 'Signed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Ordered Products ({order.items.length})</span>
                  <div className="divide-y divide-border/30">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border/50 bg-black/40">
                            <Image 
                              src={item.image} 
                              alt={item.productName} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-semibold text-foreground text-sm hover:text-gold-light transition-colors">
                              {item.productName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-muted text-[11px]">
                              <span>Qty: <strong className="text-foreground">{item.quantity}</strong></span>
                              {item.size && (
                                <span className="px-1.5 py-0.2 rounded bg-surface border border-border/40">
                                  Size: {item.size}
                                </span>
                              )}
                              {item.color && (
                                <span className="px-1.5 py-0.2 rounded bg-surface border border-border/40">
                                  Color: {item.color}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-bold text-foreground text-sm">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          <Link
                            href="/store"
                            className="text-[11px] text-gold hover:underline font-medium inline-block mt-1"
                          >
                            Buy Again
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Order Details / Addresses / Tracking Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40 text-xs">
                  {/* Shipping Address */}
                  <div className="flex items-start gap-2.5 text-secondary">
                    <MapPin className="w-4 h-4 text-rose-light shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">Delivery Destination</p>
                      <p className="text-muted text-[11px]">{order.shippingAddress || 'Royale Crest Palms, Bandra West, Mumbai - 400050'}</p>
                    </div>
                  </div>

                  {/* Payment Method & Tracking Copy */}
                  <div className="flex items-start gap-2.5 text-secondary">
                    <CreditCard className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-foreground">Payment &amp; Courier</p>
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-0.5">
                        <span className="text-muted text-[11px]">{order.paymentMethod || 'Prepaid Online'}</span>
                        {order.trackingNumber && (
                          <button
                            onClick={() => handleCopyTracking(order.trackingNumber!)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-gold-light hover:underline"
                            title="Copy tracking code"
                          >
                            {copiedTracking === order.trackingNumber ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{order.trackingNumber}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 glass rounded-3xl border border-border/50 space-y-4 max-w-md mx-auto p-8">
            <ShoppingBag className="w-16 h-16 text-muted mx-auto stroke-[1.2]" />
            <h3 className="text-xl font-bold text-foreground">No orders in this section</h3>
            <p className="text-xs text-muted">
              You don&apos;t have any orders categorized under &apos;{selectedTab}&apos;. Check out the newest drops in the store!
            </p>
            <div className="pt-2">
              <Link
                href="/store"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold text-background font-bold text-xs hover:bg-gold-light transition-all shadow-lg shadow-gold/20"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Store Merchandise</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Modal: Live Package Tracker */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl glass border border-gold/40 bg-[#0c0c12] p-6 sm:p-8 space-y-6 shadow-2xl">
            <button
              onClick={() => setTrackingModalOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gold">Live Courier Dispatch</span>
              <h3 className="text-xl font-bold text-foreground">Shipment Live Status</h3>
              <p className="text-xs text-muted">
                Tracking AWB: <span className="font-mono text-gold-light">{trackingModalOrder.trackingNumber}</span> • {trackingModalOrder.carrier}
              </p>
            </div>

            {/* Checkpoint List */}
            <div className="space-y-4 border-l-2 border-gold/40 pl-5 ml-2 text-xs">
              <div className="relative">
                <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
                <p className="font-bold text-foreground">In Transit — Approaching Destination Hub</p>
                <p className="text-muted text-[11px]">Mumbai Central Logistics Facility • Today 02:40 PM</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-gold shadow-md shadow-gold/40" />
                <p className="font-bold text-foreground">Departed Regional Airport Sorting Center</p>
                <p className="text-muted text-[11px]">Bhiwandi Hub, Maharashtra • Yesterday 09:15 PM</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-border" />
                <p className="font-semibold text-secondary">Custom Branded Packaging &amp; Sealed with Care</p>
                <p className="text-muted text-[11px]">Ishika&apos;s World Creator Fulfillment Center • Nov 24, 11:30 AM</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-border" />
                <p className="font-semibold text-secondary">Order Confirmed &amp; Invoice Generated</p>
                <p className="text-muted text-[11px]">{trackingModalOrder.date} 04:22 PM</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface/60 border border-border/50 flex items-center justify-between text-xs">
              <span className="text-secondary">Expected Delivery:</span>
              <strong className="text-gold-light">{trackingModalOrder.estimatedDelivery || 'Tomorrow'}</strong>
            </div>

            <button
              onClick={() => setTrackingModalOrder(null)}
              className="w-full py-2.5 rounded-xl bg-gold text-background font-bold text-xs hover:bg-gold-light transition-all shadow-md"
            >
              Close Live Tracker
            </button>
          </div>
        </div>
      )}

      {/* Interactive Modal: Tax Invoice Preview */}
      {invoiceModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl glass border border-gold/40 bg-[#0e0e15] p-6 sm:p-8 space-y-6 shadow-2xl">
            <button
              onClick={() => setInvoiceModalOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold">Official Tax Invoice</span>
                <h3 className="text-xl font-bold text-foreground">Invoice #{invoiceModalOrder.id}</h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                PAID IN FULL
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-muted text-[10px] uppercase font-bold">Billed To</p>
                <p className="font-bold text-foreground">Ishq Army Fan Member</p>
                <p className="text-muted text-[11px]">{invoiceModalOrder.shippingAddress || 'Royale Crest Palms, Mumbai'}</p>
              </div>
              <div>
                <p className="text-muted text-[10px] uppercase font-bold">Seller</p>
                <p className="font-bold text-foreground">Ishika&apos;s World Digital &amp; Merch LLP</p>
                <p className="text-muted text-[11px]">GSTIN: 27AABCI3106Q1Z8</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 text-xs divide-y divide-border/30">
              {invoiceModalOrder.items.map((item, idx) => (
                <div key={idx} className="pt-2 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground">{item.productName}</p>
                    <p className="text-muted text-[11px]">Qty: {item.quantity} {item.size && `• Size: ${item.size}`}</p>
                  </div>
                  <span className="font-bold text-foreground">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border/40 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatPrice(invoiceModalOrder.total)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Integrated GST (5%)</span>
                <span>Included</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Express Courier Shipping</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gold pt-2 border-t border-border/40">
                <span>Total Amount Paid</span>
                <span>{formatPrice(invoiceModalOrder.total)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  alert(`Invoice #${invoiceModalOrder.id} generated! Preparing PDF receipt download.`);
                  setInvoiceModalOrder(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gold text-background font-bold text-xs hover:bg-gold-light transition-all shadow-md"
              >
                Download PDF Invoice
              </button>
              <button
                onClick={() => setInvoiceModalOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-surface hover:bg-elevated text-secondary text-xs font-semibold border border-border transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
