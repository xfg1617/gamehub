"""Bowling: throw with a real mouse flick, watch the camera follow, and play a whole game to the end."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
from PIL import Image
w = int(sys.argv[1]) if len(sys.argv) > 1 else 1280; h = int(sys.argv[2]) if len(sys.argv) > 2 else 900
def flick(pg, dx=0, fast=True, curve=0):
    b = pg.query_selector('#bw-cv').bounding_box()
    x0 = b['x'] + b['width'] / 2; y0 = b['y'] + b['height'] * 0.87
    pg.mouse.move(x0, y0); pg.mouse.down()
    pg.mouse.move(x0 + dx, y0 + 4, steps=4)
    n = 6; dy = b['height'] * (0.55 if fast else 0.3)
    for i in range(1, n + 1):
        cx = x0 + dx + curve * (i / n) ** 2
        pg.mouse.move(cx, y0 - dy * i / n); pg.wait_for_timeout(12)
    pg.mouse.up()
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, w, h, mobile=w < 600)
    pg.evaluate("openGame('bowling')"); pg.wait_for_timeout(200); pg.click('#su-go'); pg.wait_for_timeout(500)
    box = pg.query_selector('#bw-cv').bounding_box()
    flick(pg, dx=25, curve=-30)
    shots = []
    for i in range(10):
        pg.wait_for_timeout(280); f = f'test/shots/_w{i}.png'; pg.screenshot(path=f, clip=box); shots.append(f)
    ims = [Image.open(f).resize((int(box['width'] / 2), int(box['height'] / 2))) for f in shots]
    W2, H2 = ims[0].size; sheet = Image.new('RGB', (W2 * 5, H2 * 2))
    for i, im in enumerate(ims): sheet.paste(im, ((i % 5) * W2, (i // 5) * H2))
    sheet.save(f'test/shots/bowl_throw_{w}.png')
    print('message after first throw:', pg.evaluate("document.getElementById('bw-msg').textContent"))
    # play on: keep flicking whenever it is our turn, until the game ends
    t0 = time.time(); throws = 1
    while time.time() - t0 < 150 and not pg.query_selector('#g-modal:not(.hidden)'):
        st = pg.evaluate("(() => { const G = GAME_MODS.bowling.engine.state(); return G ? [G.phase, G.players[G.cur].human, G.over] : null; })()")
        if st and st[0] == 'idle' and st[1] and not st[2]: flick(pg, dx=(throws % 5 - 2) * 12, fast=throws % 3 != 0, curve=(-25 if throws % 2 else 15)); throws += 1
        pg.wait_for_timeout(300)
    rolls = pg.evaluate("GAME_MODS.bowling.engine.state().players[0].rolls")
    print('throws:', throws, '| rolls:', rolls, '| finished:', bool(pg.query_selector('#g-modal:not(.hidden)')), '| errors:', pg.errs)
    pg.screenshot(path=f'test/shots/bowl_end_{w}.png')
