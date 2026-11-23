"""Doodle Chain online: 3 players. Each writes a prompt, draws someone else's prompt (a few strokes), guesses
someone else's drawing; then every screen shows the same 3 chains.  Add 'real' for the real service."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
def act(pg, k):
    if pg.query_selector('#dd-cv'):
        box = pg.query_selector('#dd-cv').bounding_box()
        pg.mouse.move(box['x'] + 60 + k * 30, box['y'] + 60); pg.mouse.down(); pg.mouse.move(box['x'] + 200, box['y'] + 150, steps=6); pg.mouse.up()
        pg.click('#dd-ok'); return 'draw'
    t = pg.query_selector('#dd-txt')
    if t: t.fill(['a cat on a skateboard', 'pizza in space', 'a happy volcano'][k]); pg.click('#dd-ok'); return 'text'
    return None
with sync_playwright() as p:
    A, B, C = players(p, 3, REAL)
    code = open_table(A, 'doodle', 'room', {'speed': 60})
    join(B, code); join(C, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    did = {}; t0 = time.time()
    while time.time() - t0 < 90:
        if all(pg.query_selector('#dd-next') for pg in (A, B, C)): break
        moved = False
        for k, pg in enumerate((A, B, C)):
            r = act(pg, k)
            if r: did[r] = did.get(r, 0) + 1; moved = True; pg.wait_for_timeout(400)
        if not moved: A.wait_for_timeout(600)
    print('   actions:', did)
    ch = [pg.evaluate("document.getElementById('dd-main').innerText.replace(/\\s+/g, ' ')")[:200] for pg in (A, B, C)]
    for c in ch: print('   ', c[:150])
    imgs = A.evaluate("[...document.querySelectorAll('#dd-main img')].map(i => i.src.slice(0, 22))")
    check(did.get('draw', 0) >= 3 and did.get('text', 0) >= 6, 'everyone wrote, drew and guessed')
    check(ch[0] == ch[1] == ch[2] and 'CHAIN 1/3' in ch[0], 'every screen shows the same chain')
    check(imgs and imgs[0].startswith('data:image/jpeg'), f'the drawing travelled as a picture {imgs}')
    done(A, B, C)
