// src/app/api/guardian/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isGuardian } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST only — a guardian submits a top-up request on behalf of their
// linked student. Identical validation/flow to /api/student/wallet's
// POST; the only real difference is that the TopUpRequest is created
// against `user.studentId`, never `user.id` (guardians have no balance
// of their own — this always funds the CHILD's account).
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !isGuardian(user.role) || !user.studentId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const studentId = user.studentId;

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
        studentId,
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
      studentId,
      amount: Number(amount),
      method: 'cash',
      status: 'pending',
      notes: notes ? String(notes) : null,
    },
  });

  return NextResponse.json({ ok: true, requestId: request.id }, { status: 201 });
}
