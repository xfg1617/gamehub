"""Step 1: for every place, ask Wikimedia Commons for photos taken nearby and keep the 4 best candidates
(free licence, landscape, big enough, not a map/logo/painting). Writes /tmp/geo/cands.json + thumbnails + contact sheets."""
import json, os, re, sys, time, urllib.request, urllib.parse, io
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__)); from places import PLACES
OUT = '/tmp/geo'; os.makedirs(OUT + '/th', exist_ok=True)
UA = {'User-Agent': 'GameHubGeoPhotos/1.0 (educational game; image credits shown in game)'}
API = 'https://commons.wikimedia.org/w/api.php'
OK_LIC = re.compile(r'^(cc0|public domain|pd|cc by(-sa)? ?[1-4]\.0|cc by(-sa)? ?2\.5|cc by(-sa)? ?3\.0)', re.I)
BAD = re.compile(r'map|logo|flag|coat.of.arms|diagram|painting|portrait|interior|museum|plan|stamp|drawing|altar|grave|tomb|menu|sign|plaque|selfie|food|dish|insect|bird|flower|close|detail|night|aerial|satellite|panorama|pano|statue|sculpture|text|screenshot|poster|ticket|bus|train|car_|vehicle|people|woman|man_|girl|boy', re.I)
def get(params):   # slow and patient: Wikimedia asks bots to keep to a few requests a second and back off when told to
    for k in range(8):
        try:
            time.sleep(1.2)
            r = urllib.request.urlopen(urllib.request.Request(API + '?' + urllib.parse.urlencode(params), headers=UA), timeout=30)
            txt = r.read().decode('utf-8', 'replace')
            if txt.lstrip().startswith('{'): return json.loads(txt)
            time.sleep(20 + k * 20)
        except Exception as e: time.sleep(10 + k * 15)
    return {}
cands = json.load(open(OUT + '/cands.json')) if os.path.exists(OUT + '/cands.json') else {}
import threading
from concurrent.futures import ThreadPoolExecutor
lock = threading.Lock()
def one(pl):
    pid, name, country, region, lat, lon = pl
    if pid in cands and cands[pid]: return
    found = []
    for rad in (1500, 5000, 10000):
        g = get({'action': 'query', 'format': 'json', 'list': 'geosearch', 'gscoord': f'{lat}|{lon}', 'gsradius': rad, 'gsnamespace': 6, 'gslimit': 50})
        titles = [x['title'] for x in g.get('query', {}).get('geosearch', []) if x['title'].lower().endswith(('.jpg', '.jpeg')) and not BAD.search(x['title'])]
        for i in range(0, min(len(titles), 40), 20):
            q = get({'action': 'query', 'format': 'json', 'titles': '|'.join(titles[i:i + 20]), 'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata', 'iiurlwidth': 1280, 'iiextmetadatafilter': 'LicenseShortName|Artist'})
            for p in q.get('query', {}).get('pages', {}).values():
                ii = (p.get('imageinfo') or [{}])[0]; md = ii.get('extmetadata', {})
                w, h = ii.get('width', 0), ii.get('height', 0)
                lic = (md.get('LicenseShortName', {}) or {}).get('value', '')
                if not (w >= 1600 and 1.25 <= w / max(1, h) <= 1.9 and OK_LIC.match(lic.strip())): continue
                art = re.sub('<[^>]+>', '', (md.get('Artist', {}) or {}).get('value', '')).strip()[:80] or 'Unknown'
                found.append({'title': p['title'], 'thumb': ii.get('thumburl'), 'page': ii.get('descriptionurl'), 'lic': lic, 'artist': art, 'w': w, 'h': h})
            if len(found) >= 6: break
        if len(found) >= 6: break
    with lock:
        cands[pid] = found[:6]; print(pid, len(found), flush=True)
        json.dump(cands, open(OUT + '/cands.json', 'w'), indent=1)
with ThreadPoolExecutor(2) as ex: list(ex.map(one, PLACES))
# thumbnails + contact sheets (one row per place, up to 6 candidates)
def thumb(url, path):
    if os.path.exists(path): return Image.open(path)
    for k in range(3):
        try:
            u = url.replace('thumb.wikimedia.org', 'upload.wikimedia.org').split('?')[0].replace('/1280px-', '/330px-')
            im = Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30).read())).convert('RGB')
            im.thumbnail((240, 160)); im.save(path, quality=80); return im
        except Exception: time.sleep(2)
    return Image.new('RGB', (240, 160), (60, 0, 0))
def th_all(pid):
    for c, cd in enumerate(cands.get(pid, [])[:6]): thumb(cd['thumb'], f'{OUT}/th/{pid}_{c}.jpg')
with ThreadPoolExecutor(3) as ex: list(ex.map(th_all, [p[0] for p in PLACES]))
ids = [p[0] for p in PLACES]
for s in range(0, len(ids), 12):
    rows = ids[s:s + 12]; sheet = Image.new('RGB', (180 + 6 * 250, len(rows) * 170), (10, 20, 30)); d = ImageDraw.Draw(sheet)
    for r, pid in enumerate(rows):
        d.text((6, r * 170 + 70), pid, fill=(255, 255, 255))
        for c, cd in enumerate(cands.get(pid, [])[:6]):
            im = thumb(cd['thumb'], f'{OUT}/th/{pid}_{c}.jpg'); sheet.paste(im, (180 + c * 250, r * 170 + 4)); d.text((184 + c * 250, r * 170 + 6), str(c), fill=(255, 255, 0))
    sheet.save(f'{OUT}/sheet_{s // 12:02d}.jpg', quality=80)
print('sheets done')
