"""Wall Maze online: a private room with a friend; both screens play moves and hedges until someone wins, the
boards agree, and the second player's board is turned so their own pawn starts at the bottom."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
ST = "(() => { const G = GAME_MODS.hedge.engine.G; return G ? JSON.stringify([G.st.p, [...G.st.walls].sort(), G.st.turn]) : ''; })()"
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'hedge', 'room', {'n': 2})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#hr-board') and B.query_selector('#hr-board'), 'friend joined: both see the garden')
    check(B.evaluate("document.getElementById('hr-board').style.transform") == 'rotate(180deg)', "the second player's board is turned to face them")
    walls = 0
    for k in range(160):
        if A.evaluate("!!GAME_MODS.hedge.engine.G && GAME_MODS.hedge.engine.G.over") and B.evaluate("!!GAME_MODS.hedge.engine.G && GAME_MODS.hedge.engine.G.over"): break
        acted = False
        for pg in (A, B):
            if pg.evaluate("(() => { const G = GAME_MODS.hedge.engine.G; return G && !G.over && G.S.mine(G.st.turn); })()"):
                a = pg.evaluate("(() => { const G = GAME_MODS.hedge.engine.G; return GAME_MODS.hedge.engine.aiAction(G.st, G.me, 3); })()")
                if a['t'] == 'wall' and walls < 4:
                    pg.click('#hr-mwall'); pg.evaluate(f"document.querySelector('.hr-dot[data-wr=\"{a['r']}\"][data-wc=\"{a['c']}\"]').click()")
                    if pg.evaluate("GAME_MODS.hedge.engine.G.orient") != a['o']: pg.click('#hr-turn')
                    pg.click('#hr-place'); walls += 1
                else:
                    mv = pg.evaluate("(() => { const G = GAME_MODS.hedge.engine.G, E = GAME_MODS.hedge.engine; const m = E.aiAction(Object.assign({}, G.st, { left: G.st.left.map(() => 0) }), G.me, 3); return m; })()")
                    pg.evaluate(f"document.querySelector('.hr-cell[data-r=\"{mv['r']}\"][data-c=\"{mv['c']}\"]').click()")
                pg.wait_for_timeout(900); acted = True; break
        if not acted: A.wait_for_timeout(400)
        if k == 8:
            sa, sb = A.evaluate(ST), B.evaluate(ST)
            check(sa == sb, 'both screens show the same garden mid-game')
            A.screenshot(path='test/shots/np_hedge_a.png'); B.screenshot(path='test/shots/np_hedge_b.png')
    ra, rb = modal_text(A), modal_text(B)
    print('   A sees:', ra[:90]); print('   B sees:', rb[:90])
    check(('You win' in ra) != ('You win' in rb), 'one player wins on both screens')
    check(walls > 0, f'hedges were planted online ({walls})')
    done(A, B)
