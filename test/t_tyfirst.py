"""First-visit bug: the page's two-column layout style arrives a moment AFTER the board is drawn
(the real Tailwind CDN builds new styles on the fly). The board must still end up fitting its column."""
import sys; sys.path.insert(0, 'test')
from tlib import *
with sync_playwright() as p:
    br = launch(p)
    for w, h in [(1920, 950), (1280, 900)]:
        pg = open_page(br, w, h)
        pg.evaluate("openGame('tycoon')"); pg.wait_for_timeout(200)
        # take the two-column rule out, like a first visit where it does not exist yet
        held = pg.evaluate("""(() => { const out = [];
          for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { continue; }
            for (let i = rules.length - 1; i >= 0; i--) { const r = rules[i];
              const txt = r.cssText || ''; if (txt.includes('minmax(0px, 1fr) 300px') || txt.includes('minmax(0,1fr)_300px')) { out.push(txt); sh.deleteRule(i); } } }
          window.__held = out; return out.length; })()""")
        pg.click('#su-go'); pg.wait_for_timeout(300)
        before = pg.evaluate("(() => { const b = document.getElementById('ty-board').getBoundingClientRect(); return Math.round(b.width); })()")
        pg.evaluate("""(() => { const s = document.createElement('style'); s.textContent = window.__held.join('\\n'); document.head.appendChild(s); })()""")
        pg.wait_for_timeout(500)
        r = pg.evaluate("""(() => { const bd = document.getElementById('ty-board'), b = bd.getBoundingClientRect(), host = bd.parentElement.getBoundingClientRect();
          const side = document.getElementById('ty-players').getBoundingClientRect();
          return { board: Math.round(b.width), host: Math.round(host.width), fits: b.right <= host.right + 1, sideVisible: side.left >= b.right && side.right <= innerWidth + 1 }; })()""")
        pg.screenshot(path=f'test/shots/ty_first_{w}.png')
        print(w, 'rules held back:', held, '| board while layout missing:', before, 'px | after layout arrives:', r, pg.errs)
        pg.context.close()
