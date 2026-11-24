    /* =========================================================================
       FIBBER (original game, Nov 2026): a family-friendly bluffing card game for 3-5 players.
       All 52 cards are dealt. Turns go round the table and the rank goes up each turn: Aces, Twos, Threes ... Kings,
       then Aces again. On your turn put 1 to 4 cards face down and say they are that rank (you may fib!).
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
          { key: 'secs', label: 'TIME TO SHOUT', def: 7, choices: [[5, '5 sec'], [7, '7 sec'], [10, '10 sec']], hint: 'How long everyone has to shout BULLSHIT! after each play.' },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(BOTS.slice(0, +sel.n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel)));
      }
      function start(body, sel, S) {
        const deck = S.rng.shuffle(newDeckSorted());
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, hand: [] }));
        deck.forEach((c, k) => players[k % players.length].hand.push(c));
        G = { S, me: S.online ? S.me : 0, players, pile: [], step: 0, cur: S.rng.rnd(players.length), need: 14, last: null, secs: +sel.secs || 7, over: false, tok: ++GT.cur, log: [], sel: new Set(), stats: { caught: 0, fooled: 0, lied: 0 } };
        GT.started = true; GT.over = false;
        body.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_250px] gap-5 items-start">
          <div class="space-y-3 min-w-0"><div id="fb-opp" class="ring4">${ringSlots('fb')}
            <div class="r-mid felt p-4 flex flex-col items-center justify-center gap-3" style="min-height:220px"><div id="fb-center" class="flex items-center justify-center gap-6 flex-wrap"></div><div id="fb-claim" class="fb-claim"></div></div></div>
            <div id="fb-prompt" class="win p-3 text-center min-h-[52px] text-sm"></div>
            <div id="fb-hand" class="fb-hand"></div></div>
          <div class="space-y-3"><div class="win overflow-hidden"><div class="winbar amber"><span>BULLSHIT</span><span class="pix text-xs" id="fb-step"></span></div><div class="p-3 space-y-2"><div id="fb-status" class="text-sm font-bold"></div><div class="text-xs text-muted">Each turn the rank goes up: A, 2, 3 ... K, then A again.</div></div></div>
            <div id="fb-log" class="logbox" style="height:240px"></div><button id="fb-quit" class="btn-game btn-coral w-full py-2 text-sm">${S.online ? 'Leave table' : 'Give up'}</button></div></div>`;
        S.track();
        S.onLeft = (a) => {
          if (!G) return; const q = G.players[a.s]; q.name += ' (CPU)'; q.av = '🤖';
          log(`${nm(q)} ${a.t === '_gone' ? 'disconnected' : 'left'}. A computer player takes the seat.`); draw();
        };
        npBar('');
        let sure = false;
        $('fb-quit').onclick = (e) => { if (S.online) return npConfirmLeave(() => open($('game-root'))); if (!sure) { sure = true; e.target.textContent = 'Really give up?'; gTimeout(() => { sure = false; e.target.textContent = 'Give up'; }, 3000); return; } if (!G.over) { G.tok++; finish(null); } };
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
          G.cur = (G.cur + 1) % G.players.length;
          G.need = ORDER[(ORDER.indexOf(G.need) + 1) % 13];
          draw();
        }
      }
      async function turn(p) {
        const S = G.S, t = G.tok, k = ++G.step, mine = S.mine(p.seat);
        $('fb-status').textContent = mine ? 'YOUR TURN' : `${p.name.toUpperCase()}'S TURN`;
        G.sel.clear(); draw();
        if (mine) myPlayUI(p, k); else prompt(`<span class="text-muted">${esc(p.name)} is choosing cards...</span>`);
        const a = await S.ask(p.seat, () => ({ t: 'play', k, cards: botPlay(p.hand, G.need, Math.random).map((i) => p.hand[i]) }), 2000 + rnd(1000), (x) => x.s === p.seat && x.t === 'play' && x.k === k);
        if (!G || G.tok !== t) throw ABORT;
        prompt('');
        // take the named cards out of the hand (an honest table always finds them)
        let cards = (a.cards || []).map((c) => p.hand.find((h) => h.r === c.r && h.s === c.s)).filter(Boolean);
        cards = [...new Set(cards)].slice(0, 4);
        if (!cards.length) cards = [p.hand[0]];
        cards.forEach((c) => p.hand.splice(p.hand.indexOf(c), 1));
        G.pile.push(...cards);
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
        const S = G.S, t = G.tok, me = G.players[G.me], others = G.players.filter((q) => q !== p);
        const people = others.filter((q) => !S.bot(q.seat));
        if (S.mine(me.seat) && me !== p) {
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
          if (!p.hand.length) return win(p);
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
        SFX.play(lie === isMe(caller) || (!lie && isMe(p)) ? 'coin' : 'wrong');
        const n = G.pile.length;
        for (let i = 0; i < Math.min(n, 6); i++) gFly('#fb-pile', seatEl(loser), playingCardHTML(null, { cls: 'sm' }), { ms: 420, delay: i * 70, arc: 30 });
        loser.hand.push(...G.pile); G.pile = []; G.reveal = null;
        draw();
        await W(1300);
        if (!p.hand.length) return win(p);
      }
      function win(p) { if (G.over) return; G.tok++; finish(p); }

      function draw() {
        if (!$('fb-opp')) return;
        const S = G.S, cur = G.players[G.cur];
        const others = G.players.map((_, k) => G.players[(G.me + k) % G.players.length]).slice(1);
        ringFill('fb', others.map((q) => { const turn = cur === q && !G.over, n = q.hand.length;
          return `<div id="fb-seat-${q.seat}" class="tg-seat ${turn ? 'turn' : ''}"><div class="tg-fan">${Array.from({ length: Math.min(n, 7) }, () => playingCardHTML(null, { cls: 'sm' })).join('')}</div>${nameTag({ av: q.av, name: q.name, sub: `<span class="${n <= 2 ? 'text-coral' : ''}">${n} card${n === 1 ? '' : 's'}</span>`, badge: n, turn })}</div>`; }));
        const rv = G.reveal;
        $('fb-center').innerHTML = `<div class="text-center"><div id="fb-pile" class="fb-pile">${G.pile.length ? Array.from({ length: Math.min(G.pile.length, 6) }, (_, i) => `<div style="position:absolute;left:${i * 3}px;top:${-i * 2}px;transform:rotate(${(i * 37) % 13 - 6}deg)">${playingCardHTML(null, { cls: 'sm' })}</div>`).join('') : '<div class="fb-empty">PILE</div>'}</div><div class="pix text-xs text-bone mt-2">PILE · ${G.pile.length}</div></div>
          ${rv ? `<div class="fb-reveal ${rv.lie ? 'lie' : 'true'}"><div class="flex gap-2">${rv.cards.map((c) => `<div class="${c.r === G.need ? 'ok' : 'bad'}">${playingCardHTML(c, { cls: 'sm' })}</div>`).join('')}</div><div class="pix text-sm mt-2 ${rv.lie ? 'text-coral' : 'text-emerald'}">${rv.lie ? 'A LIE!' : 'ALL TRUE!'}</div></div>` : ''}`;
        $('fb-claim').innerHTML = `NOW: <b>${WORD[G.need].toUpperCase()}S</b>${G.last && !rv ? ` <span class="text-muted">· ${esc(G.last.p.name)} said ${plural(G.last.need, G.last.cards.length)}</span>` : ''}`;
        $('fb-step').textContent = `${G.pile.length} IN PILE`;
        // my hand, sorted by rank; tap to pick
        const me = G.players[G.me], picking = !!G.choose;
        const order = me.hand.map((c, i) => ({ c, i })).sort((a, b) => ORDER.indexOf(a.c.r) - ORDER.indexOf(b.c.r) || a.c.s.localeCompare(b.c.s));
        $('fb-hand').innerHTML = `<div class="pix text-xs text-muted mb-1 text-center">YOUR CARDS · ${me.hand.length}</div><div class="flex flex-wrap justify-center gap-1.5">${order.map(({ c, i }) => `<button class="fb-card ${G.sel.has(i) ? 'sel' : ''} ${c.r === G.need ? 'match' : ''}" data-i="${i}" ${picking ? '' : 'disabled'}>${playingCardHTML(c, { cls: 'sm' })}</button>`).join('')}</div>`;
        $('fb-hand').querySelectorAll('.fb-card').forEach((b) => { b.onclick = () => {
          if (!G.choose) return; const i = +b.dataset.i;
          if (G.sel.has(i)) G.sel.delete(i); else if (G.sel.size < 4) G.sel.add(i); else return showToast('You can put down at most 4 cards.', 'error');
          SFX.play('click'); draw(); G.choose();
        }; });
        return 0;
      }
      async function finish(winner) {
        G.over = true; G.S.over = true; G.choose = null;
        const S = G.S, me = G.players[G.me], res = winner === me ? 'win' : 'loss', tok = G.tok;
        const eloRow = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        const s = gstat('fibber'); s.caught = (s.caught || 0) + G.stats.caught; s.fooled = (s.fooled || 0) + G.stats.fooled;
        reportGame('fibber', res, { elo: S.online ? 0 : res === 'win' ? 10 : -4, xp: res === 'win' ? 30 : 8, label: S.online ? 'Online table' : `${G.players.length} players` });
        gameResult({ title: !winner ? 'You gave up' : res === 'win' ? 'You win!' : `${winner.name} wins`, sub: !winner ? '' : res === 'win' ? 'You got rid of every card.' : `${winner.name} got rid of every card first.`,
          tone: res === 'win' ? 'amber' : 'coral', sprite: res === 'win' ? 'trophy' : 'anchor',
          rows: [['Lies you caught', G.stats.caught, 'text-emerald'], ['Bluffs nobody caught', G.stats.fooled, 'text-amber'], ['Cards left', me.hand.length, 'text-bone']].concat(eloRow ? [eloRow] : []),
          againLabel: S.online ? 'Back to setup' : 'Play again', again: () => open($('game-root')) });
      }

      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      GICONS.fibber = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(2, 5, 11, 15, K)}${rr(3, 6, 9, 13, '#1A3856')}${rr(4, 7, 7, 11, '#2B5C8A')}${rr(9, 3, 12, 16, K)}${rr(10, 4, 10, 14, '#F7F4EC')}${rr(11, 5, 2, 3, '#FB7185')}${rr(13, 9, 4, 1, K)}${rr(14, 10, 2, 4, K)}${rr(14, 15, 2, 2, K)}${rr(18, 15, 1, 2, '#FB7185')}${rr(1, 19, 9, 4, K)}${rr(2, 20, 7, 2, '#F5B041')}</svg>`;
      const mod = {
        id: 'fibber', name: 'Bullshit', icon: 'fibber', cats: ['card', 'party'], sub: '3-5 PLAYERS · ~10 MIN', color: '#FB7185', tone: 'coral', btn: 'coral',
        blurb: 'Put cards down face down and say what they are. Bluff if you have to, but if someone shouts BULLSHIT! and you are caught, you take the whole pile.',
        rules: { tag: 'BLUFFING · 3-5 PLAYERS', steps: [
          '<strong class="text-bone">Goal:</strong> Be the first to get rid of all your cards.',
          '<strong class="text-bone">Your turn:</strong> Put 1 to 4 cards face down and say they are the rank it is now (Aces, then Twos, then Threes... up to Kings, then Aces again). They don’t have to be true!',
          '<strong class="text-bone">BULLSHIT!</strong> After each play everyone has a few seconds to shout. The cards are turned over: if any card is wrong, the player who fibbed picks up the whole pile. If they were all true, the one who shouted picks it up.',
        ], tip: 'There are only four of each rank. If you hold three Sevens and someone says "two Sevens", they are bluffing!' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['LIES CAUGHT', s.caught || 0, 'text-emerald'], ['BLUFFS NOT CAUGHT', s.fooled || 0, 'text-coral']],
        engine: { botPlay, botDoubt, get G() { return G; } }, open, close() { G = null; },
        art: { card: (c) => playingCardHTML(c, { cls: 'sm' }) },
        online: { seats: (sel) => +sel.n || 4, min: 3, ranked: true, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
