    /* =========================================================================
       LANDLORD: roll, buy, build and bankrupt your rivals
       ========================================================================= */
    (function tycoonGame() {
      const GR = { br: '#A16207', lb: '#7DD3FC', pk: '#F9A8D4', or: '#FB923C', rd: '#EF4444', yl: '#FACC15', gn: '#22C55E', bl: '#3B82F6', rail: '#94A3B8', ut: '#CBD5E1' };
      const HC = { br: 50, lb: 50, pk: 100, or: 100, rd: 150, yl: 150, gn: 200, bl: 200 };
      // [name, price, group, rent levels]
      const P = (n, pr, g, r) => ({ k: 'prop', n, pr, g, r, hc: HC[g] });
      const BOARD = [
        { k: 'go', n: 'START', ico: '➡️' },
        P('Dockside Lane', 60, 'br', [2, 10, 30, 90, 160, 250]), { k: 'chest', n: 'Mystery Box', ico: '📦' }, P('Anchor Alley', 60, 'br', [4, 20, 60, 180, 320, 450]),
        { k: 'tax', n: 'Income Tax', pay: 200, ico: '💸' }, { k: 'rail', n: 'Harbor Rail', pr: 200, g: 'rail' },
        P('Maple Street', 100, 'lb', [6, 30, 90, 270, 400, 550]), { k: 'chance', n: 'Surprise', ico: '❓' }, P('Cedar Court', 100, 'lb', [6, 30, 90, 270, 400, 550]), P('Birch Boulevard', 120, 'lb', [8, 40, 100, 300, 450, 600]),
        { k: 'jail', n: 'Jail / Just Visiting', ico: '🚔' },
        P('Peach Plaza', 140, 'pk', [10, 50, 150, 450, 625, 750]), { k: 'util', n: 'Wind Farm', pr: 150, g: 'ut', ico: '🌬️' }, P('Blossom Way', 140, 'pk', [10, 50, 150, 450, 625, 750]), P('Cherry Court', 160, 'pk', [12, 60, 180, 500, 700, 900]),
        { k: 'rail', n: 'Mountain Rail', pr: 200, g: 'rail' },
        P('Market Street', 180, 'or', [14, 70, 200, 550, 750, 950]), { k: 'chest', n: 'Mystery Box', ico: '📦' }, P('Bazaar Square', 180, 'or', [14, 70, 200, 550, 750, 950]), P('Harvest Road', 200, 'or', [16, 80, 220, 600, 800, 1000]),
        { k: 'park', n: 'Free Parking', ico: '🅿️' },
        P('Ruby Row', 220, 'rd', [18, 90, 250, 700, 875, 1050]), { k: 'chance', n: 'Surprise', ico: '❓' }, P('Crimson Court', 220, 'rd', [18, 90, 250, 700, 875, 1050]), P('Firehouse Lane', 240, 'rd', [20, 100, 300, 750, 925, 1100]),
        { k: 'rail', n: 'Prairie Rail', pr: 200, g: 'rail' },
        P('Sunny Side', 260, 'yl', [22, 110, 330, 800, 975, 1150]), P('Lemon Lane', 260, 'yl', [22, 110, 330, 800, 975, 1150]), { k: 'util', n: 'Waterworks', pr: 150, g: 'ut', ico: '💧' }, P('Gold Coast', 280, 'yl', [24, 120, 360, 850, 1025, 1200]),
        { k: 'gojail', n: 'Go To Jail', ico: '👮' },
        P('Pine Ridge', 300, 'gn', [26, 130, 390, 900, 1100, 1275]), P('Emerald Avenue', 300, 'gn', [26, 130, 390, 900, 1100, 1275]), { k: 'chest', n: 'Mystery Box', ico: '📦' }, P('Forest Gate', 320, 'gn', [28, 150, 450, 1000, 1200, 1400]),
        { k: 'rail', n: 'Coastal Rail', pr: 200, g: 'rail' }, { k: 'chance', n: 'Surprise', ico: '❓' },
        P('Skyline Tower', 350, 'bl', [35, 175, 500, 1100, 1300, 1500]), { k: 'tax', n: 'Luxury Tax', pay: 100, ico: '💎' }, P('Grand Boulevard', 400, 'bl', [50, 200, 600, 1400, 1700, 2000]),
      ];
      BOARD.forEach((t, i) => { t.i = i; });
      const GROUPS = {}; BOARD.forEach((t) => { if (t.g) (GROUPS[t.g] = GROUPS[t.g] || []).push(t.i); });
      const CHANCE = [
        { t: 'Advance to START and collect 200.', a: 'move', to: 0 }, { t: 'Take a trip to Prairie Rail.', a: 'move', to: 25 }, { t: 'Walk to Grand Boulevard.', a: 'move', to: 39 },
        { t: 'Advance to the nearest railroad. Pay the owner double rent, or buy it.', a: 'rail' }, { t: 'Your stocks pay off. Collect 50.', a: 'gain', n: 50 }, { t: 'Speeding ticket. Pay 15.', a: 'pay', n: 15 },
        { t: 'Go back 3 spaces.', a: 'back3' }, { t: 'Go directly to Jail.', a: 'jail' }, { t: 'Get Out of Jail Free. Keep this card.', a: 'free' }, { t: 'Repair your buildings: pay 25 per house and 100 per hotel.', a: 'repairs', h: 25, ht: 100 },
        { t: 'It is your birthday! Collect 20 from every player.', a: 'each', n: 20 }, { t: 'Charity gala. Pay 50.', a: 'pay', n: 50 },
      ];
      const CHEST = [
        { t: 'Bank error in your favour. Collect 200.', a: 'gain', n: 200 }, { t: 'Doctor visit. Pay 50.', a: 'pay', n: 50 }, { t: 'You found a treasure map. Collect 100.', a: 'gain', n: 100 },
        { t: 'Go directly to Jail.', a: 'jail' }, { t: 'Get Out of Jail Free. Keep this card.', a: 'free' }, { t: 'Tax refund. Collect 20.', a: 'gain', n: 20 }, { t: 'Advance to START and collect 200.', a: 'move', to: 0 },
        { t: 'You won a pie contest. Collect 25.', a: 'gain', n: 25 }, { t: 'Street repairs: pay 40 per house and 115 per hotel.', a: 'repairs', h: 40, ht: 115 }, { t: 'Pay your school fees: 100.', a: 'pay', n: 100 },
        { t: 'Collect 10 from every player for the street party.', a: 'each', n: 10 }, { t: 'Go to Maple Street.', a: 'move', to: 6 },
      ];
      const PCOL = ['#F5B041', '#60A5FA', '#FB7185', '#34D399'];
      const BN = [['Tycoon Tina', '🐧'], ['Banker Bob', '🐻'], ['Lady Lux', '🦄']];
      const ABORT = { a: 1 };
      let G = null, boardRO = null;

      /* ---------- rules helpers (pure) ---------- */
      const owns = (S, p, g) => GROUPS[g].every((i) => S.own[i] === p);
      function rentFor(S, i, dice) {
        const t = BOARD[i], o = S.own[i];
        if (o === undefined || o === null || S.mort[i]) return 0;
        if (t.k === 'rail') { const n = GROUPS.rail.filter((x) => S.own[x] === o).length; return 25 * Math.pow(2, n - 1); }
        if (t.k === 'util') { const n = GROUPS.ut.filter((x) => S.own[x] === o).length; return (n === 2 ? 10 : 4) * dice; }
        const h = S.houses[i];
        if (h > 0) return t.r[h];
        return owns(S, o, t.g) ? t.r[0] * 2 : t.r[0];
      }
      /* ---------- property cards (Inna): what a plot earns, what building costs ---------- */
      function deedHTML(i) {
        const t = BOARD[i], S = G && (G.S || null), o = S ? S.own[i] : undefined;
        const owner = o !== undefined && o !== null && G ? G.players[o] : null, h = S ? S.houses[i] || 0 : 0, mort = S && S.mort[i];
        const row = (a, b, on) => `<div class="ty-dr ${on ? 'on' : ''}"><span>${a}</span><b>${b}</b></div>`;
        let body = '';
        if (t.k === 'prop') {
          const full = owner && owns(S, o, t.g);
          body = row('Rent', money(t.r[0]), owner && !h && !full) + row('Rent with the whole colour set', money(t.r[0] * 2), owner && !h && full)
            + [1, 2, 3, 4].map((n) => row(`With ${n} house${n > 1 ? 's' : ''}`, money(t.r[n]), h === n)).join('') + row('With a hotel', money(t.r[5]), h === 5)
            + `<div class="ty-dsep"></div>` + row('Each house costs', money(t.hc)) + row('Hotel costs', `${money(t.hc)} + 4 houses`) + row('Mortgage value', money(t.pr / 2));
        } else if (t.k === 'rail') {
          const n = owner ? GROUPS.rail.filter((x) => S.own[x] === o).length : 0;
          body = [1, 2, 3, 4].map((k) => row(`Owner has ${k} railroad${k > 1 ? 's' : ''}`, money(25 * Math.pow(2, k - 1)), n === k)).join('') + `<div class="ty-dsep"></div>` + row('Mortgage value', money(t.pr / 2));
        } else if (t.k === 'util') {
          const n = owner ? GROUPS.ut.filter((x) => S.own[x] === o).length : 0;
          body = row('Owner has 1 utility', '4 × the dice', n === 1) + row('Owner has both utilities', '10 × the dice', n === 2) + `<div class="ty-dsep"></div>` + row('Mortgage value', money(t.pr / 2));
        } else return '';
        return `<div class="ty-deed"><div class="ty-dhead" style="background:${GR[t.g] || '#94A3B8'}"><span class="pix text-xs">${t.k === 'prop' ? 'PROPERTY CARD' : t.k === 'rail' ? 'RAILROAD' : 'UTILITY'}</span><b>${esc(t.n)}</b></div>
          <div class="ty-dbody"><div class="ty-dprice">Price <b>${money(t.pr)}</b></div>${body}
          <div class="ty-down">${owner ? `Owned by <b>${esc(owner.name)}</b>${t.k === 'prop' ? ` · ${h === 5 ? 'hotel' : h + ' house' + (h === 1 ? '' : 's')}` : ''}${mort ? ' · <span class="text-coral">mortgaged</span>' : ''}${!mort ? ` · rent now <b>${t.k === 'util' ? (GROUPS.ut.filter((x) => S.own[x] === o).length === 2 ? '10' : '4') + ' × dice' : money(rentFor(S, i, 7))}</b>` : ''}` : 'Not owned yet: buy it when you land on it'}</div></div></div>`;
      }
      function openDeed(i) {
        const t = BOARD[i]; if (!t || !['prop', 'rail', 'util'].includes(t.k)) return;
        let el = document.getElementById('ty-deed-modal');
        if (!el) { el = document.createElement('div'); el.id = 'ty-deed-modal'; el.className = 'hidden fixed inset-0 z-[64] bg-black/70 overflow-y-auto p-4'; document.body.appendChild(el); el.onclick = () => el.classList.add('hidden'); }
        el.innerHTML = `<div class="max-w-[300px] mx-auto my-8 sm:my-16">${deedHTML(i)}<div class="text-center pix text-xs text-muted mt-3">TAP ANYWHERE TO CLOSE</div></div>`;
        el.classList.remove('hidden'); SFX.play('card');
      }
      window.tyDeed = openDeed;
      function netWorth(S, pi) {
        let w = S.cash[pi];
        BOARD.forEach((t, i) => { if (S.own[i] === pi) { w += S.mort[i] ? t.pr / 2 : t.pr; w += (S.houses[i] || 0) * (t.hc || 0) / 2; } });
        return w;
      }
      function canBuild(S, pi, i) {
        const t = BOARD[i]; if (t.k !== 'prop' || S.own[i] !== pi || S.mort[i] || S.houses[i] >= 5) return false;
        // "stand on your plot" rule: one house per visit, on the plot you are standing on, no colour set needed
        if (G && G.landBuild && G.S === S) return G.buildSpot === i && G.cur === pi && S.cash[pi] >= t.hc;
        if (!owns(S, pi, t.g) || GROUPS[t.g].some((x) => S.mort[x])) return false;
        const min = Math.min(...GROUPS[t.g].map((x) => S.houses[x]));
        return S.houses[i] === min && S.cash[pi] >= t.hc;
      }
      // why you can't build on plot i right now, in plain words ('' = you can) (Inna, Nov 2026: "tell them why")
      const GNAME = { br: 'brown', lb: 'light blue', pk: 'pink', or: 'orange', rd: 'red', yl: 'yellow', gn: 'green', bl: 'dark blue' };
      function buildWhy(S, pi, i) {
        const t = BOARD[i]; if (!t || t.k !== 'prop') return 'You can only build houses on coloured properties, not on rails or utilities.';
        if (S.own[i] !== pi) return `You don't own ${t.n}.`;
        if (S.mort[i]) return `${t.n} is mortgaged. Unmortgage it first.`;
        if (S.houses[i] >= 5) return `${t.n} already has a hotel. That's the most you can build.`;
        if (G && G.landBuild && G.S === S) {
          if (G.cur !== pi) return 'You can only build on your own turn.';
          const here = G.players[pi] && G.players[pi].pos;
          if (G.buildSpot === null || G.buildSpot === undefined) return here === i ? `One house per visit: you already built on ${t.n} this turn.` : `Build rule in this game: you build by landing on your own plot. Land on ${t.n} to build a house there.`;
          if (G.buildSpot !== i) return `You're standing on ${BOARD[G.buildSpot].n}, not ${t.n}. You can only build on the plot you landed on.`;
          if (S.cash[pi] < t.hc) return `A house here costs ${money(t.hc)}. You only have ${money(S.cash[pi])}.`;
          return '';
        }
        if (!owns(S, pi, t.g)) { const miss = GROUPS[t.g].filter((x) => S.own[x] !== pi).map((x) => BOARD[x].n); return `You need the whole ${GNAME[t.g] || ''} set to build. Still missing: ${miss.join(', ')}.`; }
        const mg = GROUPS[t.g].filter((x) => S.mort[x]); if (mg.length) return `Unmortgage ${mg.map((x) => BOARD[x].n).join(', ')} first.`;
        const min = Math.min(...GROUPS[t.g].map((x) => S.houses[x]));
        if (S.houses[i] !== min) { const lo = GROUPS[t.g].filter((x) => S.houses[x] === min).map((x) => BOARD[x].n); return `Build evenly: put a house on ${lo.join(' or ')} first.`; }
        if (S.cash[pi] < t.hc) return `A house here costs ${money(t.hc)}. You only have ${money(S.cash[pi])}.`;
        return '';
      }
      function canSell(S, pi, i) {
        const t = BOARD[i]; if (t.k !== 'prop' || S.own[i] !== pi || !(S.houses[i] > 0)) return false;
        if (G && G.landBuild && G.S === S) return true;
        return S.houses[i] === Math.max(...GROUPS[t.g].filter((x) => S.own[x] === pi).map((x) => S.houses[x]));
      }

      /* ---------- setup ---------- */
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1100px] mx-auto');
        setupScreen(body, mod, [
          { key: 'n', label: 'PLAYERS', def: 3, choices: [[2, '2 players'], [3, '3 players'], [4, '4 players']], hint: 'On this device the other seats are computer players. Online, empty seats get computer players.' },
          { key: 'mode', label: 'GAME LENGTH', def: 'quick', choices: [['short', 'Short (15 rounds)'], ['quick', 'Medium (25 rounds)'], ['long', 'Long (40 rounds)'], ['classic', 'Classic (to bankruptcy)']], hint: 'With a round limit, the richest player at the end wins.' },
          { key: 'build', label: 'BUILDING HOUSES', def: 'set', choices: [['set', 'Own the whole colour'], ['land', 'Stand on your plot']], hint: 'Whole colour: build once you own every plot of a colour. Stand on your plot: land on a plot you own to add one house there.' },
          { key: 'clock', label: 'DECISION TIMER', def: 25, choices: [[0, 'Off'], [20, '20 s'], [25, '25 s'], [40, '40 s']] },
          { key: 'cash', label: 'STARTING CASH', def: 1500, choices: [[1000, '$1000'], [1500, '$1500'], [2500, '$2500']] },
          { key: 'auction', label: 'Auctions', toggle: true, def: 1, hint: 'If a player skips a property, everyone can bid on it.', choices: [[1, 'On'], [0, 'Off']] },
          { key: 'buyout', label: 'Buy out land', toggle: true, def: 0, hint: 'After paying rent you may make the owner an offer for that plot; they can accept, refuse or ask for more. Not plots with a hotel, not plots from a full colour set.', choices: [[0, 'Off'], [1, 'On']] },
          { key: 'jack', label: 'Free Parking jackpot', toggle: true, def: 0, hint: 'Taxes and fines pile up on Free Parking. Land there to take it all.', choices: [[0, 'Off'], [1, 'On']] },
        ], (sel) => { const sim = !!window.__tycoonSim; start(body, sel, npLocal([{ bot: sim, name: sim ? 'Sim bot' : profile.username, avatar: profile.avatar }].concat(BN.slice(0, +sel.n - 1).map((b) => ({ bot: true, name: b[0], avatar: b[1] }))), sel)); });
      }
      // seats come from the table (NS): on this device seat 0 is you; online every screen has its own seat (G.me).
      // (G.S is the game's money/property state, G.NS the table.)
      function start(body, sel, NS) {
        const players = NS.seats.map((x, i) => ({ name: x.name, av: x.avatar, col: PCOL[i] }));
        players.forEach((p, i) => { p.i = i; p.pos = 0; p.jail = 0; p.free = 0; p.out = false; p.doubles = 0; });
        G = { NS, me: NS.online ? NS.me : 0, step: 0, uiTok: 0, shown: [], goal: [], arrive: [], flash: [], auctions: sel.auction === undefined ? true : !!+sel.auction, jackpot: !!+sel.jack, pot: 0, players, S: { cash: players.map(() => +sel.cash || 1500), own: {}, houses: {}, mort: {} }, mode: sel.mode, timed: sel.mode !== 'classic', maxRound: ({ short: 15, quick: 25, long: 40 })[sel.mode] || 150, landBuild: sel.build === 'land', buyout: !!+sel.buyout, buildSpot: null, round: 1, cur: 0, secs: +sel.clock, dice: [1, 1], over: false, tok: ++GT.cur, log: [], deckC: NS.rng.shuffle(CHANCE.map((_, i) => i)), deckH: NS.rng.shuffle(CHEST.map((_, i) => i)), rents: 0, boughtN: 0, built: 0, msg: '' };
        BOARD.forEach((t, i) => { if (t.k === 'prop') G.S.houses[i] = 0; });
        G.players.forEach((p) => { G.shown[p.i] = G.goal[p.i] = G.S.cash[p.i]; });
        body.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
          <div class="min-w-0 flex justify-center"><div id="ty-board" class="ty-board"></div></div>
          <div class="space-y-3 min-w-0"><div id="ty-players" class="space-y-2"></div>
            <div class="win overflow-hidden"><div class="winbar amber"><span id="ty-round"></span><span id="ty-status" class="pix text-xs"></span></div><div class="p-3"><div id="ty-clock"></div></div></div>
            <div id="ty-log" class="logbox" style="height:170px"></div><button id="ty-quit" class="btn-game btn-coral w-full py-2 text-sm">${NS.online ? 'Leave table' : 'Give up'}</button></div></div>
          <div id="ty-mine" class="mt-4"></div>`;
        G.clock = makeClock(document.getElementById('ty-clock'));
        NS.track();
        NS.onLeft = (a) => {
          if (!G) return; const q = G.players[a.s]; q.name += ' (CPU)'; q.av = '🤖';
          log(`${nm(q)} ${a.t === '_gone' ? 'disconnected' : 'left'}. A computer player takes the seat.`);
          if (NS.n === 2 && a.s !== G.me && !G.over) { G.tok++; finish(false, a); }
          render();
        };
        npBar('');
        let sure = false;
        document.getElementById('ty-quit').onclick = (e) => { if (NS.online) return npConfirmLeave(() => open(document.getElementById('game-root'))); if (!sure) { sure = true; e.target.textContent = 'Really give up?'; gTimeout(() => { sure = false; e.target.textContent = 'Give up'; }, 3000); return; } if (!G.over) { G.tok++; finish(true); } };
        log(`Everyone starts with <b>$${G.S.cash[0]}</b>. Roll the dice!`);
        render();
        gOn(window, 'resize', () => { if (G && G.tok) render(); });
        // the board fits whatever space it is given, and re-fits whenever that space changes. (The first
        // time the game opens, the page's two-column layout can appear a moment after the board, and a
        // board measured too early came out far too big.)
        if (boardRO) boardRO.disconnect();
        if (window.ResizeObserver) {
          let last = -1;
          boardRO = new ResizeObserver((ents) => { const w = Math.round(ents[0].contentRect.width); if (w !== last && G && $('ty-board')) { last = w; render(); } });
          boardRO.observe($('ty-board').parentElement);
        }
        run().catch((e) => { if (e !== ABORT) throw e; });
      }
      async function W(ms) { const t = G && G.tok; await gSleep(window.__fast ? ms / 6 : ms); if (!G || G.tok !== t) throw ABORT; }
      const log = (t) => { G.log.push(t); const el = document.getElementById('ty-log'); if (el) { el.innerHTML = G.log.slice(-50).map((x) => `<div>${x}</div>`).join(''); el.scrollTop = el.scrollHeight; } };
      const nm = (p) => `<b>${esc(p.name)}</b>`;
      const $ = (id) => document.getElementById(id);
      const money = (n) => '$' + n;
      const alive = () => G.players.filter((p) => !p.out);

      /* ---------- decisions: you tap, the table's host decides for computer seats, online players send theirs ---------- */
      const isMe = (p) => p.i === G.me;
      const mine = (p) => G.NS.mine(p.i);
      const isBot = (p) => G.NS.bot(p.i);
      async function decide(p, kind, ui, botFn, ms) {
        const NS = G.NS, k = ++G.step, t = G.tok;
        if (mine(p)) Promise.resolve(ui()).then((v) => { if (G && G.tok === t && v !== undefined) NS.act({ t: kind, s: p.i, k, v }); });
        const a = await NS.ask(p.i, () => ({ t: kind, k, v: botFn() }), ms, (x) => x.s === p.i && x.t === kind && x.k === k);
        if (!G || G.tok !== t) throw ABORT;
        return a.v;
      }

      /* ---------- main loop ---------- */
      async function run() {
        while (G && !G.over) {
          const p = G.players[G.cur];
          if (!p.out) { await takeTurn(p); if (G.over) return; }
          do { G.cur = (G.cur + 1) % G.players.length; if (G.cur === 0) { G.round++; } } while (G.players[G.cur].out);
          if (alive().length <= 1) return finish(false);
          if (G.round > G.maxRound) return finish(false);
          render();
        }
      }

      async function takeTurn(p) {
        p.doubles = 0; G.buildSpot = null;
        $('ty-status').textContent = mine(p) ? 'YOUR TURN' : p.name.toUpperCase();
        for (;;) {
          render();
          if (!isBot(p)) await manage(p, 'before'); else await botBuild(p);
          if (p.jail > 0) { const left = await jailTurn(p); if (left === 'stay') return; if (p.out) return; }
          const r = await roll(p);
          const dbl = r[0] === r[1];
                    if (dbl) p.doubles++; else p.doubles = 0;
          if (p.doubles >= 3) { log(`${nm(p)} rolled 3 doubles in a row: <b>straight to Jail</b>!`); await sendJail(p); return; }
          await move(p, r[0] + r[1]);
          if (G.over || p.out) return;
          G.buildSpot = null;
          await land(p, r[0] + r[1]);
          if (G.over || p.out) return;
          if (G.landBuild && BOARD[p.pos].k === 'prop' && G.S.own[p.pos] === p.i && !G.S.mort[p.pos] && G.S.houses[p.pos] < 5) { G.buildSpot = p.pos; if (isMe(p)) log(`You are on your own <b>${BOARD[p.pos].n}</b>: you can build a house here.`); }
          if (p.jail > 0) return; // landed in jail
          if (!dbl) break;
          log(`${nm(p)} rolled doubles and goes again.`); await W(400);
        }
        if (!isBot(p)) await manage(p, 'after'); else { await botBuild(p); await W(300); }
      }

      /* ---------- dice ---------- */
      const dieHTML = (v, cls = '') => { const on = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[v]; return `<div class="ty-die ${cls}">${Array.from({ length: 9 }, (_, i) => `<i class="${on.includes(i) ? 'on' : ''}"></i>`).join('')}</div>`; };
      async function roll(p) {
        if (!mine(p)) { $('ty-status').textContent = p.name.toUpperCase() + ' ROLLS'; if (isBot(p)) G.clock.idle(p.name, '🎲'); else if (G.secs) G.clock.start(G.secs + 4, 'Their time', () => {}, 6); else G.clock.idle(p.name, '🎲'); }
        const box = $('ty-dice');
        if (!mine(p)) { if (box) box.classList.add('shake'); SFX.play('dice'); }
        const power = Math.max(0, Math.min(1, +(await decide(p, 'roll', () => shakeAndThrow(), () => 0.3 + Math.random() * 0.6, 1050 + rnd(400))) || 0.5));
        if (box) box.classList.remove('shake');
        G.clock.stop();
        G.dice = [1 + G.NS.rng.rnd(6), 1 + G.NS.rng.rnd(6)];
        const ms = throwDice(power);
        await W(ms + 150);
        setBanner(`${G.dice[0]} + ${G.dice[1]} = ${G.dice[0] + G.dice[1]}${G.dice[0] === G.dice[1] ? '  DOUBLES!' : ''}`);
        log(`${nm(p)} rolls <b>${G.dice[0]} + ${G.dice[1]} = ${G.dice[0] + G.dice[1]}</b>${G.dice[0] === G.dice[1] ? ' (doubles!)' : ''}.`);
        await W(550);
        return G.dice;
      }
      // your roll: press and hold the button (or the dice) to shake, let go to throw.
      // The longer you shake, the harder the throw. A quick tap still throws.
      function shakeAndThrow() {
        return new Promise((res) => {
          let done = false, t0 = 0, tick = null, bar = null;
          setPrompt(`<div class="space-y-1"><div class="font-bold text-sm text-bone">Hold to shake, let go to throw!</div><button id="ty-roll" class="btn-game btn-amber py-2.5 px-10 text-base" style="touch-action:none">🎲 SHAKE &amp; ROLL</button><div class="ty-power mx-auto" style="width:190px"><span id="ty-pw"></span></div></div>`);
          const box = $('ty-dice');
          const start = (e) => {
            if (done || t0) return; if (e) e.preventDefault();
            t0 = performance.now(); if (box) box.classList.add('shake'); SFX.play('dice');
            tick = gInterval(() => { const f = Math.min(1, (performance.now() - t0) / 1100); bar = $('ty-pw'); if (bar) bar.style.width = (f * 100) + '%'; if (Math.random() < 0.5) SFX.play('dice'); }, 120);
          };
          const release = () => {
            if (done || !t0) return; done = true;
            const power = Math.min(1, (performance.now() - t0) / 1100);
            gClearInt(tick); if (box) box.classList.remove('shake');
            G._rebind = null; G.clock.stop(); setPrompt(''); res(power);
          };
          const bind = () => {
            const b = $('ty-roll');
            if (b) { b.onpointerdown = start; b.onclick = () => { if (!t0) { start(); setTimeout(release, 220); } }; b.onkeydown = (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); }; b.onkeyup = (e) => { if (e.key === ' ' || e.key === 'Enter') release(); }; }
            if (box) box.onpointerdown = start;
          };
          gOn(window, 'pointerup', release); gOn(window, 'pointercancel', release);
          G._rebind = bind; bind();
          if (G.secs) G.clock.start(G.secs, 'Your time', () => { if (!done) { start(); setTimeout(release, 300); } }, 6); else G.clock.idle('No timer', '🎲');
        });
      }
      // ask the human a question: html + {buttonId: value}; timeout resolves to defVal
      function ask(html, map, label, defVal) {
        return new Promise((res) => {
          let done = false;
          const fin = (v) => { if (done) return; done = true; G._rebind = null; G.clock.stop(); setPrompt(''); res(v); };
          setPrompt(`<div class="space-y-2">${label ? `<div class="font-bold text-sm text-bone">${label}</div>` : ''}<div class="flex gap-2 justify-center flex-wrap">${html}</div></div>`);
          const bind = () => { for (const id in map) { const el = $(id); if (el) el.onclick = () => fin(map[id]); } };
          G._rebind = bind; bind();
          if (G.secs) G.clock.start(G.secs, 'Your time', () => { if (!done) { showToast("Time's up!", 'error'); fin(defVal); } }, 6); else G.clock.idle('No timer', '∞');
        });
      }
      const setPrompt = (h) => { G.prompt = h; const el = $('ty-prompt'); if (el) el.innerHTML = h; };

      /* ---------- movement ---------- */
      async function move(p, steps) {
        for (let k = 0; k < steps; k++) {
          p.pos = (p.pos + 1) % 40;
          if (p.pos === 0) { moneyFlow('start', p.i, 200); G.S.cash[p.i] += 200; SFX.play('coin'); log(`${nm(p)} passes START: <b>+$200</b>.`); }
          render(p); SFX.play('click'); await W(steps > 8 ? 230 : 270);
        }
        await W(200);
      }
      async function moveTo(p, to) { const steps = (to - p.pos + 40) % 40; await move(p, steps); }
      async function sendJail(p) {
        // the pawn is carried straight across the board to the Jail square
        const el = $('ty-pawn-' + p.i); if (el) el.classList.add('warp');
        p.pos = 10; p.jail = 3; p.doubles = 0; SFX.play('crash'); render(); await W(1000);
        if (el) el.classList.remove('warp');
      }
      async function jailTurn(p) {
        // returns 'stay' when the turn is over (still jailed), 'go' to continue with a roll
        log(`${nm(p)} is in Jail (turn ${4 - p.jail} of 3).`);
        let choice = await decide(p, 'jail', () => {
          const opts = [`<button id="jl-roll" class="btn-game btn-amber py-2 px-4">🎲 Roll for doubles</button>`];
          if (G.S.cash[p.i] >= 50) opts.push(`<button id="jl-pay" class="btn-game btn-teal py-2 px-4">Pay $50</button>`);
          if (p.free > 0) opts.push(`<button id="jl-card" class="btn-game btn-graphite py-2 px-4">Use Free card</button>`);
          return ask(opts.join(''), { 'jl-roll': 'roll', 'jl-pay': 'pay', 'jl-card': 'card' }, 'You are in Jail', 'roll');
        }, () => (p.free > 0 ? 'card' : (G.S.cash[p.i] > 450 && G.round < 18 ? 'pay' : 'roll')), 500);
        if (choice === 'card' && !(p.free > 0)) choice = 'roll';
        if (choice === 'pay' && G.S.cash[p.i] < 50) choice = 'roll';
        if (choice === 'card') { p.free--; p.jail = 0; log(`${nm(p)} uses a Get Out of Jail Free card.`); return 'go'; }
        if (choice === 'pay') { await charge(p, 50, null, 'bail'); p.jail = 0; log(`${nm(p)} pays $50 bail.`); return p.out ? 'stay' : 'go'; }
        // roll for doubles
        const r = await roll(p);
        if (r[0] === r[1]) { p.jail = 0; log(`${nm(p)} rolled doubles and leaves Jail!`); await move(p, r[0] + r[1]); await land(p, r[0] + r[1]); return 'stay'; }
        p.jail--;
        if (p.jail === 0) { log(`${nm(p)} must pay $50 and leaves Jail.`); await charge(p, 50, null, 'bail'); if (!p.out) { await move(p, r[0] + r[1]); await land(p, r[0] + r[1]); } return 'stay'; }
        await W(400); return 'stay';
      }

      /* ---------- money ---------- */
      // take money from p (to a player or the bank). Auto-liquidates if short. Returns false when bankrupt.
      async function charge(p, amt, to, why) {
        const S = G.S;
        if (S.cash[p.i] < amt) await liquidate(p, amt);
        if (S.cash[p.i] >= amt) { moneyFlow(p.i, to ? to.i : G.jackpot ? 'pot' : 'bank', amt); S.cash[p.i] -= amt; if (to) S.cash[to.i] += amt; else if (G.jackpot) G.pot += amt; render(); return true; }
        // bankrupt
        const pay = Math.max(0, S.cash[p.i]); if (pay) moneyFlow(p.i, to ? to.i : 'bank', pay); S.cash[p.i] = 0; if (to) S.cash[to.i] += pay;
        log(`💥 ${nm(p)} is <b>BANKRUPT</b>${to ? ' and hands everything to ' + nm(to) : ''}!`); SFX.play('crash');
        BOARD.forEach((t, i) => { if (S.own[i] === p.i) { if (to) { S.own[i] = to.i; } else { delete S.own[i]; S.mort[i] = false; } if (t.k === 'prop') S.houses[i] = 0; if (!to) S.mort[i] = false; } });
        if (to) to.free += p.free; p.free = 0;
        p.out = true; render(); await W(900);
        return false;
      }
      async function liquidate(p, need) {
        const S = G.S, cash0 = S.cash[p.i];
        let sold = 0;
        // sell houses first (most expensive first), then mortgage
        while (S.cash[p.i] < need) {
          const cand = BOARD.filter((t) => canSell(S, p.i, t.i)).sort((a, b) => b.hc - a.hc)[0];
          if (!cand) break;
          S.houses[cand.i]--; S.cash[p.i] += cand.hc / 2; sold++;
        }
        let mortg = 0;
        while (S.cash[p.i] < need) {
          const cand = BOARD.filter((t) => S.own[t.i] === p.i && !S.mort[t.i] && !(S.houses[t.i] > 0)).sort((a, b) => a.pr - b.pr)[0];
          if (!cand) break;
          S.mort[cand.i] = true; S.cash[p.i] += cand.pr / 2; mortg++;
        }
        if (sold || mortg) { moneyFlow('bank', p.i, S.cash[p.i] - cash0); render(); log(`${nm(p)} raised cash${sold ? `: sold ${sold} house${sold > 1 ? 's' : ''}` : ''}${mortg ? `, mortgaged ${mortg} propert${mortg > 1 ? 'ies' : 'y'}` : ''}.`); SFX.play('coin'); }
      }

      /* ---------- landing ---------- */
      async function land(p, dice) {
        const S = G.S, t = BOARD[p.pos];
        render();
        if (t.k === 'prop' || t.k === 'rail' || t.k === 'util') {
          const o = S.own[t.i];
          if (o === undefined) return await offer(p, t);
          if (o === p.i) { log(`${nm(p)} lands on their own ${t.n}.`); return; }
          if (S.mort[t.i]) { log(`${t.n} is mortgaged. No rent!`); return; }
          const rent = rentFor(S, t.i, dice);
          const owner = G.players[o];
          log(`${nm(p)} pays <b>${money(rent)}</b> rent to ${nm(owner)} for ${t.n}.`); SFX.play('chip'); 
          if (isMe(owner)) G.rentIn = (G.rentIn || 0) + rent;
          setBanner(`${p.name} pays $${rent} rent to ${owner.name}`);
          const paid = await charge(p, rent, owner, 'rent'); await W(1000);
          if (paid && G.buyout && !G.over && !p.out) await buyout(p, t, owner);
          return;
        }
        if (t.k === 'tax') { log(`${nm(p)} pays <b>${money(t.pay)}</b> ${t.n.toLowerCase()}.`); SFX.play('chip'); await charge(p, t.pay, null, 'tax'); await W(500); return; }
        if (t.k === 'gojail') { log(`${nm(p)} goes to <b>Jail</b>!`); await sendJail(p); return; }
        if (t.k === 'chance' || t.k === 'chest') return await drawCard(p, t.k);
        if (t.k === 'park') {
          if (G.jackpot && G.pot > 0) { const won = G.pot; G.pot = 0; moneyFlow('pot', p.i, won); S.cash[p.i] += won; SFX.play('win'); log(`💰 ${nm(p)} hits the <b>Free Parking jackpot: ${money(won)}</b>!`); setBanner(`${p.name} wins the ${money(won)} jackpot!`); render(); await W(1100); }
          else { log(`${nm(p)} rests at Free Parking.`); await W(300); }
        }
      }
      const setBanner = (t) => { G.msg = t; const el = $('ty-msg'); if (el) el.textContent = t; };

      /* ---------- buy out (setting): after paying rent, make the owner an offer for that plot ----------
         Nov 2026 (Inna: "allow negotiation instead of double price"): the player offers any amount from what the plot is
         worth (land + its houses) up to their cash; the owner accepts, says no, or names a higher price; then the buyer
         accepts that price or walks away. One round of haggling, every step is a table decision. */
      const plotWorth = (S, i) => { const t = BOARD[i]; return t.pr + (t.k === 'prop' ? (S.houses[i] || 0) * t.hc : 0); };
      const buyoutPrice = plotWorth;          // the lowest offer you may make
      function canBuyout(S, pi, i) {
        const t = BOARD[i], o = S.own[i];
        if (!['prop', 'rail', 'util'].includes(t.k) || o === undefined || o === pi || S.mort[i]) return false;
        if (t.k === 'prop' && S.houses[i] >= 5) return false;                 // no plots with a hotel
        if (owns(S, o, t.k === 'prop' ? t.g : t.k === 'rail' ? 'rail' : 'ut')) return false;   // no plots from a full set
        return S.cash[pi] >= plotWorth(S, i);
      }
      const grpOf = (t) => (t.k === 'prop' ? t.g : t.k === 'rail' ? 'rail' : 'ut');
      // what a computer player thinks the plot is worth to it, as a buyer (max it pays) or as the owner (min it takes)
      function botMax(S, pi, i) {
        const t = BOARD[i], others = GROUPS[grpOf(t)].filter((x) => x !== i), w = plotWorth(S, i);
        const helps = others.some((x) => S.own[x] === pi) || others.every((x) => S.own[x] === undefined || S.own[x] === pi);
        const reserve = G.timed ? 250 : 400, room = S.cash[pi] - reserve;
        return Math.max(0, Math.min(room, Math.round(w * (helps ? 2.4 : 1.5))));
      }
      function botMin(S, oi, i) {
        const t = BOARD[i], others = GROUPS[grpOf(t)].filter((x) => x !== i), w = plotWorth(S, i);
        const mine = others.filter((x) => S.own[x] === oi).length;
        return Math.round(w * (mine ? 2.6 + mine * 0.4 : 1.6) / 10) * 10;
      }
      const r10 = (n) => Math.round(n / 10) * 10;
      // a price picker: − / + buttons round the amount, plus the two choices (Make offer / Counter...) and "No"
      function priceAsk(label, lo, hi, start, goLabel, noLabel, extra) {
        return new Promise((res) => {
          let v = Math.max(lo, Math.min(hi, start)), done = false;
          const fin = (x) => { if (done) return; done = true; G._rebind = null; G.clock.stop(); setPrompt(''); res(x); };
          const paint = () => {
            setPrompt(`<div class="space-y-2"><div class="font-bold text-sm text-bone">${label}</div>
              <div class="ty-haggle"><button class="btn-game btn-graphite" data-d="-50">−50</button><button class="btn-game btn-graphite" data-d="-10">−10</button><b id="ty-offer">${money(v)}</b><button class="btn-game btn-graphite" data-d="10">+10</button><button class="btn-game btn-graphite" data-d="50">+50</button></div>
              <div class="flex gap-2 justify-center flex-wrap">${extra || ''}<button id="hg-go" class="btn-game btn-amber py-2 px-6">${goLabel} ${money(v)}</button><button id="hg-no" class="btn-game btn-graphite py-2 px-5">${noLabel}</button></div>
              <div class="text-xs text-muted">From ${money(lo)} to ${money(hi)}</div></div>`);
            bind();
          };
          const bind = () => {
            document.querySelectorAll('#ty-prompt [data-d]').forEach((b) => { b.onclick = () => { v = Math.max(lo, Math.min(hi, v + +b.dataset.d)); paint(); }; });
            const go = $('hg-go'), no = $('hg-no'), yes = $('hg-yes');
            if (go) go.onclick = () => fin({ v }); if (no) no.onclick = () => fin(false); if (yes) yes.onclick = () => fin({ accept: true });
          };
          G._rebind = paint; paint();
          if (G.secs) G.clock.start(G.secs, 'Your time', () => { if (!done) { showToast("Time's up!", 'error'); fin(false); } }, 6); else G.clock.idle('No timer', '∞');
        });
      }
      async function buyout(p, t, owner) {
        const S = G.S, i = t.i;
        if (!canBuyout(S, p.i, i)) return;
        const worth = plotWorth(S, i), h = t.k === 'prop' ? S.houses[i] : 0;
        const what = `${t.n}${h ? ` with ${h} house${h > 1 ? 's' : ''}` : ''}`;
        // 1. the buyer makes an offer (or not)
        if (!mine(p)) setBanner(`${p.name} is thinking about making an offer for ${t.n}...`);
        const off = await decide(p, 'bo', () => {
          setBanner('');
          return priceAsk(`Make ${owner.name} an offer for ${what}? It's worth ${money(worth)}. You have ${money(S.cash[p.i])}. <button class="ty-cardlink" onclick="tyDeed(${i})">📄 See the card</button>`,
            worth, S.cash[p.i], r10(worth * 1.5), 'Offer', 'No thanks');
        }, () => { const m = botMax(S, p.i, i); return m >= worth ? { v: Math.max(worth, r10(m * 0.7)) } : false; }, 1000);
        if (!off || !G || G.over || !canBuyout(S, p.i, i)) { if (!off) log(`${nm(p)} decides not to make an offer for ${t.n}.`); return; }
        let price = Math.max(worth, Math.min(S.cash[p.i], Math.round(+off.v) || worth));
        log(`💬 ${nm(p)} offers ${nm(owner)} <b>${money(price)}</b> for <b>${t.n}</b>.`);
        // 2. the owner accepts, says no, or names a higher price
        if (!mine(owner)) setBanner(`${p.name} offers ${owner.name} ${money(price)} for ${t.n}. Waiting for ${owner.name}...`);
        const ans = await decide(owner, 'bo2', () => {
          setBanner('');
          return priceAsk(`${p.name} offers you <b class="text-amber">${money(price)}</b> for your ${what} (worth ${money(worth)}). Sell, or ask for more?`,
            Math.min(price + 10, S.cash[p.i]), S.cash[p.i], r10(price * 1.3), 'Ask for', 'No, keep it', `<button id="hg-yes" class="btn-game btn-emerald py-2 px-6">Sell for ${money(price)}</button>`);
        }, () => { const want = botMin(S, owner.i, i); return price >= want ? { accept: true } : want <= S.cash[p.i] ? { v: want } : false; }, 1200);
        if (!G || G.over) return;
        if (!ans) { log(`${nm(owner)} won't sell ${t.n}.`); setBanner(`${owner.name} won't sell ${t.n}.`); await W(900); return; }
        if (!ans.accept) {
          const ask2 = Math.max(price + 10, Math.min(S.cash[p.i], Math.round(+ans.v) || price));
          log(`💬 ${nm(owner)} asks for <b>${money(ask2)}</b> instead.`);
          // 3. the buyer takes the higher price or walks away
          if (!mine(p)) setBanner(`${owner.name} asks ${p.name} for ${money(ask2)}...`);
          const ok = await decide(p, 'bo3', () => {
            setBanner('');
            return ask(`<button id="bo-yes" class="btn-game btn-amber py-2 px-6">Pay ${money(ask2)}</button><button id="bo-no" class="btn-game btn-graphite py-2 px-6">No deal</button>`, { 'bo-yes': true, 'bo-no': false },
              `${owner.name} wants ${money(ask2)} for ${t.n} (you offered ${money(price)}). You have ${money(S.cash[p.i])}.`, false);
          }, () => ask2 <= botMax(S, p.i, i), 1000);
          if (!ok || !G || G.over || S.cash[p.i] < ask2) { log(`${nm(p)} says no deal.`); setBanner(`No deal for ${t.n}.`); await W(700); return; }
          price = ask2;
        }
        if (!canBuyout(S, p.i, i) || S.cash[p.i] < price) return;
        moneyFlow(p.i, owner.i, price); S.cash[p.i] -= price; S.cash[owner.i] += price; S.own[i] = p.i;
        G.claimed = i; log(`🤝 ${nm(p)} buys <b>${what}</b> from ${nm(owner)} for <b>${money(price)}</b>.`); setBanner(`${p.name} buys ${t.n} from ${owner.name} for ${money(price)}`);
        SFX.play('coin'); if (isMe(p)) G.boughtN++; render(); G.claimed = null; await W(900);
      }

      async function offer(p, t) {
        const S = G.S, cash = S.cash[p.i];
        if (!mine(p)) setBanner(`${p.name} is deciding on ${t.n}...`);
        let buy = await decide(p, 'buy', () => {
          const canAfford = cash >= t.pr;
          setBanner('');
          return ask(`<button class="ty-cardlink" onclick="tyDeed(${t.i})">📄 See the ${esc(t.n)} card: rents & building costs</button>${canAfford ? `<button id="by-yes" class="btn-game btn-amber py-2 px-6">Buy for ${money(t.pr)}</button>` : ''}<button id="by-no" class="btn-game btn-graphite py-2 px-6">${canAfford ? 'Skip' : 'Can\'t afford'}</button>`, { 'by-yes': true, 'by-no': false }, `${t.n} is for sale (${money(t.pr)}). You have ${money(cash)}.`, false);
        }, () => {
          const groupMine = t.g && GROUPS[t.g].filter((x) => S.own[x] === p.i).length;
          const needs = t.g && GROUPS[t.g].length - groupMine === 1 && GROUPS[t.g].every((x) => S.own[x] === p.i || S.own[x] === undefined);
          const rivalBlocks = t.g && GROUPS[t.g].some((x) => S.own[x] !== undefined && S.own[x] !== p.i);
          const reserve = G.timed ? 60 : 130;
          return cash >= t.pr && (needs || t.k === 'rail' || cash - t.pr >= reserve + (rivalBlocks ? 40 : 0));
        }, 900);
        if (buy && cash >= t.pr) { moneyFlow(p.i, 'tile:' + t.i, t.pr); S.cash[p.i] -= t.pr; S.own[t.i] = p.i; G.claimed = t.i; log(`${nm(p)} buys <b>${t.n}</b> for ${money(t.pr)}.`); SFX.play('coin'); if (isMe(p)) G.boughtN++; render(); G.claimed = null; await W(700); }
        else { log(`${nm(p)} passes on ${t.n}.`); if (G.auctions && !G.over) await auction(p, t); }
      }

      /* ---------- auction: a skipped property goes to the highest bidder ---------- */
      // what a bot is willing to pay: more if it completes or extends a colour set, less when cash is tight
      function botValue(q, t) {
        const S = G.S;
        let v = t.pr * (0.6 + ((q.i * 37) % 10) / 40);
        if (t.g && GROUPS[t.g]) {
          const mine = GROUPS[t.g].filter((x) => S.own[x] === q.i).length, open = GROUPS[t.g].filter((x) => S.own[x] === undefined).length;
          if (mine && mine + open === GROUPS[t.g].length) v += t.pr * (open === 1 ? 0.9 : 0.45);
          if (t.k === 'rail') v += t.pr * 0.15 * GROUPS.rail.filter((x) => S.own[x] === q.i).length;
        }
        const reserve = G.timed ? 60 : 130;
        return Math.max(0, Math.min(Math.round(v / 5) * 5, S.cash[q.i] - reserve));
      }
      async function auction(starter, t) {
        const S = G.S;
        let high = 0, leader = null;
        const start = G.players.indexOf(starter);
        const order = [...G.players.slice(start + 1), ...G.players.slice(0, start + 1)].filter((q) => !q.out);
        let active = order.filter((q) => S.cash[q.i] >= 10);
        if (!active.length) return;
        log(`🔨 <b>${t.n}</b> goes to auction!`); SFX.play('reveal');
        const panel = (who, extra) => `<div class="ty-auc"><div class="pix text-sm text-amber">🔨 AUCTION · ${esc(t.n.toUpperCase())}</div>
          <div class="text-xs text-muted">List price ${money(t.pr)}</div>
          <div class="pix text-2xl text-bone my-1">${high ? money(high) : 'NO BIDS'}</div>
          <div class="text-xs ${leader ? 'text-emerald' : 'text-muted'}">${leader ? 'Highest: ' + esc(leader.name) : 'Opening bid $10'}</div>
          <div class="text-xs text-muted mt-1">${who}</div>${extra || ''}</div>`;
        let guard = 0;
        while (guard++ < 300 && !G.over) {
          active = active.filter((q) => !q.out && S.cash[q.i] >= high + 10);
          if (!active.length || (active.length === 1 && active[0] === leader)) break;
          for (const q of [...active]) {
            if (G.over) return;
            if (q === leader) continue;
            if (active.length === 1 && active[0] === leader) break;
            if (S.cash[q.i] < high + 10) { active = active.filter((x) => x !== q); continue; }
            let bid = 0;
            if (!mine(q)) { setPrompt(panel(`${esc(q.name)} is thinking…`)); if (isBot(q)) G.clock.idle(q.name, '🔨'); }
            const steps = [10, 50, 100].filter((d) => high + d <= S.cash[q.i]);
            const pickV = await decide(q, 'bid', () => ask(panel('Your bid. You have ' + money(S.cash[q.i]) + '.', `<div class="flex gap-2 justify-center flex-wrap mt-2">${steps.map((d) => `<button id="au-${d}" class="btn-game btn-amber py-1.5 px-3 text-sm">+${d} → ${money(high + d)}</button>`).join('')}<button id="au-pass" class="btn-game btn-graphite py-1.5 px-4 text-sm">Pass</button></div>`),
                Object.assign({ 'au-pass': 0 }, ...steps.map((d) => ({ ['au-' + d]: d }))), '', 0), () => {
              const max = botValue(q, t);
              // open strong, then raise in jumps that shrink as the price nears what the property is worth
              if (high + 10 <= max) { const gap = max - high; const step = high === 0 ? Math.max(10, Math.round(t.pr * (0.3 + Math.random() * 0.2) / 10) * 10) : Math.max(10, Math.round(gap * (0.2 + Math.random() * 0.3) / 10) * 10); return Math.min(max, high + step) - high; }
              return 0;
            }, 550 + rnd(350));
            bid = pickV > 0 && high + pickV <= S.cash[q.i] ? high + Math.floor(pickV) : 0;
            if (bid > high) { high = bid; leader = q; SFX.play('chip'); log(`${nm(q)} bids ${money(bid)}.`); }
            else { active = active.filter((x) => x !== q); log(`${nm(q)} drops out.`); }
            setPrompt(panel(leader ? `${esc(leader.name)} leads` : 'Waiting for a bid'));
            if (!mine(q)) await W(350);
          }
        }
        setPrompt('');
        if (G.over) return;
        if (leader && high > 0 && S.cash[leader.i] >= high) {
          moneyFlow(leader.i, 'tile:' + t.i, high); S.cash[leader.i] -= high; S.own[t.i] = leader.i; G.claimed = t.i;
          if (isMe(leader)) G.boughtN++;
          log(`🔨 Sold! ${nm(leader)} wins <b>${t.n}</b> for ${money(high)}.`); setBanner(`SOLD to ${leader.name} for ${money(high)}`); SFX.play('coin');
          render(); G.claimed = null; await W(1100);
        } else { log(`Nobody bid on ${t.n}. It stays for sale.`); await W(500); }
      }

      async function drawCard(p, kind) {
        const S = G.S, deck = kind === 'chance' ? G.deckC : G.deckH, src = kind === 'chance' ? CHANCE : CHEST;
        const idx = deck.shift(); deck.push(idx); const c = src[idx];
        SFX.play('card'); log(`${kind === 'chance' ? '❓' : '📦'} ${nm(p)} draws: <i>${c.t}</i>`); setBanner('');
        await W(showCard(kind, c.t));
        await decide(p, 'ok', () => ask(`<button id="cd-ok" class="btn-game btn-amber py-2 px-8">OK</button>`, { 'cd-ok': 1 }, '', 1), () => 1, 1900);
        hideCard();
        switch (c.a) {
          case 'move': await moveTo(p, c.to); await land(p, G.dice[0] + G.dice[1]); break;
          case 'gain': moneyFlow('bank', p.i, c.n); S.cash[p.i] += c.n; SFX.play('coin'); break;
          case 'pay': await charge(p, c.n, null, 'card'); break;
          case 'back3': for (let k = 0; k < 3; k++) { p.pos = (p.pos + 39) % 40; render(p); SFX.play('click'); await W(270); } await W(200); await land(p, G.dice[0] + G.dice[1]); break;
          case 'jail': await sendJail(p); break;
          case 'free': p.free++; break;
          case 'rail': { const rails = GROUPS.rail; let to = rails.find((x) => x > p.pos); if (to === undefined) to = rails[0]; await moveTo(p, to); const o = S.own[to]; if (o === undefined) await offer(p, BOARD[to]); else if (o !== p.i && !S.mort[to]) { const rent = rentFor(S, to, 0) * 2; log(`${nm(p)} pays double rent: <b>${money(rent)}</b>.`); await charge(p, rent, G.players[o], 'rent'); } break; }
          case 'repairs': { let h = 0, ht = 0; BOARD.forEach((t, i) => { if (S.own[i] === p.i && t.k === 'prop') { if (S.houses[i] === 5) ht++; else h += S.houses[i]; } }); const cost = h * c.h + ht * c.ht; if (cost) { log(`${nm(p)} pays ${money(cost)} in repairs.`); await charge(p, cost, null, 'repairs'); } break; }
          case 'each': for (const q of alive()) { if (q !== p) { if (q.out) continue; await charge(q, c.n, p, 'gift'); if (p.out) break; } } break;
        }
        render();
      }

      /* ---------- building (human panel + bot logic) ---------- */
      async function botBuild(p) {
        const S = G.S; let guard = 0;
        // unmortgage when rich
        for (const t of BOARD) if (S.own[t.i] === p.i && S.mort[t.i] && S.cash[p.i] > t.pr * 0.55 + 500) { moneyFlow(p.i, 'tile:' + t.i, Math.round(t.pr * 0.55)); S.cash[p.i] -= Math.round(t.pr * 0.55); S.mort[t.i] = false; log(`${nm(p)} unmortgages ${t.n}.`); }
        while (guard++ < 12) {
          const reserve = G.timed ? 120 : 250;
          const cand = BOARD.filter((t) => canBuild(S, p.i, t.i) && S.cash[p.i] - t.hc >= reserve).sort((a, b) => b.pr - a.pr)[0];
          if (!cand) break;
          moneyFlow(p.i, 'tile:' + cand.i, cand.hc); S.cash[p.i] -= cand.hc; S.houses[cand.i]++; if (G.landBuild) G.buildSpot = null; log(`${nm(p)} builds on <b>${cand.n}</b> (${S.houses[cand.i] === 5 ? 'hotel' : S.houses[cand.i] + ' house' + (S.houses[cand.i] > 1 ? 's' : '')}).`); SFX.play('coin'); render(); await W(350);
        }
      }
      async function manage(p, when) {
        // before rolling: optional panel. after the turn: panel + End turn button. Every build / sell / mortgage
        // is a decision of its own, so the whole table sees it.
        for (;;) {
          const S = G.S;
          const mineBuild = BOARD.some((t) => canBuild(S, p.i, t.i) || canSell(S, p.i, t.i) || (S.own[t.i] === p.i && S.mort[t.i]));
          if (when === 'before' && !mineBuild) return;
          // after the roll the button shows whenever you own something, so you can try (and be told why not) (Nov 2026)
          const showPanel = mineBuild || (when !== 'before' && BOARD.some((t) => S.own[t.i] === p.i));
          if (!mine(p)) setBanner(when === 'before' ? `${p.name} is getting ready...` : `${p.name} is finishing the turn...`);
          const v = await decide(p, 'mg', () => manageUI(p, when, showPanel), () => 'go', 300);
          if (v && typeof v === 'object' && v.kind) { panelAct(p, v.kind, +v.i); continue; }
          if (mine(p)) { G.panelOpen = false; renderMine(); }
          return;
        }
      }
      // your side of a build decision: the buttons (and the property panel). Resolves with 'go' or {kind, i}.
      function manageUI(p, when, mineBuild) {
        const tk = ++G.uiTok;
        return new Promise((res) => {
          G.mgRes = (v) => { if (tk !== G.uiTok) return; G.uiTok++; G.mgRes = null; G.clock.stop(); setPrompt(''); res(v); };
          ask(`${mineBuild ? '<button id="mg-open" class="btn-game btn-teal py-2 px-5">🏠 Build / Mortgage</button>' : ''}<button id="mg-go" class="btn-game btn-amber py-2 px-6">${when === 'before' ? 'Continue' : 'End turn'}</button>`, { 'mg-open': 'open', 'mg-go': 'go' }, when === 'before' ? 'Before you roll...' : `Your cash: ${money(G.S.cash[p.i])}`, 'go').then((c) => {
            if (tk !== G.uiTok) return;
            if (c === 'open') { G.panelOpen = true; renderMine(); G.uiTok++; manageUI(p, when, mineBuild).then(res); }
            else { G.panelOpen = false; renderMine(); G.uiTok++; G.mgRes = null; res('go'); }
          });
        });
      }
      function panelAct(p, kind, i) {
        const S = G.S, pi = p.i, t = BOARD[i], me = isMe(p), who = me ? 'You' : nm(p);
        if (!t) return;
        if (kind === 'build' && canBuild(S, pi, i)) { moneyFlow(pi, 'tile:' + i, t.hc); S.cash[pi] -= t.hc; S.houses[i]++; if (G.landBuild) G.buildSpot = null; if (me) G.built++; SFX.play('coin'); log(`${who} build${me ? '' : 's'} on <b>${t.n}</b>.`); }
        else if (kind === 'sell' && canSell(S, pi, i)) { moneyFlow('tile:' + i, pi, t.hc / 2); S.cash[pi] += t.hc / 2; S.houses[i]--; SFX.play('coin'); log(`${who} sell${me ? '' : 's'} a house on <b>${t.n}</b>.`); }
        else if (kind === 'mort' && S.own[i] === pi && !S.mort[i] && !(S.houses[i] > 0)) { moneyFlow('bank', pi, t.pr / 2); S.mort[i] = true; S.cash[pi] += t.pr / 2; SFX.play('coin'); log(`${who} mortgage${me ? '' : 's'} <b>${t.n}</b> for ${money(t.pr / 2)}.`); }
        else if (kind === 'unmort' && S.own[i] === pi && S.mort[i] && S.cash[pi] >= Math.round(t.pr * 0.55)) { moneyFlow(pi, 'bank', Math.round(t.pr * 0.55)); S.cash[pi] -= Math.round(t.pr * 0.55); S.mort[i] = false; SFX.play('coin'); log(`${who} unmortgage${me ? '' : 's'} <b>${t.n}</b>.`); }
        else if (me) { SFX.play('wrong'); showToast(kind === 'build' ? (buildWhy(S, pi, i) || 'You can\'t build there right now.') : 'Cannot do that.', 'error'); }
        render();
      }
      // a button on your property panel: it becomes your decision (only while you are deciding)
      function panelClick(kind, i) {
        const S = G.S, me = G.players[G.me], t = BOARD[i];
        const ok = (kind === 'build' && canBuild(S, me.i, i)) || (kind === 'sell' && canSell(S, me.i, i)) || (kind === 'mort' && S.own[i] === me.i && !S.mort[i] && !(S.houses[i] > 0)) || (kind === 'unmort' && S.own[i] === me.i && S.mort[i] && S.cash[me.i] >= Math.round(t.pr * 0.55));
        if (!ok) { SFX.play('wrong'); return showToast(kind === 'build' ? (buildWhy(S, me.i, i) || 'You can\'t build there right now.') : kind === 'sell' ? 'Nothing to sell there (or sell evenly: start with the plot that has the most houses).' : kind === 'mort' ? 'Sell the houses on this colour first, then you can mortgage it.' : 'You need more cash to unmortgage it.', 'error'); }
        if (G.mgRes) G.mgRes({ kind, i });
      }

      /* ---------- ending ---------- */
      async function finish(gaveUp, left) {
        if (G.over) return;
        G.over = true; G.NS.over = true; G.clock.stop(); setPrompt('');
        const S = G.S, me = G.me, tok = G.tok;
        const ranks = G.players.map((p) => ({ p, w: p.out ? -1 : netWorth(S, p.i) })).sort((a, b) => b.w - a.w);
        const place = left ? 1 : ranks.findIndex((r) => r.p.i === me) + 1;
        const n = G.players.length, lvl = n - 2;
        const won = !gaveUp && place === 1;
        const elo = G.NS.online ? 0 : won ? [8, 12, 16][lvl] : place === 2 && n > 2 && !gaveUp ? 1 : [-3, -5, -7][lvl];
        const eloRow = G.NS.online ? await G.NS.finish(won ? 'win' : 'loss') : null;
        if (!G || G.tok !== tok) return;
        const s = gstat('tycoon'); s.bestWorth = Math.max(s.bestWorth || 0, S.cash[me] ? netWorth(S, me) : 0); s.houses = (s.houses || 0) + G.built; s.props = (s.props || 0) + G.boughtN;
        reportGame('tycoon', won ? 'win' : 'loss', { elo, xp: won ? 35 + lvl * 10 : 12, label: gaveUp ? 'Gave up' : `${G.NS.online ? 'Online · ' : ''}Finished ${['1st', '2nd', '3rd', '4th'][place - 1]} of ${n}` });
        SFX.play(won ? 'win' : 'lose'); render();
        const rows = ranks.map((r, i) => [`${i + 1}. ${r.p.name}`, r.p.out ? 'Bankrupt' : money(r.w), r.p.i === me ? 'text-amber' : 'text-bone']).concat(eloRow ? [eloRow] : []);
        gTimeout(() => gameResult({ title: won ? 'You are the Tycoon!' : gaveUp ? 'You gave up' : `You finished ${['1st', '2nd', '3rd', '4th'][place - 1]}`, sub: won ? 'Richest player at the table.' : 'Net worth = cash + properties + buildings.', tone: won ? 'amber' : 'coral', sprite: won ? 'trophy' : 'anchor', rows: [...rows, ['Elo', (elo > 0 ? '+' : '') + elo, elo >= 0 ? 'text-emerald' : 'text-coral']], againLabel: 'New game', again: () => open($('game-root')) }), 800);
      }

      /* ---------- drawing ---------- */
      // hand-drawn pixel art for the squares: each picture is a little grid of coloured dots
      const PXC = { k: '#050E18', w: '#F7F4EC', r: '#EF4444', b: '#3B82F6', g: '#22C55E', d: '#15803D', y: '#FACC15', o: '#FB923C', t: '#8B5A2B', p: '#F9A8D4', m: '#DB2777', s: '#F5DEB3', n: '#94A3B8', a: '#F5B041', l: '#7DD3FC', e: '#475569' };
      function pix(rows) {
        const w = Math.max(...rows.map((r) => r.length)); let o = '';
        rows.forEach((row, y) => { let x = 0; while (x < row.length) { const c = row[x]; let n = 1; while (row[x + n] === c) n++; if (c !== '.') o += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${PXC[c]}"/>`; x += n; } });
        return `<svg viewBox="0 0 ${w} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${o}</svg>`;
      }
      const ART = {
        br: pix(['....yy....', '...kkkk...', '...kwwk...', '...kkkk...', '...krrk...', '...kwwk...', '..krrrrk..', '..kwwwwk..', '.kkrrrrkk.', 'bbbbbbbbbb', 'lblblblblb']),
        lb: pix(['...oooo...', '..oorooo..', '.ooooooro.', '.orooooo..', '..oooroo..', '...oooo...', '....tt....', '....tt....', '...tttt...', 'gggggggggg']),
        pk: pix(['...pppp...', '..ppwpmp..', '.pmppppwp.', '.ppppmppp.', '..pwpppm..', '...pppp...', '....tt....', '....tt....', '...tttt...', 'gggggggggg']),
        or: pix(['..........', '.rwrwrwrw.', 'rwrwrwrwrw', 'kkkkkkkkkk', '.k......k.', '.k.oo.yy.k', '.kkkkkkkkk', '.k......k.', '.k......k.', 'eeeeeeeeee']),
        rd: pix(['....kk....', '...krrk...', '..krrrrk..', '.krrrrrrk.', '.krwwwwrk.', '.krwkkwrk.', '.krwkkwrk.', '.krrrrrrk.', 'kkkkkkkkkk', 'eeeeeeeeee']),
        yl: pix(['.gg...yy..', 'gggg.yyyy.', 'g.tg.yyyy.', '..t...yy..', '..t.......', '..t.......', '.tt.......', 'llllllllll', 'ssssssssss', 'ssssssssss']),
        gn: pix(['....d.....', '...ddd....', '..ddgdd...', '...ddd....', '..ddgdd...', '.dddddgd..', '..ddddd...', '.ddgddddd.', '....t.....', 'gggggggggg']),
        bl: pix(['....k.....', '...kbk....', '..kbbbk...', '..kbwbk...', '..kbbbk.kk', '..kbwbkkbk', '..kbbbkbwk', '..kbwbkbbk', '..kbbbkbwk', 'kkkkkkkkkk']),
        rail: pix(['..........', '.kk.......', '.kk.kkkkk.', 'kkkkkwwwk.', 'krrrrkkkk.', 'krrrrrrrrk', 'kkkkkkkkkk', '.kw..kw.kw', '.kk..kk.kk']),
        wind: pix(['....w.....', '....w.....', '....w.....', '...kkk....', '.ww.k.ww..', 'w...k...w.', '....k.....', '....k.....', '....k.....', 'gggggggggg']),
        water: pix(['....b.....', '....b.....', '...bbb....', '..bbbbb...', '..bwbbb...', '.bwbbbbb..', '.bbbbbbb..', '.bbbbbbb..', '..bbbbb...', '...bbb....']),
        chest: pix(['..r...r...', '...r.r....', 'kkkkkkkkk.', 'kbbbrbbbk.', 'kkkkrkkkk.', '.kbbrbbk..', '.kbbrbbk..', '.kbbrbbk..', '.kkkkkkk..']),
        chance: pix(['...kkkk...', '..krrrrk..', '.krrkkrrk.', '..k..krrk.', '....krrk..', '....krk...', '....kkk...', '....krk...', '....kkk...']),
        tax: pix(['...k..k...', '....kk....', '...kyyk...', '..kyyyyk..', '.kyykkyyk.', '.kyykyyyk.', '.kyyykkyk.', '.kyykkyyk.', '..kyyyyk..', '...kkkk...']),
        lux: pix(['..........', '..kkkkkk..', '.klwlllwk.', 'kllllllllk', '.kllllllk.', '..kllllk..', '...kllk...', '....kk....']),
        go: pix(['.....k....', '.....kk...', 'kkkkkkgk..', 'kgggggggk.', 'kggggggggk', 'kgggggggk.', 'kkkkkkgk..', '.....kk...', '.....k....']),
        jail: pix(['kkkkkkkkkk', 'knknknknkk', 'knknknknkk', 'knknknknkk', 'kkkkkkkkkk', 'knknknknkk', 'knknknknkk', 'kkkkkkkkkk']),
        park: pix(['..........', '...kkkk...', '..krrrrk..', '.krlllllk.', 'krrrrrrrrk', 'kyrrrrrryk', 'kkkkkkkkkk', '.kk....kk.']),
        gojail: pix(['....kk....', '...kyyk...', '..krrbbk..', '..krrbbk..', '.kkkkkkkk.', '.kwwwwwwk.', 'kkkkkkkkkk', 'eeeeeeeeee']),
      };
      const artFor = (t) => (t.k === 'prop' ? ART[t.g] : t.k === 'util' ? (t.n === 'Waterworks' ? ART.water : ART.wind) : t.k === 'tax' ? (t.pay === 100 ? ART.lux : ART.tax) : ART[t.k] || '');
      const CORNER_NAME = { go: 'START', jail: 'JAIL', park: 'FREE PARKING', gojail: 'GO TO JAIL' };
      // where a square sits on the board grid: [row, column]
      function cellOf(i, tall) {
        if (!tall) {
          if (i <= 10) return [11, 11 - i];
          if (i <= 20) return [11 - (i - 10), 1];
          if (i <= 30) return [1, i - 20 + 1];
          return [i - 30 + 1, 11];
        }
        // tall board for phones: 8 squares across the top and bottom, 12 down each side
        if (i <= 7) return [14, 8 - i];
        if (i <= 19) return [14 - (i - 7), 1];
        if (i <= 27) return [1, i - 19];
        return [i - 26, 8];
      }
      // which edge of the board a square is on: b(ottom) l(eft) t(op) r(ight)
      function sideOf(i, tall) {
        const c = tall ? [0, 7, 20, 27] : [0, 10, 20, 30];
        return i <= c[1] ? 'b' : i < c[2] ? 'l' : i <= c[3] ? 't' : 'r';
      }
      function tileInner(t) {
        const S = G.S, o = S.own[t.i];
        if (CORNER_NAME[t.k]) return `<div class="bd"><div class="art">${artFor(t)}</div><div class="nm">${CORNER_NAME[t.k]}</div>${t.k === 'park' && G.jackpot ? `<div class="pr" style="color:#159E6E">POT ${money(G.pot)}</div>` : ''}</div>`;
        const buyable = t.k === 'prop' || t.k === 'rail' || t.k === 'util';
        let band = '';
        if (t.k === 'prop') { const n = S.houses[t.i]; band = `<div class="band" style="background:${GR[t.g]}">${n === 5 ? '<i class="h"></i>' : '<i></i>'.repeat(n)}</div>`; }
        else if (buyable) band = `<div class="band" style="background:${GR[t.g]}"></div>`;
        const nm = t.k === 'chance' ? 'SURPRISE' : t.k === 'chest' ? 'MYSTERY BOX' : t.n;
        const pr = buyable ? `<div class="pr">$${t.pr}</div>` : t.k === 'tax' ? `<div class="pr neg">-$${t.pay}</div>` : '';
        // once someone buys it, the outer edge of the square turns their colour
        const strip = buyable && o !== undefined ? `<div class="os ${G.claimed === t.i ? 'new' : ''}" style="background:${PCOL[o]}" title="Owned by ${esc(G.players[o].name)}">${G.players[o].av}</div>` : '';
        return `${band}<div class="bd"><div class="nm">${nm}</div><div class="art">${artFor(t)}</div>${pr}</div>${strip}`;
      }
      // a die is a little cube with six pip faces
      const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
      const pipsHTML = (v) => Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[v].includes(i) ? 'on' : ''}"></i>`).join('');
      const cubeHTML = (k) => `<div class="ty-dw" id="ty-dw-${k}"><div class="ty-die2 v${G.dice[k]}" id="ty-cube-${k}">${pipsHTML(G.dice[k])}</div></div>`;
      const dieHTMLs = () => cubeHTML(0) + cubeHTML(1);
      // show face v on die k, resting at a slight tilt
      function setCube(k, v) {
        const el = $('ty-cube-' + k); if (!el) return;
        el.className = 'ty-die2 v' + v; el.innerHTML = pipsHTML(v);
        el.style.rotate = (rnd(17) - 8) + 'deg';
      }
      // throw the dice: they fly in, spin, flick through faces as they tumble, bounce twice
      // (squashing a little on each landing) and settle on the result. power 0..1 = how hard
      function throwDice(power) {
        const ms = Math.round(1050 + power * 650), spins = 2 + Math.round(power * 2);
        const box = $('ty-dice'); if (box) box.classList.remove('dbl');
        const still = motionOff();
        [0, 1].forEach((k) => {
          const w = $('ty-dw-' + k), d = $('ty-cube-' + k);
          if (!w || !d || still) { setCube(k, G.dice[k]); return; }
          const sx = (k ? 1 : -1) * (30 + power * 50), sy = 70 + power * 60, dir = k ? -1 : 1, tilt = rnd(17) - 8;
          w.animate([{ translate: `${sx}px ${sy}px`, offset: 0 }, { translate: `${sx * 0.4}px ${-34 - power * 40}px`, offset: 0.32 }, { translate: '0 0', offset: 0.56 }, { translate: '0 -16px', offset: 0.7 }, { translate: '0 0', offset: 0.82 }, { translate: '0 -5px', offset: 0.9 }, { translate: '0 0', offset: 1 }],
            { duration: ms * 0.92, easing: 'cubic-bezier(.3,.6,.4,1)' });
          d.style.rotate = tilt + 'deg';
          d.animate([{ rotate: `${tilt + dir * 360 * spins}deg` }, { rotate: `${tilt}deg` }], { duration: ms * 0.9, easing: 'cubic-bezier(.15,.6,.25,1)' });
          d.animate([{ scale: '1 1', offset: 0 }, { scale: '1 1', offset: 0.53 }, { scale: '1.14 0.82', offset: 0.57 }, { scale: '1 1', offset: 0.64 }, { scale: '1 1', offset: 0.8 }, { scale: '1.08 0.9', offset: 0.83 }, { scale: '1 1', offset: 0.88 }, { scale: '1 1', offset: 1 }], { duration: ms * 0.92 });
          // faces flick past quickly at first, then slower and slower, like a die losing speed
          let t = 0, gapMs = 55, last = G.dice[k];
          while (t + gapMs < ms * 0.8) {
            t += gapMs; gapMs *= 1.17;
            let f = 1 + rnd(6); if (f === last) f = (f % 6) + 1; last = f;
            const face = f; gTimeout(() => { const el = $('ty-cube-' + k); if (el) { el.className = 'ty-die2 v' + face; el.innerHTML = pipsHTML(face); } }, t);
          }
          gTimeout(() => { const el = $('ty-cube-' + k); if (el) { el.className = 'ty-die2 v' + G.dice[k]; el.innerHTML = pipsHTML(G.dice[k]); } }, ms * 0.82);
        });
        SFX.play('dice');
        [0.56, 0.82].forEach((f) => gTimeout(() => SFX.play('click'), ms * 0.92 * f));
        gTimeout(() => { if (G && G.dice[0] === G.dice[1] && box) { box.classList.add('dbl'); SFX.play('coin'); } }, ms);
        return ms;
      }
      // build the board once; after that only the parts that change are touched, so nothing flickers
      // every square gets a whole number of pixels. With fractional sizes (e.g. 54.37px) the dark gaps
      // between squares are redrawn slightly differently whenever something moves, so they flicker.
      function sizeBoard(bd, tall) {
        // all maths in real screen pixels (on a 125% or 300% display one page pixel is not one screen pixel)
        const dpr = window.devicePixelRatio || 1, P = (v) => v / dpr;
        const host = bd.parentElement; host.style.display = 'block';
        const hr = host.getBoundingClientRect(), Wd = Math.floor(hr.width * dpr);
        const n = tall ? 6 : 9, m = tall ? 12 : 9, k = tall ? 1.32 : 1.42;
        const edge = Math.max(1, Math.floor(4 * dpr)), gap = 0;
        const u = Math.max(16, Math.floor((Wd - 2 * edge - gap * (n + 1)) / (n + 2 * k)));
        const c = Math.max(u, Math.floor((Wd - 2 * edge - gap * (n + 1) - n * u) / 2));
        const bw = 2 * c + n * u + gap * (n + 1) + 2 * edge, bh = 2 * c + m * u + gap * (m + 1) + 2 * edge;
        Object.assign(bd.style, {
          boxSizing: 'border-box', borderWidth: P(edge) + 'px', aspectRatio: 'auto',
          gridTemplateColumns: `${P(c)}px repeat(${n}, ${P(u)}px) ${P(c)}px`, gridTemplateRows: `${P(c)}px repeat(${m}, ${P(u)}px) ${P(c)}px`,
          width: P(bw) + 'px', height: P(bh) + 'px', margin: '0',
        });
        bd.style.setProperty('--cell', P(u) + 'px');
        // centre it, landing exactly on a screen pixel
        const left = hr.left * dpr, top = bd.getBoundingClientRect().top * dpr;
        bd.style.marginLeft = P(Math.round(left + (Wd - bw) / 2) - left) + 'px';
        bd.style.marginTop = P(Math.ceil(top - 0.001) - top) + 'px';
        G.boardW = hr.width;
      }
      function buildBoard() {
        const bd = $('ty-board'); if (!bd) return;
        const tall = bd.parentElement.clientWidth < 560;
        sizeBoard(bd, tall);
        G.tall = tall; G.tileCache = {};
        bd.className = 'ty-board' + (tall ? ' tall' : '');
        bd.innerHTML = BOARD.map((t) => { const [r, c] = cellOf(t.i, tall); return `<div id="ty-t-${t.i}" class="ty-t k-${t.k} s-${sideOf(t.i, tall)} ${CORNER_NAME[t.k] ? 'corner' : ''}" style="grid-row:${r};grid-column:${c}" title="${t.n}${t.pr ? ' $' + t.pr : ''}"></div>`; }).join('') +
          `<div class="ty-center"><div id="ty-title" class="ty-title">LANDLORD</div>
            <div class="ty-mid"><div id="ty-deck-ch" class="ty-deck ch">${ART.chance}<span>SURPRISE</span></div><div id="ty-dice" class="ty-dice">${dieHTMLs()}</div><div id="ty-deck-mb" class="ty-deck mb">${ART.chest}<span>MYSTERY</span></div></div>
            <div id="ty-msg" class="pix text-xs text-amber min-h-[18px]">${esc(G.msg || '')}</div>
            <div id="ty-card" class="ty-card"></div>
            <div id="ty-prompt" class="w-full max-w-[420px]">${G.prompt || ''}</div></div>
          <div id="ty-pawns" class="ty-pawns">${G.players.map((p) => `<div id="ty-pawn-${p.i}" class="ty-pawn ${p.i === G.me ? 'me' : ''}" title="${esc(p.name)}"><b style="background:${p.col}">${p.av}</b></div>`).join('')}</div>`;
        if (G._rebind) G._rebind();
        bd.onclick = (e) => {
          if (e.target.closest('#ty-prompt, button')) return;
          const pw = e.target.closest('.ty-pawn');
          if (pw) { const q = G.players[+pw.id.slice(8)], t = q && BOARD[q.pos]; if (!t) return; if (['prop', 'rail', 'util'].includes(t.k)) openDeed(t.i); else showToast(`${q.i === G.me ? 'You are' : q.name + ' is'} on ${t.n}`, 'info'); return; }
          const tl = e.target.closest('.ty-t'); if (tl) openDeed(+tl.id.slice(5));
        };
        setCube(0, G.dice[0]); setCube(1, G.dice[1]);
      }
      // put every pawn on its square; players sharing a square stand side by side
      function placePawns(hopWho) {
        const layer = $('ty-pawns'); if (!layer) return;
        G.players.forEach((p) => {
          const el = $('ty-pawn-' + p.i); if (!el) return;
          if (p.out) { el.style.display = 'none'; return; }
          const tile = $('ty-t-' + p.pos); if (!tile) return;
          const mates = G.players.filter((q) => !q.out && q.pos === p.pos), k = mates.indexOf(p), n = mates.length;
          const sc = n > 2 ? 0.55 : n > 1 ? 0.68 : 1; el.style.scale = sc;
          const pw = el.offsetWidth || 20;
          const cx = tile.offsetLeft + tile.offsetWidth / 2, cy = tile.offsetTop + tile.offsetHeight * 0.55;
          const ox = n > 1 ? ((k % 2) - 0.5) * pw * sc * 1.02 : 0, oy = n > 2 ? (Math.floor(k / 2) - 0.5) * pw * sc * 1.02 : 0;
          el.style.translate = `${Math.round(cx - pw / 2 + ox)}px ${Math.round(cy - pw / 2 + oy)}px`;
          if (hopWho === p && !motionOff()) el.firstElementChild.animate([{ translate: '0 0' }, { translate: '0 -9px', offset: 0.45 }, { translate: '0 0' }], { duration: 250, easing: 'ease-out' });
        });
      }
      function render(hopWho) {
        const bd = $('ty-board'); if (!bd) return;
        if (!bd.firstElementChild || G.tall !== (bd.parentElement.clientWidth < 560)) buildBoard();
        else if (G.boardW !== bd.parentElement.getBoundingClientRect().width) sizeBoard(bd, G.tall);
        const S = G.S, cur = G.players[G.cur];
        BOARD.forEach((t) => { const h = tileInner(t); if (G.tileCache[t.i] !== h) { G.tileCache[t.i] = h; const el = $('ty-t-' + t.i); el.innerHTML = h; el.classList.toggle('mort', !!S.mort[t.i]); } });
        const m = $('ty-msg'); if (m && m.textContent !== (G.msg || '')) m.textContent = G.msg || '';
        placePawns(hopWho);
        const tt = $('ty-title'); if (tt && cur) { const h = G.over ? 'LANDLORD' : `<span class="ty-who" style="--pc:${cur.col}">${cur.av}</span> ${cur.i === G.me ? 'YOUR TURN' : esc(cur.name.toUpperCase()) + '’S TURN'}`; if (tt.innerHTML !== h) tt.innerHTML = h; }
        $('ty-round').textContent = `ROUND ${Math.min(G.round, G.maxRound)}${G.timed ? '/' + G.maxRound : ''}`;
        $('ty-players').innerHTML = G.players.map((p) => {
          const props = BOARD.filter((t) => S.own[t.i] === p.i).sort((a, b) => a.i - b.i);
          const fl = G.flash[p.i] && performance.now() < G.flash[p.i].until ? G.flash[p.i].dir : '';
          return `<div id="ty-pl-${p.i}" class="ty-pl pl-tag ${cur === p && !G.over ? 'turn' : ''} ${p.out ? 'out' : ''} ${p.i === G.me ? 'me' : ''} ${fl}" style="--pc:${p.col}"><div class="flex items-center justify-between gap-2"><span class="text-sm font-display font-extrabold flex items-center gap-2 min-w-0"><span class="tg-av">${p.av}</span><span class="truncate">${esc(p.name)}</span>${p.jail > 0 ? ' 🔒' : ''}${p.free ? ' 🎟️' : ''}</span><span id="ty-cash-${p.i}" class="ty-cash pix text-sm text-amber">${p.out ? 'OUT' : money(G.shown[p.i])}</span></div>
            <div class="mt-1 flex flex-wrap gap-0.5 min-h-[12px]">${props.map((t) => `<span class="ty-dot ${S.mort[t.i] ? 'm' : ''}" style="background:${GR[t.g]}" title="${t.n}"></span>`).join('')}</div></div>`;
        }).join('');
        syncCash();
        renderMine();
      }
      /* ----- money you can see: bills fly from payer to payee, balances count, +/- pops up ----- */
      // where a player's money lives on screen: their panel, or their pawn if the panel is off screen (phones)
      function anchorOf(k) {
        if (typeof k === 'number') {
          const pnl = $('ty-pl-' + k), r = pnl && pnl.getBoundingClientRect();
          if (r && r.width && r.bottom > 0 && r.top < innerHeight) return pnl.querySelector('.ty-cash') || pnl;
          return $('ty-pawn-' + k) || pnl;
        }
        if (k === 'start') return $('ty-t-0');
        if (k === 'pot') return $('ty-t-20');
        if (typeof k === 'string' && k.startsWith('tile:')) return $('ty-t-' + k.slice(5));
        return document.querySelector('.ty-title'); // the bank sits in the middle of the board
      }
      // money travels from one place to another; the receiving balance only changes when it arrives
      function moneyFlow(from, to, amt) {
        amt = Math.round(amt); if (!amt || !G) return;
        const ms = 720, n = amt >= 500 ? 3 : amt >= 100 ? 2 : 1;
        if (typeof to === 'number') G.arrive[to] = performance.now() + ms + (n - 1) * 120;
        const a = anchorOf(from), b = anchorOf(to);
        for (let k = 0; k < n; k++) gFly(a, b, `<span class="ty-bill">$${amt}</span>`, { ms, delay: k * 120, arc: 40, spin: (k - 1) * 8 });
      }
      function floatText(el, text, col) {
        if (!el || motionOff()) return;
        const r = el.getBoundingClientRect(); if (!r.width) return;
        const f = document.createElement('div'); f.className = 'ty-float g-fx'; f.textContent = text; f.style.color = col;
        document.body.appendChild(f);
        f.style.left = (r.left + r.width / 2 - f.offsetWidth / 2) + 'px'; f.style.top = (r.top - 6) + 'px';
        f.animate([{ translate: '0 6px', opacity: 0 }, { translate: '0 -8px', opacity: 1, offset: 0.2 }, { translate: '0 -34px', opacity: 1, offset: 0.75 }, { translate: '0 -44px', opacity: 0 }], { duration: 1400, easing: 'ease-out' }).onfinish = () => f.remove();
        setTimeout(() => f.remove(), 1800);
      }
      // after each redraw: any balance that changed counts to its new value (when the money arrives)
      function syncCash() {
        const S = G.S, now = performance.now();
        G.players.forEach((p) => {
          const i = p.i, target = S.cash[i];
          if (G.goal[i] === target) return;
          const delta = target - G.goal[i]; G.goal[i] = target;
          const wait = delta > 0 ? Math.max(0, (G.arrive[i] || 0) - now) : 0;
          gTimeout(() => countCash(i, delta), wait);
        });
      }
      function countCash(i, delta) {
        if (!G) return;
        const from = G.shown[i], to = G.goal[i], t0 = performance.now(), ms = 650;
        G.flash[i] = { dir: delta > 0 ? 'gain' : 'loss', until: t0 + 900 };
        const pnl = $('ty-pl-' + i); if (pnl) { pnl.classList.remove('gain', 'loss'); pnl.classList.add(G.flash[i].dir); }
        floatText(anchorOf(i), `${delta > 0 ? '+' : '−'}$${Math.abs(delta)}`, delta > 0 ? '#34D399' : '#FB7185');
        if (delta > 0) SFX.play('coin');
        const step = () => {
          if (!G) return;
          const k = Math.min(1, (performance.now() - t0) / ms), e = 1 - Math.pow(1 - k, 3);
          G.shown[i] = Math.round(from + (to - from) * e);
          const el = $('ty-cash-' + i); if (el && !G.players[i].out) el.textContent = money(G.shown[i]);
          if (k < 1) gRaf(step); else { G.shown[i] = G.goal[i]; gTimeout(() => { const q = $('ty-pl-' + i); if (q && performance.now() >= G.flash[i].until) q.classList.remove('gain', 'loss'); }, 950 - ms); }
        };
        gRaf(step);
      }
      // a Surprise / Mystery Box card slides out of its deck and turns face up
      function showCard(kind, text) {
        const el = $('ty-card'); if (!el) return 0;
        el.innerHTML = `<div class="hd" style="background:${kind === 'chance' ? '#D13B55' : '#2563EB'}">${kind === 'chance' ? 'SURPRISE' : 'MYSTERY BOX'}</div><div class="bd">${esc(text)}</div>`;
        el.classList.add('on');
        const deck = $(kind === 'chance' ? 'ty-deck-ch' : 'ty-deck-mb');
        if (deck && !motionOff()) {
          const a = deck.getBoundingClientRect(), b = el.getBoundingClientRect();
          el.animate([{ translate: `${a.left + a.width / 2 - b.left - b.width / 2}px ${a.top + a.height / 2 - b.top - b.height / 2}px`, scale: `${a.width / b.width} ${a.height / b.height}` }, { translate: '0 0', scale: '0.03 1', offset: 0.55 }, { translate: '0 0', scale: '1 1' }], { duration: 620, easing: MOTION.ease });
        }
        return 620;
      }
      const hideCard = () => { const el = $('ty-card'); if (el) { el.classList.remove('on'); el.innerHTML = ''; } };
      function renderMine() {
        const el = $('ty-mine'); if (!el) return;
        if (!G.panelOpen) { el.innerHTML = ''; return; }
        const S = G.S;
        const me = G.me, mineP = BOARD.filter((t) => S.own[t.i] === me);
        // a pop-up window in the middle of the screen (Nov 2026, Inna: it used to sit at the bottom, under CHAT)
        const rule = G.landBuild ? 'Build rule: land on your own plot to build one house there.' : 'Build rule: own the whole colour set, then build evenly.';
        el.innerHTML = `<div class="ty-mine-bg"></div><div class="win overflow-hidden ty-mine-win" role="dialog" aria-label="Your properties"><div class="winbar teal"><span>YOUR PROPERTIES · ${money(S.cash[me])}</span><button id="pn-close" class="btn-game btn-amber py-0.5 px-3 text-xs">Done</button></div>
          <div class="ty-mine-rule">${rule}</div>
          <div class="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 ty-mine-list">${mineP.map((t) => `<div class="ty-pl flex items-center justify-between gap-2"><span class="text-sm"><span class="ty-dot" style="background:${GR[t.g]}"></span><button class="font-bold underline decoration-dotted" onclick="tyDeed(${t.i})" title="See the property card">${t.n}</button>${S.mort[t.i] ? ' <span class="text-coral">(mortgaged)</span>' : ''}<br><span class="text-xs text-muted">${t.k === 'prop' ? (S.houses[t.i] === 5 ? 'Hotel' : S.houses[t.i] + ' houses') + ` · house ${money(t.hc)}` : 'Value ' + money(t.pr)}</span></span>
            <span class="flex gap-1 flex-wrap justify-end">${t.k === 'prop' ? `<button data-pa="build" data-i="${t.i}" class="btn-game btn-emerald py-1 px-2 text-xs" ${canBuild(S, me, t.i) ? '' : 'style="opacity:.4"'}>+🏠</button><button data-pa="sell" data-i="${t.i}" class="btn-game btn-graphite py-1 px-2 text-xs" ${canSell(S, me, t.i) ? '' : 'style="opacity:.4"'}>-🏠</button>` : ''}${S.mort[t.i] ? `<button data-pa="unmort" data-i="${t.i}" class="btn-game btn-teal py-1 px-2 text-xs">Unmortgage ${money(Math.round(t.pr * 0.55))}</button>` : `<button data-pa="mort" data-i="${t.i}" class="btn-game btn-graphite py-1 px-2 text-xs" ${S.houses[t.i] > 0 ? 'style="opacity:.4"' : ''}>Mortgage</button>`}</span></div>`).join('') || '<div class="text-sm text-muted">You do not own any properties yet.</div>'}</div></div>`;
        el.querySelectorAll('[data-pa]').forEach((b) => { b.onclick = () => panelClick(b.dataset.pa, +b.dataset.i); });
        $('pn-close').onclick = () => { G.panelOpen = false; renderMine(); };
        el.querySelector('.ty-mine-bg').onclick = () => { G.panelOpen = false; renderMine(); };
      }

      const mod = {
        id: 'tycoon', name: 'Landlord', icon: 'tycoon', cats: ['board'], sub: '2-4 PLAYERS · ~15 MIN', color: '#34D399', tone: 'emerald', btn: 'emerald',
        blurb: 'Roll the dice, buy properties, build houses and hotels and bankrupt your rivals. Play 15, 25 or 40 rounds, or go all the way.',
        rules: { tag: '2-4 PLAYERS', steps: [
          '<strong class="text-bone">Roll &amp; move:</strong> Roll two dice and walk around the board. Pass <b>START</b> to collect $200. Doubles give you another go (three in a row sends you to Jail).',
          '<strong class="text-bone">Buy &amp; collect rent:</strong> Land on a free property to buy it. Land on someone else\'s and you pay rent. Own a whole colour set to <span class="text-amber font-bold">double the rent</span>, then build houses and hotels to charge much more.',
          '<strong class="text-bone">Win:</strong> With a round limit (15, 25 or 40), the richest player at the end wins. In Classic, the last player not bankrupt wins. Short on cash? Houses are sold and properties mortgaged for you automatically. Skip a property and it goes to <b>auction</b>: everyone can bid and the highest bid wins (you can turn auctions off in the settings). Settings also let you build by standing on your own plot instead of owning the whole colour, and make the owner an offer for a plot after paying rent (they can accept, refuse or ask for more).',
        ], tip: 'Railroads and the orange and red sets are the best value. Build evenly across a set.' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['BEST WORTH', '$' + (s.bestWorth || 0), 'text-emerald'], ['PROPERTIES', s.props || 0, 'text-teal']],
        extraRows: (s) => srow('Houses built', s.houses || 0),
        online: { seats: (sel) => +sel.n || 3, ranked: true, start: (body, sel, S) => start(body, sel, S) },
        engine: { BOARD, GROUPS, rentFor, netWorth, canBuild, buildWhy, canBuyout, buyoutPrice, botMin, botMax, get G() { return G; } }, open, close() { if (boardRO) { boardRO.disconnect(); boardRO = null; } G = null; },
      };
      registerGame(mod);
    })();

