"""Dominoes: a full game with a scripted human, desktop + phone; screenshots of the table."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
w = int(sys.argv[1]) if len(sys.argv) > 1 else 1280; h = int(sys.argv[2]) if len(sys.argv) > 2 else 900
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, w, h, mobile=w < 600)
    pg.evaluate("openGame('dominoes')"); pg.wait_for_timeout(200)
    pg.click('[data-k="n"][data-v="3"]'); pg.click('[data-k="to"][data-v="0"]'); pg.click('#su-go')
    t0 = time.time(); shot = 0
    while time.time() - t0 < 120 and not pg.query_selector('#g-modal:not(.hidden)'):
        pg.evaluate("""(() => { const q = (s) => document.querySelector(s);
          for (const id of ['dm-draw', 'dm-pass', 'dm-l']) if (q('#' + id)) return q('#' + id).click();
          const t = q('#dm-hand .dm-tile.ok'); if (t) t.click(); })()""")
        n = pg.evaluate("GAME_MODS.dominoes.engine.state().line.length")
        if n >= 6 and shot == 0: pg.screenshot(path=f'test/shots/dom_{w}.png'); shot = 1
        if n >= 12 and shot == 1: pg.screenshot(path=f'test/shots/dom2_{w}.png', full_page=True); shot = 2
        pg.wait_for_timeout(400)
    st = pg.evaluate("(() => { const G = GAME_MODS.dominoes.engine.state(); return { line: G.line.length, hands: G.players.map(p => p.hand.length), scores: G.players.map(p => p.score), over: G.over }; })()")
    # check the line is a valid chain: each tile's right end matches the next tile's left end
    ok = pg.evaluate("(() => { const L = GAME_MODS.dominoes.engine.state().line; for (let i = 1; i < L.length; i++) if (L[i - 1].r !== L[i].l) return false; return true; })()")
    tiles = pg.evaluate("(() => { const G = GAME_MODS.dominoes.engine.state(); const all = [...G.line.map(s => s.t.id), ...G.players.flatMap(p => p.hand.map(t => t.id)), ...G.bone.map(t => t.id)]; return [all.length, new Set(all).size]; })()")
    print(w, st, '| chain matches end to end:', ok, '| tiles accounted (total, unique):', tiles, '| finished:', bool(pg.query_selector('#g-modal:not(.hidden)')), pg.errs)
