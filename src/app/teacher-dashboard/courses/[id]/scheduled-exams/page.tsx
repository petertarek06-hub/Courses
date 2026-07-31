// src/app/teacher-dashboard/courses/[id]/scheduled-exams/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/uselang';
import {
  Plus,
  Loader2,
  X,
  Pencil,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface ScheduledExam {
  id: number;
  title: string;
  durationMinutes: number | null;
  passingScore: number;
  scheduledAt: string;
  isVisible: boolean;
  createdAt: string;
  course: {
    id: number;
    name: string;
    subject: string;
    academicYear: string;
  };
  examQuestions: Array<{
    id: number;
    order: number;
    mark: number;
  }>;
  attempts: Array<{
    id: number;
    student: { id: number; fullName: string; phone: string };
  }>;
}

const content = {
  ar: {
    back: 'العودة للوحة المدرس',
    title: 'الامتحانات المجدولة',
    addExam: 'إضافة امتحان مجدول',
    noExams: 'لا توجد امتحانات مجدولة لهذا الكورس',
    examTitle: 'عنوان الامتحان',
    scheduledDate: 'موعد الامتحان',
    duration: 'المدة (دقيقة)',
    passingScore: 'درجة النجاح (%)',
    status: 'الحالة',
    visible: 'مرئي',
    hidden: 'مخفي',
    questions: 'عدد الأسئلة',
    attempts: 'محاولات',
    actions: 'إجراءات',
    edit: 'تعديل',
    delete: 'حذف',
    confirmDelete: 'هل أنت متأكد من حذف هذا الامتحان؟',
    save: 'حفظ',
    cancel: 'إلغاء',
    loading: 'جارٍ التحميل...',
    error: 'حدث خطأ',
    examCreated: 'تم إنشاء الامتحان بنجاح',
    examUpdated: 'تم تحديث الامتحان بنجاح',
    examDeleted: 'تم حذف الامتحان بنجاح',
    minutes: 'دقيقة',
    questionsCount: 'سؤال',
    attemptsCount: 'محاولة',
  },
  en: {
    back: 'Back to Dashboard',
    title: 'Scheduled Exams',
    addExam: 'Add Scheduled Exam',
    noExams: 'No scheduled exams for this course',
    examTitle: 'Exam Title',
    scheduledDate: 'Scheduled Date',
    duration: 'Duration (minutes)',
    passingScore: 'Passing Score (%)',
    status: 'Status',
    visible: 'Visible',
    hidden: 'Hidden',
    questions: 'Questions',
    attempts: 'Attempts',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this exam?',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'An error occurred',
    examCreated: 'Exam created successfully',
    examUpdated: 'Exam updated successfully',
    examDeleted: 'Exam deleted successfully',
    minutes: 'minutes',
    questionsCount: 'questions',
    attemptsCount: 'attempts',
  },
};

export default function TeacherScheduledExamsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const { lang, toggleLang } = useLang();
  const t = content[lang];
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [exams, setExams] = useState<ScheduledExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<ScheduledExam | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    durationMinutes: '',
    passingScore: '50',
    scheduledAt: '',
  });

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/scheduled-exams?courseId=${courseId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setExams(data);
    } catch {
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchExams();
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      courseId: Number(courseId),
      title: formData.title,
      durationMinutes: formData.durationMinutes ? Number(formData.durationMinutes) : null,
      passingScore: Number(formData.passingScore),
      scheduledAt: formData.scheduledAt,
    };

    try {
      const url = editingExam
        ? '/api/teacher/scheduled-exams'
        : '/api/teacher/scheduled-exams';
      const method = editingExam ? 'PATCH' : 'POST';
      
      const body = editingExam
        ? { ...payload, id: editingExam.id, action: 'update' }
        : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      toast.success(editingExam ? t.examUpdated : t.examCreated);
      setShowModal(false);
      setEditingExam(null);
      setFormData({ title: '', durationMinutes: '', passingScore: '50', scheduledAt: '' });
      fetchExams();
    } catch {
      toast.error(t.error);
    }
  };

  const handleEdit = (exam: ScheduledExam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      durationMinutes: exam.durationMinutes?.toString() || '',
      passingScore: exam.passingScore.toString(),
      scheduledAt: new Date(exam.scheduledAt).toISOString().slice(0, 16),
    });
    setShowModal(true);
  };

  const handleDelete = async (examId: number) => {
    if (!confirm(t.confirmDelete)) return;

    try {
      const res = await fetch('/api/teacher/scheduled-exams', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: examId }),
      });

      if (!res.ok) throw new Error();
      toast.success(t.examDeleted);
      fetchExams();
    } catch {
      toast.error(t.error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: font }}
    >
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/teacher-dashboard" />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/teacher-dashboard')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontFamily: font }}
          >
            {isRtl ? <ArrowRight size={16} /> : <ArrowRight size={16} className="rotate-180" />}
            {t.back}
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-extrabold text-foreground" style={{ fontFamily: font }}>
            {t.title}
          </h1>
        </div>

        {/* Add button */}
        <button
          onClick={() => {
            setEditingExam(null);
            setFormData({ title: '', durationMinutes: '', passingScore: '50', scheduledAt: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-opacity mb-6"
          style={{ fontFamily: font }}
        >
          <Plus size={16} />
          {t.addExam}
        </button>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-primary" />
            <span className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
              {t.loading}
            </span>
          </div>
        )}

        {/* Exams list */}
        {!loading && exams.length === 0 && (
          <div className="text-center py-20 text-muted-foreground" style={{ fontFamily: font }}>
            {t.noExams}
          </div>
        )}

        {!loading && exams.length > 0 && (
          <div className="grid gap-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-card rounded-xl border border-border p-5 card-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-bold text-foreground" style={{ fontFamily: font }}>
                        {exam.title}
                      </h3>
                      {exam.isVisible ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">
                          {t.visible}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-500 font-bold">
                          {t.hidden}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span dir="ltr">{formatDate(exam.scheduledAt)}</span>
                      </div>
                      {exam.durationMinutes && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          <span>{exam.durationMinutes} {t.minutes}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <CheckCircle size={14} />
                        <span>{t.passingScore}: {exam.passingScore}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>{exam.examQuestions.length} {t.questionsCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>{exam.attempts.length} {t.attemptsCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(exam)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      title={t.edit}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: font }}>
                  {editingExam ? t.edit : t.addExam}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingExam(null);
                  }}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5" style={{ fontFamily: font }}>
                    {t.examTitle}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5" style={{ fontFamily: font }}>
                    {t.scheduledDate}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5" style={{ fontFamily: font }}>
                    {t.duration}
                  </label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5" style={{ fontFamily: font }}>
                    {t.passingScore}
                  </label>
                  <input
                    type="number"
                    value={formData.passingScore}
                    onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    min="0"
                    max="100"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
                    style={{ fontFamily: font }}
                  >
                    {t.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingExam(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-bold hover:bg-muted transition-colors"
                    style={{ fontFamily: font }}
                  >
                    {t.cancel}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}
