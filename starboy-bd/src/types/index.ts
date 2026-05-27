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
  tags: string[];
  availability: "in_stock" | "out_of_stock" | "pre_order";
  featured: boolean;
  trending: boolean;
  bestSeller: boolean;
  specs?: Record<string, string>;
  createdAt?: string;
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

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  productId: string;
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
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  productId?: string;
  productName?: string;
  text: string;
  sender: "user" | "admin";
  createdAt: string;
  read: boolean;
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

export interface Analytics {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  topProducts: { productId: string; name: string; views: number; wishlists: number; carts: number }[];
  traffic: { date: string; visits: number }[];
}
