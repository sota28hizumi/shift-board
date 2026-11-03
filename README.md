# シフト希望ボード（Web版）

Artifact 版（`../shift-board.html`）を Vite＋React＋TypeScript の Web アプリにしたもの。
Artifact 版はそのまま残してあり、状態JSON（version 3）は両者で共通。

## 起動

```powershell
cd webapp
npm install        # 初回のみ
npm run dev        # http://localhost:5173/ ．同じ Wi-Fi のスマホからは表示される Network の URL で開く
npm run build      # dist/ に本番ビルド（dist/sw.js も生成される）
npm run preview    # ビルド結果を http://localhost:4173/ で確認（Service Worker が動くのはこちらだけ）
```

## Artifact 版との違い

- 入力内容をブラウザ（localStorage）に自動保存する。JSON の貼り戻しは不要（引き続き使える）。
- JSON をファイルに書き出し／ファイルから読み込みできる。
- 「全消去」は「この半月を消去」に変更（保存が続くので、ほかの半月を巻き込まない）。
- ホーム画面に追加できる（manifest とアイコン）。Service Worker がアプリ本体とフォントを端末にキャッシュするので、
  一度開いた端末なら電波がなくても開ける。ページ本体はネットを先に見るので、更新はつながっていればすぐ反映される。
- 見た目はデジタル庁デザインシステム（DADS）のトークン・フォーカス・文字サイズ・ターゲットサイズに寄せた。
  タイムラインの目盛りとバー内の文字だけは表示領域の都合で 12px（DADS の 14px 未満を避ける原則の例外）。

## 構成

- `src/core/` … 状態の型・定数・祝日・期間・計算・JSONスキーマ。UI とブラウザ API に依存しない（アプリ移植時にそのまま使う）。
- `src/platform/` … 保存（localStorage）・クリップボード・ファイル・Service Worker の登録。移植時はここを差し替える。
- `sw-template.js` … Service Worker のひな形。`vite.config.ts` のプラグインがビルド時にキャッシュ一覧と版を埋め込んで `dist/sw.js` にする。
- `src/components/` … 画面部品。`src/App.tsx` が状態を持つ。
- `src/styles/` … `dads-tokens.css`（DADS 公式トークン、MIT）と `app.css`。
- `tests/e2e.py` … Playwright（`playgraund/.venv`）での E2E。`python tests/e2e.py http://localhost:5173/ <スクショ出力先>`
  （ブラウザ内の日付は 2026-09-05 に固定。Windows のコンソールでは先に `$env:PYTHONIOENCODING='utf-8'` を設定する）
- `tests/make_icons.py` … `public/icon.svg` から PNG アイコンを生成。

出典：デジタル庁デザインシステム https://design.digital.go.jp/dads/ （デザイントークン MIT License、`src/styles/LICENSE-dads-tokens.txt`）
