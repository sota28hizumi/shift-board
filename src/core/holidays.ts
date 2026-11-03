// 祝日：固定日＋ハッピーマンデー＋春分秋分の近似式＋振替休日＋国民の休日．
// 年ごとのテーブルは持たず，外部 API にも依存しない．
import { pad2 } from './time';

export const dkey = (d: Date) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());

function nthMonday(y: number, m: number, n: number) {
  const first = new Date(y, m - 1, 1).getDay();
  return 1 + ((1 - first + 7) % 7) + (n - 1) * 7;
}

const cache: Record<number, Record<string, string>> = {};

export function jpHolidays(y: number): Record<string, string> {
  if (cache[y]) return cache[y];
  const h: Record<string, string> = {};
  const put = (m: number, d: number, name: string) => { h[y + '-' + pad2(m) + '-' + pad2(d)] = name; };
  put(1, 1, '元日');
  put(1, nthMonday(y, 1, 2), '成人の日');
  put(2, 11, '建国記念の日');
  if (y >= 2020) put(2, 23, '天皇誕生日');
  put(3, Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4)), '春分の日');
  put(4, 29, '昭和の日');
  put(5, 3, '憲法記念日'); put(5, 4, 'みどりの日'); put(5, 5, 'こどもの日');
  put(7, nthMonday(y, 7, 3), '海の日');
  put(8, 11, '山の日');
  put(9, nthMonday(y, 9, 3), '敬老の日');
  put(9, Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4)), '秋分の日');
  put(10, nthMonday(y, 10, 2), 'スポーツの日');
  put(11, 3, '文化の日'); put(11, 23, '勤労感謝の日');

  // 振替休日：日曜の祝日の後の最初の平日
  const subs: Record<string, string> = {};
  for (let d = new Date(y, 0, 1); d <= new Date(y, 11, 31); d.setDate(d.getDate() + 1)) {
    if (h[dkey(d)] && d.getDay() === 0) {
      const n = new Date(d);
      do { n.setDate(n.getDate() + 1); } while (h[dkey(n)]);
      subs[dkey(n)] = '振替休日';
    }
  }
  Object.assign(h, subs);

  // 国民の休日：祝日に挟まれた平日
  const between: Record<string, string> = {};
  for (let d = new Date(y, 0, 2); d <= new Date(y, 11, 30); d.setDate(d.getDate() + 1)) {
    if (h[dkey(d)] || d.getDay() === 0) continue;
    const p = new Date(d); p.setDate(p.getDate() - 1);
    const n = new Date(d); n.setDate(n.getDate() + 1);
    if (h[dkey(p)] && h[dkey(n)]) between[dkey(d)] = '国民の休日';
  }
  Object.assign(h, between);

  cache[y] = h;
  return h;
}
