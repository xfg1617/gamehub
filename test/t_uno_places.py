"""Uno plays on after the first player goes out (Inna, Nov 2026): places 1st, 2nd, 3rd... until one player is left."""
import sys; sys.path.insert(0, 'test')
from tlib import *
from nplib import check, done
E = "GAME_MODS.colorclash.engine.G"
def act(pg):
    for sel in ('#cc-clash', '#cc-pl', '[data-col]'):
        b = pg.query_selector(sel)
        if b and b.is_visible(): b.evaluate('e => e.click()'); return
    c = pg.query_selector('#cc-hand .cc-card.ok')
    if c: c.evaluate('e => e.click()'); return
    if pg.query_selector('#cc-hand .cc-card.no'): pg.evaluate("document.getElementById('cc-draw').click()")
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1500, 900)
    pg.evaluate("window.__fast = true; setupSave && 0; openGame('colorclash')"); pg.wait_for_timeout(300)
    pg.evaluate("document.querySelectorAll('[data-k=\"n\"] button, [data-key=\"n\"] button').forEach(b => { if (b.textContent.trim().startsWith('4')) b.click(); })")
    pg.click('#su-go'); pg.wait_for_timeout(1500)
    n = pg.evaluate(f"{E}.players.length"); print('   players', n)
    # the next computer player is about to go out: give it a single Wild card
    pg.evaluate(f"(() => {{ const G = {E}; G.players[1].hand = [{{ c: 'w', v: 'w', id: 'x1' }}]; }})()")
    for k in range(80):
        if pg.evaluate(f"{E}.places.length >= 1"): break
        act(pg); pg.wait_for_timeout(300)
    check(pg.evaluate(f"{E}.places[0] === 1"), 'the computer player who emptied its hand is 1st')
    check(not pg.evaluate(f"{E}.over"), 'and the game goes on for the others')
    pg.wait_for_timeout(1500)
    check(pg.query_selector('#cc-seat-1 .fb-place') is not None, 'its seat shows 1ST')
    # play on a while: player 1 never gets a turn again
    turns = set()
    for k in range(30):
        if pg.evaluate(f"{E}.over"): break
        turns.add(pg.evaluate(f"{E}.cur")); act(pg); pg.wait_for_timeout(300)
    check(1 not in turns, 'the player who is out is passed over')
    # now I go out: only computers are left, so the game ends with full places
    pg.evaluate(f"(() => {{ const G = {E}; G.players[0].hand = [{{ c: 'w', v: 'w', id: 'x2' }}]; }})()")
    for k in range(80):
        if pg.evaluate(f"{E}.over"): break
        act(pg); pg.wait_for_timeout(300)
    pg.wait_for_timeout(1500)
    pl = pg.evaluate(f"{E}.places"); print('   places', pl)
    check(len(pl) == n and pl[0] == 1 and pl[1] == 0, 'final places: computer 1st, me 2nd, the rest ranked by cards left')
    pg.wait_for_timeout(2000); t = pg.evaluate("(document.querySelector('#g-modal h3') || {}).textContent || ''"); print("   result:", t)
    check('2nd' in t, 'my result screen says 2nd place')
    pg.screenshot(path='test/shots/uno_places.png')
    check(not pg.errs, 'no errors ' + str(pg.errs[:2]))
    br.close()
