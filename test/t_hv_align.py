"""How-to videos: the yellow outline must sit exactly on the part of the game picture it points at, on any screen size.
For every highlighted line of every game it compares the outline with where that part is in the picture (from the
picture list), at a normal laptop, a short laptop and a phone."""
import sys, os, threading, http.server, functools, socketserver, json; sys.path.insert(0, 'test')
from tlib import *
from nplib import check
SITE = os.path.join(ROOT, 'dist', 'site')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=SITE)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
idx = json.load(open(os.path.join(SITE, 'howto', 'index.json')))
worst = 0; n = 0; zmax = 0
with sync_playwright() as p:
    br = launch(p)
    for w, h, mob in [(1280, 800, False), (1366, 620, False), (390, 844, True)]:
        ctx = br.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob, reduced_motion='no-preference')
        ctx.route('https://*.supabase.co/**', lambda r: r.abort())
        pg = ctx.new_page(); pg.goto(f'http://127.0.0.1:{port}/'); pg.wait_for_timeout(1200)
        pg.evaluate("localStorage.setItem('ps_hv_voice','0')")
        # the camera zoom runs, but at once, so every check sees the fully zoomed-in picture (where a drift would be biggest)
        pg.add_style_tag(content='.hv-cam{animation-duration:1ms!important}')
        for gid in idx:
            pg.evaluate(f"playHowTo('{gid}')"); pg.wait_for_timeout(500)
            k = pg.evaluate("document.querySelectorAll('.hv-prog i').length")
            for i in range(k):
                pg.evaluate(f"document.querySelector('[data-hv=\"pause\"]').click()") if i == 0 else None
                r = pg.evaluate(f"""(() => {{ const b = document.querySelectorAll('.hv-prog i'); return true; }})()""")
                pg.wait_for_timeout(120)
                pg.wait_for_function("(() => { const im = document.querySelector('.hv-shot img'); return !im || (im.complete && im.naturalWidth > 0); })()", timeout=8000)
                res = pg.evaluate("""(() => { let zoomed; const img = document.querySelector('.hv-shot img'), f = document.querySelector('.hv-focus');
                  if (!img || !f || !img.complete || !img.naturalWidth) return null;
                  const ir = img.getBoundingClientRect(), fr = f.getBoundingClientRect(), sh = img.closest('.hv-shot').getBoundingClientRect();
                  // the picture is never cropped: its box has the picture's own shape, and the image fills it
                  const ratio = Math.abs(ir.width / ir.height - 16 / 9); zoomed = Math.max(zoomed || 0, ir.width / (sh.width - 8));
                  return { zoomed, ratio, fx: (fr.left - ir.left) / ir.width, fy: (fr.top - ir.top) / ir.height, fw: fr.width / ir.width, fh: fr.height / ir.height, i: [...document.querySelectorAll('.hv-prog i')].findIndex((e) => e.className === 'on') }; })()""")
                if res:
                    line = pg.evaluate(f"HOWTO_SCRIPT['{gid}'].lines[{res['i']}]")
                    shot = idx[gid][line[0]]; bx = shot['boxes'][line[1]]
                    exp = [bx[0] / shot['w'], bx[1] / shot['h'], bx[2] / shot['w'], bx[3] / shot['h']]
                    err = max(abs(res['fx'] - exp[0]), abs(res['fy'] - exp[1]), abs(res['fw'] - exp[2]), abs(res['fh'] - exp[3]))
                    err = max(err, res['ratio'] / 2)
                    worst = max(worst, err); n += 1; zmax = max(zmax, res['zoomed'])
                    if err > 0.01: print(f'   off by {err:.3f} at {w}x{h}: {gid} line {res["i"]}')
                pg.evaluate("document.querySelector('[data-hv=\"next\"]').click()")
            pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
        if w == 1366:
            pg.evaluate("playHowTo('fibber')"); pg.wait_for_timeout(400); pg.evaluate("document.querySelector('[data-hv=\"next\"]').click()"); pg.wait_for_timeout(3000)
            pg.screenshot(path='test/shots/hv_align_short.png'); pg.keyboard.press('Escape')
        ctx.close()
    br.close()
srv.shutdown()
print(f'   checked {n} highlighted lines; worst difference {worst * 100:.2f}% of the picture')
print(f'   biggest zoom seen: {zmax:.2f}x')
check(zmax > 1.3, 'the pictures really zoom in during the check')
check(n > 150 and worst < 0.01, 'every yellow outline sits on the part it points at, on laptops and phones')
