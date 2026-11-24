"""Every card exists exactly once: computer-only games of Uno, Kaboom Cats, Dominoes and Bullshit run fast while the
test checks, again and again, that no card is in two places and none goes missing (a player saw six Eights)."""
import sys, json; sys.path.insert(0, 'test')
from nplib import *
CHECK = {
  'colorclash': "(() => { const G = GAME_MODS.colorclash.engine.G; if (!G) return null; return [...G.deck, ...G.disc, ...G.players.flatMap(q => q.hand)]; })()",
  'kittens': "(() => { const G = window.__kkG; if (!G) return null; return [...G.deck, ...G.discard, ...G.players.flatMap(q => q.hand)]; })()",
  'dominoes': "(() => { const G = GAME_MODS.dominoes.engine.state(); if (!G) return null; return [...(G.bone || G.boneyard || []), ...(G.line || []).map(x => x.t || x), ...G.players.flatMap(q => q.hand)]; })()",
  'fibber': "(() => { const G = GAME_MODS.fibber.engine.G; if (!G) return null; return [...G.pile, ...G.players.flatMap(q => q.hand)]; })()",
}
with sync_playwright() as p:
    br = launch(p)
    for g, expr in CHECK.items():
        pg = open_page(br, 1440, 900)
        pg.evaluate(f"window.__fast = 1; setupSave('{g}', {{ n: 4 }}); openGame('{g}')"); pg.wait_for_timeout(400)
        if pg.query_selector('[data-mode]'): pg.click('[data-mode]'); pg.wait_for_timeout(300)
        pg.click('#su-go'); pg.wait_for_timeout(800)
        pg.evaluate("(() => { const S = NP.S; if (S) { S.seats[0].bot = true; S._maybeBot && S._maybeBot(); } })()")   # the computer plays my seat too
        first = None; bad = None; looks = 0; start = None
        for k in range(600):
            r = pg.evaluate(f"(() => {{ const all = {expr}; if (!all) return null; const c = {{}}; all.forEach(x => {{ const k = JSON.stringify(x); c[k] = (c[k] || 0) + 1; }}); return [all.length, c]; }})()")
            if r:
                looks += 1
                if start is None: first, start = r[0], r[1]
                # no kind of card may ever be more common than when the game began (Kaboom Cats removes potatoes, so the total may drop there)
                more = [k for k, n in r[1].items() if n > start.get(k, 0)]
                if more or (g != 'kittens' and r[0] != first): bad = (r[0], more[:3]); break
            pg.wait_for_timeout(40)
        print(f'   {g}: {looks} looks, cards {first}, problem {bad}', pg.errs[:2])
        check(bad is None and looks > 20, f'{g}: no card in two places, none lost')
        pg.context.close()
    done()
