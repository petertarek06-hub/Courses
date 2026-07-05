// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Verify the JWT cookie → get id, role, etc.
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // 2. Fetch the live user record from DB (balance may have changed since login)
    const dbUser = await prisma.user.findUnique({
      where: { id: tokenUser.id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        avatarUrl: true,
        academicYear: true,
        balance: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: dbUser });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
