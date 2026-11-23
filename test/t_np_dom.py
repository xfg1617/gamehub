"""Dominoes online: 3 players + 1 computer seat at one table, a whole round played; the line of tiles
and the scores must be the same on every screen. Then a player leaves and a computer player takes over.
Add 'real' for the real service."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
LINE = "[...document.querySelectorAll('#dm-line .dm-tile')].map(t => t.dataset.fk).join(' ')"
SCORES = "document.getElementById('dm-scores').innerText"
def act(pg):
    for sel in ('#dm-draw', '#dm-pass', '#dm-l'):
        b = pg.query_selector(sel)
        if b and b.is_visible() and b.is_enabled(): b.click(); return True
    t = pg.query_selector('#dm-hand .dm-tile.ok')
    if t and pg.evaluate("document.getElementById('dm-status').textContent") == 'YOUR TURN': t.click(); return True
    return False
with sync_playwright() as p:
    A, B, C = players(p, 3, REAL)
    code = open_table(A, 'dominoes', 'room', {'n': 4, 'to': 0, 'rule': 'draw'})
    join(B, code); join(C, code); A.wait_for_timeout(2500)
    seats = A.evaluate("document.querySelectorAll('.np-seat.on').length")
    check(seats == 3, f'three players sit at the table ({seats})')
    start(A); A.wait_for_timeout(2500)
    check(all(pg.query_selector('#dm-hand') for pg in (A, B, C)), 'the game started on all three screens')
    check('CPU' in A.evaluate("document.getElementById('np-bar').innerText"), 'the empty seat has a computer player')
    t0 = time.time(); acted = 0
    while time.time() - t0 < (240 if REAL else 150):
        if A.evaluate("!!(document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden'))"): break
        moved = False
        for pg in (A, B, C):
            if act(pg): acted += 1; moved = True; pg.wait_for_timeout(500)
        if not moved: A.wait_for_timeout(400)
    A.wait_for_timeout(1500)
    la, lb, lc = A.evaluate(LINE), B.evaluate(LINE), C.evaluate(LINE)
    check(acted > 3 and la == lb == lc and len(la) > 10, f'{acted} human turns; the line is identical on all screens ({len(la.split())} tiles)')
    sa, sb, sc = A.evaluate(SCORES), B.evaluate(SCORES), C.evaluate(SCORES)
    check(sa == sb == sc, 'scores identical on all screens')
    ra = modal_text(A, 20000); print('   A sees:', ra[:140])
    check(bool(ra), 'the round finished and the result shows')
    A.screenshot(path='test/shots/np_dom_A.png'); B.screenshot(path='test/shots/np_dom_B.png')
    # play again with 2 humans, then B leaves: a computer player takes the seat and the game continues
    for pg in (A, B, C): pg.evaluate("document.getElementById('g-modal') && document.getElementById('g-modal').classList.add('hidden')")
    code = open_table(A, 'dominoes', 'room', {'n': 3, 'to': 0})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    B.evaluate("navigateTo('play')"); B.wait_for_timeout(300)
    if B.query_selector('#cf-yes'): B.click('#cf-yes')
    A.wait_for_timeout(2000)
    check('LEFT' in A.evaluate("document.getElementById('np-bar').innerText"), 'B left: the bar shows it')
    t0 = time.time()
    while time.time() - t0 < 120:
        if A.evaluate("!!(document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden'))"): break
        if not act(A): A.wait_for_timeout(400)
        else: A.wait_for_timeout(500)
    check(bool(modal_text(A, 5000)), 'the game went on with a computer player and finished')
    done(A, B, C)
