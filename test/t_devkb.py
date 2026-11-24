"""Word games on phones/iPads (Nov 2026): tapping "Use my keyboard" (or the board) opens the device keyboard, and
typing works: letters, Backspace, Enter. Checked like an iPhone (real key presses) and like Android (letters arrive
only as text changes, no key events). No double letters. Daily Word, Word Duel, Word Connect."""
import sys; sys.path.insert(0, 'test')
from tlib import *
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
def android_type(pg, text):   # Android keyboards: the text box changes, no key events for letters
    for ch in text:
        pg.evaluate("(ch) => { const b = document.activeElement; b.value = b.value + ch; b.dispatchEvent(new Event('input', { bubbles: true })); }", ch)
def android_back(pg):
    pg.evaluate("() => { const b = document.activeElement; b.value = b.value.slice(0, -1); b.dispatchEvent(new Event('input', { bubbles: true })); }")
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 390, 844, mobile=True)
    # Daily Word
    pg.evaluate("openDailyWord(true)"); pg.wait_for_timeout(500)
    btn = pg.query_selector('#dw-devkb .devkb-show')
    check(btn is not None and btn.is_visible(), 'Daily Word shows "Use my keyboard" on a phone')
    btn.click(); pg.wait_for_timeout(200)
    check(pg.evaluate("document.activeElement && document.activeElement.dataset.devkb === '1'"), 'tapping it focuses the typing box (opens the device keyboard)')
    check(pg.evaluate("getComputedStyle(document.getElementById('dw-keyboard')).display") == 'none', 'the on-screen keys step aside while typing')
    pg.keyboard.type('cranx'); pg.keyboard.press('Backspace'); pg.keyboard.type('e')
    check(pg.evaluate("dw.current") == 'CRANE', f'iPhone-style typing + Backspace: {pg.evaluate("dw.current")}')
    pg.keyboard.press('Enter'); pg.wait_for_timeout(2500)
    check(pg.evaluate("dw.guesses.length") == 1, 'Enter submits the guess')
    android_type(pg, 'slatq'); android_back(pg); android_type(pg, 'e')
    check(pg.evaluate("dw.current") == 'SLATE', f'Android-style typing + Backspace: {pg.evaluate("dw.current")}')
    pg.screenshot(path='test/shots/devkb_daily.png')
    # tapping the board also opens it
    pg.evaluate("document.activeElement.blur()"); pg.click('#dw-grid'); pg.wait_for_timeout(200)
    check(pg.evaluate("document.activeElement && document.activeElement.dataset.devkb === '1'"), 'tapping the board opens the keyboard too')
    # Word Duel (vs computer on this device)
    pg.evaluate("document.activeElement.blur(); navigateTo('play', true); openGame('wordduel')"); pg.wait_for_timeout(500)
    if pg.query_selector('#su-go'): pg.click('#su-go'); pg.wait_for_timeout(1500)
    b2 = pg.query_selector('#wd-devkb .devkb-show')
    check(b2 is not None and b2.is_visible(), 'Word Duel shows the button')
    b2.click(); pg.keyboard.type('house'); pg.wait_for_timeout(300)
    cur = pg.evaluate("[...document.querySelectorAll('#wd-board > *')][0] ? document.getElementById('wd-board').innerText.replace(/\\s/g,'') : ''")
    check(cur.startswith('HOUSE') and 'HOUSEHOUSE' not in cur, f'Word Duel gets each letter once: {cur[:12]}')
    # Word Connect
    pg.evaluate("document.activeElement.blur(); navigateTo('play', true); openGame('wordconnect')"); pg.wait_for_timeout(500)
    if pg.query_selector('[data-mode="here"]'): pg.click('[data-mode="here"]'); pg.wait_for_timeout(300)
    if pg.query_selector('#su-go'): pg.click('#su-go'); pg.wait_for_timeout(1500)
    b3 = pg.query_selector('#wc-devkb .devkb-show')
    check(b3 is not None and b3.is_visible(), 'Word Connect shows the button')
    letters = pg.evaluate("[...document.querySelectorAll('#wc-wheel [data-i]')].map(e => e.textContent.trim().toLowerCase())")
    b3.click(); pg.keyboard.type(''.join(letters[:2])); pg.wait_for_timeout(300)
    check(len(pg.evaluate("document.getElementById('wc-cur').innerText.replace(/\\s/g,'')")) == 2, 'Word Connect: typed letters pick letters on the wheel')
    # desktop: no button, normal typing unchanged
    pd = open_page(br, 1280, 900)
    pd.evaluate("openDailyWord(true)"); pd.wait_for_timeout(500)
    check(not pd.query_selector('#dw-devkb .devkb-show').is_visible(), 'on a computer the button is hidden')
    pd.keyboard.type('crane'); check(pd.evaluate("dw.current") == 'CRANE', 'computer keyboard still works as before')
    check(not pg.errs and not pd.errs, f'no page errors {pg.errs[:2]} {pd.errs[:2]}')
    print('ALL GOOD' if not fails else f'{len(fails)} PROBLEMS')
