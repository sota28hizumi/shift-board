// 端末への自動保存．Web 版は localStorage を使う．
// スマホアプリに移植するときはこのファイルだけ差し替える（中身は状態JSON文字列）．

const KEY = 'shift-board/state-v3';

export function loadSaved(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function save(json: string): boolean {
  try { localStorage.setItem(KEY, json); return true; } catch { return false; }
}

export function clearSaved() {
  try { localStorage.removeItem(KEY); } catch { /* 保存できない環境では何もしない */ }
}
