"""Small helper: open the built hub in headless Chromium and collect page errors."""
import os, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILE = os.environ.get('PS_FILE', os.path.join(ROOT, 'dist', 'gamehub.html'))
SHOTS = os.path.join(ROOT, 'test', 'shots')
os.makedirs(SHOTS, exist_ok=True)
EXE = '/opt/pw-browsers/chromium' if os.path.exists('/opt/pw-browsers/chromium') else None

def launch(p):
    kw = {'args': ['--no-sandbox']}
    if EXE: kw['executable_path'] = EXE
    return p.chromium.launch(**kw)

def open_page(br, w=1280, h=900, mobile=False):
    ctx = br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=mobile, has_touch=mobile)
    pg = ctx.new_page()
    pg.errs = []
    pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    pg.on('console', lambda m: pg.errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    stub = os.path.join(ROOT, 'test', 'tw_stub.js')
    if os.path.exists(stub):
        ctx.route('https://cdn.tailwindcss.com/**', lambda r: r.fulfill(path=stub, content_type='application/javascript'))
        ctx.route('https://cdn.tailwindcss.com', lambda r: r.fulfill(path=stub, content_type='application/javascript'))
    # the regular tests never touch the real online service (only test/t_online_real.py does, on purpose)
    ctx.route('https://*.supabase.co/**', lambda r: r.abort())
    ctx.route('https://cdn.jsdelivr.net/npm/@supabase/**', lambda r: r.abort())
    pg.goto('file://' + FILE)
    pg.wait_for_timeout(400)
    pg.evaluate("() => { try { SFX.isOn && SFX.isOn() && SFX.toggle && SFX.toggle(); } catch (e) {} }")
    return pg
