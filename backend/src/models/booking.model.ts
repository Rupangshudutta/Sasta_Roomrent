export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

export interface Booking {
  id: number;
  property_id: number;
  customer_id: number;
  check_in_date: Date;
  check_out_date?: Date;
  lease_months: number;
  monthly_rent: number;
  security_deposit: number;
  total_amount: number;
  status: BookingStatus;
  cancellation_reason?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  property_title?: string;
  property_city?: string;
  customer_name?: string;
  owner_name?: string;
}

export interface CreateBookingDto {
  property_id: number;
  check_in_date: string;
  lease_months: number;
  notes?: string;
}

export interface UpdateBookingDto {
  status?: BookingStatus;
  check_out_date?: string;
  cancellation_reason?: string;
  notes?: string;
}

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type PaymentType = 'rent' | 'security_deposit' | 'refund';
export type PaymentMethod = 'razorpay' | 'upi' | 'bank_transfer' | 'cash';

export interface Payment {
  id: number;
  booking_id: number;
  user_id: number;
  amount: number;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  transaction_date: Date;
  notes?: string;
}

export interface CreatePaymentOrderDto {
  booking_id: number;
  payment_type: PaymentType;
}

export interface VerifyPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
