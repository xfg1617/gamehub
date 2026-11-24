"""Guild Masters: a whole game against computer players, every step done by clicking: pick a character, take
gold or cards (keep 1 of 2), build. Points are counted at the end; a phone layout check."""
import sys; sys.path.insert(0, 'test')
from nplib import *
S = sys.argv[1] if len(sys.argv) > 1 else 'test/shots/'
STEP = """(() => { const q = (s) => document.querySelector(s);
  if (!GAME_MODS.guild.engine.G || GAME_MODS.guild.engine.G.over) return 'over';
  let b = q('#gm-prompt [data-r]'); if (b) { const all = [...document.querySelectorAll('#gm-prompt [data-r]')]; all[Math.floor(Math.random() * all.length)].click(); return 'role'; }
  b = q('#gm-prompt [data-n]'); if (b) { b.click(); return 'name'; }
  b = q('#gm-prompt [data-v]'); if (b) { const G = GAME_MODS.guild.engine.G, me = G.players[G.me]; (me.hand.length < 2 ? q('#gm-prompt [data-v="cards"]') : q('#gm-prompt [data-v="gold"]')).click(); return 'take'; }
  b = q('#gm-prompt [data-i]'); if (b) { b.click(); return 'keep'; }
  b = q('#gm-done'); if (b) { const c = q('#gm-hand .gm-b.can:not(.sel)'); if (c) c.click(); (q('#gm-done')).click(); return 'build'; }
  return ''; })()"""
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1440, 900)
    pg.evaluate("setupSave('guild', { n: 4, target: 6 }); openGame('guild')"); pg.wait_for_timeout(400)
    if pg.query_selector('[data-mode]'): pg.click('[data-mode]'); pg.wait_for_timeout(300)
    pg.click('#su-go'); pg.wait_for_selector('#gm-towns', timeout=10000)
    pg.wait_for_selector('#gm-prompt [data-r]', timeout=60000); pg.wait_for_timeout(300)
    pg.screenshot(path=S + '18_guild_pick.png')
    pg.evaluate("window.__fast = 1")
    seen = {}; shot = False
    for k in range(4000):
        r = pg.evaluate(STEP)
        if r == 'over': break
        if r: seen[r] = seen.get(r, 0) + 1
        if r == 'take' and not shot and pg.evaluate("GAME_MODS.guild.engine.G.round") >= 3: pg.evaluate("window.__fast = 0"); shot = 'wait'
        if shot == 'wait' and pg.query_selector('#gm-done'):
            pg.evaluate("(() => { const c = document.querySelector('#gm-hand .gm-b.can'); if (c) c.click(); })()"); pg.wait_for_timeout(300)
            pg.screenshot(path=S + '18_guild_build.png'); shot = True; pg.evaluate("window.__fast = 1")
        pg.wait_for_timeout(25)
    print('   steps:', seen)
    pg.wait_for_selector('#g-modal:not(.hidden)', timeout=30000); pg.wait_for_timeout(300)
    check(seen.get('role', 0) >= 3 and seen.get('build', 0) >= 3, 'a whole game was played by clicking')
    t = pg.inner_text('#g-modal'); print('   result:', t.replace('\n', ' ')[:120])
    check('wins' in t.lower(), 'the game ends with a winner and points')
    pg.screenshot(path=S + '18_guild_end.png')
    ph = open_page(br, 390, 844)
    ph.evaluate("setupSave('guild', { n: 5, target: 7 }); openGame('guild')"); ph.wait_for_timeout(400)
    if ph.query_selector('[data-mode]'): ph.click('[data-mode]'); ph.wait_for_timeout(300)
    ph.click('#su-go'); ph.wait_for_selector('#gm-towns', timeout=10000); ph.wait_for_timeout(2500)
    check(ph.evaluate("document.documentElement.scrollWidth <= 392"), 'no sideways scrolling on a phone')
    ph.screenshot(path=S + '18_guild_phone.png', full_page=True)
    check(not pg.errs and not ph.errs, 'no page errors ' + str(pg.errs + ph.errs))
    br.close()
done()
