"""Thirteen (Tien Len): the rules (what is a play, what beats what, bombs), and a whole game of 3 hands against
computers with real clicks on cards.  python3 test/t_thirteen.py"""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
ok = True
def check(c, msg):
    global ok; ok = ok and bool(c); print(('PASS ' if c else 'FAIL ') + msg)
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    r = pg.evaluate("""(() => { const E = GAME_MODS.thirteen.engine, C = (s) => s.split(' ').map(x => ({ r: ({J:11,Q:12,K:13,A:14})[x.slice(0,-1)] || +x.slice(0,-1), s: x.slice(-1) })), P = (s) => E.classify(C(s));
      const o = {};
      o.kinds = ['3s', '7s 7h', '9c 9d 9h', '5s 5c 5d 5h', '4s 5c 6d', '9s 10c Jd Qh Kc Ah', '3s 3c 4d 4h 5s 5c'].map(s => P(s) && P(s).type).join(',');
      o.bad = ['3s 4s', '7s 7h 8c', 'Qs Ks As 2h', 'Ks As 2s', '3s 3c 4d 4h'].map(s => P(s)).filter(Boolean).length;
      o.suit = E.beats(P('7h'), P('7d')) && !E.beats(P('7s'), P('7d'));
      o.two = E.beats(P('2s'), P('As')) && !E.beats(P('As'), P('2s'));
      o.sameKind = !E.beats(P('9s 9c'), P('5s')) && !E.beats(P('5s 6c 7d 8h'), P('4s 5c 6d'));
      o.straight = E.beats(P('5s 6c 7h'), P('5c 6d 7d')) && !E.beats(P('3s 4c 5h'), P('4c 5d 6d'));
      o.bombSingle2 = E.beats(P('6s 6c 6d 6h'), P('2h')) && E.beats(P('3s 3c 4d 4h 5s 5c'), P('2h')) && E.isBomb(P('6s 6c 6d 6h'), P('2h'));
      o.bombPair2 = E.beats(P('3s 3c 4d 4h 5s 5c 6s 6h'), P('2s 2h')) && E.beats(P('6s 6c 6d 6h'), P('2s 2h')) && !E.beats(P('3s 3c 4d 4h 5s 5c'), P('2s 2h'));
      o.noBombOnAce = !E.beats(P('6s 6c 6d 6h'), P('Ah'));
      o.combos = E.combos(C('3s 3c 4d 5h 6s 7c 2h')).length;
      o.botLead = E.botMove(C('3s 3c 4d 5h 6s 9c 2h'), null, C('3s')[0], 2, 13).map(c => c.r + c.s).join(' ');
      o.botBeat = (E.botMove(C('4d 8h 9s Kc 2h'), P('7c'), null, 2, 13) || []).map(c => c.r + c.s).join(' ');
      return o; })()""")
    print(r)
    check(r['kinds'] == 'single,pair,triple,quad,straight,straight,pairs', 'all kinds of plays recognised')
    check(r['bad'] == 0, 'bad mixes are refused (no 2s in straights, no 2-pair runs)')
    check(r['suit'] and r['two'] and r['sameKind'] and r['straight'], 'beating: higher suit, 2 is highest, same kind and length only')
    check(r['bombSingle2'] and r['bombPair2'] and r['noBombOnAce'], 'bombs beat 2s (and only 2s)')
    check('3s' in r['botLead'], 'computer starts with the 3 of spades: ' + r['botLead'])
    check(r['botBeat'] == '8h', 'computer beats a 7 with its lowest higher card, keeps the 2: ' + r['botBeat'])
    pg.evaluate("window.__fast = true; openGame('thirteen')"); pg.wait_for_timeout(300)
    pg.click('[data-k="n"][data-v="4"]'); pg.click('[data-k="hands"][data-v="3"]'); pg.click('[data-k="turn"][data-v="0"]'); pg.click('#su-go'); pg.wait_for_timeout(800)
    check(pg.evaluate("document.querySelectorAll('.th-card').length") == 13, 'you hold 13 cards')
    t0 = time.time(); shot = 0; mine = 0; seen = set()
    while time.time() - t0 < 150 and not pg.query_selector('#g-modal:not(.hidden)'):
        # on my turn: choose what the computer would, click those cards, then Play / Pass
        mv = pg.evaluate("""(() => { const G = GAME_MODS.thirteen.engine.G; if (!G || !G.choose) return null; const me = G.players[G.me];
          const c = GAME_MODS.thirteen.engine.botMove(me.hand, G.table, G.must, 2, 13); return c ? c.map(x => me.hand.findIndex(h => h.r === x.r && h.s === x.s)) : 'pass'; })()""")
        if mv == 'pass': pg.click('#th-pass'); mine += 1
        elif mv:
            for i in mv: pg.click(f'.th-card[data-i="{i}"]')
            pg.click('#th-go'); mine += 1
        if shot < 2 and pg.evaluate("!!document.querySelector('.th-played')"): pg.screenshot(path=f'test/shots/thirteen_{shot}.png'); shot += 1
        seen.add(pg.evaluate("GAME_MODS.thirteen.engine.G && GAME_MODS.thirteen.engine.G.hand"))
        pg.wait_for_timeout(120)
    pg.wait_for_timeout(500); pg.screenshot(path='test/shots/thirteen_end.png')
    txt = pg.evaluate("(document.querySelector('#g-modal') || {}).innerText || ''")
    check(pg.query_selector('#g-modal:not(.hidden)'), f'game of 3 hands finished ({mine} turns played by clicks): ' + txt[:90].replace('\n', ' '))
    check(seen >= {1, 2, 3}, f'all three hands were played {sorted(x for x in seen if x)}')
    cards = pg.evaluate("(() => { const G = GAME_MODS.thirteen.engine.G; return G ? G.players.reduce((n, q) => n + q.hand.length, 0) : -1; })()")
    check(not pg.errs, 'no page errors ' + str(pg.errs[:2]))
    br.close()
print('ALL PASS' if ok else 'SOME FAILED')
