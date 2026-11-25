"""Translation audit (Nov 2026): opens every page and game in Vietnamese, watches for a few seconds and lists every
visible line that is still English. Writes test/shots/vi_left.txt (line, count, where)."""
import sys, json, re; sys.path.insert(0, 'test')
from nplib import *
GAMES = sys.argv[1].split(',') if len(sys.argv) > 1 and sys.argv[1] else None
JS = r"""(() => {
  const SKIP = '.chat-msg, #dg-feed, .logbox, .cf-list, input, textarea, script, style, [data-no-tr], .em-bub, .em-say, svg';
  const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const names = new Set([...(window.NP && NP.S ? NP.S.seats.map(s => s && s.name) : []), (window.profile || {}).username].filter(Boolean));
  while (w.nextNode()) { const n = w.currentNode, e = n.parentElement; if (!e || e.closest(SKIP)) continue;
    const t = n.nodeValue.trim(); if (!t || !/[A-Za-z]{2}/.test(t)) continue;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden') continue;
    let hid = false, a = e; while (a) { if (getComputedStyle(a).display === 'none') { hid = true; break; } a = a.parentElement; } if (hid) continue;
    if (names.has(t)) continue;
    out.push(t); }
  return out; })()"""
VI_CHARS = re.compile(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', re.I)
KEEP_EN = {'GameHub', 'Discord', 'online', 'Elo', 'XP', 'OK', 'Google', 'Poker', 'Uno', 'Bullshit', 'Blackjack', 'GG', 'LOL', 'Lv', 'VI', 'EN', 'Pool', 'Domino', 'Tiếng Việt', 'English'}
found = {}
def grab(pg, where):
    for t in pg.evaluate(JS):
        if VI_CHARS.search(t) or t in KEEP_EN or re.fullmatch(r'[A-Z0-9]{4}', t) or re.fullmatch(r'Player\d+', t): continue
        if t.lower() in VIV: continue
        if re.fullmatch(r'[\d\s$:.,·/%+\-–×x()#!?*]+[A-Za-z]{0,3}', t): continue
        f = found.setdefault(t, [0, set()]); f[0] += 1; f[1].add(where)
VIV = set()
with sync_playwright() as p:
    pg, = players(p, 1)
    pg.set_viewport_size({'width': 1440, 'height': 900})
    pg.evaluate("setLang('vi')"); pg.wait_for_timeout(600)
    VIV.update(w.lower() for w in pg.evaluate("Object.values(VI_TABLE).join(' ').split(/[^A-Za-zÀ-ỹđĐ-]+/)") if w)
    VIV.update(v.lower() for v in pg.evaluate("Object.values(VI_TABLE)"))
    if not GAMES:
        for v in ['play', 'leaderboard', 'howto', 'friends', 'profile', 'daily']:
            try: pg.evaluate(f"navigateTo('{v}', true)"); pg.wait_for_timeout(900); grab(pg, 'page:' + v)
            except Exception as e: print('page', v, e)
        for fn, nm in [("openRoomModal()", 'room picker'), ("openRankedModal()", 'ranked picker'), ("openAuthModal('signup')", 'sign up'), ("openSoundPanel(document.getElementById('mu-btn'))", 'sound panel'), ("openTablePicker && 0", '')]:
            if not nm: continue
            try: pg.evaluate(fn); pg.wait_for_timeout(500); grab(pg, nm)
            except Exception as e: print(nm, str(e)[:80])
            pg.keyboard.press('Escape'); pg.evaluate("document.querySelectorAll('[id$=modal]').forEach(e => e.classList.add('hidden'))"); pg.wait_for_timeout(200)
    ids = GAMES or pg.evaluate("Object.keys(GAME_MODS).filter(k => !GAME_MODS[k].hidden && k !== 'doodle' && k !== 'wordconnect' || k === 'wordconnect')")
    for g in ids:
        try:
            pg.evaluate("navigateTo('play', true)"); pg.wait_for_timeout(300)
            pg.evaluate(f"openSetup('{g}')"); pg.wait_for_timeout(600); grab(pg, g + ' picker')
            pg.evaluate(f"openGuide('{g}')"); pg.wait_for_timeout(500); grab(pg, g + ' guide'); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
            pg.evaluate("document.querySelectorAll('.guide-pop, #guide-pop, [id^=guide]').forEach(e => e.remove())")
            mode = pg.query_selector('[data-mode="room"]')
            if mode: mode.click(); pg.wait_for_timeout(1500); grab(pg, g + ' room')
            if pg.query_selector('#np-start'):
                WANT[id(pg)] = None; start(pg); pg.wait_for_timeout(800)
            elif pg.query_selector('#su-go'): pg.click('#su-go', timeout=3000)
            for k in range(18): pg.wait_for_timeout(700); grab(pg, g + ' game')
            pg.evaluate("document.querySelectorAll('.tg-tag, .fi-pl, .ty-pl').length"); 
            pg.evaluate("if (typeof toggleMoves === 'function') toggleMoves()"); pg.wait_for_timeout(300); pg.evaluate("if (typeof toggleMoves === 'function') toggleMoves()")
            pg.evaluate("GT && (GT.started = false); closeActiveGame && closeActiveGame()"); pg.wait_for_timeout(300)
        except Exception as e: print('game', g, str(e)[:100])
rows = sorted(found.items(), key=lambda kv: (-len(kv[1][1]), kv[0]))
with open('test/shots/vi_left.txt', 'w') as f:
    for t, (n, w) in rows: f.write(f"{t}\t{n}\t{', '.join(sorted(w))[:120]}\n")
print(len(rows), 'English lines left')
