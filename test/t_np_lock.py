"""Room lock: the host of a private room presses 🔓 Lock room; a player already inside stays, a new player who tries
the code is turned away ("locked by the host"); unlocking lets them in."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, B, C = players(p, 3)
    code = open_table(A, 'fibber', 'room', {'n': 5})
    join(B, code); A.wait_for_timeout(2500)
    seats = lambda: A.evaluate("document.querySelectorAll('#np-lob .np-seat.on').length")
    check(seats() == 2, f'B joined the room ({seats()} people)')
    check(A.query_selector('#np-lock') is not None and B.query_selector('#np-lock') is None, 'only the host has the lock button')
    A.click('#np-lock'); A.wait_for_timeout(1500)
    check('LOCKED' in B.evaluate("document.getElementById('np-lob').innerText"), 'B sees the room is locked')
    join(C, code); C.wait_for_timeout(3000)
    check(seats() == 2 and not C.query_selector('#np-lob'), 'C is turned away from the locked room')
    A.screenshot(path='test/shots/np_lock.png')
    A.click('#np-lock'); A.wait_for_timeout(1000)
    join(C, code); A.wait_for_timeout(3000)
    check(seats() == 3, f'after unlocking, C gets in ({seats()} people)')
    done(A, B, C)
