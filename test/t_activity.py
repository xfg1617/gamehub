"""Friends see what you're playing (Nov 27 2026): each screen shares the game it has open; another player's screen
reads 'PLAYING CHESS'. Also checks the fun-moment badge now sits above the name tag."""
import sys; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, B = players(p, 2)
    a_id = A.evaluate("NET.me.id")
    A.evaluate("navigateTo('play', true); openGame('chess')"); A.wait_for_timeout(400)
    if A.query_selector('[data-mode="here"]'): A.click('[data-mode="here"]')
    A.wait_for_timeout(9000)
    st = B.evaluate(f"friendStatus('{a_id}')")
    check(st == 'PLAYING CHESS', 'the other player sees: ' + str(st))
    A.evaluate("navigateTo('play', true)"); A.wait_for_timeout(9000)
    check(B.evaluate(f"friendStatus('{a_id}')") == 'ONLINE', 'back on the home page: ONLINE')
    done(A, B)
