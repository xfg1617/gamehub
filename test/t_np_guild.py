"""Castles & Kings online: 2 players + 1 computer seat pick characters and play turns; gold, hands and towns must match
on both screens.  Add 'real' for the real service."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
STATE = "(() => { const G = GAME_MODS.guild.engine.G; return G ? JSON.stringify([G.round, G.players.map(q => [q.gold, q.hand.length, q.city.map(c => c.name)])]) : ''; })()"
STEP = """(() => { const q = (s) => document.querySelector(s);
  let b = q('#gm-prompt [data-r]') || q('#gm-prompt [data-n]') || q('#gm-prompt [data-v="gold"]') || q('#gm-prompt [data-i]'); if (b) { b.click(); return 1; }
  b = q('#gm-done'); if (b) { const c = q('#gm-hand .gm-b.can:not(.sel)'); if (c) c.click(); q('#gm-done').click(); return 1; } return 0; })()"""
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'guild', 'room', {'n': 3, 'target': 6})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#gm-towns') and B.query_selector('#gm-towns'), 'the game started on both screens')
    same = looks = steps = 0; t0 = time.time()
    while time.time() - t0 < 150 and steps < 18:
        for pg in (A, B): steps += pg.evaluate(STEP)
        A.wait_for_timeout(600)
        sa, sb = A.evaluate(STATE), B.evaluate(STATE); looks += 1; same += sa == sb
    print(f'   {steps} choices by people; screens agreed {same}/{looks}; {A.evaluate(STATE)[:120]}')
    check(steps >= 10, 'both players made their choices')
    check(same >= looks * 0.7, 'both screens show the same gold, hands and towns')
    done(A, B)
