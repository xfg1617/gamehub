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
        cam: ['............', '............', '..kkkkkkk...', '..kgggggk.kk', '..kgkkkgkkgk', '..kgkttkgkgk', '..kgkkkgkkgk', '..kgggggk.kk', '..kkkkkkk...', '.....k......', '....kkk.....', '............'],
        lab: ['....kkkk....', '....kwwk....', '....kwwk....', '....kwwk....', '...kwwwwk...', '..kwwwwwwk..', '..kttttttk..', '.kttttttttk.', '.kttttttttk.', '.kkkkkkkkkk.', '............', '............'],
        pen: ['............', '.kkkkkkkkk..', '.kwwwwwwwk..', '.kwggggwwk..', '.kwwwwwwwk..', '.kwggwwwwk..', '.kwwwwwwkr..', '.kwwwwwkry..', '.kkkkkkkk...', '............', '............', '............'],
      };
      const icon = (n) => pixSVG((ICON[n] || ICON.log).map((r) => r.padEnd(12, '.')));
      // ---------- room pictures: every object is drawn from simple shapes (our own art) ----------
      const INK = '#050E18';
      const FLAT = ['rug', 'path', 'counter'];   // drawn first, so furniture stands on them
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
        door: (x, y, w, h, it) => R(x, y, w, h, '#8A5A2B') + R(x + 8, y + 10, w - 16, h * 0.35, '#6B4423', 2) + R(x + 8, y + h * 0.52, w - 16, h * 0.38, '#6B4423', 2) + R(x + w - 18, y + h * 0.45, 8, 8, '#F5B041', 1) + (it.label ? `<rect x="${x + w / 2 - Math.max(18, it.label.length * 4.6)}" y="${y - 20}" width="${Math.max(36, it.label.length * 9.2)}" height="16" fill="#F1E7CF" stroke="${INK}" stroke-width="2"/><text x="${x + w / 2}" y="${y - 7}" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="12" fill="${INK}">${it.label}</text>` : ''),
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
      Object.assign(ART, {
        bigframe: (x, y, w, h) => R(x, y, w, h, '#C9A227') + R(x + 10, y + 10, w - 20, h - 20, '#F2C38A', 2) + R(x + 10, y + h * 0.6, w - 20, h * 0.4 - 10, '#2B6FA8', 0) + R(x + w * 0.46, y + h * 0.26, w * 0.08, h * 0.36, '#F7F4EC', 2) + R(x + w * 0.44, y + h * 0.2, w * 0.12, h * 0.08, '#B0362A', 2),
        smallpic: (x, y, w, h, it) => R(x, y, w, h, '#8A5A2B') + R(x + 7, y + 7, w - 14, h - 14, it.col || '#7DB8E0', 2) + R(x + w * 0.3, y + h * 0.45, w * 0.4, h * 0.2, '#F1E7CF', 0),
        plaque: (x, y, w, h) => R(x, y, w, h, '#F1E7CF') + [0, 1, 2].map((i) => R(x + 6, y + 7 + i * 7, w - 12 - i * 8, 3, '#8A7A5A', 0)).join(''),
        cctv: (x, y, w, h) => R(x, y + h * 0.3, w * 0.7, h * 0.45, '#C0C7D0') + R(x + w * 0.7, y + h * 0.4, w * 0.3, h * 0.25, '#4A4A52') + `<circle cx="${x + w * 0.12}" cy="${y + h * 0.5}" r="3" fill="#34D399"/>` + R(x + w * 0.3, y, 5, h * 0.3, '#4A4A52', 0),
        screws: (x, y, w, h) => `<circle cx="${x + w / 2}" cy="${y + 6}" r="5" fill="#C9A227" stroke="${INK}" stroke-width="2"/><circle cx="${x + w / 2}" cy="${y + h - 6}" r="5" fill="#C9A227" stroke="${INK}" stroke-width="2"/>`,
        floormarks: (x, y, w, h) => `<path d="M${x + 10},${y + h - 10} L${x + w - 20},${y + 10} M${x + 24},${y + h - 6} L${x + w - 6},${y + 16}" stroke="rgba(0,0,0,.14)" stroke-width="2" fill="none"/>`,
        monitors: (x, y, w, h) => R(x, y, w, h, '#2A2A2A') + [0, 1, 2, 3].map((i) => R(x + 8 + (i % 2) * (w / 2 - 4), y + 8 + Math.floor(i / 2) * (h / 2 - 4), w / 2 - 12, h / 2 - 12, ['#1D3E5E', '#24402E', '#3A3A3A', '#1F3A2A'][i], 2)).join(''),
        keyboard: (x, y, w, h) => R(x, y, w, h, '#2A2A2A') + Array.from({ length: 10 }, (_, i) => R(x + 4 + i * (w - 8) / 10, y + 4, (w - 8) / 10 - 3, h - 8, '#5A5A62', 0)).join(''),
        sticky: (x, y, w, h) => R(x, y, w, h, '#FDE047', 1),
        rota: (x, y, w, h) => R(x, y, w, h, '#F7F4EC') + Array.from({ length: 7 }, (_, i) => R(x + 6, y + 10 + i * 10, w - 12 - (i % 3) * 8, 3, '#8A96A6', 0)).join('') + R(x + w / 2 - 4, y - 4, 8, 8, '#B0362A', 1),
        mug: (x, y, w, h) => R(x, y, w * 0.75, h, '#F7F4EC') + R(x + w * 0.75, y + h * 0.25, w * 0.25, h * 0.4, 'none', 2),
        chair: (x, y, w, h) => R(x + w * 0.15, y, w * 0.7, h * 0.5, '#2A2A2A') + R(x, y + h * 0.5, w, h * 0.15, '#2A2A2A') + R(x + w * 0.45, y + h * 0.65, w * 0.1, h * 0.3, '#5A5A62', 0) + R(x + w * 0.15, y + h * 0.92, w * 0.7, 6, '#5A5A62') + R(x + w * 0.2, y + h * 0.05, w * 0.6, h * 0.3, '#B07A4A', 0),
        charger: (x, y, w, h) => R(x + w * 0.3, y, w * 0.4, h * 0.4, '#F7F4EC') + `<path d="M${x + w / 2},${y + h * 0.4} q0,${h * 0.5} ${w * 0.4},${h * 0.55}" stroke="#F7F4EC" stroke-width="3" fill="none"/>`,
        trolley: (x, y, w, h) => R(x, y, w, 8, '#C0C7D0') + R(x, y + h * 0.55, w, 8, '#C0C7D0') + R(x + 4, y, 6, h * 0.85, '#8A96A6', 0) + R(x + w - 10, y, 6, h * 0.85, '#8A96A6', 0) + [0, 1, 2].map((i) => R(x + 14 + i * 28, y - 10, 22, 10, '#F7F4EC', 1)).join('') + `<circle cx="${x + 10}" cy="${y + h - 6}" r="7" fill="#2A2A2A"/><circle cx="${x + w - 10}" cy="${y + h - 6}" r="7" fill="#2A2A2A"/>`,
        crate: (x, y, w, h, it) => R(x, y, w, h, '#A0703A') + R(x + 4, y + 4, w - 8, h - 8, '#B88A4E', 2) + `<text x="${x + w / 2}" y="${y + h / 2 + 6}" font-size="18" font-family="monospace" font-weight="900" fill="#3E2614" text-anchor="middle">${it.label || ''}</text>`,
        menuboard: (x, y, w, h) => R(x, y, w, h, '#1B1B1B') + Array.from({ length: 4 }, (_, i) => R(x + 10, y + 14 + i * 15, w - 30 - (i % 2) * 20, 3, '#F7F4EC', 0)).join(''),
        apron: (x, y, w, h) => R(x, y, w, 6, '#6B4423') + [0, 1, 2].map((i) => R(x + 2 + i * 10, y + 6, 8, h * 0.6, ['#F7F4EC', '#B0362A', '#F7F4EC'][i], 1)).join(''),
        ramp: (x, y, w, h) => `<path d="M${x},${y + h} L${x + w},${y + h} L${x + w},${y} Z" fill="#6B6B6B" stroke="${INK}" stroke-width="3"/>`,
        scale: (x, y, w, h) => R(x, y + h * 0.5, w, h * 0.5, '#6B7A8C') + R(x + w * 0.35, y, w * 0.3, h * 0.45, '#2A2A2A') + R(x + w * 0.4, y + 5, w * 0.2, h * 0.15, '#24402E', 0),
        pallet: (x, y, w, h) => [0, 1, 2].map((i) => R(x, y + i * h / 3, w, h / 3 - 3, '#B88A4E', 1)).join(''),
        rolldoor: (x, y, w, h) => R(x, y, w, h, '#8A96A6') + Array.from({ length: 10 }, (_, i) => R(x, y + i * h / 10, w, 2, '#5A6472', 0)).join('') + R(x + w / 2 - 15, y + h - 14, 30, 8, '#3E3E3E', 0),
        easel: (x, y, w, h, it) => `<path d="M${x + w * 0.2},${y + h} L${x + w / 2},${y} L${x + w * 0.8},${y + h} M${x + w / 2},${y} L${x + w / 2},${y + h}" stroke="#8A5A2B" stroke-width="8"/>` + R(x + w * 0.1, y + h * 0.62, w * 0.8, 8, '#6B4423')
          + (it.full ? R(x + w * 0.12, y + h * 0.1, w * 0.76, h * 0.52, '#F7F4EC', 2) + R(x + w * 0.15, y + h * 0.13, w * 0.7, h * 0.22, '#F2C38A', 0) + `<path d="M${x + w * 0.2},${y + h * 0.5} l${w * 0.6},0 M${x + w * 0.48},${y + h * 0.3} l0,${h * 0.2}" stroke="#9AA6A0" stroke-width="2"/>` : ''),
        painttable: (x, y, w, h) => R(x, y, w, h * 0.2, '#8A5A2B') + R(x + 8, y + h * 0.2, 8, h * 0.8, '#6B4423') + R(x + w - 16, y + h * 0.2, 8, h * 0.8, '#6B4423') + ['#F7F4EC', '#2B6FA8', '#B0362A', '#C9A227', '#3A7D44'].map((c, i) => R(x + 10 + i * 24, y - 10, 18, 10, c, 1)).join(''),
        canvasstack: (x, y, w, h) => [0, 1, 2, 3].map((i) => R(x + i * 12, y + i * 6, w - 36, h - i * 6, i % 2 ? '#EDE6D6' : '#F7F4EC', 2)).join(''),
        filing: (x, y, w, h) => R(x, y, w, h, '#9DB4CC') + [0, 1, 2, 3].map((i) => R(x + 8, y + 10 + i * (h - 20) / 4, w - 16, (h - 20) / 4 - 8, '#B4C1CF', 2) + R(x + w / 2 - 10, y + 22 + i * (h - 20) / 4, 20, 5, '#4A4A52', 0)).join(''),
        safe: (x, y, w, h) => R(x, y, w, h, '#4A4A52') + `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${h * 0.22}" fill="#8A96A6" stroke="${INK}" stroke-width="3"/>`,
        coat: (x, y, w, h, it) => R(x + w / 2 - 3, y, 6, 8, '#4A4A52') + `<path d="M${x + 4},${y + 10} L${x + w - 4},${y + 10} L${x + w},${y + h} L${x},${y + h} Z" fill="${it.col || '#2B4C7A'}" stroke="${INK}" stroke-width="3"/>` + R(x + w * 0.2, y + h * 0.55, w * 0.25, h * 0.15, 'rgba(0,0,0,.2)', 0),
        bigrail: (x, y, w, h) => R(x, y, w, 8, '#3E2614') + R(x, y, 8, h, '#3E2614') + R(x + w - 8, y, 8, h, '#3E2614') + [0, 1, 2, 3].map((i) => R(x + 20 + i * (w - 40) / 3, y + 8, 4, 14, '#C0C7D0', 0)).join(''),
        mirror: (x, y, w, h) => R(x, y, w, h, '#8A5A2B') + R(x + 6, y + 6, w - 12, h - 12, '#BFD7EA', 2) + `<path d="M${x + 16},${y + 20} l14,-10" stroke="#F7F4EC" stroke-width="3"/>`,
        umbrella: (x, y, w, h) => R(x + w * 0.15, y + h * 0.4, w * 0.7, h * 0.6, '#4A4A52') + [0, 1, 2].map((i) => R(x + w * 0.22 + i * w * 0.2, y + i * 6, 5, h * 0.5, ['#B0362A', '#2B4C7A', '#2A2A2A'][i], 0)).join(''),
        auctionboard: (x, y, w, h) => R(x, y, w, h * 0.75, '#1D3954') + Array.from({ length: 3 }, (_, i) => R(x + 8, y + 12 + i * 16, w - 16 - (i % 2) * 14, 4, '#F7F4EC', 0)).join('') + `<path d="M${x + w * 0.3},${y + h * 0.75} L${x + w * 0.2},${y + h} M${x + w * 0.7},${y + h * 0.75} L${x + w * 0.8},${y + h}" stroke="#6B4423" stroke-width="5"/>`,
        rtable: (x, y, w, h) => R(x, y, w, h * 0.5, '#F7F4EC') + R(x + w * 0.1, y + h * 0.5, 8, h * 0.5, '#6B4423') + R(x + w * 0.9 - 8, y + h * 0.5, 8, h * 0.5, '#6B4423') + [0, 1, 2].map((i) => R(x + 10 + i * (w - 30) / 2, y + 6, 12, 8, '#C9A227', 0)).join(''),
      });
      FLAT.push('floormarks');
      const FLOOR = {
        wood: (c) => R(0, 150, 600, 190, c, 0) + Array.from({ length: 7 }, (_, i) => `<path d="M0,${170 + i * 26} L600,${170 + i * 26}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>`).join(''),
        tile: (c) => R(0, 150, 600, 190, c, 0) + Array.from({ length: 12 }, (_, i) => `<path d="M${i * 50},150 L${i * 50},340" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`).join('') + Array.from({ length: 4 }, (_, i) => `<path d="M0,${150 + i * 48} L600,${150 + i * 48}" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`).join(''),
        grass: (c) => R(0, 150, 600, 190, c, 0) + Array.from({ length: 60 }, (_, i) => R((i * 97) % 600, 160 + (i * 53) % 170, 3, 6, '#2F5E34', 0)).join(''),
        carpet: (c) => R(0, 150, 600, 190, c, 0) + Array.from({ length: 40 }, (_, i) => R((i * 61) % 600, 160 + (i * 37) % 170, 10, 4, 'rgba(255,255,255,.08)', 0)).join(''),
        stone: (c) => R(0, 150, 600, 190, c, 0) + Array.from({ length: 24 }, (_, i) => R((i % 6) * 100 + (Math.floor(i / 6) % 2) * 50, 150 + Math.floor(i / 6) * 48, 100, 48, 'none', 2)).join(''),
      };
      function roomSVG(room, looked, opt) {
        opt = opt || {};
        if (opt.before && room.before) room = Object.assign({}, room, { items: room.items.map((it, i) => Object.assign({}, it, room.before[i] || {})) });
        const wall = room.fl === 'grass' ? `<rect x="0" y="0" width="600" height="150" fill="${room.wall}"/>` + Array.from({ length: 20 }, (_, i) => `<path d="M${(i * 71) % 600},${(i * 37) % 130} l-4,12" stroke="#7DB8E0" stroke-width="2"/>`).join('')
          : `<rect x="0" y="0" width="600" height="150" fill="${room.wall}"/><rect x="0" y="140" width="600" height="12" fill="rgba(0,0,0,.3)"/>`;
        return `<svg class="cf-roomsvg" viewBox="0 0 600 340" xmlns="http://www.w3.org/2000/svg">${wall}${(FLOOR[room.fl] || FLOOR.wood)(room.floor)}
          ${room.items.map((it, i) => [it, i]).sort((a, b) => (FLAT.includes(b[0].k) ? 1 : 0) - (FLAT.includes(a[0].k) ? 1 : 0)).map(([it, i]) => `<g class="cf-it ${looked[i] ? 'looked' : ''}" data-item="${i}">${it.tilt ? `<g transform="rotate(${it.tilt} ${it.x + it.w / 2} ${it.y + it.h / 2})">` : ''}${(ART[it.k] || ART.shelfbox)(it.x, it.y, it.w, it.h, it)}${it.tilt ? '</g>' : ''}${opt.uv && it.uv && !/^Nothing/.test(it.uv) ? Array.from({ length: 5 }, (_, j) => `<circle class="uvg" cx="${it.x + it.w * (0.2 + ((j * 37) % 60) / 100)}" cy="${it.y + it.h * (0.25 + ((j * 53) % 50) / 100)}" r="${5 + (j % 3) * 3}"/>`).join('') : ''}<rect class="hit" x="${it.x - 6}" y="${it.y - 6}" width="${it.w + 12}" height="${it.h + 12}"/>${looked[i] && !opt.before ? `<g transform="translate(${it.x + it.w - 4},${it.y - 4})"><rect x="-9" y="-9" width="18" height="18" fill="#F7F4EC" stroke="${INK}" stroke-width="2"/><path d="M-5,0 l3,4 l6,-8" stroke="${INK}" stroke-width="2.5" fill="none"/></g>` : ''}</g>`).join('')}</svg>`;
      }
      const cases = () => { if (!CASES) CASES = (window.CASE_DEFS || []).map((f) => f(face)); return CASES; };

      // ---------- setup ----------
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1400px] mx-auto');
        setupScreen(body, mod, [
          { key: 'case', label: 'THE CASE', def: 'harbor', hero: true, hint: 'More cases are coming. Each one takes about 20-50 minutes.', choices: cases().map((c) => [c.id, `#${c.num} · ${c.title} (${c.mins || '20-30'} min)`]) },
          { key: 'ver', label: 'VERSION', def: 'shuffle', when: (sel) => !!(cases().find((c) => c.id === sel.case) || {}).make, hint: 'Shuffled: a different culprit, different times and clues every time you play.', choices: [['shuffle', 'Shuffled (different every game)'], ['classic', 'Classic (always the same)']] },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }], sel)),
        'A co-op detective case for two. One of you has the crime scene, the other has the records. Work it out together!');
      }
      function start(body, sel, S) {
        const base = cases().find((c) => c.id === sel.case) || cases()[0];
        const C = base.make ? base.make(sel.ver === 'classic' ? { v: 0, off: 0, code: '4417' } : { v: S.rng.rnd(base.variants), off: S.rng.rnd(3), code: String(1000 + S.rng.rnd(9000)) }) : base;
        const solo = S.n === 1;
        G = { S, C, solo, me: S.online ? S.me : 0, view: 'A', tab: 'brief', room: Object.keys(C.ROOMS)[0], open: null, sus: C.SUSPECTS[0],
          found: {}, looked: {}, marks: {}, notes: {}, tool: 'hand', bag: [], labRes: {}, tl: [], btab: 'board', ctab: 'cams', cam: { m: 0, big: null, play: false }, ph: null, zoom: false, before: false, labSel: null, drawer: -1, doc: null, item: null, log: {}, pins: [], strings: [], asked: {}, feed: [], hints: 0, tries: 0, acc: { who: null, how: null, why: null, ev: [] }, prop: null, solved: false, selPin: null, noteN: 0, over: false, tok: ++GT.cur, t0: Date.now() };
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
        else if (a.t === 'look') { G.looked[a.room + ':' + a.i + (a.tool ? ':' + a.tool : '')] = 1; G.looked[a.room + ':' + a.i] = 1; const it = C.ROOMS[a.room] && C.ROOMS[a.room].items[a.i]; const cid = it && (a.tool === 'uv' ? it.cu : a.tool === 'mag' ? it.cm : it.c); if (cid && !G.found[cid]) { G.found[cid] = 1; if (a.s !== G.me) feed(a.s, `${T('found', 'tìm thấy')} <b>${esc(title(cid))}</b>`); } }
        else if (a.t === 'bag') { const it = C.ROOMS[a.room] && C.ROOMS[a.room].items[a.i]; if (it && it.lab) { const k = labKey(it, a.room, a.i), at = G.bag.findIndex((b) => b.k === k);
            if (at >= 0) { G.bag.splice(at, 1); feed(a.s, `${T('took out of the evidence bag', 'lấy ra khỏi túi chứng cứ')}: <b>${esc(it.n)}</b>`); }
            else if (G.bag.length < (C.BAG || 6)) { G.bag.push({ k, room: a.room, i: a.i }); feed(a.s, `${T('sent to the lab', 'gửi đến phòng lab')}: <b>${esc(it.n)}</b>`); if (a.s !== G.me && G.role !== 'A') toast(`🧪 ${T('New in the lab', 'Mới ở phòng lab')}: ${esc(it.n)}`); } } }
        else if (a.t === 'test') { const id = `lab:${a.k}:${a.test}`; if (!G.labRes[id]) { G.labRes[id] = 1; G.found[id] = 1; feed(a.s, `${T('ran a lab test on', 'làm xét nghiệm')} <b>${esc(title(id))}</b>`); } }
        else if (a.t === 'tl') { G.tl.push({ who: a.who, m: a.m, place: a.place, s: a.s }); }
        else if (a.t === 'untl') { G.tl.splice(a.i, 1); }
        else if (a.t === 'mark') { const p = G.pins.find((q) => q.id === a.id); if (p) { if (a.rows) p.rows = a.rows.slice(0, 20); if (a.note != null) p.note = String(a.note).slice(0, 160); feed(a.s, `${T('updated the card', 'cập nhật thẻ')} <b>${esc(title(a.id))}</b>`); } }
        else if (a.t === 'show') { const tk = C.TALK[a.sus]; if (tk) { const fr = frameReact(a.sus, a.id); (G.log[a.sus] = G.log[a.sus] || []).push({ q: `${T('Shows', 'Đưa ra')}: ${title(a.id)}`, a: tk.show[a.id] || (fr && fr.a) || tk.shrug, hot: !!(tk.show[a.id] || (fr && fr.hot)), ev: 1 }); feed(a.s, `${T('showed', 'đưa')} <b>${esc(title(a.id))}</b> ${T('to', 'cho')} <b>${esc(C.PEOPLE[a.sus].name)}</b>`); } }
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
          G.weak = p.ev.filter((x) => isStrong(x)).length < 3 ? 1 : 0; G.solved = true; G.tab = 'acc'; G.over = true; GT.over = true;
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
      // any card: a document, any object in a room (as seen, under UV, or up close), a camera frame, a photo or a lab result
      function itemOf(id) {
        const C = G.C; if (!G._itemOf) { G._itemOf = {}; Object.entries(C.ROOMS).forEach(([rk, r]) => r.items.forEach((it, i) => {
          [['', it.c], ['uv', it.cu], ['mag', it.cm]].forEach(([md, cid]) => { const o = { it, rk, i, room: r, mode: md }; G._itemOf['it:' + rk + ':' + i + (md ? ':' + md : '')] = o; if (cid) G._itemOf[cid] = o; }); })); }
        return G._itemOf[id];
      }
      const TESTS_ = () => [['mag', T('Microscope', 'Kính hiển vi')], ['uv', T('UV lamp', 'Đèn UV')], ['prints', T('Fingerprint powder', 'Bột vân tay')], ['threads', T('Thread test', 'Soi sợi vải')]];
      const labKey = (it, rk, i) => it.c || 'it:' + rk + ':' + i;
      function labText(it, test) { const r = it.lab && it.lab[test]; return r || T('Nothing useful: this test shows nothing here.', 'Không có gì: phép thử này không cho kết quả.'); }
      function card(id) {
        const C = G.C, c = C.CLUES[id];
        let m = /^lab:(.+):(\w+)$/.exec(id);
        if (m) { const o = itemOf(m[1]); if (!o) return null; return { who: 'B', icon: 'lab', title: `${T('Lab', 'Phòng lab')} · ${o.it.n} · ${(TESTS_().find((x) => x[0] === m[2]) || ['', ''])[1]}`, text: labText(o.it, m[2]) }; }
        m = /^(cam|ph):(\w+):(\d+)$/.exec(id);
        if (m) { const f = frameOf(id); return f ? { who: 'B', icon: 'cam', title: f.title, text: '', snap: f } : null; }
        const o = itemOf(id);
        if (o) { const md = o.mode, it = o.it; return { who: 'A', icon: 'glass', title: it.n + (md === 'uv' ? ' · ' + T('UV light', 'đèn UV') : md === 'mag' ? ' · ' + T('close up', 'nhìn gần') : ''), text: md === 'uv' ? it.uv : md === 'mag' ? it.mag : (c && c.text) || it.t, room: o.room.name }; }
        return c || null;
      }
      const objId = (room, i, md) => { const it = G.C.ROOMS[room].items[i]; return md === 'uv' ? (it.cu || `it:${room}:${i}:uv`) : md === 'mag' ? (it.cm || `it:${room}:${i}:mag`) : (it.c || 'it:' + room + ':' + i); };

      // ---------- cameras and photos: drawn from where everyone was, minute by minute ----------
      const fmtM = (m) => (G.C.fmt ? G.C.fmt(m) : m);
      function whereAt(sch, m) {
        let i = 0; for (let j = 0; j < sch.length; j++) { if (sch[j][0] <= m) i = j; else break; }
        const e = sch[i], n = sch[i + 1]; let x = e[2];
        if (n && n[1] === e[1] && n[0] > e[0]) x = e[2] + (n[2] - e[2]) * Math.min(1, (m - e[0]) / (n[0] - e[0]));
        return { place: e[1], x, f: e[3] || '' };
      }
      const colOf = (k) => (G.C.PEOPLE[k] || G.C.EXTRA[k] || {}).col || ['#333', '#C68A62', '#777'];
      function peopleAt(place, m) { const out = []; Object.entries(G.C.S).forEach(([k, sch]) => { const w = whereAt(sch, m); if (w.place === place) out.push({ k, x: w.x, f: w.f }); }); return out; }
      const camOff = (cam, m) => (cam.off || []).some(([a, b]) => m >= a && m < b);
      function frameOf(id) {
        const C = G.C, m = /^(cam|ph):(\w+):(\d+)$/.exec(id); if (!m) return null;
        if (m[1] === 'cam') { const cam = C.CAMS.find((c) => c.id === m[2]); if (!cam) return null; const t = +m[3];
          return { kind: 'cam', cam, place: cam.place, m: t, a: cam.from || 0, b: cam.to == null ? 1 : cam.to, off: camOff(cam, t), title: `${cam.name.split(' · ')[0]} · ${fmtM(t)}` }; }
        const p = photos()[+m[3]]; if (!p) return null;
        return { kind: 'ph', place: p.place, m: p.t, a: p.a, b: p.b, title: `${T('Photo', 'Ảnh')} #${+m[3] + 1} · ${fmtM(p.t)}` };
      }
      const visibleIn = (f) => (f.off ? [] : peopleAt(f.place, f.m).filter((p) => p.x >= f.a - 0.02 && p.x <= f.b + 0.02).map((p) => p.k));
      // the photographer's pictures (the same on every screen: worked out from the case, no dice)
      function photos() {
        const C = G.C; if (C._ph) return C._ph;
        let h = 0; String(C.code + C.W).split('').forEach((ch) => { h = (h * 31 + ch.charCodeAt(0)) >>> 0; });
        const rnd = () => { h = (h * 1103515245 + 12345) >>> 0; return (h >>> 8) / 16777216; };
        const out = [], CL = [0, 1, 27, 44, 46];
        for (let k = 0; k < 48; k++) {
          const t = 2 + k * 5;
          if (CL.includes(k)) { out.push({ t, place: 'cloak', a: 0, b: 1 }); continue; }
          let c;
          if (t >= C.W && t < C.W + 11) {   // during the swap the photographer happens to catch the people the hall camera can't see
            const need = C.SUSPECTS.filter((s) => s !== C.culprit).map((s) => ({ s, w: whereAt(C.S[s], t) })).filter((o) => o.w.place === 'hall' && o.w.x >= 0.58);
            c = need.length ? need[k % need.length].w.x : 0.3 + rnd() * 0.4;
          } else { const ps = peopleAt('hall', t); c = ps.length ? ps[Math.floor(rnd() * ps.length)].x : 0.5; }
          c = Math.max(0.24, Math.min(0.76, c + (rnd() - 0.5) * 0.12));
          out.push({ t, place: 'hall', a: c - 0.24, b: c + 0.24 });
        }
        C._ph = out; return out;
      }
      const PX = (x) => 10 + x * 300;
      const R0 = (x, y, w, h, f, s) => `<rect x="${x.toFixed ? x.toFixed(1) : x}" y="${y}" width="${w}" height="${h}" fill="${f}"${s ? ` stroke="${INK}" stroke-width="${s}"` : ''}/>`;
      function fig(k, x, f) {
        const [hr, sk, cl] = colOf(k), px = PX(x), d = (k.charCodeAt(0) + k.length * 7) % 3, by = 158 + d * 6;
        let o = '';
        if (f.includes('T')) o += R0(px + 8, by - 18, 30, 3, '#C0C7D0', 1) + R0(px + 10, by - 15, 26, 8, '#A0703A', 1) + R0(px + 8, by - 7, 30, 3, '#C0C7D0', 1) + `<circle cx="${px + 12}" cy="${by - 2}" r="2.5" fill="#222"/><circle cx="${px + 34}" cy="${by - 2}" r="2.5" fill="#222"/>`;
        o += R0(px - 6, by - 9, 5, 9, '#1B1B1B') + R0(px + 1, by - 9, 5, 9, '#1B1B1B') + R0(px - 7, by - 23, 14, 15, cl, 1) + R0(px - 5, by - 32, 10, 10, sk, 1) + R0(px - 5, by - 34, 10, 4, hr);
        if (f.includes('B')) o += R0(px - 16, by - 24, 32, 7, '#C9A27A', 1);
        if (f.includes('S')) o += R0(px - 13, by - 28, 24, 19, '#F1E7CF', 1);
        if (f.includes('P')) o += R0(px + 5, by - 27, 15, 21, '#2A2A2A', 1);
        return { by, o };
      }
      const BG = {
        hall: () => R0(0, 0, 320, 100, '#5A3A22') + R0(0, 100, 320, 80, '#7A2E3A') + R0(4, 88, 76, 30, '#3E2614', 1) + R0(40, 50, 3, 40, '#2A2A2A') + R0(34, 46, 15, 8, '#C0C7D0', 1)
          + [100, 150, 200].map((x) => R0(x, 118, 34, 12, '#F1E7CF', 1)).join('') + R0(236, 92, 80, 26, '#8A5A2B', 1) + [0, 1, 2, 3, 4].map((i) => R0(244 + i * 14, 80, 6, 12, '#C9A227')).join('') + R0(140, 26, 26, 50, '#6B4423', 1) + `<text x="153" y="22" font-size="7" fill="#F1E7CF" text-anchor="middle">STAFF</text>`,
        gallery: () => R0(0, 0, 320, 110, '#3B4A5A') + R0(0, 110, 320, 70, '#B89A6A') + R0(130, 26, 62, 50, '#C9A227', 2) + R0(136, 32, 50, 38, '#F2C38A') + R0(136, 54, 50, 16, '#2B6FA8') + R0(158, 38, 5, 18, '#F7F4EC') + R0(30, 34, 36, 28, '#8A5A2B', 1) + R0(250, 30, 30, 36, '#8A5A2B', 1) + R0(130, 120, 70, 12, '#6B4423', 1),
        corridor: () => R0(0, 0, 320, 110, '#4A5562') + R0(0, 110, 320, 70, '#6B7A8C') + [['SECURITY', 0.15], ['OFFICE', 0.35], ['STUDIO', 0.55], ['KITCHEN', 0.75]].map(([l, x]) => R0(PX(x) - 14, 46, 28, 66, '#8A5A2B', 1) + `<text x="${PX(x)}" y="42" font-size="7" fill="#F7F4EC" text-anchor="middle">${l}</text>`).join('')
          + `<text x="6" y="100" font-size="7" fill="#F7F4EC">◀ HALL</text><text x="314" y="100" font-size="7" fill="#F7F4EC" text-anchor="end">GALLERY / DOCK ▶</text>`,
        dock: () => R0(0, 0, 320, 110, '#2A3340') + R0(0, 110, 320, 70, '#4A4A4A') + R0(200, 20, 110, 90, '#6B7A8C', 1) + [0, 1, 2, 3, 4, 5].map((i) => R0(200, 30 + i * 13, 110, 2, '#4A5562')).join('') + R0(20, 60, 60, 50, '#5A5A5A', 1) + `<text x="10" y="100" font-size="7" fill="#F7F4EC">◀ CORRIDOR</text>`,
        cloak: () => R0(0, 0, 320, 110, '#6B4423') + R0(0, 110, 320, 70, '#8A6A44') + R0(60, 96, 80, 26, '#5A3A22', 1) + R0(170, 30, 90, 4, '#3E2614') + [0, 1, 2, 3, 4].map((i) => R0(176 + i * 17, 34, 12, 36, ['#2B4C7A', '#7A2E3A', '#3A3A3A', '#C9A227', '#5A3A22'][i], 1)).join('') + R0(276, 30, 34, 80, '#3E2614', 1) + `<text x="293" y="26" font-size="7" fill="#F7F4EC" text-anchor="middle">EXIT</text>`,
      };
      function frameSVG(f, opt) {
        opt = opt || {};
        const vx = PX(f.a) - 8, vw = (f.b - f.a) * 300 + 16, vy = f.kind === 'ph' ? 56 : 0, vh = 180 - vy;
        let inner;
        if (f.off) inner = R0(0, 0, 320, 180, '#111') + Array.from({ length: 160 }, (_, i) => { const r = ((i * 2654435761) >>> 0) % 57600; return R0(r % 320, Math.floor(r / 320), 5 + (i % 4) * 2, 2, i % 3 ? '#333' : '#555'); }).join('') + `<text x="${vx + vw / 2}" y="94" font-size="14" fill="#F7F4EC" text-anchor="middle" font-family="monospace">NO SIGNAL</text>`;
        else {
          const figs = peopleAt(f.place, f.m).map((p) => fig(p.k, p.x, p.f)).sort((a, b) => a.by - b.by).map((q) => q.o).join('');
          inner = BG[f.place]() + figs + (f.place === 'dock' ? R0(0, 0, 320, 180, 'rgba(60,255,120,.16)') : '');
        }
        const stamp = f.kind === 'cam' ? `<rect x="${vx + 2}" y="2" width="${Math.min(vw - 4, 96)}" height="12" fill="rgba(0,0,0,.6)"/><text x="${vx + 5}" y="11" font-size="8" fill="#F7F4EC" font-family="monospace">${f.cam.id.toUpperCase()} ${fmtM(f.m)}</text>` : '';
        return `<svg class="cf-frame ${opt.cls || ''}" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${inner}${stamp}</svg>`;
      }
      // a suspect shown a camera frame or photo: the guilty one squirms if it's from around the swap
      function frameReact(sus, id) {
        const f = frameOf(id); if (!f || !visibleIn(f).includes(sus)) return null;
        const C = G.C;
        if (sus === C.culprit && f.m >= C.W - 8 && f.m <= C.W + 22 && C.CAUGHT[sus]) return { a: C.CAUGHT[sus], hot: true };
        return { a: T(`"Yes, that's me, at ${fmtM(f.m)}. So?"`, `"Đúng, tôi đấy, lúc ${fmtM(f.m)}. Thì sao?"`), hot: false };
      }
      function isStrong(id) {
        const C = G.C; if ((C.STRONG || []).includes(id)) return true;
        const f = /^(cam|ph):/.test(id) && frameOf(id); if (!f) return false;
        if (f.off) return true;
        return f.m >= C.W - 8 && f.m <= C.W + 22 && visibleIn(f).includes(C.culprit) && f.place !== 'hall';
      }
      // fairness check for every version of a replayable case (used by test/t_case2_fair.py)
      function fair(C) {
        const G0 = G; G = Object.assign({}, G0 || {}, { C, _itemOf: null }); const bad = [];
        try {
          const win = []; for (let m = C.W; m < C.W + 11; m++) win.push(m);
          Object.entries(C.S).forEach(([k, s]) => { if (s[0][0] > 0) bad.push(k + ' has no place at 7 pm'); for (let i = 1; i < s.length; i++) if (s[i][0] < s[i - 1][0]) bad.push(k + ' times out of order'); });
          const seenBy = (k, m) => C.CAMS.some((cam) => { const f = frameOf(`cam:${cam.id}:${m}`); return visibleIn(f).includes(k); }) || photos().some((p, n) => p.t === m && visibleIn(frameOf(`ph:x:${n}`)).includes(k));
          if (!win.every((m) => camOff(C.CAMS.find((c) => c.id === 'c2'), m))) bad.push('gallery camera not off for the whole swap');
          win.forEach((m) => { const w = whereAt(C.S[C.culprit], m); if (['hall', 'cloak', 'kitchen', 'staff', 'out'].includes(w.place)) bad.push('culprit somewhere innocent at ' + m); if (C.CAMS.some((cam) => cam.place !== 'corridor' && visibleIn(frameOf(`cam:${cam.id}:${m}`)).includes(C.culprit)) || photos().some((p, n) => p.t === m && visibleIn(frameOf(`ph:x:${n}`)).includes(C.culprit))) bad.push('culprit has an alibi on camera at ' + m); });
          C.SUSPECTS.filter((s) => s !== C.culprit).forEach((s) => {
            const away = win.some((m) => whereAt(C.S[s], m).place !== 'hall');
            if (away && !(C.ALIBI || {})[s]) bad.push(s + ' left the hall during the swap with no alibi record');
            if (!away && !win.some((m) => seenBy(s, m))) bad.push(s + ' is never seen during the swap');
          });
          if (![-3, -2, -1, 0, 1].some((d) => visibleIn(frameOf(`cam:c3:${C.W + d}`)).includes(C.culprit))) bad.push('culprit never on the corridor camera around the swap');
          if (!C.HOW.some((h) => h[0] === C.KEY.how) || !C.WHY.some((h) => h[0] === C.KEY.why)) bad.push('answer not among the choices');
          (C.STRONG || []).forEach((id) => { if (!card(id)) bad.push('strong clue missing: ' + id); });
          if ((C.STRONG || []).filter((id) => card(id)).length < 6) bad.push('not enough strong clues');
        } catch (e) { bad.push('error: ' + e.message); }
        G = G0; return bad;
      }
      const rowText = (r) => (Array.isArray(r) ? r.filter(Boolean).join(' · ') : r);
      // what a card on the board says: only what was found or marked, never the conclusion
      function cardSummary(p) {
        const c = card(p.id); if (!c) return esc(p.text || '');
        const nt = p.note ? `<span class="pn">✎ ${esc(p.note)}</span>` : '';
        if (c.snap) return `<span class="snap">${frameSVG(c.snap)}</span>` + nt;
        if (/^lab:/.test(p.id)) { const t = plain(c.text); return esc(t.length > 120 ? t.slice(0, 117) + '...' : t) + nt; }
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
          ? `<div class="cf-who"><button class="a ${G.view === 'A' ? 'on' : ''}" data-view="A">${T('Scene', 'Hiện trường')}</button><button class="b ${G.view === 'B' ? 'on' : ''}" data-view="B">${C.desk === 'control' ? T('Control room', 'Phòng điều khiển') : T('Records', 'Hồ sơ')}</button></div>`
          : `<span class="cf-me ${G.role.toLowerCase()}">${G.role === 'A' ? T('YOU: THE SCENE', 'BẠN: HIỆN TRƯỜNG') : C.desk === 'control' ? T('YOU: THE CONTROL ROOM', 'BẠN: PHÒNG ĐIỀU KHIỂN') : T('YOU: THE RECORDS', 'BẠN: HỒ SƠ')}</span>`;
        $('#cf-top').innerHTML = `<span class="cf-case pix">CASE #${C.num} · ${esc(C.title).toUpperCase()}</span>${who}<span class="cf-note">${G.solo ? T('Playing alone: you hold both halves. Switch between the scene and the records.', 'Chơi một mình: bạn giữ cả hai nửa. Chuyển qua lại giữa hiện trường và hồ sơ.')
          : G.partnerLeft ? T('Your partner left: you now hold both halves.', 'Cộng sự đã rời: giờ bạn giữ cả hai nửa.')
          : `${T('Partner', 'Cộng sự')}: <b>${esc(partner())}</b> · ${G.role === 'A' ? (C.desk === 'control' ? T('the control room', 'phòng điều khiển') : T('the records', 'hồ sơ')) : T('the scene', 'hiện trường')}. ${T('Pin clues so they can see them, and talk!', 'Ghim manh mối để họ thấy, và trao đổi nhé!')}`}</span>`;
        const v = G.view;
        const list = [['brief', T('Briefing', 'Tóm tắt')], ['inv', v === 'A' ? T('Crime scene', 'Hiện trường') : C.desk === 'control' ? T('Control room', 'Phòng điều khiển') : T('Records', 'Hồ sơ')], ['sus', T('Interviews', 'Thẩm vấn')], ['board', T('Evidence board', 'Bảng chứng cứ'), G.pins.length], ['acc', T('Accuse', 'Buộc tội'), G.prop ? '!' : 0]];
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
        const C = G.C, room = C.ROOMS[G.room], tools = C.TOOLS;
        const looked = {}; room.items.forEach((_, i) => { if (G.looked[G.room + ':' + i]) looked[i] = 1; });
        const nav = `<div class="cf-rooms">${Object.entries(C.ROOMS).map(([k, o]) => `<button class="cf-rbtn ${G.room === k ? 'on' : ''}" data-room="${k}" style="--rc:${o.col || '#9DB4CC'}">${esc(o.name)}${o.dark ? ' <small>(' + T('dark', 'tối') + ')</small>' : ''}</button>`).join('')}</div>`;
        const it = G.item != null ? room.items[G.item] : null, md = G.itemMode || '';
        const TL = { hand: ['✋', T('Look', 'Nhìn')], light: ['🔦', T('Flashlight', 'Đèn pin')], uv: ['◉', T('UV light', 'Đèn UV')], mag: ['🔍', T('Magnifier', 'Kính lúp')], bag: ['👜', T('Evidence bag', 'Túi chứng cứ')] };
        const belt = tools ? `<div class="cf-belt"><span class="pix">${T('TOOL BELT', 'DỤNG CỤ')}</span>${tools.map((t) => `<button class="cf-tool ${G.tool === t ? 'on' : ''} t-${t}" data-tool="${t}"><i>${TL[t][0]}</i>${TL[t][1]}${t === 'bag' ? ` <b>${G.bag.length}/${C.BAG || 6}</b>` : ''}</button>`).join('')}
          ${room.before ? `<button class="cf-tool cf-beforebtn ${G.before ? 'on' : ''}" data-before>📷 ${G.before ? T('Back to now', 'Về hiện tại') : T('Compare: 7:30 pm photo', 'So sánh: ảnh lúc 7:30')}</button>` : ''}</div>` : '';
        const tipT = { hand: T('Tap anything in the room to take a closer look.', 'Chạm vào bất cứ thứ gì để xem kỹ.'), light: T('Move the light around the dark room, then tap things.', 'Di chuyển đèn pin quanh phòng tối rồi chạm vào đồ vật.'),
          uv: T('UV light shows what the eye can\'t: prints, wiped marks, fresh paint. Tap anything to check it.', 'Đèn UV cho thấy điều mắt thường không thấy: dấu tay, vết lau, sơn mới. Chạm để kiểm tra.'), mag: T('Tap anything to look at it up close.', 'Chạm vào đồ vật để nhìn thật gần.'),
          bag: T(`Tap something to put it in an evidence bag for the lab (${C.BAG || 6} bags). Tap it again to take it out.`, `Chạm vào đồ vật để cho vào túi chứng cứ gửi phòng lab (${C.BAG || 6} túi). Chạm lần nữa để lấy ra.`) }[G.tool];
        let side = `<p class="cf-scene">${room.scene}</p><p class="cf-tip">${tools ? tipT + ' ' : ''}${T('You can pin anything to the board, but not everything matters, and nobody tells you when you have found it all.', 'Bạn có thể ghim mọi thứ lên bảng, nhưng không phải thứ gì cũng quan trọng, và không ai báo khi bạn đã tìm hết.')}</p>`;
        if (G.before) side = `<p class="cf-scene">${T('The photographer took this picture of the gallery at 7:30 pm, before anything happened. Compare it with the room now.', 'Nhiếp ảnh gia chụp phòng tranh lúc 7:30 tối, trước khi có chuyện gì. Hãy so sánh với căn phòng bây giờ.')}</p>`;
        else if (it && room.dark && G.tool !== 'light' && !G.lit) side += `<div class="cf-look"><b>${esc(it.n)}</b><p>${T('It\'s too dark to see. Use the flashlight.', 'Tối quá, không thấy gì. Hãy dùng đèn pin.')}</p></div>`;
        else if (it && md === 'uv') side += it.uv ? clueCard(objId(G.room, G.item, 'uv')) : `<div class="cf-look"><b>${esc(it.n)} · ${T('UV light', 'đèn UV')}</b><p>${T('Nothing glows here.', 'Không có gì phát sáng.')}</p></div>`;
        else if (it && md === 'mag') side += it.mag ? clueCard(objId(G.room, G.item, 'mag')) : `<div class="cf-look"><b>${esc(it.n)} · ${T('close up', 'nhìn gần')}</b><p>${T('Nothing more to see up close.', 'Nhìn gần cũng không thấy gì thêm.')}</p></div>`;
        else if (it) side += clueCard(objId(G.room, G.item));
        if (tools && G.bag.length) side += `<div class="cf-bagged"><b>${T('IN THE EVIDENCE BAG', 'TRONG TÚI CHỨNG CỨ')}</b>${G.bag.map((b) => `<span>👜 ${esc(C.ROOMS[b.room].items[b.i].n)}</span>`).join('')}</div>`;
        const dark = room.dark && !G.before ? `<div class="cf-dark ${G.tool === 'light' ? 'lit' : ''}" id="cf-dark"></div>` : '';
        return `${nav}${belt}<div class="cf-inv"><div class="cf-panel"><div class="cf-ph">${esc(room.name).toUpperCase()}${G.before ? ' · 7:30 PM' : ''}</div><div class="cf-pb cf-roombox"><div class="cf-roomwrap tool-${G.tool} ${G.before ? 'before' : ''}" id="cf-roomwrap">${roomSVG(room, looked, { uv: G.tool === 'uv', before: G.before })}${dark}${G.tool === 'uv' && !G.before ? '<div class="cf-uvlay"></div>' : ''}</div></div></div>
          <div class="cf-panel"><div class="cf-ph">${T('CLOSE LOOK', 'XEM KỸ')}</div><div class="cf-pb">${side}</div></div></div>`;
      }
      // ---------- Detective B in Case #002+: the security control room ----------
      function controlHTML() {
        const tabs = [['cams', T('Cameras', 'Camera')], ['photos', T('Photos', 'Ảnh')], ['lab', T('Lab', 'Phòng lab') + (G.bag.length ? ` (${G.bag.length})` : '')], ['files', T('Files', 'Hồ sơ')]];
        const bar = `<div class="cf-ctabs">${tabs.map(([k, l]) => `<button class="cf-ctab ${G.ctab === k ? 'on' : ''}" data-ctab="${k}">${l}</button>`).join('')}</div>`;
        const body = G.ctab === 'cams' ? camsHTML() : G.ctab === 'photos' ? photosHTML() : G.ctab === 'lab' ? labHTML() : filesHTML();
        return bar + body;
      }
      function legendHTML() {
        const C = G.C;
        return `<div class="cf-legend2"><b>${T('WHO\'S WHO (by their clothes)', 'AI LÀ AI (theo quần áo)')}</b>${Object.keys(C.PEOPLE).concat(['price']).map((k) => { const q = fig(k, -1 / 30, ''); return `<span><svg viewBox="-10 ${q.by - 36} 20 38" class="mini">${q.o}</svg>${k === 'price' ? T('Auctioneer', 'Người đấu giá') : esc(C.PEOPLE[k].name.split(' ')[0])}</span>`; }).join('')}</div>`;
      }
      function camsInner() {
        const C = G.C, m = G.cam.m, big = G.cam.big;
        const one = (cam, cls) => `<button class="cf-cam ${cls || ''} ${big === cam.id ? 'on' : ''}" data-cam="${cam.id}"><span class="lbl">${esc(cam.name)}</span>${frameSVG(frameOf(`cam:${cam.id}:${m}`))}</button>`;
        if (big) { const cam = C.CAMS.find((c) => c.id === big);
          return `<div class="cf-camsbig">${one(cam, 'big')}<div class="cf-camside">${C.CAMS.filter((c) => c.id !== big).map((c) => one(c)).join('')}</div></div>`; }
        return `<div class="cf-camgrid">${C.CAMS.map((c) => one(c)).join('')}</div>`;
      }
      function camsHTML() {
        const m = G.cam.m, big = G.cam.big;
        return `<div class="cf-panel"><div class="cf-ph">${T('SECURITY CAMERAS', 'CAMERA AN NINH')} <small>${T('7:00 pm to 11:00 pm · tap a screen to make it big', '7:00 đến 11:00 tối · chạm màn hình để phóng to')}</small></div><div class="cf-pb">
          <div class="cf-scrub"><button class="cf-sbtn" data-step="-10">−10</button><button class="cf-sbtn" data-step="-1">◀</button><button class="cf-sbtn play" data-play>${G.cam.play ? '❚❚' : '▶'}</button><button class="cf-sbtn" data-step="1">▶</button><button class="cf-sbtn" data-step="10">+10</button>
            <input type="range" id="cf-slider" min="0" max="240" step="1" value="${m}"><span class="cf-clock" id="cf-clock">${fmtM(m)}</span></div>
          <div id="cf-cams">${camsInner()}</div>
          <div class="cf-camacts">${big ? (G.pins.some((p) => p.id === `cam:${big}:${m}`) ? `<span class="cf-pinned">📌 ${T('This frame is on the board', 'Khung hình này đã ở trên bảng')}</span>` : `<button class="btn-game btn-teal py-1.5 px-3 text-xs" data-pinframe>📌 ${T('Pin this frame to the board', 'Ghim khung hình này lên bảng')}</button>`) : `<span class="text-muted text-sm">${T('Make a camera big to pin a frame.', 'Phóng to một camera để ghim khung hình.')}</span>`}</div>
          ${legendHTML()}</div></div>`;
      }
      function photosHTML() {
        const P = photos(), sel = G.ph;
        const view = sel != null ? (() => { const id = `ph:x:${sel}`, f = frameOf(id), pinned = G.pins.some((p) => p.id === id);
          return `<div class="cf-phview"><div class="cf-phbig ${G.zoom ? 'zoom' : ''}" data-zoom>${frameSVG(f)}</div><div class="cf-phcap"><b>${f.title}</b> · ${P[sel].place === 'cloak' ? T('Cloakroom', 'Phòng gửi đồ') : T('Main hall', 'Sảnh chính')}
            <span class="text-muted">${T('Tap the photo to zoom in.', 'Chạm vào ảnh để phóng to.')}</span>
            ${pinned ? `<span class="cf-pinned">📌 ${T('On the board', 'Đã ở trên bảng')}</span>` : `<button class="btn-game btn-teal py-1.5 px-3 text-xs" data-pin="${id}">📌 ${T('Pin to the board', 'Ghim lên bảng')}</button>`}</div></div>`; })() : `<p class="cf-scene">${T('Jun Park photographed the gala all night, every five minutes. Pick a photo.', 'Jun Park chụp buổi tiệc cả đêm, cứ năm phút một tấm. Chọn một tấm ảnh.')}</p>`;
        return `<div class="cf-inv cf-photos"><div class="cf-panel"><div class="cf-ph">${T('CAMERA ROLL', 'CUỘN PHIM')} <small>${P.length} ${T('photos', 'ảnh')}</small></div><div class="cf-pb"><div class="cf-phgrid">${P.map((p, n) => `<button class="cf-phthumb ${sel === n ? 'on' : ''}" data-ph="${n}">${frameSVG(frameOf(`ph:x:${n}`))}<span>${fmtM(p.t)}</span></button>`).join('')}</div></div></div>
          <div class="cf-panel"><div class="cf-ph">${T('PHOTO', 'ẢNH')}</div><div class="cf-pb">${view}</div></div></div>`;
      }
      function labHTML() {
        const C = G.C;
        if (!G.bag.length) return `<div class="cf-panel"><div class="cf-ph">${T('THE LAB', 'PHÒNG LAB')}</div><div class="cf-pb"><p class="cf-scene">${G.role === 'B' ? T('Nothing to test yet. Your partner at the scene puts things in evidence bags, and they arrive here.', 'Chưa có gì để xét nghiệm. Cộng sự ở hiện trường cho đồ vào túi chứng cứ, và chúng sẽ đến đây.') : T('Nothing to test yet. Use the evidence bag on the tool belt at the scene.', 'Chưa có gì để xét nghiệm. Dùng túi chứng cứ trên thắt lưng dụng cụ ở hiện trường.')}</p></div></div>`;
        const sel = G.bag.find((b) => b.k === G.labSel) || G.bag[0];
        const it = C.ROOMS[sel.room].items[sel.i];
        const res = TESTS_().filter(([t]) => G.labRes[`lab:${sel.k}:${t}`]).map(([t, l]) => { const id = `lab:${sel.k}:${t}`;
          return `<div class="cf-labres"><b>${l}</b><p>${esc(labText(it, t))}</p>${G.pins.some((p) => p.id === id) ? `<span class="cf-pinned">📌 ${T('On the board', 'Đã ở trên bảng')}</span>` : `<button class="btn-game btn-teal py-1 px-3 text-xs" data-pin="${id}">📌 ${T('Pin', 'Ghim')}</button>`}</div>`; }).join('');
        return `<div class="cf-inv cf-lab"><div class="cf-panel"><div class="cf-ph">${T('EVIDENCE BAGS', 'TÚI CHỨNG CỨ')} <small>${G.bag.length}/${C.BAG || 6}</small></div><div class="cf-pb"><div class="cf-bags">${G.bag.map((b) => `<button class="cf-bagbtn ${b.k === sel.k ? 'on' : ''}" data-labsel="${b.k}"><i>👜</i>${esc(C.ROOMS[b.room].items[b.i].n)}<small>${esc(C.ROOMS[b.room].name)}</small></button>`).join('')}</div></div></div>
          <div class="cf-panel"><div class="cf-ph">${T('TEST', 'XÉT NGHIỆM')}: ${esc(it.n).toUpperCase()}</div><div class="cf-pb"><p class="cf-tip">${T('Pick a test. The wrong test just shows nothing, so think about what this thing could tell you.', 'Chọn phép thử. Chọn sai thì không ra gì, nên hãy nghĩ xem món đồ này có thể cho biết điều gì.')}</p>
            <div class="cf-tests">${TESTS_().map(([t, l]) => `<button class="cf-test ${G.labRes[`lab:${sel.k}:${t}`] ? 'done' : ''}" data-test="${t}" data-k="${sel.k}">${{ mag: '🔬', uv: '◉', prints: '☝', threads: '🧵' }[t]} ${l}</button>`).join('')}</div>${res}</div></div></div>`;
      }
      function timelineHTML() {
        const C = G.C, PL = { hall: T('Main hall', 'Sảnh chính'), gallery: T('East Gallery', 'Phòng tranh Đông'), corridor: T('Back corridor', 'Hành lang sau'), security: T('Security room', 'Phòng bảo vệ'), kitchen: T('Kitchen', 'Bếp'), dock: T('Loading dock', 'Khu bốc hàng'), studio: T('Studio', 'Xưởng'), office: T('Office', 'Văn phòng'), cloak: T('Cloakroom', 'Phòng gửi đồ'), staff: T('Staff room', 'Phòng nhân viên'), out: T('Gone home', 'Đã về') };
        const times = []; for (let m = 0; m <= 240; m += 1) times.push(m);
        const rows = C.SUSPECTS.map((k) => `<div class="cf-tlrow"><span class="who">${C.PEOPLE[k].art}${esc(C.PEOPLE[k].name.split(' ')[0])}</span><div class="bar">${[0, 60, 120, 180, 240].map((m) => `<i class="tick" style="left:${m / 2.4}%"></i>`).join('')}
          ${G.tl.map((e, i) => e.who === k ? `<span class="dot" style="left:${e.m / 2.4}%" title="${esc(PL[e.place] || e.place)}"><em>${fmtM(e.m).replace(' pm', '')}</em>${esc(PL[e.place] || e.place)}<b data-untl="${i}">✕</b></span>` : '').join('')}</div></div>`).join('');
        return `<div class="cf-panel"><div class="cf-ph">${T('TIMELINE WALL', 'BẢNG DÒNG THỜI GIAN')} <small>${T('shared with your partner', 'dùng chung với cộng sự')}</small></div><div class="cf-pb">
          <p class="cf-tip">${T('Put down where each suspect was and when, from what you have seen. Gaps are interesting.', 'Ghi lại mỗi nghi phạm ở đâu, lúc nào, từ những gì bạn đã thấy. Những khoảng trống rất đáng chú ý.')}</p>
          <div class="cf-tlaxis">${[0, 60, 120, 180, 240].map((m) => `<span style="left:${m / 2.4}%">${fmtM(m)}</span>`).join('')}</div>${rows}
          <div class="cf-tlform"><select id="cf-tlwho">${C.SUSPECTS.map((k) => `<option value="${k}">${esc(C.PEOPLE[k].name)}</option>`).join('')}</select>
            <select id="cf-tlm">${times.filter((m) => m % 1 === 0).map((m) => `<option value="${m}" ${m === G.cam.m ? 'selected' : ''}>${fmtM(m)}</option>`).join('')}</select>
            <select id="cf-tlp">${Object.entries(PL).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
            <button class="btn-game btn-amber py-1.5 px-3 text-xs" data-tladd>${T('Add', 'Thêm')}</button></div></div></div>`;
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
      function recordsHTML() { return G.C.desk === 'control' ? controlHTML() : filesHTML(); }
      function filesHTML() {
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
        const sw = C.desk === 'control' ? `<div class="cf-ctabs"><button class="cf-ctab ${G.btab === 'board' ? 'on' : ''}" data-btab="board">${T('Evidence board', 'Bảng chứng cứ')}</button><button class="cf-ctab ${G.btab === 'tl' ? 'on' : ''}" data-btab="tl">${T('Timeline wall', 'Dòng thời gian')}${G.tl.length ? ` (${G.tl.length})` : ''}</button></div>` : '';
        if (sw && G.btab === 'tl') return sw + timelineHTML();
        return sw + `<div class="cf-boardwrap"><div class="cf-cork" id="cf-cork"><svg class="strings" id="cf-strings"></svg>
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
        const C = G.C, s = stars(), all = C.KEYLIST || Object.keys(C.CLUES).filter((k) => C.CLUES[k].who === 'A' || C.STRONG.includes(k) || (C.USEFUL || []).includes(k)), got = all.filter((k) => G.found[k]), miss = all.filter((k) => !G.found[k]);
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

      // cameras repaint on their own (no full redraw), so the slider keeps working smoothly
      function paintCams() { const el = $('#cf-cams'); if (!el) return; el.innerHTML = camsInner(); const s = $('#cf-slider'); if (s && +s.value !== G.cam.m) s.value = G.cam.m; const c = $('#cf-clock'); if (c) c.textContent = fmtM(G.cam.m);
        const a = $('.cf-camacts'); if (a && G.cam.big) { const id = `cam:${G.cam.big}:${G.cam.m}`; a.innerHTML = G.pins.some((p) => p.id === id) ? `<span class="cf-pinned">📌 ${T('This frame is on the board', 'Khung hình này đã ở trên bảng')}</span>` : `<button class="btn-game btn-teal py-1.5 px-3 text-xs" data-pinframe>📌 ${T('Pin this frame to the board', 'Ghim khung hình này lên bảng')}</button>`; } }
      function stopPlay(keep) { if (G && G.cam.play) { G.cam.play = false; if (G.camT) gClearInt(G.camT); const b = $('[data-play]'); if (b) b.textContent = '▶'; } }
      // ---------- input ----------
      function bind(body) {
        gOn(body, 'click', (e) => {
          const t = e.target.closest('[data-tool],[data-before],[data-ctab],[data-btab],[data-cam],[data-step],[data-play],[data-pinframe],[data-ph],[data-zoom],[data-labsel],[data-test],[data-tladd],[data-untl],[data-item],[data-drawer],[data-doc],[data-row],[data-remark],[data-showmenu],[data-show],[data-tab],[data-view],[data-room],[data-search],[data-pin],[data-sus],[data-ask],[data-unpin],[data-addnote],[data-acc],[data-ev],[data-propose],[data-answer],[data-cancel],[data-hint],[data-again]');
          if (!t || !G) return;
          const C = G.C;
          if (t.dataset.tool) { G.tool = t.dataset.tool; G.itemMode = ''; G.before = false; SFX.play('click'); }
          else if (t.dataset.before !== undefined) { G.before = !G.before; G.item = null; SFX.play('card'); }
          else if (t.dataset.ctab) { G.ctab = t.dataset.ctab; stopPlay(); }
          else if (t.dataset.btab) G.btab = t.dataset.btab;
          else if (t.dataset.cam) { G.cam.big = G.cam.big === t.dataset.cam ? null : t.dataset.cam; }
          else if (t.dataset.step) { G.cam.m = Math.max(0, Math.min(240, G.cam.m + +t.dataset.step)); paintCams(); return; }
          else if (t.dataset.play !== undefined) { if (G.cam.play) stopPlay(); else { G.cam.play = true; if (G.cam.m >= 240) G.cam.m = 0; G.camT = gInterval(() => { if (!G || !G.cam.play) return; G.cam.m++; if (G.cam.m >= 240) stopPlay(); paintCams(); }, 260); } }
          else if (t.dataset.pinframe !== undefined) { const id = `cam:${G.cam.big}:${G.cam.m}`, n = G.pins.length; act({ t: 'pin', id, x: 16 + (n % 4) * 182 + rnd(12), y: 18 + Math.floor(n / 4) * 130 + rnd(12) }); SFX.play('click'); return; }
          else if (t.dataset.ph !== undefined) { G.ph = +t.dataset.ph; G.zoom = false; SFX.play('card'); }
          else if (t.dataset.zoom !== undefined) { G.zoom = !G.zoom; }
          else if (t.dataset.labsel) G.labSel = t.dataset.labsel;
          else if (t.dataset.test) { act({ t: 'test', k: t.dataset.k, test: t.dataset.test }); SFX.play('reveal'); return; }
          else if (t.dataset.tladd !== undefined) { const v = (id) => (body.querySelector(id) || {}).value; act({ t: 'tl', who: v('#cf-tlwho'), m: +v('#cf-tlm'), place: v('#cf-tlp') }); return; }
          else if (t.dataset.untl !== undefined) { act({ t: 'untl', i: +t.dataset.untl }); return; }
          else if (t.dataset.item !== undefined) {
            const i = +t.dataset.item, room = G.C.ROOMS[G.room], tool = G.tool || 'hand';
            if (G.before) return;
            if (tool === 'bag') { const it = room.items[i]; if (!it.lab) { toast(T('That won\'t fit in an evidence bag.', 'Thứ này không cho vào túi chứng cứ được.')); return; }
              if (!G.bag.some((b) => b.room === G.room && b.i === i) && G.bag.length >= (G.C.BAG || 6)) { toast(T('All evidence bags are full. Take something out first.', 'Hết túi chứng cứ rồi. Hãy lấy bớt ra trước.')); return; }
              act({ t: 'bag', room: G.room, i }); SFX.play('card'); return; }
            G.item = i; G.itemMode = tool === 'uv' || tool === 'mag' ? tool : ''; SFX.play('click');
            const md = G.itemMode, lk = G.room + ':' + i + (md ? ':' + md : '');
            if (room.dark && tool !== 'light' && !md) { render(); return; }
            if (!G.looked[lk]) { act({ t: 'look', room: G.room, i, tool: md || undefined }); return; } }
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
          if (e.target.id === 'cf-slider') { G.cam.m = +e.target.value; stopPlay(true); paintCams(); return; }
          const t = e.target; if (!G || !t.dataset || t.dataset.note === undefined) return;
          const id = t.dataset.note; G.notes[id] = t.value;
          const box = body.querySelector(`[data-acts="${id}"]`), pin = G.pins.find((p) => p.id === id);
          if (box) box.innerHTML = pinActs(id, docChanged(id));
        });
        // flashlight: the circle of light follows the pointer
        gOn(body, 'pointermove', (e) => { const w = e.target.closest && e.target.closest('#cf-roomwrap'); const d = $('#cf-dark'); if (!w || !d) return; const r = w.getBoundingClientRect(); d.style.setProperty('--lx', (e.clientX - r.left) + 'px'); d.style.setProperty('--ly', (e.clientY - r.top) + 'px'); });
        gOn(body, 'pointerdown', (e) => { const w = e.target.closest && e.target.closest('#cf-roomwrap'); const d = $('#cf-dark'); if (!w || !d) return; const r = w.getBoundingClientRect(); d.style.setProperty('--lx', (e.clientX - r.left) + 'px'); d.style.setProperty('--ly', (e.clientY - r.top) + 'px'); });
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
        id: 'casefiles', name: 'Case Files', icon: 'casefiles', cats: ['party', 'word'], sub: '1-2 PLAYERS · 25-50 MIN', color: '#E9C46A', tone: 'amber', btn: 'amber', flag: 'NEW',
        blurb: 'A co-op detective case: one of you has the crime scene, the other has the records. Pin the evidence and catch the culprit together.',
        rules: { tag: 'DETECTIVE · CO-OP FOR 2', steps: [
          '<strong class="text-bone">Two halves:</strong> Detective A searches the scene and interviews suspects; Detective B reads the records.',
          '<strong class="text-bone">Share:</strong> pin clues to the shared evidence board so your partner can see them, tie them with string, add notes.',
          '<strong class="text-bone">Confront:</strong> some questions only unlock when the right clue is on the board.',
          '<strong class="text-bone">Accuse:</strong> who, how and why, with your 3 best pieces of evidence. Your partner has to agree.',
        ], tip: 'Check every alibi against a record. Whose story does a record prove false?' },
        profileTiles: (s) => [['CASES SOLVED', s.cases || 0, 'text-amber'], ['BEST STARS', (s.stars || 0) + '★', 'text-teal']],
        engine: { get G() { return G; }, cases, act: (a) => act(a), apply: (a) => apply(a), fair: (C) => fair(C), frameOf: (id) => frameOf(id), visibleIn: (f) => visibleIn(f), photos: () => photos(), isStrong: (id) => isStrong(id) },
        open, close() { G = null; },
        online: { seats: () => 2, min: 2, bots: false, ranked: false, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
