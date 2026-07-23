// src/app/admin/courses/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  X,
  BookOpen,
  ListVideo,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminLang } from '../Adminshell';

// ── Types ──────────────────────────────────────────────────────
interface Teacher {
  id: number;
  fullName: string;
  phone: string;
}
interface Course {
  id: number;
  name: string;
  description: string | null;
  subject: string;
  academicYear: string;
  price: number;
  isVisible: boolean;
  createdAt: string;
  teacher: Teacher;
}
type CourseForm = {
  name: string;
  description: string;
  subject: string;
  academicYear: string;
  price: string;
  teacherId: string;
};
const emptyForm: CourseForm = {
  name: '',
  description: '',
  subject: '',
  academicYear: '',
  price: '0',
  teacherId: '',
};

// ── Academic years ─────────────────────────────────────────────
const academicYears = {
  ar: [
    {
      group: 'المرحلة الابتدائية',
      options: [
        { value: 'grade-1', label: 'الصف الأول الابتدائي' },
        { value: 'grade-2', label: 'الصف الثاني الابتدائي' },
        { value: 'grade-3', label: 'الصف الثالث الابتدائي' },
        { value: 'grade-4', label: 'الصف الرابع الابتدائي' },
        { value: 'grade-5', label: 'الصف الخامس الابتدائي' },
        { value: 'grade-6', label: 'الصف السادس الابتدائي' },
      ],
    },
    {
      group: 'المرحلة الإعدادية',
      options: [
        { value: 'grade-7', label: 'الصف الأول الإعدادي' },
        { value: 'grade-8', label: 'الصف الثاني الإعدادي' },
        { value: 'grade-9', label: 'الصف الثالث الإعدادي' },
      ],
    },
    {
      group: 'المرحلة الثانوية',
      options: [
        { value: 'grade-10', label: 'الصف الأول الثانوي' },
        { value: 'grade-11', label: 'الصف الثاني الثانوي' },
        { value: 'grade-12', label: 'الصف الثالث الثانوي' },
      ],
    },
  ],
  en: [
    {
      group: 'Primary',
      options: [
        { value: 'grade-1', label: 'Grade 1' },
        { value: 'grade-2', label: 'Grade 2' },
        { value: 'grade-3', label: 'Grade 3' },
        { value: 'grade-4', label: 'Grade 4' },
        { value: 'grade-5', label: 'Grade 5' },
        { value: 'grade-6', label: 'Grade 6' },
      ],
    },
    {
      group: 'Middle School',
      options: [
        { value: 'grade-7', label: 'Grade 7' },
        { value: 'grade-8', label: 'Grade 8' },
        { value: 'grade-9', label: 'Grade 9' },
      ],
    },
    {
      group: 'High School',
      options: [
        { value: 'grade-10', label: 'Grade 10' },
        { value: 'grade-11', label: 'Grade 11' },
        { value: 'grade-12', label: 'Grade 12' },
      ],
    },
  ],
};

const gradeLabelMap: Record<string, { ar: string; en: string }> = {
  'grade-1': { ar: 'الصف الأول الابتدائي', en: 'Grade 1' },
  'grade-2': { ar: 'الصف الثاني الابتدائي', en: 'Grade 2' },
  'grade-3': { ar: 'الصف الثالث الابتدائي', en: 'Grade 3' },
  'grade-4': { ar: 'الصف الرابع الابتدائي', en: 'Grade 4' },
  'grade-5': { ar: 'الصف الخامس الابتدائي', en: 'Grade 5' },
  'grade-6': { ar: 'الصف السادس الابتدائي', en: 'Grade 6' },
  'grade-7': { ar: 'الصف الأول الإعدادي', en: 'Grade 7' },
  'grade-8': { ar: 'الصف الثاني الإعدادي', en: 'Grade 8' },
  'grade-9': { ar: 'الصف الثالث الإعدادي', en: 'Grade 9' },
  'grade-10': { ar: 'الصف الأول الثانوي', en: 'Grade 10' },
  'grade-11': { ar: 'الصف الثاني الثانوي', en: 'Grade 11' },
  'grade-12': { ar: 'الصف الثالث الثانوي', en: 'Grade 12' },
};

// ── Translations ───────────────────────────────────────────────
const content = {
  ar: {
    title: 'الكورسات',
    search: 'بحث باسم الكورس أو المادة...',
    addCourse: 'إضافة كورس',

    name: 'اسم الكورس',
    subject: 'المادة',
    teacher: 'المدرس',
    grade: 'الصف',
    price: 'السعر',
    status: 'الحالة',
    actions: 'إجراءات',
    visible: 'مرئي',
    hidden: 'مخفي',
    show: 'إظهار',
    hide: 'إخفاء',
    delete: 'حذف',
    edit: 'تعديل',
    manageContent: 'إدارة المحتوى',
    noData: 'لا توجد كورسات',
    errorLoading: 'فشل تحميل البيانات',
    egp: 'ج.م',
    free: 'مجاني',
    addTitle: 'إضافة كورس جديد',
    editTitle: 'تعديل الكورس',
    nameLabel: 'اسم الكورس',
    descLabel: 'الوصف (اختياري)',
    subjectLabel: 'المادة',
    academicYear: 'الصف الدراسي',
    selectYear: 'اختر الصف',
    priceLabel: 'السعر (ج.م)',
    selectTeacher: 'اختر المدرس',
    teacherLabel: 'المدرس',
    save: 'حفظ',
    cancel: 'إلغاء',
    addedSuccess: 'تمت إضافة الكورس بنجاح',
    updatedSuccess: 'تم تحديث الكورس بنجاح',
    deletedSuccess: 'تم حذف الكورس بنجاح',
    shownSuccess: 'تم إظهار الكورس',
    hiddenSuccess: 'تم إخفاء الكورس',
    confirmDelete: 'هل أنت متأكد من حذف كورس',
    confirmDeleteBtn: 'حذف نهائيًا',
    missingFields: 'يرجى تعبئة جميع الحقول المطلوبة',
    noTeachers: 'لا يوجد مدرسون — أضف مدرسًا أولاً',
    manageExams: 'الامتحانات والتصحيح',
  },
  en: {
    title: 'Courses',
    search: 'Search by course name or subject...',
    addCourse: 'Add Course',
    name: 'Course Name',
    subject: 'Subject',
    teacher: 'Teacher',
    grade: 'Grade',
    price: 'Price',
    status: 'Status',
    actions: 'Actions',
    visible: 'Visible',
    hidden: 'Hidden',
    show: 'Show',
    hide: 'Hide',
    delete: 'Delete',
    edit: 'Edit',
    manageContent: 'Manage Content',
    noData: 'No courses found',
    errorLoading: 'Failed to load data',
    egp: 'EGP',
    free: 'Free',
    addTitle: 'Add New Course',
    editTitle: 'Edit Course',
    nameLabel: 'Course Name',
    descLabel: 'Description (Optional)',
    subjectLabel: 'Subject',
    academicYear: 'Academic Year',
    selectYear: 'Select grade',
    priceLabel: 'Price (EGP)',
    selectTeacher: 'Select Teacher',
    teacherLabel: 'Teacher',
    save: 'Save',
    cancel: 'Cancel',
    addedSuccess: 'Course added successfully',
    updatedSuccess: 'Course updated successfully',
    deletedSuccess: 'Course deleted successfully',
    shownSuccess: 'Course is now visible',
    hiddenSuccess: 'Course is now hidden',
    confirmDelete: 'Are you sure you want to delete',
    confirmDeleteBtn: 'Delete Permanently',
    missingFields: 'Please fill all required fields',
    noTeachers: 'No teachers found — add a teacher first',
    manageExams: 'Exams & Grading',
  },
};

// ── Main Component ─────────────────────────────────────────────
export default function AdminCoursesPage() {
  const { lang, isRtl, canDelete } = useAdminLang();
  const router = useRouter();
  const t = content[lang];
  const font = isRtl ? 'var(--font-cairo)' : undefined;
  const years = academicYears[lang];

  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const getBorderDirection = (isLastColumn = false) => {
    if (isLastColumn) return '';
    return isRtl ? 'border-l border-border' : 'border-r border-border';
  };

  const fetchCourses = () => {
    setLoading(true);
    setError(false);
    fetch('/api/admin/courses')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setCourses)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };
  const fetchTeachers = () => {
    fetch('/api/admin/teachers')
      .then((r) => (r.ok ? r.json() : []))
      .then(setTeachers)
      .catch(() => {});
  };

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setEditCourse(null);
    setForm(emptyForm);
    setShowModal(true);
  };
  const openEdit = (course: Course) => {
    setEditCourse(course);
    setForm({
      name: course.name,
      description: course.description || '',
      subject: course.subject,
      academicYear: course.academicYear,
      price: String(course.price),
      teacherId: String(course.teacher.id),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.academicYear || !form.teacherId) {
      toast.error(t.missingFields);
      return;
    }
    setSaving(true);
    if (editCourse) {
      const res = await fetch('/api/admin/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editCourse.id, action: 'update', ...form }),
      });
      if (res.ok) {
        toast.success(t.updatedSuccess);
        setShowModal(false);
        fetchCourses();
      }
    } else {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(t.addedSuccess);
        setShowModal(false);
        fetchCourses();
      }
    }
    setSaving(false);
  };

  const handleToggleVisibility = async (course: Course) => {
    const action = course.isVisible ? 'hide' : 'show';
    const res = await fetch('/api/admin/courses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: course.id, action }),
    });
    if (res.ok) {
      toast.success(action === 'hide' ? t.hiddenSuccess : t.shownSuccess);
      fetchCourses();
    }
  };

  const handleDelete = async () => {
    if (!deleteCourse) return;
    setDeleteLoading(true);
    const res = await fetch('/api/admin/courses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteCourse.id }),
    });
    if (res.ok) {
      toast.success(t.deletedSuccess);
      setDeleteCourse(null);
      fetchCourses();
    }
    setDeleteLoading(false);
  };

  const f = (key: keyof CourseForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const gradeLabel = (key: string) =>
    gradeLabelMap[key] ? (isRtl ? gradeLabelMap[key].ar : gradeLabelMap[key].en) : key;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3 flex-wrap">
        <h1
          className="text-xl sm:text-2xl font-extrabold text-foreground"
          style={{ fontFamily: font }}
        >
          {t.title}
        </h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
          style={{ fontFamily: font }}
        >
          <Plus size={14} className="sm:hidden" />
          <Plus size={16} className="hidden sm:block" />
          {t.addCourse}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3 sm:mb-4">
        <Search
          size={14}
          className="absolute top-1/2 -translate-y-1/2 text-muted-foreground sm:hidden"
          style={{ [isRtl ? 'right' : 'left']: '12px' }}
        />
        <Search
          size={16}
          className="absolute top-1/2 -translate-y-1/2 text-muted-foreground hidden sm:block"
          style={{ [isRtl ? 'right' : 'left']: '14px' }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.search}
          className="w-full max-w-sm py-2 sm:py-2.5 rounded-xl border border-border bg-card text-xs sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          style={{
            fontFamily: font,
            [isRtl ? 'paddingRight' : 'paddingLeft']: '36px',
            [isRtl ? 'paddingLeft' : 'paddingRight']: '14px',
          }}
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead className="bg-muted">
              <tr>
                {[t.name, t.subject, t.teacher, t.grade, t.price, t.status, t.actions].map(
                  (col, i, arr) => (
                    <th
                      key={col}
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center border-b border-border text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < arr.length - 1 ? (isRtl ? 'border-l' : 'border-r') : ''}`}
                      style={{ fontFamily: font }}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 sm:py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 sm:py-10 text-center text-red-500 text-xs sm:text-sm"
                    style={{ fontFamily: font }}
                  >
                    {t.errorLoading}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 sm:py-16 text-center"
                    style={{ fontFamily: font }}
                  >
                    <BookOpen size={36} className="mx-auto text-muted-foreground/30 mb-2 sm:mb-3" />
                    <p className="text-muted-foreground text-xs sm:text-sm">{t.noData}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((course) => (
                  <tr
                    key={course.id}
                    className="odd:bg-background even:bg-muted/10 hover:bg-muted/30 transition-colors"
                  >
                    {/* Name */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()}`}
                      style={{ fontFamily: font }}
                    >
                      <p className="font-semibold text-foreground">{course.name}</p>
                    </td>
                    {/* Subject */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()}`}
                      style={{ fontFamily: font }}
                    >
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-primary/10 text-primary">
                        {course.subject}
                      </span>
                    </td>
                    {/* Teacher */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground`}
                      style={{ fontFamily: font }}
                    >
                      {course.teacher.fullName}
                    </td>
                    {/* Grade */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap`}
                      style={{ fontFamily: font }}
                    >
                      {gradeLabel(course.academicYear)}
                    </td>
                    {/* Price */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} font-semibold text-foreground`}
                      dir="ltr"
                    >
                      {course.price === 0 ? (
                        <span className="text-green-600 font-bold" style={{ fontFamily: font }}>
                          {t.free}
                        </span>
                      ) : (
                        `${course.price} ${t.egp}`
                      )}
                    </td>
                    {/* Status */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()}`}
                    >
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${course.isVisible ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}
                        style={{ fontFamily: font }}
                      >
                        {course.isVisible ? (
                          <>
                            <Eye size={10} />
                            {t.visible}
                          </>
                        ) : (
                          <>
                            <EyeOff size={10} />
                            {t.hidden}
                          </>
                        )}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border">
                      <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                        <button
                          onClick={() => router.push(`/admin/courses/${course.id}/lessons`)}
                          title={t.manageContent}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/10 hover:text-secondary transition-colors"
                        >
                          <ListVideo size={13} className="sm:hidden" />
                          <ListVideo size={15} className="hidden sm:block" />
                        </button>
                        <button
                          onClick={() => openEdit(course)}
                          title={t.edit}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Pencil size={13} className="sm:hidden" />
                          <Pencil size={15} className="hidden sm:block" />
                        </button>
                        <button
                          onClick={() => handleToggleVisibility(course)}
                          title={course.isVisible ? t.hide : t.show}
                          className={`p-1.5 rounded-lg transition-colors ${course.isVisible ? 'text-muted-foreground hover:bg-orange-50 hover:text-orange-500' : 'text-muted-foreground hover:bg-green-50 hover:text-green-500'}`}
                        >
                          {course.isVisible ? (
                            <>
                              <EyeOff size={13} className="sm:hidden" />
                              <EyeOff size={15} className="hidden sm:block" />
                            </>
                          ) : (
                            <>
                              <Eye size={13} className="sm:hidden" />
                              <Eye size={15} className="hidden sm:block" />
                            </>
                          )}
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteCourse(course)}
                            title={t.delete}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} className="sm:hidden" />
                            <Trash2 size={15} className="hidden sm:block" />
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/admin/courses/${course.id}/exams`)}
                          title={t.manageExams}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-colors"
                        >
                          <ClipboardList size={13} className="sm:hidden" />
                          <ClipboardList size={15} className="hidden sm:block" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          title={editCourse ? t.editTitle : t.addTitle}
          font={font}
          isRtl={isRtl}
        >
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <Field label={t.nameLabel} font={font}>
              <input
                value={form.name}
                onChange={(e) => f('name', e.target.value)}
                className="input-field"
                style={{ fontFamily: font }}
              />
            </Field>
            <Field label={t.subjectLabel} font={font}>
              <input
                value={form.subject}
                onChange={(e) => f('subject', e.target.value)}
                className="input-field"
                style={{ fontFamily: font }}
              />
            </Field>
            <Field label={t.academicYear} font={font}>
              <select
                value={form.academicYear}
                onChange={(e) => f('academicYear', e.target.value)}
                className="input-field"
                style={{ fontFamily: 'var(--font-cairo)' }}
              >
                <option value="">{t.selectYear}</option>
                {years.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label={t.teacherLabel} font={font}>
              <select
                value={form.teacherId}
                onChange={(e) => f('teacherId', e.target.value)}
                className="input-field"
                style={{ fontFamily: font }}
              >
                <option value="">{t.selectTeacher}</option>
                {teachers.length === 0 ? (
                  <option disabled>{t.noTeachers}</option>
                ) : (
                  teachers.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.fullName}
                    </option>
                  ))
                )}
              </select>
            </Field>
            <Field label={t.priceLabel} font={font}>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => f('price', e.target.value)}
                className="input-field"
                dir="ltr"
              />
            </Field>
            <Field label={t.descLabel} font={font}>
              <textarea
                value={form.description}
                onChange={(e) => f('description', e.target.value)}
                rows={2}
                className="input-field resize-none"
                style={{ fontFamily: font }}
              />
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-border">
            <button
              onClick={() => setShowModal(false)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteCourse && (
        <Modal onClose={() => setDeleteCourse(null)} title={t.delete} font={font} isRtl={isRtl}>
          <p
            className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 leading-relaxed"
            style={{ fontFamily: font }}
          >
            {t.confirmDelete} <span className="font-bold text-foreground">{deleteCourse.name}</span>
            ؟
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteCourse(null)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : t.confirmDeleteBtn}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Modal ──────────────────────────────────────────────────────
function Modal({
  children,
  onClose,
  title,
  font,
  isRtl,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  font: string | undefined;
  isRtl: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-2xl border border-border card-shadow w-full max-w-lg relative flex flex-col max-h-[90vh]">
        {/* Sticky header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-border shrink-0">
          <h2
            className="text-sm sm:text-base font-bold text-foreground"
            style={{ fontFamily: font }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={16} className="sm:hidden" />
            <X size={18} className="hidden sm:block" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 flex-1">{children}</div>
      </div>
    </div>
  );
}

// ── Field ──────────────────────────────────────────────────────
function Field({
  label,
  font,
  children,
}: {
  label: string;
  font: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:gap-1.5">
      <label
        className="text-xs sm:text-sm font-semibold text-foreground"
        style={{ fontFamily: font }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
