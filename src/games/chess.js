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
        const vsAI = (s) => !s.opp || s.opp === 'ai';
        setupScreen(body, mod, [
          ...(NET.on ? [{ key: 'opp', label: 'PLAY', def: 'friend', choices: [['online', 'Online'], ['friend', 'Private room']], hint: 'Online finds you a real player (ranked Elo). A private room gives you a link for a friend, or you can add a computer opponent.' }] : []),
          { key: 'side', label: 'PLAY AS', def: 'w', when: vsAI, choices: [['w', 'White'], ['b', 'Black'], ['r', 'Random']] },
          { key: 'lvl', label: 'DIFFICULTY', def: 2, when: vsAI, choices: [[1, 'Easy'], [2, 'Medium'], [3, 'Hard']] },
          { key: 'clock', label: 'MOVE TIMER', def: 60, choices: [[0, 'Off'], [30, '30 s'], [60, '60 s'], [120, '2 min']] },
          { key: 'theme', label: 'BOARD COLOURS', def: 'ocean', choices: [['ocean', 'Ocean'], ['forest', 'Forest'], ['wood', 'Wood']] },
          { key: 'hints', label: 'Move hints', toggle: true, def: 1, hint: 'Show where the picked piece can go.', choices: [[1, 'On'], [0, 'Off']] },
        ], (sel) => start(body, sel));
        const go = body.querySelector('#su-go'); const fix = () => { const on = body.querySelector('[data-k="opp"].on'); if (go && on) go.textContent = on.dataset.v === 'online' ? 'Find a game' : 'Create room'; };
        fix(); new MutationObserver(fix).observe(body, { childList: true, subtree: true });
      }

      function start(body, sel, online) {
        if (!online && NET.on && (sel.opp === 'online' || sel.opp === 'friend')) return onlineLobby(body, sel);
        const me = online ? online.me : sel.side === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : sel.side;
        G = { online: online || null, st: newPos(), me, lvl: +sel.lvl || 2, secs: +sel.clock, hints: !!+sel.hints, theme: sel.theme, sel: null, targets: [], last: null, over: false, hist: [], seen: {}, capW: [], capB: [], busy: false, resign: false, promo: null, tok: ++GT.cur };
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
            <div class="grid grid-cols-2 gap-3"><button id="ch-resign" class="btn-game btn-coral py-2.5 text-sm">Resign</button><button id="ch-new" class="btn-game btn-graphite py-2.5 text-sm">New game</button></div>
          </div></div>`;
        G.clock = makeClock(document.getElementById('ch-clock'));
        document.getElementById('ch-lvl').textContent = G.online ? (G.online.ranked ? 'ONLINE · RANKED' : `ONLINE · ROOM ${G.online.code}`) : `vs ${LV[G.lvl - 1]} AI`;
        document.getElementById('ch-new').onclick = () => {
          if (G.online && !G.over) {
            return askConfirm({ title: 'LEAVE THIS GAME?', sub: 'Leaving an online game counts as a loss, and your opponent wins.' }).then((yes) => { if (yes && G) { quitOnline(); if (netOff) { netOff(); netOff = null; } open(document.getElementById('game-root')); } });
          }
          open(document.getElementById('game-root'));
        };
        if (G.online) gOn(window, 'pagehide', () => quitOnline());
        document.getElementById('ch-resign').onclick = (e) => {
          if (G.over) return;
          if (!G.resign) { G.resign = true; e.target.textContent = 'Really resign?'; gTimeout(() => { if (G) { G.resign = false; e.target.textContent = 'Resign'; } }, 3000); return; }
          if (G.online) sendNet({ t: 'resign' });
          finish({ over: true, kind: 'resign', winner: G.me === 'w' ? 'b' : 'w' });
        };
        if (G.online) { document.getElementById('ch-new').textContent = 'Leave'; watchOpponent(); }
        render();
        if (G.st.turn !== G.me) oppTurn(); else humanTurn();
      }
      const oppTurn = () => (G.online ? netTurn() : aiTurn());

      /* ---------- playing a real person ---------- */
      let netOff = null;
      // the waiting room: quick match (anyone, ranked) or a private room code (a friend, not ranked)
      async function onlineLobby(body, sel) {
        const quick = sel.opp === 'online', root = document.getElementById('game-root');
        let room = null, gone = false;
        const leave = () => { gone = true; if (netOff) { netOff(); netOff = null; } if (room) NET.leave(room.code); open(root); };
        const wait = (title, html) => {
          body.innerHTML = `<div class="win max-w-lg mx-auto overflow-hidden"><div class="winbar teal"><span>${title}</span><span class="pix text-xs">CHESS ONLINE</span></div>
            <div class="p-6 space-y-4 text-center"><div class="ch-wait"><i></i><i></i><i></i></div>${html}<button id="ch-cancel" class="btn-game btn-graphite py-2 px-6 text-sm">Cancel</button></div></div>`;
          document.getElementById('ch-cancel').onclick = leave;
        };
        const qt0 = Date.now(), qClock = () => { const t = Math.floor((Date.now() - qt0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
        const qTick = gInterval(() => { const el = document.getElementById('ch-qt'); if (el) el.textContent = qClock(); else if (G) gClearInt(qTick); }, 1000);
        const timerHTML = () => `<div class="flex items-center justify-center gap-2"><span class="pix text-xs text-muted">${quick ? 'SEARCHING' : 'WAITING'}</span><span id="ch-qt" class="pix text-xl text-teal">${qClock()}</span></div>`;
        wait(quick ? 'FINDING AN OPPONENT' : 'OPENING YOUR ROOM', timerHTML() + '<p class="text-sm text-muted">Connecting...</p>');
        try { room = quick ? await NET.quickMatch('chess', { clock: +sel.clock }) : await NET.enterRoom(sel.room, 'chess', { clock: +sel.clock }); }
        catch (e) { showToast(e.message || 'Could not connect.', 'error'); return open(root); }
        if (gone || activeGame !== 'chess') return;
        const code = room.code, link = inviteLink('chess', code, { ...sel, opp: 'friend' });
        if (room.status === 'waiting') wait(quick ? 'WAITING FOR A PLAYER' : `ROOM ${code}`, timerHTML() + (quick
          ? '<p class="text-sm text-muted">You are in the queue. The next player who looks for a chess game is matched with you.</p><p class="text-xs text-muted">Testing on one computer? Two tabs of the same browser are the same player. Use a second browser, or a private window, for the other side.</p>'
          : `<p class="text-sm text-muted">Your room is open. Send the link to a friend: the game starts when they join.</p><div class="room-code mx-auto" style="max-width:220px">${esc(code)}</div>
            <div class="flex flex-wrap justify-center gap-2"><button id="ch-copy" class="btn-game btn-amber py-2 px-5 text-sm">Copy invite link</button>${navigator.share ? '<button id="ch-share" class="btn-game btn-teal py-2 px-5 text-sm">Share…</button>' : ''}</div>
            <div class="np-linkline pix text-xs text-muted">${esc(link.replace(/^https?:\/\//, ''))}</div>
            ${room.host === NET.me.id ? '<div id="ch-bots"></div>' : ''}`));
        const cp = document.getElementById('ch-copy'); if (cp) cp.onclick = (e) => copyText(link, e.currentTarget);
        const shr = document.getElementById('ch-share'); if (shr) shr.onclick = () => navigator.share({ title: 'Play Chess on GameHub', text: 'Play Chess with me on GameHub!', url: link }).catch(() => {});
        // or play the computer: add it as your opponent, pick its level and your colour
        const cb = document.getElementById('ch-bots');
        if (cb) {
          let nb = 0, lv = +sel.lvl || 2, side = sel.side || 'w';
          const seg = (key, cur, list) => `<div class="seg w-full">${list.map(([v, t]) => `<button data-${key}="${v}" class="seg-btn flex-1 ${String(v) === String(cur) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
          const paintB = () => {
            cb.innerHTML = `<div class="np-bots"><div class="flex items-center justify-between gap-3"><span class="pix text-xs tracking-wider text-muted">COMPUTER OPPONENT</span>
              <span class="np-step"><button id="np-bm" class="btn-game btn-graphite" ${nb <= 0 ? 'disabled' : ''} aria-label="No computer opponent">−</button><b id="np-bn">${nb}</b><button id="np-bp" class="btn-game btn-graphite" ${nb >= 1 ? 'disabled' : ''} aria-label="Add a computer opponent">+</button></span></div>
              ${nb ? `<div class="pix text-xs tracking-wider text-muted mt-3 mb-1.5 text-left">COMPUTER LEVEL</div>${seg('lv', lv, [[1, 'Easy'], [2, 'Medium'], [3, 'Hard']])}
              <div class="pix text-xs tracking-wider text-muted mt-3 mb-1.5 text-left">PLAY AS</div>${seg('sd', side, [['w', 'White'], ['b', 'Black'], ['r', 'Random']])}
              <button id="np-start" class="btn-game btn-amber w-full py-2.5 text-sm mt-3">Start game</button>` : ''}</div>`;
            cb.querySelector('#np-bm').onclick = () => { nb = 0; SFX.play('click'); paintB(); };
            cb.querySelector('#np-bp').onclick = () => { nb = 1; SFX.play('click'); paintB(); };
            cb.querySelectorAll('[data-lv]').forEach((b) => { b.onclick = () => { lv = +b.dataset.lv; paintB(); }; });
            cb.querySelectorAll('[data-sd]').forEach((b) => { b.onclick = () => { side = b.dataset.sd; paintB(); }; });
            const st = cb.querySelector('#np-start');
            if (st) st.onclick = () => { gone = true; if (netOff) { netOff(); netOff = null; } NET.leave(code); start(body, { ...sel, opp: 'ai', lvl: lv, side }); GT.started = true; GT.over = false; };
          };
          paintB();
        }
        NET.ping(code); gInterval(() => NET.ping(code), 10000);
        let begun = false;
        if (netOff) netOff();
        netOff = NET.watchRoom(code, async (r) => {
          if (gone) return;
          if (!begun && r.status === 'playing' && r.guest) {
            begun = true;
            const oppId = r.host === NET.me.id ? r.guest : r.host;
            const [opp, rt] = await Promise.all([NET.profileOf(oppId), NET.rating('chess').catch(() => ({ elo: 1200 }))]);
            const ort = await NET.leaderboard('chess').then((l) => (l.find((x) => x.id === oppId) || { elo: 1200 }).elo).catch(() => 1200);
            SFX.play('reveal'); showToast(`${opp.name} joined. Good luck!`, 'success');
            NP.table = code; CHAT.mode = 'table'; chatOnView('game');
            start(body, { ...sel, clock: (r.settings && r.settings.clock) || sel.clock }, { code, isHost: r.host === NET.me.id, me: r.first === NET.me.id ? 'w' : 'b', ranked: r.is_public, n: 0, opp: { id: oppId, name: opp.name, avatar: opp.avatar, elo: ort }, myElo: rt.elo, seen: Date.now() });
            GT.started = true; GT.over = false;
            onRoom(r);
          } else if (begun) onRoom(r);
        });
      }
      // the other player's connection: after 20 s with no heartbeat their side shows DISCONNECTED with a
      // countdown; if they are still gone after 65 s the player who stayed wins (the service agrees after 60 s)
      // leaving a live online game counts as a loss; the other player is told straight away
      function quitOnline() {
        if (!G || !G.online || G.over) return;
        const o = G.online, n = o.n; o.n++; G.over = true;
        try { reportGame('chess', 'loss', { elo: 0, xp: 5, label: `Online vs ${o.opp.name} · left the game` }); } catch (e) {}
        (async () => { try { await NET.sendMove(o.code, { t: 'leave' }, n); } catch (e) {} try { await NET.reportResult(o.code, 'loss'); } catch (e) {} })();
      }
      function watchOpponent() {
        const tok = G.tok, o = G.online;
        o.seen = o.seen || Date.now();
        let shown = false, keep = '';
        const tick = () => {
          if (!G || G.tok !== tok || G.over) return;
          const gone = Date.now() - o.seen, msg = document.getElementById('ch-msg'), bar = document.getElementById('ch-dc');
          if (gone > 20000) {
            if (!shown) { shown = true; keep = msg ? msg.innerHTML : ''; SFX.play('nope'); }
            const left = Math.max(0, Math.ceil((65000 - gone) / 1000));
            const html = `<span id="ch-dc" class="text-coral font-bold">${esc(o.opp.name)} disconnected.</span> You win in ${left}s if they don't come back.`;
            if (msg && (!bar || msg.innerHTML !== html)) msg.innerHTML = html;
            if (gone > 65000) return finish({ over: true, kind: 'disconnect', winner: G.me });
          } else if (shown) {
            shown = false; if (msg && bar) msg.innerHTML = keep; showToast(`${o.opp.name} is back.`, 'success');
          }
          gTimeout(tick, 1000);
        };
        gTimeout(tick, 1000);
      }
      // a move (or a resignation) goes to the service; the other player's screen picks it up
      function sendNet(mv) {
        const o = G.online; if (!o) return;
        const idx = o.n++;
        NET.sendMove(o.code, mv, idx).catch((e) => showToast('Connection problem: ' + (e.message || 'move not sent'), 'error'));
      }
      // the room changed: play any new moves from the other player
      function onRoom(r) {
        const o = G && G.online; if (!o || r.code !== o.code) return;
        const sv = (r.host === NET.me.id ? r.guest_seen : r.host_seen) || 0;
        if (sv && sv !== o.seenVal) { o.seenVal = sv; o.seen = Date.now(); }
        const ms = r.moves || [];
        while (o.n < ms.length) {
          const x = ms[o.n]; o.n++;
          if (x.by === NET.me.id || G.over) continue;
          if ((x.t || 'move') === 'move') {
            const mv = legal(G.st).find((q) => q.f === x.f && q.t === x.to && (q.p || null) === (x.p || null));
            if (mv && G.st.turn !== G.me) play(mv); else showToast('The game got out of step. Try leaving and rejoining the room.', 'error');
          } else if (x.t === 'resign') finish({ over: true, kind: 'oppresign', winner: G.me });
          else if (x.t === 'leave') finish({ over: true, kind: 'abandon', winner: G.me });
        }
        if (r.status === 'done' && r.result) o.result = r.result;
      }
      // while waiting for the other player: show their clock, and notice if they leave
      function netTurn() {
        if (G.over) return;
        document.getElementById('ch-status').textContent = "OPPONENT'S MOVE";
        if (G.secs) G.clock.start(G.secs + 5, 'Their time', () => {}, 8); else G.clock.idle('Their move', '...');
      }
      async function finishOnline(res, title, sub, s) {
        const o = G.online, tok = G.tok;
        document.getElementById('ch-status').textContent = title.toUpperCase();
        document.getElementById('ch-msg').textContent = sub;
        SFX.play(res === 'win' ? 'win' : res === 'loss' ? 'lose' : 'pop');
        // both players report the result; Elo changes once the service has both reports (or one player has left)
        let r = null;
        for (let k = 0; k < 36 && G && G.tok === tok; k++) {
          try { r = await NET.reportResult(o.code, res); } catch (e) { r = null; }
          if (r && r.final) break;
          await gSleep(k < 3 ? 1500 : 5000);
        }
        if (!G || G.tok !== tok) return;
        let eloRow = ['Ranked Elo', o.ranked ? 'Waiting for your opponent...' : 'Friendly game', 'text-muted'];
        let delta = 0;
        if (r && r.final && r.disputed) eloRow = ['Ranked Elo', 'Results did not match: no change', 'text-coral'];
        else if (r && r.final && o.ranked) {
          const iAmHost = o.isHost;
          const newElo = iAmHost ? r.host_elo : r.guest_elo; delta = iAmHost ? r.delta_host : -r.delta_host;
          eloRow = ['Ranked Elo', `${newElo} (${delta >= 0 ? '+' : ''}${delta})`, delta >= 0 ? 'text-emerald' : 'text-coral'];
        }
        NP.last = { code: o.code, game: 'chess', sel: { clock: G.secs }, ranked: o.ranked, uids: [NET.me.id, o.opp.id], names: { [NET.me.id]: NET.me.name, [o.opp.id]: o.opp.name } };
        const g = gstat('chess'); g.online = (g.online || 0) + 1; if (res === 'win' && s.kind === 'mate') g.mates = (g.mates || 0) + 1;
        reportGame('chess', res, { elo: delta, xp: res === 'win' ? 50 : res === 'draw' ? 25 : 15, label: `Online vs ${o.opp.name} · ${G.hist.length} moves` });
        gTimeout(() => gameResult({ title, sub, tone: res === 'loss' ? 'coral' : 'amber', sprite: res === 'win' ? 'trophy' : 'anchor', rows: [['Opponent', `${o.opp.avatar} ${o.opp.name}`, 'text-bone'], ['Moves', Math.ceil(G.hist.length / 2)], eloRow], againLabel: 'Play again', again: () => open(document.getElementById('game-root')) }), 500);
      }

      function humanTurn() {
        if (G.over) return;
        document.getElementById('ch-status').textContent = 'YOUR MOVE';
        if (G.secs) G.clock.start(G.secs, 'Your time', () => {
          if (G.over || G.st.turn !== G.me) return;
          const mv = pick(legal(G.st));
          showToast("Time's up! A move was played for you.", 'error');
          play(mv);
        }, 8); else G.clock.idle('No timer', '∞');
      }

      function aiTurn() {
        if (G.over) return;
        document.getElementById('ch-status').textContent = 'AI THINKING...';
        G.clock.idle('AI turn', '...');
        const tok = G.tok;
        gTimeout(() => {
          if (!G || G.tok !== tok || G.over) return;
          const mv = bestMove(G.st, G.lvl);
          if (mv) play(mv); else finish(status(G.st, G.seen));
        }, (G.slideMs || 0) + 650);
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
        if (s.over) { if (G.online && mover === G.me) sendNet({ t: 'move', f: m.f, to: m.t, p: m.p || null }); const tok = G.tok; gTimeout(() => { if (G && G.tok === tok) finish(s); }, G.slideMs + 150); G.over = true; G.clock.stop(); return; }
        if (G.online && mover === G.me) sendNet({ t: 'move', f: m.f, to: m.t, p: m.p || null });
        if (st.turn === G.me) humanTurn(); else oppTurn();
      }

      function finish(s) {
        G.over = true;
        G.clock.stop();
        render();
        const meW = G.me === 'w';
        let res = 'draw', title = 'Draw', sub = '';
        if (s.winner) { res = s.winner === G.me ? 'win' : 'loss'; }
        if (s.kind === 'mate') sub = res === 'win' ? (G.online ? 'Checkmate! You won.' : 'Checkmate! You beat the AI.') : G.online ? 'Checkmate. Good game!' : 'Checkmate. The AI got you this time.';
        else if (s.kind === 'resign') sub = 'You resigned.';
        else if (s.kind === 'oppresign') sub = 'Your opponent resigned.';
        else if (s.kind === 'abandon') sub = 'Your opponent left the game. You win!';
        else if (s.kind === 'disconnect') sub = 'Your opponent disconnected. You win!';
        else if (s.kind === 'stalemate') sub = 'Stalemate: no legal moves but not in check.';
        else if (s.kind === 'fifty') sub = 'Draw by the 50-move rule.';
        else if (s.kind === 'repetition') sub = 'Draw by threefold repetition.';
        else sub = 'Draw: not enough pieces left to checkmate.';
        title = res === 'win' ? 'Victory!' : res === 'loss' ? 'Defeat' : 'Draw';
        if (G.online) return finishOnline(res, title, sub, s);
        const eloTab = { win: [10, 16, 24], loss: [-6, -9, -12], draw: [1, 2, 4] };
        const elo = eloTab[res][G.lvl - 1];
        const g = gstat('chess');
        if (res === 'win' && s.kind === 'mate') g.mates = (g.mates || 0) + 1;
        reportGame('chess', res, { elo, xp: res === 'win' ? 20 + G.lvl * 15 : res === 'draw' ? 20 : 12, label: `vs ${LV[G.lvl - 1]} AI · ${G.hist.length} moves` });
        document.getElementById('ch-status').textContent = title.toUpperCase();
        document.getElementById('ch-msg').textContent = sub;
        SFX.play(res === 'win' ? 'win' : res === 'loss' ? 'lose' : 'pop');
        gTimeout(() => gameResult({ title, sub, tone: res === 'loss' ? 'coral' : 'amber', sprite: res === 'win' ? 'trophy' : 'anchor', rows: [['Moves', Math.ceil(G.hist.length / 2)], ['Elo', elo > 0 ? '+' + elo : String(elo), elo >= 0 ? 'text-emerald' : 'text-coral'], ['Level', LV[G.lvl - 1], 'text-amber']], againLabel: 'New Game', again: () => open(document.getElementById('game-root')) }), 900);
      }

      function onSquare(i) {
        if (!G || G.over || G.st.turn !== G.me || G.promo) return;
        const p = G.st.b[i];
        if (G.sel !== null) {
          const mv = G.targets.filter((m) => m.t === i);
          if (mv.length) {
            if (mv.length > 1) return askPromo(mv); // promotion
            return play(mv[0]);
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
        el.querySelectorAll('button').forEach((b) => { b.onclick = () => { const m = mv.find((x) => x.p === b.dataset.p); G.promo = null; el.className = 'hidden'; play(m); }; });
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
        const meN = profile.username, aiN = G.online ? `${esc(G.online.opp.name)} <span class="pix text-xs text-muted">${G.online.opp.elo}</span>` : 'AI (' + LV[G.lvl - 1] + ')';
        const mine = G.me === 'w' ? G.capB : G.capW, theirs = G.me === 'w' ? G.capW : G.capB;
        document.getElementById('ch-bot').innerHTML = `<span class="flex items-center gap-2 font-display font-extrabold text-sm"><span class="avatar-tile w-8 h-8 text-lg">${profile.avatar}</span>${esc(meN)}</span><span class="flex">${cap(mine)}</span>`;
        document.getElementById('ch-top').innerHTML = `<span class="flex items-center gap-2 font-display font-extrabold text-sm"><span class="avatar-tile w-8 h-8 text-lg">${G.online ? esc(G.online.opp.avatar) : '🤖'}</span>${aiN}</span><span class="flex">${cap(theirs)}</span>`;
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
        open, close() {
          if (G && G.online && !G.over) {
            quitOnline(); G.over = true;
          }
          if (netOff) { netOff(); netOff = null; } G = null;
        },
      };
      registerGame(mod);
    })();

