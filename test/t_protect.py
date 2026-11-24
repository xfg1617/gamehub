"""Copy protection on the live copy (dist/site/index.html): the code is scrambled (minified), the games work on our own
address, and a copy served from another web address shows "This is not the official GameHub" instead."""
import sys, os; sys.path.insert(0, 'test')
from nplib import *
SITE = os.path.join(ROOT, 'dist', 'site', 'index.html')
page = open(SITE, encoding='utf-8').read()
check('computer players take their time' not in page and 'computer players take their time' in open(os.path.join(ROOT, 'dist', 'gamehub.html'), encoding='utf-8').read() and 'gamehub.us.com' in page, 'the live copy is scrambled')
with sync_playwright() as p:
    br = launch(p)
    for host, official in (('gamehub.us.com', True), ('gamehub-8w2.pages.dev', True), ('copycat-games.example', False)):
        ctx = br.new_context(viewport={'width': 1280, 'height': 800})
        ctx.route('https://*.supabase.co/**', lambda r: r.abort()); ctx.route('https://cdn.jsdelivr.net/**', lambda r: r.abort())
        ctx.route(f'https://{host}/**', lambda r: r.fulfill(path=SITE, content_type='text/html'))
        pg = ctx.new_page(); pg.goto(f'https://{host}/'); pg.wait_for_timeout(1500)
        txt = pg.evaluate("document.body.innerText")
        if official: check(pg.evaluate("typeof GAME_MODS === 'object' && Object.keys(GAME_MODS).length > 10") and 'not the official' not in txt, f'{host}: the games load')
        else: check('not the official GameHub' in txt and pg.evaluate("(() => { try { return Object.keys(GAME_MODS).length; } catch (e) { return 0; } })()") == 0, f'{host}: a copy on another address shows the warning, no games')
        ctx.close()
done()
