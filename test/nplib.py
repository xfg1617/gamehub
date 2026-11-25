"""Helpers for online-table tests: several players at once.

players(p, n)            -> n pages on the stand-in service (tabs of one browser, in ONE process so
                            their shared storage is always in step), each a different player
players(p, n, real=True) -> n separate browsers on the REAL service ("Test Pilot A, B, C...")
open_table(pg, game, net='room', picks={})  -> opens the game's setup on "Private room"/"quick", presses Start
join(pg, code)           -> types the code in the main-menu box
"""
import os, json, time
from tlib import *

UMD = os.path.join(ROOT, 'test', 'supabase_umd.js')
STUB = os.path.join(ROOT, 'test', 'tw_stub.js')

def _watch(pg):
    pg.errs = []
    pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    pg.on('console', lambda m: pg.errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text and 'WebSocket' not in m.text else None)
    return pg

def _ctx(br, real, account=True):
    ctx = br.new_context(viewport={'width': 1280, 'height': 900})
    if os.path.exists(STUB): ctx.route('https://cdn.tailwindcss.com/**', lambda r: r.fulfill(path=STUB, content_type='application/javascript'))
    if real:
        if os.path.exists(UMD): ctx.route('https://cdn.jsdelivr.net/npm/@supabase/**', lambda r: r.fulfill(path=UMD, content_type='application/javascript'))
    else:
        ctx.route('https://*.supabase.co/**', lambda r: r.abort())
        ctx.route('http://gamehub.test/**', lambda r: r.fulfill(path=FILE, content_type='text/html'))
        ctx.add_init_script("try { localStorage.setItem('ps_net_local', '1'); } catch (e) {}")
        # chat and friends are for accounts only (Nov 2026): test players have an account unless a test is about guests
        if account: ctx.add_init_script("try { if (!sessionStorage.getItem('psnet_email')) sessionStorage.setItem('psnet_email', 'tester@gamehub.test'); } catch (e) {}")
    return ctx

def rejoin(pg):
    """After a reload: press Rejoin if the box is offered; opening the room's own link (/r/CODE) rejoins by itself."""
    b = pg.query_selector('[data-rj="yes"]')
    if b: b.click(); return 'offer'
    return 'auto'
def players(p, n=2, real=False, account=True):
    br = launch(p); out = []
    if real:
        for i in range(n):
            pg = _watch(_ctx(br, True).new_page()); pg.goto('file://' + FILE); pg.wait_for_timeout(300)
            pg.evaluate(f"profile.username = 'Test Pilot {chr(65 + i)}'; saveProfileToStorage(); setTimeout(() => location.reload(), 50)")
            pg.wait_for_timeout(600); pg.wait_for_load_state()
            out.append(pg)
    else:
        ctx = _ctx(br, False, account)
        A = _watch(ctx.new_page()); A.goto('http://gamehub.test/gamehub.html'); out.append(A)
        A.wait_for_function("typeof NET !== 'undefined' && NET.on && NET.me && NET.me.name", timeout=20000)
        for i in range(1, n):
            with ctx.expect_page() as pi: A.evaluate("window.open(location.href, '_blank')")
            pg = _watch(pi.value); pg.wait_for_load_state()
            pg.evaluate("sessionStorage.removeItem('psnet_uid'); location.reload()")
            pg.wait_for_load_state(); pg.wait_for_function("typeof NET !== 'undefined' && NET.on && NET.me && NET.me.name", timeout=20000)
            out.append(pg)
    for pg in out:
        pg.wait_for_function("typeof NET !== 'undefined' && NET.on && NET.me && NET.me.name", timeout=30000)
        pg.evaluate("() => { try { SFX.isOn && SFX.isOn() && SFX.toggle && SFX.toggle(); } catch (e) {} }")
    ids = [pg.evaluate('NET.me.id') for pg in out]
    assert len(set(ids)) == n, f'players are not distinct: {ids}'
    return out

WANT = {}
HOST = {}
def open_table(pg, game, net='room', picks=None):
    """Open a table the new way (Nov 2026): step 1 picks Online match / Private room, then the room opens straight
    away (code + invite link + settings + chat IN the room). Setting picks are saved first (the room/match uses the
    player's saved settings; the host can still change them in the room). A table size pick ('n' / 'seats') is
    remembered: in a private room the host adds computer players up to that size when start() is pressed."""
    picks = dict(picks or {})
    want = picks.pop('n', None) or (picks.pop('seats', None) if net == 'room' else picks.get('seats'))
    WANT[id(pg)] = want; HOST['pg'] = pg
    if net == 'quick' and want: picks['n' if game != 'bowling' else 'seats'] = want
    gid = 'navalnet' if game == 'naval' else game
    pg.evaluate("([g, p]) => setupSave(g, Object.assign({}, setupLoad(g), p))", [gid, picks])
    pg.evaluate(f"openSetup('{game}')"); pg.wait_for_timeout(500)
    pg.click(f'[data-mode="{net}"]'); pg.wait_for_timeout(1200)
    if net == 'room':
        try: pg.wait_for_function("document.querySelector('#np-lob .room-code')", timeout=15000)
        except Exception: pass
    return pg.evaluate("(document.querySelector('#np-lob .room-code') || {}).textContent || ''").strip()

def start(pg):
    """Host presses Start in a private room, first adding computer players up to the table size the test asked for
    (or filling every empty seat, like the old rooms did, when it asked for none)."""
    want = WANT.get(id(pg))
    for _ in range(8):
        n = pg.evaluate("document.querySelectorAll('#np-lob .np-seat.on').length")
        can = pg.evaluate("!!document.querySelector('#np-bp') && !document.querySelector('#np-bp').disabled")
        if not can or (want and n >= int(want)): break
        pg.click('#np-bp'); pg.wait_for_timeout(150)
    pg.click('#np-start')

def join(pg, code):
    pg.evaluate("navigateTo('play', true)"); pg.wait_for_timeout(200)
    pg.fill('#quick-room-input', code); pg.click('.code-row button'); pg.wait_for_timeout(1500)
    # a private 2-player room now waits for the host's Start (people agree on the settings first): press it
    H = HOST.get('pg')
    if H and H is not pg:
        try: H.wait_for_function("document.querySelectorAll('#np-lob .np-seat').length === 2 ? document.querySelectorAll('#np-lob .np-seat.on').length === 2 : true", timeout=8000)
        except Exception: pass
        if H.evaluate("document.querySelectorAll('#np-lob .np-seat').length === 2 && document.querySelectorAll('#np-lob .np-seat.on').length === 2 && !!document.querySelector('#np-start:not([disabled])')"):
            H.click('#np-start'); H.wait_for_timeout(1500)

def modal_text(pg, t=30000):
    try: pg.wait_for_function("document.getElementById('g-modal') && !document.getElementById('g-modal').classList.contains('hidden')", timeout=t)
    except Exception: return ''
    return pg.evaluate("document.getElementById('g-modal').innerText").replace('\n', ' ')

fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
def done(*pgs):
    for i, pg in enumerate(pgs):
        if pg.errs: print(f'errors {chr(65 + i)}:', pg.errs[:4])
    print('ALL GOOD' if not fails else f'{len(fails)} PROBLEMS')
