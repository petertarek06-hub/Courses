// src/app/api/admin/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function authorizeAdmin() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

// GET — pending top-up requests + resolved history
//
// `pending`: TopUpRequests awaiting review (unchanged from before).
//
// `history`: a merge of two sources, since "resolved" now spans two tables:
//  - Transaction (type: 'topup'): money that actually moved — this covers
//    both admin-approved TopUpRequests AND direct manual balance additions
//    from /api/admin/students (method: 'manual'), since both now write here.
//  - TopUpRequest (status: 'rejected'): requests that were declined. No
//    Transaction exists for these since nothing moved, but the admin still
//    needs to see them for the audit trail.
export async function GET() {
  const admin = await authorizeAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [pending, transactions, rejected] = await Promise.all([
    prisma.topUpRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: {
        student: { select: { id: true, fullName: true, phone: true, balance: true } },
      },
    }),
    prisma.transaction.findMany({
      where: { type: { in: ['topup', 'adjustment'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        student: { select: { id: true, fullName: true, phone: true } },
      },
    }),
    prisma.topUpRequest.findMany({
      where: { status: 'rejected' },
      orderBy: { processedAt: 'desc' },
      take: 50,
      include: {
        student: { select: { id: true, fullName: true, phone: true } },
      },
    }),
  ]);

  const history = [
    ...transactions.map((t) => ({
      kind: 'transaction' as const,
      id: t.id,
      amount: t.amount,
      method: t.method,
      status: 'approved' as const,
      notes: t.notes,
      date: t.createdAt,
      student: t.student,
    })),
    ...rejected.map((r) => ({
      kind: 'rejected_request' as const,
      id: r.id,
      amount: r.amount,
      method: r.method,
      status: 'rejected' as const,
      notes: r.notes,
      date: r.processedAt ?? r.createdAt,
      student: r.student,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);

  return NextResponse.json({ pending, history });
}

// PATCH — approve or reject a top-up request
// Body: { id, action: 'approve' | 'reject', amount? }
//
// `amount` is optional and only used on approve — it lets the admin credit
// a different amount than what the student originally requested (e.g. the
// transfer proof shows a slightly different figure). When provided, it
// overwrites the TopUpRequest's stored amount too, so the record reflects
// what was actually credited, not what was originally asked for.
export async function PATCH(req: NextRequest) {
  const admin = await authorizeAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, action, amount } = await req.json();
  if (!id || !['approve', 'reject'].includes(action))
    return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const request = await prisma.topUpRequest.findUnique({
    where: { id: Number(id) },
    select: { id: true, status: true, amount: true, method: true, studentId: true },
  });
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (request.status !== 'pending')
    return NextResponse.json({ error: 'Already processed' }, { status: 409 });

  if (action === 'approve') {
    let finalAmount = request.amount;
    if (amount !== undefined && amount !== null && amount !== '') {
      const parsed = Number(amount);
      if (isNaN(parsed) || parsed <= 0)
        return NextResponse.json({ error: 'Invalid override amount' }, { status: 400 });
      finalAmount = parsed;
    }

    await prisma.$transaction([
      prisma.topUpRequest.update({
        where: { id: request.id },
        data: {
          status: 'approved',
          processedById: admin.id,
          processedAt: new Date(),
          amount: finalAmount, // reflects what was actually credited
        },
      }),
      prisma.user.update({
        where: { id: request.studentId },
        data: { balance: { increment: finalAmount } },
      }),
      prisma.transaction.create({
        data: {
          studentId: request.studentId,
          amount: finalAmount,
          type: 'topup',
          method: request.method,
          topUpRequestId: request.id,
        },
      }),
    ]);
  } else {
    await prisma.topUpRequest.update({
      where: { id: request.id },
      data: { status: 'rejected', processedById: admin.id, processedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
