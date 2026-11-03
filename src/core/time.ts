import { SHOP, SPAN } from './constants';

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const toHM = (m: number) => pad2(Math.floor(m / 60)) + ':' + pad2(m % 60);
export const fromHM = (s: string) => {
  const p = String(s).split(':');
  return (+p[0]) * 60 + (+p[1] || 0);
};
export const fmtH = (m: number) => (m / 60).toFixed(1);
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const snap = (m: number) =>
  SHOP.open + Math.round((clamp(m, SHOP.open, SHOP.close) - SHOP.open) / SHOP.step) * SHOP.step;
export const uid = () => Math.random().toString(36).slice(2, 9);

/** 受付時間内での位置（%）．タイムライン描画用 */
export const pct = (m: number) => ((m - SHOP.open) / SPAN) * 100;

export const yen = (n: number) => '¥' + Math.round(n).toLocaleString('ja-JP');
