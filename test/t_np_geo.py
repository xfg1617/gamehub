"""Where Am I? online: 2 people + 1 computer at one table. Every screen gets the same photos, both people pin and
guess, every screen shows the same pins and scores after each photo, and the match ends with the same totals."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
E = "GAME_MODS.geo.engine"
with sync_playwright() as p:
    A, B = players(p, 2)
    code = open_table(A, 'geo', 'room', {'n': 3, 'rounds': 3, 'secs': 30, 'region': 'world'})
    join(B, code); A.wait_for_timeout(2000)
    start(A); A.wait_for_timeout(3000)
    check(all(pg.query_selector('#geo-map') for pg in (A, B)), 'the map is open on both screens')
    ids = [pg.evaluate(f"{E}.G && {E}.G.places.map(x => x.id).join(',')") for pg in (A, B)]
    check(ids[0] and ids[0] == ids[1], f'same photos on both screens ({ids[0]})')
    check(A.evaluate("document.getElementById('geo-pic').naturalWidth") > 300, 'the photo loads from the site')
    check(A.evaluate(f"{E}.G.places.length") and A.evaluate("Math.max(...[...document.querySelectorAll('#geo-map path')].map(p => (p.getAttribute('d') || '').length))") > 300000, 'the sharper map loads on the site')
    t0 = time.time(); rounds = {}; k = 0
    while time.time() - t0 < 150:
        if all(pg.evaluate("!!document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden')") for pg in (A, B)): break
        for i, pg in enumerate((A, B)):
            st = pg.evaluate(f"(() => {{ const G = {E}.G; return G && G.open && !G.sent ? [G.places[G.ri].lat, G.places[G.ri].lon] : null; }})()")
            if st: pg.evaluate(f"{E}.place({st[0] + (2 if i else 6)}, {st[1] + 3}); {E}.send()")
        for pg in (A, B):
            r = pg.evaluate(f"(() => {{ const G = {E}.G; return G && G.reveal ? G.ri + ':' + G.players.map(q => q.pts).join('/') : null; }})()")
            if r: rounds.setdefault(r.split(':')[0], set()).add(r)
        A.wait_for_timeout(250)
    print('   per photo:', {k: sorted(v) for k, v in rounds.items()})
    check(len(rounds) >= 2 and all(len(v) == 1 for v in rounds.values()), 'after each photo both screens show the same scores')
    tot = [pg.evaluate(f"{E}.G.players.map(q => q.pts).join('/')") for pg in (A, B)]
    check(tot[0] == tot[1], f'same final totals on both screens ({tot[0]})')
    txt = modal_text(A, 5000); print('  ', txt[:120])
    check(bool(txt), 'the match ends on screen')
    A.screenshot(path='test/shots/np_geo_A.png')
    check(not A.errs and not B.errs, 'no page errors ' + str([A.errs[:1], B.errs[:1]]))
    done(A, B)
