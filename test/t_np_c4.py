"""Four-in-a-Row online: private room, the two players drop discs until someone wins; boards identical,
the result shows on both screens. Then a ranked quick match where one player resigns.  Add 'real' for the real service."""
import sys, random; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
BOARD = "[...document.querySelectorAll('.c4n-cell')].map(c => { const d = c.querySelector('.c4n-disc'); return d ? (d.classList.contains('a') ? 'a' : 'c') : '.'; }).join('')"
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'c4', 'room', {'clock': 30})
    join(B, code); A.wait_for_timeout(2500)
    check(A.query_selector('#c4n-board') and B.query_selector('#c4n-board'), 'both players see the board')
    drops = 0
    for k in range(80):
        if A.evaluate("!!(document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden'))"): break
        for pg in (A, B):
            if pg.evaluate("document.getElementById('c4n-status').textContent") == 'YOUR TURN':
                cols = pg.evaluate("[...document.querySelectorAll('.c4n-col.can')].map(c => +c.dataset.c)")
                if cols: pg.evaluate(f"document.querySelector('.c4n-col[data-c=\"{random.choice(cols[:3])}\"]').click()"); drops += 1; pg.wait_for_timeout(900 if REAL else 600); break
        else: A.wait_for_timeout(400)
    A.wait_for_timeout(1200)
    check(drops >= 7 and A.evaluate(BOARD) == B.evaluate(BOARD), f'{drops} discs dropped, boards identical')
    ra, rb = modal_text(A), modal_text(B); print('   A sees:', ra[:90]); print('   B sees:', rb[:90])
    check(ra and rb, 'result on both screens')
    for pg in (A, B): pg.evaluate("document.getElementById('g-modal').classList.add('hidden')"); open_table(pg, 'c4', 'quick'); pg.wait_for_timeout(500)
    A.wait_for_timeout(3000)
    check(A.query_selector('#c4n-board') and B.query_selector('#c4n-board'), 'quick match paired them')
    B.click('#c4n-quit'); B.click('#c4n-quit')
    r = modal_text(A, 40000); print('   A sees:', r[:120])
    check('resigned' in r, 'resigning ends it on the other screen')
    if REAL: check('(+' in r, 'ranked Elo went up')
    done(A, B)
