import type { Day, Period } from './types';
import { dkey, jpHolidays } from './holidays';

/** 提出は1ヶ月前なので，初期表示は「今日の半月＋1ヶ月」 */
export function defaultPeriod(today: Date = new Date()): Period {
  const half = today.getDate() <= 15 ? 'H1' : 'H2';
  const n = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return { year: n.getFullYear(), month: n.getMonth() + 1, half };
}

export function shiftHalf(p: Period, dir: 1 | -1): Period {
  let { year, month, half } = p;
  if (dir > 0) {
    if (half === 'H1') half = 'H2';
    else { half = 'H1'; month++; if (month > 12) { month = 1; year++; } }
  } else {
    if (half === 'H2') half = 'H1';
    else { half = 'H2'; month--; if (month < 1) { month = 12; year--; } }
  }
  return { year, month, half };
}

export const otherHalf = (p: Period): Period => ({ ...p, half: p.half === 'H1' ? 'H2' : 'H1' });

export function periodDays(p: Period): Day[] {
  const last = new Date(p.year, p.month, 0).getDate();
  const from = p.half === 'H1' ? 1 : 16;
  const to = p.half === 'H1' ? 15 : last;
  const hol = jpHolidays(p.year);
  const out: Day[] = [];
  for (let d = from; d <= to; d++) {
    const dt = new Date(p.year, p.month - 1, d);
    const k = dkey(dt);
    out.push({ date: d, dow: dt.getDay(), key: k, hol: hol[k] || null });
  }
  return out;
}

export const periodLabel = (p: Period) => p.year + '年' + p.month + '月 ' + (p.half === 'H1' ? '前半' : '後半');

/** 土日祝か */
export const isWeekendLike = (d: Day) => d.dow === 0 || d.dow === 6 || !!d.hol;
