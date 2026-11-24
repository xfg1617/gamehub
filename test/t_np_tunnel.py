"""Mine Saboteurs online: 2 players + 1 computer seat take turns; the map, hands and broken tools must match on
both screens, and each screen only shows its own secret role.  Add 'real' for the real service."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
STATE = "(() => { const G = GAME_MODS.tunnel.engine.G; return G ? JSON.stringify([[...G.board.keys()].sort(), G.players.map(q => [q.hand.length, q.broken.pick, q.broken.lamp]), G.deck.length]) : ''; })()"
MOVE = """(() => { const G = GAME_MODS.tunnel.engine.G; if (!G || !G.myK || G.over) return 0; const me = G.players[G.me];
  const a = GAME_MODS.tunnel.engine.botMove(G, me); G.sel = a.i; G.draw && 0;
  const k = G.myK; G.myK = null; G.S.act(Object.assign({ s: G.me, k }, a)); return 1; })()"""
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'tunnel', 'room', {'n': 3})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#tt-board') and B.query_selector('#tt-board'), 'the game started on both screens')
    ra, rb = A.inner_text('.tt-role'), B.inner_text('.tt-role')
    roles = A.evaluate("GAME_MODS.tunnel.engine.G.players.map(q => q.role)")
    check(('RASCAL' in ra) == (roles[A.evaluate('GAME_MODS.tunnel.engine.G.me')] == 'rascal') and ('RASCAL' in rb) == (roles[B.evaluate('GAME_MODS.tunnel.engine.G.me')] == 'rascal'), 'each screen shows its own secret role')
    same = looks = moves = 0; t0 = time.time()
    while time.time() - t0 < 120 and moves < 10:
        for pg in (A, B): moves += pg.evaluate(MOVE)
        A.wait_for_timeout(700)
        sa, sb = A.evaluate(STATE), B.evaluate(STATE)
        looks += 1; same += sa == sb
        if A.evaluate("GAME_MODS.tunnel.engine.G.over"): break
    print(f'   {moves} moves by people; screens agreed {same}/{looks}')
    check(moves >= 6, 'both players took turns')
    check(same >= looks * 0.7, 'both screens show the same map, hands and tools')
    done(A, B)
