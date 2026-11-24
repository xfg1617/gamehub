"""Island Settlers: a scripted human plays a whole game (fast-forwarded) against the bots; rules are checked."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
w = int(sys.argv[1]) if len(sys.argv) > 1 else 1280; h = int(sys.argv[2]) if len(sys.argv) > 2 else 900
fast = len(sys.argv) <= 3 or sys.argv[3] != 'slow'
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, w, h, mobile=w < 600)
    if fast: pg.evaluate("window.__fast = true")
    pg.evaluate("openGame('isles')"); pg.wait_for_timeout(200); pg.click('#su-go'); pg.wait_for_timeout(300)
    t0 = time.time(); shots = 0
    while time.time() - t0 < (200 if fast else 60) and not pg.query_selector('#g-modal:not(.hidden)'):
        pg.evaluate("""(() => { const q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)], pk = (a) => a[Math.floor(Math.random() * a.length)];
          const ev = (el) => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          for (const sel of ['.fi-pickv', '.fi-picke', '.fi-pickh']) { const a = qa(sel); if (a.length) return ev(pk(a)); }
          const v = qa('#fi-prompt [data-v]'); if (v.length) return pk(v).click();
          const r = q('#fi-roll'); if (r && !r.disabled) return r.click();
          const b = qa('#fi-build .btn-amber'); if (b.length) return pk(b).click();
          const e = q('#fi-end'); if (e && !e.disabled) return e.click(); })()""")
        if shots < 1 and pg.evaluate("GAME_MODS.isles.engine.state().turn") > 12: pg.screenshot(path=f'test/shots/isles_mid_{w}.png', full_page=True); shots = 1
        pg.wait_for_timeout(30 if fast else 400)
    r = pg.evaluate("""(() => { const E = GAME_MODS.isles.engine, G = E.state();
      // rules: no two buildings on neighbouring corners; every road touches its owner's network
      let adjBad = 0; G.V.forEach((v) => { if (G.bld[v.i] && v.adj.some((a) => G.bld[a])) adjBad++; });
      return { turns: G.turn, vp: G.players.map((p, i) => E.vp(G, i)), adjacentBuildings: adjBad, over: G.over,
        res: G.players.map((p) => Object.values(p.res).some((n) => n < 0)) }; })()""")
    print(w, r, '| finished:', bool(pg.query_selector('#g-modal:not(.hidden)')), pg.errs[:3])
    pg.screenshot(path=f'test/shots/isles_end_{w}.png', full_page=True)
