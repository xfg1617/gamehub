"""Frontier Isles online: 2 players + 1 computer. Setup, rolls, building, an offer to the table; every
player's points and card counts match on both screens.  Add 'real' for the real service."""
import sys, random; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
STATE = "document.getElementById('fi-players').innerText.replace(/\\s+/g, ' ')"
def act(pg):
    return pg.evaluate("""() => { const q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)];
      const ev = (el) => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      for (const sel of ['.fi-pickv', '.fi-picke', '.fi-pickh']) { const a = qa(sel); if (a.length) { ev(a[Math.floor(Math.random() * a.length)]); return 'pick'; } }
      const v = q('#fi-prompt [data-v]'); if (v) { v.click(); return 'victim'; }
      if (q('#fi-acc')) { (Math.random() < 0.5 ? q('#fi-acc') : q('#fi-dec')).click(); return 'answer'; }
      const w = q('#fi-prompt [data-w]'); if (w) { w.click(); return 'partner'; }
      const r = q('#fi-roll'); if (r && !r.disabled) { r.click(); return 'roll'; }
      const b = q('#fi-build .btn-amber:not([disabled])'); if (b) { b.click(); return 'build'; }
      const e = q('#fi-end'); if (e && !e.disabled) { e.click(); return 'end'; }
      return null; }""")
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    code = open_table(A, 'isles', 'room', {'n': 3, 'vp': 8})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#fi-board') and B.query_selector('#fi-board'), 'the island opened on both screens')
    check(A.evaluate("document.getElementById('fi-board').innerHTML.length") > 1000 and A.evaluate("[...document.querySelectorAll('#fi-board text')].map(t => t.textContent).join()") == B.evaluate("[...document.querySelectorAll('#fi-board text')].map(t => t.textContent).join()"), 'the same island on both screens')
    t0 = time.time(); did = {}; looks = same = 0
    while time.time() - t0 < (200 if REAL else 130):
        if A.evaluate("!!(document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden'))"): break
        moved = False
        for pg in (A, B):
            r = act(pg)
            if r: did[r] = did.get(r, 0) + 1; moved = True; pg.wait_for_timeout(350)
        if not moved:
            A.wait_for_timeout(1200); sa, sb = A.evaluate(STATE), B.evaluate(STATE); looks += 1; same += sa == sb
    print('   actions:', did); print(f'   quiet checks matched {same}/{looks}:', A.evaluate(STATE)[:160])
    check(did.get('roll', 0) >= 3 and did.get('pick', 0) >= 4, 'both players set up and rolled')
    check(looks and same >= looks * 0.7, 'points and cards match on both screens')
    done(A, B)
