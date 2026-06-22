import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const courseId = Number((await params).id);
  const { lessonId } = await req.json();
  if (!lessonId) return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 });

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId } },
  });
  if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });

  await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId: user.id, lessonId: Number(lessonId) } },
    update: { completed: true, completedAt: new Date() },
    create: {
      studentId: user.id,
      lessonId: Number(lessonId),
      completed: true,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
