    /* =========================================================================
       CARO (Cờ Caro, five in a row) — Nov 2026, Inna's list. 15×15 (or 19×19) board, X and O, get five in a row.
       Optional Vietnamese rule (off by default): a line of five blocked by the other player at BOTH ends doesn't win.
       Computer: Easy / Medium / Hard (every empty square near the stones is scored for attack and defence by looking
       at all the 5-square windows through it). Online through netplay (apply/drive, like Tic-Tac-Toe).
       ========================================================================= */
    (function caroGame() {
      const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
      const other = (p) => (p === 'X' ? 'O' : 'X');
      // the run of p's marks through square i in direction d: { cells, ends } (ends = squares just past each end)
      function run(b, N, i, p, d) {
        const r0 = Math.floor(i / N), c0 = i % N, cells = [i], ends = [];
        for (const s of [1, -1]) {
          let r = r0 + d[0] * s, c = c0 + d[1] * s;
          while (r >= 0 && r < N && c >= 0 && c < N && b[r * N + c] === p) { cells.push(r * N + c); r += d[0] * s; c += d[1] * s; }
          ends.push(r >= 0 && r < N && c >= 0 && c < N ? b[r * N + c] : 'edge');
        }
        return { cells, ends };
      }
      // did the mark just put on square i win? block = the Vietnamese rule
      function winAt(b, N, i, block) {
        const p = b[i]; if (!p) return null;
        for (const d of DIRS) {
          const r = run(b, N, i, p, d);
          if (r.cells.length >= 5 && !(block && r.ends[0] === other(p) && r.ends[1] === other(p))) return { p, line: r.cells.sort((a, c) => a - c) };
        }
        return null;
      }
      // how good square i is for p: every 5-square window through it with none of the other player's marks counts,
      // more of p's marks in it = much more (so open fours and double threats score high on their own)
      const W = [0, 1, 12, 90, 900, 200000];
      function cellScore(b, N, i, p) {
        const r0 = Math.floor(i / N), c0 = i % N, q = other(p); let sc = 0;
        for (const d of DIRS) for (let k = -4; k <= 0; k++) {
          let n = 1, ok = true;
          for (let j = k; j < k + 5; j++) {
            if (j === 0) continue;
            const r = r0 + d[0] * j, c = c0 + d[1] * j;
            if (r < 0 || r >= N || c < 0 || c >= N) { ok = false; break; }
            const v = b[r * N + c]; if (v === q) { ok = false; break; } if (v === p) n++;
          }
          if (ok) sc += W[n];
        }
        return sc;
      }
      function candidates(b, N) {
        const out = [], seen = new Set();
        b.forEach((v, i) => {
          if (!v) return; const r0 = Math.floor(i / N), c0 = i % N;
          for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
            const r = r0 + dr, c = c0 + dc, j = r * N + c;
            if (r >= 0 && r < N && c >= 0 && c < N && !b[j] && !seen.has(j)) { seen.add(j); out.push(j); }
          }
        });
        return out;
      }
      function aiMove(b, N, me, lvl) {
        const mid = Math.floor(N / 2) * N + Math.floor(N / 2);
        if (!b.some(Boolean)) return mid;
        const opp = other(me), C = candidates(b, N);
        if (!C.length) return b.findIndex((v) => !v);
        const def = [0, 0.55, 0.8, 1.0][lvl] || 0.8;
        const scored = C.map((i) => {
          const a = cellScore(b, N, i, me), d = cellScore(b, N, i, opp);
          let s = a + d * def;
          if (a >= W[5]) s += 1e7;                 // a win right now
          else if (d >= W[5]) s += lvl === 1 && Math.random() < 0.35 ? 0 : 5e6;   // stop theirs (Easy sometimes misses it)
          if (lvl === 2) s *= 0.5 + Math.random() * 1.0; else if (lvl >= 3) s *= 0.98 + Math.random() * 0.04;
          return [i, s];
        }).sort((x, y) => y[1] - x[1]);
        if (lvl === 1) { if (scored[0][1] >= 1e7) return scored[0][0]; const top = scored.slice(0, Math.min(6, scored.length)); return Math.random() < 0.25 ? pick(C) : pick(top)[0]; }
        if (lvl >= 3 && scored[0][1] < 5e6) {
          // Hard thinks in threats: how many squares would finish a five for p after a move on i?
          const finishes = (p) => candidates(b, N).filter((j) => { b[j] = p; const w = winAt(b, N, j, false); b[j] = null; return w; }).length;
          const after = (i, p) => { b[i] = p; const n = finishes(p); b[i] = null; return n; };
          const byOpp = C.map((i) => [i, cellScore(b, N, i, opp)]).sort((x, y) => y[1] - x[1]).slice(0, 10).map((x) => x[0]);
          const top = [...new Set(scored.slice(0, 12).map((x) => x[0]).concat(byOpp))];
          const mine = top.find((i) => after(i, me) >= 2); if (mine !== undefined) return mine;        // an unstoppable four
          const danger = top.filter((i) => after(i, opp) >= 2);                                         // where they'd make one
          if (danger.length) {
            const four = top.find((i) => after(i, me) === 1 && danger.length > 1);                       // force them first
            return four !== undefined ? four : danger[0];
          }
          // two threats at once (a four plus an open three, or two open threes) for me; stop the same for them
          const dbl = (i, p) => { b[i] = p; const n = candidates(b, N).filter((j) => after(j, p) >= 2).length; b[i] = null; return n; };
          const mine2 = top.find((i) => after(i, me) === 1 ? dbl(i, me) >= 1 : dbl(i, me) >= 2); if (mine2 !== undefined) return mine2;
          const their2 = byOpp.find((i) => dbl(i, opp) >= 2); if (their2 !== undefined) return their2;
        }
        return scored[0][0];
      }


      // the marks: little pixel X (teal) and O (coral)
      const px = (rows, pal) => { let r = ''; rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[ch]}"/>`; })); return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges">${r}</svg>`; };
      const MARK = {
        X: px(['k......k', 'kt....tk', '.kt..tk.', '..ktkk..', '..kktk..', '.kt..tk.', 'kt....tk', 'k......k'], { k: '#0E7C70', t: '#2DD4BF' }),
        O: px(['..kkkk..', '.kcccck.', 'kcc..cck', 'kc....ck', 'kc....ck', 'kcc..cck', '.kcccck.', '..kkkk..'], { k: '#B2213A', c: '#FB7185' }),
      };

      let G = null;
      const $ = (id) => document.getElementById(id);
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1100px] mx-auto');
        setupScreen(body, mod, [
          { key: 'lvl', label: 'COMPUTER LEVEL', def: 2, local: true, choices: [[1, 'Easy'], [2, 'Medium'], [3, 'Hard']] },
          { key: 'size', label: 'BOARD', def: 15, choices: [[15, '15 × 15'], [19, '19 × 19']] },
          { key: 'len', label: 'MATCH', def: 3, choices: [[1, 'One game'], [3, 'Best of 3'], [5, 'Best of 5']] },
          { key: 'block', label: 'Vietnamese rule: blocked five doesn\'t win', toggle: true, def: 0, hint: 'If the other player has a mark at both ends of your five, it does not count.', choices: [[1, 'On'], [0, 'Off']] },
          turnOpt(30, [15, 30, 60]),
        ], (sel) => {
          const S = npLocal([{ name: profile.username, avatar: profile.avatar }, { bot: true, name: ['', 'Easy CPU', 'Medium CPU', 'Hard CPU'][+sel.lvl || 2], avatar: '🤖' }], sel);
          start(body, sel, S);
        });
      }
      const seatOf = (mark) => (mark === 'X' ? 0 : 1);
      function start(body, sel, S) {
        const N = +sel.size === 19 ? 19 : 15;
        G = { S, N, block: !!+sel.block, turnT: +sel.turnT || 0, lvl: +sel.lvl || 2, len: +sel.len || 3, wins: [0, 0], draws: 0, game: 0, tok: ++GT.cur, over: false, moves: 0 };
        const me = S.online ? S.me : 0;
        body.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-[minmax(0,640px)_300px] gap-5 items-start justify-center cr-lay">
          <div class="min-w-0"><div id="cr-board" class="cr-board" style="--n:${N}"></div></div>
          <div class="space-y-3 min-w-0 cr-side">
            <div class="cr-tags">${[0, 1].map((s) => `<div id="cr-seat-${s}" class="tg-seat cr-seat"></div>`).join('')}</div>
            <div class="win overflow-hidden"><div class="winbar amber"><span id="cr-status">YOUR MOVE</span><span id="cr-game" class="pix text-xs"></span></div>
<div class="hidden"><span id="cr-w0"></span><span id="cr-d"></span><span id="cr-w1"></span></div></div>
            <div id="cr-msg" class="text-sm text-muted min-h-[20px]">${S.online ? `You are <b class="${me ? 'text-coral' : 'text-teal'}">${me ? 'O' : 'X'}</b> against ${esc(S.name(1 - me))}.` : ''}</div>
            <div class="win overflow-hidden cr-how"><div class="winbar"><span>HOW TO WIN</span></div><div class="p-3 text-sm text-muted">Get <b class="text-bone">five in a row</b>: across, down or diagonally. When the other player has <b class="text-bone">three or four</b> in a row, block an end!${G.block ? '<br><b class="text-amber">Vietnamese rule:</b> five with the other player\'s marks at both ends doesn\'t win.' : ''}</div></div>
            <div class="grid grid-cols-2 gap-3"><button id="cr-quit" class="btn-game btn-coral py-2.5 text-sm">Resign</button><button id="cr-new" class="btn-game btn-graphite py-2.5 text-sm">${S.online ? 'Leave' : 'New match'}</button></div>
          </div></div>`;
        $('cr-new').onclick = () => npConfirmLeave(() => open($('game-root')));
        let sure = false;
        $('cr-quit').onclick = (e) => { if (G.over) return; if (!sure) { sure = true; e.target.textContent = 'Really resign?'; gTimeout(() => { sure = false; if (G) e.target.textContent = 'Resign'; }, 3000); return; } S.act({ t: 'resign', s: me }); };
        S.on(apply, drive);
        S.act({ t: 'next', g: 0, s: -1 });
        npBar('');
      }
      function apply(a) {
        if (!G || G.over) return 0;
        if (a.t === 'next') { if (a.g === G.game && (G.game === 0 || G.done)) newGame(); return 0; }
        if (a.t === 'place') { if (G.done || seatOf(G.turn) !== a.s || a.i < 0 || a.i >= G.N * G.N || G.b[a.i]) return 0; return place(a.i); }
        if (a.t === 'resign' || a.t === '_left' || a.t === '_gone') { endMatch(a.s, a.t); return 0; }
        return 0;
      }
      function drive() {
        if (!G || G.over) return;
        const S = G.S;
        if (G.done) { if (!G.matchDone) S.later(() => S.act({ t: 'next', g: G.game, s: -1 }), 2800); return; }
        const seat = seatOf(G.turn);
        if (S.bot(seat)) { const lvl = S.online ? (+(S.sel && S.sel.lvl) || 2) : G.lvl; S.later(() => S.act({ t: 'place', s: seat, i: aiMove(G.b.slice(), G.N, G.turn, lvl) }), window.__fast ? 40 : 1100 + rnd(700)); }
      }
      function tags() {
        const S = G.S, me = S.online ? S.me : 0;
        [0, 1].forEach((s) => {
          const el = $('cr-seat-' + s); if (!el) return;
          el.innerHTML = nameTag({ av: S.avatar ? S.avatar(s) : (s ? '🤖' : profile.avatar), name: s === me && !S.online ? 'You' : S.name(s), sub: (s ? 'O' : 'X') + ' · ' + G.wins[s] + (G.wins[s] === 1 ? ' win' : ' wins') + (G.draws && s === 1 ? ' · ' + G.draws + (G.draws === 1 ? ' draw' : ' draws') : ''), turn: !G.done && seatOf(G.turn) === s, me: s === me });
        });
      }
      function newGame() {
        const N = G.N;
        G.b = Array(N * N).fill(null); G.done = false; G.game++; G.last = -1; G.moves = 0;
        // X starts the first game; after that the players take turns starting (online the shared dice pick the first)
        const flip = G.game === 1 && G.S.online ? G.S.rng.rnd(2) === 1 : !!G.flip;
        if (G.game === 1) G.flip = flip;
        G.turn = ((G.game % 2 === 1) !== flip) ? 'X' : 'O';
        const bd = $('cr-board');
        bd.innerHTML = Array.from({ length: N * N }, (_, i) => `<button class="cr-c" data-i="${i}" aria-label="Square ${Math.floor(i / N) + 1}, ${i % N + 1}"></button>`).join('');
        bd.onclick = (e) => { const c = e.target.closest('.cr-c'); if (c) humanPlay(+c.dataset.i); };
        $('cr-game').textContent = G.len > 1 ? `GAME ${G.game} · FIRST TO ${Math.ceil(G.len / 2)}` : '';
        turnUI();
      }
      function turnUI() {
        const S = G.S, seat = seatOf(G.turn), mine = S.mine(seat) && !S.bot(seat);
        $('cr-status').textContent = mine ? 'YOUR MOVE' : S.bot(seat) && !S.online ? 'COMPUTER THINKING...' : `${S.name(seat).toUpperCase()}'S MOVE`;
        const bd = $('cr-board'); bd.classList.toggle('wait', !mine); bd.classList.toggle('hx', G.turn === 'X'); bd.classList.toggle('ho', G.turn === 'O');
        tags(); clock();
      }
      function clock() {
        const seat = G && seatOf(G.turn), mine = G && !G.done && !G.over && G.S.mine(seat) && !G.S.bot(seat) && (typeof NP === 'undefined' || !NP.catchup);
        turnClock(mine ? `cr${G.game}:${G.moves}` : null, G && G.turnT, () => { if (G && !G.done && !G.over) humanPlay(aiMove(G.b.slice(), G.N, G.turn, 2)); });
      }
      function humanPlay(i) { if (!G || G.done || G.over || G.b[i]) return; const seat = seatOf(G.turn); if (!G.S.mine(seat) || G.S.bot(seat)) return; G.S.act({ t: 'place', s: seat, i }); }
      function place(i) {
        G.b[i] = G.turn; G.moves++;
        const bd = $('cr-board'), cell = bd && bd.children[i], prev = bd && G.last >= 0 && bd.children[G.last];
        if (prev) prev.classList.remove('last');
        if (cell) { cell.innerHTML = MARK[G.turn]; cell.classList.add('f', 'last', 'pop'); }
        G.last = i;
        SFX.play(G.turn === 'X' ? 'move' : 'click');
        const w = winAt(G.b, G.N, i, G.block);
        if (w || G.moves >= G.N * G.N) { G.done = true; tags(); const tok = G.tok; gTimeout(() => { if (G && G.tok === tok) endGame(w || { p: 'draw' }); }, 380); return 420; }
        G.turn = other(G.turn);
        turnUI();
        return 0;
      }
      function endGame(w) {
        G.done = true; turnClock(null);
        const S = G.S, me = S.online ? S.me : 0, bd = $('cr-board');
        if (w.p === 'draw') { G.draws++; $('cr-msg').textContent = 'The board is full: a draw.'; SFX.play('pop'); }
        else {
          const idx = seatOf(w.p); G.wins[idx]++;
          w.line.forEach((k) => bd && bd.children[k] && bd.children[k].classList.add('win'));
          $('cr-msg').innerHTML = `<b class="${idx ? 'text-coral' : 'text-teal'}">${esc(S.name(idx))}</b> wins this game: five in a row!`;
          SFX.play(S.bot(idx) || (S.online && idx !== me) ? 'lose' : 'win');
          if (idx === me && G.moves <= 17 && !S.bot(me)) funMoment('cr-seat-' + idx, { icon: '⚡', label: 'QUICK WIN', sub: 'five in a row in ' + Math.ceil(G.moves / 2) + ' moves', key: 'cr-fast' + G.game, mine: true });
        }
        $('cr-w0').textContent = G.wins[0]; $('cr-w1').textContent = G.wins[1]; $('cr-d').textContent = G.draws;
        tags();
        const need = Math.ceil(G.len / 2), tok = G.tok;
        if (G.wins[0] >= need || G.wins[1] >= need || G.game >= G.len + 4 || G.len === 1) { G.matchDone = true; S.over = true; return gTimeout(() => { if (G && G.tok === tok) endMatch(-1); }, 1600); }
        $('cr-status').textContent = 'NEXT GAME...';
        S._kick();
      }
      async function endMatch(loser, how) {
        if (G.over) return; G.over = true; G.done = true; G.S.over = true; turnClock(null);
        const S = G.S, me = S.online ? S.me : 0, opp = 1 - me, tok = G.tok;
        const [a, b] = [G.wins[me], G.wins[opp]];
        const res = loser === me ? 'loss' : loser === opp ? 'win' : a > b ? 'win' : a < b ? 'loss' : 'draw';
        const s = gstat('caro'); s.gamesWon = (s.gamesWon || 0) + a; if (!S.online && G.lvl === 3 && res === 'win') s.beatHard = (s.beatHard || 0) + 1;
        if (S.online) s.online = (s.online || 0) + 1;
        const row = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        reportGame('caro', res, { xp: res === 'win' ? 14 + G.lvl * 6 : 6, label: S.online ? `Online ${a}-${b} vs ${S.name(opp)}` : `${a}-${b} vs ${S.name(opp)}` });
        const left = loser === opp && (how === '_left' || how === '_gone');
        const title = loser === me ? 'You resigned' : left ? 'You win!' : loser === opp ? `${S.name(opp)} resigned` : res === 'win' ? 'You win the match!' : res === 'loss' ? (S.online ? `${S.name(opp)} wins the match` : 'The computer wins') : "It's a tie";
        const sub = left ? `${S.name(opp)} ${how === '_gone' ? 'disconnected' : 'left the game'}.` : `Games ${a} – ${b}${G.draws ? ` · ${G.draws} draw${G.draws > 1 ? 's' : ''}` : ''}`;
        gameResult({ title, sub, tone: res === 'loss' ? 'coral' : 'amber', sprite: res === 'loss' ? 'anchor' : 'trophy',
          rows: [['You', a, 'text-teal'], [S.name(opp), b, 'text-coral'], ['Draws', G.draws, 'text-bone']].concat(row ? [row] : []), againLabel: S.online ? 'Back to setup' : 'New match', again: () => open($('game-root')) });
      }

      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      // tile icon: a cream grid with a diagonal of five X marks and two O marks
      GICONS.caro = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(1, 1, 22, 22, K)}${rr(2, 2, 20, 20, '#F7F4EC')}${[6, 10, 14, 18].map((v) => rr(v, 2, 1, 20, '#CFC8B4') + rr(2, v, 20, 1, '#CFC8B4')).join('')}${[0, 1, 2, 3, 4].map((k) => { const x = 3 + k * 4, y = 3 + k * 4; return rr(x, y, 1, 1, '#0E7C70') + rr(x + 2, y, 1, 1, '#0E7C70') + rr(x + 1, y + 1, 1, 1, '#2DD4BF') + rr(x, y + 2, 1, 1, '#0E7C70') + rr(x + 2, y + 2, 1, 1, '#0E7C70'); }).join('')}${[[15, 3], [3, 15]].map(([x, y]) => rr(x, y, 3, 1, '#FB7185') + rr(x, y + 2, 3, 1, '#FB7185') + rr(x, y, 1, 3, '#FB7185') + rr(x + 2, y, 1, 3, '#FB7185')).join('')}</svg>`;
      const mod = {
        id: 'caro', name: 'Caro', icon: 'caro', cats: ['board'], sub: '1v1 · ~5 MIN', color: '#2DD4BF', tone: 'teal', btn: 'teal', flag: 'NEW',
        blurb: 'Five in a row on a big board. Vietnam\'s favourite pen-and-paper game: quick to learn, hard to master.',
        rules: { tag: '15×15 · 1v1', steps: [
          '<strong class="text-bone">Take turns:</strong> You are <b class="text-teal">X</b>, your opponent is <b class="text-coral">O</b>. Tap an empty square to put your mark there.',
          '<strong class="text-bone">Win:</strong> Get five of your marks in a row: across, down or diagonally.',
          '<strong class="text-bone">Block:</strong> When the other player has three or four in a row with open ends, put your mark at an end to stop them.',
        ], tip: 'An open four (four in a row with both ends free) can\'t be stopped: build towards two threats at once.' },
        profileTiles: (s) => [['MATCHES WON', s.wins, 'text-amber'], ['MATCHES', s.played, 'text-bone'], ['GAMES WON', s.gamesWon || 0, 'text-teal'], ['BEAT HARD CPU', s.beatHard || 0, 'text-coral']],
        engine: { winAt, aiMove, cellScore, state: () => G }, open, close() { G = null; turnClock(null); },
        online: { seats: () => 2, ranked: true, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
