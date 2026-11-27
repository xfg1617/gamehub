"""After an online game the group stays together: the next-game choice shows at once (no false "players have left"
message), "Tic-Tac-Toe again" starts a new table for both. (Rankings are gone since Nov 2026; see t_np_next.py too.)"""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
with sync_playwright() as p:
    A, B, C = players(p, 3, REAL)
    for pg in (A, B): open_table(pg, 'tictactoe', 'quick', {'len': 1}); pg.wait_for_timeout(500)
    A.wait_for_timeout(3000)
    B.click('#ttt-quit'); B.click('#ttt-quit', force=True)   # force: the second press must land inside the 3 s "Really resign?" window
    modal_text(A); modal_text(B)
    # after the game the same group stays together: whoever is choosing presses "Tic-Tac-Toe again" (the box shows at once,
    # with no false "players have left" message), and both land at the new table
    import time as _t; t0 = _t.time()
    L = None
    while _t.time() - t0 < 8 and not L:
        for pg in (A, B):
            if pg.query_selector('#np-rm'): L = pg
        A.wait_for_timeout(200)
    other = B if L is A else A
    check(L is not None, f'the next-game choice shows within {(_t.time() - t0):.1f} s of the result')
    txt = other.evaluate("document.getElementById('g-modal').innerText")
    check('left the table' not in txt and 'choosing the next game' in txt, 'the other player sees who is choosing (no "left" message)')
    L.click('#np-rm'); A.wait_for_timeout(6000)
    ok = A.query_selector('#ttt-board') and B.query_selector('#ttt-board') and A.evaluate("!!NP.S && NP.S.online && !NP.S.over")
    check(ok, 'a new Tic-Tac-Toe table started for both')
    done(A, B, C)
