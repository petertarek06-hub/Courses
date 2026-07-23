// src/app/api/admin/teacher/courses/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'teacher' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Admin sees all courses; teacher sees only their own
  const where = user.role === 'admin' ? {} : { teacherId: user.id };

  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { lessons: true, enrollments: true } },
    },
  });

  return NextResponse.json(courses);
}
