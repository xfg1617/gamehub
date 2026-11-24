"""Chat: a room inside a game (the home page has no chat since Nov 2026), sending, replies, no game keys while typing."""
import sys; sys.path.insert(0, 'test')
from tlib import *
with sync_playwright() as p:
    br = launch(p)
    for w, h in [(1280, 900), (390, 844)]:
        pg = open_page(br, w, h, mobile=w < 600)
        pg.wait_for_timeout(600)
        n_global = 'none (the home page has no chat since Nov 2026)'
        fab_lobby = pg.evaluate("document.getElementById('chat-fab').classList.contains('show')")
        pg.evaluate("openDailyWord(true)"); pg.wait_for_timeout(300)
        pg.click('#chat-fab'); pg.wait_for_timeout(300)
        pg.fill('#chat-room input', 'crane'); pg.press('#chat-room input', 'Enter')
        typed = pg.evaluate("dw.current")
        pg.evaluate("openGame('poker')"); pg.wait_for_timeout(300); pg.click('#su-go'); pg.wait_for_timeout(1500)
        room = pg.evaluate("document.getElementById('chat-room-name').textContent")
        pg.click('#chat-fab'); pg.wait_for_timeout(300)
        pg.click('#chat-room .chat-quick button'); pg.wait_for_timeout(3500)
        pg.screenshot(path=f'test/shots/chat_game_{w}.png')
        pg.evaluate("navigateTo('play', true)"); pg.wait_for_timeout(200)
        fab_back = pg.evaluate("document.getElementById('chat-fab').classList.contains('show')")
        print(w, 'global msgs', n_global, '| button hidden in lobby', not fab_lobby, '| daily word untouched by chat typing:', typed == '', '| room:', room, '| hidden again after leaving:', not fab_back, '| errors', pg.errs)
        pg.context.close()
