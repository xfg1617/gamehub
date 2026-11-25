"""Table designs (Nov 2026): the 🎨 Table button shows in every card game, the six designs paint the screen, the table
and the card backs, the choice is saved, and no errors. Screenshots in test/shots/tb_*.png."""
import sys; sys.path.insert(0, 'test')
from tlib import *
GAMES = ['poker', 'blackjack', 'colorclash', 'kittens', 'fibber', 'dominoes']
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
with sync_playwright() as p:
    br = launch(p)
    for w, h, tag in [(1690, 903, 'd'), (390, 844, 'm')]:
        pg = open_page(br, w, h, mobile=w < 600)
        for i, g in enumerate(GAMES):
            pg.evaluate(f"navigateTo('play', true); openGame('{g}')"); pg.wait_for_timeout(300)
            if pg.query_selector('#su-go'): pg.click('#su-go')
            pg.wait_for_timeout(2500)
            check(pg.query_selector('#gs-tools .gs-table') is not None, f'{tag} {g}: 🎨 Table button')
            theme = ['harbor', 'royal', 'saloon', 'arcade', 'lagoon', 'classic'][i]
            pg.click('#gs-tools .gs-table'); pg.wait_for_timeout(300)
            check(pg.query_selector('#tb-pop') is not None, f'{tag} {g}: picker opens')
            if g == 'poker' and tag == 'd': pg.screenshot(path='test/shots/tb_picker.png')
            pg.click(f'#tb-pop [data-tb="{theme}"]'); pg.wait_for_timeout(300)
            pg.mouse.click(5, h // 2); pg.wait_for_timeout(200)
            check(pg.query_selector('#tb-pop') is None and pg.evaluate("TABLES.current") == theme, f'{tag} {g}: {theme} chosen, picker closed')
            pg.wait_for_timeout(600); pg.screenshot(path=f'test/shots/tb_{g}_{tag}.png')
        check(pg.evaluate("localStorage.getItem('ps_table_v1')") == 'classic', 'the choice is saved')
        check(not pg.errs, f'{tag}: no page errors {pg.errs[:2]}')
        pg.context.close()
    # every design on poker
    pg = open_page(br, 1690, 903)
    pg.evaluate("navigateTo('play', true); openGame('poker')"); pg.wait_for_timeout(300); pg.click('#su-go'); pg.wait_for_timeout(2500)
    for t in ['classic', 'harbor', 'royal', 'saloon', 'arcade', 'lagoon']:
        pg.evaluate(f"TABLES.set('{t}')"); pg.wait_for_timeout(300); pg.screenshot(path=f'test/shots/tb_poker_{t}.png')
    br.close()
print('ALL GOOD' if not fails else f'{len(fails)} FAILED')
