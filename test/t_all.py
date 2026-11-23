"""Every game opens on desktop and phone sizes, starts, and runs a few seconds with no errors."""
import sys; sys.path.insert(0, 'test')
from tlib import *
GAMES = ['blackjack', 'bowling', 'checkers', 'chess', 'colorclash', 'doodle', 'dominoes', 'impostor', 'isles', 'kittens', 'manor', 'poker', 'pool', 'tictactoe', 'tycoon', 'wordconnect']
bad = 0
with sync_playwright() as p:
    br = launch(p)
    for w, h, tag in [(1280, 900, 'd'), (390, 844, 'm')]:
        pg = open_page(br, w, h, mobile=w < 600)
        for g in GAMES:
            pg.errs.clear()
            pg.evaluate(f"openGame('{g}')"); pg.wait_for_timeout(250)
            if pg.query_selector('#su-go'): pg.click('#su-go')
            pg.wait_for_timeout(2500)
            sw = pg.evaluate("document.documentElement.scrollWidth")
            pg.screenshot(path=f'test/shots/all_{g}_{tag}.png')
            ok = not pg.errs and sw <= w + 1
            bad += not ok
            print(('OK  ' if ok else 'FAIL'), tag, g, pg.errs[:3], '' if sw <= w + 1 else f'page wider than screen: {sw}')
        for v in ["openConnect4('ai','Smart AI')", "openDailyWord(true)", "launchNavalGrid('Admiral_AI', 1250, 'RANKED')"]:
            pg.errs.clear(); pg.evaluate(f"navigateTo('play'); {v}"); pg.wait_for_timeout(1200)
            print('OK  ' if not pg.errs else 'FAIL', tag, v.split('(')[0], pg.errs[:3]); bad += bool(pg.errs)
        pg.context.close()
print('ALL GOOD' if not bad else f'{bad} PROBLEMS')
