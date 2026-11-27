    /* =========================================================================
       THIRTEEN (Tiến Lên, Vietnam's favourite card game) — Nov 2026, Inna's list. Shown as "Thirteen" in English and
       "Tiến Lên" in Vietnamese. 2-4 players, 13 cards each. 3 is the lowest card, 2 the highest; suits ♠ < ♣ < ♦ < ♥.
       Play singles, pairs, triples, four of a kind, straights (3+ in a row, no 2s) or runs of pairs (3+ pairs in a row).
       Beat the cards on the table with the same kind of play, higher; or pass (out until the next trick).
       Bombs: three pairs in a row or four of a kind beat a single 2; four pairs in a row (or four of a kind) beat a
       pair of 2s. Bombing a 2 earns a point from the player who played it. First out = 1st place; the hand goes on for
       2nd, 3rd... Several hands: places give points (1st most), most points wins.
       Script-style netplay (S.ask at every decision), like Bullshit.
       ========================================================================= */
    (function thirteenGame() {
      const ABORT = { a: 1 };
      const BOTS = [['Luna', '🦉'], ['Bao', '🐻'], ['Minh', '🐸']];
      const SI = { s: 0, c: 1, d: 2, h: 3 };
      const rv = (r) => (r === 2 ? 12 : r === 14 ? 11 : r - 3);          // 3 → 0 ... A → 11, 2 → 12
      const val = (c) => rv(c.r) * 4 + SI[c.s];
      const RN = (r) => ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' })[r] || String(r);
      const RW = (r, n) => { const w = ({ 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace' })[r] || String(r); return n > 1 ? w + 's' : w; };
      const byVal = (a, b) => val(a) - val(b);

      /* ---------- the rules (pure: the tests use them too) ---------- */
      // what kind of play is this? null = not allowed
      function classify(cards) {
        const c = cards.slice().sort(byVal), n = c.length; if (!n) return null;
        const top = val(c[n - 1]), ranks = c.map((x) => rv(x.r));
        const same = ranks.every((x) => x === ranks[0]);
        if (n === 1) return { type: 'single', len: 1, top, r: c[0].r };
        if (same && n <= 4) return { type: ['', '', 'pair', 'triple', 'quad'][n], len: n, top, r: c[0].r };
        const noTwo = !c.some((x) => x.r === 2);
        if (n >= 3 && noTwo && ranks.every((x, i) => i === 0 || x === ranks[i - 1] + 1)) return { type: 'straight', len: n, top, r: c[n - 1].r, lo: c[0].r };
        if (n >= 6 && n % 2 === 0 && noTwo) {
          let ok = true;
          for (let i = 0; i < n; i += 2) { if (ranks[i] !== ranks[i + 1] || (i && ranks[i] !== ranks[i - 2] + 1)) { ok = false; break; } }
          if (ok) return { type: 'pairs', len: n / 2, top, r: c[n - 1].r, lo: c[0].r };
        }
        return null;
      }
      // does play p beat what is on the table (t)? also says whether it was a bomb on 2s
      function beats(p, t) {
        if (!p) return false; if (!t) return true;
        if (p.type === t.type && p.len === t.len) return p.top > t.top;
        const two = t.r === 2 && (t.type === 'single' || t.type === 'pair');
        if (t.type === 'single' && t.r === 2) return p.type === 'quad' || (p.type === 'pairs' && p.len >= 3);
        if (t.type === 'pair' && t.r === 2) return p.type === 'quad' || (p.type === 'pairs' && p.len >= 4);
        if (t.type === 'pairs' && t.len === 3) return p.type === 'quad' || (p.type === 'pairs' && p.len >= 4);
        if (t.type === 'quad') return p.type === 'pairs' && p.len >= 4;
        return !two && false;
      }
      const isBomb = (p, t) => !!(t && p && (p.type !== t.type || p.len !== t.len) && beats(p, t));
      function name(p) {
        if (!p) return '';
        if (p.type === 'single') return (p.r === 2 ? 'A TWO' : RW(p.r)).toUpperCase();
        if (p.type === 'pair') return ('PAIR OF ' + RW(p.r, 2)).toUpperCase();
        if (p.type === 'triple') return ('THREE ' + RW(p.r, 2)).toUpperCase();
        if (p.type === 'quad') return ('FOUR ' + RW(p.r, 2)).toUpperCase();
        if (p.type === 'straight') return `STRAIGHT ${RN(p.lo)} → ${RN(p.r)}`;
        return `${p.len} PAIRS IN A ROW`;
      }
      // every play a hand can make (for the computer and for the "can I play?" checks)
      function combos(hand) {
        const h = hand.slice().sort(byVal), out = [], by = {};
        h.forEach((c) => { (by[rv(c.r)] = by[rv(c.r)] || []).push(c); });
        const subsets = (arr, k) => { const r = []; const go = (s, acc) => { if (acc.length === k) return r.push(acc.slice()); for (let i = s; i < arr.length; i++) { acc.push(arr[i]); go(i + 1, acc); acc.pop(); } }; go(0, []); return r; };
        for (const g of Object.values(by)) for (let k = 1; k <= g.length; k++) for (const s of subsets(g, k)) out.push(s);
        // straights: one card per rank (the lowest), any card of the top rank
        for (let a = 0; a <= 9; a++) for (let b = a + 2; b <= 11; b++) {
          let ok = true; for (let x = a; x <= b; x++) if (!by[x]) { ok = false; break; } if (!ok) break;
          const base = []; for (let x = a; x < b; x++) base.push(by[x][0]);
          for (const t of by[b]) out.push(base.concat([t]));
        }
        // runs of pairs
        for (let a = 0; a <= 9; a++) for (let b = a + 2; b <= 11; b++) {
          let ok = true; for (let x = a; x <= b; x++) if (!by[x] || by[x].length < 2) { ok = false; break; } if (!ok) break;
          const base = []; for (let x = a; x < b; x++) base.push(by[x][0], by[x][1]);
          for (const pr of subsets(by[b], 2)) out.push(base.concat(pr));
        }
        return out.map((cards) => ({ cards, p: classify(cards) })).filter((x) => x.p);
      }
      // the computer: lead with its lowest card in the longest sensible play; follow with the cheapest play that beats
      // the table, keeping 2s and bombs for when they matter
      function botMove(hand, table, mustHave, lvl, others) {
        const all = combos(hand), low = hand.slice().sort(byVal)[0];
        const has = (x, c) => x.cards.some((y) => y.r === c.r && y.s === c.s);
        const cost = (x) => {
          let k = x.p.top;
          const twos = x.cards.filter((c) => c.r === 2).length; if (twos) k += 60 * twos;
          if (x.p.type === 'quad' || (x.p.type === 'pairs')) k += 80;
          // breaking a pair / triple to play a single costs a little
          const same = hand.filter((c) => c.r === x.cards[0].r).length; if (x.p.type === 'single' && same >= 2) k += 6; if (x.p.type === 'pair' && same >= 3) k += 4;
          return k;
        };
        if (!table) {
          let opts = all.filter((x) => !mustHave || has(x, mustHave));
          if (!opts.length) opts = all;
          // lead: the play that gets rid of the most low cards
          const sc = (x) => x.cards.length * 10 - x.p.top - (x.cards.some((c) => c.r === 2) ? 80 : 0) - (x.p.type === 'quad' ? 60 : 0);
          const lowOnes = opts.filter((x) => has(x, low) || mustHave);
          const pickFrom = lowOnes.length ? lowOnes : opts;
          pickFrom.sort((a, b) => sc(b) - sc(a));
          if (lvl === 1) return pick(pickFrom.slice(0, 3)).cards;
          // someone close to going out: lead with something they can't easily beat (a pair or more)
          if (others <= 2) { const multi = pickFrom.filter((x) => x.cards.length >= 2); if (multi.length) return multi[0].cards; }
          return pickFrom[0].cards;
        }
        const ok = all.filter((x) => beats(x.p, table)).sort((a, b) => cost(a) - cost(b));
        if (!ok.length) return null;
        const best = ok[0], expensive = best.cards.some((c) => c.r === 2) || best.p.type === 'quad' || (best.p.type === 'pairs' && best.p.len >= 3 && !(table.r === 2));
        if (lvl === 1) return Math.random() < 0.8 ? pick(ok.slice(0, 2)).cards : null;
        // hold the big stuff while others still have lots of cards, unless the hand is nearly empty
        if (expensive && hand.length > 5 && others > 3 && table.r !== 2 && Math.random() < 0.7) return null;
        return best.cards;
      }

      let G = null;
      const $ = (id) => document.getElementById(id);
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1200px] mx-auto');
        setupScreen(body, mod, [
          { key: 'n', label: 'PLAYERS', def: 4, choices: [[2, '2'], [3, '3'], [4, '4']] },
          { key: 'lvl', label: 'COMPUTER LEVEL', def: 2, local: true, choices: [[1, 'Easy'], [2, 'Smart']] },
          { key: 'hands', label: 'HANDS', def: 3, choices: [[1, '1 hand'], [3, '3 hands'], [5, '5 hands']], hint: 'Each hand: 1st place gets the most points. After the last hand, most points wins.' },
          { key: 'turn', label: 'TURN TIMER', def: 30, choices: [[20, '20 sec'], [30, '30 sec'], [45, '45 sec'], [0, 'Off']], hint: 'Time for each turn. When it runs out you pass (or play your lowest card when you lead).' },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(BOTS.slice(0, +sel.n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel)));
      }
      function start(body, sel, S) {
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, hand: [], pts: 0 }));
        G = { S, me: S.online ? S.me : 0, players, hands: +sel.hands || 3, hand: 0, lvl: +sel.lvl || 2, turnSecs: sel.turn === undefined ? 30 : +sel.turn, over: false, tok: ++GT.cur, log: [], sel: new Set(), places: [], table: null, step: 0, stats: { bombs: 0 } };
        GT.started = true; GT.over = false;
        body.innerHTML = `<div class="grid grid-cols-1 gap-4 items-start">
          <div class="space-y-3 min-w-0"><div id="th-opp" class="ring4">${ringSlots('th')}
            <div class="r-mid felt p-4 flex flex-col items-center justify-center gap-3" style="min-height:200px"><div id="th-center" class="th-center"></div></div></div>
            <div id="th-prompt" class="th-prompt"></div>
            <div id="th-hand" class="th-hand"></div></div>
          <div class="hidden"><div id="th-clock"></div></div><div id="th-log" class="logbox" style="height:240px"></div></div>`;
        S.track();
        G.clock = makeClock($('th-clock'));
        S.onLeft = (a) => { if (!G) return; const q = G.players[a.s]; q.name += ' (CPU)'; q.av = '🤖'; log(`${nm(q)} ${a.t === '_gone' ? 'disconnected' : 'left'}. A computer player takes the seat.`); draw(); };
        npBar('');
        run().catch((e) => { if (e !== ABORT) throw e; });
      }
      async function W(ms) { const t = G && G.tok; await gSleep(window.__fast ? Math.min(ms, 30) : ms); if (!G || G.tok !== t) throw ABORT; }
      const log = (t) => { G.log.push(t); const el = $('th-log'); if (el) { el.innerHTML = G.log.slice(-60).map((x) => `<div>${x}</div>`).join(''); el.scrollTop = el.scrollHeight; } };
      const prompt = (h) => { const e = $('th-prompt'); if (e) { e.innerHTML = h; e.classList.toggle('on', !!h); } };
      const nm = (p) => `<b>${esc(p.name)}</b>`;
      const isMe = (p) => p.seat === G.me;
      const seatEl = (p) => (isMe(p) ? '#th-hand' : '#th-seat-' + p.seat);
      const ORD = (n) => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
      const active = () => G.players.filter((q) => !G.places.includes(q));

      async function run() {
        while (G && !G.over && G.hand < G.hands) {
          await playHand();
          if (G.over) return;
        }
        if (G && !G.over) finish();
      }
      async function playHand() {
        const S = G.S; G.hand++; G.places = []; G.table = null; G.passed = new Set(); G.lastBy = null;
        const deck = S.rng.shuffle(SUITS.flatMap((s) => [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((r) => ({ r, s }))));
        G.players.forEach((q, i) => { q.hand = deck.slice(i * 13, i * 13 + 13); });
        // who starts: the first hand, whoever holds the 3 of spades (or the lowest card) and must play it; later hands,
        // the winner of the last hand, any play
        let first = null;
        if (G.hand === 1 || G.lead === undefined) {
          let lo = 999; G.players.forEach((q, i) => q.hand.forEach((c) => { if (val(c) < lo) { lo = val(c); first = i; G.must = c; } }));
        } else { first = G.lead; G.must = null; }
        G.cur = first;
        log(`<b>Hand ${G.hand}${G.hands > 1 ? ' of ' + G.hands : ''}.</b> Cards are dealt. ${nm(G.players[first])} starts${G.must ? ` (with the ${RW(G.must.r)} of ${({ s: 'spades', c: 'clubs', d: 'diamonds', h: 'hearts' })[G.must.s]})` : ''}.`);
        SFX.play('deal'); draw(); await W(900);
        while (G && !G.over) {
          const p = G.players[G.cur];
          if (!G.places.includes(p) && !G.passed.has(p)) {
            await turn(p);
            if (G.over) return;
            if (active().length <= 1) { const last = active()[0]; if (last) G.places.push(last); break; }
          }
          // the next player still in this trick; if everyone else passed, the last player to play wins the trick
          let nx = G.cur;
          for (let k = 0; k < G.players.length; k++) { nx = (nx + 1) % G.players.length; const q = G.players[nx]; if (!G.places.includes(q) && !G.passed.has(q)) break; }
          const inTrick = active().filter((q) => !G.passed.has(q));
          if (G.table && (inTrick.length === 0 || (inTrick.length === 1 && inTrick[0] === G.lastBy))) {
            const w = G.lastBy;
            log(`Everyone passed. ${nm(w)} wins the trick and leads.`);
            await W(900);
            G.table = null; G.passed = new Set(); G.tableCards = null;
            // the trick winner leads; if they are already out, the next player still in does
            let li = G.players.indexOf(w);
            while (G.places.includes(G.players[li])) li = (li + 1) % G.players.length;
            G.cur = li; draw(); continue;
          }
          if (G.table && inTrick.length === 0) { G.table = null; G.passed = new Set(); }
          G.cur = nx; draw();
        }
        // points for places: with n players, 1st gets n-1, last gets 0
        const n = G.players.length;
        G.places.forEach((q, i) => { q.pts += n - 1 - i; });
        G.lead = G.players.indexOf(G.places[0]);
        log(`Hand over: ${G.places.map((q, i) => `${ORD(i + 1)} ${nm(q)}`).join(', ')}.`);
        G.table = null; G.tableCards = null; draw();
        if (G.hand < G.hands) {
          prompt(`<span class="pix text-amber">HAND ${G.hand} OVER</span> <span class="text-muted">· ${G.places.map((q, i) => `${ORD(i + 1)} ${esc(isMe(q) ? 'You' : q.name)}`).join(' · ')} · next hand soon...</span>`);
          await W(4200); prompt('');
        }
      }
      async function turn(p) {
        const S = G.S, t = G.tok, k = ++G.step, mine = S.mine(p.seat) && !S.bot(p.seat), lead = !G.table;
        G.sel.clear(); draw();
        if (mine) myTurnUI(p, k, lead); else prompt(`<span class="text-muted">${esc(p.name)} is thinking...</span>`);
        if (G.turnSecs && !S.bot(p.seat)) G.clock.start(G.turnSecs, 'Turn', () => {
          if (!mine || !G || G.step !== k || G.over) return;
          G.choose = null; G.sel.clear(); prompt('');
          const auto = lead ? botMove(p.hand, null, G.must, 1, 13).slice(0, 1) : null;
          showToast(lead ? 'Time is up! Your lowest card was played.' : 'Time is up! You passed.', 'info');
          S.act(lead ? { t: 'play', s: p.seat, k, cards: auto } : { t: 'pass', s: p.seat, k });
        }); else G.clock.stop();
        const others = Math.min(...G.players.filter((q) => q !== p && !G.places.includes(q)).map((q) => q.hand.length));
        const lvl = S.online ? (+(S.sel && S.sel.lvl) || 2) : G.lvl;
        const a = await S.ask(p.seat, () => { const c = botMove(p.hand, G.table, G.must, lvl, others); return c ? { t: 'play', k, cards: c } : { t: 'pass', k }; }, 1500 + rnd(900),
          (x) => x.s === p.seat && x.k === k && (x.t === 'pass' || x.t === 'play'));
        if (!G || G.tok !== t) throw ABORT;
        G.clock.stop(); G.choose = null; prompt('');
        let cards = a.t === 'play' ? (a.cards || []).map((c) => p.hand.find((h) => h.r === c.r && h.s === c.s)).filter(Boolean) : [];
        cards = [...new Set(cards)];
        const pl = classify(cards);
        // an impossible play (or a pass when leading) becomes the safest legal move
        if (a.t === 'pass' && lead || (a.t === 'play' && (!pl || !beats(pl, G.table) || (G.must && !cards.includes(p.hand.find((h) => h.r === G.must.r && h.s === G.must.s)))))) {
          if (a.t === 'pass' && !lead) { /* fine */ } else {
            const c = botMove(p.hand, G.table, G.must, 2, 13);
            if (!c) { G.passed.add(p); log(`${nm(p)} passes.`); draw(); return W(500); }
            cards = c.map((x) => p.hand.find((h) => h.r === x.r && h.s === x.s));
          }
        }
        if (a.t === 'pass' && !lead) {
          G.passed.add(p); log(`${nm(p)} passes.`); SFX.play('click');
          draw(); return W(600);
        }
        const play = classify(cards), bomb = isBomb(play, G.table), victim = G.lastBy;
        cards.forEach((c) => p.hand.splice(p.hand.indexOf(c), 1));
        G.must = null;
        if (bomb && G.table && G.table.r === 2 && victim && victim !== p) {
          const n = G.table.type === 'pair' ? 2 : 1;
          p.pts += n; victim.pts -= n; if (isMe(p)) G.stats.bombs++;
          log(`<b class="text-coral">BOMB!</b> ${nm(p)} beats ${nm(victim)}'s 2 with ${name(play).toLowerCase()}: ${nm(victim)} pays ${n} point${n > 1 ? 's' : ''}.`);
          funMoment('th-seat-' + p.seat, { key: 'bomb', icon: '💣', label: 'BOMB', burst: 'BOMB!', sub: `${p.name} beat a 2 with ${name(play).toLowerCase()}`, mine: isMe(p) });
          SFX.play('crash');
        } else { log(`${nm(p)} plays ${name(play).toLowerCase()}.`); SFX.play('card'); }
        const fly = cards.map((c, i) => gFly(seatEl(p), '#th-center', playingCardHTML(c, { cls: 'sm' }), { ms: 380, delay: i * 70, arc: 30 }));
        await W(Math.max(0, ...fly.map((x) => x || 0)));
        G.table = play; G.tableCards = cards.slice().sort(byVal); G.lastBy = p;
        draw();
        if (!p.hand.length) {
          G.places.push(p); const n = G.places.length;
          log(`${nm(p)} is out of cards: <b class="text-amber">${ORD(n)} place!</b>`);
          SFX.play(isMe(p) ? 'win' : 'coin');
          if (isMe(p)) showToast(n === 1 ? 'You went out first! 🏆' : `You finished ${ORD(n)}!`, 'success');
          // a player who goes out on their play: the others may still beat it; if nobody does, the next player leads
          G.passed.delete(p);
        }
        await W(500);
      }
      // my turn: tap cards, then Play (or Pass)
      function myTurnUI(p, k, lead) {
        G.choose = () => {
          const cards = [...G.sel].map((i) => p.hand[i]), pl = classify(cards);
          const mustOk = !G.must || cards.some((c) => c.r === G.must.r && c.s === G.must.s);
          const ok = pl && beats(pl, G.table) && mustOk, bomb = ok && isBomb(pl, G.table);
          let why = '';
          if (!cards.length) why = lead ? (G.must ? `You lead. Your play must include the <b>${RW(G.must.r)} of ${({ s: 'spades', c: 'clubs', d: 'diamonds', h: 'hearts' })[G.must.s]}</b>.` : 'You lead: play anything.') : `Beat <b class="text-amber">${name(G.table).toLowerCase()}</b> with a higher one, or pass.`;
          else if (!pl) why = '<span class="text-coral">Those cards don\'t make a play.</span>';
          else if (!mustOk) why = '<span class="text-coral">Include your lowest card to start.</span>';
          else if (!beats(pl, G.table)) why = `<span class="text-coral">${name(pl).toLowerCase()} doesn't beat ${name(G.table).toLowerCase()}.</span>`;
          else why = `<span class="text-emerald">${name(pl).toLowerCase()}${bomb ? ' · BOMB!' : ''}</span>`;
          const can = combos(p.hand).some((x) => beats(x.p, G.table));
          prompt(`<span class="th-why">${why}</span>
            <button id="th-go" class="btn-game ${bomb ? 'btn-coral' : 'btn-amber'} py-2 px-5 text-sm" ${ok ? '' : 'disabled'}>${bomb ? '💣 BOMB!' : '▶ Play'}</button>
            ${lead ? '' : `<button id="th-pass" class="btn-game btn-graphite py-2 px-5 text-sm">Pass${can ? '' : ' (nothing beats it)'}</button>`}
            ${G.sel.size ? '<button id="th-clear" class="btn-game btn-graphite py-2 px-3 text-xs">Clear</button>' : ''}`);
          const go = $('th-go'); if (go) go.onclick = () => { if (!ok) return; G.choose = null; G.sel.clear(); prompt(''); draw(); G.S.act({ t: 'play', s: p.seat, k, cards }); };
          const ps = $('th-pass'); if (ps) ps.onclick = () => { G.choose = null; G.sel.clear(); prompt(''); draw(); G.S.act({ t: 'pass', s: p.seat, k }); };
          const cl = $('th-clear'); if (cl) cl.onclick = () => { G.sel.clear(); draw(); G.choose(); };
        };
        draw(); G.choose();
      }
      function draw() {
        if (!$('th-opp')) return;
        const S = G.S, cur = G.players[G.cur];
        const others = G.players.map((_, k) => G.players[(G.me + k) % G.players.length]).slice(1);
        const status = (q) => { const pl = G.places.indexOf(q) + 1; return pl ? `<span class="th-out">${ORD(pl).toUpperCase()}</span>` : G.passed && G.passed.has(q) ? '<span class="th-out">PASSED</span>' : ''; };
        ringFill('th', others.map((q) => { const turn = cur === q && !G.over && !G.places.includes(q), n = q.hand.length;
          return `<div id="th-seat-${q.seat}" class="tg-seat ${turn ? 'turn' : ''}"><div class="tg-fan">${Array.from({ length: Math.min(n, 9) }, () => playingCardHTML(null, { cls: 'sm' })).join('')}</div>${nameTag({ av: q.av, name: q.name, sub: `${n} card${n === 1 ? '' : 's'}${G.hands > 1 ? ' · ' + q.pts + ' pts' : ''}`, badge: n, turn })}${status(q)}</div>`; }));
        const t = G.table;
        $('th-center').innerHTML = t ? `<div class="th-played">${G.tableCards.map((c) => playingCardHTML(c, { cls: 'sm' })).join('')}</div><div class="th-combo">${name(t)}</div><div class="th-by">${esc(G.lastBy.name)}${G.passed.size ? ` · ${G.passed.size} passed` : ''}</div>`
          : `<div class="th-empty">${G.over ? '' : `${esc(cur ? (isMe(cur) ? 'You' : cur.name) : '')} lead${cur && isMe(cur) ? '' : 's'}: any play`}</div>${G.hands > 1 ? `<div class="th-by">HAND ${G.hand} OF ${G.hands}</div>` : ''}`;
        // my hand, sorted 3 → 2; tap to pick
        const me = G.players[G.me], picking = !!G.choose;
        const order = me.hand.map((c, i) => ({ c, i })).sort((a, b) => val(a.c) - val(b.c));
        const h = $('th-hand'); h.style.setProperty('--n', Math.max(10, me.hand.length));
        const myPl = G.places.indexOf(me) + 1;
        h.innerHTML = `<div class="tg-mine mb-2"><div id="th-seat-${G.me}" class="inline-block">${nameTag({ av: me.av, name: me.name, sub: myPl ? `${ORD(myPl)} place` : `${me.hand.length} card${me.hand.length === 1 ? '' : 's'}${G.hands > 1 ? ' · ' + me.pts + ' pts' : ''}${G.passed && G.passed.has(me) ? ' · passed' : ''}`, turn: cur === me && !G.over && !myPl, me: true })}</div></div>
          <div class="th-cards">${order.map(({ c, i }) => `<button class="th-card ${G.sel.has(i) ? 'sel' : ''}" data-i="${i}" ${picking ? '' : 'disabled'}>${playingCardHTML(c, { cls: 'sm' })}</button>`).join('')}</div>`;
        h.querySelectorAll('.th-card').forEach((b) => { b.onclick = () => { if (!G.choose) return; const i = +b.dataset.i; if (G.sel.has(i)) G.sel.delete(i); else G.sel.add(i); SFX.play('click'); draw(); G.choose(); }; });
      }
      async function finish() {
        G.over = true; G.S.over = true; G.choose = null; if (G.clock) G.clock.stop();
        const S = G.S, me = G.players[G.me], tok = G.tok;
        // final standings: points, then who did better in the last hand
        const ranked = G.players.slice().sort((a, b) => b.pts - a.pts || G.places.indexOf(a) - G.places.indexOf(b));
        const place = ranked.indexOf(me) + 1, res = place === 1 ? 'win' : 'loss';
        const row = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        const s = gstat('thirteen'); s.bombs = (s.bombs || 0) + G.stats.bombs; if (G.places[0] === me) s.firstOut = (s.firstOut || 0) + 1;
        reportGame('thirteen', res, { place, xp: res === 'win' ? 30 : 10, label: S.online ? 'Online table' : `${G.players.length} players · ${G.hands} hand${G.hands > 1 ? 's' : ''}` });
        gameResult({ title: res === 'win' ? 'You win!' : `You finished ${ORD(place)}`, sub: ranked.map((q, i) => `${ORD(i + 1)} ${isMe(q) ? 'You' : q.name} (${q.pts})`).join(' · '),
          tone: res === 'win' ? 'amber' : 'coral', sprite: res === 'win' ? 'trophy' : 'anchor',
          rows: [['Your place', `${ORD(place)} of ${G.players.length}`, res === 'win' ? 'text-amber' : 'text-bone'], ['Your points', me.pts, 'text-emerald'], ['Bombs', G.stats.bombs, 'text-coral']].concat(row ? [row] : []),
          againLabel: S.online ? 'Back to setup' : 'Play again', again: () => open($('game-root')) });
      }

      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      // tile icon: a fan of three cards with a big red 2 in front
      GICONS.thirteen = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(1, 6, 9, 13, K)}${rr(2, 7, 7, 11, '#2B5C8A')}${rr(7, 3, 10, 15, K)}${rr(8, 4, 8, 13, '#F7F4EC')}${rr(9, 5, 2, 1, K)}${rr(9, 6, 1, 2, K)}${rr(13, 3, 10, 18, K)}${rr(14, 4, 8, 16, '#F7F4EC')}${rr(15, 6, 6, 2, '#D13B55')}${rr(19, 8, 2, 3, '#D13B55')}${rr(15, 11, 6, 2, '#D13B55')}${rr(15, 13, 2, 3, '#D13B55')}${rr(15, 16, 6, 2, '#D13B55')}${rr(0, 20, 12, 3, K)}${rr(1, 21, 10, 1, '#F5B041')}</svg>`;
      const mod = {
        id: 'thirteen', name: 'Thirteen', icon: 'thirteen', cats: ['card'], sub: '2-4 PLAYERS · ~10 MIN', color: '#34D399', tone: 'emerald', btn: 'amber', flag: 'NEW',
        blurb: 'Vietnam\'s favourite card game (Tiến Lên). Beat the cards on the table with higher ones and be the first to get rid of all 13.',
        rules: { tag: 'SHEDDING · 2-4 PLAYERS', steps: [
          '<strong class="text-bone">Goal:</strong> Be the first to play all 13 of your cards. 3 is the lowest card, 2 the highest. For the same number, ♠ < ♣ < ♦ < ♥.',
          '<strong class="text-bone">Plays:</strong> one card, a pair, three or four of a kind, a straight (3+ in a row, no 2s) or pairs in a row (3+ pairs, like 5 5 6 6 7 7).',
          '<strong class="text-bone">Beat it or pass:</strong> Play the same kind (and the same number of cards), but higher. If you pass, you sit out until someone wins the trick. When everyone else passes, the last player to play leads anything.',
          '<strong class="text-bone">Bombs:</strong> three pairs in a row or four of a kind beat a single 2; four pairs in a row beat a pair of 2s. Bombing a 2 wins you a point from that player!',
        ], tip: 'Keep your 2s and bombs for the end. Play your low single cards early, while it is still easy.' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['OUT FIRST', s.firstOut || 0, 'text-emerald'], ['BOMBS', s.bombs || 0, 'text-coral']],
        engine: { classify, beats, isBomb, combos, botMove, name, val, get G() { return G; } }, open, close() { G = null; },
        art: { card: (c) => playingCardHTML(c, { cls: 'sm' }) },
        online: { seats: (sel) => +sel.n || 4, min: 2, ranked: true, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
