    /* =========================================================================
       FRONTIER ISLES: hex island, collect resources, build roads / villages / towns, first to N points
       ========================================================================= */
    (function frontierIslesGame() {
      const ABORT = { a: 1 };
      const RES = ['T', 'C', 'W', 'G', 'S'];
      const RN = { T: 'Timber', C: 'Clay', W: 'Wool', G: 'Grain', S: 'Stone' };
      const TER = { T: ['Forest', '#2E8B57', '#1F6B42'], C: ['Clay pits', '#C8643F', '#9C4630'], W: ['Meadow', '#8BCB6A', '#6BAA4E'], G: ['Fields', '#E9C352', '#C9A133'], S: ['Mountains', '#8E9CAD', '#6B7A8C'], D: ['Desert', '#E5D5A6', '#CDBB86'] };
      const COST = { road: { T: 1, C: 1 }, village: { T: 1, C: 1, W: 1, G: 1 }, town: { G: 2, S: 3 } };
      const LIMIT = { road: 15, village: 5, town: 4 };
      const PCOL = ['#F5B041', '#FB7185', '#2DD4BF', '#F7F4EC'];
      const BOTS = [['Captain Gull', '🐦'], ['Old Moss', '🐢'], ['Ruby Fox', '🦊']];
      const DOTS = (n) => (n ? 6 - Math.abs(7 - n) : 0);
      const SZ = 52, R3 = Math.sqrt(3);

      /* ---------- the island ---------- */
      function makeIsland(shuffle) {
        const coords = []; for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) if (Math.abs(q + r) <= 2) coords.push([q, r]);
        const terr = shuffle('TTTTCCCWWWWGGGGSSSD'.split(''));
        const H = coords.map(([q, r], i) => ({ i, q, r, t: terr[i], n: 0, x: SZ * R3 * (q + r / 2), y: SZ * 1.5 * r, v: [] }));
        const nb = (a, b) => { const dq = a.q - b.q, dr = a.r - b.r; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) === 2; };
        // number tokens: the red 6s and 8s may not sit next to each other
        for (let tries = 0; tries < 500; tries++) {
          const nums = shuffle([2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]); let k = 0;
          H.forEach((h) => { h.n = h.t === 'D' ? 0 : nums[k++]; });
          const hot = H.filter((h) => h.n === 6 || h.n === 8);
          if (!hot.some((a) => hot.some((b) => a !== b && nb(a, b)))) break;
        }
        const V = [], E = [], vkey = {}, ekey = {};
        H.forEach((h) => {
          for (let c = 0; c < 6; c++) {
            const a = Math.PI / 180 * (60 * c - 30), x = h.x + SZ * Math.cos(a), y = h.y + SZ * Math.sin(a), key = Math.round(x) + ',' + Math.round(y);
            if (vkey[key] === undefined) { vkey[key] = V.length; V.push({ i: V.length, x, y, h: [], adj: [], e: [] }); }
            const vi = vkey[key]; h.v.push(vi); V[vi].h.push(h.i);
          }
          for (let c = 0; c < 6; c++) {
            const a = h.v[c], b = h.v[(c + 1) % 6], key = Math.min(a, b) + '-' + Math.max(a, b);
            if (ekey[key] === undefined) { ekey[key] = E.length; E.push({ i: E.length, a, b }); V[a].adj.push(b); V[b].adj.push(a); V[a].e.push(E.length - 1); V[b].e.push(E.length - 1); }
          }
        });
        return { H, V, E, robber: H.findIndex((h) => h.t === 'D') };
      }

      /* ---------- rules ---------- */
      const total = (p) => RES.reduce((s, r) => s + p.res[r], 0);
      const afford = (p, c) => Object.keys(c).every((r) => p.res[r] >= c[r]);
      const pay = (p, c) => Object.keys(c).forEach((r) => { p.res[r] -= c[r]; });
      const count = (G, pi, lvl) => G.V.filter((v) => G.bld[v.i] && G.bld[v.i].p === pi && (!lvl || G.bld[v.i].l === lvl)).length;
      const roads = (G, pi) => G.E.filter((e) => G.road[e.i] === pi).length;
      function canVillage(G, vi, pi, setup) {
        if (G.bld[vi]) return false;
        if (G.V[vi].adj.some((a) => G.bld[a])) return false; // villages need a free corner all around
        if (setup) return true;
        return G.V[vi].e.some((ei) => G.road[ei] === pi);
      }
      function canRoad(G, ei, pi, fromV) {
        if (G.road[ei] !== undefined) return false;
        const e = G.E[ei];
        if (fromV !== undefined) return e.a === fromV || e.b === fromV;
        return [e.a, e.b].some((v) => {
          const b = G.bld[v];
          if (b && b.p === pi) return true;
          if (b && b.p !== pi) return false; // a rival's building blocks the way
          return G.V[v].e.some((x) => x !== ei && G.road[x] === pi);
        });
      }
      function longest(G, pi) {
        let best = 0;
        const dfs = (v, used, len) => {
          if (len > best) best = len;
          const b = G.bld[v]; if (len > 0 && b && b.p !== pi) return;
          for (const ei of G.V[v].e) { if (used.has(ei) || G.road[ei] !== pi) continue; const e = G.E[ei], nv = e.a === v ? e.b : e.a; used.add(ei); dfs(nv, used, len + 1); used.delete(ei); }
        };
        G.E.forEach((e) => { if (G.road[e.i] === pi) { dfs(e.a, new Set(), 0); dfs(e.b, new Set(), 0); } });
        return best;
      }
      function updateLongest(G) {
        const lens = G.players.map((_, i) => longest(G, i));
        const cur = G.lr;
        if (cur >= 0 && lens[cur] >= 5 && lens.every((l, i) => i === cur || l <= lens[cur])) return lens;
        const max = Math.max(...lens), who = lens.map((l, i) => (l === max ? i : -1)).filter((i) => i >= 0);
        const nw = max >= 5 && who.length === 1 ? who[0] : cur >= 0 && lens[cur] >= 5 && who.includes(cur) ? cur : -1;
        if (nw !== cur) { G.lr = nw; if (nw >= 0) { log(`🛣️ ${nm(G.players[nw])} takes <b>Longest Road</b> (${lens[nw]}).`); SFX.play('coin'); } }
        return lens;
      }
      const vp = (G, pi) => count(G, pi, 1) + 2 * count(G, pi, 2) + (G.lr === pi ? 2 : 0);

      /* ---------- bots ---------- */
      function vScore(G, vi, pi) {
        let s = 0; const seen = new Set();
        for (const h of G.V[vi].h) { const H = G.H[h]; if (H.t === 'D' || h === G.robber) continue; s += DOTS(H.n); if (!seen.has(H.t)) { seen.add(H.t); s += 1.2; } }
        if (pi !== undefined) { const have = new Set(); G.V.forEach((v) => { if (G.bld[v.i] && G.bld[v.i].p === pi) v.h.forEach((h) => have.add(G.H[h].t)); }); for (const h of G.V[vi].h) if (!have.has(G.H[h].t) && G.H[h].t !== 'D') s += 0.8; }
        return s;
      }
      function bestRoadToward(G, pi, fromV) {
        let best = null, bs = -1;
        G.E.forEach((e) => {
          if (!canRoad(G, e.i, pi, fromV)) return;
          const far = [e.a, e.b].find((v) => !(G.bld[v] && G.bld[v].p === pi) && !G.V[v].e.some((x) => x !== e.i && G.road[x] === pi)) ?? e.b;
          let sc = canVillage(G, far, pi, true) ? vScore(G, far, pi) : 0;
          G.V[far].adj.forEach((a) => { if (canVillage(G, a, pi, true)) sc = Math.max(sc, vScore(G, a, pi) * 0.7); });
          sc += Math.random() * 0.3;
          if (sc > bs) { bs = sc; best = e.i; }
        });
        return best;
      }

      /* ---------- game ---------- */
      let G = null;
      const $ = (id) => document.getElementById(id);
      const nm = (p) => `<b style="color:${p.col}">${esc(p.name)}</b>`;
      const log = (t) => { if (!G) return; G.log.push(t); const el = $('fi-log'); if (el) { el.innerHTML = G.log.slice(-50).map((x) => `<div>${x}</div>`).join(''); el.scrollTop = el.scrollHeight; } };
      const prompt = (h) => { const e = $('fi-prompt'); if (e) e.innerHTML = h; };
      async function W(ms) { const t = G && G.tok; await gSleep(window.__fast ? 1 : ms); if (!G || G.tok !== t) throw ABORT; }

      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1180px] mx-auto');
        setupScreen(body, mod, [
          { key: 'n', label: 'PLAYERS', def: 3, choices: [[3, '3 players'], [4, '4 players']], hint: 'On this device the other seats are computer players. Online, empty seats get computer players.' },
          { key: 'vp', label: 'POINTS TO WIN', def: 10, choices: [[8, '8 (shorter)'], [10, '10 (classic)']] },
          { key: 'rate', label: 'BANK TRADE', def: 4, choices: [[4, '4 for 1'], [3, '3 for 1 (friendly)']] },
          { key: 'lvl', label: 'BOTS', def: 2, choices: [[1, 'Relaxed'], [2, 'Sharp']] },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(BOTS.slice(0, +sel.n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel)));
      }
      // seats come from the table (S): on this device seat 0 is you; online every screen has its own seat (G.me)
      function start(body, sel, S) {
        const isl = makeIsland(S.rng.shuffle);
        const players = S.seats.map((x) => ({ name: x.name, av: x.avatar }));
        players.forEach((p, i) => { p.i = i; p.col = PCOL[i]; p.res = { T: 0, C: 0, W: 0, G: 0, S: 0 }; });
        G = { ...isl, S, me: S.online ? S.me : 0, step: 0, offerN: 0, players, bld: {}, road: {}, lr: -1, goal: +sel.vp, rate: +sel.rate, lvl: +sel.lvl, cur: 0, dice: [3, 4], tok: ++GT.cur, over: false, log: [], turn: 0, built: 0, trades: 0 };
        body.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-5 items-start">
          <div class="space-y-3 min-w-0"><div class="fi-sea"><svg id="fi-board" class="fi-board"></svg></div><div id="fi-prompt" class="win p-3 text-center text-sm min-h-[50px]"></div></div>
          <div class="space-y-3 min-w-0">
            <div id="fi-players" class="space-y-2"></div>
            <div class="win overflow-hidden"><div class="winbar amber"><span>YOUR RESOURCES</span><span id="fi-vp" class="pix text-xs"></span></div><div id="fi-res" class="fi-res p-3"></div></div>
            <div class="win p-3 space-y-3"><div class="flex items-center gap-3"><div id="fi-dice" class="fi-dice"></div><button id="fi-roll" class="btn-game btn-amber py-2 px-5 flex-1" disabled>🎲 Roll</button></div>
              <div id="fi-build" class="grid grid-cols-3 gap-2"></div>
              <div id="fi-trade" class="fi-trade"></div>
              <button id="fi-end" class="btn-game btn-teal w-full py-2" disabled>End turn</button></div>
            <div id="fi-log" class="logbox" style="height:170px"></div>
            <button id="fi-quit" class="btn-game btn-coral w-full py-2 text-sm">${S.online ? 'Leave game' : 'Give up'}</button></div></div>`;
        S.track();
        S.onLeft = (a) => { if (!G) return; const q = G.players[a.s]; q.name += ' (CPU)'; q.av = '🤖'; log(`${nm(q)} ${a.t === '_gone' ? 'disconnected' : 'left'}. A computer player takes over.`); render(); };
        npBar('');
        let sure = false;
        $('fi-quit').onclick = (e) => { if (S.online) return npConfirmLeave(() => open($('game-root'))); if (!sure) { sure = true; e.target.textContent = 'Really give up?'; gTimeout(() => { sure = false; if (G) e.target.textContent = 'Give up'; }, 3000); return; } if (!G.over) { G.tok++; finish(true); } };
        log('Place your first <b>village</b> and <b>road</b>. Pick corners touching good numbers: 6 and 8 come up the most.');
        render();
        run().catch((e) => { if (e !== ABORT) throw e; });
      }

      // ask the human to click one of the allowed spots on the board
      function pickOnBoard(kind, ids, text) {
        return new Promise((res) => { G.pick = { kind, ids: new Set(ids), res }; prompt(text); render(); });
      }
      function resolvePick(kind, id) { if (!G || !G.pick || G.pick.kind !== kind || !G.pick.ids.has(id)) return; const r = G.pick.res; G.pick = null; prompt(''); r(id); }

      /* ----- decisions: you tap, the table's host decides for computer players, online players send theirs ----- */
      const isMe = (p) => p.i === G.me;
      const mine = (p) => G.S.mine(p.i);
      const isBot = (p) => G.S.bot(p.i);
      async function decide(p, kind, ui, botFn, ms) {
        const NS = G.S, k = ++G.step, t = G.tok;
        if (NS.mine(p.i) && ui) Promise.resolve(ui()).then((v) => { if (G && G.tok === t && v !== undefined) NS.act({ t: kind, s: p.i, k, v }); });
        const a = await NS.ask(p.i, () => ({ t: kind, k, v: botFn() }), ms, (x) => x.s === p.i && x.t === kind && x.k === k);
        if (!G || G.tok !== t) throw ABORT;
        return a.v;
      }
      const waiting = (p, what) => { if (!mine(p)) prompt(`<span class="text-muted">${esc(p.name)} ${what}...</span>`); };

      async function run() {
        const n = G.players.length, order = [...Array(n).keys(), ...[...Array(n).keys()].reverse()];
        for (let k = 0; k < order.length; k++) {
          const p = G.players[order[k]], second = k >= n; G.cur = p.i; render();
          const spots = G.V.filter((v) => canVillage(G, v.i, p.i, true)).map((v) => v.i);
          waiting(p, 'is placing a village');
          let vi = +(await decide(p, 'setv', () => pickOnBoard('v', spots, `Place your ${second ? 'second' : 'first'} <b>village</b> on a glowing corner.`),
            () => spots.map((v) => [v, vScore(G, v, p.i) + Math.random() * (G.lvl === 1 ? 4 : 0.6)]).sort((a, b) => b[1] - a[1])[0][0], 700));
          if (!spots.includes(vi)) vi = spots[0];
          G.bld[vi] = { p: p.i, l: 1 }; G.fresh = 'v' + vi; SFX.play('move'); log(`${nm(p)} settles a village.`);
          if (second) { // the second village gives you what its land makes
            const got = []; G.V[vi].h.forEach((h) => { const t = G.H[h].t; if (t !== 'D') { p.res[t]++; got.push([h, t]); } });
            render(); flyRes(p, got);
          } else render();
          await W(400);
          const er = G.E.filter((e) => canRoad(G, e.i, p.i, vi)).map((e) => e.i);
          waiting(p, 'is placing a road');
          let ei = +(await decide(p, 'sete', () => pickOnBoard('e', er, 'Now place a <b>road</b> next to it.'), () => bestRoadToward(G, p.i, vi) ?? er[0], 500));
          if (!er.includes(ei)) ei = er[0];
          G.road[ei] = p.i; G.fresh = 'e' + ei; SFX.play('click'); render(); await W(350);
        }
        log('<b>Setup done!</b> Roll the dice to start collecting.');
        for (let guard = 0; guard < 600 && !G.over; guard++) {
          G.turn++;
          await turn(G.players[G.cur]);
          if (G.over) return;
          G.cur = (G.cur + 1) % G.players.length;
        }
      }

      async function turn(p) {
        render();
        waiting(p, 'is rolling');
        await decide(p, 'roll', () => new Promise((res) => { prompt('Your turn: <b>roll the dice</b>.'); const b = $('fi-roll'); b.disabled = false; b.onclick = () => { b.disabled = true; prompt(''); res(1); }; }), () => 1, 750);
        await rollDice();
        const sum = G.dice[0] + G.dice[1];
        log(`${nm(p)} rolls <b>${sum}</b>.`);
        if (sum === 7) await bandit(p);
        else produce(sum);
        await W(700);
        await buildPhase(p);
      }
      async function rollDice() {
        SFX.play('dice');
        for (let k = 0; k < 9; k++) { G.dice = [1 + rnd(6), 1 + rnd(6)]; drawDice(true); await W(60 + k * 10); }
        G.dice = [1 + G.S.rng.rnd(6), 1 + G.S.rng.rnd(6)]; drawDice(false);
      }
      function produce(sum) {
        const gains = G.players.map(() => []);
        G.H.forEach((h) => {
          if (h.n !== sum) return;
          if (h.i === G.robber) { log(`The Bandit blocks the ${TER[h.t][0].toLowerCase()}.`); return; }
          h.v.forEach((vi) => { const b = G.bld[vi]; if (b) { G.players[b.p].res[h.t] += b.l; for (let k = 0; k < b.l; k++) gains[b.p].push([h.i, h.t]); } });
        });
        if (gains.every((g) => !g.length)) log('Nobody collects anything.');
        G.players.forEach((p, i) => { if (gains[i].length) { const c = {}; gains[i].forEach(([, t]) => { c[t] = (c[t] || 0) + 1; }); log(`${nm(p)} collects ${Object.keys(c).map((t) => `${c[t]} ${RN[t]}`).join(', ')}.`); } });
        render();
        G.players.forEach((p, i) => flyRes(p, gains[i]));
        if (gains.some((g) => g.length)) SFX.play('coin');
      }
      // little resource cards fly from the land to whoever collected them
      function flyRes(p, list) {
        list.forEach(([h, t], k) => gFly(`#fi-h-${h}`, isMe(p) ? `#fi-r-${t}` : `#fi-pl-${p.i}`, resIcon(t, 22), { ms: 620, delay: k * 110, arc: 30 }));
      }
      async function bandit(p) {
        SFX.play('nope');
        // anyone holding more than 7 cards loses half (the ones they have most of)
        G.players.forEach((q) => {
          let n = total(q); if (n <= 7) return;
          let lose = Math.floor(n / 2); const lost = {};
          while (lose-- > 0) { const r = RES.slice().sort((a, b) => q.res[b] - q.res[a])[0]; q.res[r]--; lost[r] = (lost[r] || 0) + 1; }
          log(`${nm(q)} had too many cards and drops ${Object.keys(lost).map((r) => `${lost[r]} ${RN[r]}`).join(', ')}.`);
        });
        render();
        const hexes = G.H.filter((h) => h.i !== G.robber).map((h) => h.i);
        waiting(p, 'is moving the Bandit');
        let hi = +(await decide(p, 'rob', () => pickOnBoard('h', hexes, 'A 7! Move the <b>Bandit</b>: tap a land tile to block it.'), () => {
          const lead = G.players.filter((q) => q !== p).sort((a, b) => vp(G, b.i) - vp(G, a.i))[0];
          return hexes.map((h) => { let s = 0; G.H[h].v.forEach((vi) => { const b = G.bld[vi]; if (b) s += (b.p === p.i ? -6 : b.p === lead.i ? 3 : 1.5) * b.l * DOTS(G.H[h].n); }); return [h, s + Math.random()]; }).sort((a, b) => b[1] - a[1])[0][0];
        }, 700));
        if (!hexes.includes(hi)) hi = hexes[0];
        G.robber = hi; SFX.play('move'); log(`${nm(p)} moves the Bandit to the ${TER[G.H[hi].t][0].toLowerCase()}${G.H[hi].n ? ' (' + G.H[hi].n + ')' : ''}.`); render();
        const victims = [...new Set(G.H[hi].v.map((vi) => G.bld[vi]).filter((b) => b && b.p !== p.i && total(G.players[b.p]) > 0).map((b) => b.p))];
        if (!victims.length) return;
        let vi = victims[0];
        if (victims.length > 1) {
          const v = +(await decide(p, 'vic', () => new Promise((res) => { prompt(`Steal a card from: ${victims.map((v) => `<button data-v="${v}" class="btn-game btn-graphite py-1.5 px-3 text-sm ml-2">${G.players[v].av} ${esc(G.players[v].name)}</button>`).join('')}`); document.querySelectorAll('#fi-prompt [data-v]').forEach((b) => { b.onclick = () => { prompt(''); res(+b.dataset.v); }; }); }),
            () => victims.slice().sort((a, b) => total(G.players[b]) - total(G.players[a]))[0], 400));
          vi = victims.includes(v) ? v : victims[0];
        }
        const q = G.players[vi], bag = []; RES.forEach((r) => { for (let k = 0; k < q.res[r]; k++) bag.push(r); });
        const r = bag[G.S.rng.rnd(bag.length)]; q.res[r]--; p.res[r]++;
        log(`${nm(p)} steals a card from ${nm(q)}${isMe(p) || isMe(q) ? ` (${RN[r]})` : ''}.`);
        render(); gFly(isMe(q) ? `#fi-r-${r}` : `#fi-pl-${q.i}`, isMe(p) ? `#fi-r-${r}` : `#fi-pl-${p.i}`, resIcon(isMe(p) || isMe(q) ? r : null, 22), { ms: 600, arc: 30 });
      }

      /* ----- building ----- */
      function legal(G, p) {
        return {
          road: roads(G, p.i) < LIMIT.road && afford(p, COST.road) ? G.E.filter((e) => canRoad(G, e.i, p.i)).map((e) => e.i) : [],
          village: count(G, p.i, 1) < LIMIT.village && afford(p, COST.village) ? G.V.filter((v) => canVillage(G, v.i, p.i)).map((v) => v.i) : [],
          town: count(G, p.i, 2) < LIMIT.town && afford(p, COST.town) ? G.V.filter((v) => G.bld[v.i] && G.bld[v.i].p === p.i && G.bld[v.i].l === 1).map((v) => v.i) : [],
        };
      }
      function doBuild(p, kind, id) {
        pay(p, COST[kind]); G.built++;
        if (kind === 'road') { G.road[id] = p.i; G.fresh = 'e' + id; SFX.play('click'); log(`${nm(p)} builds a road.`); }
        else if (kind === 'village') { G.bld[id] = { p: p.i, l: 1 }; G.fresh = 'v' + id; SFX.play('move'); log(`${nm(p)} builds a <b>village</b>.`); }
        else { G.bld[id] = { p: p.i, l: 2 }; G.fresh = 'v' + id; SFX.play('coin'); log(`${nm(p)} upgrades to a <b>town</b>.`); }
        updateLongest(G); render(); checkWin(p);
      }
      function checkWin(p) { if (!G.over && vp(G, p.i) >= G.goal) { log(`🏆 ${nm(p)} reaches <b>${G.goal}</b> points!`); finish(false, p); } }
      function trade(p, give, get) { p.res[give] -= G.rate; p.res[get]++; SFX.play('chip'); log(`${nm(p)} trades ${G.rate} ${RN[give]} for 1 ${RN[get]}.`); render(); }

      /* ----- trading between players ----- */
      // what each card is worth to a player right now: more if their next building needs it, less if they have plenty
      function wants(p) {
        // saving for a town, or for a village (plus an extra road's worth if there is no village spot yet)
        const spot = G.V.some((v) => canVillage(G, v.i, p.i));
        const target = count(G, p.i, 1) && p.res.S + p.res.G >= 3 ? COST.town : { T: spot ? 1 : 2, C: spot ? 1 : 2, W: 1, G: 1 };
        const w = {};
        RES.forEach((r) => { const short = (target[r] || 0) - p.res[r], extra = p.res[r] - (target[r] || 0); w[r] = 1 + (short > 0 ? 1.4 : 0) - (extra >= 2 ? 0.5 : 0); });
        return w;
      }
      const worth = (w, bundle) => RES.reduce((sum, r) => sum + (bundle[r] || 0) * w[r], 0);
      const bundleText = (b) => RES.filter((r) => b[r]).map((r) => `${b[r]} ${RN[r]}`).join(' + ');
      const has = (p, b) => RES.every((r) => p.res[r] >= (b[r] || 0));
      // would bot b hand over `give` to receive `get`?
      function botAccepts(b, from, give, get) {
        if (!has(b, give)) return false;
        if (vp(G, from.i) >= G.goal - 2 && vp(G, from.i) > vp(G, b.i)) return false; // nobody helps a player about to win
        const w = wants(b);
        return worth(w, get) - worth(w, give) >= (G.lvl === 2 ? 0.4 : 0.1);
      }
      // a and b swap cards; the cards fly across the table both ways
      function swap(a, b, aGives, bGives) {
        RES.forEach((r) => { const x = aGives[r] || 0, y = bGives[r] || 0; a.res[r] += y - x; b.res[r] += x - y; });
        G.trades++; if (isMe(a) || isMe(b)) G.myTrades = (G.myTrades || 0) + 1;
        log(`🤝 ${nm(a)} gives ${bundleText(aGives)} to ${nm(b)} for ${bundleText(bGives)}.`);
        SFX.play('coin'); render();
        const at = (p, r) => (isMe(p) ? `#fi-r-${r}` : `#fi-pl-${p.i}`);
        let k = 0;
        RES.forEach((r) => { for (let n = 0; n < (aGives[r] || 0); n++) gFly(at(a, r), at(b, r), resIcon(r, 22), { ms: 620, delay: k++ * 110, arc: 30 }); });
        RES.forEach((r) => { for (let n = 0; n < (bGives[r] || 0); n++) gFly(at(b, r), at(a, r), resIcon(r, 22), { ms: 620, delay: k++ * 110, arc: -30 }); });
      }
      // your offer: what you give, what you want (resolves with {give, get}, or null for Cancel)
      function offerUI(p) {
        const give = {}, get = {};
        return new Promise((res) => {
          const paint = () => {
            const row = (side, b) => RES.map((r) => `<div class="fi-of"><span>${resIcon(r, 22)}</span><b class="pix">${b[r] || 0}</b><span class="flex gap-1"><button data-s="${side}" data-r="${r}" data-d="-1" class="fi-step">−</button><button data-s="${side}" data-r="${r}" data-d="1" class="fi-step">+</button></span></div>`).join('');
            prompt(`<div class="space-y-2 text-left"><div class="font-bold text-bone text-sm">Trade with the other players</div>
              <div class="pix text-xs text-coral">YOU GIVE</div><div class="fi-offer">${row('give', give)}</div>
              <div class="pix text-xs text-emerald">YOU WANT</div><div class="fi-offer">${row('get', get)}</div>
              <div class="flex gap-2 justify-center"><button id="fi-send" class="btn-game btn-amber py-1.5 px-5 text-sm">Offer to the table</button><button id="fi-cx" class="btn-game btn-graphite py-1.5 px-4 text-sm">Cancel</button></div></div>`);
            document.querySelectorAll('#fi-prompt .fi-step').forEach((b) => { b.onclick = () => {
              const side = b.dataset.s === 'give' ? give : get, other = b.dataset.s === 'give' ? get : give, r = b.dataset.r, d = +b.dataset.d;
              const nv = (side[r] || 0) + d;
              if (nv < 0 || (b.dataset.s === 'give' && nv > p.res[r]) || nv > 9) return SFX.play('wrong');
              side[r] = nv; if (nv > 0) other[r] = 0; SFX.play('click'); paint();
            }; });
            $('fi-send').onclick = () => {
              if (!RES.some((r) => give[r])) return showToast('Pick at least one card to give.', 'error');
              if (!RES.some((r) => get[r])) return showToast('Pick at least one card you want.', 'error');
              res({ give, get });
            };
            $('fi-cx').onclick = () => res(null);
          };
          paint();
        });
      }
      const cleanB = (b) => { const o = {}; RES.forEach((r) => { const v = Math.floor(+((b || {})[r]) || 0); if (v > 0 && v < 10) o[r] = v; }); return o; };
      // an offer goes to the whole table; everyone answers at once (you get Accept / No thanks), then the
      // player who offered picks a partner among those who said yes
      async function tableOffer(p, give, get) {
        const NS = G.S, key = 'of' + G.turn + '_' + (++G.offerN);
        if (!RES.some((r) => give[r]) || !RES.some((r) => get[r]) || !has(p, give)) return;
        log(`${nm(p)} offers ${bundleText(give)} for ${bundleText(get)}.`);
        const others = G.players.filter((b) => b !== p).map((b) => b.i), me = G.players[G.me];
        if (others.includes(G.me) && NS.mine(G.me)) {
          if (!has(me, get)) NS.act({ t: 'ans', key, v: false });
          else {
            let done = false; const fin = (v) => { if (done) return; done = true; prompt('<span class="text-muted">Waiting for the others to answer...</span>'); NS.act({ t: 'ans', key, v }); };
            prompt(`<div class="flex items-center justify-center gap-2 flex-wrap">${p.av} <b>${esc(p.name)}</b> offers you <b class="text-emerald">${bundleText(give)}</b> for your <b class="text-coral">${bundleText(get)}</b>.
              <button id="fi-acc" class="btn-game btn-emerald py-1.5 px-4 text-sm">Accept</button><button id="fi-dec" class="btn-game btn-graphite py-1.5 px-4 text-sm">No thanks</button></div>`);
            $('fi-acc').onclick = () => fin(true); $('fi-dec').onclick = () => fin(false);
            gTimeout(() => fin(false), window.__fast ? 50 : 15000);
          }
        } else if (isMe(p)) prompt('Asking the table...');
        const got = await NS.collect(key, others, (i) => ({ t: 'ans', v: botAccepts(G.players[i], p, get, give) }), () => ({ t: 'ans', v: false }), 20);
        if (!G) throw ABORT;
        const yes = others.filter((i) => got[i] && got[i].v === true && has(G.players[i], get));
        const lines = others.map((i) => `<span class="ml-2">${G.players[i].av} ${yes.includes(i) ? '<b class="text-emerald">Deal!</b>' : '<span class="text-coral">No thanks</span>'}</span>`);
        if (!yes.length) { log('Nobody takes the deal.'); SFX.play('nope'); prompt(`Nobody wants that deal. ${lines.join(' ')}`); await W(1300); prompt(''); return; }
        let w;
        if (yes.length === 1 && !mine(p)) w = yes[0];
        else {
          waiting(p, 'is choosing who to trade with');
          w = +(await decide(p, 'with', () => new Promise((res) => {
            prompt(`<div>${lines.join(' ')}</div><div class="flex gap-2 justify-center flex-wrap mt-2">${yes.map((i) => `<button data-w="${i}" class="btn-game btn-teal py-1.5 px-3 text-sm">Trade with ${G.players[i].av} ${esc(G.players[i].name)}</button>`).join('')}<button id="fi-cx2" class="btn-game btn-graphite py-1.5 px-3 text-sm">Never mind</button></div>`);
            document.querySelectorAll('#fi-prompt [data-w]').forEach((x) => { x.onclick = () => res(+x.dataset.w); });
            $('fi-cx2').onclick = () => res(-1);
          }), () => yes[0], 300));
        }
        prompt('');
        const who = yes.includes(w) ? G.players[w] : null;
        if (who && has(p, give) && has(who, get)) { swap(p, who, give, get); await W(600); }
      }

      // the building part of a turn: one decision at a time (build / bank trade / offer / end turn)
      async function buildPhase(p) {
        G.botOffers = 0;
        for (let guard = 0; guard < 40 && !G.over; guard++) {
          waiting(p, 'is building');
          const a = await decide(p, 'b', () => humanStep(p), () => botStep(p), 650) || { k: 'end' };
          if (a.k === 'build') { const L = legal(G, p)[a.kind]; if (L && L.includes(+a.id)) doBuild(p, a.kind, +a.id); if (G.over) return; continue; }
          if (a.k === 'bank') { if (RES.includes(a.give) && RES.includes(a.get) && a.give !== a.get && p.res[a.give] >= G.rate) trade(p, a.give, a.get); continue; }
          if (a.k === 'offer') { await tableOffer(p, cleanB(a.give), cleanB(a.get)); continue; }
          break;
        }
        if (mine(p)) { G.building = false; prompt(''); render(); }
      }
      // your side of one building decision
      function humanStep(p) {
        return new Promise((res) => {
          const done = (v) => { G.building = false; G.act = G.endTurn = G.offer = G.bank = null; render(); res(v); };
          const show = () => { G.building = true; prompt('Build, trade, or <b>end your turn</b>.'); render(); };
          G.act = async (kind) => {
            if (!G || G.over || !G.building) return;
            const L = legal(G, p)[kind];
            if (!L.length) { SFX.play('wrong'); return showToast(afford(p, COST[kind]) ? `No legal spot for a ${kind} right now.` : `You need ${costText(COST[kind])} for a ${kind}.`, 'error'); }
            G.building = false; render();
            const id = await pickOnBoard(kind === 'road' ? 'e' : 'v', L, `Tap where to build your <b>${kind}</b>. <button id="fi-cancel" class="btn-game btn-graphite py-1 px-3 text-xs ml-2">Cancel</button>`);
            if (id === -1) return show();
            done({ k: 'build', kind, id });
          };
          G.offer = () => { if (!G.building || G.over) return; G.building = false; render(); offerUI(p).then((d) => { if (!G) return; if (d) done({ k: 'offer', give: d.give, get: d.get }); else show(); }); };
          G.bank = (give, get) => done({ k: 'bank', give, get });
          G.endTurn = () => { prompt(''); done({ k: 'end' }); };
          show();
        });
      }
      // a computer player's next step
      function botStep(p) {
        if (G.botOffers === 0) { G.botOffers = 1; if (Math.random() < (G.lvl === 2 ? 0.6 : 0.4)) { const o = botOfferPlan(p, 1); if (o) return o; } }
        else if (G.botOffers === 1 && G.botOfferFailed) { G.botOffers = 2; const o = botOfferPlan(p, 2); if (o) return o; }
        G.botOfferFailed = false;
        const L = legal(G, p);
        if (L.town.length) return { k: 'build', kind: 'town', id: L.town.sort((a, b) => vScore(G, b) - vScore(G, a))[0] };
        if (L.village.length) return { k: 'build', kind: 'village', id: L.village.sort((a, b) => vScore(G, b, p.i) - vScore(G, a, p.i))[0] };
        const spots = G.V.some((v) => canVillage(G, v.i, p.i));
        if (L.road.length && (!spots || total(p) > 5) && (G.lvl === 2 || Math.random() < 0.6)) { const e = bestRoadToward(G, p.i); if (e !== null) return { k: 'build', kind: 'road', id: e }; }
        // trade surplus for what the next building needs
        const want = afford(p, COST.town) ? null : count(G, p.i, 1) && (p.res.S >= 2 || p.res.G >= 2) ? COST.town : COST.village;
        if (want) {
          const need = Object.keys(want).find((r) => p.res[r] < want[r]);
          const spare = RES.filter((r) => p.res[r] >= G.rate + (want[r] || 0)).sort((a, b) => p.res[b] - p.res[a])[0];
          if (need && spare) return { k: 'bank', give: spare, get: need };
        }
        return { k: 'end' };
      }
      // a computer player asks the table for a card it needs, offering one (or two) it has spare
      function botOfferPlan(p, amt) {
        const w = wants(p);
        const need = RES.filter((r) => w[r] > 1.5).sort((a, b) => w[b] - w[a])[0];
        const spare = RES.filter((r) => p.res[r] >= 2 && w[r] <= 1).sort((a, b) => p.res[b] - p.res[a])[0];
        if (!need || !spare || p.res[spare] < amt) return null;
        G.botOfferFailed = true;
        return { k: 'offer', give: { [spare]: amt }, get: { [need]: 1 } };
      }
      const costText = (c) => Object.keys(c).map((r) => `${c[r]} ${RN[r]}`).join(' + ');

      function finish(gaveUp, winner) {
        if (G.over) return; G.over = true; G.S.over = true; G.pick = null;
        const me = G.players[G.me], won = !gaveUp && winner === me, mi = G.me;
        const rank = G.players.slice().sort((a, b) => vp(G, b.i) - vp(G, a.i));
        const lvl = G.players.length - 3, elo = G.S.online ? 0 : won ? [12, 16][lvl] + (G.lvl - 1) * 4 : [-5, -6][lvl];
        const s = gstat('isles'); s.best = Math.max(s.best || 0, vp(G, mi)); s.towns = (s.towns || 0) + count(G, mi, 2); s.longest = (s.longest || 0) + (G.lr === mi ? 1 : 0); s.trades = (s.trades || 0) + (G.myTrades || 0);
        reportGame('isles', won ? 'win' : 'loss', { elo, xp: won ? 45 + lvl * 10 : 15, label: gaveUp ? 'Gave up' : `${G.S.online ? 'Online · ' : ''}${vp(G, mi)} points · ${winner.name} won` });
        SFX.play(won ? 'win' : 'lose'); render();
        gTimeout(() => gameResult({ title: won ? 'You rule the isles!' : gaveUp ? 'You gave up' : `${winner.name} wins`, sub: `First to ${G.goal} points.`, tone: won ? 'amber' : 'coral', sprite: won ? 'trophy' : 'anchor',
          rows: [...rank.map((p) => [p.name, vp(G, p.i) + ' pts', isMe(p) ? 'text-amber' : 'text-bone']), ['Your trades', G.myTrades || 0, 'text-teal']], againLabel: G.S.online ? 'Back to setup' : 'New island', again: () => open($('game-root')) }), gaveUp ? 0 : 900);
      }

      /* ---------- drawing ---------- */
      const ICON = {
        T: '<rect x="10" y="15" width="4" height="6" fill="#7A4A21"/><path d="M12 2 L19 15 H5 Z" fill="#1F6B42"/><path d="M12 6 L16 13 H8 Z" fill="#34D399"/>',
        C: '<rect x="3" y="6" width="8" height="5" fill="#C8643F"/><rect x="13" y="6" width="8" height="5" fill="#C8643F"/><rect x="8" y="13" width="8" height="5" fill="#9C4630"/><rect x="3" y="13" width="3" height="5" fill="#9C4630"/><rect x="18" y="13" width="3" height="5" fill="#9C4630"/>',
        W: '<rect x="5" y="8" width="13" height="8" fill="#F7F4EC"/><rect x="16" y="6" width="5" height="5" fill="#050E18"/><rect x="7" y="16" width="2" height="4" fill="#050E18"/><rect x="14" y="16" width="2" height="4" fill="#050E18"/>',
        G: '<rect x="11" y="6" width="2" height="15" fill="#C9A133"/><rect x="7" y="4" width="3" height="5" fill="#E9C352"/><rect x="14" y="4" width="3" height="5" fill="#E9C352"/><rect x="10" y="2" width="4" height="5" fill="#F5B041"/><rect x="7" y="10" width="3" height="4" fill="#E9C352"/><rect x="14" y="10" width="3" height="4" fill="#E9C352"/>',
        S: '<path d="M2 20 L9 7 L13 13 L16 9 L22 20 Z" fill="#8E9CAD"/><path d="M9 7 L11 11 L7 11 Z" fill="#F7F4EC"/>',
      };
      const resIcon = (t, sz) => `<span class="fi-card" style="width:${sz}px;height:${Math.round(sz * 1.3)}px"><svg viewBox="0 0 24 24" width="${sz - 4}" height="${sz - 4}" shape-rendering="crispEdges">${t ? ICON[t] : '<rect x="6" y="4" width="12" height="16" fill="#2B4F75"/><rect x="9" y="8" width="6" height="2" fill="#9DB4CC"/>'}</svg></span>`;
      function hexPts(h, s = SZ) { let o = ''; for (let c = 0; c < 6; c++) { const a = Math.PI / 180 * (60 * c - 30); o += `${(h.x + s * Math.cos(a)).toFixed(1)},${(h.y + s * Math.sin(a)).toFixed(1)} `; } return o; }
      function terrainArt(h) {
        const x = h.x, y = h.y, d = TER[h.t][2]; let o = '';
        const sp = [[-24, -14], [20, -18], [-18, 18], [24, 14], [0, -30], [0, 28]];
        if (h.t === 'T') sp.forEach(([dx, dy]) => { o += `<path d="M${x + dx} ${y + dy - 9} l6 11 h-12 z" fill="${d}"/><rect x="${x + dx - 1}" y="${y + dy + 2}" width="2" height="3" fill="#5B3A1C"/>`; });
        if (h.t === 'C') sp.forEach(([dx, dy]) => { o += `<rect x="${x + dx - 6}" y="${y + dy - 3}" width="6" height="4" fill="${d}"/><rect x="${x + dx + 1}" y="${y + dy - 3}" width="6" height="4" fill="${d}"/>`; });
        if (h.t === 'W') sp.forEach(([dx, dy]) => { o += `<rect x="${x + dx - 4}" y="${y + dy - 3}" width="8" height="5" fill="#F7F4EC"/><rect x="${x + dx + 3}" y="${y + dy - 4}" width="3" height="3" fill="#050E18"/>`; });
        if (h.t === 'G') sp.forEach(([dx, dy]) => { o += `<rect x="${x + dx - 5}" y="${y + dy - 6}" width="2" height="10" fill="${d}"/><rect x="${x + dx}" y="${y + dy - 7}" width="2" height="11" fill="${d}"/><rect x="${x + dx + 5}" y="${y + dy - 6}" width="2" height="10" fill="${d}"/>`; });
        if (h.t === 'S') [[-20, -8], [18, -10], [0, 20], [-4, -28]].forEach(([dx, dy]) => { o += `<path d="M${x + dx - 12} ${y + dy + 7} l12 -16 l12 16 z" fill="${d}"/><path d="M${x + dx} ${y + dy - 9} l4 5 h-8 z" fill="#F7F4EC"/>`; });
        if (h.t === 'D') [[-20, -12], [18, 16], [10, -24]].forEach(([dx, dy]) => { o += `<rect x="${x + dx - 2}" y="${y + dy - 8}" width="4" height="14" fill="#7FA35A"/><rect x="${x + dx - 6}" y="${y + dy - 4}" width="4" height="2" fill="#7FA35A"/><rect x="${x + dx + 2}" y="${y + dy - 6}" width="4" height="2" fill="#7FA35A"/>`; });
        return o;
      }
      const house = (x, y, col, l, fresh) => l === 1
        ? `<g class="${fresh ? 'fi-pop' : ''}" style="transform-origin:${x}px ${y}px"><path d="M${x - 9} ${y + 8} V${y - 2} L${x} ${y - 11} L${x + 9} ${y - 2} V${y + 8} Z" fill="${col}" stroke="#050E18" stroke-width="3" stroke-linejoin="miter"/><rect x="${x - 2}" y="${y + 1}" width="4" height="7" fill="#050E18"/></g>`
        : `<g class="${fresh ? 'fi-pop' : ''}" style="transform-origin:${x}px ${y}px"><path d="M${x - 13} ${y + 10} V${y - 3} L${x - 6} ${y - 11} L${x + 1} ${y - 3} V${y - 6} H${x + 13} V${y + 10} Z" fill="${col}" stroke="#050E18" stroke-width="3"/><rect x="${x - 8}" y="${y + 2}" width="4" height="8" fill="#050E18"/><rect x="${x + 5}" y="${y - 1}" width="4" height="4" fill="#050E18"/></g>`;
      function render() {
        if (!G) return;
        const svg = $('fi-board'); if (!svg) return;
        const xs = G.V.map((v) => v.x), ys = G.V.map((v) => v.y), pad = 34;
        const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, w = Math.max(...xs) - x0 + pad, h = Math.max(...ys) - y0 + pad;
        svg.setAttribute('viewBox', `${x0} ${y0} ${w} ${h}`);
        const pk = G.pick;
        let o = `<polygon points="${hexPts({ x: 0, y: 0 }, SZ * 5.05).replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (m, a, b) => `${b},${a}`)}" fill="#E5D5A6" stroke="#050E18" stroke-width="4"/>`;
        G.H.forEach((hx) => {
          const can = pk && pk.kind === 'h' && pk.ids.has(hx.i);
          o += `<g id="fi-h-${hx.i}" class="${can ? 'fi-pickh' : ''}" data-h="${hx.i}"><polygon points="${hexPts(hx, SZ - 1.5)}" fill="${TER[hx.t][1]}" stroke="#050E18" stroke-width="3"/>${terrainArt(hx)}`;
          if (hx.n) { const hot = hx.n === 6 || hx.n === 8; o += `<circle cx="${hx.x}" cy="${hx.y}" r="15" fill="#F7F4EC" stroke="#050E18" stroke-width="3"/><text x="${hx.x}" y="${hx.y + 4}" text-anchor="middle" font-family="Arcade Pixel, monospace" font-size="17" fill="${hot ? '#D13B55' : '#050E18'}">${hx.n}</text>`; for (let k = 0; k < DOTS(hx.n); k++) o += `<rect x="${hx.x - DOTS(hx.n) * 2 + k * 4 + 0.5}" y="${hx.y + 7}" width="2.5" height="2.5" fill="${hot ? '#D13B55' : '#050E18'}"/>`; }
          if (G.robber === hx.i) o += `<g class="fi-bandit"><rect x="${hx.x + 10}" y="${hx.y - 18}" width="12" height="22" fill="#050E18"/><rect x="${hx.x + 12}" y="${hx.y - 26}" width="8" height="8" fill="#050E18"/><rect x="${hx.x + 13}" y="${hx.y - 23}" width="6" height="2" fill="#FB7185"/></g>`;
          if (can) o += `<polygon points="${hexPts(hx, SZ - 6)}" fill="none" stroke="#F5B041" stroke-width="4" stroke-dasharray="6 5" class="fi-glow"/>`;
          o += '</g>';
        });
        G.E.forEach((e) => {
          const a = G.V[e.a], b = G.V[e.b], ow = G.road[e.i];
          if (ow !== undefined) o += `<g class="${G.fresh === 'e' + e.i ? 'fi-pop' : ''}" style="transform-origin:${(a.x + b.x) / 2}px ${(a.y + b.y) / 2}px"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#050E18" stroke-width="11" stroke-linecap="square" transform="scale(.78)" transform-origin="${(a.x + b.x) / 2} ${(a.y + b.y) / 2}"/><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${G.players[ow].col}" stroke-width="6" stroke-linecap="square" transform="scale(.74)" transform-origin="${(a.x + b.x) / 2} ${(a.y + b.y) / 2}"/></g>`;
          if (pk && pk.kind === 'e' && pk.ids.has(e.i)) o += `<line class="fi-picke" data-e="${e.i}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="transparent" stroke-width="26" transform="scale(.7)" transform-origin="${(a.x + b.x) / 2} ${(a.y + b.y) / 2}"/><line class="fi-picke" data-e="${e.i}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#F5B041" stroke-width="9" stroke-dasharray="5 5" transform="scale(.7)" transform-origin="${(a.x + b.x) / 2} ${(a.y + b.y) / 2}"/>`;
        });
        G.V.forEach((v) => {
          const b = G.bld[v.i];
          if (b) o += house(v.x, v.y, G.players[b.p].col, b.l, G.fresh === 'v' + v.i);
          if (pk && pk.kind === 'v' && pk.ids.has(v.i)) o += `<g class="fi-pickv" data-v="${v.i}"><circle cx="${v.x}" cy="${v.y}" r="19" fill="transparent"/><rect x="${v.x - 6}" y="${v.y - 6}" width="12" height="12" fill="#F5B041" stroke="#050E18" stroke-width="2.5" class="fi-glow"/></g>`;
        });
        svg.innerHTML = o; G.fresh = null;
        svg.querySelectorAll('.fi-pickv').forEach((el) => { el.onclick = () => resolvePick('v', +el.dataset.v); });
        svg.querySelectorAll('.fi-picke').forEach((el) => { el.onclick = () => resolvePick('e', +el.dataset.e); });
        svg.querySelectorAll('.fi-pickh').forEach((el) => { el.onclick = () => resolvePick('h', +el.dataset.h); });
        const cancel = $('fi-cancel'); if (cancel) cancel.onclick = () => { if (G.pick) { const r = G.pick.res; G.pick = null; prompt(''); r(-1); } };
        // side panel
        const lens = G.players.map((_, i) => longest(G, i));
        $('fi-players').innerHTML = G.players.map((p) => `<div id="fi-pl-${p.i}" class="fi-pl ${G.cur === p.i && !G.over ? 'turn' : ''}"><div class="flex items-center justify-between gap-2"><span class="font-display font-extrabold text-sm"><span class="fi-sw" style="background:${p.col}"></span>${p.av} ${esc(p.name)}</span><span class="pix text-amber">${vp(G, p.i)} / ${G.goal}</span></div>
          <div class="text-xs text-muted mt-1">🂠 ${total(p)} cards · 🏠 ${count(G, p.i, 1)} · 🏰 ${count(G, p.i, 2)} · road ${lens[p.i]}${G.lr === p.i ? ' <b class="text-emerald">LONGEST</b>' : ''}</div></div>`).join('');
        const me = G.players[G.me];
        $('fi-res').innerHTML = RES.map((r) => `<div class="fi-rc" id="fi-r-${r}" title="${RN[r]}">${resIcon(r, 30)}<span class="pix">${me.res[r]}</span><span class="fi-rn">${RN[r]}</span></div>`).join('');
        $('fi-vp').textContent = `${vp(G, G.me)} / ${G.goal} POINTS`;
        drawDice(false);
        const can = G.building && !G.over, L = can ? legal(G, me) : { road: [], village: [], town: [] };
        $('fi-build').innerHTML = [['road', 'Road'], ['village', 'Village'], ['town', 'Town']].map(([k, lab]) => `<button data-b="${k}" class="btn-game ${L[k].length ? 'btn-amber' : 'btn-graphite'} py-1.5 px-1 text-xs flex flex-col items-center gap-1" ${can ? '' : 'disabled'}><span class="text-sm">${lab}</span><span class="fi-cost">${Object.keys(COST[k]).map((r) => `${'<i></i>'.repeat(0)}${resIcon(r, 13).repeat(COST[k][r])}`).join('')}</span></button>`).join('');
        $('fi-build').querySelectorAll('[data-b]').forEach((b) => { b.onclick = () => { if (G.act) G.act(b.dataset.b); }; });
        $('fi-trade').innerHTML = `<div class="flex items-center gap-2 flex-wrap text-xs"><span class="pix text-muted">BANK ${G.rate}:1</span><select id="fi-give" class="fi-sel"><option value="" disabled ${RES.some((r) => me.res[r] >= G.rate) ? '' : 'selected'}>Give…</option>${RES.map((r) => `<option value="${r}" ${me.res[r] >= G.rate ? '' : 'disabled'}>${G.rate} ${RN[r]}</option>`).join('')}</select><span>→</span><select id="fi-get" class="fi-sel">${RES.map((r) => `<option value="${r}">1 ${RN[r]}</option>`).join('')}</select><button id="fi-do" class="btn-game btn-graphite py-1 px-3 text-xs" ${can ? '' : 'disabled'}>Trade</button></div>
          <button id="fi-ptrade" class="btn-game btn-teal w-full py-1.5 text-sm mt-2" ${can ? '' : 'disabled'}>🤝 Trade with players</button>`;
        const giveSel = $('fi-give'); const first = RES.find((r) => me.res[r] >= G.rate); if (first) giveSel.value = first;
        $('fi-ptrade').onclick = () => { if (G.offer) G.offer(); };
        $('fi-do').onclick = () => { const gv = $('fi-give').value, gt = $('fi-get').value; if (!G.building) return; if (!gv) return showToast(`You need ${G.rate} of one resource to trade with the bank.`, 'error'); if (me.res[gv] < G.rate) return showToast(`You need ${G.rate} ${RN[gv]} to trade.`, 'error'); if (gv === gt) return showToast('Pick a different resource to get.', 'error'); if (G.bank) G.bank(gv, gt); };
        const end = $('fi-end'); end.disabled = !can; end.onclick = () => { if (G.endTurn) G.endTurn(); };
      }
      function drawDice(rolling) {
        const el = $('fi-dice'); if (!el) return;
        const f = (v) => `<div class="fi-die ${rolling ? 'roll' : ''}">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => `<i class="${({ 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] })[v].includes(k) ? 'on' : ''}"></i>`).join('')}</div>`;
        el.innerHTML = f(G.dice[0]) + f(G.dice[1]);
      }

      const K = '#050E18', rr = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
      GICONS.isles = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(0, 0, 24, 24, '#1F5F93')}${rr(4, 5, 16, 14, K)}${rr(6, 3, 12, 18, K)}${rr(5, 6, 14, 12, '#E9C352')}${rr(7, 4, 10, 16, '#E9C352')}${rr(7, 6, 5, 6, '#2E8B57')}${rr(12, 12, 5, 6, '#C8643F')}${rr(12, 6, 5, 6, '#8E9CAD')}${rr(7, 12, 5, 6, '#8BCB6A')}${rr(10, 9, 4, 4, '#F5B041')}${rr(11, 8, 2, 1, K)}</svg>`;
      const mod = {
        id: 'isles', name: 'Frontier Isles', icon: 'isles', cats: ['board'], sub: '3-4 PLAYERS · ~25 MIN', color: '#34D399', tone: 'emerald', btn: 'emerald',
        blurb: 'Settle a hex island: collect timber, clay, wool, grain and stone, build roads, villages and towns, and race your rivals to the target score.',
        rules: { tag: 'BUILD & TRADE', steps: [
          '<strong class="text-bone">Setup:</strong> Everyone places 2 villages and 2 roads (the order snakes back). Villages must have a free corner all around them. Your second village gives you one card for each land it touches.',
          '<strong class="text-bone">Roll &amp; collect:</strong> On your turn roll two dice. Every land showing that number pays its resource to each village (1) or town (2) on its corners. 6 and 8 come up the most.',
          '<strong class="text-bone">Build:</strong> Road = timber + clay. Village = timber + clay + wool + grain (1 point). Town = 2 grain + 3 stone, upgrades a village (2 points). Trade 4 of one resource for 1 of another with the bank, or make any offer to the other players: they accept if it helps them.',
          '<strong class="text-bone">The Bandit:</strong> Roll a 7 and anyone with more than 7 cards drops half. Then move the Bandit to block a land and steal a card from someone there. The longest unbroken road of 5+ is worth 2 points. First to the target wins.',
        ], tip: 'Spread your villages over different resources and numbers. Clay and timber early, stone and grain later for towns.' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['BEST SCORE', s.best || 0, 'text-emerald'], ['TOWNS BUILT', s.towns || 0, 'text-teal']],
        extraRows: (s) => srow('Longest Road held at the end', s.longest || 0) + srow('Trades with players', s.trades || 0),
        online: { seats: (sel) => +sel.n || 3, min: 2, ranked: false, start: (body, sel, S) => start(body, sel, S) },
        engine: { makeIsland, canVillage, canRoad, longest, vp, wants, botAccepts, state: () => G }, open, close() { G = null; },
      };
      registerGame(mod);
    })();

