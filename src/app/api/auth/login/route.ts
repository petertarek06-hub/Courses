// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, setAuthCookie } from '@/lib/auth';
import { MIN_PASSWORD_LENGTH } from '@/app/api/auth/register/route';

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();

    // Required field check
    if (!phone || !password) {
      return NextResponse.json({ error: 'رقم الهاتف وكلمة المرور مطلوبين' }, { status: 400 });
    }

    // ✅ Basic password length check before hitting the DB
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      // Return same generic error as wrong credentials — don't reveal which field is wrong
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 401 });
    }

    // Look up user first — students, teachers, admins, assistants all live here
    const user = await prisma.user.findUnique({ where: { phone } });

    if (user) {
      // ✅ Check if account is suspended
      if (user.isActive === false) {
        return NextResponse.json(
          { error: 'تم تعليق هذا الحساب. تواصل مع الإدارة.' },
          { status: 403 }
        );
      }

      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 401 });
      }

      await setAuthCookie({
        id: user.id,
        phone: user.phone,
        role: user.role,
        fullName: user.fullName,
      });

      return NextResponse.json({
        success: true,
        role: user.role,
        fullName: user.fullName,
      });
    }

    // No matching student/teacher/admin — check the Guardian table before failing.
    // Guardians share the same phone+password login form but live in their own
    // table and only ever get a read-only "guardian" role on the JWT.
    const guardian = await prisma.guardian.findUnique({ where: { phone } });
    if (!guardian) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 401 });
    }

    const isGuardianValid = await comparePassword(password, guardian.password);
    if (!isGuardianValid) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 401 });
    }

    await setAuthCookie({
      id: guardian.id,
      phone: guardian.phone,
      role: 'guardian',
      fullName: guardian.fullName,
      studentId: guardian.studentId,
    });

    return NextResponse.json({
      success: true,
      role: 'guardian',
      fullName: guardian.fullName,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 });
  }
}
