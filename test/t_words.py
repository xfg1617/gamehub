"""Bigger word lists (Nov 2026): Daily Word accepts thousands more guesses; every daily puzzle up to #330 keeps exactly
the word it had before; later days use the bigger answer list with no repeats; Word Duel and practice draw from it;
Word Connect accepts real-but-rarer words as BONUS words (points, not needed to finish); rude words are never accepted."""
import sys, os; sys.path.insert(0, 'test')
from tlib import *
OLD = os.environ.get('OLD_FILE', '/home/user/playstack/dist/gamehub.html')
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1280, 900)
    info = pg.evaluate("[WORD_SET.size, DW_ALL_ANSWERS.length, DW_ORDER.length]")
    print('   accepted guesses / answers:', info)
    check(info[0] > 4000 and info[1] > 1500, 'thousands more words accepted, ~2000 answers')
    new_days = pg.evaluate("Array.from({ length: 330 }, (_, i) => getDeterministicDailyWord(i + 1))")
    if os.path.exists(OLD):
        po = br.new_page(); po.goto('file://' + OLD); po.wait_for_timeout(800)
        old_days = po.evaluate("Array.from({ length: 330 }, (_, i) => WORD_DICT[((i + 1) * 19) % WORD_DICT.length])")
        check(new_days == old_days, 'puzzles #1-330 keep exactly the same words as before')
    later = pg.evaluate("Array.from({ length: 1000 }, (_, i) => getDeterministicDailyWord(331 + i))")
    check(len(set(later)) == 1000, 'the next 1000 daily words never repeat')
    print('   next week of words:', later[:7])
    for w in ['GRAPE', 'SKILL', 'CANAL', 'PLUMB', 'FJORD', 'KAYAK']:
        pass
    acc = pg.evaluate("['GRAPE','SKILL','CANAL','PLUMB','FJORD','KAYAK','EPOXY'].filter(w => WORD_SET.has(w))")
    print('   some now-accepted words:', acc)
    check(len(acc) >= 6, 'everyday words that used to be rejected are now accepted')
    check(not pg.evaluate("['PENIS','HORNY','SLUTS','SISSY'].some(w => WORD_SET.has(w))"), 'rude words are not accepted')
    # Daily Word plays with a newly accepted guess
    pg.evaluate("openDailyWord(true)"); pg.wait_for_timeout(400)
    pg.keyboard.type('kayak'); pg.keyboard.press('Enter'); pg.wait_for_timeout(2500)
    check(pg.evaluate("dw.guesses.length") == 1, 'a guess like KAYAK is accepted in Daily Word')
    # Word Connect bonus word
    pg.evaluate("navigateTo('play', true); openGame('wordconnect')"); pg.wait_for_timeout(400)
    pg.click('#su-go'); pg.wait_for_timeout(1500)
    bonus = pg.evaluate("""(() => { const G = window.__wcG; if (!G) return null; const have = {}; for (const c of G.base) have[c] = (have[c] || 0) + 1;
      const fits = (w) => { const c = {}; for (const ch of w) c[ch] = (c[ch] || 0) + 1; return Object.keys(c).every((k) => (have[k] || 0) >= c[k]); };
      return WC_EXTRA.split(' ').find((w) => w.length >= 3 && w.length <= G.L && fits(w) && !G.wordSet.has(w)) || null; })()""")
    print('   a bonus word for this puzzle:', bonus)
    if bonus:
        before = pg.evaluate("window.__wcG.score")
        pg.keyboard.type(bonus); pg.keyboard.press('Enter'); pg.wait_for_timeout(800)
        st = pg.evaluate("[window.__wcG.score, (window.__wcG.bonus || []).length, window.__wcG.found.length, document.getElementById('wc-msg').textContent]")
        check(st[0] > before and st[1] == 1 and st[2] == 0, f'Word Connect takes it as a BONUS word: {st[3]}')
    else: check(False, 'found a bonus word to try')
    check(not pg.errs, f'no page errors {pg.errs[:2]}')
    print('ALL GOOD' if not fails else f'{len(fails)} PROBLEMS')
