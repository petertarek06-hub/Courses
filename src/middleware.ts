import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWTPayload, SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'educenter-secret-key');
const COOKIE_NAME = 'educenter_token';
const COOKIE_MAX_AGE = 60 * 60; // 1 hour

interface UserPayload extends JWTPayload {
  role?: string;
  id?: number;
  phone?: string;
  fullName?: string;
}

const protectedRoutes = ['/admin', '/student-dashboard', '/teacher-dashboard'];
const authRoutes = ['/sign-up-login-screen'];

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = req.nextUrl;

  let user: UserPayload | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      user = payload as UserPayload;
    } catch {
      user = null;
    }
  }

  if (protectedRoutes.some((r) => pathname.startsWith(r))) {
    if (!user) {
      return NextResponse.redirect(new URL('/sign-up-login-screen', req.url));
    }

    if (pathname.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (pathname.startsWith('/teacher-dashboard') && user.role !== 'teacher') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (pathname.startsWith('/student-dashboard') && user.role === 'teacher') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (authRoutes.some((r) => pathname.startsWith(r))) {
    if (user) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Slide the session window on every request from a valid logged-in user
  const response = NextResponse.next();
  if (user) {
    const { iat, exp, ...rest } = user; // strip old timing claims
    const freshToken = await new SignJWT(rest)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET);

    response.cookies.set(COOKIE_NAME, freshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
