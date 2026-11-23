"""Tic-Tac-Toe: the Unbeatable computer never loses (checked by brute force), and a match plays to the end."""
import sys; sys.path.insert(0, 'test')
from tlib import *
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    r = pg.evaluate("""(() => { const E = GAME_MODS.tictactoe.engine; let losses = 0, games = 0;
      // every possible way X can play against the perfect O (O moves second)
      const walk = (b, turn) => { const w = E.winner(b); if (w) { games++; if (w.p === 'X') losses++; return; }
        if (turn === 'X') { for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = 'X'; walk(b, 'O'); b[i] = null; } }
        else { for (const m of E.bestMoves(b, 'O')) { b[m] = 'O'; walk(b, 'X'); b[m] = null; } } };
      walk(Array(9).fill(null), 'X'); return [games, losses]; })()""")
    print('games vs perfect computer explored:', r[0], '| computer losses:', r[1])
    pg.evaluate("openGame('tictactoe')"); pg.wait_for_timeout(200)
    pg.click('[data-k="lvl"][data-v="1"]'); pg.click('[data-k="len"][data-v="3"]'); pg.click('#su-go'); pg.wait_for_timeout(300)
    import time; t0 = time.time()
    while time.time() - t0 < 40 and not pg.query_selector('#g-modal:not(.hidden)'):
        pg.evaluate("(() => { const b = document.getElementById('ttt-board'); if (!b || b.classList.contains('wait')) return; const c = [...document.querySelectorAll('.ttt-cell:not(.filled)')]; if (c.length) c[Math.floor(Math.random() * c.length)].click(); })()")
        pg.wait_for_timeout(450)
        if time.time() - t0 < 2.5: pg.screenshot(path='test/shots/ttt_play.png')
    pg.wait_for_timeout(300); pg.screenshot(path='test/shots/ttt_end.png')
    print('match finished:', bool(pg.query_selector('#g-modal:not(.hidden)')), '| score', pg.evaluate("[document.getElementById('ttt-w0').textContent, document.getElementById('ttt-d').textContent, document.getElementById('ttt-w1').textContent]"), pg.errs)
