"""Welcome pop-up (as a real visitor, not a test browser): a new guest sees it about half a second after the page
opens (no waiting for the connection), only once; if they go straight into a game it waits until they are back home; and player stats that fail to send are sent again later."""
import sys; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, = players(p, 1, account=False)
    A.context.add_init_script("Object.defineProperty(navigator, 'webdriver', { get: () => false })")
    import time
    A.evaluate("localStorage.removeItem('ps_welcome_v1')"); A.reload(wait_until='domcontentloaded'); t0 = time.time()
    try: A.wait_for_selector('#wl-pop', timeout=9000); shown = True
    except Exception: shown = False
    took = time.time() - t0
    check(shown, 'a new guest sees the welcome pop-up')
    check(took < 2.0, f'it shows quickly ({took:.1f} s after the page opens)')
    if shown:
        A.screenshot(path='test/shots/welcome_live.png')
        A.click('#wl-pop .wl-later'); A.wait_for_timeout(300)
        check(not A.query_selector('#wl-pop'), '"Maybe later" closes it')
    A.reload(); A.wait_for_load_state(); A.wait_for_timeout(5000)
    check(not A.query_selector('#wl-pop'), 'it does not come back on the next visit')
    # straight into a game before it shows: it waits, then shows back on the home screen
    A.evaluate("localStorage.removeItem('ps_welcome_v1')"); A.reload(wait_until='domcontentloaded')
    A.evaluate("openGame('tictactoe')"); A.wait_for_timeout(3000)
    check(not A.query_selector('#wl-pop'), 'not shown on top of a game')
    A.evaluate("GT.started = false; navigateTo('play')")
    try: A.wait_for_selector('#wl-pop', timeout=4000); back = True
    except Exception: back = False
    check(back, 'shown once back on the home screen')
    if back: A.click('#wl-pop .wl-later'); A.wait_for_timeout(300)
    # stats: the first send fails, the next one goes through
    A.evaluate("""(() => { let n = 0; const real = NET.publishStats; window.__sent = 0;
      NET.publishStats = (o) => { n++; if (n === 1) return Promise.reject(new Error('not set up yet')); window.__sent++; return real(o); };
      gstat('chess').played = (gstat('chess').played || 0) + 1; })()""")
    A.wait_for_function("window.__sent >= 1", timeout=40000)
    check(True, 'stats that failed to send are sent again')
    done(A)
