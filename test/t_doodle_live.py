"""Doodle Guess (Draw & Guess, people only): two players online. The drawer is offered an easy, a medium and a hard
word; the guesser sees the level and a dash per letter, watches the drawing appear live and guesses; Vietnamese words
count without accents; harder words score more; scores match on both screens; no computer players in the room."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
S = sys.argv[1] if len(sys.argv) > 1 else 'test/shots/'
def scribble(pg, sel='#dg-cv'):
    b = pg.query_selector(sel).bounding_box()
    for k in range(3):
        pg.mouse.move(b['x'] + b['width'] * (0.25 + 0.15 * k), b['y'] + b['height'] * 0.3); pg.mouse.down()
        for j in range(12): pg.mouse.move(b['x'] + b['width'] * (0.25 + 0.15 * k + 0.01 * j), b['y'] + b['height'] * (0.3 + 0.04 * j), steps=2)
        pg.mouse.up()
with sync_playwright() as p:
    A, B = players(p, 2)
    code = open_table(A, 'doodle', 'room', {'n': 2, 'rounds': 1, 'dtime': 60, 'lang': 'vi'})
    check(not A.query_selector('.np-bots-hi'), 'the room has no computer players box')
    join(B, code); A.wait_for_timeout(2000); start(A); A.wait_for_timeout(2500)
    check(A.query_selector('#dg-stage') and B.query_selector('#dg-stage'), 'the game started on both screens')
    w = A.evaluate("DOODLE_WORDS"); counts = {l: len(w['en'][l]) + len(w['vi'][l]) for l in ('easy', 'medium', 'hard')}
    print('   words:', {k: {l: len(v[l]) for l in v} for k, v in w.items()})
    check(sum(counts.values()) >= 400, f'a few hundred words in three levels ({sum(counts.values())})')
    for k in range(2):
        drawer = guesser = None
        for _ in range(40):
            for x, y in ((A, B), (B, A)):
                if x.query_selector('#dg-stage [data-w]'): drawer, guesser = x, y
            if drawer: break
            A.wait_for_timeout(300)
        if not drawer: break
        levels = drawer.evaluate("[...document.querySelectorAll('#dg-stage [data-l]')].map(b => b.dataset.l + ':' + b.innerText.replace(/\\n/g, ' '))")
        print('   offered:', levels)
        check([l.split(':')[0] for l in levels] == ['easy', 'medium', 'hard'], 'the drawer is offered one easy, one medium and one hard word')
        if k == 0: drawer.screenshot(path=S + '14_doodle_pick.png')
        drawer.click('#dg-stage [data-l="hard"]' if k == 0 else '#dg-stage [data-l="easy"]')
        drawer.wait_for_selector('#dg-cv.draw', timeout=5000); guesser.wait_for_selector('#dg-cv', timeout=8000); drawer.wait_for_timeout(400)
        scribble(drawer); guesser.wait_for_timeout(1200)
        hint = guesser.inner_text('#dg-hint'); word = guesser.evaluate("GAME_MODS.doodle.engine.word()")
        print('   guesser sees:', hint, '| word:', word)
        check(hint.startswith('KHÓ' if k == 0 else 'DỄ') and '_' in hint and word.upper() not in hint, 'the guesser sees the level and a dash per letter, not the word')
        if k == 0: guesser.screenshot(path=S + '14_doodle_guesser.png')
        plain = guesser.evaluate("(w) => w.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd')", word)
        before = guesser.evaluate("GAME_MODS.doodle.engine.word() && 0")
        guesser.fill('#dg-in', plain); guesser.press('#dg-in', 'Enter'); guesser.wait_for_timeout(2000)
        feed = guesser.inner_text('#dg-feed')
        check('guessed the word' in feed.split('drawing now')[-1], f'"{plain}" (no accents) counts for "{word}"')
        pts = int(feed.split('guessed the word! +')[-1].split()[0])
        if k == 0: hard_pts = pts
        else: check(hard_pts > pts, f'a hard word scores more ({hard_pts}) than an easy one ({pts})')
        check(A.inner_text('#dg-board') == B.inner_text('#dg-board'), 'both screens show the same scores')
        A.wait_for_timeout(4000)
    done(A, B)
