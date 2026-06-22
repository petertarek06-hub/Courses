// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { hashPassword, setAuthCookie } from '@/lib/auth';

// ✅ Shared constant — used by login route to reject obviously short passwords
export const MIN_PASSWORD_LENGTH = 8;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3 MB

/** Saves an uploaded avatar file and returns the public URL path. */
async function saveAvatar(file: File, userId: number): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `${userId}-${Date.now()}.${ext}`;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/avatars/${filename}`;
}

export async function POST(req: NextRequest) {
  try {
    // ── Parse multipart/form-data ─────────────────────────────
    // The client sends FormData so binary avatar data can travel alongside text fields.
    const formData = await req.formData();

    const fullName = formData.get('fullName') as string | null;
    const phone = formData.get('phone') as string | null;
    const email = formData.get('email') as string | null;
    const password = formData.get('password') as string | null;
    const academicYear = formData.get('academicYear') as string | null;
    const avatarFile = formData.get('avatar') as File | null;

    // ── Required field check ──────────────────────────────────
    if (!fullName || !phone || !password) {
      return NextResponse.json(
        { error: 'الاسم ورقم الهاتف وكلمة المرور مطلوبين' },
        { status: 400 }
      );
    }

    // ── Password length ───────────────────────────────────────
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل` },
        { status: 400 }
      );
    }

    // ── Phone format ──────────────────────────────────────────
    if (!/^01[0-9]{9}$/.test(phone)) {
      return NextResponse.json({ error: 'أدخل رقم هاتف مصري صحيح (01xxxxxxxxx)' }, { status: 400 });
    }

    // ── Avatar validation (before hitting the DB) ─────────────
    if (avatarFile && avatarFile.size > 0) {
      if (!ALLOWED_MIME_TYPES.includes(avatarFile.type)) {
        return NextResponse.json(
          { error: 'نوع الملف غير مدعوم. استخدم JPG أو PNG أو WEBP.' },
          { status: 400 }
        );
      }
      if (avatarFile.size > MAX_AVATAR_BYTES) {
        return NextResponse.json({ error: 'حجم الصورة يتجاوز 3 ميغابايت.' }, { status: 400 });
      }
    }

    // ── Duplicate phone check ─────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: 'رقم الهاتف مسجل بالفعل' }, { status: 409 });
    }

    // ── First user becomes admin ──────────────────────────────
    const usersCount = await prisma.user.count();
    const role = usersCount === 0 ? 'admin' : 'student';

    // ── Create user (avatar URL added after file save) ────────
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        fullName,
        phone,
        email: email || null,
        password: hashedPassword,
        academicYear: academicYear || null,
        role,
        // avatarUrl filled in below once we have the user id
      },
    });

    // ── Save avatar and update user row ───────────────────────
    let avatarUrl: string | null = null;
    if (avatarFile && avatarFile.size > 0) {
      try {
        avatarUrl = await saveAvatar(avatarFile, user.id);
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl },
        });
      } catch (uploadErr) {
        // Non-fatal — account is created; avatar just won't show
        console.error('Avatar upload failed:', uploadErr);
      }
    }

    // ── Issue JWT cookie ──────────────────────────────────────
    await setAuthCookie({
      id: user.id,
      phone: user.phone,
      role: user.role,
      fullName: user.fullName,
    });

    return NextResponse.json({
      success: true,
      role,
      message: role === 'admin' ? 'تم إنشاء حساب الأدمن!' : 'تم إنشاء الحساب!',
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 });
  }
}
