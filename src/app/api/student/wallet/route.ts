// src/app/api/student/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — current balance + recent transactions
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const student = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });

  const transactions = await prisma.transaction.findMany({
    where: { studentId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      amount: true,
      type: true,
      method: true,
      status: true,
      notes: true,
      createdAt: true,
      course: { select: { nameAr: true, nameEn: true } },
    },
  });

  return NextResponse.json({ balance: student?.balance ?? 0, transactions });
}

// POST — submit a top-up request (cash or wallet transfer)
// Body: { amount, method: 'cash'|'wallet', notes? }
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount, method, notes } = await req.json();

  if (!amount || amount <= 0)
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  if (!['cash', 'wallet'].includes(method))
    return NextResponse.json({ error: 'method must be cash or wallet' }, { status: 400 });

  const tx = await prisma.transaction.create({
    data: {
      studentId: user.id,
      amount: Number(amount),
      type: 'add',
      method: method === 'wallet' ? 'fawry' : 'cash',
      status: 'pending',
      notes: notes ? String(notes) : null,
    },
  });

  return NextResponse.json({ ok: true, transactionId: tx.id }, { status: 201 });
}
