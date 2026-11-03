// 希望バーの操作（純粋関数）．
import type { Bar, Day, FixedNg } from './types';
import { fromHM, uid } from './time';
import { isWeekendLike } from './period';

/** 重なり・隣接をまとめて開始順に並べる */
export function normalize(list: Bar[]): Bar[] {
  const a = list.filter(b => b.end > b.start).sort((x, y) => x.start - y.start);
  const out: Bar[] = [];
  for (const b of a) {
    const last = out[out.length - 1];
    if (last && b.start <= last.end) last.end = Math.max(last.end, b.end);
    else out.push({ id: b.id || uid(), start: b.start, end: b.end });
  }
  return out;
}

/** その日のバーを差し替えた新しい shifts を返す（空なら日付キーを消す） */
export function withDay(shifts: Record<string, Bar[]>, key: string, bars: Bar[]) {
  const n = { ...shifts };
  const v = normalize(bars);
  if (v.length) n[key] = v; else delete n[key];
  return n;
}

export const barMinutes = (bars: Bar[] = []) => bars.reduce((a, b) => a + (b.end - b.start), 0);

export interface NgRange { s: number; e: number; label: string }

export function ngByDow(fixedNg: FixedNg[]): Record<number, NgRange[]> {
  const m: Record<number, NgRange[]> = {};
  fixedNg.forEach(n => {
    const s = fromHM(n.start), e = fromHM(n.end);
    if (e > s) (m[n.dow] = m[n.dow] || []).push({ s, e, label: n.label });
  });
  return m;
}

export const overlapsNg = (b: Bar, ng: NgRange[] = []) => ng.some(n => b.start < n.e && b.end > n.s);

/** 平日（wd）または土日祝（we）に同じ時間帯を一括で入れる．終日NGの日は触らない */
export function applyBulk(
  shifts: Record<string, Bar[]>, days: Day[], offDays: Record<string, boolean>,
  kind: 'wd' | 'we', start: number, end: number,
) {
  if (end <= start) return shifts;
  const n = { ...shifts };
  days.forEach(d => {
    if (offDays[d.key]) return;
    const we = isWeekendLike(d);
    if ((kind === 'wd' && !we) || (kind === 'we' && we)) n[d.key] = [{ id: uid(), start, end }];
  });
  return n;
}
