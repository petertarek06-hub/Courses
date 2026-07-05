// src/app/api/student/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET — current balance + recent wallet activity
//
// "Activity" is a merge of two different tables now:
//  - Transaction: money that has actually moved (completed top-ups, course
//    purchases). Always finished, never pending/rejected.
//  - TopUpRequest (status: 'pending' only): top-up requests still awaiting
//    admin review. Shown so the student can see "your request is being
//    reviewed" — but this money has NOT touched their balance yet.
//
// We tag each item with `kind` so the client can render them differently
// (e.g. show a "pending review" badge only for kind: 'topup_request').
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const student = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });

  const [transactions, pendingRequests] = await Promise.all([
    prisma.transaction.findMany({
      where: { studentId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        amount: true,
        type: true,
        method: true,
        notes: true,
        createdAt: true,
        course: { select: { name: true } },
      },
    }),
    prisma.topUpRequest.findMany({
      where: { studentId: user.id, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        notes: true,
        senderPhone: true,
        proofImageUrl: true,
        createdAt: true,
      },
    }),
  ]);

  const activity = [
    ...transactions.map((t) => ({ kind: 'transaction' as const, status: 'completed', ...t })),
    ...pendingRequests.map((r) => ({ kind: 'topup_request' as const, type: 'topup', ...r })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  return NextResponse.json({ balance: student?.balance ?? 0, activity });
}

// POST — submit a top-up request (cash or wallet transfer)
//
// This now creates a TopUpRequest, NOT a Transaction. Nothing about the
// student's balance changes here — that only happens when an admin
// approves the request (see PATCH /api/admin/payments), at which point a
// single Transaction row is created atomically alongside the balance
// update.
//
// - Wallet transfers MUST arrive as multipart/form-data: amount, method,
//   senderPhone, proof (image file), notes? — the proof photo is what lets
//   an admin verify the transfer actually happened.
// - Cash requests (which need no proof) can use plain JSON:
//   { amount, method: 'cash', notes? }
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const amount = Number(formData.get('amount'));
    const method = formData.get('method') as string;
    const notes = formData.get('notes') as string | null;
    const senderPhone = formData.get('senderPhone') as string | null;
    const proof = formData.get('proof') as File | null;

    if (!amount || amount <= 0)
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    if (!['cash', 'wallet'].includes(method))
      return NextResponse.json({ error: 'method must be cash or wallet' }, { status: 400 });

    if (method === 'wallet') {
      if (!senderPhone || !senderPhone.trim())
        return NextResponse.json({ error: 'Sender phone number is required' }, { status: 400 });
      if (!proof || proof.size === 0)
        return NextResponse.json({ error: 'Transfer screenshot is required' }, { status: 400 });
    }

    let proofImageUrl: string | null = null;
    if (proof && proof.size > 0) {
      const buffer = Buffer.from(await proof.arrayBuffer());
      const ext = proof.name.split('.').pop() ?? 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payment-proofs');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), buffer);
      proofImageUrl = `/uploads/payment-proofs/${fileName}`;
    }

    const request = await prisma.topUpRequest.create({
      data: {
        studentId: user.id,
        amount,
        method,
        status: 'pending',
        notes: notes ? String(notes) : null,
        senderPhone: senderPhone ? String(senderPhone).trim() : null,
        proofImageUrl,
      },
    });

    return NextResponse.json({ ok: true, requestId: request.id }, { status: 201 });
  }

  // JSON fallback — cash requests only. Wallet transfers require a proof
  // image, so they can never be created without going through the
  // multipart branch above.
  const { amount, method, notes } = await req.json();

  if (!amount || amount <= 0)
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  if (method !== 'cash')
    return NextResponse.json(
      { error: 'wallet top-ups require multipart/form-data with a proof image' },
      { status: 400 }
    );

  const request = await prisma.topUpRequest.create({
    data: {
      studentId: user.id,
      amount: Number(amount),
      method: 'cash',
      status: 'pending',
      notes: notes ? String(notes) : null,
    },
  });

  return NextResponse.json({ ok: true, requestId: request.id }, { status: 201 });
}
