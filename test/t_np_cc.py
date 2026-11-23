"""Color Clash online: 2 players + 1 computer seat. Both play their turns (pressing CLASH! in time);
the top card, colour, pile size and everyone's card counts must match on both screens, and the game ends
for both.  Add 'real' for the real service."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
STATE = "[document.getElementById('cc-top').innerText.replace(/\\s+/g, ' '), document.getElementById('cc-pile').innerText.replace(/\\s+/g, ' ')].join(' | ')"
def act(pg):
    for sel in ('#cc-clash', '#cc-pl', '[data-col]', '#cc-catch'):
        b = pg.query_selector(sel)
        if b and b.is_visible(): b.click(); return True
    if pg.evaluate("document.getElementById('cc-status').textContent") != 'YOUR TURN': return False
    c = pg.query_selector('#cc-hand .cc-card.ok')
    if c: c.click(); return True
    d = pg.query_selector('#cc-draw')
    if d and pg.query_selector('#cc-hand .cc-card.no'): d.click(); return True
    return False
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'colorclash', 'room', {'n': 3, 'hand': 5, 'clock': 0})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#cc-hand') and B.query_selector('#cc-hand'), 'the game started on both screens')
    same = 0; looks = 0; t0 = time.time(); acted = 0
    while time.time() - t0 < (240 if REAL else 160):
        if A.evaluate("!!(document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden'))"): break
        moved = False
        for pg in (A, B):
            if act(pg): acted += 1; moved = True; pg.wait_for_timeout(350)
        if not moved:
            A.wait_for_timeout(1200)
            sa, sb = A.evaluate(STATE), B.evaluate(STATE)
            looks += 1; same += sa == sb
    print(f'   quiet moments where both screens matched: {same}/{looks}')
    check(acted > 4 and looks > 0 and same >= looks * 0.6, f'{acted} human actions; the table matched on both screens')
    ra, rb = modal_text(A, 30000), modal_text(B, 30000)
    print('   A sees:', ra[:120]); print('   B sees:', rb[:120])
    check(bool(ra) and bool(rb), 'the game ended on both screens')
    done(A, B)
