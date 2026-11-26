"""Update log + "what's new" pop-up.
* The footer link opens every update by date (newest first), English and Vietnamese; Esc closes it.
* A returning player sees the newest update once, on the home screen, when they open the site after an update.
* A brand-new player never sees it (they get the welcome pop-up); arriving by invite link or going straight into a game
  doesn't show it; it never sits on top of the welcome pop-up (that one waits)."""
import sys, json; sys.path.insert(0, 'test')
from tlib import *
from nplib import check

OLD = "localStorage.setItem('playstack_friendly_v3', JSON.stringify({name: 'Returning', v: 2})); localStorage.setItem('ps_upd_seen', '2026-11-01');"


def page(br, returning=False, url='', w=1366, h=768, mob=False, welcome=False):
    ctx = br.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob, device_scale_factor=2)
    js = "window.__showUpdPop = true;" + ("window.__showWelcome = true;" if welcome else "")
    if returning: js += "if (!sessionStorage.getItem('t_once')) { sessionStorage.setItem('t_once', '1'); " + OLD + " }"
    ctx.add_init_script(js)
    pg = ctx.new_page(); pg.errs = []; pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    pg.goto('file://' + FILE + url); return ctx, pg


shown = "(() => { const m = document.getElementById('upd-modal'); return !!m && !m.classList.contains('hidden'); })()"
with sync_playwright() as p:
    br = launch(p)

    # 1. the footer link, laptop + phone
    for w, h, mob, name in [(1366, 768, False, 'upd_laptop'), (390, 844, True, 'upd_phone')]:
        ctx, pg = page(br, w=w, h=h, mob=mob); pg.wait_for_timeout(1200)
        pg.locator('#upd-link').scroll_into_view_if_needed(); pg.click('#upd-link'); pg.wait_for_timeout(400)
        n = pg.evaluate("document.querySelectorAll('#upd-modal .upd').length")
        first = pg.evaluate("document.querySelector('#upd-modal .upd-date').textContent")
        check(n == pg.evaluate("UPDATES.length") and n >= 5, f'{name}: every update is listed ({n})')
        check('November' in first and '2026' in first, f'{name}: newest first with its date ({first})')
        pg.screenshot(path=f'test/shots/{name}.png')
        if not mob:
            pg.evaluate("setLang('vi')"); pg.wait_for_timeout(600)
            t = pg.evaluate("document.querySelector('#upd-modal .upd-title').textContent")
            check(t != pg.evaluate("UPDATES[0].en[0]") and t == pg.evaluate("UPDATES[0].vi[0]"), f'Vietnamese log ({t})'); pg.evaluate("setLang('en')")
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        check(not pg.evaluate(shown), f'{name}: Esc closes it')
        check(not pg.errs, f'{name}: no errors {pg.errs[:2]}'); ctx.close()

    # 2. a brand-new player: no update pop-up, no dot
    ctx, pg = page(br); pg.wait_for_timeout(4500)
    check(not pg.evaluate(shown), 'new player: no update pop-up')
    check(not pg.evaluate("!!document.querySelector('.upd-dot')"), 'new player: no "new" dot either')
    check(pg.evaluate("localStorage.getItem('ps_upd_seen')") == pg.evaluate("UPDATES[0].id || UPDATES[0].date"), 'new player: marked as up to date')
    ctx.close()

    # 3. a returning player: the newest update pops up once
    ctx, pg = page(br, returning=True); pg.wait_for_timeout(800)
    check(pg.evaluate("!!document.querySelector('#upd-link .upd-dot')"), 'returning: the link has a "new" dot')
    pg.wait_for_function(shown, timeout=8000)
    check(pg.evaluate("document.querySelectorAll('#upd-modal .upd').length") == 1, 'returning: the pop-up shows only the newest update')
    pg.screenshot(path='test/shots/upd_pop.png')
    pg.click('#upd-all'); pg.wait_for_timeout(300)
    check(pg.evaluate("document.querySelectorAll('#upd-modal .upd').length") == pg.evaluate("UPDATES.length"), 'See all updates shows the whole log')
    pg.click('#upd-ok'); pg.wait_for_timeout(300)
    pg.reload(); pg.wait_for_timeout(4500)
    check(not pg.evaluate(shown), 'returning: only once (not again after a reload)')
    check(not pg.errs, f'returning: no errors {pg.errs[:2]}'); ctx.close()

    # 4. a returning player who arrives by invite link: not now (they came to play)
    ctx, pg = page(br, returning=True, url='#join=ABCD&g=chess'); pg.wait_for_timeout(4500)
    check(not pg.evaluate(shown), 'invite link: no update pop-up'); ctx.close()

    # 5. straight into a game: waits until they are back on the home screen
    ctx, pg = page(br, returning=True); pg.wait_for_timeout(300)
    pg.evaluate("openGame('chess')"); pg.wait_for_timeout(4000)
    check(not pg.evaluate(shown), 'in a game: no update pop-up')
    pg.evaluate("GT.started = false; navigateTo('play')"); pg.wait_for_function(shown, timeout=8000)
    check(True, 'back home: the update pop-up shows'); ctx.close()

    # 6. never on top of the new-player welcome
    ctx, pg = page(br, returning=True, welcome=True); pg.wait_for_function(shown, timeout=8000)
    pg.evaluate("showWelcome('first')"); pg.wait_for_timeout(1500)
    check(not pg.evaluate("!!document.getElementById('wl-pop')"), 'welcome waits while the update pop-up is open')
    pg.click('#upd-ok'); pg.wait_for_timeout(1600)
    check(pg.evaluate("!!document.getElementById('wl-pop')"), 'then the welcome shows, after it is closed')
    pg.evaluate("document.getElementById('wl-pop').remove(); localStorage.setItem('ps_upd_seen', '2026-11-01'); PS_RETURNING = true")
    ctx.close()
    ctx, pg = page(br, welcome=True)   # and the other way round: the update pop-up waits for the welcome
    pg.wait_for_timeout(500)
    pg.evaluate("localStorage.setItem('ps_upd_seen', '2026-11-01'); showWelcome('first')"); pg.wait_for_timeout(200)
    pg.evaluate("autoShowForTest()"); pg.wait_for_timeout(3500)
    check(not pg.evaluate(shown), 'update pop-up waits while the welcome is open')
    pg.evaluate("document.getElementById('wl-pop').remove()"); pg.wait_for_function(shown, timeout=6000)
    check(True, 'then the update pop-up shows')
    ctx.close()
    br.close()
