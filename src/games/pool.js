    /* =========================================================================
       POOL (8-ball) with real rigid-body physics.
       - Real units: a ball is 57 mm (22 px), so 1 metre = 385 px.
       - Every ball has a position, a velocity and a 3-axis spin.
       - Cloth: a ball first SLIDES (friction 0.2) until the contact point stops slipping,
         then ROLLS with a tiny rolling resistance. That is what makes draw, follow and stun work.
       - Ball-ball hits: 95% bounce, plus a little friction ("throw" and spin transfer).
       - Cushions: lose energy with speed, and side-spin changes the rebound angle.
       - Pockets: cushions end in rounded jaw tips, so balls can rattle and bounce out.
       ========================================================================= */
    (function poolGame() {
      const W = 1000, H = 540, L = 44, R = 956, T = 44, B = 496, BR = 11, MX = 500, MY = 270;
      const CC = 35, SS = 56;                         // pocket mouth sizes (corner, side)
      const PXM = 385, GA = 9.81 * PXM;               // pixels per metre, gravity in px/s^2
      const MU_S = 0.2, MU_R = 0.021, MU_BB = 0.06, MU_C = 0.25, E_BB = 0.95, ALPHA_Z = 14, STOP = 5;
      const DT = 1 / 960, VMAX = 2700;               // physics step, fastest cue strike (7 m/s)
      const MAX_OFF = 0.62;                           // how far from the centre you may hit the cue ball
      const POCKETS = [[L - 5, T - 5, 21], [MX, T - 11, 17], [R + 5, T - 5, 21], [L - 5, B + 5, 21], [MX, B + 11, 17], [R + 5, B + 5, 21]];
      const COL = { 1: '#F5C518', 2: '#2563EB', 3: '#DC2626', 4: '#F472B6', 5: '#F97316', 6: '#16A34A', 7: '#7F1D1D', 8: '#111827' };
      const colorOf = (n) => COL[n > 8 ? n - 8 : n];
      const groupOf = (n) => (n === 8 ? '8' : n < 8 ? 'solid' : 'stripe');
      const HEAD = [272, MY], FOOT = [728, MY];
      const hyp = Math.hypot, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      let G = null;
      const $ = (id) => document.getElementById(id);

      /* ---------- the table: cushion lines and the rounded tips of the pocket jaws ---------- */
      const SEGS = [
        { ax: L + CC, ay: T, bx: MX - SS / 2, by: T, nx: 0, ny: -1 }, { ax: MX + SS / 2, ay: T, bx: R - CC, by: T, nx: 0, ny: -1 },
        { ax: L + CC, ay: B, bx: MX - SS / 2, by: B, nx: 0, ny: 1 }, { ax: MX + SS / 2, ay: B, bx: R - CC, by: B, nx: 0, ny: 1 },
        { ax: L, ay: T + CC, bx: L, by: B - CC, nx: -1, ny: 0 }, { ax: R, ay: T + CC, bx: R, by: B - CC, nx: 1, ny: 0 },
      ];
      const TIPS = [];
      SEGS.forEach((s) => { TIPS.push([s.ax + s.nx * 3, s.ay + s.ny * 3]); TIPS.push([s.bx + s.nx * 3, s.by + s.ny * 3]); });

      /* ---------- balls ---------- */
      const IDENT = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      const GHOST = { n: 0, x: 0, y: 0, m: IDENT, dirty: true };
      function newBall(n, x, y) {
        // orientation: the number faces the player, turned a random amount
        const a = Math.random() * 6.283, c = Math.cos(a), s = Math.sin(a);
        const Q = [0, 0, 1, 0, 1, 0, -1, 0, 0];       // body x axis -> towards the viewer
        const m = [c * Q[0] - s * Q[3], c * Q[1] - s * Q[4], c * Q[2] - s * Q[5], s * Q[0] + c * Q[3], s * Q[1] + c * Q[4], s * Q[2] + c * Q[5], Q[6], Q[7], Q[8]];
        return { n, x, y, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0, on: true, m, dirty: true };
      }
      function rack(sh = shuffle, rnd = Math.random) {
        const balls = [newBall(0, HEAD[0], HEAD[1])];
        const rest = sh([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]);
        const cells = []; for (let k = 0; k < 5; k++) for (let j = 0; j <= k; j++) cells.push([k, j]);
        const dx = BR * 1.7321 + 0.12, dy = BR * 2 + 0.12;
        // the 8 sits in the middle of the third row; the two back corners are one solid and one stripe
        const p0 = rest.findIndex((n) => n < 8), s0 = rest.findIndex((n) => n > 8);
        const a = rest[p0], b = rest[s0], order = rest.filter((n) => n !== a && n !== b);
        const seq = []; let oi = 0;
        for (let i = 0; i < 15; i++) { if (i === 10) seq.push(a); else if (i === 14) seq.push(b); else if (i === 4) seq.push(8); else seq.push(order[oi++]); }
        // a real rack is never perfect: every ball sits up to ~0.4 px off its spot with a tiny gap, so no two breaks match
        const jit = () => (rnd() - 0.5) * 0.8;
        cells.forEach(([k, j], i) => balls.push(newBall(seq[i], FOOT[0] + k * (dx + 0.05 + rnd() * 0.3) + jit(), FOOT[1] + (j - k / 2) * dy + jit())));
        return balls;
      }
      const isMoving = (b) => b.vx !== 0 || b.vy !== 0 || b.wx !== 0 || b.wy !== 0;
      const moving = (balls) => balls.some((b) => b.on && isMoving(b));
      const maxSpeed = (balls) => balls.reduce((m, b) => (b.on ? Math.max(m, hyp(b.vx, b.vy)) : m), 0);
      const cloneBalls = (balls) => balls.map((b) => ({ n: b.n, x: b.x, y: b.y, vx: b.vx, vy: b.vy, wx: b.wx, wy: b.wy, wz: b.wz, on: b.on }));

      /* ---------- the strike: speed, direction and where on the ball you hit it ----------
         a = sideways (right is +), b = height (up is +), both as a fraction of the ball radius.
         A horizontal cue at height b gives top/back spin w = 2.5 v b / R. b = 0.4 is a natural roll. */
      function applyStrike(c, ang, speed, a, b) {
        const dx = Math.cos(ang), dy = Math.sin(ang), k = 2.5 * speed / BR;
        c.vx = dx * speed; c.vy = dy * speed;
        c.wx = k * b * dy; c.wy = -k * b * dx; c.wz = -k * a;
      }
      const speedOf = (f) => VMAX * (0.04 + 0.96 * Math.pow(clamp(f, 0, 1), 1.6));

      /* ---------- physics ---------- */
      function rollStep(b, t) {
        const sp = hyp(b.vx, b.vy);
        if (sp === 0) { b.wx = b.wy = 0; return; }
        const d = MU_R * GA * t;
        if (sp <= d || sp < STOP) { b.vx = b.vy = 0; b.wx = b.wy = 0; return; }
        const f = (sp - d) / sp; b.vx *= f; b.vy *= f; b.wx = b.vy / BR; b.wy = -b.vx / BR;
      }
      function cushion(b, nx, ny, ev) {            // (nx,ny) points from the ball into the cushion
        const vn = b.vx * nx + b.vy * ny;
        if (vn <= 0) return;
        const e = Math.max(0.5, 0.86 - 0.04 * (vn / PXM));
        const tx = -ny, ty = nx, Jn = (1 + e) * vn;
        const ut = b.vx * tx + b.vy * ty + BR * b.wz;
        const lim = MU_C * Jn; const jt = clamp(ut / 3.5, -lim, lim);
        b.vx -= Jn * nx + jt * tx; b.vy -= Jn * ny + jt * ty;
        b.wz -= 2.5 * jt / BR;
        const ax = ny, ay = -nx, wa = b.wx * ax + b.wy * ay;      // roll component that belonged to the speed into the cushion
        b.wx -= (1 + e) * wa * ax; b.wy -= (1 + e) * wa * ay;
        ev.railHit = true; ev.snd = Math.max(ev.snd || 0, Math.min(1, vn / 900));
        if (ev.contact) ev.railAfter = true; else ev.railBefore = true;
        if (!ev.firstRail) ev.firstRail = ev.t;
      }
      function walls(b, ev) {
        if (b.x > L + BR + 6 && b.x < R - BR - 6 && b.y > T + BR + 6 && b.y < B - BR - 6) return;
        for (const s of SEGS) {
          const dist = -((b.x - s.ax) * s.nx + (b.y - s.ay) * s.ny);
          if (dist >= BR || dist < -6) continue;
          const ex = s.bx - s.ax, ey = s.by - s.ay, t = (b.x - s.ax) * ex + (b.y - s.ay) * ey;
          if (t < 0 || t > ex * ex + ey * ey) continue;
          b.x -= s.nx * (BR - dist); b.y -= s.ny * (BR - dist);
          cushion(b, s.nx, s.ny, ev);
        }
        const rr = BR + 3;
        for (const [tx, ty] of TIPS) {
          const dx = b.x - tx, dy = b.y - ty, d2 = dx * dx + dy * dy;
          if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2); b.x += (dx / d) * (rr - d); b.y += (dy / d) * (rr - d); cushion(b, -dx / d, -dy / d, ev); }
        }
      }
      function pocketTest(b, ev) {
        const px = b.x < MX ? b.x - L : R - b.x, py = b.y < MY ? b.y - T : B - b.y;
        const into = (px + py < 26 && px < CC && py < CC) || (Math.abs(b.x - MX) < SS / 2 - 3 && (b.y < T - 1 || b.y > B + 1)) ||
          b.x < L - 28 || b.x > R + 28 || b.y < T - 28 || b.y > B + 28;
        if (!into) return false;
        let best = POCKETS[0], bd = 1e9;
        for (const p of POCKETS) { const d = hyp(b.x - p[0], b.y - p[1]); if (d < bd) { bd = d; best = p; } }
        b.on = false; const sp = hyp(b.vx, b.vy); b.vx = b.vy = b.wx = b.wy = b.wz = 0;
        (ev.pocketed = ev.pocketed || []).push(b.n); (ev.drops = ev.drops || []).push({ n: b.n, x: b.x, y: b.y, px: best[0], py: best[1] });
        ev.pocketSound = true; ev.snd = Math.max(ev.snd || 0, Math.min(1, sp / 900));
        return true;
      }
      function pairHit(a, c, ev) {
        const dx = c.x - a.x, dy = c.y - a.y, d2 = dx * dx + dy * dy, md = 2 * BR;
        if (d2 >= md * md || d2 < 1e-9) return;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = md - d;
        a.x -= nx * ov / 2; a.y -= ny * ov / 2; c.x += nx * ov / 2; c.y += ny * ov / 2;
        const vn = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny;
        if (vn <= 0) return;
        const Jn = (1 + E_BB) * vn / 2;
        a.vx -= Jn * nx; a.vy -= Jn * ny; c.vx += Jn * nx; c.vy += Jn * ny;
        // friction between the two balls: throws the object ball a little and trades side-spin
        const tx = -ny, ty = nx;
        const ut = (a.vx - c.vx) * tx + (a.vy - c.vy) * ty + BR * (a.wz + c.wz);
        const lim = MU_BB * Jn, jt = clamp(ut / 7, -lim, lim);
        a.vx -= jt * tx; a.vy -= jt * ty; c.vx += jt * tx; c.vy += jt * ty;
        a.wz -= 2.5 * jt / BR; c.wz -= 2.5 * jt / BR;
        ev.ballHit = true; ev.snd = Math.max(ev.snd || 0, Math.min(1, vn / 1100));
        if (!ev.contact && (a.n === 0 || c.n === 0)) { ev.contact = true; ev.first = a.n === 0 ? c.n : a.n; ev.tFirst = ev.t; ev.cx = a.n === 0 ? a.x : c.x; ev.cy = a.n === 0 ? a.y : c.y; }
      }
      function step(balls, dt, ev) {
        ev.t = (ev.t || 0) + dt;
        const n = balls.length;
        for (let i = 0; i < n; i++) {
          const b = balls[i]; if (!b.on) continue;
          if (b.wz) { const d = ALPHA_Z * dt; b.wz = Math.abs(b.wz) <= d ? 0 : b.wz - Math.sign(b.wz) * d; }
          if (b.vx === 0 && b.vy === 0 && b.wx === 0 && b.wy === 0) continue;
          const ux = b.vx + BR * b.wy, uy = b.vy - BR * b.wx, us = hyp(ux, uy);   // slip of the contact point on the cloth
          if (us > 0.5) {
            const k = 3.5 * MU_S * GA, tt = Math.min(dt, us / k);
            const ax = -MU_S * GA * ux / us, ay = -MU_S * GA * uy / us, al = 2.5 * MU_S * GA / BR;
            b.vx += ax * tt; b.vy += ay * tt; b.wx += al * (uy / us) * tt; b.wy -= al * (ux / us) * tt;
            if (tt < dt) rollStep(b, dt - tt);
          } else rollStep(b, dt);
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (pocketTest(b, ev)) continue;
          walls(b, ev);
        }
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < n; i++) {
            const a = balls[i]; if (!a.on) continue;
            const am = isMoving(a);
            for (let j = i + 1; j < n; j++) { const c = balls[j]; if (!c.on || (!am && !isMoving(c))) continue; pairHit(a, c, ev); }
          }
        }
      }
      function run(balls, secs, ev) { const N = Math.round(secs / DT); for (let i = 0; i < N; i++) { step(balls, DT, ev); if (!moving(balls)) break; } }
      function spinBall(b, dt) {                                  // turn the picture of the ball (looks only)
        const w = hyp(b.wx, b.wy, b.wz); if (w < 1e-3) return;
        const th = w * dt, kx = b.wx / w, ky = b.wy / w, kz = b.wz / w, s = Math.sin(th), c = Math.cos(th), t = 1 - c, m = b.m;
        const r = [c + kx * kx * t, kx * ky * t - kz * s, kx * kz * t + ky * s, ky * kx * t + kz * s, c + ky * ky * t, ky * kz * t - kx * s, kz * kx * t - ky * s, kz * ky * t + kx * s, c + kz * kz * t];
        const o = new Array(9);
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[i * 3 + j] = r[i * 3] * m[j] + r[i * 3 + 1] * m[3 + j] + r[i * 3 + 2] * m[6 + j];
        b.m = o; b.dirty = true;
      }

      /* ---------- aiming helpers ---------- */
      function segDist(px, py, ax, ay, bx, by) { const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy; let t = l2 ? ((px - ax) * vx + (py - ay) * vy) / l2 : 0; t = clamp(t, 0, 1); return hyp(px - (ax + t * vx), py - (ay + t * vy)); }
      function rayFirst(balls, ox, oy, dx, dy) {
        let best = { t: 1e9, ball: null };
        for (const b of balls) { if (!b.on || b.n === 0) continue; const fx = ox - b.x, fy = oy - b.y; const bb = fx * dx + fy * dy, cc = fx * fx + fy * fy - 4 * BR * BR; const disc = bb * bb - cc; if (disc < 0) continue; const t = -bb - Math.sqrt(disc); if (t > 0 && t < best.t) best = { t, ball: b }; }
        let tw = 1e9;
        if (dx > 0) tw = Math.min(tw, (R - BR - ox) / dx); else if (dx < 0) tw = Math.min(tw, (L + BR - ox) / dx);
        if (dy > 0) tw = Math.min(tw, (B - BR - oy) / dy); else if (dy < 0) tw = Math.min(tw, (T + BR - oy) / dy);
        if (best.t < tw) return best; return { t: tw, ball: null };
      }
      function legalSet(balls, group) {
        const on = balls.filter((b) => b.on && b.n !== 0);
        if (!group) return on.filter((b) => b.n !== 8).map((b) => b.n);
        const mine = on.filter((b) => groupOf(b.n) === group);
        return mine.length ? mine.map((b) => b.n) : [8];
      }
      function planShots(balls, cx, cy, targets) {
        const out = [];
        for (const t of balls) {
          if (!t.on || !targets.includes(t.n)) continue;
          for (const [px, py] of POCKETS) {
            const ddx = px - t.x, ddy = py - t.y, dl = hyp(ddx, ddy); if (dl < 1) continue;
            const ux = ddx / dl, uy = ddy / dl;
            const gx = t.x - ux * 2 * BR, gy = t.y - uy * 2 * BR;
            if (gx < L + BR || gx > R - BR || gy < T + BR || gy > B - BR) continue;
            const vx = gx - cx, vy = gy - cy, d1 = hyp(vx, vy); if (d1 < 4) continue;
            const cos = (vx / d1) * ux + (vy / d1) * uy; if (cos < 0.3) continue;
            let clear = true;
            for (const o of balls) { if (!o.on || o.n === 0 || o === t) continue; if (segDist(o.x, o.y, cx, cy, gx, gy) < 2 * BR * 0.97 || segDist(o.x, o.y, t.x, t.y, px, py) < 2 * BR * 0.97) { clear = false; break; } }
            if (!clear) continue;
            out.push({ t: t.n, pocket: [px, py], ang: Math.atan2(vy, vx), d1, d2: dl, cos, score: d1 * 0.4 + dl * 0.6 + (1 - cos) * 450 });
          }
        }
        return out.sort((a, b) => a.score - b.score);
      }
      const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += Math.random(); return (u - 3) / 0.7071; };

      // Run the real physics on a copy of the table to show where this exact shot will go.
      function predict(balls, ang, speed, a, b) {
        const sim = cloneBalls(balls), c = sim[0], ev = {};
        applyStrike(c, ang, speed, a, b);
        const cue = [[c.x, c.y]]; let ci = -1, objPts = [], ob = null, tEnd = 3, rail = false;
        for (let i = 0; i < 2880; i++) {
          step(sim, DT, ev);
          if (i % 6 === 0) { if (c.on) cue.push([c.x, c.y]); if (ob && ob.on) objPts.push([ob.x, ob.y]); }
          if (ev.contact && ci < 0) { ci = cue.length; ob = sim.find((x) => x.n === ev.first); objPts.push([ob.x, ob.y]); tEnd = Math.min(tEnd, ev.t + 0.5); }
          if (!ev.contact && ev.railBefore) { cue.push([c.x, c.y]); rail = true; break; }   // show the cue path only as far as the first cushion
          if (ev.t >= tEnd || !c.on || !moving(sim)) break;
        }
        return { cue, ci, rail, first: ev.contact ? ev.first : null, ghost: ev.contact ? [ev.cx, ev.cy] : null, obj: objPts, scratch: !c.on, pocketed: ev.pocketed || [] };
      }

      /* ---------- game ---------- */
      const LV = ['Easy', 'Medium', 'Hard'];
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1020px] mx-auto');
        setupScreen(body, mod, [
          { key: 'lvl', label: 'DIFFICULTY', def: 2, local: true, choices: [[1, 'Easy'], [2, 'Medium'], [3, 'Hard']] },
          { key: 'clock', label: 'SHOT TIMER', def: 0, choices: [[0, 'Off'], [30, '30 s'], [45, '45 s'], [60, '60 s']] },
          { key: 'guide', label: 'AIM GUIDE', def: 'classic', choices: [['classic', 'Classic'], ['pro', 'Pro'], ['off', 'Off']], hint: 'Classic: aim line, ghost ball and two short arrows for where both balls head. Pro: no arrows. Off: just a short line.' },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }, { bot: true, name: `AI (${LV[+sel.lvl - 1]})`, avatar: '🤖' }], sel)));
      }
      // seats come from the table (S): seat 0 breaks. Online the shooter's screen decides where the balls stopped
      // ('end'), so every screen agrees even if a ball rolls a hair differently.
      function start(body, sel, S) {
        G = { S, me: S.online ? S.me : 0, body, guide: ['classic', 'pro', 'off'].includes(sel.guide) ? sel.guide : 'classic', lvl: +sel.lvl || 2, secs: +sel.clock, balls: rack(S.rng.shuffle, S.rng.random), turn: 0, groups: [null, null], bih: false, placing: false, aim: 0, power: 0, lastPower: 0.45, spin: { a: 0, b: 0 }, phase: 'aim', shots: 0, tok: ++GT.cur, over: false, msg: '', fouls: 0, pocketedBy: [[], []], lastSnd: 0, pocketedTotal: 0, resign: false, drops: [], pull: null, aimDrag: false, cueVis: true, cuePull: 8, pred: null, predKey: '', lastTs: 0 };
        body.innerHTML = `<div class="pl-lay space-y-3"><div class="pl-seats grid grid-cols-2 gap-3" data-bub="left">
          <div id="pl-seat-0" class="seat" style="text-align:left"></div><div id="pl-seat-1" class="seat" style="text-align:left"></div></div>
          <div class="pl-table relative"><canvas id="pl-cv" width="${W}" height="${H}" style="width:100%;display:block;border:4px solid var(--ink);box-shadow:0 5px 0 var(--ink);touch-action:none;cursor:grab;background:#4B2E1A"></canvas></div>
          <div id="pl-bar" class="pl-bar"><div id="pl-fill" class="pl-fill"></div><div id="pl-knob" class="pl-knob"></div><span class="pl-lab">PULL BACK  ◀  THEN LET GO TO SHOOT</span></div>
          <div class="pl-ctl win p-3 space-y-3">
            <div class="flex items-start gap-3">
              <div class="text-center shrink-0" title="Where the cue hits the ball. Up = follow, down = draw, sideways = side-spin.">
                <canvas id="pl-spin" width="132" height="132" style="width:86px;height:86px;touch-action:none;cursor:crosshair;display:block;margin:0 auto"></canvas>
                <div class="pix text-[11px] text-muted mt-1">HIT POINT</div><div id="pl-sp-txt" class="pix text-xs text-amber">CENTRE</div>
              </div>
              <div class="flex-1 min-w-0 space-y-2">
                <div id="pl-msg" class="text-sm font-bold min-h-[20px]"></div>
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div class="flex items-center gap-2"><button id="pl-l" class="btn-game btn-graphite py-1 px-3 text-sm" title="Turn the aim a little left (←)">◀</button><span class="pix text-[11px] text-muted">FINE AIM</span><button id="pl-r" class="btn-game btn-graphite py-1 px-3 text-sm" title="Turn the aim a little right (→)">▶</button></div>
                  <div class="flex items-center gap-2"><span class="pix text-[11px] text-muted">POWER</span><span id="pl-pv" class="pl-pct text-amber">0%</span></div>
                </div>
              </div>
            </div>
            <div id="pl-clock"></div></div>
          <div class="grid grid-cols-2 gap-3"><button id="pl-resign" class="btn-game btn-coral py-2 text-sm">Resign</button><button id="pl-new" class="btn-game btn-graphite py-2 text-sm">${S.online ? 'Leave' : 'New game'}</button></div></div>`;
        G.cv = $('pl-cv'); G.ctx = G.cv.getContext('2d'); G.clock = makeClock($('pl-clock'));
        // phones held upright (Inna, Nov 2026): the table stands up. Only the drawing turns; the physics is the same.
        G.up = window.innerWidth < 640 && window.innerHeight > window.innerWidth;
        if (G.up) { G.cv.width = H; G.cv.height = W; G.ctx.setTransform(0, 1, -1, 0, H, 0); G.cv.classList.add('pl-up'); body.querySelector('.pl-table').classList.add('pl-up-wrap'); }
        G.bg = document.createElement('canvas'); G.bg.width = W; G.bg.height = H; drawTable(G.bg.getContext('2d'));
        wireInput();
        $('pl-new').onclick = () => npConfirmLeave(() => open($('game-root')));
        S.on(apply, () => {});
        $('pl-resign').onclick = (e) => { if (G.over) return; if (!G.resign) { G.resign = true; e.target.textContent = 'Really resign?'; gTimeout(() => { if (G) { G.resign = false; e.target.textContent = 'Resign'; } }, 3000); return; } return G.S.act({ t: 'resign', s: G.me }); finish(1, 'You resigned.'); };
        G.aim = 0; setPower(0); drawSpin();
        say(S.mine(0) ? 'Break! Hold the table and drag to aim, then pull the power bar back and let go.' : `${S.name(0)} breaks.`);
        panels(); beginTurn(); npBar('');
        gRaf(loop);
      }
      const say = (t) => { G.msg = t; const e = $('pl-msg'); if (e) e.textContent = t; };
      const myTurn = () => G && G.S.mine(G.turn);
      const canShoot = () => G && !G.over && G.phase === 'aim' && myTurn();
      const who = (i) => (G.S.mine(i) && (G.S.online || G.S.bot(1 - i)) ? 'You' : G.S.name(i));
      function validCue(x, y) { if (x < L + BR || x > R - BR || y < T + BR || y > B - BR) return false; return G.balls.every((b) => !b.on || b.n === 0 || hyp(b.x - x, b.y - y) > 2 * BR + 1); }

      /* ---------- input: hold the table to aim, pull the bar to shoot, pick the hit point ---------- */
      function setPower(f) {
        G.power = f;
        const bar = $('pl-bar'), fill = $('pl-fill'); if (!bar) return;
        bar.style.setProperty('--p', f.toFixed(3));
        fill.className = 'pl-fill' + (f > 0.75 ? ' hot' : f > 0.4 ? ' mid' : '');
        $('pl-pv').textContent = Math.round(f * 100) + '%';
        bar.classList.toggle('off', !canShoot());
      }
      function setSpin(a, b) {
        const d = hyp(a, b); if (d > MAX_OFF) { a *= MAX_OFF / d; b *= MAX_OFF / d; }
        if (hyp(a, b) < 0.07) { a = 0; b = 0; }
        G.spin = { a, b }; drawSpin();
        const t = []; if (b > 0.12) t.push('FOLLOW'); else if (b < -0.12) t.push('DRAW'); if (a > 0.12) t.push('RIGHT'); else if (a < -0.12) t.push('LEFT');
        $('pl-sp-txt').textContent = t.length ? t.join(' + ') : 'CENTRE';
      }
      function drawSpin() {
        const cv = $('pl-spin'); if (!cv) return; const c = cv.getContext('2d'), S = cv.width, r = S / 2 - 8;
        c.clearRect(0, 0, S, S);
        c.fillStyle = '#F7F4EC'; c.beginPath(); c.arc(S / 2, S / 2, r, 0, 7); c.fill(); c.strokeStyle = '#050E18'; c.lineWidth = 4; c.stroke();
        c.strokeStyle = 'rgba(5,14,24,.28)'; c.lineWidth = 1.5; c.beginPath(); c.arc(S / 2, S / 2, r * MAX_OFF, 0, 7); c.moveTo(S / 2 - r, S / 2); c.lineTo(S / 2 + r, S / 2); c.moveTo(S / 2, S / 2 - r); c.lineTo(S / 2, S / 2 + r); c.stroke();
        c.fillStyle = 'rgba(5,14,24,.55)'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('TOP', S / 2, S / 2 - r + 11); c.fillText('BOTTOM', S / 2, S / 2 + r - 11);
        c.fillStyle = '#E4572E'; c.strokeStyle = '#050E18'; c.lineWidth = 3; c.beginPath(); c.arc(S / 2 + G.spin.a * r, S / 2 - G.spin.b * r, 9, 0, 7); c.fill(); c.stroke();
      }
      function wireInput() {
        const cv = G.cv, pt = (e) => { const r = cv.getBoundingClientRect();
          if (G.up) { const X = (e.clientX - r.left) * H / r.width, Y = (e.clientY - r.top) * W / r.height; return [Y, H - X]; }   // upright table: turn the tap back
          return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
        const aimAt = (x, y) => { const c = G.balls[0]; if (hyp(x - c.x, y - c.y) < 16) return; G.aim = Math.atan2(y - c.y, x - c.x); };
        cv.onpointermove = (e) => {
          if (G.over) return; const [x, y] = pt(e);
          if (G.phase === 'aim' && myTurn()) {
            if (G.placing) G.ghost = [x, y]; else if (G.aimDrag) aimAt(x, y);
            else cv.style.cursor = G.bih && hyp(x - G.balls[0].x, y - G.balls[0].y) < 28 ? 'move' : 'grab';
          }
        };
        cv.onpointerdown = (e) => {
          if (!canShoot()) return; const [x, y] = pt(e);
          // ball in hand: press, drag the cue ball where you want it and let go. Until you shoot you can pick it up again.
          if (G.placing || (G.bih && hyp(x - G.balls[0].x, y - G.balls[0].y) < 28)) {
            G.placing = true; G.dragCue = true; G.ghost = [x, y]; cv.style.cursor = 'grabbing'; try { cv.setPointerCapture(e.pointerId); } catch (_) {} return;
          }
          G.aimDrag = true; cv.style.cursor = 'grabbing'; try { cv.setPointerCapture(e.pointerId); } catch (_) {} aimAt(x, y);
        };
        const up = () => {
          G.aimDrag = false; cv.style.cursor = 'grab';
          if (G.dragCue) {
            G.dragCue = false; const gh = G.ghost;
            if (gh && validCue(gh[0], gh[1])) { G.balls[0].x = gh[0]; G.balls[0].y = gh[1]; G.placing = false; G.ghost = null; SFX.play('ball'); say('Cue ball placed. Drag it again to move it, or drag the table to aim. Pull the bar back to shoot.'); }
            else { SFX.play('wrong'); showToast('Cannot place the cue ball there.', 'error'); }
          }
        };
        cv.onpointerup = up; cv.onpointercancel = up;
        cv.addEventListener('wheel', (e) => { if (!canShoot() || G.placing) return; G.aim += Math.sign(e.deltaY) * 0.003; e.preventDefault(); }, { passive: false });
        const nudge = (d) => { if (canShoot() && !G.placing) G.aim += d; };
        $('pl-l').onclick = () => nudge(-0.006); $('pl-r').onclick = () => nudge(0.006);
        // power bar: press, pull to the left, let go
        const bar = $('pl-bar');
        bar.onpointerdown = (e) => { if (!canShoot()) return; if (G.placing) { showToast('Place the cue ball first: click the table.', 'error'); return; } try { bar.setPointerCapture(e.pointerId); } catch (_) {} G.pull = { x0: e.clientX, w: bar.getBoundingClientRect().width }; bar.classList.add('dragging'); setPower(0); e.preventDefault(); };
        bar.onpointermove = (e) => { if (!G.pull) return; setPower(clamp((G.pull.x0 - e.clientX) / (G.pull.w * 0.82), 0, 1)); };
        const rel = () => { if (!G.pull) return; G.pull = null; bar.classList.remove('dragging'); const f = G.power; if (f < 0.03 || !canShoot()) { setPower(0); if (canShoot()) say('Pull the bar further back, then let go.'); return; } humanShoot(f); };
        bar.onpointerup = rel; bar.onpointercancel = () => { G.pull = null; bar.classList.remove('dragging'); setPower(0); };
        // hit point
        const sp = $('pl-spin');
        const pick = (e) => { const r = sp.getBoundingClientRect(), S = r.width, rad = S / 2 * (124 / 132); setSpin(((e.clientX - r.left) - S / 2) / rad, -((e.clientY - r.top) - S / 2) / rad); };
        let down = false;
        sp.onpointerdown = (e) => { down = true; try { sp.setPointerCapture(e.pointerId); } catch (_) {} pick(e); };
        sp.onpointermove = (e) => { if (down) pick(e); }; sp.onpointerup = sp.onpointercancel = () => { down = false; };
        sp.ondblclick = () => setSpin(0, 0);
        gOn(document, 'keydown', (e) => {
          if (!G || G.over || !canShoot()) return;
          if (e.key === 'ArrowLeft') { nudge(e.shiftKey ? -0.03 : -0.004); e.preventDefault(); }
          else if (e.key === 'ArrowRight') { nudge(e.shiftKey ? 0.03 : 0.004); e.preventDefault(); }
          else if (e.key === ' ' || e.key === 'Enter') { if (!/INPUT|BUTTON/.test(e.target.tagName)) { e.preventDefault(); humanShoot(G.lastPower); } }
        });
      }

      /* ---------- turns ---------- */
      function beginTurn() {
        if (G.over) return;
        G.phase = 'aim'; G.cueVis = true; G.cuePull = 8; G.predKey = ''; G.peekAim = undefined; G.peekPow = 0; G.peekPowT = 0;
        G.S.onPeek = (i, d) => {
          if (!G || G.phase !== 'aim' || i !== G.turn || !d) return;
          if (isFinite(d.a) && !d.h) { G.peekAim = +d.a; G.peekPowT = Math.max(0, Math.min(1, +d.p || 0)); }
          // ball in hand on another screen: move our cue ball where they are dragging / dropped it
          if (G.bih && Array.isArray(d.c) && isFinite(d.c[0]) && isFinite(d.c[1])) { G.peekCue = [+d.c[0], +d.c[1]]; G.peekHand = !!d.h; }
        };
        G.peekCue = null; G.peekHand = false;
        const me = myTurn(), c = G.balls[0];
        if (G.bih && me) { G.placing = true; say('Foul! You have the cue ball in hand: drag it anywhere on the table and let go.'); }
        panels(); setPower(0);
        if (me) {
          const tg = legalSet(G.balls, G.groups[G.turn]);
          let best = null, bd = 1e9; for (const b of G.balls) if (b.on && tg.includes(b.n)) { const d = hyp(b.x - c.x, b.y - c.y); if (d < bd) { bd = d; best = b; } }
          if (best) G.aim = Math.atan2(best.y - c.y, best.x - c.x);
          if (G.secs) G.clock.start(G.secs, 'Your shot', autoShot, 6); else G.clock.idle('No timer', '∞');
        } else if (G.S.bot(G.turn)) {
          G.clock.idle('AI turn', '...');
          const tok = G.tok;
          if (G.S.isHost) gTimeout(() => { if (G && G.tok === tok && !G.over && G.phase === 'aim') aiShoot(); }, 900);
        } else {
          say(G.bih ? `${G.S.name(G.turn)} has the cue ball in hand and is placing it...` : `${G.S.name(G.turn)} is lining up a shot...`);
          if (G.secs) G.clock.start(G.secs + 5, 'Their shot', () => {}, 6); else G.clock.idle('Their shot', '...');
        }
      }
      function humanShoot(f) {
        if (!canShoot()) return;
        if (G.placing) {
          const spots = [[HEAD[0], HEAD[1]], [HEAD[0] - 60, HEAD[1]], [HEAD[0], HEAD[1] + 60], [HEAD[0], HEAD[1] - 60]];
          const sp = G.ghost && validCue(...G.ghost) ? G.ghost : spots.find((s) => validCue(...s)) || spots[0];
          G.balls[0].x = sp[0]; G.balls[0].y = sp[1]; G.placing = false; G.bih = false; G.ghost = null;
        }
        G.clock.stop(); G.lastPower = f;
        const a = G.spin.a, b = G.spin.b;
        setSpin(0, 0);
        sendShot(G.aim, speedOf(f), a, b, 8 + f * 120);
      }
      function autoShot() {
        if (!G || G.over || G.phase !== 'aim' || !myTurn()) return;
        showToast("Time's up! A shot was taken for you.", 'error');
        G.pull = null; setPower(0);
        if (G.placing) { G.placing = false; G.bih = false; G.ghost = null; const sp = [[HEAD[0], HEAD[1]], [HEAD[0] - 60, HEAD[1]], [HEAD[0], HEAD[1] + 70]].find((s) => validCue(...s)) || HEAD; G.balls[0].x = sp[0]; G.balls[0].y = sp[1]; }
        const c = G.balls[0], plans = planShots(G.balls, c.x, c.y, legalSet(G.balls, G.groups[G.turn]));
        if (plans.length) { G.aim = plans[0].ang + gauss() * 0.04; sendShot(G.aim, speedOf(0.4), 0, 0, 60); } else sendShot(G.aim, speedOf(0.35), 0, 0, 50);
      }
      // a shot goes to the table (with where the cue ball was placed); every screen plays it
      function sendShot(ang, speed, a, b, pull) {
        G.phase = 'sent';
        const c = G.balls[0];
        if (G.shots === 0) { ang += (Math.random() - 0.5) * 0.006; speed *= 0.97 + Math.random() * 0.06; }   // a human break is never twice the same
        G.S.act({ t: 'shot', s: G.turn, n: G.shots, ang, speed, a, b, pull, cx: c.x, cy: c.y });
      }
      function apply(a) {
        if (!G || G.over) return 0;
        const num = (v, lo, hi) => clamp(+v || 0, lo, hi);
        if (a.t === 'shot') {
          if (a.s !== G.turn || a.n !== G.shots || !['aim', 'sent'].includes(G.phase)) return 0;
          const c = G.balls[0];
          let moved = 0;
          if (G.bih && validCue(+a.cx, +a.cy)) { moved = hyp(c.x - a.cx, c.y - a.cy); c.x = +a.cx; c.y = +a.cy; } G.placing = false; G.bih = false; G.ghost = null; G.peekCue = null;
          G.aim = num(a.ang, -10, 10);
          const go = () => strike(G.aim, num(a.speed, 0, VMAX), num(a.a, -1, 1), num(a.b, -1, 1), num(a.pull, 0, 140));
          // the cue ball was just placed somewhere new (e.g. a computer player's ball in hand): let everyone see it first
          if (moved > 3 && !(typeof NP !== 'undefined' && NP.catchup)) { G.phase = 'sent'; const tok = G.tok; gTimeout(() => { if (G && G.tok === tok && !G.over) go(); }, 800); return 800; }
          go();
          return 0;
        }
        if (a.t === 'end') {
          if (a.n !== G.shots || !['moving', 'settled', 'stroke'].includes(G.phase)) return 0;
          (a.balls || []).forEach(([n, x, y, on]) => { const b = G.balls.find((q) => q.n === n); if (b) { b.x = +x; b.y = +y; b.on = !!on; b.vx = b.vy = b.wx = b.wy = b.wz = 0; } });
          G.ev = Object.assign({ t: 0 }, a.ev || {});
          resolve();
          return 0;
        }
        if (a.t === 'resign' || a.t === '_left' || a.t === '_gone') {
          const loser = a.s, w = 1 - loser;
          finish(w, a.t === 'resign' ? `${who(loser)} resigned.` : `${G.S.name(loser)} ${a.t === '_gone' ? 'disconnected' : 'left the game'}.`);
        }
        return 0;
      }
      // the balls stopped on this screen: the shooter's screen (or the host, for the computer) tells the table where
      function settle() {
        G.phase = 'settled';
        const auth = G.S.mine(G.turn) || (G.S.bot(G.turn) && G.S.isHost);
        if (!auth) return;
        const ev = G.ev || {};
        G.S.act({ t: 'end', s: G.turn, n: G.shots, balls: G.balls.map((b) => [b.n, b.x, b.y, b.on ? 1 : 0]), ev: { pocketed: ev.pocketed || [], first: ev.first === undefined ? null : ev.first, railAfter: !!ev.railAfter } });
      }
      // the cue slides forward, then the ball is struck
      function strike(ang, speed, a, b, pull) {
        G.phase = 'stroke'; G.cueVis = true; G.cueFrom = pull; G.strokeT0 = performance.now(); G.pull = null; setPower(0);
        const tok = G.tok;
        // replaying missed shots after a rejoin: start the shot at once, so its result (the next move) finds it started
        if (typeof NP !== 'undefined' && NP.catchup) { G.cuePull = 8; launch(ang, speed, a, b); return; }
        gTimeout(() => { if (G && G.tok === tok && !G.over) { G.cuePull = 8; launch(ang, speed, a, b); } }, 150);
      }
      function launch(ang, speed, a = 0, b = 0) {
        const c = G.balls[0]; applyStrike(c, ang, speed, a, b);
        G.ev = { t: 0 }; G.phase = 'moving'; G.cueVis = false; G.lastTs = 0;
        G.follow = { t0: performance.now(), x: c.x, y: c.y, aim: ang, f: Math.min(1, speed / VMAX) };
        G.shotLegal = legalSet(G.balls, G.groups[G.turn]); G.shotOn8 = G.shotLegal.length === 1 && G.shotLegal[0] === 8 && !!G.groups[G.turn];
        G.isBreak = G.shots === 0;
        if (!(typeof NP !== 'undefined' && NP.catchup)) poolSnd('cue', Math.min(1, speed / VMAX)); panels();
      }
      // pool sounds follow how hard things hit: a soft kiss is a quiet tick, a hard break is a loud crack
      function poolSnd(kind, s) {
        s = Math.max(0.08, Math.min(1, s)); const t = SFX.tone, n = SFX.noise;
        // the real recordings first (louder for harder hits), the synth if they are not ready yet
        // real recordings (freesound CC0): louder AND brighter the harder the hit
        if (window.realSnd && realSnd(kind, kind === 'ball' ? 0.15 + 1.05 * s : kind === 'pocket' ? 0.5 + 0.6 * s : kind === 'rail' ? 0.35 + 0.95 * s : 0.3 + 0.9 * s, 1, kind === 'pocket' ? 0 : 1800 + 16000 * s * s)) return;
        if (!t || !n) return SFX.play(kind === 'cue' ? 'ball' : kind);
        if (kind === 'ball') { t({ f1: 1500 + 900 * s, f2: 700, d: 0.03 + 0.03 * s, v: 0.08 + 0.5 * s }); n({ type: 'highpass', f1: 3200, d: 0.015 + 0.02 * s, v: 0.05 + 0.35 * s }); }
        else if (kind === 'rail') { t({ type: 'triangle', f1: 170 + 80 * s, f2: 110, d: 0.06 + 0.04 * s, v: 0.08 + 0.4 * s }); n({ type: 'lowpass', f1: 600, d: 0.05, v: 0.05 + 0.2 * s }); }
        else if (kind === 'pocket') { n({ type: 'bandpass', f1: 2200, q: 2, d: 0.05, v: 0.12 + 0.2 * s }); t({ f1: 170, f2: 60, t: 0.04, d: 0.22, v: 0.35 + 0.35 * s }); n({ type: 'lowpass', f1: 700, f2: 180, t: 0.04, d: 0.2, v: 0.2 + 0.25 * s }); }
        else if (kind === 'cue') { t({ type: 'triangle', f1: 900 + 600 * s, f2: 400, d: 0.04, v: 0.12 + 0.4 * s }); n({ type: 'bandpass', f1: 2600, q: 1.2, d: 0.03, v: 0.08 + 0.3 * s }); }
      }
      function fire(ang, f, a = 0, b = 0) { launch(ang, speedOf(f), a, b); }

      /* ---------- AI ---------- */
      function aiShoot() {
        const c = G.balls[0];
        const targets = legalSet(G.balls, G.groups[G.turn]);
        if (G.bih) {
          let bestPos = null, bs = 1e9;
          for (let k = 0; k < 40; k++) { const x = L + 40 + Math.random() * (R - L - 80), y = T + 40 + Math.random() * (B - T - 80); if (!validCue(x, y)) continue; const pl = planShots(G.balls, x, y, targets); const sc = pl.length ? pl[0].score : 900 + Math.random() * 100; if (sc < bs) { bs = sc; bestPos = [x, y]; } }
          const pos = bestPos || [HEAD[0], HEAD[1]]; c.x = pos[0]; c.y = pos[1]; G.bih = false;
        }
        const plans = planShots(G.balls, c.x, c.y, targets);
        const sigma = [0.05, 0.02, 0.0065][G.lvl - 1];
        let ang, speed, b = 0;
        if (G.shots === 0) { ang = Math.atan2(FOOT[1] - c.y, FOOT[0] - c.x); speed = VMAX * (0.8 + Math.random() * 0.1); }
        else if (plans.length) {
          const pick1 = G.lvl === 1 && plans.length > 1 && Math.random() < 0.5 ? plans[1] : plans[0];
          ang = pick1.ang; speed = clamp(330 + 0.55 * (pick1.d1 + pick1.d2) + (G.lvl === 3 ? 60 : 0), 380, 1500);
          if (G.lvl === 1) speed = clamp(speed * (1 + gauss() * 0.18), 330, 1700);
          if (G.lvl === 3 && pick1.d1 < 220) b = -0.25;                       // a touch of draw to stay clear of the pocket
        } else {
          let best = null, bd = 1e9; for (const o of G.balls) if (o.on && targets.includes(o.n)) { const d = hyp(o.x - c.x, o.y - c.y); if (d < bd) { bd = d; best = o; } }
          ang = best ? Math.atan2(best.y - c.y, best.x - c.x) : 0; speed = 520;
        }
        G.aim = ang; G.cueVis = true; G.cuePull = 40;
        if (G.shots > 0) ang += gauss() * sigma;
        const tok = G.tok;
        gTimeout(() => { if (G && G.tok === tok && !G.over && G.phase === 'aim') { G.aim = ang; sendShot(ang, speed, 0, b, 60); } }, 700);
      }

      /* ---------- loop & shot resolution ---------- */
      function loop(ts) {
        if (!G || G.over) return;
        if (G.phase === 'moving') {
          const fixed = mod.engine.fixedFrame;
          let fdt = fixed || (G.lastTs ? Math.min(0.05, (ts - G.lastTs) / 1000) : 1 / 60);
          G.lastTs = ts;
          if (!fixed) { const ms = maxSpeed(G.balls); if (ms < 120) fdt *= 2.6; else if (ms < 330) fdt *= 1.5; }   // skip through the slow crawl at the end
          const N = clamp(Math.round(fdt / DT), 1, 800), ev = G.ev;
          for (let k = 0; k < N; k++) { step(G.balls, DT, ev); if (!moving(G.balls)) break; }
          for (const b of G.balls) if (b.on) spinBall(b, N * DT);
          if (ev.drops && ev.drops.length) { const now = performance.now(); ev.drops.forEach((d) => G.drops.push({ ...d, t0: now })); ev.drops = []; }
          const now = performance.now();
          if ((ev.snd || ev.pocketSound) && now - G.lastSnd > 45) { poolSnd(ev.pocketSound ? 'pocket' : ev.ballHit ? 'ball' : 'rail', ev.snd || 0.5); G.lastSnd = now; ev.snd = 0; ev.pocketSound = false; ev.ballHit = false; }
          if (!moving(G.balls)) settle();
        } else if (G.phase === 'aim' && myTurn() && G.placing) {
          // ball in hand: the other screens watch the cue ball being moved (Inna: "can't see where the opponent places the ball")
          const gh = G.ghost || [G.balls[0].x, G.balls[0].y];
          if (G.S.online && ts - (G.peekT || 0) > 80) { const k = (gh[0] | 0) + ',' + (gh[1] | 0); if (k !== G.peekK) { G.peekK = k; G.peekT = ts; G.S.peek({ a: +G.aim.toFixed(4), p: 0, c: [Math.round(gh[0]), Math.round(gh[1])], h: 1 }); } }
        } else if (G.phase === 'aim' && myTurn() && !G.placing) {
          // online: the other screens watch you aim and pull back live (about 12 times a second)
          if (G.S.online && ts - (G.peekT || 0) > 80) { const c0 = G.balls[0], k = G.aim.toFixed(3) + '|' + G.power.toFixed(2) + '|' + (c0.x | 0) + ',' + (c0.y | 0); if (k !== G.peekK) { G.peekK = k; G.peekT = ts; G.S.peek({ a: +G.aim.toFixed(4), p: +G.power.toFixed(3), c: G.bih ? [Math.round(c0.x), Math.round(c0.y)] : undefined }); } }
          const pw = G.power > 0.02 ? G.power : G.lastPower, key = [G.aim.toFixed(4), G.spin.a.toFixed(2), G.spin.b.toFixed(2), pw.toFixed(2), G.balls[0].x | 0, G.balls[0].y | 0].join('|');
          if (key !== G.predKey) { G.predKey = key; G.pred = predict(G.balls, G.aim, speedOf(pw), G.spin.a, G.spin.b); }
        }
        // watching someone else aim: glide towards their live aim so it looks smooth
        if (G.phase === 'aim' && !myTurn() && G.bih && G.peekCue) { const c = G.balls[0]; c.x += (G.peekCue[0] - c.x) * 0.4; c.y += (G.peekCue[1] - c.y) * 0.4; }
        if (G.phase === 'aim' && !myTurn() && G.peekAim !== undefined) { let d = G.peekAim - G.aim; d = Math.atan2(Math.sin(d), Math.cos(d)); G.aim += d * 0.35; G.peekPow += ((G.peekPowT || 0) - (G.peekPow || 0)) * 0.35; }
        draw();
        gRaf(loop);
      }

      function resolve() {
        const ev = G.ev, me = G.turn, opp = 1 - me;
        G.shots++;
        const pocketed = ev.pocketed || [];
        let foul = false, why = '';
        const cueIn = pocketed.includes(0);
        const objPocketed = pocketed.filter((n) => n !== 0);
        if (cueIn) { foul = true; why = 'Scratch! The cue ball went in a pocket.'; }
        else if (ev.first === undefined || ev.first === null) { foul = true; why = 'Foul: the cue ball did not hit any ball.'; }
        else if (!G.shotLegal.includes(ev.first)) { foul = true; why = ev.first === 8 && !G.shotOn8 ? 'Foul: you hit the 8-ball first.' : 'Foul: you hit the wrong ball first.'; }
        else if (!objPocketed.length && !ev.railAfter) { foul = true; why = 'Foul: no ball touched a cushion after contact.'; }
        let result = null;
        if (objPocketed.includes(8)) {
          if (G.isBreak) { respot8(); objPocketed.splice(objPocketed.indexOf(8), 1); say('The 8-ball went in on the break and was re-spotted.'); }
          else if (G.shotOn8 && !foul) result = me; else result = opp;
        }
        let msg = foul ? why : '';
        if (!result && !G.groups[me] && !foul && !G.isBreak && objPocketed.length) {
          const first = objPocketed.find((n) => n !== 8);
          if (first) { G.groups[me] = groupOf(first); G.groups[opp] = G.groups[me] === 'solid' ? 'stripe' : 'solid'; msg = `${who(me) === 'You' ? 'You are' : who(me) + ' is'} ${G.groups[me] === 'solid' ? 'SOLIDS (1-7)' : 'STRIPES (9-15)'}.`; SFX.play('coin'); }
        }
        objPocketed.forEach((n) => { if (n !== 8 || result !== null) G.pocketedBy[me].push(n); });
        // fun moment: 3 balls (or more) in one visit to the table
        G.run = G.run || [0, 0]; G.run[opp] = 0;
        const before = G.run[me]; G.run[me] = foul ? 0 : before + objPocketed.filter((n) => n !== 8).length;
        if (before < 3 && G.run[me] >= 3) funMoment('pl-seat-' + me, { key: 'fire', icon: '🔥', label: 'ON FIRE', fire: true, burst: 'ON FIRE!', sub: `${G.S.name(me)}: ${G.run[me]} balls in a row`, mine: me === G.me });
        if (cueIn) { const c = G.balls[0]; c.on = true; c.x = HEAD[0]; c.y = HEAD[1]; c.vx = c.vy = c.wx = c.wy = c.wz = 0; if (!validCue(c.x, c.y)) { c.x = HEAD[0] - 50; } }
        G.pocketedTotal += objPocketed.length;
        panels();
        if (result !== null) {
          const reason = result === me ? `${who(me)} sank the 8-ball.` : foul ? `${who(me)} sank the 8-ball with a foul.` : `${who(me)} sank the 8-ball too early.`;
          return finish(result, reason);
        }
        const own = G.groups[me]; const keeps = !foul && objPocketed.some((n) => (G.isBreak && !own) || groupOf(n) === own);
        if (foul) { G.fouls += me === G.me ? 1 : 0; G.turn = opp; G.bih = true; SFX.play('nope'); say(`${why} ${who(opp) === 'You' ? 'You get' : who(opp) + ' gets'} ball in hand.`); }
        else if (keeps) { say(msg ? msg + ' Shoot again!' : `${who(me) === 'You' ? 'Nice shot! Shoot again.' : who(me) + ' sank a ball and shoots again.'}`); }
        else { G.turn = opp; G.bih = false; say((msg ? msg + ' ' : '') + (who(opp) === 'You' ? 'Your turn.' : `${G.S.name(opp)}'s turn.`)); }
        G.phase = 'wait'; G.ev = {};
        if (typeof NP !== 'undefined' && NP.catchup) return beginTurn();   // replaying after a rejoin: the next shot follows at once
        gTimeout(() => beginTurn(), 450);
      }
      function respot8() { const b = G.balls.find((x) => x.n === 8); b.on = true; b.vx = b.vy = b.wx = b.wy = b.wz = 0; b.x = FOOT[0]; b.y = FOOT[1]; let k = 0; while (G.balls.some((o) => o !== b && o.on && hyp(o.x - b.x, o.y - b.y) < 2 * BR) && k++ < 20) b.x += BR * 2.1; }

      async function finish(winner, sub) {
        if (G.over) return; G.over = true; G.S.over = true; G.clock.stop(); say(sub);
        const won = winner === G.me, lv = G.lvl - 1, tok = G.tok, S = G.S;
        const elo = S.online ? 0 : won ? [8, 14, 20][lv] : [-4, -7, -10][lv];
        const eloRow = S.online ? await S.finish(won ? 'win' : 'loss') : null;
        if (!G || G.tok !== tok) return;
        const s = gstat('pool'); s.balls = (s.balls || 0) + G.pocketedBy[G.me].length; s.fouls = (s.fouls || 0) + G.fouls; s.eightWins = (s.eightWins || 0) + (won && /8-ball/.test(sub) ? 1 : 0);
        reportGame('pool', won ? 'win' : 'loss', { elo, xp: won ? 25 + lv * 12 : 10, label: `${S.online ? 'Online vs ' + S.name(1 - G.me) : 'vs ' + LV[lv] + ' AI'} · ${G.pocketedBy[G.me].length} balls sunk` });
        SFX.play(won ? 'win' : 'lose'); panels();
        gTimeout(() => gameResult({ title: won ? 'Rack \'em up! You win!' : 'You lose', sub, tone: won ? 'amber' : 'coral', sprite: won ? 'trophy' : 'anchor', rows: [['Balls sunk', G.pocketedBy[G.me].length, 'text-amber'], ['Your fouls', G.fouls, 'text-coral']].concat(S.online ? (eloRow ? [eloRow] : []) : [['Elo', (elo > 0 ? '+' : '') + elo, elo >= 0 ? 'text-emerald' : 'text-coral']]), againLabel: S.online ? 'Back to setup' : 'New game', again: () => open($('game-root')) }), 900);
      }

      /* ---------- rendering ---------- */
      function panels() {
        [0, 1].forEach((i) => {
          const el = $('pl-seat-' + i); if (!el) return;
          const g = G.groups[i], mine = g ? G.balls.filter((b) => groupOf(b.n) === g) : [];
          el.className = 'seat' + (G.turn === i && !G.over ? ' turn' : '');
          el.innerHTML = `<div class="text-sm font-display font-extrabold">${esc(G.S.avatar(i))} ${esc(G.S.name(i))}${G.S.online && i === G.me ? ' <span class="pix text-xs text-teal">YOU</span>' : ''}</div><div class="pix text-xs text-amber mb-1">${g ? (g === 'solid' ? 'SOLIDS' : 'STRIPES') : 'TABLE OPEN'}</div><div class="flex flex-wrap gap-1 min-h-[18px]">${mine.map((b) => `<span style="width:16px;height:16px;border-radius:50%;border:2px solid var(--ink);background:${b.on ? colorOf(b.n) : 'transparent'};opacity:${b.on ? 1 : 0.25};display:inline-block"></span>`).join('')}</div>`;
        });
      }

      // the table is drawn once into a hidden picture
      function drawTable(c) {
        c.fillStyle = '#6B4226'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#4B2E1A'; c.fillRect(0, 0, W, 9); c.fillRect(0, H - 9, W, 9); c.fillRect(0, 0, 9, H); c.fillRect(W - 9, 0, 9, H);
        c.fillStyle = '#F5D9A8';
        for (let i = 1; i < 8; i++) { if (i === 4) continue; const x = L + (R - L) * i / 8; c.fillRect(x - 3, 20, 6, 6); c.fillRect(x - 3, H - 26, 6, 6); }
        for (let i = 1; i < 4; i++) { const y = T + (B - T) * i / 4; c.fillRect(20, y - 3, 6, 6); c.fillRect(W - 26, y - 3, 6, 6); }
        c.fillStyle = '#145E43'; c.fillRect(L - 17, T - 17, R - L + 34, B - T + 34);         // cushion rubber
        c.fillStyle = '#1E7A57'; c.fillRect(L, T, R - L, B - T);                              // cloth
        c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(L + 8, T + 8, R - L - 16, B - T - 16);
        c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(HEAD[0], T); c.lineTo(HEAD[0], B); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(FOOT[0], FOOT[1], 3, 0, 7); c.fill(); c.beginPath(); c.arc(HEAD[0], HEAD[1], 3, 0, 7); c.fill();
        // cushion faces with angled ends toward the pockets
        c.fillStyle = '#0F7A55'; c.strokeStyle = '#050E18'; c.lineWidth = 2;
        for (const s of SEGS) {
          const hx = Math.abs(s.ny) === 1, o = 17; const px = s.nx, py = s.ny;
          c.beginPath();
          if (hx) { c.moveTo(s.ax, s.ay); c.lineTo(s.bx, s.by); c.lineTo(s.bx + 13, s.by + py * o); c.lineTo(s.ax - 13, s.ay + py * o); }
          else { c.moveTo(s.ax, s.ay); c.lineTo(s.bx, s.by); c.lineTo(s.bx + px * o, s.by + 13); c.lineTo(s.ax + px * o, s.ay - 13); }
          c.closePath(); c.fill(); c.stroke();
        }
        for (const [px, py, pr] of POCKETS) { c.fillStyle = '#050E18'; c.beginPath(); c.arc(px, py, pr + 5, 0, 7); c.fill(); }
        c.fillStyle = '#C6D2DE'; c.strokeStyle = '#050E18'; c.lineWidth = 1.5;
        for (const [tx, ty] of TIPS) { c.beginPath(); c.arc(tx, ty, 3, 0, 7); c.fill(); c.stroke(); }
      }

      // balls are shaded one pixel at a time so the stripes, numbers and dots really turn with the spin
      const SP = 40, HALF = SP / 2, PRE = (() => {
        const n = SP * SP, u = new Float32Array(n), v = new Float32Array(n), z = new Float32Array(n), al = new Float32Array(n), lit = new Float32Array(n), spec = new Float32Array(n);
        const lx = -0.42, ly = -0.55, lz = -0.72, ll = Math.hypot(lx, ly, lz), hx0 = lx / ll, hy0 = ly / ll, hz0 = lz / ll - 1, hl = Math.hypot(hx0, hy0, hz0);
        for (let py = 0; py < SP; py++) for (let px = 0; px < SP; px++) {
          const i = py * SP + px, x = (px + 0.5 - HALF) / HALF, y = (py + 0.5 - HALF) / HALF, r2 = x * x + y * y, r = Math.sqrt(r2);
          u[i] = x; v[i] = y; al[i] = clamp((1 - r) * HALF + 0.5, 0, 1);
          z[i] = r2 < 1 ? -Math.sqrt(1 - r2) : 0;
          const d = (x * lx + y * ly + z[i] * lz) / ll; lit[i] = 0.46 + 0.66 * Math.max(0, d);
          spec[i] = Math.pow(Math.max(0, (x * hx0 + y * hy0 + z[i] * hz0) / hl), 34) * 0.85;
        }
        return { u, v, z, al, lit, spec };
      })();
      const RGB = {}; const rgbOf = (hex) => RGB[hex] || (RGB[hex] = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]);
      function ballSprite(b) {
        if (!b.cv) { b.cv = document.createElement('canvas'); b.cv.width = b.cv.height = SP; b.cx = b.cv.getContext('2d'); b.img = b.cx.createImageData(SP, SP); b.dirty = true; }
        if (!b.dirty) return b.cv;
        const d = b.img.data, m = b.m, n = b.n, col = n ? rgbOf(colorOf(n)) : [247, 244, 236], stripe = n > 8;
        for (let i = 0; i < SP * SP; i++) {
          const a = PRE.al[i]; if (a <= 0) { d[i * 4 + 3] = 0; continue; }
          const sx = PRE.u[i], sy = PRE.v[i], sz = PRE.z[i];
          const bx = m[0] * sx + m[3] * sy + m[6] * sz, by = m[1] * sx + m[4] * sy + m[7] * sz, bz = m[2] * sx + m[5] * sy + m[8] * sz;
          let c;
          if (n === 0) c = Math.abs(bx) > 0.975 ? [196, 40, 40] : [247, 244, 236];
          else if (Math.abs(bx) > 0.908) c = [247, 244, 236];
          else if (stripe) c = Math.abs(bz) < 0.5 ? col : [247, 244, 236];
          else c = col;
          const l = PRE.lit[i], s = PRE.spec[i] * 255;
          d[i * 4] = Math.min(255, c[0] * l + s); d[i * 4 + 1] = Math.min(255, c[1] * l + s); d[i * 4 + 2] = Math.min(255, c[2] * l + s); d[i * 4 + 3] = a * 255;
        }
        b.cx.putImageData(b.img, 0, 0); b.dirty = false; return b.cv;
      }
      function drawBall(ctx, b, alpha) {
        const r = BR; if (alpha !== undefined) ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(b.x + 2.5, b.y + 3.2, r, r * 0.92, 0, 0, 7); ctx.fill();
        ctx.drawImage(ballSprite(b), b.x - r - 1, b.y - r - 1, 2 * r + 2, 2 * r + 2);
        ctx.strokeStyle = '#050E18'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 7); ctx.stroke();
        if (b.n > 0) {                                                // numbers ride on the two white spots
          const m = b.m;
          for (const sgn of [1, -1]) {
            const vx = sgn * m[0], vy = sgn * m[3], vz = sgn * m[6];       // where that spot points (z < 0 faces the player)
            if (vz > -0.52) continue;
            const f = Math.sqrt(-vz), fade = clamp((-vz - 0.52) / 0.22, 0, 1);
            ctx.save(); ctx.globalAlpha = (alpha === undefined ? 1 : alpha) * fade;
            ctx.translate(b.x + vx * r * 0.9, b.y + vy * r * 0.9);
            ctx.fillStyle = '#111'; ctx.font = `bold ${(r * 0.68 * f).toFixed(1)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.scale(Math.max(0.55, -vz), 1); ctx.fillText(b.n, 0, 0.5); ctx.restore();
          }
        }
        if (alpha !== undefined) ctx.globalAlpha = 1;
      }
      const polyLen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += hyp(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
      function strokePath(ctx, pts, maxLen) {
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); let acc = 0;
        for (let i = 1; i < pts.length; i++) { const d = hyp(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc + d > maxLen) { const t = (maxLen - acc) / d; ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t); break; } acc += d; ctx.lineTo(pts[i][0], pts[i][1]); }
        ctx.stroke();
      }
      function draw() {
        const ctx = G.ctx, c = G.balls[0], now = performance.now();
        ctx.drawImage(G.bg, 0, 0);
        // balls dropping into pockets
        G.drops = G.drops.filter((d) => now - d.t0 < 320);
        for (const d of G.drops) { const t = (now - d.t0) / 320; ctx.globalAlpha = 1 - t; ctx.fillStyle = d.n === 0 ? '#F7F4EC' : colorOf(d.n); ctx.beginPath(); ctx.arc(d.x + (d.px - d.x) * t, d.y + (d.py - d.y) * t, BR * (1 - 0.6 * t), 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
        const mine = G.phase === 'aim' && myTurn() && !G.over && !G.placing;
        // where the shot will go (computed with the same physics as the real shot)
        if (mine && G.pred) {
          const p = G.pred, legal = legalSet(G.balls, G.groups[0]);
          const guide = G.guide || 'classic';
          // like the popular online pool games: one straight line to the first thing the cue ball meets,
          // a ghost ball where it hits, and (Classic) two short arrows for where both balls head. No bounce paths.
          const a0 = [c.x, c.y], a1 = p.cue[p.cue.length - 1] || [c.x + Math.cos(G.aim) * 600, c.y + Math.sin(G.aim) * 600];
          const end = guide === 'off' ? [c.x + Math.cos(G.aim) * 120, c.y + Math.sin(G.aim) * 120] : p.ghost ? p.ghost : a1;
          ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(end[0], end[1]); ctx.stroke();
          const stub = (from, to, len, col, w) => { const dx = to[0] - from[0], dy = to[1] - from[1], d = Math.hypot(dx, dy); if (d < 1) return; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(from[0], from[1]); ctx.lineTo(from[0] + dx / d * len, from[1] + dy / d * len); ctx.stroke(); };
          if (guide !== 'off' && p.ghost) {
            const ok = legal.includes(p.first);
            ctx.strokeStyle = ok ? 'rgba(255,255,255,.95)' : '#FB7185'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.ghost[0], p.ghost[1], BR, 0, 7); ctx.stroke();
            if (!ok) { ctx.beginPath(); ctx.moveTo(p.ghost[0] - 6, p.ghost[1] - 6); ctx.lineTo(p.ghost[0] + 6, p.ghost[1] + 6); ctx.moveTo(p.ghost[0] + 6, p.ghost[1] - 6); ctx.lineTo(p.ghost[0] - 6, p.ghost[1] + 6); ctx.stroke(); }
            if (guide === 'classic') {
              if (p.obj.length > 1) stub(p.obj[0], p.obj[Math.min(5, p.obj.length - 1)], 64, 'rgba(245,176,65,.95)', 2.5);   // the object ball's direction
              const after = p.ci > 0 ? p.cue[Math.min(p.ci + 4, p.cue.length - 1)] : null; if (after) stub(p.ghost, after, 38, 'rgba(255,255,255,.6)', 2);   // the cue ball glancing off
            }
          } else if (guide !== 'off' && !p.ghost) {
            ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a1[0], a1[1], BR, 0, 7); ctx.stroke();
          }
          ctx.lineCap = 'butt';
          // handle at the end of the aim line: "hold me and move"
          const hx = c.x + Math.cos(G.aim) * 70, hy = c.y + Math.sin(G.aim) * 70;
          ctx.fillStyle = G.aimDrag ? '#F5B041' : 'rgba(245,176,65,.55)'; ctx.strokeStyle = '#050E18'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(hx, hy, 8, 0, 7); ctx.fill(); ctx.stroke();
        }
        if (G.placing && G.ghost) { GHOST.x = G.ghost[0]; GHOST.y = G.ghost[1]; drawBall(ctx, GHOST, 0.6); if (!validCue(...G.ghost)) { ctx.strokeStyle = '#FB7185'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(G.ghost[0], G.ghost[1], BR + 3, 0, 7); ctx.stroke(); } }
        for (const b of G.balls) if (b.on && !(G.placing && b.n === 0)) drawBall(ctx, b);
        // cue stick
        if (G.cueVis && c.on && !G.placing && !G.over) {
          let pull = G.cuePull;
          if (G.phase === 'aim' && myTurn()) pull = 8 + G.power * 120;
          else if (G.phase === 'aim' && G.peekAim !== undefined) pull = 8 + (G.peekPow || 0) * 120;
          else if (G.phase === 'stroke') { const t = clamp((now - G.strokeT0) / 130, 0, 1); pull = G.cueFrom + (4 - G.cueFrom) * t * t; }
          const dx = Math.cos(G.aim), dy = Math.sin(G.aim), off = (G.phase === 'aim' || G.phase === 'stroke') && myTurn() ? (G.spin.a || 0) * BR : 0;
          const tx = c.x - dy * 0 + (-dy) * off, ty = c.y + dx * off, d0 = BR + pull;
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#050E18'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(tx - dx * d0, ty - dy * d0); ctx.lineTo(tx - dx * (d0 + 330), ty - dy * (d0 + 330)); ctx.stroke();
          ctx.strokeStyle = '#E7C48F'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx - dx * (d0 + 6), ty - dy * (d0 + 6)); ctx.lineTo(tx - dx * (d0 + 330), ty - dy * (d0 + 330)); ctx.stroke();
          ctx.strokeStyle = '#8B5A2B'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx - dx * (d0 + 200), ty - dy * (d0 + 200)); ctx.lineTo(tx - dx * (d0 + 330), ty - dy * (d0 + 330)); ctx.stroke();
          ctx.strokeStyle = '#F7F4EC'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx - dx * (d0 + 2), ty - dy * (d0 + 2)); ctx.lineTo(tx - dx * (d0 + 8), ty - dy * (d0 + 8)); ctx.stroke();
          ctx.strokeStyle = '#2B6CB0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx - dx * d0, ty - dy * d0); ctx.lineTo(tx - dx * (d0 + 3), ty - dy * (d0 + 3)); ctx.stroke(); ctx.lineCap = 'butt';
        }
        if (G.follow && G.phase === 'moving') {
          const t = (now - G.follow.t0) / 420;
          if (t >= 1) G.follow = null;
          else {
            const f = G.follow, dx = Math.cos(f.aim), dy = Math.sin(f.aim), push = (6 + 34 * f.f) * Math.min(1, t * 5), d0 = BR + 4 - push;
            ctx.globalAlpha = 1 - t; ctx.lineCap = 'round';
            ctx.strokeStyle = '#050E18'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(f.x - dx * d0, f.y - dy * d0); ctx.lineTo(f.x - dx * (d0 + 330), f.y - dy * (d0 + 330)); ctx.stroke();
            ctx.strokeStyle = '#E7C48F'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(f.x - dx * (d0 + 6), f.y - dy * (d0 + 6)); ctx.lineTo(f.x - dx * (d0 + 330), f.y - dy * (d0 + 330)); ctx.stroke();
            ctx.strokeStyle = '#8B5A2B'; ctx.beginPath(); ctx.moveTo(f.x - dx * (d0 + 200), f.y - dy * (d0 + 200)); ctx.lineTo(f.x - dx * (d0 + 330), f.y - dy * (d0 + 330)); ctx.stroke();
            ctx.strokeStyle = '#2B6CB0'; ctx.beginPath(); ctx.moveTo(f.x - dx * d0, f.y - dy * d0); ctx.lineTo(f.x - dx * (d0 + 3), f.y - dy * (d0 + 3)); ctx.stroke();
            ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
          }
        }
        if (G.placing && !G.ghost) { ctx.fillStyle = 'rgba(245,176,65,.95)'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Ball in hand: drag the cue ball where you want it', W / 2, H / 2); }
        const bar = $('pl-bar'); if (bar) bar.classList.toggle('off', !canShoot() || G.placing);
      }

      const mod = {
        id: 'pool', name: 'Pool', icon: 'pool', cats: ['sports'], sub: '1v1 · ~8 MIN', color: '#34D399', tone: 'teal', btn: 'teal',
        blurb: '8-ball pool against an AI with real ball physics. Drag to aim, choose where to hit the cue ball, pull the power bar back and let go.',
        rules: { tag: '8-BALL · VS AI', steps: [
          '<strong class="text-bone">Aim:</strong> Press and hold on the table, then move to swing the aim line around the cue ball. The dotted line is the cue ball, the <span class="text-amber font-bold">amber</span> line is where the ball you hit will go, and the faint line is where the cue ball goes afterwards. Mouse wheel, arrow keys and the ◀ ▶ buttons make tiny changes.',
          '<strong class="text-bone">Hit point &amp; power:</strong> Tap the cue-ball picture to choose where the cue touches the ball: <b>top</b> makes it follow through, <b>bottom</b> makes it draw back, and <b>left or right</b> adds side-spin that changes how it bounces off cushions. Then pull the bar at the bottom back and let go to shoot. The further you pull, the harder the hit.',
          '<strong class="text-bone">Win:</strong> The first ball you sink after the break decides your group: <b>solids (1-7)</b> or <b>stripes (9-15)</b>. Clear your group, then sink the <span class="text-amber font-bold">8-ball</span>. A foul (scratch, wrong ball first, or no cushion touched) gives the other player the cue ball in hand.',
        ], tip: 'Real balls roll a long way. A soft shot with a little draw (hit below the middle) keeps the cue ball from following your target into the pocket.' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['MATCHES', s.played, 'text-bone'], ['WIN RATE', pct(s.wins, s.played) + '%', 'text-emerald'], ['BALLS SUNK', s.balls || 0, 'text-teal']],
        extraRows: (s) => srow('Fouls', s.fouls || 0) + srow('Won with the 8-ball', s.eightWins || 0),
        online: { seats: () => 2, ranked: true, start: (body, sel, S) => start(body, sel, S) },
        state: () => G,
        engine: { get G() { return G; }, rack, step, run, planShots, legalSet, groupOf, POCKETS, BR, rayFirst, predict, applyStrike, speedOf, spinBall, newBall, moving, SEGS, TIPS, PXM, DT, VMAX, HEAD, FOOT, fixedFrame: 0, state: () => G, fire, launch, drawBall }, open, close() { G = null; },
      };
      registerGame(mod);
    })();

