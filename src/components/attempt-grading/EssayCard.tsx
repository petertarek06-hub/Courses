'use client';
import React, { useState } from 'react';
import { Send, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { T, type Lang } from './translations';
import type { Answer } from './types';

export default function EssayCard({
  answer,
  lang,
  font,
  attemptId,
  onGraded,
}: {
  answer: Answer;
  lang: Lang;
  font?: string;
  attemptId: string;
  onGraded: (
    answerId: number,
    gradedScore: number,
    isCorrect: boolean,
    graderNotes: string | null
  ) => void;
}) {
  const t = T[lang];
  const isRtl = lang === 'ar';
  const [editing, setEditing] = useState(answer.isCorrect === null);
  const [score, setScore] = useState(answer.gradedScore != null ? String(answer.gradedScore) : '');
  const [notes, setNotes] = useState(answer.graderNotes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const parsed = Number(score);
    if (!score.trim() || !Number.isFinite(parsed) || parsed < 0) {
      toast.error(t.missingScore);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/attempts/${attemptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerId: answer.answerId,
          gradedScore: parsed,
          graderNotes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const safeScore = Math.min(parsed, answer.question.mark);
      const isCorrect = safeScore >= answer.question.mark;
      onGraded(answer.answerId, safeScore, isCorrect, notes.trim() || null);
      setEditing(false);
      toast.success(t.graded);
    } catch {
      toast.error(t.errorLoad);
    }
    setSaving(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-4">
      <div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
          {t.essayBadge}
        </span>
        <p className="text-sm font-semibold text-foreground mt-2" style={{ fontFamily: font }}>
          {answer.question.text}
        </p>
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold mt-1.5">
          {answer.question.mark} {isRtl ? 'درجة' : 'pts'}
        </span>
        {answer.question.gradingNotes && (
          <div
            className="mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800"
            style={{ fontFamily: font }}
          >
            <p className="font-bold mb-0.5" style={{ fontFamily: font }}>
              {t.gradingNotes}
            </p>
            {answer.question.gradingNotes}
          </div>
        )}
      </div>

      <div>
        <p
          className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5"
          style={{ fontFamily: font }}
        >
          {t.studentAnswer}
        </p>
        <div
          className="rounded-xl border border-border bg-muted/10 px-4 py-3 text-sm text-foreground whitespace-pre-wrap"
          style={{ fontFamily: font }}
        >
          {answer.givenAnswer || <span className="italic text-muted-foreground">{t.noAnswer}</span>}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col sm:flex-row gap-3 pt-1 border-t border-border">
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="text-sm font-semibold text-foreground" style={{ fontFamily: font }}>
              {t.score}
            </label>
            <input
              type="number"
              min={0}
              max={answer.question.mark}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="0"
              className="w-20 text-sm text-center px-2 py-1.5 rounded-xl border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontFamily: font }}
            />
            <span className="text-sm text-muted-foreground" style={{ fontFamily: font }}>
              {t.scoreOf} {answer.question.mark}
            </span>
          </div>

          <div className="flex-1">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.graderNotesPlaceholder}
              rows={2}
              dir={isRtl ? 'rtl' : 'ltr'}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ fontFamily: font }}
            />
          </div>

          <div className="flex items-start flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ fontFamily: font }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {saving ? t.submitting : t.submitGrade}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-bold text-foreground tabular-nums"
              style={{ fontFamily: font }}
            >
              {t.score}: {answer.gradedScore ?? '—'} {t.scoreOf} {answer.question.mark}
            </span>
            {answer.graderNotes && (
              <span className="text-xs text-muted-foreground italic" style={{ fontFamily: font }}>
                “{answer.graderNotes}”
              </span>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            style={{ fontFamily: font }}
          >
            <Pencil size={12} />
            {t.editGrade}
          </button>
        </div>
      )}
    </div>
  );
}
