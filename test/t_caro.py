"""Caro (five in a row): win checks incl. the Vietnamese blocked-ends rule, the computer levels against each other,
and a full match against the computer with real clicks.  python3 test/t_caro.py"""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
ok = True
def check(c, msg):
    global ok; ok = ok and bool(c); print(('PASS ' if c else 'FAIL ') + msg)
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    r = pg.evaluate("""(() => { const E = GAME_MODS.caro.engine, N = 15, b = () => Array(N * N).fill(null), at = (r, c) => r * N + c;
      const out = {};
      let x = b(); [0,1,2,3,4].forEach(k => x[at(7, 3 + k)] = 'X'); out.row = !!E.winAt(x, N, at(7, 5), false);
      x = b(); [0,1,2,3].forEach(k => x[at(2 + k, 2 + k)] = 'X'); out.four = !!E.winAt(x, N, at(3, 3), false);
      x = b(); [0,1,2,3,4].forEach(k => x[at(2 + k, 10 - k)] = 'O'); out.diag = !!E.winAt(x, N, at(4, 8), false);
      x = b(); [0,1,2,3,4].forEach(k => x[at(7, 3 + k)] = 'X'); x[at(7, 2)] = 'O'; x[at(7, 8)] = 'O';
      out.blockedOff = !!E.winAt(x, N, at(7, 5), false); out.blockedOn = !!E.winAt(x, N, at(7, 5), true);
      x[at(7, 8)] = null; out.oneEndOn = !!E.winAt(x, N, at(7, 5), true);
      x = b(); [0,1,2,3,4,5].forEach(k => x[at(9, 1 + k)] = 'X'); out.six = !!E.winAt(x, N, at(9, 3), false);
      // the computer finishes its own four and blocks yours
      x = b(); [0,1,2,3].forEach(k => x[at(5, 4 + k)] = 'O'); out.takesWin = [at(5, 3), at(5, 8)].includes(E.aiMove(x, N, 'O', 2));
      x = b(); [0,1,2,3].forEach(k => x[at(5, 4 + k)] = 'X'); x[at(5, 3)] = 'O'; out.blocks = E.aiMove(x, N, 'O', 2) === at(5, 8);
      // computer vs computer: Hard should beat Easy most of the time
      const play = (lx, lo) => { const g = b(); let t = 'X'; for (let m = 0; m < N * N; m++) { const i = E.aiMove(g.slice(), N, t, t === 'X' ? lx : lo); g[i] = t; if (E.winAt(g, N, i, false)) return t; t = t === 'X' ? 'O' : 'X'; } return 'draw'; };
      let hard = 0, n = 10; for (let k = 0; k < n; k++) { if (play(3, 1) === 'X') hard++; if (play(1, 3) === 'O') hard++; } out.hardVsEasy = hard + '/' + (2 * n);
      let med = 0; for (let k = 0; k < 5; k++) { if (play(3, 2) === 'X') med++; if (play(2, 3) === 'O') med++; } out.hardVsMed = med + '/10';
      const t0 = performance.now(); x = b(); for (let k = 0; k < 30; k++) x[Math.floor(Math.random() * N * N)] = k % 2 ? 'X' : 'O'; E.aiMove(x, N, 'X', 3); out.ms = Math.round(performance.now() - t0);
      return out; })()""")
    print(r)
    check(r['row'] and r['diag'] and not r['four'], 'five in a row wins (across / diagonal), four does not')
    check(r['blockedOff'] and not r['blockedOn'] and r['oneEndOn'], 'Vietnamese rule: blocked at both ends wins only with the rule off; one blocked end still wins')
    check(r['six'], 'six in a row also wins')
    check(r['takesWin'] and r['blocks'], 'computer takes its win and blocks your four')
    check(int(r['hardVsEasy'].split('/')[0]) >= 16, 'Hard beats Easy almost always: ' + r['hardVsEasy'])
    check(r['ms'] < 400, f"Hard move takes {r['ms']} ms")
    pg.evaluate("openGame('caro')"); pg.wait_for_timeout(300)
    pg.click('[data-k="lvl"][data-v="1"]'); pg.click('[data-k="len"][data-v="1"]'); pg.click('#su-go'); pg.wait_for_timeout(600)
    check(pg.query_selector('#cr-board') and pg.evaluate("document.querySelectorAll('.cr-c').length") == 225, '15x15 board drawn')
    pg.screenshot(path='test/shots/caro_start.png')
    t0 = time.time(); shot = False
    while time.time() - t0 < 60 and not pg.query_selector('#g-modal:not(.hidden)'):
        # play like the computer would (Medium) on our own turns, with real clicks
        i = pg.evaluate("(() => { const b = document.getElementById('cr-board'); if (!b || b.classList.contains('wait')) return -1; const G = GAME_MODS.caro.engine.state(); if (!G || G.done) return -1; return GAME_MODS.caro.engine.aiMove(G.b.slice(), G.N, G.turn, 3); })()")
        if i >= 0: pg.click(f'.cr-c[data-i="{i}"]')
        pg.wait_for_timeout(300)
        if not shot and time.time() - t0 > 8: pg.screenshot(path='test/shots/caro_mid.png'); shot = True
    pg.wait_for_timeout(400); pg.screenshot(path='test/shots/caro_end.png')
    check(pg.query_selector('#g-modal:not(.hidden)'), 'match finished: ' + pg.evaluate("(document.querySelector('#g-modal') || {}).innerText || ''")[:80].replace('\n', ' '))
    check(not pg.errs, 'no page errors ' + str(pg.errs[:2]))
    br.close()
print('ALL PASS' if ok else 'SOME FAILED')
