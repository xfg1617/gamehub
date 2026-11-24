    /* =========================================================================
       CHECKERS (American / English rules): forced captures, multi-jumps, kings, 3 AI levels
       ========================================================================= */
    (function checkersGame() {
      const own = (p) => (p ? p.toLowerCase() : null); // 'a' (amber, you) or 'c' (coral, AI)
      const isKing = (p) => p === 'A' || p === 'C';
      function newBoard() {
        const b = Array(64).fill(null);
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) { if (r < 3) b[r * 8 + c] = 'c'; else if (r > 4) b[r * 8 + c] = 'a'; }
        return b;
      }
      function dirsOf(p) {
        if (isKing(p)) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        return own(p) === 'a' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
      }
      const crownRow = (side) => (side === 'a' ? 0 : 7);

      function jumpsFrom(b, sq, side) {
        const out = [];
        const orig = sq;
        const dfs = (cur, king, path, caps) => {
          let found = false;
          const r = cur >> 3, c = cur & 7;
          const piece = b[orig];
          const dirs = king ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : dirsOf(piece);
          for (const [dr, dc] of dirs) {
            const mr = r + dr, mc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;
            if (lr < 0 || lr > 7 || lc < 0 || lc > 7) continue;
            const msq = mr * 8 + mc, lsq = lr * 8 + lc, mid = b[msq];
            if (mid && own(mid) !== side && !caps.includes(msq) && (b[lsq] === null || lsq === orig)) {
              found = true;
              const nk = king || lr === crownRow(side);
              const np = [...path, lsq], nc = [...caps, msq];
              if (nk && !king) out.push({ path: np, caps: nc, crown: true });
              else dfs(lsq, nk, np, nc);
            }
          }
          if (!found && path.length > 1) out.push({ path, caps, crown: false });
        };
        dfs(sq, isKing(b[sq]), [sq], []);
        return out;
      }
      function legalMoves(b, side) {
        const jumps = [], steps = [];
        for (let sq = 0; sq < 64; sq++) {
          const p = b[sq];
          if (!p || own(p) !== side) continue;
          jumps.push(...jumpsFrom(b, sq, side));
          for (const [dr, dc] of dirsOf(p)) {
            const nr = (sq >> 3) + dr, nc = (sq & 7) + dc;
            if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
            const to = nr * 8 + nc;
            if (b[to] === null) steps.push({ path: [sq, to], caps: [], crown: !isKing(p) && nr === crownRow(side) });
          }
        }
        return jumps.length ? jumps : steps;
      }
      function applyMove(b, m) {
        const nb = b.slice();
        const from = m.path[0], to = m.path[m.path.length - 1];
        let p = nb[from];
        nb[from] = null;
        for (const c of m.caps) nb[c] = null;
        if (m.crown) p = p.toUpperCase();
        nb[to] = p;
        return nb;
      }

      /* ---------- AI ---------- */
      function evaluate(b, side) {
        let s = 0;
        for (let i = 0; i < 64; i++) {
          const p = b[i];
          if (!p) continue;
          const o = own(p), r = i >> 3, c = i & 7;
          let v = isKing(p) ? 175 : 100;
          if (!isKing(p)) {
            const adv = o === 'a' ? 7 - r : r;
            v += adv * 4;
            if ((o === 'a' && r === 7) || (o === 'c' && r === 0)) v += 8; // keep the back row guarded
          } else v += 6 - Math.abs(3.5 - r) - Math.abs(3.5 - c);
          if (c === 0 || c === 7) v -= 2;
          s += o === 'c' ? v : -v;
        }
        return side === 'c' ? s : -s;
      }
      const TO = { t: 1 };
      function negamax(b, side, depth, alpha, beta, ctx) {
        if ((++ctx.nodes & 255) === 0 && Date.now() > ctx.deadline) throw TO;
        const moves = legalMoves(b, side);
        if (moves.length === 0) return -9000 - depth;
        if (depth === 0) return evaluate(b, side);
        const opp = side === 'a' ? 'c' : 'a';
        moves.sort((x, y) => y.caps.length - x.caps.length);
        for (const m of moves) {
          const sc = -negamax(applyMove(b, m), opp, depth - 1, -beta, -alpha, ctx);
          if (sc >= beta) return beta;
          if (sc > alpha) alpha = sc;
        }
        return alpha;
      }
      function bestMove(b, side, level) {
        const moves = legalMoves(b, side);
        if (moves.length <= 1) return moves[0] || null;
        const maxD = [2, 5, 10][level - 1];
        const ctx = { nodes: 0, deadline: Date.now() + [200, 700, 1500][level - 1] };
        const opp = side === 'a' ? 'c' : 'a';
        let best = pick(moves), order = moves.slice();
        for (let d = 1; d <= maxD; d++) {
          let bm = null, bs = -Infinity;
          try {
            for (const m of order) {
              let sc = -negamax(applyMove(b, m), opp, d - 1, -Infinity, -bs, ctx);
              if (level === 1) sc += rnd(70) - 35;
              if (sc > bs) { bs = sc; bm = m; }
            }
          } catch (e) { if (e !== TO) throw e; return best; }
          if (bm) { best = bm; order = [bm, ...order.filter((x) => x !== bm)]; }
          if (Math.abs(bs) > 8000) break;
        }
        return best;
      }

      /* ---------- game screen ---------- */
      let G = null;
      const LV = ['Easy', 'Medium', 'Hard'];
      const crownSVG = '<svg viewBox="0 0 24 24" shape-rendering="crispEdges" style="width:56%;height:56%"><path d="M3 18 L2 7 L8 12 L12 4 L16 12 L22 7 L21 18 Z" fill="#050E18"/><path d="M5 16 L4.5 10 L8.5 13.5 L12 7 L15.5 13.5 L19.5 10 L19 16 Z" fill="#FFE2A8"/></svg>';

      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1000px] mx-auto');
        setupScreen(body, mod, [
          { key: 'lvl', label: 'DIFFICULTY', def: 2, local: true, choices: [[1, 'Easy'], [2, 'Medium'], [3, 'Hard']] },
          { key: 'clock', label: 'MOVE TIMER', def: 30, choices: [[0, 'Off'], [20, '20 s'], [30, '30 s'], [60, '60 s']] },
          { key: 'theme', label: 'BOARD COLOURS', def: 'ocean', choices: [['ocean', 'Ocean'], ['forest', 'Forest'], ['wood', 'Wood']] },
          { key: 'hints', label: 'Move hints', toggle: true, def: 1, hint: 'Glow on pieces that can move, dots where they can land.', choices: [[1, 'On'], [0, 'Off']] },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }, { bot: true, name: `AI (${LV[+sel.lvl - 1]})`, avatar: '🤖' }], sel)));
      }
      // seat 0 plays amber ('a', moves up), seat 1 plays coral ('c'). Online, seat 1 sees the board turned around.
      const sideOf = (seat) => (seat === 0 ? 'a' : 'c'), seatOf = (side) => (side === 'a' ? 0 : 1);
      const meSide = () => (G.S.online ? sideOf(G.S.me) : 'a');
      const oppName = () => (G.S.online ? G.S.name(1 - G.S.me) : `AI (${LV[G.lvl - 1]})`);

      function start(body, sel, S) {
        G = { S, b: newBoard(), turn: 'a', lvl: +sel.lvl || 2, secs: +sel.clock, hints: !!+sel.hints, theme: sel.theme, sel: null, cands: [], step: 0, partial: null, last: null, over: false, quiet: 0, plies: 0, capMe: 0, capAi: 0, kings: 0, tok: ++GT.cur, resign: false };
        body.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,560px)_1fr] gap-6 items-start">
          <div class="space-y-2"><div id="ck-top" class="flex items-center justify-between"></div><div id="ck-board" class="chess-board th-${G.theme}"></div><div id="ck-bot" class="flex items-center justify-between"></div></div>
          <div class="space-y-4 min-w-0">
            <div class="win overflow-hidden"><div class="winbar amber"><span id="ck-status">YOUR MOVE</span><span class="pix text-xs">vs ${S.online ? esc(S.name(1 - S.me)) : LV[G.lvl - 1] + ' AI'}</span></div>
              <div class="p-4 space-y-3"><div id="ck-clock"></div><div id="ck-msg" class="text-sm text-muted min-h-[20px]"></div>
              <div class="grid grid-cols-2 gap-3"><div class="stat"><div class="lab">You captured</div><div id="ck-cm" class="val text-amber">0</div></div><div class="stat"><div class="lab">${S.online ? 'They captured' : 'AI captured'}</div><div id="ck-ca" class="val text-coral">0</div></div></div></div></div>
            <div class="tip text-xs text-muted"><span class="tip-tag bg-amber">RULES</span>Captures are <b class="text-bone">forced</b>. Keep jumping if you can. Reach the far row to become a king.</div>
            <div class="grid grid-cols-2 gap-3"><button id="ck-resign" class="btn-game btn-coral py-2.5 text-sm">Resign</button><button id="ck-new" class="btn-game btn-graphite py-2.5 text-sm">${S.online ? 'Leave' : 'New game'}</button></div>
          </div></div>`;
        G.clock = makeClock(document.getElementById('ck-clock'));
        document.getElementById('ck-new').onclick = () => npConfirmLeave(() => open(document.getElementById('game-root')));
        document.getElementById('ck-resign').onclick = (e) => {
          if (G.over) return;
          if (!G.resign) { G.resign = true; e.target.textContent = 'Really resign?'; gTimeout(() => { if (G) { G.resign = false; e.target.textContent = 'Resign'; } }, 3000); return; }
          S.act({ t: 'resign', s: S.online ? S.me : 0 });
        };
        S.on(apply, drive);
        render();
        npBar('');
        turn();
      }
      // every change to the game, in the same order on every screen
      function apply(a) {
        if (!G || G.over) return 0;
        if (a.t === 'mv') {
          if (seatOf(G.turn) !== a.s) return 0;
          const m = legalMoves(G.b, G.turn).find((x) => x.path.join() === (a.path || []).join());
          if (!m) return 0;
          commit(m);
          return (G.slideMs || MOTION.slide) + 120;
        }
        if (a.t === 'resign' || a.t === '_left' || a.t === '_gone') {
          const mine = G.S.online ? a.s === G.S.me : a.s === 0;
          const who = G.S.online ? G.S.name(a.s) : '';
          finish(mine ? 'loss' : 'win', mine ? 'You resigned.' : a.t === 'resign' ? `${who} resigned.` : a.t === '_gone' ? `${who} disconnected. You win!` : `${who} left the game. You win!`);
        }
        return 0;
      }
      // only on the table's host: the computer moves
      function drive() {
        if (!G || G.over) return;
        const seat = seatOf(G.turn);
        if (G.S.bot(seat)) G.S.later(() => { const m = bestMove(G.b, G.turn, G.lvl); if (m) G.S.act({ t: 'mv', s: seat, path: m.path }); }, window.__fast ? 50 : 1400 + rnd(500));
      }
      function turn() {
        if (G.over) return;
        const seat = seatOf(G.turn);
        if (G.S.mine(seat)) humanTurn(); else aiTurn();
      }

      function humanTurn() {
        if (G.over) return;
        G.sel = null; G.cands = []; G.step = 0; G.partial = null;
        document.getElementById('ck-status').textContent = 'YOUR MOVE';
        const mv = legalMoves(G.b, G.turn);
        document.getElementById('ck-msg').textContent = mv.length && mv[0].caps.length ? 'You must capture!' : '';
        if (G.secs) G.clock.start(G.secs, 'Your time', () => {
          if (G.over || G.turn !== meSide()) return;
          showToast("Time's up! A move was played for you.", 'error');
          G.S.act({ t: 'mv', s: seatOf(G.turn), path: pick(legalMoves(G.b, G.turn)).path });
        }, 6); else G.clock.idle('No timer', '∞');
        render();
      }

      // the other side's turn: the computer (moved by drive) or the other player online
      function aiTurn() {
        if (G.over) return;
        const bot = G.S.bot(seatOf(G.turn));
        document.getElementById('ck-status').textContent = bot ? 'AI THINKING...' : `${oppName().toUpperCase()}'S MOVE`;
        document.getElementById('ck-msg').textContent = '';
        if (!bot && G.secs) G.clock.start(G.secs + 5, 'Their time', () => {}, 6); else G.clock.idle(bot ? 'AI turn' : 'Their move', '...');
      }

      // play a complete move for whoever's turn it is
      function commit(m) {
        if (G.over) return;
        G.clock.stop(); G.pending = false;
        const side = G.turn;
        const wasMan = !isKing(G.b[m.path[0]]);
        // the piece hops square by square; each jumped piece fades as it is passed
        const start = G.partial ? G.partial.idx : 0;
        const sqEl = (i) => document.querySelector(`#ck-board [data-i="${i}"]`);
        const hops = m.path.slice(start, -1).map((i) => sqEl(i) && sqEl(i).getBoundingClientRect());
        const per = m.path.length - start > 2 ? MOTION.hop + 60 : MOTION.slide;
        for (let k = start; k < m.path.length - 1; k++) if (m.caps.length) { const mid = (m.path[k] + m.path[k + 1]) / 2; const el = sqEl(mid); if (el && el.querySelector('.disc')) gGhost(el.querySelector('.disc'), { delay: (k - start + 0.55) * per, ms: 240 }); }
        G.b = applyMove(G.b, m);
        G.last = { from: m.path[0], to: m.path[m.path.length - 1] };
        if (side === meSide()) G.capMe += m.caps.length; else G.capAi += m.caps.length;
        if (m.crown && side === meSide()) G.kings++;
        G.quiet = m.caps.length || (wasMan) ? 0 : G.quiet + 1;
        G.plies++;
        G.sel = null; G.cands = []; G.partial = null; G.step = 0;
        const snd = m.caps.length ? 'capture' : 'move';
        document.getElementById('ck-cm').textContent = G.capMe;
        document.getElementById('ck-ca').textContent = G.capAi;
        const opp = side === 'a' ? 'c' : 'a';
        G.turn = opp;
        render();
        // the slide must start on the board as it will stay: starting your turn redraws the board,
        // which would cut the computer's slide short (that made its pieces jump)
        const slide = () => {
          const land = sqEl(m.path[m.path.length - 1]);
          G.slideMs = gSlide(land && land.querySelector('.disc'), hops, { ms: per, lift: hops.length === 1 });
          G.lockUntil = performance.now() + G.slideMs;
          for (let k = 1; k <= hops.length; k++) gTimeout(() => SFX.play(snd), k * per - 60);
          if (m.crown) gTimeout(() => SFX.play('coin'), G.slideMs + 80);
        };
        const next = legalMoves(G.b, opp);
        if (next.length === 0 || G.quiet >= 80) slide();
        const tok = G.tok, later = (fn) => { G.over = true; G.clock.stop(); gTimeout(() => { if (G && G.tok === tok) { G.over = false; fn(); } }, G.slideMs + 150); };
        if (next.length === 0) { G.ended = true; return later(() => finish(side === meSide() ? 'win' : 'loss', side === meSide() ? `${G.S.online ? oppName() : 'The AI'} has no moves left. You win!` : 'You have no moves left.')); }
        if (G.quiet >= 80) { G.ended = true; return later(() => finish('draw', 'Draw: 40 moves each without a capture or a man moving.')); }
        if (G.S.mine(seatOf(opp))) { humanTurn(); slide(); } else { slide(); aiTurn(); }
      }

      async function finish(res, sub) {
        if (G.done) return; G.done = true;
        G.over = true; G.S.over = true; G.clock.stop(); render();
        const S = G.S, tok = G.tok;
        const eloTab = { win: [8, 14, 20], loss: [-5, -8, -11], draw: [1, 2, 3] };
        const elo = S.online ? 0 : eloTab[res][G.lvl - 1];
        const gs = gstat('checkers');
        gs.kings = (gs.kings || 0) + G.kings;
        if (S.online) gs.online = (gs.online || 0) + 1;
        const eloRow = S.online ? await S.finish(res) : ['Elo', elo > 0 ? '+' + elo : String(elo), elo >= 0 ? 'text-emerald' : 'text-coral'];
        if (!G || G.tok !== tok) return;
        reportGame('checkers', res, { elo, xp: res === 'win' ? 20 + G.lvl * 12 : res === 'draw' ? 15 : 10, label: `${S.online ? 'Online vs ' + oppName() : 'vs ' + LV[G.lvl - 1] + ' AI'} · ${G.capMe}-${G.capAi} captures` });
        document.getElementById('ck-status').textContent = res === 'win' ? 'YOU WIN!' : res === 'loss' ? 'YOU LOSE' : 'DRAW';
        document.getElementById('ck-msg').textContent = sub;
        SFX.play(res === 'win' ? 'win' : res === 'loss' ? 'lose' : 'pop');
        gTimeout(() => gameResult({ title: res === 'win' ? 'Victory!' : res === 'loss' ? 'Defeat' : 'Draw', sub, tone: res === 'loss' ? 'coral' : 'amber', sprite: res === 'win' ? 'trophy' : 'anchor', rows: [['You took', G.capMe, 'text-amber'], [S.online ? `${oppName()} took` : 'AI took', G.capAi, 'text-coral']].concat(eloRow ? [eloRow] : []), againLabel: S.online ? 'Back to setup' : 'New Game', again: () => open(document.getElementById('game-root')) }), 900);
      }

      // what the board looks like right now, including a half-finished multi-jump
      function viewBoard() {
        if (!G.partial) return G.b;
        const nb = G.b.slice();
        const m = G.partial.cands[0];
        const p = nb[m.path[0]];
        nb[m.path[0]] = null;
        for (let i = 0; i < G.partial.idx; i++) { const mid = (m.path[i] + m.path[i + 1]) / 2; nb[mid] = null; }
        nb[G.partial.pos] = p;
        return nb;
      }

      function onSquare(i) {
        if (!G || G.over || G.turn !== meSide() || !G.S.mine(seatOf(G.turn))) return;
        if (G.lockUntil && performance.now() < G.lockUntil) return; // let the computer's piece land first
        if (G.pending) return; // your move is on its way to the table
        const all = legalMoves(G.b, G.turn);
        if (G.partial) { // in the middle of a multi-jump: only the next landing squares count
          const next = G.partial.cands.filter((m) => m.path[G.partial.idx + 1] === i);
          if (!next.length) return;
          return advance(next, i, G.partial.idx + 1);
        }
        if (G.sel !== null && G.cands.length) {
          const next = G.cands.filter((m) => m.path[1] === i);
          if (next.length) return advance(next, i, 1);
        }
        const mine = all.filter((m) => m.path[0] === i);
        if (mine.length) { G.sel = i; G.cands = mine; SFX.play('click'); }
        else { G.sel = null; G.cands = []; if (G.b[i] && own(G.b[i]) === G.turn) showToast(all[0] && all[0].caps.length ? 'You must make a capture.' : 'That piece cannot move.', 'error'); }
        render();
      }
      function advance(next, sq, idx) {
        const done = next.find((m) => m.path.length === idx + 1);
        if (done) { G.sel = null; G.cands = []; G.pending = true; return G.S.act({ t: 'mv', s: seatOf(G.turn), path: done.path }); }
        const from = G.partial ? G.partial.pos : G.sel;
        const sqEl = (i) => document.querySelector(`#ck-board [data-i="${i}"]`);
        const fromR = sqEl(from) && sqEl(from).getBoundingClientRect();
        const midEl = sqEl((from + sq) / 2); if (midEl && midEl.querySelector('.disc')) gGhost(midEl.querySelector('.disc'), { delay: MOTION.slide * 0.55, ms: 240 });
        G.partial = { cands: next, pos: sq, idx };
        render();
        const land = sqEl(sq); gSlide(land && land.querySelector('.disc'), fromR, { lift: true });
        gTimeout(() => SFX.play('capture'), MOTION.slide - 60);
      }

      function render() {
        const vb = viewBoard();
        const board = document.getElementById('ck-board');
        const myTurn = G.turn === meSide() && G.S.mine(seatOf(G.turn));
        const movable = new Set(G.hints && myTurn && !G.over ? legalMoves(G.b, G.turn).map((m) => m.path[0]) : []);
        let targets = [];
        if (!G.hints) targets = [];
        else if (G.partial) targets = G.partial.cands.map((m) => m.path[G.partial.idx + 1]);
        else if (G.sel !== null) targets = G.cands.map((m) => m.path[1]);
        let h = '';
        const flip = meSide() === 'c';
        for (let rr = 0; rr < 8; rr++) for (let cc = 0; cc < 8; cc++) {
          const r = flip ? 7 - rr : rr, c = flip ? 7 - cc : cc;
          const i = r * 8 + c, p = vb[i], dark = (r + c) % 2 === 1;
          const cls = ['chsq', dark ? 'dk' : 'lt', G.last && (G.last.from === i || G.last.to === i) ? 'last' : '', G.sel === i && !G.partial ? 'sel' : '', G.partial && G.partial.pos === i ? 'sel' : '', targets.includes(i) ? 'tmov' : ''].join(' ');
          let piece = '';
          if (p) piece = `<div class="disc ${own(p) === 'a' ? 'disc-amber' : 'disc-coral'} ${movable.has(i) && !G.partial && G.sel === null ? 'ck-can' : ''}" style="width:78%;height:78%;display:flex;align-items:center;justify-content:center">${isKing(p) ? crownSVG : ''}</div>`;
          h += `<div class="${cls}" data-i="${i}">${piece}</div>`;
        }
        board.innerHTML = h;
        board.querySelectorAll('.chsq').forEach((el) => { el.onclick = () => onSquare(+el.dataset.i); });
        const cnt = (side) => vb.filter((p) => p && own(p) === side).length;
        const ms = meSide(), os = ms === 'a' ? 'c' : 'a', oppAv = G.S.online ? G.S.avatar(seatOf(os)) : '🤖';
        document.getElementById('ck-bot').innerHTML = `<span class="flex items-center gap-2 font-display font-extrabold text-sm"><span class="avatar-tile w-8 h-8 text-lg">${esc(profile.avatar)}</span>${esc(profile.username)} <span class="pix text-xs ${ms === 'a' ? 'text-amber' : 'text-coral'}">${cnt(ms)} left</span></span>`;
        document.getElementById('ck-top').innerHTML = `<span class="flex items-center gap-2 font-display font-extrabold text-sm"><span class="avatar-tile w-8 h-8 text-lg">${esc(oppAv)}</span>${esc(oppName())} <span class="pix text-xs ${os === 'a' ? 'text-amber' : 'text-coral'}">${cnt(os)} left</span></span>`;
      }

      const mod = {
        id: 'checkers', name: 'Checkers', icon: 'checkers', cats: ['board'], sub: '1v1 · ~8 MIN', color: '#FB7185', tone: 'amber', btn: 'amber',
        blurb: 'Classic American checkers. Captures are forced, you can chain jumps, and kings move both ways. Three AI levels.',
        rules: {
          tag: '8×8 · VS AI',
          steps: [
            '<strong class="text-bone">Move:</strong> Pieces slide one square diagonally forward onto a dark square. Click a piece, then a highlighted square.',
            '<strong class="text-bone">Jump:</strong> Hop over an enemy piece to capture it. If a capture is possible you <span class="text-amber font-bold">must</span> take it, and you keep jumping while you can.',
            '<strong class="text-bone">King me:</strong> Reach the far row to crown a king that moves and captures in both directions. Capture or block every enemy piece to win.',
          ],
          tip: 'Keep your back row at home as long as you can. It stops the AI from getting kings.',
        },
        extraRows: (s) => srow('Kings crowned', s.kings || 0),
        engine: { newBoard, legalMoves, applyMove, bestMove },
        open, close() { G = null; },
        online: { seats: () => 2, ranked: true, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();

