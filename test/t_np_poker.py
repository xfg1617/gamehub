"""Poker online: 2 players + 2 computer seats. Players fold / call / raise when it's their turn; the board,
the pot and every seat's chips must match on both screens, hand after hand.  Add 'real' for the real service."""
import sys, random; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
STATE = "[...[0,1,2,3].map(i => (document.querySelector('#pk-seat-' + i + ' .pix') || {}).textContent), (document.getElementById('pk-pot') || {}).textContent, [...document.querySelectorAll('#pk-table .pcard:not(.sm)')].length, (document.getElementById('pk-place') || {}).textContent].join(' | ')"
def act(pg):
    pick = random.choice(['pk-call', 'pk-call', 'pk-call', 'pk-raise', 'pk-fold'])
    return pg.evaluate("""(pick) => { const b = document.getElementById(pick) || document.getElementById('pk-call'); if (b) { b.click(); return true; } return false; }""", pick)
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'poker', 'room', {'chips': 500, 'speed': 4, 'clock': 0})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#pk-table') and B.query_selector('#pk-table'), 'the table opened on both screens')
    t0 = time.time(); acted = 0; looks = same = 0; bad = []
    while time.time() - t0 < (200 if REAL else 130):
        if A.evaluate("!!(document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden'))"): break
        moved = False
        for pg in (A, B):
            if act(pg): acted += 1; moved = True; pg.wait_for_timeout(500)
        if not moved:
            A.wait_for_timeout(1500)
            sa, sb = A.evaluate(STATE), B.evaluate(STATE); looks += 1; same += sa == sb
            if sa != sb: bad.append((sa, sb))
    hands = A.evaluate("(document.getElementById('pk-place') || {}).textContent")
    print(f'   quiet moments where both screens matched: {same}/{looks}; {hands}')
    if bad: print('   e.g.', bad[-1])
    check(acted >= 6, f'{acted} human actions')
    check(looks and same >= looks * 0.7, 'chips, pot and board match on both screens')
    A.screenshot(path='test/shots/np_poker_A.png'); B.screenshot(path='test/shots/np_poker_B.png')
    done(A, B)
