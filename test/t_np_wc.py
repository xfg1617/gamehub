"""Word Connect online race: 2 players get the same letters, find words (typed on the keyboard), see each
other's score live, and both see the same final ranking when the time runs out (90 s).  Add 'real' for the real service."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
LET = "[...document.querySelectorAll('#wc-wheel [data-i]')].map(e => e.textContent.trim().toLowerCase()).join('')"
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'wordconnect', 'room', {'time': 90, 'len': 6})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    la, lb = A.evaluate(LET), B.evaluate(LET)
    check(la and sorted(la) == sorted(lb), f'same letters on both screens ({la} / {lb})')
    words = A.evaluate(f"GAME_MODS.wordconnect.engine.solve('{la}')")
    for k, (pg, ws) in enumerate(((A, words[:6]), (B, words[6:9]))):
        for w in ws:
            pg.keyboard.type(w); pg.keyboard.press('Enter'); pg.wait_for_timeout(350)
    A.wait_for_timeout(1500)
    ra, rb = A.evaluate("document.getElementById('wc-race').innerText"), B.evaluate("document.getElementById('wc-race').innerText")
    print('   race panel A:', ra.replace('\n', ' | ')); print('   race panel B:', rb.replace('\n', ' | '))
    check(ra == rb and ' 0 words' not in ra, 'live scores show (and match) on both screens')
    ma, mb = modal_text(A, 110000), modal_text(B, 20000)
    print('   A sees:', ma[:120]); print('   B sees:', mb[:120])
    check('You won the race' in ma and 'wins the race' in mb, 'same winner on both screens')
    done(A, B)
