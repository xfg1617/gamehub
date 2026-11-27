"""A host whose screen freezes (phone asleep / switched app) must not freeze the whole table (Nov 2026, Inna: "players
just get disconnected or the game freezes and the timer still runs"). Dominoes, 3 people: the host's page is frozen
mid-game (Chrome's real "frozen" page state: no code runs). The others get a warning within seconds, then another
player takes over hosting, a computer plays the frozen seat and the game goes on. When the frozen page wakes up it
hands hosting over and gets its own seat back, and every screen shows the same table again."""
import sys; sys.path.insert(0, 'test')
from nplib import *
LINE = "[...document.querySelectorAll('#dm-line .dm-tile')].map(t => t.dataset.fk).join(' ')"
def act(pg):
    for sel in ('#dm-draw', '#dm-pass', '#dm-l'):
        b = pg.query_selector(sel)
        if b and b.is_visible() and b.is_enabled(): b.click(); return True
    t = pg.query_selector('#dm-hand .dm-tile.ok')
    if t and pg.evaluate("document.getElementById('dm-status').textContent") == 'YOUR TURN': t.click(); return True
    return False
def play(pgs, secs):
    t0 = time.time()
    while time.time() - t0 < secs:
        moved = False
        for pg in pgs:
            try:
                if act(pg): moved = True; pg.wait_for_timeout(400)
            except Exception: pass
        if not moved: pgs[0].wait_for_timeout(400)
# Headless Chrome can't really freeze one tab, so the host's page freezes itself: while window.__frozen is set, every
# timer and every incoming table message is held back (no code of ours runs, nothing is sent), then all of it runs on
# waking up, like a phone coming back from sleep.
FREEZE = """(() => {
  const held = []; window.__wake = () => { window.__frozen = false; held.splice(0).forEach((f) => { try { f(); } catch (e) {} }); };
  const wrap = (f) => function (...a) { if (window.__frozen) { held.push(() => f.apply(this, a)); return; } return f.apply(this, a); };
  const st = window.setTimeout, si = window.setInterval, raf = window.requestAnimationFrame;
  window.setTimeout = (f, ms, ...a) => st(typeof f === 'function' ? wrap(f) : f, ms, ...a);
  window.setInterval = (f, ms, ...a) => si(typeof f === 'function' ? function (...b) { if (window.__frozen) return; return f.apply(this, b); } : f, ms, ...a);
  window.requestAnimationFrame = (f) => raf(wrap(f));
  const d = Object.getOwnPropertyDescriptor(BroadcastChannel.prototype, 'onmessage');
  Object.defineProperty(BroadcastChannel.prototype, 'onmessage', { set(f) { d.set.call(this, f ? wrap(f) : f); }, get() { return d.get.call(this); } });
})()"""
with sync_playwright() as p:
    A, B, C = players(p, 3)
    A.context.add_init_script(FREEZE)
    for pg in (A, B, C): pg.reload(); pg.wait_for_function("typeof NET !== 'undefined' && NET.on && NET.me && NET.me.name", timeout=20000)
    for pg in (A, B, C): pg.evaluate('window.__fast = false')
    code = open_table(A, 'dominoes', 'room', {'n': 3, 'to': 150, 'rule': 'draw'})
    join(B, code); join(C, code); A.wait_for_timeout(2500)
    start(A); A.wait_for_timeout(3000)
    check(all(pg.query_selector('#dm-hand') for pg in (A, B, C)), 'the game started on all three screens')
    play((A, B, C), 12)
    n0 = len(B.evaluate(LINE).split()); v0 = B.evaluate('NP.S.version')
    A.evaluate('window.__frozen = true')
    print('   host frozen with', n0, 'tiles on the table')
    B.wait_for_timeout(12000)
    bar = B.evaluate("document.getElementById('np-bar') ? document.getElementById('np-bar').innerText : ''")
    print('   B sees:', bar.replace('\n', ' ')[:120])
    check('computer player takes over' in bar.lower(), 'within seconds the others are told the host is gone and a computer will take over')
    play((B, C), 24)
    hosting = [pg.evaluate("NP.S && NP.S.isHost") for pg in (B, C)]
    check(hosting.count(True) == 1, f'exactly one of the others is hosting now ({hosting})')
    check(B.evaluate("NP.S.seats[0].bot === true"), "a computer plays the frozen host's seat")
    play((B, C), 20)
    v1 = B.evaluate('NP.S.version')
    check(v1 > v0 + 3, f'the game went on without the frozen screen ({v1 - v0} moves)')
    A.evaluate('window.__wake()')
    print('   host woke up')
    ok = False
    for _ in range(40):
        A.wait_for_timeout(1000)
        try: ok = A.evaluate("!!(NP.S && NP.S.seats[0].bot === false)") and B.evaluate("NP.S.seats[0].bot === false")
        except Exception: ok = False
        if ok: break
    print('   A seat0', A.evaluate("NP.S && JSON.stringify(NP.S.seats[0])"), '| hosts', [pg.evaluate("NP.S && NP.S.isHost") for pg in (A, B, C)])
    if not ok: print('   A screen:', A.evaluate("activeGame + ' | ' + (document.getElementById('gs-body') || {innerText: ''}).innerText.slice(0, 200) + ' | toasts: ' + [...document.querySelectorAll('.toast, #toast, [class*=toast]')].map(t => t.innerText).join(' / ')").replace('\n', ' '))
    check(ok, 'the woken player caught up and got their seat back')
    hosts = [pg.evaluate("NP.S.isHost") for pg in (A, B, C)]
    check(hosts.count(True) == 1, f'exactly one screen hosts the table ({hosts})')
    play((A, B, C), 10); A.wait_for_timeout(4000)
    la, lb, lc = A.evaluate(LINE), B.evaluate(LINE), C.evaluate(LINE)
    check(la == lb == lc, f'all three screens show the same table again ({len(lb.split())} tiles)')
    check(not any(pg.errs for pg in (A, B, C)), 'no page errors ' + str([pg.errs[:1] for pg in (A, B, C)]))
    done(A, B, C)
