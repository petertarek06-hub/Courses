import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getAuthUser, comparePassword, hashPassword, setAuthCookie, clearAuthCookie } from '@/lib/auth';

const MIN_PASSWORD_LENGTH = 8;
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

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!currentUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const formData = await req.formData();

    const fullName = (formData.get('fullName') as string | null)?.trim();
    const phone = (formData.get('phone') as string | null)?.trim();
    const email = (formData.get('email') as string | null)?.trim();
    const academicYear = (formData.get('academicYear') as string | null)?.trim();
    const avatarFile = formData.get('avatar') as File | null;
    const currentPassword = (formData.get('currentPassword') as string | null) || '';
    const newPassword = (formData.get('newPassword') as string | null) || '';

    // ── Required field check ──────────────────────────────────
    if (!fullName || fullName.length < 3) {
      return NextResponse.json({ error: 'الاسم يجب أن يكون 3 أحرف على الأقل' }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'أدخل بريداً إلكترونياً صحيحاً' }, { status: 400 });
    }

    const phoneChanged = !!phone && phone !== currentUser.phone;
    if (phoneChanged && !/^01[0-9]{9}$/.test(phone!)) {
      return NextResponse.json({ error: 'أدخل رقم هاتف مصري صحيح (01xxxxxxxxx)' }, { status: 400 });
    }

    if (newPassword && newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `كلمة المرور الجديدة يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل` },
        { status: 400 }
      );
    }

    // ── Sensitive changes require the current password ────────
    if (phoneChanged || newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'يجب إدخال كلمة المرور الحالية لتأكيد هذا التغيير' },
          { status: 400 }
        );
      }
      const validPassword = await comparePassword(currentPassword, currentUser.password);
      if (!validPassword) {
        return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 401 });
      }
    }

    // ── Duplicate phone check ──────────────────────────────────
    if (phoneChanged) {
      const existing = await prisma.user.findUnique({ where: { phone: phone! } });
      if (existing && existing.id !== currentUser.id) {
        return NextResponse.json({ error: 'رقم الهاتف مسجل بالفعل لمستخدم آخر' }, { status: 409 });
      }
    }

    // ── Avatar validation ──────────────────────────────────────
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

    // ── Build update payload ────────────────────────────────────
    const updateData: Record<string, unknown> = {
      fullName,
      email: email || null,
      academicYear: academicYear || null,
    };

    if (phoneChanged) updateData.phone = phone;
    if (newPassword) updateData.password = await hashPassword(newPassword);

    if (avatarFile && avatarFile.size > 0) {
      updateData.avatarUrl = await saveAvatar(avatarFile, currentUser.id);
    }

    const updated = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        avatarUrl: true,
        academicYear: true,
        balance: true,
        createdAt: true,
      },
    });

    // ── Session handling ─────────────────────────────────────────
    // Phone is baked into the JWT as the login identifier — if it changed,
    // clear the session so the student must log back in with the new
    // number. Otherwise, reissue the cookie so the header/dashboard
    // reflect a possible name change immediately without a full re-login.
    if (phoneChanged) {
      await clearAuthCookie();
    } else {
      await setAuthCookie({
        id: updated.id,
        phone: updated.phone,
        role: currentUser.role,
        fullName: updated.fullName,
      });
    }

    return NextResponse.json({
      success: true,
      requireRelogin: phoneChanged,
      profile: updated,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 });
  }
}