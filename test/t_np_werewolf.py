"""Werewolf online: 5 people in a private room. Roles are dealt the same on every screen (1 wolf, Seer, Doctor,
2 villagers); nights and days are played with real taps (the wolf takes someone, the Seer looks, the village votes the
wolf out) until a side wins; every screen agrees."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
with sync_playwright() as p:
    P = players(p, 5, REAL)
    A = P[0]
    for pg in P: pg.evaluate('window.__fast = false')
    code = open_table(A, 'werewolf', 'room', {'n': 5, 'night': 30, 'day': 60, 'wolves': 1})
    for pg in P[1:]: join(pg, code)
    A.wait_for_timeout(1500); start(A); A.wait_for_timeout(3000)
    roles = [pg.evaluate("GAME_MODS.werewolf.engine.G && GAME_MODS.werewolf.engine.G.players.map(p => p.role).join(',')") for pg in P]
    print('   roles:', roles[0])
    check(len(set(roles)) == 1 and roles[0].count('wolf') == 1 and 'seer' in roles[0] and 'doctor' in roles[0], 'same roles on every screen: 1 wolf, Seer, Doctor')
    mine = [pg.evaluate("document.querySelector('.ww-cn') && document.querySelector('.ww-cn').textContent") for pg in P]
    check(all(mine), 'everyone has a role card: ' + ', '.join(mine))
    P[0].screenshot(path='test/shots/ww_role.png')
    R = roles[0].split(',')
    wolf = R.index('wolf')
    t0 = time.time(); shots = set(); nights = days = 0
    while time.time() - t0 < 280:
        if all(modal_text(pg, 1) for pg in P): break
        for k, pg in enumerate(P):
            st = pg.evaluate("""(() => { const G = GAME_MODS.werewolf.engine.G; if (!G) return null;
              return { ph: G.phase, key: G.ckey, pick: !!G.pick, alive: G.players[G.me].alive, ready: !!document.querySelector('#ww-ready:not([disabled])') }; })()""")
            if not st or not st['alive']: continue
            if st['ready']: pg.evaluate("document.getElementById('ww-ready').click()"); continue
            if st['pick'] and st['key']:
                # wolf / village choices: the wolf takes the first non-wolf; at the vote everyone (but the wolf) votes for the wolf
                tgt = pg.evaluate(f"""(() => {{ const G = GAME_MODS.werewolf.engine.G, me = G.players[G.me], c = [...document.querySelectorAll('.ww-pl.can')].map(b => +b.dataset.s);
                  if (!c.length) return -1; if (G.ckey.startsWith('v')) return me.role === 'wolf' ? c.find(s => s !== {wolf}) : (c.includes({wolf}) ? {wolf} : c[0]); return c.find(s => G.players[s].role !== 'wolf') ?? c[0]; }})()""")
                if tgt is not None and tgt >= 0:
                    if st['key'].startswith('n') and 'night' not in shots and k == wolf: pg.screenshot(path='test/shots/ww_night.png'); shots.add('night')
                    if st['key'].startswith('v') and 'vote' not in shots: pg.screenshot(path='test/shots/ww_vote.png'); shots.add('vote')
                    pg.evaluate(f"document.getElementById('ww-seat-{tgt}').click()")
                    if st['key'].startswith('n'): nights += 1
                    else: days += 1
        A.wait_for_timeout(400)
    txt = [modal_text(pg) for pg in P]
    for t in txt[:2]: print('  ', t[:110].replace('\n', ' '))
    check(all(txt), f'game over on all 5 screens ({nights} night taps, {days} votes)')
    check(sum('Your side wins' in t for t in txt) == 4 and 'Your side lost' in txt[wolf], 'the village voted the wolf out and won (the wolf lost)')
    al = [pg.evaluate("GAME_MODS.werewolf.engine.G.players.map(p => p.alive ? 1 : 0).join('')") for pg in P]
    check(len(set(al)) == 1, 'every screen agrees who is still alive: ' + al[0])
    check(not any(pg.errs for pg in P), 'no page errors ' + str([pg.errs[:1] for pg in P]))
    done(*P)
