    /* =========================================================================
       BUMP OFF (Nov 2026, Inna's design; prototype prototypes/round8/bump-off.html, approved)
       Bumper boats on a round pond. Every turn: everyone secretly plans a direction + power (all boats stay visible, only
       the plans are secret) → the plans are revealed as arrows → everyone moves at once and bumps; anyone knocked off the
       pond is out. Last boat floating wins the round, first to N round wins takes the match.
       Setting SPAWN: random spots / around the edge (fair) / close together (chaos). The pond shrinks a little every turn
       after the 2nd (setting). 2-6 players, computer players (Easy / Smart), online tables.
       Online: plans come in through S.collect (every screen stores them, but only draws them at the reveal). The movement
       is a fixed-step simulation that uses only + - * / and sqrt (no trig, no exp), so every screen computes the same
       thing; the host's end positions are then sent as a table decision ('end') and every screen snaps to them anyway.
       ========================================================================= */
    (function bumpOffGame() {
      const ABORT = { a: 1 };
      const W = 360, H = 380, CX = 180, CY = 196, R0 = 150, RAD = 12, VMAX = 330, DRAG = 1.5, STEP = 1 / 120;
      const KD = 0.9875778004938814;                  // = exp(-DRAG * STEP), written out so every screen uses the same number
      const COLORS = [['#2DD4BF', '#0E7C70'], ['#FB7185', '#A33447'], ['#F5B041', '#9C6512'], ['#A78BFA', '#5B45A8'], ['#34D399', '#16774F'], ['#7DD3FC', '#2B6F99']];
      const BOTS = [['Luna', '🦉'], ['Bao', '🐻'], ['Minh', '🐸'], ['Kai', '🦈'], ['Mai', '🐼']];
      let G = null;
      const $ = (id) => document.getElementById(id);
      const T = (en, vi) => (typeof LANG !== 'undefined' && LANG.code === 'vi' ? vi : en);
      const dist = (ax, ay, bx, by) => Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
      const reach = (v) => v / DRAG;                     // how far a boat glides from speed v with nobody in the way

      // ---------- engine (pure; also used by the tests) ----------
      function spawn(n, mode, rng) {
        const pos = [];
        if (mode === 'ring') {
          const a0 = rng.random() * 6.2832;
          for (let i = 0; i < n; i++) { const a = a0 + i * 6.2832 / n; pos.push([CX + Math.cos(a) * R0 * 0.68, CY + Math.sin(a) * R0 * 0.68]); }
        } else {
          const rmax = mode === 'close' ? R0 * 0.36 : R0 * 0.72, gap = mode === 'close' ? 30 : 56;
          for (let i = 0; i < n; i++) {
            let x, y, k = 0;
            do { const a = rng.random() * 6.2832, r = Math.sqrt(rng.random()) * rmax; x = CX + Math.cos(a) * r; y = CY + Math.sin(a) * r; k++; }
            while (k < 300 && pos.some((p) => dist(p[0], p[1], x, y) < gap));
            pos.push([x, y]);
          }
        }
        return pos.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
      }
      // boats: [{x, y, alive}], plans: [{vx, vy}] → frames (positions every few steps) + the end state + who went out
      function simulate(boats, plans, R) {
        const b = boats.map((q, i) => ({ x: q.x, y: q.y, vx: q.alive && plans[i] ? plans[i].vx : 0, vy: q.alive && plans[i] ? plans[i].vy : 0, alive: q.alive, outAt: -1 }));
        const frames = [], bumps = [];
        for (let s = 0; s < 960; s++) {
          for (const q of b) { if (!q.alive) continue; q.vx *= KD; q.vy *= KD; q.x += q.vx * STEP; q.y += q.vy * STEP;
            if (dist(q.x, q.y, CX, CY) > R + RAD * 0.5) { q.alive = false; q.outAt = s; } }
          for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
            const p = b[i], q = b[j]; if (!p.alive || !q.alive) continue;
            const dx = q.x - p.x, dy = q.y - p.y, d = Math.sqrt(dx * dx + dy * dy); if (d >= RAD * 2 || d === 0) continue;
            const nx = dx / d, ny = dy / d, ov = RAD * 2 - d; p.x -= nx * ov / 2; p.y -= ny * ov / 2; q.x += nx * ov / 2; q.y += ny * ov / 2;
            const rv = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny; if (rv > 0) continue;
            const jj = -rv * 0.96; p.vx -= nx * jj; p.vy -= ny * jj; q.vx += nx * jj; q.vy += ny * jj;     // bouncy rubber bumpers
            if (-rv > 40) bumps.push([s, (p.x + q.x) / 2, (p.y + q.y) / 2, -rv]);
          }
          if (s % 2 === 0) frames.push(b.map((q) => [q.x, q.y, q.alive ? 1 : 0, q.vx, q.vy]));
          if (s > 20 && b.every((q) => !q.alive || q.vx * q.vx + q.vy * q.vy < 9)) break;
        }
        frames.push(b.map((q) => [q.x, q.y, q.alive ? 1 : 0, 0, 0]));
        return { frames, bumps, end: b.map((q) => ({ x: Math.round(q.x * 100) / 100, y: Math.round(q.y * 100) / 100, alive: q.alive })), outs: b.map((q, i) => (boats[i].alive && !q.alive ? i : -1)).filter((i) => i >= 0) };
      }
      // the computer captains plan from where the boats are NOW (they can't see anyone's plan either)
      function botPlan(i, boats, R, lvl, rnd) {
        const me = boats[i], live = boats.map((b, k) => [b, k]).filter(([b, k]) => b.alive && k !== i);
        if (!live.length) return { vx: 0, vy: 0 };
        const noise = lvl >= 2 ? 0.22 : 0.55, dc = dist(me.x, me.y, CX, CY);
        const go = (a, pow) => ({ vx: Math.round(Math.cos(a) * pow * VMAX * 100) / 100, vy: Math.round(Math.sin(a) * pow * VMAX * 100) / 100 });
        if (dc > R * 0.75 && rnd() < 0.65) return go(Math.atan2(CY - me.y, CX - me.x) + (rnd() - 0.5) * 0.6, 0.3 + rnd() * 0.3);       // near the edge: back in
        if (rnd() < (lvl >= 2 ? 0.15 : 0.25)) return go(rnd() * 6.2832, 0.15 + rnd() * 0.25);                                              // a small dodge
        // pick someone: a Smart captain prefers whoever is closest to the edge
        const tg = lvl >= 2 ? live.sort((p, q) => dist(q[0].x, q[0].y, CX, CY) - dist(p[0].x, p[0].y, CX, CY))[rnd() < 0.7 ? 0 : live.length - 1][0] : live[Math.floor(rnd() * live.length)][0];
        const d = dist(tg.x, tg.y, me.x, me.y), need = (d + 40) * DRAG / VMAX;
        return go(Math.atan2(tg.y - me.y, tg.x - me.x) + (rnd() - 0.5) * noise, Math.max(0.35, Math.min(1, need * (0.85 + rnd() * 0.4))));
      }

      // ---------- setup ----------
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1150px] mx-auto');
        setupScreen(body, mod, [
          { key: 'spawn', label: 'WHERE BOATS START', def: 'random', hero: true, hint: 'Random: anywhere on the pond, a new spread every round. Around the edge: evenly spaced, fair for everyone. Close together: everyone starts in the middle, pure chaos!', choices: [['random', '🎲 Random spots'], ['ring', '⭕ Around the edge'], ['close', '💥 Close together']] },
          { key: 'n', label: 'PLAYERS', def: 4, choices: [[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']] },
          { key: 'to', label: 'ROUNDS TO WIN', def: 3, choices: [[2, '2'], [3, '3'], [5, '5']] },
          { key: 'secs', label: 'PLANNING TIME', def: 10, choices: [[8, '8 sec'], [10, '10 sec'], [15, '15 sec']] },
          { key: 'lvl', label: 'COMPUTER LEVEL', def: 2, local: true, choices: [[1, 'Easy'], [2, 'Smart']] },
          { key: 'shrink', label: 'The pond shrinks every turn after the 2nd', toggle: true, def: 1, choices: [[1, 'On'], [0, 'Off']] },
        ], (sel) => {
          const n = Math.max(2, +sel.n || 4);
          start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(BOTS.slice(0, n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel));
        }, 'Everyone secretly picks a direction and power, then all boats move at once. Bump the others off the pond!');
      }
      function start(body, sel, S) {
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, col: COLORS[i % COLORS.length], wins: 0, kos: 0 }));
        G = { S, sel, me: S.online ? S.me : 0, players, boats: [], round: 0, turn: 0, R: R0, Rgoal: R0, to: +sel.to || 3, secs: +sel.secs || 10, lvl: +sel.lvl || 2,
          shrink: +sel.shrink !== 0, spawnMode: sel.spawn || 'random', phase: 'start', plan: null, sent: false, got: {}, parts: [], shake: 0, over: false, tok: ++GT.cur, frame: null };
        GT.started = true; GT.over = false;
        body.innerHTML = `<div class="bo-wrap"><div class="bo-pondbox" id="bo-box"><canvas id="bo-cv" width="${W}" height="${H}"></canvas>
            <div class="bo-hud"><span class="bo-pill" id="bo-round"></span><span class="bo-pill" id="bo-clock"></span></div>
            <div class="bo-phase" id="bo-phase"></div>
            <div class="bo-ctl" id="bo-ctl"><div class="bo-pow"><i id="bo-pw"></i><b id="bo-pwt">0%</b></div><button class="btn-game btn-teal py-2 px-4 text-sm" id="bo-ready">${T('READY', 'SẴN SÀNG')}</button></div></div>
          <div class="bo-side" id="bo-side"></div><div id="bo-log" class="logbox" style="height:160px"></div></div>`;
        S.track();
        S.onLeft = (a) => { if (!G) return; const p = G.players[a.s]; if (p) { p.name += ' (CPU)'; p.av = '🤖'; } side(); };
        S.onCollect = (key, got) => { if (!G || key !== G.ckey) return; G.got = got; side(); };
        bindInput(); npBar('');
        G.raf = gRaf(loop);
        run().catch((e) => { if (e !== ABORT) throw e; });
      }
      async function W8(ms) { const t = G && G.tok; await gSleep(window.__fast ? Math.min(ms, 40) : ms); if (!G || G.tok !== t) throw ABORT; }
      const log = (h) => { const el = $('bo-log'); if (el) { el.insertAdjacentHTML('beforeend', `<div>${h}</div>`); el.scrollTop = el.scrollHeight; } };
      const meP = () => G.players[G.me], meB = () => G.boats[G.me];
      function setPhase(cls, txt) { const el = $('bo-phase'); if (!el) return; el.className = 'bo-phase ' + cls; el.textContent = txt || ''; el.style.display = txt ? 'block' : 'none'; }
      function side() {
        const el = $('bo-side'); if (!el || !G) return;
        el.innerHTML = G.players.map((p) => {
          const b = G.boats[p.seat] || { alive: true }, planning = G.phase === 'plan' && b.alive;
          const sub = !b.alive ? T('SPLASH! out', 'RƠI XUỐNG NƯỚC!') : planning ? (p.seat in G.got || (p.seat === G.me && G.sent) ? '✓ ' + T('ready', 'sẵn sàng') : T('planning...', 'đang tính...')) : p.seat === G.me ? T('you', 'bạn') : '';
          return `<div id="bo-seat-${p.seat}" class="tg-seat bo-tag ${b.alive ? '' : 'out'}" style="--pc:${p.col[0]}">${nameTag({ av: p.av, name: p.seat === G.me ? T('You', 'Bạn') : p.name, sub, me: p.seat === G.me, badge: p.wins ? '★'.repeat(p.wins) : undefined })}</div>`;
        }).join('');
      }

      // ---------- input: drag from your boat (direction + power), or the keyboard ----------
      function bindInput() {
        const cv = $('bo-cv');
        const toPond = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
        const can = () => G && G.phase === 'plan' && !G.sent && meB() && meB().alive && G.S.mine(G.me);
        const aim = (pt) => { const b = meB(), dx = pt.x - b.x, dy = pt.y - b.y, d = dist(pt.x, pt.y, b.x, b.y); if (d < 4) return; setPlan(Math.atan2(dy, dx), Math.min(1, d / 110)); };
        let drag = false;
        gOn(cv, 'pointerdown', (e) => { if (!can()) return; drag = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} aim(toPond(e)); });
        gOn(cv, 'pointermove', (e) => { if (drag && can()) aim(toPond(e)); });
        gOn(cv, 'pointerup', () => { drag = false; });
        gOn($('bo-ready'), 'click', () => sendPlan());
        gOn(document, 'keydown', (e) => {
          if (!can() || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
          const p = G.plan || { a: -Math.PI / 2, pow: 0.5 };
          if (e.key === 'ArrowLeft') setPlan(p.a - 0.14, p.pow); else if (e.key === 'ArrowRight') setPlan(p.a + 0.14, p.pow);
          else if (e.key === 'ArrowUp') setPlan(p.a, Math.min(1, p.pow + 0.1)); else if (e.key === 'ArrowDown') setPlan(p.a, Math.max(0, p.pow - 0.1));
          else if (e.key === 'Enter') sendPlan(); else return;
          e.preventDefault();
        });
      }
      function setPlan(a, pow) { G.plan = { a, pow }; const pw = $('bo-pw'), pt = $('bo-pwt'); if (pw) pw.style.width = (pow * 100) + '%'; if (pt) pt.textContent = Math.round(pow * 100) + '%'; }
      function sendPlan() {
        if (!G || G.phase !== 'plan' || G.sent || !meB() || !meB().alive) return;
        const p = G.plan || { a: 0, pow: 0 }; G.sent = true;
        const r = $('bo-ready'); if (r) { r.disabled = true; r.textContent = T('WAITING...', 'ĐANG CHỜ...'); }
        SFX.play('click');
        G.S.act({ t: 'plan', key: G.ckey, s: G.me, vx: Math.round(Math.cos(p.a) * p.pow * VMAX * 100) / 100, vy: Math.round(Math.sin(p.a) * p.pow * VMAX * 100) / 100 });
        side();
      }

      // ---------- the match ----------
      async function run() {
        for (;;) {
          await playRound(); if (!G || G.over) return;
          if (G.players.some((p) => p.wins >= G.to)) return finish();
        }
      }
      async function playRound() {
        const S = G.S, t = G.tok; G.round++; G.turn = 0; G.R = G.Rgoal = R0; G.parts = [];
        const pos = spawn(G.players.length, G.spawnMode, S.rng);
        G.boats = pos.map(([x, y], i) => ({ x, y, alive: true, ang: Math.atan2(CY - y, CX - x), sink: 9, vx: 0, vy: 0 }));
        log(T(`Round ${G.round}: boats placed (${G.spawnMode === 'ring' ? 'around the edge' : G.spawnMode === 'close' ? 'close together' : 'random spots'}).`, `Ván ${G.round}: các thuyền đã vào vị trí.`));
        for (;;) {
          G.turn++;
          if (G.shrink && G.turn > 2) G.Rgoal = Math.max(70, G.Rgoal * 0.9);
          $('bo-round').textContent = `${T('ROUND', 'VÁN')} ${G.round} · ${T('TURN', 'LƯỢT')} ${G.turn}`;
          const plans = await planPhase(); if (!G || G.tok !== t) throw ABORT;
          // reveal: everyone's arrow
          G.phase = 'reveal'; G.plans = plans; setPhase('reveal', T('PLANS REVEALED!', 'LỘ KẾ HOẠCH!')); $('bo-ctl').style.visibility = 'hidden'; side(); SFX.play('reveal');
          for (let i = 0; i < G.boats.length; i++) { const p = plans[i]; if (G.boats[i].alive && p && (p.vx || p.vy)) G.boats[i].ang = Math.atan2(p.vy, p.vx); }
          await W8(2200);
          // GO: everyone moves at once
          G.phase = 'go'; setPhase('go', T('GO!', 'ĐI!')); SFX.play('roll');
          const sim = simulate(G.boats, plans, G.Rgoal);   // the target size (the drawn edge eases towards it) so every screen uses the same number
          await play(sim); if (!G || G.tok !== t) throw ABORT;
          setPhase('', '');
          // the host's end positions are the truth (every screen should already agree)
          const key = `e${G.round}_${G.turn}`;
          const a = await S.ask(-1, () => ({ t: 'end', key, b: sim.end }), window.__fast && !S.online ? 5 : 300, (x) => x.t === 'end' && x.key === key);
          if (!G || G.tok !== t) throw ABORT;
          const before = G.boats.map((b) => b.alive);
          (a.b || sim.end).forEach((e, i) => { const b = G.boats[i]; b.x = e.x; b.y = e.y; if (b.alive && !e.alive) { b.alive = false; b.sink = 0; } b.vx = b.vy = 0; });
          const outs = before.map((was, i) => (was && !G.boats[i].alive ? i : -1)).filter((i) => i >= 0);
          outs.forEach((i) => log(`💦 ${esc(G.players[i].name)} ${T('was knocked off the pond.', 'bị húc rơi khỏi hồ.')}`));
          if (outs.length >= 2) funMoment('bo-seat-' + G.me, { key: 'dko' + G.round + '_' + G.turn, icon: '💥', label: 'DOUBLE SPLASH', burst: T('DOUBLE SPLASH!', 'RƠI CẢ ĐÔI!'), sub: '2 boats out in one go', mine: false });
          side();
          const live = G.boats.filter((b) => b.alive);
          if (live.length <= 1) {
            const w = live.length ? G.boats.indexOf(live[0]) : -1;
            if (w >= 0) G.players[w].wins++;
            G.phase = 'roundend'; side();
            setPhase('reveal', w < 0 ? T('EVERYONE SANK!', 'CHÌM HẾT!') : w === G.me ? T('YOU WIN THE ROUND!', 'BẠN THẮNG VÁN NÀY!') : `${G.players[w].name.toUpperCase()} ${T('WINS THE ROUND', 'THẮNG VÁN NÀY')}`);
            log(w < 0 ? T('Everyone sank: nobody wins the round.', 'Tất cả đều chìm: không ai thắng ván.') : `🏆 ${esc(G.players[w].name)} ${T('wins round', 'thắng ván')} ${G.round}.`);
            SFX.play(w === G.me ? 'win' : 'coin');
            await W8(2600); setPhase('', ''); return;
          }
          await W8(500);
        }
      }
      async function planPhase() {
        const S = G.S, t = G.tok, key = `p${G.round}_${G.turn}`, me = meB();
        G.phase = 'plan'; G.ckey = key; G.got = {}; G.sent = false; G.plan = null; G.plans = null; setPlan(me.ang, 0);
        setPhase('plan', T('PLAN YOUR MOVE · PLANS ARE SECRET', 'TÍNH NƯỚC ĐI · KẾ HOẠCH BÍ MẬT'));
        const ctl = $('bo-ctl'); ctl.style.visibility = me.alive && S.mine(G.me) ? 'visible' : 'hidden';
        const r = $('bo-ready'); r.disabled = false; r.textContent = T('READY', 'SẴN SÀNG');
        side();
        const t0 = Date.now();
        const tick = gInterval(() => {
          if (!G || G.tok !== t) return;
          const left = Math.max(0, G.secs - (Date.now() - t0) / 1000), c = $('bo-clock'); if (c) c.textContent = G.phase === 'plan' ? Math.ceil(left) : '';
          if (left < 0.6 && !G.sent && G.plan && G.plan.pow > 0.02) sendPlan();          // time's nearly up: send what you've got
          if (left <= 3 && left > 0 && !G.sent && Math.ceil(left) !== G.lastTick) { G.lastTick = Math.ceil(left); SFX.play('tick'); }
        }, 100);
        const seats = G.boats.map((b, i) => (b.alive ? i : -1)).filter((i) => i >= 0);
        const lvl = S.online ? (+(S.sel && S.sel.lvl) || 2) : G.lvl;
        const got = await S.collect(key, seats, (s) => Object.assign({ t: 'plan' }, botPlan(s, G.boats, G.R, lvl, Math.random)), () => ({ t: 'plan', vx: 0, vy: 0 }), G.secs + 0.4);
        gClearInt(tick); if (!G || G.tok !== t) throw ABORT;
        $('bo-clock').textContent = '';
        return G.boats.map((b, i) => (got[i] ? { vx: +got[i].vx || 0, vy: +got[i].vy || 0 } : { vx: 0, vy: 0 }));
      }
      // play the movement back at real speed (instantly while catching up on a rejoin)
      function play(sim) {
        if (typeof NP !== 'undefined' && NP.catchup) return Promise.resolve();
        const t = G.tok, bumpAt = sim.bumps.slice(), outs = new Set();
        return new Promise((res) => {
          const t0 = performance.now(), total = sim.frames.length * STEP * 2 * 1000, speed = window.__fast ? 8 : 1;
          const step = () => {
            if (!G || G.tok !== t) return res();
            const el = (performance.now() - t0) * speed, k = Math.min(sim.frames.length - 1, Math.floor(el / (STEP * 2 * 1000)));
            const f = sim.frames[k];
            f.forEach((q, i) => {
              const b = G.boats[i]; if (!b) return;
              if (b.alive && !q[2] && !outs.has(i)) { outs.add(i); b.alive = false; b.sink = 0; splash(q[0], q[1]); side(); }
              if (b.alive) { b.x = q[0]; b.y = q[1]; const sp = q[3] * q[3] + q[4] * q[4]; if (sp > 400) { b.ang = Math.atan2(q[4], q[3]); if (Math.random() < 0.5) G.parts.push({ x: b.x - Math.cos(b.ang) * RAD, y: b.y - Math.sin(b.ang) * RAD, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12, l: 0.9, c: 'rgba(230,246,255,.8)' }); } }
            });
            while (bumpAt.length && bumpAt[0][0] <= k * 2) { const [, x, y, v] = bumpAt.shift(); bonk(x, y, v); }
            if (el >= total) return res();
            gRaf(step);
          };
          gRaf(step);
        });
      }
      function bonk(x, y, v) {
        G.shake = Math.max(G.shake, Math.min(0.25, v / 900)); SFX.play('crash');
        for (let k = 0; k < 10; k++) G.parts.push({ x, y, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, l: 0.4, c: '#FFFFFF' });
        G.parts.push({ txt: 'BONK!', x, y: y - 10, vx: 0, vy: -26, l: 0.8 });
      }
      function splash(x, y) {
        G.shake = 0.35; SFX.play('nope');
        for (let k = 0; k < 26; k++) { const a = Math.random() * 6.28, s = 30 + Math.random() * 90; G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, l: 0.9, c: k % 3 ? '#BFE9FF' : '#FFFFFF', g: 1 }); }
        G.parts.push({ txt: 'SPLASH!', x, y: y - 14, vx: 0, vy: -20, l: 1.2 });
      }
      async function finish() {
        G.over = true; G.S.over = true; setPhase('', '');
        const S = G.S, me = meP(), tok = G.tok;
        const rank = G.players.slice().sort((a, b) => b.wins - a.wins), place = 1 + G.players.filter((p) => p.wins > me.wins).length, res = place === 1 ? 'win' : 'loss';   // ties share a place
        const row = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        const s = gstat('bumpoff'); s.rounds = (s.rounds || 0) + me.wins;
        reportGame('bumpoff', res, { place, xp: 10 + me.wins * 6, label: `${me.wins} round${me.wins === 1 ? '' : 's'} won` });
        gameResult({ title: res === 'win' ? 'You win!' : `${rank[0].name} wins!`, sub: rank.map((p, i) => `${i + 1}. ${p.seat === G.me ? 'You' : p.name} ${'★'.repeat(p.wins)}`).join(' · '),
          tone: res === 'win' ? 'amber' : 'coral', sprite: res === 'win' ? 'trophy' : 'anchor',
          rows: [['Rounds you won', me.wins, 'text-amber'], ['Place', place + ['', 'st', 'nd', 'rd'][place] || place + 'th', 'text-bone']].concat(row ? [row] : []),
          againLabel: S.online ? 'Back to setup' : 'Play again', again: () => open($('game-root')) });
      }

      // ---------- drawing (low resolution, scaled up: pixel art) ----------
      let last = 0;
      function loop(now) {
        if (!G) return;
        const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
        for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; if (q.g) q.vy += 160 * dt; q.l -= dt; }
        G.parts = G.parts.filter((q) => q.l > 0);
        for (const b of G.boats) if (!b.alive) b.sink += dt;
        G.shake = Math.max(0, G.shake - dt); G.R += (G.Rgoal - G.R) * Math.min(1, dt * 3);
        draw(now / 1000); G.raf = gRaf(loop);
      }
      function arrow(ctx, b, vx, vy, col, solid) {
        const v = Math.sqrt(vx * vx + vy * vy); if (v < 6) return;
        const a = Math.atan2(vy, vx), L = reach(v), ex = b.x + Math.cos(a) * L, ey = b.y + Math.sin(a) * L;
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(solid ? [] : [5, 4]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(ex + Math.cos(a) * 6, ey + Math.sin(a) * 6); ctx.lineTo(ex + Math.cos(a + 2.5) * 7, ey + Math.sin(a + 2.5) * 7); ctx.lineTo(ex + Math.cos(a - 2.5) * 7, ey + Math.sin(a - 2.5) * 7); ctx.fill();
        ctx.strokeRect(Math.round(ex) - 4, Math.round(ey) - 4, 8, 8);
      }
      function draw(tt) {
        const cv = $('bo-cv'); if (!cv) return; const ctx = cv.getContext('2d'), R = G.R;
        const s = G.shake * 40; ctx.setTransform(1, 0, 0, 1, Math.round(s ? (Math.random() - 0.5) * s : 0), Math.round(s ? (Math.random() - 0.5) * s : 0));
        ctx.fillStyle = '#3F8F4A'; ctx.fillRect(-10, -10, W + 20, H + 20);
        for (let i = 0; i < 80; i++) { ctx.fillStyle = i % 2 ? '#4FA35A' : '#357A3F'; ctx.fillRect((i * 53) % W, (i * 97) % H, 3, 2); }
        ctx.fillStyle = '#D9B26A'; ctx.beginPath(); ctx.arc(CX, CY, R0 + 12, 0, 7); ctx.fill();
        ctx.fillStyle = '#1A5C8A'; ctx.beginPath(); ctx.arc(CX, CY, R0 + 3, 0, 7); ctx.fill();
        ctx.fillStyle = '#2F8FD0'; ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.fill();
        ctx.fillStyle = '#3FA3E2'; for (let y = 0; y < H; y += 12) for (let x = ((y / 12) % 2) * 12; x < W; x += 24) if (dist(x, y, CX, CY) < R - 4 && Math.sin(tt * 2 + x * 0.05 + y * 0.08) > 0.3) ctx.fillRect(x, y, 6, 2);
        ctx.strokeStyle = G.Rgoal < R0 ? '#FB7185' : '#E6F6FF'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        for (const q of G.parts) {
          if (q.txt) { ctx.font = '16px "Jersey 15", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#050E18'; ctx.fillText(q.txt, q.x + 1, q.y + 1); ctx.fillStyle = q.txt === 'SPLASH!' ? '#BFE9FF' : '#F5B041'; ctx.fillText(q.txt, q.x, q.y); ctx.textAlign = 'left'; continue; }
          ctx.fillStyle = q.c; ctx.globalAlpha = Math.min(1, q.l * 2); ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 2); ctx.globalAlpha = 1;
        }
        G.boats.forEach((b, i) => {
          const p = G.players[i];
          if (!b.alive) { if (b.sink < 1.2) { ctx.globalAlpha = 1 - b.sink / 1.2; boat(ctx, b, p, 1 - b.sink * 0.5); ctx.globalAlpha = 1; } return; }
          if (G.phase === 'reveal' && G.plans && G.plans[i]) arrow(ctx, b, G.plans[i].vx, G.plans[i].vy, p.col[0], false);
          boat(ctx, b, p, 1);
        });
        const me = meB();
        if (G.phase === 'plan') {
          if (me && me.alive && G.plan && G.plan.pow > 0.02) arrow(ctx, me, Math.cos(G.plan.a) * G.plan.pow * VMAX, Math.sin(G.plan.a) * G.plan.pow * VMAX, '#F7F4EC', true);
          else if (me && me.alive && !G.sent) { ctx.fillStyle = '#F7F4EC'; ctx.font = '13px "Jersey 15", monospace'; ctx.textAlign = 'center'; ctx.fillText(T('DRAG FROM YOUR BOAT', 'KÉO TỪ THUYỀN CỦA BẠN'), me.x, me.y + RAD + 16); ctx.textAlign = 'left'; }
          ctx.font = '14px "Jersey 15", monospace'; ctx.textAlign = 'center';
          G.boats.forEach((b, i) => { if (!b.alive || i === G.me) return; const ok = i in G.got; ctx.fillStyle = ok ? '#34D399' : '#F7F4EC'; ctx.fillText(ok ? '✓' : '?', b.x, b.y - RAD - 5 + Math.sin(tt * 4 + i) * 1.5); });
          ctx.textAlign = 'left';
        }
        if (me && me.alive) { ctx.fillStyle = '#2DD4BF'; ctx.font = '13px "Jersey 15", monospace'; ctx.textAlign = 'center'; ctx.fillText(T('YOU', 'BẠN'), me.x, me.y - RAD - (G.phase === 'plan' ? 16 : 6)); ctx.textAlign = 'left'; }
      }
      function boat(ctx, b, p, s) {
        ctx.save(); ctx.translate(Math.round(b.x), Math.round(b.y)); ctx.rotate(b.ang); ctx.scale(s, s);
        ctx.fillStyle = 'rgba(5,14,24,.35)'; ctx.beginPath(); ctx.ellipse(2, 3, 14, 10, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#050E18'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 11, 0, 0, 7); ctx.fill();
        ctx.fillStyle = p.col[1]; ctx.beginPath(); ctx.ellipse(0, 0, 13, 9, 0, 0, 7); ctx.fill();
        ctx.fillStyle = p.col[0]; ctx.beginPath(); ctx.ellipse(0, 0, 10, 6.5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#050E18'; ctx.fillRect(8, -2, 5, 4);
        ctx.restore();
        ctx.font = '12px serif'; ctx.textAlign = 'center'; ctx.fillText(p.av, Math.round(b.x), Math.round(b.y) + 4); ctx.textAlign = 'left';
      }

      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      // tile icon: two bumper boats meeting on the water with a little BONK star
      GICONS.bumpoff = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(0, 0, 24, 24, '#2F8FD0')}${rr(0, 19, 24, 5, '#1A5C8A')}${rr(2, 6, 4, 1, '#7CC4F0')}${rr(16, 3, 5, 1, '#7CC4F0')}${rr(14, 21, 6, 1, '#7CC4F0')}
        ${rr(1, 11, 9, 6, K)}${rr(2, 12, 7, 4, '#0E7C70')}${rr(3, 13, 5, 2, '#2DD4BF')}${rr(9, 13, 2, 2, K)}
        ${rr(14, 11, 9, 6, K)}${rr(15, 12, 7, 4, '#A33447')}${rr(16, 13, 5, 2, '#FB7185')}${rr(13, 13, 2, 2, K)}
        ${rr(11, 7, 2, 2, '#F5B041')}${rr(12, 5, 1, 2, '#F5B041')}${rr(10, 8, 1, 1, '#F5B041')}${rr(13, 8, 1, 1, '#F5B041')}${rr(11, 9, 1, 1, '#F7F4EC')}</svg>`;
      const mod = {
        id: 'bumpoff', name: 'Bump Off', icon: 'bumpoff', cats: ['party', 'sports'], sub: '2-6 PLAYERS · ~5 MIN', color: '#2DD4BF', tone: 'teal', btn: 'teal', flag: 'NEW',
        blurb: 'Bumper boats! Everyone secretly picks a direction and power, then all boats move at once. Knock the others off the pond.',
        rules: { tag: 'PARTY · 2-6 PLAYERS', steps: [
          '<strong class="text-bone">Plan in secret:</strong> drag from your boat to choose a direction; a longer arrow = more power. Press READY. You can see every boat, but not where they will go.',
          '<strong class="text-bone">Reveal:</strong> everyone\'s arrows appear at once. Too late to change!',
          '<strong class="text-bone">GO:</strong> all boats move at the same time and bump. Anyone knocked off the pond is out.',
          '<strong class="text-bone">Win:</strong> the last boat floating wins the round. First to win the set number of rounds wins.',
        ], tip: 'Aim where someone will be, not where they are. A small move to dodge can beat a big charge.' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['ROUNDS WON', s.rounds || 0, 'text-teal']],
        engine: { spawn, simulate, botPlan, get G() { return G; } }, open, close() { G = null; },
        online: { seats: (sel) => Math.max(2, +sel.n || 4), min: 2, ranked: false, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
