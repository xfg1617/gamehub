"""Real gameplay clips for the how-to videos (Nov 2026, Inna: "more gameplay, real video game play for better
illustrations"). For each game the computers play a real game in a 1280x720 window while it is recorded (Chrome
screencast, tools/tiktok/rec.py); each line of the game's script (src/games/zz_howto_scripts.js) gets its own ~5 s slice
of that game, in order, and the part the line talks about is measured in the middle of its slice so the yellow outline
can sit on it. A slice is skipped (the line keeps its still picture) if the outlined part isn't on screen then or if
almost nothing moves.

Writes assets/site/howto/<id>/c<line>.mp4 (silent, H.264) + assets/site/howto/clips.json {id: {line: {src, box, w, h}}}.
    python3 build.py && python3 tools/make_howto_clips.py            # every game that can play itself
    python3 tools/make_howto_clips.py chess pool                       # some
"""
import os, sys, json, time, shutil, subprocess
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tiktok'))
from rec import Take, sync_playwright, ROOT

OUT = os.path.join(ROOT, 'assets', 'site', 'howto')
WORK = os.path.join('/tmp', 'gh_howto_clips'); os.makedirs(WORK, exist_ok=True)
HIDE = "#chat-fab,#em-fab,#gm-note,#tt-host,.gm-loading,#np-rj,.fx-burst,#toast-container{display:none!important}"
AUTOPLAY = "(() => { const real = npLocal; npLocal = function (seats, sel) { seats = seats.map((x, i) => i === 0 ? Object.assign({}, x, { bot: true }) : x); return real(seats, sel); }; })()"
# the games whose every seat a computer can take (they run on npLocal); bowling is thrown by the script
GAMES = ['colorclash', 'kittens', 'fibber', 'poker', 'dominoes', 'chess', 'checkers', 'tictactoe', 'c4', 'hedge', 'pool',
         'bowling', 'tycoon', 'isles', 'manor', 'tunnel', 'guild', 'impostor', 'wordduel']
PICKS = {'colorclash': {'clock': 0}, 'kittens': {'clock': 0}, 'fibber': {'turn': 0}, 'poker': {'clock': 0}, 'tycoon': {'clock': 0},
         'isles': {'turn': 0}, 'manor': {'turn': 0}, 'tunnel': {'turn': 0}, 'guild': {'turn': 0}, 'hedge': {'turn': 0},
         'dominoes': {'turn': 0}, 'tictactoe': {'turn': 0}}
SLICE, LEAD = 5.0, 2.5     # seconds per line; time before the first slice (the deal / first moves)
MEAS = """(sel) => { const e = sel && document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect();
  if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight) return null;
  return [Math.max(0, r.left), Math.max(0, r.top), Math.min(innerWidth, r.right) - Math.max(0, r.left), Math.min(innerHeight, r.bottom) - Math.max(0, r.top)].map(Math.round); }"""


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: raise RuntimeError(r.stderr[-1500:])


def encode(frames, a, b, out):
    """the frames between a and b (seconds) -> a silent 1280x720 H.264 clip"""
    before = [f for f in frames if f[0] <= a]; inside = [f for f in frames if a < f[0] < b]
    seq = ([(a, before[-1][1])] if before else []) + inside
    if len(seq) < 2: return False
    lst = out + '.txt'
    with open(lst, 'w') as fh:
        for i, (t, fn) in enumerate(seq):
            nxt = seq[i + 1][0] if i + 1 < len(seq) else b
            fh.write(f"file '{fn}'\nduration {max(0.001, nxt - t):.4f}\n")
        fh.write(f"file '{seq[-1][1]}'\n")
    run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-t', f'{b - a:.3f}', '-vf', 'fps=30,scale=1280:720,format=yuv420p',
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-tune', 'animation', '-an', '-movflags', '+faststart', out])
    os.remove(lst); return True


def start(j):
    """where line j's slice starts, in seconds from the start of the recording"""
    return LEAD + SLICE * (j - 1)


def record(p, gid, lines):
    t = Take(p, gid, WORK, size=(1280, 720), mobile=False, audio=False, quality=85, nth=2)
    pg = t.page
    pg.add_style_tag(content=HIDE); pg.evaluate(AUTOPLAY)
    if gid in PICKS: pg.evaluate(f"setupSave('{gid}', {json.dumps(PICKS[gid])})")
    pg.evaluate(f"navigateTo('play', true); openGame('{gid}')"); pg.wait_for_timeout(500)
    if pg.query_selector('#su-go'): pg.click('#su-go')
    # turn-by-turn games only wake the computer after the other side has moved: with computers on both seats,
    # give the table one harmless nudge so the first move gets made
    pg.wait_for_timeout(600)
    if gid in ('chess', 'checkers', 'tictactoe', 'c4', 'hedge', 'wordduel'): pg.evaluate("try { NP.S.act({ t: 'nudge' }); } catch (e) {}")
    t.start()
    n = len(lines); total = LEAD + SLICE * (n - 1) + 0.5; t0 = time.time(); boxes = {}; E = "GAME_MODS.bowling.engine"
    while time.time() - t0 < total:
        el = time.time() - t0
        for j in range(1, n):    # line j (the first is the title card) plays slice j-1; its part is measured mid-slice
            mid = start(j) + SLICE / 2
            if j not in boxes and el >= mid: boxes[j] = pg.evaluate(MEAS, lines[j][1]) if lines[j][1] else 'none'
        if gid == 'bowling':  # throw like the Pro computer whenever it is our turn
            pg.evaluate(f"""(() => {{ const E = {E}, G = E.state(); if (!G || G.phase !== 'idle' || !G.players[G.cur].human || G.__t && Date.now() - G.__t < 1500) return;
              G.__t = Date.now(); const st = G.pins.map((q, i) => q.up ? i : -1).filter(i => i >= 0); const q = E.botPlan(st.length ? st : [0,1,2,3,4,5,6,7,8,9], 2);
              G.aimX = q.x0; E.throwBall(q.x0, q.ang, q.speed, q.spin); }})()""")
        t.wait(150)
    r = t.stop(); r['boxes'] = boxes; return r


if __name__ == '__main__':
    names = sys.argv[1:] or GAMES
    S = None
    idx_path = os.path.join(OUT, 'clips.json')
    index = json.load(open(idx_path)) if os.path.exists(idx_path) else {}
    with sync_playwright() as p:
        for gid in names:
            if S is None:   # the scripts, read from the built page
                t = Take(p, 'scripts', WORK, size=(1280, 720), mobile=False, audio=False); S = t.page.evaluate('window.HOWTO_SCRIPT'); t.ctx.close(); t.br.close()
            sc = S.get(gid)
            if not sc: print(gid, 'no script'); continue
            lines = sc['lines']
            r = record(p, gid, lines)
            if r['errs']: print('  page errors:', r['errs'][:2])
            frames = r['frames']; os.makedirs(os.path.join(OUT, gid), exist_ok=True)
            for f in [x for x in os.listdir(os.path.join(OUT, gid)) if x.startswith('c') and x.endswith('.mp4')]: os.remove(os.path.join(OUT, gid, f))
            got = {}
            for j, ln in enumerate(lines):
                if j == 0: continue                       # the first line stays the title card with the game's name
                a = start(j); b = a + SLICE
                bx = r['boxes'].get(j)
                if ln[1] and not bx: continue             # the part it talks about isn't on screen: keep the still
                moving = len([f for f in frames if a < f[0] < b])
                if moving < 6: continue                  # nothing happens: keep the still
                out = os.path.join(OUT, gid, f'c{j}.mp4')
                if encode(frames, a, b, out):
                    got[str(j)] = {'src': f'/howto/{gid}/c{j}.mp4', 'box': bx if isinstance(bx, list) else None, 'w': 1280, 'h': 720}
            index[gid] = got
            shutil.rmtree(os.path.join(WORK, '_f_' + gid), ignore_errors=True)
            print(gid, f'{len(got)}/{len(lines) - 1} lines got a clip', sum(os.path.getsize(os.path.join(OUT, gid, f'c{k}.mp4')) for k in got) // 1024, 'KB')
            json.dump(index, open(idx_path, 'w'))
