"""Chat at an online table shows as a speech bubble above the sender's name tag (Inna, Nov 2026): A types in the table
chat, B sees the words above A's tag at the table (not only in the corner pop-up)."""
import sys; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, B = players(p, 2)
    code = open_table(A, 'fibber', 'room', {'n': 3, 'secs': 7, 'turn': 30})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(3000)
    check(A.query_selector('#fb-hand') and B.query_selector('#fb-hand'), 'the game started on both screens')
    A.evaluate("chatSend(CHAT.room, 'I am totally not bluffing')"); B.wait_for_timeout(2500)
    txt = B.evaluate("[...document.querySelectorAll('.em-say.on')].map(e => e.textContent).join('|')")
    check('not bluffing' in txt, f"B sees A's message above A's name tag: {txt!r}")
    B.screenshot(path='test/shots/chat_bubble.png')
    done(A, B)
