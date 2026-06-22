import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'teacher')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const courses = await prisma.course.findMany({
    where: { instructorId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { lessons: true, enrollments: true },
      },
    },
  });

  return NextResponse.json(courses);
}
