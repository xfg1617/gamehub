"""'Cold open' TikTok clips (Nov 27 2026, Inna: "hooks instantly, 1-2 seconds in"): the clip STARTS on the payoff
(the strike / the break) with the hook text on screen from the first frame, then shows the whole shot from the start,
then the end card. Uses the recordings make.py saved in /tmp/gh_tiktok (run make.py bowling pool first if missing).

    python3 tools/tiktok/hook.py            # bowling + pool
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rec import sync_playwright
from cut import make_clip, join_ranges
from make import WORK, OUT, CUTS

CLIPS = {
    # name: (recording, ranges(r) -> [(a, b), ...], crop(r), hook)
    'hook_bowling': ('bowling',
        lambda m: [(m['strike'] - 1.75, m['strike'] + 0.4), (m['throw0'] - 0.3, m['strike'] + 1.9)],
        lambda c: (c[0] + c[2] * 0.19, c[1], c[2] * 0.62, c[3]),
        'Wait… this is a<br><em>free website?!</em> 🤯'),
    'hook_pool': ('pool',
        lambda m: [(m['shot'] + 0.22, m['shot'] + 1.6), (m['shot'] - 0.5, m['shot'] + 5.0)],
        lambda c: c,
        'Turn your sound <em>ON</em> 🔊🎱'),
    # card games: the payoff first, then the build-up the normal clip shows (make.py's CUTS)
    'hook_fibber': ('fibber',
        lambda m, r: [(m['lie'] - 1.7, m['lie'] + 0.6), CUTS['fibber'](r)],
        None, 'Caught lying in <em>4K</em> 😭'),
    'hook_kittens': ('kittens',
        lambda m, r: [(m['out'] - 1.0, m['out'] + 1.7), CUTS['kittens'](r)],
        None, 'It was <em>always</em> going<br>to be me 💀🔥'),
    'hook_colorclash': ('colorclash',
        lambda m, r: [(m['w4'] + 0.25, m['w4'] + 2.3), CUTS['colorclash'](r)],
        None, 'My best friend<br>did <em>THIS</em> to me 😭'),
    'hook_poker': ('poker',
        lambda m, r: [(m['show'] + 0.3, m['show'] + 2.6), CUTS['poker'](r)],
        None, 'Won the pot with<br>just a <em>PAIR</em> 😎'),
}
CAPS = {
    'hook_bowling': 'no download, no app, just open the link 🎳🤯 free bowling + 25 games to play with friends #bowling #strike #gamenight #browsergames #fyp',
    'hook_fibber': 'the face of a liar 😭 the bluffing card game, free in your browser, play friends with one link #cardgames #bluff #gamenight #gameswithfriends #fyp',
    'hook_kittens': 'it was always going to be me 💀🔥 free party card game, no download #cardgame #gamenight #gameswithfriends #partygames #fyp',
    'hook_colorclash': 'friendship over 😭 free card games with friends, one link, no download #cardgames #gamenight #gameswithfriends #fyp #browsergames',
    'hook_poker': 'just bragging rights 😎 free poker with friends, no real money #poker #texasholdem #gamenight #fyp',
    'hook_pool': 'that break sound 🔊🎱 free pool in your browser, play your friends with one link #pool #8ballpool #billiards #asmr #gamenight #fyp',
}

if __name__ == '__main__':
    names = sys.argv[1:] or list(CLIPS)
    with sync_playwright() as p:
        for n in names:
            src, rng, crop, hook = CLIPS[n]
            r = json.load(open(os.path.join(WORK, src + '.json')))
            tmp = os.path.join(WORK, n); os.makedirs(tmp, exist_ok=True)
            c = crop(r['crop']) if crop else r['crop']
            try: ranges = rng(r['marks'], r)
            except TypeError: ranges = rng(r['marks'])
            j, total = join_ranges(r, ranges, tmp)
            out = os.path.join(OUT, n + '.mp4')
            make_clip(j, 0.0, total, hook, out, tmp=tmp, p=p, crop=c)
            print('made', out, f'{total + 2.6:.1f}s')
    with open(os.path.join(OUT, 'captions.txt'), 'a') as fh:
        for n in names: fh.write(f'\n{n}.mp4 (starts on the best moment)\n{CAPS[n]}\n')
