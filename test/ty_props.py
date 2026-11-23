import sys, time; sys.path.insert(0, 'test')
from tlib import *
w = int(sys.argv[1]); h = int(sys.argv[2]); secs = int(sys.argv[3])
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, w, h, mobile=w < 600)
    pg.evaluate("openGame('tycoon')"); pg.wait_for_timeout(300); pg.click('#su-go')
    t0 = time.time()
    while time.time() - t0 < secs:
        pg.evaluate("const b=document.querySelector('#by-yes')||document.querySelector('#ty-prompt button'); if(b){ if(b.id==='ty-roll'){ b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); setTimeout(()=>window.dispatchEvent(new PointerEvent('pointerup')),300);} else b.click(); } const d=document.querySelector('#pn-close'); if(d) d.click();")
        pg.wait_for_timeout(500)
    el = pg.query_selector('#ty-board'); el.screenshot(path=f'test/shots/ty_props_{w}.png')
    print(pg.errs)
