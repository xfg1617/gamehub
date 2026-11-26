"""Collect every narration line of the how-to videos (all guides, English + Vietnamese) from the built page.
Writes tools/voice_lines.json = [{lang, id, text, hash}]. The hash is FNV-1a over the UTF-16 text, the same as
hvHash() in src/games/zz_howto_video.js, so the page finds voice/<lang>/<hash>.mp3."""
import sys, json, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'test'))
from tlib import *
out = []
with sync_playwright() as p:
    br = launch(p); pg = open_page(br)
    for lang in ('en', 'vi'):
        pg.evaluate(f"setLang('{lang}')"); pg.wait_for_timeout(300)
        rows = pg.evaluate("Object.keys(HOWTO).flatMap((id) => { const d = howtoSlides(id); return d ? d.slides.filter((s) => s.say).map((s) => ({ id, text: s.say, hash: hvHash(s.say) })) : []; })")
        for r in rows: r['lang'] = lang
        out += rows
    br.close()
seen = set(); uniq = [r for r in out if not ((r['lang'], r['hash']) in seen or seen.add((r['lang'], r['hash'])))]
json.dump(uniq, open(os.path.join(os.path.dirname(__file__), 'voice_lines.json'), 'w'), ensure_ascii=False, indent=0)
print(len(uniq), 'lines,', sum(len(r['text']) for r in uniq), 'characters')
