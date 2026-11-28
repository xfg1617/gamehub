"""Where Am I? (Nov 2026): photos load, a real click on the map drops the pin where you clicked, GUESS scores by
distance, computer players guess too, a whole game plays to the result screen; zoom works; phone fits."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
E = 'GAME_MODS.geo.engine'
fails = []
def check(ok, what): print('PASS' if ok else 'FAIL', what); fails.append(what) if not ok else None
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1440, 900)
    n = pg.evaluate("(window.GEO_PLACES || []).length"); check(n >= 100, f'{n} photos in the game')
    d = pg.evaluate(f"{E}.km([21.03, 105.85], [10.77, 106.70])"); check(1100 < d < 1200, f'Hanoi to Saigon ≈ 1,140 km ({d:.0f})')
    check(pg.evaluate(f"{E}.score(0, 'world')") == 5000 and pg.evaluate(f"{E}.score(2000, 'world')") < 2000, 'spot on = 5,000; far away = less')
    pg.evaluate("setupSave('geo', Object.assign({}, setupLoad('geo'), {n: 3, rounds: 5, secs: 30, region: 'world'}))")
    pg.evaluate("openGame('geo')"); pg.wait_for_timeout(500)
    if pg.query_selector('[data-mode="solo"]'): pg.click('[data-mode="solo"]')
    pg.evaluate("(() => { const b = [...document.querySelectorAll('#gs-body button')].find(x => /^\\s*(start|play)/i.test(x.textContent)); b && b.click(); })()")
    pg.wait_for_timeout(1500)
    check(pg.evaluate("document.getElementById('geo-pic').naturalWidth") > 500, 'the photo loads')
    pg.screenshot(path='test/shots/geo_round.png')
    # a real click on the map: work out where (lat, lon) is on screen and click there
    G = pg.evaluate(f"(() => {{ const G = {E}.G, p = G.places[G.ri]; return [p.lat, p.lon, p.name]; }})()")
    box = pg.query_selector('#geo-map').bounding_box(); v = pg.evaluate(f"{E}.G.view")
    x, y = G[1] + 180, 90 - G[0]
    sx = box['x'] + (x - v[0]) / v[2] * box['width']; sy = box['y'] + (y - v[1]) / v[3] * box['height']
    pg.mouse.click(sx, sy); pg.wait_for_timeout(200)
    pin = pg.evaluate(f"{E}.G.pin"); dd = pg.evaluate(f"{E}.km([{G[0]}, {G[1]}], [{pin['lat']}, {pin['lon']}])") if pin else 9999
    check(pin and dd < 150, f'clicking the map drops the pin where you clicked ({G[2]}, {dd:.0f} km off at world zoom)')
    check(not pg.evaluate("document.getElementById('geo-go').disabled"), 'GUESS button turns on after pinning')
    # zoom in with the + button, then press GUESS
    v1 = pg.evaluate(f"{E}.G.view[2]"); pg.click('#geo-zin'); v2 = pg.evaluate(f"{E}.G.view[2]"); check(v2 < v1, f'zoom in works ({v1:.0f} -> {v2:.0f})')
    pg.click('#geo-go'); pg.wait_for_timeout(300)
    check('Locked in' in pg.inner_text('#geo-msg'), 'GUESS locks your pin in (you can still change it)')
    pg.screenshot(path='test/shots/geo_pinned.png')
    try: pg.wait_for_function(f"{E}.G.reveal", timeout=40000)
    except Exception: pass
    pg.wait_for_timeout(300); pg.screenshot(path='test/shots/geo_reveal.png')
    msg = pg.inner_text('#geo-msg'); print('   reveal:', msg)
    check('It was' in msg and 'You were' in msg and pg.evaluate(f"{E}.G.players[0].pts") > 3000, 'the answer shows and a close guess scores well')
    check(all(pg.evaluate(f"{E}.G.reveal.g[{i}]") for i in (1, 2)), 'computer players guessed too')
    # play the rest: pin roughly near the answer each round
    t0 = time.time()
    while time.time() - t0 < 120 and not pg.query_selector('#g-modal:not(.hidden)'):
        st = pg.evaluate(f"(() => {{ const G = {E}.G; return G && G.open && !G.sent ? [G.places[G.ri].lat, G.places[G.ri].lon] : null; }})()")
        if st: pg.evaluate(f"{E}.place({st[0] + 3}, {st[1] - 4}); {E}.send()")
        pg.wait_for_timeout(150)
    txt = pg.evaluate("(document.getElementById('g-modal') || {}).innerText || ''").replace('\n', ' ')
    print('   result:', txt[:140]); check('your score' in txt.lower(), 'the game plays to the result screen')
    check(not pg.errs, 'no page errors ' + str(pg.errs[:2]))
    m = open_page(br, 390, 844, mobile=True); m.evaluate("setupSave('geo', Object.assign({}, setupLoad('geo'), {n: 1}))"); m.evaluate("openGame('geo')"); m.wait_for_timeout(500)
    m.evaluate("(() => { const b = [...document.querySelectorAll('#gs-body button')].find(x => /^\\s*(start|play)/i.test(x.textContent)); b && b.click(); })()"); m.wait_for_timeout(1500)
    w = m.evaluate("document.documentElement.scrollWidth"); check(w <= 392, f'phone: no sideways scrolling ({w}px)'); m.screenshot(path='test/shots/geo_phone.png', full_page=True)
print('ALL PASS' if not fails else f'FAILED: {fails}')
