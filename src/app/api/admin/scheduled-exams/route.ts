// src/app/api/admin/scheduled-exams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, hasAdminAccess, isAdmin } from '@/lib/auth';

async function authorize(courseId?: number) {
  const user = await getAuthUser();
  if (!user)
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!hasAdminAccess(user.role))
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };

  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }
  return { user, error: null };
}

// ── GET /api/admin/scheduled-exams?courseId=X ─────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = Number(searchParams.get('courseId'));
  
  const { error } = await authorize(courseId);
  if (error) return error;

  const where = courseId ? { courseId } : {};
  
  const scheduledExams = await prisma.scheduledExam.findMany({
    where,
    include: {
      course: {
        select: { id: true, name: true, subject: true, academicYear: true },
      },
      examQuestions: {
        include: { question: { include: { topic: true } } },
        orderBy: { order: 'asc' },
      },
      attempts: {
        include: { student: { select: { id: true, fullName: true, phone: true } } },
        orderBy: { startedAt: 'desc' },
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return NextResponse.json(scheduledExams);
}

// ── POST /api/admin/scheduled-exams ───────────────────────────────
// Body: { courseId, title, durationMinutes?, passingScore?, scheduledAt }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { courseId, title, durationMinutes, passingScore, scheduledAt } = body;

  if (!courseId || !title || !scheduledAt)
    return NextResponse.json(
      { error: 'courseId, title, and scheduledAt are required' },
      { status: 400 }
    );

  const { error } = await authorize(Number(courseId));
  if (error) return error;

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime()))
    return NextResponse.json({ error: 'Invalid scheduledAt date' }, { status: 400 });

  const scheduledExam = await prisma.scheduledExam.create({
    data: {
      title: String(title).trim(),
      courseId: Number(courseId),
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      passingScore: passingScore ? Number(passingScore) : 50,
      scheduledAt: scheduledDate,
    },
    include: {
      course: {
        select: { id: true, name: true, subject: true, academicYear: true },
      },
    },
  });

  return NextResponse.json(scheduledExam, { status: 201 });
}

// ── PATCH /api/admin/scheduled-exams ─────────────────────────────
// action: "update"          { id, title?, durationMinutes?, passingScore?, scheduledAt? }
// action: "toggleVisibility" { id }
// action: "addQuestions"    { id, questionIds:[] }
// action: "removeQuestion"  { id, examQuestionId }
// action: "reorderQuestion" { id, examQuestionId, direction:"up"|"down" }
// action: "updateQuestionMark" { id, examQuestionId, mark }
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, action } = body;
  if (!id || !action)
    return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const scheduledExam = await prisma.scheduledExam.findUnique({
    where: { id: Number(id) },
    select: { courseId: true },
  });
  if (!scheduledExam) return NextResponse.json({ error: 'Scheduled exam not found' }, { status: 404 });

  const { user, error } = await authorize(scheduledExam.courseId);
  if (error) return error;

  if (action === 'update') {
    const { title, durationMinutes, passingScore, scheduledAt } = body;
    
    let scheduledDate: Date | null = null;
    if (scheduledAt && typeof scheduledAt === 'string') {
      scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime()))
        return NextResponse.json({ error: 'Invalid scheduledAt date' }, { status: 400 });
    }

    await prisma.scheduledExam.update({
      where: { id: Number(id) },
      data: {
        ...(title && { title: String(title).trim() }),
        ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) || null }),
        ...(passingScore !== undefined && { passingScore: Number(passingScore) }),
        ...(scheduledDate && { scheduledAt: scheduledDate }),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'toggleVisibility') {
    const current = await prisma.scheduledExam.findUnique({
      where: { id: Number(id) },
      select: { isVisible: true },
    });
    await prisma.scheduledExam.update({
      where: { id: Number(id) },
      data: { isVisible: !current?.isVisible },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'addQuestions') {
    const { questionIds } = body as { questionIds: number[] };
    if (!questionIds?.length)
      return NextResponse.json({ error: 'questionIds required' }, { status: 400 });

    const maxEq = await prisma.scheduledExamQuestion.findFirst({
      where: { examId: Number(id) },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    let nextOrder = (maxEq?.order ?? 0) + 1;

    const existing = await prisma.scheduledExamQuestion.findMany({
      where: { examId: Number(id) },
      select: { questionId: true, isVisible: true },
    });
    const existingIds = new Set(existing.map((e) => e.questionId));
    const hiddenIds = new Set(existing.filter((e) => !e.isVisible).map((e) => e.questionId));
    const toAdd = questionIds.filter((qId) => !existingIds.has(qId));
    const toUnhide = questionIds.filter((qId) => hiddenIds.has(qId));

    if (toUnhide.length) {
      await prisma.scheduledExamQuestion.updateMany({
        where: { examId: Number(id), questionId: { in: toUnhide } },
        data: { isVisible: true },
      });
    }

    await prisma.scheduledExamQuestion.createMany({
      data: toAdd.map((qId) => ({ examId: Number(id), questionId: qId, order: nextOrder++ })),
    });
    return NextResponse.json({ ok: true, added: toAdd.length, unhidden: toUnhide.length });
  }

  if (action === 'removeQuestion') {
    const { examQuestionId } = body;
    if (!examQuestionId)
      return NextResponse.json({ error: 'examQuestionId required' }, { status: 400 });

    const answerCount = await prisma.scheduledExamAttemptAnswer.count({
      where: { examQuestionId: Number(examQuestionId) },
    });

    if (answerCount === 0) {
      await prisma.scheduledExamQuestion.delete({ where: { id: Number(examQuestionId) } });
      return NextResponse.json({ ok: true, hidden: false });
    }

    await prisma.scheduledExamQuestion.update({
      where: { id: Number(examQuestionId) },
      data: { isVisible: false },
    });
    return NextResponse.json({
      ok: true,
      hidden: true,
      message: 'This question has already been answered by students, so it was hidden instead of deleted.',
    });
  }

  if (action === 'reorderQuestion') {
    const { examQuestionId, direction } = body;
    const all = await prisma.scheduledExamQuestion.findMany({
      where: { examId: Number(id) },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });
    const idx = all.findIndex((q) => q.id === Number(examQuestionId));
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= all.length) return NextResponse.json({ ok: true });

    const a = all[idx];
    const b = all[swapIdx];
    await prisma.$transaction([
      prisma.scheduledExamQuestion.update({ where: { id: a.id }, data: { order: b.order } }),
      prisma.scheduledExamQuestion.update({ where: { id: b.id }, data: { order: a.order } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === 'updateQuestionMark') {
    const { examQuestionId, mark } = body;
    const safeMark = Number(mark);
    if (!examQuestionId || !Number.isFinite(safeMark) || safeMark < 1)
      return NextResponse.json({ error: 'examQuestionId and mark ≥ 1 required' }, { status: 400 });

    await prisma.scheduledExamQuestion.update({
      where: { id: Number(examQuestionId) },
      data: { mark: safeMark },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// ── DELETE /api/admin/scheduled-exams ─────────────────────────────
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const scheduledExam = await prisma.scheduledExam.findUnique({
    where: { id: Number(id) },
    select: { courseId: true },
  });
  if (!scheduledExam) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { user, error } = await authorize(scheduledExam.courseId);
  if (error) return error;
  if (!isAdmin(user!.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.scheduledExam.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
