"""A real promo EDIT for TikTok (Nov 27 2026, Inna: "an actual edit of the website with an instant hook").
Not one screen recording: fast cuts of the best moments from the saved game recordings (/tmp/gh_tiktok/*.json, made by
make.py), each with a punch-in zoom, a white flash on the cut and a big pop label, cut on the beat of a drum loop built
here (our own sound, no licence needed), then a pan down today's home page (fresh screenshots) with the "no download,
one link" message, then the GameHub end card. The hook line is on screen from frame 0, over pins already flying.

    python3 build.py && python3 tools/tiktok/edit.py            # -> prototypes/tiktok/edit_promo.mp4
"""
import os, sys, json, wave, struct
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cut
from cut import render_png, endcard_png, bg_png, run, FONTS
from rec import sync_playwright
from make import WORK, OUT
sys.path.insert(0, os.path.join(cut.ROOT, 'test'))
from tlib import launch, open_page

FPS, BEAT = 30, 0.5                # 120 beats a minute; every cut lands on a beat
TMP = os.path.join(WORK, 'edit'); os.makedirs(TMP, exist_ok=True)
GAME_W, TOP = 1000, 420            # the game picture: 1000 px wide, under the hook area

def rec(name): return json.load(open(os.path.join(WORK, name + '.json')))

# name, recording, start (from a mark), beats, crop (x, y, w, h in the 540x960 page or None = the recording's), zoom, label
def segs():
    b, p, k, c, f, pk, t = rec('bowling'), rec('pool'), rec('kittens'), rec('colorclash'), rec('fibber'), rec('poker'), rec('tour')
    bc = b['crop']; bc = (bc[0] + bc[2] * 0.19, bc[1], bc[2] * 0.62, bc[3])
    return [
        ('strike', b, b['marks']['strike'] - 1.8, 3, bc, 0.22, 'STRIKE! 🎳'),
        ('break', p, p['marks']['shot'] + 0.18, 2, (p['crop'][0], p['crop'][1] + p['crop'][3] * 0.38, p['crop'][2], p['crop'][3] * 0.62), 0.18, 'THE BREAK 🔊'),
        ('burned', k, k['marks']['out'] - 0.7, 2, k['crop'], 0.16, 'BURNED 💀'),
        ('plus4', c, c['marks']['w4'] + 0.3, 2, c['crop'], 0.16, '+4 😭'),
        ('lie', f, f['marks']['lie'] - 1.6, 2, f['crop'], 0.16, 'CAUGHT LYING 🤥'),
        ('pair', pk, pk['marks']['show'] + 0.35, 2, pk['crop'], 0.14, 'SHOWDOWN 😎'),
        ('chess', t, t['marks']['g_chess'] + 0.3, 1, (0, 60, 540, 760), 0.12, None),
        ('isles', t, t['marks']['g_isles'] + 0.3, 1, (0, 60, 540, 760), 0.12, None),
        ('tycoon', t, t['marks']['g_tycoon'] + 0.3, 1, (0, 60, 540, 760), 0.12, '+ 19 MORE GAMES'),
    ]

def label_png(text, path):
    html = f"""<html><head>{FONTS}<style>body {{ margin: 0; background: transparent; }}
      .l {{ position: absolute; left: 0; right: 0; top: 1520px; display: flex; justify-content: center; }}
      .l span {{ font-family: Outfit, sans-serif; font-weight: 900; font-size: 104px; color: #050E18; background: #F5B041; padding: 6px 34px 14px;
        border: 9px solid #050E18; box-shadow: 0 16px 0 #050E18; transform: rotate(-4deg); letter-spacing: -1px; }}</style></head>
      <body><div class="l"><span>{text}</span></div></body></html>"""
    render_png(html, path)

def hook_png(path, text):
    html = f"""<html><head>{FONTS}<style>body {{ margin: 0; background: transparent; }}
      .h {{ position: absolute; top: 120px; left: 0; right: 0; display: flex; justify-content: center; }}
      .h div {{ max-width: 960px; padding: 24px 40px 30px; background: #050E18; outline: 7px solid #F5B041; outline-offset: -16px; box-shadow: 0 14px 0 rgba(5,14,24,.6);
        font-family: Outfit, sans-serif; font-weight: 900; font-size: 76px; line-height: 1.04; color: #F7F4EC; text-align: center; letter-spacing: -1px; }}
      .h em {{ font-style: normal; color: #F5B041; }}</style></head><body><div class="h"><div>{text}</div></div></body></html>"""
    render_png(html, path)

def frames_list(r, t0, t1, path):
    fr = r['frames']; before = [f for f in fr if f[0] <= t0]; inside = [f for f in fr if t0 < f[0] < t1]
    seq = ([(t0, before[-1][1])] if before else []) + inside
    with open(path, 'w') as fh:
        for i, (t, fn) in enumerate(seq):
            nxt = seq[i + 1][0] if i + 1 < len(seq) else t1
            fh.write(f"file '{fn}'\nduration {max(0.001, nxt - t):.4f}\n")
        fh.write(f"file '{seq[-1][1]}'\n")

def game_seg(i, name, r, t0, beats, crop, zoom, label, bgp):
    flash = 'fade=in:st=0:d=0.14:color=white,' if i else ''   # the opening frame must be crisp: no flash on the first cut
    d = beats * BEAT; lst = os.path.join(TMP, f'{i}.txt'); frames_list(r, t0, t0 + d, lst)
    x, y, w, h = [int(round(v)) for v in crop]; x, y = max(0, x), max(0, y); w, h = min(w, 540 - x) // 2 * 2, min(h, 960 - y) // 2 * 2
    sw = GAME_W; sh = int(h * sw / w) // 2 * 2; sh = min(sh, 1300)
    ins = ['-f', 'concat', '-safe', '0', '-i', lst, '-ss', f'{t0:.3f}', '-t', f'{d:.3f}', '-i', r['audio'], '-framerate', str(FPS), '-loop', '1', '-i', bgp]
    vf = (f"[0:v]fps={FPS},crop={w}:{h}:{x}:{y},scale={sw}:-2:flags=lanczos,crop={sw}:{sh},"
          f"scale=w='trunc({sw}*(1+{zoom}*t/{d})/2)*2':h=-2:eval=frame:flags=bicubic,crop={sw}:{sh},setsar=1,"
          f"pad={sw + 16}:{sh + 16}:8:8:color=0x050E18[g];[2:v][g]overlay={(1080 - sw) // 2 - 8}:{TOP + (1300 - sh) // 2 - 8}:shortest=1[v0]")
    if label:
        lp = os.path.join(TMP, f'l{i}.png'); label_png(label, lp); ins += ['-framerate', str(FPS), '-loop', '1', '-i', lp]
        vf += f";[v0][3:v]overlay=0:0:enable='gte(t,{0.1 if i else 0.5})'[v1]"; last = 'v1'
    else: last = 'v0'
    vf += f";[{last}]{flash}format=yuv420p[vo];[1:a]aresample=48000,volume=1.6,apad[ao]"
    out = os.path.join(TMP, f'seg{i:02d}.mp4')
    run(['ffmpeg', '-y', *ins, '-filter_complex', vf, '-map', '[vo]', '-map', '[ao]', '-t', f'{d:.3f}', '-r', str(FPS),
         '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-c:a', 'aac', '-ar', '48000', '-ac', '2', out])
    return out, d

def home_seg(i, tall, d, text, text2):
    """pan down a tall phone screenshot of today's home page, framed like the games; two big lines one after the other.
    Built frame by frame with Pillow (ffmpeg's looped-image timing froze the pan)."""
    from PIL import Image
    lp = os.path.join(TMP, f'l{i}.png'); label_png(text, lp); lp2 = os.path.join(TMP, f'l{i}b.png'); label_png(text2, lp2)
    bg = Image.open(os.path.join(TMP, 'bg.png')).convert('RGB'); L1 = Image.open(lp).convert('RGBA'); L2 = Image.open(lp2).convert('RGBA')
    im = Image.open(tall).convert('RGB'); im = im.resize((GAME_W, int(im.height * GAME_W / im.width)), Image.LANCZOS)
    H = 1300; span = max(0, im.height - H); fdir = os.path.join(TMP, f'h{i}'); os.makedirs(fdir, exist_ok=True)
    n = int(round(d * FPS)); x0 = (1080 - GAME_W) // 2
    for k in range(n):
        u = k / max(1, n - 1); e = u * u * (3 - 2 * u)            # ease in and out
        y = int(span * e); fr = bg.copy()
        fr.paste((5, 14, 24), (x0 - 8, TOP - 8, x0 + GAME_W + 8, TOP + H + 8)); fr.paste(im.crop((0, y, GAME_W, y + H)), (x0, TOP))
        fr = fr.convert('RGBA'); fr.alpha_composite(L1 if k < n / 2 else L2)
        if k < 4: fr = Image.blend(fr, Image.new('RGBA', fr.size, (255, 255, 255, 255)), 1 - k / 4)   # the white flash on the cut
        fr.convert('RGB').save(os.path.join(fdir, f'{k:04d}.jpg'), quality=92)
    out = os.path.join(TMP, f'seg{i:02d}.mp4')
    run(['ffmpeg', '-y', '-framerate', str(FPS), '-i', os.path.join(fdir, '%04d.jpg'), '-f', 'lavfi', '-t', f'{d:.3f}', '-i', 'anullsrc=r=48000:cl=stereo',
         '-map', '0:v', '-map', '1:a', '-t', f'{d:.3f}', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '48000', out])
    return out, d

def drums(path, secs, sr=48000):
    """a punchy 120 bpm loop: kick on every beat, clap on 2 and 4, hats on the off-beats, a sub note; made here, ours"""
    n = int(secs * sr); out = np.zeros(n); t = np.arange(int(0.45 * sr)) / sr
    kick = np.sin(2 * np.pi * (45 + 110 * np.exp(-t * 30)) * t) * np.exp(-t * 9)
    rng = np.random.default_rng(7)
    clap = rng.standard_normal(int(0.18 * sr)) * np.exp(-np.arange(int(0.18 * sr)) / sr * 22) * 0.55
    hat = rng.standard_normal(int(0.05 * sr)); hat = np.diff(np.concatenate([[0], hat])) * np.exp(-np.arange(len(hat)) / sr * 90) * 0.22
    for b in range(int(secs / BEAT)):
        s = int(b * BEAT * sr)
        def add(x, at):
            e = min(n, at + len(x)); out[at:e] += x[:e - at]
        add(kick, s)
        if b % 2: add(clap, s)
        add(hat, s + int(BEAT / 2 * sr))
    out = np.tanh(out * 1.4) * 0.6
    with wave.open(path, 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((out * 32767).astype('<i2').tobytes())

def home_shots(p):
    """today's home page on a phone, as one tall picture"""
    if True:
        br = launch(p); ctx = br.new_context(viewport={'width': 540, 'height': 960}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = ctx.new_page(); pg.goto('file://' + os.path.join(cut.ROOT, 'dist', 'gamehub.html')); pg.wait_for_timeout(1500)
        pg.evaluate("document.querySelectorAll('.modal, #welcome-pop').forEach(e => e.classList.add('hidden'))")
        tall = os.path.join(TMP, 'home_tall.png'); pg.screenshot(path=tall, full_page=True); br.close()
    from PIL import Image
    im = Image.open(tall); im = im.crop((0, 0, im.width, min(im.height, int(im.width * 3.2)))); im.save(tall)
    return tall

if __name__ == '__main__':
    with sync_playwright() as p:
        cut.P = p
        bgp = os.path.join(TMP, 'bg.png'); bg_png(bgp)
        parts = []
        for i, s in enumerate(segs()): parts.append(game_seg(i, *s, bgp))
        tall = home_shots(p)
        parts.append(home_seg(len(parts), tall, 3.0, 'NO DOWNLOAD 🚫', 'SEND A LINK 🔗'))
        ep = os.path.join(TMP, 'end.png'); endcard_png(ep, 'Game night with friends,<br>in <em>one link</em>.')
        hp = os.path.join(TMP, 'hook.png'); hook_png(hp, 'POV: you found a website<br>with <em>25 free games</em> 🤯')
    end = os.path.join(TMP, 'end.mp4')
    run(['ffmpeg', '-y', '-framerate', str(FPS), '-loop', '1', '-t', '2.5', '-i', ep, '-f', 'lavfi', '-t', '2.5', '-i', 'anullsrc=r=48000:cl=stereo',
         '-vf', f'fps={FPS},format=yuv420p,fade=in:st=0:d=0.14:color=white', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-c:a', 'aac', '-ar', '48000', '-shortest', end])
    parts.append((end, 2.5))
    lst = os.path.join(TMP, 'all.txt'); open(lst, 'w').write(''.join(f"file '{f}'\n" for f, _ in parts))
    body = os.path.join(TMP, 'body.mp4'); run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-r', str(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '48000', body])   # re-encoded: a straight copy froze the home pan
    total = sum(d for _, d in parts); dw = os.path.join(TMP, 'drums.wav'); drums(dw, total)
    hook_until = sum(d for _, d in parts[:3])
    out = os.path.join(OUT, 'edit_promo.mp4')
    run(['ffmpeg', '-y', '-i', body, '-loop', '1', '-i', hp, '-i', dw, '-filter_complex',
         f"[0:v][1:v]overlay=0:0:enable='lte(t,{hook_until:.2f})'[v];[0:a]loudnorm=I=-16:TP=-2[g];[2:a]volume=0.55,afade=out:st={total - 1.2:.2f}:d=1.2[d];[g][d]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]",
         '-map', '[v]', '-map', '[a]', '-t', f'{total:.3f}', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out])
    print('made', out, f'{total:.1f}s')
