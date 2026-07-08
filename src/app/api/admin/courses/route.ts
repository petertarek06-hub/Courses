import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      teacher: {
        select: { id: true, fullName: true, phone: true },
      },
    },
  });

  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, subject, academicYear, price, teacherId } = body;

  if (!name || !subject || !academicYear || !teacherId)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  const teacher = await prisma.user.findFirst({
    where: { id: Number(teacherId), role: 'teacher' },
  });
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

  const course = await prisma.course.create({
    data: {
      name,
      description: description || null,
      subject,
      academicYear,
      price: Number(price) || 0,
      teacherId: Number(teacherId),
    },
    include: {
      teacher: { select: { id: true, fullName: true, phone: true } },
    },
  });

  return NextResponse.json({ success: true, course });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, action, ...fields } = body;

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  if (action === 'show') {
    await prisma.course.update({ where: { id }, data: { isVisible: true } });
    return NextResponse.json({ success: true });
  }

  if (action === 'hide') {
    await prisma.course.update({ where: { id }, data: { isVisible: false } });
    return NextResponse.json({ success: true });
  }

  if (action === 'update') {
    const { name, description, subject } = fields;
    await prisma.course.update({
      where: { id },
      data: {
        name,
        description: description || null,
        subject,
        academicYear: fields.academicYear,
        price: Number(fields.price) || 0,
        teacherId: Number(fields.teacherId),
      },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const courses = await prisma.course.findMany({
    where: { id },
    select: { id: true },
  });
  const courseIds = courses.map((c) => c.id);

  if (courseIds.length > 0) {
    await prisma.enrollment.deleteMany({ where: { courseId: { in: courseIds } } });
    await prisma.transaction.updateMany({
      where: { courseId: { in: courseIds } },
      data: { courseId: null },
    });

    const lessons = await prisma.lesson.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true },
    });
    const lessonIds = lessons.map((l) => l.id);

    if (lessonIds.length > 0) {
      await prisma.lessonProgress.deleteMany({ where: { lessonId: { in: lessonIds } } });

      const exams = await prisma.exam.findMany({
        where: { lessonId: { in: lessonIds } },
        select: { id: true },
      });
      const examIds = exams.map((e) => e.id);

      if (examIds.length > 0) {
        const attempts = await prisma.examAttempt.findMany({
          where: { examId: { in: examIds } },
          select: { id: true },
        });
        const attemptIds = attempts.map((a) => a.id);

        // ✅ Get examQuestion IDs to delete attemptAnswers
        const examQuestions = await prisma.examQuestion.findMany({
          where: { examId: { in: examIds } },
          select: { id: true },
        });
        const examQuestionIds = examQuestions.map((eq) => eq.id);

        // ✅ Delete in correct order (from leaf to root)
        if (attemptIds.length > 0) {
          await prisma.attemptAnswer.deleteMany({ where: { attemptId: { in: attemptIds } } });
        }

        // ✅ Delete attemptAnswers linked to examQuestions
        if (examQuestionIds.length > 0) {
          await prisma.attemptAnswer.deleteMany({
            where: { examQuestionId: { in: examQuestionIds } },
          });
        }

        await prisma.examAttempt.deleteMany({ where: { examId: { in: examIds } } });

        // ✅ Delete junction table (examQuestion)
        await prisma.examQuestion.deleteMany({ where: { examId: { in: examIds } } });

        await prisma.questionBank.deleteMany({ where: { courseId: { in: courseIds } } });
        await prisma.exam.deleteMany({ where: { lessonId: { in: lessonIds } } });
      }

      await prisma.video.deleteMany({ where: { lessonId: { in: lessonIds } } });
      await prisma.lesson.deleteMany({ where: { courseId: { in: courseIds } } });
    }

    await prisma.course.deleteMany({ where: { id: { in: courseIds } } });
  }

  return NextResponse.json({ success: true });
}
