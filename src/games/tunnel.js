    /* =========================================================================
       MINE SABOTEURS (original game, Nov 2026): a hidden-team digging game for 3-6 players.
       Everyone is secretly a DIGGER or a RASCAL. Diggers want to dig a tunnel from the entrance to the gold, which is
       under one of three hidden goal stones. Rascals pretend to help, but play dead ends, cave-ins and broken tools.
       Turn: play one card (a tunnel piece, or an action) or throw one away, then draw. Gold reached = Diggers win;
       everybody out of cards first = Rascals win. Tunnel pieces: exits N=1 E=2 S=4 W=8; "dead" pieces don't connect
       their exits to each other (the tunnel stops there).
       ========================================================================= */
    (function tunnelGame() {
      const N_ = 1, E_ = 2, S_ = 4, W_ = 8, DIRS = [[N_, 0, -1, S_], [E_, 1, 0, W_], [S_, 0, 1, N_], [W_, -1, 0, E_]];
      const X0 = -2, X1 = 10, Y0 = -5, Y1 = 5, GOALS = [[8, -2], [8, 0], [8, 2]];
      const ABORT = { a: 1 };
      const BOTS = [['Dusty', '🦡'], ['Nugget', '🐹'], ['Gravel', '🦔'], ['Pebble', '🐭'], ['Flint', '🦊']];
      const ROLES = { 3: [1, 3], 4: [1, 4], 5: [2, 5], 6: [2, 6] };   // [rascals, players]
      const rot = (e) => ((e << 2) | (e >> 2)) & 15;                 // turned upside down
      const TOOLS = { pick: '⛏', lamp: '🔦' };

      /* ---------- the deck ---------- */
      function buildDeck(shuffle) {
        const d = [], t = (e, n, dead) => { for (let i = 0; i < n; i++) d.push({ k: 'tun', e, dead: !!dead }); };
        t(15, 5); t(7, 4); t(14, 4); t(5, 3); t(10, 5); t(6, 4); t(12, 4);        // open tunnels
        t(15, 1, 1); t(7, 1, 1); t(14, 1, 1); t(5, 1, 1); t(10, 1, 1); t(6, 1, 1); t(12, 1, 1); t(4, 1, 1); t(2, 1, 1);   // dead ends
        const a = (k, tool, n) => { for (let i = 0; i < n; i++) d.push({ k, tool }); };
        a('break', 'pick', 3); a('break', 'lamp', 3); a('fix', 'pick', 3); a('fix', 'lamp', 3); a('map', null, 5); a('rock', null, 3);
        d.forEach((c, i) => { c.id = i; });
        return shuffle(d);
      }

      /* ---------- the board (pure functions, used by the tests too) ---------- */
      const key = (x, y) => x + ',' + y;
      function newBoard(goldAt) {
        const b = new Map();
        b.set(key(0, 0), { e: 15, start: true });
        GOALS.forEach(([x, y], i) => b.set(key(x, y), { e: 15, goal: i, gold: i === goldAt, open: false }));
        return b;
      }
      // the tunnel squares you can reach from the entrance (dead pieces are reached but don't lead on)
      function reach(b) {
        const seen = new Set([key(0, 0)]), out = new Set(), q = [[0, 0]];
        while (q.length) {
          const [x, y] = q.shift(), c = b.get(key(x, y));
          if (c.dead || (c.goal !== undefined && !c.open)) continue;
          out.add(key(x, y));
          for (const [d, dx, dy, od] of DIRS) {
            if (!(c.e & d)) continue;
            const k = key(x + dx, y + dy), n = b.get(k);
            if (!n || seen.has(k) || !(n.e & od)) continue;
            seen.add(k); q.push([x + dx, y + dy]);
          }
        }
        return out;
      }
      // can tunnel piece {e, dead} go at (x, y)? every side must match its neighbours, and it must join the tunnel
      function fits(b, x, y, e, R) {
        if (x < X0 || x > X1 || y < Y0 || y > Y1 || b.has(key(x, y))) return false;
        let joins = false, any = false;
        for (const [d, dx, dy, od] of DIRS) {
          const n = b.get(key(x + dx, y + dy)); if (!n) continue;
          if (n.goal !== undefined && !n.open) continue;               // hidden goal stones don't mind
          any = true;
          if (!!(e & d) !== !!(n.e & od)) return false;
          if ((e & d) && R.has(key(x + dx, y + dy))) joins = true;
        }
        return any && joins;
      }
      function spots(b, card, R) {
        R = R || reach(b); const out = [];
        for (let x = X0; x <= X1; x++) for (let y = Y0; y <= Y1; y++) for (const r of [0, 1]) { const e = r ? rot(card.e) : card.e; if (fits(b, x, y, e, R) && !(r && e === card.e)) out.push([x, y, r]); }
        return out;
      }
      // goal stones touched by the tunnel get turned over
      function touchedGoals(b) {
        const R = reach(b), out = [];
        GOALS.forEach(([gx, gy], i) => {
          const g = b.get(key(gx, gy)); if (g.open) return;
          for (const [d, dx, dy] of DIRS) { const k = key(gx - dx, gy - dy), n = b.get(k); if (n && R.has(k) && (n.e & d)) { out.push(i); return; } }
        });
        return out;
      }
      // how close the open tunnel ends are to (tx, ty): smaller is better for diggers
      function closeness(b, tx, ty) {
        const R = reach(b); let best = 99;
        R.forEach((k) => { const [x, y] = k.split(',').map(Number), c = b.get(k);
          for (const [d, dx, dy] of DIRS) { if (!(c.e & d)) continue; const nx = x + dx, ny = y + dy; if (b.has(key(nx, ny)) && !(b.get(key(nx, ny)).goal !== undefined && !b.get(key(nx, ny)).open)) continue; best = Math.min(best, Math.abs(nx - tx) + Math.abs(ny - ty)); } });
        return best;
      }

      /* ---------- the computer ---------- */
      function botMove(G, p) {
        const b = G.board, R = reach(b), hand = p.hand, rascal = p.role === 'rascal';
        // aim for the gold if I know where it is, otherwise for a stone that might still hide it (the middle one first)
        const isStone = (i) => p.knows[i] === 'stone' || G.goals[i] === 'stone';
        const goldI = [0, 1, 2].find((i) => p.knows[i] === 'gold' || G.goals[i] === 'gold');
        const goal = { i: goldI !== undefined ? goldI : [1, 0, 2].find((i) => !isStone(i)) ?? 1 };
        const [tx, ty] = GOALS[goal.i];
        const broken = Object.keys(p.broken).filter((t) => p.broken[t]);
        // fix my own tools first
        for (const t of broken) { const i = hand.findIndex((c) => c.k === 'fix' && c.tool === t); if (i >= 0) return { t: 'act', i, target: p.seat }; }
        const before = closeness(b, tx, ty);
        let best = null;
        if (!broken.length) hand.forEach((c, i) => {
          if (c.k !== 'tun') return;
          for (const [x, y, r] of spots(b, c, R)) {
            const b2 = new Map(b); b2.set(key(x, y), { e: r ? rot(c.e) : c.e, dead: c.dead });
            const after = closeness(b2, tx, ty);
            let sc = rascal ? (c.dead ? 6 - Math.abs(x - tx) - Math.abs(y - ty) * 0.5 : after - before) : before - after - (c.dead ? 9 : 0);
            sc += Math.random() * 0.4;
            if (!best || sc > best.sc) best = { sc, t: 'tun', i, x, y, r };
          }
        });
        if (best && best.sc > (rascal ? 1 : 0.5)) return best;
        // maps: look at an unknown goal
        const mi = hand.findIndex((c) => c.k === 'map'); const unk = GOALS.map((_, i) => i).filter((i) => !p.knows[i] && !b.get(key(...GOALS[i])).open);
        if (mi >= 0 && unk.length && !rascal) return { t: 'map', i: mi, g: unk.includes(1) ? 1 : unk[0] };
        // breaking tools: rascals hit the busiest digger; diggers hit whoever looks most like a rascal
        const bi = hand.findIndex((c) => c.k === 'break');
        if (bi >= 0) {
          const tool = hand[bi].tool, others = G.players.filter((q) => q !== p && !q.broken[tool]);
          const pickT = rascal ? others.sort((a, c) => (c.dug || 0) - (a.dug || 0))[0] : others.filter((q) => (p.sus[q.seat] || 0) >= 2).sort((a, c) => (p.sus[c.seat] || 0) - (p.sus[a.seat] || 0))[0];
          if (pickT) return { t: 'act', i: bi, target: pickT.seat };
        }
        // rascals: cave in the tunnel piece nearest the gold
        const ri = hand.findIndex((c) => c.k === 'rock');
        if (ri >= 0 && rascal) { let bestR = null; R.forEach((k) => { const c = b.get(k); if (c.start || c.goal !== undefined) return; const [x, y] = k.split(',').map(Number), d = Math.abs(x - tx) + Math.abs(y - ty); if (!bestR || d < bestR.d) bestR = { d, x, y }; }); if (bestR && bestR.d <= 4) return { t: 'rock', i: ri, x: bestR.x, y: bestR.y }; }
        // diggers: clear a dead end that blocks the way
        if (ri >= 0 && !rascal) { for (const [k, c] of b) { if (!c.dead) continue; const [x, y] = k.split(',').map(Number); if (Math.abs(x - tx) + Math.abs(y - ty) < before + 1) return { t: 'rock', i: ri, x, y }; } }
        if (best && !rascal && best.sc >= 0) return best;
        // help a broken friend
        const fi = hand.findIndex((c) => c.k === 'fix');
        if (fi >= 0) { const tool = hand[fi].tool, f = G.players.find((q) => q.broken[tool] && (p.sus[q.seat] || 0) < 1 && !rascal); if (f) return { t: 'act', i: fi, target: f.seat }; }
        // otherwise throw the least useful card away
        const order = (c) => (rascal ? (c.k === 'tun' && !c.dead ? 0 : 5) : c.k === 'tun' && c.dead ? 0 : c.k === 'tun' ? 4 : 2);
        let di = 0; hand.forEach((c, i) => { if (order(c) < order(hand[di])) di = i; });
        return { t: 'discard', i: di };
      }

      /* ---------- art ---------- */
      function tileSVG(c, o = {}) {
        if (!c) return '';
        if (c.goal !== undefined && !c.open) return `<svg viewBox="0 0 40 40" shape-rendering="crispEdges"><rect width="40" height="40" fill="#3B2A1C"/><rect x="3" y="3" width="34" height="34" fill="#7A6A5A"/><rect x="8" y="9" width="10" height="7" fill="#958473"/><rect x="21" y="20" width="12" height="9" fill="#958473"/><text x="20" y="27" text-anchor="middle" font-family="Arcade Pixel, monospace" font-size="18" fill="#F7F4EC">?</text>${o.peek ? `<text x="20" y="38" text-anchor="middle" font-size="9">${o.peek === 'gold' ? '💰' : '🪨'}</text>` : ''}</svg>`;
        const e = c.e, P = '#E8C98E', D = '#4A3523';
        let s = `<svg viewBox="0 0 40 40" shape-rendering="crispEdges"><rect width="40" height="40" fill="${D}"/><rect x="1" y="1" width="38" height="38" fill="#6B4F35"/><rect x="4" y="5" width="5" height="3" fill="#7D5E40"/><rect x="29" y="31" width="6" height="3" fill="#7D5E40"/>`;
        if (e & N_) s += `<rect x="14" y="0" width="12" height="${c.dead ? 11 : 20}" fill="${P}"/>`;
        if (e & S_) s += `<rect x="14" y="${c.dead ? 29 : 20}" width="12" height="${c.dead ? 11 : 20}" fill="${P}"/>`;
        if (e & W_) s += `<rect x="0" y="14" width="${c.dead ? 11 : 20}" height="12" fill="${P}"/>`;
        if (e & E_) s += `<rect x="${c.dead ? 29 : 20}" y="14" width="${c.dead ? 11 : 20}" height="12" fill="${P}"/>`;
        if (!c.dead && e) s += `<rect x="14" y="14" width="12" height="12" fill="${P}"/>`;
        if (c.dead) s += `<rect x="12" y="12" width="16" height="16" fill="#3B2A1C"/><rect x="14" y="14" width="6" height="5" fill="#8A7A6A"/><rect x="20" y="20" width="6" height="5" fill="#8A7A6A"/>`;
        if (c.start) s += `<rect x="13" y="13" width="14" height="14" fill="#2DD4BF"/><rect x="17" y="10" width="6" height="20" fill="#050E18"/><rect x="10" y="17" width="20" height="6" fill="#050E18"/>`;
        if (c.goal !== undefined) s += c.gold ? `<rect x="11" y="12" width="18" height="16" fill="#050E18"/><rect x="13" y="14" width="14" height="12" fill="#F5B041"/><rect x="15" y="15" width="4" height="3" fill="#FFF3C4"/>` : `<rect x="12" y="13" width="16" height="14" fill="#050E18"/><rect x="14" y="15" width="12" height="10" fill="#9DB4CC"/>`;
        return s + '</svg>';
      }
      function cardHTML(c, o = {}) {
        if (c.k === 'tun') return `<div class="tt-card tun ${o.cls || ''}" ${o.data || ''}>${tileSVG(o.flip ? Object.assign({}, c, { e: rot(c.e) }) : c)}${c.dead ? '<i class="tt-dead">DEAD END</i>' : ''}</div>`;
        const lab = { break: `Break ${c.tool === 'pick' ? 'pick' : 'lamp'}`, fix: `Fix ${c.tool === 'pick' ? 'pick' : 'lamp'}`, map: 'Treasure map', rock: 'Cave-in' }[c.k];
        const ic = { break: `${TOOLS[c.tool]}<b class="tt-x">✕</b>`, fix: `${TOOLS[c.tool]}<b class="tt-ok">✓</b>`, map: '🗺️', rock: '🪨' }[c.k];
        return `<div class="tt-card act ${c.k} ${o.cls || ''}" ${o.data || ''}><span class="tt-ic">${ic}</span><span class="tt-lab">${lab}</span></div>`;
      }

      /* ---------- the game ---------- */
      let G = null;
      const $ = (id) => document.getElementById(id);
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1300px] mx-auto');
        setupScreen(body, mod, [
          { key: 'n', label: 'PLAYERS', def: 4, choices: [[3, '3'], [4, '4'], [5, '5'], [6, '6']] },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(BOTS.slice(0, +sel.n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel)));
      }
      function start(body, sel, S) {
        const n = S.seats.length, [ras] = ROLES[n] || [1];
        // roles are dealt from one card more than there are players, so nobody can be sure how many Rascals there are
        const roles = S.rng.shuffle(Array.from({ length: n + 1 }, (_, i) => (i < ras ? 'rascal' : 'digger'))).slice(0, n);
        const deck = buildDeck(S.rng.shuffle), gold = S.rng.rnd(3), hs = n >= 6 ? 5 : 6;
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, role: roles[i], hand: [], broken: { pick: false, lamp: false }, knows: {}, sus: {}, dug: 0 }));
        players.forEach((p) => { for (let k = 0; k < hs; k++) p.hand.push(deck.pop()); });
        G = { S, me: S.online ? S.me : 0, players, deck, board: newBoard(gold), goals: ['?', '?', '?'], cur: S.rng.rnd(n), step: 0, over: false, tok: ++GT.cur, log: [], sel: null, flip: false };
        GT.started = true; GT.over = false;
        const me = G.players[G.me];
        body.innerHTML = `<div class="tt-wrap grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
          <div class="space-y-3 min-w-0">
            <div class="tt-role ${me.role}">${me.role === 'rascal' ? '😈 You are a <b>RASCAL</b>: secretly stop the tunnel reaching the gold.' : '⛏ You are a <b>DIGGER</b>: dig a tunnel to the gold. Watch out for Rascals!'}</div>
            <div class="tt-boardbox"><div id="tt-board" class="tt-board"></div></div>
            <div id="tt-prompt" class="win p-3 text-center text-sm min-h-[46px]"></div>
            <div id="tt-hand" class="tt-hand"></div></div>
          <div class="space-y-3 min-w-0"><div class="win overflow-hidden"><div class="winbar amber"><span id="tt-status">MINE SABOTEURS</span><span class="pix text-xs" id="tt-deck"></span></div><div class="p-3 space-y-2" id="tt-players"></div></div>
            <div id="tt-log" class="logbox" style="height:200px"></div><button id="tt-quit" class="btn-game btn-coral w-full py-2 text-sm">${S.online ? 'Leave table' : 'Give up'}</button></div></div>`;
        S.track();
        S.onLeft = (a) => { if (!G) return; const q = G.players[a.s]; q.name += ' (CPU)'; q.av = '🤖'; log(`${nm(q)} ${a.t === '_gone' ? 'disconnected' : 'left'}. A computer player takes over.`); draw(); };
        npBar('');
        let sure = false;
        $('tt-quit').onclick = (e) => { if (S.online) return npConfirmLeave(() => open($('game-root'))); if (!sure) { sure = true; e.target.textContent = 'Really give up?'; gTimeout(() => { sure = false; e.target.textContent = 'Give up'; }, 3000); return; } if (!G.over) { G.tok++; finish(null, 'gave up'); } };
        log(`The gold is under one of the three stones on the right. ${nm(G.players[G.cur])} starts.`);
        draw();
        run().catch((e) => { if (e !== ABORT) throw e; });
      }
      async function W(ms) { const t = G && G.tok; await gSleep(window.__fast ? Math.min(ms, 30) : ms); if (!G || G.tok !== t) throw ABORT; }
      const log = (t) => { G.log.push(t); const el = $('tt-log'); if (el) { el.innerHTML = G.log.slice(-40).map((x) => `<div>${x}</div>`).join(''); el.scrollTop = el.scrollHeight; } };
      const prompt = (h) => { const e = $('tt-prompt'); if (e) e.innerHTML = h; };
      const nm = (p) => `<b>${esc(p.name)}</b>`;
      const isMe = (p) => p.seat === G.me;

      async function run() {
        let passes = 0;
        while (G && !G.over) {
          const p = G.players[G.cur];
          if (p.hand.length) { await turn(p); passes = 0; } else passes++;
          if (G.over) return;
          if (G.players.every((q) => !q.hand.length) || passes > G.players.length) { G.tok++; return finish('rascal', 'Everyone ran out of cards before reaching the gold.'); }
          G.cur = (G.cur + 1) % G.players.length;
          draw();
        }
      }
      async function turn(p) {
        const S = G.S, t = G.tok, k = ++G.step, mine = S.mine(p.seat);
        $('tt-status').textContent = mine ? 'YOUR TURN' : `${p.name.toUpperCase()}'S TURN`;
        G.sel = null; G.flip = false;
        if (mine) { G.myK = k; prompt('Tap a card in your hand to use it, or throw one away.'); } else prompt(`<span class="text-muted">${esc(p.name)} is thinking...</span>`);
        draw();
        const a = await S.ask(p.seat, () => Object.assign({ t: 'x', k }, botMove(G, p)), 900 + rnd(800), (x) => x.s === p.seat && x.k === k);
        if (!G || G.tok !== t) throw ABORT;
        G.myK = null; prompt('');
        await doMove(p, a);
        if (G.over) return;
        if (G.deck.length) p.hand.push(G.deck.pop());
        draw();
        await W(350);
      }
      // carry out a decision (every screen does the same); anything that doesn't fit counts as throwing the card away
      async function doMove(p, a) {
        const c = p.hand[a.i]; if (!c) return;
        const b = G.board, R = reach(b);
        const card = () => p.hand.splice(a.i, 1)[0];
        if (a.t === 'tun' && c.k === 'tun' && !p.broken.pick && !p.broken.lamp) {
          const e = a.r ? rot(c.e) : c.e;
          if (fits(b, a.x, a.y, e, R)) {
            card(); b.set(key(a.x, a.y), { e, dead: c.dead, by: p.seat, id: c.id }); p.dug = (p.dug || 0) + 1;
            if (c.dead) G.players.forEach((q) => { if (q !== p) q.sus[p.seat] = (q.sus[p.seat] || 0) + 1.5; });
            SFX.play('card'); log(`${nm(p)} digs ${c.dead ? 'a <b class="text-coral">dead end</b>' : 'a tunnel'}.`);
            G.lastAt = key(a.x, a.y); draw(); await W(500);
            for (const gi of touchedGoals(b)) {
              const g = b.get(key(...GOALS[gi])); g.open = true; G.goals[gi] = g.gold ? 'gold' : 'stone';
              G.players.forEach((q) => { q.knows[gi] = G.goals[gi]; });
              SFX.play(g.gold ? 'coin' : 'nope'); log(g.gold ? `The tunnel reaches the <b class="text-amber">GOLD</b>! 💰` : 'The tunnel reaches a goal stone... just rock. 🪨');
              draw(); await W(900);
              if (g.gold) { G.tok++; finish('digger', `${p.name} dug through to the gold!`); return; }
            }
            return;
          }
        }
        if (a.t === 'act' && (c.k === 'break' || c.k === 'fix')) {
          const q = G.players[a.target];
          if (q && c.k === 'break' && !q.broken[c.tool] && q !== p) {
            card(); q.broken[c.tool] = true; SFX.play('crash');
            G.players.forEach((o) => { if (o !== p && o !== q && o.role !== 'rascal') o.sus[p.seat] = (o.sus[p.seat] || 0) + ((o.sus[q.seat] || 0) >= 2 ? -1 : 1); });
            q.sus[p.seat] = (q.sus[p.seat] || 0) + 2;
            log(`${nm(p)} breaks ${isMe(q) ? 'your' : nm(q) + '’s'} ${c.tool === 'pick' ? 'pick ⛏' : 'lamp 🔦'}! They can’t dig until it’s fixed.`);
            gFly('#tt-hand', '#tt-pl-' + q.seat, `<span style="font-size:30px">${TOOLS[c.tool]}</span>`, { ms: 500, arc: 60 });
            draw(); await W(700); return;
          }
          if (q && c.k === 'fix' && q.broken[c.tool]) {
            card(); q.broken[c.tool] = false; SFX.play('coin');
            if (q !== p) G.players.forEach((o) => { if (o !== p) o.sus[p.seat] = (o.sus[p.seat] || 0) - 0.5; });
            log(`${nm(p)} fixes ${q === p ? 'their own' : isMe(q) ? 'your' : nm(q) + '’s'} ${c.tool === 'pick' ? 'pick ⛏' : 'lamp 🔦'}.`);
            draw(); await W(600); return;
          }
        }
        if (a.t === 'map' && c.k === 'map' && GOALS[a.g] && !b.get(key(...GOALS[a.g])).open) {
          card(); const g = b.get(key(...GOALS[a.g])); p.knows[a.g] = g.gold ? 'gold' : 'stone';
          SFX.play('reveal'); log(`${nm(p)} looks at a goal stone with a treasure map.`);
          if (isMe(p) && G.S.mine(p.seat)) showToast(g.gold ? '🗺️ The GOLD is under that stone! 💰' : '🗺️ Only rock under that stone. 🪨', g.gold ? 'success' : 'info');
          draw(); await W(600); return;
        }
        if (a.t === 'rock' && c.k === 'rock') {
          const t = b.get(key(a.x, a.y));
          if (t && !t.start && t.goal === undefined) {
            card(); b.delete(key(a.x, a.y)); SFX.play('crash');
            if (!t.dead) G.players.forEach((q) => { if (q !== p) q.sus[p.seat] = (q.sus[p.seat] || 0) + 1; });
            log(`${nm(p)} causes a <b>cave-in</b>! A ${t.dead ? 'dead end' : 'tunnel piece'} is gone.`);
            draw(); await W(600); return;
          }
        }
        // throw it away
        const thrown = card(); SFX.play('draw');
        log(`${nm(p)} throws a card away.`);
        if (thrown) { /* face down: nobody sees it */ }
      }

      /* ---------- my turn: choosing a card and where it goes ---------- */
      function pickCard(i) {
        if (!G || !G.myK || G.over) return;
        G.sel = G.sel === i ? null : i; G.flip = false; SFX.play('click');
        const c = G.players[G.me].hand[i];
        if (G.sel === null) prompt('Tap a card in your hand to use it, or throw one away.');
        else prompt(hint(c));
        draw();
      }
      function hint(c) {
        const me = G.players[G.me], brk = me.broken.pick || me.broken.lamp;
        const bar = (txt) => `<div class="flex items-center justify-center gap-2 flex-wrap"><span>${txt}</span>${c.k === 'tun' && !brk ? '<button id="tt-flip" class="btn-game btn-graphite py-1.5 px-3 text-xs">↻ Turn it</button>' : ''}<button id="tt-throw" class="btn-game btn-graphite py-1.5 px-3 text-xs">🗑 Throw away</button></div>`;
        if (c.k === 'tun') return bar(brk ? 'Your tools are broken, so you can’t dig. Fix them first, or throw a card away.' : 'Tap a glowing square on the map to dig there.');
        if (c.k === 'break') return bar(`Tap a player on the right to break their ${c.tool === 'pick' ? 'pick ⛏' : 'lamp 🔦'}.`);
        if (c.k === 'fix') return bar(`Tap a player (or yourself) with a broken ${c.tool === 'pick' ? 'pick ⛏' : 'lamp 🔦'} to fix it.`);
        if (c.k === 'map') return bar('Tap one of the three ? stones to secretly look under it.');
        return bar('Tap a tunnel piece on the map to make it cave in.');
      }
      const send = (a) => { if (!G.myK) return; const k = G.myK; G.myK = null; G.sel = null; prompt(''); G.S.act(Object.assign({ s: G.me, k }, a)); };

      function draw() {
        const bd = $('tt-board'); if (!bd || !G) return;
        const b = G.board, me = G.players[G.me], c = G.sel !== null ? me.hand[G.sel] : null, R = reach(b);
        const canDig = c && c.k === 'tun' && !me.broken.pick && !me.broken.lamp;
        const ok = new Set(canDig ? spots(b, c, R).filter(([, , r]) => !!r === G.flip || (rot(c.e) === c.e)).map(([x, y]) => key(x, y)) : []);
        let h = '';
        for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
          const k = key(x, y), t = b.get(k);
          const tgt = (c && c.k === 'rock' && t && !t.start && t.goal === undefined) || (c && c.k === 'map' && t && t.goal !== undefined && !t.open);
          h += `<div class="tt-cell ${ok.has(k) ? 'ok' : ''} ${tgt ? 'tgt' : ''} ${G.lastAt === k ? 'last' : ''}" data-x="${x}" data-y="${y}">${t ? tileSVG(t, { peek: t.goal !== undefined && !t.open ? me.knows[t.goal] : null }) : ok.has(k) ? `<div class="tt-ghost">${tileSVG(Object.assign({}, c, { e: G.flip ? rot(c.e) : c.e }))}</div>` : ''}</div>`;
        }
        bd.innerHTML = h;
        bd.querySelectorAll('.tt-cell.ok').forEach((el) => { el.onclick = () => send({ t: 'tun', i: G.sel, x: +el.dataset.x, y: +el.dataset.y, r: G.flip ? 1 : 0 }); });
        bd.querySelectorAll('.tt-cell.tgt').forEach((el) => { el.onclick = () => { const x = +el.dataset.x, y = +el.dataset.y; if (c.k === 'rock') send({ t: 'rock', i: G.sel, x, y }); else send({ t: 'map', i: G.sel, g: GOALS.findIndex(([gx, gy]) => gx === x && gy === y) }); }; });
        // players
        const S = G.S, cur = G.players[G.cur];
        $('tt-players').innerHTML = G.players.map((q) => {
          const tg = c && ((c.k === 'break' && q !== me && !q.broken[c.tool]) || (c.k === 'fix' && q.broken[c.tool]));
          const role = G.over ? `<span class="tt-rl ${q.role}">${q.role === 'rascal' ? 'RASCAL' : 'DIGGER'}</span>` : '';
          return `<button id="tt-pl-${q.seat}" class="pl-tag tt-pl flex items-center gap-2.5 w-full text-left ${cur === q && !G.over ? 'turn' : ''} ${isMe(q) ? 'me' : ''} ${tg ? 'tgt' : ''}" style="--pc:${q.role === 'rascal' && (G.over || isMe(q)) ? '#FB7185' : '#2DD4BF'}" data-seat="${q.seat}" ${tg ? '' : 'disabled'}>
            <span class="tg-av">${esc(q.av)}</span><span class="min-w-0 flex-1"><b class="block truncate text-bone text-sm">${esc(q.name)}${isMe(q) ? ' (you)' : ''} ${role}</b><small class="text-muted text-xs">${q.hand.length} cards</small></span>
            <span class="tt-tools">${Object.keys(TOOLS).map((t) => `<i class="${q.broken[t] ? 'bad' : ''}" title="${t}${q.broken[t] ? ' (broken)' : ''}">${TOOLS[t]}</i>`).join('')}</span></button>`;
        }).join('');
        $('tt-players').querySelectorAll('.tt-pl.tgt').forEach((el) => { el.onclick = () => send({ t: 'act', i: G.sel, target: +el.dataset.seat }); });
        $('tt-deck').textContent = `DECK ${G.deck.length}`;
        // my hand
        $('tt-hand').innerHTML = `<div class="pix text-xs text-muted mb-1 text-center">YOUR CARDS</div><div class="flex flex-wrap justify-center gap-2">${me.hand.map((h2, i) => cardHTML(h2, { cls: `${G.sel === i ? 'sel' : ''} ${G.myK ? 'live' : ''}`, data: `data-i="${i}"`, flip: G.sel === i && G.flip })).join('')}</div>`;
        $('tt-hand').querySelectorAll('.tt-card').forEach((el) => { el.onclick = () => pickCard(+el.dataset.i); });
        const fl = $('tt-flip'); if (fl) fl.onclick = () => { G.flip = !G.flip; SFX.play('click'); draw(); };
        const th = $('tt-throw'); if (th) th.onclick = () => send({ t: 'discard', i: G.sel });
      }
      async function finish(team, why) {
        G.over = true; G.S.over = true; G.myK = null;
        const S = G.S, me = G.players[G.me], tok = G.tok, res = team === me.role ? 'win' : 'loss';
        // turn every goal stone over at the end
        GOALS.forEach(([x, y]) => { G.board.get(key(x, y)).open = true; });
        draw(); prompt('');
        const eloRow = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        const s = gstat('tunnel'); if (me.role === 'rascal') s.rascal = (s.rascal || 0) + 1; s.dug = (s.dug || 0) + (me.dug || 0);
        reportGame('tunnel', team ? res : 'loss', { elo: S.online ? 0 : res === 'win' ? 10 : -4, xp: res === 'win' ? 30 : 8, label: `${me.role === 'rascal' ? 'Rascal' : 'Digger'}${S.online ? ' · online' : ''}` });
        const rascals = G.players.filter((q) => q.role === 'rascal').map((q) => q.name).join(' and ');
        gameResult({ title: !team ? 'You gave up' : res === 'win' ? 'You win!' : team === 'digger' ? 'The Diggers win' : 'The Rascals win', sub: `${why} The Rascal${rascals.includes(' and ') ? 's were' : ' was'}: ${rascals}.`,
          tone: res === 'win' ? 'amber' : 'coral', sprite: res === 'win' ? 'trophy' : 'anchor',
          rows: [['You were', me.role === 'rascal' ? 'A RASCAL 😈' : 'A DIGGER ⛏', me.role === 'rascal' ? 'text-coral' : 'text-teal'], ['Tunnels you dug', me.dug || 0, 'text-amber']].concat(eloRow ? [eloRow] : []),
          againLabel: S.online ? 'Back to setup' : 'Play again', again: () => open($('game-root')) });
      }

      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      GICONS.tunnel = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(1, 1, 22, 22, K)}${rr(2, 2, 20, 20, '#6B4F35')}${rr(2, 10, 14, 4, '#E8C98E')}${rr(12, 10, 4, 11, '#E8C98E')}${rr(15, 4, 7, 6, K)}${rr(16, 5, 5, 4, '#F5B041')}${rr(17, 5, 2, 1, '#FFF3C4')}${rr(4, 15, 3, 2, '#7D5E40')}${rr(6, 4, 2, 7, '#9DB4CC')}${rr(4, 4, 6, 2, '#9DB4CC')}</svg>`;
      const mod = {
        id: 'tunnel', name: 'Mine Saboteurs', icon: 'tunnel', cats: ['card', 'party'], sub: '3-6 PLAYERS · ~15 MIN', color: '#F5B041', tone: 'amber', btn: 'amber',
        blurb: 'Dig a tunnel to the hidden gold together... but someone at the table is a secret Rascal trying to stop you.',
        rules: { tag: 'SECRET TEAMS · 3-6 PLAYERS', steps: [
          '<strong class="text-bone">Secret teams:</strong> Most players are <b class="text-teal">Diggers</b>. Usually one or two are secret <b class="text-coral">Rascals</b> (sometimes there are none!). Only you know which one you are.',
          '<strong class="text-bone">Your turn:</strong> Play one card, or throw one away. Then you draw a new card. Tunnel pieces must fit the tunnel next to them.',
          '<strong class="text-bone">Action cards:</strong> Break someone’s pick or lamp (they can’t dig until it’s fixed), fix one, peek under a goal stone with a treasure map, or make a tunnel piece cave in.',
          '<strong class="text-bone">Who wins:</strong> Diggers win when the tunnel reaches the gold. Rascals win if everyone runs out of cards first.',
        ], tip: 'Watch who plays dead ends and who breaks tools. That’s probably a Rascal!' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['AS RASCAL', s.rascal || 0, 'text-coral'], ['TUNNELS DUG', s.dug || 0, 'text-teal']],
        engine: { buildDeck, newBoard, reach, fits, spots, touchedGoals, botMove, rot, get G() { return G; } }, open, close() { G = null; },
        art: { card: (c) => cardHTML(c) },
        online: { seats: (sel) => +sel.n || 4, min: 3, ranked: false, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
