import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [studentsCount, coursesCount, teachersCount, lessonsCount] = await Promise.all([
    prisma.user.count({ where: { role: 'student', isActive: true } }),
    prisma.course.count({ where: { isVisible: true } }),
    prisma.user.count({ where: { role: 'teacher', isActive: true } }),
    prisma.lesson.count({ where: { isVisible: true, course: { isVisible: true } } }),
  ]);

  return NextResponse.json({ studentsCount, coursesCount, teachersCount, lessonsCount });
}
