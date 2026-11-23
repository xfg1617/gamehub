"""Open one game, press Start, wait, screenshot. usage: look.py game [ms] [w] [h] [suffix]"""
import sys; sys.path.insert(0, 'test')
from tlib import *
g = sys.argv[1]; ms = int(sys.argv[2]) if len(sys.argv) > 2 else 1500
w = int(sys.argv[3]) if len(sys.argv) > 3 else 1280; h = int(sys.argv[4]) if len(sys.argv) > 4 else 900
suf = sys.argv[5] if len(sys.argv) > 5 else ''
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, w, h, mobile=w < 600)
    pg.evaluate(f"openGame('{g}')"); pg.wait_for_timeout(300)
    if pg.query_selector('#su-go'): pg.click('#su-go')
    pg.wait_for_timeout(ms)
    pg.screenshot(path=f'test/shots/{g}{suf}.png', full_page=True)
    print(pg.errs)
