    /* =========================================================================
       WHODUNIT ART: the house seen from above, cartoon style (ink outlines like Sea Battle's ships).
       MANOR_ROOM_SVG[i] = the floor + furniture of room i (viewBox 0 0 200 130), MANOR_ROOF = the roof banner.
       Furniture keeps to the middle/right so the room name (top left) and the pawns (bottom left) stay readable.
       ========================================================================= */
    const MANOR_ART = (() => {
      const K = '#050E18', S = `stroke="${K}" stroke-width="2.5" stroke-linejoin="round"`;
      const R = (x, y, w, h, f, rx = 3, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" ${S} ${extra}/>`;
      const C = (x, y, r, f) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${S}/>`;
      const E = (x, y, rx, ry, f) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${S}/>`;
      const P = (d, f) => `<path d="${d}" fill="${f}" ${S}/>`;
      // floors
      const pat = (id, w, h, inner) => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${inner}</pattern>`;
      const floors = {
        boards: (a, b) => pat('fb' + a.slice(1), 200, 18, `<rect width="200" height="18" fill="${a}"/><rect y="16" width="200" height="2" fill="${b}"/><rect x="60" width="2" height="16" fill="${b}"/><rect x="150" width="2" height="16" fill="${b}"/>`),
        tiles: (a, b, s) => pat('ft' + a.slice(1) + b.slice(1), s * 2, s * 2, `<rect width="${s * 2}" height="${s * 2}" fill="${a}"/><rect width="${s}" height="${s}" fill="${b}"/><rect x="${s}" y="${s}" width="${s}" height="${s}" fill="${b}"/>`),
        stone: (a, b) => pat('fs' + a.slice(1), 40, 26, `<rect width="40" height="26" fill="${a}"/><path d="M0 13 H40 M20 0 V13 M10 13 V26 M30 13 V26" stroke="${b}" stroke-width="2"/>`),
        carpet: (a, b) => pat('fc' + a.slice(1), 16, 16, `<rect width="16" height="16" fill="${a}"/><circle cx="8" cy="8" r="1.6" fill="${b}"/>`),
      };
      const room = (floorDef, fid, furniture) => `<svg viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${floorDef}</defs><rect width="200" height="130" fill="url(#${fid})"/>${furniture}</svg>`;
      const plant = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${C(0, 0, 13, '#B5652D')}${P('M0 -16 C8 -10 12 -4 0 0 C-12 -4 -8 -10 0 -16Z', '#34D399')}${P('M-16 0 C-10 -8 -4 -12 0 0 C-4 12 -10 8 -16 0Z', '#22A06B')}${P('M16 0 C10 8 4 12 0 0 C4 -12 10 -8 16 0Z', '#22A06B')}${P('M0 16 C-8 10 -12 4 0 0 C12 4 8 10 0 16Z', '#34D399')}</g>`;
      const book = (x, y, h, f) => `<rect x="${x}" y="${y}" width="7" height="${h}" fill="${f}" stroke="${K}" stroke-width="1.5"/>`;
      const shelf = (x, y, w) => R(x, y, w, 20, '#7A4A21', 2) + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((k) => k * 9 + 6 < w).map((k) => book(x + 4 + k * 9, y + 3 + (k % 3), 14 - (k % 3), ['#FB7185', '#2DD4BF', '#F5B041', '#60A5FA', '#34D399'][k % 5])).join('');
      const barrel = (x, y) => C(x, y, 15, '#9C6A3A') + `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="${K}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3" fill="${K}"/>`;
      const rooms = [
        // 0 Greenhouse: green tiles, glass along the top, potted plants, watering can
        room(floors.tiles('#3E8E5A', '#357B4E', 14), 'ft3E8E5A357B4E',
          R(70, 4, 126, 14, '#BFE9F5', 1) + '<path d="M101 4 V18 M132 4 V18 M163 4 V18" stroke="#050E18" stroke-width="2"/>' +
          plant(108, 46) + plant(150, 40, 1.1) + plant(178, 74, 0.9) + plant(132, 88, 1.05) +
          R(80, 96, 22, 16, '#60A5FA', 4) + P('M102 100 L116 92 L118 96 L104 104Z', '#60A5FA')),
        // 1 Library: wooden floor, shelves on the wall, a reading chair on a rug, a lamp
        room(floors.boards('#7A5230', '#5E3D22'), 'fb7A5230',
          shelf(66, 4, 128) + E(136, 82, 44, 26, '#6B2D3F') + E(136, 82, 34, 18, '#8C3B52') +
          R(118, 66, 34, 30, '#2DD4BF', 8) + R(122, 72, 26, 20, '#5EE6D3', 6) + C(178, 46, 9, '#F5B041') + `<circle cx="178" cy="46" r="3" fill="#FFF7D6"/>`),
        // 2 Observatory: night-blue floor with stars, the telescope, a globe, a round window
        room(pat('fsky', 40, 40, '<rect width="40" height="40" fill="#1B2F5A"/><circle cx="8" cy="10" r="1.3" fill="#F7F4EC"/><circle cx="28" cy="26" r="1" fill="#F5B041"/><circle cx="33" cy="6" r="0.9" fill="#F7F4EC"/>'), 'fsky',
          C(160, 34, 24, '#0B1730') + '<circle cx="152" cy="28" r="2" fill="#F7F4EC"/><circle cx="168" cy="40" r="1.5" fill="#F5B041"/><circle cx="162" cy="22" r="1.2" fill="#F7F4EC"/>' +
          P('M96 94 L150 58 L156 66 L102 102Z', '#C9D3DD') + C(152, 62, 8, '#9DB4CC') + `<path d="M100 98 L88 118 M100 98 L104 120 M100 98 L116 116" stroke="${K}" stroke-width="3"/>` +
          C(176, 98, 13, '#60A5FA') + P('M168 92 C174 96 172 102 180 104 C184 98 178 92 168 92Z', '#34D399')),
        // 3 Music Room: carpet, a grand piano seen from above, a music stand
        room(floors.carpet('#6B2D3F', '#8C3B52'), 'fc6B2D3F',
          P('M84 30 H170 C186 30 192 46 186 62 C180 78 168 72 156 86 C146 98 120 100 100 100 H84Z', '#111A24') + R(84, 30, 18, 70, '#F7F4EC', 1) +
          '<path d="M86 36 H100 M86 44 H100 M86 52 H100 M86 60 H100 M86 68 H100 M86 76 H100 M86 84 H100 M86 92 H100" stroke="#050E18" stroke-width="1.5"/>' +
          R(64, 52, 14, 24, '#7A4A21', 3) + `<path d="M150 108 L172 108 M161 108 L161 124" stroke="${K}" stroke-width="3"/>` + R(148, 100, 26, 10, '#F5B041', 2)),
        // 4 Grand Hall: marble checks, red carpet runner, two pillars, the chandelier
        room(floors.tiles('#E9E4D8', '#BDB6A6', 16), 'ftE9E4D8BDB6A6',
          R(92, 0, 30, 130, '#B8344F', 0) + R(98, 0, 18, 130, '#D9475F', 0) +
          C(64, 30, 11, '#F7F4EC') + C(164, 30, 11, '#F7F4EC') + C(64, 104, 11, '#F7F4EC') + C(164, 104, 11, '#F7F4EC') +
          C(107, 62, 18, '#F5B041') + [0, 60, 120, 180, 240, 300].map((a) => `<circle cx="${107 + Math.cos(a * Math.PI / 180) * 18}" cy="${62 + Math.sin(a * Math.PI / 180) * 18}" r="4" fill="#FFF7D6" stroke="${K}" stroke-width="2"/>`).join('') + C(107, 62, 6, '#FFF7D6')),
        // 5 Kitchen: blue-and-white tiles, a stove with pans, a counter, a little table
        room(floors.tiles('#EAF2F8', '#9CC3E0', 13), 'ftEAF2F89CC3E0',
          R(70, 4, 126, 26, '#C9D3DD', 2) + R(150, 6, 40, 22, '#2B333E', 2) + C(162, 17, 6, '#4A5563') + C(180, 17, 6, '#4A5563') +
          C(100, 17, 8, '#9DB4CC') + P('M108 17 L124 17', '#9DB4CC') + `<path d="M108 17 H124" stroke="${K}" stroke-width="3"/>` +
          C(138, 84, 22, '#B5652D') + C(138, 84, 14, '#C9853F') + C(104, 84, 8, '#FB7185') + C(172, 84, 8, '#FB7185') + C(138, 116, 8, '#FB7185')),
        // 6 Wine Cellar: stone floor, barrels, a candle
        room(floors.stone('#5B4A55', '#3E313A'), 'fs5B4A55',
          barrel(110, 34) + barrel(142, 34) + barrel(174, 34) + barrel(126, 62) + barrel(158, 62) +
          R(120, 92, 70, 28, '#7A4A21', 2) + '<path d="M131 92 V120 M143 92 V120 M155 92 V120 M167 92 V120 M179 92 V120" stroke="#050E18" stroke-width="2"/>' +
          C(92, 100, 6, '#F7F4EC') + '<path d="M92 94 C88 88 94 84 92 78 C98 84 96 90 92 94Z" fill="#F5B041" stroke="#050E18" stroke-width="2"/>'),
        // 7 Game Room: green carpet, a billiard table, a dart board, an armchair
        room(floors.carpet('#1F5F5B', '#2A7470'), 'fc1F5F5B',
          R(82, 30, 96, 56, '#7A4A21', 8) + R(90, 38, 80, 40, '#22A06B', 3) +
          [[92, 40], [130, 38], [168, 40], [92, 76], [130, 78], [168, 76]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${K}"/>`).join('') +
          C(110, 58, 3.5, '#F7F4EC') + C(142, 52, 3.5, '#F5B041') + C(148, 62, 3.5, '#FB7185') + C(154, 56, 3.5, '#60A5FA') +
          `<path d="M100 66 L150 48" stroke="#E0A45C" stroke-width="3"/>` + C(180, 108, 13, '#F7F4EC') + C(180, 108, 8, '#FB7185') + C(180, 108, 3, K)),
        // 8 Boathouse: wooden dock, water with a rowboat, a life ring
        room(floors.boards('#9C6A3A', '#7A4A21'), 'fb9C6A3A',
          `<rect x="96" y="0" width="104" height="130" fill="#1F5F93"/><path d="M104 20 q8 -5 16 0 M150 100 q8 -5 16 0 M120 116 q8 -5 16 0" stroke="#7DD3FC" stroke-width="2.5" fill="none"/>` +
          P('M130 32 C150 26 172 36 176 64 C172 92 150 102 130 96 C122 80 122 48 130 32Z', '#F5B041') + P('M136 42 C150 38 164 46 166 64 C164 82 150 88 136 86 C130 74 130 54 136 42Z', '#C9853F') +
          `<path d="M136 64 H166" stroke="${K}" stroke-width="3"/>` + `<path d="M118 56 L184 72" stroke="#7A4A21" stroke-width="4"/>` +
          C(78, 22, 13, '#F7F4EC') + `<circle cx="78" cy="22" r="6" fill="#9C6A3A" stroke="${K}" stroke-width="2"/><path d="M78 9 V14 M78 30 V35 M65 22 H70 M86 22 H91" stroke="#FB7185" stroke-width="4"/>`),
      ];
      // the roof across the top of the map: shingles, two chimneys, little dormer windows, a sign
      const roof = `<svg viewBox="0 0 600 70" preserveAspectRatio="none" aria-hidden="true">
        <defs><pattern id="shg" width="24" height="12" patternUnits="userSpaceOnUse"><rect width="24" height="12" fill="#6B2D3F"/><path d="M0 11 H24 M12 0 V11" stroke="#4A1F2C" stroke-width="2"/></pattern></defs>
        ${R(70, 6, 30, 40, '#9C4630', 1)}${R(66, 2, 38, 8, '#7A3424', 1)}${R(500, 10, 26, 36, '#9C4630', 1)}${R(496, 6, 34, 8, '#7A3424', 1)}
        ${P('M10 68 L80 22 H520 L590 68Z', 'url(#shg)')}
        ${R(160, 36, 34, 26, '#F5B041', 2)}<path d="M177 36 V62 M160 49 H194" stroke="${K}" stroke-width="2.5"/>
        ${R(406, 36, 34, 26, '#F5B041', 2)}<path d="M423 36 V62 M406 49 H440" stroke="${K}" stroke-width="2.5"/>
        ${R(238, 30, 124, 30, '#F7F4EC', 3)}<text x="300" y="52" text-anchor="middle" font-family="Arcade Pixel, monospace" font-size="20" fill="#6B2D3F">THE MANOR</text>
      </svg>`;
      return { rooms, roof };
    })();
