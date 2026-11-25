"""The game log can be dragged anywhere by its title bar and remembers the spot (Inna, Nov 2026)."""
import sys; sys.path.insert(0, 'test')
from tlib import *
from nplib import check
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1500, 900)
    pg.evaluate("openGame('tycoon')"); pg.wait_for_timeout(300); pg.click('#su-go'); pg.wait_for_timeout(2500)
    pg.click('.gs-moves'); pg.wait_for_timeout(300)
    g = pg.query_selector('#lb-grip'); check(g and g.is_visible(), 'opening the log shows its title bar')
    b0 = g.bounding_box(); pg.mouse.move(b0['x'] + 40, b0['y'] + 15); pg.mouse.down(); pg.mouse.move(400, 300, steps=8); pg.mouse.up(); pg.wait_for_timeout(200)
    b1 = pg.query_selector('#lb-grip').bounding_box(); lb = pg.evaluate("(() => { const r = [...document.querySelectorAll('#game-root .logbox')].find(e => getComputedStyle(e).display !== 'none').getBoundingClientRect(); return [r.left, r.top]; })()")
    print('   grip moved from', round(b0['x']), round(b0['y']), 'to', round(b1['x']), round(b1['y']), '· log at', [round(v) for v in lb])
    check(abs(b1['x'] - 360) < 6 and abs(b1['y'] - 285) < 6, 'dragging the title bar moves the log window')
    check(abs(lb[0] - b1['x']) < 2 and abs(lb[1] - (b1['y'] + 34)) < 3, 'the log sits right under its title bar')
    pg.screenshot(path='test/shots/log_moved.png')
    pg.click('#lb-grip .lb-x'); pg.wait_for_timeout(200)
    check(not pg.query_selector('#lb-grip').is_visible(), '✕ closes it')
    pg.click('.gs-moves'); pg.wait_for_timeout(200)
    b2 = pg.query_selector('#lb-grip').bounding_box(); check(abs(b2['x'] - b1['x']) < 3, 'opening it again puts it where it was left')
    check(not pg.errs, 'no errors ' + str(pg.errs[:2]))
    br.close()
