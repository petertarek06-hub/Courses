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

  const getBorderDirection = (isLastColumn: boolean = false) => {
    if (isLastColumn) return '';
    return isRtl ? 'border-l border-border' : 'border-r border-border';
  };

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
    if (role === 'admin') return 'bg-primary/10 text-primary';
    if (role === 'teacher') return 'bg-secondary/10 text-secondary';
    return 'bg-muted text-muted-foreground';
  };

  const columnHeaders = [t.name, t.phone, t.grade, t.role, t.joinedAt];

  return (
    <>
      {/* Page heading — smaller on mobile */}
      <h1
        className="text-xl sm:text-2xl font-extrabold text-foreground mb-4 sm:mb-6"
        style={{ fontFamily: font }}
      >
        {t.overview}
      </h1>

      {/* Stats cards — tighter gap/padding/icon on mobile */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 mb-5 sm:mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-2xl border border-border p-3 sm:p-5 flex items-center gap-2 sm:gap-4 card-shadow"
          >
            <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${stat.color}`}>
              <stat.icon size={18} className="sm:hidden" />
              <stat.icon size={22} className="hidden sm:block" />
            </div>
            <div className="min-w-0">
              <p
                className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-tight"
                style={{ fontFamily: font }}
              >
                {stat.label}
              </p>
              {loading ? (
                <Loader2 size={16} className="animate-spin text-muted-foreground mt-1" />
              ) : (
                <p className="text-lg sm:text-2xl font-extrabold text-foreground truncate">
                  {stat.value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent users table */}
      <div className="bg-card rounded-2xl border border-border card-shadow overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
          <h2
            className="text-sm sm:text-base font-bold text-foreground"
            style={{ fontFamily: font }}
          >
            {t.recentStudents}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead className="bg-muted">
              <tr>
                {columnHeaders.map((col, i, arr) => (
                  <th
                    key={col}
                    className={`px-2 sm:px-4 py-2 sm:py-3 text-center border-b border-border text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${
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
                  <td colSpan={5} className="py-10 sm:py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 sm:py-10 text-center text-red-500 text-xs sm:text-sm"
                    style={{ fontFamily: font }}
                  >
                    {t.errorLoading}
                  </td>
                </tr>
              ) : data?.recentStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 sm:py-16 text-center text-muted-foreground"
                    style={{ fontFamily: font }}
                  >
                    {t.noData}
                  </td>
                </tr>
              ) : (
                data?.recentStudents.map((u, idx) => (
                  <tr
                    key={u.id}
                    className={`${
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                    } hover:bg-muted/30 transition-colors`}
                  >
                    {/* Name */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-4 text-center align-middle border-b border-border ${getBorderDirection(false)} font-semibold text-foreground whitespace-nowrap`}
                      style={{ fontFamily: font }}
                    >
                      {u.fullName}
                    </td>

                    {/* Phone */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-4 text-center align-middle border-b border-border ${getBorderDirection(false)} text-muted-foreground`}
                      dir="ltr"
                    >
                      {u.phone}
                    </td>

                    {/* Grade */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-4 text-center align-middle border-b border-border ${getBorderDirection(false)} text-muted-foreground`}
                      style={{ fontFamily: font }}
                    >
                      {u.academicYear ?? '—'}
                    </td>

                    {/* Role */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-4 text-center align-middle border-b border-border ${getBorderDirection(false)}`}
                    >
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${roleBadgeColor(u.role)}`}
                        style={{ fontFamily: font }}
                      >
                        {roleLabel(u.role)}
                      </span>
                    </td>

                    {/* Joined At */}
                    <td
                      className="px-2 sm:px-4 py-2 sm:py-4 text-center align-middle border-b border-border text-muted-foreground text-[10px] sm:text-xs"
                      dir="ltr"
                    >
                      z{new Date(u.createdAt).toLocaleDateString('en-EG')}
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
