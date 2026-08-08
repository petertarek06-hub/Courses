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
  Filter,
  Clock,
  AlertCircle,
  Check,
  HelpCircle,
  FileText,
  CalendarClock,
  ListOrdered,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminLang } from '../../../Adminshell';

// ─── Types ────────────────────────────────────────────────────
interface Topic {
  id: number;
  name: string;
  order: number;
}
interface QuestionBank {
  id: number;
  text: string;
  type: 'mcq' | 'true_false' | 'essay';
  optionsJson: string;
  correctAnswer: string;
  topicId: number;
  topic: Topic;
  courseId: number;
}
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
  // Note: lesson-linked exams are never date/time scheduled — that concept
  // belongs solely to ScheduledExam (course-level, decoupled from units).
  examQuestions: ExamQuestion[];
}
interface Lesson {
  id: number;
  title: string;
  order: number;
  isVisible: boolean;
  type: 'video' | 'exam';
  unitId: number;
  video: VideoRecord | null;
  exam: ExamRecord | null;
}
interface Unit {
  id: number;
  title: string;
  order: number;
  isVisible: boolean;
  lessons: Lesson[];
}

// ─── i18n ─────────────────────────────────────────────────────
const T = {
  ar: {
    back: 'العودة للكورسات',
    pageTitle: 'إدارة محتوى الكورس',
    addUnit: 'إضافة وحدة',
    renameUnit: 'إعادة تسمية الوحدة',
    unitTitleLabel: 'عنوان الوحدة',
    unitTitlePlaceholder: 'مثال: الوحدة الأولى — الأعداد',
    noUnits: 'لا توجد وحدات بعد — أضف وحدة لتبدأ',
    confirmDeleteUnit: 'هل أنت متأكد من حذف هذه الوحدة؟',
    unitHasLessonsError: 'يجب نقل أو حذف دروس هذه الوحدة أولاً',
    noLessonsInUnit: 'لا توجد دروس في هذه الوحدة بعد',
    addVideo: 'إضافة فيديو',
    addQuiz: 'إضافة اختبار',
    editVideo: 'تعديل الفيديو',
    titleLabel: 'عنوان الدرس',
    vimeoId: 'Vimeo ID',
    vimeoHint: 'الرقم من رابط الفيديو: vimeo.com/123456789',
    description: 'وصف الفيديو (اختياري)',
    descriptionPlaceholder: 'وصف مختصر لمحتوى الفيديو...',
    manage: 'إدارة',
    quizSettings: 'إعدادات الاختبار',
    examName: 'اسم الاختبار',
    examNamePlaceholder: 'مثال: اختبار الفصل الأول',
    durationMinutes: 'مدة الاختبار (دقيقة) — اختياري',
    passingScore: 'درجة النجاح (%)',
    saveSettings: 'حفظ الإعدادات',
    examQuestionsSection: 'أسئلة الاختبار',
    totalMarks: 'إجمالي الدرجات',
    markUnit: 'درجة',
    markLabel: 'الدرجة',
    noExamQuestions: 'لا توجد أسئلة في هذا الاختبار بعد',
    hiddenQuestionBadge: 'مخفي',
    hiddenQuestionHint: 'تمت إجابة الطلاب على هذا السؤال، فتم إخفاؤه بدلاً من حذفه',
    questionHiddenToast: 'لا يمكن حذف هذا السؤال لأن طلابًا أجابوا عليه، فتم إخفاؤه بدلاً من ذلك',
    unhideOnReadd: 'إعادة إضافته سيُظهره للطلاب مجددًا',
    addFromBankSection: 'إضافة من بنك الأسئلة',
    allTopics: 'جميع المواضيع',
    addSelected: 'إضافة المحدد',
    essayExcluded: '(الأسئلة المقالية مُستبعدة من الاختبارات التلقائية)',
    noQuestionsInBank: 'لا توجد أسئلة مطابقة في البنك',
    newQuestionSection: 'إنشاء سؤال جديد',
    newQuestionToggle: '+ سؤال جديد',
    questionText: 'نص السؤال',
    questionType: 'نوع السؤال',
    mcq: 'اختيار من متعدد',
    trueFalse: 'صح أم خطأ',
    essay: 'مقالي (يصحح يدويًا)',
    topicLabel: 'الموضوع',
    selectTopicPlaceholder: 'اختر موضوعًا',
    newTopicPlaceholder: 'أو أضف موضوعًا جديدًا...',
    addTopicBtn: 'إضافة',
    noTopicsYet: 'لا توجد مواضيع بعد — أضف واحدًا أدناه',
    options: 'الخيارات',
    option: 'خيار',
    correctAnswer: 'الإجابة الصحيحة',
    gradingNotes: 'تعليمات التصحيح (اختياري)',
    gradingNotesPlaceholder: 'مثال: يجب أن يذكر الطالب ثلاثة عوامل على الأقل...',
    essayNote: 'سؤال مقالي — يُصحَّح يدويًا ولا يمكن إضافته للاختبارات التلقائية',
    addOption: 'إضافة خيار',
    true: 'صح',
    false: 'خطأ',
    createQuestion: 'إنشاء السؤال',
    createAndAdd: 'إنشاء وإضافة للاختبار',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    delete: 'حذف',
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
    minutes: 'دقيقة',
    questions: 'سؤال',
    lessonsCount: 'درس',
  },
  en: {
    back: 'Back to Courses',
    pageTitle: 'Manage Course Content',
    addUnit: 'Add Unit',
    renameUnit: 'Rename Unit',
    unitTitleLabel: 'Unit Title',
    unitTitlePlaceholder: 'e.g. Unit 1 — Numbers',
    noUnits: 'No units yet — add one to get started',
    confirmDeleteUnit: 'Are you sure you want to delete this unit?',
    unitHasLessonsError: "Move or delete this unit's lessons first",
    noLessonsInUnit: 'No lessons in this unit yet',
    addVideo: 'Add Video',
    addQuiz: 'Add Quiz',
    editVideo: 'Edit Video',
    titleLabel: 'Lesson Title',
    vimeoId: 'Vimeo ID',
    vimeoHint: 'Number from the video URL: vimeo.com/123456789',
    description: 'Video description — optional',
    descriptionPlaceholder: 'A short description of the video content...',
    manage: 'Manage',
    quizSettings: 'Quiz Settings',
    examName: 'Quiz Name',
    examNamePlaceholder: 'e.g. First Term Quiz',
    durationMinutes: 'Duration (minutes) — optional',
    passingScore: 'Passing score (%)',
    saveSettings: 'Save Settings',
    examQuestionsSection: 'Quiz Questions',
    totalMarks: 'Total marks',
    markUnit: 'pts',
    markLabel: 'Mark',
    noExamQuestions: 'No questions in this quiz yet',
    hiddenQuestionBadge: 'Hidden',
    hiddenQuestionHint:
      'Students already answered this question, so it was hidden instead of deleted',
    questionHiddenToast:
      "Can't delete — students already answered this question, so it was hidden instead",
    unhideOnReadd: 'Re-adding it will make it visible to students again',
    addFromBankSection: 'Add from Question Bank',
    allTopics: 'All topics',
    addSelected: 'Add selected',
    essayExcluded: '(Essay questions are excluded from auto-graded quizzes)',
    noQuestionsInBank: 'No matching questions in the bank',
    newQuestionSection: 'Create a New Question',
    newQuestionToggle: '+ New question',
    questionText: 'Question text',
    questionType: 'Question type',
    mcq: 'Multiple choice',
    trueFalse: 'True / False',
    essay: 'Essay (manually graded)',
    topicLabel: 'Topic',
    selectTopicPlaceholder: 'Select a topic',
    newTopicPlaceholder: 'Or add a new topic...',
    addTopicBtn: 'Add',
    noTopicsYet: 'No topics yet — add one below',
    options: 'Options',
    option: 'Option',
    correctAnswer: 'Correct answer',
    gradingNotes: 'Grading notes (optional)',
    gradingNotesPlaceholder: 'e.g. Student must mention at least three factors...',
    essayNote: 'Essay question — graded manually. Cannot be added to auto-graded quizzes.',
    addOption: 'Add option',
    true: 'True',
    false: 'False',
    createQuestion: 'Create Question',
    createAndAdd: 'Create & Add to Quiz',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    delete: 'Delete',
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
    minutes: 'min',
    questions: 'questions',
    lessonsCount: 'lessons',
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
            <X size={18} />
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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: string;
  type?: string;
  min?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      min={min}
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
  saveLabel,
}: {
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  font?: string;
  t: TType;
  saveLabel?: string;
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
        {saving ? <Loader2 size={14} className="animate-spin" /> : (saveLabel ?? t.save)}
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

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function AdminCourseLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const courseId = Number(id);
  const router = useRouter();
  const { lang, isRtl } = useAdminLang();
  const t = T[lang];
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [units, setUnits] = useState<Unit[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<QuestionBank[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);

  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [savingUnit, setSavingUnit] = useState(false);

  const fetchUnits = useCallback(() => {
    setLoadingUnits(true);
    fetch(`/api/admin/units?courseId=${courseId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setUnits)
      .catch(() => toast.error(t.errorLoad))
      .finally(() => setLoadingUnits(false));
  }, [courseId, t.errorLoad]);

  const fetchTopics = useCallback(() => {
    fetch(`/api/admin/topics?courseId=${courseId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setTopics)
      .catch(() => toast.error(t.errorLoad));
  }, [courseId, t.errorLoad]);

  const fetchQuestions = useCallback(() => {
    fetch(`/api/admin/questions?courseId=${courseId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setQuestions)
      .catch(() => toast.error(t.errorLoad));
  }, [courseId, t.errorLoad]);

  useEffect(() => {
    fetchUnits();
    fetchTopics();
    fetchQuestions();
  }, [fetchUnits, fetchTopics, fetchQuestions]);

  const sortedUnits = [...units].sort((a, b) => a.order - b.order);

  const handleAddUnit = async () => {
    if (!newUnitTitle.trim()) {
      toast.error(t.missingFields);
      return;
    }
    setSavingUnit(true);
    await fetch('/api/admin/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, title: newUnitTitle }),
    });
    toast.success(t.addedOk);
    setSavingUnit(false);
    setShowAddUnit(false);
    setNewUnitTitle('');
    fetchUnits();
  };

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
        <button
          onClick={() => router.push('/admin/courses')}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontFamily: font }}
        >
          <ArrowRight size={16} className={isRtl ? '' : 'rotate-180'} />
          {t.back}
        </button>
        <span className="text-muted-foreground">/</span>
        <h1
          className="text-lg sm:text-xl font-extrabold text-foreground flex-1"
          style={{ fontFamily: font }}
        >
          {t.pageTitle}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/admin/courses/${courseId}/scheduled-exams`)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-foreground text-xs sm:text-sm font-bold hover:bg-muted transition-all"
            style={{ fontFamily: font }}
          >
            <CalendarClock size={15} />
            {isRtl ? 'الامتحانات المجدولة' : 'Scheduled Exams'}
          </button>
          <button
            onClick={() => setShowAddUnit(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all"
            style={{ fontFamily: font }}
          >
            <Plus size={15} />
            {t.addUnit}
          </button>
        </div>
      </div>

      {loadingUnits ? (
        <div className="py-16 flex justify-center">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : sortedUnits.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 bg-card rounded-2xl border border-dashed border-border">
          <ListOrdered size={36} className="text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
            {t.noUnits}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-5">
          {sortedUnits.map((unit, idx) => (
            <UnitCard
              key={unit.id}
              courseId={courseId}
              unit={unit}
              isFirst={idx === 0}
              isLast={idx === sortedUnits.length - 1}
              topics={topics}
              questions={questions}
              onRefreshUnits={fetchUnits}
              onRefreshTopics={fetchTopics}
              onRefreshQuestions={fetchQuestions}
              lang={lang}
              t={t}
              font={font}
            />
          ))}
        </div>
      )}

      {showAddUnit && (
        <Modal onClose={() => setShowAddUnit(false)} title={t.addUnit} font={font}>
          <Field label={t.unitTitleLabel} font={font}>
            <Inp
              value={newUnitTitle}
              onChange={setNewUnitTitle}
              placeholder={t.unitTitlePlaceholder}
              dir={isRtl ? 'rtl' : 'ltr'}
            />
          </Field>
          <ActionButtons
            onClose={() => setShowAddUnit(false)}
            onSave={handleAddUnit}
            saving={savingUnit}
            font={font}
            t={t}
          />
        </Modal>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// UNIT CARD — header (rename/reorder/visibility/delete) + inline lessons
// ═══════════════════════════════════════════════════════════════
function UnitCard({
  courseId,
  unit,
  isFirst,
  isLast,
  topics,
  questions,
  onRefreshUnits,
  onRefreshTopics,
  onRefreshQuestions,
  lang,
  t,
  font,
}: {
  courseId: number;
  unit: Unit;
  isFirst: boolean;
  isLast: boolean;
  topics: Topic[];
  questions: QuestionBank[];
  onRefreshUnits: () => void;
  onRefreshTopics: () => void;
  onRefreshQuestions: () => void;
  lang: 'ar' | 'en';
  t: TType;
  font?: string;
}) {
  const isRtl = lang === 'ar';
  const [renaming, setRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(unit.title);
  const [savingRename, setSavingRename] = useState(false);
  const [deletingUnit, setDeletingUnit] = useState(false);

  const [videoModal, setVideoModal] = useState<{ mode: 'add' | 'edit'; lesson?: Lesson } | null>(
    null
  );
  const [addQuizModal, setAddQuizModal] = useState(false);
  const [manageLesson, setManageLesson] = useState<Lesson | null>(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<Lesson | null>(null);

  const lessons = [...unit.lessons].sort((a, b) => a.order - b.order);

  const reorderUnit = async (dir: 'up' | 'down') => {
    await fetch('/api/admin/units', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: unit.id, action: 'reorder', direction: dir }),
    });
    onRefreshUnits();
  };

  const toggleUnitVis = async () => {
    await fetch('/api/admin/units', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: unit.id, action: 'toggleVisibility' }),
    });
    onRefreshUnits();
  };

  const handleRename = async () => {
    if (!titleInput.trim()) {
      toast.error(t.missingFields);
      return;
    }
    setSavingRename(true);
    await fetch('/api/admin/units', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: unit.id, action: 'rename', title: titleInput }),
    });
    toast.success(t.updatedOk);
    setSavingRename(false);
    setRenaming(false);
    onRefreshUnits();
  };

  const handleDeleteUnit = async () => {
    const res = await fetch('/api/admin/units', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: unit.id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || t.unitHasLessonsError);
      setDeletingUnit(false);
      return;
    }
    toast.success(t.deletedOk);
    setDeletingUnit(false);
    onRefreshUnits();
  };

  const reorderLesson = async (lessonId: number, dir: 'up' | 'down') => {
    await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lessonId, action: 'reorder', direction: dir }),
    });
    onRefreshUnits();
  };

  const toggleLessonVis = async (lessonId: number) => {
    await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lessonId, action: 'toggleVisibility' }),
    });
    onRefreshUnits();
  };

  const handleDeleteLesson = async () => {
    if (!deleteLessonTarget) return;
    await fetch('/api/admin/lessons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteLessonTarget.id }),
    });
    toast.success(t.deletedOk);
    setDeleteLessonTarget(null);
    onRefreshUnits();
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* ── Unit header ── */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 border-b border-border bg-muted/20 flex-wrap">
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button
            onClick={() => reorderUnit('up')}
            disabled={isFirst}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
          >
            <ChevronUp size={13} />
          </button>
          <button
            onClick={() => reorderUnit('down')}
            disabled={isLast}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
          >
            <ChevronDown size={13} />
          </button>
        </div>
        <h2
          className="font-bold text-foreground text-sm sm:text-base flex-1 min-w-0 truncate"
          style={{ fontFamily: font }}
        >
          {unit.title}
        </h2>
        <span
          className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold flex-shrink-0"
          style={{ fontFamily: font }}
        >
          {lessons.length} {t.lessonsCount}
        </span>
        <span
          className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${unit.isVisible ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}
          style={{ fontFamily: font }}
        >
          {unit.isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
          {unit.isVisible ? t.visible : t.hidden}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setVideoModal({ mode: 'add' })}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-border text-[10px] sm:text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
            style={{ fontFamily: font }}
          >
            <Video size={12} /> {t.addVideo}
          </button>
          <button
            onClick={() => setAddQuizModal(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-border text-[10px] sm:text-xs font-bold text-accent hover:bg-accent/10 transition-colors"
            style={{ fontFamily: font }}
          >
            <ClipboardList size={12} /> {t.addQuiz}
          </button>
          <button
            onClick={() => setRenaming(true)}
            className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={toggleUnitVis}
            className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-orange-50 hover:text-orange-500 transition-colors"
          >
            {unit.isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button
            onClick={() => setDeletingUnit(true)}
            className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* ── Lessons list ── */}
      {lessons.length === 0 ? (
        <p
          className="py-8 text-center text-xs sm:text-sm text-muted-foreground"
          style={{ fontFamily: font }}
        >
          {t.noLessonsInUnit}
        </p>
      ) : (
        <div className="divide-y divide-border">
          {lessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5 hover:bg-muted/20 transition-colors flex-wrap sm:flex-nowrap"
            >
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => reorderLesson(lesson.id, 'up')}
                  disabled={idx === 0}
                  className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => reorderLesson(lesson.id, 'down')}
                  disabled={idx === lessons.length - 1}
                  className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground w-4 sm:w-5 text-center flex-shrink-0">
                {idx + 1}
              </span>

              {lesson.type === 'video' ? (
                lesson.video ? (
                  <img
                    src={`https://vumbnail.com/${lesson.video.vimeoId}.jpg`}
                    alt={lesson.title}
                    className="w-12 h-8 sm:w-16 sm:h-10 rounded-lg object-cover flex-shrink-0 border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-8 sm:w-16 sm:h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Video size={14} className="text-muted-foreground" />
                  </div>
                )
              ) : (
                <div className="w-12 h-8 sm:w-16 sm:h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={16} className="text-accent" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-foreground text-xs sm:text-sm truncate"
                  style={{ fontFamily: font }}
                >
                  {lesson.title}
                </p>
                {lesson.type === 'exam' && (
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                    {lesson.exam?.durationMinutes && (
                      <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5">
                        <Clock size={10} /> {lesson.exam.durationMinutes} {t.minutes}
                      </span>
                    )}
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5">
                      <HelpCircle size={10} />
                      {lesson.exam?.examQuestions.filter((eq) => eq.isVisible).length ?? 0}{' '}
                      {t.questions}
                    </span>
                  </div>
                )}
              </div>

              <span
                className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${lesson.isVisible ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}
                style={{ fontFamily: font }}
              >
                {lesson.isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
                {lesson.isVisible ? t.visible : t.hidden}
              </span>

              <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                {lesson.type === 'exam' ? (
                  <button
                    onClick={() => setManageLesson(lesson)}
                    title={t.manage}
                    className="flex items-center gap-1 p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/10 hover:text-secondary transition-colors"
                  >
                    <Settings size={13} />
                  </button>
                ) : (
                  <button
                    onClick={() => setVideoModal({ mode: 'edit', lesson })}
                    className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                )}
                <button
                  onClick={() => toggleLessonVis(lesson.id)}
                  className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-orange-50 hover:text-orange-500 transition-colors"
                >
                  {lesson.isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button
                  onClick={() => setDeleteLessonTarget(lesson)}
                  className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Rename unit modal ── */}
      {renaming && (
        <Modal onClose={() => setRenaming(false)} title={t.renameUnit} font={font}>
          <Field label={t.unitTitleLabel} font={font}>
            <Inp value={titleInput} onChange={setTitleInput} dir={isRtl ? 'rtl' : 'ltr'} />
          </Field>
          <ActionButtons
            onClose={() => setRenaming(false)}
            onSave={handleRename}
            saving={savingRename}
            font={font}
            t={t}
          />
        </Modal>
      )}

      {/* ── Delete unit confirm ── */}
      {deletingUnit && (
        <Modal onClose={() => setDeletingUnit(false)} title={t.delete} font={font}>
          <p
            className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6"
            style={{ fontFamily: font }}
          >
            {t.confirmDeleteUnit}
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeletingUnit(false)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleDeleteUnit}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-bold transition-all"
              style={{ fontFamily: font }}
            >
              {t.confirmDeleteBtn}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete lesson confirm ── */}
      {deleteLessonTarget && (
        <Modal onClose={() => setDeleteLessonTarget(null)} title={t.delete} font={font}>
          <p
            className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6"
            style={{ fontFamily: font }}
          >
            {t.confirmDelete}{' '}
            <span className="font-bold text-foreground">{deleteLessonTarget.title}</span>؟
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteLessonTarget(null)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleDeleteLesson}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-bold transition-all"
              style={{ fontFamily: font }}
            >
              {t.confirmDeleteBtn}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Add / Edit video modal ── */}
      {videoModal && (
        <VideoModal
          courseId={courseId}
          unitId={unit.id}
          mode={videoModal.mode}
          lesson={videoModal.lesson}
          onClose={() => setVideoModal(null)}
          onSaved={onRefreshUnits}
          lang={lang}
          t={t}
          font={font}
        />
      )}

      {/* ── Add quiz modal (settings only — questions added via Manage after) ── */}
      {addQuizModal && (
        <AddQuizModal
          courseId={courseId}
          unitId={unit.id}
          onClose={() => setAddQuizModal(false)}
          onSaved={onRefreshUnits}
          lang={lang}
          t={t}
          font={font}
        />
      )}

      {/* ── Manage quiz modal — settings + question bank + topics, all in one ── */}
      {manageLesson && (
        <ExamManageModal
          courseId={courseId}
          lesson={manageLesson}
          topics={topics}
          questions={questions}
          onClose={() => setManageLesson(null)}
          onRefreshUnits={onRefreshUnits}
          onRefreshTopics={onRefreshTopics}
          onRefreshQuestions={onRefreshQuestions}
          lang={lang}
          t={t}
          font={font}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VIDEO MODAL — add or edit (stays inside the unit it was opened from)
// ═══════════════════════════════════════════════════════════════
function VideoModal({
  courseId,
  unitId,
  mode,
  lesson,
  onClose,
  onSaved,
  lang,
  t,
  font,
}: {
  courseId: number;
  unitId: number;
  mode: 'add' | 'edit';
  lesson?: Lesson;
  onClose: () => void;
  onSaved: () => void;
  lang: 'ar' | 'en';
  t: TType;
  font?: string;
}) {
  const isRtl = lang === 'ar';
  const [form, setForm] = useState({
    title: lesson?.title ?? '',
    vimeoId: lesson?.video?.vimeoId ?? '',
    description: lesson?.video?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.title || !form.vimeoId) {
      toast.error(t.missingFields);
      return;
    }
    setSaving(true);
    try {
      if (mode === 'edit' && lesson) {
        await fetch('/api/admin/lessons', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: lesson.id, action: 'updateVideo', ...form }),
        });
        toast.success(t.updatedOk);
      } else {
        await fetch('/api/admin/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, unitId, type: 'video', ...form }),
        });
        toast.success(t.addedOk);
      }
      onSaved();
      onClose();
    } catch {
      toast.error(t.missingFields);
    }
    setSaving(false);
  };

  return (
    <Modal onClose={onClose} title={mode === 'edit' ? t.editVideo : t.addVideo} font={font}>
      <div className="flex flex-col gap-2.5 sm:gap-3">
        <Field label={t.titleLabel} font={font}>
          <Inp
            value={form.title}
            onChange={(v) => f('title', v)}
            placeholder={lang === 'ar' ? 'مثال: مقدمة في الجبر' : 'e.g. Introduction to Algebra'}
            dir={isRtl ? 'rtl' : 'ltr'}
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
            dir={isRtl ? 'rtl' : 'ltr'}
            rows={3}
          />
        </Field>
      </div>
      <ActionButtons onClose={onClose} onSave={handleSave} saving={saving} font={font} t={t} />
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADD QUIZ MODAL — lightweight create (questions added afterward via Manage)
// This exam is linked solely to the unit/lesson. No date/time scheduling
// here — that's exclusively a ScheduledExam concept, decoupled from units.
// ═══════════════════════════════════════════════════════════════
function AddQuizModal({
  courseId,
  unitId,
  onClose,
  onSaved,
  lang,
  t,
  font,
}: {
  courseId: number;
  unitId: number;
  onClose: () => void;
  onSaved: () => void;
  lang: 'ar' | 'en';
  t: TType;
  font?: string;
}) {
  const isRtl = lang === 'ar';
  const [form, setForm] = useState({ title: '', durationMinutes: '', passingScore: '50' });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.title) {
      toast.error(t.missingFields);
      return;
    }
    setSaving(true);
    await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, unitId, type: 'exam', ...form }),
    });
    toast.success(t.addedOk);
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Modal onClose={onClose} title={t.addQuiz} font={font}>
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
      </div>
      <ActionButtons onClose={onClose} onSave={handleSave} saving={saving} font={font} t={t} />
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXAM MANAGE MODAL — settings + question list + add-from-bank +
// create-new-question (with inline topic creation), all in one place.
// No scheduling here either — this exam stays tied to its unit/lesson only.
// ═══════════════════════════════════════════════════════════════
function ExamManageModal({
  courseId,
  lesson,
  topics,
  questions,
  onClose,
  onRefreshUnits,
  onRefreshTopics,
  onRefreshQuestions,
  lang,
  t,
  font,
}: {
  courseId: number;
  lesson: Lesson;
  topics: Topic[];
  questions: QuestionBank[];
  onClose: () => void;
  onRefreshUnits: () => void;
  onRefreshTopics: () => void;
  onRefreshQuestions: () => void;
  lang: 'ar' | 'en';
  t: TType;
  font?: string;
}) {
  const isRtl = lang === 'ar';

  // ── Settings section ──
  const [settings, setSettings] = useState({
    title: lesson.title,
    durationMinutes: lesson.exam?.durationMinutes ? String(lesson.exam.durationMinutes) : '',
    passingScore: String(lesson.exam?.passingScore ?? 50),
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveSettings = async () => {
    if (!settings.title) {
      toast.error(t.missingFields);
      return;
    }
    setSavingSettings(true);
    await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lesson.id, action: 'updateExam', ...settings }),
    });
    toast.success(t.updatedOk);
    setSavingSettings(false);
    onRefreshUnits();
  };

  // ── Exam questions section ──
  const [markDrafts, setMarkDrafts] = useState<Record<number, string>>({});
  const visibleExamQuestions = lesson.exam?.examQuestions.filter((eq) => eq.isVisible) ?? [];
  const hiddenExamQuestions = lesson.exam?.examQuestions.filter((eq) => !eq.isVisible) ?? [];

  const handleReorderEQ = async (eqId: number, dir: 'up' | 'down') => {
    await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lesson.id,
        action: 'reorderExamQuestion',
        examQuestionId: eqId,
        direction: dir,
      }),
    });
    onRefreshUnits();
  };

  const handleUpdateMark = async (eqId: number, mark: number) => {
    await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lesson.id,
        action: 'updateExamQuestionMark',
        examQuestionId: eqId,
        mark,
      }),
    });
    onRefreshUnits();
  };

  const handleRemoveEQ = async (eqId: number) => {
    const res = await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lesson.id, action: 'removeExamQuestion', examQuestionId: eqId }),
    });
    const data = await res.json().catch(() => null);
    onRefreshUnits();
    if (data?.hidden) toast.warning(t.questionHiddenToast);
    else toast.success(t.deletedOk);
  };

  // ── Add from bank section ──
  const [bankTopicFilter, setBankTopicFilter] = useState('');
  const [selectedBankIds, setSelectedBankIds] = useState<Set<number>>(new Set());
  const [addingQs, setAddingQs] = useState(false);

  const filteredBank = questions.filter((q) => {
    const inVisibleExam = visibleExamQuestions.some((eq) => eq.question.id === q.id);
    return !inVisibleExam && (!bankTopicFilter || String(q.topicId) === bankTopicFilter);
  });

  const handleAddFromBank = async () => {
    if (!selectedBankIds.size) return;
    setAddingQs(true);
    await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lesson.id,
        action: 'addExamQuestions',
        questionIds: Array.from(selectedBankIds),
      }),
    });
    setSelectedBankIds(new Set());
    onRefreshUnits();
    onRefreshQuestions();
    toast.success(t.addedOk);
    setAddingQs(false);
  };

  // ── New question section (with inline topic creation) ──
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [qForm, setQForm] = useState({
    text: '',
    type: 'mcq' as 'mcq' | 'true_false' | 'essay',
    options: ['', ''],
    correctAnswer: '',
    gradingNotes: '',
    topicId: '',
  });
  const qf = (k: keyof typeof qForm, v: unknown) => setQForm((p) => ({ ...p, [k]: v }));
  const [newTopicName, setNewTopicName] = useState('');
  const [addingTopic, setAddingTopic] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;
    setAddingTopic(true);
    const res = await fetch('/api/admin/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, name: newTopicName }),
    });
    if (res.ok) {
      const created = await res.json();
      setNewTopicName('');
      onRefreshTopics();
      qf('topicId', String(created.id));
      toast.success(t.addedOk);
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || t.missingFields);
    }
    setAddingTopic(false);
  };

  const buildQuestionPayload = () => ({
    courseId,
    text: qForm.text,
    type: qForm.type,
    optionsJson:
      qForm.type === 'essay'
        ? JSON.stringify([])
        : qForm.type === 'true_false'
          ? JSON.stringify([t.true, t.false])
          : JSON.stringify(qForm.options.filter((o) => o.trim())),
    correctAnswer: qForm.type === 'essay' ? qForm.gradingNotes : qForm.correctAnswer,
    topicId: Number(qForm.topicId),
  });

  const validateQuestionForm = () => {
    if (!qForm.text || !qForm.topicId) {
      toast.error(t.missingFields);
      return false;
    }
    if (qForm.type === 'mcq' && qForm.options.filter((o) => o.trim()).length < 2) {
      toast.error(t.min2Options);
      return false;
    }
    if ((qForm.type === 'mcq' || qForm.type === 'true_false') && !qForm.correctAnswer) {
      toast.error(t.missingFields);
      return false;
    }
    return true;
  };

  const resetQForm = () =>
    setQForm({
      text: '',
      type: 'mcq',
      options: ['', ''],
      correctAnswer: '',
      gradingNotes: '',
      topicId: '',
    });

  const handleCreateQuestion = async (addToExam: boolean) => {
    if (!validateQuestionForm()) return;
    setSavingQuestion(true);
    const res = await fetch('/api/admin/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildQuestionPayload()),
    });
    if (res.ok) {
      const created = await res.json();
      onRefreshQuestions();
      if (addToExam) {
        await fetch('/api/admin/lessons', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: lesson.id,
            action: 'addExamQuestions',
            questionIds: [created.id],
          }),
        });
        onRefreshUnits();
      }
      toast.success(t.addedOk);
      resetQForm();
      setShowNewQuestion(false);
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || t.missingFields);
    }
    setSavingQuestion(false);
  };

  return (
    <Modal onClose={onClose} title={`${t.manage} — ${lesson.title}`} font={font} wide>
      <div className="flex flex-col gap-5 sm:gap-6">
        {/* ── Settings ── */}
        <div>
          <h3
            className="text-xs sm:text-sm font-bold text-foreground mb-2 flex items-center gap-1.5"
            style={{ fontFamily: font }}
          >
            <Settings size={14} className="text-primary" /> {t.quizSettings}
          </h3>
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <Field label={t.examName} font={font}>
              <Inp
                value={settings.title}
                onChange={(v) => setSettings((p) => ({ ...p, title: v }))}
                dir={isRtl ? 'rtl' : 'ltr'}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <Field label={t.durationMinutes} font={font}>
                <Inp
                  type="number"
                  min="1"
                  value={settings.durationMinutes}
                  onChange={(v) => setSettings((p) => ({ ...p, durationMinutes: v }))}
                  dir="ltr"
                />
              </Field>
              <Field label={t.passingScore} font={font}>
                <Inp
                  type="number"
                  min="1"
                  value={settings.passingScore}
                  onChange={(v) => setSettings((p) => ({ ...p, passingScore: v }))}
                  dir="ltr"
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                style={{ fontFamily: font }}
              >
                {savingSettings ? <Loader2 size={14} className="animate-spin" /> : t.saveSettings}
              </button>
            </div>
          </div>
        </div>

        {/* ── Current exam questions ── */}
        <div className="border-t border-border pt-4 sm:pt-5">
          <h3
            className="text-xs sm:text-sm font-bold text-foreground mb-2 flex items-center gap-1.5 flex-wrap"
            style={{ fontFamily: font }}
          >
            <ClipboardList size={14} className="text-accent" />
            {t.examQuestionsSection} ({visibleExamQuestions.length})
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
            <div className="rounded-xl border border-dashed border-border py-5 text-center">
              <AlertCircle size={18} className="text-muted-foreground/30 mx-auto mb-1.5" />
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
                      onClick={() => handleReorderEQ(eq.id, 'up')}
                      disabled={idx === 0}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                    >
                      <ChevronUp size={11} />
                    </button>
                    <button
                      onClick={() => handleReorderEQ(eq.id, 'down')}
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
                      {eq.question.topic.name}
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
                        if (safe !== eq.mark) handleUpdateMark(eq.id, safe);
                      }}
                      className="w-12 sm:w-14 text-[10px] sm:text-xs text-center py-1 rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      title={t.markLabel}
                    />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {t.markUnit}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveEQ(eq.id)}
                    className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {hiddenExamQuestions.length > 0 && (
            <div className="mt-2.5 rounded-xl border border-dashed border-border overflow-hidden divide-y divide-border opacity-60">
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

        {/* ── Add from bank ── */}
        <div className="border-t border-border pt-4 sm:pt-5">
          <h3
            className="text-xs sm:text-sm font-bold text-foreground mb-1 flex items-center gap-1.5"
            style={{ fontFamily: font }}
          >
            <HelpCircle size={14} className="text-secondary" /> {t.addFromBankSection}
          </h3>
          <p
            className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2 flex items-center gap-1"
            style={{ fontFamily: font }}
          >
            <FileText size={10} className="text-amber-500" /> {t.essayExcluded}
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-muted-foreground" />
              <select
                value={bankTopicFilter}
                onChange={(e) => setBankTopicFilter(e.target.value)}
                className="text-[10px] sm:text-xs py-1 sm:py-1.5 px-2 sm:px-3 rounded-xl border border-border bg-background text-foreground outline-none"
                style={{ fontFamily: font }}
              >
                <option value="">{t.allTopics}</option>
                {topics.map((tp) => (
                  <option key={tp.id} value={tp.id}>
                    {tp.name}
                  </option>
                ))}
              </select>
            </div>
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
              {t.noQuestionsInBank}
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
                        {q.topic.name}
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

        {/* ── Create new question (with inline topic creation) ── */}
        <div className="border-t border-border pt-4 sm:pt-5">
          {!showNewQuestion ? (
            <button
              onClick={() => setShowNewQuestion(true)}
              className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1.5"
              style={{ fontFamily: font }}
            >
              {t.newQuestionToggle}
            </button>
          ) : (
            <>
              <h3
                className="text-xs sm:text-sm font-bold text-foreground mb-2 flex items-center gap-1.5"
                style={{ fontFamily: font }}
              >
                <Plus size={14} className="text-primary" /> {t.newQuestionSection}
              </h3>
              <div className="flex flex-col gap-3">
                <Field label={t.questionText} font={font}>
                  <Textarea
                    value={qForm.text}
                    onChange={(v) => qf('text', v)}
                    placeholder={isRtl ? 'اكتب السؤال هنا...' : 'Type the question here...'}
                    dir={isRtl ? 'rtl' : 'ltr'}
                    rows={2}
                  />
                </Field>

                <Field label={t.topicLabel} font={font}>
                  {topics.length === 0 && (
                    <p
                      className="text-[10px] sm:text-xs text-amber-600 mb-1"
                      style={{ fontFamily: font }}
                    >
                      {t.noTopicsYet}
                    </p>
                  )}
                  <select
                    value={qForm.topicId}
                    onChange={(e) => qf('topicId', e.target.value)}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    style={{ fontFamily: font }}
                  >
                    <option value="">{t.selectTopicPlaceholder}</option>
                    {topics.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        {tp.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Inp
                      value={newTopicName}
                      onChange={setNewTopicName}
                      placeholder={t.newTopicPlaceholder}
                      dir={isRtl ? 'rtl' : 'ltr'}
                    />
                    <button
                      onClick={handleAddTopic}
                      disabled={addingTopic || !newTopicName.trim()}
                      className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-primary text-primary text-[10px] sm:text-xs font-bold hover:bg-primary/10 transition-colors disabled:opacity-40 flex-shrink-0"
                      style={{ fontFamily: font }}
                    >
                      {addingTopic ? <Loader2 size={12} className="animate-spin" /> : t.addTopicBtn}
                    </button>
                  </div>
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
                            qf('type', type);
                            qf('correctAnswer', '');
                            qf('gradingNotes', '');
                            qf(
                              'options',
                              type === 'true_false'
                                ? [t.true, t.false]
                                : type === 'mcq'
                                  ? ['', '']
                                  : []
                            );
                          }}
                          className={`flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-xl border text-[10px] sm:text-xs font-bold transition-all ${qForm.type === type ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
                          style={{ fontFamily: font }}
                        >
                          {icons[type]} {labels[type]}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {qForm.type === 'mcq' && (
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <label
                      className="text-xs sm:text-sm font-semibold text-foreground"
                      style={{ fontFamily: font }}
                    >
                      {t.options}
                    </label>
                    {qForm.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => qf('correctAnswer', opt.trim())}
                          className={`p-1 sm:p-1.5 rounded-full flex-shrink-0 transition-all ${qForm.correctAnswer === opt.trim() && opt.trim() ? 'text-green-500' : 'text-muted-foreground/40 hover:text-green-400'}`}
                        >
                          {qForm.correctAnswer === opt.trim() && opt.trim() ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <Circle size={16} />
                          )}
                        </button>
                        <Inp
                          value={opt}
                          onChange={(v) => {
                            const opts = [...qForm.options];
                            opts[i] = v;
                            qf('options', opts);
                          }}
                          placeholder={`${t.option} ${i + 1}`}
                          dir={isRtl ? 'rtl' : 'ltr'}
                        />
                        {qForm.options.length > 2 && (
                          <button
                            onClick={() => {
                              const opts = qForm.options.filter((_, j) => j !== i);
                              qf('options', opts);
                              if (qForm.correctAnswer === opt.trim()) qf('correctAnswer', '');
                            }}
                            className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    {qForm.options.length < 6 && (
                      <button
                        onClick={() => qf('options', [...qForm.options, ''])}
                        className="flex items-center gap-1.5 text-[10px] sm:text-xs text-primary hover:underline font-semibold"
                        style={{ fontFamily: font }}
                      >
                        <Plus size={12} /> {t.addOption}
                      </button>
                    )}
                  </div>
                )}

                {qForm.type === 'true_false' && (
                  <Field label={t.correctAnswer} font={font}>
                    <div className="flex gap-2">
                      {[t.true, t.false].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => qf('correctAnswer', opt)}
                          className={`flex-1 py-1.5 sm:py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all ${qForm.correctAnswer === opt ? 'border-green-400 bg-green-50 text-green-700' : 'border-border text-muted-foreground hover:border-green-300'}`}
                          style={{ fontFamily: font }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </Field>
                )}

                {qForm.type === 'essay' && (
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
                    <Field label={t.gradingNotes} font={font}>
                      <Textarea
                        value={qForm.gradingNotes}
                        onChange={(v) => qf('gradingNotes', v)}
                        placeholder={t.gradingNotesPlaceholder}
                        dir={isRtl ? 'rtl' : 'ltr'}
                        rows={3}
                      />
                    </Field>
                  </>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowNewQuestion(false);
                      resetQForm();
                    }}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
                    style={{ fontFamily: font }}
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={() => handleCreateQuestion(false)}
                    disabled={savingQuestion}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-primary text-primary text-xs sm:text-sm font-bold hover:bg-primary/10 transition-all disabled:opacity-60"
                    style={{ fontFamily: font }}
                  >
                    {t.createQuestion}
                  </button>
                  <button
                    onClick={() => handleCreateQuestion(true)}
                    disabled={savingQuestion}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                    style={{ fontFamily: font }}
                  >
                    {savingQuestion ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      t.createAndAdd
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-3 sm:pt-4 border-t border-border mt-4">
        <button
          onClick={onClose}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
          style={{ fontFamily: font }}
        >
          {t.close}
        </button>
      </div>
    </Modal>
  );
}
