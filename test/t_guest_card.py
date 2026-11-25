"""A guest's player card (Inna, Nov 2026): tapping a player without an account shows a clear guest card (GUEST, can't be
added as a friend yet) instead of an empty profile."""
import sys; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, B = players(p, 2, account=False)
    A.wait_for_timeout(17000)   # A's browser publishes its small stats summary (with guest: true)
    aid = A.evaluate("NET.me.id")
    B.evaluate(f"openPlayerCard('{aid}')"); B.wait_for_timeout(1500)
    t = B.evaluate("document.getElementById('pcard-modal').innerText"); print('   card:', t.replace('\n', ' ')[:220])
    check('GUEST' in t and "can't be added as friends" in t, 'the guest card says GUEST and explains friends need an account')
    check('Add friend' not in t, 'no Add friend button on a guest')
    B.screenshot(path='test/shots/guest_card.png')
    done(A, B)
