"""After an online game the group stays together (Inna, Nov 2026): the host picks the next game (same again, random,
or any game that fits) and both players move to the new table; the other player sees who is choosing."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
def wait_game(pg, not_game, t=30):
    t0 = time.time()
    while time.time() - t0 < t:
        st = pg.evaluate("[activeGame, !!(NP.S && NP.S.online), NP.S && NP.S.code]")
        if st[0] and st[0] != not_game and st[1]: return st
        pg.wait_for_timeout(500)
    return pg.evaluate("[activeGame, !!(NP.S && NP.S.online), NP.S && NP.S.code]")
with sync_playwright() as p:
    A, B = players(p, 2)
    code = open_table(A, 'tictactoe', 'room'); join(B, code); A.wait_for_timeout(3000)
    check(A.evaluate("activeGame") == 'tictactoe' and B.evaluate("!!(NP.S && NP.S.online)"), 'a Tic-Tac-Toe table with 2 players')
    for pg, r in ((A, 'win'), (B, 'loss')):
        pg.evaluate(f"(() => {{ reportGame('tictactoe', '{r}', {{ xp: 1, label: 'test' }}); gameResult({{ title: 'Done', sub: '', rows: [] }}); }})()")
    A.wait_for_timeout(3000)
    ta, tb = A.evaluate("document.getElementById('g-modal').innerText"), B.evaluate("document.getElementById('g-modal').innerText")
    print('   host box :', ta.replace('\n', ' ')[-160:]); print('   other box:', tb.replace('\n', ' ')[-120:])
    check(A.query_selector('#np-rnd') is not None and A.query_selector('#np-other') is not None, 'the host sees: again / random / pick another game')
    check('choosing the next game' in tb, 'the other player sees who is choosing')
    A.click('#np-other'); A.wait_for_timeout(300)
    opts = A.evaluate("[...document.querySelectorAll('[data-ng]')].map(b => b.dataset.ng)"); print('   games for 2:', opts)
    check('c4' in opts and 'random' not in opts and 'wordconnect' not in opts, 'the list holds the games 2 people can play (computer players fill bigger tables)')
    A.click('[data-ng="c4"]')
    ga, gb = wait_game(A, 'tictactoe'), wait_game(B, 'tictactoe')
    print('   next: A', ga, ' B', gb)
    check(ga[0] == gb[0] == 'c4' and ga[2] == gb[2], 'both move to the same Four-in-a-Row table')
    done(A, B)
