    /* =========================================================================
       CASE FILES (Nov 2026, Inna: "detective cases, solve together with evidence"; prototype prototypes/round9/case-files.html)
       Co-op detective game for two. Detective A has THE SCENE (hotel map, searching, interviews), Detective B has THE
       RECORDS (logs, receipts, phone records, statements). Each sees only their own half; anything pinned to the shared
       EVIDENCE BOARD is seen by both. Some interview questions only unlock once the right clue is pinned. To close the
       case one partner proposes an accusation (who / how / why + 3 pieces of evidence) and the other agrees.
       Solo: one player holds both halves and switches between them.
       Every change is a table action (apply), so both screens stay the same and a rejoin rebuilds the board.
       Cases live in case_NNN.js (window.CASE_DEFS).
       ========================================================================= */
    (function caseFilesGame() {
      const T = (en, vi) => (typeof LANG !== 'undefined' && LANG.code === 'vi' ? vi : en);
      const $ = (s) => document.querySelector(s);
      let G = null, CASES = null;
      // ---------- pixel art (our own) ----------
      const PAL = { k: '#050E18', w: '#F7F4EC', s: '#E8B48C', S: '#C68A62', d: '#8D5A3B', r: '#B0362A', y: '#F5B041', g: '#6B7A8C', b: '#2B6FA8', t: '#2DD4BF', c: '#FB7185', n: '#4B2E1E', h: '#2A2A2A', o: '#D9A441', p: '#7A4FA0', e: '#1B1B1B', m: '#9DB4CC', l: '#3A7D44', z: '#C0C7D0' };
      function pixSVG(rows, extra) {
        const P = Object.assign({}, PAL, extra || {}); let out = '';
        rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') out += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${P[ch] || ch}"/>`; }));
        return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
      }
      function face(hair, skin, cloth, style) {
        const H = { short: ['....HHHHHHHH....', '...HHHHHHHHHH...', '...HHFFFFFFHH...'], long: ['....HHHHHHHH....', '...HHHHHHHHHH...', '..HHHFFFFFFHHH..'],
          bald: ['................', '.....FFFFFF.....', '....FFFFFFFF....'], bun: ['......HHHH......', '....HHHHHHHH....', '...HHFFFFFFHH...'] }[style];
        const side = style === 'long' ? 'HH' : '..';
        const rows = ['................', H[0], H[1], H[2], `..${side[0]}FFFFFFFFFF${side[1]}..`, '...FFkFFFFkFF...', '...FFFFFFFFFF...', '...FFFFSSFFFF...', '....FFFFFFFF....', '....FFrrrrFF....', '.....FFFFFF.....', '......FFFF......', '...CCCCCCCCCC...', '..CCCCCCCCCCCC..', '.CCCCCCCCCCCCCC.', '.CCCCCCCCCCCCCC.'];
        return pixSVG(rows.map((r) => r.padEnd(16, '.').slice(0, 16)), { H: hair, F: skin, C: cloth });
      }
      const ICON = {
        key: ['......kkkk..', '.....kyyyyk.', '.....ky..yk.', '.....kyyyyk.', '......kyk...', '......kyk...', '......kyyk..', '......kyk...', '......kyyk..', '......kkk...', '............', '............'],
        shoe: ['............', '...kk.......', '..kddk......', '..kddk......', '..kdddk.....', '..kddddkkk..', '..kddddddk..', '..kkkkkkkk..', '..k.k.k.k...', '............', '............', '............'],
        card: ['............', 'kkkkkkkkkkk.', 'kwwwwwwwwwk.', 'kwrrrwwwwwk.', 'kwwwwwwwwwk.', 'kwgggggggwk.', 'kwgggggwwwk.', 'kwwwwwwwwwk.', 'kkkkkkkkkkk.', '............', '............', '............'],
        log: ['.kkkkkkkkk..', '.kwwwwwwwk..', '.kwgggggwk..', '.kwwwwwwwk..', '.kwgggggwk..', '.kwwwwwwwk..', '.kwyyyyywk..', '.kwwwwwwwk..', '.kwgggggwk..', '.kwwwwwwwk..', '.kkkkkkkkk..', '............'],
        phone: ['...kkkkkk...', '...kmmmmk...', '...kmttmk...', '...kmmmmk...', '...kmccmk...', '...kmmmmk...', '...kmttmk...', '...kmmmmk...', '...kkwwkk...', '...kkkkkk...', '............', '............'],
        bolt: ['......kkk...', '.....kyyk...', '....kyyk....', '...kyyyyyk..', '....kkyyk...', '.....kyk....', '....kyk.....', '....kk......', '............', '............', '............', '............'],
        glass: ['............', '..kkkkkkkk..', '..kzzzzzzk..', '..kz....zk..', '..kz....zk..', '..kz....zk..', '..kzzzzzzk..', '..kddddddk..', '..kkkkkkkk..', '............', '............', '............'],
        door: ['..kkkkkkk...', '..knnnnnk...', '..kndddnk...', '..kndddnk...', '..knnnnyk...', '..kndddnk...', '..kndddnk...', '..knnnnnk...', '..kkkkkkk...', '............', '............', '............'],
        cart: ['............', '.kkkkkkkk...', '.kwwwwwwk...', '.kmmmmmmk.k.', '.kwwwwwwkkk.', '.kmmmmmmk...', '.kkkkkkkk...', '..k....k....', '.kkk..kkk...', '............', '............', '............'],
        glassdrink: ['............', '..kkkkkk....', '..koooook...', '..kooooook..', '...kooook...', '....kook....', '.....kk.....', '.....kk.....', '...kkkkkk...', '............', '............', '............'],
        heel: ['............', '.....kk.....', '....kcck....', '...kccck....', '..kccck.....', '..kcck......', '..kkkk..kk..', '........kk..', '............', '............', '............', '............'],
        gen: ['............', '.kkkkkkkkkk.', '.kggggggggk.', '.kgkkgggggk.', '.kgkkggyygk.', '.kggggggggk.', '.kggggggggk.', '.kkkkkkkkkk.', '..kk....kk..', '............', '............', '............'],
        pen: ['............', '.kkkkkkkkk..', '.kwwwwwwwk..', '.kwggggwwk..', '.kwwwwwwwk..', '.kwggwwwwk..', '.kwwwwwwkr..', '.kwwwwwkry..', '.kkkkkkkk...', '............', '............', '............'],
      };
      const icon = (n) => pixSVG((ICON[n] || ICON.log).map((r) => r.padEnd(12, '.')));
      // ---------- room pictures: every object is drawn from simple shapes (our own art) ----------
      const INK = '#050E18';
      const R = (x, y, w, h, f, o) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${o === 0 ? '' : `stroke="${INK}" stroke-width="${o || 3}"`}/>`;
      const ART = {
        shelf: (x, y, w, h) => R(x, y, w, h, '#6B4423') + [0, 1, 2, 3].map((r) => { const yy = y + 8 + r * (h - 16) / 4; return R(x + 6, yy + (h - 16) / 4 - 6, w - 12, 5, '#3E2614', 0) + Array.from({ length: Math.floor((w - 16) / 10) }, (_, i) => R(x + 9 + i * 10, yy + 4, 8, (h - 16) / 4 - 10, ['#B0362A', '#2B6FA8', '#F5B041', '#3A7D44', '#7A4FA0'][(i + r * 2) % 5], 1)).join(''); }).join(''),
        painting: (x, y, w, h) => R(x, y, w, h, '#C9A227') + R(x + 8, y + 8, w - 16, h - 16, '#7DB8E0', 2) + R(x + 8, y + h * 0.55, w - 16, h * 0.45 - 8, '#3E7A44', 0) + R(x + w * 0.35, y + h * 0.3, w * 0.3, h * 0.3, '#F1E7CF', 2),
        case: (x, y, w, h) => R(x + 10, y + h * 0.55, w - 20, h * 0.45, '#5A3A22') + `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.55}" fill="rgba(200,230,255,.35)" stroke="${INK}" stroke-width="3"/>` + R(x + w * 0.4, y + h * 0.3, w * 0.2, h * 0.12, '#3E2614', 1) + `<path d="M${x + 6},${y + 8} l14,0 M${x + 6},${y + 14} l8,0" stroke="#fff" stroke-width="2"/>`,
        rug: (x, y, w, h) => R(x, y, w, h, '#8A2E2E') + R(x + 8, y + 8, w - 16, h - 16, '#B0503A', 2) + Array.from({ length: 6 }, (_, i) => `<path d="M${x + 30 + i * (w - 60) / 5},${y + 16} l0,${h - 32}" stroke="#E9C46A" stroke-width="2"/>`).join(''),
        glassdoor: (x, y, w, h) => R(x, y, w, h, '#6B4423') + R(x + 8, y + 8, w - 16, h * 0.7, '#2B3E5A', 2) + `<path d="M${x + w / 2},${y + 8} l0,${h * 0.7} M${x + 8},${y + 8 + h * 0.35} l${w - 16},0" stroke="${INK}" stroke-width="3"/>` + R(x + w - 18, y + h * 0.78, 8, 8, '#F5B041', 1) + `<path d="M${x + 14},${y + 20} l4,10 M${x + 30},${y + 40} l3,10 M${x + 55},${y + 26} l4,10" stroke="#7DB8E0" stroke-width="2"/>`,
        armchair: (x, y, w, h) => R(x, y + h * 0.15, w, h * 0.7, '#7A2E3A') + R(x + w * 0.15, y, w * 0.7, h * 0.5, '#8E3A48') + R(x + w * 0.15, y + h * 0.5, w * 0.7, h * 0.3, '#A04A58') + R(x + 6, y + h * 0.85, 8, h * 0.15, '#3E2614', 1) + R(x + w - 14, y + h * 0.85, 8, h * 0.15, '#3E2614', 1),
        fireplace: (x, y, w, h) => R(x, y, w, h, '#9A8A7A') + R(x + w * 0.2, y + h * 0.35, w * 0.6, h * 0.65, '#1B1B1B') + R(x - 6, y, w + 12, 12, '#6B4423') + R(x + w * 0.3, y + h * 0.85, w * 0.4, 6, '#5A5A5A', 1),
        desk: (x, y, w, h) => R(x, y, w, h * 0.3, '#8A5A2B') + R(x + 6, y + h * 0.3, 10, h * 0.7, '#6B4423') + R(x + w - 16, y + h * 0.3, 10, h * 0.7, '#6B4423') + R(x + w * 0.3, y - 10, w * 0.3, 10, '#F1E7CF', 2),
        path: (x, y, w, h) => `<path d="M${x},${y + h} C${x + w * 0.3},${y} ${x + w * 0.6},${y + h} ${x + w},${y}" stroke="${INK}" stroke-width="${h * 0.55}" fill="none"/><path d="M${x},${y + h} C${x + w * 0.3},${y} ${x + w * 0.6},${y + h} ${x + w},${y}" stroke="#6B4A2A" stroke-width="${h * 0.45}" fill="none"/>` + Array.from({ length: 7 }, (_, i) => R(x + 30 + i * (w - 60) / 6, y + h * 0.35 + ((i % 2) ? 10 : -6), 8, 5, '#3E2614', 0)).join(''),
        bench: (x, y, w, h) => R(x, y + h * 0.3, w, h * 0.2, '#8A5A2B') + R(x, y, w, h * 0.15, '#8A5A2B') + R(x + 8, y + h * 0.5, 8, h * 0.5, '#3E2614', 1) + R(x + w - 16, y + h * 0.5, 8, h * 0.5, '#3E2614', 1),
        awning: (x, y, w, h) => Array.from({ length: 8 }, (_, i) => R(x + i * w / 8, y, w / 8, h * 0.7, i % 2 ? '#F7F4EC' : '#B0362A', 2)).join('') + R(x + w * 0.75, y + h * 0.7, 10, h, '#FB7185', 1),
        pot: (x, y, w, h) => R(x + w * 0.15, y + h * 0.45, w * 0.7, h * 0.55, '#B0503A') + R(x + w * 0.1, y, w * 0.25, h * 0.45, '#3A7D44', 1) + R(x + w * 0.4, y + h * 0.05, w * 0.25, h * 0.4, '#3A7D44', 1) + R(x + w * 0.2, y - 6, 10, 10, '#FB7185', 1) + R(x + w * 0.55, y - 4, 10, 10, '#FB7185', 1),
        lamp: (x, y, w, h) => R(x + w * 0.35, y + h * 0.2, w * 0.3, h * 0.8, '#2A2A2A') + R(x, y, w, h * 0.2, '#C0C7D0'),
        statue: (x, y, w, h) => R(x + w * 0.1, y + h * 0.8, w * 0.8, h * 0.2, '#6B7A8C') + R(x + w * 0.3, y + h * 0.1, w * 0.4, h * 0.7, '#9AA6A0') + R(x + w * 0.35, y, w * 0.3, h * 0.18, '#9AA6A0') + R(x + w * 0.2, y + h * 0.3, w * 0.15, h * 0.2, '#3A7D44', 1),
        stairs: (x, y, w, h) => Array.from({ length: 8 }, (_, i) => R(x + i * w / 10, y + h - (i + 1) * h / 8, w - i * w / 10, h / 8, i % 2 ? '#4A4A52' : '#5A5A62', 2)).join('') + `<path d="M${x},${y + h} L${x + w * 0.8},${y}" stroke="#C0C7D0" stroke-width="3"/>`,
        stage: (x, y, w, h) => R(x, y + h * 0.6, w, h * 0.4, '#5A3A22') + R(x + w * 0.45, y, 6, h * 0.6, '#2A2A2A', 1) + R(x + w * 0.4, y - 8, 18, 14, '#C0C7D0'),
        table: (x, y, w, h) => R(x, y, w, h * 0.35, '#F1E7CF') + R(x + 10, y + h * 0.35, 10, h * 0.65, '#6B4423') + R(x + w - 20, y + h * 0.35, 10, h * 0.65, '#6B4423') + R(x + w * 0.4, y - 26, w * 0.2, 26, '#F7D7E3') + Array.from({ length: 5 }, (_, i) => R(x + w * 0.42 + i * 8, y - 34, 3, 8, '#F5B041', 0)).join(''),
        piano: (x, y, w, h) => R(x, y, w, h * 0.7, '#1B1B1B') + R(x + 8, y + h * 0.45, w - 16, h * 0.12, '#F7F4EC', 1) + Array.from({ length: 8 }, (_, i) => R(x + 14 + i * (w - 28) / 8, y + h * 0.45, 4, h * 0.07, INK, 0)).join('') + R(x + 8, y + h * 0.7, 10, h * 0.3, '#1B1B1B') + R(x + w - 18, y + h * 0.7, 10, h * 0.3, '#1B1B1B'),
        window: (x, y, w, h) => R(x, y, w, h, '#6B4423') + R(x + 6, y + 6, w - 12, h - 12, '#1D3E5E', 2) + `<path d="M${x + w / 2},${y + 6} l0,${h - 12} M${x + 6},${y + h / 2} l${w - 12},0" stroke="${INK}" stroke-width="3"/>` + `<path d="M${x + 16},${y + 14} l3,9 M${x + w - 24},${y + 20} l3,9" stroke="#7DB8E0" stroke-width="2"/>`,
        coatrack: (x, y, w, h) => R(x + w * 0.42, y, w * 0.16, h, '#6B4423') + R(x, y + h * 0.95, w, 8, '#6B4423') + R(x + 2, y + 14, w * 0.4, h * 0.4, '#2B4C7A', 2) + R(x + w * 0.58, y + 20, w * 0.38, h * 0.35, '#7A2E3A', 2),
        counter: (x, y, w, h) => R(x, y, w, h * 0.25, '#8A5A2B') + R(x + 10, y + h * 0.25, w - 20, h * 0.75, '#5A3A22') + Array.from({ length: 5 }, (_, i) => R(x + 30 + i * (w - 60) / 4, y + h * 0.4, 30, h * 0.5, '#4A2E1A', 2)).join(''),
        glasses: (x, y, w, h) => R(x + 4, y + 4, 18, h - 4, 'rgba(240,200,120,.5)', 2) + R(x + 28, y + 6, 18, h - 6, 'rgba(240,200,120,.5)', 2) + R(x + 52, y + 4, 18, h - 4, 'rgba(240,200,120,.5)', 2) + R(x + w - 26, y + h - 14, 24, 14, '#F7F4EC', 1),
        bottles: (x, y, w, h) => R(x, y + h * 0.45, w, 8, '#6B4423') + R(x, y + h - 8, w, 8, '#6B4423') + Array.from({ length: 9 }, (_, i) => R(x + 8 + i * (w - 20) / 9, y + (i % 2 ? 6 : 14), 12, h * 0.4 - (i % 2 ? 0 : 8), ['#3A7D44', '#8A2E2E', '#C9A227', '#2B6FA8'][i % 4], 1)).join('') + Array.from({ length: 7 }, (_, i) => R(x + 12 + i * (w - 24) / 7, y + h * 0.55 + 6, 14, h * 0.32, ['#C9A227', '#3A7D44', '#8A2E2E'][i % 3], 1)).join(''),
        register: (x, y, w, h) => R(x, y + h * 0.35, w, h * 0.65, '#4A4A52') + R(x + w * 0.2, y, w * 0.6, h * 0.4, '#2A2A2A') + R(x + w * 0.28, y + 6, w * 0.44, h * 0.18, '#34D399', 1),
        jukebox: (x, y, w, h) => `<path d="M${x},${y + h} L${x},${y + w / 2} A${w / 2},${w / 2} 0 0 1 ${x + w},${y + w / 2} L${x + w},${y + h} Z" fill="#B0362A" stroke="${INK}" stroke-width="3"/>` + R(x + w * 0.2, y + h * 0.35, w * 0.6, h * 0.3, '#F5B041', 2) + R(x + w * 0.2, y + h * 0.75, w * 0.6, h * 0.12, '#2A2A2A', 2),
        bin: (x, y, w, h) => R(x, y + 6, w, h - 6, '#6B7A8C') + R(x - 4, y, w + 8, 8, '#4A4A52'),
        stove: (x, y, w, h) => R(x, y, w, h, '#C0C7D0') + R(x + 10, y + h * 0.45, w - 20, h * 0.45, '#4A4A52', 2) + R(x + 14, y - 22, w * 0.35, 22, '#6B7A8C') + R(x + w * 0.55, y - 18, w * 0.3, 18, '#6B7A8C'),
        fridge: (x, y, w, h) => R(x, y, w, h, '#E8EEF2') + `<path d="M${x},${y + h * 0.35} l${w},0" stroke="${INK}" stroke-width="3"/>` + R(x + w - 16, y + 16, 6, 30, '#6B7A8C', 1) + R(x + w - 16, y + h * 0.45, 6, 40, '#6B7A8C', 1),
        sink: (x, y, w, h) => R(x, y + h * 0.3, w, h * 0.7, '#C0C7D0') + R(x + 10, y + h * 0.3, w - 20, h * 0.25, '#7DB8E0', 2) + R(x + w / 2 - 4, y, 8, h * 0.3, '#6B7A8C', 1),
        backdoor: (x, y, w, h) => R(x, y, w, h, '#5A3A22') + R(x + w * 0.2, y + h * 0.45, w * 0.6, 10, '#C0C7D0') + R(x + w - 18, y + h * 0.55, 8, 8, '#F5B041', 1),
        shelfbox: (x, y, w, h) => R(x, y + h - 8, w, 8, '#6B4423') + R(x, y + h * 0.45, w, 8, '#6B4423') + Array.from({ length: 5 }, (_, i) => R(x + 6 + i * (w - 12) / 5, y + (i % 2 ? h * 0.5 + 8 : 6), (w - 12) / 5 - 6, h * 0.35, ['#C9A227', '#9DB4CC', '#B0503A', '#F1E7CF', '#3A7D44'][i], 2)).join(''),
        cart: (x, y, w, h) => R(x, y, w, h * 0.75, '#C0C7D0') + R(x + 6, y + 6, w - 12, h * 0.3, '#F7F4EC', 2) + R(x + 6, y + h * 0.4, w - 12, h * 0.3, '#9DB4CC', 2) + `<circle cx="${x + 16}" cy="${y + h - 8}" r="8" fill="#2A2A2A" stroke="${INK}" stroke-width="2"/><circle cx="${x + w - 16}" cy="${y + h - 8}" r="8" fill="#2A2A2A" stroke="${INK}" stroke-width="2"/>` + R(x + w - 6, y - 26, 6, 30, '#6B7A8C', 1) + Array.from({ length: 4 }, (_, i) => R(x + w - 2 + (i % 2) * 6, y - 22 + i * 6, 5, 9, '#F5B041', 1)).join(''),
        door: (x, y, w, h, it) => R(x, y, w, h, '#8A5A2B') + R(x + 8, y + 10, w - 16, h * 0.35, '#6B4423', 2) + R(x + 8, y + h * 0.52, w - 16, h * 0.38, '#6B4423', 2) + R(x + w - 18, y + h * 0.45, 8, 8, '#F5B041', 1) + (it.label ? `<rect x="${x + w / 2 - 18}" y="${y - 20}" width="36" height="16" fill="#F1E7CF" stroke="${INK}" stroke-width="2"/><text x="${x + w / 2}" y="${y - 7}" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="12" fill="${INK}">${it.label}</text>` : ''),
        outdoor: (x, y, w, h) => R(x, y, w, h, '#6B7A8C') + R(x + 8, y + 8, w - 16, h - 40, '#1D3E5E', 2) + R(x + 4, y + h - 14, w - 8, 14, '#6B4A2A', 2) + R(x + 14, y + h - 10, 10, 6, '#3E2614', 0) + R(x + 40, y + h - 10, 10, 6, '#3E2614', 0),
        extinguisher: (x, y, w, h) => R(x, y + h * 0.2, w, h * 0.8, '#B0362A') + R(x + w * 0.25, y, w * 0.5, h * 0.22, '#2A2A2A'),
        bed: (x, y, w, h) => R(x, y + h * 0.35, w, h * 0.5, '#F1E7CF') + R(x, y, w * 0.12, h, '#6B4423') + R(x + w * 0.14, y + h * 0.4, w * 0.25, h * 0.2, '#F7F4EC', 2) + R(x + w * 0.42, y + h * 0.35, w * 0.58, h * 0.5, '#2B4C7A'),
        nightstand: (x, y, w, h) => R(x, y + h * 0.3, w, h * 0.7, '#8A5A2B') + R(x + w * 0.25, y + h * 0.05, w * 0.5, h * 0.25, '#F7F4EC', 2) + R(x + w * 0.3, y + h * 0.1, w * 0.4, 4, '#FB7185', 0),
        closet: (x, y, w, h) => R(x, y, w, h, '#8A5A2B') + `<path d="M${x + w / 2},${y} l0,${h}" stroke="${INK}" stroke-width="3"/>` + R(x + w / 2 - 12, y + h * 0.45, 6, 18, '#F5B041', 1) + R(x + w / 2 + 6, y + h * 0.45, 6, 18, '#F5B041', 1),
        bathdoor: (x, y, w, h) => R(x, y, w, h, '#E8EEF2') + R(x + w - 14, y + h * 0.5, 7, 7, '#6B7A8C', 1),
        generator: (x, y, w, h) => R(x, y, w, h, '#F5B041') + R(x + 10, y + 10, w * 0.5, h * 0.45, '#4A4A52', 2) + R(x + w * 0.7, y + 14, w * 0.2, h * 0.6, '#2A2A2A', 2) + Array.from({ length: 4 }, (_, i) => R(x + 16, y + 18 + i * 12, w * 0.4, 4, '#2A2A2A', 0)).join('') + R(x + w * 0.66, y - 18, 30, 18, '#C0C7D0'),
        washer: (x, y, w, h) => R(x, y, w, h, '#E8EEF2') + `<circle cx="${x + w / 2}" cy="${y + h * 0.58}" r="${w * 0.3}" fill="#7DB8E0" stroke="${INK}" stroke-width="3"/>` + R(x + 8, y + 8, w * 0.4, 10, '#9DB4CC', 1),
        baskets: (x, y, w, h) => R(x, y + h * 0.3, w * 0.45, h * 0.7, '#C9A227') + R(x + w * 0.55, y + h * 0.3, w * 0.45, h * 0.7, '#C9A227') + R(x + 6, y + h * 0.15, w * 0.35, h * 0.25, '#F7F4EC', 2) + R(x + w * 0.6, y + h * 0.1, w * 0.35, h * 0.3, '#7DB8E0', 2),
        fusebox: (x, y, w, h) => R(x, y, w, h, '#9DB4CC') + Array.from({ length: 6 }, (_, i) => R(x + 10 + (i % 3) * (w - 20) / 3, y + 14 + Math.floor(i / 3) * h * 0.4, 10, h * 0.25, i === 0 ? '#B0362A' : '#2A2A2A', 1)).join(''),
      };
      const FLOOR = {
        wood: (c) => R(0, 150, 600, 190, c, 0) + Array.from({ length: 7 }, (_, i) => `<path d="M0,${170 + i * 26} L600,${170 + i * 26}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>`).join(''),
        tile: (c) => R(0, 150, 600, 190, c, 0) + Array.from({ length: 12 }, (_, i) => `<path d="M${i * 50},150 L${i * 50},340" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`).join('') + Array.from({ length: 4 }, (_, i) => `<path d="M0,${150 + i * 48} L600,${150 + i * 48}" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`).join(''),
        grass: (c) => R(0, 150, 600, 190, c, 0) + Array.from({ length: 60 }, (_, i) => R((i * 97) % 600, 160 + (i * 53) % 170, 3, 6, '#2F5E34', 0)).join(''),
        carpet: (c) => R(0, 150, 600, 190, c, 0) + Array.from({ length: 40 }, (_, i) => R((i * 61) % 600, 160 + (i * 37) % 170, 10, 4, 'rgba(255,255,255,.08)', 0)).join(''),
        stone: (c) => R(0, 150, 600, 190, c, 0) + Array.from({ length: 24 }, (_, i) => R((i % 6) * 100 + (Math.floor(i / 6) % 2) * 50, 150 + Math.floor(i / 6) * 48, 100, 48, 'none', 2)).join(''),
      };
      const FLAT = ['rug', 'path', 'counter'];   // drawn first, so furniture stands on them
      function roomSVG(room, looked) {
        const wall = room.fl === 'grass' ? `<rect x="0" y="0" width="600" height="150" fill="${room.wall}"/>` + Array.from({ length: 20 }, (_, i) => `<path d="M${(i * 71) % 600},${(i * 37) % 130} l-4,12" stroke="#7DB8E0" stroke-width="2"/>`).join('')
          : `<rect x="0" y="0" width="600" height="150" fill="${room.wall}"/><rect x="0" y="140" width="600" height="12" fill="rgba(0,0,0,.3)"/>`;
        return `<svg class="cf-roomsvg" viewBox="0 0 600 340" xmlns="http://www.w3.org/2000/svg">${wall}${(FLOOR[room.fl] || FLOOR.wood)(room.floor)}
          ${room.items.map((it, i) => [it, i]).sort((a, b) => (FLAT.includes(b[0].k) ? 1 : 0) - (FLAT.includes(a[0].k) ? 1 : 0)).map(([it, i]) => `<g class="cf-it ${looked[i] ? 'looked' : ''}" data-item="${i}">${(ART[it.k] || ART.shelfbox)(it.x, it.y, it.w, it.h, it)}<rect class="hit" x="${it.x - 6}" y="${it.y - 6}" width="${it.w + 12}" height="${it.h + 12}"/>${looked[i] ? `<g transform="translate(${it.x + it.w - 4},${it.y - 4})"><rect x="-9" y="-9" width="18" height="18" fill="#F7F4EC" stroke="${INK}" stroke-width="2"/><path d="M-5,0 l3,4 l6,-8" stroke="${INK}" stroke-width="2.5" fill="none"/></g>` : ''}</g>`).join('')}</svg>`;
      }
      const cases = () => { if (!CASES) CASES = (window.CASE_DEFS || []).map((f) => f(face)); return CASES; };

      // ---------- setup ----------
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1400px] mx-auto');
        setupScreen(body, mod, [
          { key: 'case', label: 'THE CASE', def: 'harbor', hero: true, hint: 'More cases are coming. Each one takes about 20-30 minutes.', choices: cases().map((c) => [c.id, `#${c.num} · ${c.title}`]) },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }], sel)),
        'A co-op detective case for two. One of you has the crime scene, the other has the records. Work it out together!');
      }
      function start(body, sel, S) {
        const C = cases().find((c) => c.id === sel.case) || cases()[0];
        const solo = S.n === 1;
        G = { S, C, solo, me: S.online ? S.me : 0, view: 'A', tab: 'brief', room: Object.keys(C.ROOMS)[0], open: null, sus: C.SUSPECTS[0],
          found: {}, looked: {}, marks: {}, notes: {}, drawer: -1, doc: null, item: null, log: {}, pins: [], strings: [], asked: {}, feed: [], hints: 0, tries: 0, acc: { who: null, how: null, why: null, ev: [] }, prop: null, solved: false, selPin: null, noteN: 0, over: false, tok: ++GT.cur, t0: Date.now() };
        G.role = solo ? 'both' : G.me === 0 ? 'A' : 'B';
        if (G.role === 'B') G.view = 'B';
        GT.started = true; GT.over = false;
        body.innerHTML = `<div class="cf-wrap"><div class="cf-top" id="cf-top"></div><div class="cf-tabs" id="cf-tabs"></div><div id="cf-view"></div></div>`;
        S.on(apply, () => {});
        S.onLeft = (a) => { if (!G || G.solo) return; G.role = 'both'; G.partnerLeft = true; feed(a.s, T('left the case. You now hold both halves.', 'đã rời vụ án. Giờ bạn giữ cả hai nửa.')); render(); };
        bind(body);
        npBar('');
        render();
      }
      const partner = () => (G.solo ? null : G.S.name(1 - G.me));
      const myName = (s) => (s === G.me ? T('You', 'Bạn') : G.S.name(s));
      function feed(s, txt) { G.feed.unshift({ s, txt }); }
      const sees = (who) => G.role === 'both' ? who === G.view : who === G.role;

      // ---------- every change, in the same order on both screens ----------
      function apply(a) {
        if (!G) return 0;
        const C = G.C, title = (id) => (card(id) ? card(id).title : T('a note', 'một ghi chú'));
        if ((a.t === 'pin' || a.t === 'mark') && a.s === G.me) delete G.notes[a.id];
        if (a.t === 'find') { if (!G.found[a.id]) { G.found[a.id] = 1; if (a.s !== G.me) feed(a.s, `${T('found', 'tìm thấy')} <b>${esc(title(a.id))}</b>`); } }
        else if (a.t === 'look') { G.looked[a.room + ':' + a.i] = 1; const it = C.ROOMS[a.room] && C.ROOMS[a.room].items[a.i]; if (it && it.c && !G.found[it.c]) { G.found[it.c] = 1; if (a.s !== G.me) feed(a.s, `${T('found', 'tìm thấy')} <b>${esc(title(it.c))}</b>`); } }
        else if (a.t === 'mark') { const p = G.pins.find((q) => q.id === a.id); if (p) { if (a.rows) p.rows = a.rows.slice(0, 20); if (a.note != null) p.note = String(a.note).slice(0, 160); feed(a.s, `${T('updated the card', 'cập nhật thẻ')} <b>${esc(title(a.id))}</b>`); } }
        else if (a.t === 'show') { const tk = C.TALK[a.sus]; if (tk) { (G.log[a.sus] = G.log[a.sus] || []).push({ q: `${T('Shows', 'Đưa ra')}: ${title(a.id)}`, a: tk.show[a.id] || tk.shrug, hot: !!tk.show[a.id], ev: 1 }); feed(a.s, `${T('showed', 'đưa')} <b>${esc(title(a.id))}</b> ${T('to', 'cho')} <b>${esc(C.PEOPLE[a.sus].name)}</b>`); } }
        else if (a.t === 'pin') { if (!G.pins.some((p) => p.id === a.id)) { G.pins.push({ id: a.id, by: a.s, x: a.x, y: a.y, text: a.text, rows: a.rows, note: a.note ? String(a.note).slice(0, 160) : '' }); feed(a.s, `${T('pinned', 'đã ghim')} <b>${esc(a.text ? T('a sticky note', 'một ghi chú') : title(a.id))}</b>`); if (a.s !== G.me) toast(`📌 ${esc(G.S.name(a.s))} ${T('pinned', 'đã ghim')} "${esc(a.text ? T('a note', 'ghi chú') : title(a.id))}"`); } }
        else if (a.t === 'unpin') { G.pins = G.pins.filter((p) => p.id !== a.id); G.strings = G.strings.filter((s) => !s.includes(a.id)); G.acc.ev = G.acc.ev.filter((x) => x !== a.id); feed(a.s, T('took a card off the board', 'gỡ một thẻ khỏi bảng')); }
        else if (a.t === 'move') { const p = G.pins.find((q) => q.id === a.id); if (p) { p.x = a.x; p.y = a.y; } }
        else if (a.t === 'tie') { const i = G.strings.findIndex((s) => s.includes(a.a) && s.includes(a.b)); if (i >= 0) G.strings.splice(i, 1); else { G.strings.push([a.a, a.b]); feed(a.s, `${T('tied', 'nối')} <b>${esc(title(a.a))}</b> ${T('to', 'với')} <b>${esc(title(a.b))}</b>`); } }
        else if (a.t === 'ask') { const k = a.sus + a.i; if (!G.asked[k]) { G.asked[k] = 1; const q = C.TALK[a.sus].q[a.i]; if (q) (G.log[a.sus] = G.log[a.sus] || []).push({ q: q[0], a: q[1] }); } }
        else if (a.t === 'hint') { if (G.hints < C.HINTS.length) { G.hints++; feed(a.s, T('used a hint (−1 star)', 'dùng một gợi ý (−1 sao)')); } }
        else if (a.t === 'propose') { G.prop = { s: a.s, who: a.who, how: a.how, why: a.why, ev: a.ev }; if (G.solo) return decide(true); feed(a.s, T('wants to make an accusation', 'muốn buộc tội')); if (a.s !== G.me) { G.tab = 'acc'; SFX.play('reveal'); } }
        else if (a.t === 'answer') { if (G.prop && a.s !== G.prop.s) return decide(!!a.ok); }
        else if (a.t === 'cancel') { G.prop = null; }
        else if (a.t === '_left' || a.t === '_gone') { /* handled by onLeft */ }
        if (!G.dragging) render();
        return 0;
      }
      function decide(ok) {
        const C = G.C, p = G.prop; G.prop = null;
        if (!ok) { feed(1 - p.s, T('wants to keep looking', 'muốn điều tra thêm')); toast(T('Not yet: your partner wants to keep looking.', 'Chưa: cộng sự muốn điều tra thêm.')); render(); return 0; }
        if (p.who === C.KEY.who && p.how === C.KEY.how && p.why === C.KEY.why) {
          G.weak = p.ev.filter((x) => C.STRONG.includes(x)).length < 3 ? 1 : 0; G.solved = true; G.tab = 'acc'; G.over = true; GT.over = true;
          SFX.play('win'); render(); finish(); return 0;
        }
        G.tries++; SFX.play('wrong');
        toast('❌ ' + (p.who !== C.KEY.who ? C.wrong.who(C.PEOPLE[p.who].name) : p.how !== C.KEY.how ? C.wrong.how : C.wrong.why));
        render(); return 0;
      }
      const stars = () => Math.max(1, 5 - G.hints - G.tries - (G.weak || 0));
      function finish() {
        const s = stars(), mins = Math.max(1, Math.round((Date.now() - G.t0) / 60000));
        const st = gstat('casefiles'); st.cases = (st.cases || 0) + 1; st.stars = Math.max(st.stars || 0, s);
        reportGame('casefiles', 'win', { solo: G.solo, xp: 20 + s * 8, label: `Case #${G.C.num} solved, ${s}★` });
        G.S.over = true; try { if (G.S.online) localStorage.removeItem('ps_np_cur:' + (NET.me && NET.me.id)); } catch (e) {}   // nothing to rejoin
        G.mins = mins;
      }
      const plain = (h) => String(h || '').replace(/<[^>]+>/g, '');
      // any card: a document, or any object in a room (clue or not, they look the same on the board)
      function itemOf(id) {
        const C = G.C; if (!G._itemOf) { G._itemOf = {}; Object.entries(C.ROOMS).forEach(([rk, r]) => r.items.forEach((it, i) => { const o = { it, rk, room: r }; G._itemOf['it:' + rk + ':' + i] = o; if (it.c) G._itemOf[it.c] = o; })); }
        return G._itemOf[id];
      }
      function card(id) {
        const C = G.C, c = C.CLUES[id], o = itemOf(id);
        if (o) return { who: 'A', icon: 'glass', title: o.it.n, text: c ? c.text : o.it.t, room: o.room.name };
        return c || null;
      }
      const objId = (room, i) => { const it = G.C.ROOMS[room].items[i]; return it.c || 'it:' + room + ':' + i; };
      const rowText = (r) => (Array.isArray(r) ? r.filter(Boolean).join(' · ') : r);
      // what a card on the board says: only what was found or marked, never the conclusion
      function cardSummary(p) {
        const c = card(p.id); if (!c) return esc(p.text || '');
        const nt = p.note ? `<span class="pn">✎ ${esc(p.note)}</span>` : '';
        if (c.who === 'A') { const t = plain(c.text); return `<span class="rm">${esc(c.room || '')}</span>` + esc(t.length > 110 ? t.slice(0, 107) + '...' : t) + nt; }
        const rows = (p.rows || []).map((i) => c.rows[i]).filter((r) => r != null);
        return nt + (rows.length ? rows.map((r) => `<span class="mk">${esc(rowText(r))}</span>`).join('') : `<i class="nomk">${T('No lines marked yet', 'Chưa đánh dấu dòng nào')}</i>`);
      }
      const act = (a) => G.S.act(Object.assign({ s: G.me }, a));
      let toastT = null;
      function toast(t) { const el = $('#cf-toast') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'cf-toast', className: 'cf-toast' })); el.innerHTML = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600); }

      // ---------- views ----------
      function render() {
        if (!G || !$('#cf-view')) return;
        const C = G.C;
        const who = G.role === 'both'
          ? `<div class="cf-who"><button class="a ${G.view === 'A' ? 'on' : ''}" data-view="A">${T('Scene', 'Hiện trường')}</button><button class="b ${G.view === 'B' ? 'on' : ''}" data-view="B">${T('Records', 'Hồ sơ')}</button></div>`
          : `<span class="cf-me ${G.role.toLowerCase()}">${G.role === 'A' ? T('YOU: THE SCENE', 'BẠN: HIỆN TRƯỜNG') : T('YOU: THE RECORDS', 'BẠN: HỒ SƠ')}</span>`;
        $('#cf-top').innerHTML = `<span class="cf-case pix">CASE #${C.num} · ${esc(C.title).toUpperCase()}</span>${who}<span class="cf-note">${G.solo ? T('Playing alone: you hold both halves. Switch between the scene and the records.', 'Chơi một mình: bạn giữ cả hai nửa. Chuyển qua lại giữa hiện trường và hồ sơ.')
          : G.partnerLeft ? T('Your partner left: you now hold both halves.', 'Cộng sự đã rời: giờ bạn giữ cả hai nửa.')
          : `${T('Partner', 'Cộng sự')}: <b>${esc(partner())}</b> · ${G.role === 'A' ? T('the records', 'hồ sơ') : T('the scene', 'hiện trường')}. ${T('Pin clues so they can see them, and talk!', 'Ghim manh mối để họ thấy, và trao đổi nhé!')}`}</span>`;
        const v = G.view;
        const list = [['brief', T('Briefing', 'Tóm tắt')], ['inv', v === 'A' ? T('Crime scene', 'Hiện trường') : T('Records', 'Hồ sơ')], ['sus', T('Interviews', 'Thẩm vấn')], ['board', T('Evidence board', 'Bảng chứng cứ'), G.pins.length], ['acc', T('Accuse', 'Buộc tội'), G.prop ? '!' : 0]];
        $('#cf-tabs').innerHTML = list.map(([k, l, n]) => `<button class="cf-tab ${G.tab === k ? 'on' : ''}" data-tab="${k}">${l}${n ? `<span class="n">${n}</span>` : ''}</button>`).join('');
        const el = $('#cf-view');
        el.innerHTML = G.tab === 'brief' ? briefHTML() : G.tab === 'inv' ? (v === 'A' ? sceneHTML() : recordsHTML()) : G.tab === 'sus' ? susHTML() : G.tab === 'board' ? boardHTML() : accHTML();
        if (G.tab === 'board') drawStrings();
      }
      function briefHTML() {
        const C = G.C;
        return `<div class="cf-brief"><div class="cf-paper"><span class="cf-stamp">CASE #${C.num}</span><h3>${esc(C.title)}</h3>${C.brief}
            <ul class="cf-qs">${C.questions.map((q) => `<li>${q}</li>`).join('')}</ul></div>
          <div class="cf-roles"><div class="cf-role a"><b>${T('Detective A · the scene', 'Thám tử A · hiện trường')}</b><p>${T('Walks the hotel, searches rooms and talks to the suspects. Sees what is physically there.', 'Đi khắp khách sạn, lục soát các phòng và thẩm vấn nghi phạm. Thấy những gì có thật ở hiện trường.')}</p></div>
            <div class="cf-role b"><b>${T('Detective B · the records', 'Thám tử B · hồ sơ')}</b><p>${T('Has the paperwork: door logs, receipts, the power company, phone records, written statements.', 'Giữ giấy tờ: nhật ký cửa, hóa đơn, công ty điện, dữ liệu điện thoại, lời khai.')}</p></div>
            <div class="cf-panel"><div class="cf-ph">${T('HOW TO PLAY', 'CÁCH CHƠI')}</div><div class="cf-pb cf-how">
              1. ${T('Each detective digs through their own half.', 'Mỗi thám tử điều tra nửa của mình.')}<br>2. ${T('<b>Pin</b> anything useful to the shared evidence board, so your partner sees it.', '<b>Ghim</b> manh mối hữu ích lên bảng chứng cứ chung để cộng sự thấy.')}<br>3. ${T('Talk it through: a record can prove someone is lying.', 'Bàn bạc: một hồ sơ có thể chứng minh ai đó nói dối.')}<br>4. ${T('Use the board\'s clues to <b>confront</b> suspects.', 'Dùng manh mối trên bảng để <b>chất vấn</b> nghi phạm.')}<br>5. ${T('Accuse: who, how and why, with your 3 best pieces of evidence. Your partner has to agree.', 'Buộc tội: ai, bằng cách nào, vì sao, kèm 3 bằng chứng tốt nhất. Cộng sự phải đồng ý.')}<br><br>
              ${T('Stuck?', 'Bí?')} <button class="btn-game btn-amber py-1 px-3 text-xs" data-hint ${G.hints >= G.C.HINTS.length ? 'disabled' : ''}>${T('Get a hint', 'Xem gợi ý')}</button> <span class="text-muted">${T('(each hint costs a star)', '(mỗi gợi ý trừ một sao)')}</span>
              ${G.C.HINTS.slice(0, G.hints).map((h, i) => `<div class="cf-hint"><b>${T('Hint', 'Gợi ý')} ${i + 1}:</b> ${h}</div>`).join('')}</div></div></div></div>`;
      }
      // the note box + pin button under anything you can pin (an object or a document)
      function pinBar(id, extra) {
        const pin = G.pins.find((p) => p.id === id), note = G.notes[id] != null ? G.notes[id] : (pin ? pin.note || '' : '');
        return `<div class="cf-notebox"><label>${T('Your note', 'Ghi chú của bạn')} <small>${T('(goes on the card)', '(ghi lên thẻ)')}</small></label>
            <textarea data-note="${id}" maxlength="160" placeholder="${T('e.g. Why is this here?', 'vd: Sao cái này lại ở đây?')}">${esc(note)}</textarea></div>
          <div class="acts" data-acts="${id}">${pinActs(id, extra)}</div>`;
      }
      function pinActs(id, extra) {
        const pin = G.pins.find((p) => p.id === id), note = G.notes[id] != null ? G.notes[id] : (pin ? pin.note || '' : '');
        const changed = pin && ((pin.note || '') !== note || extra), n = (G.marks[id] || []).length, isDoc = G.C.CLUES[id] && G.C.CLUES[id].who === 'B';
        return `${pin ? (changed ? `<button class="btn-game btn-teal py-1.5 px-3 text-xs" data-remark="${id}">📌 ${T('Update the card on the board', 'Cập nhật thẻ trên bảng')}</button>` : `<span class="cf-pinned">📌 ${T('On the board', 'Đã ở trên bảng')}</span>`)
            : `<button class="btn-game btn-teal py-1.5 px-3 text-xs" data-pin="${id}">📌 ${T('Pin to the board', 'Ghim lên bảng')}${isDoc && n ? ` (${n} ${T('marked', 'dòng')})` : ''}</button>`}`;
      }
      function clueCard(id) {
        const c = card(id);
        return `<div class="cf-clue"><h4><span class="ic">${icon(c.icon)}</span>${esc(c.title)}</h4><div>${c.text}</div>${pinBar(id)}</div>`;
      }
      function docChanged(id) { const pin = G.pins.find((p) => p.id === id); return !!(pin && G.marks[id] && JSON.stringify((pin.rows || []).slice().sort()) !== JSON.stringify(G.marks[id].slice().sort())); }
      function sceneHTML() {
        const C = G.C, room = C.ROOMS[G.room];
        const looked = {}; room.items.forEach((_, i) => { if (G.looked[G.room + ':' + i]) looked[i] = 1; });
        const nav = `<div class="cf-rooms">${Object.entries(C.ROOMS).map(([k, o]) => `<button class="cf-rbtn ${G.room === k ? 'on' : ''}" data-room="${k}" style="--rc:${o.col}">${esc(o.name)}</button>`).join('')}</div>`;
        const it = G.item != null ? room.items[G.item] : null;
        let side = `<p class="cf-scene">${room.scene}</p><p class="cf-tip">${T('Tap anything in the room to take a closer look. You can pin anything to the board, but not everything matters, and nobody tells you when you have found it all.', 'Chạm vào bất cứ thứ gì trong phòng để xem kỹ. Bạn có thể ghim mọi thứ lên bảng, nhưng không phải thứ gì cũng quan trọng, và không ai báo khi bạn đã tìm hết.')}</p>`;
        if (it) side += clueCard(objId(G.room, G.item));
        return `${nav}<div class="cf-inv"><div class="cf-panel"><div class="cf-ph">${esc(room.name).toUpperCase()}</div><div class="cf-pb cf-roombox">${roomSVG(room, looked)}</div></div>
          <div class="cf-panel"><div class="cf-ph">${T('CLOSE LOOK', 'XEM KỸ')}</div><div class="cf-pb">${side}</div></div></div>`;
      }
      // one document as a real piece of paper: the look (log sheet, till receipt, phone printout, notebook...) sets the paper
      function paperHTML(id, c, marks) {
        const org = G.C.org || '', lk = c.look || 'log', code = (id.charCodeAt(2) * 37 + id.length * 11) % 900 + 100;
        const row = (r, i) => `<${c.table ? 'tr' : 'div'} class="cf-row ${marks.includes(i) ? 'mk' : ''}" data-row="${i}">${c.table ? r.map((x) => `<td>${esc(x)}</td>`).join('') : esc(r)}</${c.table ? 'tr' : 'div'}>`;
        const body = c.table ? `<table class="tbl">${c.rows.map(row).join('')}</table>` : `<div class="lines">${c.rows.map(row).join('')}</div>`;
        const intro = c.intro ? `<p class="intro">${esc(c.intro)}</p>` : '';
        const head = {
          log: `<div class="ph"><b>${esc(org).toUpperCase()}</b><span>FORM ${code}</span></div><h4>${esc(c.title)}</h4>${intro}`,
          receipt: `<div class="ph"><b>${esc(org).toUpperCase()}</b><span>HARBOR BAR · TILL 2</span><span>FRI · REPRINT</span></div><div class="cut">- - - - - - - - - - - - - -</div>${intro}`,
          phone: `<div class="ph"><b>SEAPHONE MOBILE</b><span>CALL &amp; MESSAGE DETAIL</span></div><h4>${esc(c.title)}</h4>${intro}`,
          notebook: `<h4>${esc(c.title)}</h4>${intro}`,
          statement: `<div class="ph"><b>SEABRIGHT POLICE</b><span>WITNESS STATEMENT</span></div><h4>${esc(c.title)}</h4>${intro}`,
          letter: `<h4>${esc(c.title)}</h4>${intro}`,
          notice: `<div class="ph"><b>${esc(c.title).toUpperCase()}</b><span>No. ${code}-${(code * 7) % 100}</span></div>${intro}`,
          form: `<div class="ph"><b>${esc(org).toUpperCase()}</b><span>MAINTENANCE · ${esc(c.title).toUpperCase()}</span></div>${intro}<div class="cols"><span>DATE</span><span>PROBLEM</span><span>STATUS</span></div>`,
          menu: `<div class="ph"><span>~ ${esc(org)} ~</span><b>${esc(c.title)}</b></div>${intro}`,
        }[lk] || `<h4>${esc(c.title)}</h4>${intro}`;
        const foot = { receipt: '<div class="cut">- - - - - - - - - - - - - -</div><div class="ty">THANK YOU · COME AGAIN</div>', statement: '<div class="sig"><span>Signed</span><svg viewBox="0 0 120 24"><path d="M4 18 C14 2 20 22 30 10 S44 4 50 16 S66 20 74 8 S96 14 116 10" stroke="#24408F" stroke-width="2" fill="none"/></svg></div>',
          notice: '<div class="stamp">OFFICIAL COPY</div>', phone: '<div class="pg">PAGE 1 OF 1 · END OF REPORT</div>', log: '<div class="pg">FILED BY FRONT DESK</div>' }[lk] || '';
        return `<div class="cf-sheet ${lk}"><span class="clip"></span>${head}${body}${foot}</div>`;
      }
      function recordsHTML() {
        const C = G.C;
        const cab = `<div class="cf-cab"><div class="top"><span>${T('RECORDS', 'HỒ SƠ')}</span></div>${C.DRAWERS.map((d, i) => {
          const open = G.drawer === i;
          return `<button class="cf-drw ${open ? 'open' : ''}" data-drawer="${i}"><span class="lbl">${esc(d.name)}</span><span class="hd"></span></button>${open ? `<div class="cf-drin">${d.docs.map((id, j) =>
            `<button class="cf-fold ${G.doc === id ? 'on' : ''} ${G.found[id] ? 'read' : ''}" data-doc="${id}" style="--off:${(j % 3) * 26}%"><span class="tab">${esc(C.CLUES[id].title)}</span></button>`).join('')}</div>` : ''}`; }).join('')}<div class="feet"><i></i><i></i></div></div>`;
        let desk = `<div class="cf-empty-desk">${T('Open a drawer and pull out a folder. Read it like the real thing: tap the lines that matter to highlight them, write yourself a note, and pin it. Only the lines you highlight go on the board.', 'Mở một ngăn kéo và rút một tập hồ sơ ra. Đọc như thật: chạm vào những dòng quan trọng để tô sáng, viết ghi chú cho mình rồi ghim lên bảng. Chỉ những dòng bạn tô sáng mới lên bảng.')}</div>`;
        if (G.doc && C.CLUES[G.doc]) {
          const c = C.CLUES[G.doc], pin = G.pins.find((p) => p.id === G.doc), marks = G.marks[G.doc] || (pin && pin.rows) || [];
          desk = `${paperHTML(G.doc, c, marks)}<div class="cf-deskbar"><p class="cf-tip">${T('Tap a line to highlight it (tap again to clear).', 'Chạm vào một dòng để tô sáng (chạm lần nữa để bỏ).')}</p>${pinBar(G.doc, docChanged(G.doc))}</div>`;
        }
        return `<div class="cf-inv cf-recs"><div class="cf-panel"><div class="cf-ph">${T('RECORDS CABINET', 'TỦ HỒ SƠ')}</div><div class="cf-pb">${cab}</div></div>
          <div class="cf-panel"><div class="cf-ph">${T('ON THE DESK', 'TRÊN BÀN')}</div><div class="cf-pb cf-desk">${desk}</div></div></div>`;
      }
      function susHTML() {
        const C = G.C, list = Object.keys(C.PEOPLE), p = C.PEOPLE[G.sus], tk = C.TALK[G.sus] || { q: [], show: {} };
        const canAsk = G.role !== 'B', log = G.log[G.sus] || [], board = G.pins.filter((x) => card(x.id));
        const talk = `<div class="cf-talk"><div class="big">${p.art}<b>${p.name}</b><small>${p.role}</small></div><div>
          ${canAsk ? `<div class="cf-qs2">${tk.q.map((q, i) => `<button class="cf-q ${G.asked[G.sus + i] ? 'asked' : ''}" data-ask="${i}">💬 ${q[0]}</button>`).join('')}
              <button class="cf-q conf" data-showmenu>🔎 ${T('Show them something from the board...', 'Đưa cho họ xem thứ gì đó trên bảng...')}</button>
              ${G.showing ? `<div class="cf-showlist">${board.length ? board.map((x) => `<button class="cf-opt" data-show="${x.id}"><span class="ic">${icon(card(x.id).icon)}</span>${esc(card(x.id).title)}</button>`).join('') : `<span class="text-muted text-sm">${T('Nothing on the board yet.', 'Trên bảng chưa có gì.')}</span>`}</div>` : ''}</div>`
            : `<div class="cf-ans"><span class="q">${T('DETECTIVE B', 'THÁM TỬ B')}</span>${T(`${esc(partner() || '')} (the scene) does the talking. You see everything that is said here. Find records that prove someone is lying and pin them, so they can show them.`, `${esc(partner() || '')} (hiện trường) là người hỏi. Bạn thấy mọi điều được nói ở đây. Hãy tìm hồ sơ chứng minh ai đó nói dối và ghim lên bảng để họ đưa ra.`)}</div>`}
          <div class="cf-convo">${log.length ? log.map((l) => `<div class="cf-q asked">${l.ev ? '🔎' : '💬'} ${esc(l.q)}</div><div class="cf-ans ${l.hot ? 'hot' : ''}">${l.a}</div>`).join('') : `<p class="text-muted text-sm">${T('Nothing asked yet.', 'Chưa hỏi gì.')}</p>`}</div></div></div>`;
        return `<div class="cf-panel"><div class="cf-ph">${T('INTERVIEWS', 'THẨM VẤN')} <small>${C.SUSPECTS.length} ${T('suspects', 'nghi phạm')} · ${list.length - C.SUSPECTS.length} ${T('witnesses', 'nhân chứng')}</small></div><div class="cf-pb">
          <div class="cf-sus">${list.map((k) => `<div class="cf-sc ${G.sus === k ? 'sel' : ''}" data-sus="${k}">${C.PEOPLE[k].art}<span><b>${C.PEOPLE[k].name}</b><small>${C.PEOPLE[k].role}${C.PEOPLE[k].tall ? ' · ' + T('tall', 'cao') : ''}</small></span></div>`).join('')}</div>${talk}</div></div>`;
      }
      function boardHTML() {
        const C = G.C;
        return `<div class="cf-boardwrap"><div class="cf-cork" id="cf-cork"><svg class="strings" id="cf-strings"></svg>
          ${G.pins.map((p) => { const c = card(p.id); return c ? `<div class="cf-pin ${c.who.toLowerCase()} ${G.selPin === p.id ? 'sel' : ''}" data-p="${p.id}" style="left:${p.x}px;top:${p.y}px"><span class="x" data-unpin="${p.id}">✕</span><b>${c.title}</b>${cardSummary(p)}</div>`
            : `<div class="cf-pin note ${G.selPin === p.id ? 'sel' : ''}" data-p="${p.id}" style="left:${p.x}px;top:${p.y}px"><span class="x" data-unpin="${p.id}">✕</span>${esc(p.text || '')}<i>${esc(myName(p.by))}</i></div>`; }).join('')}
          ${G.pins.length ? '' : `<div class="cf-empty">${T('Nothing pinned yet.<br>Find clues and press 📌 Pin to the board.', 'Chưa ghim gì.<br>Tìm manh mối và bấm 📌 Ghim lên bảng.')}</div>`}</div>
          <div class="cf-panel"><div class="cf-ph">${T('SHARED BOARD', 'BẢNG CHUNG')}</div><div class="cf-pb">
            <div class="cf-legend"><span><i style="background:#2DD4BF"></i>${T('scene', 'hiện trường')}</span><span><i style="background:#FB7185"></i>${T('records', 'hồ sơ')}</span><span><i style="background:#FFF2A6"></i>${T('note', 'ghi chú')}</span></div>
            <p class="cf-how">${T('<b>Drag</b> cards around. <b>Tap one card, then another</b> to tie them with red string (tie again to untie). Your partner sees every change.', '<b>Kéo</b> thẻ để sắp xếp. <b>Chạm một thẻ rồi thẻ khác</b> để nối bằng dây đỏ (nối lại để gỡ). Cộng sự thấy mọi thay đổi.')}</p>
            <textarea id="cf-notetxt" maxlength="160" placeholder="${T('Write a sticky note...', 'Viết ghi chú...')}"></textarea>
            <button class="btn-game btn-amber py-1.5 px-3 text-xs" data-addnote>${T('Add sticky note', 'Thêm ghi chú')}</button>
            <div class="cf-feed">${G.feed.slice(0, 16).map((f) => `<div><b class="${f.s === 0 ? 'a' : 'b'}">${esc(myName(f.s))}</b> ${f.txt}</div>`).join('') || T('Board activity shows here.', 'Hoạt động trên bảng hiện ở đây.')}</div></div></div></div>`;
      }
      function drawStrings() {
        const svg = $('#cf-strings'), cork = $('#cf-cork'); if (!svg || !cork) return;
        const cr = cork.getBoundingClientRect();
        const at = (id) => { const el = cork.querySelector(`[data-p="${id}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return [r.left - cr.left + r.width / 2, r.top - cr.top + 4]; };
        svg.innerHTML = G.strings.map(([a, b]) => { const p = at(a), q = at(b); if (!p || !q) return ''; const mx = (p[0] + q[0]) / 2, my = Math.max(p[1], q[1]) + 30;
          return `<path d="M${p[0]},${p[1]} Q${mx},${my} ${q[0]},${q[1]}" stroke="#050E18" stroke-width="5" fill="none"/><path d="M${p[0]},${p[1]} Q${mx},${my} ${q[0]},${q[1]}" stroke="#D2382C" stroke-width="3" fill="none"/>`; }).join('');
      }
      function accHTML() {
        const C = G.C, a = G.acc, pinned = G.pins.filter((p) => card(p.id));
        if (G.solved) return revealHTML();
        if (G.prop) {
          const p = G.prop, mine = p.s === G.me;
          return `<div class="cf-panel"><div class="cf-ph">${T('ACCUSATION', 'BUỘC TỘI')}</div><div class="cf-pb cf-prop">
            <p>${mine ? T(`Waiting for <b>${esc(partner())}</b> to agree...`, `Đang chờ <b>${esc(partner())}</b> đồng ý...`) : T(`<b>${esc(G.S.name(p.s))}</b> wants to accuse:`, `<b>${esc(G.S.name(p.s))}</b> muốn buộc tội:`)}</p>
            <div class="cf-propbox"><div>${C.PEOPLE[p.who].art}</div><div><b>${C.PEOPLE[p.who].name}</b><br>${T('How', 'Cách')}: ${esc((C.HOW.find((h) => h[0] === p.how) || ['', ''])[1])}<br>${T('Why', 'Vì sao')}: ${esc((C.WHY.find((h) => h[0] === p.why) || ['', ''])[1])}<br>${T('Evidence', 'Bằng chứng')}: ${p.ev.map((x) => esc(card(x) ? card(x).title : '')).join(' · ')}</div></div>
            <div class="flex gap-3 flex-wrap mt-3">${mine ? `<button class="btn-game btn-graphite py-2 px-4 text-sm" data-cancel>${T('Take it back', 'Rút lại')}</button>` : `<button class="btn-game btn-coral py-2 px-5 text-sm" data-answer="1">⚖ ${T('Agree, accuse!', 'Đồng ý, buộc tội!')}</button><button class="btn-game btn-graphite py-2 px-4 text-sm" data-answer="0">${T('Not yet', 'Chưa')}</button>`}</div></div></div>`;
        }
        const ready = a.who && a.how && a.why && a.ev.length === 3;
        return `<div class="cf-acc">
          <div class="cf-accq"><b>1 · ${T('WHO DID IT?', 'AI LÀM?')}</b><div class="cf-opts">${C.SUSPECTS.map((k) => `<button class="cf-opt ${a.who === k ? 'on' : ''}" data-acc="who" data-v="${k}">${C.PEOPLE[k].art}${C.PEOPLE[k].name}</button>`).join('')}</div></div>
          <div class="cf-accq"><b>2 · ${T('HOW?', 'BẰNG CÁCH NÀO?')}</b><div class="cf-opts">${C.HOW.map(([k, t]) => `<button class="cf-opt ${a.how === k ? 'on' : ''}" data-acc="how" data-v="${k}">${t}</button>`).join('')}</div></div>
          <div class="cf-accq"><b>3 · ${T('WHY?', 'VÌ SAO?')}</b><div class="cf-opts">${C.WHY.map(([k, t]) => `<button class="cf-opt ${a.why === k ? 'on' : ''}" data-acc="why" data-v="${k}">${t}</button>`).join('')}</div></div>
          <div class="cf-accq"><b>4 · ${T('YOUR 3 BEST PIECES OF EVIDENCE', '3 BẰNG CHỨNG TỐT NHẤT')}</b><p class="cf-sub">${T('Picked from the board', 'Chọn từ trên bảng')} (${a.ev.length}/3)</p>
            <div class="cf-opts">${pinned.length ? pinned.map((p) => `<button class="cf-opt ${a.ev.includes(p.id) ? 'on' : ''}" data-ev="${p.id}"><span class="ic">${icon(card(p.id).icon)}</span>${esc(card(p.id).title)}</button>`).join('') : `<span class="text-muted">${T('Pin clues to the board first.', 'Hãy ghim manh mối lên bảng trước.')}</span>`}</div></div>
          <div class="flex gap-3 items-center flex-wrap"><button class="btn-game btn-coral py-2.5 px-5 text-sm" data-propose ${ready ? '' : 'disabled'}>⚖ ${G.solo ? T('Make the accusation', 'Buộc tội') : T('Propose this accusation', 'Đề xuất buộc tội')}</button>
            <span class="text-muted text-sm">${G.solo ? '' : T('Your partner has to agree. ', 'Cộng sự phải đồng ý. ')}${T('A wrong accusation costs a star.', 'Buộc tội sai bị trừ một sao.')}${G.tries ? ` ${T('Wrong so far', 'Sai')}: ${G.tries}.` : ''}</span></div></div>`;
      }
      function revealHTML() {
        const C = G.C, s = stars(), all = Object.keys(C.CLUES).filter((k) => C.CLUES[k].who === 'A' || C.STRONG.includes(k) || (C.USEFUL || []).includes(k)), got = all.filter((k) => G.found[k]), miss = all.filter((k) => !G.found[k]);
        return `<div class="cf-panel"><div class="cf-ph">${T('CASE CLOSED', 'ĐÃ PHÁ ÁN')} <small>Case #${C.num} · ${esc(C.title)}</small></div><div class="cf-pb">
          <div class="cf-verdict"><div class="pic">${C.PEOPLE[C.culprit].art}</div><div><div class="big">${T('SOLVED!', 'PHÁ ÁN!')}</div><div class="who">${C.solved}</div>
            <div class="cf-stars">${'★'.repeat(s)}<i>${'★'.repeat(5 - s)}</i></div><div class="text-muted text-sm">${G.hints} ${T('hints', 'gợi ý')} · ${G.tries} ${T('wrong accusations', 'lần buộc tội sai')}${G.weak ? ' · ' + T('weaker evidence picked', 'bằng chứng chưa mạnh') : ''}${G.mins ? ` · ${G.mins} min` : ''}</div></div></div>
          <p class="cf-story">${C.story}</p>
          <b class="pix cf-h">${T('WHAT REALLY HAPPENED', 'CHUYỆN GÌ ĐÃ XẢY RA')}</b>
          <div class="cf-tl">${C.timeline.map(([t, x]) => `<div><b>${t}</b>${x}</div>`).join('')}</div>
          <b class="pix cf-h">${T('THE RED HERRINGS', 'NHỮNG MANH MỐI GÂY NHIỄU')}</b>
          <p class="cf-story">${C.herrings.map(([n, x]) => `<b>${n}</b> ${x}`).join('<br>')}</p>
          <div class="cf-found"><div><b class="got">${T('Key evidence found', 'Bằng chứng chính tìm được')}: ${got.length} / ${all.length}</b><br>${got.map((k) => card(k).title).join(' · ') || '-'}</div><div><b class="miss">${T('Missed', 'Bỏ sót')}</b><br>${miss.map((k) => card(k).title).join(' · ') || T('Nothing. Perfect detective work!', 'Không gì cả. Thám tử hoàn hảo!')}</div></div>
          <div class="mt-4 flex gap-3 flex-wrap"><button class="btn-game btn-amber py-2 px-5 text-sm" data-again>${T('Back to the cases', 'Về danh sách vụ án')}</button></div></div></div>`;
      }

      // ---------- input ----------
      function bind(body) {
        gOn(body, 'click', (e) => {
          const t = e.target.closest('[data-item],[data-drawer],[data-doc],[data-row],[data-remark],[data-showmenu],[data-show],[data-tab],[data-view],[data-room],[data-search],[data-pin],[data-sus],[data-ask],[data-unpin],[data-addnote],[data-acc],[data-ev],[data-propose],[data-answer],[data-cancel],[data-hint],[data-again]');
          if (!t || !G) return;
          const C = G.C;
          if (t.dataset.item !== undefined) { const i = +t.dataset.item; G.item = i; SFX.play('click'); if (!G.looked[G.room + ':' + i]) { act({ t: 'look', room: G.room, i }); return; } }
          else if (t.dataset.drawer !== undefined) { const d = +t.dataset.drawer; G.drawer = d; G.doc = null; SFX.play('click'); }
          else if (t.dataset.doc) { G.doc = t.dataset.doc; SFX.play('card'); if (!G.found[G.doc]) { act({ t: 'find', id: G.doc }); return; } }
          else if (t.dataset.row !== undefined) { const i = +t.dataset.row, pin = G.pins.find((p) => p.id === G.doc), cur = (G.marks[G.doc] || (pin && pin.rows) || []).slice(); const k = cur.indexOf(i); if (k >= 0) cur.splice(k, 1); else cur.push(i); G.marks[G.doc] = cur; }
          else if (t.dataset.remark) { const id = t.dataset.remark, pin = G.pins.find((p) => p.id === id); act({ t: 'mark', id, rows: G.marks[id] ? G.marks[id].slice() : undefined, note: G.notes[id] != null ? G.notes[id] : (pin && pin.note) }); return; }
          else if (t.dataset.showmenu !== undefined) G.showing = !G.showing;
          else if (t.dataset.show) { G.showing = false; act({ t: 'show', sus: G.sus, id: t.dataset.show }); return; }
          else if (t.dataset.tab) { G.tab = t.dataset.tab; G.selPin = null; }
          else if (t.dataset.view) { G.view = t.dataset.view; G.item = null; }
          else if (t.dataset.room) { G.room = t.dataset.room; G.item = null; }
          else if (t.dataset.search) { const id = t.dataset.search; G.open = id; if (!G.found[id]) { act({ t: 'find', id }); SFX.play('reveal'); return; } }
          else if (t.dataset.pin) { const n = G.pins.length, id = t.dataset.pin; act({ t: 'pin', id, note: G.notes[id] || '', rows: G.C.CLUES[id] && G.C.CLUES[id].who === 'B' ? (G.marks[id] || []).slice() : undefined, x: 16 + (n % 4) * 182 + rnd(12), y: 18 + Math.floor(n / 4) * 130 + rnd(12) }); SFX.play('click'); return; }
          else if (t.dataset.unpin) { e.stopPropagation(); act({ t: 'unpin', id: t.dataset.unpin }); return; }
          else if (t.dataset.sus) { G.sus = t.dataset.sus; G.showing = false; }
          else if (t.dataset.ask !== undefined) { if (!G.asked[G.sus + t.dataset.ask]) { act({ t: 'ask', sus: G.sus, i: +t.dataset.ask }); return; } }
          else if (t.dataset.addnote !== undefined) { const v = ((body.querySelector('#cf-notetxt') || {}).value || '').trim(); if (!v) return; const n = G.pins.length; act({ t: 'pin', id: 'note' + G.me + '_' + (++G.noteN) + '_' + rnd(9999), text: v.slice(0, 160), x: 30 + (n % 4) * 170, y: 30 + Math.floor(n / 4) * 120 }); return; }
          else if (t.dataset.acc) G.acc[t.dataset.acc] = t.dataset.v;
          else if (t.dataset.ev) { const id = t.dataset.ev, ev = G.acc.ev; if (ev.includes(id)) G.acc.ev = ev.filter((x) => x !== id); else if (ev.length < 3) ev.push(id); }
          else if (t.dataset.propose !== undefined) { const a = G.acc; act({ t: 'propose', who: a.who, how: a.how, why: a.why, ev: a.ev.slice() }); return; }
          else if (t.dataset.answer !== undefined) { act({ t: 'answer', ok: t.dataset.answer === '1' ? 1 : 0 }); return; }
          else if (t.dataset.cancel !== undefined) { act({ t: 'cancel' }); return; }
          else if (t.dataset.hint !== undefined) { act({ t: 'hint' }); return; }
          else if (t.dataset.again !== undefined) { G = null; open($('#game-root') || document.getElementById('game-root')); return; }
          render();
        });
        gOn(body, 'input', (e) => {
          const t = e.target; if (!G || !t.dataset || t.dataset.note === undefined) return;
          const id = t.dataset.note; G.notes[id] = t.value;
          const box = body.querySelector(`[data-acts="${id}"]`), pin = G.pins.find((p) => p.id === id);
          if (box) box.innerHTML = pinActs(id, docChanged(id));
        });
        // dragging + tying cards on the board (the move is shared when you let go)
        let drag = null;
        gOn(body, 'pointerdown', (e) => {
          const el = e.target.closest('.cf-pin'); if (!el || e.target.closest('.x') || !G) return;
          const id = el.dataset.p, p = G.pins.find((x) => x.id === id), cr = $('#cf-cork').getBoundingClientRect();
          drag = { id, p, el, dx: e.clientX - cr.left - p.x, dy: e.clientY - cr.top - p.y, moved: false, sx: e.clientX, sy: e.clientY };
          try { el.setPointerCapture(e.pointerId); } catch (x) {}
        });
        gOn(body, 'pointermove', (e) => {
          if (!drag || !G) return; if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 5) drag.moved = true;
          if (!drag.moved) return; G.dragging = true;
          const cr = $('#cf-cork').getBoundingClientRect();
          drag.p.x = Math.round(Math.max(0, Math.min(cr.width - drag.el.offsetWidth, e.clientX - cr.left - drag.dx))); drag.p.y = Math.round(Math.max(8, Math.min(cr.height - drag.el.offsetHeight, e.clientY - cr.top - drag.dy)));
          drag.el.style.left = drag.p.x + 'px'; drag.el.style.top = drag.p.y + 'px'; drawStrings();
        });
        gOn(body, 'pointerup', () => {
          if (!drag || !G) return; const { id, moved, p } = drag; drag = null; G.dragging = false;
          if (moved) { act({ t: 'move', id, x: p.x, y: p.y }); return; }
          if (!G.selPin) G.selPin = id; else if (G.selPin === id) G.selPin = null; else { act({ t: 'tie', a: G.selPin, b: id }); G.selPin = null; return; }
          render();
        });
        gOn(window, 'resize', () => { if (G && G.tab === 'board') drawStrings(); });
      }

      // ---------- tile icon: a magnifying glass over a case folder ----------
      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      GICONS.casefiles = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(0, 0, 24, 24, '#0F2338')}${rr(2, 5, 8, 3, K)}${rr(2, 7, 17, 14, K)}${rr(3, 6, 6, 2, '#E9C46A')}${rr(3, 8, 15, 12, '#E9C46A')}${rr(5, 11, 8, 1, '#8A6A2A')}${rr(5, 13, 6, 1, '#8A6A2A')}${rr(5, 15, 7, 1, '#8A6A2A')}
        ${rr(13, 9, 8, 8, K)}${rr(14, 10, 6, 6, '#7DD3FC')}${rr(15, 11, 2, 2, '#F7F4EC')}${rr(19, 16, 2, 2, K)}${rr(20, 17, 3, 3, K)}${rr(21, 18, 1, 1, '#B0362A')}</svg>`;
      const mod = {
        id: 'casefiles', name: 'Case Files', icon: 'casefiles', cats: ['party', 'word'], sub: '1-2 PLAYERS · ~25 MIN', color: '#E9C46A', tone: 'amber', btn: 'amber', flag: 'NEW',
        blurb: 'A co-op detective case: one of you has the crime scene, the other has the records. Pin the evidence and catch the culprit together.',
        rules: { tag: 'DETECTIVE · CO-OP FOR 2', steps: [
          '<strong class="text-bone">Two halves:</strong> Detective A searches the scene and interviews suspects; Detective B reads the records.',
          '<strong class="text-bone">Share:</strong> pin clues to the shared evidence board so your partner can see them, tie them with string, add notes.',
          '<strong class="text-bone">Confront:</strong> some questions only unlock when the right clue is on the board.',
          '<strong class="text-bone">Accuse:</strong> who, how and why, with your 3 best pieces of evidence. Your partner has to agree.',
        ], tip: 'Check every alibi against a record. Whose story does a record prove false?' },
        profileTiles: (s) => [['CASES SOLVED', s.cases || 0, 'text-amber'], ['BEST STARS', (s.stars || 0) + '★', 'text-teal']],
        engine: { get G() { return G; }, cases, act: (a) => act(a), apply: (a) => apply(a) },
        open, close() { G = null; },
        online: { seats: () => 2, min: 2, bots: false, ranked: false, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
