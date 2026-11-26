// ============================================================
// ISHIKA'S WORLDT — Native Application Global State Context
// ============================================================
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import {
  Video,
  Product,
  CartItem,
  Order,
  OrderItem,
  UserProfile,
  WatchHistoryItem,
  ChatMessage,
  ProductColor,
} from '../types';
import {
  INITIAL_USER,
  MOCK_ORDERS,
  MOCK_VIDEOS,
  MOCK_COMMUNITY_MESSAGES,
} from '../data/mockData';

interface AppContextType {
  // User & Membership
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  membershipTier: 'explorer' | 'vip' | 'elite' | 'free';
  upgradeMembership: (tier: 'explorer' | 'vip' | 'elite') => void;
  isVipUnlocked: boolean;

  // Cart Management
  cart: CartItem[];
  addToCart: (product: Product, selectedSize: string, selectedColor: ProductColor, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Orders
  orders: Order[];
  placeOrder: (paymentMethod?: string) => Order;

  // Watch History & Bookmarks
  watchHistory: WatchHistoryItem[];
  saveWatchProgress: (video: Video, progressSec: number, durationSec: number) => void;
  getWatchProgress: (videoId: string) => WatchHistoryItem | undefined;
  clearWatchHistory: () => void;
  savedVideoIds: string[];
  toggleSaveVideo: (videoId: string) => void;
  isVideoSaved: (videoId: string) => boolean;

  // Community Messages
  messages: ChatMessage[];
  sendMessage: (roomId: 'public' | 'vip', content: string) => void;
  likeMessage: (messageId: string) => void;

  // Active Playback tracking
  currentPlayingVideo: Video | null;
  setCurrentPlayingVideo: (video: Video | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([
    {
      videoId: 'SP33xGv1gas',
      video: MOCK_VIDEOS[0],
      watchedAt: Date.now() - 3600000,
      progressSec: 420,
      durationSec: 1937,
      percentage: 22,
    },
    {
      videoId: '0688aQpIicA',
      video: MOCK_VIDEOS[1],
      watchedAt: Date.now() - 86400000,
      progressSec: 1200,
      durationSec: 1725,
      percentage: 70,
    },
  ]);
  const [savedVideoIds, setSavedVideoIds] = useState<string[]>(['SP33xGv1gas', '0688aQpIicA']);
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_COMMUNITY_MESSAGES);
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<Video | null>(null);

  // User Profile
  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const membershipTier = user.memberTier;
  const isVipUnlocked = membershipTier === 'vip' || membershipTier === 'elite';

  const upgradeMembership = (tier: 'explorer' | 'vip' | 'elite') => {
    setUser((prev) => ({
      ...prev,
      memberTier: tier,
      memberSince: 'Today (Active)',
    }));
  };

  // Cart
  const addToCart = (
    product: Product,
    selectedSize: string,
    selectedColor: ProductColor,
    quantity = 1
  ) => {
    const id = `${product.id}-${selectedSize}-${selectedColor.name}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { id, product, selectedSize, selectedColor, quantity }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Orders
  const placeOrder = (paymentMethod = 'PayU (Instant)') => {
    const orderItems: OrderItem[] = cart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      size: item.selectedSize,
      color: item.selectedColor.name,
      quantity: item.quantity,
      image: item.product.images[0],
    }));

    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      date: 'Just now',
      items: orderItems,
      subtotal: cartTotal,
      shipping: 0,
      total: cartTotal,
      status: 'Processing',
      paymentMethod,
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  // Watch History
  const saveWatchProgress = (video: Video, progressSec: number, durationSec: number) => {
    const percentage = durationSec > 0 ? Math.round((progressSec / durationSec) * 100) : 0;
    setWatchHistory((prev) => {
      const filtered = prev.filter((item) => item.videoId !== video.id);
      return [
        {
          videoId: video.id,
          video,
          watchedAt: Date.now(),
          progressSec,
          durationSec,
          percentage,
        },
        ...filtered,
      ];
    });
  };

  const getWatchProgress = (videoId: string) => {
    return watchHistory.find((item) => item.videoId === videoId);
  };

  const clearWatchHistory = () => {
    setWatchHistory([]);
  };

  // Bookmarks
  const toggleSaveVideo = (videoId: string) => {
    setSavedVideoIds((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    );
  };

  const isVideoSaved = (videoId: string) => {
    return savedVideoIds.includes(videoId);
  };

  // Community
  const sendMessage = (roomId: 'public' | 'vip', content: string) => {
    if (!content.trim()) return;
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      roomId,
      sender: user.name,
      avatar: user.avatarUrl,
      badge:
        user.memberTier === 'elite'
          ? 'Elite Circle 💎'
          : user.memberTier === 'vip'
          ? 'VIP Army 👑'
          : 'Ishq Explorer 💚',
      badgeColor:
        user.memberTier === 'elite'
          ? '#d4a853'
          : user.memberTier === 'vip'
          ? '#e91e8c'
          : '#10b981',
      content: content.trim(),
      timestamp: 'Just now',
      isSelf: true,
      likes: 0,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const likeMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, likes: (msg.likes || 0) + 1 } : msg
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        user,
        updateUser,
        membershipTier,
        upgradeMembership,
        isVipUnlocked,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartCount,
        orders,
        placeOrder,
        watchHistory,
        saveWatchProgress,
        getWatchProgress,
        clearWatchHistory,
        savedVideoIds,
        toggleSaveVideo,
        isVideoSaved,
        messages,
        sendMessage,
        likeMessage,
        currentPlayingVideo,
        setCurrentPlayingVideo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
