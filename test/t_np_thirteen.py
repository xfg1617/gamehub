"""Thirteen online: a private room with 2 people + 1 computer, a whole hand is played and both screens agree."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
ST = "(() => { const G = GAME_MODS.thirteen.engine.G; return G ? JSON.stringify([G.hand, G.players.map(q => q.hand.length), G.table && G.table.top, G.places.map(q => q.seat)]) : ''; })()"
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    for pg in (A, B): pg.evaluate('window.__fast = true')
    code = open_table(A, 'thirteen', 'room', {'hands': 1, 'turn': 0, 'n': 3})
    join(B, code); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#th-hand') and B.query_selector('#th-hand'), 'both screens show the table')
    check(A.evaluate("document.querySelectorAll('#th-opp .tg-seat').length") == 2, 'three players: you see two others')
    import time; t0 = time.time(); turns = 0; same = 0
    while time.time() - t0 < 150:
        if modal_text(A, 1) and modal_text(B, 1): break
        for pg in (A, B):
            mv = pg.evaluate("""(() => { const G = GAME_MODS.thirteen.engine.G; if (!G || !G.choose) return null; const me = G.players[G.me];
              const c = GAME_MODS.thirteen.engine.botMove(me.hand, G.table, G.must, 2, 13); return c ? c.map(x => me.hand.findIndex(h => h.r === x.r && h.s === x.s)) : 'pass'; })()""")
            if mv == 'pass': pg.click('#th-pass'); turns += 1
            elif mv:
                for i in mv: pg.click(f'.th-card[data-i="{i}"]')
                pg.click('#th-go'); turns += 1
        A.wait_for_timeout(250)
        a, b = A.evaluate(ST), B.evaluate(ST)
        if a and a == b: same += 1
    ra, rb = modal_text(A), modal_text(B)
    print('   A:', ra[:100].replace('\n', ' ')); print('   B:', rb[:100].replace('\n', ' '))
    check(ra and rb, f'the hand finished on both screens ({turns} turns by people)')
    check(same > 10, f'both screens showed the same table {same} times')
    check(not A.errs and not B.errs, 'no page errors ' + str((A.errs + B.errs)[:2]))
    done(A, B)
