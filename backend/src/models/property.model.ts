export type PropertyType = 'pg' | 'shared_room' | 'single_room' | 'flat';
export type FurnishingType = 'furnished' | 'semi-furnished' | 'unfurnished';
export type PropertyStatus = 'active' | 'inactive' | 'pending';

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: Date;
}

export interface PropertyAmenity {
  id: number;
  property_id: number;
  amenity: string;
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
  address_line2?: string;
  city: string;
  state: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  bedrooms: number;
  bathrooms: number;
  furnishing: FurnishingType;
  available_from?: Date;
  min_lease_months: number;
  max_occupancy: number;
  status: PropertyStatus;
  is_featured: boolean;
  views_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  images?: PropertyImage[];
  amenities?: string[];
  owner_name?: string;
}

export interface PropertyListItem extends Omit<Property, 'description' | 'address_line1' | 'address_line2'> {
  primary_image?: string;
}

export interface CreatePropertyDto {
  title: string;
  description?: string;
  property_type: PropertyType;
  rent_amount: number;
  security_deposit?: number;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: FurnishingType;
  available_from?: string;
  min_lease_months?: number;
  max_occupancy?: number;
  amenities?: string[];
}

export interface PropertyFilters {
  city?: string;
  state?: string;
  property_type?: PropertyType;
  min_rent?: number;
  max_rent?: number;
  furnishing?: FurnishingType;
  bedrooms?: number;
  status?: PropertyStatus;
  owner_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}
