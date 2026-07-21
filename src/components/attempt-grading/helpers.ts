export function formatDate(iso: string | null, isRtl: boolean, fallback: string) {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Parses the QuestionBank.optionsJson column into a string[] ───
export function parseOptions(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.map((o) => String(o)) : [];
  } catch {
    return [];
  }
}

// Case/whitespace-insensitive equality so stored values that differ only by
// trailing spaces or casing still match an option in the list.
export function looseEquals(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
