"""Let a scripted player click through each game for a while. Fails on any page error.
Also counts CSS animations that start (a replayed animation on every redraw = the old 'blink' bug)."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
STEP = {
 'poker': "const b=document.querySelector('#pk-call'); if(b) b.click();",
 'blackjack': "const q=(s)=>document.querySelector(s); if(q('#bj-next')) q('#bj-next').click(); else if(q('[data-ch=\"25\"]')&&q('#bj-deal')){q('[data-ch=\"25\"]').click(); q('#bj-deal').click();} else if(q('#bj-hit')) (Math.random()<.5?q('#bj-hit'):q('#bj-stand')).click();",
 'colorclash': "const q=(s)=>document.querySelector(s); const pb=q('#cc-prompt button'); if(pb) pb.click(); else { const ok=q('#cc-hand .cc-card.ok'); if(ok) ok.click(); else if(q('#cc-hand .cc-card.no')) q('#cc-draw').click(); }",
 'kittens': "const q=(s)=>document.querySelector(s); const pb=[...document.querySelectorAll('#kk-prompt button')].filter(b=>b.id!=='kk-nope'); if(pb.length){ const c=q('#kk-hand .kk-card:not([data-t=defuse]):not([data-t=bomb]):not([data-t=nope])'); if(c && Math.random()<.3 && q('#kk-draw')) c.click(); else pb[0].click(); }",
 'tycoon': "const b=document.querySelector('#ty-prompt button'); if(b) b.click(); const d=document.querySelector('#pn-close'); if(d) d.click();",
 'checkers': "const q=(s)=>document.querySelector('#ck-board '+s); const t=q('.tmov'); if(t) t.click(); else { const c=document.querySelectorAll('#ck-board .ck-can'); if(c.length) c[Math.floor(Math.random()*c.length)].parentElement.click(); }",
 'chess': "const sq=[...document.querySelectorAll('#ch-board .chsq')]; const t=sq.filter(e=>e.classList.contains('tmov')||e.classList.contains('tcap')); if(t.length) t[Math.floor(Math.random()*t.length)].click(); else { const own=sq.filter(e=>{const s=e.querySelector('svg'); return s && +e.dataset.i>=0;}); own[Math.floor(Math.random()*own.length)].click(); } const pr=document.querySelector('#ch-promo button'); if(pr) pr.click();",
}
SETUP = {'chess': "document.querySelector('[data-k=side][data-v=w]').click()"}
games = sys.argv[1:] or list(STEP)
secs = 40
bad = 0
with sync_playwright() as p:
    br = launch(p)
    for g in games:
        pg = open_page(br)
        pg.evaluate("window.__anims = {}; document.addEventListener('animationstart', (e) => { window.__anims[e.animationName] = (window.__anims[e.animationName] || 0) + 1; }, true);")
        pg.evaluate(f"openGame('{g}')"); pg.wait_for_timeout(250)
        if g in SETUP: pg.evaluate(SETUP[g])
        if pg.query_selector('#su-go'): pg.click('#su-go')
        t0 = time.time()
        while time.time() - t0 < secs:
            try: pg.evaluate(STEP[g])
            except Exception as e: pg.errs.append('driver: ' + str(e)[:200])
            pg.wait_for_timeout(450)
        pg.screenshot(path=f'test/shots/auto_{g}.png')
        an = pg.evaluate("window.__anims")
        print('OK  ' if not pg.errs else 'FAIL', g, pg.errs[:4], 'css animations started:', an)
        bad += bool(pg.errs); pg.context.close()
print('ALL GOOD' if not bad else f'{bad} PROBLEMS')
