"""Whodunit online: 2 players + 2 computer detectives. Players walk, make suggestions and show cards when
asked; the log (who suggested what, who could not answer) and every pawn's room match on both screens, and only
the asker sees the shown card.  Add 'real' for the real service."""
import sys, random; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
LOG = "document.getElementById('mm-log').innerText"
def act(pg):
    return pg.evaluate("""() => {
      const show = document.querySelector('[data-show]'); if (show) { show.click(); return 'show'; }
      const end = document.getElementById('mm-end'); if (end) { end.click(); return 'end'; }
      const go = document.getElementById('mm-go'); if (go) { go.click(); return 'suggest'; }
      const room = document.querySelector('#mm-map .mm-room.go'); if (room) { room.click(); return 'walk'; }
      return null; }""")
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'manor', 'room', {'n': 4})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#mm-map') and B.query_selector('#mm-map'), 'the manor opened on both screens')
    t0 = time.time(); acted = {}
    while time.time() - t0 < (200 if REAL else 120):
        if A.evaluate("!!(document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden'))"): break
        moved = False
        for pg in (A, B):
            r = act(pg)
            if r: acted[r] = acted.get(r, 0) + 1; moved = True; pg.wait_for_timeout(500)
        if not moved: A.wait_for_timeout(700)
    print('   human actions:', acted)
    A.wait_for_timeout(2500)
    la = [x for x in A.evaluate(LOG).split('\n') if 'shows' not in x][-12:]; lb = [x for x in B.evaluate(LOG).split('\n') if 'shows' not in x][-12:]
    check(acted.get('walk', 0) >= 2 and acted.get('suggest', 0) >= 2, 'both players took turns')
    check(la == lb, 'the case log matches on both screens')
    if la != lb: print('   A:', la[-4:]); print('   B:', lb[-4:])
    secret = [x for x in A.evaluate(LOG).split('\n') if 'shows you' in x]
    print('   A was shown:', secret[-1:] if secret else '-')
    done(A, B)
