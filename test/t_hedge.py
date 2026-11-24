"""Wall Maze: rules (hedges can't shut anyone in, jumping, clashes), computer-vs-computer games finish, and a real
game against the computer played by clicking (moves + planting a hedge), on a computer screen and a phone."""
import sys; sys.path.insert(0, 'test')
from nplib import *
S = sys.argv[1] if len(sys.argv) > 1 else 'test/shots/'
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1440, 900)
    r = pg.evaluate("""(() => { const E = GAME_MODS.hedge.engine, out = {};
      let st = E.newState(2);
      // box the top player in on three sides; the 4th hedge that would close the box is refused
      st.p[1] = [0, 0]; E.doWall(st, 0, 'v', 0, 0); st.turn = 0; out.ok1 = E.wallProblem(st, 0, 'h', 3, 3);
      out.shut = E.wallProblem(st, 0, 'h', 1, 0); st.walls.add('h0,0');
      out.clash = E.wallProblem(st, 0, 'h', 0, 1); out.cross = E.wallProblem(st, 0, 'v', 0, 0);
      st = E.newState(2); st.p[0] = [5, 4]; st.p[1] = [4, 4]; out.jump = JSON.stringify(E.pawnMoves(st, 0));
      st.walls.add('h3,4'); out.side = JSON.stringify(E.pawnMoves(st, 0).sort());
      // computer vs computer
      const res = []; for (const n of [2, 4]) for (const lvl of [1, 2, 3]) for (let g = 0; g < 4; g++) {
        const s = E.newState(n); let k = 0;
        while (s.win < 0 && k++ < 600) { const t = s.turn, a = E.aiAction(s, t, lvl); if (a.t === 'move') E.doMove(s, t, a.r, a.c); else { if (E.wallProblem(s, t, a.o, a.r, a.c)) return 'BAD WALL'; E.doWall(s, t, a.o, a.r, a.c); } }
        res.push(s.win >= 0 ? k : -1);
      }
      out.games = res; return out; })()""")
    print('  ', r)
    check(r['ok1'] == '', 'a hedge that leaves a way out is allowed')
    check('block' in r['shut'], 'a hedge that shuts a player in is refused')
    check(r['clash'] != '' and r['cross'] != '', 'hedges cannot overlap or cross')
    check(r['jump'] == '[[3,4],[6,4],[5,3],[5,5]]' or '[3,4]' in r['jump'], 'you can jump over a pawn next to you')
    check('[4,3]' in r['side'] and '[4,5]' in r['side'] and '[3,4]' not in r['side'], 'with a hedge behind it, you step diagonally instead')
    check(all(x > 0 for x in r['games']), 'every computer-vs-computer game finishes (2 and 4 players, all levels)')
    # a real game, by clicking
    pg.evaluate("window.__fast = 1; setupSave('hedge', { n: 2, lvl: 1 }); openGame('hedge')"); pg.wait_for_timeout(400)
    if pg.query_selector('[data-mode]'): pg.click('[data-mode]'); pg.wait_for_timeout(300)
    pg.click('#su-go'); pg.wait_for_selector('.hr-cell.can', timeout=10000)
    pg.screenshot(path=S + '16_hedge_start.png')
    # plant a hedge in front of the computer
    pg.hover('.hr-gap[data-w="h0,3"]'); pg.wait_for_timeout(200)
    pg.screenshot(path=S + '16_hedge_plant.png')
    check(pg.evaluate("getComputedStyle(document.getElementById('hr-ghost')).display") != 'none', 'pointing at a gap shows the hedge there')
    pg.click('.hr-gap[data-w="h0,3"]'); pg.wait_for_timeout(500)
    check(pg.evaluate("GAME_MODS.hedge.engine.G.st.walls.size") == 1, 'planting a hedge by clicking works')
    moves = 0
    for _ in range(200):
        if pg.evaluate("!GAME_MODS.hedge.engine.G || GAME_MODS.hedge.engine.G.over"): break
        pg.wait_for_timeout(150)
        if pg.evaluate("GAME_MODS.hedge.engine.G.st.turn === 0 && !!document.querySelector('.hr-cell.can')"):
            if moves == 6: pg.screenshot(path=S + '16_hedge_mid.png')
            pg.evaluate("""(() => { const G = GAME_MODS.hedge.engine.G, E = GAME_MODS.hedge.engine; const m = E.aiAction(G.st, 0, 3);
              if (m.t === 'move') { const e = document.querySelector(`.hr-cell.can[data-r="${m.r}"][data-c="${m.c}"]`); if (e) e.click(); }
              else { const c = [...document.querySelectorAll('.hr-cell.can')].sort((a, b) => a.dataset.r - b.dataset.r)[0]; if (c) c.click(); } })()""")
            moves += 1
    print('   state:', pg.evaluate("(() => { const G = GAME_MODS.hedge.engine.G; return G ? JSON.stringify({over: G.over, win: G.st.win, turn: G.st.turn, p: G.st.p, modal: !!document.querySelector('#g-modal'), cls: (document.querySelector('#g-modal')||{}).className}) : 'none'; })()"))
    pg.wait_for_selector('#g-modal:not(.hidden)', timeout=15000); pg.wait_for_timeout(400)
    check(moves > 3, f'a whole game played by clicking ({moves} moves)')
    pg.screenshot(path=S + '16_hedge_end.png')
    ph = open_page(br, 390, 844)
    ph.evaluate("setupSave('hedge', { n: 4, lvl: 2 }); openGame('hedge')"); ph.wait_for_timeout(400)
    if ph.query_selector('[data-mode]'): ph.click('[data-mode]'); ph.wait_for_timeout(300)
    ph.click('#su-go'); ph.wait_for_selector('.hr-cell.can', timeout=10000); ph.wait_for_timeout(300)
    check(ph.evaluate("document.documentElement.scrollWidth <= 392"), 'no sideways scrolling on a phone')
    ph.screenshot(path=S + '16_hedge_phone4.png', full_page=True)
    check(not pg.errs and not ph.errs, 'no page errors ' + str(pg.errs + ph.errs))
    br.close()
done()
