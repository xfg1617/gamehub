"""Mine Saboteurs: tunnel pieces must fit and join the tunnel, a dead end stops it, reaching a goal turns it over;
a real turn by clicking (pick a tunnel card, tap a glowing square); then several fast games to the end, where both
teams can win."""
import sys; sys.path.insert(0, 'test')
from nplib import *
S = sys.argv[1] if len(sys.argv) > 1 else 'test/shots/'
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1440, 900)
    r = pg.evaluate("""(() => { const E = GAME_MODS.tunnel.engine, b = E.newBoard(1), R = () => E.reach(b), out = {};
      out.join = E.fits(b, 1, 0, 10, R()); out.bad = E.fits(b, 1, 0, 5, R()); out.far = E.fits(b, 3, 0, 15, R());
      b.set('1,0', { e: 10, dead: true }); out.deadStops = E.fits(b, 2, 0, 15, R());
      b.set('1,0', { e: 10 }); for (let x = 2; x <= 7; x++) b.set(x + ',0', { e: 10 });
      out.goal = JSON.stringify(E.touchedGoals(b)); return out; })()""")
    print('  ', r)
    check(r['join'] and not r['bad'] and not r['far'], 'a piece must fit its neighbours and join the tunnel')
    check(not r['deadStops'], 'nothing can be joined past a dead end')
    check(r['goal'] == '[1]', 'a tunnel reaching a goal stone turns it over')
    # one real turn by clicking
    pg.evaluate("setupSave('tunnel', { n: 4 }); openGame('tunnel')"); pg.wait_for_timeout(400)
    if pg.query_selector('[data-mode]'): pg.click('[data-mode]'); pg.wait_for_timeout(300)
    pg.click('#su-go'); pg.wait_for_selector('#tt-board .tt-cell', timeout=10000)
    pg.wait_for_function("GAME_MODS.tunnel.engine.G.myK", timeout=60000); pg.wait_for_timeout(300)
    i = pg.evaluate("GAME_MODS.tunnel.engine.G.players[0].hand.findIndex(c => c.k === 'tun' && !c.dead)")
    if i >= 0:
        pg.click(f'#tt-hand .tt-card[data-i="{i}"]'); pg.wait_for_timeout(300)
        pg.screenshot(path=S + '17_tunnel_pick.png')
        n = pg.evaluate("GAME_MODS.tunnel.engine.G.board.size")
        pg.click('#tt-board .tt-cell.ok'); pg.wait_for_timeout(1200)
        check(pg.evaluate("GAME_MODS.tunnel.engine.G.board.size") == n + 1, 'digging by clicking a glowing square works')
    else:
        pg.click('#tt-hand .tt-card[data-i="0"]'); pg.click('#tt-throw')
    # fast games: my turns are chosen by the computer's own logic and sent the normal way
    wins = {'digger': 0, 'rascal': 0}
    for g in range(10):
        pg.evaluate("window.__fast = 1; setupSave('tunnel', { n: %d }); openGame('tunnel')" % (3 + g % 4)); pg.wait_for_timeout(300)
        if pg.query_selector('[data-mode]'): pg.click('[data-mode]'); pg.wait_for_timeout(200)
        pg.click('#su-go'); pg.wait_for_selector('#tt-board .tt-cell', timeout=10000)
        for k in range(2000):
            st = pg.evaluate("""(() => { const G = GAME_MODS.tunnel.engine.G; if (!G) return 'none'; if (G.over) return 'over';
              if (G.myK) { const me = G.players[G.me]; const a = GAME_MODS.tunnel.engine.botMove(G, me); G.sel = a.i; const k = G.myK; G.myK = null; G.S.act(Object.assign({ s: G.me, k }, a)); } return 'on'; })()""")
            if st == 'over': break
            pg.wait_for_timeout(30)
        pg.wait_for_selector('#g-modal:not(.hidden)', timeout=20000)
        t = pg.inner_text('#g-modal')
        if 'gold' in t.lower() and ('Diggers win' in t or 'You win' in t and 'DIGGER' in t): wins['digger'] += 1
        else: wins['rascal'] += 1
        if g == 1: pg.screenshot(path=S + '17_tunnel_end.png')
        pg.evaluate("document.getElementById('g-modal').classList.add('hidden')")
    print('   wins:', wins)
    check(sum(wins.values()) == 10, 'ten games played to the end')
    check(wins['digger'] > 0, 'the Diggers can win (gold reached)')
    ph = open_page(br, 390, 844)
    ph.evaluate("setupSave('tunnel', { n: 5 }); openGame('tunnel')"); ph.wait_for_timeout(400)
    if ph.query_selector('[data-mode]'): ph.click('[data-mode]'); ph.wait_for_timeout(300)
    ph.click('#su-go'); ph.wait_for_selector('#tt-board .tt-cell', timeout=10000); ph.wait_for_timeout(600)
    check(ph.evaluate("document.documentElement.scrollWidth <= 392"), 'no sideways page scrolling on a phone (the map scrolls inside its box)')
    ph.screenshot(path=S + '17_tunnel_phone.png', full_page=True)
    check(not pg.errs and not ph.errs, 'no page errors ' + str(pg.errs + ph.errs))
    br.close()
done()
