"""Game pictures for the how-to videos (Nov 2026, Inna: "add game plays and pictures into the videos").
For every game in HOWTO_SCRIPT (src/games/zz_howto_scripts.js) this opens the real game against computer players,
takes each picture listed in `shots`, and records where the highlighted parts of the screen are.
Writes assets/site/howto/<id>/<n>.jpg and assets/site/howto/index.json. Run after `python3 build.py`."""
import sys, os, json; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'test'))
from tlib import *
from PIL import Image
OUT = os.path.join(ROOT, 'assets', 'site', 'howto'); os.makedirs(OUT, exist_ok=True)
HIDE = "#chat-fab,#em-fab,#gm-note,#tt-host,.gm-loading,#np-rj,.fx-burst{display:none!important}"
index = {}
with sync_playwright() as p:
    br = launch(p)
    # sharp pictures (2x), because the video zooms into them
    ctx = br.new_context(viewport={'width': 1280, 'height': 720}, device_scale_factor=2)
    ctx.route('https://*.supabase.co/**', lambda r: r.abort())
    pg = ctx.new_page(); pg.errs = []; pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    pg.goto('file://' + FILE); pg.wait_for_timeout(600)
    pg.add_style_tag(content=HIDE)
    S = pg.evaluate("window.HOWTO_SCRIPT")
    for gid, d in S.items():
        sels = sorted({l[1] for l in d['lines'] if l[1]})
        shots = []
        for n, sh in enumerate(d.get('shots', [])):
            go = sh.get('go')
            if go == 'naval': pg.evaluate("navigateTo('play', true); launchNavalGrid('Admiral_AI', 1250, 'RANKED')")
            elif go == 'daily': pg.evaluate("navigateTo('play', true); openDailyWord(true)")
            else:
                pg.evaluate(f"navigateTo('play', true); openGame('{gid}')"); pg.wait_for_timeout(300)
                if pg.query_selector('#su-go'): pg.click('#su-go')
            pg.wait_for_timeout(sh.get('wait', 3000))
            if sh.get('js'): pg.evaluate(sh['js']); pg.wait_for_timeout(sh.get('after', 1500))
            pg.evaluate("window.scrollTo(0, 0)")
            boxes = pg.evaluate("(sels) => { const o = {}; sels.forEach((s) => { const e = document.querySelector(s); if (!e) return; const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return; o[s] = [Math.max(0, r.left), Math.max(0, r.top), Math.min(innerWidth, r.right) - Math.max(0, r.left), Math.min(innerHeight, r.bottom) - Math.max(0, r.top)].map(Math.round); }); return o; }", sels)
            os.makedirs(os.path.join(OUT, gid), exist_ok=True)
            png = os.path.join(OUT, gid, f'{n}.png'); pg.screenshot(path=png)
            Image.open(png).convert('RGB').save(os.path.join(OUT, gid, f'{n}.jpg'), quality=68, optimize=True); os.remove(png)
            shots.append({'w': 1280, 'h': 720, 'boxes': boxes})
            missing = [s for s in sels if s not in boxes]
            print(gid, n, 'highlights found:', len(boxes), 'missing:', missing, pg.errs[:1])
        index[gid] = shots
    br.close()
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'))
print('done', sum(len(v) for v in index.values()), 'pictures')
