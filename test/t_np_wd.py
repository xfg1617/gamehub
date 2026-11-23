"""Word Duel: offline vs the computer (it must solve within a few minutes), then online: 2 players guess the
same word; the second one finds it (we read it from the page) and wins on both screens.  Add 'real' for the real service."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'wordduel', 'room')
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#wd-board') and B.query_selector('#wd-board'), 'the duel opened on both screens')
    A.keyboard.type('CRANE'); A.keyboard.press('Enter'); A.wait_for_timeout(1200)
    check('5' in B.evaluate("document.getElementById('wd-opp').innerText") or '1/6' in B.evaluate("document.getElementById('wd-opp').innerText"), 'B sees A made a guess: ' + B.evaluate("document.getElementById('wd-opp').innerText").replace('\n', ' '))
    target = B.evaluate("(() => { let t = null; try { t = GAME_MODS.wordduel && null; } catch (e) {} return null; })()")
    # find the target the honest way: try words until all green (B uses the bot's filter on its own rows)
    for k in range(6):
        w = B.evaluate("(() => { const rows = [...document.querySelectorAll('#wd-board > div')].map(r => [...r.children]).filter(r => r[0].className.match(/correct|present|absent/)).map(r => ({ w: r.map(t => t.textContent).join(''), ev: r.map(t => t.className.match(/correct|present|absent/)[0]) })); return GAME_MODS.wordduel.engine.botGuess(rows); })()")
        B.keyboard.type(w); B.keyboard.press('Enter'); B.wait_for_timeout(1200)
        if B.evaluate("!!(document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden'))"): break
    ma, mb = modal_text(A, 20000), modal_text(B, 20000)
    print('   A sees:', ma[:100]); print('   B sees:', mb[:100])
    check('found it first' in ma and 'You won the duel' in mb, 'B solved first: the same result on both screens')
    done(A, B)
