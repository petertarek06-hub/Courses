//src\app\api\admin\lessons\route.ts
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

async function validateUnit(unitId: number, courseId: number): Promise<NextResponse | null> {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: { courseId: true },
  });
  if (!unit || unit.courseId !== courseId) {
    return NextResponse.json({ error: 'Unit does not belong to this course' }, { status: 400 });
  }
  return null;
}

// Next order is a single shared sequence per unit — videos and exams are
// interleaved in whatever order the admin builds them, matching the
// Course → Unit → [Lesson, Lesson, ...] tree the admin sees on screen.
async function nextOrderInUnit(unitId: number): Promise<number> {
  const maxLesson = await prisma.lesson.findFirst({
    where: { unitId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  return (maxLesson?.order ?? 0) + 1;
}

// ── GET /api/admin/lessons?courseId=X ─────────────────────────
// Kept for callers that want a flat list across all units (e.g. student-
// facing progress calculations). The admin UI itself now gets lessons
// nested under each unit via GET /api/admin/units.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = Number(searchParams.get('courseId'));
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });

  const { error } = await authorize(courseId);
  if (error) return error;

  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: [{ unitId: 'asc' }, { order: 'asc' }],
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
  });

  return NextResponse.json(lessons);
}

// ── POST /api/admin/lessons ────────────────────────────────────
// Body for video: { courseId, unitId, title, type:"video", vimeoId, description? }
// Body for exam:  { courseId, unitId, title, type:"exam", durationMinutes?, passingScore?, scheduledAt? }
//   unitId is required for BOTH types — every lesson lives inside a unit.
//   scheduledAt: ISO-8601 string or null/undefined = immediately available.
//   Order is a single sequence shared by videos and exams within the unit.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { courseId, unitId, title, type } = body;

  if (!courseId || !unitId || !title || !type)
    return NextResponse.json(
      { error: 'courseId, unitId, title, type are required' },
      { status: 400 }
    );

  const { error } = await authorize(Number(courseId));
  if (error) return error;

  const unitError = await validateUnit(Number(unitId), Number(courseId));
  if (unitError) return unitError;

  if (type === 'video') {
    const { vimeoId, description } = body;
    if (!vimeoId)
      return NextResponse.json({ error: 'vimeoId required for video lessons' }, { status: 400 });

    const nextOrder = await nextOrderInUnit(Number(unitId));

    const lesson = await prisma.lesson.create({
      data: {
        title,
        type: 'video',
        order: nextOrder,
        courseId: Number(courseId),
        unitId: Number(unitId),
        video: {
          create: {
            vimeoId: String(vimeoId).trim(),
            description: description ? String(description).trim() : null,
          },
        },
      },
      include: { video: true },
    });
    return NextResponse.json(lesson, { status: 201 });
  }

  if (type === 'exam') {
    const { durationMinutes, passingScore, scheduledAt } = body;

    const scheduledDate: Date | null =
      scheduledAt && typeof scheduledAt === 'string' ? new Date(scheduledAt) : null;

    if (scheduledDate && isNaN(scheduledDate.getTime()))
      return NextResponse.json({ error: 'Invalid scheduledAt date' }, { status: 400 });

    const nextOrder = await nextOrderInUnit(Number(unitId));

    const lesson = await prisma.lesson.create({
      data: {
        title,
        type: 'exam',
        order: nextOrder,
        courseId: Number(courseId),
        unitId: Number(unitId),
        exam: {
          create: {
            durationMinutes: durationMinutes ? Number(durationMinutes) : null,
            passingScore: passingScore ? Number(passingScore) : 50,
            scheduledAt: scheduledDate,
          },
        },
      },
      include: { exam: true },
    });
    return NextResponse.json(lesson, { status: 201 });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

// ── PATCH /api/admin/lessons ───────────────────────────────────
// action: "updateVideo"              { id, title, vimeoId, description?, unitId? }
// action: "updateExam"               { id, title, durationMinutes?, passingScore?, scheduledAt?, unitId? }
//   Passing a different unitId moves the lesson and appends it to that unit's sequence.
// action: "toggleVisibility"         { id }
// action: "reorder"                  { id, direction:"up"|"down" }
//   Swaps with the adjacent lesson in the SAME unit — videos and exams
//   share one ordered list now, so this is type-agnostic.
// action: "addExamQuestions"         { id(lessonId), questionIds:[...] }
// action: "removeExamQuestion"       { id(lessonId), examQuestionId }
// action: "reorderExamQuestion"      { id(lessonId), examQuestionId, direction }
// action: "updateExamQuestionMark"   { id(lessonId), examQuestionId, mark }
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, action } = body;
  if (!id || !action)
    return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const lesson = await prisma.lesson.findUnique({
    where: { id: Number(id) },
    select: { courseId: true, unitId: true, type: true, order: true },
  });
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

  const { error } = await authorize(lesson.courseId);
  if (error) return error;

  if (action === 'updateVideo') {
    const { title, vimeoId, description, unitId } = body;
    if (!title || !vimeoId)
      return NextResponse.json({ error: 'title and vimeoId required' }, { status: 400 });

    const data: { title: string; unitId?: number; order?: number } = { title };

    if (unitId && Number(unitId) !== lesson.unitId) {
      const unitError = await validateUnit(Number(unitId), lesson.courseId);
      if (unitError) return unitError;
      data.unitId = Number(unitId);
      data.order = await nextOrderInUnit(Number(unitId));
    }

    await prisma.lesson.update({ where: { id: Number(id) }, data });
    await prisma.video.upsert({
      where: { lessonId: Number(id) },
      create: {
        lessonId: Number(id),
        vimeoId: String(vimeoId).trim(),
        description: description ? String(description).trim() : null,
      },
      update: {
        vimeoId: String(vimeoId).trim(),
        description: description ? String(description).trim() : null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'updateExam') {
    const { title, durationMinutes, passingScore, scheduledAt, unitId } = body;
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

    let scheduledDate: Date | null = null;
    if (scheduledAt === null || scheduledAt === '') {
      scheduledDate = null;
    } else if (scheduledAt && typeof scheduledAt === 'string') {
      scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime()))
        return NextResponse.json({ error: 'Invalid scheduledAt date' }, { status: 400 });
    }

    const data: { title: string; unitId?: number; order?: number } = { title };

    if (unitId && Number(unitId) !== lesson.unitId) {
      const unitError = await validateUnit(Number(unitId), lesson.courseId);
      if (unitError) return unitError;
      data.unitId = Number(unitId);
      data.order = await nextOrderInUnit(Number(unitId));
    }

    await prisma.lesson.update({ where: { id: Number(id) }, data });
    await prisma.exam.updateMany({
      where: { lessonId: Number(id) },
      data: {
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        passingScore: passingScore ? Number(passingScore) : 50,
        ...(Object.prototype.hasOwnProperty.call(body, 'scheduledAt') && {
          scheduledAt: scheduledDate,
        }),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'toggleVisibility') {
    const current = await prisma.lesson.findUnique({
      where: { id: Number(id) },
      select: { isVisible: true },
    });
    await prisma.lesson.update({
      where: { id: Number(id) },
      data: { isVisible: !current?.isVisible },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'reorder') {
    const { direction } = body;

    // One shared, type-agnostic sequence per unit.
    const group = await prisma.lesson.findMany({
      where: { unitId: lesson.unitId },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });
    const idx = group.findIndex((l) => l.id === Number(id));
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= group.length)
      return NextResponse.json({ ok: true });

    const a = group[idx];
    const b = group[swapIdx];
    await prisma.$transaction([
      prisma.lesson.update({ where: { id: a.id }, data: { order: b.order } }),
      prisma.lesson.update({ where: { id: b.id }, data: { order: a.order } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === 'addExamQuestions') {
    const { questionIds } = body as { questionIds: number[] };
    if (!questionIds?.length)
      return NextResponse.json({ error: 'questionIds required' }, { status: 400 });

    const exam = await prisma.exam.findUnique({
      where: { lessonId: Number(id) },
      select: { id: true },
    });
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    const maxEq = await prisma.examQuestion.findFirst({
      where: { examId: exam.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    let nextOrder = (maxEq?.order ?? 0) + 1;

    const existing = await prisma.examQuestion.findMany({
      where: { examId: exam.id },
      select: { questionId: true, isVisible: true },
    });
    const existingIds = new Set(existing.map((e) => e.questionId));
    const hiddenIds = new Set(existing.filter((e) => !e.isVisible).map((e) => e.questionId));
    const toAdd = questionIds.filter((qId) => !existingIds.has(qId));
    const toUnhide = questionIds.filter((qId) => hiddenIds.has(qId));

    if (toUnhide.length) {
      await prisma.examQuestion.updateMany({
        where: { examId: exam.id, questionId: { in: toUnhide } },
        data: { isVisible: true },
      });
    }

    await prisma.examQuestion.createMany({
      data: toAdd.map((qId) => ({ examId: exam.id, questionId: qId, order: nextOrder++ })),
    });
    return NextResponse.json({ ok: true, added: toAdd.length, unhidden: toUnhide.length });
  }

  if (action === 'removeExamQuestion') {
    const { examQuestionId } = body;
    if (!examQuestionId)
      return NextResponse.json({ error: 'examQuestionId required' }, { status: 400 });

    const answerCount = await prisma.attemptAnswer.count({
      where: { examQuestionId: Number(examQuestionId) },
    });

    if (answerCount === 0) {
      await prisma.examQuestion.delete({ where: { id: Number(examQuestionId) } });
      return NextResponse.json({ ok: true, hidden: false });
    }

    await prisma.examQuestion.update({
      where: { id: Number(examQuestionId) },
      data: { isVisible: false },
    });
    return NextResponse.json({
      ok: true,
      hidden: true,
      message:
        'This question has already been answered by students, so it was hidden instead of deleted. Existing grades are unaffected.',
    });
  }

  if (action === 'reorderExamQuestion') {
    const { examQuestionId, direction } = body;
    const exam = await prisma.exam.findUnique({
      where: { lessonId: Number(id) },
      select: { id: true },
    });
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    const all = await prisma.examQuestion.findMany({
      where: { examId: exam.id },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });
    const idx = all.findIndex((q) => q.id === Number(examQuestionId));
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= all.length) return NextResponse.json({ ok: true });

    const a = all[idx];
    const b = all[swapIdx];
    await prisma.$transaction([
      prisma.examQuestion.update({ where: { id: a.id }, data: { order: b.order } }),
      prisma.examQuestion.update({ where: { id: b.id }, data: { order: a.order } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === 'updateExamQuestionMark') {
    const { examQuestionId, mark } = body;
    const safeMark = Number(mark);
    if (!examQuestionId || !Number.isFinite(safeMark) || safeMark < 1)
      return NextResponse.json({ error: 'examQuestionId and mark ≥ 1 required' }, { status: 400 });

    await prisma.examQuestion.update({
      where: { id: Number(examQuestionId) },
      data: { mark: safeMark },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// ── DELETE /api/admin/lessons ─────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const lesson = await prisma.lesson.findUnique({
    where: { id: Number(id) },
    select: { courseId: true },
  });
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { user, error } = await authorize(lesson.courseId);
  if (error) return error;
  if (user!.role !== 'teacher' && !isAdmin(user!.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.lesson.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
