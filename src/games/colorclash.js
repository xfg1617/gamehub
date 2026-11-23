    /* =========================================================================
       COLOR CLASH: match colour or number, be first to empty your hand. Say CLASH on your last card!
       ========================================================================= */
    (function colorClashGame() {
      const COL = ['a', 'b', 'c', 'e'];
      const CN = { a: 'Amber', b: 'Blue', c: 'Coral', e: 'Green' }, GL = { a: '★', b: '◆', c: '♥', e: '♣' }, HEX = { a: '#F5B041', b: '#60A5FA', c: '#FB7185', e: '#34D399' };
      const SYM = { skip: '⊘', rev: '⇄', d2: '+2', w: '✦', w4: '+4' };
      const lab = (c) => (c.v in SYM ? SYM[c.v] : String(c.v));
      function buildDeck(sh = shuffle) {
        const d = [];
        for (const c of COL) { d.push({ c, v: 0 }); for (let v = 1; v <= 9; v++) { d.push({ c, v }); d.push({ c, v }); } for (const a of ['skip', 'rev', 'd2']) { d.push({ c, v: a }); d.push({ c, v: a }); } }
        for (let i = 0; i < 4; i++) { d.push({ c: 'w', v: 'w' }); d.push({ c: 'w', v: 'w4' }); }
        return sh(d);
      }
      const canPlay = (card, top, color) => card.c === 'w' || card.c === color || card.v === top.v;
      const cardHTML = (card, o = {}) => `<div class="cc-card cc-${card.c} ${o.cls || ''}" ${o.id !== undefined ? `data-id="${o.id}"` : ''} ${o.fk ? `data-fk="${o.fk}" data-face="up"` : ''}>${card.c !== 'w' ? `<span class="cn">${GL[card.c]}</span>` : ''}<span class="big">${lab(card)}</span>${card.c !== 'w' ? `<span class="cn br">${GL[card.c]}</span>` : ''}</div>`;
      const backHTML = (cls = '') => `<div class="cc-card cc-back ${cls}"><span class="big" style="font-size:1rem;text-align:center;line-height:1.1">COLOR<br>CLASH</span></div>`;
      const ABORT = { a: 1 };
      let G = null;
      const BN = [['Pixel', '🐙'], ['Ziggy', '🦖'], ['Nova', '🦄']];

      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1000px] mx-auto');
        setupScreen(body, mod, [
          { key: 'n', label: 'PLAYERS', def: 3, choices: [[2, '2 players'], [3, '3 players'], [4, '4 players']], hint: 'On this device the other seats are computer players. Online, empty seats get computer players.' },
          { key: 'clock', label: 'TURN TIMER', def: 20, choices: [[0, 'Off'], [15, '15 s'], [20, '20 s'], [30, '30 s']] },
          { key: 'hand', label: 'STARTING HAND', def: 7, choices: [[5, '5 cards'], [7, '7 cards'], [9, '9 cards']] },
          { key: 'clash', label: 'Say CLASH! rule', toggle: true, def: 1, hint: 'Forget to call CLASH on your last card and you draw 2.', choices: [[1, 'On'], [0, 'Off']] },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(BN.slice(0, +sel.n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel)));
      }
      // seats come from the table (S): on this device seat 0 is you; online every screen has its own seat (G.me)
      function start(body, sel, S) {
        const deck = buildDeck(S.rng.shuffle);
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, human: S.mine(i) }));
        players.forEach((p) => { p.hand = []; for (let i = 0; i < (+sel.hand || 7); i++) p.hand.push(deck.pop()); });
        let first = deck.pop(); while (first.c === 'w' || typeof first.v !== 'number') { deck.unshift(first); first = deck.pop(); }
        G = { S, me: S.online ? S.me : 0, players, deck, disc: [first], color: first.c, dir: 1, cur: 0, secs: +sel.clock, clashRule: sel.clash === undefined ? true : !!+sel.clash, over: false, tok: ++GT.cur, log: [], caught: 0, plays: 0, banner: '' };
        body.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_250px] gap-5 items-start">
          <div class="space-y-3 min-w-0"><div id="cc-opp" class="flex gap-3 flex-wrap justify-center"></div>
            <div class="felt p-4 flex items-center justify-center gap-8 flex-wrap" style="min-height:190px"><div id="cc-pile" class="text-center"></div><div id="cc-top" class="text-center"></div></div>
            <div id="cc-prompt" class="win p-3 text-center min-h-[48px] text-sm"></div>
            <div id="cc-hand" class="flex gap-2 flex-wrap justify-center pt-2"></div></div>
          <div class="space-y-3"><div class="win overflow-hidden"><div class="winbar amber"><span>COLOR CLASH</span></div><div class="p-3 space-y-2"><div id="cc-clock"></div><div id="cc-status" class="text-sm font-bold"></div></div></div>
            <div id="cc-log" class="logbox" style="height:240px"></div><button id="cc-quit" class="btn-game btn-coral w-full py-2 text-sm">${S.online ? 'Leave table' : 'Give up'}</button></div></div>`;
        G.clock = makeClock(document.getElementById('cc-clock'));
        S.track();
        S.onLeft = (a) => {
          if (!G) return; const q = G.players[a.s]; q.name += ' (CPU)'; q.av = '🤖'; q.human = false;
          log(`${nm(q)} ${a.t === '_gone' ? 'disconnected' : 'left'}. A computer player takes the seat.`);
          if (S.n === 2 && a.s !== G.me && !G.over) { G.tok++; finish(G.players[G.me], a); }
          draw();
        };
        npBar('');
        let sure = false;
        document.getElementById('cc-quit').onclick = (e) => { if (S.online) return npConfirmLeave(() => open(document.getElementById('game-root'))); if (!sure) { sure = true; e.target.textContent = 'Really give up?'; gTimeout(() => { sure = false; e.target.textContent = 'Give up'; }, 3000); return; } if (!G.over) { G.tok++; finish(null); } };
        log('First card is on the table. Match its <b>colour</b> or <b>number</b>.');
        draw();
        run().catch((e) => { if (e !== ABORT) throw e; });
      }
      async function W(ms) { const t = G && G.tok; await gSleep(ms); if (!G || G.tok !== t) throw ABORT; }
      const log = (t) => { G.log.push(t); const el = document.getElementById('cc-log'); if (el) { el.innerHTML = G.log.slice(-40).map((x) => `<div>${x}</div>`).join(''); el.scrollTop = el.scrollHeight; } };
      const prompt = (h) => { const e = document.getElementById('cc-prompt'); if (e) e.innerHTML = h; };
      const nm = (p) => `<b>${esc(p.name)}</b>`;
      const top = () => G.disc[G.disc.length - 1];
      function nextIdx(from, skip = 0) { const n = G.players.length; return (((from + G.dir * (1 + skip)) % n) + n) % n; }
      function take(p, k) {
        for (let i = 0; i < k; i++) {
          if (!G.deck.length) { const t = G.disc.pop(); G.deck = G.S.rng.shuffle(G.disc); G.disc = [t]; G.deck.forEach((c) => { }); }
          if (G.deck.length) p.hand.push(G.deck.pop());
        }
        SFX.play('draw');
      }

      async function run() {
        while (G && !G.over) {
          const p = G.players[G.cur];
          G.plays++;
          const res = await turn(p);
          if (G.over) return;
          // res = {skip} extra skip count
          G.cur = nextIdx(G.cur, res.skip || 0);
          draw();
        }
      }

      // one decision by one seat: this screen's player taps, the host plays for computer seats, online players send theirs
      async function decide(p, ui, botFn, ms, filter) {
        const S = G.S, t = G.tok, mine = S.mine(p.seat);
        if (mine) ui();
        const a = await S.ask(p.seat, botFn, ms, filter);
        if (!G || G.tok !== t) throw ABORT;
        return a;
      }
      const isMe = (p) => p.seat === G.me;
      async function turn(p) {
        const mine = G.S.mine(p.seat);
        document.getElementById('cc-status').textContent = mine ? 'YOUR TURN' : p.name.toUpperCase() + "'S TURN";
        if (!mine) { prompt(`<span class="text-muted">${esc(p.name)} is thinking...</span>`); if (G.S.bot(p.seat)) G.clock.idle(p.name + ' thinks', '...'); else if (G.secs) G.clock.start(G.secs + 4, 'Their time', () => {}, 6); else G.clock.idle('Their turn', '...'); }
        draw();
        let choice = await decide(p, () => humanTurn(p).then((v) => G && G.S.act(Object.assign({ t: 'turn', s: p.seat }, v))), () => Object.assign({ t: 'turn' }, botTurn(p)), 750 + rnd(450), (x) => x.s === p.seat && x.t === 'turn');
        G.clock.stop(); prompt('');
        if (!choice.draw && !(p.hand[choice.idx] && canPlay(p.hand[choice.idx], top(), G.color))) choice = { draw: true };   // never happens with an honest table
        if (choice.draw) {
          take(p, 1); const c = p.hand[p.hand.length - 1]; const ms = draw(); log(`${nm(p)} draws a card.`);
          await W(ms + 450);
          if (canPlay(c, top(), G.color)) {
            const k = await decide(p, () => humanKeep(c).then(async (play) => G && G.S.act({ t: 'keep', s: p.seat, play, color: play && c.c === 'w' ? await humanColor() : null })), () => ({ t: 'keep', play: true, color: c.c === 'w' ? botColor(p) : null }), 350, (x) => x.s === p.seat && x.t === 'keep');
            prompt('');
            if (!k.play) return {};
            choice = { idx: p.hand.length - 1, color: c.c === 'w' ? (COL.includes(k.color) ? k.color : 'a') : null };
          } else return {};
        }
        if (p.hand[choice.idx].c === 'w' && !COL.includes(choice.color)) choice.color = botColor(p);
        return await playCard(p, choice);
      }

      async function playCard(p, ch) {
        const c = p.hand.splice(ch.idx, 1)[0];
        G.disc.push(c); G.color = c.c === 'w' ? ch.color : c.c; SFX.play('card');
        log(`${nm(p)} plays ${c.c === 'w' ? '' : CN[c.c] + ' '}<b>${c.v in SYM ? ({ skip: 'Skip', rev: 'Reverse', d2: '+2', w: 'Wild', w4: 'Wild +4' })[c.v] : c.v}</b>${c.c === 'w' ? ' → ' + CN[G.color] : ''}.`);
        const ms = draw();
        await W(ms + 150);
        let skip = 0;
        const nxt = nextIdx(G.cur);
        if (c.v === 'skip') { skip = 1; log(`${nm(G.players[nxt])} is skipped.`); }
        else if (c.v === 'rev') { G.dir *= -1; if (G.players.length === 2) skip = 1; log('Direction reversed!'); }
        else if (c.v === 'd2') { take(G.players[nxt], 2); skip = 1; SFX.play('nope'); log(`${nm(G.players[nxt])} draws 2 and is skipped.`); await W(draw() + 300); }
        else if (c.v === 'w4') { take(G.players[nxt], 4); skip = 1; SFX.play('nope'); log(`${nm(G.players[nxt])} draws 4 and is skipped.`); await W(draw() + 300); }
        if (!p.hand.length) { finish(p); return { skip: 0 }; }
        if (p.hand.length === 1 && G.clashRule) await clashWindow(p);
        else await W(c.v in SYM ? 700 : 450);
        return { skip };
      }

      // a short countdown button on this screen; calls back with true (pressed) or false (time ran out)
      function countdown(id, label, secs, cls, cb) {
        let left = secs, tm = null, done = false;
        const fin = (v) => { if (done) return; done = true; if (tm) gClearInt(tm); prompt(''); cb(v); };
        prompt(`<button id="${id}" class="btn-game ${cls} py-2 px-8 text-base">${label} (${Math.ceil(left)})</button>`);
        document.getElementById(id).onclick = () => fin(true);
        tm = gInterval(() => { left -= 0.25; if (left <= 0) fin(false); else { const b = document.getElementById(id); if (b) b.textContent = `${label} (${Math.ceil(left)})`; } }, 250);
      }
      async function clashWindow(p) {
        const k = G.plays;
        if (!G.S.mine(p.seat)) prompt(`<span class="text-muted">${esc(p.name)} has one card left...</span>`);
        const a = await decide(p, () => countdown('cc-clash', 'CLASH!', 3, 'btn-coral', (ok) => G && G.S.act({ t: 'clash', s: p.seat, k, ok })),
          () => ({ t: 'clash', k, ok: Math.random() < 0.85 }), 500, (x) => x.t === 'clash' && x.k === k && x.s === p.seat);
        prompt('');
        if (a.ok) { log(`${nm(p)} yells <b>CLASH!</b>`); SFX.play('coin'); await W(300); return; }
        if (!G.S.bot(p.seat)) { log(`${isMe(p) ? 'You forgot' : nm(p) + ' forgot'} to say CLASH! Draw 2.`); take(p, 2); SFX.play('nope'); await W(draw() + 200); return; }
        // a computer player forgot: anybody else at the table can catch it (first tap wins)
        const me = G.players[G.me], canCatch = G.S.mine(me.seat) && me !== p;
        if (canCatch) countdown('cc-catch', `Catch ${esc(p.name)}!`, 2.5, 'btn-amber', (ok) => { if (ok && G) G.S.act({ t: 'catch', s: me.seat, k }); });
        else prompt(`<span class="text-muted">${esc(p.name)} forgot to say CLASH...</span>`);
        const c = await G.S.ask(p.seat, () => ({ t: 'nocatch', k }), 2700, (x) => (x.t === 'catch' || x.t === 'nocatch') && x.k === k);
        if (!G) throw ABORT;
        prompt('');
        if (c.t === 'catch') { const who = G.players[c.s]; log(`${isMe(who) ? 'You' : nm(who)} caught ${nm(p)} without a CLASH! They draw 2.`); take(p, 2); if (isMe(who)) G.caught++; SFX.play(isMe(who) ? 'win' : 'nope'); await W(draw() + 200); }
        else log(`${nm(p)} slipped by with one card left.`);
      }

      /* ----- human ----- */
      function humanTurn(p) {
        return new Promise((res) => {
          let done = false;
          const fin = (v) => { if (done) return; done = true; G.clock.stop(); G.choose = null; prompt(''); res(v); };
          const any = p.hand.some((c) => canPlay(c, top(), G.color));
          prompt(any ? 'Click a glowing card to play it, or draw from the pile.' : 'No card fits. <b>Draw from the pile!</b>');
          G.choose = async (id) => {
            if (id === 'pile') return fin({ draw: true });
            const c = p.hand[id];
            if (!canPlay(c, top(), G.color)) { showToast(`That card does not match ${CN[G.color]} or ${lab(top())}.`, 'error'); SFX.play('wrong'); return; }
            if (c.c === 'w') { G.clock.stop(); G.choose = null; const color = await humanColor(); return fin({ idx: id, color }); }
            fin({ idx: id });
          };
          draw();
          if (G.secs) G.clock.start(G.secs, 'Your time', () => { if (done) return; showToast("Time's up! You draw a card.", 'error'); fin({ draw: true }); }, 6); else G.clock.idle('No timer', '∞');
        });
      }
      function humanColor() {
        return new Promise((res) => {
          prompt(`<div class="space-y-2"><div class="font-bold">Pick a colour</div><div class="flex gap-3 justify-center">${COL.map((c) => `<button data-col="${c}" class="btn-game py-2 px-4" style="background:${HEX[c]};color:#050E18">${GL[c]} ${CN[c]}</button>`).join('')}</div></div>`);
          document.querySelectorAll('[data-col]').forEach((b) => { b.onclick = () => { prompt(''); res(b.dataset.col); }; });
        });
      }
      function humanKeep(c) {
        return new Promise((res) => {
          prompt(`<div class="flex items-center justify-center gap-3 flex-wrap"><span>You drew a card you can play!</span><button id="cc-pl" class="btn-game btn-amber py-1.5 px-5 text-sm">Play it</button><button id="cc-kp" class="btn-game btn-graphite py-1.5 px-5 text-sm">Keep it</button></div>`);
          document.getElementById('cc-pl').onclick = async () => { prompt(''); res(true); };
          document.getElementById('cc-kp').onclick = () => { prompt(''); res(false); };
        });
      }

      /* ----- bots ----- */
      function botColor(p) { const cnt = { a: 0, b: 0, c: 0, e: 0 }; p.hand.forEach((c) => { if (c.c !== 'w') cnt[c.c]++; }); return COL.slice().sort((x, y) => cnt[y] - cnt[x])[0]; }
      function botTurn(p) {
        const t = top();
        const opts = p.hand.map((c, i) => ({ c, i })).filter((o) => canPlay(o.c, t, G.color));
        if (!opts.length) return { draw: true };
        const nextHand = G.players[nextIdx(G.cur)].hand.length;
        const score = (o) => {
          let s = 0; const c = o.c;
          if (c.c === 'w') s -= 6; if (c.v === 'w4') s -= 4;
          if (nextHand <= 2 && (c.v === 'd2' || c.v === 'skip' || c.v === 'w4' || c.v === 'rev')) s += 9;
          if (typeof c.v === 'number') s += c.v / 3; else s += 2;
          if (c.c !== 'w') s += p.hand.filter((x) => x.c === c.c).length * 0.7;
          return s + Math.random() * 1.2;
        };
        let nonWild = opts.filter((o) => o.c.c !== 'w');
        if (p.hand.length > 2 && nonWild.length) opts.splice(0, opts.length, ...nonWild);
        opts.sort((a, b) => score(b) - score(a));
        const o = opts[0];
        return { idx: o.i, color: o.c.c === 'w' ? botColor({ hand: p.hand.filter((_, k) => k !== o.i) }) : null };
      }

      async function finish(winner, quit) {
        if (G.over) return;
        G.over = true; G.S.over = true; G.clock.stop(); prompt('');
        const won = winner && isMe(winner);
        const eloRow = G.S.online ? await G.S.finish(won ? 'win' : 'loss') : null;
        const n = G.players.length, lvl = n - 2;
        const elo = G.S.online ? 0 : won ? [6, 10, 14][lvl] : [-3, -5, -7][lvl];
        const s = gstat('colorclash'); s.caught = (s.caught || 0) + G.caught;
        reportGame('colorclash', won ? 'win' : 'loss', { elo, xp: won ? 25 + lvl * 10 : 10, label: G.S.online ? `Online · ${won ? 'won' : 'lost'} at a table of ${n}` : won ? `Won vs ${n - 1} bot${n > 2 ? 's' : ''}` : winner ? `${winner.name} went out first` : 'Gave up' });
        SFX.play(won ? 'win' : 'lose'); draw();
        const left = G.players[G.me].hand.length, S = G.S;
        gTimeout(() => gameResult({ title: quit ? 'You win!' : won ? 'You went out first!' : winner ? `${winner.name} wins` : 'You gave up', sub: quit ? `${S.name(quit.s)} ${quit.t === '_gone' ? 'disconnected' : 'left the game'}.` : won ? 'Empty hand. Nice clash!' : `You still held ${left} card${left === 1 ? '' : 's'}.`, tone: won ? 'amber' : 'coral', sprite: won ? 'trophy' : 'anchor',
          rows: [['Cards left', left, 'text-coral'], [S.online ? 'Caught' : 'Bots caught', G.caught, 'text-amber']].concat(S.online ? (eloRow ? [eloRow] : []) : [['Elo', (elo > 0 ? '+' : '') + elo, elo >= 0 ? 'text-emerald' : 'text-coral']]), againLabel: S.online ? 'Back to setup' : 'Play again', again: () => open(document.getElementById('game-root')) }), 800);
      }

      function draw() {
        if (!document.getElementById('cc-opp')) return 0;
        const area = document.getElementById('cc-opp').parentElement, before = gSnap(area);
        const cur = G.players[G.cur];
        const others = G.players.map((_, k) => G.players[(G.me + k) % G.players.length]).slice(1);
        document.getElementById('cc-opp').innerHTML = others.map((q) => `<div id="cc-seat-${G.players.indexOf(q)}" class="seat ${cur === q && !G.over ? 'turn' : ''}"><div class="text-sm font-display font-extrabold"><span class="text-lg">${q.av}</span> ${esc(q.name)}</div><div class="flex justify-center my-1 gap-0.5">${q.hand.slice(0, 7).map((c) => `<div class="cc-card cc-back sm" data-fk="${gKey(c)}" data-face="down" style="width:20px;height:30px;border-width:2px;box-shadow:0 2px 0 var(--ink)"></div>`).join('')}</div><div class="pix text-xs ${q.hand.length === 1 ? 'text-coral' : 'text-amber'}">${q.hand.length} card${q.hand.length === 1 ? '' : 's'}</div></div>`).join('');
        document.getElementById('cc-pile').innerHTML = `<div id="cc-draw" style="display:inline-block;cursor:pointer">${backHTML('')}</div><div class="pix text-xs text-bone mt-2">DRAW · ${G.deck.length}</div>`;
        const t = top();
        document.getElementById('cc-top').innerHTML = `<div class="cc-ring" style="background:${HEX[G.color]};position:relative">${G.disc.length > 1 ? `<div style="position:absolute">${cardHTML(G.disc[G.disc.length - 2])}</div>` : ''}<div data-zone="top" style="position:relative">${cardHTML(t, { fk: gKey(t) })}</div></div><div class="pix text-xs mt-2" style="color:${HEX[G.color]}">${GL[G.color]} ${CN[G.color].toUpperCase()} ${G.dir === 1 ? '↻' : '↺'}</div>`;
        const me = G.players[G.me];
        const sorted = me.hand.map((c, i) => ({ c, i })).sort((a, b) => (a.c.c === b.c.c ? String(a.c.v).localeCompare(String(b.c.v), 'en', { numeric: true }) : a.c.c.localeCompare(b.c.c)));
        const myTurn = G.players[G.cur] === me && !G.over && G.choose;
        document.getElementById('cc-hand').innerHTML = sorted.map(({ c, i }) => cardHTML(c, { id: i, fk: gKey(c), cls: myTurn ? (canPlay(c, t, G.color) ? 'ok' : 'no') : '' })).join('');
        document.querySelectorAll('#cc-hand .cc-card').forEach((el) => { el.onclick = () => { if (G.choose) G.choose(+el.dataset.id); }; });
        const dr = document.getElementById('cc-draw'); if (dr) dr.onclick = () => { if (G.choose) G.choose('pile'); };
        // played cards come from the player who played them, drawn cards come off the pile
        return gFlip(area, before, { from: (el) => (el.parentElement && el.parentElement.dataset.zone === 'top' ? (G.cur === G.me ? '#cc-hand' : '#cc-seat-' + G.cur) : '#cc-draw'), stagger: 170 });
      }

      const mod = {
        id: 'colorclash', name: 'Color Clash', icon: 'colorclash', cats: ['card', 'party'], sub: '2-4 PLAYERS · ~5 MIN', color: '#60A5FA', tone: 'teal', btn: 'teal',
        blurb: 'Match the colour or the number and be the first to empty your hand. Do not forget to shout CLASH on your last card!',
        rules: { tag: '2-4 PLAYERS', steps: [
          '<strong class="text-bone">Play a card</strong> that matches the top card by <b>colour</b> or <b>number/symbol</b>. No match? Draw one card (and play it if it fits).',
          '<strong class="text-bone">Special cards:</strong> <b>⊘ Skip</b> the next player, <b>⇄ Reverse</b> direction, <b>+2</b> makes the next player draw 2, <b>✦ Wild</b> picks any colour, <b>+4 Wild</b> picks a colour and the next player draws 4.',
          '<strong class="text-bone">CLASH!</strong> When you are down to <span class="text-amber font-bold">one card</span>, press the CLASH button fast. Forget and you draw 2. Spot a bot that forgot and you can catch it!',
        ], tip: 'Each colour has its own symbol (★ ◆ ♥ ♣), so you can tell them apart even without colours.' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['WIN RATE', pct(s.wins, s.played) + '%', 'text-emerald'], ['BOTS CAUGHT', s.caught || 0, 'text-teal']],
        engine: { buildDeck, canPlay }, open, close() { G = null; },
        art: { card: (c) => cardHTML(c) },
        online: { seats: (sel) => +sel.n || 3, ranked: true, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();

