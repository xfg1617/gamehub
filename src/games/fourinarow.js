    /* =========================================================================
       FOUR-IN-A-ROW (replaces the older base-page version; same id 'c4', so saved stats carry over):
       vs the computer, pass & play, or online through the shared table (ranked quick match / private room)
       ========================================================================= */
    (function fourInARowGame() {
      const ROWS = 6, COLS = 7;
      const lowest = (b, c) => { for (let r = ROWS - 1; r >= 0; r--) if (!b[r][c]) return r; return -1; };
      function winLine(b, p) {
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          if (b[r][c] !== p) continue;
          for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
            const line = [[r, c]];
            for (let k = 1; k < 4; k++) { const nr = r + dr * k, nc = c + dc * k; if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && b[nr][nc] === p) line.push([nr, nc]); else break; }
            if (line.length === 4) return line;
          }
        }
        return null;
      }
      // the computer: win now, block, prefer the middle, don't hand over a win just above
      function aiCol(b, me, lvl) {
        const opp = me === 1 ? 2 : 1, cols = [...Array(COLS).keys()].filter((c) => !b[0][c]);
        if (!cols.length) return -1;
        if (lvl === 'easy' && Math.random() < 0.55) return pick(cols);
        const tryAt = (c, p) => { const r = lowest(b, c); b[r][c] = p; const w = winLine(b, p); b[r][c] = 0; return !!w; };
        for (const c of cols) if (tryAt(c, me)) return c;
        for (const c of cols) if (tryAt(c, opp)) return c;
        let best = cols[0], bs = -999;
        for (const c of cols) {
          const r = lowest(b, c); let sc = 12 - Math.abs(3 - c) * 2.5 + Math.random();
          if (r > 0) { b[r][c] = me; b[r - 1][c] = opp; if (winLine(b, opp)) sc -= 70; b[r - 1][c] = 0; b[r][c] = 0; }
          if (sc > bs) { bs = sc; best = c; }
        }
        return best;
      }

      let G = null;
      const $ = (id) => document.getElementById(id);
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[980px] mx-auto');
        setupScreen(body, mod, [
          { key: 'mode', label: 'OPPONENT', def: 'ai', local: true, choices: [['ai', 'vs Computer'], ['local', 'Pass & Play']] },
          { key: 'lvl', label: 'COMPUTER LEVEL', def: 'smart', local: true, when: (s) => s.mode === 'ai', choices: [['easy', 'Easy'], ['smart', 'Smart']] },
          { key: 'first', label: 'WHO STARTS', def: 'me', local: true, choices: [['me', 'Me'], ['opp', 'Opponent'], ['random', 'Random']] },
          { key: 'clock', label: 'TURN TIMER', def: 20, choices: [[10, '10 s'], [20, '20 s'], [30, '30 s']] },
        ], (sel) => {
          const ai = sel.mode !== 'local';
          start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }, ai ? { bot: true, name: sel.lvl === 'easy' ? 'Easy AI' : 'Smart AI', avatar: '🤖' } : { name: 'Player 2', avatar: '🙂' }], sel));
        });
      }
      // seat 0 drops amber discs (1), seat 1 coral (2). On this device you are seat 0; online the host is seat 0.
      function start(body, sel, S) {
        G = { S, b: Array.from({ length: ROWS }, () => Array(COLS).fill(0)), turn: 1, over: false, done: false, lvl: sel.lvl || 'smart', secs: +sel.clock || 20, first: S.online ? 'net' : sel.first, tok: ++GT.cur, last: null, win: null, moves: 0 };
        const me = S.online ? S.me : 0, opp = 1 - me;
        body.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-[minmax(0,460px)_1fr] gap-6 items-start justify-center">
          <div class="space-y-2"><div id="c4n-board" class="c4n-board" role="grid" aria-label="Four-in-a-Row board"></div></div>
          <div class="space-y-4 min-w-0">
            <div class="win overflow-hidden"><div class="winbar coral"><span id="c4n-status">YOUR TURN</span><span class="pix text-xs">FOUR-IN-A-ROW</span></div>
              <div class="p-4 space-y-3"><div id="c4n-clock"></div>
                <div class="grid grid-cols-2 gap-3 text-center"><div class="stat"><div class="lab"><span class="c4n-mini a"></span>${esc(S.name(0))}</div><div class="val text-amber">${S.mine(0) && S.online ? 'YOU' : ''}</div></div>
                <div class="stat"><div class="lab"><span class="c4n-mini c"></span>${esc(S.name(1))}</div><div class="val text-coral">${S.mine(1) && S.online ? 'YOU' : ''}</div></div></div></div></div>
            <div id="c4n-msg" class="text-sm text-muted min-h-[20px]">${S.online ? `You drop the <b class="${me ? 'text-coral' : 'text-amber'}">${me ? 'coral' : 'amber'}</b> discs against ${esc(S.name(opp))}.` : ''}</div>
            <div class="grid grid-cols-2 gap-3"><button id="c4n-quit" class="btn-game btn-coral py-2.5 text-sm">Resign</button><button id="c4n-new" class="btn-game btn-graphite py-2.5 text-sm">${S.online ? 'Leave' : 'New game'}</button></div>
          </div></div>`;
        G.clock = makeClock($('c4n-clock'));
        $('c4n-new').onclick = () => npConfirmLeave(() => open($('game-root')));
        let sure = false;
        $('c4n-quit').onclick = (e) => { if (G.over) return; if (!sure) { sure = true; e.target.textContent = 'Really resign?'; gTimeout(() => { sure = false; if (G) e.target.textContent = 'Resign'; }, 3000); return; } S.act({ t: 'resign', s: me }); };
        S.on(apply, drive);
        S.act({ t: 'begin', s: -1 });
        npBar('');
      }
      const seatOf = (p) => p - 1;
      function apply(a) {
        if (!G || G.over) return 0;
        if (a.t === 'begin') {
          if (G.moves) return 0;
          G.turn = G.first === 'opp' ? 2 : G.first === 'random' ? (Math.random() < 0.5 ? 1 : 2) : G.first === 'net' ? 1 + G.S.rng.rnd(2) : 1;
          paint(); turnUI(); return 0;
        }
        if (a.t === 'drop') {
          if (G.done || seatOf(G.turn) !== a.s) return 0;
          const c = a.c | 0, r = c >= 0 && c < COLS ? lowest(G.b, c) : -1;
          if (r < 0) return 0;
          G.b[r][c] = G.turn; G.last = [r, c]; G.moves++; G.clock.stop();
          SFX.play('move');
          const w = winLine(G.b, G.turn);
          paint(true);
          if (w) { G.win = w; G.done = true; const who = G.turn, tok = G.tok; gTimeout(() => { if (G && G.tok === tok) { paint(); finish(seatOf(who) === mySeat() ? 'win' : 'loss', seatOf(who)); } }, 520); return 560; }
          if (G.b[0].every(Boolean)) { G.done = true; const tok = G.tok; gTimeout(() => { if (G && G.tok === tok) finish('draw'); }, 520); return 560; }
          G.turn = G.turn === 1 ? 2 : 1;
          turnUI();
          return 380;
        }
        if (a.t === 'resign' || a.t === '_left' || a.t === '_gone') { G.done = true; finish(a.s === mySeat() ? 'loss' : 'win', a.s === mySeat() ? mySeat() : 1 - a.s, a); }
        return 0;
      }
      const mySeat = () => (G.S.online ? G.S.me : 0);
      function drive() {
        if (!G || G.over || G.done) return;
        const seat = seatOf(G.turn);
        if (G.S.bot(seat)) G.S.later(() => G.S.act({ t: 'drop', s: seat, c: aiCol(G.b.map((r) => r.slice()), G.turn, G.lvl) }), 850);
      }
      function turnUI() {
        const S = G.S, seat = seatOf(G.turn), mine = S.mine(seat);
        $('c4n-status').textContent = mine ? (S.online || S.bot(1) ? 'YOUR TURN' : `${S.name(seat).toUpperCase()}'S TURN`) : S.bot(seat) ? 'COMPUTER THINKING...' : `${S.name(seat).toUpperCase()}'S TURN`;
        if (mine) G.clock.start(G.secs, S.online || S.bot(1) ? 'Your time' : S.name(seat), () => { if (G && !G.done && seatOf(G.turn) === seat) { const cols = [...Array(COLS).keys()].filter((c) => !G.b[0][c]); showToast("Time's up! A disc was dropped for you.", 'error'); S.act({ t: 'drop', s: seat, c: pick(cols) }); } }, 5);
        else if (S.bot(seat)) G.clock.idle('Computer', '...');
        else G.clock.start(G.secs + 4, 'Their time', () => {}, 5);
        paint();
      }
      function paint(drop) {
        const bd = $('c4n-board'); if (!bd) return;
        const seat = seatOf(G.turn), can = !G.done && G.S.mine(seat);
        let h = '';
        for (let c = 0; c < COLS; c++) {
          h += `<div class="c4n-col ${can && !G.b[0][c] ? 'can' : ''}" data-c="${c}" role="button" aria-label="Column ${c + 1}">`;
          for (let r = 0; r < ROWS; r++) {
            const v = G.b[r][c], isWin = G.win && G.win.some(([wr, wc]) => wr === r && wc === c), isNew = G.last && G.last[0] === r && G.last[1] === c;
            h += `<div class="c4n-cell">${v ? `<div class="c4n-disc ${v === 1 ? 'a' : 'c'} ${isWin ? 'win' : ''} ${isNew && drop ? 'drop' : ''}" style="--fall:${(r + 1) * 100}%"></div>` : ''}</div>`;
          }
          h += '</div>';
        }
        bd.innerHTML = h;
        bd.querySelectorAll('.c4n-col').forEach((el) => { el.onclick = () => { const c = +el.dataset.c, sNow = seatOf(G.turn); if (!G || G.done || G.over || !G.S.mine(sNow) || G.b[0][c] || G.sentAt === G.moves) return; G.sentAt = G.moves; G.S.act({ t: 'drop', s: sNow, c }); }; });
        bd.classList.toggle('wait', !can);
        bd.dataset.turn = G.turn;
      }
      async function finish(res, winSeat, how) {
        if (G.over) return; G.over = true; G.S.over = true; G.clock.stop();
        const S = G.S, tok = G.tok, opp = 1 - mySeat();
        const left = how && (how.t === '_left' || how.t === '_gone') && how.s !== mySeat();
        const vsAI = !S.online && S.bot(1), pp = !S.online && !S.bot(1);
        const elo = vsAI ? { win: 14, loss: -8, draw: 0 }[res] : 0;
        const eloRow = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        if (!pp) {
          recordMatch('c4', res, elo, { label: S.online ? `Online vs ${S.name(opp)}` : `vs ${S.name(1)}` });
          if (res === 'win') profile.wins++; else if (res === 'loss') profile.losses++;
          profile.elo = Math.max(800, profile.elo + elo);
          awardXP(res === 'win' ? 30 : 10);
        }
        $('c4n-status').textContent = res === 'win' ? 'YOU WIN!' : res === 'loss' ? 'YOU LOSE' : 'DRAW';
        SFX.play(res === 'win' ? 'win' : res === 'loss' ? 'lose' : 'pop');
        const title = pp ? (res === 'draw' ? "It's a draw!" : `${S.name(winSeat)} wins!`) : left ? 'You win!' : how && how.t === 'resign' ? (how.s === mySeat() ? 'You resigned' : `${S.name(opp)} resigned`) : res === 'win' ? 'Four in a row!' : res === 'loss' ? `${S.online ? S.name(opp) : 'The computer'} wins` : "It's a draw!";
        const sub = left ? `${S.name(opp)} ${how.t === '_gone' ? 'disconnected' : 'left the game'}.` : `${G.moves} discs dropped.`;
        gTimeout(() => gameResult({ title, sub, tone: res === 'loss' ? 'coral' : 'amber', sprite: res === 'loss' ? 'anchor' : 'trophy',
          rows: [['Discs', G.moves, 'text-bone']].concat(vsAI ? [['Elo', (elo > 0 ? '+' : '') + elo, elo >= 0 ? 'text-emerald' : 'text-coral']] : []).concat(eloRow ? [eloRow] : []), againLabel: S.online ? 'Back to setup' : 'New game', again: () => open($('game-root')) }), 600);
      }

      const mod = {
        id: 'c4', name: 'Four-in-a-Row', icon: 'c4', cats: ['board'], sub: '1v1 · ~3 MIN', color: '#FB7185', tone: 'coral', btn: 'coral',
        blurb: 'Drop discs and line up four in a row: across, down or diagonal. Play the computer, a friend on this screen, or someone online.',
        profileTiles: (s) => [['MATCHES', s.played, 'text-bone'], ['WIN RATE', `${pct(s.wins, s.played)}%`, 'text-emerald'], ['WON', s.wins, 'text-teal'], ['LOST', s.losses, 'text-coral']],
        engine: { winLine, aiCol, lowest }, open, close() { G = null; },
        online: { seats: () => 2, ranked: true, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
