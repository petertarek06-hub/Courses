// src/app/admin/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, CreditCard, Loader2 } from 'lucide-react';
import { useAdminLang } from './Adminshell';

const content = {
  ar: {
    overview: 'نظرة عامة',
    totalStudents: 'إجمالي الطلاب',
    totalTeachers: 'إجمالي المدرسين',
    totalCourses: 'إجمالي الكورسات',
    totalRevenue: 'إجمالي الإيرادات',
    totalAssistants: 'إجمالي المساعدين',
    recentStudents: 'أحدث المستخدمين',
    name: 'الاسم',
    phone: 'الهاتف',
    grade: 'الصف',
    role: 'الدور',
    joinedAt: 'تاريخ التسجيل',
    noData: 'لا توجد بيانات',
    student: 'طالب',
    teacher: 'مدرس',
    admin: 'أدمن',
    loading: 'جارٍ التحميل...',
    errorLoading: 'فشل تحميل البيانات',
    egp: 'ج.م',
  },
  en: {
    overview: 'Overview',
    totalStudents: 'Total Students',
    totalTeachers: 'Total Teachers',
    totalCourses: 'Total Courses',
    totalRevenue: 'Total Revenue',
    totalAssistants: 'Total Assistants',
    recentStudents: 'Recent Users',
    name: 'Name',
    phone: 'Phone',
    grade: 'Grade',
    role: 'Role',
    joinedAt: 'Joined',
    noData: 'No data available',
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Admin',
    loading: 'Loading...',
    errorLoading: 'Failed to load data',
    egp: 'EGP',
  },
};

interface StatsData {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalAssistants: number;
  totalRevenue: number;
  recentStudents: {
    id: number;
    fullName: string;
    phone: string;
    academicYear: string | null;
    role: string;
    createdAt: string;
  }[];
}

export default function AdminPage() {
  const { lang, isRtl } = useAdminLang();
  const t = content[lang];
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch('/api/admin/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: t.totalStudents,
      value: data?.totalStudents ?? '—',
      icon: Users,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: t.totalTeachers,
      value: data?.totalTeachers ?? '—',
      icon: GraduationCap,
      color: 'bg-secondary/10 text-secondary',
    },
    {
      label: t.totalCourses,
      value: data?.totalCourses ?? '—',
      icon: BookOpen,
      color: 'bg-accent/10 text-accent',
    },
    {
      label: t.totalRevenue,
      value: data ? `${data.totalRevenue.toLocaleString()} ${t.egp}` : '—',
      icon: CreditCard,
      color: 'bg-green-500/10 text-green-600',
    },
    {
      label: t.totalAssistants,
      value: data?.totalAssistants ?? '—',
      icon: Users,
      color: 'bg-amber-500/20 text-amber-700',
    },
  ];

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      student: t.student,
      teacher: t.teacher,
      admin: t.admin,
    };
    return map[role] ?? role;
  };

  const roleBadgeColor = (role: string) => {
    if (role === 'admin') return 'bg-primary/20 text-primary';
    if (role === 'teacher') return 'bg-secondary/20 text-secondary';
    if (role === 'assistant') return 'bg-amber-500/20 text-amber-700';
    return 'bg-muted text-muted-foreground';
  };

  const columnHeaders = [t.name, t.phone, t.grade, t.role, t.joinedAt];

  return (
    <>
      {/* Page heading - أصغر على الموبايل */}
      <h1
        className="text-lg sm:text-2xl font-extrabold text-foreground mb-3 sm:mb-6"
        style={{ fontFamily: font }}
      >
        {t.overview}
      </h1>

      {/* Stats cards - مسافات أصغر وأيقونات أصغر على الموبايل */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2 mb-4 sm:mb-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl sm:rounded-2xl border border-border p-2 sm:p-5 flex items-center gap-1 sm:gap-4 card-shadow"
          >
            <div className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl shrink-0 ${stat.color}`}>
              <stat.icon size={14} className="sm:hidden" />
              <stat.icon size={22} className="hidden sm:block" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[8px] sm:text-xs text-muted-foreground font-medium leading-tight truncate"
                style={{ fontFamily: font }}
              >
                {stat.label}
              </p>
              {loading ? (
                <Loader2 size={12} className="animate-spin text-muted-foreground mt-0.5" />
              ) : (
                <p className="text-xs sm:text-2xl font-extrabold text-foreground truncate">
                  {stat.value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent users table */}
      <div className="bg-card rounded-xl sm:rounded-2xl border border-border card-shadow overflow-hidden">
        <div className="px-2 sm:px-6 py-2 sm:py-4 border-b border-border">
          <h2
            className="text-xs sm:text-base font-bold text-foreground"
            style={{ fontFamily: font }}
          >
            {t.recentStudents}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[10px] sm:text-sm border-collapse">
            <thead className="bg-muted">
              <tr>
                {columnHeaders.map((col, i, arr) => (
                  <th
                    key={col}
                    className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center border-b border-border text-[8px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap ${
                      i < arr.length - 1 ? (isRtl ? 'border-l' : 'border-r') : ''
                    }`}
                    style={{ fontFamily: font }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 sm:py-12 text-center">
                    <Loader2 size={20} className="animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 sm:py-10 text-center text-red-500 text-[10px] sm:text-sm"
                    style={{ fontFamily: font }}
                  >
                    {t.errorLoading}
                  </td>
                </tr>
              ) : data?.recentStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 sm:py-16 text-center text-muted-foreground text-xs sm:text-sm"
                    style={{ fontFamily: font }}
                  >
                    {t.noData}
                  </td>
                </tr>
              ) : (
                // ✅ المشكلة هنا - لازم تحط (u, idx) كـ parameters
                data?.recentStudents.map((u, idx) => (
                  <tr
                    key={u.id}
                    className={`${
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                    } hover:bg-muted/30 transition-colors`}
                  >
                    {/* Name - مع اختصار الأسماء الطويلة */}
                    <td
                      className="px-1 sm:px-4 py-1.5 sm:py-4 text-center align-middle border-b border-border font-semibold text-foreground whitespace-nowrap text-[10px] sm:text-sm"
                      style={{ fontFamily: font }}
                    >
                      {u.fullName.length > 12 ? `${u.fullName.slice(0, 10)}...` : u.fullName}
                    </td>

                    {/* Phone */}
                    <td
                      className="px-1 sm:px-4 py-1.5 sm:py-4 text-center align-middle border-b border-border text-muted-foreground text-[9px] sm:text-sm"
                      dir="ltr"
                    >
                      {u.phone}
                    </td>

                    {/* Grade */}
                    <td
                      className="px-1 sm:px-4 py-1.5 sm:py-4 text-center align-middle border-b border-border text-muted-foreground text-[9px] sm:text-sm"
                      style={{ fontFamily: font }}
                    >
                      {u.academicYear ?? '—'}
                    </td>

                    {/* Role */}
                    <td className="px-1 sm:px-4 py-1.5 sm:py-4 text-center align-middle border-b border-border">
                      <span
                        className={`inline-flex items-center justify-center px-1 py-0.5 rounded-full text-[7px] sm:text-xs font-bold ${roleBadgeColor(u.role)}`}
                        style={{ fontFamily: font }}
                      >
                        {roleLabel(u.role)}
                      </span>
                    </td>

                    {/* Joined At */}
                    <td
                      className="px-1 sm:px-4 py-1.5 sm:py-4 text-center align-middle border-b border-border text-muted-foreground text-[8px] sm:text-xs"
                      dir="ltr"
                    >
                      {new Date(u.createdAt).toLocaleDateString('en-EG')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
