"""Whodunit: fast-forwarded games. Sharp detectives must never accuse wrongly; games must finish."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
games = int(sys.argv[1]) if len(sys.argv) > 1 else 3
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    pg.evaluate("window.__fast = true")
    for g in range(games):
        pg.evaluate("navigateTo('play', true); openGame('manor')"); pg.wait_for_timeout(150)
        pg.click('[data-k="lvl"][data-v="2"]'); pg.click('#su-go'); pg.wait_for_timeout(200)
        t0 = time.time()
        while time.time() - t0 < 120 and not pg.query_selector('#g-modal:not(.hidden)'):
            pg.evaluate("""(() => { const q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)];
              const r = qa('.mm-room.go'); if (r.length) return r[Math.floor(Math.random() * r.length)].click();
              const sh = qa('[data-show]'); if (sh.length) return sh[0].click();
              if (q('#mm-go')) { q('#mm-s').selectedIndex = Math.floor(Math.random() * 6); q('#mm-t').selectedIndex = Math.floor(Math.random() * 6); return q('#mm-go').click(); }
              if (q('#mm-end')) return q('#mm-end').click(); })()""")
            pg.wait_for_timeout(40)
        log = pg.evaluate("document.getElementById('mm-log').innerText")
        wrong = log.count('is wrong'); right = log.count('is right')
        # every auto-filled tick in your notebook must be true
        bad = pg.evaluate("(() => { const G = GAME_MODS.manor.engine.state(); let bad = 0; G.note.forEach((row, pi) => row.forEach((v, c) => { const has = G.players[pi].hand.includes(c); if ((v === 1 && !has) || (v === -1 && has)) bad++; })); return bad; })()")
        print(f'game {g + 1}: turns', pg.evaluate("GAME_MODS.manor.engine.state().turn"), '| right accusations', right, '| wrong', wrong, '| wrong notebook marks', bad, '| finished', bool(pg.query_selector('#g-modal:not(.hidden)')), pg.errs[:2])
        if g == 0: pg.screenshot(path='test/shots/manor_end.png')
