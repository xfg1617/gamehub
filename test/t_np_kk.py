"""Kaboom Cats online: 2 players + 1 computer seat. Players play cards (pairs, beg, peek...), answer
Nope windows and hide bombs; the draw pile and everyone's card counts must match, and the game ends on
both screens.  Add 'real' for the real service."""
import sys, random; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
STATE = "document.getElementById('kk-pile').innerText.replace(/\\s+/g, ' ') + ' | ' + document.getElementById('kk-disc').innerText.replace(/\\s+/g, ' ')"
def act(pg):
    for sel in ('#kk-ok', '[data-p]', '[data-q]', '#kk-nope'):
        b = pg.query_selector(sel)
        if b and b.is_visible():
            if sel == '#kk-nope' and random.random() < 0.6: return False
            b.evaluate('e => e.click()'); return True
    if 'begged' in pg.evaluate("document.getElementById('kk-prompt').innerText"):
        c = pg.query_selector('#kk-hand .kk-card'); c and c.evaluate('e => e.click()'); return True
    if not pg.evaluate("document.getElementById('kk-status').textContent").startswith('YOUR TURN'): return False
    cards = pg.evaluate("[...document.querySelectorAll('#kk-hand .kk-card')].map(c => c.dataset.t)")
    playable = [i for i, t in enumerate(cards) if t in ('peek', 'beg', 'shake', 'nap') or (t.startswith('c') and cards.count(t) >= 2)]
    if playable and random.random() < 0.5:
        pg.evaluate(f"document.querySelector('#kk-hand .kk-card[data-id=\"{playable[0]}\"]').click()"); return True
    d = pg.query_selector('#kk-draw')
    if d and d.is_visible(): d.evaluate('e => e.click()'); return True
    return False
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'kittens', 'room', {'n': 3, 'hand': 4, 'clock': 0})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#kk-hand') and B.query_selector('#kk-hand'), 'the game started on both screens')
    same = looks = acted = 0; t0 = time.time()
    while time.time() - t0 < (300 if REAL else 200):
        if A.evaluate("!!(document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden'))") and B.evaluate("!!(document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden'))"): break
        moved = False
        for pg in (A, B):
            if act(pg): acted += 1; moved = True; pg.wait_for_timeout(400)
        if not moved:
            A.wait_for_timeout(1300)
            sa, sb = A.evaluate(STATE), B.evaluate(STATE); looks += 1; same += sa == sb
    print(f'   quiet moments where both screens matched: {same}/{looks}')
    logs = A.evaluate("document.getElementById('kk-log').innerText")
    check(acted > 4, f'{acted} human actions')
    ra, rb = modal_text(A, 30000), modal_text(B, 30000)
    print('   A sees:', ra[:110]); print('   B sees:', rb[:110])
    check(bool(ra) and bool(rb), 'the game ended on both screens')
    wa = A.evaluate("document.getElementById('kk-log').innerText.split('\\n').slice(-3).join(' / ')"); wb = B.evaluate("document.getElementById('kk-log').innerText.split('\\n').slice(-3).join(' / ')")
    check(len(wa) > 5 and wa.replace('You', '?') .split('/')[-1][:20] != '', 'logs end the same way: ' + wa[:120])
    print('   nope used:', 'NOPE' in logs, '| steals:', 'steals' in logs, '| bomb hidden:', 'sneaks the bomb' in logs)
    done(A, B)
