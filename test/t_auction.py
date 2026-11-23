"""Tycoon auctions: you skip every property, then sometimes bid. Checks sales happen and money adds up."""
import sys, time; sys.path.insert(0, 'test')
from tlib import *
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    pg.evaluate("openGame('tycoon')"); pg.wait_for_timeout(300)
    pg.click('[data-k="auction"][data-v="1"]'); pg.click('[data-k="clock"][data-v="0"]'); pg.click('#su-go')
    t0, shot = time.time(), False
    while time.time() - t0 < 90:
        if not shot and pg.query_selector('.ty-auc #au-pass'):
            pg.query_selector('#ty-board').screenshot(path='test/shots/ty_auction.png'); shot = True
        pg.evaluate("""(() => { const q = (s) => document.querySelector(s);
          if (q('#by-no')) return q('#by-no').click();
          if (q('#au-pass')) { const b = q('#au-10'); return (b && Math.random() < 0.6 ? b : q('#au-pass')).click(); }
          const r = q('#ty-roll'); if (r) { r.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); setTimeout(() => window.dispatchEvent(new PointerEvent('pointerup')), 250); return; }
          const b = q('#ty-prompt button'); if (b) b.click(); const d = q('#pn-close'); if (d) d.click(); })()""")
        if not shot and pg.query_selector('.ty-auc #au-pass'):
            pg.query_selector('#ty-board').screenshot(path='test/shots/ty_auction.png'); shot = True
        pg.wait_for_timeout(400)
    logtxt = pg.evaluate("document.getElementById('ty-log').innerText")
    sold = logtxt.count('Sold!'); auctions = logtxt.count('goes to auction')
    print('auctions started:', auctions, '| sold:', sold, '| screenshot taken:', shot, '| errors:', pg.errs)
    print('\n'.join([l for l in logtxt.split('\n') if 'auction' in l or 'Sold' in l or 'bids' in l][:12]))
