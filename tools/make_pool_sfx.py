"""Real pool recordings for Pool (Nov 2026, Inna: "i want realistic pool sounds").

Downloads free CC0 (public domain) recordings from freesound.org (their 128k previews), cuts the cleanest single hits
out of them and writes src/sfx/ball_*.mp3 (ball on ball), cue_*.mp3 (cue tip on the cue ball), rail_*.mp3 (ball off
the cushion) and pocket_*.mp3 (ball dropping into a pocket). The list of recordings and their authors is written to
src/sfx/LICENSE-freesound-pool.txt (CC0 needs no credit, we keep it anyway).
Needs: numpy, scipy, ffmpeg, and network access to freesound.org + cdn.freesound.org.
    python3 tools/make_pool_sfx.py            (then python3 build.py)
"""
import os, glob, subprocess, tempfile, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'src', 'sfx')
CACHE = os.path.join(tempfile.gettempdir(), 'gamehub_freesound'); os.makedirs(CACHE, exist_ok=True)

# id: (user, title, preview url)
REC = {
    '245397': ('Cymeon', 'Billiard Ball percussive hits', 'https://cdn.freesound.org/previews/245/245397_3545231-hq.mp3'),
    '539854': ('Za-Games', 'billiard ball clack', 'https://cdn.freesound.org/previews/539/539854_12029332-hq.mp3'),
    '443067': ('AmberdeMeillon', 'Pool_Table_Ball_Hit', 'https://cdn.freesound.org/previews/443/443067_8282799-hq.mp3'),
    '709674': ('rvdw2004', 'SFXPool-Int_Hitting pool balls', 'https://cdn.freesound.org/previews/709/709674_14710320-hq.mp3'),
    '62331': ('bsumusictech', 'Pool balls', 'https://cdn.freesound.org/previews/62/62331_791247-hq.mp3'),
    '675330': ('craigsmith', 'S02-22 Billiards cue stick hits ball', 'https://cdn.freesound.org/previews/675/675330_2524442-hq.mp3'),
    '42364': ('mccarthy@bedmas.com', 'pool-ball-bounce-off-rail', 'https://cdn.freesound.org/previews/42/42364_450724-hq.mp3'),
    '655629': ('Hankof', 'pool ball hits pool ball', 'https://cdn.freesound.org/previews/655/655629_13805813-hq.mp3'),
    '441857': ('Yarmonics', 'B_1 pool ball falling', 'https://cdn.freesound.org/previews/441/441857_9109395-hq.mp3'),
    '655346': ('jadevelloza', 'Ball being hit by white ball, then being sunk', 'https://cdn.freesound.org/previews/655/655346_13726792-hq.mp3'),
}


def fetch(sid):
    f = os.path.join(CACHE, sid + '.mp3')
    if not os.path.exists(f) or subprocess.run(['ffprobe', '-v', 'error', f], capture_output=True).returncode:
        subprocess.run(['curl', '-s', '-m', '300', '--retry', '3', '-o', f, REC[sid][2]], check=True)
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def env_db(x, ms=1):
    h = int(ms / 1000 * SR); n = len(x) // h
    return 20 * np.log10(np.sqrt(np.mean(x[:n * h].reshape(n, h) ** 2, axis=1)) + 1e-9), h


def hits(x, count, length, quiet_before=0.04, min_db=-30):
    """the strongest separate hits: a sharp rise, nothing loud just before, and the next `length` seconds to itself"""
    db, h = env_db(x); top = db.max(); cand = []
    for i in range(12, len(db) - 2):
        if db[i] < top + min_db: continue
        before = db[max(0, i - int(quiet_before * 1000)):i - 2]
        if len(before) and db[i] - before.max() > 12 and db[i] >= db[i - 1] and db[i] >= db[i + 1]:
            cand.append((db[i], i))
    cand.sort(reverse=True); picked = []
    for v, i in cand:
        if all(abs(i - j) > (length + quiet_before) * 1000 for _, j in picked): picked.append((v, i))
        if len(picked) >= count: break
    out = []
    for v, i in sorted(picked, key=lambda p: p[1]):
        s = i * h
        # start at the true start of the attack (a few ms back to where it was quiet)
        k = s
        while k > s - int(0.006 * SR) and abs(x[k]) > 0.02 * np.max(np.abs(x[s:s + int(0.01 * SR)])): k -= 1
        out.append(x[max(0, k - int(0.0015 * SR)):k + int(length * SR)].copy())
    return out


def clean(seg, hp=70, fade=0.04, tail_db=-48):
    """take the rumble out, cut the silent end, fade in/out softly, even out the loudness"""
    seg = sosfilt(butter(2, hp, 'highpass', fs=SR, output='sos'), seg)
    db, h = env_db(seg, 2); top = db.max(); last = np.where(db > top + tail_db)[0]
    if len(last): seg = seg[:min(len(seg), (last[-1] + 1) * h)]
    fi = int(0.001 * SR); seg[:fi] *= np.linspace(0, 1, fi)
    fo = min(len(seg) // 3, int(fade * SR)); seg[-fo:] *= np.linspace(1, 0, fo) ** 2
    return seg * (0.9 / (np.max(np.abs(seg)) + 1e-9))


def to_mp3(x, path):
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f: tmp = f.name
    w = wave.open(tmp, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-ac', '1', '-ar', '44100', '-b:a', '80k', path], check=True)
    os.remove(tmp)


def cut_at(x, t, length):
    """one hit near time t (seconds): find its peak within 25 ms, start just before the attack"""
    i0 = max(0, int((t - 0.025) * SR)); i1 = int((t + 0.025) * SR)
    p = i0 + int(np.argmax(np.abs(x[i0:i1]))); k = p
    while k > p - int(0.008 * SR) and abs(x[k]) > 0.04 * abs(x[p]): k -= 1
    s0 = max(0, k - int(0.002 * SR)); return x[s0:s0 + int(length * SR)].copy()


# the hits chosen by listening to the numbers: natural ring (40-110 ms), real brightness, nothing else on top
PICK = {
    'ball':   [('539854', 0.0, 0.24), ('443067', 5.08, 0.15), ('62331', 7.29, 0.16), ('62331', 16.62, 0.1), ('655629', 0.15, 0.13),
               ('655629', 0.29, 0.08), ('709674', 0.31, 0.065), ('245397', 1.70, 0.2)],
    'cue':    [('675330', 3.82, 0.2), ('675330', 7.24, 0.14), ('675330', 9.67, 0.18), ('675330', 12.70, 0.18), ('675330', 18.91, 0.12)],
    'rail':   [('42364', 0.38, 0.34)],
    'pocket': [('441857', 0.30, 0.14), ('441857', 0.44, 0.27), ('655346', 1.18, 0.45)],
}

if __name__ == '__main__':
    made = {k: [] for k in PICK}; cache = {}
    for name, lst in PICK.items():
        for sid, t, ln in lst:
            if sid not in cache: cache[sid] = fetch(sid)
            made[name].append(clean(cut_at(cache[sid], t, ln), 50 if name in ('rail', 'pocket') else 80, 0.05, -55))
    for name, segs in made.items():
        for f in glob.glob(os.path.join(OUT, f'{name}_*.mp3')): os.remove(f)
        for i, s in enumerate(segs): to_mp3(s, os.path.join(OUT, f'{name}_{i + 1}.mp3'))
    with open(os.path.join(OUT, 'LICENSE-freesound-pool.txt'), 'w') as f:
        f.write('Pool sounds (ball_*, cue_*, rail_*, pocket_*): cut from these CC0 (public domain) recordings on freesound.org.\n'
                'CC0 1.0 Universal: https://creativecommons.org/publicdomain/zero/1.0/  (no credit required; listed with thanks)\n\n')
        for sid, (u, t, _) in REC.items(): f.write(f'  {t} by {u}: https://freesound.org/s/{sid}/\n')
    # a demo for Inna: a break, a few shots, pots and cushions, with the volume following how hard each hit is
    def at(parts):
        L = int(max(t + len(x) / SR for t, x, g in parts) * SR) + SR // 3; b = np.zeros(L)
        for t, x, g in parts: i = int(t * SR); b[i:i + len(x)] += x * g
        return b
    B, C, R, P = made['ball'], made['cue'], made['rail'], made['pocket']; rs = np.random.default_rng(7); seq = []
    t = 0.3; seq += [(t, C[0], 1.0)]                                                   # the break
    for k in range(14): seq.append((t + 0.16 + 0.012 * k + 0.02 * rs.random() * k, B[k % len(B)], max(0.15, 1.0 - 0.06 * k)))
    seq += [(t + 0.55, R[0], 0.8), (t + 0.7, R[0], 0.5), (t + 0.95, B[3], 0.3), (t + 1.2, P[2], 0.8), (t + 1.6, R[0], 0.3)]
    t = 3.4; seq += [(t, C[1], 0.7), (t + 0.45, B[1], 0.75), (t + 1.05, P[1], 0.9)]  # a firm pot
    t = 5.6; seq += [(t, C[2], 0.4), (t + 0.8, B[4], 0.35), (t + 1.7, R[0], 0.35), (t + 2.6, B[5], 0.15)]  # a soft safety
    t = 9.0; seq += [(t, C[3], 0.9), (t + 0.3, B[2], 0.9), (t + 0.55, R[0], 0.7), (t + 0.62, P[0], 0.9)]  # a hard cut into the corner
    demo = at(seq); demo *= 0.95 / np.max(np.abs(demo))
    to_mp3(demo, os.path.join(ROOT, 'prototypes', 'round5', 'real-pool-sounds.mp3'))
    print({k: [round(len(s) / SR, 2) for s in v] for k, v in made.items()})
