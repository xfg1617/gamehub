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
            # does anything in the game reach under the floating control bar / CHAT?
            under = pg.evaluate("""(() => { const bar = document.querySelector('#gs-wrap > .panel:first-child, #view-naval:not(.hidden) > .panel:first-child, #view-daily:not(.hidden) > .panel:first-child, #view-connect4:not(.hidden) > .panel:first-child');
              if (!bar || getComputedStyle(bar).position !== 'fixed') return 0; const top = bar.getBoundingClientRect().top + window.scrollY;
              const host = document.querySelector('#gs-body') || document.querySelector('#view-' + (document.querySelector('#view-naval:not(.hidden)') ? 'naval' : document.querySelector('#view-daily:not(.hidden)') ? 'daily' : 'connect4'));
              let low = 0; host.querySelectorAll('*').forEach((el) => { const r = el.getBoundingClientRect(); if (r.width && r.height && getComputedStyle(el).position !== 'fixed') low = Math.max(low, r.bottom + window.scrollY); });
              return Math.round(low - top); })()""")
            pg.evaluate("window.scrollTo(0, 0)")
            pg.screenshot(path=f'test/shots/full_{g}_{tag}.png')
            print(tag, g.ljust(11), 'page height', sh, '(screen', h, ')', ('UNDER BAR by %dpx' % under) if under > 0 else '', 'TOO WIDE ' + str(sw) if sw > w + 1 else '', pg.errs[:2])
        pg.context.close()
    br.close()
