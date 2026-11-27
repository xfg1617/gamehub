"""Voice chat (Nov 2026): two players in a private room join voice; their browsers connect directly, holding
"talk" sends sound and shows who is talking; mute for me; leaving the room leaves voice; quick match has no voice.
Uses Chromium's pretend microphone (a beeping tone). python3 test/t_voice.py"""
import sys; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, B = players(p, 2)
    check(not A.query_selector('#vc-fab'), 'no voice button on the home page')
    code = open_table(A, 'tictactoe', 'room', {'len': 3})
    A.wait_for_timeout(1200)
    check(A.query_selector('#vc-fab') is not None, f'voice button shows in the private room {code}')
    join(B, code); A.wait_for_timeout(2500)
    check(A.query_selector('#ttt-board') and B.query_selector('#ttt-board'), 'game started for both')
    check(A.query_selector('#vc-fab') and B.query_selector('#vc-fab'), 'voice button stays at the table')
    for pg in (A, B): pg.evaluate('window.__vcIceDelay = 400')   # like the live site: getting relay details takes a moment
    # a reminder to join pops up by itself; joining from it shows how to talk
    try: A.wait_for_selector('#vc-nudge [data-a="join"]', timeout=8000); nud = A.inner_text('#vc-nudge')
    except Exception: nud = ''
    print('   reminder:', nud.replace('\n', ' '))
    check('Join voice' in nud, 'a reminder bubble invites you to join voice chat')
    A.screenshot(path='test/shots/voice_nudge.png')
    A.click('#vc-nudge [data-a="join"]')
    try: A.wait_for_selector('#vc-coach', timeout=8000); coach = A.inner_text('#vc-coach')
    except Exception: coach = ''
    print('   tip:', coach.replace('\n', ' '))
    check('Hold the 🎤 button' in coach and A.evaluate("document.getElementById('vc-fab').classList.contains('coach')"), 'after joining: a tip says hold the button to talk (and the button says HOLD)')
    A.screenshot(path='test/shots/voice_coach.png')
    # the friend, not in voice yet, is told who is talking and can join in one tap
    try: B.wait_for_function("(document.getElementById('vc-nudge') || {}).innerText && document.getElementById('vc-nudge').innerText.includes('voice chat') && document.getElementById('vc-nudge').innerText.includes(" + repr(A.evaluate('NET.me.name')) + ")", timeout=10000); ok = True
    except Exception: ok = False
    print('   friend sees:', B.evaluate("(document.getElementById('vc-nudge') || {}).innerText || ''").replace('\n', ' '))
    check(ok, 'the friend sees "<name> is in voice chat. Join them!"')
    B.screenshot(path='test/shots/voice_nudge_friend.png')
    B.click('#vc-nudge [data-a="join"]'); B.wait_for_timeout(500)
    ida, idb = A.evaluate('NET.me.id'), B.evaluate('NET.me.id')
    try: A.wait_for_function(f"VOICE.state().peers['{idb}'] === 'connected'", timeout=20000); B.wait_for_function(f"VOICE.state().peers['{ida}'] === 'connected'", timeout=20000); ok = True
    except Exception: ok = False
    print('   A:', A.evaluate('VOICE.state()'), '\n   B:', B.evaluate('VOICE.state()'))
    check(ok, 'the two browsers are connected directly')
    check(A.evaluate("VOICE.state().mode") == 'ptt', 'push-to-talk is the default')
    # silent until you hold talk
    check(A.evaluate("VOICE.state().live") is False, 'mic is off until you hold talk')
    r0 = B.evaluate('VOICE.stats()').get(ida, 0)
    try: A.wait_for_function("(document.getElementById('vc-note') || {}).innerText && document.getElementById('vc-note').innerText.includes('joined voice')", timeout=6000); jn = True
    except Exception: jn = False
    check(jn, 'a small note says when someone joins voice')
    box = A.query_selector('#vc-fab').bounding_box(); A.mouse.move(box['x'] + 20, box['y'] + 20); A.mouse.down(); A.wait_for_timeout(1500)
    good = A.evaluate("(document.getElementById('vc-coach') || {}).innerText || ''")
    check("That's it" in good or not A.query_selector('#vc-coach'), 'holding the button: the tip says "That\'s it!"')
    talk = B.evaluate(f"VOICE.state().talk['{ida}']")
    row = B.evaluate("[...document.querySelectorAll('.vc-row.talk')].map(r => r.innerText).join('|')")
    r1 = B.evaluate('VOICE.stats()').get(ida, 0)
    A.mouse.up(); A.wait_for_timeout(600)
    A.click('#vc-fab'); A.wait_for_timeout(300)   # a quick tap opens the panel
    print(f'   sound bytes received by B: {r0} -> {r1}; talking rows on B: {row!r}')
    check(talk is True and r1 > r0 + 2000, 'holding talk: the friend receives the sound and sees you talking')
    check(B.evaluate(f"VOICE.state().talk['{ida}']") is False, 'letting go: talking mark goes away')
    A.keyboard.down('v'); A.wait_for_timeout(500); kv = B.evaluate(f"VOICE.state().talk['{ida}']"); A.keyboard.up('v'); A.wait_for_timeout(300)
    check(kv is True, 'holding the V key talks too')
    B.click('#vc-fab'); B.wait_for_timeout(300)
    print('   B panel:', B.evaluate("[!!document.getElementById('vc-pop'), [...document.querySelectorAll('.vc-bub')].map(b => b.id)]"))
    B.click(f'[data-vm="{ida}"]'); B.wait_for_timeout(200)
    check(B.evaluate(f"document.querySelector('audio[data-vc=\"{ida}\"]').muted") is True, 'mute for me: their voice is silenced on my screen only')
    A.click('[data-vmode="open"]'); A.wait_for_timeout(1500)
    check(A.evaluate("VOICE.state().mode") == 'open' and 'Your mic is on' in A.inner_text('#vc-pop'), 'open mic mode')
    B.screenshot(path='test/shots/voice_table.png'); A.screenshot(path='test/shots/voice_table_a.png')
    A.click('[data-vmode="ptt"]')
    # leaving the room leaves voice
    B.evaluate("navigateTo('play', true)"); B.wait_for_timeout(400)
    try: B.click('#cf-yes', timeout=2000)
    except Exception: pass
    B.wait_for_timeout(2500)
    check(B.evaluate("VOICE.state().on") is False and not B.query_selector('#vc-fab'), 'leaving the table leaves voice')
    try: A.wait_for_function(f"!VOICE.state().peers['{idb}']", timeout=8000); gone = True
    except Exception: gone = False
    check(gone, 'the other screen drops that connection')
    # A goes on to a new private room: voice comes back by itself (mic already allowed), with a short tip
    A.evaluate("navigateTo('play', true)"); A.wait_for_timeout(400)
    try: A.click('#cf-yes', timeout=2000)
    except Exception: pass
    A.wait_for_timeout(1500)
    code2 = open_table(A, 'tictactoe', 'room', {'len': 3})
    try: A.wait_for_function("VOICE.state().on && VOICE.state().code === " + repr(code2), timeout=10000); auto = True
    except Exception: auto = False
    tip = A.evaluate("(document.getElementById('vc-coach') || {}).innerText || ''")
    print('   new room', code2, '| tip:', tip.replace('\n', ' '))
    check(auto and 'Voice chat is on' in tip, 'next private room: voice turns back on by itself, with a short tip')
    A.click('#vc-fab'); A.wait_for_timeout(300); A.click('#vc-leave'); A.wait_for_timeout(500)
    check(A.evaluate("sessionStorage.getItem('ps_vc_auto')") is None, 'pressing Leave voice stops it coming back by itself')
    done(A, B)
    A.context.browser.close()
with sync_playwright() as p:
    A, B = players(p, 2, account=False)
    code = open_table(A, 'tictactoe', 'room', {'len': 3}); A.wait_for_timeout(1200)
    A.click('#vc-fab'); A.wait_for_timeout(300)
    check('account' in A.inner_text('#vc-pop') and not A.query_selector('#vc-join'), 'guests are asked to sign up for voice')
    done(A, B)
print('ALL PASS' if not fails else f'FAILED: {fails}')
