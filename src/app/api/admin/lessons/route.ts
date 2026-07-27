//src\app\api\admin\lessons\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, hasAdminAccess, isAdmin } from '@/lib/auth';

// Teachers, admins, and assistants can all view/manage lessons.
// Deletion is gated separately (teachers on their own courses, or admin) —
// see the extra check inside DELETE below.
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

// ── GET /api/admin/lessons?courseId=X ─────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = Number(searchParams.get('courseId'));
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });

  const { error } = await authorize(courseId);
  if (error) return error;

  // Note: intentionally NOT filtering examQuestions by isVisible here.
  // Admin/teacher management views should still see hidden (soft-removed)
  // questions so they understand why a question they tried to delete is
  // still occupying a row — the frontend can use `isVisible` to gray it
  // out / label it "removed". Students never hit this endpoint.
  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      video: true,
      exam: {
        include: {
          examQuestions: {
            include: { question: true },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  return NextResponse.json(lessons);
}

// ── POST /api/admin/lessons ────────────────────────────────────
// Body for video: { courseId, title, type:"video", vimeoId, description? }
// Body for exam:  { courseId, title, type:"exam", durationMinutes?, passingScore?, scheduledAt? }
//   scheduledAt: ISO-8601 string or null/undefined = immediately available
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { courseId, title, type } = body;

  if (!courseId || !title || !type)
    return NextResponse.json({ error: 'courseId, title, type are required' }, { status: 400 });

  const { error } = await authorize(Number(courseId));
  if (error) return error;

  const maxLesson = await prisma.lesson.findFirst({
    where: { courseId: Number(courseId) },
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  const nextOrder = (maxLesson?.order ?? 0) + 1;

  if (type === 'video') {
    const { vimeoId, description } = body;
    if (!vimeoId)
      return NextResponse.json({ error: 'vimeoId required for video lessons' }, { status: 400 });

    const lesson = await prisma.lesson.create({
      data: {
        title,
        type: 'video',
        order: nextOrder,
        courseId: Number(courseId),
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

    // Parse scheduledAt — accept ISO string or null/undefined
    const scheduledDate: Date | null =
      scheduledAt && typeof scheduledAt === 'string' ? new Date(scheduledAt) : null;

    if (scheduledDate && isNaN(scheduledDate.getTime()))
      return NextResponse.json({ error: 'Invalid scheduledAt date' }, { status: 400 });

    const lesson = await prisma.lesson.create({
      data: {
        title,
        type: 'exam',
        order: nextOrder,
        courseId: Number(courseId),
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
// action: "updateVideo"              { id, title, vimeoId, description? }
// action: "updateExam"               { id, title, durationMinutes?, passingScore?, scheduledAt? }
// action: "toggleVisibility"         { id }
// action: "reorder"                  { id, direction:"up"|"down" }
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
    select: { courseId: true },
  });
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

  const { error } = await authorize(lesson.courseId);
  if (error) return error;

  // ── updateVideo ──────────────────────────────────────────────
  if (action === 'updateVideo') {
    const { title, vimeoId, description } = body;
    if (!title || !vimeoId)
      return NextResponse.json({ error: 'title and vimeoId required' }, { status: 400 });

    await prisma.lesson.update({ where: { id: Number(id) }, data: { title } });
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

  // ── updateExam ───────────────────────────────────────────────
  if (action === 'updateExam') {
    const { title, durationMinutes, passingScore, scheduledAt } = body;
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

    // Parse scheduledAt — null means "clear the schedule" (always available)
    let scheduledDate: Date | null = null;
    if (scheduledAt === null || scheduledAt === '') {
      scheduledDate = null; // explicitly cleared
    } else if (scheduledAt && typeof scheduledAt === 'string') {
      scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime()))
        return NextResponse.json({ error: 'Invalid scheduledAt date' }, { status: 400 });
    }

    await prisma.lesson.update({ where: { id: Number(id) }, data: { title } });
    await prisma.exam.updateMany({
      where: { lessonId: Number(id) },
      data: {
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        passingScore: passingScore ? Number(passingScore) : 50,
        // Only update scheduledAt when explicitly provided in the request body
        ...(Object.prototype.hasOwnProperty.call(body, 'scheduledAt') && {
          scheduledAt: scheduledDate,
        }),
      },
    });
    return NextResponse.json({ ok: true });
  }

  // ── toggleVisibility ─────────────────────────────────────────
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
  // ── reorder ──────────────────────────────────────────────────
  if (action === 'reorder') {
    const { direction } = body;
    const allLessons = await prisma.lesson.findMany({
      where: { courseId: lesson.courseId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        order: true,
        type: true,
        exam: { select: { scheduledAt: true } },
      },
    });

    // Scheduled exams are "independent" — they never gate or get gated by
    // other lessons — so they reorder only among themselves, never
    // swapping positions with a main-sequence lesson.
    const isScheduledExam = (l: (typeof allLessons)[number]) =>
      l.type === 'exam' && l.exam?.scheduledAt != null;

    const current = allLessons.find((l) => l.id === Number(id));
    if (!current) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

    const group = allLessons.filter((l) => isScheduledExam(l) === isScheduledExam(current));
    const idx = group.findIndex((l) => l.id === current.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= group.length) return NextResponse.json({ ok: true });

    const a = group[idx];
    const b = group[swapIdx];
    await prisma.$transaction([
      prisma.lesson.update({ where: { id: a.id }, data: { order: b.order } }),
      prisma.lesson.update({ where: { id: b.id }, data: { order: a.order } }),
    ]);
    return NextResponse.json({ ok: true });
  }
  // ── addExamQuestions ─────────────────────────────────────────
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

    // NOTE: this includes hidden (soft-removed) rows too, so re-adding a
    // question that was previously hidden is a no-op here rather than a
    // duplicate — see the "unhide" note below for how to surface that.
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

  // ── removeExamQuestion ───────────────────────────────────────
  // If students have already submitted answers for this question, deleting
  // the row outright would violate the FK on attempt_answers (and destroy
  // graded history). So: hard-delete only when it's safe, otherwise hide it.
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

  // ── reorderExamQuestion ──────────────────────────────────────
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

  // ── updateExamQuestionMark ───────────────────────────────────
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

  // Deletion itself is off-limits for assistants specifically. Teachers
  // deleting lessons on their own courses, and real admins deleting
  // anything, are both still allowed — `authorize` above already confirmed
  // the teacher owns this course, so we only need to additionally reject
  // the assistant role here.
  if (user!.role !== 'teacher' && !isAdmin(user!.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.lesson.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
