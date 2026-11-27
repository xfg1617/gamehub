"""Caro online: a private room, a friend joins with the code, a whole game is played move by move on both screens."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
B_ = "GAME_MODS.caro.engine.state() ? GAME_MODS.caro.engine.state().b.map(v => v || '.').join('') : ''"
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'caro', 'room', {'len': 1})
    join(B, code); A.wait_for_timeout(2500)
    check(A.query_selector('#cr-board') and B.query_selector('#cr-board'), 'friend joined: both see the board')
    moves = 0
    for k in range(200):
        if modal_text(A, 1) and modal_text(B, 1): break
        for pg in (A, B):
            if pg.evaluate("document.getElementById('cr-status') && document.getElementById('cr-status').textContent") == 'YOUR MOVE':
                i = pg.evaluate("(() => { const G = GAME_MODS.caro.engine.state(); return G && !G.done ? GAME_MODS.caro.engine.aiMove(G.b.slice(), G.N, G.turn, 2) : -1; })()")
                if i >= 0: pg.click(f'.cr-c[data-i="{i}"]'); moves += 1; pg.wait_for_timeout(500); break
        else: A.wait_for_timeout(300)
        if moves == 8: check(A.evaluate(B_) == B.evaluate(B_), 'same board on both screens after 8 moves')
    ra, rb = modal_text(A), modal_text(B)
    print('   A sees:', ra[:90].replace('\n', ' ')); print('   B sees:', rb[:90].replace('\n', ' '))
    check(ra and rb and (('You win' in ra) != ('You win' in rb)), f'game over on both screens after {moves} moves, one winner')
    check(not A.errs and not B.errs, 'no page errors')
    done(A, B)
