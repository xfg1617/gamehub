"""CAPTCHA (Cloudflare Turnstile): on our own address the guest sign-in asks Turnstile for a token and sends it to
Supabase (captcha_token). Turnstile and Supabase are both stand-ins here: no real service is touched."""
import sys, os, json; sys.path.insert(0, 'test')
from nplib import *
SITE = os.path.join(ROOT, 'dist', 'site', 'index.html')
TS = "window.turnstile = { render(el, o) { el.textContent = 'turnstile'; setTimeout(() => o.callback('TEST-TOKEN-123'), 300); return 'w1'; }, remove() {} };"
with sync_playwright() as p:
    br = launch(p)
    for host, want in (('gamehub.us.com', True), ('localhost', False)):
        ctx = br.new_context(); seen = []
        ctx.route('https://cdn.jsdelivr.net/npm/@supabase/**', lambda r: r.fulfill(path=UMD, content_type='application/javascript'))
        ctx.route('https://challenges.cloudflare.com/**', lambda r: r.fulfill(body=TS, content_type='application/javascript'))
        def auth(r):
            if '/auth/v1/' in r.request.url and r.request.method == 'POST': seen.append(r.request.post_data or '')
            r.fulfill(status=400, body=json.dumps({'code': 400, 'msg': 'test stand-in'}), content_type='application/json')
        ctx.route('https://*.supabase.co/**', auth)
        scheme = 'https' if host != 'localhost' else 'http'
        ctx.route(f'{scheme}://{host}/**', lambda r: r.fulfill(path=SITE, content_type='text/html'))
        pg = ctx.new_page(); pg.goto(f'{scheme}://{host}/'); pg.wait_for_timeout(5000)
        sent = [s for s in seen if 'captcha_token' in s]
        print(f'   {host}: {len(seen)} sign-in calls, with a token: {len(sent)}', (sent[:1] or [''])[0][:120])
        if want: check(any('TEST-TOKEN-123' in s for s in sent), f'{host}: the guest sign-in sends the CAPTCHA token')
        else: check(seen and not sent, f'{host}: no CAPTCHA off our address (the sign-in still goes ahead)')
        ctx.close()
done()
