// アイコンは必ずラベルと組み合わせて使う（単体では使わない）ので装飾扱い＝aria-hidden．
import type { ReactNode } from 'react';

export type IconName = 'yen' | 'calendar' | 'doc' | 'data' | 'check' | 'alert' | 'prev' | 'next';

const PATHS: Record<IconName, ReactNode> = {
  yen: <><circle cx="10" cy="10" r="7.25" /><path d="M6.75 6.5 10 10.25 13.25 6.5M7.25 11h5.5M7.25 13.25h5.5M10 10.25V15" /></>,
  calendar: <><rect x="2.75" y="4.25" width="14.5" height="13" rx="2" /><path d="M2.75 8.25h14.5M6.5 2.5v3.25M13.5 2.5v3.25M6.5 11.5l4 4M10.5 11.5l-4 4" /></>,
  doc: <><path d="M5 2.75h6l4.25 4.25V16.5a.75.75 0 0 1-.75.75h-9.5a.75.75 0 0 1-.75-.75v-13a.75.75 0 0 1 .75-.75Z" /><path d="M10.75 2.75v4.5h4.5M7 11h6M7 13.75h4" /></>,
  data: <><path d="M10 2.75v8.5m0 0 3.25-3.25M10 11.25 6.75 8" /><path d="M3.5 12.75v3.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3.5" /></>,
  check: <path d="m4 10.5 4 4 8-9" />,
  alert: <><path d="M10 3.25 17.5 16.5h-15L10 3.25Z" /><path d="M10 8.25v3.75M10 14.4v.35" /></>,
  prev: <path d="M12.25 4.5 6.75 10l5.5 5.5" />,
  next: <path d="M7.75 4.5 13.25 10l-5.5 5.5" />,
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="icon" viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}

/** ロゴ：タイムラインに希望バーが3本乗り，22時の線が入っている図 */
export function BrandMark() {
  return (
    <svg className="brand__mark" viewBox="0 0 32 32" width="36" height="36" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="var(--bar)" />
      <g fill="var(--bar-ink)">
        <rect x="6" y="7" width="11" height="4" rx="1.5" opacity=".9" />
        <rect x="11" y="14" width="14" height="4" rx="1.5" />
        <rect x="8" y="21" width="8" height="4" rx="1.5" opacity=".9" />
      </g>
      <rect x="22.25" y="5" width="1.5" height="22" rx=".75" fill="var(--bar-ink)" opacity=".45" />
    </svg>
  );
}
