// Service Worker のひな形．vite.config.ts がビルド時に版とキャッシュ一覧を埋め込み，dist/sw.js として出す．
// アプリ本体を端末にキャッシュし，電波がなくても開けるようにする．
const VERSION = '__VERSION__';
const CACHE = 'shift-board-' + VERSION;
const FONT_CACHE = 'shift-board-fonts';
const PRECACHE = __PRECACHE__;
const NAV_TIMEOUT = 4000;   // ページ本体をネットから取りにいく待ち時間（ms）．超えたらキャッシュを返す

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

// 古い版のキャッシュを消す（フォントは版をまたいで使い回す）
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys
      .filter(k => k.startsWith('shift-board-') && k !== CACHE && k !== FONT_CACHE)
      .map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts：キャッシュがあれば先に返し，裏で更新する（CSS は no-cors で取るので opaque も保存する）
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONT_CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') c.put(req, res.clone());
        return res;
      });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // ページ本体：更新をすぐ反映するためネットを先に試し，つながらない・遅いときはキャッシュを返す
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const net = fetch(req).then(async res => {
        if (res.ok) (await caches.open(CACHE)).put('./', res.clone());
        return res;
      });
      e.waitUntil(net.catch(() => {}));
      const timeout = new Promise(resolve => setTimeout(resolve, NAV_TIMEOUT));
      const first = await Promise.race([net.catch(() => null), timeout]);
      if (first) return first;
      return (await caches.match('./')) || net;
    })());
    return;
  }

  // JS・CSS・アイコン：ファイル名にハッシュが付くのでキャッシュ優先．
  // サーバーが Vary: Origin を返すと crossorigin 付きの読み込みと照合が外れるため Vary は見ない
  e.respondWith(caches.match(req, { ignoreSearch: true, ignoreVary: true }).then(hit => hit || fetch(req)));
});
