// 状態の型．UI やストレージの仕組みに依存させない（スマホアプリ移植時もそのまま使う）．

export type Half = 'H1' | 'H2';

export interface Period {
  year: number;
  month: number;   // 1〜12
  half: Half;      // H1 = 1〜15日，H2 = 16日〜月末
}

/** 希望バー．時刻は 0:00 からの分で持つ（JSON では "HH:MM"） */
export interface Bar {
  id: string;
  start: number;
  end: number;
}

export interface FixedNg {
  id: string;
  dow: number;     // 0=日 〜 6=土
  start: string;   // "HH:MM"
  end: string;
  label: string;
}

/** 入力欄の値をそのまま持つので文字列．計算時に数値化する */
export interface PayInput {
  wage: string;
  nightRate: string;
  breakRule: boolean;
  fare: string;
  fareMinDays: string;
  fareCap: string;
  otherDays: string;   // 空文字なら自動集計
}

export interface Target {
  hours: string;
  days: string;
}

export interface AppState {
  period: Period;
  target: Target;
  pay: PayInput;
  fixedNg: FixedNg[];
  offDays: Record<string, boolean>;
  shifts: Record<string, Bar[]>;
}

export interface Day {
  date: number;
  dow: number;
  key: string;           // "YYYY-MM-DD"
  hol: string | null;    // 祝日名
}
