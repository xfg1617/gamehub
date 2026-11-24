"""Island Settlers dice (Nov 2026, Inna: "bigger and more noticeable"): each roll shows two big dice over the island,
the total pops up (7 = THE BANDIT!), and the lands with that number get an amber ring. Desktop + phone screenshots."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
with sync_playwright() as p:
    br = launch(p)
    for w, h, mob, tag in ((1280, 900, False, 'desk'), (390, 844, True, 'phone')):
        pg = open_page(br, w, h, mob)
        pg.evaluate("window.__fast = true; setupSave('isles', { n: 3, vp: 8 }); openGame('isles')"); pg.wait_for_timeout(200); pg.click('#su-go'); pg.wait_for_timeout(300)
        t0 = time.time()
        while time.time() - t0 < 120 and not pg.evaluate("(() => { const r = document.querySelector('#fi-roll'); return r && !r.disabled; })()"):
            pg.evaluate("""(() => { const qa = (s) => [...document.querySelectorAll(s)], pk = (a) => a[Math.floor(Math.random() * a.length)];
              const ev = (el) => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              for (const sel of ['.fi-pickv', '.fi-picke']) { const a = qa(sel); if (a.length) return ev(pk(a)); } })()""")
            pg.wait_for_timeout(60)
        pg.evaluate("window.__fast = false")
        pg.evaluate("document.querySelector('#fi-roll').click()"); pg.wait_for_timeout(1500)
        fx = pg.evaluate("(() => { const b = document.querySelector('.fi-rollfx .fi-die.big'); const s = document.querySelector('.fi-rollsum.on'); return { w: b ? b.getBoundingClientRect().width : 0, sum: s ? s.innerText : '' }; })()")
        pg.query_selector('.fi-sea').scroll_into_view_if_needed(); pg.screenshot(path=f'test/shots/isles_dice_{tag}.png')
        G = pg.evaluate("(() => { const G = GAME_MODS.isles.engine.state(); return { d: G.dice, hot: G.hotN, rings: document.querySelectorAll('#fi-board circle[r=\"22\"]').length, tiles: G.H.filter((h) => h.n === G.dice[0] + G.dice[1]).length }; })()")
        print(f'   {tag}: die width {fx["w"]:.0f}px, total shown {fx["sum"]!r}, dice {G["d"]}, rings {G["rings"]} (lands with that number {G["tiles"]})')
        s = sum(G['d'])
        check(fx['w'] >= 55, f'{tag}: big dice over the island')
        check(fx['sum'].startswith(str(s)), f'{tag}: the total pops up')
        check(s == 7 or G['rings'] == G['tiles'], f'{tag}: lands with the rolled number get a ring')
        pg.wait_for_timeout(1500)
        check(not pg.query_selector('.fi-rollfx'), f'{tag}: the big dice go away after the roll')
        check(not pg.errs, f'{tag}: no page errors {pg.errs[:2]}')
        pg.close()
    br.close()
print('ALL OK' if not fails else f'{len(fails)} FAILED'); sys.exit(1 if fails else 0)
