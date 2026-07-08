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
