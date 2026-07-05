// src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public, read-only subset of CenterSettings — everything the footer
// (and any other public-facing component) needs. Deliberately excludes
// nothing sensitive since CenterSettings never held anything private.
export async function GET() {
  const settings = await prisma.centerSettings.findFirst({
    orderBy: { id: 'asc' },
    select: {
      siteName: true,
      siteDescription: true,
      email: true,
      phone: true,
      whatsappNumber: true,
      address: true,
      facebookUrl: true,
      instagramUrl: true,
      youtubeUrl: true,
      whatsappButtonLabel: true,
      copyrightText: true,
    },
  });

  return NextResponse.json(
    settings ?? {
      siteName: 'EduCenter',
      siteDescription: null,
      email: null,
      phone: null,
      whatsappNumber: null,
      address: null,
      facebookUrl: null,
      instagramUrl: null,
      youtubeUrl: null,
      whatsappButtonLabel: null,
      copyrightText: null,
    }
  );
}
