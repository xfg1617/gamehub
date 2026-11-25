"""Welcome pop-up (as a real visitor, not a test browser): a new guest sees it ~2 s after the page connects, only
once; and player stats that fail to send are sent again later."""
import sys; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, = players(p, 1, account=False)
    A.context.add_init_script("Object.defineProperty(navigator, 'webdriver', { get: () => false })")
    A.evaluate("localStorage.removeItem('ps_welcome_v1'); location.reload()"); A.wait_for_load_state()
    try: A.wait_for_selector('#wl-pop', timeout=9000); shown = True
    except Exception: shown = False
    check(shown, 'a new guest sees the welcome pop-up')
    if shown:
        A.screenshot(path='test/shots/welcome_live.png')
        A.click('#wl-pop .wl-later'); A.wait_for_timeout(300)
        check(not A.query_selector('#wl-pop'), '"Maybe later" closes it')
    A.reload(); A.wait_for_load_state(); A.wait_for_timeout(5000)
    check(not A.query_selector('#wl-pop'), 'it does not come back on the next visit')
    # stats: the first send fails, the next one goes through
    A.evaluate("""(() => { let n = 0; const real = NET.publishStats; window.__sent = 0;
      NET.publishStats = (o) => { n++; if (n === 1) return Promise.reject(new Error('not set up yet')); window.__sent++; return real(o); };
      gstat('chess').played = (gstat('chess').played || 0) + 1; })()""")
    A.wait_for_function("window.__sent >= 1", timeout=40000)
    check(True, 'stats that failed to send are sent again')
    done(A)
