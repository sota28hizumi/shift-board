// オフライン対応．本番ビルドのときだけ Service Worker（dist/sw.js）を登録する．
// スマホアプリに移植するときはこのファイルごと不要になる．

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* 登録できなくても通常どおり動く */ });
  });
}
