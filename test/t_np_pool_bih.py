"""Pool online ball in hand (Inna: "can't see where the opponent places the ball after a foul"): while one player drags
the cue ball, the other screen shows it moving there; and every break leaves the balls in a different spot."""
import sys; sys.path.insert(0, 'test')
from nplib import *
from tlib import launch as _l
E = "GAME_MODS.pool.engine"
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    # breaks differ: the same aim and power twice on two new racks
    res = pg.evaluate(f"""(() => {{ const e = {E}, out = [];
      for (let k = 0; k < 3; k++) {{ const b = e.rack(); e.applyStrike(b[0], Math.atan2(e.FOOT[1] - b[0].y, e.FOOT[0] - b[0].x), e.VMAX * 0.85, 0, 0); e.run(b, 8, {{}}); out.push(b.filter(q => q.on).map(q => q.n + ':' + Math.round(q.x) + ',' + Math.round(q.y)).sort().join(' ')); }}
      return out; }})()""")
    check(len(set(res)) == 3, 'three identical breaks end with the balls in three different places')
    pg.context.close()
    A, B = players(p, 2)
    code = open_table(A, 'pool', 'room'); join(B, code); A.wait_for_timeout(3000)
    # whoever's turn it is gets ball in hand (as after a foul)
    shooter, watcher = (A, B) if A.evaluate(f"{E}.G.S.mine({E}.G.turn)") else (B, A)
    for q in (A, B): q.evaluate(f"(() => {{ const G = {E}.G; G.bih = true; }})()")
    shooter.evaluate(f"(() => {{ const G = {E}.G; G.placing = true; G.ghost = [300, 150]; }})()")
    watcher.wait_for_timeout(1500)
    pos = watcher.evaluate(f"(() => {{ const c = {E}.G.balls[0]; return [Math.round(c.x), Math.round(c.y)]; }})()")
    print('   watcher sees the cue ball at', pos)
    check(abs(pos[0] - 300) < 4 and abs(pos[1] - 150) < 4, 'the other player sees the cue ball where it is being dragged')
    shooter.evaluate(f"(() => {{ const G = {E}.G; G.ghost = [420, 330]; }})()"); watcher.wait_for_timeout(1200)
    pos = watcher.evaluate(f"(() => {{ const c = {E}.G.balls[0]; return [Math.round(c.x), Math.round(c.y)]; }})()")
    check(abs(pos[0] - 420) < 4 and abs(pos[1] - 330) < 4, 'and follows it as it moves')
    done(A, B)
