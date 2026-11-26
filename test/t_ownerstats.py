"""The owner's private stats page (/my-stats): the owner (on the stand-in: the tab with ps_owner_test) gets a Site stats
button and sees the numbers; another logged-in player gets no button and "This page is private."; a guest is asked to
log in. The real privacy check is on the server (backend/owner-stats.sql, tested on PostgreSQL 16)."""
import sys; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, B = players(p, 2)
    A.evaluate("sessionStorage.setItem('ps_owner_test', '1')")
    for pg, n in [(A, 5), (B, 2)]:
        pg.evaluate(f"NET.publishStats({{played: {n}, wins: 1, games: {{chess: [{n}, 1, {n - 1}, 0], pool: [1, 0, 1, 0]}}, guest: false}})")
    A.reload(); A.wait_for_function("NET.on && NET.account", timeout=20000)
    A.wait_for_selector('#nav-stats', timeout=15000)
    check(True, 'owner: the Site stats button appears in the side menu')
    B.wait_for_timeout(6500)
    check(not B.query_selector('#nav-stats'), 'another player: no Site stats button')
    A.click('#nav-stats'); A.wait_for_selector('.os-tile', timeout=10000)
    tiles = A.evaluate("[...document.querySelectorAll('.os-tile')].map(t => t.querySelector('span').textContent + '=' + t.querySelector('b').textContent)")
    print('   ', tiles)
    check(any(t.startswith('REAL PLAYERS=') for t in tiles) and len(tiles) == 8, 'owner: sees the number tiles')
    check(A.evaluate("location.pathname") == '/my-stats', 'the address is /my-stats')
    check(A.evaluate("document.querySelectorAll('#os-chart .os-col').length") == 14, 'the chart shows the last 14 days')
    A.locator('#os-chart .os-col').last.hover(); A.wait_for_timeout(200)
    tipd = A.evaluate("document.querySelector('#os-tip b').textContent"); lastd = A.evaluate("document.querySelector('#os-chart .os-col:nth-last-child(2) .os-x').textContent")
    check(not A.evaluate("document.getElementById('os-tip').classList.contains('hidden')") and tipd == lastd, f'pointing at a day shows its numbers ({tipd} / label {lastd})')
    check(A.evaluate("document.querySelector('.os-gn').textContent") == 'Chess', 'most played games lists Chess first')
    A.set_viewport_size({'width': 1366, 'height': 900}); A.wait_for_timeout(300); A.screenshot(path='test/shots/ownerstats.png', full_page=False)
    A.set_viewport_size({'width': 390, 'height': 844}); A.wait_for_timeout(300); A.screenshot(path='test/shots/ownerstats_phone.png')
    # a preview picture with made-up SAMPLE numbers (only in this test browser), to show what a busy fortnight looks like
    A.set_viewport_size({'width': 1366, 'height': 900})
    A.evaluate("""(() => { const days = []; const r = [0,0,0,0,0,0,0,0,0,3,21,64,57,38];
      for (let i = 13; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), n = r[13 - i]; days.push({ d, new: n, played: Math.round(n * .55), accounts: Math.round(n * .08), rooms: Math.round(n * .4), chats: n * 2 }); }
      NET.ownerStats = async () => ({ total: 183, accounts: 14, played: 96, returned: 41, new_today: 38, active_today: 52, games_total: 612, days,
        games: [['poker', 140, 41], ['colorclash', 96, 30], ['chess', 80, 22], ['pool', 71, 25], ['tycoon', 55, 18], ['kittens', 40, 15], ['fibber', 33, 12], ['tictactoe', 30, 19]].map(([g, n, p]) => ({ g, n, p })) });
      document.getElementById('os-refresh').click(); })()""")
    A.wait_for_timeout(600); A.locator('#os-chart .os-col').nth(11).hover(); A.wait_for_timeout(200)
    A.set_viewport_size({'width': 1366, 'height': 1250}); A.wait_for_timeout(300); A.locator('#os-chart .os-col').nth(11).hover(); A.wait_for_timeout(200)
    A.screenshot(path='test/shots/ownerstats_sample.png'); A.set_viewport_size({'width': 1366, 'height': 900})
    A.set_viewport_size({'width': 1366, 'height': 900})
    A.click('#os-close'); A.wait_for_timeout(200)
    check(A.evaluate("document.getElementById('os-page').classList.contains('hidden') && location.pathname === '/'"), 'Close goes back to the site')
    # opening the address directly
    A.goto('http://gamehub.test/my-stats'); A.wait_for_selector('.os-tile', timeout=20000)
    check(True, 'owner: gamehub.us.com/my-stats opens it directly')
    B.evaluate("openOwnerStats()"); B.wait_for_selector('.os-note', timeout=10000)
    check('private' in B.inner_text('.os-note').lower() and not B.query_selector('.os-tile'), 'another player: "This page is private." and no numbers')
    done(A, B)
with sync_playwright() as p:
    G, = players(p, 1, account=False)
    G.evaluate("sessionStorage.setItem('ps_owner_test', '1')")
    G.evaluate("openOwnerStats()"); G.wait_for_selector('.os-note', timeout=10000)
    check('LOG IN' in G.inner_text('.os-note').upper() and not G.query_selector('.os-tile'), 'a guest is asked to log in and sees no numbers')
    done(G)
