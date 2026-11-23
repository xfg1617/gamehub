"""Bowling online: 2 players take turns throwing (keyboard swing). Both screens show every throw; after
several frames the scorecards are identical. Then one leaves: a computer bowler finishes for them and the
other player wins (2-player game).  Add 'real' for the real service."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
CARD = "document.getElementById('bw-card').innerText.replace(/\\s+/g, ' ')"
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'bowling', 'room', {'seats': 2})
    join(B, code); A.wait_for_timeout(2500); start(A); A.wait_for_timeout(3000)   # bigger rooms (up to 4 lanes) start when the host presses Start
    check(A.query_selector('#bw-cv') and B.query_selector('#bw-cv'), 'the lane opened on both screens')
    throws = 0; t0 = time.time()
    while throws < 8 and time.time() - t0 < 150:
        for pg in (A, B):
            msg = pg.evaluate("document.getElementById('bw-msg').textContent")
            if 'Grab the ball' in msg:
                pg.keyboard.down(' '); pg.wait_for_timeout(700); pg.keyboard.up(' '); throws += 1; pg.wait_for_timeout(500); break
        else: A.wait_for_timeout(500)
    A.wait_for_timeout(4500)
    ca, cb = A.evaluate(CARD), B.evaluate(CARD)
    print('   A card:', ca[:160]); print('   B card:', cb[:160])
    check(throws >= 6 and ca == cb, f'{throws} throws; scorecards identical')
    B.click('#bw-quit'); B.wait_for_timeout(300); B.click('#cf-yes')
    r = modal_text(A, 60000); print('   A sees:', r[:120])
    check('You win' in r and 'left the game' in r, 'B left: A wins')
    done(A, B)
