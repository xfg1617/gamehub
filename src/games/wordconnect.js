    /* =========================================================================
       WORD CONNECT: make as many words as you can from the letter wheel
       ========================================================================= */
    (function wordConnectGame() {
      let DICT = null, BASE = null;
      function prep() {
        if (DICT) return;
        DICT = []; for (const k in WC_WORDS) WC_WORDS[k].split(' ').forEach((w) => { if (w) DICT.push(w); });
        BASE = WC_BASE.split(' ').filter(Boolean);
        EXTRA = new Set((typeof WC_EXTRA === 'string' ? WC_EXTRA : '').split(' ').filter(Boolean));
      }
      // bonus words: real but less common words. They score points, but you don't need them to finish the puzzle.
      let EXTRA = null;
      const isBonus = (w) => !!(EXTRA && EXTRA.has(w) && G && fits(w, cnt(G.base)) && !G.wordSet.has(w));
      const cnt = (w) => { const c = {}; for (const ch of w) c[ch] = (c[ch] || 0) + 1; return c; };
      function fits(w, have) { const c = cnt(w); for (const k in c) if ((have[k] || 0) < c[k]) return false; return true; }
      function solve(letters) { prep(); const have = cnt(letters), L = letters.length; return DICT.filter((w) => w.length >= 3 && w.length <= L && fits(w, have)).sort((a, b) => a.length - b.length || (a < b ? -1 : 1)); }
      const pts = (w, L) => w.length * w.length + (w.length === L ? 50 : 0);
      let G = null;
      const $ = (id) => document.getElementById(id);

      function newPuzzle(L, pk = pick) {
        prep();
        const pool = BASE.filter((w) => w.length === L);
        for (let t = 0; t < 40; t++) {
          const base = pk(pool); const words = solve(base);
          if (words.length >= 22 && words.length <= 150) return { base, words };
        }
        const base = pk(pool); return { base, words: solve(base) };
      }

      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1000px] mx-auto');
        setupScreen(body, mod, [
          { key: 'len', label: 'LETTERS', def: 6, choices: [[6, '6 letters'], [7, '7 letters']] },
          { key: 'time', label: 'TIME', def: 120, choices: [[0, 'No limit'], [90, '90 s'], [120, '2 min'], [180, '3 min']], hint: 'Online it is a race: everyone gets the same letters, most points when time runs out wins.' },
          { key: 'hints', label: 'HINTS', def: 5, choices: [[0, 'None'], [3, '3 hints'], [5, '5 hints']] },
        ], (sel) => start(body, sel, null));
      }
      // S (online only): a race. Everyone gets the same letters (shared dice), scores show live, best score wins.
      function start(body, sel, S) {
        const L = +sel.len, pz = newPuzzle(L, S ? S.rng.pick : pick);
        if (S && !+sel.time) sel = Object.assign({}, sel, { time: 120 });
        let letters = shuffle(pz.base.split(''));
        const pangrams = pz.words.filter((w) => w.length === L);
        G = window.__wcG = { S, race: S ? S.seats.map((x) => ({ name: x.name, av: x.avatar, score: 0, n: 0, done: false })) : null, body, L, base: pz.base, words: pz.words, wordSet: new Set(pz.words), pangrams, letters, found: [], score: 0, path: [], tok: ++GT.cur, over: false, hints: 0, maxHints: sel.hints === undefined ? 5 : +sel.hints, hinted: {}, time: +sel.time, total: pz.words.reduce((a, w) => a + pts(w, L), 0) };
        body.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
          <div class="space-y-4"><div class="flex items-center justify-between gap-3"><div id="wc-clock" class="flex-1"></div></div>
            <div class="grid grid-cols-3 gap-2"><div class="stat"><div class="lab">Score</div><div id="wc-score" class="val text-amber">0</div></div><div class="stat"><div class="lab">Words</div><div id="wc-count" class="val text-emerald">0</div></div><div class="stat"><div class="lab">Stars</div><div id="wc-stars" class="val text-amber"><span style="opacity:.22">★</span><span style="opacity:.22">★</span><span style="opacity:.22">★</span></div></div></div>
            <div id="wc-cur" class="wc-cur"></div><div id="wc-msg" class="text-center text-sm min-h-[20px] text-muted"></div>
            <div id="wc-wheel" class="wc-wheel"></div><div id="wc-devkb" class="flex justify-center"></div>
            <div class="flex gap-2 justify-center flex-wrap"><button id="wc-shuf" class="btn-game btn-graphite py-2 px-4 text-sm">🔀 Shuffle</button><button id="wc-back" class="btn-game btn-graphite py-2 px-4 text-sm" aria-label="Remove last letter">⌫ Back</button><button id="wc-clr" class="btn-game btn-graphite py-2 px-4 text-sm">Clear</button><button id="wc-hint" class="btn-game btn-teal py-2 px-4 text-sm" ${G.maxHints ? '' : 'style="display:none"'}>💡 Hint (-5)</button></div>
            ${S ? '<div id="wc-race" class="win p-3 space-y-1.5"></div>' : ''}
            <button id="wc-end" class="btn-game btn-coral w-full py-2 text-sm">${S ? 'Leave race' : 'Finish round'}</button></div>
          <div class="win overflow-hidden"><div class="winbar teal"><span>${pz.words.length} WORDS TO FIND</span><span class="pix text-xs">${pangrams.length} BIG WORD${pangrams.length > 1 ? 'S' : ''} (${L} LETTERS)</span></div><div id="wc-grid" class="p-3 space-y-3"></div></div></div>`;
        G.clock = makeClock($('wc-clock'));
        drawWheel(); drawGrid(); drawCur();
        $('wc-back').onclick = () => { G.path.pop(); drawCur(); markWheel(); }; $('wc-shuf').onclick = shuf; $('wc-clr').onclick = () => { G.path = []; drawCur(); markWheel(); };
        $('wc-hint').onclick = hint; $('wc-end').onclick = () => { if (S) return npConfirmLeave(() => open($('game-root'))); if (!G.over) finish(true); };
        if (S) { S.on(raceApply); npBar(''); drawRace(); }
        gOn(document, 'keydown', onKey);
        { const dk = $('wc-devkb'); if (dk) { dk.innerHTML = devkbButton(); deviceKeys(dk, (k) => onKey({ key: k === 'ENTER' ? 'Enter' : k === '⌫' ? 'Backspace' : k.toLowerCase(), target: null, preventDefault() {} }), { button: dk.querySelector('button'), enter: 'done' }); } }
        if (G.time) G.clock.start(G.time, 'Time left', () => finish(false), 15); else G.clock.idle('No limit', '∞');
      }

      function drawWheel() {
        const w = $('wc-wheel'), L = G.L, R = 108, c = 145;
        w.innerHTML = `<svg class="wc-line" viewBox="0 0 290 290"><polyline id="wc-pl" fill="none" stroke="#F5B041" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/></svg>` + G.letters.map((ch, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / L; return `<div class="wc-let" data-i="${i}" style="left:${c + R * Math.cos(a)}px;top:${c + R * Math.sin(a)}px">${ch.toUpperCase()}</div>`; }).join('');
        // two ways to spell: TAP letters one by one (a real word goes in by itself), or DRAG across them (let go = submit)
        let down = -1, drag = false, saved = null;
        w.onpointerdown = (e) => { const i = under(e); if (i < 0) return; down = i; drag = false; saved = G.path.slice(); try { w.setPointerCapture(e.pointerId); } catch (er) {} };
        w.onpointermove = (e) => {
          if (down < 0) return;
          const i = under(e); if (i < 0) return;
          if (!drag) { if (i === down) return; drag = true; G.path = [down]; SFX.play('click'); } // moved onto another letter: this is a drag
          const p = G.path; if (p.length > 1 && p[p.length - 2] === i) { p.pop(); drawCur(); markWheel(); } else if (!p.includes(i)) { p.push(i); SFX.play('click'); drawCur(); markWheel(); } };
        w.onpointerup = (e) => {
          if (down < 0) return;
          const i = down; down = -1;
          if (drag) { drag = false; return submit(); }
          // a tap: add the letter, or take it back if it was the last one you tapped
          const p = G.path = saved || G.path;
          if (p[p.length - 1] === i) p.pop();
          else if (!p.includes(i)) p.push(i);
          else { SFX.play('wrong'); return say('That letter is already in your word.', 'text-coral'); }
          SFX.play('click'); drawCur(); markWheel(); autoEnter();
        };
        w.onpointercancel = () => { down = -1; drag = false; };
      }
      function under(e) { const r = $('wc-wheel').getBoundingClientRect(); const x = (e.clientX - r.left) * 290 / r.width, y = (e.clientY - r.top) * 290 / r.height; let best = -1, bd = 1e9; G.letters.forEach((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / G.L; const dx = x - (145 + 108 * Math.cos(a)), dy = y - (145 + 108 * Math.sin(a)); const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }); return bd < 34 * 34 ? best : -1; }
      function markWheel() {
        document.querySelectorAll('.wc-let').forEach((el) => el.classList.toggle('on', G.path.includes(+el.dataset.i)));
        const pl = $('wc-pl'); if (pl) pl.setAttribute('points', G.path.map((i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / G.L; return `${145 + 108 * Math.cos(a)},${145 + 108 * Math.sin(a)}`; }).join(' '));
      }
      const curWord = () => G.path.map((i) => G.letters[i]).join('');
      // as soon as the letters spell a word you have not found yet, it goes in by itself
      // (a moment later, so you see the last letter land first)
      function autoEnter() {
        const w = curWord();
        if (w.length < 3 || G.found.includes(w) || (G.bonus || []).includes(w) || !(G.wordSet.has(w) || isBonus(w))) return;
        gTimeout(() => { if (G && !G.over && curWord() === w) submit(); }, 260);
      }
      function drawCur() { $('wc-cur').innerHTML = curWord().split('').map((ch) => `<span>${ch.toUpperCase()}</span>`).join(''); }
      const say = (t, cls = 'text-muted') => { const m = $('wc-msg'); m.className = `text-center text-sm min-h-[20px] ${cls}`; m.textContent = t; };
      function shuf() { G.letters = shuffle(G.letters); G.path = []; drawWheel(); drawCur(); SFX.play('shuffle'); }

      function onKey(e) {
        if (!G || G.over || e.ctrlKey || e.metaKey || e.altKey) return;
        const t = e.target; if (t && /INPUT|TEXTAREA/.test(t.tagName)) return;
        if (e.key === 'Enter') { e.preventDefault(); return submit(); }
        if (e.key === 'Backspace') { G.path.pop(); drawCur(); markWheel(); return; }
        if (e.key === ' ') { e.preventDefault(); return shuf(); }
        if (e.key === 'Escape') { G.path = []; drawCur(); markWheel(); return; }
        const ch = e.key.toLowerCase(); if (!/^[a-z]$/.test(ch)) return;
        const i = G.letters.findIndex((l, k) => l === ch && !G.path.includes(k)); if (i >= 0) { G.path.push(i); drawCur(); markWheel(); SFX.play('click'); autoEnter(); }
      }

      function submit() {
        if (G.over) return;
        const w = curWord(); G.path = []; markWheel();
        if (!w) return;
        const reject = (m) => { say(m, 'text-coral'); SFX.play('wrong'); const c = $('wc-cur'); c.classList.remove('wc-shake'); void c.offsetWidth; c.classList.add('wc-shake'); gTimeout(() => { drawCur(); }, 450); gTimeout(() => { if ($('wc-cur')) { G.path = []; $('wc-cur').innerHTML = ''; } }, 450); };
        if (w.length < 3) return reject('Words need at least 3 letters.');
        if (G.found.includes(w)) return reject(`You already found ${w.toUpperCase()}.`);
        if ((G.bonus || []).includes(w)) return reject(`You already found ${w.toUpperCase()}.`);
        if (!G.wordSet.has(w) && isBonus(w)) {
          G.bonus = G.bonus || []; G.bonus.push(w); const bp = w.length * 2; G.score += bp; SFX.play('coin');
          say(`BONUS WORD! ${w.toUpperCase()}  +${bp}`, 'text-teal font-bold');
          $('wc-cur').innerHTML = w.split('').map((ch) => `<span style="background:#2DD4BF">${ch.toUpperCase()}</span>`).join('');
          gTimeout(() => { if ($('wc-cur') && !G.path.length) $('wc-cur').innerHTML = ''; }, 600);
          update(); if (G.S) G.S.act({ t: 'score', score: G.score, n: G.found.length });
          return;
        }
        if (!G.wordSet.has(w)) return reject(`"${w.toUpperCase()}" is not in the word list.`);
        G.found.push(w); const p = pts(w, G.L); G.score += p;
        const big = w.length === G.L; SFX.play(big ? 'win' : 'word');
        say(big ? `AMAZING! ${w.toUpperCase()} uses every letter! +${p}` : `${w.toUpperCase()}  +${p}`, big ? 'text-amber font-bold' : 'text-emerald font-bold');
        $('wc-cur').innerHTML = w.split('').map((ch) => `<span style="background:#34D399">${ch.toUpperCase()}</span>`).join('');
        gTimeout(() => { if ($('wc-cur') && !G.path.length) $('wc-cur').innerHTML = ''; }, 600);
        update();
        if (G.S) G.S.act({ t: 'score', score: G.score, n: G.found.length });
        if (G.found.length === G.words.length) finish(false, true);
      }
      /* ----- the online race: everyone's score, live ----- */
      function raceApply(a) {
        if (!G || !G.race) return 0;
        const r = G.race[a.s]; if (!r) return 0;
        if (a.t === 'score') { r.score = Math.max(0, +a.score || 0); r.n = +a.n || 0; }
        if (a.t === 'done') { r.score = Math.max(0, +a.score || 0); r.n = +a.n || 0; r.done = true; }
        if (a.t === '_left' || a.t === '_gone') { r.done = true; r.left = true; }
        drawRace();
        if (G.over && G.race.every((x) => x.done)) raceResult();
        return 0;
      }
      function drawRace() {
        const el = $('wc-race'); if (!el || !G.race) return;
        const best = Math.max(...G.race.map((x) => x.score));
        el.innerHTML = `<div class="pix text-xs text-muted">RACE · SAME LETTERS FOR EVERYONE</div>` + G.race.map((x, i) => `<div class="flex items-center justify-between gap-2 text-sm ${i === G.S.me ? 'text-amber font-bold' : ''} ${x.left ? 'opacity-50 line-through' : ''}"><span class="truncate">${esc(x.av)} ${esc(x.name)}${x.done && !x.left ? ' ✔' : ''}</span><span class="pix">${x.n} words · <b class="${x.score === best && best > 0 ? 'text-emerald' : ''}">${x.score}</b></span></div>`).join('');
      }
      function raceResult() {
        if (G.raceShown) return; G.raceShown = true;
        const rank = G.race.map((x, i) => Object.assign({ i }, x)).filter((x) => !x.left || x.i === G.S.me).sort((a, b) => b.score - a.score);
        const me = rank.findIndex((x) => x.i === G.S.me), won = me === 0 && (rank.length < 2 || rank[1].score < rank[0].score);
        const s = gstat('wordconnect'); s.online = (s.online || 0) + 1; if (won) s.raceWins = (s.raceWins || 0) + 1;
        SFX.play(won ? 'win' : 'lose');
        gameResult({ title: won ? 'You won the race!' : `${rank[0].name} wins the race`, sub: `The big word was ${G.base.toUpperCase()}.`, tone: won ? 'amber' : 'coral', sprite: won ? 'trophy' : 'anchor',
          rows: rank.map((x, k) => [`${k + 1}. ${x.name}`, `${x.score} pts · ${x.n} words`, x.i === G.S.me ? 'text-amber' : 'text-bone']), againLabel: 'Back to setup', again: () => open($('game-root')) });
      }
      const starsOf = () => { const r = G.found.length / G.words.length; return r >= 0.8 ? 3 : r >= 0.55 ? 2 : r >= 0.3 ? 1 : 0; };
      function update() {
        $('wc-score').textContent = G.score; $('wc-count').textContent = `${G.found.length}/${G.words.length}`;
        const st = starsOf(); $('wc-stars').innerHTML = [0, 1, 2].map((i) => `<span style="opacity:${i < st ? 1 : 0.22}">★</span>`).join('');
        drawGrid();
      }
      function hint() {
        if (G.over) return;
        const left = G.words.filter((w) => !G.found.includes(w) && !G.hinted[w]);
        if (!left.length) return say('Nothing left to hint!', 'text-muted');
        if (G.hints >= G.maxHints) return say(G.maxHints ? `You used all ${G.maxHints} hints.` : 'Hints are off for this game.', 'text-coral');
        const w = pick(left.filter((x) => x.length <= G.L - 1).length ? left.filter((x) => x.length <= G.L - 1) : left);
        G.hinted[w] = 1; G.hints++; G.score = Math.max(0, G.score - 5); SFX.play('reveal');
        say(`Hint: a word starts with ${w.slice(0, 2).toUpperCase()}...`, 'text-amber'); update();
      }
      function drawGrid(reveal) {
        const by = {}; G.words.forEach((w) => { (by[w.length] = by[w.length] || []).push(w); });
        $('wc-grid').innerHTML = Object.keys(by).sort((a, b) => a - b).map((len) => `<div><div class="pix text-xs text-muted mb-1">${len} LETTERS · ${by[len].filter((w) => G.found.includes(w)).length}/${by[len].length}</div><div class="flex flex-wrap gap-1.5">${by[len].map((w) => {
          const f = G.found.includes(w);
          if (f) return `<span class="wc-slot ${w.length === G.L ? 'pg' : 'f'}">${w.toUpperCase()}</span>`;
          if (reveal) return `<span class="wc-slot miss">${w.toUpperCase()}</span>`;
          if (G.hinted[w]) return `<span class="wc-slot hint">${w.slice(0, 2).toUpperCase()}${'·'.repeat(w.length - 2)}</span>`;
          return `<span class="wc-slot">${'·'.repeat(w.length)}</span>`;
        }).join('')}</div></div>`).join('');
      }

      function finish(manual, perfect) {
        if (G.over) return; G.over = true; G.clock.stop();
        drawGrid(true);
        const st = starsOf(), n = G.found.length, big = G.found.filter((w) => w.length === G.L).length;
        const s = gstat('wordconnect'); s.bestScore = Math.max(s.bestScore || 0, G.score); s.words = (s.words || 0) + n; s.bigWords = (s.bigWords || 0) + big; s.perfect = (s.perfect || 0) + (perfect ? 1 : 0); s.bestStars = Math.max(s.bestStars || 0, st);
        const win = st >= 2, elo = [-4, -2, 4, 8][st];
        reportGame('wordconnect', win ? 'win' : 'loss', { elo: G.S ? 0 : elo, xp: 10 + st * 10 + (big ? 10 : 0), label: `${G.S ? 'Online race · ' : ''}${st} star${st === 1 ? '' : 's'} · ${n}/${G.words.length} words · ${G.score} pts` });
        if (G.S) {
          G.S.act({ t: 'done', score: G.score, n });
          say(G.race.every((x, i) => x.done || i === G.S.me) ? '' : 'Time! Waiting for the others to finish...', 'text-muted');
          return;
        }
        SFX.play(win ? 'win' : 'lose');
        gTimeout(() => gameResult({ title: perfect ? 'PERFECT! Every word!' : st === 3 ? 'Word master!' : st === 2 ? 'Nice work!' : st === 1 ? 'Not bad!' : 'Keep practising!', sub: `The big word was ${G.base.toUpperCase()}.`, tone: win ? 'amber' : 'coral', sprite: win ? 'trophy' : 'anchor', rows: [['Stars', st + ' of 3', 'text-amber'], ['Words found', `${n}/${G.words.length}`, 'text-emerald'], ['Score', G.score, 'text-amber'], ['Elo', (elo > 0 ? '+' : '') + elo, elo >= 0 ? 'text-emerald' : 'text-coral']], againLabel: 'New letters', again: () => open($('game-root')) }), 700);
      }

      const mod = {
        id: 'wordconnect', name: 'Word Connect', icon: 'wordconnect', cats: ['word'], sub: 'SOLO · 2 MIN', color: '#34D399', tone: 'emerald', btn: 'emerald',
        blurb: 'Swipe across the letter wheel to make as many words as you can before time runs out. Find the word that uses every letter for a big bonus.',
        rules: { tag: 'SOLO · TIMED', steps: [
          '<strong class="text-bone">Connect letters:</strong> Tap letters one at a time (tap the last letter again to take it back), drag across the wheel, or type on your keyboard, to spell a word of 3 letters or more. A real word goes in <b>by itself</b> as soon as you spell it. Each letter can be used once per word.',
          '<strong class="text-bone">Score:</strong> Longer words score much more (letters × letters). The word that uses <span class="text-amber font-bold">every letter</span> gives +50 bonus!',
          '<strong class="text-bone">Stars:</strong> Find 30%, 55% and 80% of the hidden words to earn 1, 2 and 3 stars. Stuck? Shuffle the wheel or use a hint.',
        ], tip: 'Start with short words and plurals (add S or ED), then look for the long word using every letter.' },
        profileTiles: (s) => [['WINS (2★+)', s.wins, 'text-amber'], ['ROUNDS', s.played, 'text-bone'], ['BEST SCORE', s.bestScore || 0, 'text-emerald'], ['WORDS FOUND', s.words || 0, 'text-teal']],
        extraRows: (s) => srow('Big words', s.bigWords || 0) + srow('Perfect rounds', s.perfect || 0) + srow('Best stars', (s.bestStars || 0) + ' of 3'),
        online: { seats: () => 4, min: 2, bots: false, ranked: false, start: (body, sel, S) => start(body, sel, S) },
        engine: { solve, newPuzzle, pts }, open, close() { G = null; },
      };
      registerGame(mod);
    })();

