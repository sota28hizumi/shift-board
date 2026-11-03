import { useState } from 'react';
import type { Period, Target } from '../core/types';
import { SHOP } from '../core/constants';
import { periodLabel, shiftHalf } from '../core/period';
import { TimeSelect } from './TimeSelect';
import { Icon } from './icons';

interface Props {
  period: Period;
  onPeriod: (p: Period) => void;
  onToday: () => void;
  target: Target;
  onTarget: (t: Partial<Target>) => void;
  bulk: { start: number; end: number };
  onBulk: (b: { start: number; end: number }) => void;
  onBulkApply: (kind: 'wd' | 'we') => void;
  onClear: () => void;
}

export function Toolbar(p: Props) {
  const [armed, setArmed] = useState(false);
  const { start, end } = p.bulk;

  return (
    <section className="tools" aria-label="期間と一括入力">
      <div className="tools__row">
        <div className="period">
          <button type="button" className="icon-btn" aria-label="前の半月"
            onClick={() => p.onPeriod(shiftHalf(p.period, -1))}><Icon name="prev" /></button>
          <p className="period__label" aria-live="polite">{periodLabel(p.period)}</p>
          <button type="button" className="icon-btn" aria-label="次の半月"
            onClick={() => p.onPeriod(shiftHalf(p.period, 1))}><Icon name="next" /></button>
        </div>
        <button type="button" className="btn btn--text" onClick={p.onToday}>提出対象の半月へ</button>
      </div>

      <fieldset className="tools__row tools__group">
        <legend className="tools__legend">目標 <span className="req">※任意</span></legend>
        <label className="field">
          <span className="field__label">時間</span>
          <span className="field__box">
            <input className="input input--num" type="number" min="0" step="0.5" inputMode="decimal"
              value={p.target.hours} onChange={e => p.onTarget({ hours: e.target.value })} />
            <span className="field__unit">h</span>
          </span>
        </label>
        <label className="field">
          <span className="field__label">出勤日数</span>
          <span className="field__box">
            <input className="input input--num" type="number" min="0" step="1" inputMode="numeric"
              value={p.target.days} onChange={e => p.onTarget({ days: e.target.value })} />
            <span className="field__unit">日</span>
          </span>
        </label>
      </fieldset>

      <fieldset className="tools__row tools__group">
        <legend className="tools__legend">一括入力 <span className="tools__sub">選んだ日の希望を置き換えます</span></legend>
        <span className="field__box">
          <TimeSelect label="一括入力の開始" value={start} min={SHOP.open} max={SHOP.close - SHOP.step}
            onChange={v => p.onBulk({ start: v, end: Math.max(v + SHOP.step, end) })} />
          <span className="tilde" aria-hidden="true">–</span>
          <TimeSelect label="一括入力の終了" value={end} min={SHOP.open + SHOP.step} max={SHOP.close}
            onChange={v => p.onBulk({ start: Math.min(start, v - SHOP.step), end: v })} />
        </span>
        <span className="btn-row">
          <button type="button" className="btn" onClick={() => p.onBulkApply('wd')}>平日に適用</button>
          <button type="button" className="btn" onClick={() => p.onBulkApply('we')}>土日祝に適用</button>
        </span>
      </fieldset>

      <div className="tools__row tools__row--end">
        {armed ? (
          <>
            <span className="tools__confirm">この半月の希望と終日NGをすべて消します。</span>
            <button type="button" className="btn btn--text" onClick={() => setArmed(false)}>やめる</button>
            <button type="button" className="btn btn--danger"
              onClick={() => { p.onClear(); setArmed(false); }}>消去する</button>
          </>
        ) : (
          <button type="button" className="btn btn--text" onClick={() => setArmed(true)}>この半月を消去</button>
        )}
      </div>
    </section>
  );
}
