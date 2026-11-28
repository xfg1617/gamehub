"""Case Files #002 online: two partners get the SAME version of the shuffled case (same culprit, same times, same code),
A searches with the tool belt and bags things, B sees them arrive in the lab and runs tests, the results and pinned
camera frames show on both boards, and the timeline wall is shared. Prints no solutions."""
import sys; sys.path.insert(0, 'test')
from nplib import *
E = "GAME_MODS.casefiles.engine"
with sync_playwright() as p:
    A, B = players(p, 2)
    code = open_table(A, 'casefiles', 'room', {'case': 'gallery', 'ver': 'shuffle'})
    join(B, code); A.wait_for_timeout(3000)
    same = A.evaluate(f"[{E}.G.C.id, {E}.G.C.W, {E}.G.C.code, {E}.G.C.culprit].join('|')") == B.evaluate(f"[{E}.G.C.id, {E}.G.C.W, {E}.G.C.code, {E}.G.C.culprit].join('|')")
    check(A.evaluate(f"{E}.G.C.id") == 'gallery' and same, 'both partners get the same version of Case #002')
    check(A.evaluate(f"{E}.G.role") == 'A' and B.evaluate(f"{E}.G.role") == 'B', 'A has the scene, B the control room')
    A.click('[data-tab="inv"]'); A.click('[data-tool="bag"]'); A.click('.cf-it[data-item="0"]'); A.wait_for_timeout(1500)
    B.click('[data-tab="inv"]'); B.wait_for_timeout(200)
    check(B.query_selector('.cf-cam') is not None, 'B sees the camera screens')
    B.click('[data-ctab="lab"]'); B.wait_for_timeout(200)
    check(B.query_selector('[data-labsel]') is not None, 'the bagged painting arrives in B\'s lab')
    B.click('[data-test="mag"]'); B.wait_for_timeout(300); B.click('[data-pin^="lab:"]')
    W = B.evaluate(f"{E}.G.C.W")
    B.click('[data-ctab="cams"]'); B.click('[data-cam="c2"]')
    B.evaluate(f"(() => {{ const s = document.getElementById('cf-slider'); s.value = {W + 4}; s.dispatchEvent(new Event('input', {{ bubbles: true }})); }})()")
    B.click('[data-pinframe]'); B.wait_for_timeout(1800)
    pa = A.evaluate(f"{E}.G.pins.map(p => p.id).sort().join()"); pb = B.evaluate(f"{E}.G.pins.map(p => p.id).sort().join()")
    check(pa == pb and 'cam:c2:' in pa and 'lab:' in pa, 'lab result and camera frame are on both boards')
    A.click('[data-tab="board"]'); A.click('[data-btab="tl"]'); A.click('[data-tladd]'); A.wait_for_timeout(1500)
    check(B.evaluate(f"{E}.G.tl.length") == 1, 'the timeline wall is shared')
    check(not A.errs and not B.errs, f'no page errors {A.errs[:2]} {B.errs[:2]}')
    done()
