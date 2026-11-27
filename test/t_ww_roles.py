"""Werewolf extra roles, played on one screen with every seat scripted (npLocal, roles in a fixed order):
Cupid + broken heart, Elder survives the first bite, Village Fool stays, Jester wins alone, Wolf Cub's revenge
(two taken), Lycan looks like a wolf to the Seer (a real tap)."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
fails = []
def check(ok, msg):
    print(('PASS ' if ok else 'FAIL ') + msg)
    if not ok: fails.append(msg)

SETUP = """([roles, plan, allBots]) => {
  openGame('werewolf');
  const sel = { n: roles.length, night: 30, day: 60, wolves: 1, seer: 1, doctor: 1, reveal: 1 };
  const names = ['You', 'Luna', 'Bao', 'Minh', 'Kai', 'Mai', 'Tom', 'Lan'];
  const seats = roles.map((r, i) => i ? { bot: true, name: names[i], avatar: '🦊' } : { name: 'You', avatar: '🦊' });
  const S = npLocal(seats, sel);
  if (allBots) S.bot = () => true;
  const o = S.rng.shuffle; S.rng.shuffle = (a) => { S.rng.shuffle = o; return roles.slice(); };
  window.__ws = {}; const oc = S.collect; S.collect = (key, ss, botFn, autoFn, secs) => (window.__ws[key] = ss.slice(), oc)(key, ss, (k) => { const p = plan[key] && plan[key][k]; return p !== undefined ? Object.assign({}, botFn(k), p) : botFn(k); }, autoFn, secs);
  GAME_MODS.werewolf.online.start(document.getElementById('gs-body'), sel, S);
  GAME_MODS.werewolf.engine.G.voice = false;
}"""
G = "GAME_MODS.werewolf.engine.G"
def modal_text(pg):
    return pg.evaluate("document.getElementById('g-modal').innerText").replace('\n', ' ')
def alive(pg): return pg.evaluate(f"{G} ? {G}.players.map(p => p.alive ? 1 : 0).join('') : ''")
def until(pg, js, t=40):
    t0 = time.time()
    while time.time() - t0 < t:
        try:
            if pg.evaluate(js): return True
        except Exception: pass
        pg.wait_for_timeout(150)
    return False
def game(pg, roles, plan, allBots=True):
    pg.evaluate("() => { const m = document.getElementById('g-modal'); if (m) m.classList.add('hidden'); }")
    pg.evaluate(SETUP, [roles, plan, allBots])

with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1280, 900)
    pg.evaluate('window.__fast = true')
    # 1. Cupid: lovers 4 + 5; the wolf takes 4 -> 5 leaves with a broken heart
    game(pg, ['cupid', 'wolf', 'seer', 'doctor', 'villager', 'villager'], {'c1': {0: {'a': 4, 'b': 5}}, 'n1': {1: {'target': 4}, 3: {'target': 2}}})
    check(until(pg, f"{G}.lovers && {G}.lovers.join() === '4,5'"), 'Cupid made 4 and 5 lovers')
    check(until(pg, f"{G}.day >= 1 && !{G}.players[4].alive && !{G}.players[5].alive"), 'the wolf took 4, and 5 left with a broken heart: ' + alive(pg))
    pg.wait_for_timeout(300); pg.screenshot(path='test/shots/ww_cupid.png')
    # 2. Elder survives the first bite, not the second
    game(pg, ['elder', 'wolf', 'seer', 'doctor', 'villager', 'villager'], {'n1': {1: {'target': 0}}, 'n2': {1: {'target': 0}}})
    check(until(pg, f"{G}.day === 1 && {G}.phase === 'day'") and pg.evaluate(f"{G}.players[0].alive && {G}.elderLife === 0"), 'the Elder survived the first wolf attack')
    check(until(pg, f"{G}.day === 2") and until(pg, f"!{G}.players[0].alive", 10), 'the Elder is out after the second bite')
    # 3. Village Fool: voted out, stays, can't vote
    game(pg, ['fool', 'wolf', 'seer', 'doctor', 'villager', 'villager'], {'n1': {1: {'target': 4}}, 'v1': {i: {'target': 0} for i in range(1, 6)}})
    check(until(pg, f"{G}.players[0].noVote === true && {G}.players[0].alive"), 'the Village Fool was voted out but stays in the game')
    pg.screenshot(path='test/shots/ww_fool.png')
    ok = until(pg, "!!window.__ws.v2", 60)
    check(ok and 0 not in pg.evaluate("window.__ws.v2") and 0 in pg.evaluate("window.__ws.v1"), 'at the next vote the Fool has no vote: voters ' + str(pg.evaluate("window.__ws.v2")))
    # 4. Jester voted out -> Jester wins
    game(pg, ['jester', 'wolf', 'seer', 'doctor', 'villager', 'villager'], {'n1': {1: {'target': 4}}, 'v1': {i: {'target': 0} for i in range(1, 6)}})
    t = modal_text(pg) if until(pg, "!document.getElementById('g-modal').classList.contains('hidden')", 60) else ''
    check('Your side wins' in t and 'Jester' in t, 'the Jester was voted out and wins: ' + t[:90])
    # 5. Wolf Cub voted out -> two taken the next night
    game(pg, ['cub', 'wolf', 'seer', 'doctor', 'villager', 'villager', 'villager'], {'n1': {0: {'target': 4}, 1: {'target': 4}, 3: {'target': 2}}, 'v1': {i: {'target': 0} for i in range(1, 7)}, 'n2': {1: {'target': 5}, 3: {'target': 1}}})
    check(until(pg, f"({G}.dawns || []).length >= 2", 60), 'night 2 reached')
    d = pg.evaluate(f"{G}.dawns")
    check(d[0] == [4] and len(d[1]) == 2 and 5 in d[1], 'after the cub went out, the wolves took two the next night: ' + str(d))
    # 6. Lycan: the Seer (you, a real tap) sees a wolf
    pg.evaluate('window.__fast = false')
    game(pg, ['seer', 'wolf', 'lycan', 'doctor', 'villager', 'villager'], {}, False)
    check(until(pg, f"{G}.ckey === 'n1' && !!document.querySelector('#ww-seat-2.can')"), 'night 1: the Seer can tap')
    pg.click('#ww-seat-2'); pg.wait_for_timeout(300)
    n = pg.inner_text('#ww-news'); r = pg.inner_text('#ww-seat-2')
    check('IS A WOLF' in n and 'WOLF' in r and 'Lycan' not in r, 'the Seer sees the Lycan as a wolf: ' + n.replace('\n', ' ') + ' | ' + r.replace('\n', ' '))
    pg.screenshot(path='test/shots/ww_lycan.png')
    # role cards: every role has a picture and words
    check(not pg.errs, 'no page errors ' + str(pg.errs[:2]))
    br.close()
print('ALL PASS' if not fails else f'{len(fails)} FAIL'); sys.exit(1 if fails else 0)
