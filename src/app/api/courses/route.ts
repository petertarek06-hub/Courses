// src/app/api/courses/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthUser().catch(() => null);

  const courses = await prisma.course.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true, // ✅ was: nameAr, nameEn
      description: true, // ✅ was: descriptionAr, descriptionEn
      subject: true, // ✅ was: subjectAr, subjectEn
      academicYear: true,
      price: true,
      instructor: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          whatsappNumber: true,
        },
      },
      _count: {
        select: {
          lessons: true,
          enrollments: true,
        },
      },
      enrollments: user ? { where: { studentId: user.id }, select: { id: true } } : false,
    },
  });

  const payload = courses.map((course) => ({
    ...course,
    isEnrolled: Array.isArray(course.enrollments) && course.enrollments.length > 0,
    enrollments: undefined,
  }));

  return NextResponse.json(payload);
}
