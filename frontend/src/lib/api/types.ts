export type Role = "client" | "master" | "admin";

export interface User {
  id: number;
  phone: string;
  full_name: string;
  role: Role;
  avatar: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface OtpRequestPayload {
  phone: string;
  role?: Role;
}

export interface OtpVerifyPayload {
  phone: string;
  code: string;
}

export interface OtpRequestResponse {
  detail: string;
  is_new_user: boolean;
  /** Beta rejim: server darhol kirgizadi va tokenlar qaytaradi (OTP qadami yo'q). */
  auto_login?: boolean;
  user?: User;
  tokens?: AuthTokens;
}

export interface OtpVerifyResponse {
  user: User;
  tokens: AuthTokens;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  parent: number | null;
  order: number;
  is_active: boolean;
}

export interface Skill {
  id: number;
  name: string;
  slug: string;
  category: number;
  aliases: string[];
}

export interface Region {
  id: number;
  name: string;
  slug: string;
  kind: "viloyat" | "tuman";
  parent: number | null;
}

export interface PortfolioImage {
  id: number;
  image: string;
  order: number;
}

export interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  category: number | null;
  images: PortfolioImage[];
  created_at: string;
}

export interface MasterListItem {
  id: number;
  user: User;
  bio: string;
  experience_years: number;
  hourly_rate_from: string | null;
  hourly_rate_to: string | null;
  categories: Category[];
  rating_cache: string;
  reviews_count_cache: number;
  completed_orders_cache: number;
  is_available: boolean;
}

export interface MasterDetail extends MasterListItem {
  skills: Skill[];
  regions: Region[];
  portfolio: PortfolioItem[];
}

export interface ReviewImage {
  id: number;
  image: string;
  order_idx: number;
}

export type Urgency = "low" | "normal" | "high" | "emergency";

export type OrderStatus =
  | "draft"
  | "published"
  | "matched"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface OrderListItem {
  id: number;
  title: string;
  description: string;
  address: string;
  region: Region | null;
  category: Category | null;
  urgency: Urgency;
  budget_from: string | null;
  budget_to: string | null;
  status: OrderStatus;
  cover_image: string | null;
  responses_count: number;
  created_at: string;
}

export interface OrderImage {
  id: number;
  image: string;
  order_idx: number;
}

export interface OrderDetail extends OrderListItem {
  client: User;
  latitude: string | null;
  longitude: string | null;
  images: OrderImage[];
  ai_extracted_skills: Skill[];
  ai_summary: string;
  selected_master: MasterListItem | null;
}

export type BookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled";

export interface OrderShort {
  id: number;
  title: string;
  description: string;
  address: string;
  category: Category | null;
  urgency: Urgency;
  created_at: string;
}

export interface BookingRequest {
  id: number;
  order: OrderShort;
  client: User;
  master: MasterListItem;
  status: BookingStatus;
  note: string;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface BookingCreatePayload {
  order: number;
  master: number;
  note?: string;
}

export type OrderResponseStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface OrderResponse {
  id: number;
  order: number;
  master: MasterListItem;
  price_offer: string;
  message: string;
  eta_hours: number | null;
  status: OrderResponseStatus;
  created_at: string;
}

export interface OrderResponseCreatePayload {
  price_offer: string;
  message?: string;
  eta_hours?: number | null;
}

export interface OrderMatch {
  master: MasterListItem;
  score: string;
  reason: string;
}

export interface OrderCreatePayload {
  title: string;
  description: string;
  address: string;
  region?: number | null;
  category?: number | null;
  budget_from?: string | null;
  budget_to?: string | null;
  urgency?: Urgency;
  uploaded_images?: File[];
}

export interface ChatMessage {
  id: number;
  sender: User;
  text: string;
  attachment: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ChatRoom {
  id: number;
  order: number;
  client: User;
  master: User;
  is_active: boolean;
  last_message: ChatMessage | null;
  unread_count: number;
  updated_at: string;
}

export interface Review {
  id: number;
  order: number;
  client: User;
  master: number;
  rating: number;
  text: string;
  master_reply: string;
  master_replied_at: string | null;
  images: ReviewImage[];
  created_at: string;
}
