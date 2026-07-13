import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public, read-only subset of CenterSettings — just the contact info
// students/guests need (e.g. for the "pay cash at the center" flow).
// Deliberately excludes anything admin-only.
export async function GET() {
  const settings = await prisma.centerSettings.findFirst({
    orderBy: { id: 'asc' },
    select: {
      phone: true,
      whatsappNumber: true,
      address: true,
    },
  });

  return NextResponse.json(settings ?? { phone: null, whatsappNumber: null, address: null });
}
