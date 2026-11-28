// Cloudflare Pages Function: street views for "Where Am I?" (Nov 2026, Inna chose Mapillary).
// The Mapillary key stays here on the server (Cloudflare → Pages → gamehub → Settings → Variables and Secrets:
// MAPILLARY_TOKEN, "Secret", the app's Client Token MLY|...). The page asks:
//   /api/mly?lat=..&lon=..&seed=N[&img=<id>]
// and gets one street view near that spot (360° when there is one) plus a few more pictures along the same street
// (the arrows in the game), or { ok: 0 } when there is nothing there (the game then shows a landmark photo).
// Mapillary picture links expire after a while, so they are fetched when a round starts, never stored in the page.
const OK_HOSTS = /(^|\.)gamehub\.us\.com$|(^|\.)gamehub-8w2\.pages\.dev$|^localhost$/;
const API = 'https://graph.mapillary.com';
const F = 'id,is_pano,thumb_2048_url,computed_geometry,geometry,computed_compass_angle,compass_angle,sequence,captured_at,creator';
const json = (o, status = 200, cache = 0) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': cache ? `public, max-age=${cache}` : 'no-store' } });

const geom = (im) => (im.computed_geometry || im.geometry || {}).coordinates || null;
function metres(a, b) {   // [lon, lat]
  const r = Math.PI / 180, x = (b[0] - a[0]) * r * Math.cos(((a[1] + b[1]) / 2) * r), y = (b[1] - a[1]) * r;
  return Math.sqrt(x * x + y * y) * 6371000;
}

export async function onRequestGet({ request, env }) {
  const from = request.headers.get('origin') || request.headers.get('referer') || '';
  let host = ''; try { host = new URL(from).hostname; } catch (e) {}
  if (!OK_HOSTS.test(host)) return json({ ok: 0, why: 'not allowed' }, 403);
  const key = (env.MAPILLARY_TOKEN || '').trim();
  if (!key) return json({ ok: 0, why: 'no key' });
  const u = new URL(request.url), lat = +u.searchParams.get('lat'), lon = +u.searchParams.get('lon');
  const seed = Math.abs(parseInt(u.searchParams.get('seed'), 10) || 0) % 4, img = (u.searchParams.get('img') || '').replace(/\D/g, '');
  if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 85 || Math.abs(lon) > 180) return json({ ok: 0, why: 'bad spot' }, 400);

  // the same spot + seed gives the same answer for 30 minutes (fewer calls to Mapillary)
  const cache = caches.default, ck = new Request(`https://mly.cache/${lat.toFixed(4)},${lon.toFixed(4)},${seed},${img}`);
  const hit = await cache.match(ck); if (hit) return hit;

  // Mapillary wants "Authorization: OAuth MLY|..." (a Bearer header is ignored and every search comes back empty)
  const get = async (path) => {
    const r = await fetch(API + path, { headers: { Authorization: 'OAuth ' + key.replace(/^(OAuth|Bearer)\s+/i, '') } });
    if (!r.ok) return null; try { return await r.json(); } catch (e) { return null; }
  };
  const box = (la, lo, d) => `/images?fields=${F}&limit=400&bbox=${(lo - d).toFixed(5)},${(la - d).toFixed(5)},${(lo + d).toFixed(5)},${(la + d).toFixed(5)}`;
  try {
    let pick = null, near = [];
    if (img) {   // a hand-checked view (tools/geo/check_streets.py)
      const im = await get(`/${img}?fields=${F}`);
      if (im && im.thumb_2048_url && geom(im)) { pick = im; const g = geom(im); const j = await get(box(g[1], g[0], 0.0025)); near = (j && j.data) || []; }
    }
    if (!pick) {
      for (const d of [0.003, 0.008, 0.02]) {
        const j = await get(box(lat, lon, d)); const list = ((j && j.data) || []).filter((x) => x.thumb_2048_url && geom(x));
        if (!list.length) continue;
        near = list;
        const panos = list.filter((x) => x.is_pano), use = (panos.length >= 1 ? panos : list).slice();
        use.sort((a, b) => metres([lon, lat], geom(a)) - metres([lon, lat], geom(b)) || (a.id < b.id ? -1 : 1));
        pick = use[Math.min(seed, use.length - 1)];
        break;
      }
    }
    if (!pick) { const res = json({ ok: 0, why: 'none' }, 200, 1800); await cache.put(ck, res.clone()); return res; }

    // the street: pictures of the same drive / walk, in order, at least ~10 m apart, up to 5 each way
    const seq = near.filter((x) => x.sequence === pick.sequence && x.thumb_2048_url && geom(x) && !!x.is_pano === !!pick.is_pano);
    if (!seq.some((x) => x.id === pick.id)) seq.push(pick);
    seq.sort((a, b) => (a.captured_at || 0) - (b.captured_at || 0) || (a.id < b.id ? -1 : 1));
    const at = seq.findIndex((x) => x.id === pick.id), keep = (dir) => {
      const out = []; let last = geom(pick);
      for (let i = at + dir; i >= 0 && i < seq.length && out.length < 5; i += dir) { const g = geom(seq[i]); if (metres(last, g) >= 10) { out.push(seq[i]); last = g; } }
      return out;
    };
    const walk = keep(-1).reverse().concat([pick], keep(1));
    const view = (x) => ({ id: x.id, u: x.thumb_2048_url, h: Math.round(+(x.computed_compass_angle != null ? x.computed_compass_angle : x.compass_angle) || 0) });
    const res = json({ ok: 1, pano: !!pick.is_pano, by: (pick.creator && pick.creator.username) || '', walk: walk.map(view), at: walk.indexOf(pick) }, 200, 1800);
    await cache.put(ck, res.clone());
    return res;
  } catch (e) { return json({ ok: 0, why: 'error' }); }
}
