"""Case Files #002 at many screen sizes: every view is opened, sideways scrolling is measured, buttons that stick out
of the screen are listed, and a screenshot is saved to test/shots/cf2s_<w>_<view>.png. Prints no solutions."""
import sys; sys.path.insert(0, 'test')
from tlib import *
E = 'GAME_MODS.casefiles.engine'
SIZES = [(360, 740), (390, 844), (768, 1024), (1024, 768), (1280, 720), (1440, 900), (1920, 1080)]
bad = []
def opengame(pg):
    pg.evaluate("openGame('casefiles')"); pg.wait_for_timeout(400)
    if pg.query_selector('[data-mode="solo"]'): pg.click('[data-mode="solo"]')
    pg.evaluate("(() => { [...document.querySelectorAll('#gs-body button')].filter(x => /^\\s*Standard/.test(x.textContent)).forEach(x => x.click()); })()"); pg.wait_for_timeout(150)
    pg.evaluate("(() => { [...document.querySelectorAll('#gs-body button')].filter(x => /Night Gallery/.test(x.textContent)).forEach(x => x.click()); })()")
    pg.evaluate("(() => { const b = [...document.querySelectorAll('#gs-body button')].find(x => /^\\s*(start|play)/i.test(x.textContent)); b && b.click(); })()")
    pg.wait_for_timeout(700)
VIEWS = [
    ('brief', "G.tab='brief'"), ('scene', "G.view='A';G.tab='inv';G.room='gallery';G.tool='hand';G.item=0;G.itemMode=''"),
    ('dark', "G.view='A';G.tab='inv';G.room='dock';G.tool='light';G.item=null"), ('uv', "G.view='A';G.tab='inv';G.room='gallery';G.tool='uv';G.item=2;G.itemMode='uv'"),
    ('cams', "G.view='B';G.tab='inv';G.ctab='cams';G.cam.big=null;G.cam.m=100"), ('camsbig', "G.view='B';G.tab='inv';G.ctab='cams';G.cam.big='c1';G.cam.m=100"),
    ('photos', "G.view='B';G.tab='inv';G.ctab='photos';G.ph=10"), ('lab', "G.view='B';G.tab='inv';G.ctab='lab'"),
    ('files', "G.view='B';G.tab='inv';G.ctab='files';G.drawer=1;G.doc='b_camlog'"), ('board', "G.tab='board';G.btab='board'"),
    ('timeline', "G.tab='board';G.btab='tl'"), ('talk', "G.view='A';G.tab='sus';G.sus='iris';G.showing=true"), ('acc', "G.tab='acc'"),
]
with sync_playwright() as p:
    br = launch(p)
    for w, h in SIZES:
        pg = open_page(br, w, h); opengame(pg)
        # put a few things on the board, the bag and the timeline first
        pg.evaluate(f"""(() => {{ const e = {E}, G = e.G; e.act({{t:'bag', room:'gallery', i:0}}); e.act({{t:'bag', room:'kitchen', i:3}}); e.act({{t:'test', k:G.bag[0].k, test:'mag'}});
          ['cam:c3:150', 'ph:x:12', 'b_camlog', 'g_fake_mag', 'lab:' + G.bag[0].k + ':mag'].forEach((id, n) => e.act({{t:'pin', id, x: 16 + (n % 4) * 182, y: 18 + Math.floor(n / 4) * 130}}));
          e.act({{t:'tl', who:'felix', m:100, place:'hall'}}); e.act({{t:'tl', who:'iris', m:160, place:'staff'}}); e.act({{t:'ask', sus:'iris', i:0}}); }})()""")
        for name, js in VIEWS:
            pg.evaluate(f"(() => {{ const G = {E}.G; {js}; G.showing = G.showing || false; }})()"); pg.evaluate(f"{E}.act({{t:'cancel'}})"); pg.wait_for_timeout(120)
            sw = pg.evaluate("document.documentElement.scrollWidth")
            out = pg.evaluate("""(() => [...document.querySelectorAll('#gs-body button, #gs-body select, #gs-body input')].filter(b => { const r = b.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }).map(b => (b.textContent || b.id || b.tagName).trim().slice(0, 30)))()""")
            if sw > w + 1: bad.append(f'{w}x{h} {name}: page {sw}px wide')
            if out: bad.append(f'{w}x{h} {name}: off screen: {out[:4]}')
            pg.screenshot(path=f'test/shots/cf2s_{w}_{name}.png')
        if pg.errs: bad.append(f'{w}: errors {pg.errs[:2]}')
        pg.close()
    print('\n'.join(bad) if bad else 'ALL SIZES OK')
