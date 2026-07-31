// src/app/api/admin/units/route.ts
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

// ── GET /api/admin/units?courseId=X ────────────────────────────
// Returns each unit with its lessons (videos AND exams) nested inline,
// ordered by the unit's own `order`, then each lesson's `order` within it.
// This is the single call the combined Units+Lessons UI needs — no
// separate /api/admin/lessons fetch required for the admin page anymore.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = Number(searchParams.get('courseId'));
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });

  const { error } = await authorize(courseId);
  if (error) return error;

  const units = await prisma.unit.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: {
          video: true,
          exam: {
            include: {
              examQuestions: {
                include: { question: { include: { topic: true } } },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(units);
}

// ── POST /api/admin/units ───────────────────────────────────────
// Body: { courseId, title }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { courseId, title } = body;
  if (!courseId || !title)
    return NextResponse.json({ error: 'courseId and title are required' }, { status: 400 });

  const { error } = await authorize(Number(courseId));
  if (error) return error;

  const maxUnit = await prisma.unit.findFirst({
    where: { courseId: Number(courseId) },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const unit = await prisma.unit.create({
    data: {
      courseId: Number(courseId),
      title: String(title).trim(),
      order: (maxUnit?.order ?? 0) + 1,
    },
  });

  return NextResponse.json(unit, { status: 201 });
}

// ── PATCH /api/admin/units ──────────────────────────────────────
// action: "rename"            { id, title }
// action: "toggleVisibility"  { id }
// action: "reorder"           { id, direction: "up" | "down" }
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, action } = body;
  if (!id || !action)
    return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const unit = await prisma.unit.findUnique({
    where: { id: Number(id) },
    select: { courseId: true },
  });
  if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 });

  const { error } = await authorize(unit.courseId);
  if (error) return error;

  if (action === 'rename') {
    const { title } = body;
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
    await prisma.unit.update({ where: { id: Number(id) }, data: { title: String(title).trim() } });
    return NextResponse.json({ ok: true });
  }

  if (action === 'toggleVisibility') {
    const current = await prisma.unit.findUnique({
      where: { id: Number(id) },
      select: { isVisible: true },
    });
    await prisma.unit.update({
      where: { id: Number(id) },
      data: { isVisible: !current?.isVisible },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'reorder') {
    const { direction } = body;
    const all = await prisma.unit.findMany({
      where: { courseId: unit.courseId },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });
    const idx = all.findIndex((u) => u.id === Number(id));
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= all.length) return NextResponse.json({ ok: true });

    const a = all[idx];
    const b = all[swapIdx];
    await prisma.$transaction([
      prisma.unit.update({ where: { id: a.id }, data: { order: b.order } }),
      prisma.unit.update({ where: { id: b.id }, data: { order: a.order } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// ── DELETE /api/admin/units ──────────────────────────────────────
// Refuses to delete a unit that still has lessons (video OR exam) — the
// admin must move or delete those lessons first, so a unit is never
// silently deleted along with content students may already be using.
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const unit = await prisma.unit.findUnique({
    where: { id: Number(id) },
    select: { courseId: true },
  });
  if (!unit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { user, error } = await authorize(unit.courseId);
  if (error) return error;
  if (user!.role !== 'teacher' && !isAdmin(user!.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const lessonCount = await prisma.lesson.count({ where: { unitId: Number(id) } });
  if (lessonCount > 0) {
    return NextResponse.json(
      { error: "Move or delete this unit's lessons before deleting the unit itself" },
      { status: 400 }
    );
  }

  await prisma.unit.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
