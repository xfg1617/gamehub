"""Bowling physics sanity: pocket hits strike often, head-on hits split more, gutter balls score 0,
and simulated bot games land in realistic score ranges."""
import sys; sys.path.insert(0, 'test')
from tlib import *
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    r = pg.evaluate("""(() => {
      const E = GAME_MODS.bowling.engine, all = [0,1,2,3,4,5,6,7,8,9];
      const rate = (fn, n) => { let s = 0, pins = 0; for (let i = 0; i < n; i++) { const k = fn().knocked.length; pins += k; if (k === 10) s++; } return [s / n, pins / n]; };
      const pocketHook = rate(() => E.rollSim(all, 0.24, -0.006 + (Math.random() - .5) * 0.004, 8.1, -0.55), 120);
      const out = {};
      // find the angle for a hooking pocket hit with the same bisection the bot uses
      const plan = (x0, tx, sp, spin) => { let lo = -0.1, hi = 0.1; for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (E.pathX(x0, m, sp, spin) < tx) lo = m; else hi = m; } return (lo + hi) / 2; };
      const aHook = plan(0.24, 0.07, 8.1, -0.55), aHead = plan(0, 0, 8, 0), aBrook = plan(-0.24, -0.07, 8.1, 0.55);
      out.pocketHook = rate(() => E.rollSim(all, 0.24, aHook, 8.1, -0.55), 150);
      out.headOn = rate(() => E.rollSim(all, 0, aHead, 8, 0), 150);
      out.brooklyn = rate(() => E.rollSim(all, -0.24, aBrook, 8.1, 0.55), 150);
      out.gutter = rate(() => E.rollSim(all, 0.45, 0.03, 7, 0), 20);
      out.slowStraightPocket = rate(() => E.rollSim(all, 0.07, plan(0.07, 0.07, 5, 0), 5, 0), 150);
      // whole games with the bot's own aiming
      const game = (skill) => { const rolls = []; let fs; let standing = all.slice(); let guard = 0;
        while (!(fs = E.frameState(rolls)).done && guard++ < 40) { const pl = E.botPlan(standing, skill); const res = E.rollSim(standing, pl.x0, pl.ang, pl.speed, pl.spin); rolls.push(res.knocked.length);
          const nf = E.frameState(rolls); const left = standing.filter((i) => !res.knocked.includes(i));
          standing = (nf.f !== fs.f || left.length === 0) ? all.slice() : left; }
        return E.scoreFrames(rolls).total; };
      const avg = (skill, n) => { const a = []; for (let i = 0; i < n; i++) a.push(game(skill)); a.sort((x, y) => x - y); return [Math.round(a.reduce((s, v) => s + v, 0) / n), a[0], a[n - 1]]; };
      out.proGames = avg(2, 40); out.casualGames = avg(1, 40);
      const t0 = performance.now(); for (let i = 0; i < 20; i++) E.rollSim(all, 0.2, -0.004, 8, -0.4); out.msPerRoll = Math.round((performance.now() - t0) / 20);
      return out; })()""")
    for k, v in r.items(): print(k, v)
    print(pg.errs)
