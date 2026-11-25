"""Sea Battle rejoin (Nov 2026): both deploy, a few shots each, then B reloads and rejoins. B's fleet comes back
exactly where it was (saved privately on B's device, never sent to A), every shot so far is back on both of B's
maps and matches A's, and the battle goes on."""
import sys, random, time; sys.path.insert(0, 'test')
from nplib import *
MY_TURN = "ng.phase === 'battle' && ng.playerTurn"
FLEET = "JSON.stringify(ng.playerShips.map(s => s.id + ':' + s.cells.map(c => c.r + '' + c.c).join('.')).sort())"
MARKS_ME = "JSON.stringify(ng.playerShots.map(r => r.map(v => v ? (v === 'pend' ? 'p' : String(v)[0]) : '.').join('')))"
MARKS_ON_ME = "JSON.stringify(ng.enemyShots.map(r => r.map(v => v ? String(v)[0] : '.').join('')))"
def fire(pg):
    free = pg.evaluate("(() => { const o = []; for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) if (ng.playerShots[r][c] === null) o.push([r, c]); return o; })()")
    r, c = random.choice(free); pg.evaluate(f"clickEnemyCell({r}, {c}); clickEnemyCell({r}, {c})")
def battle(n):
    shots = 0; t0 = time.time()
    while shots < n and time.time() - t0 < 120:
        for pg in (A, B):
            if pg.evaluate(MY_TURN): fire(pg); shots += 1; pg.wait_for_timeout(1500); break
        else: A.wait_for_timeout(400)
    A.wait_for_timeout(2500)
    return shots
with sync_playwright() as p:
    A, B = players(p, 2)
    A.evaluate("openSetup('naval')"); A.wait_for_timeout(600)
    code = open_table(A, 'naval', 'room'); join(B, code); A.wait_for_timeout(3000)
    A.click('#ng-deploy-btn'); B.click('#ng-deploy-btn'); A.wait_for_timeout(2500)
    check(A.query_selector('#game-root #ng-battle-view:not(.hidden)') and B.query_selector('#game-root #ng-battle-view:not(.hidden)'), 'both on the battle boards')
    fleetB = B.evaluate(FLEET)
    bkey = B.evaluate(f"'ps_ng_fleet:{code}:' + NET.me.id")
    check(B.evaluate(f"JSON.parse(localStorage.getItem('{bkey}') || '[]').length") == 5, 'B saved its own fleet on its device (5 ships)')
    print('   shots:', battle(8))
    a_marks, b_seen = A.evaluate(MARKS_ME), B.evaluate(MARKS_ON_ME)
    B.reload(); B.wait_for_function("typeof NET !== 'undefined' && NET.on && NET.me", timeout=20000); B.wait_for_timeout(1500)
    how = rejoin(B); check(how in ('offer', 'auto'), 'after a reload B goes back to Sea Battle (' + how + ')')
    B.wait_for_function("!NP.catchup && ng && ng.phase === 'battle'", timeout=40000); B.wait_for_timeout(3000)
    check(B.evaluate(FLEET) == fleetB, "B's ships are back exactly where they were")
    check(B.evaluate(MARKS_ON_ME) == A.evaluate(MARKS_ME), "A's shots are back on B's own map, the same as A sees them")
    check(B.evaluate(MARKS_ME) == A.evaluate(MARKS_ON_ME), "B's shots are back on B's target map, the same as A sees them")
    B.screenshot(path='test/shots/naval_rejoin.png')
    print('   shots after rejoin:', battle(4))
    check(B.evaluate(MARKS_ON_ME) == A.evaluate(MARKS_ME) and B.evaluate(MARKS_ME) == A.evaluate(MARKS_ON_ME), 'the battle goes on and both screens still agree')
    sent = A.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('psnet_db') || '{}'))")
    check(fleetB.split(':')[1][:6] not in sent and 'ps_ng_fleet' not in sent, "B's fleet is never sent over the table (not in the shared game data)")
    done(A, B)
