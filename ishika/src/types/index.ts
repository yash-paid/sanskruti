// ============================================================
// ISHIKA'S WORLD — Type Definitions
// ============================================================

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: string;
  date: string;
  category: string;
  isPremium: boolean;
  tags: string[];
  youtubeId?: string;
  channelName?: string;
  videoUrl?: string;
}

export interface YouTubeChannel {
  handle: string;
  name: string;
  url: string;
  subscribers: string;
  videos: string;
  description: string;
  avatar: string;
  badge: string;
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
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  badge: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  sizes?: string[];
  colors?: ProductColor[];
  rating: number;
  reviews: number;
  inStock: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface ChatMessage {
  id: string;
  user: ChatUser;
  content: string;
  timestamp: string;
  isPremium: boolean;
  roomId?: string;
}

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  isPremium: boolean;
  badge?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
  isPremium: boolean;
  lastMessage?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  membershipTier: string | null;
  watchHistory: string[];
  savedVideos: string[];
}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  shippingAddress?: string;
  paymentMethod?: string;
}

export interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  image: string;
}

export interface FAQ {
  question: string;
  answer: string;
}
