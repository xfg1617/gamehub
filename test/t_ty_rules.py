"""Landlord settings (Nov 2026, Inna): game length (15/25/40 rounds or Classic), building rule (whole colour set or
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
    t0 = time.time(); bad = []; keep = ''
    while time.time() - t0 < secs:
        r = pg.evaluate("""(() => { const m = GAME_MODS.tycoon.engine, G = m.G; if (!G) return null; const S = G.S, B = m.BOARD, bad = [];
          B.forEach((t, i) => { if (S.houses[i] > 0 && S.own[i] === undefined) bad.push('houses on unowned ' + t.n); if (S.houses[i] > 5) bad.push('too many houses ' + t.n); });
          S.cash.forEach((c, i) => { if (!(c >= 0) || isNaN(c)) bad.push('cash ' + i + ' = ' + c); });
          return { bad, over: G.over, round: G.round, max: G.maxRound, log: document.getElementById('ty-log').textContent }; })()""")
        if r and r['log']: keep = r['log']
        if r: r['log'] = keep if r['log'] == '' else r['log']
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
      S.houses[a] = 2; res.price = m.buyoutPrice(S, a); res.expect = B[a].pr + 2 * B[a].hc;
      res.ok = m.canBuyout(S, 0, a);
      S.houses[a] = 5; res.hotel = m.canBuyout(S, 0, a); S.houses[a] = 2;
      S.own[c] = 1; res.fullset = m.canBuyout(S, 0, a); delete S.own[c];
      S.cash[0] = res.price - 1; res.poor = m.canBuyout(S, 0, a); S.cash[0] = 5000;
      res.own = m.canBuyout(S, 1, a);
      const r0 = G.rail[0]; S.own[r0] = 1; res.rail = m.canBuyout(S, 0, r0); res.railPrice = m.buyoutPrice(S, r0) === B[r0].pr;
      return res; })()""")
    print('   engine:', out)
    check(out['price'] == out['expect'], 'the lowest offer = what the plot is worth (land price + houses)')
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
        got = pg.evaluate("""(() => { const q = (s) => document.querySelector(s); const G = GAME_MODS.tycoon.engine.G;
          // you make an offer (Nov 2026: negotiation): raise it twice, then send it
          if (q('#hg-go') && !q('#hg-yes')) { if (!window.__bo) { window.__bo = { cash: G.S.cash.slice(), pos: G.players[0].pos, owner: G.S.own[G.players[0].pos], text: document.getElementById('ty-prompt').innerText, n: 0 }; }
            if (window.__bo.n < 2) { window.__bo.n++; q('#ty-prompt [data-d="50"]').click(); return null; }
            window.__bo.offer = +q('#ty-offer').textContent.replace(/\D/g, ''); q('#hg-go').click(); return null; }
          if (q('#hg-yes')) { window.__sold = (window.__sold || 0) + 1; q('#hg-no').click(); return null; }     // someone wants to buy yours: keep it
          if (q('#bo-yes') && window.__bo && !window.__bo.paid) { window.__bo.counter = +q('#bo-yes').textContent.replace(/\D/g, ''); window.__bo.paid = true; q('#bo-yes').click(); return null; }
          if (window.__bo && window.__bo.offer && !window.__bo.after) { const own = G.S.own[window.__bo.pos]; const log = document.getElementById('ty-log').innerText;
            if (own === 0 || /won't sell|no deal|says no deal/i.test(log.split('offers')[log.split('offers').length - 1] || '')) { window.__bo.after = { cash: G.S.cash.slice(), own, log: log.slice(-400) }; return window.__bo; } }
          if (q('#by-yes')) return q(Math.random() < 0.3 ? '#by-yes' : '#by-no').click(), null;
          const r = q('#ty-roll'); if (r) { r.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); setTimeout(() => window.dispatchEvent(new PointerEvent('pointerup')), 200); return null; }
          const b = q('#mg-go') || q('#ty-prompt button:not(.ty-cardlink):not([data-d])'); if (b) b.click(); return null; })()""")
        if not got: pg.wait_for_timeout(300)
    print('   your offer:', got and {k: got.get(k) for k in ('offer', 'counter', 'owner')}, '|', got and got['text'].replace('\n', ' ')[:150])
    if got:
        o = got['owner']; price = got.get('counter') if got.get('paid') else got['offer']
        check(got['offer'] > 0, 'you can choose your own offer (- / + buttons)')
        if got['after']['own'] == 0:
            check(got['cash'][0] - got['after']['cash'][0] == price and got['after']['cash'][o] - got['cash'][o] == price, f'deal done: you paid {price} and the owner got it')
        else:
            check(got['cash'][0] == got['after']['cash'][0], 'no deal: nobody paid anything (owner refused)')
    else: check(False, 'a chance to make an offer came up within 5 minutes')

    for mode, n in (('long', 40), ('classic', 150), ('quick', 25)):
        pg.evaluate("closeActiveGame && closeActiveGame(); openGame('tycoon')"); pg.wait_for_timeout(400)
        pg.click(f'[data-k="mode"][data-v="{mode}"]'); pg.click('#su-go'); pg.wait_for_timeout(600)
        check(pg.evaluate("GAME_MODS.tycoon.engine.G.maxRound") == n, f'{mode} game length = {n} rounds')
    br.close()
print('ALL OK' if not fails else f'{len(fails)} FAILED'); sys.exit(1 if fails else 0)
