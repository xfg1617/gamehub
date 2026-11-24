"""Poker hand ranks (Nov 2026, Inna): the guide shows example cards for every hand rank, and a "Hand ranks" button
during play opens the same chart (your current hand is marked once the flop is out)."""
import sys; sys.path.insert(0, 'test')
from tlib import *
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
with sync_playwright() as p:
    br = launch(p)
    for w, h, mob, tag in ((1280, 900, False, 'desk'), (390, 844, True, 'phone')):
        pg = open_page(br, w, h, mob)
        pg.evaluate("openGuide('poker')"); pg.wait_for_timeout(400)
        n = pg.evaluate("document.querySelectorAll('#guide-modal .pk-rank').length"); c = pg.evaluate("document.querySelectorAll('#guide-modal .pk-rank .pcard').length")
        check(n == 10 and c == 50, f'{tag}: guide shows 10 hand ranks with 5 example cards each ({n}, {c})')
        pg.query_selector('#guide-modal .pk-ranks').screenshot(path=f'test/shots/pk_ranks_guide_{tag}.png')
        pg.evaluate("document.getElementById('guide-modal').classList.add('hidden'); window.__fast = true; openGame('poker')"); pg.wait_for_timeout(300)
        go = pg.query_selector('#su-go'); go and go.click(); pg.wait_for_timeout(2500)
        check(pg.query_selector('#pk-ranks-btn') is not None, f'{tag}: Hand ranks button in the game header')
        pg.click('#pk-ranks-btn'); pg.wait_for_timeout(400)
        check(pg.evaluate("document.querySelectorAll('#pk-ranks-modal:not(.hidden) .pk-rank').length") == 10, f'{tag}: the button opens the chart')
        pg.evaluate("document.querySelector('#pk-ranks-modal [data-x]').click()"); pg.wait_for_timeout(200)
        check(pg.evaluate("document.getElementById('pk-ranks-modal').classList.contains('hidden')"), f'{tag}: it closes')
        wide = pg.evaluate("document.documentElement.scrollWidth")
        check(wide <= w, f'{tag}: no sideways scrolling ({wide}px)')
        check(not pg.errs, f'{tag}: no page errors {pg.errs[:2]}')
        pg.close()
    br.close()
print('ALL OK' if not fails else f'{len(fails)} FAILED'); sys.exit(1 if fails else 0)
