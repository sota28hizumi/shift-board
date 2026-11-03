// 状態JSON（version 3）の読み書き．Artifact 版と同じスキーマなので相互に貼り戻せる．
// v1（pay なし）/ v2（交通費が1日あたり定額）は既定の給料設定で補う．
import type { AppState, Bar, FixedNg, PayInput } from './types';
import { DEFAULT_NG, DEFAULT_PAY, SCHEMA_VERSION } from './constants';
import { clamp, fromHM, snap, toHM, uid } from './time';
import { defaultPeriod } from './period';
import { normalize } from './shifts';

export function initialState(today: Date = new Date()): AppState {
  return {
    period: defaultPeriod(today),
    target: { hours: '', days: '' },
    pay: { ...DEFAULT_PAY },
    fixedNg: DEFAULT_NG.map(n => ({ ...n })),
    offDays: {},
    shifts: {},
  };
}

const numOr = (v: unknown, fallback: number) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

export function serialize(st: AppState): string {
  const shifts: Record<string, { id: string; start: string; end: string }[]> = {};
  Object.keys(st.shifts).sort().forEach(k => {
    const arr = st.shifts[k];
    if (arr && arr.length) shifts[k] = arr.map(b => ({ id: b.id, start: toHM(b.start), end: toHM(b.end) }));
  });
  const p = st.pay;
  return JSON.stringify({
    version: SCHEMA_VERSION,
    period: st.period,
    target: {
      hours: st.target.hours === '' ? null : Number(st.target.hours),
      days: st.target.days === '' ? null : Number(st.target.days),
    },
    pay: {
      wage: numOr(p.wage, 0), nightRate: numOr(p.nightRate, 0), breakRule: p.breakRule,
      fare: numOr(p.fare, 0), fareMinDays: numOr(p.fareMinDays, 0), fareCap: numOr(p.fareCap, 0),
      otherDays: p.otherDays === '' ? '' : String(numOr(p.otherDays, 0)),
    },
    fixedNg: st.fixedNg,
    offDays: Object.keys(st.offDays).filter(k => st.offDays[k]).sort(),
    shifts,
  }, null, 2);
}

/** 貼り付けられた JSON を読む．読めない場合は例外を投げる（呼び出し側でメッセージを出す） */
export function deserialize(text: string, base: AppState = initialState()): AppState {
  const o = JSON.parse(text);
  if (!o || typeof o !== 'object') throw new Error('JSON のオブジェクトではありません');

  const period = o.period && o.period.year && o.period.month
    ? { year: +o.period.year, month: clamp(+o.period.month, 1, 12), half: o.period.half === 'H2' ? 'H2' as const : 'H1' as const }
    : base.period;

  // v3 以外（pay なし・旧形式）は既定値で補う．fareMinDays / fareCap が無い v2 もここで吸収する
  const src = o.pay && typeof o.pay === 'object' ? o.pay : {};
  const str = (v: unknown, d: string) => (v == null || v === '' ? d : String(numOr(v, Number(d))));
  const pay: PayInput = {
    wage: str(src.wage, DEFAULT_PAY.wage),
    nightRate: str(src.nightRate, DEFAULT_PAY.nightRate),
    breakRule: src.breakRule !== false,
    fare: str(src.fare, DEFAULT_PAY.fare),
    fareMinDays: str(src.fareMinDays, DEFAULT_PAY.fareMinDays),
    fareCap: str(src.fareCap, DEFAULT_PAY.fareCap),
    otherDays: src.otherDays == null || src.otherDays === '' ? '' : String(numOr(src.otherDays, 0)),
  };

  const target = {
    hours: o.target && o.target.hours != null ? String(o.target.hours) : '',
    days: o.target && o.target.days != null ? String(o.target.days) : '',
  };

  const validHM = (s: unknown) => typeof s === 'string' && /^\d{1,2}:\d{2}$/.test(s);
  const fixedNg: FixedNg[] = Array.isArray(o.fixedNg)
    ? o.fixedNg.filter((n: FixedNg) => n && validHM(n.start) && validHM(n.end)).map((n: FixedNg) => ({
        id: n.id || uid(), dow: clamp(Math.trunc(+n.dow) || 0, 0, 6),
        start: toHM(clamp(fromHM(n.start), 0, 1439)), end: toHM(clamp(fromHM(n.end), 0, 1439)),
        label: n.label || '',
      }))
    : base.fixedNg;

  const offDays: Record<string, boolean> = {};
  if (Array.isArray(o.offDays)) o.offDays.forEach((k: unknown) => { if (typeof k === 'string') offDays[k] = true; });

  const shifts: Record<string, Bar[]> = {};
  if (o.shifts && typeof o.shifts === 'object') {
    Object.keys(o.shifts).forEach(k => {
      const list = Array.isArray(o.shifts[k]) ? o.shifts[k] : [];
      const arr: Bar[] = list
        .filter((b: { start: unknown; end: unknown }) => b && validHM(b.start) && validHM(b.end))
        .map((b: { id?: string; start: string; end: string }) => ({ id: b.id || uid(), start: snap(fromHM(b.start)), end: snap(fromHM(b.end)) }));
      const v = normalize(arr);
      if (v.length) shifts[k] = v;
    });
  }

  return { period, target, pay, fixedNg, offDays, shifts };
}
