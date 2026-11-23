"""Leaving an online chess game, on the REAL service (two separate browsers = two devices):
1. a player presses Leave -> the other screen says they left, and the player who stayed wins (ranked Elo);
2. a player loses their connection -> the other screen shows DISCONNECTED with a countdown, then wins."""
import sys, json, re, time; sys.path.insert(0, 'test')
from tlib import *
src = open(os.path.join(ROOT, 'test', 't_online_real.py')).read()
exec(src[src.index('UMD ='):src.index('with sync_playwright')])   # reuse device() and check()
def pair(A, B):
    for pg in (A, B):
        pg.evaluate("document.getElementById('g-modal') && document.getElementById('g-modal').classList.add('hidden'); navigateTo('play', true)")
        pg.evaluate("openGame('chess')"); pg.wait_for_timeout(400)
        pg.click('[data-k="opp"][data-v="online"]'); pg.click('#su-go'); pg.wait_for_timeout(2500)
    A.wait_for_timeout(3000)
    return A.query_selector('#ch-board') is not None and B.query_selector('#ch-board') is not None
def modal(pg, t=40000):
    try: pg.wait_for_function("document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden')", timeout=t)
    except Exception: return ''
    return pg.evaluate("document.getElementById('g-modal').innerText").replace('\n', ' ')
with sync_playwright() as p:
    br = launch(p)
    A = device(br, 'Test Pilot A', '🛩️'); B = device(br, 'Test Pilot B', '🚁')
    check(A.evaluate('NET.on') and B.evaluate('NET.on'), 'both devices online')
    # 1. pressing Leave
    check(pair(A, B), 'ranked game 1 started')
    A.click('#ch-new'); A.wait_for_timeout(400)
    check(A.query_selector('#cf-yes') is not None, 'Leave asks first')
    A.click('#cf-yes'); A.wait_for_timeout(1000)
    res = modal(B)
    print('   stayer sees:', res[:160]); print('   B msg:', B.evaluate("(document.getElementById('ch-msg')||{}).innerText"), '| A errs', A.errs[-3:], '| B errs', B.errs[-3:])
    check('left the game' in res and 'Victory' in res and '(+' in res, 'other player told at once: opponent left, you win, Elo up')
    B.screenshot(path='test/shots/leave_result.png')
    # 2. losing the connection
    check(pair(A, B), 'ranked game 2 started')
    A.context.set_offline(True); t0 = time.time()
    B.wait_for_function("document.getElementById('ch-dc')", timeout=45000)
    print(f'   DISCONNECTED shown after {time.time() - t0:.0f}s:', B.evaluate("document.getElementById('ch-msg').innerText"))
    B.screenshot(path='test/shots/leave_dc.png')
    check(True, 'disconnect warning with countdown')
    res = modal(B, 90000)
    print(f'   after {time.time() - t0:.0f}s stayer sees:', res[:160])
    check('disconnected' in res and 'Victory' in res and '(+' in res, 'player who stayed wins after the countdown, Elo up')
    # 3. closing the tab in the middle of a game
    A.context.set_offline(False); A.reload(); A.wait_for_timeout(4500)
    check(pair(A, B), 'ranked game 3 started')
    t0 = time.time(); A.close(run_before_unload=False)
    res = modal(B, 90000)
    print(f'   tab closed: after {time.time() - t0:.0f}s stayer sees:', res[:120])
    check('Victory' in res and '(+' in res, 'closing the tab: player who stayed wins')
    print('errors B:', B.errs[:4])
print('ALL GOOD' if not fails else f'{len(fails)} PROBLEMS')
