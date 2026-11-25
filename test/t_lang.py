"""Language switch: Tiếng Việt in the side menu turns the menus, home page, game tiles, setup and room screens into
Vietnamese (chat messages people type stay as typed), and English comes back."""
import sys; sys.path.insert(0, 'test')
from nplib import *
with sync_playwright() as p:
    A, = players(p, 1)
    A.set_viewport_size({'width': 1440, 'height': 900})
    check('Tiếng Việt' in A.inner_text('#nav-lang'), 'the side menu has a Tiếng Việt button')
    A.evaluate("document.getElementById('chat-input') && 0")
    A.click('#nav-lang'); A.wait_for_load_state(); A.wait_for_function("typeof NET !== 'undefined' && NET.on && NET.me", timeout=20000); A.wait_for_timeout(1200)
    t = A.inner_text('body')
    for s in ('Chơi cùng bạn bè', 'TẤT CẢ TRÒ CHƠI', 'Cờ Vua', 'Xì Dách', 'Bảng Xếp Hạng'): check(s in t, f'home page shows "{s}"')
    check('Play with friends' not in t, 'the English home page text is gone')
    A.evaluate("openGame('chess')"); A.wait_for_timeout(800)
    check('BẠN MUỐN CHƠI THẾ NÀO?' in A.inner_text('body'), 'the setup screen is in Vietnamese')
    A.evaluate("navigateTo('play', true)"); A.wait_for_timeout(300)
    A.evaluate("CHAT && typeof netChatSend === 'function' ? 0 : 0")
    A.click('#nav-lang'); A.wait_for_load_state(); A.wait_for_function("typeof NET !== 'undefined' && NET.on && NET.me", timeout=20000); A.wait_for_timeout(800)
    check('Play with friends' in A.inner_text('body'), 'switching back brings English back')
    check(not A.errs, 'no page errors ' + str(A.errs))
    done(A)

# Nov 2026: the switch works on every page, at once (no reload), also in the middle of a game
with sync_playwright() as p:
    br = launch(p); A = open_page(br, 1440, 900)
    A.evaluate("navigateTo('play', true); openGame('poker')"); A.wait_for_timeout(300); A.click('#su-go'); A.wait_for_timeout(1500)
    check(A.query_selector('#gs-tools .lang-mini') is not None, 'the game header has an EN/VI button')
    A.evaluate("window.__marker = 1")
    A.click('#gs-tools .lang-mini'); A.wait_for_timeout(600)
    check(A.evaluate("window.__marker") == 1, 'no reload: the game carries on')
    body = A.inner_text('body')
    check('Hướng dẫn' in body or 'Sảnh' in body, 'the game is in Vietnamese at once')
    A.screenshot(path='test/shots/lang_ingame.png')
    A.click('#gs-tools .lang-mini'); A.wait_for_timeout(600)
    body = A.inner_text('body')
    check('Guide' in body and 'Hướng dẫn' not in body, 'switching back gives English at once')
    check(not A.errs, 'no page errors ' + str(A.errs))
    br.close()
print('ALL GOOD' if not fails else 'FAILED: ' + ', '.join(fails))
