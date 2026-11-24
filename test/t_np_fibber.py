"""Fibber online: 2 players + 1 computer seat. Both put cards down and sometimes shout FIBBER!; the pile and
everyone's card counts must match on both screens.  Add 'real' for the real service."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
DUP = "(() => { const G = GAME_MODS.fibber.engine.G; if (!G) return ''; const all = [...G.pile, ...G.players.flatMap(q => q.hand)].map(c => c && (c.r + c.s)); const d = all.filter((x, i) => all.indexOf(x) !== i); return all.length !== 52 || d.length ? all.length + ' cards, twice: ' + d.join(',') : ''; })()"
STATE = "(() => { const G = GAME_MODS.fibber.engine.G; return G ? JSON.stringify([G.pile.length, G.players.map(q => q.hand.length), G.need]) : ''; })()"
def act(pg):
    return pg.evaluate("""(() => {
      const d = document.getElementById('fb-doubt'); if (d) { (Math.random() < 0.3 ? d : document.getElementById('fb-ok')).click(); return 1; }
      const go = document.getElementById('fb-go'); if (!go) return 0;
      if (go.disabled) { const c = document.querySelector('#fb-hand .fb-card'); if (c) c.click(); }
      const g2 = document.getElementById('fb-go'); if (g2 && !g2.disabled) { g2.click(); return 2; } return 0; })()""")
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'fibber', 'room', {'n': 3, 'secs': 3})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#fb-hand') and B.query_selector('#fb-hand'), 'the game started on both screens')
    same = looks = plays = 0; t0 = time.time(); dups = {}
    while time.time() - t0 < 240:
        for pg in (A, B):
            if act(pg) == 2: plays += 1
        A.wait_for_timeout(300)
        sa, sb = A.evaluate(STATE), B.evaluate(STATE)
        if sa and sa == sb: same += 1
        looks += 1
        for nm, pg in (('A', A), ('B', B)):
            d = pg.evaluate(DUP)
            if d and nm not in dups: dups[nm] = d; print('   DUPLICATE on', nm, d, pg.evaluate("GAME_MODS.fibber.engine.G.log.slice(-6).join(' | ')"))
        if plays >= 24: break
    print(f'   {plays} plays by people; screens agreed {same}/{looks} times; last {A.evaluate(STATE)} / {B.evaluate(STATE)}')
    check(plays >= 6, 'both players took turns')
    check(not dups, 'every card exists exactly once on both screens (52 cards, no card twice)')
    check(same >= looks * 0.7, 'both screens show the same pile and hands')
    A.screenshot(path='test/shots/np_fibber.png')
    done(A, B)
