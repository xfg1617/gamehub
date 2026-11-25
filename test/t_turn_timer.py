"""Turn timers for the games that had none (Inna, Nov 2026): when your time runs out a move is made for you."""
import sys; sys.path.insert(0, 'test')
from tlib import *
from nplib import check
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1500, 900)
    for g, sel, n0, n1 in [('tictactoe', {'turnT': 10, 'mode': 'ai', 'first': 'me'}, "G => 0", None), ('hedge', {'turnT': 20, 'n': 2}, None, None), ('dominoes', {'turnT': 20, 'n': 2}, None, None)]:
        pg.evaluate(f"setupSave('{g}', Object.assign({{}}, setupLoad('{g}'), {sel}))")
        pg.evaluate(f"navigateTo('play', true); openGame('{g}')"); pg.wait_for_timeout(400)
        labels = pg.evaluate("[...document.querySelectorAll('#gs-body .pix')].map(e => e.textContent).join('|')")
        check('TURN TIMER' in labels, f'{g}: the setup has a TURN TIMER setting')
        pg.click('#su-go'); pg.wait_for_timeout(1500)
        # wait until it is my turn and the clock chip shows
        on = False
        for k in range(40):
            if pg.evaluate("!!document.querySelector('#tt-host.on')"): on = True; break
            pg.wait_for_timeout(500)
        check(on, f'{g}: on your turn a clock shows')
        before = pg.evaluate("document.getElementById('game-root').innerText.length + ':' + (GAME_MODS[activeGame].engine && GAME_MODS[activeGame].engine.G ? JSON.stringify(GAME_MODS[activeGame].engine.G.st || '').length : 0)")
        moved = False
        for k in range(int(sel['turnT']) * 2 + 10):
            pg.wait_for_timeout(500)
            if not pg.evaluate("!!document.querySelector('#tt-host.on')") or pg.evaluate("document.body.innerText.includes(\"Time's up\")"): moved = True; break
        check(moved, f'{g}: when the time runs out, a move is made for you')
        pg.wait_for_timeout(1500)
    check(not pg.errs, 'no errors ' + str(pg.errs[:3]))
    br.close()
