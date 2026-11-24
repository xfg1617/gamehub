"""Screenshots of every game in the full-screen layout (computer 1690x903 like Inna's screen, laptop 1280x720, phone)."""
import sys; sys.path.insert(0, 'test')
from tlib import *
GAMES = sys.argv[1].split(',') if len(sys.argv) > 1 and sys.argv[1] else ['blackjack', 'bowling', 'checkers', 'chess', 'colorclash', 'doodle', 'dominoes', 'impostor', 'isles', 'kittens', 'manor', 'poker', 'pool', 'tictactoe', 'tycoon', 'wordconnect', 'c4', 'naval', 'daily']
SIZES = [(1920, 1080, 'w'), (1690, 903, 'd'), (1366, 768, 'l'), (390, 844, 'm')]
if len(sys.argv) > 2: SIZES = [s for s in SIZES if s[2] in sys.argv[2]]
with sync_playwright() as p:
    br = launch(p)
    for w, h, tag in SIZES:
        pg = open_page(br, w, h, mobile=w < 600)
        for g in GAMES:
            pg.errs.clear()
            if g == 'naval': pg.evaluate("navigateTo('play', true); launchNavalGrid('Admiral_AI', 1250, 'RANKED')")
            elif g == 'daily': pg.evaluate("navigateTo('play', true); openDailyWord(true)")
            else:
                pg.evaluate(f"navigateTo('play', true); openGame('{g}')"); pg.wait_for_timeout(250)
                if pg.query_selector('#su-go'): pg.click('#su-go')
            pg.wait_for_timeout(3000)
            sw = pg.evaluate("document.documentElement.scrollWidth"); sh = pg.evaluate("document.documentElement.scrollHeight")
            pg.evaluate("window.scrollTo(0, 0)")
            pg.screenshot(path=f'test/shots/full_{g}_{tag}.png')
            print(tag, g.ljust(11), 'page height', sh, '(screen', h, ')', 'TOO WIDE ' + str(sw) if sw > w + 1 else '', pg.errs[:2])
        pg.context.close()
    br.close()
