    /* =========================================================================
       CASTLES & KINGS (original game, Nov 2026): build the finest town. 3-6 players.
       Each round everyone secretly picks a character (the crown holder picks first; one character is set aside face
       down). Characters then play in number order: take 2 gold or look at 2 building cards and keep 1, then build one
       building (the Architect up to 3), and use the character's power. When someone has built the target number of
       buildings, the round is finished and the best town wins: building costs + 3 for all five colours + 4 for the
       first to finish (2 for others who finished) + 2 for each wonder.
       ========================================================================= */
    (function guildGame() {
      const ABORT = { a: 1 };
      const COLORS = { royal: '#F5B041', faith: '#4DB2FF', trade: '#34D399', guard: '#FB7185', wonder: '#C084FC' };
      const CNAME = { royal: 'royal', faith: 'faith', trade: 'trade', guard: 'guard', wonder: 'wonder' };
      const BUILD = [['Manor', 'royal', 3, 5], ['Castle', 'royal', 4, 4], ['Palace', 'royal', 5, 3], ['Shrine', 'faith', 1, 3], ['Chapel', 'faith', 2, 3], ['Abbey', 'faith', 3, 3], ['Cathedral', 'faith', 5, 2],
        ['Inn', 'trade', 1, 5], ['Market', 'trade', 2, 4], ['Trading Post', 'trade', 2, 3], ['Harbor', 'trade', 3, 3], ['Guild Hall', 'trade', 4, 3], ['Town Hall', 'trade', 5, 2],
        ['Watchtower', 'guard', 1, 3], ['Barracks', 'guard', 2, 3], ['Armory', 'guard', 3, 3], ['Fortress', 'guard', 5, 2],
        ['Observatory', 'wonder', 5, 1], ['Library', 'wonder', 6, 1], ['Great Wall', 'wonder', 6, 1], ['Dragon Gate', 'wonder', 6, 1], ['Clock Tower', 'wonder', 5, 1]];
      const ROLES = [null,
        { n: 1, name: 'Shadow', col: '#9DB4CC', txt: 'Name a character: they miss their whole turn this round.' },
        { n: 2, name: 'Pickpocket', col: '#9DB4CC', txt: 'Name a character: when their turn starts, you take all their gold.' },
        { n: 3, name: 'Trader', col: '#9DB4CC', txt: 'Draw 2 extra building cards.' },
        { n: 4, name: 'Monarch', col: '#F5B041', txt: 'Take the crown (pick first next round). +1 gold for each royal building.', inc: 'royal' },
        { n: 5, name: 'Abbot', col: '#60A5FA', txt: '+1 gold for each faith building. The Captain can’t touch your town.', inc: 'faith' },
        { n: 6, name: 'Merchant', col: '#34D399', txt: '+1 gold, and +1 for each trade building.', inc: 'trade' },
        { n: 7, name: 'Architect', col: '#C084FC', txt: 'Draw 2 extra cards and build up to 3 buildings.' },
        { n: 8, name: 'Captain', col: '#FB7185', txt: '+1 gold for each guard building. Pay 1 less than its cost to knock down a building.', inc: 'guard' }];
      const BOTS = [['Baron Hoot', '🦉'], ['Lady Purr', '🐱'], ['Sir Croak', '🐸'], ['Duke Bun', '🐰'], ['Madam Moo', '🐮']];

      function buildDeck(shuffle) { const d = []; let id = 0; BUILD.forEach(([name, c, cost, n]) => { for (let i = 0; i < n; i++) d.push({ id: id++, name, c, cost }); }); return shuffle(d); }
      function score(p, firstDone, target) {
        let s = p.city.reduce((a, b) => a + b.cost + (b.c === 'wonder' ? 2 : 0), 0);
        if (Object.keys(COLORS).every((c) => p.city.some((b) => b.c === c))) s += 3;
        if (p.city.length >= target) s += p === firstDone ? 4 : 2;
        return s;
      }
      const income = (p, role) => (ROLES[role].inc ? p.city.filter((b) => b.c === ROLES[role].inc).length : 0) + (role === 6 ? 1 : 0);

      /* ---------- the computer ---------- */
      function botPickRole(G, p, avail) {
        const val = (r) => {
          let v = Math.random() * 1.5;
          if (ROLES[r].inc) v += income(p, r) * 1.4;
          if (r === 6) v += 1.2;
          if (r === 7) v += p.hand.length >= 2 && p.gold >= 3 ? 3 : 1;
          if (r === 3) v += p.hand.length < 2 ? 2.5 : 0.5;
          if (r === 4) v += 1;
          if (r === 8) v += G.players.some((q) => q !== p && q.city.length >= G.target - 2) ? 2 : 0.3;
          if (r === 1 || r === 2) v += 1.3;
          return v;
        };
        return avail.slice().sort((a, b) => val(b) - val(a))[0];
      }
      function botTarget(G, p, mineRole) {
        // guess which characters the others probably took: the strong earners
        const opts = [3, 4, 5, 6, 7, 8].filter((r) => r !== mineRole && G.out[1] !== r && r > mineRole);
        return opts.sort((a, b) => (b === 6 || b === 7 ? 1 : 0) - (a === 6 || a === 7 ? 1 : 0) + Math.random() - 0.5)[0];
      }
      function botBuilds(p, max) {
        const out = []; let gold = p.gold;
        const owned = new Set(p.city.map((b) => b.name));
        const cands = p.hand.map((c, i) => ({ c, i })).filter((x) => !owned.has(x.c.name)).sort((a, b) => b.c.cost - a.c.cost);
        for (const x of cands) { if (out.length >= max) break; if (x.c.cost <= gold && !out.some((o) => p.hand[o].name === x.c.name)) { out.push(x.i); gold -= x.c.cost; } }
        return out;
      }

      /* ---------- the screen ---------- */
      let G = null;
      const $ = (id) => document.getElementById(id);
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1300px] mx-auto');
        setupScreen(body, mod, [
          { key: 'n', label: 'PLAYERS', def: 4, choices: [[3, '3'], [4, '4'], [5, '5'], [6, '6']] },
          { key: 'target', label: 'GAME ENDS AT', def: 7, choices: [[6, '6 buildings'], [7, '7 buildings'], [8, '8 buildings']], hint: 'The round finishes once someone has built this many.' },
          turnOpt(45, [30, 45, 90]),
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(BOTS.slice(0, +sel.n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel)));
      }
      function start(body, sel, S) {
        const deck = buildDeck(S.rng.shuffle);
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, gold: 2, hand: [], city: [], role: 0 }));
        players.forEach((p) => { for (let k = 0; k < 4; k++) p.hand.push(deck.pop()); });
        G = { S, me: S.online ? S.me : 0, turnT: +sel.turnT || 0, tk: 0, players, deck, crown: S.rng.rnd(players.length), target: +sel.target || 7, round: 0, step: 0, over: false, tok: ++GT.cur, log: [], out: [], firstDone: null, cur: -1 };
        GT.started = true; GT.over = false;
        // instant info box over a building (the browser's own hover box waits about a second; Cael found it slow)
        const tipEl = () => { let t = $('gm-tip'); if (!t) { t = document.createElement('div'); t.id = 'gm-tip'; document.body.appendChild(t); } return t; };
        const showTip = (el) => { const t = tipEl(), r = el.getBoundingClientRect(); t.textContent = el.dataset.tip; t.style.display = 'block';
          const w = t.offsetWidth; t.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2)) + 'px'; t.style.top = Math.max(6, r.top - t.offsetHeight - 8) + 'px'; };
        const hideTip = () => { const t = $('gm-tip'); if (t) t.style.display = 'none'; };
        gOn(body, 'pointerover', (e) => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) showTip(el); });
        gOn(body, 'pointerout', (e) => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el && !el.contains(e.relatedTarget)) hideTip(); });
        gOn(body, 'pointerdown', (e) => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el && e.pointerType !== 'mouse') { showTip(el); gTimeout(hideTip, 1600); } });
        body.innerHTML = `<div class="gm-wrap grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
          <div class="space-y-3 min-w-0"><div id="gm-towns" class="gm-towns"></div>
            <div id="gm-prompt" class="win p-3 text-sm min-h-[54px]"></div>
            <div id="gm-mine"></div></div>
          <div class="space-y-3 min-w-0"><div class="win overflow-hidden"><div class="winbar amber"><span id="gm-status">CASTLES & KINGS</span><span class="pix text-xs" id="gm-round"></span></div>
            <div class="p-3" id="gm-roles"></div></div>
            <div id="gm-log" class="logbox" style="height:220px"></div><button id="gm-quit" class="btn-game btn-coral w-full py-2 text-sm">${S.online ? 'Leave table' : 'Give up'}</button></div></div>`;
        S.track();
        S.onLeft = (a) => { if (!G) return; const q = G.players[a.s]; q.name += ' (CPU)'; q.av = '🤖'; log(`${nm(q)} ${a.t === '_gone' ? 'disconnected' : 'left'}. A computer player takes over.`); draw(); };
        npBar('');
        let sure = false;
        $('gm-quit').onclick = (e) => { if (S.online) return npConfirmLeave(() => open($('game-root'))); if (!sure) { sure = true; e.target.textContent = 'Really give up?'; gTimeout(() => { sure = false; e.target.textContent = 'Give up'; }, 3000); return; } if (!G.over) { G.tok++; finish(true); } };
        log(`Everyone starts with 2 gold and 4 building cards. ${nm(G.players[G.crown])} has the crown 👑.`);
        draw();
        run().catch((e) => { if (e !== ABORT) throw e; });
      }
      async function W(ms) { const t = G && G.tok; await gSleep(window.__fast ? Math.min(ms, 30) : ms); if (!G || G.tok !== t) throw ABORT; }
      const log = (t) => { G.log.push(t); const el = $('gm-log'); if (el) { el.innerHTML = G.log.slice(-50).map((x) => `<div>${x}</div>`).join(''); el.scrollTop = el.scrollHeight; } };
      const prompt = (h) => { const e = $('gm-prompt'); if (e) e.innerHTML = h; };
      const nm = (p) => `<b>${esc(p.name)}</b>`;
      const isMe = (p) => p.seat === G.me;
      const RN = (r) => `<b style="color:${ROLES[r].col}">${r}. ${ROLES[r].name}</b>`;
      async function ask(p, botFn, filter, ms) {
        const t = G.tok, mine = G.S.mine(p.seat) && !G.S.bot(p.seat) && (typeof NP === 'undefined' || !NP.catchup);
        if (mine) turnClock('gm' + (++G.tk), G.turnT, () => { if (!G || G.tok !== t) return; prompt(''); G.S.act(Object.assign({}, botFn(), { s: p.seat })); });
        const a = await G.S.ask(p.seat, botFn, ms === undefined ? 700 + rnd(700) : ms, (x) => x.s === p.seat && filter(x));
        if (mine) turnClock(null);
        if (!G || G.tok !== t) throw ABORT; return a;
      }
      function drawCard() { return G.deck.length ? G.deck.pop() : null; }

      async function run() {
        while (G && !G.over) {
          G.round++;
          await draft();
          for (let r = 1; r <= 8 && !G.over; r++) {
            const p = G.players.find((q) => q.role === r);
            if (!p) continue;
            await turn(p, r);
          }
          if (G.over) return;
          G.players.forEach((q) => { q.role = 0; }); G.killed = 0; G.robbed = 0; G.cur = -1;
          if (G.firstDone) { G.tok++; return finish(false); }
        }
      }
      // everyone picks a character, starting with the crown
      async function draft() {
        const S = G.S, n = G.players.length;
        let avail = S.rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
        G.out = [avail.pop()];                                   // one set aside face down
        if (n <= 4) G.out.push(avail.pop());                      // and one face up with few players
        avail.sort((a, b) => a - b);
        G.phase = 'draft'; draw();
        log(`— Round ${G.round}: choose your characters —`);
        for (let k = 0; k < n; k++) {
          const p = G.players[(G.crown + k) % n], kk = ++G.step;
          G.cur = p.seat; draw();
          if (S.mine(p.seat)) pickUI(p, avail, kk); else prompt(`<span class="text-muted">${esc(p.name)} is choosing a character...</span>`);
          const a = await ask(p, () => ({ t: 'role', k: kk, r: botPickRole(G, p, avail) }), (x) => x.t === 'role' && x.k === kk);
          const r = avail.includes(a.r) ? a.r : avail[0];
          avail = avail.filter((x) => x !== r); p.role = r;
          SFX.play('card'); log(`${nm(p)} picks a character${isMe(p) ? ` (${RN(r)})` : ''}.`);
          draw(); await W(300);
        }
        G.phase = 'play'; prompt('');
      }
      function pickUI(p, avail, k) {
        prompt(`<div class="text-center mb-2">Choose your character for this round${G.out.length > 1 ? ` (set aside face up: ${RN(G.out[1])})` : ''}:</div><div class="gm-rolepick">${avail.map((r) => roleCard(r, `data-r="${r}"`)).join('')}</div>`);
        document.querySelectorAll('#gm-prompt [data-r]').forEach((el) => { el.onclick = () => { prompt(''); G.S.act({ t: 'role', s: p.seat, k, r: +el.dataset.r }); }; });
      }
      function roleCard(r, attr = '', cls = '') { const R = ROLES[r]; return `<button class="gm-role ${cls}" style="--rc:${R.col}" ${attr}><span class="gm-rn">${r}</span><b>${R.name}</b><small>${R.txt}</small></button>`; }

      async function turn(p, r) {
        const S = G.S; G.cur = p.seat; G.phase = 'play';
        $('gm-status').textContent = S.mine(p.seat) ? 'YOUR TURN' : `${p.name.toUpperCase()}'S TURN`;
        log(`${RN(r)}: ${nm(p)}.`);
        if (G.killed === r) { log(`${nm(p)} was caught by the Shadow and misses this turn.`); SFX.play('nope'); draw(); await W(900); return; }
        if (G.robbed === r) { const thief = G.players.find((q) => q.role === 2); if (thief && p.gold) { log(`The Pickpocket takes ${p.gold} gold from ${nm(p)}!`); thief.gold += p.gold; gFly('#gm-town-' + p.seat, '#gm-town-' + thief.seat, chipSVG(5, 26), { ms: 500 }); p.gold = 0; SFX.play('coin'); } }
        if (r === 4) { G.crown = p.seat; log(`${nm(p)} takes the crown 👑.`); }
        const inc = income(p, r); if (inc) { p.gold += inc; log(`${nm(p)} collects ${inc} gold from their town.`); SFX.play('coin'); }
        if (r === 3 || r === 7) { for (let i = 0; i < 2; i++) { const c = drawCard(); if (c) p.hand.push(c); } log(`${nm(p)} draws 2 extra cards.`); }
        draw(); await W(400);
        // 1. Shadow / Pickpocket: name a character
        if (r === 1 || r === 2) {
          const k = ++G.step;
          if (S.mine(p.seat)) targetUI(p, r, k); else prompt(`<span class="text-muted">${esc(p.name)} is naming a character...</span>`);
          const a = await ask(p, () => ({ t: 'name', k, v: botTarget(G, p, r) }), (x) => x.t === 'name' && x.k === k);
          const v = Math.max(r + 1, Math.min(8, +a.v || 0)) === +a.v ? +a.v : r === 1 ? 6 : 6;
          if (r === 1) G.killed = v; else G.robbed = v;
          log(`${nm(p)} names the ${RN(v)}.`); SFX.play('reveal'); await W(500);
        }
        // 2. take 2 gold, or look at 2 cards and keep 1
        let k = ++G.step;
        if (S.mine(p.seat)) takeUI(p, k); else prompt(`<span class="text-muted">${esc(p.name)} is thinking...</span>`);
        const t = await ask(p, () => ({ t: 'take', k, v: p.hand.length < 2 || (p.hand.every((c) => c.cost <= p.gold) && p.hand.length < 3) ? 'cards' : 'gold' }), (x) => x.t === 'take' && x.k === k);
        if (t.v === 'cards' && G.deck.length) {
          const two = [drawCard(), drawCard()].filter(Boolean);
          k = ++G.step;
          if (S.mine(p.seat) && two.length > 1) keepUI(p, two, k);
          const kp = two.length > 1 ? await ask(p, () => ({ t: 'keep', k, i: two[0].cost >= two[1].cost && !p.city.some((b) => b.name === two[0].name) ? 0 : 1 }), (x) => x.t === 'keep' && x.k === k) : { i: 0 };
          const keep = two[kp.i === 1 ? 1 : 0], back = two.find((c) => c !== keep);
          p.hand.push(keep); if (back) G.deck.unshift(back);
          log(`${nm(p)} keeps a building card.`); SFX.play('draw');
        } else { p.gold += 2; log(`${nm(p)} takes 2 gold.`); SFX.play('coin'); }
        draw(); await W(300);
        // 3. build (and the Captain's knock-down)
        k = ++G.step;
        const max = r === 7 ? 3 : 1;
        if (S.mine(p.seat)) buildUI(p, r, max, k); else prompt(`<span class="text-muted">${esc(p.name)} is building...</span>`);
        const b = await ask(p, () => {
          const out = { t: 'build', k, b: botBuilds(p, max) };
          if (r === 8) { const left = p.gold - out.b.reduce((a, i) => a + p.hand[i].cost, 0); const tgt = G.players.filter((q) => q !== p && q.role !== 5 && q.city.length < G.target).sort((a, c) => c.city.length - a.city.length)[0];
            const bld = tgt && tgt.city.map((x, j) => ({ x, j })).filter((o) => o.x.cost - 1 <= left).sort((a, c) => c.x.cost - a.x.cost)[0]; if (bld && tgt.city.length >= G.target - 3) out.kd = [tgt.seat, bld.j]; }
          return out; }, (x) => x.t === 'build' && x.k === k);
        const want = [...new Set((b.b || []).map(Number))].filter((i) => p.hand[i]).slice(0, max);
        const built = [];
        for (const i of want) { const c = p.hand[i]; if (c.cost <= p.gold && !p.city.some((x) => x.name === c.name) && !built.includes(c)) { p.gold -= c.cost; built.push(c); } }
        for (const c of built) { p.hand.splice(p.hand.indexOf(c), 1); p.city.push(c); log(`${nm(p)} builds a <b style="color:${COLORS[c.c]}">${esc(c.name)}</b> (${c.cost}).`); SFX.play('move'); draw(); await W(450); }
        if (r === 8 && b.kd) {
          const q = G.players[b.kd[0]], c = q && q.city[b.kd[1]];
          if (q && c && q !== p && q.role !== 5 && q.city.length < G.target && c.cost - 1 <= p.gold) { p.gold -= Math.max(0, c.cost - 1); q.city.splice(b.kd[1], 1); log(`${nm(p)} knocks down ${isMe(q) ? 'your' : nm(q) + '’s'} ${esc(c.name)}! 💥`); SFX.play('crash'); draw(); await W(700); }
        }
        if (!G.firstDone && p.city.length >= G.target) { G.firstDone = p; log(`${nm(p)} has built ${G.target} buildings! This is the last round.`); SFX.play('win'); }
        prompt(''); draw(); await W(350);
      }
      function targetUI(p, r, k) {
        const opts = [2, 3, 4, 5, 6, 7, 8].filter((x) => x > r && !(G.out[1] === x));
        prompt(`<div class="text-center mb-2">${r === 1 ? 'Shadow: name a character to miss their turn.' : 'Pickpocket: name a character to rob.'}</div><div class="gm-rolepick">${opts.map((x) => roleCard(x, `data-n="${x}"`, 'mini')).join('')}</div>`);
        document.querySelectorAll('#gm-prompt [data-n]').forEach((el) => { el.onclick = () => { prompt(''); G.S.act({ t: 'name', s: p.seat, k, v: +el.dataset.n }); }; });
      }
      function takeUI(p, k) {
        prompt(`<div class="flex items-center justify-center gap-3 flex-wrap"><span>Take something:</span><button class="btn-game btn-amber py-2 px-4 text-sm" data-v="gold">🪙 Take 2 gold</button><button class="btn-game btn-teal py-2 px-4 text-sm" data-v="cards" ${G.deck.length ? '' : 'disabled'}>🃏 Look at 2 cards, keep 1</button></div>`);
        document.querySelectorAll('#gm-prompt [data-v]').forEach((el) => { el.onclick = () => { prompt(''); G.S.act({ t: 'take', s: p.seat, k, v: el.dataset.v }); }; });
      }
      function keepUI(p, two, k) {
        prompt(`<div class="text-center mb-2">Keep one of these:</div><div class="flex justify-center gap-3">${two.map((c, i) => bldHTML(c, `data-i="${i}"`, 'big pick')).join('')}</div>`);
        document.querySelectorAll('#gm-prompt [data-i]').forEach((el) => { el.onclick = () => { prompt(''); G.S.act({ t: 'keep', s: p.seat, k, i: +el.dataset.i }); }; });
      }
      function buildUI(p, r, max, k) {
        G.buildSel = []; G.kd = null; G.buildK = k; G.buildMax = max; G.buildRole = r;
        const paint = () => {
          const cost = G.buildSel.reduce((a, i) => a + p.hand[i].cost, 0);
          prompt(`<div class="flex items-center justify-center gap-3 flex-wrap"><span>${max > 1 ? `Tap up to ${max} buildings in your hand to build` : 'Tap a building in your hand to build it'} (you have <b class="text-amber">${p.gold} gold</b>)${r === 8 ? '. Captain: tap a building in another town to knock it down' : ''}.</span>
            <button id="gm-done" class="btn-game btn-amber py-2 px-5 text-sm">${G.buildSel.length ? `Build (${cost} gold)` : 'End turn'}${G.kd ? ' + knock down' : ''}</button></div>`);
          $('gm-done').onclick = () => { const a = { t: 'build', s: p.seat, k, b: G.buildSel.slice() }; if (G.kd) a.kd = G.kd; G.buildK = null; prompt(''); draw(); G.S.act(a); };
        };
        G.buildPaint = paint; paint(); draw();
      }

      function bldHTML(c, attr = '', cls = '') {
        return `<div class="gm-b ${cls}" style="--bc:${COLORS[c.c]}" ${attr} data-tip="${esc(c.name)}: ${CNAME[c.c]} building, costs ${c.cost}" aria-label="${esc(c.name)}: ${CNAME[c.c]} building, costs ${c.cost}"><svg viewBox="0 0 20 16" shape-rendering="crispEdges"><rect x="2" y="7" width="16" height="9" fill="#050E18"/><rect x="3" y="8" width="14" height="8" fill="${COLORS[c.c]}"/><rect x="1" y="5" width="18" height="3" fill="#050E18"/><rect x="${c.c === 'faith' ? 9 : 5}" y="${c.c === 'faith' ? 0 : 2}" width="${c.c === 'faith' ? 2 : 10}" height="${c.c === 'faith' ? 6 : 3}" fill="#050E18"/>${c.c === 'wonder' ? '<rect x="8" y="0" width="4" height="5" fill="#050E18"/><rect x="9" y="1" width="2" height="3" fill="#F5B041"/>' : ''}${c.c === 'guard' ? '<rect x="3" y="3" width="2" height="2" fill="#050E18"/><rect x="15" y="3" width="2" height="2" fill="#050E18"/>' : ''}<rect x="8" y="11" width="4" height="5" fill="#050E18"/></svg><b>${esc(c.name)}</b><i>${c.cost}</i></div>`;
      }
      function draw() {
        if (!$('gm-towns') || !G) return;
        const S = G.S, me = G.players[G.me];
        const kdPick = G.buildK && G.buildRole === 8;
        $('gm-towns').innerHTML = G.players.filter((q) => q !== me).map((q) => townHTML(q, kdPick && q.role !== 5 && q.city.length < G.target)).join('');
        $('gm-mine').innerHTML = townHTML(me, false, true) + `<div class="pix text-xs text-muted mt-3 mb-1 text-center">YOUR BUILDING CARDS · tap to build</div><div class="flex flex-wrap justify-center gap-2" id="gm-hand">${me.hand.map((c, i) => bldHTML(c, `data-i="${i}"`, `big ${G.buildK && G.cur === me.seat ? (c.cost <= me.gold - (G.buildSel || []).filter((j) => j !== i).reduce((a, j) => a + me.hand[j].cost, 0) && !me.city.some((x) => x.name === c.name) ? 'can' : 'no') : ''} ${(G.buildSel || []).includes(i) && G.buildK ? 'sel' : ''}`)).join('')}</div>`;
        document.querySelectorAll('#gm-hand [data-i]').forEach((el) => { el.onclick = () => {
          if (!G.buildK || G.cur !== me.seat) return; const i = +el.dataset.i;
          if (G.buildSel.includes(i)) G.buildSel = G.buildSel.filter((x) => x !== i);
          else if (el.classList.contains('can') && G.buildSel.length < G.buildMax) { if (G.buildMax === 1) G.buildSel = [i]; else G.buildSel.push(i); }
          else return SFX.play('wrong');
          SFX.play('click'); draw(); G.buildPaint();
        }; });
        document.querySelectorAll('.gm-town.kd .gm-b[data-j]').forEach((el) => { el.onclick = () => {
          const q = +el.closest('.gm-town').dataset.seat, j = +el.dataset.j, c = G.players[q].city[j];
          if (c.cost - 1 > me.gold - G.buildSel.reduce((a, i) => a + me.hand[i].cost, 0)) return showToast(`Knocking down the ${c.name} costs ${c.cost - 1} gold.`, 'error');
          G.kd = G.kd && G.kd[0] === q && G.kd[1] === j ? null : [q, j]; SFX.play('click'); draw(); G.buildPaint();
        }; });
        // characters panel: who is who once they have played
        const cur = G.players.find((q) => q.seat === G.cur);
        $('gm-round').textContent = `ROUND ${G.round}`;
        $('gm-roles').innerHTML = `<div class="space-y-1.5">${[1, 2, 3, 4, 5, 6, 7, 8].map((r) => {
          const who = G.players.find((q) => q.role === r), shown = who && (G.phase === 'play' && cur && cur.role >= r || isMe(who));
          const out = G.out.includes(r) && G.phase !== 'idle', faceUp = G.out[1] === r;
          return `<div class="gm-rl ${cur && cur.role === r && G.phase === 'play' ? 'now' : ''} ${G.killed === r ? 'dead' : ''}" style="--rc:${ROLES[r].col}"><span class="gm-rn">${r}</span><b>${ROLES[r].name}</b><span class="ml-auto text-xs">${shown ? `${esc(who.av)} ${esc(who.name)}` : faceUp ? 'set aside' : out && G.phase === 'play' ? '' : ''}${G.robbed === r ? ' 💰' : ''}</span></div>`; }).join('')}</div>
          <div class="text-xs text-muted mt-2">👑 Crown: ${esc(G.players[G.crown].name)} · First to ${G.target} buildings ends the game.</div>`;
      }
      function townHTML(q, kd, mine) {
        const cur = q.seat === G.cur;
        return `<div id="gm-town-${q.seat}" class="gm-town ${cur ? 'turn' : ''} ${mine ? 'mine' : ''} ${kd ? 'kd' : ''}" data-seat="${q.seat}">
          <div class="gm-th"><span class="tg-av">${esc(q.av)}</span><b class="truncate">${esc(q.name)}${mine ? ' (you)' : ''}</b>${G.crown === q.seat ? '<span title="Crown">👑</span>' : ''}<span class="ml-auto gm-chip">🪙 ${q.gold}</span><span class="gm-chip">🃏 ${q.hand.length}</span><span class="gm-chip">🏠 ${q.city.length}/${G.target}</span></div>
          <div class="gm-city">${q.city.length ? q.city.map((c, j) => bldHTML(c, `data-j="${j}"`, G.kd && G.kd[0] === q.seat && G.kd[1] === j ? 'kdsel' : '')).join('') : '<span class="text-xs text-muted">No buildings yet</span>'}</div></div>`;
      }
      async function finish(gaveUp) {
        G.over = true; G.S.over = true; G.buildK = null;
        const S = G.S, me = G.players[G.me], tok = G.tok;
        const sc = G.players.map((q) => ({ q, s: score(q, G.firstDone, G.target) })).sort((a, b) => b.s - a.s || b.q.gold - a.q.gold);
        const res = gaveUp ? 'loss' : sc[0].q === me ? 'win' : 'loss';
        prompt(`<div class="text-center">${sc.map((x, i) => `${i + 1}. ${esc(x.q.name)} <b class="text-amber">${x.s}</b>`).join(' &nbsp;·&nbsp; ')}</div>`);
        const eloRow = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        const s = gstat('guild'); s.best = Math.max(s.best || 0, score(me, G.firstDone, G.target)); s.built = (s.built || 0) + me.city.length;
        reportGame('guild', res, { place: gaveUp ? undefined : sc.findIndex((x) => x.q === me) + 1, elo: S.online ? 0 : res === 'win' ? 10 : -4, xp: res === 'win' ? 35 : 10, label: `${score(me, G.firstDone, G.target)} points` });
        gameResult({ title: gaveUp ? 'You gave up' : res === 'win' ? 'Your town wins!' : `${sc[0].q.name} wins`, sub: gaveUp ? '' : 'Points: building costs, +3 for all five colours, +4 for finishing first, +2 per wonder.',
          tone: res === 'win' ? 'amber' : 'coral', sprite: res === 'win' ? 'trophy' : 'anchor',
          rows: sc.slice(0, 4).map((x) => [x.q === me ? 'You' : x.q.name, x.s, x.q === me ? 'text-amber' : 'text-bone']).concat(eloRow ? [eloRow] : []),
          againLabel: S.online ? 'Back to setup' : 'Play again', again: () => open($('game-root')) });
      }

      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      GICONS.guild = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(1, 1, 22, 22, K)}${rr(2, 2, 20, 20, '#1A3856')}${rr(3, 12, 6, 9, K)}${rr(4, 13, 4, 8, '#60A5FA')}${rr(9, 8, 7, 13, K)}${rr(10, 9, 5, 12, '#F5B041')}${rr(11, 4, 3, 5, K)}${rr(12, 5, 1, 3, '#FB7185')}${rr(16, 14, 6, 7, K)}${rr(17, 15, 4, 6, '#34D399')}${rr(11, 16, 3, 5, K)}${rr(3, 21, 19, 1, K)}</svg>`;
      const mod = {
        id: 'guild', name: 'Castles & Kings', icon: 'guild', cats: ['card', 'board'], sub: '3-6 PLAYERS · ~20 MIN', color: '#C084FC', tone: 'amber', btn: 'amber',
        blurb: 'Pick a secret character each round, collect gold and build the finest town. Watch out for the Shadow and the Pickpocket!',
        rules: { tag: 'CHARACTERS & TOWNS · 3-6 PLAYERS', steps: [
          '<strong class="text-bone">Pick a character:</strong> Each round everyone secretly picks one. The player with the crown 👑 picks first.',
          '<strong class="text-bone">Take turns in number order:</strong> Take 2 gold, or look at 2 building cards and keep 1. Then build one building by paying its cost. Use your character’s power.',
          '<strong class="text-bone">Game end:</strong> When someone has built the target number of buildings, the round is finished and the best town wins.',
          '<strong class="text-bone">Points:</strong> Every building is worth its cost. +3 for having all five colours, +4 for finishing first (+2 for others who finish), +2 for each wonder.',
        ], tip: 'The Merchant, Monarch, Abbot and Captain earn more gold the more buildings of their colour you own.' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['BEST SCORE', s.best || 0, 'text-teal'], ['BUILT', s.built || 0, 'text-emerald']],
        engine: { buildDeck, score, income, botPickRole, botBuilds, ROLES, get G() { return G; } }, open, close() { const t = document.getElementById('gm-tip'); if (t) t.remove(); G = null; },
        art: { role: (r) => roleCard(r), building: (c) => bldHTML(c, '', 'big') },
        online: { seats: (sel) => +sel.n || 4, min: 3, ranked: false, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
