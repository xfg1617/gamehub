"""Trivia Rush: the question bank is well formed (4 answers each, English and Vietnamese), and a whole game against
3 computer players with real clicks, in English, plus a Vietnamese game start.  python3 test/t_trivia.py"""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
ok = True
def check(c, msg):
    global ok; ok = ok and bool(c); print(('PASS ' if c else 'FAIL ') + msg)
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    r = pg.evaluate("""(() => { const Q = window.TRIVIA_Q, bad = [], cats = {}, seen = new Set(), dup = [];
      Q.forEach((q, i) => { cats[q[0]] = (cats[q[0]] || 0) + 1;
        if (q.length !== 6 || ![1, 2, 3].includes(q[1]) || q[3].split('|').length !== 4 || (q[5] && q[5].split('|').length !== 4) || !q[2] || !q[4]) bad.push(i + ': ' + q[2]);
        if (new Set(q[3].split('|')).size !== 4) bad.push('same answer twice: ' + q[2]);
        if (seen.has(q[2])) dup.push(q[2]); seen.add(q[2]); });
      return { n: Q.length, bad, dup, cats }; })()""")
    print(r['n'], 'questions', r['cats'])
    check(not r['bad'], 'every question has 4 different answers in both languages ' + str(r['bad'][:3]))
    check(not r['dup'], 'no question twice ' + str(r['dup'][:3]))
    check(len(r['cats']) == 12 and min(r['cats'].values()) >= 20, '12 categories, at least 20 questions each')
    pg.evaluate("openGame('trivia')"); pg.wait_for_timeout(300)
    for k, v in (('lang', 'en'), ('qn', '10'), ('n', '4')): pg.click(f'[data-k="{k}"][data-v="{v}"]')
    pg.click('#su-go'); pg.wait_for_timeout(500)
    check(pg.evaluate("document.querySelectorAll('.tv-a').length") == 4, 'four answers on screen')
    pg.screenshot(path='test/shots/trivia_q.png')
    t0 = time.time(); changed = False; note1 = ''; clicked = 0; right = 0; shot = False
    while time.time() - t0 < 90 and not pg.query_selector('#g-modal:not(.hidden)'):
        st = pg.evaluate("(() => { const G = GAME_MODS.trivia.engine.G; if (!G || G.mine !== null || G.reveal) return null; return G.qs[G.qi].right; })()")
        if st is not None and pg.query_selector('.tv-a:not([disabled])'):
            pick = st if clicked % 3 else (st + 1) % 4     # mostly right, sometimes wrong
            if clicked == 0:                                # first question: pick wrong, then change to the right one
                pg.click(f'.tv-a[data-i="{(st + 1) % 4}"]'); pg.wait_for_timeout(150)
                note1 = pg.inner_text('#tv-note'); pg.click(f'.tv-a[data-i="{st}"]'); pick = st
                changed = pg.evaluate("(i) => document.querySelector(`.tv-a[data-i='${i}']`).classList.contains('picked')", st)
                print('   note after first pick:', note1)
            else: pg.click(f'.tv-a[data-i="{pick}"]')
            clicked += 1; right += pick == st
        if not shot and pg.query_selector('.tv-a.ok'): pg.wait_for_timeout(100); pg.screenshot(path='test/shots/trivia_reveal.png'); shot = True
        pg.wait_for_timeout(80)
    txt = pg.evaluate("(document.querySelector('#g-modal') || {}).innerText || ''")
    check(pg.query_selector('#g-modal:not(.hidden)'), f'10 questions played ({clicked} answered by click, {right} right): ' + txt[:80].replace('\n', ' '))
    me = pg.evaluate("GAME_MODS.trivia.engine.G.players[0].right")
    check(me == right, f'right answers counted: {me} == {right}')
    check(changed and 'Changed your mind' in note1, 'you can change your answer before the question closes (the changed answer counts)')
    # Vietnamese questions
    pg.evaluate("document.getElementById('g-modal').classList.add('hidden'); openGame('trivia')"); pg.wait_for_timeout(300)
    pg.click('[data-k="lang"][data-v="vi"]'); pg.click('#su-go'); pg.wait_for_timeout(500)
    q = pg.evaluate("document.getElementById('tv-q').textContent")
    check(any(ch in q for ch in 'ăâđêôơưàảãáạềếệờớợ') or 'nào' in q or 'gì' in q, 'Vietnamese question: ' + q)
    pg.screenshot(path='test/shots/trivia_vi.png')
    check(not pg.errs, 'no page errors ' + str(pg.errs[:2]))
    br.close()
print('ALL PASS' if ok else 'SOME FAILED')
