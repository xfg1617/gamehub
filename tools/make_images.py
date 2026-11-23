"""Makes the pictures the live site needs, from the built page's own art (run after build.py, when a game is added
or its icon changes; the results are kept in assets/site/ and copied into every build):
  og/<game>.png       1200x630 link-preview banner per game ("PLAY  Chess"), used when a room link is shared
  og/gamehub.png      1200x630 banner with the GameHub logo, used when the site itself is shared
  favicon.png         64x64 tab icon,  apple-touch-icon.png 180x180 (phone home screen)
  games.json          {id: name} for the link-preview function
Usage:  python3 tools/make_images.py"""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'test'))
from tlib import launch, open_page, FILE
from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'site')
os.makedirs(os.path.join(OUT, 'og'), exist_ok=True)

CLEAN = """html, body { background: #0B1A2B !important; background-image: none !important; margin: 0 !important; }
  html::before, html::after, body::before, body::after { display: none !important; content: none !important; }
  .og { position: relative; width: 1200px; height: 630px; overflow: hidden; background: #0B1A2B;
    background-image: linear-gradient(rgba(255,255,255,.035) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.035) 2px, transparent 2px);
    background-size: 40px 40px; font-family: 'Outfit', sans-serif; }
  .og .frame { position: absolute; inset: 28px; border: 6px solid #050E18; box-shadow: inset 0 0 0 4px #1F3B5C; }
  .og .tile { position: absolute; left: 92px; top: 135px; width: 360px; height: 360px; display: grid; place-items: center;
    background: #122A40; border: 8px solid #050E18; box-shadow: 0 14px 0 #050E18, inset 0 0 0 6px var(--c); }
  .og .tile svg { width: 260px; height: 260px; }
  .og .txt { position: absolute; left: 520px; right: 70px; top: 150px; }
  .og .play { font-family: 'Arcade Pixel', sans-serif; font-size: 44px; letter-spacing: .14em; color: #2DD4BF; }
  .og .name { font-weight: 900; font-size: 96px; line-height: 1.02; color: #F7F4EC; text-shadow: 0 7px 0 #1F3B5C; margin-top: 10px; }
  .og .sub { margin-top: 26px; font-size: 32px; font-weight: 700; color: #9DB4CC; }
  .og .brand { position: absolute; right: 70px; bottom: 62px; display: flex; align-items: center; gap: 14px; }
  .og .brand svg { width: 64px; height: 64px; }
  .og .brand span { font-weight: 900; font-size: 46px; color: #F7F4EC; text-shadow: 0 4px 0 #1F3B5C; }
  .og .brand b { color: #F5B041; }
  .og.home .big { position: absolute; left: 0; right: 0; top: 170px; display: flex; justify-content: center; align-items: center; gap: 40px; }
  .og.home .big svg { width: 200px; height: 200px; }
  .og.home .big span { font-weight: 900; font-size: 150px; color: #F7F4EC; text-shadow: 0 10px 0 #1F3B5C; }
  .og.home .big b { color: #F5B041; }
  .og.home .tag { position: absolute; left: 0; right: 0; top: 430px; text-align: center; font-size: 40px; font-weight: 700; color: #9DB4CC; }
  .og.home .strip { position: absolute; left: 0; right: 0; bottom: 70px; display: flex; justify-content: center; gap: 22px; }
  .og.home .strip i { width: 74px; height: 74px; display: grid; place-items: center; background: #122A40; border: 5px solid #050E18; box-shadow: 0 6px 0 #050E18; }
  .og.home .strip svg { width: 54px; height: 54px; }
  .icon { width: 64px; height: 64px; display: grid; place-items: center; background: #0B1A2B; }
  .icon svg { width: 50px; height: 50px; }"""

with sync_playwright() as p:
    br = launch(p)
    pg = open_page(br, 1200, 630)
    pg.wait_for_timeout(1200)
    info = pg.evaluate("""() => {
      const logo = (() => { const s = document.querySelector('.side-logo svg').cloneNode(true); s.removeAttribute('class'); return s.outerHTML; })();
      const games = CATALOG.filter((c) => c.live).map((c) => ({ id: c.id, name: c.name, icon: c.icon, color: (c.mod && c.mod.color) || '#2DD4BF', sub: c.sub || '' }));
      return { logo, games, icons: Object.fromEntries(games.map((g) => [g.id, GICONS[g.icon] || ''])) };
    }""")
    pg.evaluate("css => { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }", CLEAN)
    names = {}
    def shot(html, path, w, h, scale=1):
        q = br.new_page(viewport={'width': w, 'height': h}, device_scale_factor=scale)
        q.goto('file://' + FILE); q.wait_for_timeout(900)
        q.evaluate("([css, html]) => { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); document.body.innerHTML = html; }", [CLEAN, html])
        q.evaluate("document.fonts.ready"); q.wait_for_timeout(300)
        q.query_selector('#shot').screenshot(path=path); q.close()
    brand = f'<div class="brand">{info["logo"]}<span>Game<b>Hub</b></span></div>'
    for g in info['games']:
        names[g['id']] = g['name']
        size = 86 if len(g['name']) <= 12 else 72
        html = f'''<div id="shot" class="og"><div class="frame"></div><div class="tile" style="--c:{g['color']}">{info['icons'][g['id']]}</div>
          <div class="txt"><div class="play">PLAY</div><div class="name" style="font-size:{size}px">{g['name']}</div><div class="sub">with friends on GameHub</div></div>{brand}</div>'''
        shot(html, os.path.join(OUT, 'og', f"{g['id']}.png"), 1200, 630)
    strip = ''.join(f'<i>{info["icons"][g["id"]]}</i>' for g in info['games'][:11])
    home = f'''<div id="shot" class="og home"><div class="frame"></div><div class="big">{info["logo"]}<span>Game<b>Hub</b></span></div>
      <div class="tag">Play games with your friends. No download.</div><div class="strip">{strip}</div></div>'''
    shot(home, os.path.join(OUT, 'og', 'gamehub.png'), 1200, 630)
    ico = f'<div id="shot" class="icon">{info["logo"]}</div>'
    shot(ico, os.path.join(OUT, 'favicon.png'), 64, 64, 1)
    shot(ico, os.path.join(OUT, 'apple-touch-icon.png'), 64, 64, 2.8125)
    names['navalnet'] = names.get('naval', 'Naval Grid')
    json.dump(names, open(os.path.join(OUT, 'games.json'), 'w'), indent=1)
    print('made', len(info['games']), 'game banners +', 'og/gamehub.png, favicon.png, apple-touch-icon.png, games.json')
