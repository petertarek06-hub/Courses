//src/app/admin/teachers/page.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Search,
  UserPlus,
  Loader2,
  Ban,
  CheckCircle,
  Trash2,
  ShieldCheck,
  X,
  Camera,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminLang } from '../Adminshell';

// ── Types ───────────────────────────────────────────────────────
interface Teacher {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  whatsappNumber: string | null;
  isActive: boolean;
  createdAt: string;
}

const EGYPT_PHONE_RE = /^01[0125]\d{8}$/;
function isValidEgyptPhone(phone: string): boolean {
  return EGYPT_PHONE_RE.test(phone.trim());
}

const EGYPT_WHATSAPP_RE = /^01[0125]\d{8}$/;
function isValidEgyptWhatsapp(wa: string): boolean {
  return wa.trim() === '' || EGYPT_WHATSAPP_RE.test(wa.trim());
}

// ── Translations ────────────────────────────────────────────────
const content = {
  ar: {
    title: 'المدرسين',
    search: 'بحث بالاسم أو الهاتف...',
    addTeacher: 'إضافة مدرس',
    name: 'الاسم',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    status: 'الحالة',
    joinedAt: 'تاريخ الإضافة',
    actions: 'إجراءات',
    active: 'نشط',
    suspended: 'موقوف',
    suspend: 'تعليق',
    activate: 'تفعيل',
    delete: 'حذف',
    edit: 'تعديل',
    permissions: 'الصلاحيات',
    noData: 'لا يوجد مدرسون',
    errorLoading: 'فشل تحميل البيانات',
    noEmail: 'لا يوجد',
    addTitle: 'إضافة مدرس جديد',
    editTitle: 'تعديل بيانات المدرس',
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'أدخل الاسم الكامل',
    phonePlaceholder: '01XXXXXXXXX',
    phoneInvalid:
      'رقم الهاتف غير صحيح — يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقمًا',
    emailLabel: 'البريد الإلكتروني (اختياري)',
    emailPlaceholder: 'example@email.com',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: '••••••••',
    passwordEditHint: 'اتركه فارغًا إذا لم تريد تغييره',
    avatarLabel: 'صورة المدرس (اختياري)',
    avatarBtn: 'اختر صورة',
    whatsappLabel: 'رقم واتساب (اختياري)',
    whatsappPlaceholder: '201XXXXXXXXX',
    whatsappInvalid:
      'رقم واتساب غير صحيح — يجب أن يبدأ بـ 20 ويتبعه 201 أو 2010 أو 2011 أو 2012 أو 2015 ويتكون من 12 رقمًا',
    save: 'حفظ',
    cancel: 'إلغاء',
    phoneExists: 'رقم الهاتف مسجل بالفعل',
    addedSuccess: 'تمت إضافة المدرس بنجاح',
    editedSuccess: 'تم تحديث بيانات المدرس بنجاح',
    confirmDelete: 'هل أنت متأكد من حذف المدرس',
    confirmDeleteBtn: 'حذف نهائيًا',
    deletedSuccess: 'تم حذف المدرس بنجاح',
    suspendedSuccess: 'تم تعليق حساب المدرس',
    activatedSuccess: 'تم تفعيل حساب المدرس',
    permissionsTitle: 'صلاحيات المدرس',
    permissionsDesc: 'تحكم في ما يستطيع المدرس فعله داخل الكورسات',
    permCanAddVideo: 'إضافة فيديوهات',
    permCanAddExam: 'إضافة امتحانات',
    permCanEditContent: 'تعديل المحتوى',
    permCanViewStudents: 'عرض بيانات الطلاب',
    permCanReorder: 'إعادة ترتيب الدروس',
    permSaved: 'تم حفظ الصلاحيات',
    savePermissions: 'حفظ الصلاحيات',
    coursesNote: 'ملاحظة: ستُطبق الصلاحيات على جميع كورسات هذا المدرس.',
  },
  en: {
    title: 'Teachers',
    search: 'Search by name or phone...',
    addTeacher: 'Add Teacher',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    status: 'Status',
    joinedAt: 'Added On',
    actions: 'Actions',
    active: 'Active',
    suspended: 'Suspended',
    suspend: 'Suspend',
    activate: 'Activate',
    delete: 'Delete',
    edit: 'Edit',
    permissions: 'Permissions',
    noData: 'No teachers found',
    errorLoading: 'Failed to load data',
    noEmail: 'None',
    addTitle: 'Add New Teacher',
    editTitle: 'Edit Teacher',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter full name',
    phonePlaceholder: '01XXXXXXXXX',
    phoneInvalid: 'Invalid phone number — must start with 010, 011, 012, or 015 and be 11 digits',
    emailLabel: 'Email (Optional)',
    emailPlaceholder: 'example@email.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    passwordEditHint: 'Leave blank to keep current password',
    avatarLabel: 'Teacher Photo (Optional)',
    avatarBtn: 'Choose Photo',
    whatsappLabel: 'WhatsApp Number (Optional)',
    whatsappPlaceholder: '201XXXXXXXXX',
    whatsappInvalid:
      'Invalid WhatsApp number — must start with 201 followed by 0, 1, 2, or 5, and be 12 digits total',
    save: 'Save',
    cancel: 'Cancel',
    phoneExists: 'Phone number already registered',
    addedSuccess: 'Teacher added successfully',
    editedSuccess: 'Teacher updated successfully',
    confirmDelete: 'Are you sure you want to delete',
    confirmDeleteBtn: 'Delete Permanently',
    deletedSuccess: 'Teacher deleted successfully',
    suspendedSuccess: 'Teacher account suspended',
    activatedSuccess: 'Teacher account activated',
    permissionsTitle: 'Teacher Permissions',
    permissionsDesc: 'Control what this teacher can do inside courses',
    permCanAddVideo: 'Add Videos',
    permCanAddExam: 'Add Exams',
    permCanEditContent: 'Edit Content',
    permCanViewStudents: 'View Student Data',
    permCanReorder: 'Reorder Lessons',
    permSaved: 'Permissions saved',
    savePermissions: 'Save Permissions',
    coursesNote: 'Note: Permissions will apply to all courses by this teacher.',
  },
};

const defaultPermissions = {
  canAddVideo: true,
  canAddExam: true,
  canEditContent: true,
  canViewStudents: false,
  canReorder: true,
};

// ── AvatarCircle ────────────────────────────────────────────────
function AvatarCircle({
  url,
  name,
  size = 32,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
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
      className="rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center flex-shrink-0 text-xs"
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

// ── AvatarPicker ────────────────────────────────────────────────
function AvatarPicker({
  preview,
  file,
  onPick,
  onClear,
  font,
  btnLabel,
}: {
  preview: string | null;
  file: File | null;
  onPick: () => void;
  onClear: () => void;
  font: string | undefined;
  btnLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden flex-shrink-0 bg-muted/40">
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <Camera size={20} className="text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={onPick}
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-all"
          style={{ fontFamily: font }}
        >
          {btnLabel}
        </button>
        {file && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-red-400 hover:text-red-500 text-start"
            style={{ fontFamily: font }}
          >
            <X size={11} className="inline mr-1" />
            {file.name}
          </button>
        )}
      </div>
    </div>
  );
}

// ── PhoneField ──────────────────────────────────────────────────
function PhoneField({
  value,
  onChange,
  placeholder,
  font,
  invalidMsg,
  validate = isValidEgyptPhone,
  maxLen = 11,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  font: string | undefined;
  invalidMsg: string;
  validate?: (v: string) => boolean;
  maxLen?: number;
}) {
  const dirty = value.length > 0;
  const valid = validate(value);
  const showError = dirty && !valid;
  return (
    <div className="flex flex-col gap-1">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir="ltr"
        maxLength={maxLen}
        inputMode="numeric"
        className={`input-field transition-all ${showError ? 'border-red-400 focus:ring-red-300' : ''}`}
      />
      {showError && (
        <span
          className="text-[10px] sm:text-xs text-red-500 leading-snug"
          style={{ fontFamily: font }}
        >
          {invalidMsg}
        </span>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export default function AdminTeachersPage() {
  const { lang, isRtl } = useAdminLang();
  const t = content[lang];
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    whatsapp: '',
  });
  const [addAvatarFile, setAddAvatarFile] = useState<File | null>(null);
  const [addAvatarPreview, setAddAvatarPreview] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const addFileRef = useRef<HTMLInputElement>(null);

  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    whatsapp: '',
  });
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  const [deleteTeacher, setDeleteTeacher] = useState<Teacher | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [permTeacher, setPermTeacher] = useState<Teacher | null>(null);
  const [permissions, setPermissions] = useState({ ...defaultPermissions });
  const [permLoading, setPermLoading] = useState(false);

  const getBorderDirection = () => (isRtl ? 'border-l border-border' : 'border-r border-border');

  const fetchTeachers = () => {
    setLoading(true);
    setError(false);
    fetch('/api/admin/teachers')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setTeachers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const filtered = teachers.filter(
    (i) => i.fullName.toLowerCase().includes(search.toLowerCase()) || i.phone.includes(search)
  );

  const makeAvatarHandler =
    (setFile: (f: File | null) => void, setPreview: (s: string | null) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setFile(file);
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    };

  const clearAvatar = (
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void,
    ref: React.RefObject<HTMLInputElement | null>
  ) => {
    setFile(null);
    setPreview(null);
    if (ref.current) ref.current.value = '';
  };

  const openEdit = (teacher: Teacher) => {
    setEditTeacher(teacher);
    setEditForm({
      fullName: teacher.fullName,
      phone: teacher.phone,
      email: teacher.email ?? '',
      password: '',
      whatsapp: teacher.whatsappNumber ?? '',
    });
    setEditAvatarFile(null);
    setEditAvatarPreview(teacher.avatarUrl);
    if (editFileRef.current) editFileRef.current.value = '';
  };

  const handleToggleStatus = async (teacher: Teacher) => {
    const action = teacher.isActive ? 'suspend' : 'activate';
    const res = await fetch('/api/admin/teachers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: teacher.id, action }),
    });
    if (res.ok) {
      toast.success(action === 'suspend' ? t.suspendedSuccess : t.activatedSuccess);
      fetchTeachers();
    }
  };

  const handleDelete = async () => {
    if (!deleteTeacher) return;
    setDeleteLoading(true);
    const res = await fetch('/api/admin/teachers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteTeacher.id }),
    });
    if (res.ok) {
      toast.success(t.deletedSuccess);
      setDeleteTeacher(null);
      fetchTeachers();
    }
    setDeleteLoading(false);
  };

  const handleAdd = async () => {
    if (!addForm.fullName || !addForm.phone || !addForm.password) return;
    if (!isValidEgyptPhone(addForm.phone)) {
      toast.error(t.phoneInvalid);
      return;
    }
    setAddLoading(true);
    const fd = new FormData();
    fd.append('fullName', addForm.fullName);
    fd.append('phone', addForm.phone);
    fd.append('email', addForm.email);
    fd.append('password', addForm.password);
    fd.append('whatsapp', addForm.whatsapp);
    if (addAvatarFile) fd.append('avatar', addAvatarFile);
    const res = await fetch('/api/admin/teachers', { method: 'POST', body: fd });
    if (res.ok) {
      toast.success(t.addedSuccess);
      setShowAdd(false);
      setAddForm({ fullName: '', phone: '', email: '', password: '', whatsapp: '' });
      clearAvatar(setAddAvatarFile, setAddAvatarPreview, addFileRef);
      fetchTeachers();
    } else if (res.status === 409) {
      toast.error(t.phoneExists);
    }
    setAddLoading(false);
  };

  const handleEdit = async () => {
    if (!editTeacher || !editForm.fullName || !editForm.phone) return;
    if (!isValidEgyptPhone(editForm.phone)) {
      toast.error(t.phoneInvalid);
      return;
    }
    setEditLoading(true);
    const fd = new FormData();
    fd.append('id', String(editTeacher.id));
    fd.append('fullName', editForm.fullName);
    fd.append('phone', editForm.phone);
    fd.append('email', editForm.email);
    fd.append('whatsapp', editForm.whatsapp);
    if (editForm.password) fd.append('password', editForm.password);
    if (editAvatarFile) fd.append('avatar', editAvatarFile);
    const res = await fetch('/api/admin/teachers', { method: 'PATCH', body: fd });
    if (res.ok) {
      toast.success(t.editedSuccess);
      setEditTeacher(null);
      fetchTeachers();
    } else if (res.status === 409) {
      toast.error(t.phoneExists);
    }
    setEditLoading(false);
  };

  const handleSavePermissions = async () => {
    setPermLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success(t.permSaved);
    setPermLoading(false);
    setPermTeacher(null);
  };

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
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
          style={{ fontFamily: font }}
        >
          <UserPlus size={14} className="sm:hidden" />
          <UserPlus size={16} className="hidden sm:block" />
          {t.addTeacher}
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
                {[t.name, t.phone, t.email, t.status, t.joinedAt, t.actions].map((col, i, arr) => (
                  <th
                    key={col}
                    className={`px-2 sm:px-4 py-2 sm:py-3 text-center border-b border-border text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < arr.length - 1 ? getBorderDirection() : ''}`}
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
                  <td colSpan={6} className="py-10 sm:py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 sm:py-10 text-center text-red-500 text-xs sm:text-sm"
                    style={{ fontFamily: font }}
                  >
                    {t.errorLoading}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 sm:py-10 text-center text-muted-foreground"
                    style={{ fontFamily: font }}
                  >
                    {t.noData}
                  </td>
                </tr>
              ) : (
                filtered.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="odd:bg-background even:bg-muted/10 hover:bg-muted/30 transition-colors"
                  >
                    {/* Name + avatar */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} font-semibold text-foreground whitespace-nowrap`}
                      style={{ fontFamily: font }}
                    >
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <AvatarCircle url={teacher.avatarUrl} name={teacher.fullName} size={28} />
                        {teacher.fullName}
                      </div>
                    </td>
                    {/* Phone */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground`}
                      dir="ltr"
                    >
                      {teacher.phone}
                    </td>
                    {/* Email */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground`}
                      dir="ltr"
                    >
                      {teacher.email ?? <span style={{ fontFamily: font }}>{t.noEmail}</span>}
                    </td>
                    {/* Status */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()}`}
                    >
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${teacher.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}
                        style={{ fontFamily: font }}
                      >
                        {teacher.isActive ? t.active : t.suspended}
                      </span>
                    </td>
                    {/* Joined */}
                    <td
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground text-[10px] sm:text-xs`}
                      dir="ltr"
                    >
                      {new Date(teacher.createdAt).toLocaleDateString('en-EG')}
                    </td>
                    {/* Actions */}
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border">
                      <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                        <button
                          onClick={() => openEdit(teacher)}
                          title={t.edit}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        >
                          <Pencil size={13} className="sm:hidden" />
                          <Pencil size={15} className="hidden sm:block" />
                        </button>
                        <button
                          onClick={() => {
                            setPermTeacher(teacher);
                            setPermissions({ ...defaultPermissions });
                          }}
                          title={t.permissions}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <ShieldCheck size={13} className="sm:hidden" />
                          <ShieldCheck size={15} className="hidden sm:block" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(teacher)}
                          title={teacher.isActive ? t.suspend : t.activate}
                          className={`p-1.5 rounded-lg transition-colors ${teacher.isActive ? 'text-muted-foreground hover:bg-orange-50 hover:text-orange-500' : 'text-muted-foreground hover:bg-green-50 hover:text-green-500'}`}
                        >
                          {teacher.isActive ? (
                            <>
                              <Ban size={13} className="sm:hidden" />
                              <Ban size={15} className="hidden sm:block" />
                            </>
                          ) : (
                            <>
                              <CheckCircle size={13} className="sm:hidden" />
                              <CheckCircle size={15} className="hidden sm:block" />
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteTeacher(teacher)}
                          title={t.delete}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} className="sm:hidden" />
                          <Trash2 size={15} className="hidden sm:block" />
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

      {/* ── Add Modal ── */}
      {showAdd && (
        <Modal
          onClose={() => {
            setShowAdd(false);
            clearAvatar(setAddAvatarFile, setAddAvatarPreview, addFileRef);
          }}
          title={t.addTitle}
          font={font}
          isRtl={isRtl}
        >
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <Field label={t.avatarLabel} font={font}>
              <AvatarPicker
                preview={addAvatarPreview}
                file={addAvatarFile}
                onPick={() => addFileRef.current?.click()}
                onClear={() => clearAvatar(setAddAvatarFile, setAddAvatarPreview, addFileRef)}
                font={font}
                btnLabel={t.avatarBtn}
              />
              <input
                ref={addFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={makeAvatarHandler(setAddAvatarFile, setAddAvatarPreview)}
              />
            </Field>
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
              <PhoneField
                value={addForm.phone}
                onChange={(v) => setAddForm({ ...addForm, phone: v })}
                placeholder={t.phonePlaceholder}
                font={font}
                invalidMsg={t.phoneInvalid}
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
            <Field label={t.whatsappLabel} font={font}>
              <PhoneField
                value={addForm.whatsapp}
                onChange={(v) => setAddForm({ ...addForm, whatsapp: v })}
                placeholder={t.whatsappPlaceholder}
                font={font}
                invalidMsg={t.whatsappInvalid}
                validate={isValidEgyptWhatsapp}
                maxLen={12}
              />
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
          <div className="flex items-center justify-end gap-2 mt-4 sm:mt-5">
            <button
              onClick={() => {
                setShowAdd(false);
                clearAvatar(setAddAvatarFile, setAddAvatarPreview, addFileRef);
              }}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleAdd}
              disabled={
                addLoading ||
                !isValidEgyptPhone(addForm.phone) ||
                !isValidEgyptWhatsapp(addForm.whatsapp)
              }
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {addLoading ? <Loader2 size={14} className="animate-spin" /> : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editTeacher && (
        <Modal
          onClose={() => setEditTeacher(null)}
          title={`${t.editTitle} — ${editTeacher.fullName}`}
          font={font}
          isRtl={isRtl}
        >
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <Field label={t.avatarLabel} font={font}>
              <AvatarPicker
                preview={editAvatarPreview}
                file={editAvatarFile}
                onPick={() => editFileRef.current?.click()}
                onClear={() => {
                  setEditAvatarFile(null);
                  setEditAvatarPreview(editTeacher.avatarUrl);
                  if (editFileRef.current) editFileRef.current.value = '';
                }}
                font={font}
                btnLabel={t.avatarBtn}
              />
              <input
                ref={editFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={makeAvatarHandler(setEditAvatarFile, setEditAvatarPreview)}
              />
            </Field>
            <Field label={t.fullName} font={font}>
              <input
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                placeholder={t.fullNamePlaceholder}
                className="input-field"
                style={{ fontFamily: font }}
              />
            </Field>
            <Field label={t.phone} font={font}>
              <PhoneField
                value={editForm.phone}
                onChange={(v) => setEditForm({ ...editForm, phone: v })}
                placeholder={t.phonePlaceholder}
                font={font}
                invalidMsg={t.phoneInvalid}
              />
            </Field>
            <Field label={t.emailLabel} font={font}>
              <input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder={t.emailPlaceholder}
                dir="ltr"
                className="input-field"
              />
            </Field>
            <Field label={t.whatsappLabel} font={font}>
              <PhoneField
                value={editForm.whatsapp}
                onChange={(v) => setEditForm({ ...editForm, whatsapp: v })}
                placeholder={t.whatsappPlaceholder}
                font={font}
                invalidMsg={t.whatsappInvalid}
                validate={isValidEgyptWhatsapp}
                maxLen={12}
              />
            </Field>
            <Field label={t.passwordLabel} font={font}>
              <input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder={t.passwordPlaceholder}
                dir="ltr"
                className="input-field"
              />
              <span
                className="text-[10px] sm:text-xs text-muted-foreground"
                style={{ fontFamily: font }}
              >
                {t.passwordEditHint}
              </span>
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 sm:mt-5">
            <button
              onClick={() => setEditTeacher(null)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleEdit}
              disabled={
                editLoading ||
                !isValidEgyptPhone(editForm.phone) ||
                !isValidEgyptWhatsapp(editForm.whatsapp)
              }
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {editLoading ? <Loader2 size={14} className="animate-spin" /> : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Permissions Modal ── */}
      {permTeacher && (
        <Modal
          onClose={() => setPermTeacher(null)}
          title={`${t.permissionsTitle} — ${permTeacher.fullName}`}
          font={font}
          isRtl={isRtl}
        >
          <p
            className="text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4"
            style={{ fontFamily: font }}
          >
            {t.permissionsDesc}
          </p>
          <div className="flex flex-col gap-2 sm:gap-3 mb-2">
            {(
              [
                { key: 'canAddVideo', label: t.permCanAddVideo },
                { key: 'canAddExam', label: t.permCanAddExam },
                { key: 'canEditContent', label: t.permCanEditContent },
                { key: 'canViewStudents', label: t.permCanViewStudents },
                { key: 'canReorder', label: t.permCanReorder },
              ] as { key: keyof typeof defaultPermissions; label: string }[]
            ).map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border border-border hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <span
                  className="text-xs sm:text-sm font-semibold text-foreground"
                  style={{ fontFamily: font }}
                >
                  {label}
                </span>
                <div
                  onClick={() => setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={`relative w-10 sm:w-11 h-5 sm:h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${permissions[key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-full shadow transition-all duration-200 ${permissions[key] ? (isRtl ? 'right-0.5' : 'left-[22px] sm:left-5') : isRtl ? 'right-5' : 'left-0.5'}`}
                  />
                </div>
              </label>
            ))}
          </div>
          <p
            className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3 mb-4 sm:mb-5"
            style={{ fontFamily: font }}
          >
            {t.coursesNote}
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setPermTeacher(null)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSavePermissions}
              disabled={permLoading}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {permLoading ? <Loader2 size={14} className="animate-spin" /> : t.savePermissions}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {deleteTeacher && (
        <Modal onClose={() => setDeleteTeacher(null)} title={t.delete} font={font} isRtl={isRtl}>
          <p
            className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 leading-relaxed"
            style={{ fontFamily: font }}
          >
            {t.confirmDelete}{' '}
            <span className="font-bold text-foreground">{deleteTeacher.fullName}</span>؟
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteTeacher(null)}
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

// ── Modal ───────────────────────────────────────────────────────
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
      <div className="bg-card rounded-2xl border border-border card-shadow w-full max-w-md relative flex flex-col max-h-[90vh]">
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

// ── Field ───────────────────────────────────────────────────────
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
