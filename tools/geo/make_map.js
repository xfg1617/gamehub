// Builds the "Where Am I?" world map from Natural Earth (public domain) via world-atlas 2.0.2 + us-atlas 3.0.1 +
// topojson-client 3.1.0. Run in a folder where those npm packages are installed:
//   node make_map.js <out folder>   -> geo_map.js (in the page, 1:110m) and map50.json (live site, 1:50m)
// Output: land outline, country borders, one filled shape per country (4 soft colours, neighbours never share one),
// a label point per country (the spot deepest inside its biggest piece), US state borders + label points.
// Coordinates: x = lon + 180, y = 90 - lat (same as geo.js).
const topo = require('topojson-client'), fs = require('fs'), path = require('path');
const out = process.argv[2] || '.';
const SMALL_US = { 'Rhode Island': 'RI', Delaware: 'DE', Connecticut: 'CT', 'New Jersey': 'NJ', Maryland: 'MD', Massachusetts: 'MA', 'New Hampshire': 'NH', Vermont: 'VT', 'District of Columbia': 'DC' };

function build(res, usRes) {
  const t = JSON.parse(fs.readFileSync(`node_modules/world-atlas/countries-${res}.json`));
  const step = res === '50m' ? 0.1 : 0.2;
  const P = (pt) => [Math.round((pt[0] + 180) / step) * step, Math.round((90 - pt[1]) / step) * step];
  const fmt = (q) => q[0].toFixed(2).replace(/\.?0+$/, '') + ',' + q[1].toFixed(2).replace(/\.?0+$/, '');
  const unwrap = (r) => { let o = [], last = null; for (const p of r) { const q = P(p); const k = q.join(); if (k !== last) { o.push(q); last = k; } } if (o.length < 3) return null;
    for (let i = 1; i < o.length; i++) { while (o[i][0] - o[i - 1][0] > 180) o[i][0] -= 360; while (o[i][0] - o[i - 1][0] < -180) o[i][0] += 360; } return o; };
  const ringD = (o) => { const one = (dx) => 'M' + o.map((q) => fmt([q[0] + dx, q[1]])).join('L') + 'Z';
    const mx = Math.max(...o.map((q) => q[0])), mn = Math.min(...o.map((q) => q[0])); return one(0) + (mx > 360 ? one(-360) : '') + (mn < 0 ? one(360) : ''); };
  const area = (o) => { let a = 0; for (let i = 0, j = o.length - 1; i < o.length; j = i++) a += (o[j][0] + o[i][0]) * (o[j][1] - o[i][1]); return Math.abs(a / 2); };
  const inside = (x, y, o) => { let c = false; for (let i = 0, j = o.length - 1; i < o.length; j = i++) { const [xi, yi] = o[i], [xj, yj] = o[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const segD = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; let t = L ? ((x - a[0]) * dx + (y - a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); };
  // the point deepest inside a ring (a good place for its name)
  const labelPt = (o) => { const xs = o.map((q) => q[0]), ys = o.map((q) => q[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    let best = [(x0 + x1) / 2, (y0 + y1) / 2], bd = -1; const N = 28;
    for (let i = 1; i < N; i++) for (let j = 1; j < N; j++) { const x = x0 + ((x1 - x0) * i) / N, y = y0 + ((y1 - y0) * j) / N; if (!inside(x, y, o)) continue;
      let d = Infinity; for (let k = 0; k < o.length; k++) { d = Math.min(d, segD(x, y, o[k], o[(k + 1) % o.length])); if (d < bd) break; } if (d > bd) { bd = d; best = [x, y]; } }
    return [((best[0] % 360) + 360) % 360, best[1], bd]; };
  const polysOf = (g) => (g.type === 'Polygon' ? [g.arcs ? null : g.coordinates] : g.coordinates);
  // countries: fill shape + colour (greedy colouring over neighbours) + label point
  const geoms = t.objects.countries.geometries, nb = topo.neighbors(geoms), feats = geoms.map((g) => topo.feature(t, g));
  const order = geoms.map((_, i) => i).sort((a, b) => nb[b].length - nb[a].length), col = [];
  for (const i of order) { const used = new Set(nb[i].map((j) => col[j])); let c = 0; while (used.has(c)) c++; col[i] = c % 5; }
  const countries = [], labels = [];
  feats.forEach((f, i) => { const g = f.geometry; if (!g) return; const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; let d = '', big = null, bigA = 0, tot = 0;
    for (const poly of polys) poly.forEach((r, ri) => { const o = unwrap(r); if (!o) return; d += ringD(o); if (ri === 0) { const a = area(o); tot += a; if (a > bigA) { bigA = a; big = o; } } });
    if (!d) return; countries.push([d, col[i]]);
    const nm = (f.properties || {}).name; if (big && nm && nm !== 'Antarctica') { const [x, y, depth] = labelPt(big); labels.push([nm, +x.toFixed(2), +y.toFixed(2), +Math.sqrt(tot).toFixed(1), +depth.toFixed(2)]); } });
  const land = topo.merge(t, geoms); let ld = ''; for (const poly of land.coordinates) for (const r of poly) { const o = unwrap(r); if (o) ld += ringD(o); }
  const borders = topo.mesh(t, t.objects.countries, (a, b) => a !== b);
  const line = (mesh) => { let b = ''; for (const l of mesh.coordinates) { let o = [], last = null; for (const p of l) { const q = P(p); const k = q.join(); if (k !== last) { o.push(q); last = k; } } if (o.length > 1) { b += 'M' + fmt(o[0]); for (let i = 1; i < o.length; i++) b += (Math.abs(o[i][0] - o[i - 1][0]) > 180 ? 'M' : 'L') + fmt(o[i]); } } return b; };
  // US states (interior lines only + label points)
  const u = JSON.parse(fs.readFileSync('node_modules/us-atlas/states-10m.json'));
  const sstep = usRes; const PS = (pt) => [Math.round((pt[0] + 180) / sstep) * sstep, Math.round((90 - pt[1]) / sstep) * sstep];
  const sm = topo.mesh(u, u.objects.states, (a, b) => a !== b); let sd = '';
  for (const l of sm.coordinates) { let o = [], last = null; for (const p of l) { const q = PS(p); const k = q.join(); if (k !== last) { o.push(q); last = k; } } if (o.length > 1) sd += 'M' + o.map(fmt).join('L'); }
  const slabels = u.objects.states.geometries.map((g) => { const f = topo.feature(u, g), gg = f.geometry; const polys = gg.type === 'Polygon' ? [gg.coordinates] : gg.coordinates; let big = null, bigA = 0;
    for (const poly of polys) { const o = poly[0].map((p) => [p[0] + 180, 90 - p[1]]); const a = area(o); if (a > bigA) { bigA = a; big = o; } }
    const [x, y] = labelPt(big); const nm = f.properties.name; return [nm, +x.toFixed(2), +y.toFixed(2), SMALL_US[nm] || '', +Math.sqrt(bigA).toFixed(1)]; });
  return { land: ld, borders: line(borders), countries, labels, states: sd, slabels };
}
const small = build('110m', 0.1), big = build('50m', 0.04);
fs.writeFileSync(path.join(out, 'geo_map.js'), '/* World map for "Where Am I?": Natural Earth (public domain) via world-atlas 2.0.2 + us-atlas 3.0.1, built by tools/geo/make_map.js. x = lon + 180, y = 90 - lat. */\nwindow.GEO_MAP = ' + JSON.stringify(small) + ';\n');
fs.writeFileSync(path.join(out, 'map50.json'), JSON.stringify(big));
console.log('110m', JSON.stringify(small).length, '50m', JSON.stringify(big).length, 'countries', small.countries.length, 'labels', small.labels.length, 'states', small.slabels.length);
