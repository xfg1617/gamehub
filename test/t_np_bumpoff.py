"""Bump Off online: 3 people at one table (+ 1 computer boat). Plans are made on each screen with READY, everyone moves
at once, and after every turn all screens show the boats in the same places; the match ends with the same winner."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
E = "GAME_MODS.bumpoff.engine"
POS = f"(() => {{ const G = {E}.G; return G ? G.round + '/' + G.turn + ':' + G.boats.map(b => b.alive ? Math.round(b.x) + ',' + Math.round(b.y) : 'x').join(' ') : ''; }})()"
with sync_playwright() as p:
    A, B, C = players(p, 3)
    for pg in (A, B, C): pg.evaluate('window.__fast = false')
    code = open_table(A, 'bumpoff', 'room', {'n': 4, 'to': 2, 'secs': 8, 'spawn': 'ring'})
    join(B, code); join(C, code); A.wait_for_timeout(2500)
    start(A); A.wait_for_timeout(3000)
    check(all(pg.query_selector('#bo-cv') for pg in (A, B, C)), 'the pond is open on all three screens')
    t0 = time.time(); synced = mism = 0; lastkey = ''
    while time.time() - t0 < 240:
        if all(pg.evaluate("!!document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden')") for pg in (A, B, C)): break
        for pg in (A, B, C):
            st = pg.evaluate(f"(() => {{ const G = {E}.G; return G && G.phase === 'plan' && G.boats[G.me].alive && !G.sent; }})()")
            if st:
                pg.evaluate(f"(() => {{ const G = {E}.G, m = G.boats[G.me], o = G.boats.find((b, i) => b.alive && i !== G.me); G.plan = {{ a: Math.atan2(o.y - m.y, o.x - m.x), pow: 0.75 }}; }})()")
                pg.evaluate(f'{E}.send()')
        # after each turn: compare the boats on every screen
        if all(pg.evaluate(f"{E}.G && {E}.G.phase") == 'plan' for pg in (A, B, C)):
            ps = [pg.evaluate(POS) for pg in (A, B, C)]
            if ps[0] != lastkey and ps[0].split(':')[0] == ps[1].split(':')[0] == ps[2].split(':')[0]:
                lastkey = ps[0]; synced += 1
                if not (ps[0] == ps[1] == ps[2]): mism += 1; print('   differ:', ps)
        A.wait_for_timeout(300)
    txt = [modal_text(pg, 5000) for pg in (A, B, C)]
    print('  ', txt[0][:110])
    check(all(txt), 'the match ended on all three screens')
    check(synced >= 2 and mism == 0, f'after every turn all screens show the boats in the same places ({synced} turns checked)')
    wins = [pg.evaluate(f"{E}.G.players.map(p => p.wins).join(',')") for pg in (A, B, C)]
    check(len(set(wins)) == 1, 'every screen agrees on the rounds won: ' + wins[0])
    A.screenshot(path='test/shots/np_bumpoff_A.png')
    check(not any(pg.errs for pg in (A, B, C)), 'no page errors ' + str([pg.errs[:1] for pg in (A, B, C)]))
    done(A, B, C)
