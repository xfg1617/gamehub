"""Play one move in chess or checkers and screenshot the board while pieces move."""
import sys; sys.path.insert(0, 'test')
from tlib import *
from PIL import Image
g = sys.argv[1]
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    pg.evaluate(f"openGame('{g}')"); pg.wait_for_timeout(300)
    if g == 'chess': pg.click('[data-k="side"][data-v="w"]')
    pg.click('#su-go'); pg.wait_for_timeout(500)
    bid = '#ch-board' if g == 'chess' else '#ck-board'
    a, b = ((52, 36) if g == 'chess' else (40, 33))
    pg.click(f'{bid} [data-i="{a}"]'); pg.wait_for_timeout(200); pg.click(f'{bid} [data-i="{b}"]')
    box = pg.query_selector(bid).bounding_box()
    shots = []
    for i in range(12):
        f = f'test/shots/_c{i}.png'; pg.screenshot(path=f, clip=box); shots.append(f); pg.wait_for_timeout(110)
    ims = [Image.open(f).resize((280, 280)) for f in shots]
    sheet = Image.new('RGB', (280 * 6, 280 * 2))
    for i, im in enumerate(ims): sheet.paste(im, ((i % 6) * 280, (i // 6) * 280))
    sheet.save(f'test/shots/{g}_strip.png'); print(pg.errs)
