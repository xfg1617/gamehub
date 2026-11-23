"""Screenshots of the chips in poker and blackjack while they move."""
import sys; sys.path.insert(0, 'test')
from tlib import *
from PIL import Image
def strip(files, crop, name, cols=4):
    ims = [Image.open(f).crop(crop) for f in files]; w, h = ims[0].size
    sh = Image.new('RGB', (w * cols, h * ((len(ims) + cols - 1) // cols)))
    for i, im in enumerate(ims): sh.paste(im, ((i % cols) * w, (i // cols) * h))
    sh.save(name)
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    pg.evaluate("openGame('blackjack')"); pg.wait_for_timeout(200); pg.click('#su-go'); pg.wait_for_timeout(200)
    fs = []
    for v in ['25', '25', '100']:
        pg.click(f'[data-ch="{v}"]'); pg.wait_for_timeout(180); f = f'test/shots/_k{len(fs)}.png'; pg.screenshot(path=f); fs.append(f)
    pg.wait_for_timeout(500); f = f'test/shots/_k{len(fs)}.png'; pg.screenshot(path=f); fs.append(f)
    pg.click('#bj-deal'); pg.wait_for_timeout(3200)
    if pg.query_selector('#bj-stand'): pg.click('#bj-stand')
    for k in range(8):
        pg.wait_for_timeout(420); f = f'test/shots/_k{len(fs)}.png'; pg.screenshot(path=f); fs.append(f)
    strip(fs, (260, 110, 1000, 640), 'test/shots/bj_chips.png')
    print('blackjack', pg.errs)
    pg.evaluate("navigateTo('play', true); openGame('poker')"); pg.wait_for_timeout(200); pg.click('#su-go')
    fs = []
    for k in range(16):
        pg.wait_for_timeout(650)
        b = pg.query_selector('#pk-call')
        if b: b.click()
        f = f'test/shots/_q{k}.png'; pg.screenshot(path=f); fs.append(f)
    strip(fs, (260, 120, 990, 730), 'test/shots/pk_chips.png')
    print('poker', pg.errs)
