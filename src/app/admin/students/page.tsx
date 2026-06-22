// src/app/admin/students/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import {
  Search,
  UserPlus,
  Loader2,
  Ban,
  CheckCircle,
  Trash2,
  Wallet,
  X,
  Plus,
  Minus,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminLang } from '../Adminshell';

// ── Types ──────────────────────────────────────────────────────
interface Student {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  academicYear: string | null;
  isActive: boolean;
  balance: number;
  avatarUrl: string | null; // ✅ added
  createdAt: string;
}

// ── Grade label map ────────────────────────────────────────────
const gradeMap: Record<string, { ar: string; en: string }> = {
  'grade-1': { ar: 'الصف الأول الابتدائي', en: 'Grade 1 - Primary' },
  'grade-2': { ar: 'الصف الثاني الابتدائي', en: 'Grade 2 - Primary' },
  'grade-3': { ar: 'الصف الثالث الابتدائي', en: 'Grade 3 - Primary' },
  'grade-4': { ar: 'الصف الرابع الابتدائي', en: 'Grade 4 - Primary' },
  'grade-5': { ar: 'الصف الخامس الابتدائي', en: 'Grade 5 - Primary' },
  'grade-6': { ar: 'الصف السادس الابتدائي', en: 'Grade 6 - Primary' },
  'grade-7': { ar: 'الصف الأول الإعدادي', en: 'Grade 7 - Middle' },
  'grade-8': { ar: 'الصف الثاني الإعدادي', en: 'Grade 8 - Middle' },
  'grade-9': { ar: 'الصف الثالث الإعدادي', en: 'Grade 9 - Middle' },
  'grade-10': { ar: 'الصف الأول الثانوي', en: 'Grade 10 - High' },
  'grade-11': { ar: 'الصف الثاني الثانوي', en: 'Grade 11 - High' },
  'grade-12': { ar: 'الصف الثالث الثانوي', en: 'Grade 12 - High' },
};

// ── Translations ───────────────────────────────────────────────
const content = {
  ar: {
    title: 'الطلاب',
    search: 'بحث بالاسم أو الهاتف...',
    addStudent: 'إضافة طالب',
    name: 'الاسم',
    phone: 'الهاتف',
    grade: 'الصف',
    balance: 'الرصيد',
    status: 'الحالة',
    joinedAt: 'تاريخ التسجيل',
    actions: 'إجراءات',
    active: 'نشط',
    suspended: 'موقوف',
    suspend: 'تعليق',
    activate: 'تفعيل',
    delete: 'حذف',
    manageBalance: 'إدارة الرصيد',
    noData: 'لا يوجد طلاب',
    loading: 'جارٍ التحميل...',
    errorLoading: 'فشل تحميل البيانات',
    egp: 'ج.م',
    addStudentTitle: 'إضافة طالب جديد',
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'أدخل الاسم الكامل',
    phonePlaceholder: '01XXXXXXXXX',
    emailLabel: 'البريد الإلكتروني (اختياري)',
    emailPlaceholder: 'example@email.com',
    academicYear: 'السنة الدراسية',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: '••••••••',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    cancel: 'إلغاء',
    phoneExists: 'رقم الهاتف مسجل بالفعل',
    addedSuccess: 'تمت إضافة الطالب بنجاح',
    balanceTitle: 'إدارة رصيد',
    currentBalance: 'الرصيد الحالي',
    addBalance: 'إضافة رصيد',
    deductBalance: 'خصم رصيد',
    amount: 'المبلغ (ج.م)',
    amountPlaceholder: '0',
    balanceUpdated: 'تم تحديث الرصيد بنجاح',
    confirmDelete: 'هل أنت متأكد من حذف هذا الطالب؟',
    confirmDeleteBtn: 'حذف نهائيًا',
    deletedSuccess: 'تم حذف الطالب بنجاح',
    suspendedSuccess: 'تم تعليق الحساب',
    activatedSuccess: 'تم تفعيل الحساب',
  },
  en: {
    title: 'Students',
    search: 'Search by name or phone...',
    addStudent: 'Add Student',
    name: 'Name',
    phone: 'Phone',
    grade: 'Grade',
    balance: 'Balance',
    status: 'Status',
    joinedAt: 'Joined',
    actions: 'Actions',
    active: 'Active',
    suspended: 'Suspended',
    suspend: 'Suspend',
    activate: 'Activate',
    delete: 'Delete',
    manageBalance: 'Manage Balance',
    noData: 'No students found',
    loading: 'Loading...',
    errorLoading: 'Failed to load data',
    egp: 'EGP',
    addStudentTitle: 'Add New Student',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter full name',
    phonePlaceholder: '01XXXXXXXXX',
    emailLabel: 'Email (Optional)',
    emailPlaceholder: 'example@email.com',
    academicYear: 'Academic Year',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    phoneExists: 'Phone number already registered',
    addedSuccess: 'Student added successfully',
    balanceTitle: 'Manage Balance for',
    currentBalance: 'Current Balance',
    addBalance: 'Add Balance',
    deductBalance: 'Deduct Balance',
    amount: 'Amount (EGP)',
    amountPlaceholder: '0',
    balanceUpdated: 'Balance updated successfully',
    confirmDelete: 'Are you sure you want to delete this student?',
    confirmDeleteBtn: 'Delete Permanently',
    deletedSuccess: 'Student deleted successfully',
    suspendedSuccess: 'Account suspended',
    activatedSuccess: 'Account activated',
  },
};

// ── Avatar cell helper ─────────────────────────────────────────
function StudentAvatar({ src, name }: { src: string | null; name: string }) {
  const initials = name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center border border-border">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-primary leading-none">{initials}</span>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function AdminStudentsPage() {
  const { lang, isRtl } = useAdminLang();
  const t = content[lang];
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    academicYear: '',
    password: '',
  });
  const [addLoading, setAddLoading] = useState(false);

  const [balanceStudent, setBalanceStudent] = useState<Student | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const gradeLabel = (year: string | null) => {
    if (!year) return '—';
    return gradeMap[year]?.[lang] ?? year;
  };

  const fetchStudents = () => {
    setLoading(true);
    setError(false);
    fetch('/api/admin/students')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setStudents)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students.filter(
    (s) => s.fullName.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)
  );

  const handleToggleStatus = async (student: Student) => {
    const action = student.isActive ? 'suspend' : 'activate';
    const res = await fetch('/api/admin/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: student.id, action }),
    });
    if (res.ok) {
      toast.success(action === 'suspend' ? t.suspendedSuccess : t.activatedSuccess);
      fetchStudents();
    }
  };

  const handleDelete = async () => {
    if (!deleteStudent) return;
    setDeleteLoading(true);
    const res = await fetch('/api/admin/students', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteStudent.id }),
    });
    if (res.ok) {
      toast.success(t.deletedSuccess);
      setDeleteStudent(null);
      fetchStudents();
    }
    setDeleteLoading(false);
  };

  const handleAdd = async () => {
    if (!addForm.fullName || !addForm.phone || !addForm.password) return;
    setAddLoading(true);
    const res = await fetch('/api/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    if (res.ok) {
      toast.success(t.addedSuccess);
      setShowAdd(false);
      setAddForm({ fullName: '', phone: '', email: '', academicYear: '', password: '' });
      fetchStudents();
    } else if (res.status === 409) {
      toast.error(t.phoneExists);
    }
    setAddLoading(false);
  };

  const handleBalance = async (action: 'addBalance' | 'deductBalance') => {
    if (!balanceStudent || !balanceAmount) return;
    setBalanceLoading(true);
    const res = await fetch('/api/admin/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: balanceStudent.id, action, amount: Number(balanceAmount) }),
    });
    if (res.ok) {
      toast.success(t.balanceUpdated);
      setBalanceStudent(null);
      setBalanceAmount('');
      fetchStudents();
    }
    setBalanceLoading(false);
  };

  const getBorderDirection = () => (isRtl ? 'border-l border-border' : 'border-r border-border');

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: font }}>
          {t.title}
        </h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
          style={{ fontFamily: font }}
        >
          <UserPlus size={16} />
          {t.addStudent}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute top-1/2 -translate-y-1/2 text-muted-foreground"
          style={{ [isRtl ? 'right' : 'left']: '14px' }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.search}
          className="w-full max-w-sm py-2.5 rounded-xl border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          style={{
            fontFamily: font,
            [isRtl ? 'paddingRight' : 'paddingLeft']: '40px',
            [isRtl ? 'paddingLeft' : 'paddingRight']: '16px',
          }}
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted">
              <tr>
                {[t.name, t.phone, t.grade, t.balance, t.status, t.joinedAt, t.actions].map(
                  (col, i, arr) => (
                    <th
                      key={col}
                      className={`px-4 py-3 text-center border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${
                        i < arr.length - 1 ? getBorderDirection() : ''
                      }`}
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
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-red-500 text-sm"
                    style={{ fontFamily: font }}
                  >
                    {t.errorLoading}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                    style={{ fontFamily: font }}
                  >
                    {t.noData}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="odd:bg-background even:bg-muted/10 hover:bg-muted/30 transition-colors"
                  >
                    {/* ── Name + Avatar ── */}
                    <td
                      className={`px-4 py-3 text-center align-middle border-b border-border ${getBorderDirection()}`}
                    >
                      <div className="flex items-center justify-center gap-2.5">
                        <StudentAvatar src={s.avatarUrl} name={s.fullName} />
                        <span
                          className="font-semibold text-foreground whitespace-nowrap"
                          style={{ fontFamily: font }}
                        >
                          {s.fullName}
                        </span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td
                      className={`px-4 py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground`}
                      dir="ltr"
                    >
                      {s.phone}
                    </td>

                    {/* Grade */}
                    <td
                      className={`px-4 py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground`}
                      style={{ fontFamily: font }}
                    >
                      {gradeLabel(s.academicYear)}
                    </td>

                    {/* Balance */}
                    <td
                      className={`px-4 py-3 text-center align-middle border-b border-border ${getBorderDirection()} font-semibold text-foreground`}
                      dir="ltr"
                    >
                      {s.balance ?? 0} {t.egp}
                    </td>

                    {/* Status */}
                    <td
                      className={`px-4 py-3 text-center align-middle border-b border-border ${getBorderDirection()}`}
                    >
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          s.isActive
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                        style={{ fontFamily: font }}
                      >
                        {s.isActive ? t.active : t.suspended}
                      </span>
                    </td>

                    {/* Joined */}
                    <td
                      className={`px-4 py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground`}
                      dir="ltr"
                    >
                      {new Date(s.createdAt).toLocaleDateString('en-EG')}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center align-middle border-b border-border">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setBalanceStudent(s);
                            setBalanceAmount('');
                          }}
                          title={t.manageBalance}
                          className="p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Wallet size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s)}
                          title={s.isActive ? t.suspend : t.activate}
                          className={`p-2 rounded-lg transition-colors ${
                            s.isActive
                              ? 'text-muted-foreground hover:bg-orange-50 hover:text-orange-500'
                              : 'text-muted-foreground hover:bg-green-50 hover:text-green-500'
                          }`}
                        >
                          {s.isActive ? <Ban size={15} /> : <CheckCircle size={15} />}
                        </button>
                        <button
                          onClick={() => setDeleteStudent(s)}
                          title={t.delete}
                          className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
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

      {/* ── Add Student Modal ── */}
      {showAdd && (
        <Modal
          onClose={() => setShowAdd(false)}
          title={t.addStudentTitle}
          font={font}
          isRtl={isRtl}
        >
          <div className="flex flex-col gap-3">
            <Field label={t.fullName} font={font}>
              <input
                value={addForm.fullName}
                onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                placeholder={t.fullNamePlaceholder}
                className="input-field"
                style={{ fontFamily: font }}
              />
            </Field>
            <Field label={t.phone} font={font}>
              <input
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                placeholder={t.phonePlaceholder}
                dir="ltr"
                className="input-field"
              />
            </Field>
            <Field label={t.emailLabel} font={font}>
              <input
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder={t.emailPlaceholder}
                dir="ltr"
                className="input-field"
              />
            </Field>
            <Field label={t.academicYear} font={font}>
              <select
                value={addForm.academicYear}
                onChange={(e) => setAddForm({ ...addForm, academicYear: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                style={{ fontFamily: 'var(--font-cairo)' }}
              >
                <option value="">{lang === 'ar' ? 'اختر الصف الدراسي' : 'Select grade'}</option>
                <optgroup label={lang === 'ar' ? 'المرحلة الابتدائية' : 'Primary'}>
                  <option value="grade-1">
                    {lang === 'ar' ? 'الصف الأول الابتدائي' : 'Grade 1 - Primary'}
                  </option>
                  <option value="grade-2">
                    {lang === 'ar' ? 'الصف الثاني الابتدائي' : 'Grade 2 - Primary'}
                  </option>
                  <option value="grade-3">
                    {lang === 'ar' ? 'الصف الثالث الابتدائي' : 'Grade 3 - Primary'}
                  </option>
                  <option value="grade-4">
                    {lang === 'ar' ? 'الصف الرابع الابتدائي' : 'Grade 4 - Primary'}
                  </option>
                  <option value="grade-5">
                    {lang === 'ar' ? 'الصف الخامس الابتدائي' : 'Grade 5 - Primary'}
                  </option>
                  <option value="grade-6">
                    {lang === 'ar' ? 'الصف السادس الابتدائي' : 'Grade 6 - Primary'}
                  </option>
                </optgroup>
                <optgroup label={lang === 'ar' ? 'المرحلة الإعدادية' : 'Middle School'}>
                  <option value="grade-7">
                    {lang === 'ar' ? 'الصف الأول الإعدادي' : 'Grade 7 - Middle'}
                  </option>
                  <option value="grade-8">
                    {lang === 'ar' ? 'الصف الثاني الإعدادي' : 'Grade 8 - Middle'}
                  </option>
                  <option value="grade-9">
                    {lang === 'ar' ? 'الصف الثالث الإعدادي' : 'Grade 9 - Middle'}
                  </option>
                </optgroup>
                <optgroup label={lang === 'ar' ? 'المرحلة الثانوية' : 'High School'}>
                  <option value="grade-10">
                    {lang === 'ar' ? 'الصف الأول الثانوي' : 'Grade 10 - High'}
                  </option>
                  <option value="grade-11">
                    {lang === 'ar' ? 'الصف الثاني الثانوي' : 'Grade 11 - High'}
                  </option>
                  <option value="grade-12">
                    {lang === 'ar' ? 'الصف الثالث الثانوي' : 'Grade 12 - High'}
                  </option>
                </optgroup>
              </select>
            </Field>
            <Field label={t.passwordLabel} font={font}>
              <input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder={t.passwordPlaceholder}
                dir="ltr"
                className="input-field"
              />
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleAdd}
              disabled={addLoading}
              className="px-5 py-2 rounded-xl gradient-primary text-white text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {addLoading ? <Loader2 size={16} className="animate-spin" /> : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Balance Modal ── */}
      {balanceStudent && (
        <Modal
          onClose={() => setBalanceStudent(null)}
          title={`${t.balanceTitle} ${balanceStudent.fullName}`}
          font={font}
          isRtl={isRtl}
        >
          <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: font }}>
            {t.currentBalance}:{' '}
            <span className="font-bold text-foreground">
              {balanceStudent.balance ?? 0} {t.egp}
            </span>
          </p>
          <Field label={t.amount} font={font}>
            <input
              type="number"
              min="1"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              placeholder={t.amountPlaceholder}
              dir="ltr"
              className="input-field"
            />
          </Field>
          <div className="flex items-center gap-2 mt-5">
            <button
              onClick={() => handleBalance('addBalance')}
              disabled={balanceLoading || !balanceAmount}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              <Plus size={15} />
              {t.addBalance}
            </button>
            <button
              onClick={() => handleBalance('deductBalance')}
              disabled={balanceLoading || !balanceAmount}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              <Minus size={15} />
              {t.deductBalance}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteStudent && (
        <Modal onClose={() => setDeleteStudent(null)} title={t.delete} font={font} isRtl={isRtl}>
          <p
            className="text-sm text-muted-foreground mb-6 leading-relaxed"
            style={{ fontFamily: font }}
          >
            {t.confirmDelete}{' '}
            <span className="font-bold text-foreground">{deleteStudent.fullName}</span>؟
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteStudent(null)}
              className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : t.confirmDeleteBtn}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Reusable Modal ─────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-2xl border border-border card-shadow w-full max-w-md p-6 relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-foreground" style={{ fontFamily: font }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Reusable Field ─────────────────────────────────────────────
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
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground" style={{ fontFamily: font }}>
        {label}
      </label>
      {children}
    </div>
  );
}
