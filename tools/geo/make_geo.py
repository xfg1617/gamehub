"""Step 2 (after find.py and looking at the contact sheets): download the chosen photo for each place, shrink it to
1100 px wide, save assets/site/geo/<id>.jpg, and write src/games/geo_places.js (with the credit for every photo) and
assets/site/geo/CREDITS.txt. PICK = which candidate (number on the contact sheet) to use; SKIP = places left out."""
import json, os, re, sys, io, time, urllib.request
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__)); from places import PLACES
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'site', 'geo'); os.makedirs(OUT, exist_ok=True)
UA = {'User-Agent': 'GameHubGeoPhotos/1.0 (educational game; image credits shown in game)'}
cands = json.load(open('/tmp/geo/cands.json'))
PICK = json.load(open(os.path.join(os.path.dirname(__file__), 'pick.json')))
places, credits = [], []
for pid, name, country, region, lat, lon in PLACES:
    k = PICK.get(pid, 0)
    if k is None or k == 'skip' or not cands.get(pid) or k >= len(cands[pid]): continue
    c = cands[pid][k]; path = os.path.join(OUT, pid + '.jpg')
    if not os.path.exists(path) or PICK.get('_redo') == pid:
        for t in range(4):
            try:
                im = Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(c['thumb'].replace('thumb.wikimedia.org', 'upload.wikimedia.org').split('?')[0], headers=UA), timeout=60).read())).convert('RGB'); break
            except Exception as e: time.sleep(3 + t * 3); im = None
        if im is None: print('FAILED', pid); continue
        if im.width > 1100: im = im.resize((1100, round(im.height * 1100 / im.width)), Image.LANCZOS)
        im.save(path, quality=72, optimize=True, progressive=True)
    by = re.sub(r'\s+', ' ', c['artist']).strip()
    places.append({'id': pid, 'name': name, 'country': country, 'region': region, 'lat': lat, 'lon': lon, 'by': by, 'lic': c['lic'], 'src': c['page']})
    credits.append(f"{pid}.jpg  ·  {name}, {country}  ·  {by}  ·  {c['lic']}  ·  {c['page']}")
with open(os.path.join(ROOT, 'src', 'games', 'geo_places.js'), 'w') as f:
    f.write('/* Photos for Where Am I? (made by tools/geo/make_geo.py): free-licence photos from Wikimedia Commons, credited in the game. */\n')
    f.write('window.GEO_PLACES = ' + json.dumps(places, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(OUT, 'CREDITS.txt'), 'w').write('Photos used in "Where Am I?" (GameHub). All from Wikimedia Commons under the licence shown.\n\n' + '\n'.join(credits) + '\n')
print(len(places), 'places;', sum(os.path.getsize(os.path.join(OUT, p['id'] + '.jpg')) for p in places) // 1024, 'KB')
