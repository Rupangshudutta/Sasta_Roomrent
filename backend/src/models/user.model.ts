// ============================================================
// TypeScript interfaces matching the MySQL schema
// ============================================================

export type UserRole = 'customer' | 'owner' | 'admin';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  avatar_url?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type PublicUser = Omit<User, 'password'>;

export interface CreateUserDto {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthPayload {
  id: number;
  email: string;
  role: UserRole;
}
