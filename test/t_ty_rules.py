"""Property Tycoon settings (Nov 2026, Inna): game length (15/25/40 rounds or Classic), building rule (whole colour set or
stand on your plot), and buy-outs (after paying rent, buy the plot for 2x (land + houses); never a plot with a hotel or
from a full colour set). Four computer players play fast games; the log and the board are checked."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None

def run(pg, picks, secs):
    pg.evaluate("closeActiveGame && closeActiveGame(); window.__tycoonSim = true; window.__fast = true; openGame('tycoon')"); pg.wait_for_timeout(400)
    for k, v in picks.items(): pg.click(f'[data-k="{k}"][data-v="{v}"]')
    pg.click('#su-go'); pg.wait_for_timeout(500)
    t0 = time.time(); bad = []
    while time.time() - t0 < secs:
        r = pg.evaluate("""(() => { const m = GAME_MODS.tycoon.engine, G = m.G; if (!G) return null; const S = G.S, B = m.BOARD, bad = [];
          B.forEach((t, i) => { if (S.houses[i] > 0 && S.own[i] === undefined) bad.push('houses on unowned ' + t.n); if (S.houses[i] > 5) bad.push('too many houses ' + t.n); });
          S.cash.forEach((c, i) => { if (!(c >= 0) || isNaN(c)) bad.push('cash ' + i + ' = ' + c); });
          return { bad, over: G.over, round: G.round, max: G.maxRound, log: document.getElementById('ty-log').innerText }; })()""")
        if r: bad += r['bad']
        if r and r['over']: break
        pg.wait_for_timeout(400)
    return r, bad

with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    # engine rules for buy-outs on a hand-made board
    out = pg.evaluate("""(() => { const m = GAME_MODS.tycoon.engine, B = m.BOARD, G = m.GROUPS;
      const g = Object.keys(G).find((k) => k !== 'rail' && k !== 'ut' && G[k].length === 3), [a, b, c] = G[g];
      const S = { cash: [5000, 5000], own: { [a]: 1, [b]: 1 }, houses: {}, mort: {} }; B.forEach((t, i) => { if (t.k === 'prop') S.houses[i] = 0; });
      const res = {};
      S.houses[a] = 2; res.price = m.buyoutPrice(S, a); res.expect = 2 * (B[a].pr + 2 * B[a].hc);
      res.ok = m.canBuyout(S, 0, a);
      S.houses[a] = 5; res.hotel = m.canBuyout(S, 0, a); S.houses[a] = 2;
      S.own[c] = 1; res.fullset = m.canBuyout(S, 0, a); delete S.own[c];
      S.cash[0] = res.price - 1; res.poor = m.canBuyout(S, 0, a); S.cash[0] = 5000;
      res.own = m.canBuyout(S, 1, a);
      const r0 = G.rail[0]; S.own[r0] = 1; res.rail = m.canBuyout(S, 0, r0); res.railPrice = m.buyoutPrice(S, r0) === 2 * B[r0].pr;
      return res; })()""")
    print('   engine:', out)
    check(out['price'] == out['expect'], 'buy-out price = 2 x (land price + houses)')
    check(out['ok'] and out['rail'] and out['railPrice'], 'a plot with houses, or a railroad, can be bought out')
    check(not out['hotel'], 'never a plot with a hotel')
    check(not out['fullset'], 'never a plot from a full colour set')
    check(not out['poor'] and not out['own'], 'not without the cash, not your own plot')

    r, bad = run(pg, {'n': 4, 'mode': 'short', 'build': 'land', 'buyout': 1, 'auction': 1, 'clock': 0}, 240)
    log = r['log']
    print('   short game: round', r['round'], '/', r['max'], '| over', r['over'], '| buy-outs:', log.count(' from ') , '| builds:', log.count('builds on'))
    print('   ' + '\n   '.join([l for l in log.split('\n') if '🤝' in l or 'not to buy' in l][:6]))
    check(r['max'] == 15 and r['over'], 'Short game ends after 15 rounds')
    check(log.count('builds on') > 0, 'stand-on-your-plot: computer players build without owning a whole colour')
    check(not bad, 'board stays valid: ' + ', '.join(sorted(set(bad))[:4]))
    check(not pg.errs, 'no page errors: ' + str(pg.errs[:2]))
    pg.screenshot(path='test/shots/ty_rules.png')
    # a person gets the buy-out offer and can take it: you play (auto-clicker), computers own things
    pg.evaluate("closeActiveGame && closeActiveGame(); window.__tycoonSim = false; openGame('tycoon')"); pg.wait_for_timeout(400)
    for k, v in {'n': 4, 'mode': 'long', 'build': 'set', 'buyout': 1, 'auction': 0, 'clock': 0, 'cash': 2500}.items(): pg.click(f'[data-k="{k}"][data-v="{v}"]')
    pg.click('#su-go'); t0 = time.time(); got = None
    while time.time() - t0 < 300 and not got:
        got = pg.evaluate("""(() => { const q = (s) => document.querySelector(s);
          if (q('#bo-yes')) { const t = document.getElementById('ty-prompt').innerText; const G = GAME_MODS.tycoon.engine.G; window.__bo = { cash: G.S.cash.slice(), pos: G.players[0].pos, owner: G.S.own[G.players[0].pos], text: t }; q('#bo-yes').click(); return null; }
          if (window.__bo && !window.__bo.after) { const G = GAME_MODS.tycoon.engine.G; window.__bo.after = { cash: G.S.cash.slice(), own: G.S.own[window.__bo.pos] }; return window.__bo; }
          if (q('#by-yes')) return q(Math.random() < 0.3 ? '#by-yes' : '#by-no').click(), null;
          const r = q('#ty-roll'); if (r) { r.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); setTimeout(() => window.dispatchEvent(new PointerEvent('pointerup')), 200); return null; }
          const b = q('#mg-go') || q('#ty-prompt button:not(.ty-cardlink)'); if (b) b.click(); return null; })()""")
        if not got: pg.wait_for_timeout(300)
    print('   your buy-out:', got and got['text'].replace('\n', ' ')[:160])
    if got:
        import re
        price = int(re.search(r'= \$(\d+)', got['text']).group(1)); o = got['owner']
        check(got['after']['own'] == 0, 'you own the plot after buying it out')
        check(got['cash'][0] - got['after']['cash'][0] == price and got['after']['cash'][o] - got['cash'][o] == price, f'you paid {price} and the owner got it')
    else: check(False, 'a buy-out offer came up for you within 5 minutes')

    for mode, n in (('long', 40), ('classic', 150), ('quick', 25)):
        pg.evaluate("closeActiveGame && closeActiveGame(); openGame('tycoon')"); pg.wait_for_timeout(400)
        pg.click(f'[data-k="mode"][data-v="{mode}"]'); pg.click('#su-go'); pg.wait_for_timeout(600)
        check(pg.evaluate("GAME_MODS.tycoon.engine.G.maxRound") == n, f'{mode} game length = {n} rounds')
    br.close()
print('ALL OK' if not fails else f'{len(fails)} FAILED'); sys.exit(1 if fails else 0)
