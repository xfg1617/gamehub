"""Case Files #002: the same player never gets a version they already had until they have seen them all, and never the
same one twice in a row. The list is saved with the profile (so it follows an account). Prints only version numbers."""
import sys; sys.path.insert(0, 'test')
from tlib import *
E = 'GAME_MODS.casefiles.engine'
fails = []
def check(ok, what): print('PASS' if ok else 'FAIL', what); fails.append(what) if not ok else None
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1200, 800)
    got = []
    for n in range(13):
        pg.evaluate("openGame('casefiles')"); pg.wait_for_timeout(300)
        if pg.query_selector('[data-mode="solo"]'): pg.click('[data-mode="solo"]')
        pg.evaluate("(() => { [...document.querySelectorAll('#gs-body button')].filter(x => /^\\s*Standard/.test(x.textContent)).forEach(x => x.click()); })()"); pg.wait_for_timeout(150)
        pg.evaluate("(() => { [...document.querySelectorAll('#gs-body button')].filter(x => /Night Gallery/.test(x.textContent)).forEach(x => x.click()); })()")
        pg.evaluate("(() => { const b = [...document.querySelectorAll('#gs-body button')].find(x => /^\\s*(start|play)/i.test(x.textContent)); b && b.click(); })()")
        pg.wait_for_timeout(500)
        got.append(pg.evaluate(f"{E}.G.version"))
        pg.evaluate("GT.started = false; navigateTo('play')"); pg.wait_for_timeout(200)
    print('   versions in order:', got)
    check(sorted(got[:4]) == [0, 1, 2, 3], 'the first 4 games are 4 different versions')
    check(sorted(got[4:8]) == [0, 1, 2, 3] and sorted(got[8:12]) == [0, 1, 2, 3], 'each next round of 4 games is again all different')
    check(all(got[i] != got[i + 1] for i in range(len(got) - 1)), 'never the same version twice in a row')
    saved = pg.evaluate("JSON.stringify(profile.stats.casefiles.seen)")
    check('gallery' in saved, 'the list is kept in the saved profile')
    check(not pg.errs, f'no page errors {pg.errs[:2]}')
    print('ALL PASS' if not fails else f'{len(fails)} FAILED')
