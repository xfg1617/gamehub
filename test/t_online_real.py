"""Online play against the REAL Supabase project (two separate browsers = two devices).
Uses players named 'Test Pilot A/B' so the test data is easy to find and delete afterwards."""
import sys, json; sys.path.insert(0, 'test')
from tlib import *
UMD = os.path.join(ROOT, 'test', 'supabase_umd.js')   # same file the page loads from jsDelivr (blocked in some sandboxes)
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
def device(br, name, avatar):
    ctx = br.new_context(viewport={'width': 1280, 'height': 900})
    stub = os.path.join(ROOT, 'test', 'tw_stub.js')
    if os.path.exists(stub): ctx.route('https://cdn.tailwindcss.com/**', lambda r: r.fulfill(path=stub, content_type='application/javascript'))
    if os.path.exists(UMD): ctx.route('https://cdn.jsdelivr.net/npm/@supabase/**', lambda r: r.fulfill(path=UMD, content_type='application/javascript'))
    pg = ctx.new_page(); pg.errs = []
    pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    pg.on('console', lambda m: pg.errs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and 'Failed to load resource' not in m.text else None)
    pg.goto('file://' + FILE); pg.wait_for_timeout(300)
    pg.evaluate(f"profile.username = {json.dumps(name)}; profile.avatar = {json.dumps(avatar)}; saveProfileToStorage(); location.reload()")
    pg.wait_for_timeout(4500)
    return pg
with sync_playwright() as p:
    br = launch(p)
    A = device(br, 'Test Pilot A', '🛩️'); B = device(br, 'Test Pilot B', '🚁')
    for pg, n in ((A, 'A'), (B, 'B')):
        if not pg.evaluate('NET.on'): print(n, 'not online. Messages:', pg.errs[:5])
    check(A.evaluate('NET.on') and B.evaluate('NET.on'), 'both devices signed in to the real service')
    if not fails:
        print('   names:', A.evaluate('NET.me.name'), '/', B.evaluate('NET.me.name'))
        A.wait_for_timeout(3000)
        oc = A.evaluate("document.getElementById('online-count').textContent")
        check(oc.isdigit() and int(oc) >= 2, f'online count is real ({oc})')
        A.fill('#chat-global input', 'hello from Test Pilot A (test message)'); A.press('#chat-global input', 'Enter'); B.wait_for_timeout(2500)
        check('hello from Test Pilot A' in B.evaluate("document.getElementById('chat-global').innerText"), 'chat message arrived on the other device')
        for pg in (A, B):
            pg.evaluate("openGame('chess')"); pg.wait_for_timeout(400)
            pg.click('[data-mode="quick"]'); pg.wait_for_timeout(2500)
        A.wait_for_timeout(3000)
        check(A.query_selector('#ch-board') is not None and B.query_selector('#ch-board') is not None, 'quick match paired the two devices')
        if not fails:
            white = A if A.evaluate("document.getElementById('ch-status').textContent") == 'YOUR MOVE' else B
            black = B if white is A else A
            def mv(pg, a, b): pg.click(f'#ch-board [data-i="{a}"]'); pg.wait_for_timeout(200); pg.click(f'#ch-board [data-i="{b}"]'); pg.wait_for_timeout(2500)
            for who, a, b in [(white, 53, 45), (black, 12, 28), (white, 54, 38), (black, 3, 39)]: mv(who, a, b)
            black.wait_for_timeout(8000)
            check('Checkmate' in white.evaluate("document.getElementById('ch-msg').textContent"), 'checkmate reached the other device')
            rb = black.evaluate("(document.getElementById('g-modal') || {}).innerText || ''"); rw = white.evaluate("(document.getElementById('g-modal') || {}).innerText || ''")
            print('   winner sees:', rb.replace('\n', ' ')[:150]); print('   loser sees :', rw.replace('\n', ' ')[:150])
            check('(+' in rb and '(-' in rw, 'ranked Elo changed on the real service')
            lb = A.evaluate("NET.leaderboard('chess').then(l => l.map(x => x.name + ':' + x.elo))")
            check(any('Test Pilot' in x for x in lb), f'real leaderboard: {lb}')
            black.screenshot(path='test/shots/real_result.png')
            # a private room with a code (friendly, no Elo), then a resignation
            lb0 = sorted(lb)
            for pg in (A, B): pg.evaluate("document.getElementById('g-modal').classList.add('hidden'); navigateTo('play', true)")
            A.evaluate("openGame('chess')"); A.wait_for_timeout(400); A.click('[data-mode="room"]')
            code = A.evaluate("document.getElementById('su-code').textContent"); A.click('#su-go'); A.wait_for_timeout(3000)
            check(code in A.evaluate("document.body.innerText"), f'host waits in room {code}')
            B.fill('#quick-room-input', code); B.click('.code-row button'); B.wait_for_timeout(5000)
            check(B.query_selector('#ch-board') is not None and A.query_selector('#ch-board') is not None, 'friend joined with the room code')
            if B.query_selector('#ch-resign'):
                B.click('#ch-resign'); B.click('#ch-resign')
                try:
                    A.wait_for_function("!document.getElementById('g-modal').classList.contains('hidden')", timeout=40000)
                    res = A.evaluate("document.getElementById('g-modal').innerText")
                except Exception: res = ''
                check('resigned' in A.evaluate("document.getElementById('ch-msg').textContent"), 'resigning ended the game on the other device')
                check('Friendly game' in res, 'room-code game is friendly: ' + res.replace('\n', ' ')[:120])
                lb1 = sorted(A.evaluate("NET.leaderboard('chess').then(l => l.map(x => x.name + ':' + x.elo))"))
                check(lb1 == lb0, f'Elo unchanged by the friendly game {lb1}')
    print('errors A:', A.errs[:4]); print('errors B:', B.errs[:4])
print('ALL GOOD' if not fails else f'{len(fails)} PROBLEMS')
