// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getOrCreateSettings() {
  const existing = await prisma.centerSettings.findFirst({
    orderBy: { id: 'asc' },
  });
  if (existing) return existing;

  return prisma.centerSettings.create({
    data: {},
  });
}

// ── GET ─────────────────────────────────────────────────────────
export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await getOrCreateSettings();
  return NextResponse.json(settings);
}

// ── PATCH ───────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const {
    siteName,
    siteDescription,
    email,
    phone,
    whatsappNumber,
    address,
    facebookUrl,
    instagramUrl,
    youtubeUrl,
    whatsappButtonLabel,
    copyrightText,
  } = body ?? {};

  if (siteName !== undefined && !String(siteName).trim())
    return NextResponse.json({ error: 'Site name cannot be empty' }, { status: 400 });

  const current = await getOrCreateSettings(); // ensure a row exists before updating

  const updated = await prisma.centerSettings.update({
    where: { id: current.id },
    data: {
      ...(siteName !== undefined && { siteName: String(siteName).trim() }),
      ...(siteDescription !== undefined && { siteDescription: siteDescription || null }),
      ...(email !== undefined && { email: email || null }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(whatsappNumber !== undefined && { whatsappNumber: whatsappNumber || null }),
      ...(address !== undefined && { address: address || null }),
      ...(facebookUrl !== undefined && { facebookUrl: facebookUrl || null }),
      ...(instagramUrl !== undefined && { instagramUrl: instagramUrl || null }),
      ...(youtubeUrl !== undefined && { youtubeUrl: youtubeUrl || null }),
      ...(whatsappButtonLabel !== undefined && {
        whatsappButtonLabel: whatsappButtonLabel || null,
      }),
      ...(copyrightText !== undefined && { copyrightText: copyrightText || null }),
    },
  });

  return NextResponse.json(updated);
}
