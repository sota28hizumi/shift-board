// タイムライン．縦＝日付，横＝6:30〜23:30 を画面幅に圧縮（横スクロールなし）．
// ポインタ操作は pointer events で実装し，マウス・タッチ・ペンを同じコードで扱う．
import { Fragment, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import type { Bar, Day, Period } from '../core/types';
import type { NgRange } from '../core/shifts';
import { DOW, SHOP, SLOTS } from '../core/constants';
import { clamp, fmtH, pct, toHM } from '../core/time';
import { isWeekendLike } from '../core/period';
import { barMinutes, overlapsNg } from '../core/shifts';

type Mode = 'create' | 'rl' | 'rr' | 'tap';
interface Drag {
  key: string;
  mode: Mode;
  bar?: string;    // リサイズ中のバー
  a: number;       // 押した位置のスロット
  b: number;       // 現在のスロット
  pid: number;
  x0: number;
  moved: boolean;
}

interface Props {
  period: Period;
  days: Day[];
  shifts: Record<string, Bar[]>;
  offDays: Record<string, boolean>;
  ngMap: Record<number, NgRange[]>;
  openKey: string | null;
  onToggleOpen: (key: string) => void;
  onCommit: (key: string, range: [number, number], replaceId?: string) => void;
  onDelete: (key: string, barId: string) => void;
  onToggleOff: (key: string) => void;
  renderPanel: (d: Day, i: number) => ReactNode;
}

const TICKS = Array.from({ length: 17 }, (_, i) => i + 7);   // 7〜23時

function rangeOf(d: Drag, bars: Bar[]): [number, number] | null {
  const { open, step } = SHOP;
  if (d.mode === 'create') {
    const a = Math.min(d.a, d.b), b = Math.max(d.a, d.b);
    return [open + a * step, open + (b + 1) * step];
  }
  const bar = bars.find(x => x.id === d.bar);
  if (!bar) return null;
  if (d.mode === 'rl') {
    const es = (bar.end - open) / step;
    return [open + clamp(d.b, 0, es - 1) * step, bar.end];
  }
  const ss = (bar.start - open) / step;
  return [bar.start, open + (clamp(d.b, ss, SLOTS - 1) + 1) * step];
}

export function Timeline(p: Props) {
  const tracks = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRef = useRef<Drag | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const put = (v: Drag | null) => { dragRef.current = v; setDrag(v); };

  const slotAt = (key: string, x: number) => {
    const el = tracks.current[key];
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return clamp(Math.floor((x - r.left) / r.width * SLOTS), 0, SLOTS - 1);
  };

  const onDown = (e: PointerEvent<HTMLDivElement>, d: Day) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const t = e.target as HTMLElement;
    const role = t.dataset.role;
    if (role === 'del') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const base = { key: d.key, pid: e.pointerId, x0: e.clientX, moved: false, a: 0, b: 0 };
    if (p.offDays[d.key]) { put({ ...base, mode: 'tap' }); return; }
    const s = slotAt(d.key, e.clientX);
    if (role === 'hl' || role === 'hr') put({ ...base, mode: role === 'hl' ? 'rl' : 'rr', bar: t.dataset.bar, a: s, b: s });
    else if (role === 'bar') put({ ...base, mode: 'tap' });
    else put({ ...base, mode: 'create', a: s, b: s });
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const dr = dragRef.current;
    if (!dr || dr.pid !== e.pointerId || dr.mode === 'tap') return;
    const s = slotAt(dr.key, e.clientX);
    const moved = dr.moved || Math.abs(e.clientX - dr.x0) > 5;
    if (s !== dr.b || moved !== dr.moved) put({ ...dr, b: s, moved });
  };

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pid !== e.pointerId) return;
    put(null);
    if (!d.moved) { p.onToggleOpen(d.key); return; }
    const r = rangeOf(d, p.shifts[d.key] || []);
    if (r && r[1] > r[0]) p.onCommit(d.key, r, d.mode === 'create' ? undefined : d.bar);
  };

  return (
    <section className="tl" id="timeline" aria-label="タイムライン">
      <div className="tl__axis" aria-hidden="true">
        {TICKS.map(h => (
          <span key={h} className={'tl__tick' + (h % 2 === 0 ? ' is-even' : '')} style={{ left: pct(h * 60) + '%' }}>{h}</span>
        ))}
      </div>
      <div className="tl__body">
        <div className="tl__hours" aria-hidden="true">
          {TICKS.map(h => (
            <div key={h} className={'tl__hline' + (h === 12 ? ' is-noon' : h === 22 ? ' is-night' : '')}
              style={{ left: pct(h * 60) + '%' }} />
          ))}
        </div>

        {p.days.map((d, i) => {
          const off = !!p.offDays[d.key];
          const bars = p.shifts[d.key] || [];
          const ng = p.ngMap[d.dow] || [];
          const dm = off ? 0 : barMinutes(bars);
          const dragging = !!drag && drag.key === d.key && drag.moved && drag.mode !== 'tap';
          const pr = dragging ? rangeOf(drag!, bars) : null;
          const cls = ['tl__row',
            isWeekendLike(d) ? 'is-we' : '',
            (d.dow === 0 || d.hol) ? 'is-sun' : '',
            d.dow === 6 ? 'is-sat' : '',
            off ? 'is-off' : ''].filter(Boolean).join(' ');
          const dayName = p.period.month + '月' + d.date + '日（' + DOW[d.dow] + (d.hol ? '・' + d.hol : '') + '）';

          return (
            <Fragment key={d.key}>
              <div className={cls}>
                <button type="button" className="tl__day" aria-expanded={p.openKey === d.key}
                  aria-label={dayName + 'を編集'} onClick={() => p.onToggleOpen(d.key)}>
                  <span className="tl__dnum">{d.date}</span>
                  <span className="tl__dow">{DOW[d.dow]}</span>
                  {d.hol && <span className="tl__hol" />}
                </button>

                <div className="tl__track" ref={el => { tracks.current[d.key] = el; }}
                  onPointerDown={e => onDown(e, d)} onPointerMove={onMove}
                  onPointerUp={onUp} onPointerCancel={() => put(null)}>
                  {ng.map((n, j) => {
                    const l = pct(Math.max(n.s, SHOP.open)), r = pct(Math.min(n.e, SHOP.close));
                    if (r <= l) return null;
                    return <div key={j} className="tl__ng" style={{ left: l + '%', width: (r - l) + '%' }} />;
                  })}
                  {bars.map(b => {
                    if (dragging && drag!.bar === b.id) return null;
                    const bad = overlapsNg(b, ng);
                    return (
                      <div key={b.id} data-role="bar" data-bar={b.id}
                        className={'tl__bar' + (bad ? ' is-warn' : '')}
                        style={{ left: pct(b.start) + '%', width: (pct(b.end) - pct(b.start)) + '%' }}>
                        <span className="tl__btxt">{toHM(b.start)}<span className="tl__bend">–{toHM(b.end)}</span>
                          <span className="tl__bdur">{fmtH(b.end - b.start)}h</span></span>
                        {!off && <div className="tl__handle is-l" data-role="hl" data-bar={b.id} />}
                        {!off && <div className="tl__handle is-r" data-role="hr" data-bar={b.id} />}
                        {!off && (
                          <button type="button" className="tl__del" data-role="del"
                            aria-label={dayName + ' ' + toHM(b.start) + '–' + toHM(b.end) + ' の希望を削除'}
                            onClick={() => p.onDelete(d.key, b.id)}>×</button>
                        )}
                      </div>
                    );
                  })}
                  {pr && <div className="tl__bar is-preview"
                    style={{ left: pct(pr[0]) + '%', width: (pct(pr[1]) - pct(pr[0])) + '%' }} />}
                  {pr && (
                    <div className={'tl__readout' + (i < 2 ? ' is-below' : '')}
                      style={{ left: clamp((pct(pr[0]) + pct(pr[1])) / 2, 16, 84) + '%' }}>
                      {toHM(pr[0])}–{toHM(pr[1])}　{fmtH(pr[1] - pr[0])}h
                    </div>
                  )}
                </div>

                <div className={'tl__total' + (dm === 0 ? ' is-zero' : '')}>{off ? 'NG' : dm > 0 ? fmtH(dm) + 'h' : '–'}</div>
                <button type="button" className="tl__ngbtn" aria-pressed={off}
                  aria-label={dayName + 'を終日NGにする'} onClick={() => p.onToggleOff(d.key)}>
                  {off ? '✓ ' : ''}終日NG
                </button>
              </div>
              {p.openKey === d.key && p.renderPanel(d, i)}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
