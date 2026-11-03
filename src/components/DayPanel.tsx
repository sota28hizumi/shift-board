// 日付行をタップすると開く拡大編集パネル．30分単位で正確に指定する．
import type { Bar, Day, Period } from '../core/types';
import type { NgRange } from '../core/shifts';
import { DOW, SHOP } from '../core/constants';
import { fmtH, toHM, uid } from '../core/time';
import { TimeSelect } from './TimeSelect';

interface Props {
  period: Period;
  day: Day;
  bars: Bar[];
  off: boolean;
  ng: NgRange[];
  prevKey: string | null;
  prevBars: Bar[];
  onSetBars: (bars: Bar[]) => void;
  onToggleOff: () => void;
  onClose: () => void;
}

export function DayPanel({ period, day: d, bars, off, ng, prevKey, prevBars, onSetBars, onToggleOff, onClose }: Props) {
  const { open, close, step } = SHOP;

  const addBar = () => {
    const last = bars.length ? bars[bars.length - 1].end : null;
    const s = last !== null && last + step <= close - step ? last + step : 17 * 60;
    onSetBars(bars.concat([{ id: uid(), start: s, end: Math.min(s + 4 * 60, close) }]));
  };

  return (
    <div className="dp" role="group" aria-label={period.month + '月' + d.date + '日の編集'}>
      <div className="dp__head">
        <p className="dp__title">{period.month}月{d.date}日（{DOW[d.dow]}）</p>
        {d.hol && <span className="dp__hol">{d.hol}</span>}
        <label className="check dp__off">
          <input type="checkbox" checked={off} onChange={onToggleOff} />
          <span>終日NG</span>
        </label>
      </div>

      {ng.length > 0 && (
        <p className="dp__hint">固定予定：{ng.map(n => toHM(n.s) + '–' + toHM(n.e) + (n.label ? '（' + n.label + '）' : '')).join('、')}</p>
      )}

      {off ? (
        <p className="dp__hint">終日NGです。この日は提出内容に含まれません。</p>
      ) : bars.length === 0 ? (
        <p className="dp__hint">希望はまだありません。タイムラインを横にドラッグするか，「時間帯を追加」を押してください。</p>
      ) : (
        <ul className="dp__list">
          {bars.map((b, bi) => (
            <li className="dp__item" key={b.id}>
              <span className="field__box">
                <TimeSelect label={'希望' + (bi + 1) + 'の開始'} value={b.start} min={open} max={close - step}
                  onChange={v => onSetBars(bars.map(x => (x.id === b.id ? { ...x, start: v, end: Math.max(v + step, x.end) } : x)))} />
                <span className="tilde" aria-hidden="true">–</span>
                <TimeSelect label={'希望' + (bi + 1) + 'の終了'} value={b.end} min={open + step} max={close}
                  onChange={v => onSetBars(bars.map(x => (x.id === b.id ? { ...x, start: Math.min(x.start, v - step), end: v } : x)))} />
              </span>
              <span className="dp__dur">{fmtH(b.end - b.start)}h</span>
              <button type="button" className="btn btn--text"
                onClick={() => onSetBars(bars.filter(x => x.id !== b.id))}>削除</button>
            </li>
          ))}
        </ul>
      )}

      <div className="btn-row dp__actions">
        {!off && <button type="button" className="btn" onClick={addBar}>＋ 時間帯を追加</button>}
        {!off && prevKey && (
          <button type="button" className="btn"
            onClick={() => onSetBars(prevBars.map(b => ({ id: uid(), start: b.start, end: b.end })))}>前日をコピー</button>
        )}
        {!off && bars.length > 0 && <button type="button" className="btn" onClick={() => onSetBars([])}>この日を空にする</button>}
        <span className="strip__spacer" />
        <button type="button" className="btn btn--text" onClick={onClose}>閉じる</button>
      </div>
    </div>
  );
}
