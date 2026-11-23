    /* =========================================================================
       DOMINOES: double-six, Draw or Block rules, you vs 1-3 bots, play to a target score
       ========================================================================= */
    (function dominoesGame() {
      const ABORT = { a: 1 };
      const SET = []; for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) SET.push({ a, b, id: a + '-' + b });
      const pips = (t) => t.a + t.b;
      const handPips = (h) => h.reduce((s, t) => s + pips(t), 0);
      const isDbl = (t) => t.a === t.b;
      // can tile t go on an end showing value v?
      const fits = (t, v) => t.a === v || t.b === v;
      // where a tile can go: 'L', 'R' (both possible, or the very first tile = 'any')
      function spots(G, t) {
        if (!G.line.length) return ['R'];
        const out = []; if (fits(t, G.L)) out.push('L'); if (fits(t, G.R) && !(G.L === G.R && out.length)) out.push('R');
        return out;
      }
      const playable = (G, h) => h.filter((t) => spots(G, t).length);
      function place(G, t, side) {
        if (!G.line.length) { G.line.push({ t, l: t.a, r: t.b }); G.L = t.a; G.R = t.b; return; }
        if (side === 'L') { const out = t.a === G.L ? t.b : t.a; G.line.unshift({ t, l: out, r: G.L }); G.L = out; }
        else { const out = t.a === G.R ? t.b : t.a; G.line.push({ t, l: G.R, r: out }); G.R = out; }
      }
      // the bot: biggest tile it can play, doubles a little earlier, and it tries to leave ends its rivals lack
      function botChoose(G, p) {
        const opts = [];
        for (const t of p.hand) for (const s of spots(G, t)) opts.push({ t, s });
        if (!opts.length) return null;
        if (G.lvl === 1) return pick(opts);
        const score = (o) => {
          let v = pips(o.t) + (isDbl(o.t) ? 3 : 0);
          const newEnd = !G.line.length ? o.t.b : o.t.a === (o.s === 'L' ? G.L : G.R) ? o.t.b : o.t.a;
          G.players.forEach((q) => { if (q !== p && q.lacks && q.lacks.has(newEnd)) v += 4; }); // they could not follow this number before
          v += p.hand.filter((x) => x !== o.t && (x.a === newEnd || x.b === newEnd)).length * 1.5; // keep my own options open
          return v + Math.random() * 0.5;
        };
        return opts.sort((x, y) => score(y) - score(x))[0];
      }

      /* ---------- drawing ---------- */
      const PIP = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
      function half(v, ox, oy) { return PIP[v].map((k) => `<circle cx="${ox + 7 + (k % 3) * 8}" cy="${oy + 7 + Math.floor(k / 3) * 8}" r="2.7" fill="#050E18"/>`).join(''); }
      // a tile; vertical = standing on end. down = face down
      function tileHTML(t, o = {}) {
        const v = !!o.vertical, a = o.flip ? t.b : t.a, b = o.flip ? t.a : t.b;
        const w = v ? 30 : 60, h = v ? 60 : 30;
        const face = o.down ? `<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" fill="#1A3856"/><rect x="5" y="5" width="${w - 10}" height="${h - 10}" fill="none" stroke="#2DD4BF" stroke-width="1.5" stroke-dasharray="3 3"/>`
          : `<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" fill="#F7F4EC"/>${v ? `<line x1="5" y1="30" x2="25" y2="30" stroke="#050E18" stroke-width="2"/>${half(a, 0, 0)}${half(b, 0, 30)}` : `<line x1="30" y1="5" x2="30" y2="25" stroke="#050E18" stroke-width="2"/>${half(a, 0, 0)}${half(b, 30, 0)}`}`;
        return `<div class="dm-tile ${v ? 'v' : 'h'} ${o.cls || ''}" ${o.fk ? `data-fk="${o.fk}" data-face="${o.down ? 'down' : 'up'}"` : ''} ${o.attrs || ''}><svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><rect x="0" y="0" width="${w}" height="${h}" fill="#050E18"/>${face}</svg></div>`;
      }

      let G = null;
      const $ = (id) => document.getElementById(id);
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1100px] mx-auto');
        setupScreen(body, mod, [
          { key: 'n', label: 'PLAYERS', def: 2, choices: [[2, '2 players'], [3, '3 players'], [4, '4 players']], hint: 'On this device the other seats are computer players. Online, empty seats get computer players.' },
          { key: 'rule', label: 'RULES', def: 'draw', choices: [['draw', 'Draw game'], ['block', 'Block game']], hint: 'Draw: if you cannot play, take tiles from the boneyard. Block: you just pass.' },
          { key: 'to', label: 'PLAY TO', def: 100, choices: [[0, 'One round'], [100, '100 points'], [150, '150 points']] },
          { key: 'lvl', label: 'BOTS', def: 2, choices: [[1, 'Easy'], [2, 'Smart']] },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(NAMES.slice(0, +sel.n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel)));
      }
      const NAMES = [['Domino Dan', '🦊'], ['Tilly', '🐢'], ['Big Ed', '🐻']];
      // seats come from the table (S): on this device seat 0 is you; online every screen has its own seat (G.me)
      function start(body, sel, S) {
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, human: S.mine(i), score: 0 }));
        G = { S, me: S.online ? S.me : 0, players, rule: sel.rule, to: +sel.to, lvl: +sel.lvl, tok: ++GT.cur, over: false, round: 0, log: [], starter: -1, played: 0, dominoes: 0 };
        S.track();
        S.onLeft = (a) => {
          if (!G) return;
          G.players[a.s].av = '🤖'; G.players[a.s].name += ' (CPU)'; G.players[a.s].human = false;
          log(`${nm(G.players[a.s])} ${a.t === '_gone' ? 'disconnected' : 'left'}. A computer player takes the seat.`);
          if (S.n === 2 && a.s !== G.me && !G.over) { G.tok++; endGame(false, a); }
          draw();
        };
        body.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-5 items-start">
          <div class="space-y-3 min-w-0" id="dm-area">
            <div id="dm-opp" class="flex gap-3 flex-wrap justify-center"></div>
            <div class="felt dm-table"><div id="dm-line" class="dm-line"></div></div>
            <div id="dm-prompt" class="win p-3 text-center min-h-[52px] text-sm"></div>
            <div id="dm-hand" class="dm-hand"></div>
          </div>
          <div class="space-y-3"><div class="win overflow-hidden"><div class="winbar amber"><span id="dm-round">ROUND 1</span><span id="dm-status" class="pix text-xs"></span></div>
            <div class="p-3 space-y-2"><div id="dm-scores" class="space-y-1.5"></div><div class="flex items-center gap-2 pt-2"><span id="dm-bone" class="dm-bone">${tileHTML(SET[0], { down: true, vertical: true })}</span><span id="dm-bonecount" class="pix text-sm text-muted"></span></div></div></div>
            <div id="dm-log" class="logbox" style="height:200px"></div>
            <button id="dm-quit" class="btn-game btn-coral w-full py-2 text-sm">${S.online ? 'Leave table' : 'Give up'}</button></div></div>`;
        let sure = false;
        $('dm-quit').onclick = (e) => {
          if (S.online) return npConfirmLeave(() => open($('game-root')));
          if (!sure) { sure = true; e.target.textContent = 'Really give up?'; gTimeout(() => { sure = false; if (G) e.target.textContent = 'Give up'; }, 3000); return; } if (!G.over) { G.tok++; endGame(true); } };
        npBar('');
        gOn(window, 'resize', () => { if (G) draw(); });
        run().catch((e) => { if (e !== ABORT) throw e; });
      }
      async function W(ms) { const t = G && G.tok; await gSleep(ms); if (!G || G.tok !== t) throw ABORT; }
      const log = (t) => { G.log.push(t); const el = $('dm-log'); if (el) { el.innerHTML = G.log.slice(-40).map((x) => `<div>${x}</div>`).join(''); el.scrollTop = el.scrollHeight; } };
      const nm = (p) => `<b>${esc(p.name)}</b>`;
      const prompt = (h) => { const e = $('dm-prompt'); if (e) e.innerHTML = h; };

      async function run() {
        while (G && !G.over) {
          await playRound();
          if (G.over) return;
          const best = Math.max(...G.players.map((p) => p.score));
          if (!G.to || best >= G.to) return endGame(false);
          await W(1600);
        }
      }
      async function playRound() {
        G.round++; G.line = []; G.L = G.R = null; G.passes = 0;
        const deck = G.S.rng.shuffle(SET.slice()), per = G.players.length === 2 ? 7 : 5;
        G.players.forEach((p) => { p.hand = deck.splice(0, per); p.lacks = new Set(); });
        G.bone = deck;
        $('dm-round').textContent = `ROUND ${G.round}${G.to ? ` · TO ${G.to}` : ''}`;
        log(`— Round ${G.round} —`);
        // first round: highest double leads (and must be played). Later: last round's winner leads with anything
        let cur, forced = null;
        if (G.starter < 0) {
          let best = -1;
          G.players.forEach((p, i) => p.hand.forEach((t) => { if (isDbl(t) && t.a > best) { best = t.a; cur = i; forced = t; } }));
          if (cur === undefined) { cur = 0; forced = null; }
        } else cur = G.starter;
        G.cur = cur;
        await W(draw() + 300);
        if (forced) { log(`${nm(G.players[cur])} has the highest double and leads.`); await playTile(G.players[cur], forced, 'R'); cur = (cur + 1) % G.players.length; G.cur = cur; }
        for (let guard = 0; guard < 400 && !G.over; guard++) {
          const p = G.players[G.cur];
          const res = await takeTurn(p);
          if (G.over) return;
          if (!p.hand.length) return roundOver(p, false);
          if (res === 'pass') { G.passes++; if (G.passes >= G.players.length) return roundOver(null, true); } else G.passes = 0;
          G.cur = (G.cur + 1) % G.players.length;
        }
      }
      // a decision by one seat: this screen's player taps, the host plays for computer seats, online players send theirs
      async function decide(p, ui, botFn, ms) {
        const S = G.S, t = G.tok, mine = S.mine(p.seat);
        if (mine) ui();
        const a = await S.ask(p.seat, botFn, ms);
        if (!G || G.tok !== t) throw ABORT;
        if (mine) prompt('');
        return a;
      }
      async function takeTurn(p) {
        const mine = G.S.mine(p.seat);
        $('dm-status').textContent = mine ? 'YOUR TURN' : p.name.toUpperCase();
        if (!mine) prompt(`<span class="text-muted">${esc(p.name)} is thinking...</span>`);
        draw();
        // no tile fits: draw from the boneyard (Draw game) or pass
        while (!playable(G, p.hand).length) {
          if (G.rule === 'draw' && G.bone.length) {
            await decide(p, () => button(`No tile fits. <button id="dm-draw" class="btn-game btn-amber py-1.5 px-5 text-sm ml-2">Draw a tile</button>`, 'dm-draw', { t: 'draw', s: p.seat }), () => ({ t: 'draw' }), 650);
            p.hand.push(G.bone.shift()); SFX.play('draw'); log(`${nm(p)} draws from the boneyard.`);
            await W(draw() + 150);
          } else {
            [G.L, G.R].forEach((v) => p.lacks.add(v));
            await decide(p, () => button(`No tile fits${G.rule === 'draw' ? ' and the boneyard is empty' : ''}. <button id="dm-pass" class="btn-game btn-graphite py-1.5 px-5 text-sm ml-2">Pass</button>`, 'dm-pass', { t: 'pass', s: p.seat }), () => ({ t: 'pass' }), 800);
            log(`${nm(p)} passes.`); SFX.play('nope'); prompt('');
            return 'pass';
          }
        }
        const a = await decide(p, () => humanChoose(p).then((ch) => G && G.S.act({ t: 'play', s: p.seat, id: ch.t.id, side: ch.s })),
          () => { const ch = botChoose(G, p); return { t: 'play', id: ch.t.id, side: ch.s }; }, 800 + rnd(600));
        let t = p.hand.find((x) => x.id === a.id);
        let side = a.side;
        if (!t || !spots(G, t).includes(side)) { t = playable(G, p.hand)[0]; side = spots(G, t)[0]; }   // never happens with an honest table
        G.choose = null; G.pending = null;
        await playTile(p, t, side);
        return 'play';
      }
      function button(html, id, act) { prompt(html); const b = $(id); if (b) b.onclick = () => { b.disabled = true; G.S.act(act); }; }
      async function playTile(p, t, side) {
        p.hand.splice(p.hand.indexOf(t), 1);
        place(G, t, side);
        G.played++;
        SFX.play('move'); log(`${nm(p)} plays <b>${t.a}|${t.b}</b>.`);
        prompt('');
        await W(draw() + 250);
      }
      function ask(html, id) {
        return new Promise((res) => { prompt(html); const b = $(id); if (b) b.onclick = () => { prompt(''); res(); }; });
      }
      function humanChoose(p) {
        return new Promise((res) => {
          prompt('Tap a glowing tile to play it.');
          G.choose = (t) => {
            const sp = spots(G, t);
            if (!sp.length) { SFX.play('wrong'); return showToast(`That tile doesn't match ${G.L} or ${G.R}.`, 'error'); }
            if (sp.length === 1) { G.choose = null; return res({ t, s: sp[0] }); }
            // fits both ends: pick a side
            G.pending = t; draw();
            prompt(`Which end? <button id="dm-l" class="btn-game btn-teal py-1.5 px-4 text-sm ml-2">◀ Left (${G.L})</button><button id="dm-r" class="btn-game btn-teal py-1.5 px-4 text-sm ml-2">Right (${G.R}) ▶</button>`);
            $('dm-l').onclick = () => { G.choose = null; G.pending = null; res({ t, s: 'L' }); };
            $('dm-r').onclick = () => { G.choose = null; G.pending = null; res({ t, s: 'R' }); };
          };
          draw();
        });
      }
      async function roundOver(w, blocked) {
        draw(true);
        let pts;
        if (!blocked) { pts = G.players.filter((q) => q !== w).reduce((s, q) => s + handPips(q.hand), 0); if (w.seat === G.me) G.dominoes++; log(`${nm(w)} is out of tiles! <b>+${pts}</b>`); }
        else {
          const low = Math.min(...G.players.map((q) => handPips(q.hand))), lows = G.players.filter((q) => handPips(q.hand) === low);
          w = lows.length === 1 ? lows[0] : null;
          pts = w ? G.players.filter((q) => q !== w).reduce((s, q) => s + handPips(q.hand), 0) - handPips(w.hand) : 0;
          log(w ? `Blocked! ${nm(w)} has the fewest pips. <b>+${pts}</b>` : 'Blocked, and a tie on pips. Nobody scores.');
        }
        if (w) { w.score += pts; G.starter = G.players.indexOf(w); SFX.play(w.seat === G.me ? 'win' : 'coin'); }
        prompt(w ? `<b>${esc(w.name)}</b> wins the round: <span class="text-amber font-bold">+${pts}</span>` : 'Round tied.');
        draw(true);
        await W(1400);
      }
      async function endGame(gaveUp, left) {
        if (G.over) return; G.over = true; G.S.over = true;
        const S = G.S, tok = G.tok, me = G.players[G.me], ranked = G.players.slice().sort((a, b) => b.score - a.score);
        const won = !!left || (!gaveUp && ranked[0] === me && (ranked.length < 2 || ranked[1].score < me.score));
        const lvl = G.players.length - 2, elo = S.online ? 0 : won ? [8, 11, 14][lvl] + (G.lvl - 1) * 3 : [-4, -5, -6][lvl];
        const s = gstat('dominoes'); s.rounds = (s.rounds || 0) + G.round; s.dominoes = (s.dominoes || 0) + G.dominoes; s.best = Math.max(s.best || 0, me.score);
        if (S.online) s.online = (s.online || 0) + 1;
        SFX.play(won ? 'win' : 'lose');
        const eloRow = S.online ? await S.finish(won ? 'win' : 'loss') : null;
        if (!G || G.tok !== tok) return;
        reportGame('dominoes', won ? 'win' : 'loss', { elo, xp: won ? 25 + lvl * 8 : 10, label: gaveUp ? 'Gave up' : `${S.online ? 'Online · ' : ''}${me.score} pts · ${G.round} round${G.round > 1 ? 's' : ''}` });
        const oppName = left ? G.S.name(left.s) : '';
        gameResult({ title: left ? 'You win!' : won ? 'You win at dominoes!' : gaveUp ? 'You gave up' : `${ranked[0].name} wins`, sub: left ? `${oppName} ${left.t === '_gone' ? 'disconnected' : 'left the game'}.` : G.to ? `First to ${G.to} points.` : 'One round.', tone: won ? 'amber' : 'coral', sprite: won ? 'trophy' : 'anchor',
          rows: ranked.map((p) => [p.name, p.score, p.seat === G.me ? 'text-amber' : 'text-bone']).concat(eloRow ? [eloRow] : []), againLabel: S.online ? 'Back to setup' : 'New game', again: () => open($('game-root')) });
      }

      // lay the line of play out as a snake: rows that go right, then left, then right...
      function layoutLine(maxUnits) {
        const rows = []; let row = [], used = 0;
        for (const seg of G.line) { const w = isDbl(seg.t) ? 1 : 2; if (used + w > maxUnits && row.length) { rows.push(row); row = []; used = 0; } row.push(seg); used += w; }
        if (row.length) rows.push(row);
        return rows;
      }
      // returns how long the movement takes
      function draw(reveal) {
        const area = $('dm-area'); if (!area || !G) return 0;
        const before = gSnap(area);
        const cur = G.players[G.cur], myTurn = cur && cur.seat === G.me && G.choose;
        const others = G.players.map((_, k) => G.players[(G.me + k) % G.players.length]).slice(1);
        $('dm-opp').innerHTML = others.map((q) => `<div id="dm-seat-${q.seat}" class="seat ${cur === q && !G.over ? 'turn' : ''}"><div class="text-sm font-display font-extrabold"><span class="text-lg">${q.av}</span> ${esc(q.name)}</div>
          <div class="dm-backs">${(q.hand || []).map((t) => tileHTML(t, { down: !reveal, vertical: true, fk: t.id, cls: 'sm' })).join('')}</div><div class="pix text-xs text-amber">${(q.hand || []).length} tile${(q.hand || []).length === 1 ? "" : "s"}${reveal ? ' · ' + handPips(q.hand) + ' pips' : ''}</div></div>`).join('');
        const lineEl = $('dm-line');
        const unit = Math.max(18, Math.min(30, Math.floor((lineEl.clientWidth - 16) / 22)));
        lineEl.style.setProperty('--u', unit + 'px');
        const maxUnits = Math.max(6, Math.floor((lineEl.clientWidth - 16) / unit) - 1);
        const rows = G.line && G.line.length ? layoutLine(maxUnits) : [];
        lineEl.innerHTML = rows.length ? rows.map((row, ri) => `<div class="dm-row ${ri % 2 ? 'rev' : ''} ${rows.length === 1 ? 'solo' : ''}">${row.map((seg) => {
          const rev = ri % 2 === 1, dbl = isDbl(seg.t);
          // show the tile so its numbers read along the snake
          const l = rev ? seg.r : seg.l;
          return tileHTML(seg.t, { vertical: dbl, flip: !dbl && seg.t.a !== l, fk: seg.t.id, cls: G.line.indexOf(seg) === 0 || G.line.indexOf(seg) === G.line.length - 1 ? 'end' : '' });
        }).join('')}</div>`).join('') : '<div class="pix text-sm text-bone/60 py-6 text-center">The table is empty</div>';
        const me = G.players[G.me];
        $('dm-hand').innerHTML = (me.hand || []).map((t, i) => tileHTML(t, { vertical: true, fk: t.id, attrs: `data-i="${i}"`, cls: `big ${myTurn ? (spots(G, t).length ? 'ok' : 'no') : ''} ${G.pending === t ? 'sel' : ''}` })).join('');
        document.querySelectorAll('#dm-hand .dm-tile').forEach((el) => { el.onclick = () => { if (G.choose) G.choose(me.hand[+el.dataset.i]); }; });
        $('dm-scores').innerHTML = G.players.map((p) => `<div class="flex justify-between text-sm"><span class="font-bold ${p.seat === G.me ? 'text-amber' : ''}">${esc(p.av)} ${esc(p.name)}</span><span class="pix text-amber">${p.score}</span></div>`).join('');
        $('dm-bonecount').textContent = G.rule === 'draw' ? `BONEYARD · ${G.bone ? G.bone.length : 0}` : 'BLOCK GAME';
        // played tiles slide over from whoever played them; drawn tiles come out of the boneyard
        return gFlip(area, before, { from: '#dm-bone', stagger: 90 });
      }

      const K = '#050E18';
      const mod = {
        id: 'dominoes', name: 'Dominoes', icon: 'dominoes', cats: ['board'], sub: '2-4 PLAYERS · ~10 MIN', color: '#F5B041', tone: 'amber', btn: 'amber',
        blurb: 'Classic double-six dominoes. Match the numbers at either end of the line, go out first and score the pips left in your rivals’ hands.',
        rules: { tag: 'DOUBLE-SIX', steps: [
          '<strong class="text-bone">Match:</strong> On your turn, play a tile whose number matches one of the two open ends of the line. Doubles are laid crosswise.',
          '<strong class="text-bone">Stuck?</strong> In a <b>Draw game</b> you take tiles from the boneyard until one fits. In a <b>Block game</b> you pass. The highest double starts the first round.',
          '<strong class="text-bone">Score:</strong> Go out first and you score every pip left in your opponents’ hands. If nobody can play, the lowest hand wins the difference. First to the target score wins.',
        ], tip: 'Get rid of big tiles early so you are not caught holding them, and play numbers your opponents have had to pass on.' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['DOMINOES', s.dominoes || 0, 'text-emerald'], ['BEST SCORE', s.best || 0, 'text-teal']],
        extraRows: (s) => srow('Rounds played', s.rounds || 0),
        engine: { SET, spots, place, botChoose, handPips, state: () => G }, open, close() { G = null; },
        art: { tile: (a, b) => tileHTML({ a, b, id: a + '-' + b }, { vertical: true, cls: 'big' }) },
        online: { seats: (sel) => +sel.n || 2, ranked: true, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();

