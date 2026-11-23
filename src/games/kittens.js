    /* =========================================================================
       HOT POTATO CATS: a push-your-luck card game. Don't get stuck with the hot potato!
       ========================================================================= */
    (function kittensGame() {
      const T = {
        bomb: { nm: 'HOT POTATO', em: '🔥', ds: 'Cool it down or you are out!', k: 'bomb' },
        defuse: { nm: 'OVEN MITT', em: '🧤', ds: 'Saves you from a hot potato', k: 'defuse' },
        pounce: { nm: 'POUNCE', em: '🐾', ds: 'End your turn. Next player takes 2 turns', k: 'action' },
        nap: { nm: 'NAP', em: '💤', ds: 'Skip your draw', k: 'action' },
        shake: { nm: 'SHAKE', em: '🔀', ds: 'Shuffle the draw pile', k: 'action' },
        peek: { nm: 'PEEK', em: '👁️', ds: 'Look at the top 3 cards', k: 'action' },
        beg: { nm: 'BEG', em: '🙏', ds: 'Make a player give you a card', k: 'action' },
        nope: { nm: 'NO WAY', em: '✋', ds: 'Cancel any action', k: 'nope' },
        c1: { nm: 'TACO', em: '🌮', ds: 'Play a pair to steal', k: 'cat' }, c2: { nm: 'BEARD', em: '🧔', ds: 'Play a pair to steal', k: 'cat' },
        c3: { nm: 'MELON', em: '🍉', ds: 'Play a pair to steal', k: 'cat' }, c4: { nm: 'RAINBOW', em: '🌈', ds: 'Play a pair to steal', k: 'cat' },
        c5: { nm: 'TOAST', em: '🍞', ds: 'Play a pair to steal', k: 'cat' },
      };
      const CATS = ['c1', 'c2', 'c3', 'c4', 'c5'];
      const cardHTML = (t, o = {}) => `<div class="kk-card kk-${T[t].k} ${o.cls || ''}" data-t="${t}" ${o.id !== undefined ? `data-id="${o.id}"` : ''}><span class="em">${T[t].em}</span><span class="nm">${T[t].nm}</span><span class="ds">${T[t].ds}</span></div>`;
      const backHTML = (cls = '') => `<div class="kk-card kk-back ${cls}"><span class="em">🐱</span><span class="nm">CATS</span><span class="ds"></span></div>`;
      const NAMES = [['Mochi', '🐱'], ['Biscuit', '🐯'], ['Pepper', '🦁']];

      function buildDeck(n, sh = shuffle) {
        const d = [];
        const add = (t, k) => { for (let i = 0; i < k; i++) d.push(t); };
        add('pounce', 4); add('nap', 4); add('shake', 4); add('peek', 5); add('beg', 4); add('nope', 5);
        CATS.forEach((c) => add(c, 4));
        return sh(d);
      }
      function setupDeal(n, hand = 7, nope = true, sh = shuffle) {
        const deck = buildDeck(n, sh).filter((c) => nope || c !== 'nope');
        const hands = [];
        for (let i = 0; i < n; i++) { const h = ['defuse']; for (let k = 0; k < hand; k++) h.push(deck.pop()); hands.push(h); }
        for (let i = 0; i < 2; i++) deck.push('defuse');
        for (let i = 0; i < n - 1; i++) deck.push('bomb');
        return { hands, deck: sh(deck) };
      }
      const ABORT = { abort: 1 };
      let G = null;

      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1000px] mx-auto');
        setupScreen(body, mod, [
          { key: 'n', label: 'PLAYERS', def: 3, choices: [[2, '2 players'], [3, '3 players'], [4, '4 players']], hint: 'On this device the other seats are computer players. Online, empty seats get computer players.' },
          { key: 'clock', label: 'TURN TIMER', def: 25, choices: [[0, 'Off'], [20, '20 s'], [25, '25 s'], [40, '40 s']] },
          { key: 'hand', label: 'STARTING HAND', def: 7, choices: [[4, '4 + Oven Mitt'], [7, '7 + Oven Mitt']] },
          { key: 'nope', label: 'No Way cards', toggle: true, def: 1, hint: 'Turn off for a simpler game with no cancelling.', choices: [[1, 'On'], [0, 'Off']] },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(NAMES.slice(0, +sel.n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel)));
      }

      // seats come from the table (S): on this device seat 0 is you; online every screen has its own seat (G.me)
      function start(body, sel, S) {
        const n = S.n, deal = setupDeal(n, +sel.hand || 7, sel.nope === undefined ? true : !!+sel.nope, S.rng.shuffle);
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, hand: deal.hands[i], knows: [], out: false }));
        G = { S, me: S.online ? S.me : 0, step: 0, players, deck: deal.deck, discard: [], cur: 0, owed: 1, secs: +sel.clock, over: false, tok: ++GT.cur, log: [], stats: { defused: 0, nopes: 0, steals: 0, turns: 0 }, placed: [], banner: '' };
        body.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_250px] gap-5 items-start">
          <div class="space-y-3 min-w-0"><div id="kk-opp" class="flex gap-3 flex-wrap justify-center"></div>
            <div class="felt p-4 flex items-center justify-center gap-6 flex-wrap" style="min-height:170px"><div id="kk-pile" class="text-center"></div><div id="kk-disc" class="text-center"></div></div>
            <div id="kk-prompt" class="win p-3 text-center min-h-[48px]"></div>
            <div id="kk-hand" class="flex gap-2 flex-wrap justify-center pt-2"></div></div>
          <div class="space-y-3"><div class="win overflow-hidden"><div class="winbar amber"><span>HOT POTATO CATS</span></div><div class="p-3 space-y-2"><div id="kk-clock"></div><div id="kk-status" class="text-sm font-bold"></div></div></div>
            <div id="kk-log" class="logbox" style="height:250px"></div><button id="kk-quit" class="btn-game btn-coral w-full py-2 text-sm">${S.online ? 'Leave table' : 'Give up'}</button></div></div>`;
        G.clock = makeClock(document.getElementById('kk-clock'));
        S.track();
        S.onLeft = (a) => {
          if (!G) return; const q = G.players[a.s]; q.name += ' (CPU)'; q.av = '🤖';
          log(`${nm(q)} ${a.t === '_gone' ? 'disconnected' : 'left'}. A computer player takes the seat.`);
          if (S.n === 2 && a.s !== G.me && !G.over) { G.tok++; endGame(true, false, a); }
          draw();
        };
        npBar('');
        let sure = false;
        document.getElementById('kk-quit').onclick = (e) => { if (S.online) return npConfirmLeave(() => open(document.getElementById('game-root'))); if (!sure) { sure = true; e.target.textContent = 'Really give up?'; gTimeout(() => { sure = false; e.target.textContent = 'Give up'; }, 3000); return; } if (!G.over) { G.tok++; endGame(false, true); } };
        log(`Game on! Don't draw the <b>🔥 hot potato</b>. Everyone holds one 🧤 Oven Mitt.`);
        draw();
        run().catch((e) => { if (e !== ABORT) throw e; });
      }
      const tokOk = () => G && !G.over;
      async function W(ms) { const t = G && G.tok; await gSleep(ms); if (!G || G.tok !== t) throw ABORT; }
      const log = (t) => { G.log.push(t); const el = document.getElementById('kk-log'); if (el) { el.innerHTML = G.log.slice(-40).map((x) => `<div>${x}</div>`).join(''); el.scrollTop = el.scrollHeight; } };
      const alive = () => G.players.filter((p) => !p.out);
      const nm = (p) => `<b>${esc(p.name)}</b>`;
      const prompt = (html) => { const e = document.getElementById('kk-prompt'); if (e) e.innerHTML = html; };
      const status = (t) => { const e = document.getElementById('kk-status'); if (e) e.textContent = t; };

      async function run() {
        while (tokOk()) {
          const p = G.players[G.cur];
          if (p.out) { next(1); continue; }
          G.stats.turns += isMe(p) ? 1 : 0;
          await takeTurn(p);
          if (alive().length === 1) return endGame(isMe(alive()[0]));
        }
      }
      function next(owed) { let i = G.cur; do { i = (i + 1) % G.players.length; } while (G.players[i].out); G.cur = i; G.owed = owed; draw(); }

      const isMe = (p) => p.seat === G.me;
      // one decision by one seat (or by the table, seat -1): this screen's player taps, the host plays for computer seats
      async function decide(seat, ui, botFn, ms, filter) {
        const S = G.S, t = G.tok;
        if (seat >= 0 && S.mine(seat) && ui) ui();
        const a = await S.ask(seat, botFn, ms, filter);
        if (!G || G.tok !== t) throw ABORT;
        return a;
      }
      async function takeTurn(p) {
        status(G.S.mine(p.seat) ? `YOUR TURN${G.owed > 1 ? ` (${G.owed} turns!)` : ''}` : `${p.name.toUpperCase()}'S TURN${G.owed > 1 ? ` (${G.owed} turns)` : ''}`);
        draw();
        let plays = 0;
        while (tokOk()) {
          const k = ++G.step;
          if (!G.S.mine(p.seat)) { prompt(`<span class="text-muted">${esc(p.name)} is thinking...</span>`); if (G.S.bot(p.seat)) G.clock.idle(p.name + ' thinks', '...'); else if (G.secs) G.clock.start(G.secs + 4, 'Their time', () => {}, 6); else G.clock.idle('Their turn', '...'); }
          const act = await decide(p.seat, () => humanChoose(p).then((a) => G && G.S.act(Object.assign({ k, s: p.seat }, a))), () => Object.assign({ k }, botChoose(p, plays)), 700 + rnd(500), (x) => x.s === p.seat && x.k === k);
          G.clock.stop(); prompt('');
          if (act.type !== 'draw' && !validPlay(p, act)) act.type = 'draw';   // never happens with an honest table
          if (act.type === 'draw') {
            await drawCard(p);
            if (p.out) { next(1); return; }
            G.owed--; if (G.owed <= 0) next(1); else draw();
            return;
          }
          plays++;
          const res = await doPlay(p, act);
          if (res === 'attack') { next(2); return; }
          if (res === 'skip') { G.owed--; if (G.owed <= 0) next(1); else draw(); return; }
          draw();
        }
      }

      /* ----- cards travelling across the table ----- */
      // where a player's cards are on screen: your hand, or a bot's seat
      const spot = (p) => (isMe(p) ? '#kk-hand' : '#kk-seat-' + G.players.indexOf(p));
      const handCardEl = (p, t) => (isMe(p) ? [...document.querySelectorAll('#kk-hand .kk-card')].find((el) => el.dataset.t === t) : null) || spot(p);
      const pileEl = () => document.querySelector('#kk-pile .kk-card') || '#kk-pile';
      const discEl = () => document.querySelector('#kk-disc .kk-card') || '#kk-disc';
      async function flyCard(from, to, html, delay) {
        if (from && from.closest && from.closest('#kk-hand')) from.style.visibility = 'hidden'; // the card leaves your hand rather than being copied
        const ok = await gFly(from, to, html, { ms: MOTION.deal + 60, delay: delay || 0 }); if (!ok || !G) throw ABORT; }

      /* ----- the human's choices ----- */
      function humanChoose(p) {
        return new Promise((res) => {
          let done = false;
          const fin = (a) => { if (done) return; done = true; G.clock.stop(); prompt(''); res(a); };
          prompt(`<div class="flex items-center justify-center gap-3 flex-wrap"><span class="text-sm text-muted">Play cards, then</span><button id="kk-draw" class="btn-game btn-amber py-2 px-6">Draw a card</button></div>`);
          document.getElementById('kk-draw').onclick = () => fin({ type: 'draw' });
          G.choose = (id) => {
            const t = p.hand[id];
            if (t === 'bomb' || t === 'defuse') return showToast('Keep your Oven Mitt for a hot potato!', 'info');
            if (t === 'nope') return showToast('Use No Way when another player plays a card.', 'info');
            if (CATS.includes(t)) { if (p.hand.filter((x) => x === t).length < 2) return showToast('Cat cards only work as a matching pair.', 'info'); return withTarget(p, { type: 'pair', t }, fin); }
            if (t === 'beg') return withTarget(p, { type: 'play', t }, fin);
            fin({ type: 'play', t });
          };
          draw();
          if (G.secs) G.clock.start(G.secs, 'Your time', () => { if (!done) { showToast("Time's up! You draw a card.", 'error'); fin({ type: 'draw' }); } }, 6); else G.clock.idle('No timer', '∞');
        });
      }
      // pairs and Beg need a target: picked before the card is played
      function withTarget(p, a, fin) {
        const opts = alive().filter((q) => q !== p && q.hand.length);
        if (!opts.length) return showToast('Nobody has any cards!', 'error');
        G.choose = null;
        pickTarget(p, a.type === 'pair' ? 'Steal a random card from...' : 'Make who give you a card?').then((q) => fin(Object.assign(a, { target: q.seat })));
      }
      function validPlay(p, a) {
        if (!T[a.t] || !p.hand.includes(a.t) || a.t === 'bomb' || a.t === 'defuse' || a.t === 'nope') return false;
        if (a.type === 'pair' && p.hand.filter((x) => x === a.t).length < 2) return false;
        if (a.type === 'pair' || a.t === 'beg') { const q = G.players[a.target]; if (!q || q === p || q.out || !q.hand.length) return false; }
        return true;
      }
      function pickTarget(p, label) {
        const opts = alive().filter((q) => q !== p && q.hand.length);
        if (opts.length === 1) return Promise.resolve(opts[0]);
        return new Promise((res) => {
          prompt(`<div class="space-y-2"><div class="text-sm">${label}</div><div class="flex gap-2 justify-center flex-wrap">${opts.map((q) => `<button class="btn-game btn-teal py-2 px-4" data-q="${G.players.indexOf(q)}">${q.av} ${esc(q.name)} (${q.hand.length})</button>`).join('')}</div></div>`);
          document.querySelectorAll('[data-q]').forEach((b) => { b.onclick = () => { prompt(''); res(G.players[+b.dataset.q]); }; });
        });
      }

      /* ----- bots ----- */
      function bombOdds() { const b = G.deck.filter((c) => c === 'bomb').length; return b / G.deck.length; }
      function botChoose(p, plays) {
        const a = botPick(p, plays);
        if (a.type === 'pair' || a.t === 'beg') {
          const opts = alive().filter((q) => q !== p && q.hand.length);
          if (!opts.length) return { type: 'draw' };
          a.target = pick(opts.sort((x, y) => y.hand.length - x.hand.length).slice(0, 2)).seat;
        }
        return a;
      }
      function botPick(p, plays) {
        const has = (t) => p.hand.includes(t);
        const odds = p.knows && p.knows.length ? (p.knows[0] === 'bomb' ? 1 : 0.02) : bombOdds();
        const safeDefuse = has('defuse');
        if (plays < 3) {
          if (odds > (safeDefuse ? 0.4 : 0.22)) { if (has('nap')) return { type: 'play', t: 'nap' }; if (has('pounce')) return { type: 'play', t: 'pounce' }; if (has('shake') && p.knows && p.knows[0] === 'bomb') return { type: 'play', t: 'shake' }; }
          for (const c of CATS) if (p.hand.filter((x) => x === c).length >= 2 && Math.random() < 0.55) return { type: 'pair', t: c };
          if (has('peek') && (!p.knows || !p.knows.length) && Math.random() < 0.5) return { type: 'play', t: 'peek' };
          if (has('beg') && Math.random() < 0.4) return { type: 'play', t: 'beg' };
          if (has('shake') && Math.random() < 0.12) return { type: 'play', t: 'shake' };
          if (has('pounce') && Math.random() < 0.15) return { type: 'play', t: 'pounce' };
        }
        return { type: 'draw' };
      }

      /* ----- playing a card ----- */
      async function doPlay(p, act) {
        const cards = act.type === 'pair' ? [act.t, act.t] : [act.t];
        let target = null;
        if (act.type === 'pair' || act.t === 'beg') target = G.players[act.target];
        SFX.play('card');
        await Promise.all(cards.map((c, k) => flyCard(handCardEl(p, c), discEl(), cardHTML(c), k * 140)));
        cards.forEach((c) => { p.hand.splice(p.hand.indexOf(c), 1); G.discard.push(c); });
        const label = act.type === 'pair' ? `a pair of ${T[act.t].em} ${T[act.t].nm}${target ? ' on ' + nm(target) : ''}` : `${T[act.t].em} ${T[act.t].nm}${target ? ' on ' + nm(target) : ''}`;
        log(`${nm(p)} plays ${label}.`);
        draw();
        const cancelled = await nopeWindow(p, target, act.t);
        if (cancelled) { log('...but somebody said <b>NO WAY</b>!'); draw(); return 'continue'; }
        switch (act.t) {
          case 'pounce': return 'attack';
          case 'nap': return 'skip';
          case 'shake': G.deck = G.S.rng.shuffle(G.deck); G.players.forEach((q) => { if (q.knows) q.knows = []; }); G.shakeNote = 1; SFX.play('shuffle'); log('The draw pile was shaken.'); break;
          case 'peek': {
            const top = G.deck.slice(-3).reverse();
            if (G.S.bot(p.seat)) p.knows = top.slice();
            else { if (!G.S.mine(p.seat)) prompt(`<span class="text-muted">${esc(p.name)} is peeking at the pile...</span>`); await decide(p.seat, () => showPeek(top).then(() => G && G.S.act({ t: 'seen', s: p.seat, k: G.step })), null, 0, (x) => x.s === p.seat && x.t === 'seen'); prompt(''); }
            log(`${nm(p)} peeks at the top cards.`); break;
          }
          case 'beg': case undefined: break;
          default: break;
        }
        if (act.t === 'beg') {
          if (!G.S.mine(target.seat)) prompt(`<span class="text-muted">${esc(target.name)} is choosing a card to give...</span>`);
          const k = G.step;
          const g = await decide(target.seat, () => humanGive(p).then((c) => G && G.S.act({ t: 'give', s: target.seat, k, c })), () => ({ t: 'give', k, c: botGive(target) }), 500, (x) => x.s === target.seat && x.t === 'give' && x.k === k);
          prompt('');
          const given = target.hand.includes(g.c) ? g.c : target.hand[0];
          await flyCard(handCardEl(target, given), spot(p), isMe(target) || isMe(p) ? cardHTML(given) : backHTML());
          target.hand.splice(target.hand.indexOf(given), 1); p.hand.push(given); SFX.play('coin');
          log(`${nm(target)} gives ${isMe(p) || isMe(target) ? T[given].em + ' ' + T[given].nm : 'a card'} to ${nm(p)}.`);
        }
        if (act.type === 'pair') {
          const ci = G.S.rng.rnd(target.hand.length), c = target.hand[ci];
          await flyCard(isMe(target) ? (document.querySelectorAll('#kk-hand .kk-card')[ci] || spot(target)) : spot(target), spot(p), isMe(target) || isMe(p) ? cardHTML(c) : backHTML());
          target.hand.splice(ci, 1); p.hand.push(c); SFX.play('coin'); if (isMe(p)) G.stats.steals++;
          log(`${nm(p)} steals ${isMe(p) || isMe(target) ? T[c].em + ' ' + T[c].nm : 'a card'} from ${nm(target)}.`);
        }
        draw();
        return 'continue';
      }
      function botGive(q) { const pri = [...CATS, 'peek', 'shake', 'beg', 'nap', 'pounce', 'nope', 'defuse']; for (const t of pri) if (q.hand.includes(t)) return t; return q.hand[0]; }
      function humanGive(to) {
        const me = G.players[G.me];
        return new Promise((res) => {
          prompt(`<div class="text-sm mb-2">${esc(to.name)} begged! <b>Click a card to give.</b></div>`);
          let fin = false;
          const give = (id) => { if (fin) return; fin = true; G.choose = null; prompt(''); res(me.hand[id]); };
          G.choose = give;
          draw();
          gTimeout(() => { if (!fin && G && !G.over) { showToast('Too slow! A card was chosen for you.', 'error'); const keep = me.hand.map((t, i) => (t === 'defuse' ? -1 : i)).filter((i) => i >= 0); give(keep.length ? pick(keep) : 0); } }, 15000);
        });
      }
      function showPeek(top) {
        return new Promise((res) => {
          prompt(`<div class="space-y-2"><div class="text-sm">Top of the pile, next card first:</div><div class="flex gap-2 justify-center">${top.map((t) => cardHTML(t, { cls: 'sm' })).join('')}</div><button id="kk-ok" class="btn-game btn-amber py-1.5 px-5 text-sm">Got it</button></div>`);
          document.getElementById('kk-ok').onclick = () => { prompt(''); res(); };
        });
      }

      // returns true when the action ends up cancelled
      async function nopeWindow(src, target, kind) {
        let cancelled = false, last = src;
        for (let guard = 0; guard < 8; guard++) {
          const noper = await askNope(last, src, target, kind, cancelled);
          if (!noper) break;
          await flyCard(handCardEl(noper, 'nope'), discEl(), cardHTML('nope'));
          noper.hand.splice(noper.hand.indexOf('nope'), 1); G.discard.push('nope');
          cancelled = !cancelled; last = noper; SFX.play('nope'); if (isMe(noper)) G.stats.nopes++;
          log(`${nm(noper)} plays ✋ <b>NO WAY</b>!`); draw();
        }
        return cancelled;
      }
      // anyone holding a Nope may cancel: people get a few seconds to tap (first tap wins); the table's host
      // decides for computer players and closes the window when time is up
      async function askNope(last, src, target, kind, cancelled) {
        const S = G.S, me = G.players[G.me];
        const cands = alive().filter((q) => q !== last && q.hand.includes('nope'));
        if (!cands.length) { await W(350); return null; }
        const k = ++G.step, people = cands.filter((q) => !S.bot(q.seat));
        if (cands.includes(me) && S.mine(me.seat)) {
          let left = 3.2, tm = null, done = false;
          const fin = (v) => { if (done) return; done = true; if (tm) gClearInt(tm); prompt(''); if (v && G) S.act({ t: 'nope', s: me.seat, k }); };
          prompt(`<div class="flex items-center justify-center gap-3 flex-wrap"><span class="text-sm">${esc(last.name)} played <b>${T[kind] ? T[kind].em + ' ' + T[kind].nm : 'a pair'}</b>.</span><button id="kk-nope" class="btn-game btn-graphite py-2 px-5">✋ NOPE! (${Math.ceil(left)})</button></div>`);
          document.getElementById('kk-nope').onclick = () => fin(true);
          tm = gInterval(() => { left -= 0.2; if (left <= 0) fin(false); else { const b = document.getElementById('kk-nope'); if (b) b.textContent = `✋ NO WAY! (${Math.ceil(left)})`; } }, 200);
        }
        const botNope = () => {
          for (const b of cands.filter((q) => S.bot(q.seat))) {
            let pr = 0.1;
            if (!cancelled) { if (kind === 'pounce' && G.players[(G.players.indexOf(src) + 1) % G.players.length] === b) pr = 0.75; else if (target === b) pr = 0.65; else if (src !== b && kind === 'peek') pr = 0.03; }
            else if (src === b) pr = 0.5;
            if (Math.random() < pr) return { t: 'nope', s: b.seat, k };
          }
          return { t: 'nonope', k };
        };
        const a = await S.ask(-1, botNope, people.length ? 3600 : 600 + rnd(300), (x) => x.k === k && (x.t === 'nonope' || (x.t === 'nope' && cands.some((q) => q.seat === x.s))));
        if (!G || !tokOk()) throw ABORT;
        prompt('');
        return a.t === 'nope' ? G.players[a.s] : null;
      }

      /* ----- drawing a card (and the bomb) ----- */
      async function drawCard(p) {
        const c = G.deck.pop();
        if (p.knows && p.knows.length) p.knows.shift();
        G.players.forEach((q) => { if (q !== p && q.knows && q.knows.length) q.knows.shift(); });
        SFX.play('draw');
        if (c !== 'bomb') { await flyCard(pileEl(), spot(p), isMe(p) ? cardHTML(c) : backHTML()); p.hand.push(c); log(`${nm(p)} draws ${isMe(p) ? T[c].em + ' ' + T[c].nm : 'a card'}.`); draw(); await W(650); return; }
        await flyCard(pileEl(), spot(p), cardHTML('bomb'));
        log(`${nm(p)} draws the <b>🔥 HOT POTATO</b>!`); SFX.play('meow'); draw();
        const pile = document.getElementById('kk-pile'); if (pile) pile.classList.add('kk-boom');
        await W(900);
        if (p.hand.includes('defuse')) {
          await flyCard(handCardEl(p, 'defuse'), discEl(), cardHTML('defuse'));
          p.hand.splice(p.hand.indexOf('defuse'), 1); G.discard.push('defuse'); if (isMe(p)) G.stats.defused++;
          SFX.play('reveal'); log(`${nm(p)} grabs it with an 🧤 <b>OVEN MITT</b> and sneaks it back into the pile.`);
          let pos;
          const k = ++G.step;
          if (!G.S.mine(p.seat)) prompt(`<span class="text-muted">${esc(p.name)} is hiding the hot potato...</span>`);
          const b = await decide(p.seat, () => chooseBombSpot().then((v) => G && G.S.act({ t: 'hide', s: p.seat, k, pos: v })), () => ({ t: 'hide', k, pos: Math.random() < 0.6 ? 0 : 1 + rnd(Math.min(4, G.deck.length)) }), 600, (x) => x.s === p.seat && x.t === 'hide' && x.k === k);
          prompt('');
          pos = Math.max(0, Math.min(G.deck.length, +b.pos || 0));
          // pos 0 = very top (next draw)
          await flyCard(spot(p), pileEl(), backHTML());
          G.deck.splice(G.deck.length - pos, 0, 'bomb');
          draw(); await W(600);
        } else {
          p.out = true; G.discard.push(...p.hand); p.hand = []; G.placed.push(p);
          SFX.play('crash'); log(`💥 ${nm(p)} got burned and is <b>OUT</b>!`); draw(); await W(1100);
        }
      }
      function chooseBombSpot() {
        const n = G.deck.length;
        return new Promise((res) => {
          prompt(`<div class="space-y-2"><div class="text-sm font-bold">Saved! Where do you hide the hot potato?</div><div class="flex gap-2 justify-center flex-wrap"><button data-p="0" class="btn-game btn-coral py-1.5 px-3 text-sm">Top (next draw)</button><button data-p="2" class="btn-game btn-amber py-1.5 px-3 text-sm">3rd card</button><button data-p="${Math.floor(n / 2)}" class="btn-game btn-teal py-1.5 px-3 text-sm">Middle</button><button data-p="${n}" class="btn-game btn-graphite py-1.5 px-3 text-sm">Bottom</button></div></div>`);
          document.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => { prompt(''); res(Math.min(+b.dataset.p, n)); }; });
        });
      }

      async function endGame(won, quit, left) {
        if (G.over) return;
        G.over = true; G.S.over = true; G.clock.stop(); prompt('');
        const tok = G.tok, eloRow = G.S.online ? await G.S.finish(won ? 'win' : 'loss') : null;
        if (!G || G.tok !== tok) return;
        const n = G.players.length;
        const winner = alive()[0];
        const lvl = n - 2;
        const place = won ? 1 : (n - G.placed.indexOf(G.players[G.me]));
        const elo = G.S.online ? 0 : won ? [6, 10, 14][lvl] : [-3, -5, -7][lvl];
        const s = gstat('kittens'); s.defused = (s.defused || 0) + G.stats.defused; s.nopes = (s.nopes || 0) + G.stats.nopes; s.steals = (s.steals || 0) + G.stats.steals;
        reportGame('kittens', won ? 'win' : 'loss', { elo, xp: won ? 25 + lvl * 10 : 10, label: G.S.online ? `Online · ${won ? 'last cat standing' : 'out'} at a table of ${n}` : won ? `Last cat standing vs ${n - 1} bot${n > 2 ? 's' : ''}` : quit ? 'Gave up' : 'Exploded' });
        SFX.play(won ? 'win' : 'lose');
        draw();
        gTimeout(() => gameResult({ title: left ? 'You win!' : won ? 'Last cat standing!' : 'OUCH! TOO HOT!', sub: left ? `${G.S.name(left.s)} ${left.t === '_gone' ? 'disconnected' : 'left the game'}.` : won ? 'You dodged every hot potato.' : quit ? 'You gave up.' : `${winner ? winner.name : 'Someone'} wins this round.`, tone: won ? 'amber' : 'coral', sprite: won ? 'trophy' : 'anchor',
          rows: [['Potatoes saved', G.stats.defused, 'text-emerald'], ['No Ways played', G.stats.nopes, 'text-amber']].concat(G.S.online ? (eloRow ? [eloRow] : []) : [['Elo', (elo > 0 ? '+' : '') + elo, elo >= 0 ? 'text-emerald' : 'text-coral']]), againLabel: G.S.online ? 'Back to setup' : 'Play again', again: () => open(document.getElementById('game-root')) }), 700);
      }

      function draw() {
        if (!document.getElementById('kk-opp')) return;
        const cur = G.players[G.cur];
        const others = G.players.map((_, k) => G.players[(G.me + k) % G.players.length]).slice(1);
        document.getElementById('kk-opp').innerHTML = others.map((q) => `<div id="kk-seat-${G.players.indexOf(q)}" class="seat ${cur === q && !q.out && !G.over ? 'turn' : ''} ${q.out ? 'out' : ''}"><div class="text-sm font-display font-extrabold"><span class="text-lg">${q.av}</span> ${esc(q.name)}</div><div class="flex justify-center my-1">${q.out ? '<span class="text-2xl">💥</span>' : backHTML('sm')}</div><div class="pix text-xs text-amber">${q.out ? 'OUT' : q.hand.length + ' cards'}</div></div>`).join('');
        const bombs = G.deck.filter((c) => c === 'bomb').length;
        document.getElementById('kk-pile').innerHTML = `${backHTML()}<div class="pix text-xs text-bone mt-2">DRAW PILE · ${G.deck.length}</div><div class="pix text-xs text-coral">${alive().length - 1} hot potato${alive().length - 1 === 1 ? '' : 'es'} hidden</div>`;
        const top = G.discard[G.discard.length - 1];
        document.getElementById('kk-disc').innerHTML = top ? `${cardHTML(top, { cls: 'dim' })}<div class="pix text-xs text-bone mt-2">DISCARD</div>` : '<div class="pix text-xs text-bone/60">DISCARD<br>EMPTY</div>';
        const me = G.players[G.me];
        document.getElementById('kk-hand').innerHTML = me.out ? '<div class="pix text-sm text-coral">You got burned. Watch the rest!</div>' : me.hand.map((t, i) => cardHTML(t, { id: i })).join('');
        document.querySelectorAll('#kk-hand .kk-card').forEach((el) => { el.onclick = () => { if (G.choose) G.choose(+el.dataset.id); }; });
      }

      const mod = {
        id: 'kittens', name: 'Hot Potato Cats', icon: 'kittens', cats: ['card', 'party'], sub: '2-4 PLAYERS · ~6 MIN', color: '#FB7185', tone: 'coral', btn: 'coral',
        blurb: 'A push-your-luck card game. Draw cards, dodge the hot potatoes and use sneaky tricks on your rivals. Last cat standing wins!',
        rules: { tag: '2-4 PLAYERS', steps: [
          '<strong class="text-bone">Your turn:</strong> Play as many cards as you like, then draw one card to end your turn. If you draw the <span class="text-coral font-bold">🔥 hot potato</span> you are out, unless you have an <span class="text-emerald font-bold">🧤 Oven Mitt</span>.',
          '<strong class="text-bone">Action cards:</strong> <b>Pounce</b> ends your turn and makes the next player take 2 turns. <b>Nap</b> skips your draw. <b>Shake</b> shuffles the pile. <b>Peek</b> shows the top 3. <b>Beg</b> makes a player give you a card.',
          '<strong class="text-bone">No Way &amp; pairs:</strong> Anyone can play <b>✋ No Way</b> to cancel an action, and you can No Way a No Way. Two matching cat cards steal a random card from a player.',
        ], tip: 'Use Peek before you draw. If the hot potato is next, play Nap or Pounce to skip the draw!' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['MITTS USED', s.defused || 0, 'text-emerald'], ['NO WAYS', s.nopes || 0, 'text-teal']],
        extraRows: (s) => srow('Cards stolen', s.steals || 0),
        engine: { buildDeck, setupDeal }, open, close() { G = null; },
        art: { card: (t) => cardHTML(t, { cls: 'sm' }) },
        online: { seats: (sel) => +sel.n || 3, ranked: true, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();

