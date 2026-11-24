"""Doodle Guess (Draw & Guess): on this device with 2 computer players, you pick a word and draw it with the mouse,
the computers guess; a computer draws a built-in doodle and you guess it by typing. Online: one player draws, the
other sees the strokes appear live and guesses; scores match on both screens."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
S = sys.argv[1] if len(sys.argv) > 1 else 'test/shots/'
def scribble(pg, sel='#dg-cv'):
    b = pg.query_selector(sel).bounding_box()
    for k in range(3):
        pg.mouse.move(b['x'] + b['width'] * (0.25 + 0.15 * k), b['y'] + b['height'] * 0.3); pg.mouse.down()
        for j in range(12): pg.mouse.move(b['x'] + b['width'] * (0.25 + 0.15 * k + 0.01 * j), b['y'] + b['height'] * (0.3 + 0.04 * j), steps=2)
        pg.mouse.up()
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1440, 900)
    pg.evaluate("setupSave('doodle', { mode: 'live', n: 3, rounds: 1, dtime: 60 }); openGame('doodle')"); pg.wait_for_timeout(400)
    if pg.query_selector('[data-mode]'): pg.click('[data-mode]'); pg.wait_for_timeout(300)
    pg.click('#su-go'); pg.wait_for_selector('#dg-stage', timeout=10000)
    drew = guessed = 0; t0 = time.time()
    while time.time() - t0 < 200:
        if pg.evaluate("!GAME_MODS.doodle || !document.getElementById('dg-stage')") or pg.query_selector('#g-modal:not(.hidden)'): break
        if pg.query_selector('#dg-stage [data-w]'):
            pg.click('#dg-stage [data-w]'); pg.wait_for_selector('#dg-cv.draw', timeout=5000); pg.wait_for_timeout(300)
            scribble(pg); drew += 1; pg.wait_for_timeout(600); pg.screenshot(path=S + '14_doodle_draw.png')
        elif pg.query_selector('.dg-svg') and pg.evaluate("!document.getElementById('dg-in').disabled") and 'IS DRAWING' in pg.inner_text('#dg-who'):
            pg.wait_for_timeout(2500)
            if not guessed: pg.screenshot(path=S + '14_doodle_guess.png')
            pg.fill('#dg-in', 'banana'); pg.press('#dg-in', 'Enter'); pg.wait_for_timeout(300)
            w = pg.evaluate("(() => { const t = document.getElementById('dg-who').innerText; return window.__dgWord || null; })()")
            word = pg.evaluate("[...document.querySelectorAll('#dg-feed div')].length >= 0 ? (document.getElementById('dg-hint').textContent) : ''")
            real = pg.evaluate("(() => { try { return GAME_MODS.doodle.engine.word(); } catch (e) { return ''; } })()")
            if real: pg.fill('#dg-in', real); pg.press('#dg-in', 'Enter'); guessed += 1; pg.wait_for_timeout(800)
        pg.wait_for_timeout(400)
    pg.wait_for_selector('#g-modal:not(.hidden)', timeout=120000)
    feed = pg.inner_text('#dg-feed')
    print('   drew', drew, 'guessed', guessed, '| feed:', feed.replace('\n', ' / ')[:200])
    check(drew == 1, 'you picked a word and drew it with the mouse')
    check(guessed >= 1 and 'guessed the word' in feed, 'you guessed a computer drawing by typing')
    check('banana' in feed.lower(), 'wrong guesses show in the list')
    pg.screenshot(path=S + '14_doodle_end.png')
    check(not pg.errs, 'no page errors ' + str(pg.errs))
    br.close()
    # online: A draws, B watches live and guesses
    A, B = players(p, 2)
    code = open_table(A, 'doodle', 'room', {'n': 2, 'rounds': 1, 'dtime': 60})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#dg-stage') and B.query_selector('#dg-stage'), 'the game started on both screens')
    for k in range(2):
        drawer, guesser = None, None
        for _ in range(40):
            for x, y in ((A, B), (B, A)):
                if x.query_selector('#dg-stage [data-w]'): drawer, guesser = x, y
            if drawer: break
            A.wait_for_timeout(300)
        if not drawer: break
        drawer.click('#dg-stage [data-w]'); drawer.wait_for_selector('#dg-cv.draw', timeout=5000); guesser.wait_for_selector('#dg-cv', timeout=8000); drawer.wait_for_timeout(500)
        scribble(drawer); guesser.wait_for_timeout(1500)
        ink = guesser.evaluate("(() => { const c = document.getElementById('dg-cv'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] < 100) n++; return n; })()")
        check(ink > 50, f'the guesser sees the drawing appear live ({ink} dark pixels)')
        if k == 0: guesser.screenshot(path=S + '14_doodle_online_guesser.png'); drawer.screenshot(path=S + '14_doodle_online_drawer.png')
        word = guesser.evaluate("GAME_MODS.doodle.engine.word()")
        guesser.fill('#dg-in', word); guesser.press('#dg-in', 'Enter'); guesser.wait_for_timeout(2000)
        sa, sb = A.inner_text('#dg-board'), B.inner_text('#dg-board')
        check('guessed it' in sa or 'guessed the word' in A.inner_text('#dg-feed'), 'a right guess counts')
        check(sa == sb, 'both screens show the same scores')
        A.wait_for_timeout(4000)
    done(A, B)
