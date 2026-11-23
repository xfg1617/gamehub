"""Table chat: two players at an online table chat privately; a third person who is only browsing the same
game sees the game's general room, not the table chat. The switch flips between the two."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
def say(pg, t):
    pg.evaluate("chatToggle(true)"); pg.wait_for_timeout(200)
    pg.fill('#chat-room .chat-form input', t); pg.press('#chat-room .chat-form input', 'Enter')
with sync_playwright() as p:
    A, B, C = players(p, 3, REAL)
    code = open_table(A, 'tictactoe', 'room'); join(B, code); A.wait_for_timeout(2500)
    C.evaluate("openGame('tictactoe')"); C.wait_for_timeout(800)
    print('   A room:', A.evaluate("document.getElementById('chat-room-name').textContent"), '| C room:', C.evaluate("document.getElementById('chat-room-name').textContent"))
    check(A.evaluate("document.getElementById('chat-room-name').textContent").startswith('TABLE'), 'at a table the chat is the table chat')
    say(A, 'secret table hello'); B.wait_for_timeout(2000); C.wait_for_timeout(500)
    check('secret table hello' in B.evaluate("document.querySelector('#chat-room .chat-list').innerText"), 'the other player at the table gets it')
    check('secret table hello' not in C.evaluate("document.querySelector('#chat-room .chat-list').innerText"), 'someone not at the table does not')
    A.evaluate("document.querySelector('#chat-switch [data-cm=\"game\"]').click()"); A.wait_for_timeout(800)
    check(A.evaluate("document.getElementById('chat-room-name').textContent").startswith('TIC-TAC-TOE'), 'the switch shows the game room')
    say(A, 'hello everyone'); C.wait_for_timeout(2000)
    check('hello everyone' in C.evaluate("document.querySelector('#chat-room .chat-list').innerText"), 'the game room reaches everyone playing it')
    done(A, B, C)
