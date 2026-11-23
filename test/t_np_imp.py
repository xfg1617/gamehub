"""Find the Impostor: offline round (you vs 4 computer players), then online with 3 players + 1 computer:
everyone types a hint in turn, everyone votes, the same verdict shows on every screen.  Add 'real' for the real service."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
def act(pg, word):
    return pg.evaluate("""(word) => {
      const r = document.getElementById('im-flip'); if (r && document.getElementById('im-ready').disabled) { r.click(); return 'flip'; }
      const rd = document.getElementById('im-ready'); if (rd) { rd.click(); return 'ready'; }
      const inp = document.getElementById('im-in'); if (inp) { inp.value = word; document.getElementById('im-send').click(); return 'hint'; }
      const v = document.querySelector('[data-v]'); if (v) { v.click(); return 'vote'; }
      const g = document.querySelector('[data-g]'); if (g) { g.click(); return 'guess'; }
      return null; }""", word)
def play(pgs, secs):
    t0 = time.time(); did = {}
    while time.time() - t0 < secs:
        if all(pg.query_selector('#im-again') for pg in pgs): break
        moved = False
        for k, pg in enumerate(pgs):
            r = act(pg, ['sunny', 'crunchy', 'loud'][k % 3])
            if r: did[r] = did.get(r, 0) + 1; moved = True; pg.wait_for_timeout(300)
        if not moved: pgs[0].wait_for_timeout(500)
    return did
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    pg.evaluate("openGame('impostor')"); pg.wait_for_timeout(300); pg.click('#su-go'); pg.wait_for_timeout(500)
    print('   offline:', play([pg], 60), pg.evaluate("(document.querySelector('#im-main .winbar') || {}).innerText"))
    check(pg.query_selector('#im-again') is not None and not pg.errs, 'an offline round finishes')
    A, B, C = players(p, 3, REAL)
    code = open_table(A, 'impostor', 'room', {'n': 4, 'clock': 30})
    join(B, code); join(C, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    did = play([A, B, C], 150 if REAL else 100)
    print('   online actions:', did)
    va = [pg.evaluate("(document.querySelector('#im-main .text-sm.font-bold') || {}).innerText") for pg in (A, B, C)]
    print('   verdicts:', va)
    check(did.get('hint', 0) >= 3 and did.get('vote', 0) >= 3, 'three people typed hints and voted')
    check(va[0] and va[0] == va[1] == va[2], 'the same verdict on every screen')
    done(A, B, C)
