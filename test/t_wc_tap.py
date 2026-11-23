"""Word Connect: tapping letters one at a time builds a word, tapping the last letter takes it back,
a real word goes in by itself (no Enter button), and dragging still works."""
import sys; sys.path.insert(0, 'test')
from tlib import *
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 390, 844, mobile=True)
    pg.evaluate("openGame('wordconnect')"); pg.wait_for_timeout(200); pg.click('#su-go'); pg.wait_for_timeout(400)
    word = pg.evaluate("(() => { const G = GAME_MODS.wordconnect.engine && GAME_MODS.wordconnect.engine.state ? GAME_MODS.wordconnect.engine.state() : null; return null; })()")
    # find a real word from the puzzle by reading the letters and trying the hint list via the page's own data
    letters = pg.evaluate("[...document.querySelectorAll('.wc-let')].map(e => e.textContent.trim().toLowerCase())")
    pos = pg.evaluate("[...document.querySelectorAll('.wc-let')].map(e => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })")
    def tap(i): pg.mouse.click(*pos[i]); pg.wait_for_timeout(120)
    tap(0); tap(1); tap(2)
    cur1 = pg.evaluate("document.getElementById('wc-cur').textContent")
    tap(2)  # take the last one back
    cur2 = pg.evaluate("document.getElementById('wc-cur').textContent")
    tap(1); tap(1)  # tap 1 is now last: removes it
    cur3 = pg.evaluate("document.getElementById('wc-cur').textContent")
    pg.click('#wc-back'); cur4 = pg.evaluate("document.getElementById('wc-cur').textContent")
    print('letters', letters, '| after 3 taps:', cur1, '| tap last again:', cur2, '| :', cur3, '| back button:', repr(cur4))
    # now a real word, by taps then Enter
    words = pg.evaluate("(() => { const L = [...document.querySelectorAll('.wc-let')].map(e => e.textContent.trim().toLowerCase()); return L; })()")
    found0 = pg.evaluate("document.getElementById('wc-count').textContent")
    # try every 3-letter combination of distinct letters until one is accepted
    import itertools
    ok = False
    for a, b, c in itertools.permutations(range(len(pos)), 3):
        pg.evaluate("document.getElementById('wc-clr').click()")
        for i in (a, b, c): pg.mouse.click(*pos[i]); pg.wait_for_timeout(30)
        pg.wait_for_timeout(420)
        if pg.evaluate("document.getElementById('wc-count').textContent") != found0: ok = True; break
    print('word went in by itself after tapping:', ok, '| Enter button gone:', pg.query_selector('#wc-ok') is None, pg.evaluate("document.getElementById('wc-count').textContent"))
    # dragging still works
    before = pg.evaluate("document.getElementById('wc-count').textContent")
    pg.mouse.move(*pos[0]); pg.mouse.down(); pg.mouse.move(*pos[1], steps=6); pg.mouse.move(*pos[2], steps=6); pg.mouse.up(); pg.wait_for_timeout(200)
    print('drag submitted (message):', pg.evaluate("document.getElementById('wc-msg').textContent"), pg.errs)
    pg.screenshot(path='test/shots/wc_tap.png')
