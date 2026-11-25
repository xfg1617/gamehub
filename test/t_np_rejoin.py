"""Rejoin (Nov 2026, Inna: "allow player to rejoin if disconnect"): Uno, 2 players + 1 computer. After a few turns B
reloads the page: a "Rejoin?" box shows, B goes back to the same seat, the missed moves are replayed and both screens
show the same table again; then play goes on. Second part: B is away so long that a computer takes the seat; on
rejoining, B gets the seat back."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
STATE = "[document.getElementById('cc-top').innerText.replace(/\\s+/g, ' '), document.getElementById('cc-pile').innerText.replace(/\\s+/g, ' '), document.querySelectorAll('#cc-hand .cc-card').length].join(' | ')"
COUNTS = "[...document.querySelectorAll('[id^=cc-seat-]')].map(e => e.id + ':' + (e.innerText.match(/(\\d+) cards?/) || [])[1]).sort().join(' ')"
def act(pg):
    for sel in ('#cc-clash', '#cc-pl', '[data-col]', '#cc-catch'):
        b = pg.query_selector(sel)
        if b and b.is_visible(): b.evaluate('e => e.click()'); return True
    if pg.evaluate("(document.getElementById('cc-status') || {}).textContent") != 'YOUR TURN': return False
    c = pg.query_selector('#cc-hand .cc-card.ok')
    if c: c.evaluate('e => e.click()'); return True
    d = pg.query_selector('#cc-draw')
    if d and pg.query_selector('#cc-hand .cc-card.no'): d.evaluate('e => e.click()'); return True
    return False
def play(secs):
    t0 = time.time()
    while time.time() - t0 < secs:
        for pg in (A, B):
            if act(pg): pg.wait_for_timeout(350)
        A.wait_for_timeout(400)
with sync_playwright() as p:
    A, B = players(p, 2)
    code = open_table(A, 'colorclash', 'room', {'n': 3, 'hand': 7, 'clock': 0})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    play(25)
    before = B.evaluate("document.querySelectorAll('#cc-hand .cc-card').length")
    B.goto('http://gamehub.test/gamehub.html'); B.wait_for_function("typeof NET !== 'undefined' && NET.on && NET.me", timeout=20000); B.wait_for_timeout(1500)
    check(B.query_selector('#np-rj') is not None, 'after a reload B is offered to rejoin')
    B.screenshot(path='test/shots/rejoin_offer.png')
    B.click('[data-rj="yes"]'); B.wait_for_timeout(1000)
    B.wait_for_function("!NP.catchup && document.getElementById('cc-hand')", timeout=40000); B.wait_for_timeout(2500)
    sa, sb = A.evaluate(STATE), B.evaluate(STATE)
    print('   A:', sa, '\n   B:', sb, '\n   seats A:', A.evaluate(COUNTS), '\n   seats B:', B.evaluate(COUNTS))
    check(A.evaluate(COUNTS) == B.evaluate(COUNTS), 'after rejoining, both screens show the same card counts')
    check(sa.split(' | ')[0] == sb.split(' | ')[0], 'and the same top card')
    B.screenshot(path='test/shots/rejoin_back.png')
    n0 = A.evaluate("NP.S.version"); play(20)
    check(A.evaluate("NP.S.version") > n0, 'play goes on after the rejoin')
    # part 2: away long enough for a computer to take the seat
    B.goto('about:blank'); t0 = time.time(); took = False
    while time.time() - t0 < 120 and not took:
        A.wait_for_timeout(3000); took = A.evaluate("!!(NP.S && NP.S.seats[1].bot)")
        if A.evaluate("GT.over"): break
    print('   seat taken after', round(time.time() - t0), 's')
    check(took, "after 45 s away a computer player took B's seat")
    B.goto('http://gamehub.test/gamehub.html'); B.wait_for_function("typeof NET !== 'undefined' && NET.on && NET.me", timeout=20000); B.wait_for_timeout(1500)
    if B.query_selector('[data-rj="yes"]'):
        B.click('[data-rj="yes"]'); B.wait_for_function("!NP.catchup && document.getElementById('cc-hand')", timeout=40000); B.wait_for_timeout(3000)
        check(not A.evaluate("NP.S.seats[1].bot") and not B.evaluate("NP.S.seats[NP.S.me].bot"), 'on rejoining, B gets the seat back from the computer')
        check(A.evaluate(COUNTS) == B.evaluate(COUNTS), 'and both screens match')
    else:
        over = A.evaluate("GT.over")
        check(over, 'no rejoin offer only because the game already ended')
    done(A, B)
