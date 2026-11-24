    /* =========================================================================
       WHODUNIT: a deduction game. Who did it, with what, and where?
       ========================================================================= */
    (function manorMysteryGame() {
      const ABORT = { a: 1 };
      const SUS = ['Captain Reed', 'Lady Juniper', 'Professor Finch', 'Nanny Opal', 'Baron Vex', 'Chef Saffron'];
      const SUS_COL = ['#FB7185', '#34D399', '#60A5FA', '#F7F4EC', '#F5B041', '#2DD4BF'];
      const TOOLS = ['Garden Trowel', 'Frying Pan', 'Golf Club', 'Silver Teapot', 'Fishing Rod', 'Umbrella'];
      const ROOMS = ['Greenhouse', 'Library', 'Observatory', 'Music Room', 'Grand Hall', 'Kitchen', 'Wine Cellar', 'Game Room', 'Boathouse'];
      // 3x3 floor plan; corner rooms also have secret passages to the opposite corner
      const NEIGH = ROOMS.map((_, i) => {
        const r = Math.floor(i / 3), c = i % 3, out = [];
        if (r > 0) out.push(i - 3); if (r < 2) out.push(i + 3); if (c > 0) out.push(i - 1); if (c < 2) out.push(i + 1);
        const pass = { 0: 8, 8: 0, 2: 6, 6: 2 }; if (pass[i] !== undefined) out.push(pass[i]);
        return out;
      });
      const CARDS = [...SUS.map((n, i) => ({ k: 's', n, i })), ...TOOLS.map((n, i) => ({ k: 't', n, i })), ...ROOMS.map((n, i) => ({ k: 'r', n, i }))];
      CARDS.forEach((c, id) => { c.id = id; });
      const CAT = { s: 'Suspect', t: 'Tool', r: 'Room' };
      const BOTS = [['Inspector Holt', '🦉'], ['Miss Pip', '🐭'], ['Dr. Barker', '🐶'], ['Agent Kit', '🐱'], ['Sergeant Moss', '🐸']];
      const PCOL = ['#F5B041', '#FB7185', '#2DD4BF', '#34D399', '#60A5FA', '#F7F4EC'];

      /* ---------- what a player can work out ----------
         know[owner][card]: 1 = owner has it, -1 = does not, 0 = not sure. owner n = the hidden envelope.
         Rules used: every card has exactly one owner; a player who passes has none of the three;
         a player who showed something has at least one of the three; hand sizes are known. */
      function newKnow(n) { return Array.from({ length: n + 1 }, () => CARDS.map(() => 0)); }
      function setK(K, o, c, v) { if (K[o][c] === v) return false; if (K[o][c] !== 0) return false; K[o][c] = v; return true; }
      function deduce(K, sizes, shows, full) {
        const n = K.length - 1;
        for (let loop = 0; loop < 30; loop++) {
          let ch = false;
          CARDS.forEach((c) => {
            const has = K.findIndex((row) => row[c.id] === 1);
            if (has >= 0) { K.forEach((row, o) => { if (o !== has) ch = setK(K, o, c.id, -1) || ch; }); return; }
            const maybe = K.map((row, o) => (row[c.id] === 0 ? o : -1)).filter((o) => o >= 0);
            if (maybe.length === 1) ch = setK(K, maybe[0], c.id, 1) || ch;
          });
          if (!full) { if (!ch) break; continue; }
          // the envelope holds exactly one card of each kind
          ['s', 't', 'r'].forEach((k) => {
            const ids = CARDS.filter((c) => c.k === k).map((c) => c.id);
            if (ids.some((id) => K[n][id] === 1)) ids.forEach((id) => { if (K[n][id] !== 1) ch = setK(K, n, id, -1) || ch; });
            else { const m = ids.filter((id) => K[n][id] === 0); if (m.length === 1) ch = setK(K, n, m[0], 1) || ch; }
          });
          // full hands: once you know all of someone's cards, they have nothing else
          sizes.forEach((sz, o) => {
            const yes = K[o].filter((v) => v === 1).length, unk = K[o].filter((v) => v === 0).length;
            if (yes === sz && unk) K[o].forEach((v, c) => { if (v === 0) { K[o][c] = -1; ch = true; } });
            else if (yes + unk === sz && unk) K[o].forEach((v, c) => { if (v === 0) { K[o][c] = 1; ch = true; } });
          });
          // "showed one of these three": if two are ruled out, it was the third
          shows.forEach(([o, trio]) => {
            if (trio.some((c) => K[o][c] === 1)) return;
            const m = trio.filter((c) => K[o][c] === 0);
            if (m.length === 1) ch = setK(K, o, m[0], 1) || ch;
          });
          if (!ch) break;
        }
      }
      const solved = (K) => { const n = K.length - 1; const pickK = (k) => CARDS.filter((c) => c.k === k).find((c) => K[n][c.id] === 1); const s = pickK('s'), t = pickK('t'), r = pickK('r'); return s && t && r ? [s.id, t.id, r.id] : null; };

      /* ---------- game ---------- */
      let G = null;
      const $ = (id) => document.getElementById(id);
      const nm = (p) => `<b style="color:${p.col}">${esc(p.name)}</b>`;
      const log = (t) => { if (!G) return; G.log.push(t); const el = $('mm-log'); if (el) { el.innerHTML = G.log.slice(-60).map((x) => `<div>${x}</div>`).join(''); el.scrollTop = el.scrollHeight; } };
      const prompt = (h) => { const e = $('mm-prompt'); if (e) e.innerHTML = h; };
      async function W(ms) { const t = G && G.tok; await gSleep(window.__fast ? 1 : ms); if (!G || G.tok !== t) throw ABORT; }

      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1200px] mx-auto');
        setupScreen(body, mod, [
          { key: 'n', label: 'DETECTIVES', def: 4, choices: [[3, '3'], [4, '4'], [5, '5'], [6, '6']], hint: 'On this device the others are computer detectives. Online, empty seats get computer detectives.' },
          { key: 'lvl', label: 'RIVAL DETECTIVES', def: 2, choices: [[1, 'Hasty'], [2, 'Sharp']], hint: 'Sharp detectives use every clue, including who could not show a card.' },
          { key: 'auto', label: 'Auto-fill notebook', toggle: true, def: 1, hint: 'Ticks your own cards, cards shown to you, and crosses for players who could not answer.', choices: [[1, 'On'], [0, 'Off']] },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(BOTS.slice(0, +sel.n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel)));
      }
      // seats come from the table (S): on this device seat 0 is you; online every screen has its own seat (G.me).
      // Only the detective who asked sees which card was shown (and the one who showed it).
      function start(body, sel, S) {
        const n = S.n;
        const players = S.seats.map((x) => ({ name: x.name, av: x.avatar }));
        const deck = S.rng.shuffle(CARDS.slice());
        const sol = ['s', 't', 'r'].map((k) => { const c = deck.find((x) => x.k === k); deck.splice(deck.indexOf(c), 1); return c.id; });
        players.forEach((p, i) => { p.i = i; p.col = PCOL[i]; p.hand = []; p.room = 4; p.out = false; });
        deck.forEach((c, k) => players[k % n].hand.push(c.id));
        G = { S, me: S.online ? S.me : 0, step: 0, players, sol, lvl: +sel.lvl, auto: !!+sel.auto, tok: ++GT.cur, over: false, log: [], cur: 0, turn: 0, sus: SUS.map((_, i) => [0, 1, 2, 6, 7, 8][i]), sugg: 0, marks: {} };
        const sizes = players.map((p) => p.hand.length).concat([3]);
        G.sizes = sizes;
        players.forEach((p) => { p.K = newKnow(n); p.shows = []; p.hand.forEach((c) => { p.K[p.i][c] = 1; }); CARDS.forEach((c) => { if (!p.hand.includes(c.id)) p.K[p.i][c.id] = -1; }); deduce(p.K, sizes, p.shows, G.lvl === 2); });
        G.note = players.map(() => CARDS.map(() => 0)); // what the human's notebook shows automatically
        const meI = G.me;
        players[meI].hand.forEach((c) => { G.note[meI][c] = 1; });
        if (G.auto) CARDS.forEach((c) => { if (!players[meI].hand.includes(c.id)) G.note[meI][c.id] = -1; });
        body.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
          <div class="space-y-3 min-w-0"><div class="mm-house"><div class="mm-roof">${MANOR_ART.roof}</div><div id="mm-map" class="mm-map"></div><div class="mm-lawn"></div></div><div id="mm-prompt" class="win p-3 text-sm min-h-[52px]"></div>
            <div><div class="pix text-xs text-muted mb-1">YOUR CARDS</div><div id="mm-hand" class="flex gap-2 flex-wrap"></div></div>
            <div id="mm-players" class="flex gap-2 flex-wrap"></div></div>
          <div class="space-y-3 min-w-0"><div class="win overflow-hidden"><div class="winbar teal"><span>DETECTIVE NOTEBOOK</span><span class="pix text-xs">TAP TO MARK</span></div><div id="mm-note" class="mm-note"></div></div>
            <div id="mm-log" class="logbox" style="height:170px"></div>
            <button id="mm-quit" class="btn-game btn-coral w-full py-2 text-sm">${S.online ? 'Leave game' : 'Give up'}</button></div></div>`;
        S.track();
        S.onLeft = (a) => { if (!G) return; const q = G.players[a.s]; q.name += ' (CPU)'; q.av = '🤖'; log(`${nm(q)} ${a.t === '_gone' ? 'disconnected' : 'left'}. A computer detective takes over.`); render(); };
        npBar('');
        let sure = false;
        $('mm-quit').onclick = (e) => { if (S.online) return npConfirmLeave(() => open($('game-root'))); if (!sure) { sure = true; e.target.textContent = 'Really give up?'; gTimeout(() => { sure = false; if (G) e.target.textContent = 'Give up'; }, 3000); return; } if (!G.over) { G.tok++; finish(null, true); } };
        log('A crime at the manor! Find <b>who</b> did it, <b>with what</b>, and <b>where</b>. Everyone starts in the Grand Hall.');
        render();
        run().catch((e) => { if (e !== ABORT) throw e; });
      }

      async function run() {
        for (let guard = 0; guard < 400 && !G.over; guard++) {
          const p = G.players[G.cur];
          if (!p.out) { G.turn++; await takeTurn(p); }
          if (G.over) return;
          if (G.players.every((q) => q.out)) return finish(null, false);
          G.cur = (G.cur + 1) % G.players.length;
        }
      }

      /* ----- decisions: you tap, the table's host decides for computer detectives, online players send theirs ----- */
      const isMe = (p) => p.i === G.me;
      const isBot = (p) => G.S.bot(p.i);
      async function decide(p, kind, ui, botFn, ms) {
        const NS = G.S, k = ++G.step, t = G.tok;
        if (NS.mine(p.i) && ui) Promise.resolve(ui()).then((v) => { if (G && G.tok === t && v !== undefined) NS.act({ t: kind, s: p.i, k, v }); });
        const a = await NS.ask(p.i, () => ({ t: kind, k, v: botFn() }), ms, (x) => x.s === p.i && x.t === kind && x.k === k);
        if (!G || G.tok !== t) throw ABORT;
        return a.v;
      }
      const inR = (v, n) => Number.isInteger(+v) && +v >= 0 && +v < n;
      const okAcc = (a) => Array.isArray(a) && inR(a[0], SUS.length) && inR(a[1], TOOLS.length) && inR(a[2], ROOMS.length);
      async function takeTurn(p) {
        render();
        const NS = G.S, mine = NS.mine(p.i);
        if (!mine) prompt(`<span class="text-muted">${esc(p.name)} is thinking...</span>`);
        // 1. walk (a computer detective that has solved it accuses instead)
        const w = await decide(p, 'walk', () => humanWalk(p), () => botWalk(p), 700);
        if (w && okAcc(w.acc)) { await accuse(p, +w.acc[0], +w.acc[1], +w.acc[2]); return; }
        const to = w && NEIGH[p.room].includes(+w.to) ? +w.to : NEIGH[p.room][0];
        p.room = to; SFX.play('move'); log(`${nm(p)} walks to the <b>${ROOMS[to]}</b>.`); render(); await W(400);
        // 2. suggest, accuse or end the turn
        const act = await decide(p, 'act', () => humanAct(p, to), () => botAct(p), 500) || { k: 'end' };
        let accNow = act.k === 'acc';
        if (act.k === 'sug' && inR(act.s, SUS.length) && inR(act.t, TOOLS.length)) {
          await suggest(p, +act.s, +act.t, to); if (G.over) return;
          // 3. after the answer: accuse now, or end the turn
          const a2 = await decide(p, 'after', () => humanAfter(), () => botAfter(p), 400);
          if (okAcc(a2)) { await accuse(p, +a2[0], +a2[1], +a2[2]); return; }
          accNow = a2 === 'acc';
        }
        if (accNow && !isBot(p)) {
          const a3 = await decide(p, 'accuse', () => humanAccuse(p), () => null, 300);
          if (okAcc(a3)) await accuse(p, +a3[0], +a3[1], +a3[2]);
        }
        if (mine) prompt('');
      }

      /* ----- a suggestion goes round the table ----- */
      async function suggest(p, s, t, r) {
        G.sugg++; if (isMe(p)) G.mySugg = (G.mySugg || 0) + 1;
        const trio = [CARDS.findIndex((c) => c.k === 's' && c.i === s), CARDS.findIndex((c) => c.k === 't' && c.i === t), CARDS.findIndex((c) => c.k === 'r' && c.i === r)];
        G.sus[s] = r; // the suspect is called into the room
        log(`${nm(p)} suggests <b>${SUS[s]}</b> with the <b>${TOOLS[t]}</b> in the <b>${ROOMS[r]}</b>.`);
        SFX.play('reveal'); render(); await W(900);
        const n = G.players.length;
        for (let k = 1; k < n; k++) {
          const q = G.players[(p.i + k) % n];
          const has = trio.filter((c) => q.hand.includes(c));
          if (!has.length) {
            log(`${nm(q)} cannot answer.`);
            G.players.forEach((x) => { trio.forEach((c) => setK(x.K, q.i, c, -1)); });
            if (G.auto) trio.forEach((c) => { if (!G.note[q.i][c]) G.note[q.i][c] = -1; });
            render(); await W(500);
            continue;
          }
          let shown;
          if (has.length === 1) { shown = has[0]; if (isMe(q)) { prompt(`You show <b>${CARDS[shown].n}</b> to ${esc(p.name)}.`); await W(900); } }
          else {
            if (!G.S.mine(q.i)) prompt(`<span class="text-muted">${esc(q.name)} is choosing a card to show ${esc(p.name)}...</span>`);
            // a computer detective shows a card it has shown this player before, if it can (gives away less)
            const v = await decide(q, 'show', () => new Promise((res) => {
              prompt(`${esc(p.name)} asks about your cards. <b>Pick one to show them secretly:</b><div class="flex gap-2 flex-wrap mt-2">${has.map((c) => cardHTML(c, `data-show="${c}"`)).join('')}</div>`);
              document.querySelectorAll('[data-show]').forEach((b) => { b.onclick = () => { prompt(''); res(+b.dataset.show); }; });
            }), () => { q.shownTo = q.shownTo || {}; return has.find((c) => (q.shownTo[p.i] || []).includes(c)) ?? pick(has); }, 700);
            shown = has.includes(+v) ? +v : has[0];
            q.shownTo = q.shownTo || {}; (q.shownTo[p.i] = q.shownTo[p.i] || []).push(shown);
            prompt('');
          }
          // the card travels from one detective to the other; only the asker sees its face
          gFly(`#mm-seat-${q.i}`, `#mm-seat-${p.i}`, isMe(p) || isMe(q) ? cardHTML(shown) : `<div class="mm-card back"><span>?</span></div>`, { ms: 650, arc: 40 });
          SFX.play('card');
          if (isMe(p)) { G.note[q.i][shown] = 1; if (G.auto) G.players.forEach((x) => { if (x.i !== q.i && !G.note[x.i][shown]) G.note[x.i][shown] = -1; }); log(`${nm(q)} shows you <b>${CARDS[shown].n}</b>.`); }
          else log(`${nm(q)} shows ${isMe(q) ? `<b>${CARDS[shown].n}</b>` : 'a card'} to ${nm(p)}.`);
          // what everyone learns
          setK(p.K, q.i, shown, 1);
          G.players.forEach((x) => { if (x !== p && x !== q) x.shows.push([q.i, trio]); });
          G.players.forEach((x) => { if (isBot(x)) deduce(x.K, G.sizes, x.shows, G.lvl === 2 || x === p); });
          render();
          if (isMe(p)) prompt(`<div class="flex items-center gap-3 flex-wrap">${esc(q.name)} secretly shows you: ${cardHTML(shown)}</div>`);
          await W(isMe(p) ? 1400 : 900);
          return shown;
        }
        log('<b>Nobody could answer!</b>');
        G.players.forEach((x) => { if (isBot(x)) deduce(x.K, G.sizes, x.shows, G.lvl === 2); });
        if (isMe(p)) prompt('<b>Nobody could show a card.</b> Unless you hold some of them yourself, those three may be the answer!');
        render(); await W(1000);
        return null;
      }
      async function accuse(p, s, t, r) {
        log(`${nm(p)} makes an <b>accusation</b>: ${SUS[s]}, ${TOOLS[t]}, ${ROOMS[r]}...`);
        SFX.play('reveal'); await W(1000);
        const right = G.sol[0] === CARDS.findIndex((c) => c.k === 's' && c.i === s) && G.sol[1] === CARDS.findIndex((c) => c.k === 't' && c.i === t) && G.sol[2] === CARDS.findIndex((c) => c.k === 'r' && c.i === r);
        if (right) { log(`🎉 ${nm(p)} is <b>right</b>!`); finish(p, false); return true; }
        p.out = true; SFX.play('nope');
        log(`❌ ${nm(p)} is <b>wrong</b> and is out (but still answers questions).`);
        if (isMe(p)) { finish(null, false, true); return true; }
        if (G.players.every((q) => q.out || isBot(q)) && G.S.online && !G.players[G.me].out) { /* only computers left besides you: keep going */ }
        render(); return false;
      }

      /* ----- your turn (each part resolves with your choice; the table plays it) ----- */
      function humanWalk(p) {
        return new Promise((res) => {
          G.pickRoom = (i) => { if (!NEIGH[p.room].includes(i)) return; G.pickRoom = null; res({ to: i }); };
          prompt(`<b>Your turn.</b> Tap a glowing room to walk there${[0, 2, 6, 8].includes(p.room) ? ' (or take the secret passage to the far corner)' : ''}.`);
          render();
        });
      }
      function humanAct(p, to) {
        return new Promise((res) => {
          prompt(`<div class="space-y-2"><div>You are in the <b>${ROOMS[to]}</b>. Make a suggestion:</div><div class="flex gap-2 flex-wrap items-center">
            <select id="mm-s" class="mm-sel">${SUS.map((x, i) => `<option value="${i}">${x}</option>`).join('')}</select>
            <span class="text-muted">with the</span><select id="mm-t" class="mm-sel">${TOOLS.map((x, i) => `<option value="${i}">${x}</option>`).join('')}</select>
            <span class="text-muted">in the ${ROOMS[to]}</span></div>
            <div class="flex gap-2 flex-wrap"><button id="mm-go" class="btn-game btn-amber py-2 px-4 text-sm">Suggest</button><button id="mm-acc" class="btn-game btn-coral py-2 px-4 text-sm">Accuse…</button><button id="mm-skip" class="btn-game btn-graphite py-2 px-4 text-sm">End turn</button></div></div>`);
          $('mm-go').onclick = () => res({ k: 'sug', s: +$('mm-s').value, t: +$('mm-t').value });
          $('mm-acc').onclick = () => res({ k: 'acc' }); $('mm-skip').onclick = () => res({ k: 'end' });
        });
      }
      function humanAfter() {
        return new Promise((res) => {
          prompt(`${$('mm-prompt').innerHTML}<div class="flex gap-2 flex-wrap mt-2"><button id="mm-acc2" class="btn-game btn-coral py-2 px-4 text-sm">I know! Accuse…</button><button id="mm-end" class="btn-game btn-teal py-2 px-4 text-sm">End turn</button></div>`);
          $('mm-acc2').onclick = () => res('acc'); $('mm-end').onclick = () => res('end');
        });
      }
      function humanAccuse(p) {
        return new Promise((res) => {
          prompt(`<div class="space-y-2"><div class="text-coral font-bold">Accusation: if you are wrong, you lose!</div><div class="flex gap-2 flex-wrap items-center">
            <select id="ma-s" class="mm-sel">${SUS.map((x, i) => `<option value="${i}">${x}</option>`).join('')}</select><select id="ma-t" class="mm-sel">${TOOLS.map((x, i) => `<option value="${i}">${x}</option>`).join('')}</select><select id="ma-r" class="mm-sel">${ROOMS.map((x, i) => `<option value="${i}">${x}</option>`).join('')}</select></div>
            <div class="flex gap-2"><button id="ma-go" class="btn-game btn-coral py-2 px-4 text-sm">Accuse!</button><button id="ma-no" class="btn-game btn-graphite py-2 px-4 text-sm">Not yet</button></div></div>`);
          $('ma-go').onclick = () => res([+$('ma-s').value, +$('ma-t').value, +$('ma-r').value]); $('ma-no').onclick = () => res(null);
        });
      }

      /* ----- the rival detectives (run on the table's host) ----- */
      const accOf = (sol) => [CARDS[sol[0]].i, CARDS[sol[1]].i, CARDS[sol[2]].i];
      function botWalk(p) {
        const K = p.K, n = G.players.length, sol = solved(K);
        if (sol && (G.lvl === 2 || Math.random() < 0.8)) return { acc: accOf(sol) };
        const unsure = (c) => K[n][c] === 0;
        const roomCard = (i) => CARDS.findIndex((c) => c.k === 'r' && c.i === i);
        const opts = NEIGH[p.room].slice(), good = opts.filter((i) => unsure(roomCard(i)));
        return { to: good.length ? pick(good) : pick(opts) };
      }
      function botAct(p) {
        const K = p.K, n = G.players.length, unsure = (c) => K[n][c] === 0;
        const choose = (k) => { const ids = CARDS.filter((c) => c.k === k); const u = ids.filter((c) => unsure(c.id)); return (u.length ? pick(u) : G.lvl === 2 ? (ids.find((c) => p.hand.includes(c.id)) || pick(ids)) : pick(ids)).i; };
        return { k: 'sug', s: choose('s'), t: choose('t') };
      }
      function botAfter(p) {
        const n = G.players.length, sol2 = solved(p.K);
        if (sol2) return accOf(sol2);
        if (G.lvl === 1 && G.turn > 30 && Math.random() < 0.15) { const best = (k) => { const u = CARDS.filter((c) => c.k === k && p.K[n][c.id] >= 0); return pick(u).i; }; return [best('s'), best('t'), best('r')]; }
        return 'end';
      }

      function finish(winner, gaveUp, wrong) {
        if (G.over) return; G.over = true; G.S.over = true;
        const won = winner && isMe(winner);
        const sol = `${CARDS[G.sol[0]].n} with the ${CARDS[G.sol[1]].n} in the ${CARDS[G.sol[2]].n}`;
        const lvl = G.players.length - 3, elo = G.S.online ? 0 : won ? 10 + lvl * 3 + (G.lvl - 1) * 4 : -5;
        const s = gstat('manor'); s.solved = (s.solved || 0) + (won ? 1 : 0); s.fastest = won ? Math.min(s.fastest || 99, G.mySugg || 0) : s.fastest;
        reportGame('manor', won ? 'win' : 'loss', { elo, xp: won ? 40 + lvl * 8 : 12, label: won ? `Solved in ${G.mySugg || 0} suggestions` : gaveUp ? 'Gave up' : wrong ? 'Wrong accusation' : `${winner ? winner.name : 'Nobody'} solved it` });
        SFX.play(won ? 'win' : 'lose'); prompt(`The answer: <b>${sol}</b>.`); render();
        gTimeout(() => gameResult({ title: won ? 'Case closed! You solved it' : wrong ? 'Wrong accusation!' : gaveUp ? 'You gave up' : winner ? `${winner.name} solved it` : 'The case went cold', sub: `It was ${sol}.`, tone: won ? 'amber' : 'coral', sprite: won ? 'trophy' : 'anchor',
          rows: [['Your suggestions', G.mySugg || 0, 'text-amber'], ['Turns', G.turn, 'text-bone']], againLabel: G.S.online ? 'Back to setup' : 'New mystery', again: () => open($('game-root')) }), gaveUp ? 0 : 900);
      }

      /* ---------- drawing ---------- */
      const ROOM_ART = ['#1F6B42', '#5B3A1C', '#12314F', '#6B2D3F', '#23476C', '#7A5A20', '#3A2333', '#1F5F5B', '#1F5F93'];
      const catCol = { s: '#FB7185', t: '#2DD4BF', r: '#F5B041' };
      const cardHTML = (c, attrs = '') => { const C = CARDS[c]; return `<div class="mm-card" ${attrs} style="--cc:${catCol[C.k]}"><span class="mm-cat">${CAT[C.k].toUpperCase()}</span><span class="mm-cn">${C.n}</span>${C.k === 's' ? `<span class="mm-dot" style="background:${SUS_COL[C.i]}"></span>` : ''}</div>`; };
      function render() {
        if (!G) return;
        const me = G.players[G.me], area = $('mm-map'); if (!area) return;
        const before = gSnap(area);
        const canGo = G.pickRoom ? NEIGH[me.room] : [];
        const PASS_TO = { 0: 8, 8: 0, 2: 6, 6: 2 };
        area.innerHTML = ROOMS.map((r, i) => `<div class="mm-room ${canGo.includes(i) ? 'go' : ''} ${me.room === i ? 'here' : ''}" data-r="${i}" style="--rc:${ROOM_ART[i]}">
          <div class="mm-art">${MANOR_ART.rooms[i]}</div>${i % 3 < 2 ? '<span class="mm-door r"></span>' : ''}${i < 6 ? '<span class="mm-door b"></span>' : ''}
          <span class="mm-rn">${r}</span>${PASS_TO[i] !== undefined ? `<span class="mm-pass" title="Secret passage to the ${ROOMS[PASS_TO[i]]}"></span>` : ''}
          <div class="mm-toks">${G.players.filter((p) => p.room === i).map((p) => `<span class="mm-tok ${p.out ? 'out' : ''}" data-fk="p${p.i}" style="background:${p.col}" title="${esc(p.name)}">${p.av}</span>`).join('')}</div>
          <div class="mm-sus">${SUS.map((s, k) => (G.sus[k] === i ? `<span class="mm-st" data-fk="s${k}" style="background:${SUS_COL[k]}" title="${s}">${s.split(' ').pop()[0]}</span>` : '')).join('')}</div></div>`).join('');
        area.querySelectorAll('.mm-room.go').forEach((el) => { el.onclick = () => { if (G.pickRoom) G.pickRoom(+el.dataset.r); }; });
        gFlip(area, before, { enter: false });
        $('mm-hand').innerHTML = me.hand.map((c) => cardHTML(c)).join('');
        $('mm-players').innerHTML = G.players.map((p) => `<div id="mm-seat-${p.i}" class="mm-seat pl-tag ${G.cur === p.i && !G.over ? 'turn' : ''} ${p.out ? 'out' : ''} ${p.i === G.me ? 'me' : ''}" style="--pc:${p.col}"><span class="tg-av">${p.av}</span> <b>${esc(p.name)}</b> <span class="text-muted text-xs">${p.hand.length} cards${p.out ? ' · OUT' : ''}</span></div>`).join('');
        // notebook: one column per detective
        const mark = (pi, c) => { const a = G.note[pi][c]; if (a === 1) return '<b class="mm-yes">✓</b>'; if (a === -1) return '<b class="mm-no">✗</b>'; const m = G.marks[pi + ':' + c]; return m ? `<span class="mm-m">${m}</span>` : ''; };
        const head = `<tr><th></th>${G.players.map((p) => `<th title="${esc(p.name)}"><span class="mm-sw" style="background:${p.col}"></span></th>`).join('')}</tr>`;
        const sec = (k) => `<tr class="mm-sec"><td colspan="${G.players.length + 1}">${CAT[k].toUpperCase()}S</td></tr>` + CARDS.filter((c) => c.k === k).map((c) => {
          const ruled = G.players.some((p) => G.note[p.i][c.id] === 1);
          return `<tr class="${ruled ? 'ruled' : ''}"><td class="mm-cname">${c.n}</td>${G.players.map((p) => `<td data-m="${p.i}:${c.id}">${mark(p.i, c.id)}</td>`).join('')}</tr>`;
        }).join('');
        $('mm-note').innerHTML = `<table>${head}${sec('s')}${sec('t')}${sec('r')}</table>`;
        $('mm-note').querySelectorAll('[data-m]').forEach((td) => { td.onclick = () => { const [pi, c] = td.dataset.m.split(':').map(Number); if (G.note[pi][c]) return; const k = pi + ':' + c, cyc = ['', '✗', '✓', '?']; G.marks[k] = cyc[(cyc.indexOf(G.marks[k] || '') + 1) % 4]; SFX.play('click'); render(); }; });
      }

      const K = '#050E18', rr = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
      GICONS.manor = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(3, 9, 18, 13, K)}${rr(4, 10, 16, 11, '#6B2D3F')}${rr(2, 7, 20, 3, K)}${rr(6, 3, 12, 5, K)}${rr(7, 4, 10, 4, '#4A1F2C')}${rr(10, 15, 4, 6, '#F5B041')}${rr(6, 12, 3, 3, '#F7F4EC')}${rr(15, 12, 3, 3, '#F7F4EC')}${rr(14, 1, 7, 7, K)}${rr(15, 2, 5, 5, '#2DD4BF')}${rr(19, 7, 2, 4, K)}${rr(16, 3, 2, 2, '#BFF5EC')}</svg>`;
      const mod = {
        id: 'manor', name: 'Whodunit', icon: 'manor', cats: ['board', 'party'], sub: '3-6 PLAYERS · ~20 MIN', color: '#FB7185', tone: 'coral', btn: 'coral',
        blurb: 'Something happened at the manor. Walk the rooms, make suggestions and use your notebook to work out who did it, with what, and where.',
        rules: { tag: 'DEDUCTION', steps: [
          '<strong class="text-bone">The secret:</strong> One suspect, one tool and one room are hidden in an envelope. All other cards are dealt to the detectives, so the cards you hold cannot be the answer.',
          '<strong class="text-bone">Your turn:</strong> Walk to a room next door (corner rooms have a secret passage to the opposite corner). Then <b>suggest</b> a suspect and a tool in that room.',
          '<strong class="text-bone">Answers:</strong> The next detective who holds any of those cards must secretly show you one. If nobody can, it is a big clue! Your notebook fills in what you learn.',
          '<strong class="text-bone">Accuse:</strong> When you are sure, accuse: suspect + tool + room. Right and you win. Wrong and you are out!',
        ], tip: 'Suggest cards you already hold to test the others: a "can’t answer" then tells you a lot.' },
        profileTiles: (s) => [['CASES SOLVED', s.solved || 0, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['WIN RATE', pct(s.wins, s.played) + '%', 'text-emerald'], ['BEST', s.fastest && s.fastest < 99 ? s.fastest + ' sugg.' : '-', 'text-teal']],
        online: { seats: (sel) => +sel.n || 4, min: 2, ranked: false, start: (body, sel, S) => start(body, sel, S) },
        engine: { CARDS, deduce, newKnow, solved, NEIGH, state: () => G }, open, close() { G = null; },
      };
      registerGame(mod);
    })();

