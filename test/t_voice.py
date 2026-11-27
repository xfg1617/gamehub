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
    for pg in (A, B):
        pg.click('#vc-fab'); pg.wait_for_timeout(300)
        check(pg.query_selector('#vc-join') is not None and 'Nothing is recorded' in pg.inner_text('#vc-pop'), 'panel explains voice and offers Join')
        pg.click('#vc-join'); pg.wait_for_timeout(800)
    ida, idb = A.evaluate('NET.me.id'), B.evaluate('NET.me.id')
    try: A.wait_for_function(f"VOICE.state().peers['{idb}'] === 'connected'", timeout=20000); B.wait_for_function(f"VOICE.state().peers['{ida}'] === 'connected'", timeout=20000); ok = True
    except Exception: ok = False
    print('   A:', A.evaluate('VOICE.state()'), '\n   B:', B.evaluate('VOICE.state()'))
    check(ok, 'the two browsers are connected directly')
    check('Hold to talk' in A.inner_text('#vc-pop') and A.evaluate("VOICE.state().mode") == 'ptt', 'push-to-talk is the default')
    # silent until you hold talk
    check(A.evaluate("VOICE.state().live") is False, 'mic is off until you hold talk')
    r0 = B.evaluate('VOICE.stats()').get(ida, 0)
    box = A.query_selector('#vc-ptt').bounding_box(); A.mouse.move(box['x'] + 20, box['y'] + 10); A.mouse.down(); A.wait_for_timeout(1500)
    talk = B.evaluate(f"VOICE.state().talk['{ida}']")
    row = B.evaluate("[...document.querySelectorAll('.vc-row.talk')].map(r => r.innerText).join('|')")
    r1 = B.evaluate('VOICE.stats()').get(ida, 0)
    A.mouse.up(); A.wait_for_timeout(600)
    print(f'   sound bytes received by B: {r0} -> {r1}; talking rows on B: {row!r}')
    check(talk is True and r1 > r0 + 2000, 'holding talk: the friend receives the sound and sees you talking')
    check(B.evaluate(f"VOICE.state().talk['{ida}']") is False, 'letting go: talking mark goes away')
    A.keyboard.down('v'); A.wait_for_timeout(500); kv = B.evaluate(f"VOICE.state().talk['{ida}']"); A.keyboard.up('v'); A.wait_for_timeout(300)
    check(kv is True, 'holding the V key talks too')
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
    done(A, B)
    A.context.browser.close()
with sync_playwright() as p:
    A, B = players(p, 2, account=False)
    code = open_table(A, 'tictactoe', 'room', {'len': 3}); A.wait_for_timeout(1200)
    A.click('#vc-fab'); A.wait_for_timeout(300)
    check('account' in A.inner_text('#vc-pop') and not A.query_selector('#vc-join'), 'guests are asked to sign up for voice')
    done(A, B)
print('ALL PASS' if not fails else f'FAILED: {fails}')
