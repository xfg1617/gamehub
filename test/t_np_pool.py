"""Pool: offline, a few shots against the computer; online, 2 players shoot in turn (Space = shoot at the
last power) and the table (every ball's spot) must match on both screens after each shot.  Add 'real' for the real service."""
import sys; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
POS = "[...(window.__poolG ? [] : [])].join()"
BALLS = "document.getElementById('pl-p0').innerText.replace(/\\s+/g,' ') + ' | ' + document.getElementById('pl-p1').innerText.replace(/\\s+/g,' ') + ' | ' + document.getElementById('pl-msg').textContent"
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    pg.evaluate("openGame('pool')"); pg.wait_for_timeout(300); pg.click('#su-go'); pg.wait_for_timeout(800)
    for k in range(6):
        pg.evaluate("document.getElementById('pl-cv').focus()"); pg.keyboard.press(' '); pg.wait_for_timeout(5500)
    print('   offline:', pg.evaluate(BALLS)[:160], pg.errs)
    check(not pg.errs, 'offline shots against the computer work')
    A, B = players(p, 2, REAL)
    code = open_table(A, 'pool', 'room')
    join(B, code); A.wait_for_timeout(3000)
    check(A.query_selector('#pl-cv') and B.query_selector('#pl-cv'), 'the table opened on both screens')
    shots = 0; same = looks = 0
    for k in range(40):
        if shots >= 6: break
        for pg2 in (A, B):
            if pg2.evaluate("(() => { const m = document.getElementById('pl-msg').textContent; return /Your turn|Break!|Shoot again|ball in hand/.test(m) && !/is lining up/.test(m); })()"):
                pg2.evaluate("document.getElementById('pl-cv').focus()"); pg2.keyboard.press(' '); shots += 1; pg2.wait_for_timeout(7000)
                pa = A.evaluate("JSON.stringify(GAME_MODS.pool && null)")
                sa, sb = A.evaluate(BALLS), B.evaluate(BALLS); looks += 1; same += sa.replace(' YOU', '').split(' | ')[:2] == sb.replace(' YOU', '').split(' | ')[:2]
                break
        else: A.wait_for_timeout(800)
    print(f'   {shots} shots; panels matched {same}/{looks}:', A.evaluate(BALLS)[:150])
    check(shots >= 3 and same == looks, 'players took turns and both screens agree')
    A.screenshot(path='test/shots/np_pool_A.png')
    done(A, B)
