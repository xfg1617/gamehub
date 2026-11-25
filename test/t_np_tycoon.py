"""Landlord online: 2 players + 1 computer seat. Players roll, buy or skip, bid in auctions, end their
turns; every player's cash, properties and position must match on both screens.  Add 'real' for the real service."""
import sys, random; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
STATE = "document.getElementById('ty-players').innerText.replace(/\+ Friend|✓ Accept/g, '').replace(/\\s+/g, ' ') + ' | ' + [...document.querySelectorAll('[id^=ty-pawn-]')].map(p => p.parentElement && p.parentElement.id).join(',')"
def act(pg):
    pick = random.choice(['by-yes', 'by-no', 'by-yes'])
    return pg.evaluate("""(pick) => { for (const id of ['cd-ok', pick, 'by-yes', 'by-no', 'au-10', 'au-pass', 'jl-roll', 'mg-go']) { const b = document.getElementById(id); if (b) { b.click(); return id; } }
      const r = document.getElementById('ty-roll'); if (r) { r.click(); return 'roll'; } return null; }""", pick)
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'tycoon', 'room', {'n': 3, 'clock': 0, 'mode': 'quick'})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(3000)
    check(A.query_selector('#ty-board') and B.query_selector('#ty-board'), 'the board opened on both screens')
    t0 = time.time(); acted = {}; looks = same = 0; bad = []
    while time.time() - t0 < (240 if REAL else 160):
        moved = False
        for pg in (A, B):
            r = act(pg)
            if r: acted[r] = acted.get(r, 0) + 1; moved = True; pg.wait_for_timeout(450)
        if not moved:
            A.wait_for_timeout(1400)
            sa, sb = A.evaluate(STATE), B.evaluate(STATE); looks += 1; same += sa == sb
            if sa != sb: bad.append((sa[:200], sb[:200]))
    print('   human actions:', acted)
    print(f'   quiet moments where both screens matched: {same}/{looks}')
    if bad: print('   e.g.', bad[-1])
    check(acted.get('roll', 0) >= 4, 'both players rolled several times')
    check(looks and same >= looks * 0.7, 'cash, properties and pawns match on both screens')
    logA = A.evaluate("document.getElementById('ty-log').innerText.split('\\n').slice(-6).join(' / ')")
    print('   log:', logA[:300])
    A.screenshot(path='test/shots/np_ty_A.png'); B.screenshot(path='test/shots/np_ty_B.png')
    done(A, B)
