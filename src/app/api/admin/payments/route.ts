// src/app/api/admin/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function authorizeAdmin() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

// GET — all pending top-up requests
export async function GET() {
  const admin = await authorizeAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pending = await prisma.transaction.findMany({
    where: { status: 'pending', type: 'add' },
    orderBy: { createdAt: 'asc' },
    include: {
      student: { select: { id: true, fullName: true, phone: true, balance: true } },
    },
  });

  return NextResponse.json(pending);
}

// PATCH — approve or reject a top-up request
// Body: { id, action: 'approve' | 'reject' }
export async function PATCH(req: NextRequest) {
  const admin = await authorizeAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, action } = await req.json();
  if (!id || !['approve', 'reject'].includes(action))
    return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const tx = await prisma.transaction.findUnique({
    where: { id: Number(id) },
    select: { id: true, status: true, amount: true, studentId: true },
  });
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (tx.status !== 'pending')
    return NextResponse.json({ error: 'Already processed' }, { status: 409 });

  if (action === 'approve') {
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: tx.id },
        data: { status: 'completed', processedById: admin.id },
      }),
      prisma.user.update({
        where: { id: tx.studentId },
        data: { balance: { increment: tx.amount } },
      }),
    ]);
  } else {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: 'rejected', processedById: admin.id },
    });
  }

  return NextResponse.json({ ok: true });
}
