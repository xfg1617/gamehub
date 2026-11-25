"""Tic-Tac-Toe online: a private room, the friend joins with the code, a full best-of-3 is played
move by move on both screens, then a ranked quick match where one player leaves (the other wins).
   python3 test/t_np_ttt.py          (stand-in service)
   python3 test/t_np_ttt.py real     (the real service)"""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
def board(pg): return pg.evaluate("[...document.querySelectorAll('.ttt-cell')].map(c => c.classList.contains('filled') ? (c.innerHTML.includes('circle') ? 'O' : 'X') : '.').join('')")
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'tictactoe', 'room', {'len': 3})
    check(code and code in A.evaluate('document.body.innerText'), f'host is waiting in room {code}')
    join(B, code); A.wait_for_timeout(2500)
    ok = A.query_selector('#ttt-board') and B.query_selector('#ttt-board')
    if not ok: print('   A:', A.evaluate('document.getElementById("game-root").innerText')[:200].replace('\n',' '), '| B:', B.evaluate('document.getElementById("game-root").innerText')[:200].replace('\n',' '), A.errs, B.errs)
    check(ok, 'friend joined: both see the board')
    check(A.query_selector('#np-bar') is not None, 'online bar shows the table')
    # play until the match is over: whoever's turn it is clicks the first free square
    for k in range(40):
        if A.evaluate("!document.getElementById('g-modal') || document.getElementById('g-modal').classList.contains('hidden')") is False: break
        for pg in (A, B):
            if pg.evaluate("document.getElementById('ttt-status') && document.getElementById('ttt-status').textContent") == 'YOUR MOVE':
                free = pg.evaluate("[...document.querySelectorAll('.ttt-cell')].findIndex(c => !c.classList.contains('filled') && !c.disabled && !document.querySelector('.ttt-cell.win'))")
                if free >= 0: pg.click(f'.ttt-cell[data-i="{free}"]'); pg.wait_for_timeout(700 if not REAL else 1200); break
        else: A.wait_for_timeout(500)
        if k == 3: check(board(A) == board(B) and board(A).count('.') < 9, f'boards match on both screens ({board(A)} / {board(B)})')
    ra, rb = modal_text(A), modal_text(B)
    print('   A sees:', ra[:110]); print('   B sees:', rb[:110])
    check(ra and rb and ('wins the match' in ra + rb or 'tie' in ra + rb), 'match finished on both screens')
    sa = A.evaluate("[document.getElementById('ttt-w0').textContent, document.getElementById('ttt-w1').textContent]"); sb = B.evaluate("[document.getElementById('ttt-w0').textContent, document.getElementById('ttt-w1').textContent]")
    check(sa == sb, f'same score on both screens {sa} {sb}')
    A.screenshot(path='test/shots/np_ttt.png')
    # ranked quick match, then B leaves mid-game
    for pg in (A, B): pg.evaluate("document.getElementById('g-modal').classList.add('hidden')"); open_table(pg, 'tictactoe', 'quick'); pg.wait_for_timeout(500)
    A.wait_for_timeout(3000)
    check(A.query_selector('#ttt-board') and B.query_selector('#ttt-board'), 'quick match paired the two players')
    check(A.evaluate("!!(NP.S && NP.S.online)") and 'RANKED' not in A.evaluate("(document.getElementById('np-bar') || {}).innerText || ''"), 'quick match finds a table (no ranked label any more)')
    B.click('#ttt-new'); B.wait_for_timeout(300); B.click('#cf-yes')
    r = modal_text(A, 40000); print('   stayer sees:', r[:140])
    if 'You win' not in r: print('   A root:', A.evaluate('document.getElementById("game-root").innerText')[:300].replace('\n',' '), A.errs, B.errs)
    check('You win' in r and 'left the game' in r, 'other player left: you win')
    if REAL: check('POINTS' in r.upper(), 'points shown')
    done(A, B)
