export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  images: string[];
  originalPrice: number;
  offerPrice?: number;
  categories: string[];
  categoryNames: string[];
  tags: string[];
  availability: "in_stock" | "out_of_stock" | "pre_order";
  featured: boolean;
  trending: boolean;
  bestSeller: boolean;
  stockQuantity: number;
  availableSizes?: string[]; // M, L, XL, XXL
  specs?: Record<string, string>;
  createdAt?: string;
  // Return policy customization
  returnPolicy?: "non_returnable" | "exchange_only" | "custom" | "7_day_return";
  returnMessage?: string;
  returnEnabled?: boolean;
  // Coupon
  couponMessage?: string;
  // View count for analytics
  viewCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  banner?: string;
  description?: string;
  featured: boolean;
  priority: number;
  icon?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

export interface WishlistItem {
  product: Product;
  addedAt: string;
}

export interface ReviewReply {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  productId: string;
  replies: ReviewReply[];
}

export interface UserProfile {
  id: string;
  username: string;
  phone: string;
  email?: string;
  facebookId?: string;
  avatar?: string;
  role: "user" | "admin";
  createdAt: string;
  visitCount?: number;
  lastVisit?: string;
}

export interface ChatMessage {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  text: string;
  sender: "user" | "admin";
  createdAt: string;
  read: boolean;
}

export interface TestimonialComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  customerName: string;
  customerImage: string;
  description: string;
  productId: string;
  productName?: string;
  likes: string[]; // userIds who liked
  comments: TestimonialComment[];
  createdAt: string;
  active: boolean;
}

export interface PageView {
  id: string;
  userId: string;
  username: string;
  path: string;
  productId?: string;
  productName?: string;
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "popup" | "banner" | "bar";
  active: boolean;
  ctaText?: string;
  ctaLink?: string;
  priority: number;
  createdAt: string;
}

export interface SiteStat {
  id: string;
  label: string;
  value: string;
  suffix: string;
  icon: string;
  active: boolean;
  priority: number;
  updatedAt?: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  type: "text" | "image" | "link";
  updatedAt?: string;
}

export interface Analytics {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalVisits: number;
  topProducts: { productId: string; name: string; views: number; wishlists: number; carts: number }[];
  topUsers: { userId: string; username: string; visits: number; wishlistItems: number; cartItems: number }[];
  traffic: { date: string; visits: number }[];
}
