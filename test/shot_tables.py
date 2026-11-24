"""Screenshots of the card tables (seats around the table, bigger cards), desktop and phone."""
import sys; sys.path.insert(0, 'test')
from tlib import *
games = sys.argv[1:] or ['poker', 'kittens', 'colorclash', 'blackjack']
with sync_playwright() as p:
    br = launch(p)
    for w, h, mob, tag in ((1280, 900, False, 'desk'), (390, 844, True, 'phone')):
        pg = open_page(br, w, h, mob)
        for g in games:
            pg.evaluate(f"setupSave('{g}', {{ n: 4 }}); openGame('{g}')"); pg.wait_for_timeout(300)
            go = pg.query_selector('#su-go')
            if go: go.click()
            pg.wait_for_timeout(6000)
            pg.evaluate('window.scrollTo(0, 0)'); pg.screenshot(path=f'test/shots/table_{g}_{tag}.png', full_page=(tag == 'phone'))
            print(g, tag, 'errors:', pg.errs[:2])
            pg.evaluate("closeActiveGame && closeActiveGame()"); pg.wait_for_timeout(300)
        pg.close()
    br.close()
