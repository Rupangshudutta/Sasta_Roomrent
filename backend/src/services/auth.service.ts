import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, execute } from '../config/database';
import { User, PublicUser, CreateUserDto, LoginDto, AuthPayload } from '../models/user.model';
import { createError } from '../middleware/error.middleware';

const SALT_ROUNDS = 10;

function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

function stripPassword(user: User): PublicUser {
  const { password: _pw, ...pub } = user;
  return pub;
}

export async function registerUser(dto: CreateUserDto): Promise<{ user: PublicUser; token: string }> {
  // Check duplicate email
  const existing = await query<User>('SELECT id FROM users WHERE email = ?', [dto.email]);
  if (existing.length > 0) {
    throw createError('Email is already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

  const result = await execute(
    `INSERT INTO users (first_name, last_name, email, phone, password, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [dto.first_name, dto.last_name, dto.email, dto.phone || null, hashedPassword, dto.role || 'customer']
  );

  const [newUser] = await query<User>('SELECT * FROM users WHERE id = ?', [result.insertId]);
  const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });

  return { user: stripPassword(newUser), token };
}

export async function loginUser(dto: LoginDto): Promise<{ user: PublicUser; token: string }> {
  const [user] = await query<User>('SELECT * FROM users WHERE email = ? AND is_active = 1', [dto.email]);

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  const passwordValid = await bcrypt.compare(dto.password, user.password);
  if (!passwordValid) {
    throw createError('Invalid email or password', 401);
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  return { user: stripPassword(user), token };
}

export async function getUserById(id: number): Promise<PublicUser> {
  const [user] = await query<User>('SELECT * FROM users WHERE id = ? AND is_active = 1', [id]);
  if (!user) throw createError('User not found', 404);
  return stripPassword(user);
}

export async function updateUserProfile(id: number, dto: Partial<User>): Promise<PublicUser> {
  const fields = Object.keys(dto)
    .filter((k) => ['first_name', 'last_name', 'phone', 'avatar_url'].includes(k))
    .map((k) => `${k} = ?`);

  if (fields.length === 0) throw createError('No valid fields to update', 400);

  const values = Object.keys(dto)
    .filter((k) => ['first_name', 'last_name', 'phone', 'avatar_url'].includes(k))
    .map((k) => (dto as Record<string, unknown>)[k]);

  await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
  return getUserById(id);
}

export async function changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
  const [user] = await query<User>('SELECT password FROM users WHERE id = ?', [userId]);
  if (!user) throw createError('User not found', 404);

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) throw createError('Current password is incorrect', 400);

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await execute('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
}
