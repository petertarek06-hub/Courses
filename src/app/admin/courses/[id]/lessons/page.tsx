// src/app/admin/courses/[id]/lessons/page.tsx
'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Loader2,
  X,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Video,
  ClipboardList,
  CheckCircle2,
  Circle,
  Search,
  Filter,
  Clock,
  Award,
  AlertCircle,
  Check,
  HelpCircle,
  FileText,
  CalendarClock,
  CalendarCheck2,
  CalendarX2,
  ListOrdered,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminLang } from '../../../Adminshell';

// ─── Types ────────────────────────────────────────────────────
interface VideoRecord {
  id: number;
  vimeoId: string;
  description: string | null;
}
interface ExamQuestion {
  id: number;
  order: number;
  mark: number;
  isVisible: boolean; // false = soft-hidden because students already answered it
  question: QuestionBank;
}
interface ExamRecord {
  id: number;
  durationMinutes: number | null;
  passingScore: number;
  scheduledAt: string | null; // ISO string from API
  examQuestions: ExamQuestion[];
}
interface Lesson {
  id: number;
  title: string;
  order: number;
  isVisible: boolean;
  type: string;
  video: VideoRecord | null;
  exam: ExamRecord | null;
}
interface QuestionBank {
  id: number;
  text: string;
  type: 'mcq' | 'true_false' | 'essay';
  optionsJson: string;
  correctAnswer: string;
  lessonTag: string;
  courseId: number;
}

type ActiveTab = 'videos' | 'questions' | 'exams' | 'layout';

// ─── i18n ─────────────────────────────────────────────────────
const T = {
  ar: {
    back: 'العودة للكورسات',
    pageTitle: 'إدارة محتوى الكورس',
    tabVideos: 'الفيديوهات',
    tabQuestions: 'بنك الأسئلة',
    tabExams: 'الامتحانات',
    tabLayout: 'ترتيب الكورس',
    addVideo: 'إضافة فيديو',
    editVideo: 'تعديل الفيديو',
    titleLabel: 'عنوان الدرس',
    vimeoId: 'Vimeo ID',
    vimeoHint: 'الرقم من رابط الفيديو: vimeo.com/123456789',
    description: 'وصف الفيديو (اختياري)',
    descriptionPlaceholder: 'وصف مختصر لمحتوى الفيديو...',
    noVideos: 'لا توجد فيديوهات بعد',
    addQuestion: 'إضافة سؤال',
    editQuestion: 'تعديل السؤال',
    questionText: 'نص السؤال',
    questionType: 'نوع السؤال',
    mcq: 'اختيار من متعدد',
    trueFalse: 'صح أم خطأ',
    essay: 'مقالي (يصحح يدويًا)',
    lessonTag: 'الموضوع / عنوان الدرس',
    lessonTagPlaceholder: 'مثال: قوانين نيوتن',
    lessonTagHint: 'أدخل موضوع السؤال — يُستخدم لتصفية الأسئلة عند بناء الامتحان',
    options: 'الخيارات',
    option: 'خيار',
    correctAnswer: 'الإجابة الصحيحة',
    gradingNotes: 'تعليمات التصحيح (اختياري)',
    gradingNotesPlaceholder: 'مثال: يجب أن يذكر الطالب ثلاثة عوامل على الأقل...',
    gradingNotesHint: 'ملاحظات للمصحح — لا تظهر للطالب',
    essayNote: 'سؤال مقالي — يُصحَّح يدويًا ولا يمكن إضافته للامتحانات التلقائية',
    addOption: 'إضافة خيار',
    true: 'صح',
    false: 'خطأ',
    filterByTag: 'تصفية حسب الموضوع',
    allTags: 'جميع المواضيع',
    noQuestions: 'لا توجد أسئلة بعد في بنك الأسئلة',
    addExam: 'إضافة امتحان',
    editExam: 'تعديل الامتحان',
    examName: 'اسم الامتحان',
    examNamePlaceholder: 'مثال: امتحان الفصل الأول',
    durationMinutes: 'مدة الامتحان (دقيقة) — اختياري',
    passingScore: 'درجة النجاح (%)',
    // ── Scheduling ──
    scheduleLabel: 'موعد إتاحة الامتحان',
    scheduleHint:
      'اتركه فارغًا ليكون الامتحان متاحًا فورًا. إذا حُدِّد موعد، لن يرى الطلاب الامتحان قبله.',
    scheduleNow: 'متاح فورًا',
    scheduleLater: 'جدولة في وقت محدد',
    scheduledFor: 'مجدول في',
    schedulePast: 'الموعد مضى — الامتحان متاح الآن',
    scheduleFuture: 'مجدول للمستقبل',
    clearSchedule: 'إلغاء الجدولة',
    // ──
    manageQuestions: 'إدارة أسئلة الامتحان',
    addFromBank: 'إضافة من البنك',
    examHasQuestions: 'أسئلة الامتحان',
    noExams: 'لا توجد امتحانات بعد',
    noExamQuestions: 'لا توجد أسئلة في هذا الامتحان بعد',
    selectByTag: 'تصفية البنك حسب الموضوع',
    addSelected: 'إضافة المحدد',
    essayExcluded: '(الأسئلة المقالية مُستبعدة من الامتحانات التلقائية)',
    totalMarks: 'إجمالي الدرجات',
    markUnit: 'درجة',
    markLabel: 'الدرجة',
    // ── Hidden exam questions ──
    hiddenQuestionBadge: 'مخفي',
    hiddenQuestionHint:
      'تمت إجابة الطلاب على هذا السؤال، فتم إخفاؤه بدلاً من حذفه للحفاظ على درجاتهم',
    questionHiddenToast: 'لا يمكن حذف هذا السؤال لأن طلابًا أجابوا عليه، فتم إخفاؤه بدلاً من ذلك',
    unhideOnReadd: 'إعادة إضافته من البنك ستُظهره للطلاب مجددًا',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    show: 'إظهار',
    hide: 'إخفاء',
    visible: 'مرئي',
    hidden: 'مخفي',
    confirmDelete: 'هل أنت متأكد من حذف',
    confirmDeleteBtn: 'حذف نهائيًا',
    missingFields: 'يرجى تعبئة جميع الحقول المطلوبة',
    addedOk: 'تمت الإضافة بنجاح',
    updatedOk: 'تم التحديث بنجاح',
    deletedOk: 'تم الحذف بنجاح',
    errorLoad: 'فشل تحميل البيانات',
    min2Options: 'يجب إضافة خيارين على الأقل',
    questions: 'سؤال',
    minutes: 'دقيقة',
    passing: 'للنجاح',
    searchQuestions: 'بحث في الأسئلة...',
    layoutMainSequence: 'التسلسل الأساسي',
    layoutMainSequenceHint: 'هذا هو الترتيب الذي يشاهده الطالب — كل عنصر يفتح بعد إكمال ما قبله',
    layoutScheduledSection: 'الامتحانات المجدولة',
    layoutScheduledHint: 'مستقلة عن التسلسل — لا تُقفل ولا تُفتح أي عنصر آخر',
    noLessonsInSequence: 'لا توجد عناصر في التسلسل بعد',
    noScheduledExams: 'لا توجد امتحانات مجدولة',
  },
  en: {
    back: 'Back to Courses',
    pageTitle: 'Manage Course Content',
    tabVideos: 'Videos',
    tabQuestions: 'Question Bank',
    tabExams: 'Exams',
    tabLayout: 'Course Layout',
    addVideo: 'Add Video',
    editVideo: 'Edit Video',
    titleLabel: 'Lesson Title',
    vimeoId: 'Vimeo ID',
    vimeoHint: 'Number from the video URL: vimeo.com/123456789',
    description: 'Video description — optional',
    descriptionPlaceholder: 'A short description of the video content...',
    noVideos: 'No videos yet',
    addQuestion: 'Add Question',
    editQuestion: 'Edit Question',
    questionText: 'Question text',
    questionType: 'Question type',
    mcq: 'Multiple choice',
    trueFalse: 'True / False',
    essay: 'Essay (manually graded)',
    lessonTag: 'Topic / Lesson title',
    lessonTagPlaceholder: "e.g. Newton's Laws",
    lessonTagHint: 'Enter the topic — used to filter questions when building exams',
    options: 'Options',
    option: 'Option',
    correctAnswer: 'Correct answer',
    gradingNotes: 'Grading notes (optional)',
    gradingNotesPlaceholder: 'e.g. Student must mention at least three factors...',
    gradingNotesHint: 'Notes for the grader — not shown to the student',
    essayNote: 'Essay question — graded manually. Cannot be added to auto-graded exams.',
    addOption: 'Add option',
    true: 'True',
    false: 'False',
    filterByTag: 'Filter by topic',
    allTags: 'All topics',
    noQuestions: 'No questions in the bank yet',
    addExam: 'Add Exam',
    editExam: 'Edit Exam',
    examName: 'Exam Name',
    examNamePlaceholder: 'e.g. First Term Exam',
    durationMinutes: 'Duration (minutes) — optional',
    passingScore: 'Passing score (%)',
    // ── Scheduling ──
    scheduleLabel: 'Exam availability',
    scheduleHint:
      'Leave unscheduled to make it available immediately. When a date is set, students cannot see the exam before that time.',
    scheduleNow: 'Available immediately',
    scheduleLater: 'Schedule for a specific time',
    scheduledFor: 'Scheduled for',
    schedulePast: 'Time has passed — exam is now live',
    scheduleFuture: 'Scheduled (upcoming)',
    clearSchedule: 'Clear schedule',
    // ──
    manageQuestions: 'Manage exam questions',
    addFromBank: 'Add from bank',
    examHasQuestions: 'Exam questions',
    noExams: 'No exams yet',
    noExamQuestions: 'No questions in this exam yet',
    selectByTag: 'Filter bank by topic',
    addSelected: 'Add selected',
    essayExcluded: '(Essay questions are excluded from auto-graded exams)',
    totalMarks: 'Total marks',
    markUnit: 'pts',
    markLabel: 'Mark',
    // ── Hidden exam questions ──
    hiddenQuestionBadge: 'Hidden',
    hiddenQuestionHint:
      'Students already answered this question, so it was hidden instead of deleted to preserve their grades',
    questionHiddenToast:
      "Can't delete — students already answered this question, so it was hidden instead",
    unhideOnReadd: 'Re-adding it from the bank will make it visible to students again',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    show: 'Show',
    hide: 'Hide',
    visible: 'Visible',
    hidden: 'Hidden',
    confirmDelete: 'Are you sure you want to delete',
    confirmDeleteBtn: 'Delete permanently',
    missingFields: 'Please fill in all required fields',
    addedOk: 'Added successfully',
    updatedOk: 'Updated successfully',
    deletedOk: 'Deleted successfully',
    errorLoad: 'Failed to load data',
    min2Options: 'Please add at least 2 options',
    questions: 'questions',
    minutes: 'min',
    passing: 'to pass',
    searchQuestions: 'Search questions...',
    layoutMainSequence: 'Main Sequence',
    layoutMainSequenceHint:
      'This is the order students see — each item unlocks after the one before it is completed',
    layoutScheduledSection: 'Scheduled Exams',
    layoutScheduledHint:
      "Independent of the sequence — these don't gate or get gated by anything else",
    noLessonsInSequence: 'No items in the sequence yet',
    noScheduledExams: 'No scheduled exams',
  },
};

type TType = (typeof T)['ar'];

// ─── Helpers ──────────────────────────────────────────────────
function parseOptions(json: string): string[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/**
 * Converts a JS Date → local datetime-local input value string
 * e.g. "2025-07-04T08:00"
 */
function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/**
 * Formats a stored ISO scheduledAt for display.
 * Returns null if scheduledAt is null/undefined.
 */
function formatScheduledAt(iso: string | null | undefined, lang: 'ar' | 'en'): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Returns true if the exam is currently available (no schedule, or schedule is in the past). */
function isExamLive(scheduledAt: string | null | undefined): boolean {
  if (!scheduledAt) return true;
  return new Date(scheduledAt) <= new Date();
}

// ─── Reusable UI ──────────────────────────────────────────────
function Modal({
  children,
  onClose,
  title,
  font,
  wide,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  font?: string;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-card rounded-2xl border border-border shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex-shrink-0">
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
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  font,
  children,
}: {
  label: string;
  hint?: string;
  font?: string;
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
      {hint && (
        <span className="text-[10px] sm:text-xs text-muted-foreground" style={{ fontFamily: font }}>
          {hint}
        </span>
      )}
    </div>
  );
}

function Inp({
  value,
  onChange,
  placeholder,
  dir,
  type = 'text',
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: string;
  type?: string;
  min?: string;
  max?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      min={min}
      max={max}
      dir={dir}
      className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  dir,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      dir={dir}
      rows={rows}
      className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
    />
  );
}

function ActionButtons({
  onClose,
  onSave,
  saving,
  font,
  t,
}: {
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  font?: string;
  t: TType;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-3 sm:pt-4 border-t border-border mt-3 sm:mt-4">
      <button
        onClick={onClose}
        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
        style={{ fontFamily: font }}
      >
        {t.cancel}
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
        style={{ fontFamily: font }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : t.save}
      </button>
    </div>
  );
}

function QTypeBadge({ type, t, font }: { type: string; t: TType; font?: string }) {
  if (type === 'mcq')
    return (
      <span
        className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary"
        style={{ fontFamily: font }}
      >
        {t.mcq}
      </span>
    );
  if (type === 'true_false')
    return (
      <span
        className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold bg-secondary/10 text-secondary"
        style={{ fontFamily: font }}
      >
        {t.trueFalse}
      </span>
    );
  return (
    <span
      className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700"
      style={{ fontFamily: font }}
    >
      {t.essay}
    </span>
  );
}

// ── ScheduleBadge — shown on each exam card in the list ───────
function ScheduleBadge({
  scheduledAt,
  t,
  lang,
  font,
}: {
  scheduledAt: string | null | undefined;
  t: TType;
  lang: 'ar' | 'en';
  font?: string;
}) {
  if (!scheduledAt) return null;

  const live = isExamLive(scheduledAt);
  const label = formatScheduledAt(scheduledAt, lang);

  if (live) {
    return (
      <span
        className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200"
        style={{ fontFamily: font }}
        title={`${t.scheduledFor}: ${label}`}
      >
        <CalendarCheck2 size={11} />
        {t.schedulePast}
      </span>
    );
  }

  return (
    <span
      className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200"
      style={{ fontFamily: font }}
      title={`${t.scheduledFor}: ${label}`}
    >
      <CalendarClock size={11} />
      {label}
    </span>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function AdminCourseLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const courseId = Number(id);
  const router = useRouter();
  const { lang, isRtl } = useAdminLang();
  const t = T[lang];
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [activeTab, setActiveTab] = useState<ActiveTab>('videos');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<QuestionBank[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const fetchLessons = useCallback(() => {
    setLoadingLessons(true);
    fetch(`/api/admin/lessons?courseId=${courseId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setLessons)
      .catch(() => toast.error(t.errorLoad))
      .finally(() => setLoadingLessons(false));
  }, [courseId, t.errorLoad]);

  const fetchQuestions = useCallback(() => {
    setLoadingQuestions(true);
    fetch(`/api/admin/questions?courseId=${courseId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setQuestions)
      .catch(() => toast.error(t.errorLoad))
      .finally(() => setLoadingQuestions(false));
  }, [courseId, t.errorLoad]);

  useEffect(() => {
    fetchLessons();
    fetchQuestions();
  }, [fetchLessons, fetchQuestions]);

  const videoLessons = lessons.filter((l) => l.type === 'video');
  const examLessons = lessons.filter((l) => l.type === 'exam');
  const allTags = Array.from(new Set(questions.map((q) => q.lessonTag))).sort();

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
        <button
          onClick={() => router.push('/admin/courses')}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontFamily: font }}
        >
          {isRtl ? (
            <ArrowRight size={14} className="sm:hidden" />
          ) : (
            <ArrowRight size={14} className="rotate-180 sm:hidden" />
          )}
          {isRtl ? (
            <ArrowRight size={16} className="hidden sm:block" />
          ) : (
            <ArrowRight size={16} className="rotate-180 hidden sm:block" />
          )}
          {t.back}
        </button>
        <span className="text-muted-foreground">/</span>
        <h1
          className="text-lg sm:text-xl font-extrabold text-foreground"
          style={{ fontFamily: font }}
        >
          {t.pageTitle}
        </h1>
      </div>

      <div className="flex gap-1 bg-muted/40 p-1 rounded-2xl mb-4 sm:mb-6 w-fit overflow-x-auto max-w-full">
        {(['videos', 'questions', 'exams', 'layout'] as ActiveTab[]).map((tab) => {
          const icons = {
            videos: <Video size={14} className="sm:hidden" />,
            questions: <HelpCircle size={14} className="sm:hidden" />,
            exams: <ClipboardList size={14} className="sm:hidden" />,
            layout: <ListOrdered size={14} className="sm:hidden" />,
          };
          const iconsDesktop = {
            videos: <Video size={15} className="hidden sm:block" />,
            questions: <HelpCircle size={15} className="hidden sm:block" />,
            exams: <ClipboardList size={15} className="hidden sm:block" />,
            layout: <ListOrdered size={15} className="hidden sm:block" />,
          };
          const labels = {
            videos: t.tabVideos,
            questions: t.tabQuestions,
            exams: t.tabExams,
            layout: t.tabLayout,
          };
          const counts = {
            videos: videoLessons.length,
            questions: questions.length,
            exams: examLessons.length,
            layout: lessons.length,
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-card text-primary shadow border border-border' : 'text-muted-foreground hover:text-foreground'}`}
              style={{ fontFamily: font }}
            >
              {icons[tab]}
              {iconsDesktop[tab]}
              {labels[tab]}
              <span
                className={`text-[10px] sm:text-xs px-1.5 sm:px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
              >
                {counts[tab]}
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === 'videos' && (
        <VideosTab
          courseId={courseId}
          lessons={videoLessons}
          loading={loadingLessons}
          onRefresh={fetchLessons}
          lang={lang}
          t={t}
          font={font}
        />
      )}
      {activeTab === 'questions' && (
        <QuestionsTab
          courseId={courseId}
          questions={questions}
          loading={loadingQuestions}
          onRefresh={fetchQuestions}
          lang={lang}
          t={t}
          font={font}
          allTags={allTags}
        />
      )}
      {activeTab === 'exams' && (
        <ExamsTab
          courseId={courseId}
          lessons={examLessons}
          questions={questions}
          loading={loadingLessons}
          onRefresh={fetchLessons}
          lang={lang}
          t={t}
          font={font}
          allTags={allTags}
        />
      )}
      {activeTab === 'layout' && (
        <LayoutTab
          courseId={courseId}
          lessons={lessons}
          loading={loadingLessons}
          onRefresh={fetchLessons}
          lang={lang}
          t={t}
          font={font}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// VIDEOS TAB
// ═══════════════════════════════════════════════════════════════
function VideosTab({
  courseId,
  lessons,
  loading,
  onRefresh,
  lang,
  t,
  font,
}: {
  courseId: number;
  lessons: Lesson[];
  loading: boolean;
  onRefresh: () => void;
  lang: 'ar' | 'en';
  t: TType;
  font?: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState({ title: '', vimeoId: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);

  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const openAdd = () => {
    setEditLesson(null);
    setForm({ title: '', vimeoId: '', description: '' });
    setShowModal(true);
  };
  const openEdit = (l: Lesson) => {
    setEditLesson(l);
    setForm({
      title: l.title,
      vimeoId: l.video?.vimeoId ?? '',
      description: l.video?.description ?? '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.vimeoId) {
      toast.error(t.missingFields);
      return;
    }
    setSaving(true);
    try {
      if (editLesson) {
        await fetch('/api/admin/lessons', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editLesson.id, action: 'updateVideo', ...form }),
        });
        toast.success(t.updatedOk);
      } else {
        await fetch('/api/admin/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, type: 'video', ...form }),
        });
        toast.success(t.addedOk);
      }
      setShowModal(false);
      onRefresh();
    } catch {
      toast.error(t.missingFields);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch('/api/admin/lessons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    toast.success(t.deletedOk);
    setDeleteTarget(null);
    onRefresh();
  };
  const toggleVis = async (l: Lesson) => {
    await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: l.id, action: 'toggleVisibility' }),
    });
    onRefresh();
  };

  return (
    <>
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-border gap-2 flex-wrap">
          <h2
            className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
            style={{ fontFamily: font }}
          >
            <Video size={14} className="text-primary sm:hidden" />
            <Video size={16} className="text-primary hidden sm:block" />
            {t.tabVideos} ({lessons.length})
          </h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl gradient-primary text-white text-[10px] sm:text-xs font-bold shadow hover:opacity-90 active:scale-95 transition-all"
            style={{ fontFamily: font }}
          >
            <Plus size={13} className="sm:hidden" />
            <Plus size={14} className="hidden sm:block" />
            {t.addVideo}
          </button>
        </div>
        {loading ? (
          <div className="py-12 sm:py-16 flex justify-center">
            <Loader2 size={24} className="animate-spin text-primary sm:hidden" />
            <Loader2 size={28} className="animate-spin text-primary hidden sm:block" />
          </div>
        ) : lessons.length === 0 ? (
          <div className="py-12 sm:py-16 flex flex-col items-center gap-2 sm:gap-3">
            <Video size={32} className="text-muted-foreground/30 sm:hidden" />
            <Video size={40} className="text-muted-foreground/30 hidden sm:block" />
            <p className="text-muted-foreground text-xs sm:text-sm" style={{ fontFamily: font }}>
              {t.noVideos}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5 hover:bg-muted/20 transition-colors"
              >
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground w-4 sm:w-5 text-center">
                  {lesson.order}
                </span>
                {lesson.video ? (
                  <img
                    src={`https://vumbnail.com/${lesson.video.vimeoId}.jpg`}
                    alt={lesson.title}
                    className="w-14 h-9 sm:w-20 sm:h-12 rounded-lg object-cover flex-shrink-0 border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-14 h-9 sm:w-20 sm:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Video size={14} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-foreground text-xs sm:text-sm truncate"
                    style={{ fontFamily: font }}
                  >
                    {lesson.title}
                  </p>
                  {lesson.video && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground" dir="ltr">
                      ID: {lesson.video.vimeoId}
                    </span>
                  )}
                  {lesson.video?.description && (
                    <p
                      className="text-[10px] sm:text-xs text-muted-foreground truncate"
                      style={{ fontFamily: font }}
                    >
                      {lesson.video.description}
                    </p>
                  )}
                </div>
                <span
                  className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${lesson.isVisible ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}
                  style={{ fontFamily: font }}
                >
                  {lesson.isVisible ? (
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
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(lesson)}
                    className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => toggleVis(lesson)}
                    className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-orange-50 hover:text-orange-500 transition-colors"
                  >
                    {lesson.isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(lesson)}
                    className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          title={editLesson ? t.editVideo : t.addVideo}
          font={font}
        >
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <Field label={t.titleLabel} font={font}>
              <Inp
                value={form.title}
                onChange={(v) => f('title', v)}
                placeholder={
                  lang === 'ar' ? 'مثال: مقدمة في الجبر' : 'e.g. Introduction to Algebra'
                }
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              />
            </Field>
            <Field label={t.vimeoId} hint={t.vimeoHint} font={font}>
              <Inp
                value={form.vimeoId}
                onChange={(v) => f('vimeoId', v)}
                placeholder="123456789"
                dir="ltr"
              />
            </Field>
            <Field label={t.description} font={font}>
              <Textarea
                value={form.description}
                onChange={(v) => f('description', v)}
                placeholder={t.descriptionPlaceholder}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                rows={3}
              />
            </Field>
          </div>
          <ActionButtons
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            saving={saving}
            font={font}
            t={t}
          />
        </Modal>
      )}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)} title={t.delete} font={font}>
          <p
            className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6"
            style={{ fontFamily: font }}
          >
            {t.confirmDelete}{' '}
            <span className="font-bold text-foreground">{deleteTarget.title}</span>؟
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-bold transition-all"
              style={{ fontFamily: font }}
            >
              {t.confirmDeleteBtn}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// QUESTIONS TAB
// ═══════════════════════════════════════════════════════════════
type QForm = {
  text: string;
  type: 'mcq' | 'true_false' | 'essay';
  options: string[];
  correctAnswer: string;
  gradingNotes: string;
  lessonTag: string;
};
const emptyQForm = (): QForm => ({
  text: '',
  type: 'mcq',
  options: ['', ''],
  correctAnswer: '',
  gradingNotes: '',
  lessonTag: '',
});

function QuestionsTab({
  courseId,
  questions,
  loading,
  onRefresh,
  lang,
  t,
  font,
  allTags,
}: {
  courseId: number;
  questions: QuestionBank[];
  loading: boolean;
  onRefresh: () => void;
  lang: 'ar' | 'en';
  t: TType;
  font?: string;
  allTags: string[];
}) {
  const isRtl = lang === 'ar';
  const [showModal, setShowModal] = useState(false);
  const [editQ, setEditQ] = useState<QuestionBank | null>(null);
  const [form, setForm] = useState<QForm>(emptyQForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuestionBank | null>(null);
  const [filterTag, setFilterTag] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  const f = (k: keyof QForm, v: unknown) => setForm((p) => ({ ...p, [k]: v }));
  const openAdd = () => {
    setEditQ(null);
    setForm(emptyQForm());
    setShowModal(true);
  };
  const openEdit = (q: QuestionBank) => {
    setEditQ(q);
    const isEssay = q.type === 'essay';
    setForm({
      text: q.text,
      type: q.type,
      options: isEssay ? [] : parseOptions(q.optionsJson),
      correctAnswer: isEssay ? '' : q.correctAnswer,
      gradingNotes: isEssay ? q.correctAnswer : '',
      lessonTag: q.lessonTag,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.text || !form.lessonTag) {
      toast.error(t.missingFields);
      return;
    }
    if (form.type === 'mcq' && form.options.filter((o) => o.trim()).length < 2) {
      toast.error(t.min2Options);
      return;
    }
    if ((form.type === 'mcq' || form.type === 'true_false') && !form.correctAnswer) {
      toast.error(t.missingFields);
      return;
    }
    setSaving(true);
    const payload = {
      courseId,
      text: form.text,
      type: form.type,
      optionsJson:
        form.type === 'essay'
          ? JSON.stringify([])
          : form.type === 'true_false'
            ? JSON.stringify([t.true, t.false])
            : JSON.stringify(form.options.filter((o) => o.trim())),
      correctAnswer: form.type === 'essay' ? form.gradingNotes : form.correctAnswer,
      lessonTag: form.lessonTag,
    };
    try {
      if (editQ) {
        await fetch('/api/admin/questions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editQ.id, ...payload }),
        });
        toast.success(t.updatedOk);
      } else {
        await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast.success(t.addedOk);
      }
      setShowModal(false);
      onRefresh();
    } catch {
      toast.error(t.missingFields);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch('/api/admin/questions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    toast.success(t.deletedOk);
    setDeleteTarget(null);
    onRefresh();
  };

  const filtered = questions.filter((q) => {
    const matchTag = !filterTag || q.lessonTag === filterTag;
    const matchType = !filterType || q.type === filterType;
    const matchSearch = !search || q.text.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchType && matchSearch;
  });

  return (
    <>
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 border-b border-border">
          <h2
            className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
            style={{ fontFamily: font }}
          >
            <HelpCircle size={14} className="text-secondary sm:hidden" />
            <HelpCircle size={16} className="text-secondary hidden sm:block" />
            {t.tabQuestions} ({questions.length})
          </h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl gradient-primary text-white text-[10px] sm:text-xs font-bold shadow hover:opacity-90 active:scale-95 transition-all"
            style={{ fontFamily: font }}
          >
            <Plus size={13} className="sm:hidden" />
            <Plus size={14} className="hidden sm:block" />
            {t.addQuestion}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border bg-muted/20">
          <div className="relative flex-1 min-w-[140px] sm:min-w-[160px]">
            <Search
              size={13}
              className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${isRtl ? 'right-2.5 sm:right-3' : 'left-2.5 sm:left-3'}`}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchQuestions}
              className={`w-full text-[10px] sm:text-xs py-1.5 sm:py-2 ${isRtl ? 'pr-7 sm:pr-8 pl-2.5 sm:pl-3' : 'pl-7 sm:pl-8 pr-2.5 sm:pr-3'} rounded-xl border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all`}
              style={{ fontFamily: font }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-muted-foreground" />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="text-[10px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl border border-border bg-background text-foreground outline-none"
              style={{ fontFamily: font }}
            >
              <option value="">{t.allTags}</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-[10px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl border border-border bg-background text-foreground outline-none"
            style={{ fontFamily: font }}
          >
            <option value="">{isRtl ? 'كل الأنواع' : 'All types'}</option>
            <option value="mcq">{t.mcq}</option>
            <option value="true_false">{t.trueFalse}</option>
            <option value="essay">{t.essay}</option>
          </select>
        </div>
        {loading ? (
          <div className="py-12 sm:py-16 flex justify-center">
            <Loader2 size={24} className="animate-spin text-primary sm:hidden" />
            <Loader2 size={28} className="animate-spin text-primary hidden sm:block" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 sm:py-16 flex flex-col items-center gap-2 sm:gap-3">
            <HelpCircle size={32} className="text-muted-foreground/30 sm:hidden" />
            <HelpCircle size={40} className="text-muted-foreground/30 hidden sm:block" />
            <p className="text-muted-foreground text-xs sm:text-sm" style={{ fontFamily: font }}>
              {t.noQuestions}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((q, i) => {
              const opts = parseOptions(q.optionsJson);
              const isEssay = q.type === 'essay';
              return (
                <div
                  key={q.id}
                  className="px-3 sm:px-5 py-3 sm:py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 flex-wrap">
                        <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">
                          #{i + 1}
                        </span>
                        <QTypeBadge type={q.type} t={t} font={font} />
                        <span
                          className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-accent/20 font-semibold"
                          style={{ fontFamily: font }}
                        >
                          {q.lessonTag}
                        </span>
                      </div>
                      <p
                        className="text-xs sm:text-sm font-semibold text-foreground"
                        style={{ fontFamily: font }}
                      >
                        {q.text}
                      </p>
                      {!isEssay && opts.length > 0 && (
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
                          {opts.map((opt, oi) => (
                            <span
                              key={oi}
                              className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border font-medium ${opt === q.correctAnswer ? 'border-green-400 bg-green-50 text-green-700' : 'border-border bg-muted/40 text-muted-foreground'}`}
                              style={{ fontFamily: font }}
                            >
                              {opt === q.correctAnswer && (
                                <Check size={9} className="inline mr-1" />
                              )}
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                      {isEssay && (
                        <div className="mt-1.5 sm:mt-2 flex items-start gap-1.5">
                          <FileText size={11} className="text-amber-500 mt-0.5 flex-shrink-0" />
                          <p
                            className="text-[10px] sm:text-xs text-muted-foreground italic"
                            style={{ fontFamily: font }}
                          >
                            {q.correctAnswer ||
                              (isRtl ? 'لا توجد تعليمات تصحيح' : 'No grading notes')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(q)}
                        className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(q)}
                        className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          title={editQ ? t.editQuestion : t.addQuestion}
          font={font}
          wide
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            <Field label={t.questionText} font={font}>
              <Textarea
                value={form.text}
                onChange={(v) => f('text', v)}
                placeholder={isRtl ? 'اكتب السؤال هنا...' : 'Type the question here...'}
                dir={isRtl ? 'rtl' : 'ltr'}
                rows={2}
              />
            </Field>
            <Field label={t.lessonTag} hint={t.lessonTagHint} font={font}>
              <Inp
                value={form.lessonTag}
                onChange={(v) => f('lessonTag', v)}
                placeholder={t.lessonTagPlaceholder}
                dir={isRtl ? 'rtl' : 'ltr'}
              />
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1 sm:mt-1.5">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => f('lessonTag', tag)}
                      className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border transition-all ${form.lessonTag === tag ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                      style={{ fontFamily: font }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </Field>
            <Field label={t.questionType} font={font}>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {(['mcq', 'true_false', 'essay'] as const).map((type) => {
                  const labels = { mcq: t.mcq, true_false: t.trueFalse, essay: t.essay };
                  const icons = {
                    mcq: <Circle size={13} />,
                    true_false: <Check size={13} />,
                    essay: <FileText size={13} />,
                  };
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        f('type', type);
                        f('correctAnswer', '');
                        f('gradingNotes', '');
                        f(
                          'options',
                          type === 'true_false' ? [t.true, t.false] : type === 'mcq' ? ['', ''] : []
                        );
                      }}
                      className={`flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-xl border text-[10px] sm:text-xs font-bold transition-all ${form.type === type ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
                      style={{ fontFamily: font }}
                    >
                      {icons[type]} {labels[type]}
                    </button>
                  );
                })}
              </div>
            </Field>

            {form.type === 'mcq' && (
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label
                  className="text-xs sm:text-sm font-semibold text-foreground"
                  style={{ fontFamily: font }}
                >
                  {t.options}
                </label>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => f('correctAnswer', opt.trim())}
                      className={`p-1 sm:p-1.5 rounded-full flex-shrink-0 transition-all ${form.correctAnswer === opt.trim() && opt.trim() ? 'text-green-500' : 'text-muted-foreground/40 hover:text-green-400'}`}
                    >
                      {form.correctAnswer === opt.trim() && opt.trim() ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Circle size={16} />
                      )}
                    </button>
                    <Inp
                      value={opt}
                      onChange={(v) => {
                        const opts = [...form.options];
                        opts[i] = v;
                        f('options', opts);
                      }}
                      placeholder={`${t.option} ${i + 1}`}
                      dir={isRtl ? 'rtl' : 'ltr'}
                    />
                    {form.options.length > 2 && (
                      <button
                        onClick={() => {
                          const opts = form.options.filter((_, j) => j !== i);
                          f('options', opts);
                          if (form.correctAnswer === opt.trim()) f('correctAnswer', '');
                        }}
                        className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
                {form.options.length < 6 && (
                  <button
                    onClick={() => f('options', [...form.options, ''])}
                    className="flex items-center gap-1.5 text-[10px] sm:text-xs text-primary hover:underline font-semibold"
                    style={{ fontFamily: font }}
                  >
                    <Plus size={12} /> {t.addOption}
                  </button>
                )}
                {form.correctAnswer && (
                  <p
                    className="text-[10px] sm:text-xs text-green-600 font-semibold flex items-center gap-1"
                    style={{ fontFamily: font }}
                  >
                    <Check size={11} /> {t.correctAnswer}: {form.correctAnswer}
                  </p>
                )}
              </div>
            )}

            {form.type === 'true_false' && (
              <Field label={t.correctAnswer} font={font}>
                <div className="flex gap-2">
                  {[t.true, t.false].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => f('correctAnswer', opt)}
                      className={`flex-1 py-1.5 sm:py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all ${form.correctAnswer === opt ? 'border-green-400 bg-green-50 text-green-700' : 'border-border text-muted-foreground hover:border-green-300'}`}
                      style={{ fontFamily: font }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            {form.type === 'essay' && (
              <>
                <div className="flex items-start gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <FileText size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p
                    className="text-[10px] sm:text-xs text-amber-700 leading-relaxed"
                    style={{ fontFamily: font }}
                  >
                    {t.essayNote}
                  </p>
                </div>
                <Field label={t.gradingNotes} hint={t.gradingNotesHint} font={font}>
                  <Textarea
                    value={form.gradingNotes}
                    onChange={(v) => f('gradingNotes', v)}
                    placeholder={t.gradingNotesPlaceholder}
                    dir={isRtl ? 'rtl' : 'ltr'}
                    rows={3}
                  />
                </Field>
              </>
            )}
          </div>
          <ActionButtons
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            saving={saving}
            font={font}
            t={t}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)} title={t.delete} font={font}>
          <p
            className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6"
            style={{ fontFamily: font }}
          >
            {t.confirmDelete} <span className="font-bold text-foreground">{deleteTarget.text}</span>
            ؟
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-bold transition-all"
              style={{ fontFamily: font }}
            >
              {t.confirmDeleteBtn}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXAMS TAB — with scheduledAt scheduling feature
// ═══════════════════════════════════════════════════════════════
function ExamsTab({
  courseId,
  lessons,
  questions,
  loading,
  onRefresh,
  lang,
  t,
  font,
  allTags,
}: {
  courseId: number;
  lessons: Lesson[];
  questions: QuestionBank[];
  loading: boolean;
  onRefresh: () => void;
  lang: 'ar' | 'en';
  t: TType;
  font?: string;
  allTags: string[];
}) {
  const isRtl = lang === 'ar';

  const [showModal, setShowModal] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState({
    title: '',
    durationMinutes: '',
    passingScore: '50',
  });
  const [scheduledValue, setScheduledValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);

  const [manageLesson, setManageLesson] = useState<Lesson | null>(null);
  const [bankFilter, setBankFilter] = useState('');
  const [selectedBankIds, setSelectedBankIds] = useState<Set<number>>(new Set());
  const [addingQs, setAddingQs] = useState(false);
  const [markDrafts, setMarkDrafts] = useState<Record<number, string>>({});

  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const openAdd = () => {
    setEditLesson(null);
    setForm({ title: '', durationMinutes: '', passingScore: '50' });
    setScheduledValue(null);
    setShowModal(true);
  };

  const openEdit = (l: Lesson) => {
    setEditLesson(l);
    setForm({
      title: l.title,
      durationMinutes: l.exam?.durationMinutes ? String(l.exam.durationMinutes) : '',
      passingScore: String(l.exam?.passingScore ?? 50),
    });
    if (l.exam?.scheduledAt) {
      const d = new Date(l.exam.scheduledAt);
      setScheduledValue(isNaN(d.getTime()) ? null : toDatetimeLocal(d));
    } else {
      setScheduledValue(null);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) {
      toast.error(t.missingFields);
      return;
    }
    setSaving(true);
    try {
      const scheduledAt: string | null = scheduledValue
        ? new Date(scheduledValue).toISOString()
        : null;

      const payload = {
        title: form.title,
        durationMinutes: form.durationMinutes,
        passingScore: form.passingScore,
        scheduledAt,
      };
      if (editLesson) {
        await fetch('/api/admin/lessons', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editLesson.id, action: 'updateExam', ...payload }),
        });
        toast.success(t.updatedOk);
      } else {
        await fetch('/api/admin/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, type: 'exam', ...payload }),
        });
        toast.success(t.addedOk);
      }
      setShowModal(false);
      onRefresh();
    } catch {
      toast.error(t.missingFields);
    }
    setSaving(false);
  };

  const toggleVis = async (l: Lesson) => {
    await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: l.id, action: 'toggleVisibility' }),
    });
    onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch('/api/admin/lessons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    toast.success(t.deletedOk);
    setDeleteTarget(null);
    onRefresh();
  };

  const handleAddFromBank = async () => {
    if (!manageLesson || !selectedBankIds.size) return;
    setAddingQs(true);
    await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: manageLesson.id,
        action: 'addExamQuestions',
        questionIds: Array.from(selectedBankIds),
      }),
    });
    setSelectedBankIds(new Set());
    onRefresh();
    toast.success(t.addedOk);
    setAddingQs(false);
  };

  // ✅ NEW: the API hard-deletes a question with no student answers, but
  // soft-hides (isVisible: false) one that already has answers — because
  // hard-deleting it would violate the FK on attempt_answers and destroy
  // grading history. Read `hidden` from the response and toast accordingly
  // instead of always claiming it was deleted.
  const handleRemoveEQ = async (lessonId: number, eqId: number) => {
    const res = await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lessonId, action: 'removeExamQuestion', examQuestionId: eqId }),
    });
    const data = await res.json().catch(() => null);
    onRefresh();
    if (data?.hidden) {
      toast.warning(t.questionHiddenToast);
    } else {
      toast.success(t.deletedOk);
    }
  };

  const handleReorderEQ = async (lessonId: number, eqId: number, dir: 'up' | 'down') => {
    await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lessonId,
        action: 'reorderExamQuestion',
        examQuestionId: eqId,
        direction: dir,
      }),
    });
    onRefresh();
  };

  const handleUpdateMark = async (lessonId: number, eqId: number, mark: number) => {
    await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lessonId,
        action: 'updateExamQuestionMark',
        examQuestionId: eqId,
        mark,
      }),
    });
    onRefresh();
  };

  const currentManage = manageLesson
    ? (lessons.find((l) => l.id === manageLesson.id) ?? null)
    : null;

  // ✅ NEW: hidden questions no longer count toward the "questions in this
  // exam" / total-marks figures shown to the admin — they're not part of
  // the live exam anymore, just kept around (grayed out, below) so grading
  // history stays intelligible.
  const visibleExamQuestions =
    currentManage?.exam?.examQuestions.filter((eq) => eq.isVisible) ?? [];
  const hiddenExamQuestions =
    currentManage?.exam?.examQuestions.filter((eq) => !eq.isVisible) ?? [];

  // ✅ NEW: a question already in the exam but hidden should still show up
  // in the "add from bank" picker — selecting it calls addExamQuestions,
  // which un-hides it on the backend (see route.ts).
  const filteredBank = questions.filter((q) => {
    const inVisibleExam = visibleExamQuestions.some((eq) => eq.question.id === q.id);
    return !inVisibleExam && (!bankFilter || q.lessonTag === bankFilter);
  });

  const minDatetimeLocal = toDatetimeLocal(new Date());

  return (
    <>
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-border gap-2 flex-wrap">
          <h2
            className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
            style={{ fontFamily: font }}
          >
            <ClipboardList size={14} className="text-accent sm:hidden" />
            <ClipboardList size={16} className="text-accent hidden sm:block" />
            {t.tabExams} ({lessons.length})
          </h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl gradient-primary text-white text-[10px] sm:text-xs font-bold shadow hover:opacity-90 active:scale-95 transition-all"
            style={{ fontFamily: font }}
          >
            <Plus size={13} className="sm:hidden" />
            <Plus size={14} className="hidden sm:block" />
            {t.addExam}
          </button>
        </div>

        {loading ? (
          <div className="py-12 sm:py-16 flex justify-center">
            <Loader2 size={24} className="animate-spin text-primary sm:hidden" />
            <Loader2 size={28} className="animate-spin text-primary hidden sm:block" />
          </div>
        ) : lessons.length === 0 ? (
          <div className="py-12 sm:py-16 flex flex-col items-center gap-2 sm:gap-3">
            <ClipboardList size={32} className="text-muted-foreground/30 sm:hidden" />
            <ClipboardList size={40} className="text-muted-foreground/30 hidden sm:block" />
            <p className="text-muted-foreground text-xs sm:text-sm" style={{ fontFamily: font }}>
              {t.noExams}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 hover:bg-muted/20 transition-colors flex-wrap sm:flex-nowrap"
              >
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground w-4 sm:w-5 text-center">
                  {lesson.order}
                </span>
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={18} className="text-accent sm:hidden" />
                  <ClipboardList size={22} className="text-accent hidden sm:block" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-foreground text-xs sm:text-sm truncate"
                    style={{ fontFamily: font }}
                  >
                    {lesson.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-0.5">
                    {lesson.exam?.durationMinutes && (
                      <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />
                        {lesson.exam.durationMinutes} {t.minutes}
                      </span>
                    )}
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                      <Award size={10} />
                      {lesson.exam?.passingScore ?? 50}% {t.passing}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                      <HelpCircle size={10} />
                      {lesson.exam?.examQuestions.filter((eq) => eq.isVisible).length ?? 0}{' '}
                      {t.questions}
                    </span>
                  </div>
                </div>

                <ScheduleBadge
                  scheduledAt={lesson.exam?.scheduledAt}
                  t={t}
                  lang={lang}
                  font={font}
                />

                <span
                  className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${lesson.isVisible ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}
                  style={{ fontFamily: font }}
                >
                  {lesson.isVisible ? (
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
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      setManageLesson(lesson);
                      setSelectedBankIds(new Set());
                      setBankFilter('');
                      setMarkDrafts({});
                    }}
                    title={t.manageQuestions}
                    className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/10 hover:text-secondary transition-colors"
                  >
                    <HelpCircle size={13} />
                  </button>
                  <button
                    onClick={() => openEdit(lesson)}
                    className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => toggleVis(lesson)}
                    className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-orange-50 hover:text-orange-500 transition-colors"
                  >
                    {lesson.isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(lesson)}
                    className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add / Edit Exam Modal ── */}
      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          title={editLesson ? t.editExam : t.addExam}
          font={font}
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            <Field label={t.examName} font={font}>
              <Inp
                value={form.title}
                onChange={(v) => f('title', v)}
                placeholder={t.examNamePlaceholder}
                dir={isRtl ? 'rtl' : 'ltr'}
              />
            </Field>

            <Field label={t.durationMinutes} font={font}>
              <Inp
                type="number"
                min="1"
                value={form.durationMinutes}
                onChange={(v) => f('durationMinutes', v)}
                placeholder="60"
                dir="ltr"
              />
            </Field>

            <Field label={t.passingScore} font={font}>
              <Inp
                type="number"
                min="1"
                value={form.passingScore}
                onChange={(v) => f('passingScore', v)}
                placeholder="50"
                dir="ltr"
              />
            </Field>

            <Field label={t.scheduleLabel} hint={t.scheduleHint} font={font}>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <button
                  type="button"
                  onClick={() => setScheduledValue(null)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl border text-[10px] sm:text-xs font-bold transition-all ${scheduledValue === null ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
                  style={{ fontFamily: font }}
                >
                  <CalendarCheck2 size={13} />
                  {t.scheduleNow}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (scheduledValue === null) {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(8, 0, 0, 0);
                      setScheduledValue(toDatetimeLocal(tomorrow));
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl border text-[10px] sm:text-xs font-bold transition-all ${scheduledValue !== null ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
                  style={{ fontFamily: font }}
                >
                  <CalendarClock size={13} />
                  {t.scheduleLater}
                </button>
              </div>

              {scheduledValue !== null && (
                <div className="flex flex-col gap-2">
                  <input
                    type="datetime-local"
                    value={scheduledValue}
                    min={minDatetimeLocal}
                    onChange={(e) => setScheduledValue(e.target.value || null)}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    dir="ltr"
                  />
                  {scheduledValue && (
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <p
                        className="text-[10px] sm:text-xs text-primary font-semibold flex items-center gap-1"
                        style={{ fontFamily: font }}
                      >
                        <CalendarClock size={11} />
                        {formatScheduledAt(new Date(scheduledValue).toISOString(), lang)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setScheduledValue(null)}
                        className="text-[10px] sm:text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1 transition-colors"
                        style={{ fontFamily: font }}
                      >
                        <CalendarX2 size={11} />
                        {t.clearSchedule}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Field>
          </div>

          <ActionButtons
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            saving={saving}
            font={font}
            t={t}
          />
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)} title={t.delete} font={font}>
          <p
            className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6"
            style={{ fontFamily: font }}
          >
            {t.confirmDelete}{' '}
            <span className="font-bold text-foreground">{deleteTarget.title}</span>؟
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-bold transition-all"
              style={{ fontFamily: font }}
            >
              {t.confirmDeleteBtn}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Manage Questions Modal ── */}
      {currentManage && (
        <Modal
          onClose={() => setManageLesson(null)}
          title={`${t.manageQuestions} — ${currentManage.title}`}
          font={font}
          wide
        >
          <div className="flex flex-col gap-4 sm:gap-5">
            <div>
              <h3
                className="text-xs sm:text-sm font-bold text-foreground mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 flex-wrap"
                style={{ fontFamily: font }}
              >
                <ClipboardList size={13} className="text-accent" />
                {t.examHasQuestions} ({visibleExamQuestions.length})
                {!!visibleExamQuestions.length && (
                  <span
                    className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold"
                    style={{ fontFamily: font }}
                  >
                    {t.totalMarks}: {visibleExamQuestions.reduce((sum, eq) => sum + eq.mark, 0)}
                  </span>
                )}
              </h3>
              {!visibleExamQuestions.length ? (
                <div className="rounded-xl border border-dashed border-border py-5 sm:py-6 text-center">
                  <AlertCircle
                    size={20}
                    className="text-muted-foreground/30 mx-auto mb-1.5 sm:mb-2"
                  />
                  <p
                    className="text-[10px] sm:text-xs text-muted-foreground"
                    style={{ fontFamily: font }}
                  >
                    {t.noExamQuestions}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {visibleExamQuestions.map((eq, idx) => (
                    <div
                      key={eq.id}
                      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-card hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleReorderEQ(currentManage.id, eq.id, 'up')}
                          disabled={idx === 0}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                        >
                          <ChevronUp size={11} />
                        </button>
                        <button
                          onClick={() => handleReorderEQ(currentManage.id, eq.id, 'down')}
                          disabled={idx === visibleExamQuestions.length - 1}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                        >
                          <ChevronDown size={11} />
                        </button>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-muted-foreground w-3.5 sm:w-4">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[10px] sm:text-xs font-semibold text-foreground truncate"
                          style={{ fontFamily: font }}
                        >
                          {eq.question.text}
                        </p>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {eq.question.lessonTag}
                        </span>
                      </div>
                      <QTypeBadge type={eq.question.type} t={t} font={font} />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <input
                          type="number"
                          min={1}
                          value={markDrafts[eq.id] ?? String(eq.mark)}
                          onChange={(e) =>
                            setMarkDrafts((prev) => ({ ...prev, [eq.id]: e.target.value }))
                          }
                          onBlur={(e) => {
                            const parsed = Number(e.target.value);
                            const safe = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
                            setMarkDrafts((prev) => {
                              const next = { ...prev };
                              delete next[eq.id];
                              return next;
                            });
                            if (safe !== eq.mark) {
                              handleUpdateMark(currentManage.id, eq.id, safe);
                            }
                          }}
                          className="w-12 sm:w-14 text-[10px] sm:text-xs text-center py-1 rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                          title={t.markLabel}
                          style={{ fontFamily: font }}
                        />
                        <span
                          className="text-[10px] sm:text-xs text-muted-foreground"
                          style={{ fontFamily: font }}
                        >
                          {t.markUnit}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveEQ(currentManage.id, eq.id)}
                        className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ✅ NEW: hidden questions — kept for grading history, grayed
                  out, not reorderable/editable/removable-again. Re-selecting
                  the same question in "Add from bank" below un-hides it. */}
              {hiddenExamQuestions.length > 0 && (
                <div className="mt-2.5 sm:mt-3 rounded-xl border border-dashed border-border overflow-hidden divide-y divide-border opacity-60">
                  {hiddenExamQuestions.map((eq) => (
                    <div
                      key={eq.id}
                      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-muted/20"
                      title={t.hiddenQuestionHint}
                    >
                      <EyeOff size={12} className="text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[10px] sm:text-xs font-semibold text-foreground truncate line-through"
                          style={{ fontFamily: font }}
                        >
                          {eq.question.text}
                        </p>
                        <span
                          className="text-[10px] sm:text-xs text-muted-foreground"
                          style={{ fontFamily: font }}
                        >
                          {t.hiddenQuestionHint}
                        </span>
                      </div>
                      <span
                        className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold flex-shrink-0"
                        style={{ fontFamily: font }}
                      >
                        {t.hiddenQuestionBadge}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3
                className="text-xs sm:text-sm font-bold text-foreground mb-1 flex items-center gap-1.5 sm:gap-2"
                style={{ fontFamily: font }}
              >
                <HelpCircle size={13} className="text-secondary" />
                {t.addFromBank}
              </h3>
              <p
                className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2 flex items-center gap-1"
                style={{ fontFamily: font }}
              >
                <FileText size={10} className="text-amber-500" /> {t.essayExcluded}
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                <select
                  value={bankFilter}
                  onChange={(e) => setBankFilter(e.target.value)}
                  className="text-[10px] sm:text-xs py-1 sm:py-1.5 px-2 sm:px-3 rounded-xl border border-border bg-background text-foreground outline-none flex-1"
                  style={{ fontFamily: font }}
                >
                  <option value="">{t.allTags}</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                {selectedBankIds.size > 0 && (
                  <button
                    onClick={handleAddFromBank}
                    disabled={addingQs}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl gradient-primary text-white text-[10px] sm:text-xs font-bold shadow hover:opacity-90 active:scale-95 transition-all"
                    style={{ fontFamily: font }}
                  >
                    {addingQs ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    {t.addSelected} ({selectedBankIds.size})
                  </button>
                )}
              </div>
              {filteredBank.length === 0 ? (
                <p
                  className="text-[10px] sm:text-xs text-muted-foreground py-3 sm:py-4 text-center"
                  style={{ fontFamily: font }}
                >
                  {t.noQuestions}
                </p>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border max-h-52 sm:max-h-60 overflow-y-auto">
                  {filteredBank.map((q) => {
                    const selected = selectedBankIds.has(q.id);
                    const wasHidden = hiddenExamQuestions.some((eq) => eq.question.id === q.id);
                    return (
                      <button
                        key={q.id}
                        onClick={() =>
                          setSelectedBankIds((prev) => {
                            const next = new Set(prev);
                            selected ? next.delete(q.id) : next.add(q.id);
                            return next;
                          })
                        }
                        className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-muted/20'}`}
                        title={wasHidden ? t.unhideOnReadd : undefined}
                      >
                        <div
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${selected ? 'border-primary bg-primary' : 'border-border'}`}
                        >
                          {selected && <Check size={9} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0 text-start">
                          <p
                            className="text-[10px] sm:text-xs font-semibold text-foreground truncate"
                            style={{ fontFamily: font }}
                          >
                            {q.text}
                          </p>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {q.lessonTag}
                          </span>
                        </div>
                        {wasHidden && (
                          <span
                            className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold flex-shrink-0"
                            style={{ fontFamily: font }}
                          >
                            {t.hiddenQuestionBadge}
                          </span>
                        )}
                        <QTypeBadge type={q.type} t={t} font={font} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-3 sm:pt-4 border-t border-border mt-3 sm:mt-4">
            <button
              onClick={() => setManageLesson(null)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT TAB — unified reordering across videos + unscheduled exams,
// with scheduled exams kept in their own independent section
// ═══════════════════════════════════════════════════════════════
function LayoutTab({
  courseId,
  lessons,
  loading,
  onRefresh,
  lang,
  t,
  font,
}: {
  courseId: number;
  lessons: Lesson[];
  loading: boolean;
  onRefresh: () => void;
  lang: 'ar' | 'en';
  t: TType;
  font?: string;
}) {
  const reorder = async (l: Lesson, dir: 'up' | 'down') => {
    await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: l.id, action: 'reorder', direction: dir, courseId }),
    });
    onRefresh();
  };

  const sequence = lessons
    .filter((l) => l.type === 'video' || (l.type === 'exam' && !l.exam?.scheduledAt))
    .sort((a, b) => a.order - b.order);

  const scheduled = lessons
    .filter((l) => l.type === 'exam' && !!l.exam?.scheduledAt)
    .sort((a, b) => a.order - b.order);

  const Row = ({ lesson, list }: { lesson: Lesson; list: Lesson[] }) => {
    const idx = list.findIndex((l) => l.id === lesson.id);
    return (
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 hover:bg-muted/20 transition-colors">
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button
            onClick={() => reorder(lesson, 'up')}
            disabled={idx === 0}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
          >
            <ChevronUp size={13} />
          </button>
          <button
            onClick={() => reorder(lesson, 'down')}
            disabled={idx === list.length - 1}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
          >
            <ChevronDown size={13} />
          </button>
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-muted-foreground w-4 sm:w-5 text-center">
          {idx + 1}
        </span>
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          {lesson.type === 'video' ? (
            <Video size={15} className="text-primary" />
          ) : (
            <ClipboardList size={15} className="text-accent" />
          )}
        </div>
        <p
          className="flex-1 min-w-0 font-semibold text-foreground text-xs sm:text-sm truncate"
          style={{ fontFamily: font }}
        >
          {lesson.title}
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border">
          <h2
            className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
            style={{ fontFamily: font }}
          >
            <ListOrdered size={15} className="text-primary" />
            {t.layoutMainSequence}
          </h2>
          <p
            className="text-[10px] sm:text-xs text-muted-foreground mt-1"
            style={{ fontFamily: font }}
          >
            {t.layoutMainSequenceHint}
          </p>
        </div>
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : sequence.length === 0 ? (
          <p
            className="py-10 text-center text-xs sm:text-sm text-muted-foreground"
            style={{ fontFamily: font }}
          >
            {t.noLessonsInSequence}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {sequence.map((lesson) => (
              <Row key={lesson.id} lesson={lesson} list={sequence} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border">
          <h2
            className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
            style={{ fontFamily: font }}
          >
            <CalendarClock size={15} className="text-blue-500" />
            {t.layoutScheduledSection}
          </h2>
          <p
            className="text-[10px] sm:text-xs text-muted-foreground mt-1"
            style={{ fontFamily: font }}
          >
            {t.layoutScheduledHint}
          </p>
        </div>
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : scheduled.length === 0 ? (
          <p
            className="py-10 text-center text-xs sm:text-sm text-muted-foreground"
            style={{ fontFamily: font }}
          >
            {t.noScheduledExams}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {scheduled.map((lesson) => (
              <Row key={lesson.id} lesson={lesson} list={scheduled} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
