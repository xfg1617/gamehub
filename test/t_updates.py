"""Update log: the "What's new" link in the footer opens every update with its date (newest first), in English and
Vietnamese; a small dot marks the link until the newest update has been seen."""
import sys; sys.path.insert(0, 'test')
from tlib import *
from nplib import check
with sync_playwright() as p:
    br = launch(p)
    for w, h, mob, name in [(1366, 768, False, 'upd_laptop'), (390, 844, True, 'upd_phone')]:
        ctx = br.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob, device_scale_factor=2)
        pg = ctx.new_page(); pg.errs = []; pg.on('pageerror', lambda e: pg.errs.append(str(e)))
        pg.goto('file://' + FILE); pg.wait_for_timeout(1200)
        check(pg.evaluate("!!document.querySelector('#upd-link .upd-dot')"), f'{name}: the link has a "new" dot before it is opened')
        pg.locator('#upd-link').scroll_into_view_if_needed(); pg.click('#upd-link'); pg.wait_for_timeout(400)
        n = pg.evaluate("document.querySelectorAll('#upd-modal .upd').length")
        first = pg.evaluate("document.querySelector('#upd-modal .upd-date').textContent")
        check(n == pg.evaluate("UPDATES.length") and n >= 5, f'{name}: every update is listed ({n})')
        check('November 26, 2026' in first, f'{name}: newest first with its date ({first})')
        check(not pg.evaluate("!!document.querySelector('#upd-link .upd-dot')"), f'{name}: the dot goes once seen')
        pg.screenshot(path=f'test/shots/{name}.png')
        if not mob:
            pg.evaluate("setLang('vi')"); pg.wait_for_timeout(600)
            t = pg.evaluate("document.querySelector('#upd-modal .upd-title').textContent")
            check('Âm thanh' in t, f'Vietnamese log ({t})'); pg.screenshot(path='test/shots/upd_vi.png'); pg.evaluate("setLang('en')")
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        check(pg.evaluate("document.getElementById('upd-modal').classList.contains('hidden')"), f'{name}: Esc closes it')
        pg.reload(); pg.wait_for_timeout(900)
        check(not pg.evaluate("!!document.querySelector('#upd-link .upd-dot')"), f'{name}: no dot after a reload')
        check(not pg.errs, f'{name}: no errors {pg.errs[:2]}')
        ctx.close()
    br.close()
