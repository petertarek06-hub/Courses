// src/lib/notify.ts
import { toast } from 'sonner';

// Thin wrapper around sonner so every part of the app shows toasts the
// same way. Centralizing this means the visual language (colors, icons)
// only needs to be tuned in one place — and other UI (like the exam
// countdown badge) can borrow the same "warning" language deliberately,
// instead of guessing at amber/red shades independently.
export function notifySuccess(message: string) {
  toast.success(message);
}

export function notifyError(message: string) {
  toast.error(message);
}

export function notifyWarning(message: string) {
  toast.warning(message);
}

export function notifyInfo(message: string) {
  toast.info(message);
}

// ── Persistent notifications ────────────────────────────────────
// Regular toast.* calls auto-dismiss after a few seconds — fine for
// one-off confirmations like "Account created", but wrong for something
// like an exam reminder that should stay visible the whole time it's
// relevant.
//
// Passing a stable `id` does double duty here:
//   1. `duration: Infinity` stops sonner from auto-hiding it.
//   2. Calling this again with the SAME id updates that toast's text in
//      place (e.g. refreshing "3h 12m" → "3h 11m" every poll) instead of
//      stacking a new one or causing an exit/enter flicker.
export function notifyPersistentWarning(message: string, id: string) {
  toast.warning(message, { id, duration: Infinity });
}

export function notifyPersistentInfo(message: string, id: string) {
  toast.info(message, { id, duration: Infinity });
}

// Removes a persistent toast once it's no longer relevant (e.g. the exam
// time has passed, or the student no longer has one coming up).
export function dismissNotification(id: string) {
  toast.dismiss(id);
}
