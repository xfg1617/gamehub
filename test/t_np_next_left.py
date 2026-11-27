"""Next game after an online game (Inna, Nov 27 2026: "a player who already left still joined the next game"):
3 players finish; one leaves the result screen at once. The host's next-game choice counts only the 2 who stayed,
the next table has 2 people, and the one who left is not pulled into it."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, B, C = players(p, 3)
    code = open_table(A, 'thirteen', 'room', {'n': 3, 'hands': 1, 'turn': 0})
    join(B, code); join(C, code); A.wait_for_timeout(1500); start(A); A.wait_for_timeout(4000)
    check(all(pg.evaluate("!!(NP.S && NP.S.online && NP.S.n === 3)") for pg in (A, B, C)), 'a 3-player Thirteen table')
    for pg, r in ((A, 'win'), (B, 'loss'), (C, 'loss')):
        pg.evaluate(f"(() => {{ reportGame('thirteen', '{r}', {{ xp: 1, label: 'test' }}); gameResult({{ title: 'Done', sub: '', rows: [] }}); }})()")
    A.wait_for_timeout(2500)
    # C leaves the result screen straight away
    C.evaluate("document.getElementById('g-modal').classList.add('hidden'); navigateTo('play', true)")
    A.wait_for_timeout(3000)
    t = A.evaluate("(document.getElementById('np-other') || {}).textContent || ''"); print('   host sees:', t)
    check('fit 2 players' in t, 'the host now counts 2 players, not 3')
    A.click('#np-rm'); t0 = time.time()
    while time.time() - t0 < 30 and not (A.evaluate("!!(NP.S && NP.S.online && NP.S.code !== '%s')" % code) and B.evaluate("!!(NP.S && NP.S.online && NP.S.code !== '%s')" % code)): A.wait_for_timeout(500)
    n = A.evaluate("NP.S && NP.S.seats.filter(x => !x.bot).length"); print('   people at the new table:', n)
    check(n == 2, 'the next table has the 2 who stayed')
    check(C.evaluate("!(NP.S && NP.S.online)") and C.evaluate("activeGame") != 'thirteen' or C.evaluate("!NP.S || NP.S.code === '%s' || !NP.S.online" % code), 'the one who left was not pulled into the next game')
    done(A, B, C)
