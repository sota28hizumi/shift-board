// 提出用サマリーの行とプレーンテキスト．
import type { Bar, Day, Period } from './types';
import { DOW } from './constants';
import { fmtH, toHM } from './time';
import { barMinutes } from './shifts';

export interface SummaryRow {
  d: Day;
  off: boolean;
  text: string;    // 画面表示用（全角区切り）
  plain: string;   // コピー用
  min: number;
}

export function summaryRows(days: Day[], shifts: Record<string, Bar[]>, offDays: Record<string, boolean>): SummaryRow[] {
  return days.map(d => {
    const off = !!offDays[d.key];
    const bars = off ? [] : (shifts[d.key] || []);
    return {
      d, off,
      text: bars.length ? bars.map(b => toHM(b.start) + '–' + toHM(b.end)).join('、') : '－',
      plain: bars.length ? bars.map(b => toHM(b.start) + '-' + toHM(b.end)).join(', ') : '－',
      min: barMinutes(bars),
    };
  });
}

export const headLabel = (p: Period) => p.year + '年' + p.month + '月' + (p.half === 'H1' ? '前半' : '後半');

export function plainText(p: Period, days: Day[], rows: SummaryRow[], tot: { min: number; cnt: number }) {
  const range = p.month + '/' + days[0].date + '〜' + p.month + '/' + days[days.length - 1].date;
  return ['シフト希望 ' + headLabel(p) + '（' + range + '）']
    .concat(rows.map(r => p.month + '/' + r.d.date + '(' + DOW[r.d.dow] + (r.d.hol ? '祝' : '') + ') ' + r.plain))
    .concat(['合計 ' + fmtH(tot.min) + 'h / 出勤 ' + tot.cnt + '日'])
    .join('\n');
}
