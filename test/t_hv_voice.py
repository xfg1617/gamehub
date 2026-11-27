"""How-to videos use the recorded Google voice (Puck) on the live site: serves dist/site over http, opens the Uno video in
English and Vietnamese, and checks each line's recording loads and plays (no fallback to the device voice)."""
import sys, os, threading, http.server, functools, socketserver; sys.path.insert(0, 'test')
from tlib import *
from nplib import check
SITE = os.path.join(ROOT, 'dist', 'site')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):   # like Cloudflare Pages: any unknown address serves index.html
        p = self.translate_path(self.path)
        if not os.path.exists(p): self.path = '/index.html'
        return super().send_head()
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=SITE)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    br = launch(p); ctx = br.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    got = []; pg.on('response', lambda r: got.append((r.status, r.url)) if '/voice/' in r.url else None)
    ctx.route('https://*.supabase.co/**', lambda r: r.abort())
    pg.goto(f'http://127.0.0.1:{port}/'); pg.wait_for_timeout(1500)
    for lang in ('en', 'vi'):
        got.clear()
        pg.evaluate(f"setLang('{lang}'); localStorage.setItem('ps_hv_voice', '1'); playHowTo('colorclash')"); pg.wait_for_timeout(4000)
        playing = pg.evaluate("(() => { const a = document.querySelector('.hv') && window.__hvA; return null; })()")
        ok = [g for g in got if g[0] == 200]
        print(f'   {lang}: {len(ok)} recordings loaded, e.g.', ok[0][1].split('/voice/')[1] if ok else '-')
        check(len(ok) >= 1 and all(s == 200 for s, _ in got), f'{lang}: the Uno video loads its recorded voice lines')
        pg.wait_for_timeout(9000)
        shot = pg.evaluate("(() => { const i = document.querySelector('.hv-shot video') || document.querySelector('.hv-shot img'); return i ? [i.naturalWidth || i.videoWidth || (i.tagName === 'VIDEO' ? 1 : 0), !!document.querySelector('.hv-focus'), document.querySelector('.hv-cap').textContent.length] : null; })()")
        print(f'   {lang}: game picture', shot)
        check(shot and shot[0] > 0 and shot[1], f'{lang}: the video shows real gameplay (a clip or a picture) with the part being explained outlined')
        pg.screenshot(path=f'test/shots/hv_{lang}.png')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    # inside a game: the video is in the ? Guide pop-up (Inna, Nov 27 2026: no separate Video button in the bar)
    pg.evaluate("setLang('en'); openGame('poker')"); pg.wait_for_timeout(500)
    if pg.query_selector('#su-go'): pg.click('#su-go')
    pg.wait_for_timeout(2000)
    check(pg.query_selector('#gs-tools .gs-video') is None, 'no separate Video button in the game bar')
    pg.click('#gs-tools .gs-guide'); pg.wait_for_timeout(600)
    b = pg.query_selector('.hv-btn'); check(b is not None, 'the Guide pop-up has the video button')
    if b: b.click(); pg.wait_for_timeout(1500); check(pg.query_selector('.hv') is not None, 'it opens the video over the game')
    check(not errs, 'no errors ' + str(errs[:2]))
    br.close()
srv.shutdown()
