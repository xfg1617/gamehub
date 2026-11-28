"""Case Files #002 (replayable): every version (each possible culprit x 3 time nudges x a few guard codes) must be fair:
the gallery camera is off for the whole swap, the culprit is never seen during it, every innocent suspect is either seen
(hall camera or a photo) or has a record that clears them, the culprit walks past the corridor camera, the answer is
among the choices and the key clues exist. Prints NO solutions."""
import sys; sys.path.insert(0, 'test')
from tlib import *
E = 'GAME_MODS.casefiles.engine'
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1200, 800)
    pg.evaluate("openGame('casefiles')"); pg.wait_for_timeout(400)
    if pg.query_selector('[data-mode="solo"]'): pg.click('[data-mode="solo"]')
    pg.evaluate("(() => { const b = [...document.querySelectorAll('#gs-body button')].find(x => /^\\s*(start|play)/i.test(x.textContent)); b && b.click(); })()")
    pg.wait_for_timeout(600)
    res = pg.evaluate(f"""(() => {{ const base = {E}.cases().find(c => c.id === 'gallery'), out = [], seen = new Set();
      for (let v = 0; v < base.variants; v++) for (let off = 0; off < 3; off++) for (const code of ['4417', '1000', '9876']) {{
        const C = base.make({{ v, off, code }}); seen.add(C.variant); const bad = {E}.fair(C); if (bad.length) out.push('version ' + v + '/' + off + ': ' + bad.join('; ')); }}
      return {{ out, n: seen.size }}; }})()""")
    for line in res['out']: print('FAIL', line)
    print('PASS' if not res['out'] else 'FAIL', f"all {res['n']} culprits x 3 time nudges x 3 codes are fair")
    print('PASS' if not pg.errs else 'FAIL', 'no page errors', pg.errs[:3])
    sys.exit(1 if res['out'] or pg.errs else 0)
