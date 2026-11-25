"""Emotes in online Chess (on the shared online table since Nov 2026): both players get the emote button, and an emote sent by
A pops up on B's screen."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, B = players(p, 2)
    A.evaluate("openGame('chess')"); A.wait_for_timeout(400); A.click('[data-mode="room"]'); A.wait_for_timeout(2000)
    code = A.evaluate("document.querySelector('#np-lob .room-code').textContent")
    B.fill('#quick-room-input', code); B.click('.code-row button'); B.wait_for_timeout(3000)
    A.click('#np-start'); A.wait_for_timeout(3500)
    check(A.query_selector('#ch-board') is not None and B.query_selector('#ch-board') is not None, 'the chess game started on both screens')
    t0 = time.time()
    while time.time() - t0 < 10 and not (A.query_selector('#em-fab:not(.hidden)') and B.query_selector('#em-fab:not(.hidden)')): A.wait_for_timeout(500)
    check(A.evaluate("!!document.getElementById('em-fab') && getComputedStyle(document.getElementById('em-fab')).display !== 'none'"), 'A has the emote button')
    A.click('#em-fab'); A.click('#em-menu [data-em="gg"]'); B.wait_for_timeout(2000)
    check(B.evaluate("document.querySelectorAll('.em-bub.on').length") >= 1, 'B sees the emote A sent')
    B.screenshot(path='test/shots/chess_emote.png')
    done(A, B)
