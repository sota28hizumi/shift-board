"""Web版シフト希望ボードの E2E チェック（Playwright・ヘッドレス）．

使い方: playgraund/.venv の python で
    python tests/e2e.py [URL] [スクショ出力先]
ドラッグ作成・リサイズ・削除・日別パネル・前日コピー・終日NG・重なり警告・一括適用・
JSON往復・自動保存（再読込）・旧JSON読込・タッチ操作・ダークモードのサマリー色を確認する．
ブラウザ内の日付を 2026-09-05 に固定して実行する（提出対象＝2026年10月前半）．
"""
import os
import sys

from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5173/'
OUT = sys.argv[2] if len(sys.argv) > 2 else '.'
OPEN, CLOSE = 390, 1410
TODAY = '2026-09-05T10:00:00+09:00'   # 期待値（10/4 日曜・10/12 祝日など）はこの日付が前提
results = []


def check(name, cond, detail=''):
    results.append((name, bool(cond)))
    print(('PASS ' if cond else 'FAIL ') + name + (f'  [{detail}]' if detail else ''))


def x_at(box, m):
    """分 m のスロット中央の x 座標"""
    return box['x'] + (m + 15 - OPEN) / (CLOSE - OPEN) * box['width']


def drag(page, x0, y, x1):
    page.mouse.move(x0, y)
    page.mouse.down()
    page.mouse.move(x1, y, steps=12)
    page.mouse.up()


def ptime(page, i):
    return page.locator('.paper__row').nth(i).locator('.paper__time').inner_text()


def track_box(page, i):
    """行を画面中央付近までスクロールしてからトラックの位置を返す（画面外だとポインタが届かない）"""
    t = page.locator('.tl__row').nth(i).locator('.tl__track')
    t.evaluate("e => e.scrollIntoView({block: 'center'})")
    box = t.bounding_box()
    return box, box['y'] + box['height'] / 2


with sync_playwright() as p:
    browser = p.chromium.launch()

    # ── デスクトップ ──────────────────────────────────
    ctx = browser.new_context(viewport={'width': 1280, 'height': 900}, locale='ja-JP')
    ctx.clock.set_fixed_time(TODAY)
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.goto(URL)
    page.wait_for_selector('.tl__row')

    label = page.locator('.period__label').inner_text()
    check('初期表示は提出対象の半月', label == '2026年10月 前半', label)
    check('半月分15行', page.locator('.tl__row').count() == 15)
    check('ヘッダーのロゴ', page.locator('.brand__mark').count() == 1)
    check('ヘッダーのアプリ名', page.locator('h1').inner_text() == 'シフト希望ボード')
    check('保存状態のチップ', '自動保存' in page.locator('.save-chip').inner_text(), page.locator('.save-chip').inner_text())
    check('パネル見出しのアイコン', page.locator('.pane__sum .icon').count() == 4)

    box, y = track_box(page, 0)
    drag(page, x_at(box, 17 * 60), y, x_at(box, 21 * 60 + 30))
    check('ドラッグで希望を作成', ptime(page, 0) == '17:00–22:00', ptime(page, 0))

    hr = page.locator('.tl__row').nth(0).locator('.tl__bar').first.locator('.tl__handle.is-r').bounding_box()
    drag(page, hr['x'] + hr['width'] / 2, y, x_at(box, 22 * 60 + 30))
    check('右端ドラッグで終了を変更', ptime(page, 0) == '17:00–23:00', ptime(page, 0))

    hl = page.locator('.tl__row').nth(0).locator('.tl__bar').first.locator('.tl__handle.is-l').bounding_box()
    drag(page, hl['x'] + hl['width'] / 2, y, x_at(box, 18 * 60))
    check('左端ドラッグで開始を変更', ptime(page, 0) == '18:00–23:00', ptime(page, 0))

    drag(page, x_at(box, 7 * 60), y, x_at(box, 8 * 60 + 30))
    check('1日に複数の希望', ptime(page, 0) == '07:00–09:00、18:00–23:00', ptime(page, 0))

    page.locator('.tl__row').nth(0).locator('.tl__bar').nth(1).locator('.tl__del').click()
    check('×で削除', ptime(page, 0) == '07:00–09:00', ptime(page, 0))

    # 日別パネル
    page.locator('.tl__row').nth(1).locator('.tl__day').click()
    check('日付タップでパネルが開く', page.locator('.dp').count() == 1)
    page.get_by_role('button', name='＋ 時間帯を追加').click()
    check('パネルで時間帯を追加', ptime(page, 1) == '17:00–21:00', ptime(page, 1))
    page.get_by_label('希望1の終了').select_option(str(22 * 60))
    check('パネルで終了を30分単位で変更', ptime(page, 1) == '17:00–22:00', ptime(page, 1))
    page.locator('.tl__row').nth(2).locator('.tl__day').click()
    page.get_by_role('button', name='前日をコピー').click()
    check('前日をコピー', ptime(page, 2) == '17:00–22:00', ptime(page, 2))
    page.get_by_role('button', name='閉じる').click()
    check('パネルを閉じる', page.locator('.dp').count() == 0)

    # 終日NG（10/4 日曜）
    page.locator('.tl__row').nth(3).locator('.tl__ngbtn').click()
    cls = page.locator('.tl__row').nth(3).get_attribute('class')
    check('終日NGで行が赤くなる', 'is-off' in cls, cls)
    bg = page.locator('.tl__row').nth(3).evaluate('e => getComputedStyle(e).backgroundColor')
    check('終日NGの背景色', bg not in ('rgba(0, 0, 0, 0)', 'transparent'), bg)

    # 固定予定との重なり（10/5 月曜 11:00–16:40）
    box5, y5 = track_box(page, 4)
    drag(page, x_at(box5, 12 * 60), y5, x_at(box5, 13 * 60 + 30))
    warn = page.locator('.tl__row').nth(4).locator('.tl__bar.is-warn').count()
    check('固定予定と重なるバーは警告色', warn == 1)
    check('重なりの注記', page.locator('.note.is-warn', has_text='固定予定と重なる希望が1件').count() == 1)

    # 一括適用（平日 17:00–22:00．10/12 はスポーツの日）
    page.get_by_role('button', name='平日に適用').click()
    check('平日一括で上書き', ptime(page, 4) == '17:00–22:00', ptime(page, 4))
    check('祝日は平日一括の対象外', ptime(page, 11) == '－', ptime(page, 11))
    check('祝日の印', page.locator('.tl__row').nth(11).locator('.tl__hol').count() == 1)
    check('終日NGの日は提出に出ない', ptime(page, 3) == '－', ptime(page, 3))
    page.get_by_role('button', name='土日祝に適用').click()
    check('土日祝一括', ptime(page, 11) == '17:00–22:00' and ptime(page, 9) == '17:00–22:00')
    total = page.locator('.paper__total').inner_text()
    check('合計表示', total.startswith('合計 ') and '出勤' in total, total)

    # JSON 往復
    page.locator('summary', has_text='データの保存と復元').click()
    saved_json = page.locator('textarea.json').input_value()
    page.get_by_role('button', name='この半月を消去').click()
    page.get_by_role('button', name='消去する').click()
    check('この半月を消去', all(ptime(page, i) == '－' for i in range(15)))
    page.locator('textarea.json').fill(saved_json)
    page.get_by_role('button', name='この内容を読み込む').click()
    check('JSON を貼り戻して復元', ptime(page, 0) == '17:00–22:00' and ptime(page, 3) == '－', ptime(page, 0))

    # 自動保存（再読込しても残る）
    page.reload()
    page.wait_for_selector('.tl__row')
    check('再読込後も希望が残る', ptime(page, 12) == '17:00–22:00', ptime(page, 12))
    check('再読込後も終日NGが残る', 'is-off' in page.locator('.tl__row').nth(3).get_attribute('class'))

    # 旧形式（v1・pay なし）の JSON
    page.locator('summary', has_text='データの保存と復元').click()
    page.locator('textarea.json').fill(
        '{"version":1,"period":{"year":2026,"month":10,"half":"H2"},'
        '"shifts":{"2026-10-20":[{"id":"x","start":"17:00","end":"21:00"}]}}')
    page.get_by_role('button', name='この内容を読み込む').click()
    check('v1 JSON の期間', page.locator('.period__label').inner_text() == '2026年10月 後半')
    check('v1 JSON の希望', ptime(page, 4) == '17:00–21:00', ptime(page, 4))
    page.locator('summary', has_text='給料の見込み').click()
    check('v1 JSON は既定の時給で補う', page.get_by_label('時給').input_value() == '1200')
    page.locator('textarea.json').fill('{壊れた')
    page.get_by_role('button', name='この内容を読み込む').click()
    check('壊れた JSON はエラー表示', page.locator('.msg.is-err').count() == 1)

    page.screenshot(path=os.path.join(OUT, 'desktop.png'), full_page=True)
    check('コンソールエラーなし', not errors, ' / '.join(errors))
    ctx.close()

    # ── スマホ（タッチ・ライト／ダーク） ────────────────
    for scheme in ('light', 'dark'):
        ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2,
                                  is_mobile=True, has_touch=True, color_scheme=scheme, locale='ja-JP')
        ctx.clock.set_fixed_time(TODAY)
        page = ctx.new_page()
        page.goto(URL)
        page.wait_for_selector('.tl__row')
        # 行タップ→パネルの終日NG．CDP のタッチ操作の後だとエミュレーション上 click が合成されないため先に行う
        page.locator('.tl__row').nth(1).locator('.tl__day').tap()
        off = page.get_by_role('checkbox', name='終日NG')   # 非表示のデスクトップ用ボタンは role 検索に出ない
        check(f'[{scheme}] スマホは行タップのパネルに終日NG', off.count() == 1)
        if off.count() == 1:
            off.tap()
            check(f'[{scheme}] パネルから終日NGを切替', 'is-off' in page.locator('.tl__row').nth(1).get_attribute('class'))
            off.tap()
            check(f'[{scheme}] 終日NGを戻す', 'is-off' not in page.locator('.tl__row').nth(1).get_attribute('class'))
        page.get_by_role('button', name='閉じる').tap()

        # タッチでのドラッグ（pointerType=touch．touch-action: pan-y で横ドラッグだけ受け取れるか）
        box, y = track_box(page, 1)
        cdp = ctx.new_cdp_session(page)
        x0, x1 = x_at(box, 17 * 60), x_at(box, 21 * 60 + 30)
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x0, 'y': y, 'id': 1}]})
        for k in range(1, 11):
            cdp.send('Input.dispatchTouchEvent',
                     {'type': 'touchMove', 'touchPoints': [{'x': x0 + (x1 - x0) * k / 10, 'y': y, 'id': 1}]})
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        check(f'[{scheme}] タッチのドラッグで作成', ptime(page, 1) == '17:00–22:00', ptime(page, 1))
        over = page.evaluate('document.documentElement.scrollWidth - window.innerWidth')
        check(f'[{scheme}] 横スクロールが出ない', over <= 0, str(over))
        paper = page.locator('.paper').evaluate('e => getComputedStyle(e).backgroundColor + " " + getComputedStyle(e).color')
        check(f'[{scheme}] サマリーは白地・濃い文字', paper == 'rgb(255, 255, 255) rgb(26, 26, 26)', paper)
        page.screenshot(path=os.path.join(OUT, f'mobile-{scheme}.png'), full_page=True)
        ctx.close()

    browser.close()

failed = [n for n, ok in results if not ok]
print(f'\n{len(results) - len(failed)}/{len(results)} passed')
sys.exit(1 if failed else 0)
