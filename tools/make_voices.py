"""Record the how-to video narration with Google Text-to-Speech (voice Puck, Chirp 3 HD; Inna chose it, Nov 2026).
Run tools/voice_lines.py first. Needs the Google key (saved as a network secret for texttospeech.googleapis.com,
header X-Goog-Api-Key). Only lines that have no file yet are recorded, so changing a guide re-records just that line.
Files: assets/site/voice/<lang>/<hash>.mp3 (copied to the live site by build.py)."""
import json, os, base64, subprocess, concurrent.futures as cf
ROOT = os.path.join(os.path.dirname(__file__), '..')
VOICE = {'en': ('en-US', 'en-US-Chirp3-HD-Puck'), 'vi': ('vi-VN', 'vi-VN-Chirp3-HD-Puck')}
lines = json.load(open(os.path.join(ROOT, 'tools', 'voice_lines.json')))
def rec(r):
    out = os.path.join(ROOT, 'assets', 'site', 'voice', r['lang'], r['hash'] + '.mp3')
    if os.path.exists(out): return 'have'
    code, name = VOICE[r['lang']]
    body = {'input': {'text': r['text']}, 'voice': {'languageCode': code, 'name': name}, 'audioConfig': {'audioEncoding': 'MP3', 'speakingRate': 1.0}}
    import time
    for attempt in range(8):
        p = subprocess.run(['curl', '-sS', '-m', '90', '-H', 'Content-Type: application/json', '-d', json.dumps(body), 'https://texttospeech.googleapis.com/v1/text:synthesize'], capture_output=True, text=True)
        try:
            a = json.loads(p.stdout)['audioContent']
            os.makedirs(os.path.dirname(out), exist_ok=True); open(out, 'wb').write(base64.b64decode(a)); return 'new'
        except Exception:
            err = p.stdout[:160]
            if '429' in err or 'RESOURCE_EXHAUSTED' in err: time.sleep(20 + attempt * 10)   # per-minute limit: wait, then try again
    return 'fail ' + err
with cf.ThreadPoolExecutor(2) as ex: res = list(ex.map(rec, lines))
print({k: sum(1 for x in res if x.startswith(k)) for k in ('have', 'new', 'fail')})
fails = [x for x in res if x.startswith('fail')]
if fails: print(fails[:3])
