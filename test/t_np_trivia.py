"""Trivia Rush online: a private room, a friend joins, both get the same questions and answers in the same order,
answer at the same time, and both screens agree on the scores."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
Q = "(() => { const G = GAME_MODS.trivia.engine.G; return G && G.qs[G.qi] ? G.qi + '|' + G.qs[G.qi].text + '|' + G.qs[G.qi].answers.join(',') : ''; })()"
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'trivia', 'room', {'qn': '10', 'lang': 'en', 'n': 2})
    join(B, code); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#tv-q') and B.query_selector('#tv-q'), 'both screens show the question')
    import time; t0 = time.time(); same = 0; asked = set()
    while time.time() - t0 < 160:
        if modal_text(A, 1) and modal_text(B, 1): break
        a, b = A.evaluate(Q), B.evaluate(Q)
        if a and a == b: same += 1; asked.add(a.split('|')[0])
        for pg, k in ((A, 0), (B, 1)):
            r = pg.evaluate("(() => { const G = GAME_MODS.trivia.engine.G; if (!G || G.mine !== null || G.reveal || !G.qs[G.qi]) return null; return G.qs[G.qi].right; })()")
            if r is not None and pg.query_selector('.tv-a:not([disabled])'): pg.click(f'.tv-a[data-i="{r if k == 0 else (r + 1) % 4}"]')
        A.wait_for_timeout(300)
    ra, rb = modal_text(A), modal_text(B)
    print('   A:', ra[:90].replace('\n', ' ')); print('   B:', rb[:90].replace('\n', ' '))
    check(len(asked) >= 9 and same > 10, f'same question and answer order on both screens ({len(asked)} questions)')
    check('You win' in ra and 'You win' not in rb, 'A answered right every time and won on both screens')
    sa = A.evaluate("GAME_MODS.trivia.engine.G.players.map(p => p.pts).join(',')"); sb = B.evaluate("GAME_MODS.trivia.engine.G.players.map(p => p.pts).join(',')")
    check(sa == sb, f'same scores on both screens {sa} / {sb}')
    check(not A.errs and not B.errs, 'no page errors ' + str((A.errs + B.errs)[:2]))
    done(A, B)
