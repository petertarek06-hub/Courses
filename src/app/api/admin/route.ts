import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
