"""Find the Impostor plays on until only 2 are left (Inna, Nov 2026): a wrongly voted-out player is out and a new round
of hints starts; no "it might be you" hint on the vote screen."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
from nplib import check
E = "GAME_MODS.impostor.engine.G"
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    multi = 0; ends = []
    for game in range(6):
        pg.evaluate("openGame('impostor')"); pg.wait_for_timeout(300); pg.click('#su-go'); pg.wait_for_timeout(500)
        t0 = time.time(); saw_hint_line = False
        while time.time() - t0 < 120 and not pg.query_selector('#im-again'):
            r = pg.evaluate(f"""(() => {{ const G = {E};
              const f = document.getElementById('im-flip'); if (f && document.getElementById('im-ready').disabled) {{ f.click(); return 'flip'; }}
              const rd = document.getElementById('im-ready'); if (rd) {{ rd.click(); return 'ready'; }}
              const inp = document.getElementById('im-in'); if (inp) {{ inp.value = 'thing' + G.rounds.length; document.getElementById('im-send').click(); return 'hint'; }}
              // vote for a civilian on purpose (never the impostor), so rounds go on
              const vs = [...document.querySelectorAll('[data-v]')]; if (vs.length) {{ const v = vs.find(b => +b.dataset.v !== G.impIdx) || vs[0]; v.click(); return 'vote'; }}
              const g = document.querySelector('[data-g]'); if (g) {{ g.click(); return 'guess'; }}
              return null; }})()""")
            if 'it might be you' in (pg.evaluate("document.getElementById('im-main').innerText") or ''): saw_hint_line = True
            pg.wait_for_timeout(250 if r else 500)
        rounds, outs = pg.evaluate(f"[{E}.rounds.length, {E}.outs.length]")
        verdict = pg.evaluate("(document.querySelector('#im-main .text-sm.font-bold') || {}).innerText")
        ends.append((rounds, outs, verdict)); print('   game', game + 1, ':', rounds, 'rounds,', outs, 'voted out ·', verdict)
        check(not saw_hint_line, 'no "it might be you" line on the vote screen')
        if outs >= 1: multi += 1
        if multi >= 2: break
    check(multi >= 1, 'when a civilian is voted out, the game carries on with a new round')
    check(any('Only 2 players are left' in (v or '') for _, _, v in ends) or any(r >= 2 for r, _, _ in ends), 'rounds continue until the impostor is caught or 2 are left')
    check(not pg.errs, 'no errors ' + str(pg.errs[:2]))
    br.close()
