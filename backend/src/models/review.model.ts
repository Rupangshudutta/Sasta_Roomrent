export interface Review {
  id: number;
  property_id: number;
  user_id: number;
  booking_id?: number;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  is_visible: boolean;
  created_at: Date;
  // Joined
  reviewer_name?: string;
  reviewer_avatar?: string;
}

export interface CreateReviewDto {
  property_id: number;
  booking_id?: number;
  rating: number;
  title?: string;
  comment?: string;
}

export interface Inquiry {
  id: number;
  property_id: number;
  sender_id: number;
  owner_id: number;
  message: string;
  is_read: boolean;
  created_at: Date;
  // Joined
  sender_name?: string;
  property_title?: string;
}

export interface CreateInquiryDto {
  property_id: number;
  message: string;
}

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
