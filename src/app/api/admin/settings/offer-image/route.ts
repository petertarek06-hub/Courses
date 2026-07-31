// src/app/api/admin/settings/offer-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ✅ Same allowlist/size limit as the avatar upload in /api/auth/register
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_OFFER_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB

async function getOrCreateSettings() {
  const existing = await prisma.centerSettings.findFirst({
    orderBy: { id: 'asc' },
  });
  if (existing) return existing;

  return prisma.centerSettings.create({
    data: {},
  });
}

/** Saves an uploaded offer image and returns its public URL path. */
async function saveOfferImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `offer-${Date.now()}.${ext}`;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'offers');
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/offers/${filename}`;
}

/** Best-effort removal of a previously uploaded offer image from disk. */
async function deleteOfferImageFile(url: string | null) {
  if (!url || !url.startsWith('/uploads/offers/')) return;
  try {
    await unlink(path.join(process.cwd(), 'public', url));
  } catch {
    // File may already be gone — non-fatal either way
  }
}

// ── POST: upload / replace the offer image ───────────────────────
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('image') as File | null;

  if (!file || file.size === 0)
    return NextResponse.json({ error: 'لم يتم اختيار صورة' }, { status: 400 });

  if (!ALLOWED_MIME_TYPES.includes(file.type))
    return NextResponse.json(
      { error: 'نوع الملف غير مدعوم. استخدم JPG أو PNG أو WEBP.' },
      { status: 400 }
    );

  if (file.size > MAX_OFFER_IMAGE_BYTES)
    return NextResponse.json({ error: 'حجم الصورة يتجاوز 3 ميغابايت.' }, { status: 400 });

  const current = await getOrCreateSettings();
  const imageUrl = await saveOfferImage(file);

  // Clean up the previous image file now that the new one is safely on disk
  await deleteOfferImageFile(current.offerImageUrl);

  const updated = await prisma.centerSettings.update({
    where: { id: current.id },
    data: { offerImageUrl: imageUrl },
  });

  return NextResponse.json(updated);
}

// ── DELETE: remove the offer image ────────────────────────────────
export async function DELETE() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const current = await getOrCreateSettings();
  await deleteOfferImageFile(current.offerImageUrl);

  const updated = await prisma.centerSettings.update({
    where: { id: current.id },
    data: { offerImageUrl: null },
  });

  return NextResponse.json(updated);
}
