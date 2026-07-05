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

// A JWT can still verify (correct signature, not expired) even after its
// underlying user row is gone — e.g. the DB was reset, or the account was
// deleted. This confirms the user still actually exists before trusting the
// token, and clears the stale cookie if not, so the person isn't stuck
// looking "logged in" to a ghost session.
export async function getAuthUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const exists = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true },
  });

  if (!exists) {
    cookieStore.delete(COOKIE_NAME);
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
