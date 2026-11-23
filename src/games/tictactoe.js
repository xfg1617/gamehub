    /* =========================================================================
       TIC-TAC-TOE: vs the computer (3 levels) or pass & play, single game or best of 3 / 5
       ========================================================================= */
    (function ticTacToeGame() {
      const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
      function winner(b) { for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { p: b[l[0]], line: l }; return b.every(Boolean) ? { p: 'draw' } : null; }
      // perfect play: score from the point of view of `me`
      function minimax(b, turn, me, depth) {
        const w = winner(b);
        if (w) return w.p === 'draw' ? 0 : w.p === me ? 10 - depth : depth - 10;
        let best = turn === me ? -99 : 99;
        for (let i = 0; i < 9; i++) if (!b[i]) {
          b[i] = turn; const sc = minimax(b, turn === 'X' ? 'O' : 'X', me, depth + 1); b[i] = null;
          best = turn === me ? Math.max(best, sc) : Math.min(best, sc);
        }
        return best;
      }
      function bestMoves(b, me) {
        let best = -99, out = [];
        for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = me; const sc = minimax(b, me === 'X' ? 'O' : 'X', me, 1); b[i] = null; if (sc > best) { best = sc; out = [i]; } else if (sc === best) out.push(i); }
        return out;
      }
      function aiMove(b, me, lvl) {
        const free = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0), opp = me === 'X' ? 'O' : 'X';
        const winNow = (who) => free.find((i) => { b[i] = who; const w = winner(b); b[i] = null; return w && w.p === who; });
        if (lvl === 1) { const w = winNow(me); if (w !== undefined && Math.random() < 0.6) return w; return pick(free); }
        if (lvl === 2) {
          const w = winNow(me); if (w !== undefined) return w;
          const bl = winNow(opp); if (bl !== undefined && Math.random() < 0.85) return bl;
          return Math.random() < 0.55 ? pick(bestMoves(b, me)) : pick(free);
        }
        return pick(bestMoves(b, me));
      }

      // pixel-art marks, drawn as strokes so they can "write themselves" in
      const markSVG = (p, anim) => p === 'X'
        ? `<svg viewBox="0 0 100 100" class="ttt-mark ${anim ? 'draw' : ''}"><path d="M22 22 L78 78" stroke="#050E18" stroke-width="20" stroke-linecap="square" fill="none" pathLength="1" transform="translate(4 5)"/><path d="M78 22 L22 78" stroke="#050E18" stroke-width="20" stroke-linecap="square" fill="none" pathLength="1" transform="translate(4 5)"/><path d="M22 22 L78 78" stroke="#FB7185" stroke-width="16" stroke-linecap="square" fill="none" pathLength="1"/><path class="d2" d="M78 22 L22 78" stroke="#FB7185" stroke-width="16" stroke-linecap="square" fill="none" pathLength="1"/></svg>`
        : `<svg viewBox="0 0 100 100" class="ttt-mark ${anim ? 'draw' : ''}"><circle cx="54" cy="55" r="29" stroke="#050E18" stroke-width="20" fill="none" pathLength="1"/><circle cx="50" cy="50" r="29" stroke="#2DD4BF" stroke-width="16" fill="none" pathLength="1" transform="rotate(-90 50 50)"/></svg>`;

      let G = null;
      const $ = (id) => document.getElementById(id);
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[900px] mx-auto');
        setupScreen(body, mod, [
          { key: 'mode', label: 'OPPONENT', def: 'ai', local: true, choices: [['ai', 'vs Computer'], ['local', 'Pass & Play']] },
          { key: 'lvl', label: 'COMPUTER LEVEL', def: 2, local: true, when: (s) => s.mode === 'ai', choices: [[1, 'Easy'], [2, 'Medium'], [3, 'Unbeatable']] },
          { key: 'len', label: 'MATCH', def: 3, choices: [[1, 'One game'], [3, 'Best of 3'], [5, 'Best of 5']] },
          { key: 'first', label: 'WHO STARTS', def: 'alt', local: true, choices: [['me', 'Me'], ['opp', 'Opponent'], ['alt', 'Take turns']] },
        ], (sel) => {
          const ai = sel.mode === 'ai';
          const S = npLocal([{ name: profile.username, avatar: profile.avatar }, ai ? { bot: true, name: ['', 'Easy AI', 'Medium AI', 'Unbeatable AI'][+sel.lvl], avatar: '🤖' } : { name: 'Player 2', avatar: '🙂' }], sel);
          start(body, sel, S);
        });
      }
      // seat 0 is X (coral), seat 1 is O (teal). On this device you are seat 0; online the host is seat 0.
      const seatOf = (mark) => (mark === 'X' ? 0 : 1);
      function start(body, sel, S) {
        const ai = S.bot(1);
        G = { S, ai, lvl: +sel.lvl || 2, len: +sel.len, first: S.online ? 'alt' : sel.first, names: [S.name(0), S.name(1)], wins: [0, 0], draws: 0, game: 0, tok: ++GT.cur, over: false };
        const me = S.online ? S.me : 0, opp = 1 - me;
        body.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-[minmax(0,460px)_1fr] gap-6 items-start justify-center">
          <div class="space-y-3"><div id="ttt-board" class="ttt-board"></div></div>
          <div class="space-y-4 min-w-0">
            <div class="win overflow-hidden"><div class="winbar amber"><span id="ttt-status">YOUR MOVE</span><span id="ttt-game" class="pix text-xs"></span></div>
              <div class="p-4 grid grid-cols-3 gap-3 text-center">
                <div class="stat"><div class="lab"><span class="ttt-chip x"></span>${esc(G.names[0])}</div><div id="ttt-w0" class="val text-coral">0</div></div>
                <div class="stat"><div class="lab">Draws</div><div id="ttt-d" class="val text-bone">0</div></div>
                <div class="stat"><div class="lab"><span class="ttt-chip o"></span>${esc(G.names[1])}</div><div id="ttt-w1" class="val text-teal">0</div></div></div></div>
            <div id="ttt-msg" class="text-sm text-muted min-h-[20px]">${S.online ? `You are <b class="${me ? 'text-teal' : 'text-coral'}">${me ? 'O' : 'X'}</b> against ${esc(S.name(opp))}.` : ''}</div>
            <div class="grid grid-cols-2 gap-3"><button id="ttt-quit" class="btn-game btn-coral py-2.5 text-sm">Resign</button><button id="ttt-new" class="btn-game btn-graphite py-2.5 text-sm">${S.online ? 'Leave' : 'New match'}</button></div>
          </div></div>`;
        $('ttt-new').onclick = () => npConfirmLeave(() => open($('game-root')));
        let sure = false;
        $('ttt-quit').onclick = (e) => { if (G.over) return; if (!sure) { sure = true; e.target.textContent = 'Really resign?'; gTimeout(() => { sure = false; if (G) e.target.textContent = 'Resign'; }, 3000); return; } S.act({ t: 'resign', s: me }); };
        S.on(apply, drive);
        S.act({ t: 'next', g: 0, s: -1 });
        npBar('');
      }
      // every change to the game happens here, in the same order on every screen
      function apply(a) {
        if (!G || G.over) return 0;
        if (a.t === 'next') { if (a.g === G.game && (G.game === 0 || G.done)) newGame(); return 0; }
        if (a.t === 'place') { if (G.done || seatOf(G.turn) !== a.s || G.b[a.i] || a.i < 0 || a.i > 8) return 0; return place(a.i); }
        if (a.t === 'resign' || a.t === '_left' || a.t === '_gone') { endMatch(a.s, a.t); return 0; }
        return 0;
      }
      // only on the table's host: the computer thinks, and the next game starts
      function drive() {
        if (!G || G.over) return;
        const S = G.S;
        if (G.done) { if (!G.matchDone) S.later(() => S.act({ t: 'next', g: G.game, s: -1 }), 1600); return; }
        const seat = seatOf(G.turn);
        if (S.bot(seat)) S.later(() => S.act({ t: 'place', s: seat, i: aiMove(G.b.slice(), G.turn, G.lvl) }), 650 + rnd(450));
      }
      function newGame() {
        G.b = Array(9).fill(null); G.done = false; G.game++;
        const xFirst = G.first === 'me' ? true : G.first === 'opp' ? false : G.game === 1 && G.S.online ? G.S.rng.rnd(2) === 0 : (G.game % 2 === 1) !== !!G.flip;
        if (G.game === 1 && G.S.online) G.flip = !xFirst;
        G.turn = xFirst ? 'X' : 'O';
        const bd = $('ttt-board');
        bd.innerHTML = Array.from({ length: 9 }, (_, i) => `<button class="ttt-cell" data-i="${i}" aria-label="Square ${i + 1}"></button>`).join('') + '<svg class="ttt-win" viewBox="0 0 300 300"><line id="ttt-line" x1="0" y1="0" x2="0" y2="0" pathLength="1"/></svg>';
        bd.querySelectorAll('.ttt-cell').forEach((c) => { c.onclick = () => humanPlay(+c.dataset.i); });
        $('ttt-game').textContent = G.len > 1 ? `GAME ${G.game} · FIRST TO ${Math.ceil(G.len / 2)}` : '';
        turnUI();
      }
      function turnUI() {
        const S = G.S, seat = seatOf(G.turn), mine = S.mine(seat);
        $('ttt-status').textContent = S.online ? (mine ? 'YOUR MOVE' : `${S.name(seat).toUpperCase()}'S MOVE`) : G.ai ? (mine ? 'YOUR MOVE' : 'COMPUTER THINKING...') : `${esc(G.names[seat]).toUpperCase()}'S MOVE`;
        $('ttt-board').classList.toggle('wait', !mine);
        document.querySelectorAll('.ttt-cell').forEach((c) => { c.classList.toggle('hov-x', G.turn === 'X'); c.classList.toggle('hov-o', G.turn === 'O'); });
      }
      function humanPlay(i) { if (!G || G.done || G.over || G.b[i]) return; const seat = seatOf(G.turn); if (!G.S.mine(seat)) return; G.S.act({ t: 'place', s: seat, i }); }
      function place(i) {
        G.b[i] = G.turn;
        const cell = document.querySelector(`.ttt-cell[data-i="${i}"]`);
        if (cell) { cell.innerHTML = markSVG(G.turn, true); cell.classList.add('filled'); }
        SFX.play(G.turn === 'X' ? 'move' : 'click');
        const w = winner(G.b);
        if (w) { G.done = true; const tok = G.tok; gTimeout(() => { if (G && G.tok === tok) endGame(w); }, 420); return 450; }
        G.turn = G.turn === 'X' ? 'O' : 'X';
        turnUI();
        return 0;
      }
      function endGame(w) {
        G.done = true;
        const me = G.S.online ? G.S.me : 0;
        if (w.p === 'draw') { G.draws++; $('ttt-msg').textContent = "It's a draw."; SFX.play('pop'); }
        else {
          const idx = w.p === 'X' ? 0 : 1; G.wins[idx]++;
          const c = (k) => [(k % 3) * 100 + 50, Math.floor(k / 3) * 100 + 50];
          const [x1, y1] = c(w.line[0]), [x2, y2] = c(w.line[2]), ln = $('ttt-line');
          if (ln) { const ex = (x2 - x1) * 0.18, ey = (y2 - y1) * 0.18; ln.setAttribute('x1', x1 - ex); ln.setAttribute('y1', y1 - ey); ln.setAttribute('x2', x2 + ex); ln.setAttribute('y2', y2 + ey); ln.style.stroke = w.p === 'X' ? '#FB7185' : '#2DD4BF'; ln.parentNode.classList.add('on'); }
          w.line.forEach((k) => { const el = document.querySelector(`.ttt-cell[data-i="${k}"]`); if (el) el.classList.add('win'); });
          $('ttt-msg').textContent = `${G.names[idx]} wins this game!`;
          SFX.play((G.ai || G.S.online) && idx !== me ? 'lose' : 'win');
        }
        $('ttt-w0').textContent = G.wins[0]; $('ttt-w1').textContent = G.wins[1]; $('ttt-d').textContent = G.draws;
        const need = Math.ceil(G.len / 2);
        const tok = G.tok;
        if (G.wins[0] >= need || G.wins[1] >= need || G.game >= G.len + 4 || G.len === 1) { G.matchDone = true; G.S.over = true; return gTimeout(() => { if (G && G.tok === tok) endMatch(-1); }, 1300); }
        $('ttt-status').textContent = 'NEXT GAME...';
        G.S._kick();
      }
      // loser: the seat that resigned or left (-1 = the match was played out)
      async function endMatch(loser, how) {
        if (G.over) return; G.over = true; G.done = true; G.S.over = true;
        const S = G.S, me = S.online ? S.me : 0, opp = 1 - me, tok = G.tok;
        const [a, b] = [G.wins[me], G.wins[opp]];
        const res = loser === me ? 'loss' : loser === opp ? 'win' : a > b ? 'win' : a < b ? 'loss' : 'draw';
        const eloTab = { win: [0, 4, 8, 14], loss: [0, -4, -3, -2], draw: [0, 1, 2, 4] };
        const elo = G.ai ? eloTab[res][G.lvl] : 0;
        const s = gstat('tictactoe'); s.gamesWon = (s.gamesWon || 0) + a; s.draws2 = (s.draws2 || 0) + G.draws; if (G.ai && G.lvl === 3 && res !== 'loss') s.unbeaten = (s.unbeaten || 0) + 1;
        if (S.online) s.online = (s.online || 0) + 1;
        const eloRow = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        reportGame('tictactoe', G.ai || S.online ? res : 'draw', { elo, xp: res === 'win' ? 12 + G.lvl * 6 : 6, label: S.online ? `Online ${a}-${b} vs ${S.name(opp)}` : G.ai ? `${a}-${b} vs ${G.names[1]}` : `Pass & play ${a}-${b}` });
        const left = loser === opp && (how === '_left' || how === '_gone');
        const title = loser === me ? 'You resigned' : left ? 'You win!' : loser === opp ? `${S.name(opp)} resigned` : !G.ai && !S.online ? (a === b ? 'A tie!' : `${G.names[a > b ? 0 : 1]} wins!`) : res === 'win' ? 'You win the match!' : res === 'loss' ? (S.online ? `${S.name(opp)} wins the match` : 'The computer wins') : "It's a tie";
        const sub = left ? `${S.name(opp)} ${how === '_gone' ? 'disconnected' : 'left the game'}.` : `Games ${a} – ${b}${G.draws ? ` · ${G.draws} draw${G.draws > 1 ? 's' : ''}` : ''}`;
        gameResult({ title, sub, tone: res === 'loss' ? 'coral' : 'amber', sprite: res === 'loss' ? 'anchor' : 'trophy',
          rows: [[S.online ? 'You' : G.names[0], S.online ? a : G.wins[0], 'text-coral'], [S.online ? S.name(opp) : G.names[1], S.online ? b : G.wins[1], 'text-teal'], ['Draws', G.draws, 'text-bone']].concat(eloRow ? [eloRow] : []), againLabel: S.online ? 'Back to setup' : 'New match', again: () => open($('game-root')) });
      }

      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      GICONS.tictactoe = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(1, 1, 22, 22, K)}${rr(2, 2, 20, 20, '#1A3856')}${rr(8, 2, 1, 20, '#9DB4CC')}${rr(15, 2, 1, 20, '#9DB4CC')}${rr(2, 8, 20, 1, '#9DB4CC')}${rr(2, 15, 20, 1, '#9DB4CC')}${rr(3, 3, 2, 2, '#FB7185')}${rr(5, 5, 2, 2, '#FB7185')}${rr(5, 3, 2, 2, '#FB7185')}${rr(3, 5, 2, 2, '#FB7185')}${rr(10, 10, 4, 1, '#2DD4BF')}${rr(10, 13, 4, 1, '#2DD4BF')}${rr(10, 10, 1, 4, '#2DD4BF')}${rr(13, 10, 1, 4, '#2DD4BF')}${rr(17, 17, 2, 2, '#FB7185')}${rr(19, 19, 2, 2, '#FB7185')}${rr(19, 17, 2, 2, '#FB7185')}${rr(17, 19, 2, 2, '#FB7185')}</svg>`;
      const mod = {
        id: 'tictactoe', name: 'Tic-Tac-Toe', icon: 'tictactoe', cats: ['board'], sub: '1v1 · ~2 MIN', color: '#FB7185', tone: 'coral', btn: 'coral',
        blurb: 'Three in a row wins. Play a quick game or a best-of match against the computer or a friend on the same screen.',
        rules: { tag: '3×3 · 1v1', steps: [
          '<strong class="text-bone">Take turns:</strong> You are <b class="text-coral">X</b>, your opponent is <b class="text-teal">O</b>. Tap an empty square to put your mark there.',
          '<strong class="text-bone">Win:</strong> Get three of your marks in a row: across, down or diagonally. If the board fills up first, it is a draw.',
          '<strong class="text-bone">Matches:</strong> In a best-of match, players take turns going first. The Unbeatable computer never loses, so a draw against it is a great result!',
        ], tip: 'Take the centre if you can. If your opponent takes the centre, take a corner.' },
        profileTiles: (s) => [['MATCHES WON', s.wins, 'text-amber'], ['MATCHES', s.played, 'text-bone'], ['GAMES WON', s.gamesWon || 0, 'text-coral'], ['DRAWS', s.draws2 || 0, 'text-teal']],
        extraRows: (s) => srow('Matches not lost to Unbeatable', s.unbeaten || 0),
        engine: { winner, aiMove, bestMoves }, open, close() { G = null; },
        online: { seats: () => 2, ranked: true, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();

