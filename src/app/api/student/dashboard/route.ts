// src/app/api/student/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getAuthUser, clearAuthCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.user.findUnique({
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
  });

  // The JWT is cryptographically valid but its subject no longer exists in
  // the database — most commonly because the account was deleted, or a dev
  // database was reset (e.g. `prisma db push --force-reset`) while someone
  // was still logged in. Without this check, `profile` would be `null` in
  // an otherwise 200 response, and the client would crash trying to read
  // fields off it. Treat it the same as "not logged in" and clear the
  // stale cookie so the browser doesn't keep sending it.
  if (!profile) {
    await clearAuthCookie();
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  const [enrollments, examAttempts, transactions, pendingTopUps] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: user.id },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          include: {
            teacher: { select: { id: true, fullName: true, avatarUrl: true } },
            lessons: {
              where: { isVisible: true },
              select: {
                id: true,
                type: true,
                exam: { select: { scheduledAt: true } },
              },
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
                course: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),

    // Completed ledger activity — no `status` field anymore, since a row
    // existing here already means the money moved. Fetch a few extra so
    // the merge with pending top-ups below still yields 10 after sorting.
    prisma.transaction.findMany({
      where: { studentId: user.id },
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

    // Top-up requests still awaiting admin review — these used to show up
    // as status: 'pending' rows in the old merged Transaction table.
    // TopUpRequest now owns that state, so pull them in separately and
    // merge below to avoid silently dropping "pending" from the dashboard.
    prisma.topUpRequest.findMany({
      where: { studentId: user.id, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        notes: true,
        createdAt: true,
      },
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
      studentId: user.id,
      completed: true,
      lessonId: {
        in: enrollments.flatMap((e) => e.course.lessons.map((l) => l.id)),
      },
    },
    _count: { lessonId: true },
  });

  const completedLessonIds = new Set(lessonProgressCounts.map((p) => p.lessonId));
  const now = new Date();

  const enrichedEnrollments = enrollments.map((e) => {
    const totalLessons = e.course.lessons.length;
    const completedLessons = e.course.lessons.filter((l) => completedLessonIds.has(l.id)).length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Earliest upcoming scheduled exam for this course, if any
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
