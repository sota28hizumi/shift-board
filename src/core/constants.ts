// 店舗・運用の定数．UI からもロジックからもここだけを参照する．
import type { FixedNg, PayInput } from './types';

export const SHOP = {
  open: 6 * 60 + 30,       // シフト受付開始 6:30
  close: 23 * 60 + 30,     // シフト受付終了 23:30
  step: 30,                // 最小単位（分）
  nightFrom: 22 * 60,      // 深夜割増の開始
} as const;

export const SPAN = SHOP.close - SHOP.open;   // 1020分
export const SLOTS = SPAN / SHOP.step;        // 34スロット

export const DOW = ['日', '月', '火', '水', '木', '金', '土'] as const;

export const SCHEMA_VERSION = 3;

export const DEFAULT_PAY: PayInput = {
  wage: '1200', nightRate: '25', breakRule: true,
  fare: '820', fareMinDays: '8', fareCap: '10000', otherDays: '',
};

export const DEFAULT_NG: FixedNg[] = [
  { id: 'ng1', dow: 1, start: '11:00', end: '16:40', label: '授業' },
  { id: 'ng2', dow: 3, start: '09:00', end: '15:00', label: '授業' },
];
