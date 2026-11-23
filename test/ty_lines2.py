"""Compare back-to-back board screenshots and report thin line-shaped changes (flicker)."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
from PIL import Image, ImageChops
dpr = float(sys.argv[1]) if len(sys.argv) > 1 else 1
w = int(sys.argv[2]) if len(sys.argv) > 2 else 1280; h = int(sys.argv[3]) if len(sys.argv) > 3 else 900
with sync_playwright() as p:
    br = launch(p)
    ctx = br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr, is_mobile=w < 600, has_touch=w < 600)
    pg = ctx.new_page()
    stub = os.path.join(ROOT, 'test', 'tw_stub.js'); ctx.route('https://cdn.tailwindcss.com/**', lambda r: r.fulfill(path=stub, content_type='application/javascript')); ctx.route('https://cdn.tailwindcss.com', lambda r: r.fulfill(path=stub, content_type='application/javascript'))
    pg.goto('file://' + FILE); pg.wait_for_timeout(400)
    pg.evaluate("openGame('tycoon')"); pg.wait_for_timeout(300); pg.click('[data-k="clock"][data-v="0"]'); pg.click('#su-go'); pg.wait_for_timeout(600)
    box = pg.query_selector('#ty-board').bounding_box()
    prev = None; hits = []; t0 = time.time(); n = 0
    while time.time() - t0 < 40:
        pg.evaluate("""(() => { const q = (s) => document.querySelector(s);
          if (q('#by-yes')) return q('#by-yes').click(); if (q('#au-pass')) return q('#au-pass').click();
          const r = q('#ty-roll'); if (r) { r.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); setTimeout(() => window.dispatchEvent(new PointerEvent('pointerup')), 250); return; }
          const b = q('#ty-prompt button'); if (b) b.click(); })()""")
        f = f'test/shots/_m{n % 60}.png'; pg.screenshot(path=f, clip=box); n += 1
        im = Image.open(f).convert('RGB')
        if prev is not None and prev.size == im.size:
            d = ImageChops.difference(prev, im).convert('L').point(lambda v: 255 if v > 40 else 0)
            W, H = d.size; px = d.load()
            # a changed horizontal or vertical line at least 40px long and at most 3px thick
            for y in range(1, H - 1):
                run = best = 0
                for x in range(W):
                    if px[x, y] and not (px[x, y - 1] and px[x, y + 1] and y > 2 and px[x, y - 2]): run += 1; best = max(best, run)
                    else: run = 0
                if best >= 40: hits.append(('h', y, best, n)); break
            for x in range(1, W - 1):
                run = best = 0
                for y in range(H):
                    if px[x, y] and not (px[x - 1, y] and px[x + 1, y] and x > 2 and px[x - 2, y]): run += 1; best = max(best, run)
                    else: run = 0
                if best >= 40: hits.append(('v', x, best, n)); im.save('test/shots/_line_now.png'); prev.save('test/shots/_line_before.png'); break
        prev = im
        pg.wait_for_timeout(120)
    print('dpr', dpr, 'frames', n, 'thin line changes:', len(hits), hits[:10])
