"""Where Am I? street views online: 2 people + 1 computer. Only the host asks for the street view; every screen shows
the same one (same pictures, same walk), and when the host finds none the same landmark photo shows everywhere."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
E = "GAME_MODS.geo.engine"
STUB = """(() => {
  const pic = (n) => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = ['#8E7B5B', '#6B8E5B', '#5B6B8E'][n % 3]; x.fillRect(0, 0, 256, 128); x.fillStyle = '#fff'; x.font = '30px sans-serif'; x.fillText(location.hash + n, 60, 70); return c.toDataURL('image/jpeg', 0.5); };
  window.__mlyCalls = 0;
  window.__mlyAPI = async (p) => { const k = window.__mlyCalls++; if (k === 1) return { ok: 0 };
    return { ok: 1, pano: true, by: 'tester', at: 0, walk: [0, 1].map((i) => ({ id: p.id + i, u: pic(k * 10 + i), h: 0 })) }; };
})()"""
with sync_playwright() as p:
    A, B = players(p, 2)
    for pg in (A, B): pg.evaluate(STUB)
    code = open_table(A, 'geo', 'room', {'n': 3, 'rounds': 3, 'secs': 30, 'region': 'world', 'kind': 'street'})
    join(B, code); A.wait_for_timeout(2000)
    start(A); A.wait_for_timeout(3000)
    seen = {}
    t0 = time.time()
    while time.time() - t0 < 150:
        if all(pg.evaluate("!!document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden')") for pg in (A, B)): break
        for i, pg in enumerate((A, B)):
            st = pg.evaluate(f"(() => {{ const G = {E}.G; return G && G.open && !G.sent ? [G.ri, G.places[G.ri].lat, G.places[G.ri].lon, G.places[G.ri].id, G.sv ? G.sv.walk.map(w => w.u.length + ':' + w.id).join(',') : 'photo'] : null; }})()")
            if st:
                seen.setdefault(st[0], set()).add((st[3], st[4]))
                pg.evaluate(f"{E}.place({st[1] + 2}, {st[2] + 3}); {E}.send()")
        A.wait_for_timeout(250)
    print('   per round:', {k: [(a, b[:40]) for a, b in v] for k, v in seen.items()})
    check(len(seen) >= 3 and all(len(v) == 1 for v in seen.values()), 'every round: both screens show the same view')
    check(seen.get(1) and list(seen[1])[0][1] == 'photo' and list(seen[0])[0][1] != 'photo', 'no street view in round 2 -> the same landmark photo on both screens')
    calls = [pg.evaluate("window.__mlyCalls") for pg in (A, B)]
    check(calls[0] >= 3 and calls[1] == 0, f'only the host asks for street views {calls}')
    tot = [pg.evaluate(f"{E}.G.players.map(q => q.pts).join('/')") for pg in (A, B)]
    check(tot[0] == tot[1], f'same final totals on both screens ({tot[0]})')
    check(not A.errs and not B.errs, 'no page errors ' + str([A.errs[:1], B.errs[:1]]))
    done(A, B)
