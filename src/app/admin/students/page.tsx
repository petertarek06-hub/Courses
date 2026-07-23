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
  Pencil,
  Users,
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
  avatarUrl: string | null;
  createdAt: string;
  guardianPhones: string[];
}

interface Guardian {
  id: number;
  fullName: string;
  phone: string;
  createdAt: string;
  student: {
    id: number;
    fullName: string;
    phone: string;
    academicYear: string | null;
  };
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
    guardianPhone: 'هاتف ولي الأمر',
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
    phoneInvalid: 'أدخل رقم هاتف مصري صحيح (01xxxxxxxxx)',
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
    insufficientBalance: 'رصيد الطالب غير كافٍ لإتمام عملية الخصم',
    genericBalanceError: 'حدث خطأ أثناء تحديث الرصيد',
    confirmDelete: 'هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف بيانات ولي الأمر المرتبط أيضًا.',
    confirmDeleteBtn: 'حذف نهائيًا',
    deletedSuccess: 'تم حذف الطالب بنجاح',
    deleteError: 'حدث خطأ أثناء حذف الطالب',
    suspendedSuccess: 'تم تعليق الحساب',
    activatedSuccess: 'تم تفعيل الحساب',
    // ── Edit student ──
    editStudent: 'تعديل بيانات الطالب',
    editStudentTitle: 'تعديل بيانات',
    editedSuccess: 'تم تحديث بيانات الطالب بنجاح',
    phoneExistsOther: 'رقم الهاتف مسجل لمستخدم آخر',
    // ── Guardians ──
    studentsTab: 'الطلاب',
    guardiansTab: 'أولياء الأمور',
    addGuardian: 'إضافة ولي أمر',
    addGuardianTitle: 'إضافة ولي أمر لـ',
    includeGuardianLabel: 'إضافة ولي أمر الآن',
    guardianFullName: 'اسم ولي الأمر',
    guardianPhone2: 'هاتف ولي الأمر',
    guardianPassword: 'كلمة مرور ولي الأمر',
    guardianAddedSuccess: 'تمت إضافة ولي الأمر بنجاح',
    guardianPhoneExists: 'رقم هاتف ولي الأمر مسجل بالفعل',
    guardianEditedSuccess: 'تم تحديث بيانات ولي الأمر',
    guardianDeletedSuccess: 'تم حذف ولي الأمر',
    confirmDeleteGuardian: 'هل أنت متأكد من حذف ولي الأمر',
    linkedStudent: 'الطالب المرتبط',
    noGuardians: 'لا يوجد أولياء أمور',
    editGuardian: 'تعديل ولي الأمر',
    leaveBlankPassword: 'اتركه فارغًا للإبقاء على كلمة المرور الحالية',
    passwordTooShort: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل',
    noneLabel: '—',
  },
  en: {
    title: 'Students',
    search: 'Search by name or phone...',
    addStudent: 'Add Student',
    name: 'Name',
    phone: 'Phone',
    guardianPhone: 'Guardian Phone',
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
    phoneInvalid: 'Enter a valid Egyptian phone number (01xxxxxxxxx)',
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
    insufficientBalance: "Deduction exceeds the student's current balance",
    genericBalanceError: 'Something went wrong updating the balance',
    confirmDelete:
      'Are you sure you want to delete this student? Their linked guardian(s) will be deleted too.',
    confirmDeleteBtn: 'Delete Permanently',
    deletedSuccess: 'Student deleted successfully',
    deleteError: 'Something went wrong deleting the student',
    suspendedSuccess: 'Account suspended',
    activatedSuccess: 'Account activated',
    // ── Edit student ──
    editStudent: 'Edit Student',
    editStudentTitle: 'Edit Details for',
    editedSuccess: 'Student details updated successfully',
    phoneExistsOther: 'Phone number already registered to another user',
    // ── Guardians ──
    studentsTab: 'Students',
    guardiansTab: 'Guardians',
    addGuardian: 'Add Guardian',
    addGuardianTitle: 'Add Guardian for',
    includeGuardianLabel: 'Add a guardian now',
    guardianFullName: "Guardian's Full Name",
    guardianPhone2: "Guardian's Phone",
    guardianPassword: "Guardian's Password",
    guardianAddedSuccess: 'Guardian added successfully',
    guardianPhoneExists: 'Guardian phone number already registered',
    guardianEditedSuccess: 'Guardian details updated',
    guardianDeletedSuccess: 'Guardian deleted',
    confirmDeleteGuardian: 'Are you sure you want to delete guardian',
    linkedStudent: 'Linked Student',
    noGuardians: 'No guardians found',
    editGuardian: 'Edit Guardian',
    leaveBlankPassword: 'Leave blank to keep the current password',
    passwordTooShort: 'The password must be at least 8 characters long',
    noneLabel: '—',
  },
};

const EG_PHONE_REGEX = /^01[0-9]{9}$/;
const MIN_PASSWORD_LENGTH = 8;

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
    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center border border-border">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-[8px] sm:text-xs font-bold text-primary leading-none">
          {initials}
        </span>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function AdminStudentsPage() {
  const { lang, isRtl, canDelete } = useAdminLang();
  const t = content[lang];
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [view, setView] = useState<'students' | 'guardians'>('students');

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  // ── Add student ──
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    academicYear: '',
    password: '',
  });
  const [includeGuardian, setIncludeGuardian] = useState(false);
  const [addGuardianForm, setAddGuardianForm] = useState({
    fullName: '',
    phone: '',
    password: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addErrors, setAddErrors] = useState<{
    phone?: string;
    password?: string;
    guardianPhone?: string;
    guardianPassword?: string;
  }>({});

  // ── Edit student ──
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    academicYear: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState<{ phone?: string }>({});

  // ── Balance ──
  const [balanceStudent, setBalanceStudent] = useState<Student | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  // ── Delete student ──
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Guardians ──
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [guardiansLoading, setGuardiansLoading] = useState(true);
  const [guardiansError, setGuardiansError] = useState(false);
  const [guardianSearch, setGuardianSearch] = useState('');

  const [guardianStudent, setGuardianStudent] = useState<Student | null>(null); // add-guardian target
  const [guardianForm, setGuardianForm] = useState({ fullName: '', phone: '', password: '' });
  const [guardianLoading, setGuardianLoading] = useState(false);
  const [guardianErrors, setGuardianErrors] = useState<{ phone?: string; password?: string }>({});

  const [editGuardian, setEditGuardian] = useState<Guardian | null>(null);
  const [editGuardianForm, setEditGuardianForm] = useState({
    fullName: '',
    phone: '',
    password: '',
  });
  const [editGuardianLoading, setEditGuardianLoading] = useState(false);
  const [editGuardianErrors, setEditGuardianErrors] = useState<{
    phone?: string;
    password?: string;
  }>({});

  const [deleteGuardian, setDeleteGuardian] = useState<Guardian | null>(null);
  const [deleteGuardianLoading, setDeleteGuardianLoading] = useState(false);

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

  const fetchGuardians = () => {
    setGuardiansLoading(true);
    setGuardiansError(false);
    fetch('/api/admin/guardians')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setGuardians)
      .catch(() => setGuardiansError(true))
      .finally(() => setGuardiansLoading(false));
  };

  useEffect(() => {
    fetchStudents();
    fetchGuardians();
  }, []);

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.guardianPhones.some((p) => p.includes(search))
  );

  const filteredGuardians = guardians.filter(
    (g) =>
      g.fullName.toLowerCase().includes(guardianSearch.toLowerCase()) ||
      g.phone.includes(guardianSearch) ||
      g.student.fullName.toLowerCase().includes(guardianSearch.toLowerCase())
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
    try {
      const res = await fetch('/api/admin/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteStudent.id }),
      });
      if (res.ok) {
        toast.success(t.deletedSuccess);
        setDeleteStudent(null);
        fetchStudents();
        fetchGuardians(); // guardians of this student are deleted along with them
      } else {
        toast.error(t.deleteError);
      }
    } catch {
      toast.error(t.deleteError);
    }
    setDeleteLoading(false);
  };

  const resetAddModal = () => {
    setShowAdd(false);
    setAddForm({ fullName: '', phone: '', email: '', academicYear: '', password: '' });
    setAddGuardianForm({ fullName: '', phone: '', password: '' });
    setIncludeGuardian(false);
    setAddErrors({});
  };

  const handleAdd = async () => {
    const phone = addForm.phone.trim();
    const errors: typeof addErrors = {};

    if (!EG_PHONE_REGEX.test(phone)) {
      errors.phone = t.phoneInvalid;
    }
    if (addForm.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = t.passwordTooShort;
    }
    if (includeGuardian) {
      if (!EG_PHONE_REGEX.test(addGuardianForm.phone.trim())) {
        errors.guardianPhone = t.phoneInvalid;
      }
      if (addGuardianForm.password.length < MIN_PASSWORD_LENGTH) {
        errors.guardianPassword = t.passwordTooShort;
      }
    }
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }
    setAddErrors({});

    if (!addForm.fullName || !phone || !addForm.password) return;
    if (
      includeGuardian &&
      (!addGuardianForm.fullName || !addGuardianForm.phone || !addGuardianForm.password)
    )
      return;

    setAddLoading(true);
    const res = await fetch('/api/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...addForm,
        phone,
        guardian: includeGuardian
          ? { ...addGuardianForm, phone: addGuardianForm.phone.trim() }
          : undefined,
      }),
    });
    if (res.ok) {
      toast.success(t.addedSuccess);
      resetAddModal();
      fetchStudents();
      fetchGuardians();
    } else {
      const data = await res.json().catch(() => null);
      if (data?.error === 'guardian_password_too_short') {
        setAddErrors({ guardianPassword: t.passwordTooShort });
        toast.error(t.passwordTooShort);
      } else if (data?.error === 'password_too_short') {
        setAddErrors({ password: t.passwordTooShort });
        toast.error(t.passwordTooShort);
      } else if (data?.error === 'Guardian phone already registered') {
        setAddErrors({ guardianPhone: t.guardianPhoneExists });
        toast.error(t.guardianPhoneExists);
      } else if (res.status === 409) {
        toast.error(t.phoneExists);
      }
    }
    setAddLoading(false);
  };

  const openEditModal = (s: Student) => {
    setEditStudent(s);
    setEditForm({
      fullName: s.fullName,
      phone: s.phone,
      email: s.email ?? '',
      academicYear: s.academicYear ?? '',
    });
    setEditErrors({});
  };

  const handleEdit = async () => {
    if (!editStudent) return;
    const phone = editForm.phone.trim();

    if (!EG_PHONE_REGEX.test(phone)) {
      setEditErrors({ phone: t.phoneInvalid });
      return;
    }
    setEditErrors({});
    if (!editForm.fullName) return;

    setEditLoading(true);
    const res = await fetch('/api/admin/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editStudent.id,
        action: 'editDetails',
        ...editForm,
        phone,
      }),
    });
    if (res.ok) {
      toast.success(t.editedSuccess);
      setEditStudent(null);
      fetchStudents();
    } else if (res.status === 409) {
      setEditErrors({ phone: t.phoneExistsOther });
      toast.error(t.phoneExistsOther);
    }
    setEditLoading(false);
  };

  const handleBalance = async (action: 'addBalance' | 'deductBalance') => {
    if (!balanceStudent || !balanceAmount) return;
    setBalanceLoading(true);
    try {
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
      } else {
        const data = await res.json().catch(() => null);
        if (data?.error === 'insufficient_balance') {
          toast.error(t.insufficientBalance);
        } else {
          toast.error(t.genericBalanceError);
        }
      }
    } catch {
      toast.error(t.genericBalanceError);
    }
    setBalanceLoading(false);
  };

  // ── Guardian handlers ──
  const openAddGuardianModal = (s: Student) => {
    setGuardianStudent(s);
    setGuardianForm({ fullName: '', phone: '', password: '' });
    setGuardianErrors({});
  };

  const handleAddGuardian = async () => {
    if (!guardianStudent) return;
    const phone = guardianForm.phone.trim();
    const errors: typeof guardianErrors = {};

    if (!EG_PHONE_REGEX.test(phone)) errors.phone = t.phoneInvalid;
    if (guardianForm.password.length < MIN_PASSWORD_LENGTH) errors.password = t.passwordTooShort;
    if (Object.keys(errors).length > 0) {
      setGuardianErrors(errors);
      return;
    }
    setGuardianErrors({});
    if (!guardianForm.fullName) return;

    setGuardianLoading(true);
    const res = await fetch('/api/admin/guardians', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: guardianStudent.id,
        fullName: guardianForm.fullName,
        phone,
        password: guardianForm.password,
      }),
    });
    if (res.ok) {
      toast.success(t.guardianAddedSuccess);
      setGuardianStudent(null);
      fetchGuardians();
      fetchStudents(); // refresh guardian phone shown on the students table
    } else {
      const data = await res.json().catch(() => null);
      if (data?.error === 'password_too_short') {
        setGuardianErrors({ password: t.passwordTooShort });
        toast.error(t.passwordTooShort);
      } else if (res.status === 409) {
        setGuardianErrors({ phone: t.guardianPhoneExists });
        toast.error(t.guardianPhoneExists);
      }
    }
    setGuardianLoading(false);
  };

  const openEditGuardianModal = (g: Guardian) => {
    setEditGuardian(g);
    setEditGuardianForm({ fullName: g.fullName, phone: g.phone, password: '' });
    setEditGuardianErrors({});
  };

  const handleEditGuardian = async () => {
    if (!editGuardian) return;
    const phone = editGuardianForm.phone.trim();
    const errors: typeof editGuardianErrors = {};

    if (!EG_PHONE_REGEX.test(phone)) errors.phone = t.phoneInvalid;
    if (editGuardianForm.password && editGuardianForm.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = t.passwordTooShort;
    }
    if (Object.keys(errors).length > 0) {
      setEditGuardianErrors(errors);
      return;
    }
    setEditGuardianErrors({});
    if (!editGuardianForm.fullName) return;

    setEditGuardianLoading(true);
    const res = await fetch('/api/admin/guardians', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editGuardian.id,
        fullName: editGuardianForm.fullName,
        phone,
        password: editGuardianForm.password || undefined,
      }),
    });
    if (res.ok) {
      toast.success(t.guardianEditedSuccess);
      setEditGuardian(null);
      fetchGuardians();
      fetchStudents();
    } else {
      const data = await res.json().catch(() => null);
      if (data?.error === 'password_too_short') {
        setEditGuardianErrors({ password: t.passwordTooShort });
        toast.error(t.passwordTooShort);
      } else if (res.status === 409) {
        setEditGuardianErrors({ phone: t.guardianPhoneExists });
        toast.error(t.guardianPhoneExists);
      }
    }
    setEditGuardianLoading(false);
  };

  const handleDeleteGuardian = async () => {
    if (!deleteGuardian) return;
    setDeleteGuardianLoading(true);
    const res = await fetch('/api/admin/guardians', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteGuardian.id }),
    });
    if (res.ok) {
      toast.success(t.guardianDeletedSuccess);
      setDeleteGuardian(null);
      fetchGuardians();
      fetchStudents();
    }
    setDeleteGuardianLoading(false);
  };

  const getBorderDirection = () => (isRtl ? 'border-l border-border' : 'border-r border-border');

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-6 gap-2 flex-wrap">
        <h1
          className="text-lg sm:text-2xl font-extrabold text-foreground"
          style={{ fontFamily: font }}
        >
          {view === 'students' ? t.title : t.guardiansTab}
        </h1>
        {view === 'students' ? (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl gradient-primary text-white text-[10px] sm:text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
            style={{ fontFamily: font }}
          >
            <UserPlus size={12} className="sm:hidden" />
            <UserPlus size={16} className="hidden sm:block" />
            <span className="text-[10px] sm:text-sm">{t.addStudent}</span>
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Tabs: Students / Guardians */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
        <button
          onClick={() => setView('students')}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-sm font-bold transition-all ${
            view === 'students'
              ? 'gradient-primary text-white shadow-md'
              : 'bg-card border border-border text-muted-foreground hover:bg-muted'
          }`}
          style={{ fontFamily: font }}
        >
          {t.studentsTab}
        </button>
        <button
          onClick={() => setView('guardians')}
          className={`flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-sm font-bold transition-all ${
            view === 'guardians'
              ? 'gradient-primary text-white shadow-md'
              : 'bg-card border border-border text-muted-foreground hover:bg-muted'
          }`}
          style={{ fontFamily: font }}
        >
          <Users size={12} className="sm:hidden" />
          <Users size={14} className="hidden sm:block" />
          {t.guardiansTab}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-2.5 sm:mb-4">
        <Search
          size={12}
          className="absolute top-1/2 -translate-y-1/2 text-muted-foreground sm:hidden"
          style={{ [isRtl ? 'right' : 'left']: '10px' }}
        />
        <Search
          size={16}
          className="absolute top-1/2 -translate-y-1/2 text-muted-foreground hidden sm:block"
          style={{ [isRtl ? 'right' : 'left']: '14px' }}
        />
        <input
          value={view === 'students' ? search : guardianSearch}
          onChange={(e) =>
            view === 'students' ? setSearch(e.target.value) : setGuardianSearch(e.target.value)
          }
          placeholder={t.search}
          className="w-full max-w-sm py-1.5 sm:py-2.5 rounded-xl border border-border bg-card text-[10px] sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          style={{
            fontFamily: font,
            [isRtl ? 'paddingRight' : 'paddingLeft']: '30px',
            [isRtl ? 'paddingLeft' : 'paddingRight']: '12px',
          }}
        />
      </div>

      {/* ── Students Table ── */}
      {view === 'students' && (
        <div className="bg-card rounded-xl sm:rounded-2xl border border-border card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[9px] sm:text-sm border-collapse">
              <thead className="bg-muted">
                <tr>
                  {[
                    t.name,
                    t.phone,
                    t.guardianPhone,
                    t.grade,
                    t.balance,
                    t.status,
                    t.joinedAt,
                    t.actions,
                  ].map((col, i, arr) => (
                    <th
                      key={col}
                      className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center border-b border-border text-[7px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap ${
                        i < arr.length - 1 ? getBorderDirection() : ''
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
                    <td colSpan={8} className="py-8 sm:py-12 text-center">
                      <Loader2 size={18} className="animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-6 sm:py-10 text-center text-red-500 text-[9px] sm:text-sm"
                      style={{ fontFamily: font }}
                    >
                      {t.errorLoading}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 sm:py-10 text-center text-muted-foreground text-[10px] sm:text-sm"
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
                      {/* Name + Avatar */}
                      <td
                        className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()}`}
                      >
                        <div className="flex items-center justify-center gap-1 sm:gap-2.5">
                          <StudentAvatar src={s.avatarUrl} name={s.fullName} />
                          <span
                            className="font-semibold text-foreground whitespace-nowrap text-[9px] sm:text-sm"
                            style={{ fontFamily: font }}
                          >
                            {s.fullName.length > 12 ? `${s.fullName.slice(0, 10)}...` : s.fullName}
                          </span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td
                        className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground text-[8px] sm:text-sm`}
                        dir="ltr"
                      >
                        {s.phone}
                      </td>

                      {/* Guardian Phone */}
                      <td
                        className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground text-[8px] sm:text-sm`}
                        dir="ltr"
                      >
                        {(s.guardianPhones?.length ?? 0) > 0
                          ? s.guardianPhones.join(', ')
                          : t.noneLabel}
                      </td>

                      {/* Grade */}
                      <td
                        className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground text-[8px] sm:text-sm`}
                        style={{ fontFamily: font }}
                      >
                        {gradeLabel(s.academicYear)}
                      </td>

                      {/* Balance */}
                      <td
                        className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} font-semibold text-foreground text-[8px] sm:text-sm`}
                        dir="ltr"
                      >
                        {s.balance ?? 0} {t.egp}
                      </td>

                      {/* Status */}
                      <td
                        className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()}`}
                      >
                        <span
                          className={`inline-flex items-center px-1 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-xs font-bold ${
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
                        className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground text-[7px] sm:text-xs`}
                        dir="ltr"
                      >
                        {new Date(s.createdAt).toLocaleDateString('en-EG')}
                      </td>

                      {/* Actions */}
                      <td className="px-1 sm:px-4 py-1.5 sm:py-3 text-center align-middle border-b border-border">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-2">
                          <button
                            onClick={() => openEditModal(s)}
                            title={t.editStudent}
                            className="p-1 sm:p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Pencil size={12} className="sm:hidden" />
                            <Pencil size={15} className="hidden sm:block" />
                          </button>
                          <button
                            onClick={() => openAddGuardianModal(s)}
                            title={t.addGuardian}
                            className="p-1 sm:p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Users size={12} className="sm:hidden" />
                            <Users size={15} className="hidden sm:block" />
                          </button>
                          <button
                            onClick={() => {
                              setBalanceStudent(s);
                              setBalanceAmount('');
                            }}
                            title={t.manageBalance}
                            className="p-1 sm:p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Wallet size={12} className="sm:hidden" />
                            <Wallet size={15} className="hidden sm:block" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(s)}
                            title={s.isActive ? t.suspend : t.activate}
                            className={`p-1 sm:p-2 rounded-lg transition-colors ${
                              s.isActive
                                ? 'text-muted-foreground hover:bg-orange-50 hover:text-orange-500'
                                : 'text-muted-foreground hover:bg-green-50 hover:text-green-500'
                            }`}
                          >
                            {s.isActive ? (
                              <>
                                <Ban size={12} className="sm:hidden" />
                                <Ban size={15} className="hidden sm:block" />
                              </>
                            ) : (
                              <>
                                <CheckCircle size={12} className="sm:hidden" />
                                <CheckCircle size={15} className="hidden sm:block" />
                              </>
                            )}
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => setDeleteStudent(s)}
                              title={t.delete}
                              className="p-1 sm:p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={12} className="sm:hidden" />
                              <Trash2 size={15} className="hidden sm:block" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Guardians Table ── */}
      {view === 'guardians' && (
        <div className="bg-card rounded-xl sm:rounded-2xl border border-border card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[9px] sm:text-sm border-collapse">
              <thead className="bg-muted">
                <tr>
                  {[t.name, t.phone, t.linkedStudent, t.joinedAt, t.actions].map((col, i, arr) => (
                    <th
                      key={col}
                      className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center border-b border-border text-[7px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap ${
                        i < arr.length - 1 ? getBorderDirection() : ''
                      }`}
                      style={{ fontFamily: font }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guardiansLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 sm:py-12 text-center">
                      <Loader2 size={18} className="animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : guardiansError ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 sm:py-10 text-center text-red-500 text-[9px] sm:text-sm"
                      style={{ fontFamily: font }}
                    >
                      {t.errorLoading}
                    </td>
                  </tr>
                ) : filteredGuardians.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 sm:py-10 text-center text-muted-foreground text-[10px] sm:text-sm"
                      style={{ fontFamily: font }}
                    >
                      {t.noGuardians}
                    </td>
                  </tr>
                ) : (
                  filteredGuardians.map((g) => (
                    <tr
                      key={g.id}
                      className="odd:bg-background even:bg-muted/10 hover:bg-muted/30 transition-colors"
                    >
                      <td
                        className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} font-semibold text-foreground text-[9px] sm:text-sm`}
                        style={{ fontFamily: font }}
                      >
                        {g.fullName}
                      </td>
                      <td
                        className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground text-[8px] sm:text-sm`}
                        dir="ltr"
                      >
                        {g.phone}
                      </td>
                      <td
                        className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground text-[8px] sm:text-sm`}
                      >
                        <div className="flex flex-col items-center">
                          <span style={{ fontFamily: font }}>{g.student.fullName}</span>
                          <span className="text-[7px] sm:text-xs" dir="ltr">
                            {g.student.phone}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`px-1 sm:px-4 py-1.5 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground text-[7px] sm:text-xs`}
                        dir="ltr"
                      >
                        {new Date(g.createdAt).toLocaleDateString('en-EG')}
                      </td>
                      <td className="px-1 sm:px-4 py-1.5 sm:py-3 text-center align-middle border-b border-border">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-2">
                          <button
                            onClick={() => openEditGuardianModal(g)}
                            title={t.editGuardian}
                            className="p-1 sm:p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Pencil size={12} className="sm:hidden" />
                            <Pencil size={15} className="hidden sm:block" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => setDeleteGuardian(g)}
                              title={t.delete}
                              className="p-1 sm:p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={12} className="sm:hidden" />
                              <Trash2 size={15} className="hidden sm:block" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add Student Modal ── */}
      {showAdd && (
        <Modal onClose={resetAddModal} title={t.addStudentTitle} font={font} isRtl={isRtl}>
          <div className="flex flex-col gap-2 sm:gap-3">
            <Field label={t.fullName} font={font}>
              <input
                value={addForm.fullName}
                onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                placeholder={t.fullNamePlaceholder}
                className="input-field text-[10px] sm:text-sm"
                style={{ fontFamily: font }}
              />
            </Field>
            <Field label={t.phone} font={font}>
              <input
                value={addForm.phone}
                onChange={(e) => {
                  setAddForm({ ...addForm, phone: e.target.value });
                  if (addErrors.phone) setAddErrors({ ...addErrors, phone: undefined });
                }}
                placeholder={t.phonePlaceholder}
                dir="ltr"
                className={`input-field text-[10px] sm:text-sm ${
                  addErrors.phone ? 'border-red-400 focus:ring-red-200' : ''
                }`}
              />
              {addErrors.phone && (
                <p
                  className="text-red-500 text-[9px] sm:text-xs mt-0.5"
                  style={{ fontFamily: font }}
                >
                  {addErrors.phone}
                </p>
              )}
            </Field>
            <Field label={t.emailLabel} font={font}>
              <input
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder={t.emailPlaceholder}
                dir="ltr"
                className="input-field text-[10px] sm:text-sm"
              />
            </Field>
            <Field label={t.academicYear} font={font}>
              <select
                value={addForm.academicYear}
                onChange={(e) => setAddForm({ ...addForm, academicYear: e.target.value })}
                className="w-full px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-xl border border-border bg-card text-[10px] sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
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
                onChange={(e) => {
                  setAddForm({ ...addForm, password: e.target.value });
                  if (addErrors.password) setAddErrors({ ...addErrors, password: undefined });
                }}
                placeholder={t.passwordPlaceholder}
                dir="ltr"
                className={`input-field text-[10px] sm:text-sm ${
                  addErrors.password ? 'border-red-400 focus:ring-red-200' : ''
                }`}
              />
              {addErrors.password && (
                <p
                  className="text-red-500 text-[9px] sm:text-xs mt-0.5"
                  style={{ fontFamily: font }}
                >
                  {addErrors.password}
                </p>
              )}
            </Field>

            {/* Optional guardian at registration time */}
            <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeGuardian}
                onChange={(e) => setIncludeGuardian(e.target.checked)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-primary"
              />
              <span
                className="text-[10px] sm:text-sm font-semibold text-foreground"
                style={{ fontFamily: font }}
              >
                {t.includeGuardianLabel}
              </span>
            </label>

            {includeGuardian && (
              <div className="flex flex-col gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border border-dashed border-border">
                <Field label={t.guardianFullName} font={font}>
                  <input
                    value={addGuardianForm.fullName}
                    onChange={(e) =>
                      setAddGuardianForm({ ...addGuardianForm, fullName: e.target.value })
                    }
                    placeholder={t.fullNamePlaceholder}
                    className="input-field text-[10px] sm:text-sm"
                    style={{ fontFamily: font }}
                  />
                </Field>
                <Field label={t.guardianPhone2} font={font}>
                  <input
                    value={addGuardianForm.phone}
                    onChange={(e) => {
                      setAddGuardianForm({ ...addGuardianForm, phone: e.target.value });
                      if (addErrors.guardianPhone)
                        setAddErrors({ ...addErrors, guardianPhone: undefined });
                    }}
                    placeholder={t.phonePlaceholder}
                    dir="ltr"
                    className={`input-field text-[10px] sm:text-sm ${
                      addErrors.guardianPhone ? 'border-red-400 focus:ring-red-200' : ''
                    }`}
                  />
                  {addErrors.guardianPhone && (
                    <p
                      className="text-red-500 text-[9px] sm:text-xs mt-0.5"
                      style={{ fontFamily: font }}
                    >
                      {addErrors.guardianPhone}
                    </p>
                  )}
                </Field>
                <Field label={t.guardianPassword} font={font}>
                  <input
                    type="password"
                    value={addGuardianForm.password}
                    onChange={(e) => {
                      setAddGuardianForm({ ...addGuardianForm, password: e.target.value });
                      if (addErrors.guardianPassword)
                        setAddErrors({ ...addErrors, guardianPassword: undefined });
                    }}
                    placeholder={t.passwordPlaceholder}
                    dir="ltr"
                    className={`input-field text-[10px] sm:text-sm ${
                      addErrors.guardianPassword ? 'border-red-400 focus:ring-red-200' : ''
                    }`}
                  />
                  {addErrors.guardianPassword && (
                    <p
                      className="text-red-500 text-[9px] sm:text-xs mt-0.5"
                      style={{ fontFamily: font }}
                    >
                      {addErrors.guardianPassword}
                    </p>
                  )}
                </Field>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 mt-3 sm:mt-5">
            <button
              onClick={resetAddModal}
              className="px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl border border-border text-[10px] sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleAdd}
              disabled={addLoading}
              className="px-3 sm:px-5 py-1 sm:py-2 rounded-xl gradient-primary text-white text-[10px] sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {addLoading ? <Loader2 size={12} className="animate-spin" /> : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Student Modal ── */}
      {editStudent && (
        <Modal
          onClose={() => setEditStudent(null)}
          title={`${t.editStudentTitle} ${editStudent.fullName}`}
          font={font}
          isRtl={isRtl}
        >
          <div className="flex flex-col gap-2 sm:gap-3">
            <Field label={t.fullName} font={font}>
              <input
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                placeholder={t.fullNamePlaceholder}
                className="input-field text-[10px] sm:text-sm"
                style={{ fontFamily: font }}
              />
            </Field>
            <Field label={t.phone} font={font}>
              <input
                value={editForm.phone}
                onChange={(e) => {
                  setEditForm({ ...editForm, phone: e.target.value });
                  if (editErrors.phone) setEditErrors({});
                }}
                placeholder={t.phonePlaceholder}
                dir="ltr"
                className={`input-field text-[10px] sm:text-sm ${
                  editErrors.phone ? 'border-red-400 focus:ring-red-200' : ''
                }`}
              />
              {editErrors.phone && (
                <p
                  className="text-red-500 text-[9px] sm:text-xs mt-0.5"
                  style={{ fontFamily: font }}
                >
                  {editErrors.phone}
                </p>
              )}
            </Field>
            <Field label={t.emailLabel} font={font}>
              <input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder={t.emailPlaceholder}
                dir="ltr"
                className="input-field text-[10px] sm:text-sm"
              />
            </Field>
            <Field label={t.academicYear} font={font}>
              <select
                value={editForm.academicYear}
                onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                className="w-full px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-xl border border-border bg-card text-[10px] sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                style={{ fontFamily: 'var(--font-cairo)' }}
              >
                <option value="">{lang === 'ar' ? 'اختر الصف الدراسي' : 'Select grade'}</option>
                {Object.entries(gradeMap).map(([value, labels]) => (
                  <option key={value} value={value}>
                    {labels[lang]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2 mt-3 sm:mt-5">
            <button
              onClick={() => setEditStudent(null)}
              className="px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl border border-border text-[10px] sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleEdit}
              disabled={editLoading}
              className="px-3 sm:px-5 py-1 sm:py-2 rounded-xl gradient-primary text-white text-[10px] sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {editLoading ? <Loader2 size={12} className="animate-spin" /> : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Add Guardian Modal (from a student row) ── */}
      {guardianStudent && (
        <Modal
          onClose={() => setGuardianStudent(null)}
          title={`${t.addGuardianTitle} ${guardianStudent.fullName}`}
          font={font}
          isRtl={isRtl}
        >
          <div className="flex flex-col gap-2 sm:gap-3">
            <Field label={t.guardianFullName} font={font}>
              <input
                value={guardianForm.fullName}
                onChange={(e) => setGuardianForm({ ...guardianForm, fullName: e.target.value })}
                placeholder={t.fullNamePlaceholder}
                className="input-field text-[10px] sm:text-sm"
                style={{ fontFamily: font }}
              />
            </Field>
            <Field label={t.guardianPhone2} font={font}>
              <input
                value={guardianForm.phone}
                onChange={(e) => {
                  setGuardianForm({ ...guardianForm, phone: e.target.value });
                  if (guardianErrors.phone)
                    setGuardianErrors({ ...guardianErrors, phone: undefined });
                }}
                placeholder={t.phonePlaceholder}
                dir="ltr"
                className={`input-field text-[10px] sm:text-sm ${
                  guardianErrors.phone ? 'border-red-400 focus:ring-red-200' : ''
                }`}
              />
              {guardianErrors.phone && (
                <p
                  className="text-red-500 text-[9px] sm:text-xs mt-0.5"
                  style={{ fontFamily: font }}
                >
                  {guardianErrors.phone}
                </p>
              )}
            </Field>
            <Field label={t.guardianPassword} font={font}>
              <input
                type="password"
                value={guardianForm.password}
                onChange={(e) => {
                  setGuardianForm({ ...guardianForm, password: e.target.value });
                  if (guardianErrors.password)
                    setGuardianErrors({ ...guardianErrors, password: undefined });
                }}
                placeholder={t.passwordPlaceholder}
                dir="ltr"
                className={`input-field text-[10px] sm:text-sm ${
                  guardianErrors.password ? 'border-red-400 focus:ring-red-200' : ''
                }`}
              />
              {guardianErrors.password && (
                <p
                  className="text-red-500 text-[9px] sm:text-xs mt-0.5"
                  style={{ fontFamily: font }}
                >
                  {guardianErrors.password}
                </p>
              )}
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2 mt-3 sm:mt-5">
            <button
              onClick={() => setGuardianStudent(null)}
              className="px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl border border-border text-[10px] sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleAddGuardian}
              disabled={guardianLoading}
              className="px-3 sm:px-5 py-1 sm:py-2 rounded-xl gradient-primary text-white text-[10px] sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {guardianLoading ? <Loader2 size={12} className="animate-spin" /> : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Guardian Modal ── */}
      {editGuardian && (
        <Modal
          onClose={() => setEditGuardian(null)}
          title={`${t.editGuardian}: ${editGuardian.fullName}`}
          font={font}
          isRtl={isRtl}
        >
          <div className="flex flex-col gap-2 sm:gap-3">
            <Field label={t.guardianFullName} font={font}>
              <input
                value={editGuardianForm.fullName}
                onChange={(e) =>
                  setEditGuardianForm({ ...editGuardianForm, fullName: e.target.value })
                }
                placeholder={t.fullNamePlaceholder}
                className="input-field text-[10px] sm:text-sm"
                style={{ fontFamily: font }}
              />
            </Field>
            <Field label={t.guardianPhone2} font={font}>
              <input
                value={editGuardianForm.phone}
                onChange={(e) => {
                  setEditGuardianForm({ ...editGuardianForm, phone: e.target.value });
                  if (editGuardianErrors.phone)
                    setEditGuardianErrors({ ...editGuardianErrors, phone: undefined });
                }}
                placeholder={t.phonePlaceholder}
                dir="ltr"
                className={`input-field text-[10px] sm:text-sm ${
                  editGuardianErrors.phone ? 'border-red-400 focus:ring-red-200' : ''
                }`}
              />
              {editGuardianErrors.phone && (
                <p
                  className="text-red-500 text-[9px] sm:text-xs mt-0.5"
                  style={{ fontFamily: font }}
                >
                  {editGuardianErrors.phone}
                </p>
              )}
            </Field>
            <Field label={t.guardianPassword} font={font}>
              <input
                type="password"
                value={editGuardianForm.password}
                onChange={(e) => {
                  setEditGuardianForm({ ...editGuardianForm, password: e.target.value });
                  if (editGuardianErrors.password)
                    setEditGuardianErrors({ ...editGuardianErrors, password: undefined });
                }}
                placeholder={t.passwordPlaceholder}
                dir="ltr"
                className={`input-field text-[10px] sm:text-sm ${
                  editGuardianErrors.password ? 'border-red-400 focus:ring-red-200' : ''
                }`}
              />
              {editGuardianErrors.password ? (
                <p
                  className="text-red-500 text-[9px] sm:text-xs mt-0.5"
                  style={{ fontFamily: font }}
                >
                  {editGuardianErrors.password}
                </p>
              ) : (
                <p
                  className="text-muted-foreground text-[9px] sm:text-xs mt-0.5"
                  style={{ fontFamily: font }}
                >
                  {t.leaveBlankPassword}
                </p>
              )}
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2 mt-3 sm:mt-5">
            <button
              onClick={() => setEditGuardian(null)}
              className="px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl border border-border text-[10px] sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleEditGuardian}
              disabled={editGuardianLoading}
              className="px-3 sm:px-5 py-1 sm:py-2 rounded-xl gradient-primary text-white text-[10px] sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {editGuardianLoading ? <Loader2 size={12} className="animate-spin" /> : t.save}
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
          <p
            className="text-[10px] sm:text-sm text-muted-foreground mb-2.5 sm:mb-4"
            style={{ fontFamily: font }}
          >
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
              className="input-field text-[10px] sm:text-sm"
            />
          </Field>
          <div className="flex items-center gap-2 mt-3 sm:mt-5">
            <button
              onClick={() => handleBalance('addBalance')}
              disabled={balanceLoading || !balanceAmount}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-[10px] sm:text-sm font-bold transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              <Plus size={12} className="sm:hidden" />
              <Plus size={14} className="hidden sm:block" />
              {t.addBalance}
            </button>
            <button
              onClick={() => handleBalance('deductBalance')}
              disabled={balanceLoading || !balanceAmount}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] sm:text-sm font-bold transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              <Minus size={12} className="sm:hidden" />
              <Minus size={14} className="hidden sm:block" />
              {t.deductBalance}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Student Confirm Modal ── */}
      {deleteStudent && (
        <Modal onClose={() => setDeleteStudent(null)} title={t.delete} font={font} isRtl={isRtl}>
          <p
            className="text-[10px] sm:text-sm text-muted-foreground mb-3 sm:mb-6 leading-relaxed"
            style={{ fontFamily: font }}
          >
            {t.confirmDelete}{' '}
            <span className="font-bold text-foreground">{deleteStudent.fullName}</span>؟
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteStudent(null)}
              className="px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl border border-border text-[10px] sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="px-3 sm:px-5 py-1 sm:py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] sm:text-sm font-bold transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {deleteLoading ? <Loader2 size={12} className="animate-spin" /> : t.confirmDeleteBtn}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Guardian Confirm Modal ── */}
      {deleteGuardian && (
        <Modal onClose={() => setDeleteGuardian(null)} title={t.delete} font={font} isRtl={isRtl}>
          <p
            className="text-[10px] sm:text-sm text-muted-foreground mb-3 sm:mb-6 leading-relaxed"
            style={{ fontFamily: font }}
          >
            {t.confirmDeleteGuardian}{' '}
            <span className="font-bold text-foreground">{deleteGuardian.fullName}</span>؟
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteGuardian(null)}
              className="px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl border border-border text-[10px] sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleDeleteGuardian}
              disabled={deleteGuardianLoading}
              className="px-3 sm:px-5 py-1 sm:py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] sm:text-sm font-bold transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {deleteGuardianLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                t.confirmDeleteBtn
              )}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Reusable Modal ─────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-xl sm:rounded-2xl border border-border card-shadow w-full max-w-md relative flex flex-col max-h-[90vh]">
        {/* Sticky header */}
        <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b border-border shrink-0">
          <h2
            className="text-xs sm:text-base font-bold text-foreground"
            style={{ fontFamily: font }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={14} className="sm:hidden" />
            <X size={18} className="hidden sm:block" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto px-3 sm:px-6 py-3 sm:py-5 flex-1">{children}</div>
      </div>
    </div>
  );
}

// ── Reusable Field ─────────────────────────────
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
    <div className="flex flex-col gap-0.5 sm:gap-1.5">
      <label
        className="text-[10px] sm:text-sm font-semibold text-foreground"
        style={{ fontFamily: font }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
