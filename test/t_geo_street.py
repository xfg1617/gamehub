"""Where Am I? street views (Nov 2026): stand-in 360° pictures (Mapillary's picture host can't be reached from the test
machine) through window.__mlyAPI. Checks: the view shows, dragging turns you round (and wraps), zoom, ◀ ▶ walk along the
street, the Mapillary credit has no link until the round is over, a spot with no street view falls back to a landmark
photo, online every screen sees the same view, phone width."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
E = 'GAME_MODS.geo.engine'
fails = []
def check(ok, what): print('PASS' if ok else 'FAIL', what); fails.append(what) if not ok else None
STUB = """(() => {
  const pic = (col, n) => { const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, '#7EC8F5'); g.addColorStop(0.5, '#DDEFFA'); g.addColorStop(0.5, col); g.addColorStop(1, '#333');
    x.fillStyle = g; x.fillRect(0, 0, 2048, 1024);
    for (let i = 0; i < 12; i++) { x.fillStyle = ['#C0392B', '#F5B041', '#2E86C1', '#27AE60'][i % 4]; x.fillRect(i * 170 + 30, 300 + (i % 3) * 30, 110, 212 - (i % 3) * 30);
      x.fillStyle = '#fff'; x.font = 'bold 60px sans-serif'; x.fillText(String(i * 30), i * 170 + 40, 420); }
    x.fillStyle = '#000'; x.font = 'bold 90px sans-serif'; x.fillText('STEP ' + n, 860, 640); return c.toDataURL('image/jpeg', 0.7); };
  window.__mlyCalls = 0;
  window.__mlyAPI = async (p) => { window.__mlyCalls++; if (window.__mlyNone) return { ok: 0 };
    return { ok: 1, pano: true, by: 'tester', at: 1, walk: [0, 1, 2].map((i) => ({ id: 'img' + i, u: pic(['#8E7B5B', '#6B8E5B', '#5B6B8E'][i], i + 1), h: 90 })) }; };
})()"""
def start(pg, extra=''):
    pg.evaluate(STUB + ';' + extra)
    pg.evaluate("setupSave('geo', Object.assign({}, setupLoad('geo'), {n: 2, rounds: 3, secs: 30, region: 'world', kind: 'street'}))")
    pg.evaluate("openGame('geo')"); pg.wait_for_timeout(500)
    if pg.query_selector('[data-mode="solo"]'): pg.click('[data-mode="solo"]')
    pg.evaluate("(() => { const b = [...document.querySelectorAll('#gs-body button')].find(x => /^\\s*(start|play)/i.test(x.textContent)); b && b.click(); })()")
    pg.wait_for_function(f"{E}.G && {E}.G.open", timeout=15000); pg.wait_for_timeout(300)
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1440, 900)
    n = pg.evaluate("(window.GEO_STREETS || []).length"); check(n >= 120, f'{n} street spots')
    regs = pg.evaluate(f"['usa','vietnam','asia','europe'].map(r => {E}.spool(r).filter(x => x.region === r).length)"); check(min(regs) >= 20, f'each region has 20+ spots {regs}')
    start(pg)
    check(pg.evaluate(f"!!{E}.G.sv && !document.getElementById('geo-sv').hidden"), 'the 360° street view shows')
    check('VIEW 1' in pg.inner_text('#geo-round'), 'round label says VIEW')
    cr = pg.inner_html('#geo-credit'); check('Mapillary' in cr and '<a' not in cr and 'tester' not in cr, 'credit shown, no link / name before the answer')
    pg.screenshot(path='test/shots/geo_street.png')
    pos0 = pg.evaluate("getComputedStyle(document.getElementById('geo-sv')).backgroundPosition")
    b = pg.query_selector('#geo-sv').bounding_box(); cx, cy = b['x'] + b['width'] / 2, b['y'] + b['height'] / 2
    yaw0 = pg.evaluate(f"{E}.G.look.yaw")
    pg.mouse.move(cx, cy); pg.mouse.down(); pg.mouse.move(cx - 300, cy - 40, steps=8); pg.mouse.up(); pg.wait_for_timeout(100)
    yaw1 = pg.evaluate(f"{E}.G.look.yaw"); pos1 = pg.evaluate("getComputedStyle(document.getElementById('geo-sv')).backgroundPosition")
    check(yaw1 > yaw0 + 20 and pos1 != pos0, f'dragging left turns you right ({yaw0:.0f}° -> {yaw1:.0f}°)')
    check(pg.evaluate(f"{E}.G.pin") is None, 'dragging the view does not drop a pin')
    for _ in range(6): pg.mouse.move(cx, cy); pg.mouse.down(); pg.mouse.move(cx - 600, cy, steps=6); pg.mouse.up()
    check(pg.evaluate(f"{E}.G.look.yaw") > 360, 'you can turn all the way round (the picture wraps)')
    pg.screenshot(path='test/shots/geo_street_turned.png')
    z0 = pg.evaluate(f"{E}.G.look.z"); pg.click('#geo-svin'); check(pg.evaluate(f"{E}.G.look.z") > z0, 'zoom in on the street view')
    pg.click('#geo-svout')
    check(pg.inner_text('#geo-step') == '2 / 3', 'starts in the middle of the street (2 / 3)')
    pg.click('#geo-fwd'); pg.wait_for_timeout(100)
    check(pg.inner_text('#geo-step') == '3 / 3' and 'img2' in pg.evaluate("document.getElementById('geo-sv').style.backgroundImage") or pg.evaluate(f"{E}.G.svAt") == 2, 'forward ▶ walks to the next picture')
    check(pg.evaluate("document.getElementById('geo-fwd').disabled"), '▶ is off at the end of the street')
    pg.click('#geo-back'); pg.click('#geo-back'); check(pg.inner_text('#geo-step') == '1 / 3' and pg.evaluate("document.getElementById('geo-back').disabled"), '◀ walks back')
    # pin + guess, then the answer: credit gets the link
    pl = pg.evaluate(f"(() => {{ const p = {E}.G.places[{E}.G.ri]; return [p.lat, p.lon]; }})()")
    pg.evaluate(f"{E}.place({pl[0]}, {pl[1]}); {E}.send()")
    pg.wait_for_function(f"{E}.G.reveal", timeout=40000); pg.wait_for_timeout(200)
    cr = pg.inner_html('#geo-credit'); check('mapillary.com/app/?pKey=img0' in cr and 'tester' in cr, 'after the answer the credit links to the picture')
    print('   ', pg.inner_text('#geo-msg'))
    check(pg.evaluate("GAME_MODS.geo.engine.G.players[0].pts") > 4000, 'a guess on the spot scores well')
    check(not pg.errs, 'no page errors ' + str(pg.errs[:2]))
    # no street view anywhere -> landmark photos
    q = open_page(br, 1440, 900); start(q, 'window.__mlyNone = 1')
    check(not q.evaluate(f"!!{E}.G.sv") and q.evaluate("document.getElementById('geo-pic').naturalWidth") > 300 and 'Wikimedia' in q.inner_html('#geo-credit'), 'no street view -> a landmark photo instead')
    check(not q.errs, 'no page errors (fallback) ' + str(q.errs[:2]))
    # phone
    m = open_page(br, 390, 844, mobile=True); start(m)
    w = m.evaluate("document.documentElement.scrollWidth"); check(w <= 392, f'phone: no sideways scrolling ({w}px)')
    bb = m.query_selector('#geo-walk').bounding_box(); check(bb and bb['width'] > 100, 'phone: walk arrows visible')
    m.screenshot(path='test/shots/geo_street_phone.png')
print('ALL PASS' if not fails else f'FAILED: {fails}')
