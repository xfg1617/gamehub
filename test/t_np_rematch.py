"""Rematch: after an online game both players press Rematch and a new table starts by itself with the same two
players (Tic-Tac-Toe ranked quick match -> ranked rematch; Dominoes 3 players)."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
with sync_playwright() as p:
    A, B, C = players(p, 3, REAL)
    for pg in (A, B): open_table(pg, 'tictactoe', 'quick', {'len': 1}); pg.wait_for_timeout(500)
    A.wait_for_timeout(3000)
    B.click('#ttt-quit'); B.click('#ttt-quit')
    modal_text(A); modal_text(B)
    for pg in (A, B): pg.wait_for_selector('#np-rm', timeout=10000)
    A.click('#np-rm'); B.wait_for_timeout(1200)
    print('   B sees:', B.evaluate("document.getElementById('g-modal-rm').innerText").replace('\n', ' '))
    check('wants a rematch' in B.evaluate("document.getElementById('g-modal-rm').innerText"), 'B sees that A wants a rematch')
    B.click('#np-rm'); A.wait_for_timeout(6000)
    ok = A.query_selector('#ttt-board') and B.query_selector('#ttt-board') and A.evaluate("!!NP.S && NP.S.online && !NP.S.over")
    check(ok, 'a new Tic-Tac-Toe table started for both')
    check('RANKED' in A.evaluate("(document.getElementById('np-bar')||{}).innerText||''"), 'the rematch of a ranked game is ranked')
    # 3-player dominoes rematch
    for pg in (A, B): pg.evaluate("document.getElementById('g-modal') && document.getElementById('g-modal').classList.add('hidden'); closeActiveGame(); navigateTo('play', true)")
    A.wait_for_timeout(1500)
    code = open_table(A, 'dominoes', 'room', {'n': 3, 'to': 0}); join(B, code); join(C, code); A.wait_for_timeout(2500); A.query_selector('#np-start') and start(A); A.wait_for_timeout(2000)
    for pg in (A, B, C): pg.evaluate("NP.S.over = true; gameResult({ title: 'test end', rows: [] })")
    for pg in (A, B, C): pg.wait_for_selector('#np-rm', timeout=10000); pg.click('#np-rm'); pg.wait_for_timeout(300)
    A.wait_for_timeout(7000)
    check(all(pg.query_selector('#dm-hand') for pg in (A, B, C)) and A.evaluate("NP.S && NP.S.n") == 3, 'a 3-player rematch started for all three')
    done(A, B, C)
