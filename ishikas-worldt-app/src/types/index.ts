// ============================================================
// ISHIKA'S WORLDT — TypeScript Interfaces & Types
// ============================================================

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  durationSec?: number;
  views: string;
  date: string;
  category: string;
  isPremium?: boolean;
  channelName: string;
  youtubeId?: string;
  videoUrl?: string;
  tags?: string[];
  aspectRatio?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoCount: number;
  videos: string[];
}

export interface MembershipPlan {
  id: 'explorer' | 'vip' | 'elite';
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  badge: string;
  color: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  images: string[];
  category: string;
  sizes: string[];
  colors: ProductColor[];
  rating: number;
  reviews: number;
  inStock: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
}

export interface CartItem {
  id: string; // product-size-color combo key
  product: Product;
  selectedSize: string;
  selectedColor: ProductColor;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: 'Delivered' | 'Shipped' | 'Processing';
  paymentMethod: string;
}

export interface WatchHistoryItem {
  videoId: string;
  video: Video;
  watchedAt: number; // timestamp
  progressSec: number;
  durationSec: number;
  percentage: number;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  memberTier: 'explorer' | 'vip' | 'elite' | 'free';
  memberSince: string;
  avatarUrl: string;
}

export interface ChatMessage {
  id: string;
  roomId: 'public' | 'vip';
  sender: string;
  avatar: string;
  badge?: string;
  badgeColor?: string;
  content: string;
  timestamp: string;
  isCreator?: boolean;
  isSelf?: boolean;
  likes?: number;
}

export interface PlayerSettingsState {
  speed: number;
  quality: string;
  audioTrack: string;
  subtitleTrack: string;
  autoPlayNext: boolean;
}
