"""TikTok clips from the real games (Nov 2026, Inna). Each scene plays a game in a phone-sized window with computer
players, marks the moment worth showing, and cut.make_clip turns it into a finished 1080x1920 clip with sound.

    python3 build.py && python3 tools/tiktok/make.py            # all scenes
    python3 tools/tiktok/make.py bowling pool                   # some
    python3 tools/tiktok/make.py --recut fibber              # cut again from the saved recording (new hook / timing)
Clips go to prototypes/tiktok/, with captions.txt (caption + hashtags to paste when posting).
"""
import os, sys, json, time, shutil, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rec import Take, sync_playwright, ROOT
from cut import make_clip, join_ranges

OUT = os.path.join(ROOT, 'prototypes', 'tiktok')
WORK = os.path.join(tempfile.gettempdir(), 'gh_tiktok'); os.makedirs(WORK, exist_ok=True); os.makedirs(OUT, exist_ok=True)
SCENES = {}


def scene(name, hook, caption):
    def deco(fn): SCENES[name] = (fn, hook, caption); return fn
    return deco


def box(t, sel):
    b = t.page.query_selector(sel).bounding_box(); return (b['x'], b['y'], b['width'], b['height'])


def open_game(t, gid, picks=None):
    pg = t.page
    if picks: pg.evaluate(f"setupSave('{gid}', {json.dumps(picks)})")
    pg.evaluate(f"openGame('{gid}')"); pg.wait_for_timeout(500)
    if pg.query_selector('[data-mode="solo"]'): pg.click('[data-mode="solo"]'); pg.wait_for_timeout(300)
    if pg.query_selector('#su-go'): pg.click('#su-go')
    pg.wait_for_timeout(1500)


AUTOPLAY = """
(() => { const real = npLocal; npLocal = function (seats, sel) { seats = seats.map((x, i) => i === 0 ? Object.assign({}, x, { bot: true }) : x); return real(seats, sel); }; })()
"""


def watch(t, rules):
    """mark the first time each new game-log line matching a rule appears (lines are remembered, so a redrawn log
    doesn't mark again). rules = [(name, regex), ...]; marks are stored as name, name#2, name#3..."""
    t.page.evaluate("""(rules) => { const seen = new Set(), cnt = {};
      const look = (tx) => { tx = (tx || '').trim(); if (!tx || seen.has(tx)) return; seen.add(tx);
        for (const [n, re] of rules) if (new RegExp(re, 'i').test(tx)) { cnt[n] = (cnt[n] || 0) + 1; window.__mark(cnt[n] > 1 ? n + '#' + cnt[n] : n); } };
      new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((nd) => {
        if (nd.nodeType === 3) look(nd.textContent); else if (nd.querySelectorAll) { look(nd.textContent); nd.querySelectorAll('div,p,li').forEach((e) => look(e.textContent)); } })))
        .observe(document.body, { childList: true, subtree: true }); }""", rules)


def first(r, name):
    ks = [k for k in r['marks'] if k == name or k.startswith(name + '#')]
    return min((r['marks'][k] for k in ks), default=None)


def wait_mark(t, name, secs):
    t0 = time.time()
    while time.time() - t0 < secs:
        if t.page.evaluate(f"window.__marks.some(m => m[0] === {name!r} || m[0].startsWith({name!r} + '#'))"): return True
        t.wait(400)
    return False


# ------------------------------------------------------------------------------------------------ bowling: a strike
@scene('bowling', 'When the ball <em>finally</em><br>hits the pocket 🎳',
       'that pin cam though 🎳 free bowling in your browser, no download #bowling #strike #gamenight #browsergames #gameswithfriends')
def bowling(p):
    t = Take(p, 'bowling', WORK); pg = t.page
    open_game(t, 'bowling'); t.start(); t.wait(600)
    E = "GAME_MODS.bowling.engine"
    for k in range(8):
        pg.wait_for_function(f"(() => {{ const G = {E}.state(); return G && G.phase === 'idle' && G.players[G.cur].human; }})()", timeout=40000)
        t.wait(900); s0 = pg.evaluate(f"{E}.state().strikes"); t.mark(f'throw{k}')
        pg.evaluate(f"(() => {{ const E = {E}, G = E.state(); const q = E.botPlan([0,1,2,3,4,5,6,7,8,9], 2); G.aimX = q.x0; E.throwBall(q.x0, q.ang, q.speed, q.spin); }})()")
        t.wait(4200)
        if pg.evaluate(f"{E}.state().strikes") > s0: t.mark('strike'); t.wait(3000); c = box(t, '#bw-cv'); r = t.stop(); r['k'] = k; r['crop'] = c; return r
        t.wait(2500)
    return t.stop()


def cut_bowling(r):
    th = r['marks'][f"throw{r['k']}"]
    x, y, w, h = r['crop']; r['crop'] = (x + w * 0.19, y, w * 0.62, h)   # the lane, not the lanes beside it
    return th - 0.9, r['marks']['strike'] + 1.7


# ------------------------------------------------------------------------------------------------ pool: the break
@scene('pool', 'Real pool sounds hit <em>different</em> 🎱',
       'the break 🔊🎱 free pool in your browser, play your friends with one link #pool #8ballpool #billiards #gamenight #browsergames')
def pool(p):
    t = Take(p, 'pool', WORK); pg = t.page
    open_game(t, 'pool'); E = 'GAME_MODS.pool.engine'
    pg.evaluate(f"(() => {{ const G = {E}.G; G.turn = G.me; }})()"); t.start(); t.wait(1200)
    pg.wait_for_function(f"{E}.G && {E}.G.phase === 'aim'", timeout=20000)
    t.mark('shot')
    pg.evaluate(f"""(() => {{ const E = {E}, G = E.G, c = G.balls[0];
      const apex = G.balls.filter(b => b.n > 0 && b.on).sort((a, b) => a.x - b.x)[0];
      E.fire(Math.atan2(apex.y - c.y, apex.x - c.x) + 0.004, 1); }})()""")
    t.wait(6500); c = box(t, '#pl-cv'); r = t.stop(); r['crop'] = c; return r


def cut_pool(r):
    return r['marks']['shot'] - 0.8, r['marks']['shot'] + 5.5


# ------------------------------------------------------------------------------------------------ bullshit: a lie caught
@scene('fibber', 'POV: your friend swears<br>they\'re <em>telling the truth</em> 🤨',
       'they were NOT 4 aces 😭 the bluffing card game, free in your browser #cardgames #bluff #gamenight #gameswithfriends #fyp')
def fibber(p):
    t = Take(p, 'fibber', WORK); pg = t.page; pg.evaluate(AUTOPLAY)
    open_game(t, 'fibber', {'n': 4, 'secs': 5, 'turn': 0})
    t.start(); watch(t, [('put', r'puts down'), ('shout', r'shouts'), ('lie', r'It was a lie'), ('truth', r'It was true')])
    wait_mark(t, 'lie', 150); t.wait(3500); c = box(t, '#gs-body'); r = t.stop(); r['crop'] = c; return r


def cut_fibber(r):
    lie = first(r, 'lie'); puts = [v for k, v in r['marks'].items() if k.startswith('put') and v < lie]
    t0 = (max(puts) if puts else lie - 5) - 1.2
    return max(t0, lie - 8), lie + 3.2


# ------------------------------------------------------------------------------------------------ kaboom cats: someone gets burned
@scene('kittens', 'When the hot potato<br>finds <em>you</em> 💀',
       'it was always going to be me 💀🔥 free party card game, no download #cardgame #gamenight #gameswithfriends #partygames #fyp')
def kittens(p):
    t = Take(p, 'kittens', WORK); pg = t.page; pg.evaluate(AUTOPLAY)
    open_game(t, 'kittens', {'n': 4, 'clock': 0, 'nope': 1})
    t.start(); watch(t, [('potato', r'draws the .*HOT POTATO'), ('out', r'got burned'), ('mitt', r'OVEN MITT')])
    wait_mark(t, 'out', 200); t.wait(3500); c = box(t, '#gs-body'); r = t.stop(); r['crop'] = c; return r


def cut_kittens(r):
    out = first(r, 'out'); pots = [v for k, v in r['marks'].items() if k.startswith('potato') and v < out]
    t0 = (max(pots) if pots else out - 4) - 3.0
    return max(t0, out - 8), out + 3.2


# ------------------------------------------------------------------------------------------------ uno: +4 on the last card
@scene('colorclash', 'That <em>+4</em> was<br>personal 😭',
       'friendship over 😭 free card games with friends, one link #cardgames #gamenight #gameswithfriends #fyp #browsergames')
def colorclash(p):
    t = Take(p, 'colorclash', WORK); pg = t.page; pg.evaluate(AUTOPLAY)
    open_game(t, 'colorclash', {'n': 4, 'clock': 0})
    t.start(); watch(t, [('w4', r'Wild \+4'), ('d2', r'plays .*\+2')])
    wait_mark(t, 'w4', 200); t.wait(3500); c = box(t, '#gs-body'); r = t.stop(); r['crop'] = c; return r


def cut_colorclash(r):
    w4 = first(r, 'w4'); return w4 - 4.5, w4 + 3.5


# ------------------------------------------------------------------------------------------------ poker: all in
@scene('poker', 'Poker night with friends,<br><em>no real money</em> 😎',
       'just bragging rights 😎 free poker with friends, no real money #poker #texasholdem #gamenight #fyp')
def poker(p):
    t = Take(p, 'poker', WORK); pg = t.page; pg.evaluate(AUTOPLAY)
    open_game(t, 'poker', {'clock': 0})
    t.start(); watch(t, [('show', r'wins .* with ')])
    wait_mark(t, 'show', 240); t.wait(5000); c = box(t, '#gs-body'); r = t.stop(); r['crop'] = c; return r


def cut_poker(r):
    w = first(r, 'show'); return w - 7.5, w + 4.5


# ------------------------------------------------------------------------------------------------ landlord: paying rent
@scene('tycoon', 'Paying rent to your<br><em>best friend</em> hits different 😭',
       'it\'s just business 😈 free board game with friends, one link, no download #boardgames #gamenight #gameswithfriends #fyp')
def tycoon(p):
    t = Take(p, 'tycoon', WORK, setup='window.__tycoonSim = true;'); pg = t.page
    open_game(t, 'tycoon', {'clock': 0, 'len': 'quick'})
    t.start(); watch(t, [('rent', r'pays .* rent to')])
    t0 = time.time()
    while time.time() - t0 < 240 and not wait_mark(t, 'rent#2', 5): pass
    t.wait(3500); c = box(t, '#gs-body'); r = t.stop(); r['crop'] = c; return r


def cut_tycoon(r):
    ks = sorted(v for k, v in r['marks'].items() if k.startswith('rent'))
    big = ks[1] if len(ks) > 1 else ks[0]
    return big - 6.0, big + 3.0


# ------------------------------------------------------------------------------------------------ the tour: 25 games, one link
TOUR = [('poker', {'clock': 0}), ('pool', None), ('kittens', {'n': 4, 'clock': 0}), ('chess', None), ('isles', None), ('tycoon', {'clock': 0})]


@scene('tour', '25 free games.<br>One link. <em>No download.</em> 👇',
       'game night sorted 🎮 25 free games you can play with friends in your browser, no download, no sign up #gamenight #gameswithfriends #browsergames #discordgames #fyp')
def tour(p):
    t = Take(p, 'tour', WORK); pg = t.page
    pg.evaluate(AUTOPLAY)
    t.start(); t.wait(300); t.mark('home')
    pg.evaluate("document.getElementById('shelves').scrollIntoView({behavior: 'smooth'})"); t.wait(2600); t.mark('home_end')
    for gid, picks in TOUR:
        pg.evaluate("GT.started = false; navigateTo('play', true)"); t.wait(200)
        if picks: pg.evaluate(f"setupSave('{gid}', {json.dumps(picks)})")
        pg.evaluate(f"openGame('{gid}')"); t.wait(400)
        if pg.query_selector('[data-mode="solo"]'): pg.click('[data-mode="solo"]'); t.wait(200)
        if pg.query_selector('#su-go'): pg.click('#su-go')
        t.wait(400); pg.evaluate('window.scrollTo(0, 0)'); t.wait(1800); t.mark('g_' + gid); t.wait(1700); t.mark('e_' + gid)
    return t.stop()


def cut_tour(r):
    m = r['marks']; rs = [(m['home'] + 0.2, m['home_end'])] + [(m['g_' + g] - 0.2, m['e_' + g]) for g, _ in TOUR]
    r['ranges'] = rs; r['crop'] = (0, 0, 540, 960); return None, None


CUTS = {'tour': cut_tour, 'bowling': cut_bowling, 'pool': cut_pool, 'fibber': cut_fibber, 'kittens': cut_kittens, 'colorclash': cut_colorclash,
        'poker': cut_poker, 'tycoon': cut_tycoon}


if __name__ == '__main__':
    RECUT = '--recut' in sys.argv
    names = [a for a in sys.argv[1:] if not a.startswith('--')] or list(SCENES)
    caps = []
    with sync_playwright() as p:
        for n in names:
            fn, hook, cap = SCENES[n]
            saved = os.path.join(WORK, n + '.json')
            if RECUT and os.path.exists(saved): r = json.load(open(saved))
            else: r = fn(p); json.dump(r, open(saved, 'w'))
            if r.get('errs'): print('   page errors:', r['errs'][:2])
            t0, t1 = CUTS[n](r)
            out = os.path.join(OUT, f'{n}.mp4'); os.makedirs(os.path.join(WORK, n), exist_ok=True)
            if r.get('ranges'): crop = r.get('crop'); r, total = join_ranges(r, r['ranges'], os.path.join(WORK, n)); r['crop'] = crop; t0, t1 = 0.0, total
            os.makedirs(os.path.join(WORK, n), exist_ok=True); make_clip(r, t0, t1, hook, out, tmp=os.path.join(WORK, n), p=p, crop=r.get('crop'))
            print('made', out, f'{t1 - t0 + 2.6:.1f}s')
            caps.append(f'{n}.mp4\n{cap}\n')
    # captions for every finished clip, ready to paste when posting
    with open(os.path.join(OUT, 'captions.txt'), 'w') as fh:
        fh.write('Captions to paste when posting each clip (add a sound from TikTok\'s own library in the app).\n\n')
        for n, (fn, hook, cap) in SCENES.items():
            if os.path.exists(os.path.join(OUT, n + '.mp4')): fh.write(f'{n}.mp4\n{cap}\n\n')
