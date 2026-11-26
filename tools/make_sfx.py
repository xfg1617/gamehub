"""Card and pool sounds for GameHub (Nov 2026, Inna: "better quality card sounds and pool sounds").

Built here from how the sounds really happen (no recordings needed, no licence questions):
  pool:  ball  = two hard resin balls: a split-second broadband clack with a short bright ring
         rail  = the rubber cushion gives (low thud) and the wooden rail knocks, cloth brushes
         pocket= the ball hits the leather / jaw, drops, and rolls down the return track
         cue   = the leather tip on the ball: a softer, rounder "tock" + the cue's wood
  cards: card  = a card put down on felt (short slide, soft pat)
         deal  = flicked off the deck (snap), flies (swish), lands and slides on the felt
         draw  = slid off the top of the deck (paper on paper)
         shuffle = a riffle (dozens of tiny card ticks speeding up and slowing down), the bridge, a tap
         fan   = a hand of cards spread out
A small room (early reflections + soft tail) is added so they don't sound like they come from inside the speaker.
Writes src/sfx/<name>_<n>.mp3 for the card sounds (replaces those names only) and prototypes/round5/new-card-pool-sounds.mp3
(a demo; the file name is old: it now holds the cards only). Pool sounds: tools/make_pool_sfx.py (real recordings).
Needs numpy, scipy, ffmpeg.  python3 tools/make_sfx.py"""
import os, glob, subprocess, tempfile, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'src', 'sfx')
rng = np.random.default_rng(20261126)


def T(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)


def mode(f, decay, d, amp=1.0, phase=0.0):
    """one ringing resonance (a struck body's partial), decaying exponentially"""
    t = T(d); return amp * np.sin(2 * np.pi * f * t + phase) * np.exp(-t / decay)


def env(n, a, d):
    """attack (s) then exponential decay (s)"""
    t = np.arange(n) / SR; e = np.exp(-np.maximum(0, t - a) / d)
    if a > 0: e = np.where(t < a, t / a, e)
    return e


def place(buf, x, at):
    i = int(at * SR); j = min(len(buf), i + len(x)); buf[i:j] += x[:j - i]; return buf


def pulse(width):
    """the force of a very short impact: a half-sine lasting `width` seconds"""
    n = max(2, int(width * SR)); return np.sin(np.pi * np.arange(n) / n)


def room(x, wet=0.16, size=1.0):
    """a small room: a few early reflections + a short, darker diffuse tail"""
    y = np.concatenate([x, np.zeros(int(0.35 * SR))])
    out = y.copy()
    for dt, g in [(0.0071, 0.32), (0.0113, 0.24), (0.0167, 0.18), (0.0239, 0.12)]:
        out[int(dt * size * SR):] += g * wet * 2.2 * y[:len(y) - int(dt * size * SR)]
    n = int(0.28 * size * SR); ir = lp(rng.standard_normal(n), 3200) * np.exp(-np.arange(n) / SR / (0.065 * size))
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    tail = np.convolve(y, ir)[:len(y)]
    out += wet * tail
    return out


def finish(x, peak=0.89, fade=0.012):
    x = x - np.mean(x)
    # trim the silent end, fade out softly
    a = np.abs(x); idx = np.where(a > a.max() * 0.002)[0]
    x = x[:idx[-1] + int(0.01 * SR)] if len(idx) else x
    f = int(fade * SR); x[-f:] *= np.linspace(1, 0, f)
    return x * (peak / (np.max(np.abs(x)) + 1e-9))


def friction(d, rate, lo, hi, grain=0.6):
    """paper/cloth rubbing: lots of tiny stick-slip impulses (grainy), not plain hiss"""
    n = int(d * SR); imp = np.zeros(n)
    k = rng.poisson(rate * d); pos = rng.integers(0, n, k); imp[pos] = rng.exponential(1, k) * rng.choice([-1, 1], k)
    g = bp(imp, lo, hi) * grain + bp(rng.standard_normal(n), lo, hi) * (1 - grain) * 0.25
    return g


# ===================================================================================================== pool
def ball_clack(v):
    """two phenolic resin balls. The contact lasts ~0.2 ms, so the click is very bright; the audible 'ring' is short."""
    d = 0.09; x = np.zeros(int(d * SR))
    p = pulse(0.00018 + 0.00006 * rng.random())
    x = place(x, np.diff(np.concatenate([[0], p])) * 3.5, 0)                # the pressure pulse (sharp crack)
    base = 2450 + 450 * rng.random()
    for k, (r, dec, a) in enumerate([(1, 0.011, 1.0), (1.63, 0.008, 0.7), (2.41, 0.0055, 0.45), (3.37, 0.004, 0.3)]):
        x += mode(base * r * (1 + 0.02 * rng.standard_normal()), dec * (0.8 + 0.4 * rng.random()), d, a * (0.9 + 0.2 * rng.random()), rng.random() * 6) * 0.5
    x += mode(780 + 160 * rng.random(), 0.016, d, 0.25)                    # the body of the 'tock'
    x += bp(noise(d), 3000, 12000) * env(len(x), 0, 0.0016) * 0.9           # click grit
    x = lp(hp(x, 300), 11000)
    return finish(room(x, 0.13, 0.9))


def cushion(v):
    d = 0.22; x = np.zeros(int(d * SR))
    # the rubber nose gives: a low, quickly damped thump
    x += mode(118 + 30 * rng.random(), 0.035, d, 1.0) * env(len(x), 0.002, 0.05)
    x += mode(205 + 40 * rng.random(), 0.022, d, 0.55, 1.0)
    # the wooden rail behind it knocks
    x += mode(470 + 80 * rng.random(), 0.018, d, 0.45) + mode(820 + 120 * rng.random(), 0.010, d, 0.25)
    # cloth brushing + a faint ball click at contact
    x += lp(noise(d), 1800) * env(len(x), 0.001, 0.012) * 0.5
    x += bp(noise(d), 2500, 8000) * env(len(x), 0, 0.0015) * 0.35
    return finish(room(lp(x, 5000), 0.15))


def pocket(v):
    d = 0.75; x = np.zeros(int(d * SR))
    # hits the leather / jaw: a dull thud + a little wood
    x += mode(140 + 25 * rng.random(), 0.045, d, 1.0) + mode(390 + 60 * rng.random(), 0.02, d, 0.45)
    x += lp(noise(d), 1200) * env(len(x), 0.001, 0.015) * 0.5
    # drops into the pocket (second, deeper thud)
    drop = mode(95 + 20 * rng.random(), 0.06, 0.3, 0.9) + mode(260, 0.03, 0.3, 0.35) + lp(noise(0.3), 700) * env(int(0.3 * SR), 0.002, 0.02) * 0.4
    t0 = 0.075 + 0.03 * rng.random(); x = place(x, drop, t0)
    # rolls down the return track: low rumble with little bumps (the ball turning on the rails)
    rd = 0.38; n = int(rd * SR); t = np.arange(n) / SR
    bumps = np.zeros(n); f = 34 + 8 * rng.random()
    for k in range(int(rd * f)): bumps[int(k / f * SR)] = 0.6 + 0.4 * rng.random()
    roll = lp(bumps, 900) * 2.5 + lp(rng.standard_normal(n), 300) * 0.25
    roll *= np.minimum(1, t / 0.05) * np.exp(-t / 0.22)
    x = place(x, roll * 0.55, t0 + 0.09)
    # and taps the balls already in the return (a soft, distant click)
    k = ball_clack(0.3)[:int(0.08 * SR)] * 0.13; x = place(x, lp(k, 4000), t0 + 0.09 + rd * (0.8 + 0.2 * rng.random()))
    return finish(room(x, 0.12))


def cue_tip(v):
    d = 0.12; x = np.zeros(int(d * SR))
    p = pulse(0.0011 + 0.0003 * rng.random())                                 # leather: a longer, softer contact
    x = place(x, p * 0.8, 0)
    x += mode(1250 + 200 * rng.random(), 0.009, d, 0.6) + mode(2050 + 300 * rng.random(), 0.006, d, 0.35)
    x += mode(380 + 50 * rng.random(), 0.028, d, 0.35)                        # the cue's wood
    x += bp(noise(d), 1500, 6000) * env(len(x), 0, 0.002) * 0.4
    x = hp(x, 150)
    return finish(room(x, 0.12))


# ===================================================================================================== cards
def felt_pat(strength=1.0, d=0.07):
    """a card landing flat on felt: soft, airy, low"""
    n = int(d * SR); x = bp(rng.standard_normal(n), 300, 2600) * env(n, 0.0015, 0.010)
    x += mode(250 + 60 * rng.random(), 0.009, d, 0.3)[:n]
    x += bp(rng.standard_normal(n), 3000, 7000) * env(n, 0, 0.003) * 0.25   # the card's edge
    return x * strength


def snap(d=0.03):
    """a card flicked off the deck: a crisp paper snap"""
    n = int(d * SR); x = bp(rng.standard_normal(n), 1800, 9000) * env(n, 0.0003, 0.0035)
    x += mode(2300 + 500 * rng.random(), 0.004, d, 0.5)[:n]
    return x


def swish(d):
    """air past a flying card: a short airy whoosh"""
    n = int(d * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n); x = bp(x, 900, 5200)
    shape = np.sin(np.pi * np.minimum(1, t / d)) ** 2
    return x * shape * 0.22


def slide(d, rough=1.0):
    """a card sliding over felt or another card"""
    n = int(d * SR); t = np.arange(n) / SR
    x = friction(d, 2600 * rough, 1200, 7000, 0.7) * 1.4
    shape = np.minimum(1, t / 0.008) * np.exp(-t / (d * 0.55))
    return x * shape


def card_place(v):
    d = 0.16; x = np.zeros(int(d * SR))
    x = place(x, slide(0.045, 0.8) * 0.5, 0)
    x = place(x, felt_pat(1.0), 0.03 + 0.01 * rng.random())
    return finish(room(lp(hp(x, 120), 8500, 4), 0.12, 0.8))


def card_deal(v):
    d = 0.3; x = np.zeros(int(d * SR))
    x = place(x, snap() * 0.8, 0)
    fly = 0.07 + 0.03 * rng.random()
    x = place(x, swish(fly), 0.005)
    x = place(x, felt_pat(0.9), 0.01 + fly)
    x = place(x, slide(0.08, 0.9) * 0.45, 0.015 + fly)
    return finish(room(lp(hp(x, 120), 8500, 4), 0.12, 0.8))


def card_draw(v):
    d = 0.25; x = np.zeros(int(d * SR))
    sl = 0.12 + 0.05 * rng.random()
    x = place(x, slide(sl, 1.2) * 0.9, 0)
    x = place(x, snap(0.02) * 0.35, sl * 0.85)           # the card clears the deck's edge
    return finish(room(lp(hp(x, 120), 8500, 4), 0.12, 0.8))


def riffle(v):
    """two halves riffled together: ~45 tiny ticks that speed up then slow down, under a papery purr; then the
    bridge (a softer cascade) and the deck squared on the table"""
    d = 1.35; x = np.zeros(int(d * SR))
    n_cards = 46 + int(rng.integers(0, 8)); dur = 0.62 + 0.08 * rng.random()
    u = np.sort(rng.random(n_cards)); times = 0.04 + dur * (0.5 - 0.5 * np.cos(np.pi * u))   # dense in the middle
    for i, tt in enumerate(times):
        m = int(0.004 * SR); tick = bp(rng.standard_normal(m), 1600, 8000) * env(m, 0.0002, 0.0009)
        tick += mode(2600 + 900 * rng.random(), 0.0012, 0.004, 0.4)[:m]
        x = place(x, tick * (0.8 + 0.6 * rng.random()), tt)
    x = place(x, slide(dur + 0.05, 1.6) * 0.12, 0.03)
    # bridge: the cards cascade back together
    bt = 0.04 + dur + 0.12; bd = 0.22
    casc = friction(bd, 5200, 1500, 7000, 0.85) * np.sin(np.pi * np.arange(int(bd * SR)) / (bd * SR)) * 0.9
    x = place(x, casc, bt)
    # squared up: a tap on the table
    sq = lp(rng.standard_normal(int(0.06 * SR)), 1200) * env(int(0.06 * SR), 0.001, 0.008) + mode(170, 0.014, 0.06, 0.7)
    x = place(x, sq * 1.3, bt + bd + 0.08)
    return finish(room(lp(hp(x, 120), 8500, 4), 0.12, 0.8))


def fan_out(v):
    d = 0.5; x = np.zeros(int(d * SR))
    k = 7 + int(rng.integers(0, 3))
    for i in range(k):
        x = place(x, slide(0.06, 1.0) * (0.55 + 0.3 * rng.random()), 0.02 + i * (0.028 + 0.006 * rng.random()))
    x = place(x, snap(0.02) * 0.25, 0.02 + k * 0.03)
    return finish(room(lp(hp(x, 120), 8500, 4), 0.12, 0.8))


# pool sounds are real recordings now (tools/make_pool_sfx.py); the pool synths above stay only for reference
SOUNDS = {'card': (card_place, 4), 'deal': (card_deal, 6), 'draw': (card_draw, 3), 'shuffle': (riffle, 2), 'fan': (fan_out, 2)}


def to_mp3(x, path, br='64k'):
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f: tmp = f.name
    w = wave.open(tmp, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-ac', '1', '-ar', '44100', '-b:a', br, path], check=True)
    os.remove(tmp)


if __name__ == '__main__':
    made = {}
    for name, (fn, n) in SOUNDS.items():
        for f in glob.glob(os.path.join(OUT, f'{name}_*.mp3')): os.remove(f)
        made[name] = []
        for i in range(n):
            x = fn(1.0); made[name].append(x); to_mp3(x, os.path.join(OUT, f'{name}_{i + 1}.mp3'))
    # a demo for Inna: a card table, then a pool shot
    def at(parts):
        L = int(max(t + len(s) / SR for t, s, g in parts) * SR) + SR // 4; b = np.zeros(L)
        for t, s, g in parts: place(b, s * g, t)
        return b
    c = made; seq = [(0.2, c['shuffle'][0], 0.8), (1.8, c['shuffle'][1], 0.8)]
    t = 3.4
    for i in range(8): seq.append((t, c['deal'][i % 6], 0.85)); t += 0.24
    t += 0.4; seq += [(t, c['fan'][0], 0.7), (t + 0.9, c['draw'][0], 0.75), (t + 1.5, c['card'][0], 0.9), (t + 2.0, c['card'][1], 0.9), (t + 2.5, c['draw'][1], 0.75)]
    t += 3.6
    demo = at(seq); demo *= 0.95 / np.max(np.abs(demo))
    to_mp3(demo, os.path.join(ROOT, 'prototypes', 'round5', 'new-card-pool-sounds.mp3'), '128k')
    print('made', {k: len(v) for k, v in made.items()})
