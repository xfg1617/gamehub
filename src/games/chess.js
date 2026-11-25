    /* =========================================================================
       CHESS: full rules (castling, en passant, promotion, check, mate, draws) + 3 AI levels
       ========================================================================= */
    (function chessGame() {
      const FILES = 'abcdefgh';
      const sqName = (i) => FILES[i & 7] + (8 - (i >> 3));
      const isW = (p) => p >= 'A' && p <= 'Z';
      const N8 = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      const K8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

      function newPos() {
        const b = Array(64).fill(null);
        const back = 'rnbqkbnr';
        for (let c = 0; c < 8; c++) { b[c] = back[c]; b[8 + c] = 'p'; b[48 + c] = 'P'; b[56 + c] = back[c].toUpperCase(); }
        return { b, turn: 'w', cas: { K: 1, Q: 1, k: 1, q: 1 }, ep: -1, half: 0, full: 1 };
      }
      function fromFEN(fen) {
        const [pl, tn, ca, ep, hm, fm] = fen.split(' ');
        const b = Array(64).fill(null);
        let i = 0;
        for (const ch of pl) { if (ch === '/') continue; if (/\d/.test(ch)) i += +ch; else b[i++] = ch; }
        return { b, turn: tn, cas: { K: ca.includes('K') ? 1 : 0, Q: ca.includes('Q') ? 1 : 0, k: ca.includes('k') ? 1 : 0, q: ca.includes('q') ? 1 : 0 }, ep: ep === '-' ? -1 : FILES.indexOf(ep[0]) + (8 - +ep[1]) * 8, half: +hm || 0, full: +fm || 1 };
      }

      function attacked(b, sq, byW) {
        const r = sq >> 3, c = sq & 7;
        const pr = byW ? r + 1 : r - 1, pp = byW ? 'P' : 'p';
        if (pr >= 0 && pr < 8) { if (c > 0 && b[pr * 8 + c - 1] === pp) return true; if (c < 7 && b[pr * 8 + c + 1] === pp) return true; }
        const kn = byW ? 'N' : 'n', kg = byW ? 'K' : 'k';
        for (const [dr, dc] of N8) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && b[nr * 8 + nc] === kn) return true; }
        for (const [dr, dc] of K8) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && b[nr * 8 + nc] === kg) return true; }
        const bi = byW ? 'B' : 'b', ro = byW ? 'R' : 'r', qu = byW ? 'Q' : 'q';
        for (const [dr, dc] of DIAG) { let nr = r + dr, nc = c + dc; while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) { const p = b[nr * 8 + nc]; if (p) { if (p === bi || p === qu) return true; break; } nr += dr; nc += dc; } }
        for (const [dr, dc] of ORTH) { let nr = r + dr, nc = c + dc; while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) { const p = b[nr * 8 + nc]; if (p) { if (p === ro || p === qu) return true; break; } nr += dr; nc += dc; } }
        return false;
      }
      function kingSq(b, w) { const k = w ? 'K' : 'k'; for (let i = 0; i < 64; i++) if (b[i] === k) return i; return -1; }
      const inCheck = (st, w) => attacked(st.b, kingSq(st.b, w), !w);

      function pseudo(st) {
        const b = st.b, W = st.turn === 'w', out = [];
        for (let sq = 0; sq < 64; sq++) {
          const p = b[sq];
          if (!p || isW(p) !== W) continue;
          const r = sq >> 3, c = sq & 7, t = p.toLowerCase();
          if (t === 'p') {
            const dir = W ? -1 : 1, start = W ? 6 : 1, promo = W ? 0 : 7;
            const add = (to, fl, cap) => { if ((to >> 3) === promo) for (const pc of 'qrbn') out.push({ f: sq, t: to, p: pc, cap }); else out.push({ f: sq, t: to, fl, cap }); };
            const one = sq + dir * 8;
            if (one >= 0 && one < 64 && !b[one]) {
              add(one);
              if (r === start && !b[sq + dir * 16]) out.push({ f: sq, t: sq + dir * 16, fl: 'dbl' });
            }
            for (const dc of [-1, 1]) {
              const nc = c + dc, nr = r + dir;
              if (nc < 0 || nc > 7 || nr < 0 || nr > 7) continue;
              const to = nr * 8 + nc, tg = b[to];
              if (tg && isW(tg) !== W) add(to, null, true);
              else if (!tg && to === st.ep) out.push({ f: sq, t: to, fl: 'ep', cap: true });
            }
          } else if (t === 'n' || t === 'k') {
            for (const [dr, dc] of (t === 'n' ? N8 : K8)) {
              const nr = r + dr, nc = c + dc;
              if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
              const to = nr * 8 + nc, tg = b[to];
              if (!tg) out.push({ f: sq, t: to }); else if (isW(tg) !== W) out.push({ f: sq, t: to, cap: true });
            }
            if (t === 'k') {
              if (W && sq === 60) {
                if (st.cas.K && !b[61] && !b[62] && b[63] === 'R' && !attacked(b, 60, false) && !attacked(b, 61, false) && !attacked(b, 62, false)) out.push({ f: 60, t: 62, fl: 'cK' });
                if (st.cas.Q && !b[59] && !b[58] && !b[57] && b[56] === 'R' && !attacked(b, 60, false) && !attacked(b, 59, false) && !attacked(b, 58, false)) out.push({ f: 60, t: 58, fl: 'cQ' });
              } else if (!W && sq === 4) {
                if (st.cas.k && !b[5] && !b[6] && b[7] === 'r' && !attacked(b, 4, true) && !attacked(b, 5, true) && !attacked(b, 6, true)) out.push({ f: 4, t: 6, fl: 'cK' });
                if (st.cas.q && !b[3] && !b[2] && !b[1] && b[0] === 'r' && !attacked(b, 4, true) && !attacked(b, 3, true) && !attacked(b, 2, true)) out.push({ f: 4, t: 2, fl: 'cQ' });
              }
            }
          } else {
            const dirs = t === 'b' ? DIAG : t === 'r' ? ORTH : K8;
            for (const [dr, dc] of dirs) {
              let nr = r + dr, nc = c + dc;
              while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const to = nr * 8 + nc, tg = b[to];
                if (!tg) out.push({ f: sq, t: to });
                else { if (isW(tg) !== W) out.push({ f: sq, t: to, cap: true }); break; }
                nr += dr; nc += dc;
              }
            }
          }
        }
        return out;
      }

      function make(st, m) {
        const b = st.b, w = st.turn === 'w', p = b[m.f];
        const u = { m, cap: b[m.t], cas: { K: st.cas.K, Q: st.cas.Q, k: st.cas.k, q: st.cas.q }, ep: st.ep, half: st.half, full: st.full, moved: p };
        b[m.t] = m.p ? (w ? m.p.toUpperCase() : m.p) : p;
        b[m.f] = null;
        if (m.fl === 'ep') { const cs = m.t + (w ? 8 : -8); u.epCap = b[cs]; u.epSq = cs; b[cs] = null; }
        else if (m.fl === 'cK') { if (w) { b[61] = b[63]; b[63] = null; } else { b[5] = b[7]; b[7] = null; } }
        else if (m.fl === 'cQ') { if (w) { b[59] = b[56]; b[56] = null; } else { b[3] = b[0]; b[0] = null; } }
        const c = st.cas;
        if (p === 'K') { c.K = 0; c.Q = 0; } else if (p === 'k') { c.k = 0; c.q = 0; }
        for (const s of [m.f, m.t]) { if (s === 63) c.K = 0; else if (s === 56) c.Q = 0; else if (s === 7) c.k = 0; else if (s === 0) c.q = 0; }
        st.ep = m.fl === 'dbl' ? (m.f + m.t) >> 1 : -1;
        st.half = (p === 'P' || p === 'p' || u.cap) ? 0 : st.half + 1;
        if (!w) st.full++;
        st.turn = w ? 'b' : 'w';
        return u;
      }
      function unmake(st, u) {
        const m = u.m, b = st.b;
        st.turn = st.turn === 'w' ? 'b' : 'w';
        const w = st.turn === 'w';
        b[m.f] = u.moved; b[m.t] = u.cap;
        if (m.fl === 'ep') b[u.epSq] = u.epCap;
        else if (m.fl === 'cK') { if (w) { b[63] = b[61]; b[61] = null; } else { b[7] = b[5]; b[5] = null; } }
        else if (m.fl === 'cQ') { if (w) { b[56] = b[59]; b[59] = null; } else { b[0] = b[3]; b[3] = null; } }
        Object.assign(st.cas, u.cas);
        st.ep = u.ep; st.half = u.half; st.full = u.full;
      }
      function legal(st) {
        const out = [], w = st.turn === 'w';
        for (const m of pseudo(st)) {
          const u = make(st, m);
          if (!inCheck(st, w)) out.push(m);
          unmake(st, u);
        }
        return out;
      }
      function perft(st, d) {
        if (d === 0) return 1;
        let n = 0;
        for (const m of legal(st)) { const u = make(st, m); n += perft(st, d - 1); unmake(st, u); }
        return n;
      }
      const posKey = (st) => st.b.map((x) => x || '.').join('') + st.turn + st.cas.K + st.cas.Q + st.cas.k + st.cas.q + (st.ep >= 0 ? st.ep : '-');

      function insufficient(b) {
        const pcs = b.filter(Boolean).map((p) => p.toLowerCase()).filter((p) => p !== 'k');
        if (pcs.length === 0) return true;
        if (pcs.length === 1 && (pcs[0] === 'n' || pcs[0] === 'b')) return true;
        return false;
      }
      // after a move: is the game over?
      function status(st, seen) {
        const moves = legal(st), w = st.turn === 'w';
        if (moves.length === 0) return inCheck(st, w) ? { over: true, kind: 'mate', winner: w ? 'b' : 'w' } : { over: true, kind: 'stalemate' };
        if (st.half >= 100) return { over: true, kind: 'fifty' };
        if (insufficient(st.b)) return { over: true, kind: 'material' };
        if (seen && seen[posKey(st)] >= 3) return { over: true, kind: 'repetition' };
        return { over: false, check: inCheck(st, w) };
      }

      /* ---------- the AI ---------- */
      const PST = {
        p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
        n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
        b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
        r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
        q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
        k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
      };
      function evaluate(st) {
        let s = 0, mat = 0;
        const b = st.b;
        for (let i = 0; i < 64; i++) {
          const p = b[i];
          if (!p) continue;
          const t = p.toLowerCase();
          if (t !== 'k' && t !== 'p') mat += VAL[t];
        }
        const endg = mat < 2600;
        for (let i = 0; i < 64; i++) {
          const p = b[i];
          if (!p) continue;
          const t = p.toLowerCase(), w = isW(p);
          let v = VAL[t];
          if (t === 'k' && endg) { const r = i >> 3, c = i & 7; v += 30 - 6 * (Math.abs(r - 3.5) + Math.abs(c - 3.5)); }
          else v += PST[t][w ? i : i ^ 56];
          s += w ? v : -v;
        }
        return st.turn === 'w' ? s : -s;
      }
      const TIMEOUT = { t: 1 };
      function orderMoves(st, moves) {
        const b = st.b;
        return moves.map((m) => {
          let sc = 0;
          const v = b[m.t];
          if (v) sc += 10 * VAL[v.toLowerCase()] - VAL[b[m.f].toLowerCase()] / 10;
          if (m.fl === 'ep') sc += 900;
          if (m.p) sc += VAL[m.p] + 500;
          return { m, sc };
        }).sort((a, z) => z.sc - a.sc).map((x) => x.m);
      }
      function qsearch(st, alpha, beta, ctx, qd) {
        if ((++ctx.nodes & 511) === 0 && Date.now() > ctx.deadline) throw TIMEOUT;
        const stand = evaluate(st);
        if (stand >= beta) return beta;
        if (alpha < stand) alpha = stand;
        if (qd <= 0) return alpha;
        const w = st.turn === 'w';
        const caps = orderMoves(st, pseudo(st).filter((m) => m.cap || m.p));
        for (const m of caps) {
          const u = make(st, m);
          if (inCheck(st, w)) { unmake(st, u); continue; }
          const sc = -qsearch(st, -beta, -alpha, ctx, qd - 1);
          unmake(st, u);
          if (sc >= beta) return beta;
          if (sc > alpha) alpha = sc;
        }
        return alpha;
      }
      function negamax(st, depth, alpha, beta, ply, ctx) {
        if ((++ctx.nodes & 511) === 0 && Date.now() > ctx.deadline) throw TIMEOUT;
        const w = st.turn === 'w';
        if (depth <= 0) return qsearch(st, alpha, beta, ctx, 4);
        const moves = orderMoves(st, legal(st));
        if (moves.length === 0) return inCheck(st, w) ? -30000 + ply : 0;
        if (st.half >= 100) return 0;
        for (const m of moves) {
          const u = make(st, m);
          const sc = -negamax(st, depth - 1, -beta, -alpha, ply + 1, ctx);
          unmake(st, u);
          if (sc >= beta) return beta;
          if (sc > alpha) alpha = sc;
        }
        return alpha;
      }
      function bestMove(st0, level) {
        const st = { b: st0.b.slice(), turn: st0.turn, cas: { ...st0.cas }, ep: st0.ep, half: st0.half, full: st0.full }; // search on a copy
        const moves = legal(st);
        if (moves.length === 0) return null;
        const maxDepth = [1, 2, 4][level - 1] || 2;
        const ctx = { nodes: 0, deadline: Date.now() + (level === 3 ? 1600 : level === 2 ? 900 : 300) };
        let best = pick(moves);
        let ordered = orderMoves(st, moves);
        for (let d = 1; d <= maxDepth; d++) {
          let bm = null, bs = -Infinity;
          try {
            for (const m of ordered) {
              const u = make(st, m);
              let sc = -negamax(st, d - 1, -Infinity, -bs + 0, 1, ctx);
              unmake(st, u);
              if (level === 1) sc += rnd(120) - 60; // easy: sloppy
              if (sc > bs) { bs = sc; bm = m; }
            }
          } catch (e) {
            if (e !== TIMEOUT) throw e;
            // we ran out of time mid-way: undo whatever the search left on the board
            return best;
          }
          if (bm) { best = bm; ordered = [bm, ...ordered.filter((x) => x !== bm)]; }
        }
        return best;
      }

      /* ---------- piece pictures ---------- */
      const ART = {
        p: '<circle cx="50" cy="30" r="13"/><path d="M40 44 H60 C60 56 66 64 70 78 H30 C34 64 40 56 40 44 Z"/><rect x="26" y="78" width="48" height="10" rx="2"/>',
        r: '<path d="M26 20 H38 V28 H44 V20 H56 V28 H62 V20 H74 V42 L66 48 L68 74 H32 L34 48 L26 42 Z"/><rect x="24" y="74" width="52" height="14" rx="2"/>',
        n: '<path d="M28 78 C28 58 38 48 46 40 C40 40 34 42 30 46 L24 40 C28 26 40 14 56 14 C72 16 78 34 74 52 C72 62 70 70 72 78 Z"/><rect x="24" y="78" width="52" height="10" rx="2"/>',
        b: '<circle cx="50" cy="14" r="6"/><path d="M50 20 C64 30 66 44 58 52 H42 C34 44 36 30 50 20 Z"/><path d="M38 52 H62 C62 62 68 68 72 78 H28 C32 68 38 62 38 52 Z"/><rect x="24" y="78" width="52" height="10" rx="2"/>',
        q: '<circle cx="22" cy="26" r="6"/><circle cx="38" cy="18" r="6"/><circle cx="50" cy="14" r="6"/><circle cx="62" cy="18" r="6"/><circle cx="78" cy="26" r="6"/><path d="M22 30 L32 62 L40 30 L50 60 L60 30 L68 62 L78 30 L72 78 H28 Z"/><rect x="24" y="78" width="52" height="10" rx="2"/>',
        k: '<rect x="45" y="6" width="10" height="26"/><rect x="36" y="14" width="28" height="9"/><path d="M34 76 L30 52 C28 42 38 36 50 36 C62 36 72 42 70 52 L66 76 Z"/><rect x="24" y="76" width="52" height="12" rx="2"/>',
      };
      function pieceSVG(p) {
        const w = isW(p), t = p.toLowerCase();
        const fill = w ? '#F7F4EC' : '#273142';
        const extra = t === 'n' ? `<circle cx="52" cy="30" r="3.5" fill="${w ? '#050E18' : '#F7F4EC'}" stroke="none"/>` : t === 'b' ? `<path d="M44 34 L56 44" stroke="${w ? '#050E18' : '#9DB4CC'}" stroke-width="4" fill="none"/>` : '';
        return `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="${fill}" stroke="#050E18" stroke-width="5" stroke-linejoin="round">${ART[t]}</g>${extra}</svg>`;
      }

      /* ---------- the game screen ---------- */
      let G = null;
      const LV = ['Easy', 'Medium', 'Hard'];

      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1000px] mx-auto');
        // Nov 2026: Chess uses the shared online table (netplay) like every other game: the same "how do you want to
        // play?" picker, rooms, quick match (ranked Elo), rematch, emotes, lost-message protection and rejoining.
        setupScreen(body, mod, [
          { key: 'side', label: 'PLAY AS', def: 'w', local: true, choices: [['w', 'White'], ['b', 'Black'], ['r', 'Random']] },
          { key: 'lvl', label: 'DIFFICULTY', def: 2, local: true, choices: [[1, 'Easy'], [2, 'Medium'], [3, 'Hard']] },
          { key: 'clock', label: 'MOVE TIMER', def: 60, choices: [[0, 'Off'], [30, '30 s'], [60, '60 s'], [120, '2 min']] },
          { key: 'theme', label: 'BOARD COLOURS', def: 'ocean', choices: [['ocean', 'Ocean'], ['forest', 'Forest'], ['wood', 'Wood']] },
          { key: 'hints', label: 'Move hints', toggle: true, def: 1, hint: 'Show where the picked piece can go.', choices: [[1, 'On'], [0, 'Off']] },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }, { bot: true, name: `AI (${LV[(+sel.lvl || 2) - 1]})`, avatar: '🤖' }], sel)));
      }
      // which seat plays White: online the shared dice decide (same on both screens); on this device, your choice
      const colorOf = (seat) => (seat === G.whiteSeat ? 'w' : 'b');
      const seatOf = (col) => (col === 'w' ? G.whiteSeat : 1 - G.whiteSeat);
      const oppSeat = () => 1 - G.S.me;
      const oppName = () => (G.S.online ? G.S.name(oppSeat()) : `AI (${LV[G.lvl - 1]})`);

      function start(body, sel, S) {
        const side = sel.side === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : sel.side === 'b' ? 'b' : 'w';
        const whiteSeat = S.online ? S.rng.rnd(2) : (side === 'w' ? 0 : 1);
        G = { S, whiteSeat, st: newPos(), me: null, lvl: +sel.lvl || 2, secs: +sel.clock, hints: sel.hints === undefined ? true : !!+sel.hints, theme: sel.theme || 'ocean', sel: null, targets: [], last: null, over: false, hist: [], seen: {}, capW: [], capB: [], busy: false, resign: false, promo: null, tok: ++GT.cur };
        G.me = colorOf(S.me);
        G.seen[posKey(G.st)] = 1;
        body.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,560px)_1fr] gap-6 items-start">
          <div class="space-y-2">
            <div id="ch-top" class="flex items-center justify-between"></div>
            <div class="relative"><div id="ch-board" class="chess-board th-${G.theme}"></div><div id="ch-promo" class="hidden"></div></div>
            <div id="ch-bot" class="flex items-center justify-between"></div>
          </div>
          <div class="space-y-4 min-w-0">
            <div class="win overflow-hidden"><div class="winbar teal"><span id="ch-status">YOUR MOVE</span><span id="ch-lvl" class="pix text-xs"></span></div>
              <div class="p-4 space-y-3"><div id="ch-clock"></div><div id="ch-msg" class="text-sm text-muted min-h-[20px]"></div></div></div>
            <div class="win overflow-hidden"><div class="winbar"><span>MOVES</span></div><div id="ch-moves" class="logbox !border-0" style="height:210px"></div></div>
            <div class="grid grid-cols-2 gap-3"><button id="ch-resign" class="btn-game btn-coral py-2.5 text-sm">Resign</button><button id="ch-new" class="btn-game btn-graphite py-2.5 text-sm">${S.online ? 'Leave' : 'New game'}</button></div>
          </div></div>`;
        G.clock = makeClock(document.getElementById('ch-clock'));
        document.getElementById('ch-lvl').textContent = S.online ? (S.ranked ? 'ONLINE · RANKED' : `ONLINE · ROOM ${S.code}`) : `vs ${LV[G.lvl - 1]} AI`;
        document.getElementById('ch-new').onclick = () => npConfirmLeave(() => open(document.getElementById('game-root')));
        document.getElementById('ch-resign').onclick = (e) => {
          if (G.over) return;
          if (!G.resign) { G.resign = true; e.target.textContent = 'Really resign?'; gTimeout(() => { if (G) { G.resign = false; e.target.textContent = 'Resign'; } }, 3000); return; }
          S.act({ t: 'resign', s: S.me });
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
          if (seatOf(G.st.turn) !== a.s) return 0;
          const mv = legal(G.st).find((q) => q.f === a.f && q.t === a.to && (q.p || null) === (a.p || null));
          if (!mv) return 0;
          play(mv);
          return (G.slideMs || MOTION.slide) + 120;
        }
        if (a.t === 'resign' || a.t === '_left' || a.t === '_gone') {
          const mineSeat = a.s === G.S.me;
          const loser = colorOf(a.s), winner = loser === 'w' ? 'b' : 'w';
          finish({ over: true, kind: mineSeat ? 'resign' : a.t === 'resign' ? 'oppresign' : a.t === '_gone' ? 'disconnect' : 'abandon', winner });
        }
        return 0;
      }
      // only on the table's host: the computer moves
      function drive() {
        if (!G || G.over) return;
        const seat = seatOf(G.st.turn);
        if (G.S.bot(seat)) G.S.later(() => { const m = bestMove(G.st, G.lvl); if (m) G.S.act({ t: 'mv', s: seat, f: m.f, to: m.t, p: m.p || null }); }, window.__fast ? 50 : 1300 + rnd(700));
      }
      // my decision: it goes through the table (on this device straight away)
      const send = (m) => { G.busy = true; G.S.act({ t: 'mv', s: seatOf(G.st.turn), f: m.f, to: m.t, p: m.p || null }); };
      function turn() {
        if (G.over) return;
        G.busy = false;
        if (G.S.mine(seatOf(G.st.turn))) humanTurn(); else oppTurn();
      }
      function oppTurn() {
        if (G.over) return;
        const bot = G.S.bot(seatOf(G.st.turn));
        document.getElementById('ch-status').textContent = bot ? 'AI THINKING...' : `${oppName().toUpperCase()}'S MOVE`;
        if (!bot && G.secs) G.clock.start(G.secs + 5, 'Their time', () => {}, 8); else G.clock.idle(bot ? 'AI turn' : 'Their move', '...');
      }

      function humanTurn() {
        if (G.over) return;
        document.getElementById('ch-status').textContent = 'YOUR MOVE';
        if (G.secs) G.clock.start(G.secs, 'Your time', () => {
          if (G.over || G.st.turn !== G.me) return;
          const mv = pick(legal(G.st));
          showToast("Time's up! A move was played for you.", 'error');
          send(mv);
        }, 8); else G.clock.idle('No timer', '∞');
      }

      function san(st, m) {
        const p = st.b[m.f], t = p.toLowerCase();
        if (m.fl === 'cK') return 'O-O';
        if (m.fl === 'cQ') return 'O-O-O';
        let s = t === 'p' ? '' : t.toUpperCase();
        if (t === 'p' && m.cap) s += FILES[m.f & 7];
        else if (t !== 'p' && t !== 'k') {
          const others = legal(st).filter((x) => x.t === m.t && x.f !== m.f && st.b[x.f] === p);
          if (others.length) { const sameFile = others.some((x) => (x.f & 7) === (m.f & 7)); s += sameFile ? String(8 - (m.f >> 3)) : FILES[m.f & 7]; }
        }
        if (m.cap) s += 'x';
        s += sqName(m.t);
        if (m.p) s += '=' + m.p.toUpperCase();
        return s;
      }

      function play(m) {
        if (G.over) return;
        G.clock.stop();
        const st = G.st;
        const label = san(st, m), mover = st.turn;
        const victim = m.fl === 'ep' ? (st.turn === 'w' ? 'p' : 'P') : st.b[m.t];
        // where things stand before the move, so the piece can slide from there
        const sqEl = (i) => document.querySelector(`#ch-board [data-i="${i}"]`);
        const pcEl = (i) => { const e = sqEl(i); return e && e.querySelector('svg'); };
        const fromR = sqEl(m.f) && sqEl(m.f).getBoundingClientRect();
        const rook = m.fl === 'cK' ? [m.f + 3, m.f + 1] : m.fl === 'cQ' ? [m.f - 4, m.f - 1] : null;
        const rookR = rook && sqEl(rook[0]) && sqEl(rook[0]).getBoundingClientRect();
        const capSq = m.fl === 'ep' ? m.t + (st.turn === 'w' ? 8 : -8) : m.t;
        if (victim) gGhost(pcEl(capSq), { delay: MOTION.slide * 0.55, ms: 260 });
        make(st, m);
        if (victim) (isW(victim) ? G.capW : G.capB).push(victim);
        const k = posKey(st);
        G.seen[k] = (G.seen[k] || 0) + 1;
        const s = status(st, G.seen);
        G.hist.push(label + (s.over && s.kind === 'mate' ? '#' : s.check ? '+' : ''));
        G.last = { f: m.f, t: m.t };
        G.sel = null; G.targets = [];
        render();
        G.slideMs = gSlide(pcEl(m.t), fromR, { lift: true });
        if (rook) gSlide(pcEl(rook[1]), rookR);
        // the sound lands with the piece, not when it lifts off
        const snd = s.check || (s.over && s.kind === 'mate') ? 'check' : victim ? 'capture' : 'move';
        gTimeout(() => SFX.play(snd), Math.max(0, G.slideMs - 60));
        if (s.over) { const tok = G.tok; G.ending = true; G.clock.stop(); gTimeout(() => { if (G && G.tok === tok) finish(s); }, G.slideMs + 150); return; }
        turn();
      }

      async function finish(s) {
        if (G.done) return; G.done = true;
        G.over = true; G.S.over = true;
        G.clock.stop();
        render();
        const S = G.S, tok = G.tok;
        let res = 'draw', title = 'Draw', sub = '';
        if (s.winner) { res = s.winner === G.me ? 'win' : 'loss'; }
        const opp = S.online ? oppName() : 'The AI';
        if (s.kind === 'mate') sub = res === 'win' ? (S.online ? 'Checkmate! You won.' : 'Checkmate! You beat the AI.') : S.online ? 'Checkmate. Good game!' : 'Checkmate. The AI got you this time.';
        else if (s.kind === 'resign') sub = 'You resigned.';
        else if (s.kind === 'oppresign') sub = `${opp} resigned.`;
        else if (s.kind === 'abandon') sub = `${opp} left the game. You win!`;
        else if (s.kind === 'disconnect') sub = `${opp} disconnected. You win!`;
        else if (s.kind === 'stalemate') sub = 'Stalemate: no legal moves but not in check.';
        else if (s.kind === 'fifty') sub = 'Draw by the 50-move rule.';
        else if (s.kind === 'repetition') sub = 'Draw by threefold repetition.';
        else sub = 'Draw: not enough pieces left to checkmate.';
        title = res === 'win' ? 'Victory!' : res === 'loss' ? 'Defeat' : 'Draw';
        document.getElementById('ch-status').textContent = title.toUpperCase();
        document.getElementById('ch-msg').textContent = sub;
        SFX.play(res === 'win' ? 'win' : res === 'loss' ? 'lose' : 'pop');
        const g = gstat('chess');
        if (res === 'win' && s.kind === 'mate') g.mates = (g.mates || 0) + 1;
        if (S.online) g.online = (g.online || 0) + 1;
        const eloTab = { win: [10, 16, 24], loss: [-6, -9, -12], draw: [1, 2, 4] };
        const elo = S.online ? 0 : eloTab[res][G.lvl - 1];
        const eloRow = S.online ? await S.finish(res) : ['Elo', elo > 0 ? '+' + elo : String(elo), elo >= 0 ? 'text-emerald' : 'text-coral'];
        if (!G || G.tok !== tok) return;
        reportGame('chess', res, { elo, xp: S.online ? (res === 'win' ? 50 : res === 'draw' ? 25 : 15) : res === 'win' ? 20 + G.lvl * 15 : res === 'draw' ? 20 : 12, label: `${S.online ? 'Online vs ' + oppName() : 'vs ' + LV[G.lvl - 1] + ' AI'} · ${G.hist.length} moves` });
        const rows = S.online ? [['Opponent', `${S.avatar(oppSeat())} ${oppName()}`, 'text-bone'], ['Moves', Math.ceil(G.hist.length / 2)]].concat(eloRow ? [eloRow] : [])
          : [['Moves', Math.ceil(G.hist.length / 2)], eloRow, ['Level', LV[G.lvl - 1], 'text-amber']];
        gTimeout(() => gameResult({ title, sub, tone: res === 'loss' ? 'coral' : 'amber', sprite: res === 'win' ? 'trophy' : 'anchor', rows, againLabel: S.online ? 'Back to setup' : 'New Game', again: () => open(document.getElementById('game-root')) }), 900);
      }

      function onSquare(i) {
        if (!G || G.over || G.ending || G.busy || G.st.turn !== G.me || !G.S.mine(seatOf(G.st.turn)) || G.promo) return;
        const p = G.st.b[i];
        if (G.sel !== null) {
          const mv = G.targets.filter((m) => m.t === i);
          if (mv.length) {
            if (mv.length > 1) return askPromo(mv); // promotion
            return send(mv[0]);
          }
        }
        if (p && isW(p) === (G.me === 'w')) {
          G.sel = i;
          G.targets = legal(G.st).filter((m) => m.f === i);
          SFX.play('click');
        } else { G.sel = null; G.targets = []; }
        render();
      }

      function askPromo(mv) {
        G.promo = mv;
        const el = document.getElementById('ch-promo');
        const w = G.me === 'w';
        el.className = 'absolute inset-0 z-10 flex items-center justify-center bg-black/60';
        el.innerHTML = `<div class="win p-4 space-y-3 text-center"><div class="pix text-sm text-muted">PROMOTE TO</div><div class="flex gap-3">${['q', 'r', 'b', 'n'].map((c) => `<button data-p="${c}" class="avatar-tile w-16 h-16 hover:bg-amber" style="padding:6px">${pieceSVG(w ? c.toUpperCase() : c)}</button>`).join('')}</div></div>`;
        el.querySelectorAll('button').forEach((b) => { b.onclick = () => { const m = mv.find((x) => x.p === b.dataset.p); G.promo = null; el.className = 'hidden'; send(m); }; });
      }

      function render() {
        const st = G.st, flip = G.me === 'b';
        const board = document.getElementById('ch-board');
        const kSq = st.b.findIndex((p) => p === (st.turn === 'w' ? 'K' : 'k'));
        const chk = !G.over || true ? inCheck(st, st.turn === 'w') : false;
        let h = '';
        for (let vr = 0; vr < 8; vr++) for (let vc = 0; vc < 8; vc++) {
          const r = flip ? 7 - vr : vr, c = flip ? 7 - vc : vc, i = r * 8 + c, p = st.b[i];
          const dark = (r + c) % 2 === 1;
          const tg = G.hints && G.targets.some((m) => m.t === i);
          const cls = ['chsq', dark ? 'dk' : 'lt', G.sel === i ? 'sel' : '', G.last && (G.last.f === i || G.last.t === i) ? 'last' : '', chk && i === kSq ? 'chk' : '', tg ? (p ? 'tcap' : 'tmov') : ''].join(' ');
          const lab = (vc === 0 ? `<span class="rk">${8 - r}</span>` : '') + (vr === 7 ? `<span class="fl">${FILES[c]}</span>` : '');
          h += `<div class="${cls}" data-i="${i}">${lab}${p ? pieceSVG(p) : ''}</div>`;
        }
        board.innerHTML = h;
        board.querySelectorAll('.chsq').forEach((el) => { el.onclick = () => onSquare(+el.dataset.i); });
        const cap = (arr) => arr.slice().sort((a, b) => VAL[b.toLowerCase()] - VAL[a.toLowerCase()]).map((p) => `<span class="w-5 h-5 inline-block">${pieceSVG(p)}</span>`).join('');
        const meN = G.S.online ? G.S.name(G.S.me) : profile.username, aiN = esc(oppName());
        const mine = G.me === 'w' ? G.capB : G.capW, theirs = G.me === 'w' ? G.capW : G.capB;
        document.getElementById('ch-bot').innerHTML = `<span class="flex items-center gap-2 font-display font-extrabold text-sm"><span class="avatar-tile w-8 h-8 text-lg">${G.S.online ? esc(G.S.avatar(G.S.me)) : profile.avatar}</span>${esc(meN)}</span><span class="flex">${cap(mine)}</span>`;
        document.getElementById('ch-top').innerHTML = `<span class="flex items-center gap-2 font-display font-extrabold text-sm"><span class="avatar-tile w-8 h-8 text-lg">${G.S.online ? esc(G.S.avatar(oppSeat())) : '🤖'}</span>${aiN}</span><span class="flex">${cap(theirs)}</span>`;
        const mv = document.getElementById('ch-moves');
        let mh = '';
        for (let i = 0; i < G.hist.length; i += 2) mh += `<div><span class="text-muted">${i / 2 + 1}.</span> <b>${G.hist[i]}</b> ${G.hist[i + 1] ? '<b>' + G.hist[i + 1] + '</b>' : ''}</div>`;
        mv.innerHTML = mh || '<div>Make your first move!</div>';
        mv.scrollTop = mv.scrollHeight;
        if (!G.over) document.getElementById('ch-msg').textContent = chk ? 'Check!' : '';
      }

      const mod = {
        id: 'chess', name: 'Chess', icon: 'chess', cats: ['board'], sub: '1v1 · ~10 MIN', color: '#F7F4EC', tone: 'teal', btn: 'teal',
        blurb: 'The classic. Full rules including castling, en passant and promotion, against an AI with three strength levels.',
        rules: {
          tag: '8×8 · VS AI',
          steps: [
            '<strong class="text-bone">Move:</strong> Click one of your pieces, then click a highlighted square. Dots are moves, rings are captures.',
            '<strong class="text-bone">Check the king:</strong> Attack the enemy king so it cannot escape and you win by <span class="text-teal font-bold">checkmate</span>. If you have no legal move and are not in check, it is a stalemate draw.',
            '<strong class="text-bone">Special moves:</strong> Castle by moving the king two squares, capture en passant, and promote a pawn that reaches the far side.',
          ],
          tip: 'Fight for the center early, develop knights and bishops before moving the queen, and castle to keep your king safe.',
        },
        extraRows: (s) => srow('Checkmates delivered', s.mates || 0),
        art: { piece: (p) => pieceSVG(p) },
        engine: { newPos, fromFEN, legal, make, unmake, perft, status, bestMove, evaluate },
        open, close() { G = null; },
        online: { seats: () => 2, ranked: true, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();

