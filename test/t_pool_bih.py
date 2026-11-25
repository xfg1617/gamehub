"""Pool ball in hand (Nov 2026, Inna: "drag and drop the ball after a foul, and be able to move it again"):
after a foul the player presses, drags the cue ball and lets go; they can then pick it up and move it again
before shooting; a bad spot (on another ball) is refused."""
import sys; sys.path.insert(0, 'test')
from tlib import *
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1690, 903)
    pg.evaluate("navigateTo('play', true); openGame('pool')"); pg.wait_for_timeout(300)
    if pg.query_selector('#su-go'): pg.click('#su-go')
    pg.wait_for_timeout(1500)
    E = "GAME_MODS.pool.engine"
    pg.evaluate(f"(() => {{ const G = {E}.G; G.bih = true; G.turn = G.me; G.phase = 'aim'; G.placing = true; }})()")
    box = pg.query_selector('#pl-cv').bounding_box(); sx = box['width'] / 1000; sy = box['height'] / 540
    to = lambda x, y: (box['x'] + x * sx, box['y'] + y * sy)
    cue = lambda: pg.evaluate(f"(() => {{ const c = {E}.G.balls[0]; return [Math.round(c.x), Math.round(c.y)]; }})()")
    # 1. press anywhere, drag, let go
    pg.mouse.move(*to(200, 200)); pg.mouse.down(); pg.mouse.move(*to(260, 230), steps=8); pg.mouse.move(*to(300, 380), steps=8)
    pg.wait_for_timeout(200); pg.screenshot(path='test/shots/pool_bih_drag.png')
    pg.mouse.up(); pg.wait_for_timeout(200)
    c = cue(); check(abs(c[0] - 300) < 3 and abs(c[1] - 380) < 3, f'first drag drops the cue ball where you let go {c}')
    check(not pg.evaluate(f"{E}.G.placing") and pg.evaluate(f"{E}.G.bih"), 'placed, and still in hand until the shot')
    # 2. pick it up again and move it
    pg.mouse.move(*to(300, 380)); pg.mouse.down(); pg.mouse.move(*to(220, 150), steps=10); pg.mouse.up(); pg.wait_for_timeout(200)
    c = cue(); check(abs(c[0] - 220) < 3 and abs(c[1] - 150) < 3, f'can drag it again to a new spot {c}')
    # 3. a spot on top of another ball is refused, the cue ball stays where it was
    b = pg.evaluate(f"(() => {{ const b = {E}.G.balls.find(b => b.n === 5); return [b.x, b.y]; }})()")
    pg.mouse.move(*to(220, 150)); pg.mouse.down(); pg.mouse.move(*to(b[0], b[1]), steps=10); pg.mouse.up(); pg.wait_for_timeout(300)
    c2 = pg.evaluate(f"(() => {{ const G = {E}.G; return G.placing; }})()")
    check(c2, 'dropping on another ball is refused (still placing)')
    pg.mouse.move(*to(150, 300)); pg.mouse.down(); pg.mouse.move(*to(160, 310), steps=4); pg.mouse.up(); pg.wait_for_timeout(200)
    c = cue(); check(abs(c[0] - 160) < 3 and abs(c[1] - 310) < 3, f'then a good spot works {c}')
    pg.screenshot(path='test/shots/pool_bih_placed.png')
    # 4. shoot from there
    bar = pg.query_selector('#pl-bar').bounding_box()
    pg.mouse.move(bar['x'] + bar['width'] - 20, bar['y'] + 20); pg.mouse.down(); pg.mouse.move(bar['x'] + bar['width'] * 0.5, bar['y'] + 20, steps=8); pg.mouse.up()
    pg.wait_for_timeout(500)
    check(pg.evaluate(f"{E}.G.phase") != 'aim' and not pg.evaluate(f"{E}.G.bih"), 'the shot goes off from the placed spot')
    check(not pg.errs, f'no page errors {pg.errs[:2]}')
    br.close()
print('ALL PASS' if not fails else f'{len(fails)} FAILED')
