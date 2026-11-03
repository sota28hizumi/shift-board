import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';

const here = (p: string) => new URL(p, import.meta.url);

// ビルド時に dist/sw.js を生成する．ハッシュ付きの JS/CSS と public の静的ファイルをキャッシュ一覧に入れ，
// 中身のハッシュを版にする（中身が変わればキャッシュが入れ替わる）
function serviceWorker(): Plugin {
  return {
    name: 'shift-board-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const h = createHash('sha256');
      const files = ['./'];
      for (const f of readdirSync(here('./public'))) {
        files.push('./' + f);
        h.update(readFileSync(here('./public/' + f)));
      }
      for (const [name, out] of Object.entries(bundle)) {
        if (name.endsWith('.map') || name === 'index.html') continue;
        files.push('./' + name);
        h.update(out.type === 'chunk' ? out.code : out.source);
      }
      const source = readFileSync(here('./sw-template.js'), 'utf8')
        .replace('__VERSION__', h.digest('hex').slice(0, 12))
        .replace('__PRECACHE__', JSON.stringify(files));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

// base を相対にして，dist をどのパスに置いても動くようにする
export default defineConfig({
  base: './',
  plugins: [react(), serviceWorker()],
  server: { host: true, port: 5173 },   // 同じ Wi-Fi のスマホから開けるように LAN に公開
  preview: { host: true, port: 4173 },
});
