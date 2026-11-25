    /* =========================================================================
       POKER: Texas Hold'em sit-and-go, you vs 3 bots. Side pots, rising blinds.
       ========================================================================= */
    (function pokerGame() {
      const CATS = ['High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'];
      const pack = (cat, a) => { let s = cat; for (let i = 0; i < 5; i++) s = s * 15 + (a[i] || 0); return s; };
      function straightHigh(has) {
        for (let h = 14; h >= 5; h--) { let ok = true; for (let k = 0; k < 5; k++) { const r = h - k === 1 ? 14 : h - k; if (!has[r]) { ok = false; break; } } if (ok) return h; }
        return 0;
      }
      function eval7(cs) {
        const cnt = new Array(15).fill(0), su = {};
        for (const c of cs) { cnt[c.r]++; (su[c.s] = su[c.s] || []).push(c.r); }
        let fl = null;
        for (const k in su) if (su[k].length >= 5) fl = su[k].slice().sort((a, b) => b - a);
        if (fl) { const has = []; fl.forEach((r) => { has[r] = 1; }); const sh = straightHigh(has); if (sh) return pack(8, [sh]); }
        const quads = [], trips = [], pairs = [], singles = [];
        for (let r = 14; r >= 2; r--) { if (cnt[r] === 4) quads.push(r); else if (cnt[r] === 3) trips.push(r); else if (cnt[r] === 2) pairs.push(r); else if (cnt[r] === 1) singles.push(r); }
        const hi = (ex) => { for (let r = 14; r >= 2; r--) if (cnt[r] && !ex.includes(r)) return r; return 0; };
        if (quads.length) return pack(7, [quads[0], hi([quads[0]])]);
        if (trips.length && (trips.length > 1 || pairs.length)) { const p = trips.length > 1 ? Math.max(trips[1], pairs[0] || 0) : pairs[0]; return pack(6, [trips[0], p]); }
        if (fl) return pack(5, fl.slice(0, 5));
        const has = cnt.map((n) => n > 0); const sh = straightHigh(has); if (sh) return pack(4, [sh]);
        if (trips.length) return pack(3, [trips[0], ...singles.slice(0, 2)]);
        if (pairs.length >= 2) return pack(2, [pairs[0], pairs[1], Math.max(pairs[2] || 0, singles[0] || 0)]);
        if (pairs.length) return pack(1, [pairs[0], ...singles.slice(0, 3)]);
        return pack(0, singles.slice(0, 5));
      }
      // the five cards that make the best hand (to light them up at the showdown)
      function best5(cs) {
        let best = -1, bestSet = cs.slice(0, 5);
        const n = cs.length;
        for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
          const five = cs.filter((_, k) => k !== a && k !== b);
          if (five.length !== 5) continue;
          const sc = eval7(five); if (sc > best) { best = sc; bestSet = five; }
        }
        return n <= 5 ? cs.slice() : bestSet;
      }
      const catOf = (score) => Math.floor(score / Math.pow(15, 5));
      const handName = (score) => CATS[catOf(score)];

      function equity(hole, board, opps, sims) {
        const known = new Set([...hole, ...board].map((c) => c.r + c.s));
        const rest = [];
        for (const s of SUITS) for (let r = 2; r <= 14; r++) if (!known.has(r + s)) rest.push({ r, s });
        let win = 0;
        for (let i = 0; i < sims; i++) {
          // partial Fisher-Yates
          const need = 5 - board.length + opps * 2;
          for (let j = 0; j < need; j++) { const k = j + Math.floor(Math.random() * (rest.length - j)); const t = rest[j]; rest[j] = rest[k]; rest[k] = t; }
          const full = board.concat(rest.slice(0, 5 - board.length));
          const me = eval7(hole.concat(full));
          let best = 0, ties = 1;
          for (let o = 0; o < opps; o++) {
            const o0 = rest[5 - board.length + o * 2], o1 = rest[5 - board.length + o * 2 + 1];
            const sc = eval7([o0, o1, ...full]);
            if (sc > me) { best = 1; break; } else if (sc === me) ties++;
          }
          if (!best) win += 1 / ties;
        }
        return win / sims;
      }

      function splitPots(players, contrib) {
        // returns [{amount, eligible:[idx]}]
        const lv = [...new Set(contrib.filter((c) => c > 0))].sort((a, b) => a - b);
        const pots = []; let prev = 0;
        for (const L of lv) {
          let amt = 0; contrib.forEach((c) => { amt += Math.max(0, Math.min(c, L) - prev); });
          const elig = players.map((p, i) => i).filter((i) => !players[i].folded && contrib[i] >= L);
          if (amt > 0) { if (elig.length) pots.push({ amount: amt, eligible: elig }); else if (pots.length) pots[pots.length - 1].amount += amt; }
          prev = L;
        }
        return pots;
      }

      const BLINDS = [[10, 20], [20, 40], [40, 80], [75, 150], [150, 300], [300, 600], [600, 1200]];
      const BOTS = [{ n: 'Rex', a: '🐺', agg: 0.55, tight: 0.5 }, { n: 'Luna', a: '🦊', agg: 0.35, tight: 0.7 }, { n: 'Bruno', a: '🐻', agg: 0.7, tight: 0.35 }];
      let G = null;

      function open(root) {
        const body = gameShell(root, mod, '<button id="pk-ranks-btn" class="btn-game btn-amber px-3 py-2 text-xs" onclick="pkRanks()" title="Which poker hands beat which">🃏 <span class="gs-lbl">Hand ranks</span></button>', 'max-w-[1000px] mx-auto');
        setupScreen(body, mod, [
          { key: 'clock', label: 'ACTION TIMER', def: 20, choices: [[0, 'Off'], [15, '15 s'], [20, '20 s'], [30, '30 s']] },
          { key: 'speed', label: 'BLIND LEVELS', def: 6, choices: [[8, 'Slow'], [6, 'Normal'], [4, 'Fast']] },
          { key: 'chips', label: 'STARTING CHIPS', def: 1000, choices: [[500, '500'], [1000, '1000'], [2000, '2000']] },
          { key: 'style', label: 'BOT STYLE', def: 'mixed', local: true, choices: [['careful', 'Careful'], ['mixed', 'Mixed'], ['wild', 'Wild']], hint: 'Wild bots bluff and raise a lot more.' },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(BOTS.map((b) => ({ bot: true, name: b.n, avatar: b.a }))), sel)));
      }

      // seats come from the table (S): on this device seat 0 is you; online every screen has its own seat (G.me)
      function start(body, sel, S) {
        const sty = { careful: [0.6, 0.15], mixed: [1, 0], wild: [1.5, -0.2] }[sel.style] || [1, 0];
        // every seat gets a computer style, so a player who leaves can be replaced by a computer player
        const players = S.seats.map((x, i) => { const b = BOTS[(i + 2) % 3]; return { seat: i, name: x.name, av: x.avatar, bot: Object.assign({}, b, { agg: Math.min(1, b.agg * sty[0]), tight: Math.max(0.1, Math.min(0.9, b.tight + sty[1])) }) }; });
        players.forEach((p) => { p.chips = +sel.chips || 1000; p.out = false; });
        G = { S, me: S.online ? S.me : 0, body, players, secs: +sel.clock, every: +sel.speed, hand: 0, dealer: -1, lvl: 0, finishOrder: [], tok: ++GT.cur, over: false, handsWon: 0, bigPot: 0, log: [] };
        body.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-5 items-start">
          <div class="space-y-3"><div id="pk-table" class="felt p-4 sm:p-5 space-y-4"></div></div>
          <div class="space-y-3"><div id="pk-ctl" class="space-y-2"></div><div class="win overflow-hidden"><div class="winbar teal"><span>TABLE</span><span id="pk-blinds" class="pix text-xs"></span></div><div class="p-3 space-y-2"><div id="pk-clock"></div><div id="pk-place" class="text-xs text-muted"></div></div></div>
          <div id="pk-log" class="logbox" style="height:260px"></div>
          <button id="pk-quit" class="btn-game btn-coral w-full py-2 text-sm">Leave table</button></div></div>`;
        G.clock = makeClock(document.getElementById('pk-clock'));
        S.track();
        S.onLeft = (a) => { if (!G) return; const q = G.players[a.s]; q.name += ' (CPU)'; q.av = '🤖'; log(`<b>${esc(q.name)}</b> ${a.t === '_gone' ? 'disconnected' : 'left the table'}. A computer player takes the seat.`); draw(); };
        npBar('');
        let sure = false;
        document.getElementById('pk-quit').onclick = (e) => { if (S.online) return npConfirmLeave(() => open(document.getElementById('game-root'))); if (!sure) { sure = true; e.target.textContent = 'Really leave?'; gTimeout(() => { sure = false; e.target.textContent = 'Leave table'; }, 3000); return; } if (!G.over) endTournament(true); };
        log(`Sit-and-go started. Everyone has <b>${players[0].chips}</b> chips.`);
        gTimeout(newHand, 400);
      }
      const log = (t) => { G.log.push(t); const el = document.getElementById('pk-log'); if (el) { el.innerHTML = G.log.slice(-40).map((x) => `<div>${x}</div>`).join(''); el.scrollTop = el.scrollHeight; } };
      const alive = () => G.players.filter((p) => !p.out);
      const nextIdx = (i, pred = (p) => !p.out) => { for (let k = 1; k <= G.players.length; k++) { const j = (i + k) % G.players.length; if (pred(G.players[j])) return j; } return i; };

      function newHand() {
        if (G.over) return;
        G.players.forEach((p) => { if (!p.out && p.chips <= 0) { p.out = true; G.finishOrder.push(p); log(`<b>${esc(p.name)}</b> is out of chips.`); } });
        if (alive().length === 1) return endTournament(false);
        if (G.players[G.me].out && !G.S.online) return endTournament(false);
        if (G.players[G.me].out && !G.sawOut) { G.sawOut = true; log('You are out of chips. Watching the rest of the table...'); }
        G.hand++;
        G.lvl = Math.min(BLINDS.length - 1, Math.floor((G.hand - 1) / G.every));
        const [sb, bb] = BLINDS[G.lvl]; G.sb = sb; G.bb = bb;
        G.dealer = nextIdx(G.dealer);
        G.pend = []; G.potLag = 0; G.potPaid = false;
        G.deck = (() => { const d = []; for (const su of SUITS) for (let r = 2; r <= 14; r++) d.push({ r, s: su }); return G.S.rng.shuffle(d); })(); G.board = []; G.street = 0; G.curBet = 0; G.minRaise = bb; G.showdown = false; G.result = null;
        G.players.forEach((p) => { p.hole = []; p.bet = 0; p.total = 0; p.folded = p.out; p.allIn = false; p.acted = false; p.last = ''; });
        const act = alive();
        for (let r = 0; r < 2; r++) act.forEach((p) => p.hole.push(G.deck.pop()));
        SFX.play('deal');
        const heads = act.length === 2;
        const sbI = heads ? G.dealer : nextIdx(G.dealer), bbI = nextIdx(sbI);
        post(sbI, sb, 'SB'); post(bbI, bb, 'BB');
        G.curBet = bb;
        G.toAct = nextIdx(bbI, (p) => !p.folded && !p.allIn);
        if (heads) G.toAct = sbI;
        log(`— Hand ${G.hand} · blinds ${sb}/${bb} —`);
        const t = draw(); const tok = G.tok;
        gTimeout(() => { if (G && G.tok === tok) loop(); }, t + 250);
      }
      function post(i, amt, tag) { const p = G.players[i]; const a = Math.min(amt, p.chips); p.chips -= a; p.bet += a; p.total += a; betFly(i, a); if (p.chips === 0) p.allIn = true; p.last = tag + ' ' + a; }

      const pot = () => G.players.reduce((s, p) => s + p.total, 0);
      const live = () => G.players.filter((p) => !p.folded);

      function loop() {
        if (G.over) return;
        if (live().length === 1) return awardAll();
        const need = G.players.some((p) => !p.folded && !p.allIn && (!p.acted || p.bet < G.curBet));
        const canAct = G.players.filter((p) => !p.folded && !p.allIn);
        if (!need || (canAct.length <= 1 && canAct.every((p) => p.bet >= G.curBet))) return endStreet();
        // find next player that has to act
        let i = G.toAct, guard = 0;
        while (guard++ < 10) { const p = G.players[i]; if (!p.folded && !p.allIn && (!p.acted || p.bet < G.curBet)) break; i = (i + 1) % G.players.length; }
        G.toAct = i; draw();
        const p = G.players[i], S = G.S, tok = G.tok, hand = G.hand, street = G.street;
        // the seat's decision: you tap, the table's host decides for computer seats, online players send theirs
        if (S.mine(i)) humanTurn(i);
        else if (S.bot(i)) G.clock.idle(p.name + ' thinks', '...');
        else if (G.secs) G.clock.start(G.secs + 4, 'Their time', () => {}, 5); else G.clock.idle('Their turn', '...');
        S.ask(i, () => { const [k, a] = botDecide(p); return { t: 'bet', k, a, h: hand, st: street }; }, 900 + rnd(700), (x) => x.s === i && x.t === 'bet').then((a) => {
          if (!G || G.tok !== tok || G.over) return;
          G.clock.stop(); document.getElementById('pk-ctl').innerHTML = '';
          const k = ['fold', 'check', 'call', 'raise'].includes(a.k) ? a.k : 'fold';
          apply(i, k, Math.floor(+a.a || 0));
          gTimeout(loop, 650);
        });
      }

      function apply(i, kind, amt) {
        const p = G.players[i], toCall = Math.min(G.curBet - p.bet, p.chips);
        p.acted = true;
        if (kind === 'fold') {
          const cardsEl = $p('pk-seat-' + G.players.indexOf(p)) && $p('pk-seat-' + G.players.indexOf(p)).querySelector('.tg-cards');
          if (cardsEl && cardsEl.children.length) [...cardsEl.children].forEach((c, k) => gFly(c, '#pk-deck', playingCardHTML(null, { cls: 'sm' }), { ms: 520, delay: k * 90, arc: 70, spin: 300 + k * 40, endScale: 0.8 }));
          p.folded = true; p.last = 'Fold'; SFX.play('card'); log(`<b>${esc(p.name)}</b> folds.`);
        }
        else if (kind === 'check' || (kind === 'call' && toCall === 0)) { p.last = 'Check'; SFX.play('click'); log(`<b>${esc(p.name)}</b> checks.`); }
        else if (kind === 'call') { p.chips -= toCall; p.bet += toCall; p.total += toCall; betFly(i, toCall); if (p.chips === 0) p.allIn = true; p.last = p.allIn ? 'All in' : 'Call ' + toCall; SFX.play('chip'); log(`<b>${esc(p.name)}</b> calls ${toCall}${p.allIn ? ' (all in)' : ''}.`); }
        else { // raise to amt
          const to = Math.min(amt, p.bet + p.chips), add = to - p.bet;
          const raiseSize = to - G.curBet;
          p.chips -= add; p.bet += add; p.total += add; betFly(i, add); if (p.chips === 0) p.allIn = true;
          if (raiseSize >= G.minRaise) { G.minRaise = raiseSize; G.players.forEach((q) => { if (q !== p && !q.folded && !q.allIn) q.acted = false; }); }
          else if (to > G.curBet) G.players.forEach((q) => { if (q !== p && !q.folded && !q.allIn) q.acted = false; });
          const verb = G.curBet === 0 ? 'bets' : 'raises to';
          G.curBet = Math.max(G.curBet, to);
          p.last = p.allIn ? 'All in ' + p.bet : (verb === 'bets' ? 'Bet ' : 'Raise ') + to; SFX.play('chip'); log(`<b>${esc(p.name)}</b> ${verb} ${to}${p.allIn ? ' (all in)' : ''}.`);
        }
        G.toAct = (i + 1) % G.players.length;
        draw();
      }

      /* ----- chips on the table ----- */
      const $p = (id) => document.getElementById(id);
      const betInner = (i) => { const p = G.players[i], amt = p.bet - ((G.pend && G.pend[i]) || 0); return amt > 0 ? `${stackSVG(amt, { scale: 1.1, per: 7 })}<span class="chip-amt">${amt}</span>` : ''; };
      const potShown = () => (G.potPaid ? 0 : pot() - G.players.reduce((t, p) => t + p.bet, 0) - (G.potLag || 0));
      const potInner = () => `${stackSVG(potShown(), { per: 8, scale: 1.3 })}<span class="pix text-sm">POT <span class="text-amber text-lg">${G.potPaid ? 0 : pot()}</span></span>`;
      const paintBet = (i) => { const el = $p('pk-bet-' + i); if (el) { el.style.visibility = ''; el.innerHTML = betInner(i); } };
      const paintPot = () => { const el = $p('pk-pot'); if (el) el.innerHTML = potInner(); };
      // a bet: chips slide from the player's seat to the spot in front of it
      function betFly(i, amt) {
        if (!amt) return;
        G.pend = G.pend || []; G.pend[i] = (G.pend[i] || 0) + amt;
        const seat = $p('pk-seat-' + i);
        const land = () => { if (!G) return; G.pend[i] = Math.max(0, (G.pend[i] || 0) - amt); paintBet(i); };
        if (!seat) return land();
        const t = chipStream(seat.querySelector('.tg-tag') || seat, $p('pk-bet-' + i) || seat, amt, { ms: 420, gap: 60, max: 6 });
        gTimeout(land, t);
      }
      // end of a betting round: every bet slides into the pot. Returns how long that takes.
      function sweep() {
        let lag = 0, lagMs = 0;
        G.players.forEach((p, i) => {
          if (p.bet <= 0) return;
          const el = $p('pk-bet-' + i);
          if (el) { const t = chipStream(el, '#pk-pot', p.bet, { ms: 480, gap: 55, max: 6, delay: i * 90 }); lagMs = Math.max(lagMs, t); el.style.visibility = 'hidden'; }
          lag += p.bet;
        });
        if (!lag) return 0;
        G.pend = []; G.potLag = lag;
        const tok = G.tok; gTimeout(() => { if (G && G.tok === tok) { G.potLag = 0; paintPot(); } }, lagMs);
        return lagMs + 60;
      }
      // the pot slides over to the winner(s)
      function payOut(list) {
        G.potPaid = true; paintPot();
        // the pot pours over to the winner(s), chip by chip
        list.forEach(([i, amt], k) => { const s = $p('pk-seat-' + i); chipStream('#pk-pot', (s && s.querySelector('.tg-tag')) || '#pk-seat-' + i, amt, { ms: 560, gap: 55, max: 12, delay: k * 300, arc: 50 }); });
        SFX.play('coin');
      }

      /* ----- bots ----- */
      function botDecide(p) {
        const opps = live().length - 1;
        const toCall = Math.min(G.curBet - p.bet, p.chips), pt = pot();
        let eq = equity(p.hole, G.board, opps, G.board.length ? 140 : 90);
        // preflop: nudge by tightness
        eq = eq - (p.bot.tight - 0.5) * 0.06;
        const odds = toCall / (pt + toCall || 1);
        const r = Math.random();
        const raiseTo = (frac) => { const target = G.curBet + Math.max(G.minRaise, Math.round((pt + toCall) * frac / 5) * 5); return Math.min(target, p.bet + p.chips); };
        if (toCall === 0) {
          if (eq > 0.66 && r < 0.55 + p.bot.agg * 0.4) return ['raise', raiseTo(0.5 + r * 0.4)];
          if (eq > 0.5 && r < 0.3 * p.bot.agg + 0.2) return ['raise', raiseTo(0.4)];
          if (r < 0.05 * p.bot.agg) return ['raise', raiseTo(0.6)]; // bluff
          return ['check'];
        }
        if (eq > 0.75 && r < 0.5 + p.bot.agg * 0.4 && p.chips > toCall) return ['raise', raiseTo(0.7 + r * 0.5)];
        if (eq > odds + 0.04 + (p.bot.tight - 0.5) * 0.05) return ['call'];
        if (r < 0.04 * p.bot.agg && toCall < pt * 0.4) return ['call'];
        return ['fold'];
      }


      /* ----- human ----- */
      function humanTurn(seat) {
        const me = G.players[seat];
        const toCall = Math.min(G.curBet - me.bet, me.chips);
        const minTo = Math.min(G.curBet + G.minRaise, me.bet + me.chips), maxTo = me.bet + me.chips;
        const canRaise = me.chips > toCall;
        let rv = minTo;
        const pt = pot();
        document.getElementById('pk-ctl').innerHTML = `<div class="win p-3 space-y-3"><div class="flex gap-2 flex-wrap items-center">
          <button id="pk-fold" class="btn-game btn-coral py-2 px-5">Fold</button>
          <button id="pk-call" class="btn-game btn-teal py-2 px-5">${toCall === 0 ? 'Check' : (toCall >= me.chips ? 'Call all in ' + toCall : 'Call ' + toCall)}</button>
          ${canRaise ? `<button id="pk-raise" class="btn-game btn-amber py-2 px-5">${G.curBet === 0 ? 'Bet' : 'Raise to'} <span id="pk-rv">${rv}</span></button>` : ''}</div>
          ${canRaise ? `<div class="flex items-center gap-2 flex-wrap"><input id="pk-sl" type="range" class="range-arcade flex-1" style="min-width:140px" min="${minTo}" max="${maxTo}" step="5" value="${minTo}">
          <button data-q="min" class="btn-game btn-graphite py-1 px-2 text-xs">Min</button><button data-q="half" class="btn-game btn-graphite py-1 px-2 text-xs">½ pot</button><button data-q="pot" class="btn-game btn-graphite py-1 px-2 text-xs">Pot</button><button data-q="all" class="btn-game btn-graphite py-1 px-2 text-xs">All in</button></div>` : ''}</div>`;
        const tok = G.tok, hand = G.hand, street = G.street;
        let sent = false;
        const go = (k, a) => { if (sent || G.tok !== tok || G.toAct !== seat || G.hand !== hand) return; sent = true; G.clock.stop(); document.getElementById('pk-ctl').innerHTML = ''; G.S.act({ t: 'bet', s: seat, k, a, h: hand }); };
        document.getElementById('pk-fold').onclick = () => go('fold');
        document.getElementById('pk-call').onclick = () => go('call');
        if (canRaise) {
          const sl = document.getElementById('pk-sl'), set = (v) => { rv = Math.max(minTo, Math.min(maxTo, Math.round(v / 5) * 5)); if (v >= maxTo) rv = maxTo; sl.value = rv; document.getElementById('pk-rv').textContent = rv; };
          sl.oninput = () => set(+sl.value);
          document.querySelectorAll('[data-q]').forEach((b) => { b.onclick = () => { const q = b.dataset.q; set(q === 'min' ? minTo : q === 'half' ? G.curBet + (pt + toCall) / 2 : q === 'pot' ? G.curBet + pt + toCall : maxTo); }; });
          document.getElementById('pk-raise').onclick = () => go('raise', rv);
        }
        if (G.secs) G.clock.start(G.secs, 'Your time', () => { if (G.tok !== tok || G.toAct !== seat || G.hand !== hand) return; showToast("Time's up!", 'error'); go(toCall === 0 ? 'check' : 'fold'); }, 5);
        else G.clock.idle('No timer', '∞');
      }

      /* ----- streets & showdown ----- */
      function endStreet() {
        sweep();
        G.players.forEach((p) => { p.bet = 0; p.acted = false; if (p.last && !/^(Fold|All in)/.test(p.last)) p.last = ''; });
        G.curBet = 0; G.minRaise = G.bb;
        document.getElementById('pk-ctl').innerHTML = '';
        const canAct = G.players.filter((p) => !p.folded && !p.allIn).length;
        const deal = () => {
          if (G.street >= 3) return showdown();
          G.street++;
          const n = G.street === 1 ? 3 : 1; G.deck.pop();
          for (let i = 0; i < n; i++) G.board.push(G.deck.pop());
          SFX.play('deal'); log(`<i>${['', 'Flop', 'Turn', 'River'][G.street]}</i>`); const t = draw();
          if (canAct <= 1) { gTimeout(deal, t + 1100); return; }
          G.toAct = nextIdx(G.dealer, (p) => !p.folded && !p.allIn);
          gTimeout(loop, t + 350);
        };
        gTimeout(deal, 700);
      }
      function awardAll() {
        const w = live()[0]; const amt = pot();
        w.chips += amt; if (w.seat === G.me) { G.handsWon++; G.bigPot = Math.max(G.bigPot, amt); }
        G.result = { text: `${w.name} wins ${amt}` }; log(`<b>${esc(w.name)}</b> wins <b>${amt}</b> (everyone else folded).`);
        // fun moment: 3 hands in a row won without showing the cards
        G.bluffs = G.bluffs || {}; const wi = G.players.indexOf(w); Object.keys(G.bluffs).forEach((k) => { if (+k !== wi) G.bluffs[k] = 0; }); G.bluffs[wi] = (G.bluffs[wi] || 0) + 1;
        if (G.bluffs[wi] === 3) funMoment('pk-seat-' + wi, { key: 'bluff', icon: '😎', label: 'BLUFF KING', burst: 'BLUFF KING!', sub: `${w.name} took 3 pots in a row without showing`, mine: wi === G.me });
        const sw = sweep();
        G.players.forEach((p) => { p.bet = 0; });
        SFX.play(w.seat === G.me ? 'win' : 'chip'); draw();
        const tok = G.tok; gTimeout(() => { if (G && G.tok === tok) payOut([[G.players.indexOf(w), amt]]); }, sw + 150);
        nextHandSoon(sw);
      }
      function showdown() {
        G.showdown = true; G.clock.idle('Showdown', '—');
        const sc = G.players.map((p) => (p.folded ? -1 : eval7(p.hole.concat(G.board))));
        const pots = splitPots(G.players, G.players.map((p) => p.total));
        const won = G.players.map(() => 0);
        for (const pt of pots) {
          let best = -1; pt.eligible.forEach((i) => { if (sc[i] > best) best = sc[i]; });
          const ws = pt.eligible.filter((i) => sc[i] === best);
          const share = Math.floor(pt.amount / ws.length); ws.forEach((i) => { won[i] += share; }); won[ws[0]] += pt.amount - share * ws.length;
        }
        const winners = [];
        G.players.forEach((p, i) => { p.chips += won[i]; if (won[i] > 0) winners.push(i); });
        winners.forEach((i) => log(`<b>${esc(G.players[i].name)}</b> wins <b>${won[i]}</b> with ${handName(sc[i])}.`));
        // fun moment: winning a showdown after going all in
        winners.forEach((i) => { if (G.players[i].allIn) funMoment('pk-seat-' + i, { key: 'allin', icon: '⚡', label: 'ALL-IN HERO', burst: 'ALL-IN HERO!', sub: `${G.players[i].name} went all in and won`, mine: i === G.me }); });
        if (won[G.me] > 0) { G.handsWon++; G.bigPot = Math.max(G.bigPot, won[G.me]); }
        const winCards = new Set(); winners.forEach((i) => best5(G.players[i].hole.concat(G.board)).forEach((c) => winCards.add(gKey(c))));
        G.result = { won, sc, winCards, text: winners.map((i) => `${G.players[i].name} wins ${won[i]}`).join(' · '),
          banner: winners.map((i) => `${G.players[i].name} wins ${won[i]} with ${({ 'High card': 'high card', Pair: 'a pair', 'Two pair': 'two pair', 'Three of a kind': 'three of a kind', Straight: 'a straight', Flush: 'a flush', 'Full house': 'a full house', 'Four of a kind': 'four of a kind', 'Straight flush': 'a straight flush' })[handName(sc[i])] || handName(sc[i])}`).join(' · ') };
        SFX.play(won[G.me] > 0 ? 'win' : 'chip');
        const t = draw(); const tok = G.tok;
        gTimeout(() => { if (G && G.tok === tok) payOut(winners.map((i) => [i, won[i]])); }, t + 900);
        nextHandSoon(t, SHOWDOWN_MS);   // a long look at the cards: who won, and with what
      }
      const SHOWDOWN_MS = 7500;
      function nextHandSoon(extra, wait) {
        const tok = G.tok, total = (wait || 3400) + (extra || 0), t0 = Date.now();
        // a countdown, so everyone knows the next hand is coming
        const cd = gInterval(() => { if (!G || G.tok !== tok) return gClearInt(cd); const el = document.getElementById('pk-next'); const left = Math.ceil((total - (Date.now() - t0)) / 1000); if (el) el.textContent = left > 0 ? `NEXT HAND IN ${left}` : ''; if (left <= 0) gClearInt(cd); }, 250);
        gTimeout(() => {
          if (!G || G.tok !== tok) return;
          const t = document.getElementById('pk-table');
          if (t) t.querySelectorAll('[data-fk]').forEach((el, k) => gGhost(el, { delay: k * 30, scale: '0.85' }));
          gTimeout(() => { if (G && G.tok === tok) newHand(); }, 450);
        }, total);
      }

      function endTournament(quit) {
        if (G.over) return;
        G.over = true; G.S.over = true; G.clock.stop();
        document.getElementById('pk-ctl').innerHTML = '';
        const order = G.finishOrder.slice().reverse(); // out last ... first
        const rem = alive().sort((a, b) => b.chips - a.chips);
        const ranking = [...rem, ...order];
        let place = ranking.indexOf(G.players[G.me]) + 1; if (quit && !G.players[G.me].out) place = 4;
        const win = place === 1;
        const elo = G.S.online ? 0 : [20, 4, -4, -10][place - 1];
        const s = gstat('poker'); s.handsWon = (s.handsWon || 0) + G.handsWon; s.bigPot = Math.max(s.bigPot || 0, G.bigPot); s.bestPlace = Math.min(s.bestPlace || 4, place);
        reportGame('poker', win ? 'win' : 'loss', { place, elo, xp: [60, 35, 20, 12][place - 1], label: `${G.S.online ? 'Online · ' : ''}Finished ${['1st', '2nd', '3rd', '4th'][place - 1]} · ${G.hand} hands` });
        SFX.play(win ? 'win' : 'lose');
        gameResult({ title: win ? 'You won the table!' : `You finished ${['1st', '2nd', '3rd', '4th'][place - 1]}`, sub: quit ? 'You left the table.' : win ? (G.S.online ? 'Everyone else is out of chips.' : 'Every bot is out of chips.') : G.S.online ? `${ranking[0].name} took every chip.` : 'You ran out of chips.', tone: win ? 'amber' : 'coral', sprite: win ? 'trophy' : 'anchor', rows: [['Hands played', G.hand, 'text-bone'], ['Hands won', G.handsWon, 'text-amber'], ['Biggest pot', G.bigPot, 'text-teal']].concat(G.S.online ? [] : [['Elo', (elo > 0 ? '+' : '') + elo, elo >= 0 ? 'text-emerald' : 'text-coral']]), againLabel: G.S.online ? 'Back to setup' : 'New table', again: () => open(document.getElementById('game-root')) });
      }

      /* ----- drawing ----- */
      function seatHTML(p, i) {
        const showCards = p.seat === G.me || (G.showdown && !p.folded);
        const wc = G.showdown && G.result && G.result.winCards;
        const cards = p.hole.length && !(p.folded && !G.showdown) ? p.hole.map((c) => playingCardHTML(c, { down: !showCards, cls: 'sm' + (wc && showCards ? (wc.has(gKey(c)) ? ' pk-win' : ' pk-lose') : ''), fk: gKey(c) })).join('') : '';
        const sc = G.showdown && G.result && G.result.sc && !p.folded && G.result.sc[i] >= 0 ? handName(G.result.sc[i]) : '';
        const win = G.result && G.result.won && G.result.won[i] > 0;
        const turn = G.toAct === i && !G.showdown && !p.folded && !p.out && !G.over;
        // name tag style: the cards lie on the table, a small tag (picture, name, chips) sits under them
        return `<div id="pk-seat-${i}" class="tg-seat ${turn ? 'turn' : ''} ${p.folded ? 'tg-fold' : ''} ${p.out ? 'tg-out' : ''}">
          <div class="tg-cards">${cards}</div>
          ${nameTag({ av: p.av, name: p.name, sub: p.out ? 'OUT' : `${p.chips} chips`, turn, dealer: G.dealer === i, me: p.seat === G.me })}
          <div class="tg-st ${win ? 'text-emerald' : /^All in/.test(p.last || '') ? 'allin' : ''}">${win ? 'WINS ' + G.result.won[i] : sc || p.last || ''}</div></div>`;
      }
      // returns how long the card movement takes, so the game can wait for it
      function draw() {
        const t = document.getElementById('pk-table'); if (!t) return 0;
        const ps = G.players;
        const before = gSnap(t);
        const spot = (i) => `<div id="pk-bet-${i}" class="chip-spot" style="min-height:44px"${G.pend && G.pend[i] >= ps[i].bet && ps[i].bet ? '' : ''}>${betInner(i)}</div>`;
        const rot = ps.map((_, k) => (G.me + k) % ps.length).slice(1);
        // the other players sit around the felt: next on your left, then across, then on your right; bets face the middle
        const side = (i, pos) => pos === 'top' ? `<div class="flex flex-col items-center gap-1">${seatHTML(ps[i], i)}${spot(i)}</div>` : `<div class="flex ${pos === 'l' ? 'flex-row' : 'flex-row-reverse'} max-sm:flex-col items-center gap-1">${seatHTML(ps[i], i)}${spot(i)}</div>`;
        const pos = rot.length === 1 ? ['top'] : rot.length === 2 ? ['l', 'r'] : rot.map((_, k) => (k === 0 ? 'l' : k === rot.length - 1 ? 'r' : 'top'));
        t.innerHTML = `<div class="ring4">${ringSlots('pk')}
          <div class="r-mid text-center space-y-2"><div class="flex items-end justify-center gap-4"><span id="pk-deck" class="g-deck">${playingCardHTML(null, { cls: 'sm' })}</span><div id="pk-pot" class="chip-spot" style="min-width:120px">${potInner()}</div></div>
          <div class="pk-board flex justify-center gap-2 min-h-[94px] flex-wrap">${G.board.map((c) => playingCardHTML(c, { fk: gKey(c), cls: G.showdown && G.result && G.result.winCards ? (G.result.winCards.has(gKey(c)) ? 'pk-win' : 'pk-lose') : '' })).join('')}</div>
          ${G.showdown && G.result && G.result.banner ? `<div class="pk-banner">🏆 ${esc(G.result.banner)}</div>` : `<div class="pix text-xs text-bone/80 min-h-[16px]">${G.result ? esc(G.result.text) : ''}</div>`}
          <div id="pk-next" class="pix text-xs text-muted min-h-[16px]"></div></div>
          <div class="r-me flex flex-col items-center gap-1">${spot(G.me)}${seatHTML(ps[G.me], G.me)}</div></div>`;
        ringFill('pk', rot.map((i, k) => side(i, pos[k])));
        const bl = document.getElementById('pk-blinds'); if (bl) bl.textContent = `${G.sb}/${G.bb}`;
        const pl = document.getElementById('pk-place'); if (pl) pl.textContent = `Hand ${G.hand} · ${alive().length} players left · blinds rise every ${G.every} hands`;
        return gFlip(t, before, { from: '#pk-deck' });
      }

      /* ---------- hand ranks chart (Inna: example pictures in the guide + a button while playing) ---------- */
      // each example: five cards; the ones that make the hand are lit, the leftovers dimmed
      const RANK_EX = [
        ['Royal flush', 'A K Q J 10, all one suit. The best hand.', [[14, 's'], [13, 's'], [12, 's'], [11, 's'], [10, 's']], 5],
        ['Straight flush', 'Five in a row, all one suit.', [[9, 'h'], [8, 'h'], [7, 'h'], [6, 'h'], [5, 'h']], 5],
        ['Four of a kind', 'Four cards of the same rank.', [[12, 's'], [12, 'h'], [12, 'd'], [12, 'c'], [4, 'h']], 4],
        ['Full house', 'Three of a kind plus a pair.', [[10, 'h'], [10, 'd'], [10, 's'], [7, 'c'], [7, 'h']], 5],
        ['Flush', 'Any five cards of one suit.', [[13, 'd'], [10, 'd'], [8, 'd'], [5, 'd'], [3, 'd']], 5],
        ['Straight', 'Five in a row, mixed suits.', [[8, 'c'], [7, 'd'], [6, 'h'], [5, 's'], [4, 'c']], 5],
        ['Three of a kind', 'Three cards of the same rank.', [[7, 's'], [7, 'h'], [7, 'd'], [13, 'c'], [3, 'h']], 3],
        ['Two pair', 'Two different pairs.', [[11, 'h'], [11, 'c'], [4, 's'], [4, 'd'], [9, 'h']], 4],
        ['Pair', 'Two cards of the same rank.', [[14, 'h'], [14, 'd'], [9, 's'], [6, 'c'], [2, 'h']], 2],
        ['High card', 'Nothing matches: your highest card counts.', [[14, 'c'], [11, 'd'], [8, 'h'], [6, 's'], [3, 'c']], 1],
      ];
      function ranksHTML(mark) {
        return `<div class="pk-ranks">${RANK_EX.map(([n, d, cards, lit], k) => `<div class="pk-rank ${mark === n ? 'me' : ''}"><div class="pk-rn"><span class="pix text-amber">${k + 1}</span><span><b>${n}</b>${mark === n ? ' <span class="pk-yours">YOUR HAND</span>' : ''}<br><span class="text-xs text-muted">${d}</span></span></div>
          <div class="pk-rc">${cards.map(([r, su], i) => playingCardHTML({ r, s: su }, { cls: 'sm' + (i >= lit ? ' dim' : '') })).join('')}</div></div>`).join('')}</div>`;
      }
      function openRanks() {
        let el = document.getElementById('pk-ranks-modal');
        if (!el) { el = document.createElement('div'); el.id = 'pk-ranks-modal'; el.className = 'hidden fixed inset-0 z-[64] bg-black/75 overflow-y-auto p-4'; document.body.appendChild(el); el.onclick = (e) => { if (e.target === el || e.target.closest('[data-x]')) el.classList.add('hidden'); }; }
        // light up the rank you hold right now
        let mark = null;
        if (G && G.players && G.players[G.me] && G.players[G.me].hole && G.players[G.me].hole.length === 2 && !G.players[G.me].folded && (G.board || []).length >= 3) mark = handName(eval7(G.players[G.me].hole.concat(G.board)));
        if (mark === 'Straight flush' && G) { const h = G.players[G.me].hole.concat(G.board); const b = best5(h); if (b && b.some((c) => c.r === 14) && b.some((c) => c.r === 13)) mark = 'Royal flush'; }
        el.innerHTML = `<div class="win max-w-lg mx-auto my-4 sm:my-10 overflow-hidden"><div class="winbar amber"><span>POKER HANDS · BEST TO WORST</span><button class="pix text-sm" data-x aria-label="Close">✕</button></div>
          <div class="p-4 space-y-3">${ranksHTML(mark)}<div class="text-xs text-muted">The bright cards make the hand. If two players have the same kind of hand, the higher cards win.</div><button class="btn-game btn-graphite w-full py-2" data-x>Close</button></div></div>`;
        el.classList.remove('hidden'); SFX.play('card');
      }
      window.pkRanks = openRanks;

      const mod = {
        id: 'poker', name: 'Poker', icon: 'poker', cats: ['card'], sub: '4 PLAYERS · SIT & GO', color: '#F5B041', tone: 'amber', btn: 'amber',
        blurb: "Texas Hold'em against three bots. Everyone starts with 1000 chips and the blinds keep rising. Last one standing wins.",
        rules: { tag: "TEXAS HOLD'EM", steps: [
          '<strong class="text-bone">The deal:</strong> Everyone gets 2 private cards. Five shared cards come out in three steps: the flop (3), the turn (1) and the river (1).',
          '<strong class="text-bone">Betting:</strong> On your turn you can <b>Fold</b>, <b>Check/Call</b> or <b>Raise</b>. The best 5-card hand wins the pot at the showdown.',
          '<strong class="text-bone">Sit &amp; Go:</strong> Play until one player has all the chips. The blinds go up every few hands so the game always ends.',
        ], tip: 'From best to worst: straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, pair, high card.' },
        profileTiles: (s) => [['TABLES WON', s.wins, 'text-amber'], ['TABLES', s.played, 'text-bone'], ['HANDS WON', s.handsWon || 0, 'text-emerald'], ['BIG POT', s.bigPot || 0, 'text-teal']],
        extraRows: (s) => srow('Best finish', s.bestPlace ? ['', '1st', '2nd', '3rd', '4th'][s.bestPlace] : '-'),
        art: { ranks: () => ranksHTML() },
        engine: { eval7, handName, splitPots, equity, get G() { return G; } }, open, close() { G = null; },
        online: { seats: () => 4, min: 2, ranked: false, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();

