    /* ---------- pixel icons for the new games ---------- */
    (function addIcons() {
      const K = '#050E18';
      const r = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      const ol = (x, y, w, h, f) => r(x - 1, y - 1, w + 2, h + 2, K) + r(x, y, w, h, f);
      const svg = (inner) => `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${inner}</svg>`;
      // a pixel circle made of one rectangle per row
      const circ = (cx, cy, R, f) => { let o = ''; for (let y = -R; y <= R; y++) { const h = Math.floor(Math.sqrt(R * R + R - y * y + 0.25)); o += r(cx - h, cy + y, h * 2, 1, f); } return o; };
      const disc = (cx, cy, R, f) => circ(cx, cy, R + 1, K) + circ(cx, cy, R, f);
      const txt = (x, y, s, size, f) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arcade Pixel, Outfit, sans-serif" font-weight="700" font-size="${size}" fill="${f}" shape-rendering="auto">${s}</text>`;
      const pat = (x, y, rows, f) => rows.map((row, j) => row.split('').map((ch, i) => (ch === '1' ? r(x + i, y + j, 1, 1, f) : '')).join('')).join('');

      const chess =
        ol(11, 1, 2, 7, '#F7F4EC') + ol(9, 3, 6, 2, '#F7F4EC') +
        ol(8, 8, 8, 3, '#F7F4EC') + ol(10, 11, 4, 2, '#DDE5EE') + ol(9, 13, 6, 4, '#F7F4EC') +
        ol(6, 17, 12, 3, '#F7F4EC') + ol(5, 20, 14, 2, '#B9C7D6') + r(10, 9, 1, 1, '#B9C7D6') + r(10, 14, 1, 2, '#B9C7D6');

      const pool =
        disc(12, 12, 9, '#16212E') + circ(12, 12, 4, '#F7F4EC') + txt(12, 15, '8', 9, '#16212E') + r(7, 6, 2, 1, '#4A5A70') + r(6, 7, 1, 2, '#4A5A70') +
        disc(19, 19, 3, '#F5B041') + r(18, 18, 1, 1, '#FFE2A8');

      const heartPat = ['01010', '11111', '11111', '01110', '00100'];
      const spadePat = ['00100', '01110', '11111', '11111', '00100'];
      const poker =
        ol(2, 5, 11, 15, '#F7F4EC') + pat(4, 8, spadePat, '#16212E') + r(3, 6, 1, 1, '#16212E') +
        ol(10, 3, 11, 15, '#F7F4EC') + pat(13, 7, heartPat, '#D13B55') + pat(13, 12, heartPat, '#D13B55') + r(11, 4, 1, 1, '#D13B55');

      const blackjack =
        ol(3, 3, 13, 18, '#F7F4EC') + txt(9.5, 15, '21', 9, '#16212E') + r(4, 4, 2, 2, '#D13B55') +
        disc(18, 17, 4, '#F5B041') + circ(18, 17, 2, '#C6821E') + r(17, 16, 2, 2, '#F5B041');

      const kittens =
        // ears
        r(2, 2, 6, 7, K) + r(3, 3, 4, 5, '#FB7185') + r(16, 2, 6, 7, K) + r(17, 3, 4, 5, '#FB7185') +
        disc(12, 13, 8, '#2B3340') + r(7, 11, 3, 2, '#F5B041') + r(14, 11, 3, 2, '#F5B041') + r(8, 11, 1, 2, K) + r(15, 11, 1, 2, K) +
        r(11, 14, 2, 1, '#FB7185') +
        // a hot potato held in front, with steam
        r(7, 17, 10, 6, K) + r(8, 18, 8, 4, '#C9853F') + r(9, 18, 2, 1, '#E0A45C') + r(13, 20, 1, 1, '#8A5A2B') + r(10, 21, 1, 1, '#8A5A2B') +
        r(10, 1, 1, 2, '#F7F4EC') + r(11, 3, 1, 1, '#F7F4EC') + r(13, 0, 1, 2, '#F7F4EC') + r(12, 2, 1, 1, '#F7F4EC');

      const wordconnect =
        disc(12, 12, 10, '#F7F4EC') + circ(12, 12, 7, '#DDE5EE') +
        `<path d="M7 10 L12 17 L17 8" stroke="#2DD4BF" stroke-width="2" fill="none" shape-rendering="auto" stroke-linecap="square"/>` +
        txt(7, 11, 'W', 6, '#16212E') + txt(12, 19, 'O', 6, '#16212E') + txt(17, 10, 'D', 6, '#16212E');

      const colorclash =
        ol(4, 2, 16, 20, '#F7F4EC') +
        r(6, 4, 6, 8, '#F5B041') + r(12, 4, 6, 8, '#2DD4BF') + r(6, 12, 6, 8, '#FB7185') + r(12, 12, 6, 8, '#34D399') +
        ol(9, 8, 6, 8, '#F7F4EC') + r(11, 10, 2, 4, '#16212E') + r(10, 11, 4, 2, '#16212E');

      const tycoon =
        // roof
        r(10, 1, 4, 1, K) + r(8, 2, 8, 1, K) + r(6, 3, 12, 1, K) + r(4, 4, 16, 1, K) + r(2, 5, 20, 1, K) +
        r(10, 2, 4, 1, '#FB7185') + r(8, 3, 8, 1, '#FB7185') + r(6, 4, 12, 1, '#FB7185') + r(3, 5, 18, 1, '#FB7185') +
        ol(4, 7, 16, 13, '#F5B041') + r(4, 7, 16, 1, '#FFE2A8') + ol(10, 14, 4, 6, '#2B4F75') + ol(5, 10, 4, 4, '#2DD4BF') + ol(15, 10, 4, 4, '#2DD4BF') +
        r(13, 17, 1, 1, '#F5B041');

      const impostor =
        // hat
        ol(3, 5, 18, 2, '#2B3340') + ol(7, 1, 10, 4, '#2B3340') + r(7, 4, 10, 1, '#FB7185') +
        // face
        ol(6, 8, 12, 10, '#F7F4EC') + r(8, 11, 2, 2, K) + r(14, 11, 2, 2, K) + r(10, 15, 4, 1, K) +
        // body
        ol(4, 19, 16, 4, '#FB7185') + txt(20, 12, '?', 9, '#F5B041');

      const doodle = (() => {
        let o = '';
        for (let i = 0; i < 12; i++) o += r(4 + i, 17 - i, 4, 4, K);
        for (let i = 0; i < 12; i++) o += r(5 + i, 18 - i, 2, 2, i < 2 ? '#F7F4EC' : i < 3 ? '#B98846' : i > 9 ? '#FB7185' : '#F5B041');
        o += r(3, 20, 3, 2, K) + r(3, 20, 2, 1, '#16212E');
        o += `<path d="M2 23 Q5 19 8 22 T14 22 T22 21" stroke="#2DD4BF" stroke-width="1.3" fill="none" shape-rendering="auto"/>`;
        return o;
      })();

      const bowling =
        disc(8, 15, 7, '#2DD4BF') + r(5, 11, 1, 1, '#BFF5EC') + r(5, 13, 2, 2, K) + r(9, 11, 2, 2, K) + r(9, 15, 2, 2, K) +
        ol(16, 1, 4, 4, '#F7F4EC') + ol(17, 5, 2, 2, '#F7F4EC') + r(16, 6, 4, 1, '#FB7185') + ol(15, 8, 6, 8, '#F7F4EC') + r(15, 10, 6, 1, '#FB7185') + ol(16, 16, 4, 3, '#F7F4EC');

      Object.assign(GICONS, {
        chess: svg(chess), pool: svg(pool), poker: svg(poker), blackjack: svg(blackjack), kittens: svg(kittens),
        wordconnect: svg(wordconnect), colorclash: svg(colorclash), tycoon: svg(tycoon), impostor: svg(impostor),
        doodle: svg(doodle), bowling: svg(bowling),
      });
    })();

