import { useEffect, useMemo, useState } from 'react';
import type { AppState, Bar, FixedNg, PayInput, Period, Target } from './core/types';
import { deserialize, initialState, serialize } from './core/schema';
import { defaultPeriod, periodDays, periodLabel } from './core/period';
import { applyBulk, ngByDow, overlapsNg, withDay } from './core/shifts';
import { calcMoney, otherHalfDays, totals } from './core/calc';
import { plainText, summaryRows } from './core/summary';
import { fmtH, uid, yen } from './core/time';
import { loadSaved, save } from './platform/storage';
import { Summary } from './components/Summary';
import { Toolbar } from './components/Toolbar';
import { Timeline } from './components/Timeline';
import { DayPanel } from './components/DayPanel';
import { PayPane } from './components/PayPane';
import { FixedNgPane } from './components/FixedNgPane';
import { TextPane } from './components/TextPane';
import { DataPane } from './components/DataPane';
import { BrandMark, Icon } from './components/icons';

/** 端末に保存済みの状態を復元する．期間だけは常に「提出対象の半月」から始める */
function boot(): AppState {
  const base = initialState();
  const saved = loadSaved();
  if (!saved) return base;
  try { return { ...deserialize(saved, base), period: base.period }; } catch { return base; }
}

export default function App() {
  const [st, setSt] = useState<AppState>(boot);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [bulk, setBulk] = useState({ start: 17 * 60, end: 22 * 60 });

  const json = useMemo(() => serialize(st), [st]);
  const [saved, setSaved] = useState(true);
  useEffect(() => { setSaved(save(json)); }, [json]);

  const { period, shifts, offDays, pay, fixedNg, target } = st;
  const days = useMemo(() => periodDays(period), [period]);
  const ngMap = useMemo(() => ngByDow(fixedNg), [fixedNg]);
  const tot = useMemo(() => totals(days, shifts, offDays), [days, shifts, offDays]);
  const autoOther = useMemo(() => otherHalfDays(period, shifts, offDays), [period, shifts, offDays]);
  const money = useMemo(() => calcMoney(days, shifts, offDays, pay, autoOther), [days, shifts, offDays, pay, autoOther]);
  const rows = useMemo(() => summaryRows(days, shifts, offDays), [days, shifts, offDays]);
  const text = plainText(period, days, rows, tot);
  const warnCount = useMemo(() => {
    let c = 0;
    days.forEach(d => {
      if (offDays[d.key]) return;
      (shifts[d.key] || []).forEach(b => { if (overlapsNg(b, ngMap[d.dow])) c++; });
    });
    return c;
  }, [days, shifts, offDays, ngMap]);

  /* ── 状態の更新 ── */
  const goPeriod = (p: Period) => { setSt(s => ({ ...s, period: p })); setOpenKey(null); };
  const setTarget = (t: Partial<Target>) => setSt(s => ({ ...s, target: { ...s.target, ...t } }));
  const setPay = (p: Partial<PayInput>) => setSt(s => ({ ...s, pay: { ...s.pay, ...p } }));
  const setFixedNg = (f: (l: FixedNg[]) => FixedNg[]) => setSt(s => ({ ...s, fixedNg: f(s.fixedNg) }));
  const setDay = (key: string, bars: Bar[]) => setSt(s => ({ ...s, shifts: withDay(s.shifts, key, bars) }));
  const toggleOff = (key: string) => setSt(s => ({ ...s, offDays: { ...s.offDays, [key]: !s.offDays[key] } }));
  const commitRange = (key: string, r: [number, number], replaceId?: string) =>
    setSt(s => ({
      ...s,
      shifts: withDay(s.shifts, key,
        (s.shifts[key] || []).filter(b => b.id !== replaceId).concat([{ id: uid(), start: r[0], end: r[1] }])),
    }));
  const bulkApply = (kind: 'wd' | 'we') =>
    setSt(s => ({ ...s, shifts: applyBulk(s.shifts, days, s.offDays, kind, bulk.start, bulk.end) }));
  const clearPeriod = () => setSt(s => {
    const sh = { ...s.shifts }, off = { ...s.offDays };
    days.forEach(d => { delete sh[d.key]; delete off[d.key]; });
    return { ...s, shifts: sh, offDays: off };
  });
  const loadJson = (src: string): string | null => {
    try { setSt(deserialize(src, st)); setOpenKey(null); return null; }
    catch (e) { return (e as Error).message; }
  };

  const gapH = target.hours !== '' ? Number(target.hours) * 60 - tot.min : null;
  const gapD = target.days !== '' ? Number(target.days) - tot.cnt : null;

  return (
    <div className="app">
      <header className="app-head">
        <div className="brand">
          <BrandMark />
          <div className="brand__text">
            <h1 className="brand__name">シフト希望ボード</h1>
            <p className="brand__sub">半月ぶんの希望をつくって，下の枠をスクショで提出する</p>
          </div>
        </div>
        {/* 1画面目はサマリーで埋まるので，入力場所へすぐ移れるようにする */}
        <a className="btn btn--text" href="#timeline">希望を入力 ↓</a>
        <p className={'save-chip' + (saved ? '' : ' is-bad')} role="status">
          <Icon name={saved ? 'check' : 'alert'} />
          {saved ? 'この端末に自動保存' : '保存できません。ファイルに書き出してください'}
        </p>
      </header>

      <Summary period={period} days={days} rows={rows} tot={tot} />

      <Toolbar
        period={period}
        onPeriod={goPeriod}
        onToday={() => goPeriod(defaultPeriod())}
        target={target} onTarget={setTarget}
        bulk={bulk} onBulk={setBulk} onBulkApply={bulkApply}
        onClear={clearPeriod}
      />

      {/* 合計（スクロール中も見えるように固定） */}
      <div className="strip" aria-label="この半月の合計">
        <span className="strip__period">{periodLabel(period)}</span>
        <span className="strip__spacer" />
        {gapH !== null && <span className="strip__gap">{gapH >= 0 ? 'あと' : '超過'} <b>{fmtH(Math.abs(gapH))}h</b></span>}
        {gapD !== null && <span className="strip__gap">{gapD >= 0 ? 'あと' : '超過'} <b>{Math.abs(gapD)}日</b></span>}
        <span className="strip__stat">{fmtH(tot.min)}<small>h</small></span>
        <span className="strip__stat">{tot.cnt}<small>日</small></span>
        <span className="strip__stat is-money">{yen(money.total)}</span>
      </div>

      <Timeline
        period={period} days={days} shifts={shifts} offDays={offDays} ngMap={ngMap}
        openKey={openKey}
        onToggleOpen={k => setOpenKey(o => (o === k ? null : k))}
        onCommit={commitRange}
        onDelete={(k, id) => setDay(k, (shifts[k] || []).filter(b => b.id !== id))}
        onToggleOff={toggleOff}
        renderPanel={(d, i) => (
          <DayPanel
            period={period} day={d}
            bars={shifts[d.key] || []}
            off={!!offDays[d.key]}
            ng={ngMap[d.dow] || []}
            prevKey={i > 0 ? days[i - 1].key : null}
            prevBars={i > 0 ? shifts[days[i - 1].key] || [] : []}
            onSetBars={bars => setDay(d.key, bars)}
            onToggleOff={() => toggleOff(d.key)}
            onClose={() => setOpenKey(null)}
          />
        )}
      />

      <ul className="legend" aria-label="凡例">
        <li><i className="legend__bar" />希望</li>
        <li><i className="legend__ng" />固定予定</li>
        <li><i className="legend__warn" />固定予定と重なり</li>
        <li><i className="legend__night" />22:00〜 深夜帯</li>
      </ul>
      <p className="hint">日付をタップすると，その日を30分単位で細かく編集できます。</p>
      {warnCount > 0 && (
        <p className="note is-warn">固定予定と重なる希望が{warnCount}件あります。休講などで意図したものなら問題ありません。</p>
      )}

      <PayPane pay={pay} onPay={setPay} money={money} autoOther={autoOther} />
      <FixedNgPane fixedNg={fixedNg} onChange={setFixedNg} />
      <TextPane text={text} />
      <DataPane json={json} period={period} onLoad={loadJson} />
    </div>
  );
}
