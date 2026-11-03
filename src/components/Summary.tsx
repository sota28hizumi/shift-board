// 提出用サマリー．スクショして店に出すので，テーマに関係なく白地・濃い文字に固定する．
import type { Day, Period } from '../core/types';
import type { SummaryRow } from '../core/summary';
import { DOW } from '../core/constants';
import { fmtH, pad2 } from '../core/time';
import { headLabel } from '../core/summary';

interface Props {
  period: Period;
  days: Day[];
  rows: SummaryRow[];
  tot: { min: number; cnt: number };
}

export function Summary({ period, days, rows, tot }: Props) {
  const ymd = (d: number) => period.year + '/' + pad2(period.month) + '/' + pad2(d);
  return (
    <section className="paper-wrap" aria-labelledby="paper-title">
      <div className="paper">
        <h2 id="paper-title" className="paper__title">
          <span>シフト希望</span><span>{headLabel(period)}</span>
        </h2>
        <p className="paper__range">{ymd(days[0].date)} – {ymd(days[days.length - 1].date)}</p>
        <ul className="paper__list">
          {rows.map(r => {
            const cls = ['paper__row',
              (r.d.dow === 0 || r.d.hol) ? 'is-sun' : '',
              r.d.dow === 6 ? 'is-sat' : '',
              r.min === 0 ? 'is-none' : ''].filter(Boolean).join(' ');
            return (
              <li key={r.d.key} className={cls}>
                <span className="paper__date">{period.month}/{r.d.date}</span>
                <span className="paper__dow">{DOW[r.d.dow]}{r.d.hol ? '祝' : ''}</span>
                {/* 時間帯の途中では改行せず，「、」の後でだけ折り返す */}
                <span className="paper__time">{r.text.split('、').map((t, i, a) => (
                  <span key={i} className="paper__seg">{t}{i < a.length - 1 ? '、' : ''}</span>
                ))}</span>
                <span className="paper__hours">{r.min > 0 ? fmtH(r.min) + 'h' : ''}</span>
              </li>
            );
          })}
        </ul>
        <p className="paper__total">合計 {fmtH(tot.min)}h ／ 出勤 {tot.cnt}日</p>
      </div>
      <p className="paper-note">この点線枠の内側をスクリーンショットして提出</p>
    </section>
  );
}
