// src/app/api/teacher/permissions/route.ts
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_PERMISSIONS = {
  canAddVideo: true,
  canAddExam: true,
  canEditContent: true,
  canViewStudents: false,
  canReorder: true,
};

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'teacher')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const row = await prisma.teacherPermission.findUnique({
    where: { teacherId: user.id },
    select: {
      canAddVideo: true,
      canAddExam: true,
      canEditContent: true,
      canViewStudents: true,
      canReorder: true,
    },
  });

  return NextResponse.json(row ?? DEFAULT_PERMISSIONS);
}
