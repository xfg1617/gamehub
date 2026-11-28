const topo = require('topojson-client'), fs = require('fs');
for (const res of ['110m', '50m']) {
  const t = JSON.parse(fs.readFileSync(`node_modules/world-atlas/countries-${res}.json`));
  const land = topo.feature(t, t.objects.land), borders = topo.mesh(t, t.objects.countries, (a, b) => a !== b);
  const step = res === '50m' ? 0.1 : 0.2;
  const P = (pt) => [Math.round((pt[0] + 180) / step) * step, Math.round((90 - pt[1]) / step) * step];
  const fmt = (q) => q[0].toFixed(2).replace(/\.?0+$/, '') + ',' + q[1].toFixed(2).replace(/\.?0+$/, '');
  // a ring that crosses the date line (far-east Russia, Fiji): keep it in one piece by unwrapping the longitudes, then
  // also draw a copy shifted by a whole world so the bit past the edge shows on the other side
  const ring = (r) => { let out = [], last = null; for (const p of r) { const q = P(p); const k = q.join(); if (k !== last) { out.push(q); last = k; } } if (out.length < 3) return '';
    for (let i = 1; i < out.length; i++) { while (out[i][0] - out[i - 1][0] > 180) out[i][0] -= 360; while (out[i][0] - out[i - 1][0] < -180) out[i][0] += 360; }
    const one = (dx) => 'M' + out.map((q) => fmt([q[0] + dx, q[1]])).join('L') + 'Z';
    const mx = Math.max(...out.map((q) => q[0])), mn = Math.min(...out.map((q) => q[0]));
    return one(0) + (mx > 360 ? one(-360) : '') + (mn < 0 ? one(360) : ''); };
  let d = ''; for (const f of land.features) { const g = f.geometry; const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; for (const poly of polys) for (const r of poly) d += ring(r); }
  let b = ''; const lines = borders.type === 'MultiLineString' ? borders.coordinates : [borders.coordinates];
  for (const l of lines) { let out = [], last = null; for (const p of l) { const q = P(p); const k = q.join(); if (k !== last) { out.push(q); last = k; } } if (out.length > 1) { b += 'M' + fmt(out[0]); for (let i = 1; i < out.length; i++) b += (Math.abs(out[i][0] - out[i - 1][0]) > 180 ? 'M' : 'L') + fmt(out[i]); } }
  fs.writeFileSync(`land_${res}.txt`, d); fs.writeFileSync(`borders_${res}.txt`, b);
  console.log(res, 'land', d.length, 'borders', b.length);
}
