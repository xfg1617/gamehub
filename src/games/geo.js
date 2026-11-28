    /* =========================================================================
       WHERE AM I? (Nov 2026, Inna: "add a guess-the-place game"; our own game, not any brand)
       A real photo of a place on Earth; drop a pin on the world map where you think it was taken. The closer, the more
       points (up to 5,000 a round). Solo, or 2-8 players on one table: everyone guesses the same photo at the same time
       (S.collect with change: you can move your pin and press GUESS again until the round closes), then every pin and
       the real spot are shown on the map.
       Photos: free-licence pictures from Wikimedia Commons, picked by tools/geo (credit shown under every photo),
       stored in assets/site/geo/<id>.jpg (the live site's /geo/). Map: Natural Earth (public domain): the small map is
       in geo_map.js; a sharper one (/geo/map50.json) loads on the live site.
       ========================================================================= */
    (function whereAmIGame() {
      const ABORT = { a: 1 };
      const BOTS = [['Luna', '🦉'], ['Bao', '🐻'], ['Minh', '🐸'], ['Kai', '🦈'], ['Mai', '🐼'], ['Leo', '🦁'], ['Nova', '🚀']];
      const COLS = ['#2DD4BF', '#FB7185', '#F5B041', '#A78BFA', '#34D399', '#7DD3FC', '#F472B6', '#FDE047'];
      // region: map view (x0, y0, w, h in map units: x = lon + 180, y = 90 - lat) and how forgiving the scoring is (km)
      const REG = {
        world: { v: [0, 8, 360, 150], km: 2000 }, usa: { v: [52, 20, 76, 46], km: 700 }, vietnam: { v: [276, 60, 38, 38], km: 220 },
        asia: { v: [212, 12, 150, 110], km: 1400 }, europe: { v: [158, 18, 70, 46], km: 550 },
      };
      const T = (en, vi) => (typeof LANG !== 'undefined' && LANG.code === 'vi' ? vi : en);
      const COUNTRY_VI = { USA: 'Mỹ', Vietnam: 'Việt Nam', Japan: 'Nhật Bản', 'South Korea': 'Hàn Quốc', Thailand: 'Thái Lan', Singapore: 'Singapore', Malaysia: 'Malaysia', Indonesia: 'Indonesia', Philippines: 'Philippines', China: 'Trung Quốc', Taiwan: 'Đài Loan', Cambodia: 'Campuchia', Laos: 'Lào', Nepal: 'Nepal', India: 'Ấn Độ', UAE: 'UAE', Turkey: 'Thổ Nhĩ Kỳ', Mongolia: 'Mông Cổ', Myanmar: 'Myanmar', France: 'Pháp', Italy: 'Ý', UK: 'Anh', Netherlands: 'Hà Lan', Spain: 'Tây Ban Nha', Portugal: 'Bồ Đào Nha', Greece: 'Hy Lạp', Czechia: 'Séc', Austria: 'Áo', Hungary: 'Hungary', Germany: 'Đức', Denmark: 'Đan Mạch', Sweden: 'Thụy Điển', Iceland: 'Iceland', Ireland: 'Ireland', Croatia: 'Croatia', Switzerland: 'Thụy Sĩ', Russia: 'Nga', Poland: 'Ba Lan', Belgium: 'Bỉ', Norway: 'Na Uy', Brazil: 'Brazil', Argentina: 'Argentina', Peru: 'Peru', Mexico: 'Mexico', Cuba: 'Cuba', Colombia: 'Colombia', Canada: 'Canada', Chile: 'Chile', Ecuador: 'Ecuador', Bolivia: 'Bolivia', Egypt: 'Ai Cập', Morocco: 'Ma-rốc', 'South Africa': 'Nam Phi', Kenya: 'Kenya', Tanzania: 'Tanzania', Zimbabwe: 'Zimbabwe', Jordan: 'Jordan', Israel: 'Israel', Ghana: 'Ghana', Senegal: 'Senegal', Ethiopia: 'Ethiopia', Australia: 'Úc', 'New Zealand': 'New Zealand', Fiji: 'Fiji', 'French Polynesia': 'Polynesia thuộc Pháp' };
      const $ = (id) => document.getElementById(id);
      let G = null;

      // ---------- engine (pure; tests use it) ----------
      const toXY = (lat, lon) => [lon + 180, 90 - lat];
      const toLL = (x, y) => [90 - y, x - 180];
      function km(a, b) {
        const R = 6371, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
      }
      const score = (d, region) => (d == null ? 0 : Math.max(0, Math.round(5000 * Math.exp(-d / (REG[region] || REG.world).km))));
      function pool(region) {
        const all = window.GEO_PLACES || [];
        const p = region === 'world' || !region ? all : all.filter((x) => x.region === region);
        return p.length >= 3 ? p : all;
      }
      // a computer player's guess: the real spot plus an error that depends on its level
      function botGuess(place, lvl, region) {
        const spread = [0, 2600, 900, 260][lvl] * ((REG[region] || REG.world).km / 2000) ** 0.6;
        const d = spread * (0.15 + Math.random() * 1.1), a = Math.random() * Math.PI * 2;
        const lat = Math.max(-80, Math.min(80, place.lat + (d * Math.cos(a)) / 111));
        const lon = place.lon + (d * Math.sin(a)) / (111 * Math.max(0.2, Math.cos((place.lat * Math.PI) / 180)));
        return { lat: +lat.toFixed(3), lon: +(((lon + 540) % 360) - 180).toFixed(3) };
      }
      const photoURL = (id) => (/^https?:$/.test(location.protocol) ? '/geo/' : /\/gamehub\.html$/.test(location.pathname) ? 'site/geo/' : 'geo/') + id + '.jpg';

      // ---------- setup ----------
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1500px] mx-auto');
        setupScreen(body, mod, [
          { key: 'region', label: 'WHERE IN THE WORLD', def: 'world', hero: true, hint: 'Which part of the world the photos come from. The whole world is hardest!', choices: [['world', '🌍 Whole world'], ['usa', '🇺🇸 USA'], ['vietnam', '🇻🇳 Vietnam'], ['asia', '🌏 Asia'], ['europe', '🏰 Europe']] },
          { key: 'rounds', label: 'ROUNDS', def: 5, choices: [[5, '5'], [8, '8'], [10, '10']] },
          { key: 'secs', label: 'TIME PER PHOTO', def: 60, choices: [[30, '30 sec'], [60, '60 sec'], [90, '90 sec']] },
          { key: 'n', label: 'PLAYERS', def: 1, choices: [[1, 'Just me'], [2, '2'], [3, '3'], [4, '4'], [6, '6'], [8, '8']] },
          { key: 'lvl', label: 'COMPUTER LEVEL', def: 2, local: true, choices: [[1, 'Tourist'], [2, 'Traveller'], [3, 'Explorer']] },
        ], (sel) => {
          const n = sel.net === 'here' ? 1 : Math.max(1, +sel.n || 1);
          start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(BOTS.slice(0, n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel));
        }, 'A photo from somewhere on Earth. Drop a pin where you think it was taken. The closer you are, the more points!');
      }
      function start(body, sel, S) {
        const region = REG[sel.region] ? sel.region : 'world';
        const rounds = Math.min(+sel.rounds || 5, 15);
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, col: COLS[i % COLS.length], pts: 0, best: null }));
        G = { S, sel, region, me: S.online ? S.me : 0, players, places: S.rng.shuffle(pool(region).slice()).slice(0, rounds), ri: -1, secs: +sel.secs || 60, lvl: +sel.lvl || 2,
          view: REG[region].v.slice(), pin: null, sent: false, got: {}, reveal: null, over: false, tok: ++GT.cur };
        GT.started = true; GT.over = false;
        body.innerHTML = `<div class="geo-wrap">
          <div class="geo-photo" id="geo-photo"><div class="geo-top"><span class="geo-pill pix" id="geo-round"></span><span class="geo-pill pix" id="geo-clock"></span></div>
            <div class="geo-img" id="geo-img"><img id="geo-pic" alt="Where is this?" draggable="false"></div>
            <div class="geo-zoomhint" id="geo-zh">${T('Tap the photo to zoom in · drag to look around', 'Chạm vào ảnh để phóng to · kéo để xem xung quanh')}</div>
            <div class="geo-credit" id="geo-credit"></div></div>
          <div class="geo-side"><div class="geo-mapbox" id="geo-mapbox"><svg id="geo-map" class="geo-map" xmlns="http://www.w3.org/2000/svg"></svg>
              <div class="geo-zbtns"><button id="geo-zin" aria-label="Zoom in">+</button><button id="geo-zout" aria-label="Zoom out">−</button><button id="geo-zall" aria-label="Whole map">⤢</button></div></div>
            <div class="geo-act"><span id="geo-msg" class="geo-msg"></span><button id="geo-go" class="btn-game btn-amber py-2.5 px-6 text-sm" disabled>${T('GUESS', 'ĐOÁN')}</button></div>
            <div class="geo-tags" id="geo-tags"></div></div>
          <div id="geo-log" class="logbox" style="height:120px"></div></div>`;
        S.track();
        S.onLeft = (a) => { if (!G) return; const p = G.players[a.s]; if (p) { p.name += ' (CPU)'; p.av = '🤖'; } tags(); };
        S.onCollect = (key, got) => { if (!G || key !== 'r' + G.ri) return; G.got = got; tags(); };
        npBar('');
        drawMap(); bindMap(); bindPhoto(); hiRes();
        run().catch((e) => { if (e !== ABORT) throw e; });
      }
      async function W(ms) { const t = G && G.tok; await gSleep(window.__fast ? Math.min(ms, 40) : ms); if (!G || G.tok !== t) throw ABORT; }
      const log = (h) => { const el = $('geo-log'); if (el) { el.insertAdjacentHTML('beforeend', `<div>${h}</div>`); el.scrollTop = el.scrollHeight; } };
      const fmtKm = (d) => (d == null ? '—' : d < 1 ? Math.round(d * 1000) + ' m' : d < 100 ? d.toFixed(1) + ' km' : Math.round(d).toLocaleString('en-US') + ' km');

      // ---------- the map: our own SVG, zoom + pan + tap to pin ----------
      // countries in soft colours, coast + borders, US states, and names (countries, seas, states, cities) that appear as you zoom in
      let MAP = null;   // window.GEO_MAP (geo_map.js, in the page) or the sharper /geo/map50.json on the live site
      const PAL = ['#E9DDB4', '#D5E2AE', '#EFCFA6', '#CBDFC4', '#E6CFC2'];
      function hiRes() {
        if (!/^https?:$/.test(location.protocol) || hiRes.done) return; hiRes.done = 1;
        fetch('/geo/map50.json').then((r) => (r.ok ? r.json() : null)).then((j) => { if (j && j.countries) { MAP = prep(j); if (G) drawMap(); } }).catch(() => {});
      }
      function prep(m) { m.byCol = PAL.map((_, c) => m.countries.filter((x) => x[1] === c).map((x) => x[0]).join('')); return m; }
      function mapData() { if (!MAP && window.GEO_MAP) MAP = prep(window.GEO_MAP); return MAP || { byCol: [], land: '', borders: '', states: '', labels: [], slabels: [] }; }
      const vi = () => typeof LANG !== 'undefined' && LANG.code === 'vi';
      function labelsSVG(v, ppd) {
        const M = mapData(), items = [], x0 = v[0], x1 = v[0] + v[2], y0 = v[1], y1 = v[1] + v[3];
        const cname = (n) => (vi() && window.GEO_VI && GEO_VI[n]) || (window.GEO_SHORT && GEO_SHORT[n]) || n;
        // countries: bigger ones first, a name only when the country is big enough on screen
        M.labels.forEach(([n, x, y, size]) => { if (size * ppd < 34) return; const px = Math.max(9, Math.min(15, 8 + (size * ppd) / 36));
          items.push({ t: cname(n).toUpperCase(), x, y, px, cls: 'c', pri: 1000 + size }); });
        (window.GEO_SEAS || []).forEach(([en, vn, lat, lon, tier]) => { if (ppd < [0, 2.4, 5][tier]) return; items.push({ t: vi() ? vn : en, x: lon + 180, y: 90 - lat, px: tier ? 11 : 13, cls: 's', pri: 900 - tier * 10 }); });
        if (ppd >= 6) M.slabels.forEach(([n, x, y, ab, size]) => { const full = size * ppd >= 46; if (!full && !(ab && ppd >= 12)) return; items.push({ t: full ? n : ab, x, y, px: 10, cls: 'st', pri: 500 + size }); });
        (window.GEO_CITIES || []).forEach(([n, lat, lon, tier]) => { if (ppd < [0, 2.6, 6.5, 15][tier]) return; items.push({ t: n, x: lon + 180, y: 90 - lat, px: tier === 1 ? 11 : 10, cls: 'ct', pri: 800 - tier * 100, dot: 1 }); });
        items.sort((a, b) => b.pri - a.pri);
        const placed = [], out = [];
        for (const it of items) {
          for (const sh of [0, 360, -360]) {
            const x = it.x + sh; if (x < x0 - 2 || x > x1 + 2 || it.y < y0 - 1 || it.y > y1 + 1) continue;
            const w = (it.t.length * it.px * (it.cls === 'c' ? 0.68 : 0.56) + (it.dot ? 6 : 0)) / ppd, h = (it.px + 2) / ppd;
            const bx = it.dot ? x - 3 / ppd : x - w / 2, by = it.y - h / 2;
            if (placed.some((p) => bx < p[0] + p[2] && bx + w > p[0] && by < p[1] + p[3] && by + h > p[1])) continue;
            placed.push([bx, by, w, h]);
            const fs = it.px / ppd, sw = 3 / ppd;
            if (it.dot) out.push(`<circle cx="${x}" cy="${it.y}" r="${2.4 / ppd}" fill="#050E18" stroke="#F7F4EC" stroke-width="${1 / ppd}"/><text class="gl ct" x="${x + 4.5 / ppd}" y="${it.y + fs * 0.35}" font-size="${fs}" stroke-width="${sw}">${esc(it.t)}</text>`);
            else out.push(`<text class="gl ${it.cls}" x="${x}" y="${it.y + fs * 0.35}" font-size="${fs}" stroke-width="${sw}" text-anchor="middle"${it.cls === 'c' ? ` letter-spacing="${0.8 / ppd}"` : ''}>${esc(it.t)}</text>`);
          }
        }
        return out.join('');
      }
      function drawMap() {
        const svg = $('geo-map'); if (!svg || !G) return;
        const M = mapData(), v = G.view, k = v[2] / 360, ppd = (svg.clientWidth || 600) / v[2];
        const pinG = (x, y, col, label, big) => `<g transform="translate(${x},${y}) scale(${k * (big ? 1.25 : 1)})"><path d="M0,0 L-3.2,-6 A3.6,3.6 0 1 1 3.2,-6 Z" fill="${col}" stroke="#050E18" stroke-width="1.1"/><circle cx="0" cy="-8.4" r="1.6" fill="#050E18"/>${label ? `<text x="0" y="-12.6" text-anchor="middle" font-size="5" font-family="Outfit" font-weight="800" fill="#F7F4EC" stroke="#050E18" stroke-width="1.2" paint-order="stroke">${esc(label)}</text>` : ''}</g>`;
        let marks = '';
        if (G.reveal) {
          const p = G.places[G.ri], [tx, ty] = toXY(p.lat, p.lon);
          G.players.forEach((q) => { const g = G.reveal.g[q.seat]; if (!g || g.lat == null) return; const [x, y] = toXY(g.lat, g.lon);
            marks += `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" stroke="${q.col}" stroke-width="${0.9 * k}" stroke-dasharray="${2.4 * k} ${1.6 * k}"/>`; });
          G.players.forEach((q) => { const g = G.reveal.g[q.seat]; if (!g || g.lat == null) return; const [x, y] = toXY(g.lat, g.lon); marks += pinG(x, y, q.col, q.seat === G.me ? T('YOU', 'BẠN') : q.name.slice(0, 10)); });
          marks += `<g transform="translate(${tx},${ty}) scale(${k * 1.3})"><rect x="-1" y="-14" width="1.6" height="14" fill="#050E18"/><path d="M0.6,-14 L9,-11 L0.6,-8 Z" fill="#34D399" stroke="#050E18" stroke-width="0.9"/><circle r="2" fill="#34D399" stroke="#050E18" stroke-width="0.9"/></g>`;
        } else if (G.pin) { const [x, y] = toXY(G.pin.lat, G.pin.lon); marks = pinG(x, y, G.players[G.me].col, '', true); }
        const grid = [];
        for (let x = 0; x <= 360; x += 30) grid.push(`M${x},0V180`);
        for (let y = 0; y <= 180; y += 30) grid.push(`M0,${y}H360`);
        svg.setAttribute('viewBox', v.join(' '));
        const lw = (px) => px / ppd;   // a line px wide on screen, whatever the zoom
        svg.innerHTML = `<rect x="-360" y="-90" width="1080" height="360" fill="#1D5C8C"/><path d="${grid.join('')}" stroke="#2C6EA0" stroke-width="${lw(0.8)}" fill="none"/>
          ${M.byCol.map((d, c) => `<path d="${d}" fill="${PAL[c]}"/>`).join('')}
          ${ppd >= 4 ? `<path d="${M.states}" fill="none" stroke="#A8936A" stroke-width="${lw(0.9)}" stroke-dasharray="${lw(3)} ${lw(2)}"/>` : ''}
          <path d="${M.borders}" fill="none" stroke="#7A6A48" stroke-width="${lw(1.1)}" stroke-linejoin="round"/><path d="${M.land}" fill="none" stroke="#050E18" stroke-width="${lw(1.3)}" stroke-linejoin="round"/>
          <g class="geo-labels">${labelsSVG(v, ppd)}</g>${marks}`;
      }
      function fit(v) {   // keep the view on the map and not smaller than ~a city
        v[2] = Math.max(3, Math.min(370, v[2])); v[3] = v[2] * G.aspect;     // the whole world always fits across (tall boxes get sea above / below)
        v[0] = Math.max(-10, Math.min(370 - v[2], v[0]));
        v[1] = v[3] >= 175 ? 90 - v[3] / 2 : Math.max(-5, Math.min(185 - v[3], v[1]));
        return v;
      }
      function zoomAt(f, cx, cy) {
        const v = G.view, nx = v[2] * f;
        if (cx == null) { cx = v[0] + v[2] / 2; cy = v[1] + v[3] / 2; }
        G.view = fit([cx - (cx - v[0]) * f, cy - (cy - v[1]) * f, nx, v[3] * f]); drawMap();
      }
      function bindMap() {
        const svg = $('geo-map'), box = $('geo-mapbox');
        const aspectNow = () => { const r = box.getBoundingClientRect(); G.aspect = r.width ? r.height / r.width : 0.62; G.view = fit(G.view); drawMap(); };
        aspectNow(); gOn(window, 'resize', aspectNow);
        const pt = (e) => { const r = svg.getBoundingClientRect(), v = G.view; return [v[0] + ((e.clientX - r.left) / r.width) * v[2], v[1] + ((e.clientY - r.top) / r.height) * v[3]]; };
        const ptrs = new Map(); let down = null, pinch = null;
        gOn(svg, 'pointerdown', (e) => { if (!G) return; svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
          if (ptrs.size === 1) down = { x: e.clientX, y: e.clientY, v: G.view.slice(), moved: false };
          else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), v: G.view.slice() }; down = null; } });
        gOn(svg, 'pointermove', (e) => { if (!G || !ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
          const r = svg.getBoundingClientRect();
          if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d > 10) { const f = pinch.d / d, c = pt({ clientX: (a[0] + b[0]) / 2, clientY: (a[1] + b[1]) / 2 }); G.view = pinch.v.slice(); zoomAt(f, c[0], c[1]); } return; }
          if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y;
          if (Math.abs(dx) + Math.abs(dy) > 6) down.moved = true;
          if (down.moved) { G.view = fit([down.v[0] - (dx / r.width) * down.v[2], down.v[1] - (dy / r.height) * down.v[3], down.v[2], down.v[3]]); drawMap(); } });
        const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
          if (down && !down.moved && e.type === 'pointerup') place(pt(e)); down = null; };
        gOn(svg, 'pointerup', up); gOn(svg, 'pointercancel', up);
        gOn(svg, 'wheel', (e) => { e.preventDefault(); const c = pt(e); zoomAt(e.deltaY > 0 ? 1.25 : 0.8, c[0], c[1]); }, { passive: false });
        gOn($('geo-zin'), 'click', () => zoomAt(0.6)); gOn($('geo-zout'), 'click', () => zoomAt(1.6));
        gOn($('geo-zall'), 'click', () => { G.view = fit(REG[G.region].v.slice()); drawMap(); });
        gOn($('geo-go'), 'click', () => send());
        gOn(document, 'keydown', (e) => { if (!G || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return; if ((e.key === 'Enter' || e.key === ' ') && G.pin && G.open) { e.preventDefault(); send(); } });
      }
      function place([x, y]) {
        if (!G || !G.open || !G.S.mine(G.me)) return;
        const [lat, lon] = toLL(x, y); if (lat < -85 || lat > 85) return;
        G.pin = { lat: +lat.toFixed(3), lon: +(((lon + 540) % 360) - 180).toFixed(3) }; SFX.play('click');
        const b = $('geo-go'); b.disabled = false; b.textContent = G.sent ? T('UPDATE GUESS', 'ĐỔI ĐÁP ÁN') : T('GUESS', 'ĐOÁN');
        drawMap();
      }
      function send() {
        if (!G || !G.open || !G.pin) return;
        G.sent = true; G.sentPin = G.pin; SFX.play('reveal');
        G.S.act({ t: 'guess', key: 'r' + G.ri, s: G.me, lat: G.pin.lat, lon: G.pin.lon, ms: Date.now() - G.t0 });
        const b = $('geo-go'); b.disabled = true; b.textContent = T('GUESSED ✓', 'ĐÃ ĐOÁN ✓');
        $('geo-msg').textContent = T('Locked in! You can still move your pin and guess again before time is up.', 'Đã chốt! Vẫn có thể dời ghim và đoán lại trước khi hết giờ.');
        tags();
      }
      // ---------- the photo: tap to zoom in, drag to look around ----------
      function bindPhoto() {
        const box = $('geo-img'), img = $('geo-pic'); let z = null, drag = null;
        const apply = () => { img.style.transform = z ? `translate(${z.x}px, ${z.y}px) scale(${z.s})` : ''; box.classList.toggle('zoomed', !!z); };
        gOn(box, 'pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, moved: false, z0: z && { ...z } }; box.setPointerCapture(e.pointerId); });
        gOn(box, 'pointermove', (e) => { if (!drag || !z) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
          const r = box.getBoundingClientRect(), lim = (s, w) => (w * (s - 1)) / 2;
          z.x = Math.max(-lim(z.s, r.width), Math.min(lim(z.s, r.width), drag.z0.x + dx)); z.y = Math.max(-lim(z.s, r.height), Math.min(lim(z.s, r.height), drag.z0.y + dy)); apply(); });
        gOn(box, 'pointerup', (e) => { const d = drag; drag = null; if (!d || d.moved) return;
          if (z) { z = null; apply(); return; }
          const r = box.getBoundingClientRect(), s = 2.4, cx = e.clientX - r.left - r.width / 2, cy = e.clientY - r.top - r.height / 2;
          z = { s, x: Math.max(-(r.width * (s - 1)) / 2, Math.min((r.width * (s - 1)) / 2, -cx * (s - 1))), y: Math.max(-(r.height * (s - 1)) / 2, Math.min((r.height * (s - 1)) / 2, -cy * (s - 1))) }; apply();
          const zh = $('geo-zh'); if (zh) zh.style.display = 'none'; });
        G.resetPhoto = () => { z = null; apply(); };
      }
      function tags() {
        const el = $('geo-tags'); if (!el || !G) return;
        el.innerHTML = G.players.slice().sort((a, b) => b.pts - a.pts).map((p) => {
          const r = G.reveal && G.reveal.res[p.seat], done = !G.reveal && (p.seat in G.got || (p.seat === G.me && G.sent));
          const sub = r ? `${fmtKm(r.d)} · +${r.pts.toLocaleString('en-US')}` : done ? '✓ ' + T('guessed', 'đã đoán') : G.open ? T('looking...', 'đang xem...') : '';
          return `<div id="geo-seat-${p.seat}" class="tg-seat geo-tag" style="--pc:${p.col}">${nameTag({ av: p.av, name: p.seat === G.me ? T('You', 'Bạn') : p.name, sub: `<b class="geo-pts">${p.pts.toLocaleString('en-US')}</b> <span class="geo-st">${sub}</span>`, me: p.seat === G.me })}</div>`;
        }).join('');
      }

      // ---------- the match ----------
      async function run() {
        for (G.ri = 0; G.ri < G.places.length; G.ri++) { await round(G.places[G.ri]); if (!G || G.over) return; }
        finish();
      }
      async function round(p) {
        const S = G.S, t = G.tok, key = 'r' + G.ri;
        G.got = {}; G.reveal = null; G.pin = null; G.sent = false; G.open = true; G.view = fit(REG[G.region].v.slice());
        $('geo-round').textContent = `${T('PHOTO', 'ẢNH')} ${G.ri + 1} / ${G.places.length}`;
        const img = $('geo-pic'); if (G.resetPhoto) G.resetPhoto();
        img.classList.remove('bad'); img.onerror = () => img.classList.add('bad'); img.src = photoURL(p.id);
        $('geo-credit').innerHTML = `📷 ${esc(p.by)} · ${esc(p.lic)} · <a href="${esc(p.src)}" target="_blank" rel="noopener">Wikimedia Commons</a>`;
        const go = $('geo-go'); go.disabled = true; go.textContent = T('GUESS', 'ĐOÁN');
        $('geo-msg').textContent = T('Tap the map to drop your pin. Zoom in for a closer guess!', 'Chạm vào bản đồ để cắm ghim. Phóng to để đoán chính xác hơn!');
        $('geo-mapbox').classList.remove('reveal'); drawMap(); tags();
        G.t0 = Date.now();
        const tick = gInterval(() => {
          if (!G || G.tok !== t) return;
          const left = Math.max(0, G.secs - (Date.now() - G.t0) / 1000), c = $('geo-clock'); if (c) { c.textContent = G.open ? Math.ceil(left) + 's' : ''; c.classList.toggle('low', left <= 10); }
          if (G.open && left < 0.8 && G.pin && (!G.sent || G.sentPin !== G.pin)) send();    // time's up: your pin counts
          if (G.open && left <= 5 && left > 0 && Math.ceil(left) !== G.lastTick) { G.lastTick = Math.ceil(left); SFX.play('tick'); }
        }, 100);
        const lvl = S.online ? (+(S.sel && S.sel.lvl) || 2) : G.lvl;
        const got = await S.collect(key, G.players.map((q) => q.seat), () => Object.assign({ t: 'guess', ms: 4000 + Math.floor(Math.random() * G.secs * 500) }, botGuess(p, lvl, G.region)),
          () => ({ t: 'guess', lat: null, lon: null, ms: G.secs * 1000 }), G.secs + 0.5, { change: window.__fast && !S.online ? 60 : 2500 });
        G.open = false; gClearInt(tick);
        if (!G || G.tok !== t) throw ABORT;
        // score everyone the same way on every screen
        const res = {}, g = {};
        G.players.forEach((q) => { const a = got[q.seat]; g[q.seat] = a && a.lat != null ? { lat: +a.lat, lon: +a.lon } : null;
          const d = g[q.seat] ? km([g[q.seat].lat, g[q.seat].lon], [p.lat, p.lon]) : null, pts = score(d, G.region);
          res[q.seat] = { d, pts }; q.pts += pts; if (d != null && (q.best == null || d < q.best)) q.best = d; });
        G.reveal = { g, res };
        // show it: zoom the map to the real spot and the pins
        const xs = [], ys = []; [[p.lat, p.lon]].concat(Object.values(g).filter(Boolean).map((x) => [x.lat, x.lon])).forEach(([la, lo]) => { const [x, y] = toXY(la, lo); xs.push(x); ys.push(y); });
        const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys), pad = Math.max(4, (maxx - minx) * 0.18, (maxy - miny) * 0.18);
        let w = Math.max(maxx - minx + pad * 2, (maxy - miny + pad * 2) / G.aspect, 10);
        G.view = fit([(minx + maxx) / 2 - w / 2, (miny + maxy) / 2 - (w * G.aspect) / 2, w, w * G.aspect]);
        $('geo-mapbox').classList.add('reveal'); drawMap();
        const mine = res[G.me], name = `<b>${esc(p.name)}</b>, ${esc(T(p.country, COUNTRY_VI[p.country] || p.country))}`;
        $('geo-msg').innerHTML = mine.d == null ? `${T("Time's up! It was", 'Hết giờ! Đây là')} ${name}.` : `${T('It was', 'Đây là')} ${name}. ${T('You were', 'Bạn cách')} <b>${fmtKm(mine.d)}</b> ${T('away', '')}: <b class="text-amber">+${mine.pts.toLocaleString('en-US')}</b>`;
        go.disabled = true; go.textContent = T('NEXT PHOTO...', 'ẢNH TIẾP...');
        SFX.play(mine.pts >= 4000 ? 'win' : mine.pts >= 1500 ? 'coin' : 'wrong');
        if (mine.d != null && mine.d < 25) funMoment('geo-seat-' + G.me, { key: 'spot' + G.ri, icon: '🎯', label: 'SPOT ON', burst: T('SPOT ON!', 'CHÍNH XÁC!'), sub: 'Within 25 km', mine: true });
        log(`📍 ${esc(p.name)}: ${G.players.map((q) => `${esc(q.name)} ${fmtKm(res[q.seat].d)} (+${res[q.seat].pts})`).join(' · ')}`);
        tags();
        await W(5200);
      }
      async function finish() {
        G.over = true; G.S.over = true;
        const S = G.S, me = G.players[G.me], tok = G.tok, solo = G.players.length === 1;
        const rank = G.players.slice().sort((a, b) => b.pts - a.pts), place = 1 + G.players.filter((q) => q.pts > me.pts).length;
        const max = G.places.length * 5000, res = solo ? (me.pts >= max * 0.5 ? 'win' : 'loss') : place === 1 ? 'win' : 'loss';
        const row = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        const s = gstat('geo'); s.bestScore = Math.max(s.bestScore || 0, me.pts); if (me.best != null) s.closest = Math.min(s.closest == null ? 1e9 : s.closest, Math.round(me.best));
        reportGame('geo', res, { place: solo ? undefined : place, solo, xp: 10 + Math.round(me.pts / 1000), label: `${me.pts.toLocaleString('en-US')} points` });
        gameResult({ title: solo ? `${me.pts.toLocaleString('en-US')} points!` : place === 1 ? 'You win!' : `You finished ${place}${['', 'st', 'nd', 'rd'][place] || 'th'}`,
          sub: solo ? `Out of ${max.toLocaleString('en-US')}` : rank.map((q, i) => `${i + 1}. ${q.seat === G.me ? 'You' : q.name} ${q.pts.toLocaleString('en-US')}`).join(' · '),
          tone: res === 'win' ? 'amber' : 'coral', sprite: res === 'win' ? 'trophy' : 'anchor',
          rows: [['Your score', me.pts.toLocaleString('en-US'), 'text-amber'], ['Closest guess', fmtKm(me.best), 'text-emerald']].concat(row ? [row] : []),
          againLabel: S.online ? 'Back to setup' : 'Play again', again: () => open($('game-root')) });
      }

      // ---------- tile icon: a globe with a red map pin ----------
      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      const GLOBE = ['.....KKKKKK.....', '...KKbbggbbKK...', '..KbbbgggbbbbK..', '.KbbbggggbbgbbK.', '.KbbbbgggbggbbK.', 'KbbbbbbgbbggbbbK', 'KbggbbbbbbbbbbbK', 'KbgggbbbbbbbggbK', 'KbbggbbbbbbgggbK', 'KbbbgbbbbbbbgbbK', '.KbbbbbbbbbbbbK.', '.KbbbbbggbbbbbK.', '..KbbbbggbbbbK..', '...KKbbbbbbKK...', '.....KKKKKK.....'];
      const PIN = ['.KKKK.', 'KrrrrK', 'KrwwrK', 'KrrrrK', '.KrrK.', '..KK..'];
      GICONS.geo = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(0, 0, 24, 24, '#0F2338')}${GLOBE.map((row, y) => [...row].map((c, x) => (c === 'K' ? rr(2 + x, 5 + y, 1, 1, K) : c === 'b' ? rr(2 + x, 5 + y, 1, 1, '#2B6FA8') : c === 'g' ? rr(2 + x, 5 + y, 1, 1, '#34D399') : '')).join('')).join('')}${PIN.map((row, y) => [...row].map((c, x) => (c === 'K' ? rr(13 + x, 2 + y, 1, 1, K) : c === 'r' ? rr(13 + x, 2 + y, 1, 1, '#FB7185') : c === 'w' ? rr(13 + x, 2 + y, 1, 1, '#F7F4EC') : '')).join('')).join('')}</svg>`;
      const mod = {
        id: 'geo', name: 'Where Am I?', icon: 'geo', cats: ['word', 'party'], sub: '1-8 PLAYERS · ~5 MIN', color: '#34D399', tone: 'teal', btn: 'teal', flag: 'NEW',
        blurb: 'A real photo from somewhere on Earth. Drop a pin where you think it was taken: the closer, the more points!',
        rules: { tag: 'GEOGRAPHY · 1-8 PLAYERS', steps: [
          '<strong class="text-bone">Look:</strong> a real photo from somewhere in the world. Tap it to zoom in and look for clues: signs, cars, plants, buildings, which side people drive on.',
          '<strong class="text-bone">Pin:</strong> tap the map where you think it is (zoom in for a closer guess), then press GUESS. You can move your pin and guess again until time is up.',
          '<strong class="text-bone">Score:</strong> up to 5,000 points a photo. The closer you are, the more you get.',
          '<strong class="text-bone">Win:</strong> the most points after all the photos wins.',
        ], tip: 'Look at the writing on signs, which side of the road cars drive on, and the plants and hills. They give away a lot!' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['BEST SCORE', (s.bestScore || 0).toLocaleString('en-US'), 'text-emerald'], ['CLOSEST', s.closest != null ? s.closest + ' km' : '—', 'text-teal']],
        engine: { km, score, botGuess, pool, toXY, toLL, get G() { return G; }, send: () => send(), place: (lat, lon) => { const [x, y] = toXY(lat, lon); place([x, y]); } },
        open, close() { G = null; },
        online: { seats: (sel) => Math.max(2, +sel.n || 4), min: 2, ranked: false, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
