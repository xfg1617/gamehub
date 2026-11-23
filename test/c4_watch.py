import sys; sys.path.insert(0, 'test')
from tlib import *
from PIL import Image
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    pg.evaluate("openConnect4('ai', 'Smart AI')"); pg.wait_for_timeout(500)
    box = pg.query_selector('#c4-board').bounding_box()
    shots = []
    pg.click('#c4-board > div:nth-child(39)')
    for i in range(12):
        f = f'test/shots/_d{i}.png'; pg.screenshot(path=f, clip=box); shots.append(f); pg.wait_for_timeout(60)
    ims = [Image.open(f).resize((300, int(300 * box['height'] / box['width']))) for f in shots]
    hh = ims[0].height
    sheet = Image.new('RGB', (300 * 6, hh * 2))
    for i, im in enumerate(ims): sheet.paste(im, ((i % 6) * 300, (i // 6) * hh))
    sheet.save('test/shots/c4_strip.png'); print(pg.errs)
