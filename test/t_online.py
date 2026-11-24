"""Online play, end to end, using the stand-in service (two browser windows on one computer):
quick match pairs two players, moves travel both ways, a checkmate ends the game for both,
ranked Elo moves +16 / -16, the leaderboard shows both, chat messages reach the other window,
a private room code works, and resigning works."""
import sys; sys.path.insert(0, 'test')
from tlib import *
from nplib import players
def page(ctx):
    pg = ctx.new_page(); pg.errs = []
    pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    pg.on('console', lambda m: pg.errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    pg.goto('file://' + FILE); pg.wait_for_timeout(700)
    return pg
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
with sync_playwright() as p:
    # two separate players on the stand-in service (served from http://gamehub.test like the other online tests;
    # plain file:// windows share storage with a lag and made this test flaky)
    A, B = players(p, 2)
    for pg in (A, B): pg.set_viewport_size({'width': 1280, 'height': 900})
    A.wait_for_timeout(1200)
    print('   names:', A.evaluate('NET.me.name'), '/', B.evaluate('NET.me.name'), '| errors:', A.errs[:3], B.errs[:3])
    check(A.evaluate('NET.on') and B.evaluate('NET.on'), 'both windows are online')
    check(A.evaluate("NET.me.name") != B.evaluate("NET.me.name"), f"names are unique ({A.evaluate('NET.me.name')} / {B.evaluate('NET.me.name')})")
    A.wait_for_timeout(5500)
    check(A.evaluate("document.getElementById('online-count').textContent") == '2', 'online count shows 2 real players')
    # chat
    for pg in (A, B): pg.evaluate("openGame('chess'); chatToggle(true)"); pg.wait_for_timeout(1200)   # the home page has no chat since Nov 2026: use a game's chat room
    A.fill('#chat-panel input', 'hello from window A'); A.press('#chat-panel input', 'Enter'); B.wait_for_timeout(800)
    check('hello from window A' in B.evaluate("document.getElementById('chat-panel').innerText"), 'a chat message reaches the other window')
    A.fill('#chat-panel input', 'what the shit'); A.press('#chat-panel input', 'Enter'); B.wait_for_timeout(600)
    check('shit' not in B.evaluate("document.getElementById('chat-panel').innerText"), 'swear words are filtered')
    # quick match
    for pg in (A, B):
        pg.evaluate("openGame('chess')"); pg.wait_for_timeout(300)
        pg.click('[data-mode="online"]'); pg.wait_for_timeout(900)
    A.wait_for_timeout(1500)
    check(A.query_selector('#ch-board') is not None and B.query_selector('#ch-board') is not None, 'quick match put both players on a board')
    A.screenshot(path='test/shots/online_A.png')
    white = A if A.evaluate("document.getElementById('ch-status').textContent") == 'YOUR MOVE' else B
    black = B if white is A else A
    def mv(pg, a, b): pg.click(f'#ch-board [data-i="{a}"]'); pg.wait_for_timeout(150); pg.click(f'#ch-board [data-i="{b}"]'); pg.wait_for_timeout(1500)
    for who, a, b in [(white, 53, 45), (black, 12, 28), (white, 54, 38), (black, 3, 39)]: mv(who, a, b)   # the 4-move checkmate
    black.wait_for_timeout(5000)
    check('Checkmate' in white.evaluate("document.getElementById('ch-msg').textContent"), "the loser's board shows checkmate too")
    res_w = white.evaluate("document.getElementById('g-modal') && document.getElementById('g-modal').innerText"); res_b = black.evaluate("document.getElementById('g-modal') && document.getElementById('g-modal').innerText")
    print('   winner sees:', (res_b or '').replace('\n', ' ')[:140]); print('   loser sees :', (res_w or '').replace('\n', ' ')[:140])
    check('1216 (+16)' in (res_b or '') and '1184 (-16)' in (res_w or ''), 'ranked Elo: winner 1216 (+16), loser 1184 (-16)')
    black.screenshot(path='test/shots/online_result.png')
    lb = A.evaluate("NET.leaderboard('chess').then(l => l.map(x => x.name + ':' + x.elo))")
    check(len(lb) == 2, f'leaderboard lists both players {lb}')
    # a private room with a code, then a resignation
    for pg in (A, B): pg.evaluate("document.getElementById('g-modal').classList.add('hidden'); navigateTo('play', true)")
    A.evaluate("openGame('chess')"); A.wait_for_timeout(300); A.click('[data-mode="friend"]'); A.wait_for_timeout(2000)
    code = A.evaluate("document.querySelector('#np-lob .room-code').textContent")
    check(code in A.evaluate("document.body.innerText"), f'host waits in room {code}')
    B.fill('#quick-room-input', code); B.click('.code-row button'); B.wait_for_timeout(3000)
    A.click('#np-start'); A.wait_for_timeout(2500)   # the host starts once the friend is in
    check(B.query_selector('#ch-board') is not None and A.query_selector('#ch-board') is not None, 'friend joined with the room code from the main menu')
    B.click('#ch-resign'); B.click('#ch-resign'); A.wait_for_timeout(3500)
    check('resigned' in A.evaluate("document.getElementById('ch-msg').textContent"), 'resigning ends the game on the other screen')
    print('   B state', B.evaluate("[document.getElementById('ch-msg')&&document.getElementById('ch-msg').textContent, document.getElementById('ch-status')&&document.getElementById('ch-status').textContent, !document.getElementById('g-modal').classList.contains('hidden'), GT.cur]"))
    A.wait_for_timeout(6000); print('   ROOM', A.evaluate("JSON.stringify(Object.values(JSON.parse(localStorage.getItem('psnet_db')).rooms).slice(-1))"), A.evaluate('NET.me.id'), B.evaluate('NET.me.id'), B.errs[-3:], A.errs[-3:])
    A.wait_for_function("!document.getElementById('g-modal').classList.contains('hidden')", timeout=40000)
    res = A.evaluate("document.getElementById('g-modal').innerText")
    print('   friendly modal:', res.replace('\n',' ')[:200]); check('Friendly game' in res, 'room-code games are friendly (no Elo change)')
    print('errors:', A.errs[:3], B.errs[:3])
print('ALL GOOD' if not fails else f'{len(fails)} PROBLEMS')
