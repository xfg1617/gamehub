import sys; sys.path.insert(0, 'test')
from tlib import *
from PIL import Image
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    pg.evaluate("openGame('blackjack')"); pg.wait_for_timeout(300)
    pg.click('[data-ch="25"]'); pg.click('#bj-deal')
    shots = []
    for i in range(6): pg.wait_for_timeout(260); pg.screenshot(path=f'test/shots/_b{i}.png'); shots.append(f'test/shots/_b{i}.png')
    pg.wait_for_timeout(1500)
    if pg.query_selector('#bj-hit'):
        pg.click('#bj-hit')
        for i in range(6, 9): pg.wait_for_timeout(150); pg.screenshot(path=f'test/shots/_b{i}.png'); shots.append(f'test/shots/_b{i}.png')
        pg.wait_for_timeout(1200)
        if pg.query_selector('#bj-stand'): pg.click('#bj-stand')
    for i in range(9, 12): pg.wait_for_timeout(500); pg.screenshot(path=f'test/shots/_b{i}.png'); shots.append(f'test/shots/_b{i}.png')
    ims = [Image.open(f).crop((260, 120, 940, 560)) for f in shots]
    sheet = Image.new('RGB', (680 * 4, 440 * 3))
    for i, im in enumerate(ims): sheet.paste(im, ((i % 4) * 680, (i // 4) * 440))
    sheet.save('test/shots/blackjack_strip.png'); print(pg.errs)
