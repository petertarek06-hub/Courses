import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// How many teachers to show on the homepage.
const TARGET_COUNT = 6;

export async function GET() {
  const teachers = await prisma.user.findMany({
    where: { role: 'teacher', isActive: true },
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      whatsappNumber: true,
      courses: {
        where: { isVisible: true },
        select: {
          subject: true,
          academicYear: true,
          _count: { select: { enrollments: true } },
        },
      },
    },
  });

  type Aggregated = {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    whatsappNumber: string | null;
    totalStudents: number;
    totalCourses: number;
    bestCourse: { subject: string; academicYear: string; students: number };
  };

  // Collapse each teacher's courses into totals, and note their single
  // highest-enrollment course (used to represent "subject" + "grade" on the card).
  const aggregated: Aggregated[] = teachers
    .filter((t) => t.courses.length > 0)
    .map((t) => {
      let totalStudents = 0;
      const totalCourses = t.courses.length;
      let bestCourse = { subject: '', academicYear: '', students: -1 };

      for (const c of t.courses) {
        totalStudents += c._count.enrollments;
        if (c._count.enrollments > bestCourse.students) {
          bestCourse = {
            subject: c.subject,
            academicYear: c.academicYear,
            students: c._count.enrollments,
          };
        }
      }

      return {
        id: t.id,
        fullName: t.fullName,
        avatarUrl: t.avatarUrl,
        whatsappNumber: t.whatsappNumber,
        totalStudents,
        totalCourses,
        bestCourse,
      };
    });

  // Step 1: one representative per academic year/grade — the teacher with
  // the most enrolled students in a course for that grade.
  const byGrade = new Map<string, Aggregated>();
  for (const t of aggregated) {
    const grade = t.bestCourse.academicYear;
    const existing = byGrade.get(grade);
    if (!existing || t.bestCourse.students > existing.bestCourse.students) {
      byGrade.set(grade, t);
    }
  }

  const selected = new Map<number, Aggregated>();
  for (const t of byGrade.values()) selected.set(t.id, t);

  // Step 2: fill remaining slots with other teachers, ranked by total students.
  if (selected.size < TARGET_COUNT) {
    const remaining = aggregated
      .filter((t) => !selected.has(t.id))
      .sort((a, b) => b.totalStudents - a.totalStudents);

    for (const t of remaining) {
      if (selected.size >= TARGET_COUNT) break;
      selected.set(t.id, t);
    }
  }

  const result = Array.from(selected.values())
    .sort((a, b) => b.totalStudents - a.totalStudents)
    .slice(0, TARGET_COUNT)
    .map((t) => ({
      id: t.id,
      fullName: t.fullName,
      avatarUrl: t.avatarUrl,
      whatsappNumber: t.whatsappNumber,
      subject: t.bestCourse.subject,
      academicYear: t.bestCourse.academicYear,
      courses: t.totalCourses,
      students: t.totalStudents,
    }));

  return NextResponse.json(result);
}
