import sys; sys.path.insert(0, 'test')
from tlib import *
with sync_playwright() as p:
    br = launch(p)
    for w, h, tag in ((1920, 1080, 'w'), (1690, 903, 'd'), (1366, 768, 'l'), (390, 844, 'm')):
        pg = open_page(br, w, h, mobile=w < 600)
        pg.evaluate("setupSave('poker', { clock: 0 }); openGame('poker')"); pg.wait_for_timeout(300)
        go = pg.query_selector('#su-go'); go and go.click()
        try: pg.wait_for_function("document.querySelector('#pk-ctl button')", timeout=60000)
        except Exception: pass
        pg.wait_for_timeout(800)
        sh = pg.evaluate("document.documentElement.scrollHeight")
        cr = pg.evaluate("(() => { const a = document.querySelector('#pk-ctl .win'), c = document.getElementById('chat-fab'), e = document.getElementById('em-fab'); if (!a) return 'no buttons'; const r = a.getBoundingClientRect(); const hit = [c, e].filter(Boolean).some((x) => { const q = x.getBoundingClientRect(); return q.width && !(q.right < r.left || q.left > r.right || q.bottom < r.top || q.top > r.bottom); }); return hit ? 'OVERLAP' : 'clear'; })()")
        print(tag, 'page height', sh, 'screen', h, '| buttons vs chat/emote:', cr, pg.errs[:1])
        pg.screenshot(path=f'test/shots/pk_turn_{tag}.png', full_page=(tag == 'm'))
        pg.close()
    br.close()
