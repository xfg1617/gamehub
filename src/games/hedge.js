    /* =========================================================================
       WALL MAZE (original game, Nov 2026): race your pawn across a 9×9 garden to the far side. On your turn either
       step one square, or plant a hedge (2 squares long) to slow a rival down. A hedge may never cut anyone off
       completely. 2 players (10 hedges each) or 4 players (5 each). Computer: Easy / Medium / Hard.
       Board: rows 0 (top) .. 8, columns 0 .. 8. Hedge "h r,c" lies between rows r and r+1 under columns c and c+1;
       "v r,c" lies between columns c and c+1 beside rows r and r+1. r, c = 0..7.
       ========================================================================= */
    (function hedgeRunGame() {
      const N = 9, DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      const COLS = ['#F5B041', '#2DD4BF', '#FB7185', '#7CC4F0'];
      const START = { S: [8, 4], N: [0, 4], W: [4, 0], E: [4, 8] };
      const GOAL = { S: (r) => r === 0, N: (r) => r === 8, W: (r, c) => c === 8, E: (r, c) => c === 0 };
      const SIDES = { 2: ['S', 'N'], 4: ['S', 'W', 'N', 'E'] };
      const ROT = { S: 0, N: 180, W: -90, E: 90 };

      /* ---------- the rules (pure functions, used by the tests too) ---------- */
      function newState(n) {
        const side = SIDES[n];
        return { n, side, p: side.map((s) => START[s].slice()), left: side.map(() => (n === 2 ? 10 : 5)), walls: new Set(), turn: 0, win: -1 };
      }
      function canStep(W, r, c, dr, dc) {
        const r2 = r + dr, c2 = c + dc;
        if (r2 < 0 || r2 >= N || c2 < 0 || c2 >= N) return false;
        if (dr === 1) return !(W.has(`h${r},${c}`) || W.has(`h${r},${c - 1}`));
        if (dr === -1) return !(W.has(`h${r2},${c}`) || W.has(`h${r2},${c - 1}`));
        if (dc === 1) return !(W.has(`v${r},${c}`) || W.has(`v${r - 1},${c}`));
        return !(W.has(`v${r},${c2}`) || W.has(`v${r - 1},${c2}`));
      }
      // shortest number of steps to the goal side (pawns ignored), Infinity if walled off
      function dist(W, from, side, wantPath) {
        const seen = new Map([[from[0] * N + from[1], -1]]), q = [from]; let head = 0;
        while (head < q.length) {
          const [r, c] = q[head++];
          if (GOAL[side](r, c)) {
            if (!wantPath) { let d = 0, k = r * N + c; while (seen.get(k) !== -1) { k = seen.get(k); d++; } return d; }
            const path = []; let k = r * N + c; while (k !== -1) { path.unshift([Math.floor(k / N), k % N]); k = seen.get(k); } return path;
          }
          for (const [dr, dc] of DIRS) {
            if (!canStep(W, r, c, dr, dc)) continue;
            const k = (r + dr) * N + c + dc; if (seen.has(k)) continue;
            seen.set(k, r * N + c); q.push([r + dr, c + dc]);
          }
        }
        return wantPath ? null : Infinity;
      }
      function pawnMoves(st, s) {
        const W = st.walls, [r, c] = st.p[s], out = [];
        const occ = (rr, cc) => st.p.some((q, i) => i !== s && q && q[0] === rr && q[1] === cc);
        for (const [dr, dc] of DIRS) {
          if (!canStep(W, r, c, dr, dc)) continue;
          const r2 = r + dr, c2 = c + dc;
          if (!occ(r2, c2)) { out.push([r2, c2]); continue; }
          // someone is in the way: jump over them, or step diagonally past them if the jump is blocked
          if (canStep(W, r2, c2, dr, dc) && !occ(r2 + dr, c2 + dc)) { out.push([r2 + dr, c2 + dc]); continue; }
          for (const [sr, sc] of dr ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]]) if (canStep(W, r2, c2, sr, sc) && !occ(r2 + sr, c2 + sc) && !(r2 + sr === r && c2 + sc === c)) out.push([r2 + sr, c2 + sc]);
        }
        return out;
      }
      function wallClash(W, o, r, c) {
        if (r < 0 || r > 7 || c < 0 || c > 7) return true;
        if (W.has(`h${r},${c}`) || W.has(`v${r},${c}`)) return true;
        return o === 'h' ? W.has(`h${r},${c - 1}`) || W.has(`h${r},${c + 1}`) : W.has(`v${r - 1},${c}`) || W.has(`v${r + 1},${c}`);
      }
      // why a hedge can't go there ('' = it can)
      function wallProblem(st, s, o, r, c) {
        if (st.left[s] <= 0) return 'You have no hedges left.';
        if (wallClash(st.walls, o, r, c)) return 'That spot is taken.';
        const W = new Set(st.walls); W.add(`${o}${r},${c}`);
        if (st.p.some((q, i) => q && dist(W, q, st.side[i]) === Infinity)) return 'A hedge can’t block anyone in completely.';
        return '';
      }
      function legalWalls(st, s) {
        const out = [];
        for (const o of ['h', 'v']) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (!wallProblem(st, s, o, r, c)) out.push([o, r, c]);
        return out;
      }
      function doMove(st, s, r, c) { st.p[s] = [r, c]; if (GOAL[st.side[s]](r, c)) st.win = s; else st.turn = nextTurn(st); }
      function doWall(st, s, o, r, c) { st.walls.add(`${o}${r},${c}`); st.left[s]--; st.turn = nextTurn(st); }
      function nextTurn(st) { let t = st.turn; for (let k = 0; k < st.n; k++) { t = (t + 1) % st.n; if (st.p[t]) return t; } return st.turn; }

      // the computer: walk the shortest route, and plant a hedge when a rival is ahead and a hedge really hurts them
      function aiAction(st, s, lvl) {
        const W = st.walls, my = dist(W, st.p[s], st.side[s]);
        const rivals = st.p.map((q, i) => i).filter((i) => i !== s && st.p[i]);
        const lead = rivals.reduce((b, i) => { const d = dist(W, st.p[i], st.side[i]); return !b || d < b.d ? { i, d } : b; }, null);
        if (st.left[s] > 0 && lead) {
          const worry = lvl === 3 ? lead.d <= my && (lead.d <= 5 || lead.d < my) : lvl === 2 ? lead.d < my || lead.d <= 2 : Math.random() < 0.18;
          if (worry) {
            let best = null;
            const path = dist(W, st.p[lead.i], st.side[lead.i], true) || [];
            const near = new Set(); path.forEach(([r, c]) => { for (let dr = -1; dr <= 0; dr++) for (let dc = -1; dc <= 0; dc++) near.add(`${r + dr},${c + dc}`); });
            for (const o of ['h', 'v']) for (const k of near) {
              const [r, c] = k.split(',').map(Number);
              if (wallProblem(st, s, o, r, c)) continue;
              const W2 = new Set(W); W2.add(`${o}${r},${c}`);
              const gain = (dist(W2, st.p[lead.i], st.side[lead.i]) - lead.d) - (dist(W2, st.p[s], st.side[s]) - my) * (lvl === 3 ? 1.1 : 0.8) + Math.random() * 0.3;
              if (!best || gain > best.gain) best = { gain, o, r, c };
            }
            if (best && best.gain >= (lvl === 1 ? 0.5 : lvl === 2 ? 1.5 : 1)) return { t: 'wall', o: best.o, r: best.r, c: best.c };
          }
        }
        const mv = pawnMoves(st, s); let best = [], bd = Infinity;
        for (const [r, c] of mv) {
          const d = GOAL[st.side[s]](r, c) ? -1 : dist(W, [r, c], st.side[s]);
          if (d < bd) { bd = d; best = [[r, c]]; } else if (d === bd) best.push([r, c]);
        }
        if (lvl === 1 && Math.random() < 0.2 && mv.length) best = mv;
        const [r, c] = best.length ? pick(best) : mv[0];
        return { t: 'move', r, c };
      }

      /* ---------- art ---------- */
      const pawnSVG = (col) => `<svg viewBox="0 0 12 14" shape-rendering="crispEdges" aria-hidden="true"><rect x="3" y="12" width="6" height="2" fill="#050E18"/><rect x="2" y="11" width="8" height="2" fill="#050E18"/><rect x="3" y="1" width="6" height="6" fill="#050E18"/><rect x="4" y="2" width="4" height="4" fill="${col}"/><rect x="4" y="2" width="1" height="1" fill="#F7F4EC"/><rect x="3" y="7" width="6" height="5" fill="#050E18"/><rect x="4" y="7" width="4" height="4" fill="${col}"/><rect x="3" y="11" width="6" height="1" fill="${col}"/></svg>`;
      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      GICONS.hedge = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(1, 1, 22, 22, K)}${rr(2, 2, 20, 20, '#C8B27A')}${[0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => rr(3 + i * 5, 3 + j * 5, 3, 3, '#E3D3A2')).join('')).join('')}${rr(2, 7, 9, 2, '#1E7A3E')}${rr(2, 7, 9, 1, '#34D399')}${rr(12, 12, 2, 9, '#1E7A3E')}${rr(12, 12, 1, 9, '#34D399')}${rr(16, 7, 2, 9, '#1E7A3E')}${rr(16, 7, 1, 9, '#34D399')}${rr(8, 15, 3, 5, K)}${rr(9, 16, 1, 3, '#F5B041')}${rr(18, 3, 3, 3, K)}${rr(19, 4, 1, 1, '#2DD4BF')}</svg>`;

      /* ---------- the screen ---------- */
      let G = null;
      const $ = (id) => document.getElementById(id);
      const U = 100 / 110, cellPos = (i) => i * 12.5 * U, CELL = 10 * U, GAP = 2.5 * U;
      const BOTS = [['Clover', '🦔'], ['Moss', '🐌'], ['Bramble', '🦊']];
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1100px] mx-auto');
        setupScreen(body, mod, [
          { key: 'n', label: 'PLAYERS', def: 2, choices: [[2, '2 players'], [4, '4 players']] },
          { key: 'lvl', label: 'COMPUTER LEVEL', def: 2, choices: [[1, 'Easy'], [2, 'Medium'], [3, 'Hard']] },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(BOTS.slice(0, +sel.n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel)));
      }
      function start(body, sel, S) {
        const n = S.n === 4 || +sel.n === 4 ? 4 : 2;
        G = { S, n, st: newState(n), lvl: +sel.lvl || 2, tok: ++GT.cur, over: false, ghostW: null, lastWall: null };
        GT.started = true; GT.over = false;
        const me = S.online ? S.me : 0;
        G.me = me; G.rot = ROT[G.st.side[me]];
        body.innerHTML = `<div class="hr-wrap grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
          <div class="hr-boardcol"><div class="hr-board" id="hr-board" style="transform: rotate(${G.rot}deg)"></div></div>
          <div class="space-y-3 min-w-0">
            <div class="win p-3 space-y-2">
              <div class="pix text-xs text-amber">YOUR TURN: DO ONE</div>
              <div class="text-sm text-bone leading-snug">🚶 Tap a <b class="text-teal">glowing square</b> to move.<br>🌿 Tap a <b class="text-emerald">gap between squares</b> to plant a hedge there.</div>
              <div id="hr-msg" class="text-sm text-muted min-h-[20px]"></div></div>
            <div class="win overflow-hidden"><div class="winbar amber"><span id="hr-status">YOUR TURN</span><span class="pix text-xs" id="hr-steps"></span></div>
              <div class="p-3 space-y-2" id="hr-players"></div></div>
            <div class="grid grid-cols-2 gap-3"><button id="hr-quit" class="btn-game btn-coral py-2.5 text-sm">Resign</button><button id="hr-new" class="btn-game btn-graphite py-2.5 text-sm">${S.online ? 'Leave' : 'New game'}</button></div>
          </div></div>`;
        $('hr-new').onclick = () => npConfirmLeave(() => open($('game-root')));
        let sure = false;
        $('hr-quit').onclick = (e) => { if (G.over) return; if (!sure) { sure = true; e.target.textContent = 'Really resign?'; gTimeout(() => { sure = false; if (G) e.target.textContent = 'Resign'; }, 3000); return; } S.act({ t: 'resign', s: G.me }); };
        S.on(apply, drive);
        npBar('');
        draw();
        say(n === 2 ? 'Reach the far side first! Your goal is the top edge.' : 'Reach the opposite side first! Your goal is the top edge.');
      }
      const myTurn = () => G && !G.over && G.st.win < 0 && G.S.mine(G.st.turn);
      function say(t, bad) { const m = $('hr-msg'); if (m) { m.textContent = t; m.className = `text-sm min-h-[20px] ${bad ? 'text-coral' : 'text-muted'}`; } }
      function apply(a) {
        if (!G || G.over) return 0;
        const st = G.st;
        if (a.t === 'resign' && st.n === 4 && a.s !== G.me) { st.p[a.s] = null; if (st.turn === a.s) st.turn = nextTurn(st); if (st.p.filter(Boolean).length === 1) { finish(st.p.findIndex(Boolean), a.s, 'resign'); return 0; } draw(); return 0; }
        if (a.t === 'resign' || ((a.t === '_left' || a.t === '_gone') && st.n === 2)) { finish(a.s === G.me ? st.p.findIndex((q, i) => q && i !== G.me) : G.me, a.s, a.t); return 0; }
        if (a.t === '_left' || a.t === '_gone') { G.S._kick(); return 0; }
        if (a.s !== st.turn || st.win >= 0) return 0;
        if (a.t === 'move') {
          if (!pawnMoves(st, a.s).some(([r, c]) => r === a.r && c === a.c)) return 0;
          const before = gSnap($('hr-board'));
          doMove(st, a.s, a.r, a.c); SFX.play('move'); G.ghostW = null; draw();
          const ms = gFlip($('hr-board'), before) || 0;
          if (st.win >= 0) { const tok = G.tok; gTimeout(() => { if (G && G.tok === tok) finish(st.win); }, ms + 350); return ms + 400; }
          return ms + 120;
        }
        if (a.t === 'wall') {
          if (wallProblem(st, a.s, a.o, a.r, a.c)) return 0;
          doWall(st, a.s, a.o, a.r, a.c); G.lastWall = `${a.o}${a.r},${a.c}`; SFX.play('card'); G.ghostW = null; draw(); G.lastWall = null;
          return 420;
        }
        return 0;
      }
      function drive() {
        if (!G || G.over || G.st.win >= 0) return;
        const s = G.st.turn;
        if (G.S.bot(s)) G.S.later(() => { if (G && G.st.turn === s && !G.over) G.S.act(Object.assign({ s }, aiAction(G.st, s, G.lvl))); }, 750 + rnd(600));
      }
      function draw() {
        const st = G.st, bd = $('hr-board'); if (!bd) return;
        const mine = myTurn(), moves = mine ? pawnMoves(st, G.me) : [];
        const mv = new Set(moves.map(([r, c]) => r * N + c));
        const route = st.p[G.me] ? dist(st.walls, st.p[G.me], st.side[G.me], true) || [] : [];
        const onRoute = new Set(route.slice(1).map(([r, c]) => r * N + c));
        let h = '';
        // goal edges, tinted in each player's colour
        st.side.forEach((sd, i) => {
          if (!st.p[i]) return; const col = COLS[i];
          const e = { S: `left:0;top:-1.6%;width:100%;height:1.2%`, N: `left:0;bottom:-1.6%;width:100%;height:1.2%`, W: `top:0;right:-1.6%;height:100%;width:1.2%`, E: `top:0;left:-1.6%;height:100%;width:1.2%` }[sd];
          h += `<div class="hr-goal" style="${e};background:${col}"></div>`;
        });
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const k = r * N + c;
          h += `<button class="hr-cell ${mv.has(k) ? 'can' : ''} ${onRoute.has(k) ? 'route' : ''}" data-r="${r}" data-c="${c}" style="left:${cellPos(c)}%;top:${cellPos(r)}%;width:${CELL}%;height:${CELL}%" aria-label="Square ${r + 1}-${c + 1}"></button>`;
        }
        st.walls.forEach((w) => { h += wallHTML(w[0], ...w.slice(1).split(',').map(Number), w === G.lastWall ? 'grow' : ''); });
        // the gaps between squares: tap one to plant a hedge there (it covers this gap and the next one along)
        if (mine && st.left[G.me] > 0) {
          for (let r = 0; r < 8; r++) for (let c = 0; c < N; c++) h += `<button class="hr-gap" data-w="h${r},${Math.min(c, 7)}" style="left:${cellPos(c)}%;top:${cellPos(r + 1) - GAP}%;width:${CELL}%;height:${GAP}%" aria-label="Plant a hedge here"></button>`;
          for (let r = 0; r < N; r++) for (let c = 0; c < 8; c++) h += `<button class="hr-gap" data-w="v${Math.min(r, 7)},${c}" style="left:${cellPos(c + 1) - GAP}%;top:${cellPos(r)}%;width:${GAP}%;height:${CELL}%" aria-label="Plant a hedge here"></button>`;
          h += '<div id="hr-ghost" class="hr-wall ghost" style="display:none"></div>';
        }
        st.p.forEach((q, i) => { if (q) h += `<div class="hr-pawn ${i === st.turn && st.win < 0 ? 'turn' : ''}" data-fk="pawn${i}" style="left:${cellPos(q[1])}%;top:${cellPos(q[0])}%;width:${CELL}%;height:${CELL}%;transform:rotate(${-G.rot}deg)">${pawnSVG(COLS[i])}</div>`; });
        bd.innerHTML = h;
        bd.classList.toggle('wait', !mine);
        bd.querySelectorAll('.hr-cell.can').forEach((el) => { el.onclick = () => { if (myTurn()) G.S.act({ t: 'move', s: G.me, r: +el.dataset.r, c: +el.dataset.c }); }; });
        // a mouse: the hedge shows while you point at a gap and one click plants it. A finger: the first tap shows it,
        // a second tap on the same spot plants it.
        const parse = (w) => [w[0], ...w.slice(1).split(',').map(Number)];
        const show = (w) => { const g = $('hr-ghost'); if (!g) return; if (!w) { g.style.display = 'none'; return; } const [o, r, c] = parse(w); const bad = !!wallProblem(G.st, G.me, o, r, c);
          g.className = `hr-wall ${o} ghost ${bad ? 'bad' : ''}`; g.style.cssText = (o === 'h' ? `left:${cellPos(c)}%;top:${cellPos(r + 1) - GAP}%;width:${CELL * 2 + GAP}%;height:${GAP}%` : `left:${cellPos(c + 1) - GAP}%;top:${cellPos(r)}%;width:${GAP}%;height:${CELL * 2 + GAP}%`); };
        if (G.ghostW) show(G.ghostW);
        let pt = 'mouse';
        bd.querySelectorAll('.hr-gap').forEach((el) => {
          el.onpointerdown = (e) => { pt = e.pointerType || 'mouse'; };
          el.onmouseenter = () => { if (pt === 'mouse') show(el.dataset.w); };
          el.onmouseleave = () => { if (pt === 'mouse' && !G.ghostW) show(null); };
          el.onclick = () => {
            if (!myTurn()) return;
            const w = el.dataset.w, [o, r, c] = parse(w), why = wallProblem(G.st, G.me, o, r, c);
            if (why) { G.ghostW = null; show(w); SFX.play('wrong'); return say(why, true); }
            if (pt !== 'mouse' && G.ghostW !== w) { G.ghostW = w; show(w); SFX.play('click'); return say('Tap the same gap again to plant the hedge there.'); }
            G.ghostW = null; G.S.act({ t: 'wall', s: G.me, o, r, c });
          };
        });
        // side panel
        const S = G.S;
        $('hr-status').textContent = st.win >= 0 ? 'GAME OVER' : mine ? 'YOUR TURN' : `${S.name(st.turn).toUpperCase()}'S TURN`;
        $('hr-steps').textContent = route.length ? `${route.length - 1} STEPS TO GO` : '';
        $('hr-players').innerHTML = st.side.map((sd, i) => `<div class="pl-tag flex items-center gap-2.5 ${i === st.turn && st.win < 0 ? 'turn' : ''} ${i === G.me ? 'me' : ''}" style="--pc:${COLS[i]}">
          <span class="tg-av">${esc(S.seats[i] ? S.seats[i].avatar : '🙂')}</span><span class="min-w-0 flex-1"><b class="block truncate text-bone text-sm">${esc(S.name(i))}${S.bot(i) ? ' <small class="text-muted">CPU</small>' : ''}</b>
          <small class="text-muted text-xs">${st.p[i] ? `${dist(st.walls, st.p[i], sd)} steps · ` : ''}🌿 ${st.left[i]} hedge${st.left[i] === 1 ? '' : 's'}</small></span></div>`).join('');
      }
      function wallHTML(o, r, c, cls) {
        const st = o === 'h' ? `left:${cellPos(c)}%;top:${cellPos(r + 1) - GAP}%;width:${CELL * 2 + GAP}%;height:${GAP}%` : `left:${cellPos(c + 1) - GAP}%;top:${cellPos(r)}%;width:${GAP}%;height:${CELL * 2 + GAP}%`;
        return `<div class="hr-wall ${o} ${cls || ''}" style="${st}"></div>`;
      }
      async function finish(winner, quitter, how) {
        if (G.over) return; G.over = true; G.S.over = true;
        const S = G.S, me = G.me, tok = G.tok, res = winner === me ? 'win' : 'loss';
        const eloRow = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        const s = gstat('hedge'); s.hedges = (s.hedges || 0) + ((G.st.n === 2 ? 10 : 5) - G.st.left[me]);
        reportGame('hedge', res, { elo: S.online ? 0 : res === 'win' ? 4 + G.lvl * 3 : -4, xp: res === 'win' ? 14 + G.lvl * 6 : 6, label: S.online ? 'Online' : `vs computer (${['', 'Easy', 'Medium', 'Hard'][G.lvl]})` });
        const left = quitter !== undefined && quitter !== me;
        const title = quitter === me ? 'You resigned' : res === 'win' ? 'You win!' : `${S.name(winner)} wins`;
        const sub = left ? `${S.name(quitter)} ${how === '_gone' ? 'disconnected' : how === 'resign' ? 'resigned' : 'left the game'}.` : res === 'win' ? 'You made it through the garden first.' : `${S.name(winner)} reached the far side first.`;
        gameResult({ title, sub, tone: res === 'win' ? 'amber' : 'coral', sprite: res === 'win' ? 'trophy' : 'anchor',
          rows: [['Hedges you planted', (G.st.n === 2 ? 10 : 5) - G.st.left[me], 'text-emerald']].concat(eloRow ? [eloRow] : []), againLabel: S.online ? 'Back to setup' : 'Play again', again: () => open($('game-root')) });
      }

      const mod = {
        id: 'hedge', name: 'Wall Maze', icon: 'hedge', cats: ['board'], sub: '2-4 PLAYERS · ~10 MIN', color: '#34D399', tone: 'emerald', btn: 'emerald',
        blurb: 'Race your pawn across the garden. Each turn, take a step or plant a hedge to slow your rivals down.',
        rules: { tag: 'MAZE RACE · 2-4 PLAYERS', steps: [
          '<strong class="text-bone">Goal:</strong> Be the first to reach the other side of the garden (the edge marked in your colour is where you need to go).',
          '<strong class="text-bone">Your turn:</strong> Either tap a glowing square to <b>move</b>, or tap a gap between squares to <b>plant a hedge</b>. Hedges are 2 squares long and nobody can walk through them.',
          '<strong class="text-bone">Rules for hedges:</strong> You have 10 (5 in a 4-player game). A hedge can slow someone down, but it can never shut anyone in completely: there must always be a way through.',
          '<strong class="text-bone">Meeting a pawn:</strong> If a pawn is right next to you, you can jump over it. If a hedge is behind it, step diagonally past it instead.',
        ], tip: 'Don’t spend all your hedges early. They work best when a rival is close to finishing.' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['WIN %', pct(s.wins, s.played), 'text-teal'], ['HEDGES', s.hedges || 0, 'text-emerald']],
        engine: { newState, pawnMoves, wallProblem, legalWalls, dist, doMove, doWall, aiAction, get G() { return G; } },
        open, close() { G = null; },
        online: { seats: (sel) => (+sel.n === 4 ? 4 : 2), ranked: true, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
