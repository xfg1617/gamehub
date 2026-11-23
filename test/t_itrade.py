"""Frontier Isles trading: you offer a deal through the panel, bots answer, cards change hands correctly;
bots offer you deals too. Also a fast full game with random trading, checking no one ever goes below zero."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    pg.evaluate("window.__fast = true")
    pg.evaluate("openGame('isles')"); pg.wait_for_timeout(200); pg.click('#su-go')
    drive = """(() => { const q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)], pk = (a) => a[Math.floor(Math.random() * a.length)];
      const ev = (el) => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      for (const sel of ['.fi-pickv', '.fi-picke', '.fi-pickh']) { const a = qa(sel); if (a.length) return ev(pk(a)); }
      const v = qa('#fi-prompt [data-v]'); if (v.length) return pk(v).click();
      if (q('#fi-acc')) return (Math.random() < 0.5 ? q('#fi-acc') : q('#fi-dec')).click();
      const r = q('#fi-roll'); if (r && !r.disabled) return r.click(); return 'idle'; })()"""
    # get to your first building phase
    for _ in range(400):
        pg.evaluate(drive); pg.wait_for_timeout(25)
        if pg.evaluate("(() => { const G = GAME_MODS.isles.engine.state(); return !!(G.building && G.offer); })()"): break
    # give yourself spare wool, and make a bot short of wool so it should want it
    before = pg.evaluate("""(() => { const G = GAME_MODS.isles.engine.state(); const me = G.players[0], b = G.players[1];
      me.res = { T: 0, C: 0, W: 3, G: 0, S: 0 }; b.res = { T: 1, C: 1, W: 0, G: 1, S: 1 };
      return [me.res, b.res, G.players.map((p) => Object.values(p.res).reduce((a, c) => a + c, 0)).reduce((a, c) => a + c, 0)]; })()""")
    pg.evaluate("GAME_MODS.isles.engine.state().offer()"); pg.wait_for_timeout(100)
    pg.click('[data-s="give"][data-r="W"][data-d="1"]'); pg.click('[data-s="get"][data-r="S"][data-d="1"]')
    pg.screenshot(path='test/shots/isles_offer.png')
    pg.click('#fi-send'); pg.wait_for_timeout(1500)
    btn = pg.query_selector('#fi-prompt [data-w]')
    answered = pg.evaluate("document.getElementById('fi-prompt').innerText")
    if btn: btn.click(); pg.wait_for_timeout(200)
    after = pg.evaluate("""(() => { const G = GAME_MODS.isles.engine.state(); return [G.players[0].res, G.players.map((p) => Object.values(p.res).reduce((a, c) => a + c, 0)).reduce((a, c) => a + c, 0)]; })()""")
    print('table answered:', answered.replace('\n', ' ')[:120])
    print('you before', before[0], '-> after', after[0], '| cards in play before/after:', before[2], after[1])
    # keep playing fast, with random trading, to the end
    t0 = time.time(); offers = 0
    while time.time() - t0 < 150 and not pg.query_selector('#g-modal:not(.hidden)'):
        st = pg.evaluate(drive)
        if st == 'idle':
            if pg.evaluate("(() => { const G = GAME_MODS.isles.engine.state(); return !!(G.building && G.offer); })()") and offers < 15 and pg.evaluate("Math.random()") < 0.3:
                offers += 1; pg.evaluate("GAME_MODS.isles.engine.state().offer()")
                pg.evaluate("""(() => { const me = GAME_MODS.isles.engine.state().players[0]; const R = ['T','C','W','G','S']; const g = R.find((r) => me.res[r] > 0); if (!g) { document.getElementById('fi-cx').click(); return; }
                  document.querySelector(`[data-s="give"][data-r="${g}"][data-d="1"]`).click(); const w = R.find((r) => r !== g); document.querySelector(`[data-s="get"][data-r="${w}"][data-d="1"]`).click(); document.getElementById('fi-send').click(); })()""")
                pg.wait_for_timeout(300)
                b = pg.query_selector('#fi-prompt [data-w]') or pg.query_selector('#fi-cx2')
                if b: b.click()
            else:
                b = pg.query_selector('#fi-build .btn-amber')
                if b: b.click()
                else:
                    e = pg.query_selector('#fi-end')
                    if e and not e.is_disabled(): e.click()
        neg = pg.evaluate("GAME_MODS.isles.engine.state().players.some((p) => Object.values(p.res).some((n) => n < 0))")
        if neg: print('NEGATIVE CARDS!'); break
        pg.wait_for_timeout(30)
    log = pg.evaluate("document.getElementById('fi-log').innerText")
    print('trades in log:', log.count('🤝'), '| bot offers:', sum(1 for l in log.split('\n') if ' offers ' in l and not l.startswith(pg.evaluate('profile.username'))), '| finished:', bool(pg.query_selector('#g-modal:not(.hidden)')), '| errors:', pg.errs[:3])
