// src/app/api/admin/topics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, hasAdminAccess, isAdmin } from '@/lib/auth';

async function authorize(courseId?: number) {
  const user = await getAuthUser();
  if (!user)
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (user.role !== 'teacher' && !hasAdminAccess(user.role))
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };

  if (user.role === 'teacher' && courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });
    if (!course || course.teacherId !== user.id)
      return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, error: null };
}

// Structural check instead of `instanceof Prisma.PrismaClientKnownRequestError` —
// avoids depending on the exact export path of the Prisma namespace, which
// can vary with the "prisma-client" generator's output layout.
function isUniqueConstraintError(e: unknown): boolean {
  return (
    typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === 'P2002'
  );
}

// ── GET /api/admin/topics?courseId=X ────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = Number(searchParams.get('courseId'));
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });

  const { error } = await authorize(courseId);
  if (error) return error;

  const topics = await prisma.topic.findMany({
    where: { courseId },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });

  return NextResponse.json(topics);
}

// ── POST /api/admin/topics ───────────────────────────────────────
// Body: { courseId, name }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { courseId, name } = body;
  if (!courseId || !name)
    return NextResponse.json({ error: 'courseId and name are required' }, { status: 400 });

  const { error } = await authorize(Number(courseId));
  if (error) return error;

  try {
    const topic = await prisma.topic.create({
      data: { courseId: Number(courseId), name: String(name).trim() },
    });
    return NextResponse.json(topic, { status: 201 });
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return NextResponse.json({ error: 'A topic with this name already exists' }, { status: 409 });
    }
    throw e;
  }
}

// ── PATCH /api/admin/topics ──────────────────────────────────────
// Body: { id, name }
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, name } = body;
  if (!id || !name) return NextResponse.json({ error: 'id and name required' }, { status: 400 });

  const existing = await prisma.topic.findUnique({
    where: { id: Number(id) },
    select: { courseId: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await authorize(existing.courseId);
  if (error) return error;

  try {
    const updated = await prisma.topic.update({
      where: { id: Number(id) },
      data: { name: String(name).trim() },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return NextResponse.json({ error: 'A topic with this name already exists' }, { status: 409 });
    }
    throw e;
  }
}

// ── DELETE /api/admin/topics ──────────────────────────────────
// Refuses to delete a topic still referenced by question-bank questions —
// QuestionBank.topicId is required (NOT NULL), so questions must be
// reassigned or deleted first.
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.topic.findUnique({
    where: { id: Number(id) },
    select: { courseId: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { user, error } = await authorize(existing.courseId);
  if (error) return error;
  if (user!.role !== 'teacher' && !isAdmin(user!.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const questionCount = await prisma.questionBank.count({ where: { topicId: Number(id) } });
  if (questionCount > 0) {
    return NextResponse.json(
      { error: 'Reassign or delete the questions using this topic before deleting it' },
      { status: 400 }
    );
  }

  await prisma.topic.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
