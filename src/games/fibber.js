    /* =========================================================================
       FIBBER (original game, Nov 2026): a family-friendly bluffing card game for 3-5 players.
       All 52 cards are dealt. Turns go round the table and every turn gets a random rank (never the same twice in a row). On your turn put 1 to 4 cards face down and say they are that rank (you may fib!).
       Anyone can shout FIBBER! The cards are turned over: if any of them is not that rank, the fibber picks up the
       whole pile; if they were all true, the person who shouted picks it up. First to get rid of every card wins.
       Script-style netplay: every decision goes through S.ask, so it plays the same on this device and online.
       ========================================================================= */
    (function fibberGame() {
      const ORDER = [14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
      const WORD = { 14: 'Ace', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten', 11: 'Jack', 12: 'Queen', 13: 'King' };
      const plural = (r, n) => `${n} ${WORD[r]}${n === 1 ? '' : r === 6 ? 'es' : 's'}`;
      const ABORT = { a: 1 };
      const BOTS = [['Luna', '🦉'], ['Rex', '🦖'], ['Pip', '🐸'], ['Mabel', '🐼']];

      /* ---------- the computer's choices (pure: used by the tests too) ---------- */
      // which cards to put down: the real ones if it has them (sometimes slipping in one extra), otherwise a small fib
      function botPlay(hand, need, rng) {
        const real = hand.map((c, i) => ({ c, i })).filter((x) => x.c.r === need).map((x) => x.i);
        const others = hand.map((c, i) => ({ c, i })).filter((x) => x.c.r !== need);
        // fib with the cards that are furthest from coming up again
        const far = others.sort((a, b) => dist(need, b.c.r) - dist(need, a.c.r)).map((x) => x.i);
        if (real.length) {
          const extra = far.length && real.length < 3 && hand.length > 4 && rng() < 0.25 ? [far[0]] : [];
          return real.concat(extra).slice(0, 4);
        }
        return far.slice(0, hand.length > 6 && rng() < 0.3 ? 2 : 1);
      }
      const dist = (from, r) => ((ORDER.indexOf(r) - ORDER.indexOf(from)) % 13 + 13) % 13;
      // should this computer player shout FIBBER? (it knows its own hand and how many cards are in the claim)
      function botDoubt(hand, need, count, theirLeft, rng) {
        const mine = hand.filter((c) => c.r === need).length;
        if (mine + count > 4) return true;                                 // impossible: there are only 4 of each
        let p = [0, 0.06, 0.16, 0.35, 0.55][count] + mine * 0.12;
        if (theirLeft === 0) p += 0.45; else if (theirLeft <= 2) p += 0.2;  // stop them winning
        return rng() < p;
      }

      let G = null;
      const $ = (id) => document.getElementById(id);
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1200px] mx-auto');
        setupScreen(body, mod, [
          { key: 'n', label: 'PLAYERS', def: 4, choices: [[3, '3'], [4, '4'], [5, '5']] },
          { key: 'turn', label: 'TURN TIMER', def: 30, choices: [[20, '20 sec'], [30, '30 sec'], [45, '45 sec'], [0, 'Off']], hint: 'How long each player has to put cards down. The outline of their name tag runs out like a clock.' },
          { key: 'secs', label: 'TIME TO SHOUT', def: 7, choices: [[5, '5 sec'], [7, '7 sec'], [10, '10 sec']], hint: 'How long everyone has to shout BULLSHIT! after each play.' },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(BOTS.slice(0, +sel.n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel)));
      }
      function start(body, sel, S) {
        const deck = S.rng.shuffle(newDeckSorted());
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, hand: [] }));
        deck.forEach((c, k) => players[k % players.length].hand.push(c));
        G = { S, me: S.online ? S.me : 0, players, pile: [], step: 0, cur: S.rng.rnd(players.length), need: ORDER[S.rng.rnd(13)], last: null, secs: +sel.secs || 7, turnSecs: sel.turn === undefined ? 30 : +sel.turn, over: false, tok: ++GT.cur, log: [], sel: new Set(), places: [], stats: { caught: 0, fooled: 0, lied: 0 } };
        GT.started = true; GT.over = false;
        body.innerHTML = `<div class="grid grid-cols-1 gap-5 items-start">
          <div class="space-y-3 min-w-0"><div id="fb-opp" class="ring4">${ringSlots('fb')}
            <div class="r-mid felt p-4 flex flex-col items-center justify-center gap-3" style="min-height:220px"><div id="fb-center" class="flex items-center justify-center gap-6 flex-wrap"></div><div id="fb-claim" class="fb-claim"></div></div></div>
            <div id="fb-prompt" class="win p-3 text-center min-h-[52px] text-sm"></div>
            <div class="text-center"><button id="fb-quit" class="hidden btn-game btn-amber py-2 px-6 text-sm">See the results now</button></div>
            <div id="fb-hand" class="fb-hand"></div></div>
          <div class="hidden"><div id="fb-clock"></div><span id="fb-status"></span><span id="fb-step"></span></div><div id="fb-log" class="logbox" style="height:240px"></div></div>`;
        S.track();
        G.clock = makeClock($('fb-clock'));
        S.onLeft = (a) => {
          if (!G) return; const q = G.players[a.s]; q.name += ' (CPU)'; q.av = '🤖';
          log(`${nm(q)} ${a.t === '_gone' ? 'disconnected' : 'left'}. A computer player takes the seat.`); draw();
        };
        npBar('');
        $('fb-quit').onclick = () => { if (G && !G.over && G.places.includes(G.players[G.me])) endNow(); };
        log(`Cards are dealt. ${nm(G.players[G.cur])} starts with <b>Aces</b>.`);
        draw();
        run().catch((e) => { if (e !== ABORT) throw e; });
      }
      function newDeckSorted() { const d = []; for (const s of SUITS) for (let r = 2; r <= 14; r++) d.push({ r, s }); return d; }
      async function W(ms) { const t = G && G.tok; await gSleep(window.__fast ? Math.min(ms, 40) : ms); if (!G || G.tok !== t) throw ABORT; }
      const log = (t) => { G.log.push(t); const el = $('fb-log'); if (el) { el.innerHTML = G.log.slice(-40).map((x) => `<div>${x}</div>`).join(''); el.scrollTop = el.scrollHeight; } };
      const prompt = (h) => { const e = $('fb-prompt'); if (e) e.innerHTML = h; };
      const nm = (p) => `<b>${esc(p.name)}</b>`;
      const isMe = (p) => p.seat === G.me;
      const seatEl = (p) => (isMe(p) ? '#fb-hand' : '#fb-seat-' + p.seat);

      async function run() {
        while (G && !G.over) {
          const p = G.players[G.cur];
          await turn(p);
          if (G.over) return;
          do G.cur = (G.cur + 1) % G.players.length; while (G.places.includes(G.players[G.cur]));
          { const nx = ORDER.filter((r) => r !== G.need); G.need = nx[G.S.rng.rnd(nx.length)]; }
          draw();
        }
      }
      async function turn(p) {
        const S = G.S, t = G.tok, k = ++G.step, mine = S.mine(p.seat);
        $('fb-status').textContent = mine ? 'YOUR TURN' : `${p.name.toUpperCase()}'S TURN`;
        G.sel.clear(); draw();
        if (mine) myPlayUI(p, k); else prompt(`<span class="text-muted">${esc(p.name)} is choosing cards...</span>`);
        if (G.turnSecs && !S.bot(p.seat)) G.clock.start(G.turnSecs, 'Turn', () => {
          if (!mine || !G || G.step !== k || G.over || !G.choose) return;
          const pick = botPlay(p.hand, G.need, Math.random).slice(0, 1).map((i) => p.hand[i]);
          G.choose = null; G.sel.clear(); prompt(''); showToast('Time is up! One card was put down for you.', 'info');
          G.S.act({ t: 'play', s: p.seat, k, cards: pick.length ? pick : [p.hand[0]] });
        }); else G.clock.stop();
        const a = await S.ask(p.seat, () => ({ t: 'play', k, cards: botPlay(p.hand, G.need, Math.random).map((i) => p.hand[i]) }), 2000 + rnd(1000), (x) => x.s === p.seat && x.t === 'play' && x.k === k);
        if (!G || G.tok !== t) throw ABORT;
        G.clock.stop();
        prompt('');
        // take the named cards out of the hand (an honest table always finds them)
        let cards = (a.cards || []).map((c) => p.hand.find((h) => h.r === c.r && h.s === c.s)).filter(Boolean);
        cards = [...new Set(cards)].slice(0, 4);
        if (!cards.length) cards = [p.hand[0]];
        cards.forEach((c) => p.hand.splice(p.hand.indexOf(c), 1));
        G.pile.push(...cards); noDoubles();
        G.last = { p, cards, need: G.need };
        SFX.play('card');
        log(`${nm(p)} puts down ${cards.length} card${cards.length === 1 ? '' : 's'}: "<b>${plural(G.need, cards.length)}</b>".`);
        const fly = cards.map((c, i) => gFly(seatEl(p), '#fb-pile', playingCardHTML(null, { cls: 'sm' }), { ms: 420, delay: i * 120, arc: 40 }));
        draw();
        await W(Math.max(0, ...fly.map((x) => x || 0)) + 200);
        if (isMe(p)) { if (cards.some((c) => c.r !== G.need)) G.stats.lied++; }
        await doubtWindow(p, cards, k);
      }
      // my turn: tap cards to pick them, then "Put down"
      function myPlayUI(p, k) {
        G.choose = () => {
          const n = G.sel.size;
          prompt(`<div class="flex items-center justify-center gap-3 flex-wrap"><span>Pick 1 to 4 cards and say they are <b class="text-amber">${WORD[G.need]}s</b>.</span>
            <button id="fb-go" class="btn-game btn-amber py-2 px-5 text-sm" ${n ? '' : 'disabled'}>Put down ${n ? plural(G.need, n) : ''}</button></div>`);
          const b = $('fb-go'); if (b) b.onclick = () => { if (!G.sel.size) return; const cards = [...G.sel].map((i) => p.hand[i]); G.choose = null; G.sel.clear(); prompt(''); draw(); G.S.act({ t: 'play', s: p.seat, k, cards }); };
        };
        draw(); G.choose();
      }
      // everyone else may shout FIBBER! (first tap wins; the host decides for computer players)
      async function doubtWindow(p, cards, k) {
        const S = G.S, t = G.tok, me = G.players[G.me], others = G.players.filter((q) => q !== p && !G.places.includes(q));
        const people = others.filter((q) => !S.bot(q.seat));
        if (S.mine(me.seat) && me !== p && others.includes(me)) {
          let left = G.secs, tm = null, done = false;
          const fin = (v) => { if (done) return; done = true; if (tm) gClearInt(tm); if (G && G.step === k) prompt(''); if (v && G) S.act({ t: 'doubt', s: me.seat, k }); };
          G.stopDoubt = () => { done = true; if (tm) gClearInt(tm); };
          prompt(`<div class="flex items-center justify-center gap-3 flex-wrap"><span>${esc(p.name)} says <b>${plural(G.need, cards.length)}</b>. Believe it?</span><button id="fb-doubt" class="btn-game btn-coral py-2 px-6 text-base">BULLSHIT! (${left})</button><button id="fb-ok" class="btn-game btn-graphite py-2 px-4 text-sm">I believe it</button></div>`);
          $('fb-doubt').onclick = () => fin(true);
          $('fb-ok').onclick = () => { fin(false); if (G && G.step === k) prompt('<span class="text-muted">Waiting for the others...</span>'); };
          tm = gInterval(() => { left -= 0.25; if (left <= 0) fin(false); else { const b = $('fb-doubt'); if (b) b.textContent = `BULLSHIT! (${Math.ceil(left)})`; } }, 250);
        } else if (isMe(p)) prompt('<span class="text-muted">Will anyone call your bluff...?</span>');
        const botFn = () => {
          for (const b of others.filter((q) => S.bot(q.seat))) if (botDoubt(b.hand, G.need, cards.length, p.hand.length, Math.random)) return { t: 'doubt', s: b.seat, k };
          return { t: 'nodoubt', k };
        };
        // with people at the table, wait the full time; with only computers, a quick look
        const a = await S.ask(-1, botFn, people.length && !(people.length === 1 && people[0] === p) ? G.secs * 1000 + 300 : 1500 + rnd(800),
          (x) => x.k === k && (x.t === 'nodoubt' || (x.t === 'doubt' && others.some((q) => q.seat === x.s))));
        if (!G || G.tok !== t) throw ABORT;
        if (G.stopDoubt) { G.stopDoubt(); G.stopDoubt = null; }
        prompt('');
        if (a.t !== 'doubt') {
          if (isMe(p) && cards.some((c) => c.r !== G.need)) G.stats.fooled++;
          if (cards.some((c) => c.r !== G.need)) { G.lies = G.lies || {}; const pi = G.players.indexOf(p); G.lies[pi] = (G.lies[pi] || 0) + 1; if (G.lies[pi] === 3) funMoment('fb-seat-' + p.seat, { key: 'liar', icon: '🎭', label: 'SMOOTH LIAR', burst: 'SMOOTH LIAR!', sub: `${p.name} got away with 3 bluffs`, mine: isMe(p) }); }
          if (!p.hand.length) return placeOut(p);
          return;
        }
        // turn the cards over
        const caller = G.players[a.s], lie = cards.some((c) => c.r !== G.need);
        SFX.play('nope');
        log(`${nm(caller)} shouts <b class="text-coral">BULLSHIT!</b>`);
        G.reveal = { cards, lie, caller, p };
        draw(); SFX.play('reveal');
        await W(2800);
        const loser = lie ? p : caller;
        if (lie) log(`It was a lie! ${nm(p)} picks up the pile (${G.pile.length} cards).`);
        else log(`It was true! ${nm(caller)} picks up the pile (${G.pile.length} cards).`);
        if (lie && isMe(caller)) G.stats.caught++;
        // fun moments: right BULLSHIT calls in a row = on fire; a lie that gets through 3 times = smooth liar
        G.streak = G.streak || {}; const ci = G.players.indexOf(caller);
        G.streak[ci] = lie ? (G.streak[ci] || 0) + 1 : 0;
        if (lie && G.streak[ci] >= 2) funMoment('fb-seat-' + caller.seat, { key: 'fire', icon: '🔥', label: 'x' + G.streak[ci], fire: true, burst: 'ON FIRE!', sub: `${caller.name} called BULLSHIT right ${G.streak[ci]} times in a row`, mine: isMe(caller) });
        if (!lie) G.streak[ci] = 0;
        SFX.play(lie === isMe(caller) || (!lie && isMe(p)) ? 'coin' : 'wrong');
        const n = G.pile.length;
        for (let i = 0; i < Math.min(n, 6); i++) gFly('#fb-pile', seatEl(loser), playingCardHTML(null, { cls: 'sm' }), { ms: 420, delay: i * 70, arc: 30 });
        loser.hand.push(...G.pile); G.pile = []; G.reveal = null; noDoubles();
        draw();
        await W(1300);
        if (!p.hand.length) return placeOut(p);
      }
      // Inna (Nov 2026): the game goes on until only one player still has cards. 1st, 2nd, 3rd... in the order they run out.
      const ORD = (n) => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
      function placeOut(p) {
        if (G.over || G.places.includes(p)) return;
        G.places.push(p); const n = G.places.length;
        log(`${nm(p)} has no cards left: <b class="text-amber">${ORD(n)} place!</b>`);
        SFX.play(isMe(p) ? 'win' : 'coin');
        if (isMe(p)) showToast(n === 1 ? 'You got rid of every card: 1st place! 🏆' : `You finished ${ORD(n)}!`, 'success');
        const left = G.players.filter((q) => !G.places.includes(q));
        if (left.length <= 1) { if (left[0]) G.places.push(left[0]); G.tok++; finish(true); return; }
        if (isMe(p) && !G.S.online) { const b = $('fb-quit'); if (b) b.classList.remove('hidden'); }
        draw();
      }
      // offline, after I'm out: skip the rest (the others are ranked by how many cards they still hold)
      function endNow() {
        const left = G.players.filter((q) => !G.places.includes(q)).sort((a, b) => a.hand.length - b.hand.length);
        G.places.push(...left); G.tok++; finish(true);
      }

      // a card that shows its real number of suit symbols (3 of hearts = three hearts), like a real playing card
      const PIPS = { 2: [[50, 20], [50, 80]], 3: [[50, 20], [50, 50], [50, 80]], 4: [[33, 20], [67, 20], [33, 80], [67, 80]],
        5: [[33, 20], [67, 20], [50, 50], [33, 80], [67, 80]], 6: [[33, 20], [67, 20], [33, 50], [67, 50], [33, 80], [67, 80]],
        7: [[33, 20], [67, 20], [50, 35], [33, 50], [67, 50], [33, 80], [67, 80]], 8: [[33, 20], [67, 20], [50, 35], [33, 50], [67, 50], [50, 65], [33, 80], [67, 80]],
        9: [[33, 20], [67, 20], [33, 40], [67, 40], [50, 50], [33, 60], [67, 60], [33, 80], [67, 80]],
        10: [[33, 20], [67, 20], [50, 30], [33, 40], [67, 40], [33, 60], [67, 60], [50, 70], [33, 80], [67, 80]] };
      // since Nov 2026 every card game uses the shared card design (core playingCardHTML: real pips, small corner suit)
      function pipCard(c) { return playingCardHTML(c, { cls: 'sm' }); }
      function pipCardOld(c) {
        const col = SUIT_COL[c.s], corner = `<span class="pc-corner">${rankLab(c.r)}<i>${suitSVG(c.s, 14)}</i></span>`;
        let mid;
        if (PIPS[c.r]) mid = `<span class="fb-pips">${PIPS[c.r].map(([x, y]) => `<i style="left:${x}%;top:${y}%${y > 50 ? ';transform:translate(-50%,-50%) rotate(180deg)' : ''}">${suitSVG(c.s, 14)}</i>`).join('')}</span>`;
        else if (c.r === 14) mid = `<span class="fb-ace">${suitSVG(c.s, 34)}</span>`;
        else mid = `<span class="fb-face"><b>${rankLab(c.r)}</b>${suitSVG(c.s, 14)}</span>`;
        return `<div class="pcard sm fb-pc" style="color:${col}">${corner}${mid}</div>`;
      }
      // a deck has 52 cards and each card is in exactly one place (a player saw six Eights once): checked after every
      // move. The pile counts first, then the hands; any second copy is removed.
      function noDoubles() {
        const seen = new Set();
        G.pile = G.pile.filter((c) => { if (!c) return false; const k = c.r + c.s; if (seen.has(k)) { console.warn('Bullshit: a card was in two places', k); return false; } seen.add(k); return true; });
        for (const q of G.players) q.hand = q.hand.filter((c) => { if (!c) return false; const k = c.r + c.s; if (seen.has(k)) { console.warn('Bullshit: a card was in two places', k); return false; } seen.add(k); return true; });
      }
      function draw() {
        if (!$('fb-opp')) return;
        const S = G.S, cur = G.players[G.cur];
        const others = G.players.map((_, k) => G.players[(G.me + k) % G.players.length]).slice(1);
        ringFill('fb', others.map((q) => { const turn = cur === q && !G.over, n = q.hand.length, pl = G.places.indexOf(q) + 1;
          if (pl && n === 0) return `<div id="fb-seat-${q.seat}" class="tg-seat"><div class="tg-fan"><div class="fb-place">${ORD(pl).toUpperCase()}</div></div>${nameTag({ av: q.av, name: q.name, sub: '<span class="text-amber">out of cards</span>' })}</div>`;
          return `<div id="fb-seat-${q.seat}" class="tg-seat ${turn ? 'turn' : ''}"><div class="tg-fan">${Array.from({ length: Math.min(n, 7) }, () => playingCardHTML(null, { cls: 'sm' })).join('')}</div>${nameTag({ av: q.av, name: q.name, sub: `<span class="${n <= 2 ? 'text-coral' : ''}">${n} card${n === 1 ? '' : 's'}</span>`, badge: n, turn })}</div>`; }));
        const rv = G.reveal;
        $('fb-center').innerHTML = `<div class="text-center"><div id="fb-pile" class="fb-pile">${G.pile.length ? Array.from({ length: Math.min(G.pile.length, 16) }, (_, i) => `<div style="position:absolute;left:${(i * 7) % 9 - 4}px;top:${-i * 3}px;transform:rotate(${(i * 37) % 17 - 8}deg)">${playingCardHTML(null, { cls: 'sm' })}</div>`).join('') : '<div class="fb-empty">PILE</div>'}${G.pile.length ? `<div class="fb-count ${G.pile.length >= 12 ? 'big' : ''}">${G.pile.length}</div>` : ''}</div><div class="pix text-sm text-bone mt-2">PILE · ${G.pile.length} CARD${G.pile.length === 1 ? '' : 'S'}</div></div>
          ${rv ? `<div class="fb-reveal ${rv.lie ? 'lie' : 'true'}"><div class="flex gap-2">${rv.cards.map((c) => `<div class="${c.r === G.need ? 'ok' : 'bad'}">${pipCard(c)}</div>`).join('')}</div><div class="pix text-sm mt-2 ${rv.lie ? 'text-coral' : 'text-emerald'}">${rv.lie ? 'A LIE!' : 'ALL TRUE!'}</div></div>` : ''}`;
        $('fb-claim').innerHTML = `NOW: <b>${WORD[G.need].toUpperCase()}S</b>${G.last && !rv ? ` <span class="text-muted">· ${esc(G.last.p.name)} said ${plural(G.last.need, G.last.cards.length)}</span>` : ''}`;
        $('fb-step').textContent = `${G.pile.length} IN PILE`;
        // my hand, sorted by rank; tap to pick
        const me = G.players[G.me], picking = !!G.choose;
        const order = me.hand.map((c, i) => ({ c, i })).sort((a, b) => ORDER.indexOf(a.c.r) - ORDER.indexOf(b.c.r) || a.c.s.localeCompare(b.c.s));
        $('fb-hand').style.setProperty('--n', Math.max(10, me.hand.length));   // card width follows how many you hold (one row)
        $('fb-hand').innerHTML = `<div class="tg-mine mb-2"><div id="fb-seat-${G.me}" class="inline-block">${nameTag({ av: me.av, name: me.name, sub: G.places.includes(me) && !me.hand.length ? 'out of cards' : `${me.hand.length} card${me.hand.length === 1 ? '' : 's'}`, turn: G.players[G.cur] === me && !G.over, me: true })}</div></div><div class="flex flex-wrap justify-center gap-1.5">${order.map(({ c, i }) => `<button class="fb-card ${G.sel.has(i) ? 'sel' : ''} ${c.r === G.need ? 'match' : ''}" data-i="${i}" ${picking ? '' : 'disabled'}>${pipCard(c)}</button>`).join('')}</div>`;
        $('fb-hand').querySelectorAll('.fb-card').forEach((b) => { b.onclick = () => {
          if (!G.choose) return; const i = +b.dataset.i;
          if (G.sel.has(i)) G.sel.delete(i); else if (G.sel.size < 4) G.sel.add(i); else return showToast('You can put down at most 4 cards.', 'error');
          SFX.play('click'); draw(); G.choose();
        }; });
        return 0;
      }
      async function finish(played) {
        G.over = true; G.S.over = true; G.choose = null; if (G.clock) G.clock.stop();
        const S = G.S, me = G.players[G.me], place = G.places.indexOf(me) + 1, res = played && place === 1 ? 'win' : 'loss', tok = G.tok, winner = played ? G.places[0] : null;
        const eloRow = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        const s = gstat('fibber'); s.caught = (s.caught || 0) + G.stats.caught; s.fooled = (s.fooled || 0) + G.stats.fooled;
        reportGame('fibber', res, { place: winner ? place : undefined, elo: S.online ? 0 : res === 'win' ? 10 : -4, xp: res === 'win' ? 30 : 8, label: S.online ? 'Online table' : `${G.players.length} players` });
        const order = G.places.map((q, i) => `${ORD(i + 1)} ${q === me ? 'You' : q.name}`).join(' · ');
        gameResult({ title: !winner ? 'You gave up' : res === 'win' ? 'You win!' : `You finished ${ORD(place)}`, sub: !winner ? '' : order,
          tone: res === 'win' ? 'amber' : 'coral', sprite: res === 'win' ? 'trophy' : 'anchor',
          rows: [['Your place', winner ? `${ORD(place)} of ${G.players.length}` : '-', res === 'win' ? 'text-amber' : 'text-bone'], ['Lies you caught', G.stats.caught, 'text-emerald'], ['Bluffs nobody caught', G.stats.fooled, 'text-amber']].concat(eloRow ? [eloRow] : []),
          againLabel: S.online ? 'Back to setup' : 'Play again', again: () => open($('game-root')) });
      }

      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      GICONS.fibber = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(2, 5, 11, 15, K)}${rr(3, 6, 9, 13, '#1A3856')}${rr(4, 7, 7, 11, '#2B5C8A')}${rr(9, 3, 12, 16, K)}${rr(10, 4, 10, 14, '#F7F4EC')}${rr(11, 5, 2, 3, '#FB7185')}${rr(13, 9, 4, 1, K)}${rr(14, 10, 2, 4, K)}${rr(14, 15, 2, 2, K)}${rr(18, 15, 1, 2, '#FB7185')}${rr(1, 19, 9, 4, K)}${rr(2, 20, 7, 2, '#F5B041')}</svg>`;
      const mod = {
        id: 'fibber', name: 'Bullshit', icon: 'fibber', cats: ['card', 'party'], sub: '3-5 PLAYERS · ~10 MIN', color: '#FB7185', tone: 'coral', btn: 'coral',
        blurb: 'Put cards down face down and say what they are. Bluff if you have to, but if someone shouts BULLSHIT! and you are caught, you take the whole pile.',
        rules: { tag: 'BLUFFING · 3-5 PLAYERS', steps: [
          '<strong class="text-bone">Goal:</strong> Be the first to get rid of all your cards. The others play on for 2nd, 3rd... until only one player still has cards.',
          '<strong class="text-bone">Your turn:</strong> Put 1 to 4 cards face down and say they are the rank it is now (a new rank is picked at random every turn). They don’t have to be true!',
          '<strong class="text-bone">BULLSHIT!</strong> After each play everyone has a few seconds to shout. The cards are turned over: if any card is wrong, the player who fibbed picks up the whole pile. If they were all true, the one who shouted picks it up.',
        ], tip: 'There are only four of each rank. If you hold three Sevens and someone says "two Sevens", they are bluffing!' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['LIES CAUGHT', s.caught || 0, 'text-emerald'], ['BLUFFS NOT CAUGHT', s.fooled || 0, 'text-coral']],
        engine: { botPlay, botDoubt, get G() { return G; } }, open, close() { G = null; },
        art: { card: (c) => playingCardHTML(c, { cls: 'sm' }) },
        online: { seats: (sel) => +sel.n || 4, min: 3, ranked: true, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
