// 固定予定（授業・研究）の編集．タイムラインにはグレーの斜線帯で出る．
import type { FixedNg } from '../core/types';
import { DOW } from '../core/constants';
import { uid } from '../core/time';
import { Icon } from './icons';

interface Props {
  fixedNg: FixedNg[];
  onChange: (f: (l: FixedNg[]) => FixedNg[]) => void;
}

export function FixedNgPane({ fixedNg, onChange }: Props) {
  const edit = (id: string, patch: Partial<FixedNg>) =>
    onChange(l => l.map(x => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <details className="pane">
      <summary className="pane__sum"><Icon name="calendar" />固定予定（授業・研究）</summary>
      <div className="pane__in">
        {fixedNg.length === 0 && <p className="support">固定予定はありません。「予定を追加」から登録できます。</p>}
        <ul className="ng-list">
          {fixedNg.map((n, i) => (
            <li className="ng-list__item" key={n.id}>
              <select className="select" aria-label={'固定予定' + (i + 1) + 'の曜日'} value={n.dow}
                onChange={e => edit(n.id, { dow: +e.target.value })}>
                {DOW.map((w, k) => <option key={k} value={k}>{w}曜</option>)}
              </select>
              <span className="field__box">
                <input className="input input--time" type="time" step="600" aria-label={'固定予定' + (i + 1) + 'の開始'}
                  value={n.start} onChange={e => edit(n.id, { start: e.target.value })} />
                <span className="tilde" aria-hidden="true">–</span>
                <input className="input input--time" type="time" step="600" aria-label={'固定予定' + (i + 1) + 'の終了'}
                  value={n.end} onChange={e => edit(n.id, { end: e.target.value })} />
              </span>
              <input className="input input--label" type="text" aria-label={'固定予定' + (i + 1) + 'のメモ'}
                value={n.label} onChange={e => edit(n.id, { label: e.target.value })} />
              <button type="button" className="btn btn--text"
                onClick={() => onChange(l => l.filter(x => x.id !== n.id))}>削除</button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn"
          onClick={() => onChange(l => l.concat([{ id: uid(), dow: 1, start: '09:00', end: '12:00', label: '' }]))}>
          ＋ 予定を追加
        </button>
        <p className="support">大学までの移動時間はここに含めません。希望を入れるときに自分で見込んでください。</p>
      </div>
    </details>
  );
}
