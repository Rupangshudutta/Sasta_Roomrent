
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "amenities": {
                  Row: {
                    "icon": string,"id": number,"is_active": boolean,"label": string,"slug": string,"sort_order": number
                  }
                  Insert: {
                    "icon"?: string,"id"?: number,"is_active"?: boolean,"label": string,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "icon"?: string,"id"?: number,"is_active"?: boolean,"label"?: string,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"details": NonNullable<Json>,"entity": string,"entity_id": string,"id": number
                  }
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"entity": string,"entity_id": string,"id"?: never
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"entity"?: string,"entity_id"?: string,"id"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "owner_public_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audit_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"bookings": {
                  Row: {
                    "cancel_reason": string | null,"created_at": string,"decided_at": string | null,"id": string,"lease_months": number,"message": string | null,"monthly_rent": number,"move_in_date": string,"owner_id": string,"owner_note": string | null,"property_id": string,"security_deposit": number,"status": Database["public"]['Enums']["booking_status"],"tenant_id": string,"total_amount": number | null,"updated_at": string
                  }
                  Insert: {
                    "cancel_reason"?: string | null,"created_at"?: string,"decided_at"?: string | null,"id"?: string,"lease_months": number,"message"?: string | null,"monthly_rent": number,"move_in_date": string,"owner_id": string,"owner_note"?: string | null,"property_id": string,"security_deposit"?: number,"status"?: Database["public"]['Enums']["booking_status"],"tenant_id": string,"total_amount"?: never,"updated_at"?: string
                  }
                  Update: {
                    "cancel_reason"?: string | null,"created_at"?: string,"decided_at"?: string | null,"id"?: string,"lease_months"?: number,"message"?: string | null,"monthly_rent"?: number,"move_in_date"?: string,"owner_id"?: string,"owner_note"?: string | null,"property_id"?: string,"security_deposit"?: number,"status"?: Database["public"]['Enums']["booking_status"],"tenant_id"?: string,"total_amount"?: never,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "owner_public_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_tenant_id_fkey"
      columns: ["tenant_id"]
isOneToOne: false
      referencedRelation: "owner_public_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_tenant_id_fkey"
      columns: ["tenant_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"cities": {
                  Row: {
                    "created_at": string,"id": number,"image_url": string | null,"is_active": boolean,"name": string,"slug": string,"sort_order": number,"state": string,"tagline": string | null
                  }
                  Insert: {
                    "created_at"?: string,"id"?: number,"image_url"?: string | null,"is_active"?: boolean,"name": string,"slug": string,"sort_order"?: number,"state": string,"tagline"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: number,"image_url"?: string | null,"is_active"?: boolean,"name"?: string,"slug"?: string,"sort_order"?: number,"state"?: string,"tagline"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"contact_messages": {
                  Row: {
                    "created_at": string,"email": string,"handled_at": string | null,"handled_by": string | null,"id": number,"interest": Database["public"]['Enums']["contact_interest"],"is_read": boolean,"message": string,"name": string,"phone": string | null
                  }
                  Insert: {
                    "created_at"?: string,"email": string,"handled_at"?: string | null,"handled_by"?: string | null,"id"?: never,"interest"?: Database["public"]['Enums']["contact_interest"],"is_read"?: boolean,"message": string,"name": string,"phone"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"handled_at"?: string | null,"handled_by"?: string | null,"id"?: never,"interest"?: Database["public"]['Enums']["contact_interest"],"is_read"?: boolean,"message"?: string,"name"?: string,"phone"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "contact_messages_handled_by_fkey"
      columns: ["handled_by"]
isOneToOne: false
      referencedRelation: "owner_public_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contact_messages_handled_by_fkey"
      columns: ["handled_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"favorites": {
                  Row: {
                    "created_at": string,"property_id": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"property_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"property_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorites_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "owner_public_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"localities": {
                  Row: {
                    "city_id": number,"id": number,"is_popular": boolean,"name": string,"slug": string
                  }
                  Insert: {
                    "city_id": number,"id"?: number,"is_popular"?: boolean,"name": string,"slug": string
                  }
                  Update: {
                    "city_id"?: number,"id"?: number,"is_popular"?: boolean,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "localities_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "localities_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_listing_stats"
      referencedColumns: ["city_id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"href": string | null,"id": number,"read_at": string | null,"title": string,"type": Database["public"]['Enums']["notification_type"],"user_id": string
                  }
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"href"?: string | null,"id"?: never,"read_at"?: string | null,"title": string,"type": Database["public"]['Enums']["notification_type"],"user_id": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"href"?: string | null,"id"?: never,"read_at"?: string | null,"title"?: string,"type"?: Database["public"]['Enums']["notification_type"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "owner_public_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"owner_profiles": {
                  Row: {
                    "about": string | null,"business_name": string | null,"business_type": Database["public"]['Enums']["business_type"] | null,"created_at": string,"experience": string | null,"primary_location": string | null,"tax_id": string | null,"updated_at": string,"user_id": string,"verification_status": Database["public"]['Enums']["verification_status"]
                  }
                  Insert: {
                    "about"?: string | null,"business_name"?: string | null,"business_type"?: Database["public"]['Enums']["business_type"] | null,"created_at"?: string,"experience"?: string | null,"primary_location"?: string | null,"tax_id"?: string | null,"updated_at"?: string,"user_id": string,"verification_status"?: Database["public"]['Enums']["verification_status"]
                  }
                  Update: {
                    "about"?: string | null,"business_name"?: string | null,"business_type"?: Database["public"]['Enums']["business_type"] | null,"created_at"?: string,"experience"?: string | null,"primary_location"?: string | null,"tax_id"?: string | null,"updated_at"?: string,"user_id"?: string,"verification_status"?: Database["public"]['Enums']["verification_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "owner_profiles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "owner_public_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "owner_profiles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"platform_settings": {
                  Row: {
                    "auto_approve_listings": boolean,"booking_token_amount": number,"commission_rate": number,"id": number,"max_photos_per_listing": number,"office_address": string,"platform_name": string,"support_email": string,"support_phone": string,"updated_at": string,"whatsapp_number": string,"working_hours": string
                  }
                  Insert: {
                    "auto_approve_listings"?: boolean,"booking_token_amount"?: number,"commission_rate"?: number,"id"?: number,"max_photos_per_listing"?: number,"office_address"?: string,"platform_name"?: string,"support_email"?: string,"support_phone"?: string,"updated_at"?: string,"whatsapp_number"?: string,"working_hours"?: string
                  }
                  Update: {
                    "auto_approve_listings"?: boolean,"booking_token_amount"?: number,"commission_rate"?: number,"id"?: number,"max_photos_per_listing"?: number,"office_address"?: string,"platform_name"?: string,"support_email"?: string,"support_phone"?: string,"updated_at"?: string,"whatsapp_number"?: string,"working_hours"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"email": string | null,"first_name": string,"id": string,"is_active": boolean,"last_name": string,"phone": string | null,"role": Database["public"]['Enums']["user_role"],"updated_at": string
                  }
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"email"?: string | null,"first_name": string,"id": string,"is_active"?: boolean,"last_name"?: string,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"email"?: string | null,"first_name"?: string,"id"?: string,"is_active"?: boolean,"last_name"?: string,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"properties": {
                  Row: {
                    "address_line1": string,"address_line2": string | null,"alt_contact_phone": string | null,"approved_at": string | null,"approved_by": string | null,"available_from": string | null,"available_rooms": number,"city_id": number,"contact_phone": string,"created_at": string,"description": string | null,"furnishing": Database["public"]['Enums']["furnishing"],"gender_preference": Database["public"]['Enums']["gender_preference"],"house_rules": string | null,"id": string,"is_featured": boolean,"latitude": number | null,"locality": string,"longitude": number | null,"maintenance_amount": number,"min_lease_months": number,"owner_id": string,"pincode": string,"property_type": Database["public"]['Enums']["property_type"],"rating_avg": number,"rating_count": number,"rejection_reason": string | null,"rent_amount": number,"search_tsv": unknown,"security_deposit": number,"state": string,"status": Database["public"]['Enums']["listing_status"],"submitted_at": string | null,"title": string,"total_rooms": number,"updated_at": string,"views_count": number
                  }
                  Insert: {
                    "address_line1": string,"address_line2"?: string | null,"alt_contact_phone"?: string | null,"approved_at"?: string | null,"approved_by"?: string | null,"available_from"?: string | null,"available_rooms"?: number,"city_id": number,"contact_phone": string,"created_at"?: string,"description"?: string | null,"furnishing"?: Database["public"]['Enums']["furnishing"],"gender_preference"?: Database["public"]['Enums']["gender_preference"],"house_rules"?: string | null,"id"?: string,"is_featured"?: boolean,"latitude"?: number | null,"locality": string,"longitude"?: number | null,"maintenance_amount"?: number,"min_lease_months"?: number,"owner_id": string,"pincode": string,"property_type": Database["public"]['Enums']["property_type"],"rating_avg"?: number,"rating_count"?: number,"rejection_reason"?: string | null,"rent_amount": number,"search_tsv"?: never,"security_deposit"?: number,"state": string,"status"?: Database["public"]['Enums']["listing_status"],"submitted_at"?: string | null,"title": string,"total_rooms"?: number,"updated_at"?: string,"views_count"?: number
                  }
                  Update: {
                    "address_line1"?: string,"address_line2"?: string | null,"alt_contact_phone"?: string | null,"approved_at"?: string | null,"approved_by"?: string | null,"available_from"?: string | null,"available_rooms"?: number,"city_id"?: number,"contact_phone"?: string,"created_at"?: string,"description"?: string | null,"furnishing"?: Database["public"]['Enums']["furnishing"],"gender_preference"?: Database["public"]['Enums']["gender_preference"],"house_rules"?: string | null,"id"?: string,"is_featured"?: boolean,"latitude"?: number | null,"locality"?: string,"longitude"?: number | null,"maintenance_amount"?: number,"min_lease_months"?: number,"owner_id"?: string,"pincode"?: string,"property_type"?: Database["public"]['Enums']["property_type"],"rating_avg"?: number,"rating_count"?: number,"rejection_reason"?: string | null,"rent_amount"?: number,"search_tsv"?: never,"security_deposit"?: number,"state"?: string,"status"?: Database["public"]['Enums']["listing_status"],"submitted_at"?: string | null,"title"?: string,"total_rooms"?: number,"updated_at"?: string,"views_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "properties_approved_by_fkey"
      columns: ["approved_by"]
isOneToOne: false
      referencedRelation: "owner_public_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "properties_approved_by_fkey"
      columns: ["approved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "properties_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "properties_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_listing_stats"
      referencedColumns: ["city_id"]
    },{
      foreignKeyName: "properties_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "owner_public_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "properties_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"property_amenities": {
                  Row: {
                    "amenity_id": number,"property_id": string
                  }
                  Insert: {
                    "amenity_id": number,"property_id": string
                  }
                  Update: {
                    "amenity_id"?: number,"property_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "property_amenities_amenity_id_fkey"
      columns: ["amenity_id"]
isOneToOne: false
      referencedRelation: "amenities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "property_amenities_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    }
                  ]
                },"property_photos": {
                  Row: {
                    "bytes": number | null,"created_at": string,"height": number | null,"id": string,"is_primary": boolean,"property_id": string,"sort_order": number,"storage_path": string,"width": number | null
                  }
                  Insert: {
                    "bytes"?: number | null,"created_at"?: string,"height"?: number | null,"id"?: string,"is_primary"?: boolean,"property_id": string,"sort_order"?: number,"storage_path": string,"width"?: number | null
                  }
                  Update: {
                    "bytes"?: number | null,"created_at"?: string,"height"?: number | null,"id"?: string,"is_primary"?: boolean,"property_id"?: string,"sort_order"?: number,"storage_path"?: string,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "property_photos_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "booking_id": string,"comment": string | null,"created_at": string,"hidden_reason": string | null,"id": string,"is_visible": boolean,"property_id": string,"rating": number,"tenant_id": string,"title": string | null,"updated_at": string
                  }
                  Insert: {
                    "booking_id": string,"comment"?: string | null,"created_at"?: string,"hidden_reason"?: string | null,"id"?: string,"is_visible"?: boolean,"property_id": string,"rating": number,"tenant_id": string,"title"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "booking_id"?: string,"comment"?: string | null,"created_at"?: string,"hidden_reason"?: string | null,"id"?: string,"is_visible"?: boolean,"property_id"?: string,"rating"?: number,"tenant_id"?: string,"title"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "booking_party_names"
      referencedColumns: ["booking_id"]
    },{
      foreignKeyName: "reviews_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_tenant_id_fkey"
      columns: ["tenant_id"]
isOneToOne: false
      referencedRelation: "owner_public_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_tenant_id_fkey"
      columns: ["tenant_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "booking_party_names": {
                  Row: {
                    "booking_id": string | null,"owner_first_name": string | null,"owner_last_name": string | null,"tenant_first_name": string | null,"tenant_last_name": string | null
                  }
                  Relationships: [
                    
                  ]
                },"city_listing_stats": {
                  Row: {
                    "avg_rating": number | null,"city_id": number | null,"image_url": string | null,"listing_count": number | null,"min_rent": number | null,"name": string | null,"slug": string | null,"sort_order": number | null,"state": string | null
                  }
                  Relationships: [
                    
                  ]
                },"locality_listing_stats": {
                  Row: {
                    "city_id": number | null,"is_popular": boolean | null,"listing_count": number | null,"locality_id": number | null,"name": string | null,"slug": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "localities_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "localities_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_listing_stats"
      referencedColumns: ["city_id"]
    }
                  ]
                },"owner_public_profiles": {
                  Row: {
                    "avatar_url": string | null,"first_name": string | null,"id": string | null,"last_name": string | null,"member_since": string | null
                  }
                  Insert: {
                           "avatar_url"?: string | null,"first_name"?: string | null,"id"?: string | null,"last_name"?: string | null,"member_since"?: string | null
                         }
                        Update: {
                           "avatar_url"?: string | null,"first_name"?: string | null,"id"?: string | null,"last_name"?: string | null,"member_since"?: string | null
                         }
                        Relationships: [
                    
                  ]
                },"public_reviews": {
                  Row: {
                    "comment": string | null,"created_at": string | null,"id": string | null,"property_id": string | null,"rating": number | null,"reviewer_first_name": string | null,"reviewer_last_initial": string | null,"title": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "approve_listing":
{ Args: { "p_property_id": string }; Returns: {
              "address_line1": string,
"address_line2": string | null,
"alt_contact_phone": string | null,
"approved_at": string | null,
"approved_by": string | null,
"available_from": string | null,
"available_rooms": number,
"city_id": number,
"contact_phone": string,
"created_at": string,
"description": string | null,
"furnishing": Database["public"]['Enums']["furnishing"],
"gender_preference": Database["public"]['Enums']["gender_preference"],
"house_rules": string | null,
"id": string,
"is_featured": boolean,
"latitude": number | null,
"locality": string,
"longitude": number | null,
"maintenance_amount": number,
"min_lease_months": number,
"owner_id": string,
"pincode": string,
"property_type": Database["public"]['Enums']["property_type"],
"rating_avg": number,
"rating_count": number,
"rejection_reason": string | null,
"rent_amount": number,
"search_tsv": unknown,
"security_deposit": number,
"state": string,
"status": Database["public"]['Enums']["listing_status"],
"submitted_at": string | null,
"title": string,
"total_rooms": number,
"updated_at": string,
"views_count": number
            }
                          SetofOptions: {
        from: "*"
        to: "properties"
        isOneToOne: true
        isSetofReturn: false
      } },
"current_user_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["user_role"]
                           },
"get_booking_contacts":
{ Args: { "p_booking_id": string }; Returns: {
              "email": string,"full_name": string,"party": string,"phone": string
            }[]
                           },
"increment_property_view":
{ Args: { "p_property_id": string }; Returns: undefined
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_privileged_session":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"mark_contact_message":
{ Args: { "p_id": number,"p_read": boolean }; Returns: undefined
                           },
"notify_user":
{ Args: { "p_body"?: string,"p_href"?: string,"p_title": string,"p_type": Database["public"]['Enums']["notification_type"],"p_user_id": string }; Returns: undefined
                           },
"reject_listing":
{ Args: { "p_property_id": string,"p_reason": string }; Returns: {
              "address_line1": string,
"address_line2": string | null,
"alt_contact_phone": string | null,
"approved_at": string | null,
"approved_by": string | null,
"available_from": string | null,
"available_rooms": number,
"city_id": number,
"contact_phone": string,
"created_at": string,
"description": string | null,
"furnishing": Database["public"]['Enums']["furnishing"],
"gender_preference": Database["public"]['Enums']["gender_preference"],
"house_rules": string | null,
"id": string,
"is_featured": boolean,
"latitude": number | null,
"locality": string,
"longitude": number | null,
"maintenance_amount": number,
"min_lease_months": number,
"owner_id": string,
"pincode": string,
"property_type": Database["public"]['Enums']["property_type"],
"rating_avg": number,
"rating_count": number,
"rejection_reason": string | null,
"rent_amount": number,
"search_tsv": unknown,
"security_deposit": number,
"state": string,
"status": Database["public"]['Enums']["listing_status"],
"submitted_at": string | null,
"title": string,
"total_rooms": number,
"updated_at": string,
"views_count": number
            }
                          SetofOptions: {
        from: "*"
        to: "properties"
        isOneToOne: true
        isSetofReturn: false
      } },
"search_properties":
{ Args: { "p_amenities"?: (string)[],"p_city"?: string,"p_furnishing"?: (Database["public"]['Enums']["furnishing"])[],"p_gender"?: Database["public"]['Enums']["gender_preference"],"p_limit"?: number,"p_max_rent"?: number,"p_min_rating"?: number,"p_min_rent"?: number,"p_offset"?: number,"p_q"?: string,"p_sort"?: string,"p_types"?: (Database["public"]['Enums']["property_type"])[] }; Returns: {
              "property_id": string,"total_count": number
            }[]
                           },
"set_listing_featured":
{ Args: { "p_featured": boolean,"p_property_id": string }; Returns: undefined
                           },
"set_review_visibility":
{ Args: { "p_reason"?: string,"p_review_id": string,"p_visible": boolean }; Returns: undefined
                           },
"set_user_active":
{ Args: { "p_active": boolean,"p_reason"?: string,"p_user_id": string }; Returns: undefined
                           },
"set_user_role":
{ Args: { "p_role": Database["public"]['Enums']["user_role"],"p_user_id": string }; Returns: undefined
                           },
"write_audit":
{ Args: { "p_action": string,"p_details"?: Json,"p_entity": string,"p_entity_id": string }; Returns: undefined
                           }
          }
          Enums: {
            "booking_status": "pending"|"accepted"|"rejected"|"cancelled"|"active"|"completed","business_type": "individual"|"company"|"agency"|"broker","contact_interest": "pg"|"shared"|"single"|"flat"|"owner"|"other","furnishing": "furnished"|"semi_furnished"|"unfurnished","gender_preference": "any"|"male"|"female","listing_status": "draft"|"pending"|"approved"|"rejected"|"inactive","notification_type": "listing_approved"|"listing_rejected"|"booking_requested"|"booking_accepted"|"booking_rejected"|"booking_cancelled"|"booking_activated"|"booking_completed"|"review_received"|"system","property_type": "pg"|"shared_room"|"single_room"|"flat"|"hostel","user_role": "tenant"|"owner"|"admin","verification_status": "pending"|"verified"|"rejected"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "booking_status": ["pending", "accepted", "rejected", "cancelled", "active", "completed"],"business_type": ["individual", "company", "agency", "broker"],"contact_interest": ["pg", "shared", "single", "flat", "owner", "other"],"furnishing": ["furnished", "semi_furnished", "unfurnished"],"gender_preference": ["any", "male", "female"],"listing_status": ["draft", "pending", "approved", "rejected", "inactive"],"notification_type": ["listing_approved", "listing_rejected", "booking_requested", "booking_accepted", "booking_rejected", "booking_cancelled", "booking_activated", "booking_completed", "review_received", "system"],"property_type": ["pg", "shared_room", "single_room", "flat", "hostel"],"user_role": ["tenant", "owner", "admin"],"verification_status": ["pending", "verified", "rejected"]
          }
        }
} as const
