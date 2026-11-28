#!/usr/bin/env python3
"""Check the street-view spots (tools/geo/streets.py) with Mapillary and write src/games/geo_streets.js.

  python3 tools/geo/check_streets.py            check every spot: keep the ones with a street view, remember the best
                                                picture (360 first, nearest the spot) so the game shows that one
  python3 tools/geo/check_streets.py --nocheck  just write the list (the live site then searches near each spot)

Needs graph.mapillary.com reachable with the network secret (header  Authorization: OAuth MLY|... ).
Spots that are kept but have no picture id still work: the server function searches up to ~2 km around them.
"""
import json, math, os, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from streets import STREETS

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(ROOT, 'src', 'games', 'geo_streets.js')
F = 'id,is_pano,computed_geometry,geometry,captured_at,sequence'


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'gamehub-geo-tool'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def metres(a, b):
    r = math.pi / 180
    x = (b[0] - a[0]) * r * math.cos((a[1] + b[1]) / 2 * r); y = (b[1] - a[1]) * r
    return math.hypot(x, y) * 6371000


def best(lat, lon):
    for d in (0.003, 0.008, 0.02):
        url = (f'https://graph.mapillary.com/images?fields={F}&limit=400'
               f'&bbox={lon - d:.5f},{lat - d:.5f},{lon + d:.5f},{lat + d:.5f}')
        try:
            data = get(url).get('data', [])
        except Exception as e:
            print('   error', e); time.sleep(2); continue
        data = [x for x in data if (x.get('computed_geometry') or x.get('geometry'))]
        if not data:
            continue
        g = lambda x: (x.get('computed_geometry') or x['geometry'])['coordinates']
        panos = [x for x in data if x.get('is_pano')]
        use = sorted(panos or data, key=lambda x: metres([lon, lat], g(x)))
        x = use[0]
        return {'img': x['id'], 'pano': bool(x.get('is_pano')), 'm': round(metres([lon, lat], g(x)))}
    return None


def main():
    nocheck = '--nocheck' in sys.argv
    out, found = [], 0
    for (i, name, country, region, lat, lon) in STREETS:
        row = {'id': i, 'name': name, 'country': country, 'region': region, 'lat': lat, 'lon': lon}
        if not nocheck:
            b = best(lat, lon)
            print(f'{i:12} {name[:30]:30}', b or 'NOTHING')
            if not b:
                continue
            found += 1
            row['img'] = b['img']
            if not b['pano']:
                row['flat'] = 1
        out.append(row)
    if not nocheck and found == 0:
        print('\nNo street views found anywhere: Mapillary is probably not accepting the key.\n'
              'The network secret must send   Authorization: OAuth MLY|...   (not Bearer). Nothing written.')
        sys.exit(1)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('/* Street-view spots for Where Am I? (made by tools/geo/check_streets.py from tools/geo/streets.py).\n'
                '   The live site asks /api/mly for a Mapillary view near each spot; img = the hand-checked picture. */\n')
        f.write('window.GEO_STREETS = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f'wrote {len(out)} spots' + ('' if nocheck else f' ({found} with a street view)'))


main()
