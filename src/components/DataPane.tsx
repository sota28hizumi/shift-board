// 状態JSONの保存・復元．Artifact 版の JSON もそのまま貼り戻せる．
import { useRef, useState } from 'react';
import type { Period } from '../core/types';
import { copyText } from '../platform/clipboard';
import { downloadText } from '../platform/file';
import { Icon } from './icons';

interface Props {
  json: string;
  period: Period;
  onLoad: (text: string) => string | null;   // 失敗時はエラーメッセージ
}

export function DataPane({ json, period, onLoad }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; err: boolean }>({ text: '', err: false });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = (src: string, from: string) => {
    const err = onLoad(src);
    if (err) setMsg({ text: '＊' + from + 'を読み込めませんでした（' + err + '）。JSON の形式を確認してください。', err: true });
    else { setDraft(null); setMsg({ text: from + 'を読み込みました。', err: false }); }
  };

  return (
    <details className="pane">
      <summary className="pane__sum"><Icon name="data" />データの保存と復元</summary>
      <div className="pane__in">
        <p className="support">
          入力内容はこの端末のブラウザに自動保存されます。機種変更やブラウザのデータ削除に備えて，ときどきファイルに書き出してください。
          Artifact 版でコピーした JSON も，下の欄に貼り付けて読み込めます。
        </p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() =>
            downloadText('shift-' + period.year + '-' + String(period.month).padStart(2, '0') + '.json', json)}>
            ファイルに書き出す
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>ファイルから読み込む</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden
            onChange={async e => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) load(await f.text(), 'ファイル');
            }} />
        </div>

        <label className="field field--block">
          <span className="field__label">状態JSON</span>
          <textarea className="json" spellCheck={false}
            value={draft ?? json} onChange={e => setDraft(e.target.value)} />
        </label>
        <div className="btn-row">
          <button type="button" className="btn" onClick={async () => {
            const ok = await copyText(json);
            setMsg(ok ? { text: 'JSONをコピーしました。', err: false }
                      : { text: '＊コピーできませんでした。欄内を長押しして選択してください。', err: true });
          }}>JSONをコピー</button>
          <button type="button" className="btn" onClick={() => load(draft ?? json, '貼り付けた JSON ')}>この内容を読み込む</button>
          {draft !== null && (
            <button type="button" className="btn btn--text" onClick={() => { setDraft(null); setMsg({ text: '', err: false }); }}>
              編集を取り消す
            </button>
          )}
        </div>
        <p className={'msg' + (msg.err ? ' is-err' : '')} role="status">{msg.text}</p>
      </div>
    </details>
  );
}
