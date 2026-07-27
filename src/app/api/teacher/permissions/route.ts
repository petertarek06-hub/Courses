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

// ── GET ─────────────────────────────────────────────────────────
// A teacher's own permissions, used by the teacher dashboard to gate
// add/edit/reorder actions client-side. Falls back to defaults when no
// TeacherPermission row exists yet (e.g. teacher created before this
// feature shipped, or an admin has never touched their permissions).
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
