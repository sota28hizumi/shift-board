// クリップボード・共有．LAN 経由の http（非セキュアコンテキスト）でも動くようにフォールバックを持つ．

export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* 下のフォールバックへ */ }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

export const canShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export async function shareText(title: string, text: string): Promise<boolean> {
  try { await navigator.share({ title, text }); return true; } catch { return false; }
}
