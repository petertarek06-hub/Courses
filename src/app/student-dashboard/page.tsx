// src/app/student-dashboard/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ExamCountdownBadge from '@/components/ExamCountdownBadge';
import EditProfileModal from './components/EditProfileModal';
import { useLang } from '@/lib/uselang';
import {
  User,
  BookOpen,
  ClipboardList,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Loader2,
  GraduationCap,
  Plus,
  Smartphone,
  Banknote,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Phone,
  MapPin,
  MessageCircle,
  Pencil,
  ChevronRight,
} from 'lucide-react';

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

// ✅ NEW: same Egyptian mobile format already enforced on admin/students
// (01 + 9 digits = 11 digits total). Reused here so a student can't submit
// a wallet top-up request with an obviously-malformed sender phone number.
const EG_PHONE_REGEX = /^01[0-9]{9}$/;

interface Profile {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  academicYear: string | null;
  balance: number;
  createdAt: string;
}
interface EnrolledCourse {
  id: number;
  enrolledAt: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  course: {
    id: number;
    name: string;
    subject: string;
    academicYear: string;
    teacher: { id: number; fullName: string; avatarUrl: string | null };
    upcomingExamAt: string | null;
  };
}
interface ExamAttempt {
  id: number;
  score: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
  exam: {
    id: number;
    passingScore: number;
    lesson: {
      title: string;
      course: { id: number; name: string };
    };
  };
}
// Merged wallet-activity item: either a completed ledger entry (kind:
// 'transaction' — always finished, `status` is a fixed 'completed' tag
// added by the API for display convenience only) or a top-up request still
// awaiting admin review (kind: 'topup_request' — the only kind that can
// carry a real 'pending'/'rejected' status).
//
// type: 'topup' (balance credited or being requested) | 'purchase' (course
// bought with existing balance)
// method: 'cash' | 'wallet' | 'fawry' (top-ups) | 'balance' (purchases)
interface Transaction {
  id: number;
  kind: 'transaction' | 'topup_request';
  amount: number;
  type: string;
  method: string;
  status: string;
  notes: string | null;
  createdAt: string;
  course?: { name: string } | null;
}
interface DashboardData {
  profile: Profile;
  enrollments: EnrolledCourse[];
  examAttempts: ExamAttempt[];
  transactions: Transaction[];
}
interface CenterInfo {
  phone: string | null;
  whatsappNumber: string | null;
  address: string | null;
}

const content = {
  ar: {
    title: 'لوحة الطالب',
    profile: 'الملف الشخصي',
    editProfile: 'تعديل البيانات',
    courses: 'الكورسات المسجّلة',
    exams: 'نتائج الامتحانات',
    balance: 'الرصيد والمعاملات',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    grade: 'الصف الدراسي',
    memberSince: 'عضو منذ',
    noEmail: 'لا يوجد',
    noGrade: 'غير محدد',
    currentBalance: 'الرصيد الحالي',
    egp: 'ج.م',
    noCourses: 'لم تسجّل في أي كورس بعد',
    noExams: 'لم تؤدِّ أي امتحان بعد',
    noTransactions: 'لا توجد معاملات',
    progress: 'التقدم',
    lessons: 'درس',
    completed: 'مكتمل',
    teacher: 'المدرس',
    passed: 'ناجح',
    failed: 'راسب',
    pending: 'لم يُسلَّم',
    awaitingGrading: 'بانتظار التصحيح',
    viewAnswers: 'عرض الإجابات ←',
    score: 'الدرجة',
    passingScore: 'درجة النجاح',
    date: 'التاريخ',
    transactionType: 'النوع',
    amount: 'المبلغ',
    method: 'الوسيلة',
    add: 'إضافة',
    deduct: 'خصم',
    payment: 'دفع',
    cash: 'كاش',
    fawry: 'فوري',
    wallet: 'محفظة ذكية',
    loading: 'جارٍ التحميل...',
    watchNow: 'شاهد الكورس ←',
    topUp: 'شحن الرصيد',
    topUpAmount: 'المبلغ (ج.م)',
    topUpMethod: 'طريقة الدفع',
    topUpCash: 'كاش (بالمركز)',
    topUpWallet: 'تحويل محفظة ',
    topUpFawry: 'فوري',
    fawryComingSoon: 'قريبًا',
    topUpSenderPhone: 'رقم الهاتف المُرسِل منه',
    topUpSenderPhonePlaceholder: '01xxxxxxxxx',
    topUpSenderPhoneInvalid: 'أدخل رقم هاتف مصري صحيح (01xxxxxxxxx)',
    topUpProof: 'صورة إثبات التحويل',
    topUpProofHint: 'أرفق لقطة شاشة لعملية التحويل للتحقق منها',
    topUpProofSelected: 'تم اختيار صورة',
    topUpNotes: 'ملاحظات (اختياري)',
    topUpNotesPlaceholder: 'مثال: رقم المعاملة أو اسمك على المحفظة',
    topUpBtn: 'أرسل طلب الشحن',
    topUpSent: 'تم إرسال طلبك! سيراجعه الإدارة ويُضاف رصيدك قريبًا.',
    topUpError: 'حدث خطأ، حاول مرة أخرى',
    topUpPending: 'طلب قيد المراجعة',
    topUpCompleted: 'مكتمل',
    topUpRejected: 'مرفوض',
    walletInstructions: 'تعليمات التحويل عبر المحفظة:',
    walletStep1: 'حوّل المبلغ المطلوب إلى رقم المركز:',
    walletNumber: '01XXXXXXXXX',
    walletStep2: 'اكتب رقم المعاملة أو اسمك في خانة الملاحظات أدناه',
    walletStep3: 'انقر "أرسل طلب الشحن" وانتظر تأكيد الإدارة',
    cashInstructions:
      'لدفع نقدًا، يُرجى التوجه إلى مركز الدراسة أو التواصل معنا على البيانات التالية:',
    cashPhoneLabel: 'رقم الهاتف',
    cashWhatsappLabel: 'واتساب',
    cashAddressLabel: 'العنوان',
    cashInfoNotSet: 'لم يتم تحديد هذه البيانات بعد، يرجى التواصل مع الإدارة',
    examScheduled: 'امتحان مجدول:',
  },
  en: {
    title: 'Student Dashboard',
    profile: 'Profile',
    editProfile: 'Edit Profile',
    courses: 'Enrolled Courses',
    exams: 'Exam Results',
    balance: 'Balance & Transactions',
    phone: 'Phone',
    email: 'Email',
    grade: 'Grade',
    memberSince: 'Member since',
    noEmail: 'None',
    noGrade: 'Not set',
    currentBalance: 'Current Balance',
    egp: 'EGP',
    noCourses: 'No courses enrolled yet',
    noExams: 'No exams taken yet',
    noTransactions: 'No transactions',
    progress: 'Progress',
    lessons: 'lessons',
    completed: 'completed',
    teacher: 'Teacher',
    passed: 'Passed',
    failed: 'Failed',
    pending: 'Not submitted',
    awaitingGrading: 'Awaiting grading',
    viewAnswers: 'View answers →',
    score: 'Score',
    passingScore: 'Passing score',
    date: 'Date',
    transactionType: 'Type',
    amount: 'Amount',
    method: 'Method',
    add: 'Credit',
    deduct: 'Deduct',
    payment: 'Payment',
    cash: 'Cash',
    fawry: 'Fawry',
    wallet: 'Smart Wallet',
    loading: 'Loading...',
    watchNow: 'Watch Course →',
    topUp: 'Top Up Balance',
    topUpAmount: 'Amount (EGP)',
    topUpMethod: 'Payment method',
    topUpCash: 'Cash (at center)',
    topUpWallet: 'Wallet transfer',
    topUpFawry: 'Fawry',
    fawryComingSoon: 'Coming soon',
    topUpSenderPhone: 'Sender\u2019s phone number',
    topUpSenderPhonePlaceholder: '01xxxxxxxxx',
    topUpSenderPhoneInvalid: 'Enter a valid Egyptian phone number (01xxxxxxxxx)',
    topUpProof: 'Transfer proof photo',
    topUpProofHint: 'Attach a screenshot of the transfer so we can verify it',
    topUpProofSelected: 'Photo selected',
    topUpNotes: 'Notes (optional)',
    topUpNotesPlaceholder: 'e.g. transaction number or your wallet name',
    topUpBtn: 'Send Top-Up Request',
    topUpSent: 'Request sent! Admin will review and credit your balance soon.',
    topUpError: 'Something went wrong, please try again',
    topUpPending: 'Pending review',
    topUpCompleted: 'Completed',
    topUpRejected: 'Rejected',
    walletInstructions: 'Wallet transfer instructions:',
    walletStep1: 'Transfer the amount to the center number:',
    walletNumber: '01XXXXXXXXX',
    walletStep2: 'Write the transaction number or your name in the notes field below',
    walletStep3: 'Click "Send Top-Up Request" and wait for admin confirmation',
    cashInstructions:
      'To pay in cash, please visit the study center or contact us using the details below:',
    cashPhoneLabel: 'Phone number',
    cashWhatsappLabel: 'WhatsApp',
    cashAddressLabel: 'Address',
    cashInfoNotSet: 'This hasn\u2019t been set yet — please contact the admin team.',
    examScheduled: 'Scheduled exam:',
  },
};

function Avatar({ url, name, size = 48 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <span
      className="rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </span>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border card-shadow p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon size={18} className="text-primary" />
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function StudentDashboardPage() {
  const { lang, toggleLang } = useLang();
  const router = useRouter();
  const t = content[lang];
  const isRtl = lang === 'ar';
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [centerInfo, setCenterInfo] = useState<CenterInfo | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Top-up form state
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpMethod, setTopUpMethod] = useState<'cash' | 'wallet'>('wallet');
  const [topUpNotes, setTopUpNotes] = useState('');
  const [topUpSenderPhone, setTopUpSenderPhone] = useState('');
  const [topUpProof, setTopUpProof] = useState<File | null>(null);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpStatus, setTopUpStatus] = useState<'idle' | 'success' | 'error'>('idle');
  // ✅ NEW: distinct from topUpStatus's generic error banner — this is a
  // field-level message shown right under the phone input, cleared as
  // soon as the student edits the field again.
  const [senderPhoneError, setSenderPhoneError] = useState('');

  const fetchDashboard = () => {
    fetch('/api/student/dashboard')
      .then((r) => {
        if (r.status === 401) {
          router.replace('/sign-up-login-screen');
          return null;
        }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => d && setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCenterInfo(d))
      .catch(() => {});
  }, []);

  const handleTopUp = async () => {
    if (!topUpAmount || Number(topUpAmount) <= 0) return;

    if (topUpMethod === 'wallet') {
      const phone = topUpSenderPhone.trim();
      // ✅ NEW: verify the sender phone actually looks like a real Egyptian
      // mobile number before sending the request, instead of only checking
      // that the field is non-empty. Blocks obvious typos/garbage input
      // from ever reaching the API.
      if (!EG_PHONE_REGEX.test(phone)) {
        setSenderPhoneError(t.topUpSenderPhoneInvalid);
        return;
      }
      if (!topUpProof) return;
    }
    setSenderPhoneError('');

    setTopUpLoading(true);
    setTopUpStatus('idle');
    try {
      const formData = new FormData();
      formData.append('amount', topUpAmount);
      formData.append('method', topUpMethod);
      formData.append('notes', topUpNotes);
      if (topUpMethod === 'wallet') {
        formData.append('senderPhone', topUpSenderPhone.trim());
        if (topUpProof) formData.append('proof', topUpProof);
      }

      const res = await fetch('/api/student/wallet', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setTopUpStatus('success');
        setTopUpAmount('');
        setTopUpNotes('');
        setTopUpSenderPhone('');
        setTopUpProof(null);
        fetchDashboard(); // refresh transactions
      } else {
        setTopUpStatus('error');
      }
    } catch {
      setTopUpStatus('error');
    }
    setTopUpLoading(false);
  };

  const gradeLabel = (key: string | null) => {
    if (!key) return t.noGrade;
    return gradeLabelMap[key] ? (isRtl ? gradeLabelMap[key].ar : gradeLabelMap[key].en) : key;
  };

  // type: 'topup' (balance credited/requested) | 'purchase' (course bought)
  // method: 'cash' | 'wallet' | 'fawry' for top-ups, 'balance' for purchases
  const txLabel = (tx: Transaction) => {
    if (tx.type === 'topup') {
      if (tx.method === 'cash') return t.cash;
      if (tx.method === 'wallet') return t.wallet;
      if (tx.method === 'fawry') return t.fawry;
      return tx.method;
    }
    return t.payment; // 'purchase'
  };

  // Only kind: 'topup_request' items can carry a real 'pending'/'rejected'
  // status — completed ledger entries (kind: 'transaction') are tagged
  // 'completed' by the API for convenience, which renders no badge here.
  const txStatusBadge = (status: string) => {
    if (status === 'pending')
      return (
        <span
          className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-bold"
          style={{ fontFamily: font }}
        >
          {t.topUpPending}
        </span>
      );
    if (status === 'rejected')
      return (
        <span
          className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-500 font-bold"
          style={{ fontFamily: font }}
        >
          {t.topUpRejected}
        </span>
      );
    return null;
  };

  // An attempt has three possible states, not two:
  //  - not submitted yet            → submittedAt is null
  //  - submitted but still awaiting
  //    manual grading of essay Qs   → submittedAt set, passed is null
  //  - fully graded                 → submittedAt set, passed is true/false
  // Previously only the first/third were distinguished, so an ungraded
  // attempt (passed === null, which is falsy) rendered as "Failed".
  const examStatusBadge = (attempt: ExamAttempt) => {
    if (!attempt.submittedAt) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground flex-shrink-0"
          style={{ fontFamily: font }}
        >
          <Clock size={11} />
          {t.pending}
        </span>
      );
    }
    if (attempt.passed === null) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 flex-shrink-0"
          style={{ fontFamily: font }}
        >
          <Clock size={11} />
          {t.awaitingGrading}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${attempt.passed ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}
        style={{ fontFamily: font }}
      >
        {attempt.passed ? <CheckCircle size={11} /> : <XCircle size={11} />}
        {attempt.passed ? t.passed : t.failed}
      </span>
    );
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

  if (!data) return null;
  const { profile, enrollments, examAttempts, transactions } = data;

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: font }}
    >
      <Header lang={lang} onToggleLang={toggleLang} currentPath="/student-dashboard" />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-extrabold text-foreground mb-6" style={{ fontFamily: font }}>
          {t.title}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column ── */}
          <div className="flex flex-col gap-6">
            {/* Profile */}
            <SectionCard title={t.profile} icon={User}>
              <div className="flex flex-col items-center text-center gap-3">
                <Avatar url={profile.avatarUrl} name={profile.fullName} size={72} />
                <div>
                  <p className="text-lg font-bold text-foreground">{profile.fullName}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {gradeLabel(profile.academicYear)}
                  </p>
                </div>
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
                  style={{ fontFamily: font }}
                >
                  <Pencil size={13} />
                  {t.editProfile}
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t.phone}</span>
                  <span className="font-medium text-foreground" dir="ltr">
                    {profile.phone}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t.email}</span>
                  <span className="font-medium text-foreground" dir="ltr">
                    {profile.email ?? t.noEmail}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t.memberSince}</span>
                  <span className="font-medium text-foreground" dir="ltr">
                    {new Date(profile.createdAt).toLocaleDateString('en-EG')}
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* Balance + Top Up */}
            <SectionCard title={t.balance} icon={Wallet}>
              {/* Current balance */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20 mb-5">
                <span
                  className="text-sm font-semibold text-muted-foreground"
                  style={{ fontFamily: font }}
                >
                  {t.currentBalance}
                </span>
                <span className="text-2xl font-extrabold text-primary" dir="ltr">
                  {profile.balance} {t.egp}
                </span>
              </div>

              {/* Top-up form */}
              <div className="mb-5">
                <p
                  className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"
                  style={{ fontFamily: font }}
                >
                  <Plus size={15} className="text-primary" />
                  {t.topUp}
                </p>

                {/* Method selector */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setTopUpMethod('wallet')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all ${topUpMethod === 'wallet' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                    style={{ fontFamily: font }}
                  >
                    <Smartphone size={13} />
                    {t.topUpWallet}
                  </button>
                  <button
                    onClick={() => setTopUpMethod('cash')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all ${topUpMethod === 'cash' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                    style={{ fontFamily: font }}
                  >
                    <Banknote size={13} />
                    {t.topUpCash}
                  </button>
                  {/* Fawry placeholder, disabled until available */}
                  <button
                    type="button"
                    disabled
                    title={t.fawryComingSoon}
                    className="flex-1 relative flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold border-border text-muted-foreground/50 bg-muted/20 cursor-not-allowed"
                    style={{ fontFamily: font }}
                  >
                    <CreditCard size={13} />
                    {t.topUpFawry}
                    <span className="absolute -top-2 ltr:-right-2 rtl:-left-2 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                      {t.fawryComingSoon}
                    </span>
                  </button>
                </div>

                {topUpMethod === 'wallet' ? (
                  <>
                    {/* Wallet instructions */}
                    <div
                      className="rounded-xl bg-muted/40 p-3 mb-3 text-xs text-muted-foreground flex flex-col gap-1"
                      style={{ fontFamily: font }}
                    >
                      <p className="font-bold text-foreground">{t.walletInstructions}</p>
                      <p>
                        1. {t.walletStep1}{' '}
                        <span className="font-bold text-primary" dir="ltr">
                          {t.walletNumber}
                        </span>
                      </p>
                      <p>2. {t.walletStep2}</p>
                      <p>3. {t.walletStep3}</p>
                    </div>

                    {/* Amount input */}
                    <label
                      className="text-xs font-semibold text-foreground mb-1 block"
                      style={{ fontFamily: font }}
                    >
                      {t.topUpAmount}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all mb-2"
                      dir="ltr"
                      placeholder="100"
                    />

                    {/* Sender's phone number */}
                    <label
                      className="text-xs font-semibold text-foreground mb-1 block"
                      style={{ fontFamily: font }}
                    >
                      {t.topUpSenderPhone}
                    </label>
                    <input
                      type="tel"
                      value={topUpSenderPhone}
                      onChange={(e) => {
                        setTopUpSenderPhone(e.target.value);
                        // ✅ NEW: clear the field-level error as soon as the
                        // student starts correcting it, rather than leaving
                        // a stale error message next to freshly-typed input.
                        if (senderPhoneError) setSenderPhoneError('');
                      }}
                      placeholder={t.topUpSenderPhonePlaceholder}
                      className={`w-full px-3 py-2 rounded-xl border bg-background text-foreground text-sm outline-none focus:ring-2 transition-all mb-1 ${
                        senderPhoneError
                          ? 'border-red-400 focus:ring-red-200'
                          : 'border-border focus:ring-primary/30'
                      }`}
                      dir="ltr"
                    />
                    {senderPhoneError && (
                      <p className="text-red-500 text-xs mb-2" style={{ fontFamily: font }}>
                        {senderPhoneError}
                      </p>
                    )}

                    {/* Transfer proof photo */}
                    <label
                      className="text-xs font-semibold text-foreground mb-1 block"
                      style={{ fontFamily: font }}
                    >
                      {t.topUpProof}
                    </label>
                    <p
                      className="text-[11px] text-muted-foreground mb-1.5"
                      style={{ fontFamily: font }}
                    >
                      {t.topUpProofHint}
                    </p>
                    <label className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-border bg-background text-xs font-semibold text-muted-foreground hover:border-primary/40 cursor-pointer transition-all mb-3">
                      <CheckCircle2
                        size={13}
                        className={topUpProof ? 'text-green-600' : 'text-muted-foreground/50'}
                      />
                      <span style={{ fontFamily: font }}>
                        {topUpProof ? `${t.topUpProofSelected}: ${topUpProof.name}` : t.topUpProof}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setTopUpProof(e.target.files?.[0] ?? null)}
                      />
                    </label>

                    {/* Notes input */}
                    <label
                      className="text-xs font-semibold text-foreground mb-1 block"
                      style={{ fontFamily: font }}
                    >
                      {t.topUpNotes}
                    </label>
                    <textarea
                      value={topUpNotes}
                      onChange={(e) => setTopUpNotes(e.target.value)}
                      placeholder={t.topUpNotesPlaceholder}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none mb-3"
                      style={{ fontFamily: font }}
                    />

                    {/* Feedback */}
                    {topUpStatus === 'success' && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50 border border-green-200 mb-3">
                        <CheckCircle2 size={15} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <p
                          className="text-xs text-green-700 font-semibold"
                          style={{ fontFamily: font }}
                        >
                          {t.topUpSent}
                        </p>
                      </div>
                    )}
                    {topUpStatus === 'error' && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-3">
                        <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p
                          className="text-xs text-red-600 font-semibold"
                          style={{ fontFamily: font }}
                        >
                          {t.topUpError}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleTopUp}
                      disabled={
                        topUpLoading ||
                        !topUpAmount ||
                        Number(topUpAmount) <= 0 ||
                        !topUpSenderPhone.trim() ||
                        !topUpProof
                      }
                      className="w-full py-2.5 rounded-xl gradient-primary text-white text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ fontFamily: font }}
                    >
                      {topUpLoading ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <>
                          <Plus size={15} />
                          {t.topUpBtn}
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  /* Cash: no inputs — show real center contact details instead */
                  <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground flex flex-col gap-3">
                    <p className="font-bold text-foreground text-sm" style={{ fontFamily: font }}>
                      {t.cashInstructions}
                    </p>

                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <Phone size={13} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold" style={{ fontFamily: font }}>
                            {t.cashPhoneLabel}
                          </p>
                          {centerInfo?.phone ? (
                            <p className="text-sm font-bold text-foreground" dir="ltr">
                              {centerInfo.phone}
                            </p>
                          ) : (
                            <p className="italic" style={{ fontFamily: font }}>
                              {t.cashInfoNotSet}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <MessageCircle size={13} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold" style={{ fontFamily: font }}>
                            {t.cashWhatsappLabel}
                          </p>
                          {centerInfo?.whatsappNumber ? (
                            <p className="text-sm font-bold text-foreground" dir="ltr">
                              {centerInfo.whatsappNumber}
                            </p>
                          ) : (
                            <p className="italic" style={{ fontFamily: font }}>
                              {t.cashInfoNotSet}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MapPin size={13} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold" style={{ fontFamily: font }}>
                            {t.cashAddressLabel}
                          </p>
                          {centerInfo?.address ? (
                            <p
                              className="text-sm font-bold text-foreground break-words"
                              style={{ fontFamily: font }}
                            >
                              {centerInfo.address}
                            </p>
                          ) : (
                            <p className="italic" style={{ fontFamily: font }}>
                              {t.cashInfoNotSet}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction history */}
              {transactions.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground text-center py-4"
                  style={{ fontFamily: font }}
                >
                  {t.noTransactions}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {transactions.map((tx) => (
                    <div
                      key={`${tx.kind}-${tx.id}`}
                      className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0"
                    >
                      <div className="flex flex-col min-w-0 gap-0.5">
                        <span
                          className="text-xs font-semibold text-foreground flex items-center gap-1.5 flex-wrap"
                          style={{ fontFamily: font }}
                        >
                          {txLabel(tx)}
                          {tx.course && ` — ${tx.course.name}`}
                          {txStatusBadge(tx.status)}
                        </span>
                        <span className="text-xs text-muted-foreground" dir="ltr">
                          {new Date(tx.createdAt).toLocaleDateString('en-EG')}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-bold flex-shrink-0 ${tx.type === 'topup' ? 'text-green-600' : 'text-red-500'}`}
                        dir="ltr"
                      >
                        {tx.type === 'topup' ? '+' : '-'}
                        {tx.amount} {t.egp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Enrolled Courses */}
            <SectionCard title={t.courses} icon={BookOpen}>
              {enrollments.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <GraduationCap size={40} className="text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: font }}>
                    {t.noCourses}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {enrollments.map((e) => (
                    <div
                      key={e.id}
                      onClick={() =>
                        router.push(`/student-dashboard/courses/${e.course.id}/lessons`)
                      }
                      className="p-4 rounded-xl border border-border bg-background hover:bg-muted/20 hover:border-primary/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <p
                            className="font-bold text-foreground truncate group-hover:text-primary transition-colors"
                            style={{ fontFamily: font }}
                          >
                            {e.course.name}
                          </p>
                          <p
                            className="text-xs text-muted-foreground mt-0.5"
                            style={{ fontFamily: font }}
                          >
                            {e.course.subject} · {gradeLabel(e.course.academicYear)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Avatar
                            url={e.course.teacher.avatarUrl}
                            name={e.course.teacher.fullName}
                            size={24}
                          />
                          <span
                            className="text-xs text-muted-foreground"
                            style={{ fontFamily: font }}
                          >
                            {e.course.teacher.fullName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${e.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-primary flex-shrink-0">
                          {e.progress}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: font }}>
                          {e.completedLessons} / {e.totalLessons} {t.lessons}
                        </p>
                        <span
                          className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ fontFamily: font }}
                        >
                          {t.watchNow}
                        </span>
                      </div>
                      {e.course.upcomingExamAt && (
                        <div className="mt-2">
                          <ExamCountdownBadge
                            scheduledAt={e.course.upcomingExamAt}
                            lang={lang}
                            font={font}
                            label={t.examScheduled}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Exam Results */}
            <SectionCard title={t.exams} icon={ClipboardList}>
              {examAttempts.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <TrendingUp size={40} className="text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: font }}>
                    {t.noExams}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {examAttempts.map((attempt) => {
                    // Only submitted attempts have anything to review —
                    // an attempt still in progress has no answers page yet.
                    const isClickable = Boolean(attempt.submittedAt);
                    return (
                      <div
                        key={attempt.id}
                        onClick={
                          isClickable
                            ? () => router.push(`/student-dashboard/attempts/${attempt.id}`)
                            : undefined
                        }
                        className={`p-4 rounded-xl border border-border bg-background transition-all group ${
                          isClickable
                            ? 'cursor-pointer hover:bg-muted/20 hover:border-primary/40'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className="font-semibold text-foreground text-sm truncate"
                              style={{ fontFamily: font }}
                            >
                              {attempt.exam.lesson.title}
                            </p>
                            <p
                              className="text-xs text-muted-foreground mt-0.5 truncate"
                              style={{ fontFamily: font }}
                            >
                              {attempt.exam.lesson.course.name}
                            </p>
                          </div>
                          {examStatusBadge(attempt)}
                        </div>
                        {attempt.submittedAt && (
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span style={{ fontFamily: font }}>
                                {t.score}:{' '}
                                <span className="font-bold text-foreground">
                                  {attempt.score ?? '—'}
                                </span>
                              </span>
                              <span style={{ fontFamily: font }}>
                                {t.passingScore}:{' '}
                                <span className="font-bold text-foreground">
                                  {attempt.exam.passingScore}
                                </span>
                              </span>
                              <span dir="ltr">
                                {new Date(attempt.submittedAt).toLocaleDateString('en-EG')}
                              </span>
                            </div>
                            <span
                              className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0"
                              style={{ fontFamily: font }}
                            >
                              {t.viewAnswers}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </main>

      <Footer lang={lang} />

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        lang={lang}
        profile={profile}
      />
    </div>
  );
}
