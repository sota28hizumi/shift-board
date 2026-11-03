// 合計時間・出勤日数・給料見込みの計算．
import type { Bar, Day, PayInput, Period } from './types';
import { SHOP } from './constants';
import { otherHalf, periodDays } from './period';
import { barMinutes } from './shifts';

type Shifts = Record<string, Bar[]>;
type Off = Record<string, boolean>;

export function totals(days: Day[], shifts: Shifts, offDays: Off) {
  let min = 0, cnt = 0;
  days.forEach(d => {
    if (offDays[d.key]) return;
    const m = barMinutes(shifts[d.key]);
    if (m > 0) { min += m; cnt++; }
  });
  return { min, cnt };
}

/** 同じ月のもう半分の出勤日数（状態に入っている希望から集計） */
export function otherHalfDays(period: Period, shifts: Shifts, offDays: Off) {
  return periodDays(otherHalf(period))
    .filter(d => !offDays[d.key] && (shifts[d.key] || []).length > 0).length;
}

export interface Money {
  normal: number; night: number; workDays: number;
  base: number; extra: number; fare: number;
  unit: number; other: number; monthDays: number; monthFare: number;
  eligible: boolean; capped: boolean; total: number;
}

export function calcMoney(days: Day[], shifts: Shifts, offDays: Off, pay: PayInput, autoOther: number): Money {
  let normal = 0, night = 0, workDays = 0;
  days.forEach(d => {
    if (offDays[d.key]) return;
    const bars = shifts[d.key] || [];
    if (!bars.length) return;
    workDays++;
    let nrm = 0, ngt = 0;
    bars.forEach(b => {
      const n = Math.max(0, b.end - Math.max(b.start, SHOP.nightFrom));
      ngt += n; nrm += (b.end - b.start) - n;
    });
    if (pay.breakRule) {               // 6h超45分／8h超60分の休憩を通常時間から先に引く
      const t = nrm + ngt;
      const br = t > 8 * 60 ? 60 : t > 6 * 60 ? 45 : 0;
      const cut = Math.min(nrm, br);
      nrm -= cut; ngt = Math.max(0, ngt - (br - cut));
    }
    normal += nrm; night += ngt;
  });
  const w = Number(pay.wage) || 0;
  const rate = 1 + (Number(pay.nightRate) || 0) / 100;
  const base = normal / 60 * w, extra = night / 60 * w * rate;
  // 交通費は月単位の条件（月◯日以上で支給・月上限あり）．月で判定し，この半月分を按分する．
  const unit = Number(pay.fare) || 0;
  const minD = Number(pay.fareMinDays) || 0;
  const cap = Number(pay.fareCap) || 0;
  const other = pay.otherDays === '' ? autoOther : (Number(pay.otherDays) || 0);
  const monthDays = workDays + other;
  const eligible = monthDays >= minD;
  const rawMonth = unit * monthDays;
  const monthFare = eligible ? (cap > 0 ? Math.min(rawMonth, cap) : rawMonth) : 0;
  const fare = monthDays > 0 ? monthFare * workDays / monthDays : 0;
  return {
    normal, night, workDays, base, extra, fare, unit, other, monthDays, monthFare, eligible,
    capped: eligible && cap > 0 && rawMonth > cap, total: Math.round(base + extra + fare),
  };
}
