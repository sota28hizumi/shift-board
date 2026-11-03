// 給料の見込み．店に渡す情報ではないので提出用サマリーには出さない．
import type { PayInput } from '../core/types';
import type { Money } from '../core/calc';
import { fmtH, yen } from '../core/time';
import { Icon } from './icons';

interface Props {
  pay: PayInput;
  onPay: (p: Partial<PayInput>) => void;
  money: Money;
  autoOther: number;
}

function Num({ label, unit, value, onChange, step = 1, placeholder }: {
  label: string; unit: string; value: string; onChange: (v: string) => void; step?: number; placeholder?: string;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__box">
        <input className="input input--num" type="number" min="0" step={step} inputMode="numeric"
          placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
        <span className="field__unit">{unit}</span>
      </span>
    </label>
  );
}

export function PayPane({ pay, onPay, money, autoOther }: Props) {
  const wage = Number(pay.wage) || 0;
  const nightWage = wage * (1 + (Number(pay.nightRate) || 0) / 100);
  return (
    <details className="pane">
      <summary className="pane__sum"><Icon name="yen" />給料の見込み <b className="pane__money">{yen(money.total)}</b></summary>
      <div className="pane__in">
        <div className="form-grid">
          <Num label="時給" unit="円" step={10} value={pay.wage} onChange={v => onPay({ wage: v })} />
          <Num label="深夜割増（22:00〜）" unit="%" step={5} value={pay.nightRate} onChange={v => onPay({ nightRate: v })} />
          <label className="check form-grid__check">
            <input type="checkbox" checked={pay.breakRule} onChange={e => onPay({ breakRule: e.target.checked })} />
            <span>休憩時間を差し引く</span>
          </label>
        </div>
        <div className="form-grid">
          <Num label="交通費（往復）" unit="円" step={10} value={pay.fare} onChange={v => onPay({ fare: v })} />
          <Num label="支給の条件（月の出勤）" unit="日以上" value={pay.fareMinDays} onChange={v => onPay({ fareMinDays: v })} />
          <Num label="交通費の上限" unit="円/月" step={100} value={pay.fareCap} onChange={v => onPay({ fareCap: v })} />
          <Num label="同じ月のもう半分" unit="日" value={pay.otherDays} placeholder={String(autoOther)}
            onChange={v => onPay({ otherDays: v })} />
        </div>
        <p className="support">「同じ月のもう半分」は空欄なら，もう一方の半月に入れた希望から自動で数えます（いま {autoOther}日）。数字を入れるとその値で計算します。</p>

        <dl className="calc">
          <div><dt>通常</dt><dd>{fmtH(money.normal)}h</dd><dd className="calc__unit">× {yen(wage)}</dd><dd>{yen(money.base)}</dd></div>
          <div><dt>深夜</dt><dd>{fmtH(money.night)}h</dd><dd className="calc__unit">× {yen(nightWage)}</dd><dd>{yen(money.extra)}</dd></div>
          <div>
            <dt>交通費</dt><dd>{money.workDays}日</dd>
            <dd className="calc__unit">{money.eligible ? '× ' + yen(money.unit) + '（月分を按分）' : '支給条件に届かない'}</dd>
            <dd>{yen(money.fare)}</dd>
          </div>
          <div className="calc__sum"><dt>合計</dt><dd /><dd /><dd>{yen(money.total)}</dd></div>
        </dl>

        <p className={'note' + (money.eligible ? '' : ' is-warn')}>
          交通費は月単位：月合計 {money.monthDays}日（この半月 {money.workDays}日＋もう半分 {money.other}日）→ 月 {yen(money.monthFare)}
          {money.capped && '（上限 ' + yen(Number(pay.fareCap) || 0) + ' を適用）'}
          {!money.eligible && '。月' + (Number(pay.fareMinDays) || 0) + '日以上の出勤で支給されるため，0円です'}
          。上の表はこの半月分に按分した金額です。
        </p>
        <p className="support">
          休憩を差し引く設定では，1日の希望が6時間を超えると45分，8時間を超えると60分を通常時間から引きます。
          概算です。実際の支給額は店の規定（締め日・端数処理・各種手当）で決まります。
        </p>
      </div>
    </details>
  );
}
