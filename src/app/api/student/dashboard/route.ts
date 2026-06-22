import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [profile, enrollments, examAttempts, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        avatarUrl: true,
        academicYear: true,
        balance: true,
        createdAt: true,
      },
    }),

    prisma.enrollment.findMany({
      where: { studentId: user.id },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, fullName: true, avatarUrl: true } },
            lessons: {
              where: { isVisible: true },
              select: { id: true },
            },
          },
        },
      },
    }),

    prisma.examAttempt.findMany({
      where: { studentId: user.id },
      orderBy: { startedAt: 'desc' },
      include: {
        exam: {
          include: {
            lesson: {
              include: {
                // ✅ Fixed: was nameAr/nameEn → name
                course: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),

    prisma.transaction.findMany({
      where: { studentId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        type: true,
        method: true,
        status: true,
        notes: true,
        createdAt: true,
        // ✅ Fixed: was nameAr/nameEn → name
        course: { select: { name: true } },
      },
    }),
  ]);

  const lessonProgressCounts = await prisma.lessonProgress.groupBy({
    by: ['lessonId'],
    where: {
      studentId: user.id,
      completed: true,
      lessonId: {
        in: enrollments.flatMap((e) => e.course.lessons.map((l) => l.id)),
      },
    },
    _count: { lessonId: true },
  });

  const completedLessonIds = new Set(lessonProgressCounts.map((p) => p.lessonId));

  const enrichedEnrollments = enrollments.map((e) => {
    const totalLessons = e.course.lessons.length;
    const completedLessons = e.course.lessons.filter((l) => completedLessonIds.has(l.id)).length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return {
      id: e.id,
      enrolledAt: e.enrolledAt,
      progress,
      completedLessons,
      totalLessons,
      course: {
        id: e.course.id,
        // ✅ Fixed: was nameAr/nameEn/subjectAr/subjectEn → name/subject
        name: e.course.name,
        subject: e.course.subject,
        academicYear: e.course.academicYear,
        instructor: e.course.instructor,
      },
    };
  });

  return NextResponse.json({
    profile,
    enrollments: enrichedEnrollments,
    examAttempts,
    transactions,
  });
}
