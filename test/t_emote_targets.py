"""Emotes and chat bubbles appear on the player's own name (tag, seat box or player panel) in every game, not at a
corner of the screen. Opens each game against the computer and asks where each seat's bubble would go."""
import sys; sys.path.insert(0, 'test')
from tlib import *
GAMES = ['pool', 'chess', 'checkers', 'tictactoe', 'c4', 'hedge', 'dominoes', 'colorclash', 'kittens', 'poker', 'fibber',
         'tunnel', 'guild', 'isles', 'tycoon', 'manor', 'blackjack', 'bowling']
bad = []
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1690, 903)
    for g in GAMES:
        pg.evaluate(f"navigateTo('play', true); openGame('{g}')"); pg.wait_for_timeout(300)
        if pg.query_selector('#su-go'): pg.click('#su-go')
        pg.wait_for_timeout(2500)
        r = pg.evaluate("""(() => { const S = typeof NP !== 'undefined' && NP.S; if (!S || !S.seats || S.game !== activeGame) return 'no table';
          return S.seats.map((s, i) => { const t = EMOTE.target(S, i); if (!t) return i + ':none';
            const d = (t.id ? '#' + t.id : '') + (t.className && t.className.split ? '.' + t.className.split(' ')[0] : '');
            return i + ':' + d + ' "' + (t.textContent || '').trim().slice(0, 18).replace(/\\s+/g, ' ') + '"'; }).join('  '); })()""")
        fallback = 'gs-body' in r or 'em-fab' in r or ':none' in r
        print(('BAD ' if fallback else 'OK  ') + g.ljust(11), r)
        if fallback: bad.append(g)
        if g == 'pool':
            pg.evaluate("EMOTE.show(0, 'lol'); EMOTE.show(1, 'gg')"); pg.wait_for_timeout(400); pg.screenshot(path='test/shots/emote_pool.png')
        if pg.errs: print('   errors', pg.errs[:2]); pg.errs.clear()
    br.close()
print('ALL ON NAMES' if not bad else 'fallback in: ' + ', '.join(bad))
