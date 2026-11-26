"""Blackjack online: 2 players + 2 computer seats, 3 hands. Everyone bets, plays in turn, the dealer plays;
chip counts must match on both screens and the table ends with the same ranking.  Add 'real' for the real service."""
import sys, random; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
CHIPS = "[...document.querySelectorAll('#bjo-seats .bjs')].sort((a, b) => a.id.localeCompare(b.id)).map(s => s.id + ' ' + (s.querySelector('.tg-txt') || s).innerText.replace(/\\s+/g, ' ')).join(' | ')"
def act(pg):
    pick = random.choice(['bjo-hit', 'bjo-stand'])
    return pg.evaluate("""(pick) => { const b = document.getElementById('bjo-bet'); if (b) { b.click(); return true; }
      const h = document.getElementById(pick); if (h) { h.click(); return true; } return false; }""", pick)
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'blackjack', 'room', {'hands': 5})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2000)
    check(A.query_selector('#bjo') and B.query_selector('#bjo'), 'the table opened on both screens')
    t0 = time.time(); acted = 0; seen = []
    while time.time() - t0 < (240 if REAL else 160):
        if A.evaluate("!!(document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden'))"): break
        moved = False
        for pg in (A, B):
            if act(pg): acted += 1; moved = True; pg.wait_for_timeout(600)
        if not moved: A.wait_for_timeout(700)
        if A.evaluate("document.getElementById('bjo-msg') && document.getElementById('bjo-msg').textContent.match(/^[+-]|Watching/) !== null") : seen.append((A.evaluate(CHIPS), B.evaluate(CHIPS)))
    check(acted >= 6, f'{acted} human bets/moves')
    check(seen and all(a == b for a, b in seen[-3:]), 'chip counts match after hands: ' + (seen[-1][0] if seen else '-'))
    ra, rb = modal_text(A, 30000), modal_text(B, 30000)
    print('   A sees:', ra[:130]); print('   B sees:', rb[:130])
    import re
    rk = lambda t: re.sub(r'POINTS \+\d+', '', t.split('Most chips')[1]).split('Back to')[0].strip()
    check(ra and rk(ra) == rk(rb) and len(re.findall(r'\d+', rk(ra))) >= 4, 'same final ranking on both screens, every player listed')
    A.screenshot(path='test/shots/np_bj.png')
    done(A, B)
