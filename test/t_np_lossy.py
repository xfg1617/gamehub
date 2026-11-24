"""Online tables survive lost messages: Sea Battle Online where 30% of the game messages between the two screens are
thrown away (both directions). Every shot must still be answered and drawn on both screens, and the game must end
normally. (A guest's decision is sent again until the table confirms it; every screen asks for missed moves.)"""
import sys, random, time; sys.path.insert(0, 'test')
from nplib import *
MY_TURN = "ng.phase === 'battle' && ng.playerTurn"
LOSSY = """() => { if (NET.__lossy) return; NET.__lossy = 1; const orig = NET.channel; NET.channel = (n, m) => { const c = orig(n, m); const s = c.send.bind(c);
  c.send = (ev, d) => { if (window.__drop && ['req', 'act', 'acts'].includes(ev) && Math.random() < window.__drop) { window.__dropped = (window.__dropped || 0) + 1; return; } return s(ev, d); }; return c; }; }"""
with sync_playwright() as p:
    A, B = players(p, 2)
    for pg in (A, B): pg.evaluate(LOSSY)
    A.evaluate("openSetup('naval')"); A.wait_for_timeout(600)
    code = open_table(A, 'naval', 'room'); join(B, code); A.wait_for_timeout(3000)
    A.click('#ng-deploy-btn'); B.click('#ng-deploy-btn'); A.wait_for_timeout(2500)
    check(A.query_selector('#game-root #ng-battle-view:not(.hidden)') and B.query_selector('#game-root #ng-battle-view:not(.hidden)'), 'both on the battle boards')
    for pg in (A, B): pg.evaluate("window.__drop = 0.3")
    targets = B.evaluate("ng.playerShips.flatMap(s => s.cells.map(c => [c.r, c.c]))")
    shots = {'A': 0, 'B': 0}; t0 = time.time(); pend_seen = False
    while time.time() - t0 < 240:
        if A.evaluate("!document.getElementById('ng-summary-modal').classList.contains('hidden')"): break
        if A.evaluate(MY_TURN) and targets:
            r, c = targets.pop(0); A.evaluate(f"clickEnemyCell({r}, {c}); clickEnemyCell({r}, {c})"); shots['A'] += 1
            pend_seen = pend_seen or A.evaluate(f"!!document.querySelectorAll('#ng-enemy-grid .fx-pend').length")
            A.wait_for_timeout(500)
        elif B.evaluate(MY_TURN):
            free = B.evaluate("(() => { const o = []; for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) if (ng.playerShots[r][c] === null) o.push([r, c]); return o; })()")
            r, c = random.choice(free); B.evaluate(f"clickEnemyCell({r}, {c}); clickEnemyCell({r}, {c})"); shots['B'] += 1; B.wait_for_timeout(500)
        A.wait_for_timeout(250)
    dropped = A.evaluate("window.__dropped || 0") + B.evaluate("window.__dropped || 0")
    print('   shots', shots, '| messages thrown away:', dropped, '| seconds:', int(time.time() - t0))
    check(pend_seen, 'a fired shot is marked at once (before the answer)')
    check(dropped >= 5, 'messages really were lost')
    check(A.evaluate("!document.getElementById('ng-summary-modal').classList.contains('hidden')") and B.evaluate("!document.getElementById('ng-summary-modal').classList.contains('hidden')"), 'the game still finished on both screens')
    a_marks = A.evaluate("ng.playerShots.flat().filter(v => v).length"); b_seen = B.evaluate("ng.enemyShots.flat().filter(v => v).length")
    pend = A.evaluate("ng.playerShots.flat().filter(v => v === 'pend').length") + B.evaluate("ng.playerShots.flat().filter(v => v === 'pend').length")
    print('   A marks', a_marks, '| B sees', b_seen, '| still pending', pend)
    check(a_marks == shots['A'] and pend == 0, "every one of A's shots is drawn on A's map")
    A.screenshot(path='test/shots/np_lossy.png')
    done(A, B)
