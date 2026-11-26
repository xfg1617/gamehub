"""Turns a recording (rec.py) into a finished 1080x1920 TikTok clip:
the chosen moment, enlarged 2x, a hook line at the top (GameHub's pixel style), the game's own sound (levelled), and a
2.5 s GameHub end card ("free, no download, gamehub.us.com, link in bio"). Overlays are drawn by the browser with the
site's own fonts, so they match the site.
"""
import os, sys, subprocess, tempfile, base64
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'test'))
from tlib import sync_playwright, EXE  # noqa

FPS = 30
LOGO = os.path.join(ROOT, 'logo', 'gamehub-logo-transparent.png')
FONTS = "<link href='https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Jersey+15&display=swap' rel='stylesheet'>"


def _logo_uri():
    return 'data:image/png;base64,' + base64.b64encode(open(LOGO, 'rb').read()).decode()


P = None   # the running Playwright (set by make_clip), so the overlays don't start a second one


def render_png(html, path, transparent=True):
    kw = {'args': ['--no-sandbox']}
    if EXE: kw['executable_path'] = EXE
    br = P.chromium.launch(**kw); pg = br.new_page(viewport={'width': 1080, 'height': 1920})
    pg.set_content(html); pg.wait_for_timeout(900)
    pg.screenshot(path=path, omit_background=transparent); br.close()


def hook_png(text, path, sub='gamehub.us.com'):
    """the hook line at the top: big white words on an ink panel with a hard shadow, and the site address under it"""
    html = f"""<html><head>{FONTS}<style>
      body {{ margin: 0; background: transparent; }}
      .wrap {{ position: absolute; top: 190px; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; gap: 18px; }}
      .hook {{ max-width: 920px; padding: 26px 38px 28px; background: #050E18; border: 8px solid #050E18; box-shadow: 0 14px 0 rgba(5,14,24,.55);
        outline: 6px solid #F5B041; outline-offset: -14px;
        font-family: Outfit, sans-serif; font-weight: 900; font-size: 64px; line-height: 1.08; color: #F7F4EC; text-align: center; letter-spacing: -.5px; }}
      .hook em {{ font-style: normal; color: #F5B041; }}
      .sub {{ font-family: 'Jersey 15', monospace; font-size: 46px; color: #050E18; background: #2DD4BF; padding: 2px 20px 4px; border: 5px solid #050E18; box-shadow: 0 7px 0 #050E18; }}
    </style></head><body><div class="wrap"><div class="hook">{text}</div>{f'<div class="sub">{sub}</div>' if sub else ''}</div></body></html>"""
    render_png(html, path)


def endcard_png(path, line='Game night with friends,<br>in <em>one link</em>.'):
    html = f"""<html><head>{FONTS}<style>
      body {{ margin: 0; width: 1080px; height: 1920px; background: #0B1B2B; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 56px;
        background-image: linear-gradient(#0F2338 2px, transparent 2px), linear-gradient(90deg, #0F2338 2px, transparent 2px); background-size: 60px 60px; }}
      img {{ width: 820px; image-rendering: pixelated; }}
      .line {{ font-family: Outfit, sans-serif; font-weight: 900; font-size: 84px; line-height: 1.05; color: #F7F4EC; text-align: center; }}
      .line em {{ font-style: normal; color: #F5B041; }}
      .chips {{ display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; max-width: 960px; }}
      .chips span {{ font-family: 'Jersey 15', monospace; font-size: 50px; color: #F7F4EC; background: #12304C; border: 5px solid #050E18; box-shadow: 0 8px 0 #050E18; padding: 4px 22px 8px; }}
      .url {{ font-family: Outfit, sans-serif; font-weight: 900; font-size: 92px; color: #050E18; background: #F5B041; border: 8px solid #050E18; box-shadow: 0 14px 0 #050E18; padding: 10px 44px 18px; }}
      .bio {{ font-family: 'Jersey 15', monospace; font-size: 56px; color: #2DD4BF; letter-spacing: 2px; }}
    </style></head><body>
      <img src="{_logo_uri()}"><div class="line">{line}</div>
      <div class="chips"><span>FREE</span><span>NO DOWNLOAD</span><span>25 GAMES</span><span>PHONE + COMPUTER</span></div>
      <div class="url">gamehub.us.com</div><div class="bio">▼ LINK IN BIO ▼</div></body></html>"""
    render_png(html, path, transparent=False)


def bg_png(path):
    """the backdrop behind a framed game: navy with the faint pixel grid"""
    html = f"""<html><head><style>body {{ margin: 0; width: 1080px; height: 1920px; background: #0B1B2B;
      background-image: linear-gradient(#0F2338 2px, transparent 2px), linear-gradient(90deg, #0F2338 2px, transparent 2px); background-size: 60px 60px; }}</style></head><body></body></html>"""
    render_png(html, path, transparent=False)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: raise RuntimeError(r.stderr[-2000:])


def make_clip(res, t0, t1, hook, out, hook_until=None, endcard=None, tmp=None, p=None, crop=None):
    global P
    P = p
    """res = Take.stop() result; t0..t1 = seconds of the recording to use; hook = HTML text for the top line"""
    tmp = tmp or tempfile.mkdtemp()
    frames = [f for f in res['frames']]
    # the frame showing at t0, then every frame up to t1 (a screencast only sends a frame when the screen changes)
    before = [f for f in frames if f[0] <= t0]; inside = [f for f in frames if t0 < f[0] < t1]
    seq = ([(t0, before[-1][1])] if before else []) + inside
    lst = os.path.join(tmp, 'frames.txt')
    with open(lst, 'w') as fh:
        for i, (t, fn) in enumerate(seq):
            nxt = seq[i + 1][0] if i + 1 < len(seq) else t1
            fh.write(f"file '{fn}'\nduration {max(0.001, nxt - t):.4f}\n")
        fh.write(f"file '{seq[-1][1]}'\n")
    hp = os.path.join(tmp, 'hook.png'); hook_png(hook, hp)
    dur = t1 - t0; hu = min(dur, hook_until if hook_until is not None else dur)
    body = os.path.join(tmp, 'body.mp4')
    if crop:
        # crop = (x, y, w, h) in the 540x960 page: that part is enlarged into the middle of the navy frame, under the hook
        x, y, w, h = [int(round(v)) for v in crop]
        x, y = max(0, x), max(0, y); w, h = min(w, 540 - x), min(h, 960 - y)   # stay inside the recorded screen
        w -= w % 2; h -= h % 2
        k = min(1080 / w, 1240 / h); sw, sh = int(w * k) // 2 * 2, int(h * k) // 2 * 2
        oy = 560 + (1240 - sh) // 2; ox = (1080 - sw) // 2
        bgp = os.path.join(tmp, 'bg.png'); bg_png(bgp)
        vf = (f"[0:v]fps={FPS},crop={w}:{h}:{x}:{y},scale={sw}:{sh}:flags=lanczos,setsar=1,pad={sw + 16}:{sh + 16}:8:8:color=0x050E18[g];"
              f"[3:v][g]overlay={ox - 8}:{oy - 8}[v];[v][2:v]overlay=0:0:enable='lte(t,{hu:.2f})'[vo];")
        extra = ['-loop', '1', '-i', bgp]
    else:
        vf = f"[0:v]fps={FPS},scale=1080:1920:flags=lanczos,setsar=1[v];[v][2:v]overlay=0:0:enable='lte(t,{hu:.2f})'[vo];"
        extra = []
    run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-ss', f'{t0:.3f}', '-t', f'{dur:.3f}', '-i', res['audio'], '-loop', '1', '-i', hp, *extra,
         '-filter_complex',
         vf + f"[1:a]aresample=48000,loudnorm=I=-14:TP=-1.5:LRA=11,apad[ao]",
         '-map', '[vo]', '-map', '[ao]', '-t', f'{dur:.3f}', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', body])
    ep = endcard or os.path.join(tmp, 'end.png')
    if not endcard: endcard_png(ep)
    end = os.path.join(tmp, 'end.mp4')
    run(['ffmpeg', '-y', '-loop', '1', '-t', '2.6', '-i', ep, '-f', 'lavfi', '-t', '2.6', '-i', 'anullsrc=r=48000:cl=stereo',
         '-vf', f'fps={FPS},format=yuv420p,fade=in:st=0:d=0.25', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-c:a', 'aac', '-b:a', '192k', '-shortest', end])
    run(['ffmpeg', '-y', '-i', body, '-i', end, '-filter_complex', '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]', '-map', '[v]', '-map', '[a]',
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out])
    return out


def join_ranges(res, ranges, tmp):
    """several moments of one recording, back to back: returns a new recording-like result whose time runs 0..total"""
    frames, parts, off = [], [], 0.0
    for i, (a, b) in enumerate(ranges):
        before = [f for f in res['frames'] if f[0] <= a]; inside = [f for f in res['frames'] if a < f[0] < b]
        frames += ([(off, before[-1][1])] if before else []) + [(off + t - a, fn) for t, fn in inside]
        pa = os.path.join(tmp, f'part{i}.wav')
        run(['ffmpeg', '-y', '-ss', f'{a:.3f}', '-t', f'{b - a:.3f}', '-i', res['audio'], '-ar', '48000', '-ac', '2', '-af', 'apad', '-t', f'{b - a:.3f}', pa])
        parts.append(pa); off += b - a
    lst = os.path.join(tmp, 'parts.txt'); open(lst, 'w').write(''.join(f"file '{x}'\n" for x in parts))
    aud = os.path.join(tmp, 'joined.wav'); run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', lst, aud])
    return {'frames': frames, 'audio': aud, 'marks': {}, 'errs': res.get('errs', [])}, off
