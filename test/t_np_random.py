"""Random Game online (Inna, Nov 2026): two players + a computer meet in a Random Game room; on Start the same random
card game is picked on both screens and both land at that table together. After the game the result box shows the
session standings and the host's "Next game" moves everyone to game 2 of 3. Also: the address bar shows /r/CODE."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
CARD = ['fibber', 'tunnel', 'guild', 'poker', 'blackjack', 'kittens', 'colorclash']
def wait_game(pg, not_game='random', t=30):
    t0 = time.time()
    while time.time() - t0 < t:
        st = pg.evaluate("[activeGame, !!(NP.S && NP.S.online), NP.S && NP.S.code]")
        if st[0] and st[0] != not_game and st[1]: return st
        pg.wait_for_timeout(500)
    return pg.evaluate("[activeGame, !!(NP.S && NP.S.online), NP.S && NP.S.code]")
with sync_playwright() as p:
    A, B = players(p, 2)
    code = open_table(A, 'random', 'room', {'ses': 3, 'kind': 'card', 'n': 3})
    print('   room', code, '· address:', A.evaluate('location.pathname'))
    check(A.evaluate('location.pathname') == '/r/' + code, 'the address bar shows the room link /r/' + code)
    join(B, code); A.wait_for_timeout(2500); start(A)
    ga, gb = wait_game(A), wait_game(B)
    print('   A:', ga, ' B:', gb)
    check(ga[0] == gb[0] and ga[0] in CARD, 'both players land in the same random card game: ' + str(ga[0]))
    check(ga[2] == gb[2], 'at the same table')
    ses = A.evaluate("NP.last && NP.last.sel && NP.last.sel.session"); print('   session:', ses and {k: ses[k] for k in ('n', 'k', 'played')})
    check(ses and ses['k'] == 1 and ses['n'] == 3, 'game 1 of 3 of the session')
    A.wait_for_timeout(2500)
    # end the game on both screens (as if it finished): A wins, B loses
    for pg, r in ((A, 'win'), (B, 'loss')):
        pg.evaluate(f"(() => {{ reportGame(activeGame, '{r}', {{ xp: 1, label: 'test', place: {1 if r == 'win' else 2} }}); gameResult({{ title: 'Done', sub: '', rows: [] }}); }})()")
    A.wait_for_timeout(3500)
    ta, tb = A.evaluate("document.getElementById('g-modal').innerText"), B.evaluate("document.getElementById('g-modal').innerText")
    print('   A box:', ta.replace('\n', ' ')[-200:]); print('   B box:', tb.replace('\n', ' ')[-160:])
    check('AFTER GAME 1 OF 3' in ta.upper() and 'AFTER GAME 1 OF 3' in tb.upper(), 'both see the session standings')
    check(A.query_selector('#np-next') is not None and B.query_selector('#np-next') is None, 'the host has "Next game", the other sees the countdown')
    check(' in ' in tb and 'NEXT GAME' in tb.upper(), 'the other player sees "Next game in 3..."')
    check('The other players have left' not in ta + tb, 'no false "players have left" message')
    first = ga[0]
    # Inna: "count down 3 to next game and go to next game immediately": nobody presses anything
    ga2, gb2 = wait_game(A, first), wait_game(B, first)
    print('   game 2: A', ga2, ' B', gb2)
    check(ga2[0] == gb2[0] and ga2[0] != first and ga2[2] == gb2[2], 'both move on to game 2 together: ' + str(ga2[0]))
    ses2 = B.evaluate("NP.last && NP.last.sel && NP.last.sel.session")
    check(ses2 and ses2['k'] == 2, 'game 2 of 3')
    check(sum((ses2 or {}).get('sc', {}).values()) > 0, 'the session remembers the points so far ' + str((ses2 or {}).get('sc')))
    A.screenshot(path='test/shots/np_random_game2.png')
    done(A, B)
