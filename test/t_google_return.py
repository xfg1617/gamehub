"""Coming back from Google (Nov 2026 bug: "after signing in with Google the site still shows Sign up · Log in"):
the page tidies its address before the online service loads; the sign-in details must still be read.
Fakes Google's answer in the address and the service's 'who is this' reply. python3 test/t_google_return.py"""
import sys, json, base64, time; sys.path.insert(0, 'test')
from tlib import *
UMD = os.path.join(ROOT, 'test', 'supabase_umd.js')
def b64(o): return base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip('=')
exp = int(time.time()) + 3600
jwt = b64({'alg': 'HS256', 'typ': 'JWT'}) + '.' + b64({'sub': 'u-google-1', 'exp': exp, 'email': 'player@example.com', 'role': 'authenticated', 'is_anonymous': False}) + '.sig'
USER = {'id': 'u-google-1', 'aud': 'authenticated', 'role': 'authenticated', 'email': 'player@example.com', 'is_anonymous': False, 'app_metadata': {'provider': 'google'}, 'user_metadata': {}, 'created_at': '2026-11-28T00:00:00Z'}
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
with sync_playwright() as p:
    br = launch(p)
    for case in ('home', 'hash-stripped'):
        ctx = br.new_context(viewport={'width': 1280, 'height': 800})
        ctx.route('https://cdn.jsdelivr.net/npm/@supabase/**', lambda r: r.fulfill(path=UMD, content_type='application/javascript'))
        ctx.route('http://gamehub.test/**', lambda r: r.fulfill(path=FILE, content_type='text/html'))
        def sup(r):
            if '/auth/v1/user' in r.request.url: return r.fulfill(status=200, content_type='application/json', body=json.dumps(USER))
            return r.abort()
        ctx.route('https://*.supabase.co/**', sup)
        if case == 'hash-stripped':   # something tidies the address before the service loads (what happened on the live site)
            ctx.add_init_script("document.addEventListener('DOMContentLoaded', () => { try { history.pushState({ p: '/' }, '', '/'); } catch (e) {} });")
        pg = ctx.new_page(); pg.errs = []; pg.on('pageerror', lambda e: pg.errs.append(str(e)))
        pg.goto(f'http://gamehub.test/#access_token={jwt}&expires_at={exp}&expires_in=3600&refresh_token=rt1&token_type=bearer&provider_token=g1')
        try: pg.wait_for_function("typeof NET !== 'undefined' && (NET.account || NET.failed)", timeout=20000)
        except Exception: pass
        acc = pg.evaluate("NET.account"); url = pg.evaluate("location.href")
        print(f'   [{case}] account: {acc} | address now: {url}')
        check(acc and acc.get('email') == 'player@example.com', f'{case}: back from Google = signed in (not a guest)')
        check('access_token' not in url, f'{case}: the sign-in details are cleaned out of the address')
        check(not pg.errs, f'{case}: no page errors {pg.errs[:2]}')
        ctx.close()
print('ALL PASS' if not fails else f'FAILED: {fails}')
