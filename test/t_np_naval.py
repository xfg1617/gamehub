"""Naval Grid Online = the offline Naval Grid screens with a real opponent. Naval Grid's setup offers "Online";
both players get the offline setup board (drag/tap ships, Deploy), then the offline battle boards. A fires at B's
real ships (read from B's screen), B fires at random; the defender's screen answers each shot; every hit shows on
both screens and both get the offline summary pop-up.  Add 'real' for the real service."""
import sys, random; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
MY_TURN = "ng.phase === 'battle' && ng.playerTurn"
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    A.evaluate("openSetup('naval')"); A.wait_for_timeout(600)
    check(A.evaluate("activeGame") == 'navalnet' and not A.evaluate("!!document.querySelector('#bs-modal:not(.hidden)')"), 'Naval Grid opens ONE setup screen (no pop-up first)')
    check(A.evaluate("[...document.querySelectorAll('[data-mode]')].map(b => b.dataset.mode).join(',')") == 'quick,room', 'step 1 offers Online match / Private room')
    code = open_table(A, 'naval', 'room')
    join(B, code); A.wait_for_timeout(3000)
    check(A.query_selector('#game-root #ng-setup-grid') and B.query_selector('#game-root #ng-setup-grid'), 'both see the offline fleet setup board')
    A.screenshot(path='test/shots/nn_setup.png')
    A.click('#ng-deploy-btn'); A.wait_for_timeout(800)
    print('   A waiting banner:', A.evaluate("document.getElementById('ng-banner-line2').textContent"))
    B.click('#ng-deploy-btn'); A.wait_for_timeout(2000)
    check(A.query_selector('#game-root #ng-battle-view:not(.hidden)') and B.query_selector('#game-root #ng-battle-view:not(.hidden)'), 'both moved on to the offline battle boards')
    targets = B.evaluate("ng.playerShips.flatMap(s => s.cells.map(c => [c.r, c.c]))")
    t0 = time.time(); shots = {'A': 0, 'B': 0}
    while time.time() - t0 < 200:
        if A.evaluate("!document.getElementById('ng-summary-modal').classList.contains('hidden')"): break
        if A.evaluate(MY_TURN) and targets:
            r, c = targets.pop(0); A.evaluate(f"clickEnemyCell({r}, {c}); clickEnemyCell({r}, {c})"); shots['A'] += 1; A.wait_for_timeout(700)
        elif B.evaluate(MY_TURN):
            free = B.evaluate("(() => { const o = []; for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) if (ng.playerShots[r][c] === null) o.push([r, c]); return o; })()")
            r, c = random.choice(free); B.evaluate(f"clickEnemyCell({r}, {c}); clickEnemyCell({r}, {c})"); shots['B'] += 1; B.wait_for_timeout(700)
        else: A.wait_for_timeout(300)
        if shots['A'] == 3 and not A.evaluate("window.__shot"): A.evaluate("window.__shot = 1"); A.screenshot(path='test/shots/nn_battle.png')
    A.wait_for_timeout(1500)
    hitsOnB = B.evaluate("ng.enemyShots.flat().filter(v => v === 'hit' || v === 'sunk').length"); shownOnA = A.evaluate("ng.playerShots.flat().filter(v => v === 'hit' || v === 'sunk').length")
    print('   shots', shots, '| hits B sees on its fleet', hitsOnB, '| A sees', shownOnA)
    check(hitsOnB == 17 and shownOnA == 17, 'every hit shows on both screens')
    ta = A.evaluate("document.getElementById('ng-sum-title').textContent"); tb = B.evaluate("document.getElementById('ng-sum-title').textContent")
    print('   A:', ta, A.evaluate("document.getElementById('ng-sum-sub').textContent"), '| B:', tb)
    check(ta == 'Victory!' and tb == 'Defeat', 'the offline summary pop-up shows the right result on both screens')
    A.screenshot(path='test/shots/nn_end.png')
    # leaving gives the screens back: offline Naval Grid still works
    A.evaluate("closeModal('ng-summary-modal'); navigateTo('play', true)"); A.wait_for_timeout(500)
    A.evaluate("BASE_SETUP.naval.go({ ai: 'smart', clock: 20, touch: 1 })"); A.wait_for_timeout(800)
    check(A.query_selector('#view-naval #ng-setup-view:not(.hidden)') is not None, 'offline Naval Grid works again afterwards')
    done(A, B)
