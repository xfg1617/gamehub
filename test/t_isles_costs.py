"""Island Settlers build buttons (Nov 2026, player feedback): each button spells out its cost with a check for what you
have and red for what's missing, and a grey button says why: "Need 1 Stone", or "No free spot: build a road first"
(the player's case: enough cards for a village but no open corner)."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1280, 900)
    pg.evaluate("window.__fast = true; setupSave('isles', { n: 3, vp: 8 }); openGame('isles')"); pg.wait_for_timeout(200); pg.click('#su-go'); pg.wait_for_timeout(300)
    t0 = time.time()
    # play the opening (place villages + roads), then roll once to reach the build step of a normal turn
    while time.time() - t0 < 180:
        st = pg.evaluate("(() => { const G = GAME_MODS.isles.engine.state(); return G && G.building; })()")
        if st: break
        pg.evaluate("""(() => { const qa = (s) => [...document.querySelectorAll(s)], pk = (a) => a[Math.floor(Math.random() * a.length)];
          const ev = (el) => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          for (const sel of ['.fi-pickv', '.fi-picke']) { const a = qa(sel); if (a.length) return ev(pk(a)); }
          const v = qa('#fi-prompt [data-v]'); if (v.length) return pk(v).click();
          const no = qa('#fi-prompt button').find((b) => /no thanks|decline|ok|skip/i.test(b.textContent)); if (no) return no.click();
          const r = document.querySelector('#fi-roll'); if (r && !r.disabled) return r.click(); })()""")
        pg.wait_for_timeout(60)
    print('   prompt:', pg.evaluate("(document.getElementById('fi-prompt') || {}).innerText || ''")[:160])
    check(pg.evaluate("GAME_MODS.isles.engine.state().building"), 'reached my build step')
    def btn(k): return pg.evaluate(f"(document.querySelector('#fi-build [data-b={k}]') || {{}}).innerText || ''").replace('\n', ' | ')
    # the player's situation: 2 timber, 1 clay, 1 wool, 2 grain, 1 stone
    pg.evaluate("(() => { const G = GAME_MODS.isles.engine.state(), me = G.players[G.me]; Object.assign(me.res, { T: 2, C: 1, W: 1, G: 2, S: 1 }); GAME_MODS.isles.engine.render && GAME_MODS.isles.engine.render(); })()")
    if not pg.evaluate("!!GAME_MODS.isles.engine.render"): pg.evaluate("document.querySelector('#fi-res') && window.dispatchEvent(new Event('resize'))")
    pg.wait_for_timeout(300)
    v, t, r = btn('village'), btn('town'), btn('road')
    print('   road   :', r); print('   village:', v); print('   town   :', t)
    check('1 Timber' in v and '1 Wool' in v and '1 Grain' in v and '1 Clay' in v, 'the village button lists its cost in words')
    check('Need 1 Grain' not in t and ('Need 2 Stone' in t or 'Build a village first' in t), 'town says what is missing (2 more Stone)')
    pg.screenshot(path='test/shots/isles_costs.png', clip={'x': 900, 'y': 0, 'width': 380, 'height': 900})
    check(not pg.errs, f'no page errors {pg.errs[:2]}')
    print('ALL GOOD' if not fails else f'{len(fails)} PROBLEMS')
