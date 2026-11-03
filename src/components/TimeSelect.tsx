import { SHOP } from '../core/constants';
import { toHM } from '../core/time';

interface Props {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (v: number) => void;
}

/** 30分刻みの時刻セレクト */
export function TimeSelect({ value, min, max, label, onChange }: Props) {
  const opts: number[] = [];
  for (let m = min; m <= max; m += SHOP.step) opts.push(m);
  return (
    <select className="select" aria-label={label} value={value} onChange={e => onChange(+e.target.value)}>
      {opts.map(m => <option key={m} value={m}>{toHM(m)}</option>)}
    </select>
  );
}
