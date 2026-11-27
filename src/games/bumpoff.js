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

      // ---------- input: the arrow's tip follows the mouse / finger (Inna, Nov 2026) ----------
      // Mouse: just move over the pond and the arrow follows; click to lock it (click again to re-aim).
      // Touch: put a finger down anywhere and slide; the arrow follows it and stays where you lift.
      const MAXL = () => reach(VMAX);                    // the longest arrow = full power
      function bindInput() {
        const cv = $('bo-cv');
        const toPond = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
        const can = () => G && G.phase === 'plan' && !G.sent && meB() && meB().alive && G.S.mine(G.me);
        const aim = (pt) => { const b = meB(), d = dist(pt.x, pt.y, b.x, b.y); if (d < 3) return setPlan(G.plan ? G.plan.a : b.ang, 0); setPlan(Math.atan2(pt.y - b.y, pt.x - b.x), Math.min(1, d / MAXL())); };
        let down = false;
        gOn(cv, 'pointerdown', (e) => { if (!can()) return; e.preventDefault(); down = true; G.locked = false; try { cv.setPointerCapture(e.pointerId); } catch (x) {} aim(toPond(e)); });
        gOn(cv, 'pointermove', (e) => { if (!can()) return; G.hover = toPond(e); if (down || (e.pointerType === 'mouse' && !G.locked)) aim(G.hover); });
        const up = (e) => { if (!down) return; down = false; if (can()) { aim(toPond(e)); G.locked = true; SFX.play('click'); } };
        gOn(cv, 'pointerup', up); gOn(cv, 'pointercancel', () => { down = false; });
        gOn(cv, 'pointerleave', () => { G && (G.hover = null); });
        gOn($('bo-ready'), 'click', () => sendPlan());
        gOn(document, 'keydown', (e) => {
          if (!can() || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
          const p = G.plan || { a: -Math.PI / 2, pow: 0.5 };
          if (e.key === 'ArrowLeft') setPlan(p.a - 0.14, p.pow); else if (e.key === 'ArrowRight') setPlan(p.a + 0.14, p.pow);
          else if (e.key === 'ArrowUp') setPlan(p.a, Math.min(1, p.pow + 0.1)); else if (e.key === 'ArrowDown') setPlan(p.a, Math.max(0, p.pow - 0.1));
          else if (e.key === 'Enter') sendPlan(); else return;
          G.locked = true; e.preventDefault();
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
        G.phase = 'plan'; G.ckey = key; G.got = {}; G.sent = false; G.plan = null; G.plans = null; G.locked = false; setPlan(me.ang, 0);
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
              if (b.alive) { b.x = q[0]; b.y = q[1]; const sp = q[3] * q[3] + q[4] * q[4]; if (sp > 400) { b.ang = Math.atan2(q[4], q[3]); if (Math.random() < 0.6) G.parts.push({ x: b.x - Math.cos(b.ang) * RAD + (Math.random() - 0.5) * 8, y: b.y - Math.sin(b.ang) * RAD + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12, l: 0.9, sz: 1 + Math.random(), c: 'rgba(235,248,255,.85)' }); if (Math.random() < 0.08) G.parts.push({ ring: true, x: b.x, y: b.y, r: RAD, gr: 16, l: 0.8, l0: 0.8, vx: 0, vy: 0 }); } }
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

      // ---------- drawing: sharp, full resolution (Inna, Nov 2026: "a better board, higher quality") ----------
      // Game positions stay in the 360 x 380 pond units; the canvas is sized to the screen's real pixels and scaled.
      let last = 0;
      function fit(cv) {
        const w = cv.clientWidth; if (!w) return 1;
        const dpr = Math.min(3, window.devicePixelRatio || 1), pw = Math.round(w * dpr), ph = Math.round(w * H / W * dpr);
        if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; G.bg = null; }
        return cv.width / W;
      }
      function loop(now) {
        if (!G) return;
        const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
        for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; if (q.g) q.vy += 160 * dt; if (q.ring) q.r += q.gr * dt; q.l -= dt; }
        G.parts = G.parts.filter((q) => q.l > 0);
        for (const b of G.boats) if (!b.alive) b.sink += dt;
        G.shake = Math.max(0, G.shake - dt); G.R += (G.Rgoal - G.R) * Math.min(1, dt * 3);
        draw(now / 1000); G.raf = gRaf(loop);
      }
      // a fixed little random generator for the scenery (same garden every time)
      const sr = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
      function scenery(k) {
        const c = document.createElement('canvas'); c.width = Math.round(W * k); c.height = Math.round(H * k);
        const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0);
        // grass with mown stripes, tufts, flowers and stones
        g.fillStyle = '#3E8B47'; g.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 24) { g.fillStyle = (y / 24) % 2 ? '#43944C' : '#3A8443'; g.fillRect(0, y, W, 24); }
        for (let i = 0; i < 170; i++) { const x = sr(i) * W, y = sr(i + 500) * H; if (dist(x, y, CX, CY) < R0 + 26) continue;
          g.fillStyle = i % 3 ? '#2F7338' : '#57A85F'; g.fillRect(x, y, 1.4, 3); g.fillRect(x + 2, y + 1, 1.4, 2.4); g.fillRect(x - 2, y + 1.4, 1.4, 2); }
        const fl = ['#F7F4EC', '#F5B041', '#FB7185'];
        for (let i = 0; i < 26; i++) { const x = sr(i + 900) * W, y = sr(i + 1300) * H; if (dist(x, y, CX, CY) < R0 + 30) continue;
          g.fillStyle = fl[i % 3]; g.fillRect(x - 1.5, y, 3, 1.2); g.fillRect(x - 0.6, y - 1, 1.2, 3.2); g.fillStyle = '#F5B041'; g.fillRect(x - 0.5, y + 0.2, 1, 1); }
        for (let i = 0; i < 9; i++) { const x = sr(i + 2000) * W, y = sr(i + 2100) * H; if (dist(x, y, CX, CY) < R0 + 34) continue;
          g.fillStyle = '#050E18'; g.beginPath(); g.ellipse(x, y + 1, 5, 3.4, 0, 0, 7); g.fill(); g.fillStyle = '#9DB4CC'; g.beginPath(); g.ellipse(x, y, 4, 2.6, 0, 0, 7); g.fill(); g.fillStyle = '#C7D6E5'; g.fillRect(x - 2, y - 1.4, 2, 1); }
        // reeds in the corners
        [[18, 30], [342, 36], [16, 356], [344, 352]].forEach(([x, y], j) => { for (let i = 0; i < 6; i++) { const xx = x + (i - 2.5) * 3.2, hh = 14 + sr(j * 9 + i) * 10;
          g.fillStyle = '#050E18'; g.fillRect(xx - 0.8, y - hh, 2.6, hh); g.fillStyle = '#6CB36A'; g.fillRect(xx - 0.2, y - hh, 1.4, hh); if (i % 2) { g.fillStyle = '#050E18'; g.fillRect(xx - 1.4, y - hh - 6, 3.8, 7); g.fillStyle = '#8A5A2B'; g.fillRect(xx - 0.8, y - hh - 5.4, 2.6, 5.8); } } });
        // the wooden boardwalk around the pond: planks, seams and posts, with a hard shadow
        const r1 = R0 + 4, r2 = R0 + 19;
        g.fillStyle = 'rgba(5,14,24,.45)'; g.beginPath(); g.arc(CX + 3, CY + 5, r2 + 1, 0, 7); g.fill();
        g.fillStyle = '#050E18'; g.beginPath(); g.arc(CX, CY, r2 + 1.6, 0, 7); g.fill();
        const N = 72;
        for (let i = 0; i < N; i++) { const a0 = i / N * 6.2832, a1 = (i + 1) / N * 6.2832;
          g.fillStyle = i % 2 ? '#C99A5C' : '#BB8B4D'; g.beginPath(); g.arc(CX, CY, r2, a0, a1); g.arc(CX, CY, r1, a1, a0, true); g.closePath(); g.fill();
          g.strokeStyle = '#7A5227'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(CX + Math.cos(a0) * r1, CY + Math.sin(a0) * r1); g.lineTo(CX + Math.cos(a0) * r2, CY + Math.sin(a0) * r2); g.stroke();
          g.fillStyle = '#E3B977'; g.beginPath(); g.arc(CX, CY, r2 - 0.6, a0 + 0.004, a1 - 0.01); g.arc(CX, CY, r2 - 2, a1 - 0.01, a0 + 0.004, true); g.closePath(); g.fill();
          if (i % 2 === 0) { g.fillStyle = '#6B4520'; const m = (a0 + a1) / 2; g.fillRect(CX + Math.cos(m) * (r2 - 4) - 0.7, CY + Math.sin(m) * (r2 - 4) - 0.7, 1.4, 1.4); g.fillRect(CX + Math.cos(m) * (r1 + 3) - 0.7, CY + Math.sin(m) * (r1 + 3) - 0.7, 1.4, 1.4); } }
        for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832 + 0.13, x = CX + Math.cos(a) * (r2 + 1), y = CY + Math.sin(a) * (r2 + 1);
          g.fillStyle = '#050E18'; g.fillRect(x - 3.6, y - 3.6, 7.2, 7.2); g.fillStyle = '#8A5A2B'; g.fillRect(x - 2.6, y - 2.6, 5.2, 5.2); g.fillStyle = '#B07A40'; g.fillRect(x - 2.6, y - 2.6, 5.2, 1.6); }
        // a life ring and a little flag on the boardwalk
        { const a = -2.35, x = CX + Math.cos(a) * (r1 + 7.5), y = CY + Math.sin(a) * (r1 + 7.5);
          g.lineWidth = 4.6; g.strokeStyle = '#050E18'; g.beginPath(); g.arc(x, y, 5.6, 0, 7); g.stroke();
          for (let q = 0; q < 4; q++) { g.lineWidth = 3; g.strokeStyle = q % 2 ? '#F7F4EC' : '#FB7185'; g.beginPath(); g.arc(x, y, 5.6, q * 1.5708, (q + 1) * 1.5708); g.stroke(); } }
        { const a = -0.6, x = CX + Math.cos(a) * (r2 + 1), y = CY + Math.sin(a) * (r2 + 1);
          g.fillStyle = '#050E18'; g.fillRect(x - 1, y - 26, 2.4, 26); g.fillStyle = '#F7F4EC'; g.fillRect(x - 0.4, y - 25, 1.2, 24);
          g.fillStyle = '#050E18'; g.beginPath(); g.moveTo(x + 1, y - 27); g.lineTo(x + 15, y - 22); g.lineTo(x + 1, y - 16); g.fill(); g.fillStyle = '#F5B041'; g.beginPath(); g.moveTo(x + 1.6, y - 25.6); g.lineTo(x + 12.4, y - 22); g.lineTo(x + 1.6, y - 17.6); g.fill(); }
        // the pond's deep edge
        g.fillStyle = '#123F62'; g.beginPath(); g.arc(CX, CY, r1, 0, 7); g.fill();
        return c;
      }
      function water(ctx, tt, R) {
        const r1 = R0 + 4;
        const gr = ctx.createRadialGradient(CX - 30, CY - 40, 10, CX, CY, r1);
        gr.addColorStop(0, '#4DB6EE'); gr.addColorStop(0.7, '#2E8ED0'); gr.addColorStop(1, '#2172AE');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(CX, CY, r1 - 1.5, 0, 7); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, r1 - 1.5, 0, 7); ctx.clip();
        // gentle waves: short light strokes drifting across
        ctx.strokeStyle = 'rgba(214,240,255,.42)'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
        for (let i = 0; i < 46; i++) { const bx = sr(i + 40) * W, by = sr(i + 80) * H, x = (bx + tt * 6) % (W + 30) - 15, y = by + Math.sin(tt * 1.3 + i) * 2;
          const s = 0.5 + 0.5 * Math.sin(tt * 1.7 + i * 1.9); if (s < 0.25) continue;
          ctx.globalAlpha = s; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.quadraticCurveTo(x, y - 2.4, x + 6, y); ctx.stroke(); }
        ctx.globalAlpha = 1; ctx.lineCap = 'butt';
        // the edge zone that is no longer safe once the pond shrinks
        if (R < R0 - 1) {
          ctx.fillStyle = 'rgba(10,30,52,.42)'; ctx.beginPath(); ctx.arc(CX, CY, r1, 0, 7); ctx.arc(CX, CY, R, 0, 7, true); ctx.fill();
          ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, r1, 0, 7); ctx.arc(CX, CY, R, 0, 7, true); ctx.clip();
          ctx.strokeStyle = 'rgba(251,113,133,.28)'; ctx.lineWidth = 4;
          for (let x = -H; x < W + H; x += 14) { ctx.beginPath(); ctx.moveTo(x + (tt * 8) % 14, 0); ctx.lineTo(x + H + (tt * 8) % 14, H); ctx.stroke(); }
          ctx.restore();
        }
        ctx.restore();
        // the edge line: cream normally, coral and marching when it is closing in
        const hot = G.Rgoal < R0;
        ctx.lineWidth = 3.2; ctx.strokeStyle = '#050E18'; ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.stroke();
        ctx.lineWidth = 1.8; ctx.strokeStyle = hot ? '#FB7185' : '#E6F6FF'; ctx.setLineDash([7, 5]); ctx.lineDashOffset = hot ? -tt * 14 : 0; ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      }
      // an arrow from boat b: its tip lands exactly where the boat would stop with nobody in the way
      function arrow(ctx, b, vx, vy, col, mode) {
        const v = Math.sqrt(vx * vx + vy * vy); if (v < 6) return;
        const a = Math.atan2(vy, vx), L = reach(v), ca = Math.cos(a), sa = Math.sin(a);
        const sx = b.x + ca * (RAD + 1), sy = b.y + sa * (RAD + 1), ex = b.x + ca * L, ey = b.y + sa * L, hx = ex - ca * 8, hy = ey - sa * 8;
        if (L > RAD + 9) {
          ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#050E18'; ctx.setLineDash(mode === 'dash' ? [7, 5] : []); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
          ctx.lineWidth = 3.4; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
        }
        const tri = (w) => { ctx.beginPath(); ctx.moveTo(ex + ca * w * 0.4, ey + sa * w * 0.4); ctx.lineTo(hx - ca * w * 0.2 + sa * w, hy - sa * w * 0.2 - ca * w); ctx.lineTo(hx - ca * w * 0.2 - sa * w, hy - sa * w * 0.2 + ca * w); ctx.closePath(); };
        ctx.fillStyle = '#050E18'; tri(8.4); ctx.fill(); ctx.fillStyle = col; tri(6); ctx.fill();
        if (mode === 'mine' || mode === 'locked') {
          const pct = Math.round(v / VMAX * 100) + '%'; ctx.font = '600 9px Outfit, sans-serif'; const tw = ctx.measureText(pct).width + 8;
          const lx = Math.max(tw / 2 + 2, Math.min(W - tw / 2 - 2, ex + ca * 14)), ly = Math.max(10, Math.min(H - 6, ey + sa * 14));
          ctx.fillStyle = '#050E18'; ctx.fillRect(lx - tw / 2, ly - 7, tw, 13); ctx.fillStyle = mode === 'locked' ? '#F5B041' : '#F7F4EC'; ctx.textAlign = 'center'; ctx.fillText(pct, lx, ly + 3); ctx.textAlign = 'left';
        }
      }
      function label(ctx, txt, x, y, bg, fg) {
        ctx.font = '600 9px Outfit, sans-serif'; const w = ctx.measureText(txt).width + 8;
        ctx.fillStyle = '#050E18'; ctx.fillRect(x - w / 2 + 1, y - 7 + 1.5, w, 12); ctx.fillStyle = bg; ctx.fillRect(x - w / 2, y - 7, w, 12);
        ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.fillText(txt, x, y + 2.4); ctx.textAlign = 'left';
      }
      function draw(tt) {
        const cv = $('bo-cv'); if (!cv) return; const ctx = cv.getContext('2d'), R = G.R, k = fit(cv);
        if (!G.bg) G.bg = scenery(k);
        const s = G.shake * 40, ox = s ? (Math.random() - 0.5) * s : 0, oy = s ? (Math.random() - 0.5) * s : 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#3E8B47'; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(G.bg, ox * k, oy * k);
        ctx.setTransform(k, 0, 0, k, ox * k, oy * k);
        water(ctx, tt, R);
        // ripples and foam under the boats
        for (const q of G.parts) if (q.ring) { ctx.globalAlpha = Math.max(0, q.l / q.l0) * 0.6; ctx.strokeStyle = '#E6F6FF'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.stroke(); }
        ctx.globalAlpha = 1;
        for (const q of G.parts) if (!q.txt && !q.ring) { ctx.fillStyle = q.c; ctx.globalAlpha = Math.min(1, q.l * 2); ctx.beginPath(); ctx.arc(q.x, q.y, q.sz || 1.3, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
        const me = meB();
        // my own aim range while planning (faint), so you can see how far full power goes
        if (G.phase === 'plan' && me && me.alive && !G.sent && G.S.mine(G.me)) { ctx.strokeStyle = 'rgba(247,244,236,.22)'; ctx.lineWidth = 1; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.arc(me.x, me.y, MAXL(), 0, 7); ctx.stroke(); ctx.setLineDash([]); }
        G.boats.forEach((b, i) => { if (G.phase === 'reveal' && b.alive && G.plans && G.plans[i]) arrow(ctx, b, G.plans[i].vx, G.plans[i].vy, G.players[i].col[0], 'dash'); });
        if (G.phase === 'plan' && me && me.alive && G.plan && G.plan.pow > 0.02) arrow(ctx, me, Math.cos(G.plan.a) * G.plan.pow * VMAX, Math.sin(G.plan.a) * G.plan.pow * VMAX, G.locked || G.sent ? '#F5B041' : '#F7F4EC', G.locked || G.sent ? 'locked' : 'mine');
        G.boats.forEach((b, i) => {
          const p = G.players[i];
          if (!b.alive) { if (b.sink < 1.2) { ctx.globalAlpha = 1 - b.sink / 1.2; boat(ctx, b, p, 1 - b.sink * 0.5, tt, i); ctx.globalAlpha = 1; } return; }
          boat(ctx, b, p, 1, tt, i);
        });
        if (G.phase === 'plan') {
          G.boats.forEach((b, i) => { if (!b.alive || i === G.me) return; const ok = i in G.got; label(ctx, ok ? '✓ READY' : '?', b.x, b.y - RAD - 9 + Math.sin(tt * 4 + i) * 1.2, ok ? '#34D399' : '#F7F4EC', '#050E18'); });
          if (me && me.alive && !G.sent && G.S.mine(G.me)) {
            if (!(G.plan && G.plan.pow > 0.02)) label(ctx, T('AIM WITH THE MOUSE OR DRAG', 'NGẮM BẰNG CHUỘT HOẶC KÉO'), me.x, me.y + RAD + 13, '#F7F4EC', '#050E18');
            else if (!G.locked) label(ctx, T('CLICK TO LOCK YOUR AIM', 'BẤM ĐỂ CHỐT HƯỚNG'), me.x, me.y + RAD + 13, '#F7F4EC', '#050E18');
            else label(ctx, T('LOCKED · PRESS READY', 'ĐÃ CHỐT · BẤM SẴN SÀNG'), me.x, me.y + RAD + 13, '#F5B041', '#050E18');
          }
        }
        if (me && me.alive) label(ctx, T('YOU', 'BẠN'), me.x, me.y - RAD - (G.phase === 'plan' ? 9 : 9), '#2DD4BF', '#050E18');
        for (const q of G.parts) if (q.txt) {
          ctx.font = '22px "Jersey 15", monospace'; ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, q.l * 3);
          ctx.lineWidth = 4; ctx.strokeStyle = '#050E18'; ctx.lineJoin = 'round'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.txt === 'SPLASH!' ? '#BFE9FF' : '#F5B041'; ctx.fillText(q.txt, q.x, q.y);
          ctx.globalAlpha = 1; ctx.textAlign = 'left';
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      // a bumper boat seen from above: a fat rubber ring, the deck, a steering wheel and the captain
      function boat(ctx, b, p, s, tt, i) {
        const bob = Math.sin(tt * 2.2 + i * 1.7) * 0.35;
        ctx.save(); ctx.translate(b.x, b.y + bob); ctx.scale(s, s);
        ctx.fillStyle = 'rgba(5,14,24,.38)'; ctx.beginPath(); ctx.arc(2.2, 3.2, RAD + 0.8, 0, 7); ctx.fill();
        ctx.fillStyle = '#050E18'; ctx.beginPath(); ctx.arc(0, 0, RAD + 1.2, 0, 7); ctx.fill();
        ctx.fillStyle = p.col[1]; ctx.beginPath(); ctx.arc(0, 0, RAD, 0, 7); ctx.fill();
        ctx.strokeStyle = p.col[0]; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, 0, RAD - 2.4, 3.6, 5.9); ctx.stroke();          // shine on the ring
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, RAD - 2.4, 3.9, 4.6); ctx.stroke();
        ctx.fillStyle = '#050E18'; ctx.beginPath(); ctx.arc(0, 0, RAD - 4.6, 0, 7); ctx.fill();
        ctx.fillStyle = '#F7F4EC'; ctx.beginPath(); ctx.arc(0, 0, RAD - 5.2, 0, 7); ctx.fill();                                // deck
        ctx.rotate(b.ang);
        ctx.fillStyle = '#050E18'; ctx.beginPath(); ctx.moveTo(RAD + 4.2, 0); ctx.lineTo(RAD - 1, -4.4); ctx.lineTo(RAD - 1, 4.4); ctx.closePath(); ctx.fill();   // nose: where it points
        ctx.fillStyle = p.col[0]; ctx.beginPath(); ctx.moveTo(RAD + 2.2, 0); ctx.lineTo(RAD - 0.2, -2.6); ctx.lineTo(RAD - 0.2, 2.6); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#050E18'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(3.6, 0, 2, 0, 7); ctx.stroke();                 // steering wheel
        ctx.restore();
        ctx.save(); ctx.translate(b.x, b.y + bob); ctx.scale(s, s);
        ctx.font = '11px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.av, -1, 0.6);
        ctx.restore(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
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
          '<strong class="text-bone">Plan in secret:</strong> the arrow follows your mouse (on a phone, drag your finger): where its tip points is where you\'ll stop, so a longer arrow = more power. Click to lock it, then press READY. You can see every boat, but not where they will go.',
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
