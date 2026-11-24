"""Fibber: the computer always calls an impossible claim, plays real cards when it has them, and a whole game
against 3 computer players is played by clicking (putting cards down, shouting FIBBER!) to the end."""
import sys; sys.path.insert(0, 'test')
from nplib import *
S = sys.argv[1] if len(sys.argv) > 1 else 'test/shots/'
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1440, 900)
    r = pg.evaluate("""(() => { const E = GAME_MODS.fibber.engine, R = () => 0.5;
      const h = [{ r: 7, s: 'h' }, { r: 7, s: 's' }, { r: 7, s: 'd' }, { r: 3, s: 'c' }];
      return { imp: E.botDoubt(h, 7, 2, 10, () => 0.99), real: JSON.stringify(E.botPlay(h, 7, () => 0.9)), fib: E.botPlay(h, 9, () => 0.9).length }; })()""")
    check(r['imp'] is True, 'holding 3 Sevens, the computer calls "2 Sevens" a fib')
    check(r['real'] == '[0,1,2]', 'with real cards the computer plays them all')
    check(r['fib'] == 1, 'with none, it fibs with one card')
    pg.evaluate("window.__fast = 1; setupSave('fibber', { n: 4, secs: 3 }); openGame('fibber')"); pg.wait_for_timeout(400)
    if pg.query_selector('[data-mode]'): pg.click('[data-mode]'); pg.wait_for_timeout(300)
    pg.click('#su-go'); pg.wait_for_selector('#fb-hand .fb-card', timeout=10000)
    plays = doubts = 0; shot = {'turn': False, 'reveal': False}
    for k in range(12000):
        if pg.evaluate("!GAME_MODS.fibber.engine.G || GAME_MODS.fibber.engine.G.over"): break
        if pg.query_selector('#fb-go:not([disabled])') or pg.query_selector('#fb-go'):
            n = pg.evaluate("(() => { const G = GAME_MODS.fibber.engine.G, me = G.players[G.me]; const idx = [...document.querySelectorAll('#fb-hand .fb-card')].filter(b => +b.dataset.i >= 0); const real = idx.filter(b => me.hand[+b.dataset.i].r === G.need); return (real.length ? real : idx.slice(0, 1)).slice(0, 4).map(b => +b.dataset.i); })()")
            for i in n: pg.evaluate(f"(document.querySelector('#fb-hand .fb-card[data-i=\"{i}\"]') || {{click() {{}}}}).click()")
            if not shot['turn']: pg.screenshot(path=S + '15_fibber_turn.png'); shot['turn'] = True
            pg.evaluate("(document.getElementById('fb-go') || {click() {}}).click()"); plays += 1
        elif pg.query_selector('#fb-doubt'):
            if pg.evaluate("(() => { const G = GAME_MODS.fibber.engine.G, me = G.players[G.me]; return me.hand.filter(c => c.r === G.need).length + G.last.cards.length > 4 || Math.random() < 0.15; })()"):
                pg.evaluate("(document.getElementById('fb-doubt') || {click() {}}).click()"); doubts += 1
            else: pg.evaluate("(document.getElementById('fb-ok') || {click() {}}).click()")
        if not shot['reveal'] and pg.query_selector('.fb-reveal'): pg.wait_for_timeout(300); pg.screenshot(path=S + '15_fibber_reveal.png'); shot['reveal'] = True
        pg.wait_for_timeout(40)
    print('   state:', pg.evaluate("(() => { const G = GAME_MODS.fibber.engine.G; return JSON.stringify({cur: G.cur, step: G.step, need: G.need, hands: G.players.map(q => q.hand.length), pile: G.pile.length, wait: G.S._wait && {seat: G.S._wait.seat, sent: G.S._wait.sent}, prompt: document.getElementById('fb-prompt').innerText, rev: !!G.reveal}); })()"), pg.errs)
    check(pg.evaluate("GAME_MODS.fibber.engine.G.over"), f'the game reaches the end ({plays} plays by you, {doubts} shouts)')
    pl = pg.evaluate("GAME_MODS.fibber.engine.G.places.map(q => q.name + ':' + q.hand.length).join(' ')")
    print('   finishing order:', pl)
    check(len(pl.split()) == 4 and pl.split()[-1].split(':')[1] != '0' and all(x.split(':')[1] == '0' for x in pl.split()[:-1]), 'play goes on until only one player still has cards (1st, 2nd, 3rd, last)')
    pg.wait_for_selector('#g-modal:not(.hidden)', timeout=15000)
    check(plays > 2 and shot['reveal'], 'you played cards and saw cards turned over')
    pg.screenshot(path=S + '15_fibber_end.png')
    ph = open_page(br, 390, 844)
    ph.evaluate("setupSave('fibber', { n: 5, secs: 4 }); openGame('fibber')"); ph.wait_for_timeout(400)
    if ph.query_selector('[data-mode]'): ph.click('[data-mode]'); ph.wait_for_timeout(300)
    ph.click('#su-go'); ph.wait_for_selector('#fb-hand .fb-card', timeout=10000); ph.wait_for_timeout(500)
    check(ph.evaluate("document.documentElement.scrollWidth <= 392"), 'no sideways scrolling on a phone')
    ph.screenshot(path=S + '15_fibber_phone.png', full_page=True)
    check(not pg.errs and not ph.errs, 'no page errors ' + str(pg.errs + ph.errs))
    br.close()
done()
