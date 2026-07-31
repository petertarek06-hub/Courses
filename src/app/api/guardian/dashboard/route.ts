// src/app/api/guardian/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getAuthUser, isGuardian } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getAuthUser();
  if (!user || !isGuardian(user.role) || !user.studentId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const studentId = user.studentId;

  const profile = await prisma.user.findUnique({
    where: { id: studentId },
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
  });

  // Unlike the student route, we don't clear the auth cookie here if this
  // is missing — the guardian's OWN session is still valid (getAuthUser
  // already confirmed their Guardian row exists). It's the linked student
  // that's gone (e.g. admin deleted the account), so this is a data error,
  // not a session error.
  if (!profile) {
    return NextResponse.json({ error: 'Linked student not found' }, { status: 404 });
  }

  const [enrollments, examAttempts, transactions, pendingTopUps] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          include: {
            teacher: { select: { id: true, fullName: true, avatarUrl: true } },
            lessons: {
              where: { isVisible: true },
              select: { id: true, type: true, exam: { select: { scheduledAt: true } } },
            },
          },
        },
      },
    }),

    prisma.examAttempt.findMany({
      where: { studentId },
      orderBy: { startedAt: 'desc' },
      include: {
        exam: {
          include: { lesson: { include: { course: { select: { id: true, name: true } } } } },
        },
      },
    }),

    prisma.transaction.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        type: true,
        method: true,
        notes: true,
        createdAt: true,
        course: { select: { name: true } },
      },
    }),

    prisma.topUpRequest.findMany({
      where: { studentId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, amount: true, method: true, status: true, notes: true, createdAt: true },
    }),
  ]);

  const recentActivity = [
    ...transactions.map((t) => ({ kind: 'transaction' as const, status: 'completed', ...t })),
    ...pendingTopUps.map((r) => ({ kind: 'topup_request' as const, type: 'topup', ...r })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const lessonProgressCounts = await prisma.lessonProgress.groupBy({
    by: ['lessonId'],
    where: {
      studentId,
      completed: true,
      lessonId: { in: enrollments.flatMap((e) => e.course.lessons.map((l) => l.id)) },
    },
    _count: { lessonId: true },
  });

  const completedLessonIds = new Set(lessonProgressCounts.map((p) => p.lessonId));
  const now = new Date();

  const enrichedEnrollments = enrollments.map((e) => {
    const videoLessons = e.course.lessons.filter((l) => l.type === 'video');
    const totalLessons = videoLessons.length;
    const completedLessons = videoLessons.filter((l) => completedLessonIds.has(l.id)).length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const upcomingExam = e.course.lessons
      .filter((l) => l.type === 'exam' && l.exam?.scheduledAt && new Date(l.exam.scheduledAt) > now)
      .sort(
        (a, b) =>
          new Date(a.exam!.scheduledAt!).getTime() - new Date(b.exam!.scheduledAt!).getTime()
      )[0];

    return {
      id: e.id,
      enrolledAt: e.enrolledAt,
      progress,
      completedLessons,
      totalLessons,
      course: {
        id: e.course.id,
        name: e.course.name,
        subject: e.course.subject,
        academicYear: e.course.academicYear,
        teacher: e.course.teacher,
        upcomingExamAt: upcomingExam?.exam?.scheduledAt ?? null,
      },
    };
  });

  return NextResponse.json({
    profile,
    enrollments: enrichedEnrollments,
    examAttempts,
    transactions: recentActivity,
  });
}
