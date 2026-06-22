// src/app/admin/payments/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock, Banknote, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminLang } from '../Adminshell';

interface PendingTx {
  id: number;
  amount: number;
  method: string;
  status: string;
  notes: string | null;
  createdAt: string;
  student: { id: number; fullName: string; phone: string; balance: number };
}

const content = {
  ar: {
    title: 'طلبات شحن الرصيد',
    noRequests: 'لا توجد طلبات معلّقة',
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
    egp: 'ج.م',
    approvedOk: 'تم قبول الطلب وشحن الرصيد',
    rejectedOk: 'تم رفض الطلب',
    errorMsg: 'حدث خطأ',
    pending: 'قيد المراجعة',
    afterApprove: 'الرصيد بعد القبول',
  },
  en: {
    title: 'Balance Top-Up Requests',
    noRequests: 'No pending requests',
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
    egp: 'EGP',
    approvedOk: 'Approved and balance credited',
    rejectedOk: 'Request rejected',
    errorMsg: 'Something went wrong',
    pending: 'Pending',
    afterApprove: 'Balance after approval',
  },
};

export default function AdminPaymentsPage() {
  const { lang, isRtl } = useAdminLang();
  const t = content[lang];
  const font = isRtl ? 'var(--font-cairo)' : undefined;

  const [requests, setRequests] = useState<PendingTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    fetch('/api/admin/payments')
      .then((r) => (r.ok ? r.json() : []))
      .then(setRequests)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handle = async (id: number, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        toast.success(action === 'approve' ? t.approvedOk : t.rejectedOk);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: font }}>
          {t.title}
        </h1>
        <span
          className="text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-600 font-bold flex items-center gap-1.5"
          style={{ fontFamily: font }}
        >
          <Clock size={13} />
          {t.pending}: {requests.length}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <CheckCircle2 size={44} className="text-green-400/50" />
          <p className="text-muted-foreground text-sm" style={{ fontFamily: font }}>
            {t.noRequests}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-card rounded-2xl border border-border card-shadow p-5"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left: student info */}
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="font-bold text-foreground text-sm" style={{ fontFamily: font }}>
                    {req.student.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {req.student.phone}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    <span style={{ fontFamily: font }}>
                      {t.balance}:{' '}
                      <span className="font-bold text-foreground" dir="ltr">
                        {req.student.balance} {t.egp}
                      </span>
                    </span>
                    <span style={{ fontFamily: font }}>
                      {t.afterApprove}:{' '}
                      <span className="font-bold text-primary" dir="ltr">
                        {req.student.balance + req.amount} {t.egp}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Right: amount + method */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-2xl font-extrabold text-primary" dir="ltr">
                    +{req.amount} {t.egp}
                  </span>
                  <span
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                    style={{ fontFamily: font }}
                  >
                    {req.method === 'cash' ? <Banknote size={13} /> : <Smartphone size={13} />}
                    {req.method === 'cash' ? t.cash : t.wallet}
                  </span>
                  <span className="text-xs text-muted-foreground" dir="ltr">
                    {new Date(req.createdAt).toLocaleString('en-EG')}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {req.notes && (
                <div
                  className="mt-3 p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground"
                  style={{ fontFamily: font }}
                >
                  <span className="font-semibold text-foreground">{t.notes}: </span>
                  {req.notes}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handle(req.id, 'reject')}
                  disabled={processing === req.id}
                  className="flex-1 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ fontFamily: font }}
                >
                  {processing === req.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <XCircle size={14} />
                  )}
                  {t.reject}
                </button>
                <button
                  onClick={() => handle(req.id, 'approve')}
                  disabled={processing === req.id}
                  className="flex-1 py-2 rounded-xl gradient-primary text-white text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ fontFamily: font }}
                >
                  {processing === req.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  {t.approve}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
