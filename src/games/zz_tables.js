    /* =========================================================================
       TABLE DESIGNS (Nov 2026, Inna picked them from prototypes/table-designs.html)
       Six looks for the card-game tables: Classic Felt, Harbor Night, Royal Red, Saloon Planks, Arcade Grid, Lagoon.
       Each = a background for the whole screen, a table with stepped pixel corners (a rim + the cloth + a faint
       picture in the middle) and a matching back for playing cards. Each player picks their own (🎨 Table in the
       game header); it is saved in this browser (ps_table_v1) and never sent to anyone.
       The look is set as CSS variables on <html> (--tb-*); 27-tables.css paints with them.
       ========================================================================= */
    (function () {
      const KEY = 'ps_table_v1';
      window.TABLE_GAMES = ['poker', 'blackjack', 'colorclash', 'kittens', 'fibber', 'dominoes', 'thirteen'];
      // a small pixel tile (rows of letters → colours) as an SVG background
      function svgOf(rows, pal, op) {
        const h = rows.length, w = rows[0].length; let r = '';
        rows.forEach((row, y) => [...row].forEach((c, x) => { if (pal[c]) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[c]}"/>`; }));
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges"${op ? ` fill-opacity="${op}"` : ''}>${r}</svg>`;
      }
      const url = (svg) => `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')`;
      const tile = (rows, pal, scale) => ({ img: url(svgOf(rows, pal)), size: `${rows[0].length * scale}px ${rows.length * scale}px` });

      const EMB = {
        spade: ['.....k.....', '....kkk....', '...kkkkk...', '..kkkkkkk..', '.kkkkkkkkk.', 'kkkkkkkkkkk', 'kkkkkkkkkkk', '.kkk.k.kkk.', '.....k.....', '....kkk....', '...kkkkk...'],
        anchor: ['.....kk.....', '....k..k....', '....k..k....', '.....kk.....', '..kkkkkkkk..', '.....kk.....', '.....kk.....', 'k....kk....k', 'kk...kk...kk', '.kk..kk..kk.', '..kkkkkkkk..', '....kkkk....'],
        crown: ['k....k....k', 'kk..kkk..kk', 'kkk.kkk.kkk', 'kkkkkkkkkkk', 'kkkkkkkkkkk', 'k.k.k.k.k.k', 'kkkkkkkkkkk', 'kkkkkkkkkkk'],
        star: ['.....k.....', '.....k.....', '....kkk....', 'kkkkkkkkkkk', '.kkkkkkkkk.', '..kkkkkkk..', '..kkk.kkk..', '.kkk...kkk.', '.kk.....kk.'],
        joy: ['....kkk....', '...kkkkk...', '...kkkkk...', '....kkk....', '.....k.....', '.....k.....', '.kkkkkkkkk.', 'kkkkkkkkkkk', 'kk.kkkkk.kk', 'kkkkkkkkkkk'],
        palm: ['..kk...kk..', '.kkkk.kkkk.', 'kk..kkk..kk', 'k...kkk...k', '.....k.....', '.....k.....', '....k......', '....k......', '....k......', 'kkkkkkkkkkk', '.kkkkkkkkk.'],
      };

      const THEMES = [
        { id: 'classic', name: 'Classic Felt', bgc: '#174F3B', bg: tile(['ab', 'ba'], { a: '#185440', b: '#164B38' }, 6),
          rimc: '#6B4226', rim: tile(['aaaaaaaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaayaaaaaaaaaaa'], { a: '#6B4226', y: '#E9C46A' }, 4),
          feltc: '#1E7A57', felt: tile(['abaa', 'aaab', 'abaa', 'baaa'], { a: '#1E7A57', b: '#1B7150' }, 4), emb: 'spade', ec: '#0B3A29',
          backc: '#12304C', back: tile(['aab', 'aba', 'baa'], { a: '#12304C', b: '#F5B041' }, 4) },
        { id: 'harbor', name: 'Harbor Night', bgc: '#0A1D30', bg: tile(['........', '........', '..aa....', '.a..a..a', '......a.', '........'], { a: '#12304C' }, 4),
          rimc: '#B07A3E', rim: tile(['aabb', 'abba', 'bbaa', 'baab'], { a: '#C9934F', b: '#8C5A2B' }, 4),
          feltc: '#123A5C', felt: tile(['........', '...aa...', '..a..a.a', '.......a', '........', '........'], { a: '#17466E' }, 5), emb: 'anchor', ec: '#2DD4BF',
          backc: '#0A1D30', back: tile(['abba', 'baab'], { a: '#0A1D30', b: '#2DD4BF' }, 4) },
        { id: 'royal', name: 'Royal Red', bgc: '#2A0A12', bg: tile(['a...', '.b..', '..a.', '...b'], { a: '#330E18', b: '#2F0C15' }, 6),
          rimc: '#D9A441', rim: tile(['aaaa', 'aaaa', 'bbbb', 'aaaa'], { a: '#E6B54E', b: '#8A5F16' }, 4),
          feltc: '#7A1E2E', felt: tile(['...a...', '..a.a..', '.a...a.', 'a.....a', '.a...a.', '..a.a..', '...a...'], { a: '#862638' }, 5), emb: 'crown', ec: '#F5B041',
          backc: '#7A1E2E', back: tile(['abbba', 'babab', 'bbabb', 'babab', 'abbba'], { a: '#F5B041', b: '#7A1E2E' }, 3) },
        { id: 'saloon', name: 'Saloon Planks', bgc: '#3B2414', bg: tile(['aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'bbbbbbbbbbbbbbbb', 'aaaaaaaaaaaaaaaa'], { a: '#3E2716', b: '#2E1B0E' }, 6),
          rimc: '#2B1A10', rim: tile(['aaaaaaaa', 'aaaaaaaa', 'aaabaaaa', 'aaaaaaaa'], { a: '#30200F', b: '#7A5A3A' }, 4),
          feltc: '#A0683A', felt: tile(['aaaaaaaaaaaaaaaaaaaa', 'aaaaaacaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaacaaaaa', 'aaaaaaaaaaaaaaaaaaaa', 'bbbbbbbbbbbbbbbbbbbb', 'dddddddddddddddddddd', 'ddddddddddcddddddddd', 'dddddddddddddddddddd', 'dddddddddddddddddddd', 'dddcdddddddddddddddd', 'bbbbbbbbbbbbbbbbbbbb'], { a: '#A66E3E', b: '#5E3A1C', c: '#8E5A2E', d: '#9A6235' }, 4), emb: 'star', ec: '#3B2414',
          backc: '#5E3A1C', back: tile(['aaaa', 'abba', 'abba', 'aaaa'], { a: '#5E3A1C', b: '#E9C46A' }, 4) },
        { id: 'arcade', name: 'Arcade Grid', bgc: '#060F1A', bg: tile(['a.......', '........', '........', '........'], { a: '#0E2236' }, 5),
          rimc: '#F5B041', rim: tile(['aaab', 'aaab', 'aaab', 'bbbb'], { a: '#F5B041', b: '#B97A1A' }, 5),
          feltc: '#0B1A2A', felt: tile(['abbbbbbbbb', 'b.........', 'b.........', 'b.........', 'b.........', 'b.........', 'b.........', 'b.........', 'b.........', 'b.........'], { a: '#2DD4BF', b: '#123A44' }, 3), emb: 'joy', ec: '#2DD4BF',
          backc: '#0B1A2A', back: tile(['ab', 'ba'], { a: '#0B1A2A', b: '#FB7185' }, 4) },
        { id: 'lagoon', name: 'Lagoon', bgc: '#0E5C66', bg: tile(['......', '..a...', '......', '.....a', '......'], { a: '#13707A' }, 5),
          rimc: '#E3C38A', rim: tile(['aaaaaa', 'aabaaa', 'aaaaaa', 'aaaaba', 'acaaaa', 'aaaaaa'], { a: '#E3C38A', b: '#C9A469', c: '#F7F4EC' }, 4),
          feltc: '#178A86', felt: tile(['........', '........', '...a....', '........', '........', '......a.', '........'], { a: '#5ED4C8' }, 5), emb: 'palm', ec: '#0B4E4C',
          backc: '#178A86', back: tile(['aaba', 'abaa', 'aaab', 'baaa'], { a: '#178A86', b: '#E3C38A' }, 4) },
      ];
      const BY = {}; THEMES.forEach((t) => { BY[t.id] = t; });

      let cur = 'classic'; try { const v = localStorage.getItem(KEY); if (v && BY[v]) cur = v; } catch (e) {}

      function apply(id) {
        const t = BY[id] || BY.classic; cur = t.id;
        const s = document.documentElement.style, set = (k, v) => s.setProperty(k, v);
        set('--tb-bgc', t.bgc); set('--tb-bg', t.bg.img); set('--tb-bg-s', t.bg.size);
        set('--tb-rimc', t.rimc); set('--tb-rim', t.rim.img); set('--tb-rim-s', t.rim.size);
        set('--tb-feltc', t.feltc); set('--tb-felt', t.felt.img); set('--tb-felt-s', t.felt.size);
        set('--tb-emb', url(svgOf(EMB[t.emb], { k: t.ec }, 0.16)));
        set('--tb-backc', t.backc); set('--tb-back', t.back.img); set('--tb-back-s', t.back.size);
        document.documentElement.dataset.table = t.id;
      }
      function choose(id) { apply(id); try { localStorage.setItem(KEY, cur); } catch (e) {} if (typeof SFX !== 'undefined') SFX.play('card'); draw(); }

      // the picker: six small swatches (rim + cloth + card back), tap one to use it at once
      let pop = null;
      function draw() {
        if (!pop) return;
        pop.innerHTML = `<div class="tbp-h pix">TABLE DESIGN</div><div class="tbp-grid">${THEMES.map((t) => `
          <button class="tbp-o${t.id === cur ? ' on' : ''}" data-tb="${t.id}" aria-label="${t.name}">
            <span class="tbp-sw" style="background:${t.bg.img} 0 0 / ${t.bg.size}, ${t.bgc}">
              <span class="tbp-rim" style="background:${t.rim.img} 0 0 / ${t.rim.size}, ${t.rimc}"><span class="tbp-felt" style="background:${url(svgOf(EMB[t.emb], { k: t.ec }, 0.45))} center / 46% no-repeat, ${t.felt.img} 0 0 / ${t.felt.size}, ${t.feltc}"></span></span>
              <span class="tbp-back" style="background:${t.back.img} 0 0 / ${t.back.size}, ${t.backc}"></span>
            </span><span class="tbp-n">${t.name}</span></button>`).join('')}</div>
          <div class="tbp-note">Only you see your choice.</div>`;
        pop.querySelectorAll('[data-tb]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); choose(b.dataset.tb); }; });
      }
      function close() { if (pop) { pop.remove(); pop = null; document.removeEventListener('pointerdown', outside, true); } }
      function outside(e) { if (pop && !pop.contains(e.target) && !(e.target.closest && e.target.closest('.gs-table'))) close(); }
      window.openTablePicker = function (anchor) {
        if (pop) { close(); return; }
        pop = document.createElement('div'); pop.id = 'tb-pop'; pop.className = 'tbp'; document.body.appendChild(pop); draw();
        const r = anchor && anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
        if (r && r.width) {
          const x = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
          const y = r.top - h - 10 > 8 ? r.top - h - 10 : r.bottom + 10;
          pop.style.left = x + 'px'; pop.style.top = Math.max(8, Math.min(window.innerHeight - h - 8, y)) + 'px';
        }
        setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
      };
      window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
      // leaving the game closes the picker
      new MutationObserver(() => { if (pop && !document.getElementById('gs-tools')) close(); }).observe(document.body, { attributes: true, attributeFilter: ['data-game', 'class'] });

      window.TABLES = { list: THEMES.map((t) => t.id), get current() { return cur; }, set: choose, apply };
      apply(cur);
    })();
