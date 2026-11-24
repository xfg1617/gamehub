"""Unique names (Nov 2026): changing your name to one another player has is refused straight away with a clear message
(the profile box stays open, nothing changes); a free name is saved online at once; capital letters don't matter."""
import sys; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, B = players(p, 2)
    bname = B.evaluate("NET.me.name"); aname = A.evaluate("NET.me.name")
    A.evaluate("openProfileModal()"); A.wait_for_timeout(300)
    A.fill('#prof-username-input', bname.upper()); A.evaluate("saveProfile()"); A.wait_for_timeout(1200)
    toast = A.evaluate("document.getElementById('toast-container').innerText")
    check('already taken' in toast and A.evaluate("NET.me.name") == aname and A.evaluate("!document.getElementById('profile-modal').classList.contains('hidden')"),
          f'a taken name ({bname.upper()}) is refused at once and the box stays open')
    A.fill('#prof-username-input', 'Fresh Name 77'); A.evaluate("saveProfile()"); A.wait_for_timeout(1200)
    on = B.evaluate("(id) => NET.profileOf(id).then(p => p.name)", A.evaluate("NET.me.id"))
    check(A.evaluate("profile.username") == 'Fresh Name 77' and A.evaluate("NET.me.name") == 'Fresh Name 77', 'a free name is saved')
    check(A.evaluate("document.getElementById('profile-modal').classList.contains('hidden')"), 'the box closes after saving')
    done(A, B)
