"""Hunt for flickering dark lines on the Tycoon board: screenshot the board many times while playing
and look for dark pixel runs inside areas that should be green (the centre) or cream (the squares)."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
from PIL import Image
w = int(sys.argv[1]) if len(sys.argv) > 1 else 1280; h = int(sys.argv[2]) if len(sys.argv) > 2 else 900
dpr = float(sys.argv[3]) if len(sys.argv) > 3 else 1
with sync_playwright() as p:
    br = launch(p)
    ctx = br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr)
    pg = ctx.new_page(); pg.errs = []
    stub = os.path.join(ROOT, 'test', 'tw_stub.js'); ctx.route('https://cdn.tailwindcss.com/**', lambda r: r.fulfill(path=stub, content_type='application/javascript')); ctx.route('https://cdn.tailwindcss.com', lambda r: r.fulfill(path=stub, content_type='application/javascript'))
    pg.goto('file://' + FILE); pg.wait_for_timeout(400)
    pg.evaluate("openGame('tycoon')"); pg.wait_for_timeout(300); pg.click('[data-k="clock"][data-v="0"]'); pg.click('#su-go'); pg.wait_for_timeout(600)
    box = pg.query_selector('#ty-board').bounding_box()
    cen = pg.query_selector('.ty-center').bounding_box()
    found = []; t0 = time.time(); n = 0
    while time.time() - t0 < 45:
        pg.evaluate("""(() => { const q = (s) => document.querySelector(s);
          if (q('#by-yes')) return q('#by-yes').click(); if (q('#au-pass')) return q('#au-pass').click();
          const r = q('#ty-roll'); if (r) { r.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); setTimeout(() => window.dispatchEvent(new PointerEvent('pointerup')), 250); return; }
          const b = q('#ty-prompt button'); if (b) b.click(); })()""")
        f = f'test/shots/_l{n % 40}.png'; pg.screenshot(path=f, clip=box); n += 1
        im = Image.open(f).convert('RGB'); W, H = im.size; px = im.load()
        # centre area (in screenshot coordinates), avoiding its outer 4px
        x0 = int((cen['x'] - box['x']) * dpr) + 4; y0 = int((cen['y'] - box['y']) * dpr) + 4
        x1 = int((cen['x'] + cen['width'] - box['x']) * dpr) - 4; y1 = int((cen['y'] + cen['height'] - box['y']) * dpr) - 4
        dark = lambda c: c[0] < 30 and c[1] < 40 and c[2] < 50
        for y in range(y0, y1, 1):
            run = best = 0
            for x in range(x0, x1):
                if dark(px[x, y]): run += 1; best = max(best, run)
                else: run = 0
            if best > (x1 - x0) * 0.6: found.append(('row', y, n, f)); break
        for x in range(x0, x1, 1):
            run = best = 0
            for y in range(y0, y1):
                if dark(px[x, y]): run += 1; best = max(best, run)
                else: run = 0
            if best > (y1 - y0) * 0.6: found.append(('col', x, n, f)); break
        pg.wait_for_timeout(150)
    print('screenshots:', n, '| frames with a long dark line across the centre:', len(found), found[:6], pg.errs)
