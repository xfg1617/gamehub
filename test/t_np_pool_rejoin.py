"""Pool rejoin (Inna, Nov 2026: "after I leave and rejoin pool it just lags"): 2 players shoot a few times, B reloads
and rejoins; the replay must finish quickly, the table must match A's, and the page must run smoothly afterwards."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
POS = "JSON.stringify(GAME_MODS.pool.engine.G.balls.filter(b => b.on).map(b => [b.n, Math.round(b.x), Math.round(b.y)]))"
FPS = "new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / 2); }; requestAnimationFrame(f); })"
def shoot_round(limit):
    shots = 0
    for k in range(40):
        if shots >= limit: break
        for pg in (A, B):
            if pg.evaluate("(() => { const G = GAME_MODS.pool.engine.G; return G && G.phase === 'aim' && G.S.mine(G.turn); })()"):
                pg.evaluate("document.getElementById('pl-cv').focus()"); pg.keyboard.press(' '); shots += 1; pg.wait_for_timeout(6500); break
        else: A.wait_for_timeout(700)
    return shots
with sync_playwright() as p:
    A, B = players(p, 2)
    code = open_table(A, 'pool', 'room'); join(B, code); A.wait_for_timeout(3000)
    n = shoot_round(5); print('   shots before reload:', n)
    path = B.evaluate('location.pathname'); print('   address:', path); check(path.startswith('/r/'), 'the address bar shows the room link')
    B.reload(); B.wait_for_function("typeof NET !== 'undefined' && NET.on && NET.me", timeout=20000); B.wait_for_timeout(1500)
    t0 = time.time(); how = rejoin(B); print('   rejoin:', how)
    check(how == 'auto', "reloading the room's own address (/r/CODE) goes straight back to the seat")
    B.wait_for_function("!NP.catchup && GAME_MODS.pool.engine.G && GAME_MODS.pool.engine.G.phase === 'aim'", timeout=40000)
    took = time.time() - t0; B.wait_for_timeout(1500)
    print('   replay took %.1f s' % took)
    check(took < 8, 'the replay finishes quickly')
    pa, pb = A.evaluate(POS), B.evaluate(POS)
    if pa != pb: print("   A", pa, "\n   B", pb)
    check(pa == pb, "both screens show the balls in the same places")
    fa, fb = A.evaluate(FPS), B.evaluate(FPS)
    print('   frames per second: A', fa, 'B', fb)
    check(fb > 0.6 * fa, 'B runs as smoothly as A after rejoining')
    m = shoot_round(2); check(m >= 1, 'play goes on after the rejoin')
    done(A, B)
