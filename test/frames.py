"""Start a game and take a strip of screenshots so movement can be checked by eye.
usage: frames.py game start_ms step_ms count [w h] [js-to-run-after-start]"""
import sys; sys.path.insert(0, 'test')
from tlib import *
from PIL import Image
g, st, step, n = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
w = int(sys.argv[5]) if len(sys.argv) > 5 else 1280; h = int(sys.argv[6]) if len(sys.argv) > 6 else 900
js = sys.argv[7] if len(sys.argv) > 7 else ''
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, w, h, mobile=w < 600)
    pg.evaluate(f"openGame('{g}')"); pg.wait_for_timeout(300)
    if pg.query_selector('#su-go'): pg.click('#su-go')
    if js: pg.evaluate(js)
    pg.wait_for_timeout(st)
    ims = []
    for i in range(n):
        f = f'test/shots/_f{i}.png'; pg.screenshot(path=f); ims.append(Image.open(f).convert('RGB').resize((w // 2, h // 2)))
        pg.wait_for_timeout(step)
    cols = 3; rows = (n + cols - 1) // cols
    sheet = Image.new('RGB', (cols * w // 2, rows * h // 2), 'white')
    for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * w // 2, (i // cols) * h // 2))
    sheet.save(f'test/shots/{g}_strip.png')
    print(pg.errs)
