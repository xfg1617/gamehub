"""Bump Off (Nov 2026): the three start settings place the boats as promised, the movement is repeatable (the same plans
always give the same result, so every online screen agrees), and a whole match against computers plays to the end
(planning with a real drag + READY, reveal, GO, splashes, round wins)."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
fails = []
def check(ok, msg):
    print(('PASS ' if ok else 'FAIL ') + msg)
    if not ok: fails.append(msg)
E = "GAME_MODS.bumpoff.engine"
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1440, 900)
    # start settings
    for mode in ['random', 'ring', 'close']:
        r = pg.evaluate(f"""(() => {{ let a = 7; const rng = {{ random: () => {{ a = (a * 16807) % 2147483647; return a / 2147483647; }} }};
          const pos = {E}.spawn(6, '{mode}', rng), d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
          let mn = 1e9; for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) mn = Math.min(mn, d(pos[i], pos[j]));
          const fromC = pos.map((q) => d(q, [180, 196])); return [mn, Math.min(...fromC), Math.max(...fromC)]; }})()""")
        print(f'   {mode}: closest pair {r[0]:.0f}, distance from the middle {r[1]:.0f}-{r[2]:.0f}')
        ok = {'random': r[0] >= 55 and r[2] <= 110, 'ring': abs(r[1] - r[2]) < 1 and r[1] > 95, 'close': r[0] >= 29 and r[2] <= 55}[mode]
        check(ok, f'start setting "{mode}" places the boats as described')
    same = pg.evaluate(f"""(() => {{ const b = [{{x:120,y:190,alive:true}},{{x:240,y:190,alive:true}},{{x:180,y:120,alive:true}}], pl = [{{vx:250,vy:0}},{{vx:-250,vy:0}},{{vx:0,vy:200}}];
      const a = JSON.stringify({E}.simulate(b, pl, 150).end), c = JSON.stringify({E}.simulate(b, pl, 150).end); return [a === c, a]; }})()""")
    check(same[0], 'the same plans always give the same result (online screens agree)')
    out = pg.evaluate(f"""(() => {{ const r = {E}.simulate([{{x:180,y:196,alive:true}},{{x:180+100,y:196,alive:true}}], [{{vx:330,vy:0}},{{vx:0,vy:0}}], 130); return r.outs; }})()""")
    check(out == [1], f'a full-power ram pushes a boat near the edge off the pond (out: {out})')
    # both last boats fall in on the same move: the one that stayed on longer is known (it wins the round, never "nobody")
    ends = pg.evaluate(f"{E}.simulate([{{x: 180, y: 70, alive: true}}, {{x: 180, y: 300, alive: true}}], [{{vx: 0, vy: -330}}, {{vx: 0, vy: 150}}], 150).end")
    print('   both fall in:', ends)
    check(not ends[0]['alive'] and not ends[1]['alive'] and ends[1]['out'] > ends[0]['out'] >= 0, 'when both fall in, the moment each went in is recorded (the later one wins)')
    # a whole match
    pg.evaluate("setupSave('bumpoff', Object.assign({}, setupLoad('bumpoff'), {n: 4, to: 2, secs: 8, spawn: 'random', lvl: 2}))")
    pg.evaluate("openGame('bumpoff')"); pg.wait_for_timeout(600)
    if pg.query_selector('[data-mode="here"]'): pg.click('[data-mode="here"]')
    pg.evaluate("(() => { const b = [...document.querySelectorAll('#gs-body button')].find(x => /^\\s*(start|play)/i.test(x.textContent)); b && b.click(); })()")
    pg.wait_for_timeout(1500)
    check(pg.query_selector('#bo-cv') is not None, 'the game opens with the pond')
    box = pg.query_selector('#bo-cv').bounding_box(); k = box['width'] / 360
    t0 = time.time(); turns = 0; shots = set()
    while time.time() - t0 < 200:
        if pg.evaluate("!!document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden')"): break
        ph = pg.evaluate(f"{E}.G && {E}.G.phase")
        if ph == 'plan' and pg.evaluate(f"(() => {{ const G = {E}.G; return G.boats[G.me].alive && !G.sent; }})()"):
            mx, my, ox, oy = pg.evaluate(f"(() => {{ const G = {E}.G, m = G.boats[G.me], o = G.boats.find((b, i) => b.alive && i !== G.me); return [m.x, m.y, o.x, o.y]; }})()")
            d = max(1, ((ox - mx) ** 2 + (oy - my) ** 2) ** .5)
            pg.mouse.move(box['x'] + mx * k, box['y'] + my * k); pg.mouse.down(); pg.mouse.move(box['x'] + (mx + (ox - mx) / d * 85) * k, box['y'] + (my + (oy - my) / d * 85) * k, steps=5); pg.mouse.up()
            if 'plan' not in shots: pg.screenshot(path='test/shots/bumpoff_plan.png'); shots.add('plan')
            turns += 1   # letting go locks the move in (no READY button)
        if ph == 'reveal' and 'reveal' not in shots: pg.wait_for_timeout(400); pg.screenshot(path='test/shots/bumpoff_reveal.png'); shots.add('reveal')
        pg.wait_for_timeout(200)
    txt = pg.evaluate("(document.getElementById('g-modal') || {innerText: ''}).innerText").replace('\n', ' ')
    print('   result:', txt[:120], f'({turns} of my turns)')
    check('wins' in txt.lower() or 'win!' in txt.lower(), 'the match plays to the end and shows the winner')
    check(not pg.errs, 'no page errors ' + str(pg.errs[:2]))
    m = open_page(br, 390, 844, True)
    m.evaluate("setupSave('bumpoff', Object.assign({}, setupLoad('bumpoff'), {n: 4}))"); m.evaluate("openGame('bumpoff')"); m.wait_for_timeout(600)
    if m.query_selector('[data-mode="here"]'): m.click('[data-mode="here"]')
    m.evaluate("(() => { const b = [...document.querySelectorAll('#gs-body button')].find(x => /^\\s*(start|play)/i.test(x.textContent)); b && b.click(); })()"); m.wait_for_timeout(1500)
    w = m.evaluate("document.documentElement.scrollWidth"); check(w <= 392, f'phone: no sideways scrolling ({w}px)')
    m.screenshot(path='test/shots/bumpoff_phone.png', full_page=True)
    br.close()
print('ALL PASS' if not fails else f'{len(fails)} FAIL'); sys.exit(1 if fails else 0)
