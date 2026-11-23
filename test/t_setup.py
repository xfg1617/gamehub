"""Setup screens: settings + room code/link on every game, invite links, remembered settings, leave check."""
import sys, json, urllib.parse; sys.path.insert(0, 'test')
from tlib import *
GAMES = ['blackjack', 'bowling', 'checkers', 'chess', 'colorclash', 'doodle', 'dominoes', 'impostor', 'isles', 'kittens', 'manor', 'poker', 'pool', 'tictactoe', 'tycoon', 'wordconnect']
fails = []
def check(ok, what):
    print('OK  ' if ok else 'FAIL', what)
    if not ok: fails.append(what)
with sync_playwright() as p:
    br = launch(p)
    pg = open_page(br)
    pg.context.grant_permissions(['clipboard-read', 'clipboard-write'])
    # 1. every game shows a setup screen with a room code and an invite link
    for g in GAMES:
        pg.evaluate(f"navigateTo('play', true); openGame('{g}')"); pg.wait_for_timeout(200)
        code = pg.evaluate("(document.getElementById('su-code')||{}).textContent")
        link = pg.evaluate("(document.getElementById('su-link')||{}).value || ''")
        check(bool(code) and f'#join={code}&g={g}' in link, f'{g}: room code {code} + invite link')
    pg.screenshot(path='test/shots/setup_wordconnect.png', full_page=True)
    for k in ['naval', 'daily']:
        pg.evaluate(f"navigateTo('play', true); openSetup('{k}')"); pg.wait_for_timeout(200)
        vis = pg.evaluate("!document.getElementById('bs-modal').classList.contains('hidden') && !!document.querySelector('#bs-modal #su-code')")
        check(vis, f'{k}: setup pop-up with room code')
        pg.evaluate("document.getElementById('bs-close').click()")
    # 2. copy link button
    pg.evaluate("openGame('chess')"); pg.wait_for_timeout(200)
    pg.click('[data-copy="link"]'); pg.wait_for_timeout(300)
    clip = pg.evaluate("navigator.clipboard.readText()")
    check(clip == pg.evaluate("document.getElementById('su-link').value"), 'copy link puts the invite link on the clipboard')
    # 3. a changed setting is remembered and goes into the link
    pg.click('[data-k="theme"][data-v="wood"]'); pg.click('[data-k="hints"][data-v="0"]')
    link = pg.evaluate("document.getElementById('su-link').value")
    sel = json.loads(urllib.parse.unquote(link.split('&s=')[1]))
    check(sel.get('theme') == 'wood' and sel.get('hints') == 0, 'invite link carries the chosen settings')
    pg.click('#su-go'); pg.wait_for_timeout(400)
    check(pg.evaluate("document.getElementById('ch-board').classList.contains('th-wood')"), 'chess wood board applied')
    # 4. leaving a running game asks first
    pg.click('#gs-wrap button'); pg.wait_for_timeout(200)
    asked = pg.evaluate("!!document.querySelector('#cf-modal:not(.hidden)')")
    check(asked, 'Lobby button asks "Leave this game?"')
    pg.screenshot(path='test/shots/leave_confirm.png')
    pg.click('#cf-no'); pg.wait_for_timeout(200)
    check(pg.evaluate("activeView") == 'game' and pg.evaluate("!!document.getElementById('ch-board')"), '"Keep playing" stays in the game')
    pg.evaluate("navigateTo('leaderboard')"); pg.wait_for_timeout(200)
    check(pg.evaluate("!!document.querySelector('#cf-modal:not(.hidden)')"), 'sidebar/tab navigation also asks')
    pg.click('#cf-yes'); pg.wait_for_timeout(200)
    check(pg.evaluate("activeView") == 'leaderboard', '"Leave game" leaves')
    pg.evaluate("openGame('chess')"); pg.wait_for_timeout(200)
    check(pg.evaluate("document.querySelector('[data-k=theme].on').dataset.v") == 'wood', 'chess remembers last settings')
    pg.evaluate("navigateTo('play')"); pg.wait_for_timeout(200)
    check(not pg.evaluate("!!document.querySelector('#cf-modal:not(.hidden)')"), 'no question when only on the setup screen')
    # 5. Four-in-a-Row: computer starts
    pg.evaluate("openSetup('c4')"); pg.wait_for_timeout(200)
    check(pg.evaluate("activeGame") == 'c4' and pg.query_selector('#game-root #su-code') is not None, 'c4: setup screen with room code')
    pg.click('#game-root [data-k="first"][data-v="opp"]'); pg.click('#game-root #su-go'); pg.wait_for_timeout(2200)
    discs = pg.evaluate("document.querySelectorAll('.c4n-disc.c').length")
    check(discs == 1, 'Four-in-a-Row: computer moves first when chosen')
    # 6. Daily Word hard mode rule
    prob = pg.evaluate("(() => { navigateTo('play', true); openSetup('daily'); document.querySelector('#bs-modal [data-k=puzzle][data-v=practice]').click(); document.querySelector('#bs-modal [data-k=hard][data-v=\"1\"]').click(); document.querySelector('#bs-modal #su-go').click(); dw.guesses = [{ word: 'crane', evals: ['correct','absent','present','absent','absent'] }]; return [dw.hard, hardModeProblem('slate'), hardModeProblem('cabin')]; })()")
    check(prob[0] and 'C must be letter 1' in prob[1] and prob[2] == '', f'Daily Word hard mode rule {prob}')
    pg.evaluate("dw.guesses = []; navigateTo('play', true)")
    check(not pg.errs, f'no page errors {pg.errs[:3]}')
    pg.context.close()
    # 7. opening an invite link
    pg = open_page(br, 390, 844, mobile=True)
    s = urllib.parse.quote(json.dumps({'n': 4, 'cash': 2500, 'jack': 1}))
    pg.goto('file://' + FILE + f'#join=ZQ7K&g=tycoon&s={s}'); pg.wait_for_timeout(800)
    got = pg.evaluate("[activeView, document.getElementById('su-code').textContent, document.querySelector('[data-k=cash].on').dataset.v, document.querySelector('[data-k=n].on').dataset.v]")
    check(got == ['game', 'ZQ7K', '2500', '4'], f'invite link opens Tycoon with host settings {got}')
    pg.screenshot(path='test/shots/setup_join_mobile.png', full_page=True)
    sw = pg.evaluate("document.documentElement.scrollWidth")
    check(sw <= 391, f'setup screen fits a phone ({sw}px)')
    check(not pg.errs, f'no page errors {pg.errs[:3]}')
print('ALL GOOD' if not fails else f'{len(fails)} PROBLEMS')
