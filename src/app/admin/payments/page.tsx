// src/app/admin/payments/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  Smartphone,
  CreditCard,
  Pencil,
  Check,
  X,
  History,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminLang } from '../Adminshell';

interface PendingTx {
  id: number;
  amount: number;
  method: string;
  status: string;
  notes: string | null;
  senderPhone: string | null;
  proofImageUrl: string | null;
  createdAt: string;
  student: { id: number; fullName: string; phone: string; balance: number };
}

interface HistoryItem {
  kind: 'transaction' | 'rejected_request';
  id: number;
  amount: number;
  method: string;
  status: 'approved' | 'rejected';
  notes: string | null;
  date: string;
  student: { id: number; fullName: string; phone: string };
}

const content = {
  ar: {
    title: 'طلبات شحن الرصيد',
    historyTitle: 'سجل المعاملات',
    noRequests: 'لا توجد طلبات معلّقة',
    noHistory: 'لا يوجد سجل معاملات بعد',
    approve: 'قبول',
    reject: 'رفض',
    amount: 'المبلغ',
    method: 'الطريقة',
    student: 'الطالب',
    phone: 'الهاتف',
    balance: 'الرصيد الحالي',
    notes: 'ملاحظات',
    date: 'التاريخ',
    cash: 'كاش',
    wallet: 'محفظة ذكية',
    fawry: 'فوري',
    manual: 'تعديل يدوي',
    egp: 'ج.م',
    approvedOk: 'تم قبول الطلب وشحن الرصيد',
    rejectedOk: 'تم رفض الطلب',
    errorMsg: 'حدث خطأ',
    pending: 'قيد المراجعة',
    afterApprove: 'الرصيد بعد القبول',
    editAmount: 'تعديل المبلغ',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    approved: 'مقبول',
    rejected: 'مرفوض',
    statusLabel: 'الحالة',
    viewReceipt: 'عرض الإيصال',
    senderPhone: 'رقم المُرسل',
    receiptTitle: 'إيصال التحويل',
  },
  en: {
    title: 'Balance Top-Up Requests',
    historyTitle: 'Transaction History',
    noRequests: 'No pending requests',
    noHistory: 'No transaction history yet',
    approve: 'Approve',
    reject: 'Reject',
    amount: 'Amount',
    method: 'Method',
    student: 'Student',
    phone: 'Phone',
    balance: 'Current balance',
    notes: 'Notes',
    date: 'Date',
    cash: 'Cash',
    wallet: 'Smart wallet',
    fawry: 'Fawry',
    manual: 'Manual adjustment',
    egp: 'EGP',
    approvedOk: 'Approved and balance credited',
    rejectedOk: 'Request rejected',
    errorMsg: 'Something went wrong',
    pending: 'Pending',
    afterApprove: 'Balance after approval',
    editAmount: 'Edit amount',
    confirm: 'Confirm',
    cancel: 'Cancel',
    approved: 'Approved',
    rejected: 'Rejected',
    statusLabel: 'Status',
    viewReceipt: 'View receipt',
    senderPhone: 'Sender phone',
    receiptTitle: 'Transfer Receipt',
  },
};

function methodDisplay(method: string, t: (typeof content)['ar']) {
  switch (method) {
    case 'cash':
      return { label: t.cash, Icon: Banknote };
    case 'wallet':
      return { label: t.wallet, Icon: Smartphone };
    case 'fawry':
      return { label: t.fawry, Icon: CreditCard };
    case 'manual':
      return { label: t.manual, Icon: Pencil };
    default:
      return { label: method, Icon: Banknote };
  }
}

export default function AdminPaymentsPage() {
  const { lang, isRtl } = useAdminLang();
  const t = content[lang];
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [requests, setRequests] = useState<PendingTx[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const getBorderDirection = () => (isRtl ? 'border-l border-border' : 'border-r border-border');

  const fetchRequests = () => {
    setLoading(true);
    fetch('/api/admin/payments')
      .then((r) => (r.ok ? r.json() : { pending: [], history: [] }))
      .then((data) => {
        setRequests(data.pending ?? []);
        setHistory(data.history ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const startEdit = (req: PendingTx) => {
    setEditingId(req.id);
    setEditAmount(String(req.amount));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
  };

  const handle = async (id: number, action: 'approve' | 'reject', overrideAmount?: string) => {
    setProcessing(id);
    try {
      const body: { id: number; action: string; amount?: number } = { id, action };
      if (action === 'approve' && overrideAmount !== undefined) {
        const parsed = Number(overrideAmount);
        if (!parsed || parsed <= 0) {
          toast.error(t.errorMsg);
          setProcessing(null);
          return;
        }
        body.amount = parsed;
      }

      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(action === 'approve' ? t.approvedOk : t.rejectedOk);
        setEditingId(null);
        fetchRequests();
      } else {
        toast.error(t.errorMsg);
      }
    } catch {
      toast.error(t.errorMsg);
    }
    setProcessing(null);
  };

  return (
    <>
      {/* ── Pending requests ───────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3 flex-wrap">
        <h1
          className="text-xl sm:text-2xl font-extrabold text-foreground"
          style={{ fontFamily: font }}
        >
          {t.title}
        </h1>
        <span
          className="text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-100 text-amber-600 font-bold flex items-center gap-1 sm:gap-1.5"
          style={{ fontFamily: font }}
        >
          <Clock size={12} className="sm:hidden" />
          <Clock size={13} className="hidden sm:block" />
          {t.pending}: {requests.length}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 sm:py-20">
          <Loader2 size={24} className="animate-spin text-primary sm:hidden" />
          <Loader2 size={28} className="animate-spin text-primary hidden sm:block" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center py-12 sm:py-16 gap-2 sm:gap-3">
          <CheckCircle2 size={36} className="text-green-400/50 sm:hidden" />
          <CheckCircle2 size={44} className="text-green-400/50 hidden sm:block" />
          <p className="text-muted-foreground text-xs sm:text-sm" style={{ fontFamily: font }}>
            {t.noRequests}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4 mb-8 sm:mb-10">
          {requests.map((req) => {
            const { label: methodLabel, Icon: MethodIcon } = methodDisplay(req.method, t);
            const isEditing = editingId === req.id;
            const previewAmount = isEditing ? Number(editAmount) || 0 : req.amount;

            return (
              <div
                key={req.id}
                className="bg-card rounded-xl sm:rounded-2xl border border-border card-shadow p-3 sm:p-5"
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                  {/* Left: student info */}
                  <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
                    <p
                      className="font-bold text-foreground text-xs sm:text-sm"
                      style={{ fontFamily: font }}
                    >
                      {req.student.fullName}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground" dir="ltr">
                      {req.student.phone}
                    </p>
                    <div className="flex flex-wrap gap-2 sm:gap-3 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                      <span style={{ fontFamily: font }}>
                        {t.balance}:{' '}
                        <span className="font-bold text-foreground" dir="ltr">
                          {req.student.balance} {t.egp}
                        </span>
                      </span>
                      <span style={{ fontFamily: font }}>
                        {t.afterApprove}:{' '}
                        <span className="font-bold text-primary" dir="ltr">
                          {req.student.balance + previewAmount} {t.egp}
                        </span>
                      </span>
                    </div>
                    {req.method === 'wallet' && req.senderPhone && (
                      <p
                        className="text-[10px] sm:text-xs text-muted-foreground mt-0.5"
                        style={{ fontFamily: font }}
                      >
                        {t.senderPhone}: <span dir="ltr">{req.senderPhone}</span>
                      </p>
                    )}
                    {req.method === 'wallet' && req.proofImageUrl && (
                      <button
                        onClick={() => setViewingImage(req.proofImageUrl)}
                        className="flex items-center gap-1 mt-1.5 px-2 py-1 rounded-lg border border-border text-[10px] sm:text-xs text-primary hover:bg-primary/5 transition-colors w-fit"
                        style={{ fontFamily: font }}
                      >
                        <ImageIcon size={12} />
                        {t.viewReceipt}
                      </button>
                    )}
                  </div>

                  {/* Right: amount (editable) + method */}
                  <div className="flex flex-col items-end gap-0.5 sm:gap-1 flex-shrink-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-20 sm:w-24 text-sm sm:text-lg font-extrabold text-primary border border-primary/40 rounded-lg px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                          autoFocus
                        />
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {t.egp}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="text-lg sm:text-2xl font-extrabold text-primary" dir="ltr">
                          +{req.amount} {t.egp}
                        </span>
                        <button
                          onClick={() => startEdit(req)}
                          title={t.editAmount}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    )}
                    <span
                      className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground"
                      style={{ fontFamily: font }}
                    >
                      <MethodIcon size={12} />
                      {methodLabel}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground" dir="ltr">
                      {new Date(req.createdAt).toLocaleString('en-EG')}
                    </span>
                  </div>
                </div>

                {req.notes && (
                  <div
                    className="mt-2.5 sm:mt-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-muted/40 text-[10px] sm:text-xs text-muted-foreground"
                    style={{ fontFamily: font }}
                  >
                    <span className="font-semibold text-foreground">{t.notes}: </span>
                    {req.notes}
                  </div>
                )}

                {/* Actions */}
                {isEditing ? (
                  <div className="flex gap-2 mt-3 sm:mt-4">
                    <button
                      onClick={cancelEdit}
                      className="flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-border text-muted-foreground text-xs sm:text-sm font-bold hover:bg-muted/40 transition-all flex items-center justify-center gap-1 sm:gap-1.5"
                      style={{ fontFamily: font }}
                    >
                      <X size={13} />
                      {t.cancel}
                    </button>
                    <button
                      onClick={() => handle(req.id, 'approve', editAmount)}
                      disabled={processing === req.id || !Number(editAmount)}
                      className="flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1 sm:gap-1.5"
                      style={{ fontFamily: font }}
                    >
                      {processing === req.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                      {t.confirm}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3 sm:mt-4">
                    <button
                      onClick={() => handle(req.id, 'reject')}
                      disabled={processing === req.id}
                      className="flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-red-200 text-red-500 text-xs sm:text-sm font-bold hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-1 sm:gap-1.5"
                      style={{ fontFamily: font }}
                    >
                      {processing === req.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <XCircle size={13} />
                      )}
                      {t.reject}
                    </button>
                    <button
                      onClick={() => handle(req.id, 'approve')}
                      disabled={processing === req.id}
                      className="flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1 sm:gap-1.5"
                      style={{ fontFamily: font }}
                    >
                      {processing === req.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={13} />
                      )}
                      {t.approve}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── History ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <History size={16} className="text-muted-foreground sm:hidden" />
        <History size={18} className="text-muted-foreground hidden sm:block" />
        <h2
          className="text-base sm:text-lg font-extrabold text-foreground"
          style={{ fontFamily: font }}
        >
          {t.historyTitle}
        </h2>
      </div>

      {!loading && history.length === 0 ? (
        <div className="flex flex-col items-center py-12 sm:py-16 gap-2 sm:gap-3">
          <History size={32} className="text-muted-foreground/40 sm:hidden" />
          <History size={40} className="text-muted-foreground/40 hidden sm:block" />
          <p className="text-muted-foreground text-xs sm:text-sm" style={{ fontFamily: font }}>
            {t.noHistory}
          </p>
        </div>
      ) : (
        !loading && (
          // Table pattern mirrors admin/students: border-collapse + centered
          // cells + getBorderDirection() for column dividers, instead of
          // text-start/text-end. Logical start/end alignment combined with
          // dir="rtl" was what threw the columns out of alignment in Arabic.
          <div className="bg-card rounded-xl sm:rounded-2xl border border-border card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead className="bg-muted">
                  <tr>
                    {[t.student, t.amount, t.method, t.date, t.statusLabel].map((col, i, arr) => (
                      <th
                        key={col}
                        className={`px-2 sm:px-4 py-2 sm:py-3 text-center border-b border-border text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${
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
                  {history.map((item) => {
                    const { label: methodLabel, Icon: MethodIcon } = methodDisplay(item.method, t);
                    const isApproved = item.status === 'approved';
                    return (
                      <tr
                        key={`${item.kind}-${item.id}`}
                        className="odd:bg-background even:bg-muted/10 hover:bg-muted/30 transition-colors"
                      >
                        <td
                          className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()}`}
                        >
                          <p
                            className="font-semibold text-foreground whitespace-nowrap"
                            style={{ fontFamily: font }}
                          >
                            {item.student.fullName}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground" dir="ltr">
                            {item.student.phone}
                          </p>
                        </td>
                        <td
                          className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} font-bold text-foreground whitespace-nowrap`}
                          dir="ltr"
                        >
                          {isApproved ? '+' : ''}
                          {item.amount} {t.egp}
                        </td>
                        <td
                          className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()}`}
                        >
                          <span
                            className="flex items-center justify-center gap-1 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap"
                            style={{ fontFamily: font }}
                          >
                            <MethodIcon size={12} />
                            {methodLabel}
                          </span>
                        </td>
                        <td
                          className={`px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border ${getBorderDirection()} text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap`}
                          dir="ltr"
                        >
                          {new Date(item.date).toLocaleString('en-EG')}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border-b border-border">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap ${
                              isApproved
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-red-500/10 text-red-500'
                            }`}
                            style={{ fontFamily: font }}
                          >
                            {isApproved ? t.approved : t.rejected}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Receipt lightbox ─────────────────────────────────── */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="bg-card rounded-xl sm:rounded-2xl border border-border max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h3
                className="text-sm sm:text-base font-bold text-foreground"
                style={{ fontFamily: font }}
              >
                {t.receiptTitle}
              </h3>
              <button
                onClick={() => setViewingImage(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-auto p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewingImage}
                alt={t.receiptTitle}
                className="w-full h-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
