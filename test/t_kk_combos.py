"""Hot Potato Cats combos (Nov 2026): a pair -> the live pick (the other player's cards face down, you pick one);
three of a kind -> name a card and take it; five different cats -> take any card from the discard pile.
Also checks the new card names (no emoji art, original cat names) and that the computer player can play on."""
import sys; sys.path.insert(0, 'test')
from tlib import *
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1280, 900)
    pg.evaluate("setupSave('kittens', { n: 2, clock: 0, hand: 7, nope: 0 }); openGame('kittens')"); pg.wait_for_timeout(500)
    pg.click('#su-go'); pg.wait_for_timeout(1500)
    names = pg.evaluate("[...document.querySelectorAll('#kk-hand .kk-card .nm')].map(e => e.textContent)")
    print('   my hand:', names)
    check(all(n not in ' '.join(names) for n in ['TACO', 'BEARD', 'MELON', 'RAINBOW', 'POUNCE', 'BEG']) and pg.query_selector('#kk-hand .kk-card svg'), 'cards use the new names and pixel art')
    G = "window.__kkG"
    # 1. pair -> live pick (three Sock Cats: the menu offers Pair or Three)
    pg.evaluate(f"(() => {{ const g = {G}; g.players[0].hand = ['c1', 'c1', 'c1', 'c2', 'c3', 'c4', 'c5']; g.players[1].hand = ['nap', 'shake', 'beg', 'pounce']; g.discard.push('nope'); }})()")
    pg.evaluate(f"{G}.choose(0)"); pg.wait_for_timeout(500)
    check(pg.query_selector('[data-cb="triple"]') is not None and pg.query_selector('[data-cb="pair"]') is not None, 'three of a kind offers Pair or Three')
    pg.click('[data-cb="pair"]'); pg.wait_for_timeout(2500)
    backs = pg.evaluate("document.querySelectorAll('#kk-prompt [data-pi]').length")
    check(backs == 4, 'a pair lays their %d cards face down to pick from' % backs)
    pg.screenshot(path='test/shots/kk_pick.png')
    pg.click('#kk-prompt [data-pi="2"]'); pg.wait_for_timeout(2500)
    h0, h1 = pg.evaluate(f"[{G}.players[0].hand.length, {G}.players[1].hand.length]")
    check(h0 == 6 and h1 == 3, f'the picked card moved to me (me {h0}, them {h1})')
    # 2. five different cats -> take any card from the discard pile
    pg.wait_for_timeout(500)
    check(pg.query_selector('#kk-five') is not None, 'with five different cats, "Play 5 different cats" appears')
    pg.click('#kk-five'); pg.wait_for_timeout(3500)
    opts = pg.evaluate("[...document.querySelectorAll('#kk-prompt [data-dg]')].map(e => e.dataset.dg)")
    check('nope' in opts, f'the discard pile is offered: {opts}')
    pg.click('#kk-prompt [data-dg="nope"]'); pg.wait_for_timeout(2000)
    check('nope' in pg.evaluate(f"{G}.players[0].hand"), 'the chosen card came back to my hand')
    # 3. three of a kind -> name a card
    pg.evaluate(f"(() => {{ const g = {G}; g.players[0].hand = ['c2', 'c2', 'c2']; g.players[1].hand = ['defuse', 'nap', 'peek']; }})()")
    pg.evaluate(f"{G}.choose(0)"); pg.wait_for_timeout(500)
    pg.click('[data-cb="triple"]'); pg.wait_for_timeout(600)
    pg.click('[data-nm="defuse"]'); pg.wait_for_timeout(3000)
    mine = pg.evaluate(f"{G}.players[0].hand"); theirs = pg.evaluate(f"{G}.players[1].hand")
    check('defuse' in mine and 'defuse' not in theirs, f'naming OVEN MITT took it (me {mine}, them {theirs})')
    # the game carries on: draw, the computer plays its turn
    pg.click('#kk-draw'); pg.wait_for_timeout(6000)
    check(pg.evaluate(f"{G}.cur") == 0 or pg.evaluate(f"{G}.over"), 'the computer took its turn and it came back to me')
    errs = pg.errs[:3]
    check(not errs, f'no page errors {errs}')
    print('ALL GOOD' if not fails else f'{len(fails)} PROBLEMS')
