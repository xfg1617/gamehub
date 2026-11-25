"""Fun moments (Inna, Nov 2026): a burst on screen and a badge on the player's name tag that stays through redraws; +2
points when it is you."""
import sys; sys.path.insert(0, 'test')
from tlib import *
from nplib import check
with sync_playwright() as p:
    br = launch(p); pg = open_page(br, 1500, 900)
    pg.evaluate("openGame('fibber')"); pg.wait_for_timeout(300); pg.click('#su-go'); pg.wait_for_timeout(3000)
    pg.evaluate("funMoment('fb-seat-1', { key: 'fire', icon: '🔥', label: 'x2', fire: true, burst: 'ON FIRE!', sub: 'test', mine: false })")
    pg.wait_for_timeout(300)
    check(pg.query_selector('.fx-burst') is not None, 'the burst shows')
    check(pg.query_selector('#fb-seat-1 .fx-mini') is not None and pg.query_selector('#fb-seat-1 .fx-flames') is not None, 'the badge and flames sit on the name tag')
    pg.screenshot(path='test/shots/fun_fire.png')
    pg.wait_for_timeout(6000)
    check(pg.query_selector('#fb-seat-1 .fx-mini') is not None, 'and stay after the table is redrawn')
    check(pg.query_selector('.fx-burst') is None, 'the burst goes away by itself')
    pg.evaluate("funMoment('fb-seat-0', { key: 'liar', icon: '🎭', label: 'SMOOTH LIAR', mine: true })")
    pg.evaluate("reportGame('fibber', 'loss', { xp: 1, label: 't', place: 3 })")
    pts = pg.evaluate("POINTS.last.p"); print('   points for 3rd place vs computers + a fun moment:', pts)
    check(pts == 2 + 2, 'your own fun moment adds +2 points (3rd vs computers = 2, +2)')
    check(not pg.errs, 'no errors ' + str(pg.errs[:2]))
    br.close()
