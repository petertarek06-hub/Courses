// src/app/api/guardian/attempts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isGuardian } from '@/lib/auth';
import { loadExamAttemptDetail } from '@/lib/examAttempt';

// ── GET /api/guardian/attempts/[id] ──────────────────────────────
// Read-only review of the guardian's linked student's graded attempt.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !isGuardian(user.role) || !user.studentId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const attemptId = Number(id);
  if (!attemptId) return NextResponse.json({ error: 'Invalid attempt id' }, { status: 400 });

  const result = await loadExamAttemptDetail(attemptId);
  if (!result) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });

  // A guardian may only view attempts belonging to their own linked student
  if (result.studentId !== user.studentId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!result.submittedAt) {
    return NextResponse.json({ error: 'Attempt not submitted yet' }, { status: 400 });
  }

  return NextResponse.json(result.payload);
}
