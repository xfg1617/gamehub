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
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    check(not errs, 'no errors ' + str(errs[:2]))
    br.close()
srv.shutdown()
