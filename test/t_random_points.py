"""Random Game + points (Inna, Nov 2026). On this device: the tile is first, a 3-game session plays random games against
computer players one after another; each result shows points (no Elo) and the session total. Points add up on the
profile; the leaderboard page shows points."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
from nplib import check
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1500, 900)
    pg.evaluate("navigateTo('play', true)"); pg.wait_for_timeout(300)
    first = pg.evaluate("document.querySelector('.hp-grid .gtile .gname').textContent")
    check(first == 'Random Game', 'Random Game is the first tile (' + first + ')')
    pg.evaluate("openGame('random')"); pg.wait_for_timeout(400)
    labels = pg.evaluate("[...document.querySelectorAll('#gs-body .pix')].map(e => e.textContent).join(' | ')")
    check('SESSION' in labels and 'WHICH GAMES' in labels, 'its setup has Session and Which games')
    pg.evaluate("document.querySelector('[data-k=\"ses\"][data-v=\"3\"]').click()")
    pg.click('#su-go'); pg.wait_for_timeout(1500)
    games = []
    for k in range(3):
        g = pg.evaluate("activeGame"); games.append(g); print('   game', k + 1, ':', g)
        # finish it quickly: give up / resign through the game's own result (fast path: call the result directly)
        pg.evaluate("""(() => { reportGame(activeGame, 'win', { xp: 5, label: 'test' }); gameResult({ title: 'You win!', sub: 'test', rows: [['Elo', '+12', 'text-emerald'], ['Cards', 3, '']] }); })()""")
        pg.wait_for_timeout(600)
        txt = pg.evaluate("document.getElementById('g-modal').innerText")
        if k == 0: print('   result:', txt.replace('\n', ' ')[:200])
        check('ELO' not in txt.upper(), 'no Elo on the result screen')
        check('POINTS' in txt.upper() and '+' in txt, 'the result shows the points earned')
        check(('GAME %d OF 3' % (k + 1)) in txt.upper() or 'SESSION OVER' in txt.upper(), 'and the session box')
        btn = pg.query_selector('#rg-next'); check(btn is not None, 'with a next-game button')
        if k < 2: btn.click(); pg.wait_for_timeout(1800)
    check(len(set(games)) == 3 and 'navalnet' not in games, 'three different random games')
    check('SESSION OVER' in pg.evaluate("document.getElementById('g-modal').innerText").upper(), 'after game 3 the session is over')
    pts = pg.evaluate("profile.points"); print('   profile points:', pts)
    check(pts > 0, 'points were added to the profile')
    pg.evaluate("document.getElementById('g-modal').classList.add('hidden'); navigateTo('leaderboard', true)"); pg.wait_for_timeout(500)
    lb = pg.evaluate("document.getElementById('view-leaderboard').innerText")
    check('POINTS' in lb.upper() and 'ELO' not in lb.upper(), 'the leaderboard page is about points')
    pg.screenshot(path='test/shots/points_board_offline.png')
    pg.evaluate("navigateTo('profile', true)"); pg.wait_for_timeout(500)
    pr = pg.evaluate("document.getElementById('view-profile').innerText").upper()
    check('ELO' not in pr, 'no Elo on the profile page')
    check(not pg.errs, 'no errors ' + str(pg.errs[:3]))
    br.close()
