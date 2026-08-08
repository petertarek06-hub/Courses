// src/app/api/student/attempts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { loadExamAttemptDetail } from '@/lib/examAttempt';

// ── GET /api/student/attempts/[id] ───────────────────────────────
// Read-only review of a student's own graded (or partially-graded) attempt.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const attemptId = Number(id);
  if (!attemptId) return NextResponse.json({ error: 'Invalid attempt id' }, { status: 400 });

  const result = await loadExamAttemptDetail(attemptId);
  if (!result) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });

  // A student may only ever view their own attempts
  if (result.studentId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Nothing to review before it's submitted
  if (!result.submittedAt) {
    return NextResponse.json({ error: 'Attempt not submitted yet' }, { status: 400 });
  }

  return NextResponse.json(result.payload);
}
