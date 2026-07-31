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

    // Guardians live in their own table with their own id sequence —
    // tokenUser.id is a Guardian.id here, NOT a User.id. Querying `User`
    // with it would silently match whatever unrelated User row happens to
    // share that same numeric id (e.g. the first admin created), which is
    // exactly the bug this branch fixes.
    if (tokenUser.role === 'guardian') {
      const guardian = await prisma.guardian.findUnique({
        where: { id: tokenUser.id },
        select: {
          id: true,
          fullName: true,
          phone: true,
          createdAt: true,
          studentId: true,
        },
      });

      if (!guardian) {
        return NextResponse.json({ user: null }, { status: 401 });
      }

      return NextResponse.json({
        user: {
          id: guardian.id,
          fullName: guardian.fullName,
          phone: guardian.phone,
          email: null,
          role: 'guardian',
          avatarUrl: null,
          academicYear: null,
          balance: null,
          isActive: true,
          createdAt: guardian.createdAt,
          studentId: guardian.studentId,
        },
      });
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
