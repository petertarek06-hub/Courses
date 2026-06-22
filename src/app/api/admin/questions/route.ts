// src/app/api/admin/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

async function authorize(courseId: number) {
  const user = await getAuthUser();
  if (!user)
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (user.role !== 'teacher' && user.role !== 'admin') {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  if (user.role === 'teacher') {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course || course.instructorId !== user.id) {
      return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
  }
  return { user, error: null };
}

const VALID_TYPES = ['mcq', 'true_false', 'essay'] as const;
type QType = (typeof VALID_TYPES)[number];

function validatePayload(
  type: string,
  optionsJson: string,
  correctAnswer: string
): NextResponse | null {
  if (!VALID_TYPES.includes(type as QType)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  // Essay: optionsJson must be a valid JSON array (can be empty); correctAnswer is optional
  if (type === 'essay') {
    try {
      const parsed = JSON.parse(optionsJson);
      if (!Array.isArray(parsed)) throw new Error();
    } catch {
      return NextResponse.json(
        { error: 'optionsJson must be a valid JSON array' },
        { status: 400 }
      );
    }
    return null; // correctAnswer holds grading notes — may be empty string
  }

  // MCQ / True-False: need ≥2 options and a correct answer
  if (!correctAnswer) {
    return NextResponse.json(
      { error: 'correctAnswer is required for mcq and true_false' },
      { status: 400 }
    );
  }
  try {
    const parsed = JSON.parse(optionsJson);
    if (!Array.isArray(parsed) || parsed.length < 2) {
      return NextResponse.json(
        { error: 'optionsJson must be a JSON array with at least 2 items' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'optionsJson must be valid JSON' }, { status: 400 });
  }

  return null;
}

// ── GET /api/admin/questions?courseId=X[&lessonTag=Y] ─────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = Number(searchParams.get('courseId'));
  const lessonTag = searchParams.get('lessonTag') ?? undefined;

  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });

  const { error } = await authorize(courseId);
  if (error) return error;

  const questions = await prisma.questionBank.findMany({
    where: { courseId, ...(lessonTag ? { lessonTag } : {}) },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(questions);
}

// ── POST /api/admin/questions ──────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { courseId, text, type, optionsJson, correctAnswer = '', lessonTag } = body;

  if (!courseId || !text || !type || !optionsJson || !lessonTag) {
    return NextResponse.json(
      { error: 'courseId, text, type, optionsJson, lessonTag are required' },
      { status: 400 }
    );
  }

  const { error } = await authorize(Number(courseId));
  if (error) return error;

  const validationError = validatePayload(String(type), String(optionsJson), String(correctAnswer));
  if (validationError) return validationError;

  const question = await prisma.questionBank.create({
    data: {
      courseId: Number(courseId),
      text: String(text),
      type: String(type),
      optionsJson: String(optionsJson),
      correctAnswer: String(correctAnswer),
      lessonTag: String(lessonTag),
    },
  });

  return NextResponse.json(question, { status: 201 });
}

// ── PATCH /api/admin/questions ────────────────────────────────
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, text, type, optionsJson, correctAnswer = '', lessonTag } = body;

  if (!id || !text || !type || !optionsJson || !lessonTag) {
    return NextResponse.json(
      { error: 'id, text, type, optionsJson, lessonTag required' },
      { status: 400 }
    );
  }

  const existing = await prisma.questionBank.findUnique({
    where: { id: Number(id) },
    select: { courseId: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await authorize(existing.courseId);
  if (error) return error;

  const validationError = validatePayload(String(type), String(optionsJson), String(correctAnswer));
  if (validationError) return validationError;

  const updated = await prisma.questionBank.update({
    where: { id: Number(id) },
    data: {
      text: String(text),
      type: String(type),
      optionsJson: String(optionsJson),
      correctAnswer: String(correctAnswer),
      lessonTag: String(lessonTag),
    },
  });

  return NextResponse.json(updated);
}

// ── DELETE /api/admin/questions ───────────────────────────────
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.questionBank.findUnique({
    where: { id: Number(id) },
    select: { courseId: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await authorize(existing.courseId);
  if (error) return error;

  await prisma.questionBank.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
