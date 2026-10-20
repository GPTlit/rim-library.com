export const COMMENT_HOLD_MS = 2500;
export const READING_STATE_KEY = 'qahwa-reading-position';
export const READING_STATE_EVENT = 'qahwa-reading-updated';

export interface ReadingPosition {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  page: number;
  totalPages: number;
  scrollOffset: number;
  updatedAt: string;
}

export function pageWindow(page: number, total: number): Set<number> {
  return new Set(Array.from({ length: 7 }, (_, i) => page + i - 3).filter(p => p >= 1 && p <= total));
}

export function readingPercent(page: number, total: number): number {
  return total > 0 ? Math.min(100, Math.max(1, Math.round(page / total * 100))) : 1;
}

export function mascotState(lastRead: number, finished: boolean, hour: number, now: number): string {
  if (finished) return 'celebrating';
  if (lastRead > 0 && now - lastRead >= 24 * 60 * 60 * 1000) return 'angry';
  if (hour < 6 || hour >= 22) return 'sleeping';
  if (lastRead > 0 && now - lastRead < 5 * 60 * 1000) return 'reading';
  if (hour >= 7 && hour < 10) return 'drinking';
  return 'idle';
}

export function readPosition(): ReadingPosition | null {
  try { return JSON.parse(localStorage.getItem(READING_STATE_KEY) || 'null'); } catch { return null; }
}

export function savePosition(position: ReadingPosition) {
  localStorage.setItem(READING_STATE_KEY, JSON.stringify(position));
  window.dispatchEvent(new Event(READING_STATE_EVENT));
}