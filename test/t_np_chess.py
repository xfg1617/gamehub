"""Chess on the shared online table (Nov 2026): private room for two, colours from the shared dice (one White, one
Black, Black sees the board turned), 12 moves on both screens, positions identical; then B reloads, rejoins and gets
the same position back; finally a resignation ends it on the other screen.  Add 'real' for the real service."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
POS = """[...document.querySelectorAll('#ch-board .chsq')].sort((a, b) => a.dataset.i - b.dataset.i).map(c => { const s = c.querySelector('svg'); return s ? (s.outerHTML.replace(/ style="[^"]*"/g, '').length % 97) : '.'; }).join(',')"""
def mv(pg):
    if pg.evaluate("document.getElementById('ch-status').textContent") != 'YOUR MOVE': return False
    m = pg.evaluate("""(() => { const E = GAME_MODS.chess.engine; const G = E && GAME_MODS.chess; return null; })()""")
    # click one of my pieces that has a move, then its first target
    for sq in pg.evaluate("[...document.querySelectorAll('#ch-board .chsq')].filter(c => c.querySelector('svg')).map(c => c.dataset.i)"):
        pg.click(f'#ch-board [data-i="{sq}"]'); pg.wait_for_timeout(60)
        to = pg.evaluate("(document.querySelector('#ch-board .tmov, #ch-board .tcap') || {dataset: {}}).dataset.i")
        if to is not None:
            pg.click(f'#ch-board [data-i="{to}"]')
            pg.wait_for_timeout(80)
            if pg.query_selector('#ch-promo:not(.hidden) button'): pg.click('#ch-promo:not(.hidden) button')
            return True
    return False
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'chess', 'room', {'clock': 0, 'hints': 1})
    join(B, code); A.wait_for_timeout(2500)
    check(A.query_selector('#ch-board') and B.query_selector('#ch-board'), 'both players see the chess board')
    ca, cb = A.evaluate("document.querySelector('#ch-board .chsq').dataset.i"), B.evaluate("document.querySelector('#ch-board .chsq').dataset.i")
    check({ca, cb} == {'0', '63'}, 'one player is White, the other Black (board turned for Black)')
    moves = 0
    for k in range(80):
        if moves >= 12: break
        did = False
        for pg in (A, B):
            if mv(pg): moves += 1; did = True; pg.wait_for_timeout(1300 if REAL else 900); break
        if not did: A.wait_for_timeout(400)
    A.wait_for_timeout(1500)
    pa, pb = A.evaluate(POS), B.evaluate(POS)
    check(moves >= 12 and pa == pb, f'{moves} moves played, the same position on both screens')
    A.screenshot(path='test/shots/np_chess_A.png')
    # B drops out and comes back
    B.reload(); B.wait_for_function("typeof NET !== 'undefined' && NET.on && NET.me", timeout=20000); B.wait_for_timeout(1500)
    check(B.query_selector('#np-rj') is not None, 'after a reload B is offered to rejoin the chess game')
    B.click('[data-rj="yes"]'); B.wait_for_function("!NP.catchup && document.getElementById('ch-board')", timeout=40000); B.wait_for_timeout(2500)
    pa, pb = A.evaluate(POS).split(','), B.evaluate(POS).split(',')
    if pa != pb: print('   differ at', [(i, pa[i], pb[i]) for i in range(64) if pa[i] != pb[i]], '| A hist', A.evaluate("document.getElementById('ch-moves').innerText.replace(/\\n/g,' ')"), '| B hist', B.evaluate("document.getElementById('ch-moves').innerText.replace(/\\n/g,' ')"))
    check(pa == pb, 'after rejoining B sees the same position')
    for k in range(20):
        if mv(A) or mv(B): break
        A.wait_for_timeout(400)
    A.wait_for_timeout(1500)
    check(A.evaluate(POS) == B.evaluate(POS), 'play goes on after the rejoin')
    B.click('#ch-resign'); B.click('#ch-resign')
    r = modal_text(A); print('   A sees:', r[:140])
    check('resigned' in r and 'Victory' in r, 'resigning ends it on the other screen')
    done(A, B)
