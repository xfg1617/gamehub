"""Checkers online: private room, 10 moves played on both screens (the second player sees the board turned
around), boards stay identical, then a resignation ends it on the other screen.  Add 'real' for the real service."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
BOARD = "[...document.querySelectorAll('#ck-board .chsq')].sort((a, b) => a.dataset.i - b.dataset.i).map(c => { const d = c.querySelector('.disc'); return d ? (d.className.includes('amber') ? 'a' : 'c') : '.'; }).join('')"
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'checkers', 'room', {'clock': 0})
    join(B, code); A.wait_for_timeout(2500)
    check(A.query_selector('#ck-board') and B.query_selector('#ck-board'), 'both players see the board')
    first_sq = lambda pg: pg.evaluate("document.querySelector('#ck-board .chsq').dataset.i")
    check(first_sq(A) == '0' and first_sq(B) == '63', 'the second player sees the board turned around')
    moves = 0
    for k in range(60):
        if moves >= 10: break
        for pg in (A, B):
            if pg.evaluate("document.getElementById('ck-status').textContent") == 'YOUR MOVE':
                pc = pg.evaluate("(document.querySelector('#ck-board .ck-can') || {parentNode: {dataset: {}}}).parentNode.dataset.i")
                if pc is None: continue
                pg.click(f'#ck-board [data-i="{pc}"]'); pg.wait_for_timeout(150)
                to = pg.evaluate("(document.querySelector('#ck-board .tmov') || {dataset: {}}).dataset.i")
                if to is None: continue
                pg.click(f'#ck-board [data-i="{to}"]'); moves += 1; pg.wait_for_timeout(1300 if REAL else 900)
                break
        else: A.wait_for_timeout(400)
    A.wait_for_timeout(1500)
    ba, bb = A.evaluate(BOARD), B.evaluate(BOARD)
    check(moves >= 10 and ba == bb, f'{moves} moves played, boards identical on both screens')
    A.screenshot(path='test/shots/np_ck_A.png'); B.screenshot(path='test/shots/np_ck_B.png')
    B.click('#ck-resign'); B.click('#ck-resign')
    r = modal_text(A); print('   A sees:', r[:120])
    check('resigned' in r and 'Victory' in r, 'resigning ends it on the other screen')
    done(A, B)
