"""Tycoon money animations: play for a while, photograph flying bills and +/- pop-ups."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
w = int(sys.argv[1]) if len(sys.argv) > 1 else 1280; h = int(sys.argv[2]) if len(sys.argv) > 2 else 900
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, w, h, mobile=w < 600)
    pg.evaluate("openGame('tycoon')"); pg.wait_for_timeout(300); pg.click('[data-k="clock"][data-v="0"]'); pg.click('#su-go')
    t0 = time.time(); shots = 0; bills = floats = 0
    while time.time() - t0 < 70:
        st = pg.evaluate("[document.querySelectorAll('.ty-bill').length, document.querySelectorAll('.ty-float').length]")
        bills += st[0] > 0; floats += st[1] > 0
        if (st[0] or st[1]) and shots < 6:
            pg.screenshot(path=f'test/shots/money_{w}_{shots}.png'); shots += 1
        pg.evaluate("""(() => { const q = (s) => document.querySelector(s);
          if (q('#by-yes')) return q('#by-yes').click(); if (q('#au-pass')) return q('#au-pass').click();
          const r = q('#ty-roll'); if (r) { r.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); setTimeout(() => window.dispatchEvent(new PointerEvent('pointerup')), 250); return; }
          const b = q('#ty-prompt button'); if (b) b.click(); })()""")
        pg.wait_for_timeout(250)
    pg.wait_for_timeout(2500)
    shown = pg.evaluate("[...document.querySelectorAll('.ty-cash')].map(e => e.textContent)")
    log = pg.evaluate("document.getElementById('ty-log').innerText")
    print(w, '| polls with bills flying:', bills, '| with +/- pop-ups:', floats, '| balances now:', shown, '| errors:', pg.errs)
    print('rent lines:', [l for l in log.split('\n') if 'rent' in l][:4])
