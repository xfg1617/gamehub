"""Funny Answers online: 3 people in a private room write answers, vote on every prompt and play the final round;
every screen agrees on the scores at the end."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
with sync_playwright() as p:
    P = players(p, 3, REAL)
    A = P[0]
    code = open_table(A, 'funny', 'room', {'rounds': 2, 'wtime': 60, 'lang': 'en', 'n': 3})
    for pg in P[1:]: join(pg, code)
    A.wait_for_timeout(1500); start(A); A.wait_for_timeout(4000)
    check(all(pg.query_selector('#fa-stage') for pg in P), 'everyone sees the game')
    t0 = time.time(); wrote = votes = finals = 0; shots = set()
    while time.time() - t0 < 200:
        if all(modal_text(pg, 1) for pg in P): break
        for k, pg in enumerate(P):
            if pg.query_selector('#fa-send'):
                pg.evaluate(f"document.querySelectorAll('.fa-in input').forEach((x, i) => x.value = 'answer {k}' + i + ' with a banana')")
                if 'write' not in shots and k == 0: pg.screenshot(path='test/shots/funny_write.png'); shots.add('write')
                if pg.evaluate("(() => { const b = document.getElementById('fa-send'); if (b) { b.click(); return true; } return false; })()"): wrote += 1
            elif pg.query_selector('#fa-vgo'):
                pg.evaluate("(() => { if (!document.querySelector('#fa-stage .fa-medal')) { const b = document.querySelector('#fa-stage .fa-a:not([disabled])'); if (b) b.click(); } })()"); pg.wait_for_timeout(150)
                if 'final' not in shots and k == 0: pg.screenshot(path='test/shots/funny_final.png'); shots.add('final')
                if pg.evaluate("(() => { const g = document.getElementById('fa-vgo'); if (g && !g.disabled) { g.click(); return true; } return false; })()"): finals += 1
            else:
                if pg.query_selector('#fa-stage .fa-vs .fa-a:not([disabled]):not(.res)') and not pg.query_selector('#fa-stage .fa-a.picked'):
                    if 'vote' not in shots: pg.screenshot(path='test/shots/funny_vote.png'); shots.add('vote')
                    if pg.evaluate("(() => { const b = document.querySelector('#fa-stage .fa-vs .fa-a:not([disabled]):not(.res)'); if (b) { b.click(); return true; } return false; })()"): votes += 1
            if 'res' not in shots and pg.query_selector('#fa-stage .fa-a.res'): pg.screenshot(path='test/shots/funny_result.png'); shots.add('res')
        A.wait_for_timeout(300)
    txt = [modal_text(pg) for pg in P]
    for t in txt: print('  ', t[:90].replace('\n', ' '))
    check(all(txt), f'game over on all 3 screens (answers sent {wrote}, votes {votes}, final votes {finals})')
    check(wrote == 6 and votes >= 3 and finals == 3, 'everyone wrote twice (round 1 + final), voted on each prompt, voted in the final')
    sc = [pg.evaluate("GAME_MODS.funny.engine.G.players.map(p => p.pts).join(',')") for pg in P]
    check(len(set(sc)) == 1 and sc[0] != '0,0,0', 'same scores on every screen: ' + sc[0])
    check(not any(pg.errs for pg in P), 'no page errors ' + str([pg.errs[:1] for pg in P]))
    done(*P)
