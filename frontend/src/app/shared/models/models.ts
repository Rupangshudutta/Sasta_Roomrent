// Shared TypeScript models for the Angular frontend
// Mirrors backend models

export type UserRole = 'customer' | 'owner' | 'admin';
export type PropertyType = 'pg' | 'shared_room' | 'single_room' | 'flat';
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_verified: boolean;
  created_at: string;
}

export interface PropertyImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

export interface Property {
  id: number;
  owner_id: number;
  title: string;
  description?: string;
  property_type: PropertyType;
  rent_amount: number;
  security_deposit: number;
  address_line1: string;
  city: string;
  state: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  available_from?: string;
  min_lease_months: number;
  max_occupancy: number;
  status: string;
  is_featured: boolean;
  views_count: number;
  rating_avg: number;
  rating_count: number;
  images?: PropertyImage[];
  amenities?: string[];
  owner_name?: string;
  primary_image?: string;
}

export interface Booking {
  id: number;
  property_id: number;
  customer_id: number;
  check_in_date: string;
  lease_months: number;
  monthly_rent: number;
  security_deposit: number;
  total_amount: number;
  status: BookingStatus;
  property_title?: string;
  property_city?: string;
  customer_name?: string;
  created_at: string;
}

export interface Review {
  id: number;
  property_id: number;
  user_id: number;
  rating: number;
  title?: string;
  comment?: string;
  reviewer_name?: string;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: { field: string; message: string }[];
}
