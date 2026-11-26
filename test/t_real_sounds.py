"""Real recorded sounds (Kenney CC0, Nov 2026): after the first tap they are decoded and played for cards, chips, dice,
pool and bowling (with the synth as a backup)."""
import sys; sys.path.insert(0, 'test')
from tlib import *
from nplib import check
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1400, 900)
    pg.evaluate("() => { if (!SFX.isOn()) { SFX.setOn(true); } SFX.unlock(); }")
    pg.mouse.click(700, 450); pg.wait_for_timeout(2500)
    names = pg.evaluate("Object.keys(window.SFX_FILES)"); print('   sounds in the page:', names)
    got = pg.evaluate("(() => { const o = {}; Object.keys(window.SFX_FILES).forEach((k) => { o[k] = (window.__rs = window.__rs || 0, (typeof REALSND !== 'undefined' ? (REALSND.bufs[k] || []).length : -1)); }); return o; })()")
    print('   decoded:', got)
    check(all(v > 0 for v in got.values()), 'every recording decodes')
    played = pg.evaluate("['ball', 'rail', 'pocket', 'cue', 'card', 'chip', 'dice', 'pin'].map((n) => realSnd(n, 0.5))")
    check(all(played), 'they play (pool, cards, chips, dice, pins)')
    for n in ['card', 'deal', 'chip', 'dice', 'pins', 'strike', 'move']: pg.evaluate(f"SFX.play('{n}')")
    pg.evaluate("openGame('pool')"); pg.wait_for_timeout(300); pg.click('#su-go'); pg.wait_for_timeout(1500)
    pg.evaluate("document.getElementById('pl-cv').focus()"); pg.keyboard.press(' '); pg.wait_for_timeout(4000)
    check(not pg.errs, 'no errors ' + str(pg.errs[:2]))
    br.close()
