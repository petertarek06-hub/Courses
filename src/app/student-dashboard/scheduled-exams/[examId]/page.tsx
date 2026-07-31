// src/app/student-dashboard/scheduled-exams/[examId]/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLang } from '@/lib/uselang';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Play,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: number;
  order: number;
  mark: number;
  question: {
    id: number;
    text: string;
    type: 'mcq' | 'true_false' | 'essay';
    optionsJson: string;
  };
}

interface ExamData {
  exam: {
    id: number;
    title: string;
    durationMinutes: number | null;
    passingScore: number;
    scheduledAt: string;
    course: {
      id: number;
      name: string;
    };
  };
  questions: Question[];
  previousAttempt: {
    id: number;
    score: number | null;
    passed: boolean | null;
    submittedAt: string | null;
  } | null;
}

const content = {
  ar: {
    back: 'عودة للوحة الطالب',
    loading: 'جارٍ التحميل...',
    error: 'حدث خطأ',
    examNotAvailable: 'الامتحان غير متاح بعد',
    examAlreadyTaken: 'لقد أديت هذا الامتحان بالفعل',
    startExam: 'بدء الامتحان',
    timeRemaining: 'الوقت المتبقي',
    submitExam: 'تسليم الامتحان',
    confirmSubmit: 'هل أنت متأكد من تسليم الامتحان؟',
    question: 'سؤال',
    of: 'من',
    minutes: 'دقيقة',
    seconds: 'ثانية',
    noAnswer: 'يرجى اختيار إجابة',
    examSubmitted: 'تم تسليم الامتحان بنجاح',
    score: 'الدرجة',
    passed: 'ناجح',
    failed: 'راسب',
    pendingGrading: 'بانتظار التصحيح',
    returnToDashboard: 'العودة للوحة الطالب',
    selectOption: 'اختر الإجابة الصحيحة',
    true: 'صح',
    false: 'خطأ',
    yourAnswer: 'إجابتك',
  },
  en: {
    back: 'Back to Dashboard',
    loading: 'Loading...',
    error: 'An error occurred',
    examNotAvailable: 'Exam not yet available',
    examAlreadyTaken: 'You have already taken this exam',
    startExam: 'Start Exam',
    timeRemaining: 'Time Remaining',
    submitExam: 'Submit Exam',
    confirmSubmit: 'Are you sure you want to submit the exam?',
    question: 'Question',
    of: 'of',
    minutes: 'minutes',
    seconds: 'seconds',
    noAnswer: 'Please select an answer',
    examSubmitted: 'Exam submitted successfully',
    score: 'Score',
    passed: 'Passed',
    failed: 'Failed',
    pendingGrading: 'Pending grading',
    returnToDashboard: 'Return to Dashboard',
    selectOption: 'Select the correct answer',
    true: 'True',
    false: 'False',
    yourAnswer: 'Your answer',
  },
};

export default function ScheduledExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.examId as string;
  const { lang, toggleLang } = useLang();
  const t = content[lang];
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExamData();
  }, [examId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (examStarted && timeRemaining !== null && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeRemaining === 0 && examStarted) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [examStarted, timeRemaining]);

  const fetchExamData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/scheduled-exams/${examId}`);
      if (!res.ok) {
        if (res.status === 403) {
          const data = await res.json();
          setError(true);
          toast.error(data.error || t.error);
        }
        throw new Error();
      }
      const data = await res.json();
      setExamData(data);
      if (data.previousAttempt?.submittedAt) {
        setExamStarted(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const startExam = async () => {
    try {
      const res = await fetch(`/api/student/scheduled-exams/${examId}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAttemptId(data.attemptId);
      setExamStarted(true);
      if (examData?.exam.durationMinutes) {
        setTimeRemaining(examData.exam.durationMinutes * 60);
      }
    } catch {
      toast.error(t.error);
    }
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    const answersArray = examData?.questions.map((q) => ({
      examQuestionId: q.id,
      givenAnswer: answers[q.id] || '',
    })) || [];

    if (answersArray.some((a) => !a.givenAnswer)) {
      toast.error(t.noAnswer);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/student/scheduled-exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers: answersArray }),
      });

      if (!res.ok) throw new Error();

      const result = await res.json();
      toast.success(t.examSubmitted);
      setExamData((prev) => prev ? {
        ...prev,
        previousAttempt: {
          id: attemptId,
          score: result.score,
          passed: result.passed,
          submittedAt: new Date().toISOString(),
        },
      } : null);
      setExamStarted(false);
    } catch {
      toast.error(t.error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
        <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
        <Footer lang={lang} />
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
        <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground" style={{ fontFamily: font }}>
              {t.error}
            </p>
            <button
              onClick={() => router.push('/student-dashboard')}
              className="mt-4 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-bold"
              style={{ fontFamily: font }}
            >
              {t.returnToDashboard}
            </button>
          </div>
        </div>
        <Footer lang={lang} />
      </div>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];
  const hasPreviousAttempt = examData.previousAttempt?.submittedAt;

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/student-dashboard')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontFamily: font }}
          >
            {isRtl ? <ArrowRight size={16} /> : <ArrowRight size={16} className="rotate-180" />}
            {t.back}
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-extrabold text-foreground" style={{ fontFamily: font }}>
            {examData.exam.title}
          </h1>
        </div>

        {/* Previous attempt result */}
        {hasPreviousAttempt && !examStarted && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6 card-shadow">
            <div className="flex items-center gap-3 mb-4">
              {examData.previousAttempt.passed === true ? (
                <CheckCircle size={24} className="text-green-600" />
              ) : examData.previousAttempt.passed === false ? (
                <X size={24} className="text-red-500" />
              ) : (
                <Clock size={24} className="text-amber-500" />
              )}
              <div>
                <p className="text-lg font-bold text-foreground" style={{ fontFamily: font }}>
                  {examData.previousAttempt.passed === true
                    ? t.passed
                    : examData.previousAttempt.passed === false
                    ? t.failed
                    : t.pendingGrading}
                </p>
                {examData.previousAttempt.score !== null && (
                  <p className="text-sm text-muted-foreground">
                    {t.score}: {examData.previousAttempt.score.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push('/student-dashboard')}
              className="px-4 py-2 rounded-xl border border-border text-foreground text-sm font-bold hover:bg-muted transition-colors"
              style={{ fontFamily: font }}
            >
              {t.returnToDashboard}
            </button>
          </div>
        )}

        {/* Exam not started */}
        {!examStarted && !hasPreviousAttempt && (
          <div className="bg-card rounded-xl border border-border p-6 card-shadow">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1" style={{ fontFamily: font }}>
                  {examData.exam.course.name}
                </p>
                <p className="text-base font-semibold text-foreground" style={{ fontFamily: font }}>
                  {examData.exam.title}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {examData.exam.durationMinutes && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} />
                    <span>{examData.exam.durationMinutes} {t.minutes}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span>{t.question}: {examData.questions.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={16} />
                  <span>{t.passingScore}: {examData.exam.passingScore}%</span>
                </div>
              </div>

              <button
                onClick={startExam}
                className="w-full py-3 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ fontFamily: font }}
              >
                <Play size={18} />
                {t.startExam}
              </button>
            </div>
          </div>
        )}

        {/* Exam in progress */}
        {examStarted && currentQuestion && (
          <div className="space-y-6">
            {/* Timer */}
            {timeRemaining !== null && (
              <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground" style={{ fontFamily: font }}>
                    {t.timeRemaining}
                  </span>
                </div>
                <span className="text-2xl font-bold text-primary" dir="ltr">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}

            {/* Question */}
            <div className="bg-card rounded-xl border border-border p-6 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground" style={{ fontFamily: font }}>
                  {t.question} {currentQuestionIndex + 1} {t.of} {examData.questions.length}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                  {currentQuestion.mark} {t.markUnit || 'points'}
                </span>
              </div>

              <p className="text-base font-medium text-foreground mb-6" style={{ fontFamily: font }}>
                {currentQuestion.question.text}
              </p>

              {currentQuestion.question.type === 'mcq' && (
                <div className="space-y-3">
                  {JSON.parse(currentQuestion.question.optionsJson).map((option: string, idx: number) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        answers[currentQuestion.id] === option
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-sm text-foreground" style={{ fontFamily: font }}>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.question.type === 'true_false' && (
                <div className="flex gap-4">
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                      answers[currentQuestion.id] === 'true'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value="true"
                      checked={answers[currentQuestion.id] === 'true'}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-foreground" style={{ fontFamily: font }}>
                      {t.true}
                    </span>
                  </label>
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                      answers[currentQuestion.id] === 'false'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value="false"
                      checked={answers[currentQuestion.id] === 'false'}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-foreground" style={{ fontFamily: font }}>
                      {t.false}
                    </span>
                  </label>
                </div>
              )}

              {currentQuestion.question.type === 'essay' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                  rows={6}
                  placeholder={t.yourAnswer}
                  style={{ fontFamily: font }}
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 rounded-xl border border-border text-foreground text-sm font-bold hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: font }}
              >
                {isRtl ? 'التالي' : 'Previous'}
              </button>

              {currentQuestionIndex === examData.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  style={{ fontFamily: font }}
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      {t.submitExam}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(examData.questions.length - 1, prev + 1))}
                  className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
                  style={{ fontFamily: font }}
                >
                  {isRtl ? 'السابق' : 'Next'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}
