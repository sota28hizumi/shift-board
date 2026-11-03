// 提出用のプレーンテキスト（サマリーと同じ内容）．
import { useState } from 'react';
import { canShare, copyText, shareText } from '../platform/clipboard';
import { Icon } from './icons';

export function TextPane({ text }: { text: string }) {
  const [msg, setMsg] = useState<{ text: string; err: boolean }>({ text: '', err: false });
  return (
    <details className="pane" open>
      <summary className="pane__sum"><Icon name="doc" />提出用テキスト</summary>
      <div className="pane__in">
        <pre className="plain">{text}</pre>
        <div className="btn-row">
          <button type="button" className="btn btn--fill" onClick={async () => {
            const ok = await copyText(text);
            setMsg(ok ? { text: '提出用テキストをコピーしました。', err: false }
                      : { text: 'コピーできませんでした。上の枠内を長押しして選択してください。', err: true });
          }}>テキストをコピー</button>
          {canShare() && (
            <button type="button" className="btn" onClick={() => { void shareText('シフト希望', text); }}>共有</button>
          )}
        </div>
        <p className={'msg' + (msg.err ? ' is-err' : '')} role="status">{msg.text}</p>
      </div>
    </details>
  );
}
