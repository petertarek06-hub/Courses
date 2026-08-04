// src/lib/auth.ts
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// ✅ Throw at startup if secret is missing — never use a hardcoded fallback in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('Missing environment variable: JWT_SECRET');

const COOKIE_NAME = 'educenter_token';

// ✅ Single source of truth for session duration — cookie and JWT now match
const SESSION_SECONDS = 60 * 60; // 1 hour

export interface JwtPayload {
  id: number;
  phone: string;
  role: string;
  fullName: string;
  studentId?: number; // present only when role === 'guardian': which student they're linked to
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: SESSION_SECONDS });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET as string) as JwtPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(payload: JwtPayload) {
  const token = signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_SECONDS, // ✅ Matches JWT expiry
    path: '/',
  });
}

export async function getAuthUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const exists =
    payload.role === 'guardian'
      ? await prisma.guardian.findUnique({
          where: { id: payload.id },
          select: { id: true },
        })
      : await prisma.user.findUnique({
          where: { id: payload.id },
          select: { id: true },
        });

  if (!exists) {
    return null;
  }

  return payload;
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// ── Role helpers ─────────────────────────────────────────────────
// Single source of truth for "who can do what" in admin.
// hasAdminAccess: admin dashboard + all admin CRUD except deletion.
// isAdmin: strictly the admin role — required for any DELETE action,
// and for managing assistant accounts (create/edit/suspend of staff).
// isGuardian: strictly the guardian role — read-only access to their
// linked student's dashboard, nothing else.
export function hasAdminAccess(role?: string | null): boolean {
  return role === 'admin' || role === 'assistant';
}

export function isAdmin(role?: string | null): boolean {
  return role === 'admin';
}

export function isGuardian(role?: string | null): boolean {
  return role === 'guardian';
}
