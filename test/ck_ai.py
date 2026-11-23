"""After your checkers move, does the computer's piece actually slide? Samples running animations."""
import sys; sys.path.insert(0, 'test')
from tlib import *
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    pg.evaluate("openGame('checkers')"); pg.wait_for_timeout(300); pg.click('#su-go'); pg.wait_for_timeout(400)
    pg.evaluate("""window.__log = []; const tick = () => { const a = document.getAnimations().filter(x => x.effect && x.effect.target && x.effect.target.classList && x.effect.target.classList.contains('disc'));
      a.forEach(x => { const t = x.effect.target; window.__log.push([performance.now()|0, t.className.includes('coral') ? 'ai' : 'me', x.playState]); }); requestAnimationFrame(tick); }; tick();""")
    for mv in [(40, 33), (42, 35), (44, 37)]:
        pg.click(f'#ck-board [data-i="{mv[0]}"]'); pg.wait_for_timeout(150); pg.click(f'#ck-board [data-i="{mv[1]}"]')
        pg.wait_for_timeout(3500)
    log = pg.evaluate("window.__log")
    me = [l for l in log if l[1] == 'me']; ai = [l for l in log if l[1] == 'ai']
    print('frames with my piece moving:', len(me), '| frames with computer piece moving:', len(ai), pg.errs)
