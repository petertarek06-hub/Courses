'use client';
import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { T, type Lang } from './translations';
import { parseOptions, looseEquals } from './helpers';
import type { Answer } from './types';

export default function McqCard({
  answer,
  lang,
  font,
}: {
  answer: Answer;
  lang: Lang;
  font?: string;
}) {
  const t = T[lang];
  const isRtl = lang === 'ar';
  const options = parseOptions(answer.question.optionsJson);

  const correctMatchedAnOption = options.some((o) => looseEquals(o, answer.question.correctAnswer));
  const givenMatchedAnOption = options.some((o) => looseEquals(o, answer.givenAnswer));

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {t.mcqBadge}
          </span>
          <p className="text-sm font-semibold text-foreground mt-2" style={{ fontFamily: font }}>
            {answer.question.text}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
            answer.isCorrect ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'
          }`}
          style={{ fontFamily: font }}
        >
          {answer.isCorrect ? <CheckCircle size={11} /> : <XCircle size={11} />}
          {answer.isCorrect ? t.correct : t.incorrect}
        </span>
      </div>

      {options.length > 0 ? (
        <div className="flex flex-col gap-2">
          {options.map((option, idx) => {
            const isCorrectOption = looseEquals(option, answer.question.correctAnswer);
            const isGivenOption = looseEquals(option, answer.givenAnswer);

            let stateClasses = 'border-border bg-muted/10 text-foreground';
            if (isCorrectOption && isGivenOption) {
              stateClasses = 'border-green-300 bg-green-50 text-green-700';
            } else if (isCorrectOption && !isGivenOption) {
              stateClasses = 'border-blue-300 bg-blue-50 text-blue-700';
            } else if (isGivenOption && !isCorrectOption) {
              stateClasses = 'border-red-300 bg-red-50 text-red-700';
            }

            return (
              <div
                key={idx}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${stateClasses}`}
                style={{ fontFamily: font }}
              >
                <span>{option}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isGivenOption && (
                    <span className="text-[10px] sm:text-xs font-bold" style={{ fontFamily: font }}>
                      {t.studentPick}
                    </span>
                  )}
                  {isCorrectOption && !isGivenOption && (
                    <span className="text-[10px] sm:text-xs font-bold" style={{ fontFamily: font }}>
                      {t.correctPick}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p
              className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1"
              style={{ fontFamily: font }}
            >
              {t.studentAnswer}
            </p>
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                answer.isCorrect
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-red-300 bg-red-50 text-red-700'
              }`}
              style={{ fontFamily: font }}
            >
              {answer.givenAnswer || (
                <span className="italic text-muted-foreground">{t.noAnswer}</span>
              )}
            </div>
          </div>
          {!answer.isCorrect && (
            <div>
              <p
                className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1"
                style={{ fontFamily: font }}
              >
                {t.correctAnswer}
              </p>
              <div
                className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-700"
                style={{ fontFamily: font }}
              >
                {answer.question.correctAnswer}
              </div>
            </div>
          )}
        </div>
      )}

      {options.length > 0 && (!givenMatchedAnOption || !correctMatchedAnOption) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
          {!givenMatchedAnOption && (
            <div>
              <p
                className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1"
                style={{ fontFamily: font }}
              >
                {t.rawStudentAnswer}
              </p>
              <div
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
                style={{ fontFamily: font }}
              >
                {answer.givenAnswer || (
                  <span className="italic text-muted-foreground">{t.noAnswer}</span>
                )}
              </div>
            </div>
          )}
          {!correctMatchedAnOption && (
            <div>
              <p
                className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1"
                style={{ fontFamily: font }}
              >
                {t.rawCorrectAnswer}
              </p>
              <div
                className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-700"
                style={{ fontFamily: font }}
              >
                {answer.question.correctAnswer}
              </div>
            </div>
          )}
        </div>
      )}

      <span className="text-xs text-muted-foreground self-end" style={{ fontFamily: font }}>
        {answer.question.mark} {isRtl ? 'درجة' : 'pts'}
      </span>
    </div>
  );
}
