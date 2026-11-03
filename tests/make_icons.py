"""public/icon.svg から PWA 用の PNG（192 / 512）を作る．iOS のホーム画面は SVG を使えないため．"""
import base64
import pathlib

from playwright.sync_api import sync_playwright

pub = pathlib.Path(__file__).resolve().parent.parent / 'public'
svg = base64.b64encode((pub / 'icon.svg').read_bytes()).decode()

with sync_playwright() as p:
    b = p.chromium.launch()
    for size in (192, 512):
        page = b.new_page(viewport={'width': size, 'height': size})
        page.set_content(f'<body style="margin:0;background:#fff">'
                         f'<img src="data:image/svg+xml;base64,{svg}" width="{size}" height="{size}" style="display:block">')
        page.screenshot(path=str(pub / f'icon-{size}.png'))
        print('wrote', pub / f'icon-{size}.png')
    b.close()
