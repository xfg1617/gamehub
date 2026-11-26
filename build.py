"""Build GameHub: glue src/ onto base/ and write dist/gamehub.html.

    python3 build.py

- base/playstack_base.html  the page itself (layout, menus, Naval Grid, Daily Word, Four-in-a-Row, sounds)
- src/css/*.css             styles, added in file-name order (the numbers keep the order CSS needs)
- src/core.js               the shared game framework (setup screens, motion, chat, chips, ...)
- src/net.js                online play: accounts, rooms, live moves, chat, ranked Elo (talks to Supabase)
- src/online.json           the Supabase project address + public key; leave them empty to stay offline
- src/netplay.js           one shared way to run a game table on this device or online (lobby, seats, ordered actions)
- src/icons.js              pixel icons for the game tiles
- src/dict.json             the Word Connect word list
- src/games/*.js            one file per game; a new file here is picked up automatically
"""
import glob, json, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, 'dist', 'gamehub.html')
CSS_MARK = "  </style>\n</head>"
JS_MARK = "    /* =========================================================================\n       8. KEYBOARD LISTENERS"


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def sfx_js():
    """Real recorded sounds (src/sfx/*.mp3, Kenney CC0 packs): window.SFX_FILES = {name: [base64 mp3, ...]}.
    File names are <sound>_<variant>.mp3; the game picks a variant at random each time."""
    import base64, glob, re
    files = {}
    for f in sorted(glob.glob(os.path.join(SRC, 'sfx', '*.mp3'))):
        name = re.sub(r'_[^_]*$', '', os.path.splitext(os.path.basename(f))[0])
        files.setdefault(name, []).append(base64.b64encode(open(f, 'rb').read()).decode('ascii'))
    return f"    window.SFX_FILES = {json.dumps(files)};\n" if files else ''


def dict_js():
    d = json.load(open(os.path.join(SRC, 'dict.json'), encoding='utf-8'))
    words = {}
    for w in d['all']:
        words.setdefault(len(w), []).append(w)
    return ("    /* word list for Word Connect (common English words, 3-7 letters) */\n"
            "    const WC_WORDS = {" + ','.join(f"{k}:'{' '.join(sorted(v))}'" for k, v in sorted(words.items())) + "};\n"
            "    const WC_BASE = '" + ' '.join(sorted(d['base'])) + "';\n")


def more_words_js():
    """The bigger word lists (src/words.json, made by tools/make_words.py from SCOWL; licence in src/WORDS-LICENSE.txt)."""
    f = os.path.join(SRC, 'words.json')
    if not os.path.exists(f): return "    var DW_MORE_ANSWERS = '', DW_GUESSES = '', WC_EXTRA = '';\n"
    w = json.load(open(f, encoding='utf-8'))
    return ("    /* bigger word lists: SCOWL (c) Kevin Atkinson, used under its permissive licence (src/WORDS-LICENSE.txt) */\n"
            "    var DW_MORE_ANSWERS = '" + ' '.join(w['answers']).upper() + "';\n"
            "    var DW_GUESSES = '" + ' '.join(w['guesses']).upper() + "';\n"
            "    var WC_EXTRA = '" + ' '.join(w['wc_extra']) + "';\n")


def build(game_order=None):
    page = read(os.path.join(ROOT, 'base', 'playstack_base.html'))
    assert page.count(CSS_MARK) == 1 and page.count(JS_MARK) == 1, 'base page is missing an insertion point'
    css = ''.join(read(f) for f in sorted(glob.glob(os.path.join(SRC, 'css', '*.css'))))
    games = sorted(glob.glob(os.path.join(SRC, 'games', '*.js')))
    if game_order:  # only used to check the split reproduces the old file exactly
        games = [os.path.join(SRC, 'games', n + '.js') for n in game_order]
    online = {}
    if os.path.exists(os.path.join(SRC, 'online.json')):
        online = {k: v for k, v in json.load(open(os.path.join(SRC, 'online.json'), encoding='utf-8')).items() if k in ('url', 'key', 'turnstile') and v}
    js = (f"    window.PS_ONLINE = {json.dumps(online)};\n" + sfx_js() + read(os.path.join(SRC, 'core.js')) +
          ''.join(read(os.path.join(SRC, f)) for f in ('net.js', 'netplay.js') if os.path.exists(os.path.join(SRC, f))) +
          read(os.path.join(SRC, 'icons.js')) + dict_js() + '\n' + ''.join(read(f) for f in games))
    page = page.replace(CSS_MARK, css + CSS_MARK).replace(JS_MARK, js + JS_MARK)
    i = page.index('</head>')
    page = page[:i] + '  <script>\n' + more_words_js() + '  </script>\n' + page[i:]
    return page


# ---- the styling, built into the page (no outside Tailwind service needed when someone opens it) ----
TW_DIR = os.path.join(ROOT, 'tools', 'tailwind')
TW_CDN = re.compile(r'  <!-- Tailwind CSS CDN -->\n  <script src="https://cdn\.tailwindcss\.com"></script>\n  <script>\n    tailwind\.config = (\{.*?\});\n  </script>\n', re.S)
# classes the games build from pieces at run time (e.g. 'bg-' + tone), which a text scan can't see
SAFELIST = [f'{p}-{c}' for p in ('bg', 'text', 'border', 'btn') for c in ('amber', 'teal', 'coral', 'emerald', 'bone', 'muted', 'graphite', 'ink')]


def inline_tailwind(page):
    m = TW_CDN.search(page)
    tw = os.path.join(TW_DIR, 'node_modules', '.bin', 'tailwindcss')
    if not m or not os.path.exists(tw):
        print('note: Tailwind tool not found (tools/tailwind) - the page keeps loading its styles from the CDN')
        return page
    import subprocess, tempfile
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, 'page.html')
        with open(src, 'w', encoding='utf-8') as f:
            f.write(page)
        cfg = os.path.join(tmp, 'tailwind.config.js')
        with open(cfg, 'w', encoding='utf-8') as f:
            f.write('module.exports = Object.assign(' + m.group(1) + ', { content: [' + json.dumps(src) + '], safelist: ' + json.dumps(SAFELIST) + ' });')
        inp = os.path.join(tmp, 'in.css')
        with open(inp, 'w') as f:
            f.write('@tailwind base;\n@tailwind components;\n@tailwind utilities;\n')
        out = os.path.join(tmp, 'out.css')
        subprocess.run([tw, '-c', cfg, '-i', inp, '-o', out, '--minify'], cwd=TW_DIR, check=True, capture_output=True)
        css = read(out)
    # the online Tailwind service added its styles at the END of <head>, so they win over the page's own rules;
    # the built-in copy goes in the same place so everything looks exactly the same
    page = page[:m.start()] + page[m.end():]
    i = page.index('</head>')
    return page[:i] + '  <style>/* page styles, built in (Tailwind 3) */\n' + css + '\n  </style>\n' + page[i:]


# ---- the live site (Netlify): index.html + pictures + short room links with previews ----
SITE = 'https://gamehub.us.com'
ASSETS = os.path.join(ROOT, 'assets', 'site')
SITE_DIR = os.path.join(ROOT, 'dist', 'site')
DESC = 'Play chess, pool, poker, naval battles and more with your friends. Free, right in your browser, no download.'

def head_tags(page):
    """Tab icon + what chat apps show when the site link is shared (the logo banner)."""
    import base64
    ico = os.path.join(ASSETS, 'favicon.png')
    icon = f'  <link rel="icon" type="image/png" href="data:image/png;base64,{base64.b64encode(open(ico, "rb").read()).decode()}">\n' if os.path.exists(ico) else ''
    tags = (icon +
        f'  <link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'
        f'  <meta name="theme-color" content="#0B1A2B">\n'
        f'  <meta name="description" content="{DESC}">\n'
        f'  <meta property="og:type" content="website">\n'
        f'  <meta property="og:site_name" content="GameHub">\n'
        f'  <meta property="og:title" content="GameHub: play games with your friends">\n'
        f'  <meta property="og:description" content="{DESC}">\n'
        f'  <meta property="og:image" content="{SITE}/og/gamehub.png">\n'
        f'  <meta property="og:image:width" content="1200">\n'
        f'  <meta property="og:image:height" content="630">\n'
        f'  <meta property="og:url" content="{SITE}/">\n'
        f'  <meta name="twitter:card" content="summary_large_image">\n'
        f'  <meta name="twitter:title" content="GameHub: play games with your friends">\n'
        f'  <meta name="twitter:description" content="{DESC}">\n'
        f'  <meta name="twitter:image" content="{SITE}/og/gamehub.png">\n')
    i = page.index('</title>') + len('</title>\n')
    return page[:i] + tags + page[i:]

EDGE = r"""// Netlify Edge Function (made by build.py, don't edit by hand): link previews for room invites.
// gamehub.us.com/r/CODE is the GameHub page itself; this only changes what a chat app SHOWS for the link:
// the game's banner and "Play Chess with Inna" (host with an account) or "Play Chess together" (guest host).
const SUPA = __SUPA__, KEY = __KEY__, SITE = __SITE__, GAMES = __GAMES__;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export default async (request, context) => {
  const res = await context.next();
  const m = /^\/r\/([A-Za-z0-9]{3,8})\/?$/.exec(new URL(request.url).pathname);
  if (!m || !(res.headers.get('content-type') || '').includes('text/html')) return res;
  const code = m[1].toUpperCase();
  let info = null;
  try {
    const r = await fetch(`${SUPA}/rest/v1/rpc/room_preview`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_code: code }) });
    if (r.ok) info = await r.json();
  } catch (e) {}
  const id = info && info.game, name = (id && GAMES[id]) || null;
  const title = name ? (info.host_account && info.host_name ? `Play ${name} with ${info.host_name}` : `Play ${name} together`) : 'Join my game on GameHub';
  const desc = name ? `Tap to join room ${code} on GameHub. Free, right in your browser.` : 'Play games with your friends on GameHub. Free, right in your browser.';
  const img = `${SITE}/og/${name ? (id === 'navalnet' ? 'naval' : id) : 'gamehub'}.png`;
  let html = await res.text();
  const set = (prop, val) => { html = html.replace(new RegExp(`(<meta (?:property|name)="${prop}" content=")[^"]*(")`), `$1${esc(val)}$2`); };
  set('og:title', title); set('twitter:title', title);
  set('og:description', desc); set('twitter:description', desc); set('description', desc);
  set('og:image', img); set('twitter:image', img); set('og:url', `${SITE}/r/${code}`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} · GameHub</title>`);
  const headers = new Headers(res.headers); headers.delete('content-length');
  return new Response(html, { status: 200, headers });
};
export const config = { path: '/r/*' };
"""

# the same preview, as a Cloudflare Pages Function (used after the move to Cloudflare; Netlify ignores it)
CF_FN = r"""// Cloudflare Pages Function (made by build.py, don't edit by hand): link previews for room invites.
// gamehub.us.com/r/CODE serves the GameHub page; this only changes what a chat app SHOWS for the link:
// the game's banner and "Play Chess with Inna" (host with an account) or "Play Chess together" (guest host).
const SUPA = __SUPA__, KEY = __KEY__, SITE = __SITE__, GAMES = __GAMES__;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export async function onRequest(context) {
  const { request, env, params } = context;
  const page = await env.ASSETS.fetch(new Request(new URL('/', request.url), { headers: request.headers }));
  const code = String(params.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  if (!code || !(page.headers.get('content-type') || '').includes('text/html')) return page;
  let info = null;
  try {
    const r = await fetch(`${SUPA}/rest/v1/rpc/room_preview`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_code: code }) });
    if (r.ok) info = await r.json();
  } catch (e) {}
  const id = info && info.game, name = (id && GAMES[id]) || null;
  const title = name ? (info.host_account && info.host_name ? `Play ${name} with ${info.host_name}` : `Play ${name} together`) : 'Join my game on GameHub';
  const desc = name ? `Tap to join room ${code} on GameHub. Free, right in your browser.` : 'Play games with your friends on GameHub. Free, right in your browser.';
  const img = `${SITE}/og/${name ? (id === 'navalnet' ? 'naval' : id) : 'gamehub'}.png`;
  let html = await page.text();
  const set = (prop, val) => { html = html.replace(new RegExp(`(<meta (?:property|name)="${prop}" content=")[^"]*(")`), `$1${esc(val)}$2`); };
  set('og:title', title); set('twitter:title', title);
  set('og:description', desc); set('twitter:description', desc); set('description', desc);
  set('og:image', img); set('twitter:image', img); set('og:url', `${SITE}/r/${code}`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} · GameHub</title>`);
  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60' } });
}
"""

def write_site(page, online):
    """dist/site = exactly what Netlify publishes (netlify.toml points here)."""
    import shutil
    if os.path.exists(SITE_DIR): shutil.rmtree(SITE_DIR)
    os.makedirs(SITE_DIR)
    with open(os.path.join(SITE_DIR, 'index.html'), 'w', encoding='utf-8') as f: f.write(page)
    for name in os.listdir(ASSETS) if os.path.exists(ASSETS) else []:
        src = os.path.join(ASSETS, name)
        if name == 'games.json': continue
        (shutil.copytree if os.path.isdir(src) else shutil.copy)(src, os.path.join(SITE_DIR, name))
    with open(os.path.join(SITE_DIR, '_redirects'), 'w') as f:
        f.write('# short room links: gamehub.us.com/r/CODE opens the site (the edge function adds the preview)\n/r/*  /index.html  200\n')
    games = json.load(open(os.path.join(ASSETS, 'games.json'))) if os.path.exists(os.path.join(ASSETS, 'games.json')) else {}
    edge = (EDGE.replace('__SUPA__', json.dumps(online.get('url', ''))).replace('__KEY__', json.dumps(online.get('key', '')))
            .replace('__SITE__', json.dumps(SITE)).replace('__GAMES__', json.dumps(games)))
    os.makedirs(os.path.join(ROOT, 'netlify', 'edge-functions'), exist_ok=True)
    with open(os.path.join(ROOT, 'netlify', 'edge-functions', 'room-preview.js'), 'w', encoding='utf-8') as f: f.write(edge)
    cf = (CF_FN.replace('__SUPA__', json.dumps(online.get('url', ''))).replace('__KEY__', json.dumps(online.get('key', '')))
          .replace('__SITE__', json.dumps(SITE)).replace('__GAMES__', json.dumps(games)))
    os.makedirs(os.path.join(ROOT, 'functions', 'r'), exist_ok=True)
    with open(os.path.join(ROOT, 'functions', 'r', '[code].js'), 'w', encoding='utf-8') as f: f.write(cf)


# ---------- the live copy (dist/site) is scrambled + locked to our own web address (Inna, Nov 2026: copy protection) ----------
# A web page's code always reaches the visitor's browser, so this can't stop a determined copier; it makes the code hard to
# read and reuse, and a copy put up on another website shows a "play at gamehub.us.com" message instead of the games.
LOCK_JS = """(function () {
  var h = location.hostname;
  var ok = !h || h === 'localhost' || h === '127.0.0.1' || h === 'gamehub.test' || h === 'gamehub.us.com' || /\\.gamehub\\.us\\.com$/.test(h) || h === 'gamehub-8w2.pages.dev' || /\\.gamehub-8w2\\.pages\\.dev$/.test(h);
  if (ok) return;
  document.addEventListener('DOMContentLoaded', function () { document.body.innerHTML = '<div style="font:700 20px sans-serif;color:#F7F4EC;background:#0B1B2B;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px">This is not the official GameHub.<br><br>Play at <a style="color:#F5B041" href="https://gamehub.us.com">gamehub.us.com</a></div>'; });
  throw new Error('GameHub: not the official site');
})();
"""
def protect(page):
    """Minify the main script with terser (tools/tailwind/node_modules) and put the address lock in front of it."""
    blocks = list(re.finditer(r'(<script(?![^>]*src)[^>]*>)(.*?)(</script>)', page, re.S))
    if not blocks: return page
    big = max(blocks, key=lambda m: len(m.group(2)))
    code = LOCK_JS + big.group(2)
    terser = os.path.join(TW_DIR, 'node_modules', '.bin', 'terser')
    if os.path.exists(terser):
        with tempfile.TemporaryDirectory() as tmp:
            src, out = os.path.join(tmp, 'in.js'), os.path.join(tmp, 'out.js')
            with open(src, 'w', encoding='utf-8') as fh: fh.write(code)
            r = subprocess.run([terser, src, '-c', 'passes=1', '-m', '--ecma', '2020', '--format', 'inline_script=true,ascii_only=false', '-o', out], capture_output=True, text=True)
            if r.returncode == 0:
                code = open(out, encoding='utf-8').read()
            else:
                print('note: terser failed, the live copy keeps readable code:', r.stderr[:300])
    else:
        print('note: terser not found (cd tools/tailwind && npm install) - the live copy keeps readable code')
    return page[:big.start(2)] + code + page[big.end(2):]

if __name__ == '__main__':
    order = json.loads(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[1] == '--order' else None
    page = build(order)
    if not order and '--cdn' not in sys.argv:
        page = inline_tailwind(page)
    if not order: page = head_tags(page)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(page)
    if not order:
        online = json.load(open(os.path.join(SRC, 'online.json'), encoding='utf-8')) if os.path.exists(os.path.join(SRC, 'online.json')) else {}
        write_site(page if '--readable' in sys.argv else protect(page), online)
    # the big script block, for a syntax check:  node --check dist/_check.js
    sc = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', page, re.S)
    with open(os.path.join(ROOT, 'dist', '_check.js'), 'w', encoding='utf-8') as f:
        f.write(max(sc, key=len))
    print('built', OUT, len(page), 'bytes')
