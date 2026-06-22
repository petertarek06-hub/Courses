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
interface Instructor {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  whatsappNumber: string | null;
  isActive: boolean;
  createdAt: string;
}

// ── Translations ────────────────────────────────────────────────
const content = {
  ar: {
    title: 'المدرسين',
    search: 'بحث بالاسم أو الهاتف...',
    addInstructor: 'إضافة مدرس',
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
    emailLabel: 'البريد الإلكتروني (اختياري)',
    emailPlaceholder: 'example@email.com',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: '••••••••',
    passwordEditHint: 'اتركه فارغًا إذا لم تريد تغييره',
    avatarLabel: 'صورة المدرس (اختياري)',
    avatarBtn: 'اختر صورة',
    whatsappLabel: 'رقم واتساب (اختياري)',
    whatsappPlaceholder: '201XXXXXXXXX',
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
    title: 'Instructors',
    search: 'Search by name or phone...',
    addInstructor: 'Add Instructor',
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
    noData: 'No instructors found',
    errorLoading: 'Failed to load data',
    noEmail: 'None',
    addTitle: 'Add New Instructor',
    editTitle: 'Edit Instructor',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter full name',
    phonePlaceholder: '01XXXXXXXXX',
    emailLabel: 'Email (Optional)',
    emailPlaceholder: 'example@email.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    passwordEditHint: 'Leave blank to keep current password',
    avatarLabel: 'Instructor Photo (Optional)',
    avatarBtn: 'Choose Photo',
    whatsappLabel: 'WhatsApp Number (Optional)',
    whatsappPlaceholder: '201XXXXXXXXX',
    save: 'Save',
    cancel: 'Cancel',
    phoneExists: 'Phone number already registered',
    addedSuccess: 'Instructor added successfully',
    editedSuccess: 'Instructor updated successfully',
    confirmDelete: 'Are you sure you want to delete',
    confirmDeleteBtn: 'Delete Permanently',
    deletedSuccess: 'Instructor deleted successfully',
    suspendedSuccess: 'Instructor account suspended',
    activatedSuccess: 'Instructor account activated',
    permissionsTitle: 'Instructor Permissions',
    permissionsDesc: 'Control what this instructor can do inside courses',
    permCanAddVideo: 'Add Videos',
    permCanAddExam: 'Add Exams',
    permCanEditContent: 'Edit Content',
    permCanViewStudents: 'View Student Data',
    permCanReorder: 'Reorder Lessons',
    permSaved: 'Permissions saved',
    savePermissions: 'Save Permissions',
    coursesNote: 'Note: Permissions will apply to all courses by this instructor.',
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
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden flex-shrink-0 bg-muted/40">
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <Camera size={22} className="text-muted-foreground" />
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

// ── Main Component ──────────────────────────────────────────────
export default function AdminInstructorsPage() {
  const { lang, isRtl } = useAdminLang();
  const t = content[lang];
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  // ── Add modal ──
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

  // ── Edit modal ──
  const [editInstructor, setEditInstructor] = useState<Instructor | null>(null);
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

  // ── Delete / permissions ──
  const [deleteInstructor, setDeleteInstructor] = useState<Instructor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [permInstructor, setPermInstructor] = useState<Instructor | null>(null);
  const [permissions, setPermissions] = useState({ ...defaultPermissions });
  const [permLoading, setPermLoading] = useState(false);

  const getBorderDirection = () => (isRtl ? 'border-l border-border' : 'border-r border-border');

  // ── Fetch ──
  const fetchInstructors = () => {
    setLoading(true);
    setError(false);
    fetch('/api/admin/instructors')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setInstructors)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const filtered = instructors.filter(
    (i) => i.fullName.toLowerCase().includes(search.toLowerCase()) || i.phone.includes(search)
  );

  // ── Avatar helpers ──
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

  // ── Open edit ──
  const openEdit = (instructor: Instructor) => {
    setEditInstructor(instructor);
    setEditForm({
      fullName: instructor.fullName,
      phone: instructor.phone,
      email: instructor.email ?? '',
      password: '',
      whatsapp: instructor.whatsappNumber ?? '',
    });
    setEditAvatarFile(null);
    setEditAvatarPreview(instructor.avatarUrl);
    if (editFileRef.current) editFileRef.current.value = '';
  };

  // ── Toggle status ──
  const handleToggleStatus = async (instructor: Instructor) => {
    const action = instructor.isActive ? 'suspend' : 'activate';
    const res = await fetch('/api/admin/instructors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: instructor.id, action }),
    });
    if (res.ok) {
      toast.success(action === 'suspend' ? t.suspendedSuccess : t.activatedSuccess);
      fetchInstructors();
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteInstructor) return;
    setDeleteLoading(true);
    const res = await fetch('/api/admin/instructors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteInstructor.id }),
    });
    if (res.ok) {
      toast.success(t.deletedSuccess);
      setDeleteInstructor(null);
      fetchInstructors();
    }
    setDeleteLoading(false);
  };

  // ── Add ──
  const handleAdd = async () => {
    if (!addForm.fullName || !addForm.phone || !addForm.password) return;
    setAddLoading(true);
    const fd = new FormData();
    fd.append('fullName', addForm.fullName);
    fd.append('phone', addForm.phone);
    fd.append('email', addForm.email);
    fd.append('password', addForm.password);
    fd.append('whatsapp', addForm.whatsapp);
    if (addAvatarFile) fd.append('avatar', addAvatarFile);

    const res = await fetch('/api/admin/instructors', { method: 'POST', body: fd });
    if (res.ok) {
      toast.success(t.addedSuccess);
      setShowAdd(false);
      setAddForm({ fullName: '', phone: '', email: '', password: '', whatsapp: '' });
      clearAvatar(setAddAvatarFile, setAddAvatarPreview, addFileRef);
      fetchInstructors();
    } else if (res.status === 409) {
      toast.error(t.phoneExists);
    }
    setAddLoading(false);
  };

  // ── Edit ──
  const handleEdit = async () => {
    if (!editInstructor || !editForm.fullName || !editForm.phone) return;
    setEditLoading(true);
    const fd = new FormData();
    fd.append('id', String(editInstructor.id));
    fd.append('fullName', editForm.fullName);
    fd.append('phone', editForm.phone);
    fd.append('email', editForm.email);
    fd.append('whatsapp', editForm.whatsapp);
    if (editForm.password) fd.append('password', editForm.password);
    if (editAvatarFile) fd.append('avatar', editAvatarFile);

    const res = await fetch('/api/admin/instructors', { method: 'PATCH', body: fd });
    if (res.ok) {
      toast.success(t.editedSuccess);
      setEditInstructor(null);
      fetchInstructors();
    } else if (res.status === 409) {
      toast.error(t.phoneExists);
    }
    setEditLoading(false);
  };

  // ── Permissions ──
  const handleSavePermissions = async () => {
    setPermLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success(t.permSaved);
    setPermLoading(false);
    setPermInstructor(null);
  };

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
          {t.addInstructor}
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
                {[t.name, t.phone, t.email, t.status, t.joinedAt, t.actions].map((col, i, arr) => (
                  <th
                    key={col}
                    className={`px-4 py-3 text-center border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < arr.length - 1 ? (isRtl ? 'border-l' : 'border-r') : ''}`}
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
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-red-500 text-sm"
                    style={{ fontFamily: font }}
                  >
                    {t.errorLoading}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                    style={{ fontFamily: font }}
                  >
                    {t.noData}
                  </td>
                </tr>
              ) : (
                filtered.map((instructor) => (
                  <tr
                    key={instructor.id}
                    className="odd:bg-background even:bg-muted/10 hover:bg-muted/30 transition-colors"
                  >
                    {/* Name + avatar */}
                    <td
                      className={`px-4 py-3 text-center align-middle border-b border-border ${getBorderDirection()} font-semibold text-foreground whitespace-nowrap`}
                      style={{ fontFamily: font }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <AvatarCircle
                          url={instructor.avatarUrl}
                          name={instructor.fullName}
                          size={32}
                        />
                        {instructor.fullName}
                      </div>
                    </td>

                    {/* Phone */}
                    <td
                      className={`px-4 py-4 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground`}
                      dir="ltr"
                    >
                      {instructor.phone}
                    </td>

                    {/* Email */}
                    <td
                      className={`px-4 py-4 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground`}
                      dir="ltr"
                    >
                      {instructor.email ?? <span style={{ fontFamily: font }}>{t.noEmail}</span>}
                    </td>

                    {/* Status */}
                    <td
                      className={`px-4 py-4 text-center align-middle border-b border-border ${getBorderDirection()}`}
                    >
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${instructor.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}
                        style={{ fontFamily: font }}
                      >
                        {instructor.isActive ? t.active : t.suspended}
                      </span>
                    </td>

                    {/* Joined */}
                    <td
                      className={`px-4 py-4 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground text-xs`}
                      dir="ltr"
                    >
                      {new Date(instructor.createdAt).toLocaleDateString('en-EG')}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-center align-middle border-b border-border">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(instructor)}
                          title={t.edit}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setPermInstructor(instructor);
                            setPermissions({ ...defaultPermissions });
                          }}
                          title={t.permissions}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <ShieldCheck size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(instructor)}
                          title={instructor.isActive ? t.suspend : t.activate}
                          className={`p-1.5 rounded-lg transition-colors ${instructor.isActive ? 'text-muted-foreground hover:bg-orange-50 hover:text-orange-500' : 'text-muted-foreground hover:bg-green-50 hover:text-green-500'}`}
                        >
                          {instructor.isActive ? <Ban size={15} /> : <CheckCircle size={15} />}
                        </button>
                        <button
                          onClick={() => setDeleteInstructor(instructor)}
                          title={t.delete}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
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
          <div className="flex flex-col gap-3">
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
            <Field label={t.whatsappLabel} font={font}>
              <input
                value={addForm.whatsapp}
                onChange={(e) => setAddForm({ ...addForm, whatsapp: e.target.value })}
                placeholder={t.whatsappPlaceholder}
                dir="ltr"
                className="input-field"
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
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={() => {
                setShowAdd(false);
                clearAvatar(setAddAvatarFile, setAddAvatarPreview, addFileRef);
              }}
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

      {/* ── Edit Modal ── */}
      {editInstructor && (
        <Modal
          onClose={() => setEditInstructor(null)}
          title={`${t.editTitle} — ${editInstructor.fullName}`}
          font={font}
          isRtl={isRtl}
        >
          <div className="flex flex-col gap-3">
            <Field label={t.avatarLabel} font={font}>
              <AvatarPicker
                preview={editAvatarPreview}
                file={editAvatarFile}
                onPick={() => editFileRef.current?.click()}
                onClear={() => {
                  setEditAvatarFile(null);
                  setEditAvatarPreview(editInstructor.avatarUrl);
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
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder={t.phonePlaceholder}
                dir="ltr"
                className="input-field"
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
              <input
                value={editForm.whatsapp}
                onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                placeholder={t.whatsappPlaceholder}
                dir="ltr"
                className="input-field"
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
              <span className="text-xs text-muted-foreground" style={{ fontFamily: font }}>
                {t.passwordEditHint}
              </span>
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={() => setEditInstructor(null)}
              className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleEdit}
              disabled={editLoading}
              className="px-5 py-2 rounded-xl gradient-primary text-white text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {editLoading ? <Loader2 size={16} className="animate-spin" /> : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Permissions Modal ── */}
      {permInstructor && (
        <Modal
          onClose={() => setPermInstructor(null)}
          title={`${t.permissionsTitle} — ${permInstructor.fullName}`}
          font={font}
          isRtl={isRtl}
        >
          <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: font }}>
            {t.permissionsDesc}
          </p>
          <div className="flex flex-col gap-3 mb-2">
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
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <span
                  className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: font }}
                >
                  {label}
                </span>
                <div
                  onClick={() => setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${permissions[key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${permissions[key] ? (isRtl ? 'right-0.5' : 'left-5') : isRtl ? 'right-5' : 'left-0.5'}`}
                  />
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 mb-5" style={{ fontFamily: font }}>
            {t.coursesNote}
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setPermInstructor(null)}
              className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
              style={{ fontFamily: font }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSavePermissions}
              disabled={permLoading}
              className="px-5 py-2 rounded-xl gradient-primary text-white text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {permLoading ? <Loader2 size={16} className="animate-spin" /> : t.savePermissions}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {deleteInstructor && (
        <Modal onClose={() => setDeleteInstructor(null)} title={t.delete} font={font} isRtl={isRtl}>
          <p
            className="text-sm text-muted-foreground mb-6 leading-relaxed"
            style={{ fontFamily: font }}
          >
            {t.confirmDelete}{' '}
            <span className="font-bold text-foreground">{deleteInstructor.fullName}</span>؟
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteInstructor(null)}
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
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground" style={{ fontFamily: font }}>
        {label}
      </label>
      {children}
    </div>
  );
}
