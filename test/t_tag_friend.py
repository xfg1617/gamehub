"""'+ Friend' on name tags at an online table (Nov 2026, Inna): A sees the button on B's tag (not on computers or on
A's own tag), one tap sends the request and the button goes away; B can accept from the pop-up."""
import sys; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, B = players(p, 2)
    code = open_table(A, 'colorclash', 'room', {'n': 3})
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(4000)
    info = A.evaluate("[...document.querySelectorAll('.fr-add-mini')].map(b => [b.dataset.uid, b.closest('[id]').id, b.textContent])")
    buid = B.evaluate("NET.me.id")
    print('   buttons on A:', info)
    check(len(info) == 1 and info[0][0] == buid, "A sees '+ Friend' only on B's tag")
    A.screenshot(path='test/shots/tag_friend.png')
    A.click('.fr-add-mini'); A.wait_for_timeout(1500)
    check(not A.query_selector('.fr-add-mini'), 'after one tap the button goes away (request sent)')
    B.wait_for_timeout(2500)
    check(B.evaluate("!!document.querySelector('#fr-req-pop:not(.hidden)')"), 'B gets the friend request pop-up')
    done(A, B)
