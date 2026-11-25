"""Landlord (Nov 2026, Inna): YOUR PROPERTIES opens as a pop-up in the middle of the screen (not a strip under CHAT),
shows the building rule, and pressing +house where you can't build says exactly why (missing colour set, not standing
on that plot, uneven building, mortgaged, not enough cash)."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1690, 903)
    # the reasons, on a hand-made board (whole colour set rule)
    out = pg.evaluate("""(() => { const m = GAME_MODS.tycoon.engine, B = m.BOARD, G = m.GROUPS;
      const g = Object.keys(G).find((k) => k !== 'rail' && k !== 'ut' && G[k].length === 3), [a, b, c] = G[g];
      const S = { cash: [5000, 5000], own: { [a]: 0, [b]: 0 }, houses: {}, mort: {} }; B.forEach((t, i) => { if (t.k === 'prop') S.houses[i] = 0; });
      const r = {}; r.missing = m.buildWhy(S, 0, a); S.own[c] = 0;
      r.ok = m.buildWhy(S, 0, a); S.houses[a] = 1; r.uneven = m.buildWhy(S, 0, a); S.houses[a] = 0;
      S.mort[b] = true; r.mort = m.buildWhy(S, 0, a); S.mort[b] = false;
      S.cash[0] = 1; r.cash = m.buildWhy(S, 0, a); r.names = [B[c].n];
      r.rail = m.buildWhy(S, 0, G.rail[0]); return r; })()""")
    for k, v in out.items(): print('   ', k, ':', v)
    check('whole' in out['missing'] and 'missing' in out['missing'].lower(), 'no full colour set: says which plots are missing')
    check(out['ok'] == '', 'with the full set and cash: no complaint')
    check('evenly' in out['uneven'], 'uneven building is explained')
    check('Unmortgage' in out['mort'], 'a mortgaged plot in the set is explained')
    check('costs' in out['cash'], 'not enough cash is explained')
    # stand-on-your-plot rule in a real game: own a plot you are not standing on, open the panel, press +house
    pg.evaluate("window.__fast = true; openGame('tycoon')"); pg.wait_for_timeout(400)
    for k, v in {'n': 2, 'build': 'land', 'clock': 0, 'auction': 0}.items(): pg.click(f'[data-k="{k}"][data-v="{v}"]')
    pg.click('#su-go'); pg.wait_for_timeout(800)
    plot = pg.evaluate("""(() => { const m = GAME_MODS.tycoon.engine, G = m.G; const t = m.BOARD.find((t) => t.k === 'prop' && G.S.own[t.i] === undefined && t.i !== G.players[0].pos);
      G.S.own[t.i] = 0; return t.i; })()""")
    t0 = time.time()
    while time.time() - t0 < 60 and not pg.query_selector('#mg-open'):
        for sel in ['#ty-roll', '#by-no', '#cd-ok', '#bo-no']:
            b = pg.query_selector(sel)
            if b and b.is_visible():
                try: b.click(timeout=500)
                except Exception: pass
        pg.wait_for_timeout(300)
    check(pg.query_selector('#mg-open') is not None, 'the Build / Mortgage button shows up on your turn')
    pg.click('#mg-open'); pg.wait_for_timeout(500)
    box = pg.evaluate("(() => { const w = document.querySelector('.ty-mine-win'); if (!w) return null; const r = w.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height), getComputedStyle(w).position, document.querySelector('.ty-mine-rule').innerText]; })()")
    print('   panel:', box)
    check(box and box[4] == 'fixed' and abs(box[0] + box[2] / 2 - 845) < 10 and box[1] > 50, 'the panel is a pop-up in the middle of the screen')
    check(box and 'land on your own plot' in box[5], 'the panel says the building rule')
    pg.click(f'[data-pa="build"][data-i="{plot}"]'); pg.wait_for_timeout(300)
    toast = pg.evaluate("[...document.querySelectorAll('.toast, #toast, [class*=toast]')].map(e => e.innerText).join(' | ')")
    print('   toast:', toast)
    check('Land on' in toast or 'standing on' in toast, 'pressing +house on a plot you are not on says why')
    pg.screenshot(path='test/shots/ty_props_popup.png')
    pg.click('#pn-close'); pg.wait_for_timeout(300)
    check(not pg.query_selector('.ty-mine-win'), 'Done closes the pop-up')
    check(not pg.errs, f'no page errors {pg.errs[:2]}')
    br.close()
print('ALL GOOD' if not fails else f'{len(fails)} FAILED')
