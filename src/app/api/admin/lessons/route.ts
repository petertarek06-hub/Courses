import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

async function authorize(courseId?: number) {
  const user = await getAuthUser();
  if (!user)
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (user.role !== 'teacher' && user.role !== 'admin')
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };

  if (user.role === 'teacher' && courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course || course.instructorId !== user.id)
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
// Body for video: { courseId, title, type:"video", vimeoId, durationSec? }
// Body for exam:  { courseId, title, type:"exam", durationMinutes?, passingScore? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  // ✅ Fixed: was titleAr/titleEn → single title
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
    const { vimeoId, durationSec } = body;
    if (!vimeoId)
      return NextResponse.json({ error: 'vimeoId required for video lessons' }, { status: 400 });

    const lesson = await prisma.lesson.create({
      data: {
        title, // ✅ single field
        type: 'video',
        order: nextOrder,
        courseId: Number(courseId),
        video: {
          create: {
            vimeoId: String(vimeoId).trim(),
            durationSec: durationSec ? Number(durationSec) : null,
          },
        },
      },
      include: { video: true },
    });
    return NextResponse.json(lesson, { status: 201 });
  }

  if (type === 'exam') {
    const { durationMinutes, passingScore } = body;
    const lesson = await prisma.lesson.create({
      data: {
        title, // ✅ single field
        type: 'exam',
        order: nextOrder,
        courseId: Number(courseId),
        exam: {
          create: {
            durationMinutes: durationMinutes ? Number(durationMinutes) : null,
            passingScore: passingScore ? Number(passingScore) : 50,
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
// action: "updateVideo"        { id, title, vimeoId, durationSec? }
// action: "updateExam"         { id, title, durationMinutes?, passingScore? }
// action: "toggleVisibility"   { id }
// action: "reorder"            { id, direction:"up"|"down" }
// action: "addExamQuestions"   { id(lessonId), questionIds:[...] }
// action: "removeExamQuestion" { id(lessonId), examQuestionId }
// action: "reorderExamQuestion"{ id(lessonId), examQuestionId, direction }
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
    // ✅ Fixed: was titleAr/titleEn → title
    const { title, vimeoId, durationSec } = body;
    if (!title || !vimeoId)
      return NextResponse.json({ error: 'title and vimeoId required' }, { status: 400 });

    await prisma.lesson.update({ where: { id: Number(id) }, data: { title } });
    await prisma.video.upsert({
      where: { lessonId: Number(id) },
      create: {
        lessonId: Number(id),
        vimeoId: String(vimeoId).trim(),
        durationSec: durationSec ? Number(durationSec) : null,
      },
      update: {
        vimeoId: String(vimeoId).trim(),
        durationSec: durationSec ? Number(durationSec) : null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  // ── updateExam ───────────────────────────────────────────────
  if (action === 'updateExam') {
    // ✅ Fixed: was titleAr/titleEn → title
    const { title, durationMinutes, passingScore } = body;
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

    await prisma.lesson.update({ where: { id: Number(id) }, data: { title } });
    await prisma.exam.updateMany({
      where: { lessonId: Number(id) },
      data: {
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        passingScore: passingScore ? Number(passingScore) : 50,
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
      select: { id: true, order: true },
    });
    const idx = allLessons.findIndex((l) => l.id === Number(id));
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= allLessons.length) return NextResponse.json({ ok: true });

    const a = allLessons[idx];
    const b = allLessons[swapIdx];
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

    const existing = await prisma.examQuestion.findMany({
      where: { examId: exam.id },
      select: { questionId: true },
    });
    const existingIds = new Set(existing.map((e) => e.questionId));
    const toAdd = questionIds.filter((qId) => !existingIds.has(qId));

    await prisma.examQuestion.createMany({
      data: toAdd.map((qId) => ({ examId: exam.id, questionId: qId, order: nextOrder++ })),
    });
    return NextResponse.json({ ok: true, added: toAdd.length });
  }

  // ── removeExamQuestion ───────────────────────────────────────
  if (action === 'removeExamQuestion') {
    const { examQuestionId } = body;
    await prisma.examQuestion.delete({ where: { id: Number(examQuestionId) } });
    return NextResponse.json({ ok: true });
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

  const { error } = await authorize(lesson.courseId);
  if (error) return error;

  await prisma.lesson.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
