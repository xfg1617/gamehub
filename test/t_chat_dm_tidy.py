"""A friend conversation inside the game's chat window looks like the Friends page: bubbles (yours on the right, teal),
a day line, times, and a room invite as a card with a Join button."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, B = players(p, 2)
    bid = B.evaluate("NET.me.id"); aid = A.evaluate("NET.me.id")
    A.evaluate(f"NET.addFriend('{bid}')"); B.wait_for_timeout(800); B.evaluate(f"NET.acceptFriend('{aid}')"); A.wait_for_timeout(800)
    for t in ['Wanna play?', 'Ok chơi', 'Join my Random Game room! https://gamehub.us.com/r/F3YM']: A.evaluate(f"NET.dmSend('{bid}', {t!r})"); A.wait_for_timeout(300)
    B.evaluate(f"NET.dmSend('{aid}', 'yes!')"); B.wait_for_timeout(500)
    B.evaluate("openGame('fibber')"); B.wait_for_timeout(600)
    if B.query_selector('#su-go'): B.click('#su-go')
    B.wait_for_timeout(1500)
    B.evaluate("chatToggle(true)"); B.wait_for_timeout(800); B.evaluate("chatFriends.openList()"); B.wait_for_timeout(1500)
    B.evaluate(f"document.querySelector('.cf-row[data-id=\"{aid}\"]').click()"); B.wait_for_timeout(2500)
    n = B.evaluate("[document.querySelectorAll('#cf-msgs .dm-b').length, document.querySelectorAll('#cf-msgs .dm-b.me').length, document.querySelectorAll('#cf-msgs .dm-inv [data-join]').length, document.querySelectorAll('#cf-msgs .dm-day').length]")
    print('   bubbles, mine, invites with Join, day lines:', n)
    check(n[0] == 3 and n[1] == 1, 'messages are bubbles, and mine are marked as mine')
    check(n[2] == 1, 'the room invite is a card with a Join button')
    check(n[3] >= 1, 'a day line')
    B.screenshot(path='test/shots/chat_dm_tidy.png', clip={'x': 0, 'y': 0, 'width': 1280, 'height': 900})
    done(A, B)
