    /* =========================================================================
       BOWLING: first-person 3D lane. Grab the ball, flick it, real pin physics, full 10-frame scoring
       ========================================================================= */
    (function bowlingGame() {
      /* ---------- scoring (pure) ---------- */
      function frameState(rolls) {
        let f = 0, i = 0;
        while (f < 9) {
          if (rolls[i] === undefined) return { f, b: 0, done: false };
          if (rolls[i] === 10) { i++; f++; continue; }
          if (rolls[i + 1] === undefined) return { f, b: 1, done: false };
          i += 2; f++;
        }
        const r = rolls.slice(i);
        if (r.length === 0) return { f: 9, b: 0, done: false };
        if (r.length === 1) return { f: 9, b: 1, done: false };
        if (r.length === 2) return (r[0] === 10 || r[0] + r[1] === 10) ? { f: 9, b: 2, done: false } : { f: 9, b: 2, done: true };
        return { f: 9, b: 3, done: true };
      }
      function scoreFrames(rolls) {
        const frames = []; let i = 0, total = 0;
        for (let f = 0; f < 10; f++) {
          const fr = { r: [], cum: null };
          if (f < 9) {
            if (rolls[i] === 10) { fr.r = [10]; if (rolls[i + 1] !== undefined && rolls[i + 2] !== undefined) { total += 10 + rolls[i + 1] + rolls[i + 2]; fr.cum = total; } i += 1; }
            else if (rolls[i] !== undefined) {
              fr.r = rolls[i + 1] !== undefined ? [rolls[i], rolls[i + 1]] : [rolls[i]];
              if (rolls[i + 1] !== undefined) { const s = rolls[i] + rolls[i + 1]; if (s < 10) { total += s; fr.cum = total; } else if (rolls[i + 2] !== undefined) { total += 10 + rolls[i + 2]; fr.cum = total; } i += 2; } else i += 1;
            }
          } else {
            fr.r = rolls.slice(i, i + 3);
            const st = frameState(rolls);
            if (st.done) { total += fr.r.reduce((a, b) => a + b, 0); fr.cum = total; }
          }
          frames.push(fr);
        }
        return { frames, total: frames.reduce((a, fr) => (fr.cum !== null ? fr.cum : a), 0) };
      }
      function marks(fr, f) {
        const r = fr.r, out = [];
        const sym = (n) => (n === 10 ? 'X' : n === 0 ? '-' : String(n));
        if (f < 9) { if (r[0] === 10) return ['', 'X']; if (r.length) { out.push(r[0] === 0 ? '-' : String(r[0])); if (r.length > 1) out.push(r[0] + r[1] === 10 ? '/' : sym(r[1])); } return out; }
        for (let k = 0; k < r.length; k++) { const prev = k > 0 ? r[k - 1] : null; out.push(r[k] === 10 ? 'X' : (k > 0 && prev !== 10 && prev + r[k] === 10 && !(k === 2 && r[0] === 10 && false)) ? '/' : r[k] === 0 ? '-' : String(r[k])); }
        return out;
      }

      /* ---------- the lane, in real metres (x = across, right is +; z = down the lane; y = up) ---------- */
      const HALF = 0.527, GUT = 0.235, HEAD = 18.288, DECK0 = 17.62, DECK1 = 19.15, PIT = 19.9, OIL = 11.6;
      const BALL_R = 0.1085, PIN_R = 0.0605, PIN_M = 1.55, PITCH = 2 * HALF + 2 * GUT + 0.38;
      const PIN_POS = []; for (let k = 0; k < 4; k++) for (let j = 0; j <= k; j++) PIN_POS.push([(j - k / 2) * 0.3048, HEAD + k * 0.2639]);
      const WEIGHT = { light: { m: 4.5, v: 1.08, lab: '10 lb' }, std: { m: 6.4, v: 1, lab: '14 lb' }, heavy: { m: 7.3, v: 0.94, lab: '16 lb' } };
      const hyp = Math.hypot, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += Math.random(); return (u - 3) / 0.7071; };
      const INK = '#050E18';

      /* ---------- physics (seen from above) ----------
         A ball rolls down the lane; on the oily front part it goes straight, on the dry back end its spin
         makes it hook. Pins are knocked over when hit hard enough, slide, knock each other over, and bounce
         off the side walls of the pin deck. Ball 4.5-7.3 kg, pin 1.55 kg, so the ball deflects a little. */
      const jig = () => (Math.random() - 0.5) * 0.012;
      function newPins(standing) { return PIN_POS.map(([x, z], i) => { const up = !standing || standing.includes(i); return { i, x: x + jig(), z: z + jig(), vx: 0, vz: 0, st: up ? 'up' : 'gone', t: 0, dir: Math.PI / 2 }; }); }
      // real pin action is never exactly the same twice: turn a knocked pin's path by a small random angle
      function scatter(p, amt) { const a = gauss() * amt, c = Math.cos(a), s = Math.sin(a), vx = p.vx; p.vx = vx * c - p.vz * s; p.vz = vx * s + p.vz * c; }
      function mkBall(x, ang, speed, spin, mass) { return { x, z: 0.2, vx: Math.sin(ang) * speed, vz: Math.cos(ang) * speed, spin, mass, on: true, gutter: false, dist: 0, r: BALL_R }; }
      const pinR = (p) => (p.st === 'up' ? PIN_R : 0.075);
      const inGutter = (p) => Math.abs(p.x) > HALF + 0.02;
      function topple(p, ev) { if (p.st !== 'up') return; p.st = 'fall'; p.t = 0; p.dir = Math.atan2(p.vz, p.vx); ev.hits = (ev.hits || 0) + 1; }
      function hit(a, b, ma, mb, e) {
        const dx = b.x - a.x, dz = b.z - a.z, rr = a.r + b.r, d2 = dx * dx + dz * dz;
        if (d2 >= rr * rr || d2 < 1e-10) return 0;
        const d = Math.sqrt(d2), nx = dx / d, nz = dz / d, ov = rr - d, tm = ma + mb;
        a.x -= nx * ov * mb / tm; a.z -= nz * ov * mb / tm; b.x += nx * ov * ma / tm; b.z += nz * ov * ma / tm;
        const rv = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
        if (rv <= 0) return 0;
        const j = (1 + e) * rv / (1 / ma + 1 / mb);
        a.vx -= j / ma * nx; a.vz -= j / ma * nz; b.vx += j / mb * nx; b.vz += j / mb * nz;
        return rv;
      }
      function simStep(S, dt, ev) {
        const b = S.ball;
        if (b.on) {
          if (!b.gutter) { const ramp = clamp((b.z - OIL) / 2.6, 0, 1); b.vx += b.spin * 1.7 * ramp * dt; }
          const sp = hyp(b.vx, b.vz);
          if (sp > 0) { const ns = Math.max(0, sp - 0.22 * dt); b.vx *= ns / sp; b.vz *= ns / sp; }
          b.x += b.vx * dt; b.z += b.vz * dt; b.dist += sp * dt;
          if (!b.gutter && Math.abs(b.x) > HALF - BALL_R * 0.3 && b.z < HEAD - 0.25) { b.gutter = true; b.gx = b.x; b.x = Math.sign(b.x) * (HALF + GUT / 2); b.vx = 0; b.spin = 0; ev.gutter = true; ev.gutterT = 0; }
          if (b.z > PIT || sp < 0.05) b.on = false;
        }
        for (const p of S.pins) {
          if (p.st === 'gone' || p.st === 'up') continue;
          p.t += dt; if (p.st === 'fall' && p.t > 0.3) p.st = 'down';
          const sp = hyp(p.vx, p.vz);
          if (sp > 0) { const ns = Math.max(0, sp - 3.0 * dt); p.vx *= ns / sp; p.vz *= ns / sp; }
          p.x += p.vx * dt; p.z += p.vz * dt;
          if (p.z > DECK1 + 0.12) { p.st = 'gone'; continue; }
          const ax = Math.abs(p.x);
          if (ax > HALF + GUT - 0.07 && p.z > HEAD - 0.45 && p.vx * p.x > 0) { p.vx = -p.vx * 0.55; ev.kick = true; } // side walls of the pin deck
          if (ax > HALF + GUT + 0.2 || p.z < 5) p.st = 'gone';
        }
        if (b.on && !b.gutter) for (const p of S.pins) {
          if (p.st === 'gone' || inGutter(p)) continue;
          p.r = pinR(p);
          const rv = hit(b, p, b.mass, PIN_M, 0.7);
          if (rv > 0) { ev.ball = true; ev.snd = Math.max(ev.snd || 0, rv); if (rv > 0.2) { scatter(p, 0.16); topple(p, ev); } else if (p.st === 'up') p.vx = p.vz = 0; }
        }
        const act = S.pins.filter((p) => p.st !== 'gone' && !inGutter(p));
        for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) {
          const a = act[i], c = act[j];
          if (a.st === 'up' && c.st === 'up') continue;
          if (!a.vx && !a.vz && !c.vx && !c.vz) continue;
          a.r = pinR(a); c.r = pinR(c);
          const rv = hit(a, c, PIN_M, PIN_M, 0.55);
          if (rv > 0.25) { scatter(a, 0.22); scatter(c, 0.22); topple(a, ev); topple(c, ev); ev.snd = Math.max(ev.snd || 0, rv); }
          else if (rv > 0) { if (a.st === 'up') a.vx = a.vz = 0; if (c.st === 'up') c.vx = c.vz = 0; }
        }
      }
      const settled = (S) => (!S.ball.on || S.ball.z > DECK1) && S.pins.every((p) => p.st === 'up' || p.st === 'gone' || (p.st === 'down' && hyp(p.vx, p.vz) < 0.05));
      // a whole roll, no drawing (used by the bot to aim and by tests)
      function rollSim(standing, x0, ang, speed, spin, mass = 6.4) {
        const S = { ball: mkBall(x0, ang, speed, spin, mass), pins: newPins(standing) }, ev = {};
        for (let t = 0; t < 12; t += 1 / 600) { simStep(S, 1 / 600, ev); if (t > 1 && settled(S)) break; }
        const knocked = S.pins.filter((p) => standing.includes(p.i) && p.st !== 'up').map((p) => p.i);
        return { S, knocked, ev };
      }
      // where a ball with no pins in the way crosses the head pin line
      function pathX(x0, ang, speed, spin, mass = 6.4) {
        const S = { ball: mkBall(x0, ang, speed, spin, mass), pins: [] }, ev = {};
        for (let t = 0; t < 8 && S.ball.on && S.ball.z < HEAD; t += 1 / 300) simStep(S, 1 / 300, ev);
        return S.ball.gutter ? (S.ball.gx > 0 ? 9 : -9) : S.ball.x;
      }

      /* ---------- camera ---------- */
      const R = { W: 480, H: 300, F: 456, cy: 1.42, pitch: 0.196 };
      const CAM = { z: -3.4, base: -3.4, end: 13.4 };
      function setView(W, H) {
        R.W = W; R.H = H; const tall = H / W > 0.8; R.F = W * (tall ? 1.45 : 0.95);
        const HF = H / R.F, a = tall ? 0.33 : 0.3, b = tall ? 0.86 : 0.84;
        R.cy = (b - a) * HF / (1 / 3.4 - 1 / 21.7); R.pitch = (0.5 - a) * HF + R.cy / 21.7;
        R.cy0 = R.cy; R.pitch0 = R.pitch;
      }
      // as the camera glides toward the pins it also drops lower and looks straight at them (a "pin cam")
      function camTo(z) {
        CAM.z = z;
        const k = clamp((z - CAM.base) / (CAM.end - CAM.base), 0, 1), e = k * k * (3 - 2 * k);
        R.cy = R.cy0 + (0.72 - R.cy0) * e; R.pitch = R.pitch0 + (0.055 - R.pitch0) * e;
      }
      function proj(x, y, z) {
        const dy = y - R.cy, dz = z - CAM.z, c = Math.cos(R.pitch), s = Math.sin(R.pitch);
        const zc = dz * c - dy * s; if (zc < 0.08) return null;
        const yc = dy * c + dz * s, f = R.F / zc;
        return { x: R.W / 2 + x * f, y: R.H / 2 - yc * f, s: f, d: zc };
      }
      // fill a flat rectangle on the floor (x0..x1 across, z0..z1 along), clipped in front of the camera
      function floor(ctx, x0, x1, z0, z1, col, y = 0) {
        z0 = Math.max(z0, CAM.z + 0.12); if (z1 <= z0) return;
        const a = proj(x0, y, z0), b = proj(x1, y, z0), c = proj(x1, y, z1), d = proj(x0, y, z1);
        if (!a || !b || !c || !d) return;
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
      }
      function wall(ctx, x0, x1, y0, y1, z, col) {
        const a = proj(x0, y0, z), b = proj(x1, y0, z), c = proj(x1, y1, z), d = proj(x0, y1, z);
        if (!a || !b || !c || !d) return null;
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
        return { x: d.x, y: d.y, w: c.x - d.x, h: a.y - d.y };
      }

      /* ---------- drawing the alley (pixel art, seen from the foul line) ---------- */
      const BOARD = (2 * HALF) / 39;
      // pin shape: [height above the floor, radius] in metres
      const PROF = [[0, 0.026], [0.03, 0.042], [0.07, 0.056], [0.115, 0.0605], [0.16, 0.055], [0.2, 0.042], [0.235, 0.027], [0.255, 0.024], [0.29, 0.029], [0.33, 0.032], [0.36, 0.028], [0.378, 0.014]];
      function arrow(ctx, x, z, col) {
        const a = proj(x, 0, z + 0.24), b = proj(x - 0.035, 0, z), c = proj(x + 0.035, 0, z);
        if (!a || !b || !c) return; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath(); ctx.fill();
      }
      function dot(ctx, x, z, col, r = 0.018) {
        const p = proj(x, 0, z); if (!p) return;
        const w = Math.max(1, Math.round(r * 2 * p.s)), h = Math.max(1, Math.round(w * 0.45));
        ctx.fillStyle = col; ctx.fillRect(Math.round(p.x - w / 2), Math.round(p.y - h / 2), w, h);
      }
      function drawLane(ctx, cx, dim) {
        floor(ctx, cx - HALF - GUT, cx + HALF + GUT, -7, 0, dim ? '#3A2A1C' : '#B47D45');            // approach
        floor(ctx, cx - HALF - GUT, cx - HALF, 0, DECK1, dim ? '#0C1724' : '#122238');              // gutters
        floor(ctx, cx + HALF, cx + HALF + GUT, 0, DECK1, dim ? '#0C1724' : '#122238');
        floor(ctx, cx - HALF - 0.03, cx - HALF, 0, DECK1, dim ? '#172A40' : '#2B4F75');
        floor(ctx, cx + HALF, cx + HALF + 0.03, 0, DECK1, dim ? '#172A40' : '#2B4F75');
        floor(ctx, cx - HALF, cx + HALF, 0, DECK0, dim ? '#46321F' : '#D49E5E');                    // the lane
        for (let k = 1; k < 39; k += 2) floor(ctx, cx - HALF + k * BOARD, cx - HALF + (k + 1) * BOARD, 0, DECK0, dim ? '#493421' : '#DBA866');
        floor(ctx, cx - HALF, cx + HALF, DECK0, DECK1, dim ? '#523C25' : '#E9C185');                // pin deck
        floor(ctx, cx - HALF - GUT, cx + HALF + GUT, DECK1, PIT, INK);                              // pit
        floor(ctx, cx - HALF - GUT, cx + HALF + GUT, -0.025, 0.025, INK);                           // foul line
        const mk = dim ? '#30210F' : '#8A5524';
        for (const b of [-15, -10, -5, 0, 5, 10, 15]) arrow(ctx, cx + b * BOARD, 4.3 + (3 - Math.abs(b) / 5) * 0.32, mk);
        for (const b of [-17, -14, -11, -8, -5, 5, 8, 11, 14, 17]) dot(ctx, cx + b * BOARD, 2.13, mk);
        for (const b of [-17, -14, -11, -8, -5, 5, 8, 11, 14, 17]) dot(ctx, cx + b * BOARD, -0.6, dim ? '#2A1D0F' : '#7E4C1F');
        for (const b of [-10, 10]) floor(ctx, cx + b * BOARD - 0.01, cx + b * BOARD + 0.01, 10.2, 11.7, mk);
        PIN_POS.forEach(([x, z]) => dot(ctx, cx + x, z, mk, 0.028));
      }
      // a pin is drawn as a stack of circles along its axis: works standing, tipping over, and lying down
      function drawPin(ctx, p, cx, dim, alpha = 1) {
        const tilt = p.st === 'up' ? 0 : p.st === 'fall' ? Math.min(1, p.t / 0.3) * Math.PI / 2 : Math.PI / 2;
        const ax = Math.cos(p.dir) * Math.sin(tilt), ay = Math.cos(tilt), az = Math.sin(p.dir) * Math.sin(tilt);
        const lift = Math.sin(tilt) * 0.045;
        const pts = [];
        for (let k = 0; k < PROF.length - 1; k++) for (let f = 0; f < 1; f += 0.34) {
          const h = PROF[k][0] + (PROF[k + 1][0] - PROF[k][0]) * f, r = PROF[k][1] + (PROF[k + 1][1] - PROF[k][1]) * f;
          const q = proj(cx + p.x + ax * h, lift + ay * h, p.z + az * h);
          if (q) pts.push({ x: q.x, y: q.y, r: Math.max(0.5, r * q.s), h });
        }
        if (pts.length < 3) return;
        ctx.globalAlpha = alpha;
        const sh = proj(cx + p.x, 0, p.z);
        if (sh && tilt < 0.2) { ctx.fillStyle = 'rgba(5,14,24,.35)'; ctx.beginPath(); ctx.ellipse(sh.x + pts[0].r * 0.4, sh.y, pts[0].r * 2.2, pts[0].r * 0.7, 0, 0, 7); ctx.fill(); }
        ctx.fillStyle = INK; for (const c of pts) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 0.9, 0, 7); ctx.fill(); }
        ctx.fillStyle = dim ? '#7D93AA' : '#F7F4EC'; for (const c of pts) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.fill(); }
        if (!dim) { ctx.fillStyle = '#C9D3DE'; for (const c of pts) if (c.r > 1.5) { ctx.beginPath(); ctx.arc(c.x + c.r * 0.45, c.y, c.r * 0.45, 0, 7); ctx.fill(); } }
        ctx.fillStyle = dim ? '#7A2A2A' : '#DC2626'; for (const c of pts) if ((c.h > 0.214 && c.h < 0.232) || (c.h > 0.243 && c.h < 0.262)) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
      // the ball: shaded sphere, three finger holes that roll with it
      function ballAt(ctx, x, y, r, roll, col) {
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, r + 1, 0, 7); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
        ctx.fillStyle = shade(col, 0.68); ctx.beginPath(); ctx.arc(x + r * 0.55, y + r * 0.55, r * 1.05, 0, 7); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x - r * 0.12, y - r * 0.12, r * 0.86, 0, 7); ctx.fill();
        ctx.fillStyle = shade(col, 1.3); ctx.beginPath(); ctx.arc(x - r * 0.42, y - r * 0.45, r * 0.24, 0, 7); ctx.fill();
        // finger holes: as the ball rolls away they travel up its back and over the top
        [[0, -0.18], [0.3, 0.2], [0.3, -0.2]].forEach(([dp, dx]) => {
          const ph = roll + dp, s = Math.sin(ph);
          if (s <= 0.08) return;
          const hx = x + dx * r * 1.2, hy = y + Math.cos(ph) * r * 0.72;
          ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(hx, hy, Math.max(0.6, r * 0.13), Math.max(0.4, r * 0.13 * s), 0, 0, 7); ctx.fill();
        });
        ctx.restore();
      }
      function drawBall(ctx, b, col) {
        const p = proj(b.x, BALL_R, b.z); if (!p) return;
        const r = BALL_R * p.s, sh = proj(b.x, 0, b.z);
        if (sh) { ctx.fillStyle = 'rgba(5,14,24,.4)'; ctx.beginPath(); ctx.ellipse(sh.x, sh.y, r * 1.1, r * 0.32, 0, 0, 7); ctx.fill(); }
        ballAt(ctx, p.x, p.y, r, b.dist / BALL_R, col);
      }
      function scoreScreen(ctx, m, L) {
        const pad = Math.max(1, Math.round(m.h * 0.08));
        ctx.fillStyle = INK; ctx.fillRect(m.x + pad, m.y + pad, m.w - 2 * pad, m.h - 2 * pad);
        if (m.h < 12) return;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const big = Math.max(7, Math.round(m.h * 0.5)), small = Math.max(5, Math.round(m.h * 0.2));
        if (L === 0 && G) {
          const p = me(), st = frameState(p.rolls);
          ctx.font = `${big}px "Arcade Pixel", monospace`; ctx.fillStyle = '#2DD4BF'; ctx.fillText(String(scoreFrames(p.rolls).total), m.x + m.w * 0.5, m.y + m.h * 0.45);
          ctx.font = `${small}px "Arcade Pixel", monospace`; ctx.fillStyle = '#F5B041'; ctx.fillText(`FRAME ${Math.min(10, st.f + 1)}`, m.x + m.w * 0.5, m.y + m.h * 0.8);
          // which pins are still standing, as a little triangle of lights
          const pins = G.sim ? G.sim.pins : G.pins, u = Math.max(1, Math.round(m.h * 0.075));
          pins.forEach((q) => {
            const k = Math.round((PIN_POS[q.i][1] - HEAD) / 0.2639), j = Math.round(PIN_POS[q.i][0] / 0.3048 + k / 2);
            const xx = m.x + m.w * 0.15 + (j - k / 2) * u * 2.2, yy = m.y + m.h * 0.28 + (3 - k) * u * 1.9;
            ctx.fillStyle = q.st === 'up' ? '#F5B041' : '#27496B'; ctx.fillRect(Math.round(xx - u / 2), Math.round(yy - u / 2), u, u);
          });
          ctx.font = `${small}px "Arcade Pixel", monospace`; ctx.fillStyle = '#9DB4CC'; ctx.fillText(G.speedTxt || '', m.x + m.w * 0.85, m.y + m.h * 0.3);
        } else {
          ctx.font = `${big}px "Arcade Pixel", monospace`; ctx.fillStyle = '#1C6B64'; ctx.fillText(String(40 + ((L * 53 + 400) % 150)), m.x + m.w * 0.5, m.y + m.h * 0.5);
        }
        ctx.textBaseline = 'alphabetic';
      }
      // where the ball sits in your hand before you throw (screen pixels)
      function handPos() {
        const pxPerM = R.F / 3.45;
        return { x: R.W / 2 + G.aimX * pxPerM, y: R.H * 0.87, r: Math.round(R.H * (R.H / R.W > 0.8 ? 0.075 : 0.1)) };
      }
      function draw(now) {
        const ctx = G.ctx, p = me();
        ctx.fillStyle = '#081420'; ctx.fillRect(0, 0, R.W, R.H);
        wall(ctx, -16, 16, 0, 5, PIT, '#0B1826');
        floor(ctx, -16, 16, -7, PIT, '#0A1522');
        for (const L of [-4, 4, -3, 3, -2, 2, -1, 1]) drawLane(ctx, L * PITCH, true);
        drawLane(ctx, 0, false);
        // aim guide: where a straight throw from your spot would go
        if (G.guide && p.human && (G.phase === 'idle' || G.hold)) {
          ctx.fillStyle = 'rgba(247,244,236,.55)';
          for (let z = 0.6; z < HEAD - 0.4; z += 0.75) { const q = proj(G.aimX, 0.002, z); if (q) { const w = Math.max(1, Math.round(0.03 * q.s)); ctx.fillRect(Math.round(q.x - w / 2), Math.round(q.y), w, Math.max(1, Math.round(w * 0.6))); } }
        }
        // pins and ball, far ones first
        const items = [];
        for (const L of [-4, -3, -2, -1, 1, 2, 3, 4]) PIN_POS.forEach(([x, z], i) => items.push({ z, f: () => drawPin(ctx, { x, z, st: 'up', i }, L * PITCH, true) }));
        const pins = G.sim ? G.sim.pins : G.pins;
        let barZ = null, barY = 0.62;
        if (G.phase === 'sweep') { const k = Math.min(1, (now - G.sweep0) / 650); barY = k < 0.35 ? 0.62 - k / 0.35 * 0.5 : 0.12; barZ = k < 0.35 ? HEAD - 0.4 : HEAD - 0.4 + (k - 0.35) / 0.65 * 1.4; }
        pins.forEach((q) => { if (q.st === 'gone') return; if (barZ !== null && q.st !== 'up' && q.z < barZ) return; items.push({ z: q.z, f: () => drawPin(ctx, q, 0, false) }); });
        const S = G.sim;
        if (S && S.ball.on) {
          const b = S.ball, t = now - (G.release ? G.release.t : 0);
          items.push({ z: b.z, f: () => {
            if (G.release && t < 170) { // from your hand down onto the lane
              const q = proj(b.x, BALL_R, b.z); if (!q) return; const k = t / 170, r0 = G.release.r, r1 = BALL_R * q.s;
              ballAt(ctx, G.release.x + (q.x - G.release.x) * k, G.release.y + (q.y - G.release.y) * k, r0 + (r1 - r0) * k, b.dist / BALL_R, p.col);
            } else drawBall(ctx, b, p.col);
          } });
        }
        items.sort((a, b) => b.z - a.z).forEach((it) => it.f());
        if (barZ !== null) wall(ctx, -HALF - GUT, HALF + GUT, barY, barY + 0.1, barZ, '#2B4F75');
        // the masking units hang in front of the pins, with a scoreboard screen on each
        for (const L of [-4, 4, -3, 3, -2, 2, -1, 1, 0]) {
          const cx = L * PITCH, w = HALF + GUT + 0.17;
          const m = wall(ctx, cx - w, cx + w, 0.66, 1.62, HEAD - 0.55, L ? '#0D2235' : '#12314F');
          wall(ctx, cx - w, cx + w, 0.6, 0.67, HEAD - 0.55, L ? '#6B4F1C' : '#F5B041');
          if (m) scoreScreen(ctx, m, L);
        }
        // the ball in your hand
        if (!S && !G.over) {
          let hp = handPos();
          if (G.hold && G.hold.cur) hp = { x: clamp(G.hold.cur.x, 8, R.W - 8), y: clamp(G.hold.cur.y, R.H * 0.35, R.H - 6), r: hp.r };
          if (G.phase === 'botaim') { const k = Math.min(1, (now - G.botT0) / 900); hp.y -= Math.sin(k * Math.PI) * R.H * 0.08; }
          if (p.human || G.phase === 'botaim') ballAt(ctx, hp.x, hp.y, hp.r, 1.2, p.col);
        }
        // words on screen
        ctx.textAlign = 'left'; ctx.font = `${Math.max(8, Math.round(R.H * 0.05))}px "Arcade Pixel", monospace`;
        const st = frameState(p.rolls);
        ctx.fillStyle = INK; ctx.fillText(`${p.name.toUpperCase()} · FRAME ${Math.min(10, st.f + 1)}`, 7, Math.round(R.H * 0.07) + 1);
        ctx.fillStyle = '#F7F4EC'; ctx.fillText(`${p.name.toUpperCase()} · FRAME ${Math.min(10, st.f + 1)}`, 6, Math.round(R.H * 0.07));
        if (p.human && G.phase === 'idle' && !G.hold) {
          ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(247,244,236,.85)'; ctx.font = `${Math.max(7, Math.round(R.H * 0.042))}px "Arcade Pixel", monospace`;
          ctx.fillText('GRAB THE BALL · FLICK IT UP THE LANE', R.W / 2, R.H * 0.7);
        }
        if (G.flash && now - G.flash.t < 1600) {
          const k = (now - G.flash.t) / 1600, sc = k < 0.15 ? 0.6 + k / 0.15 * 0.5 : 1.1 - Math.min(0.1, (k - 0.15));
          ctx.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1;
          ctx.textAlign = 'center'; ctx.font = `${Math.round(R.H * 0.14 * sc)}px "Arcade Pixel", monospace`;
          ctx.fillStyle = INK; ctx.fillText(G.flash.txt, R.W / 2 + 2, R.H * 0.5 + 2);
          ctx.fillStyle = G.flash.col; ctx.fillText(G.flash.txt, R.W / 2, R.H * 0.5);
          ctx.globalAlpha = 1;
        }
      }

      /* ---------- the game ---------- */
      let G = null, wrapRO = null;
      const $ = (id) => document.getElementById(id);
      const me = () => G.players[G.cur];
      const msg = (t) => { G.msg = t; const e = $('bw-msg'); if (e) e.textContent = t; };
      const flash = (txt, col) => { G.flash = { txt, col: col || '#F5B041', t: performance.now() }; };
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1040px] mx-auto');
        setupScreen(body, mod, [
          { key: 'seats', label: 'PLAYERS', def: 2, when: (s) => s.net && s.net !== 'here', choices: [[2, '2 players'], [3, '3 players'], [4, '4 players']], hint: '2 players in a quick match is ranked. Empty seats get computer bowlers.' },
          { key: 'mode', label: 'MODE', def: 'solo', local: true, choices: [['solo', 'Solo (beat your best)'], ['bot1', 'Match vs Casual Bot'], ['bot2', 'Match vs Pro Bot']] },
          { key: 'ball', label: 'BALL WEIGHT', def: 'std', choices: [['light', 'Light 10 lb'], ['std', 'Medium 14 lb'], ['heavy', 'Heavy 16 lb']], hint: 'Light balls are easy to throw fast but bounce off the pins more. Heavy balls plough through.' },
          { key: 'guide', label: 'Aim guide', toggle: true, def: 1, hint: 'A dotted line down the lane while you line up your throw.', choices: [[1, 'On'], [0, 'Off']] },
        ], (sel) => { const bot = sel.mode === 'solo' ? 0 : +sel.mode.slice(3); start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(bot ? [{ bot: true, name: bot === 2 ? 'Pro Bot' : 'Casual Bot', avatar: '🤖' }] : []), sel)); });
      }
      // seats come from the table (S). "human" = this screen throws for that seat. Online the thrower's screen
      // decides which pins fell ('res'), so every scorecard is the same even if the pins bounce a bit differently.
      function start(body, sel, S) {
        const COLS = ['#F5B041', '#FB7185', '#2DD4BF', '#34D399'];
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, human: S.mine(i), rolls: [], col: COLS[i % 4] }));
        const bot = S.online ? (S.seats.some((x) => x.bot) ? (+String(sel.mode || '').slice(3) || 1) : 0) : sel.mode === 'solo' ? 0 : +sel.mode.slice(3);
        G = { S, me: S.online ? S.me : 0, body, players, bot, cur: 0, pins: newPins(), sim: null, phase: 'idle', tok: ++GT.cur, over: false, strikes: 0, spares: 0, wt: WEIGHT[sel.ball] || WEIGHT.std, guide: sel.guide === undefined ? true : !!+sel.guide, aimX: 0, hold: null, flash: null, msg: '', lastSnd: 0, rollT: 0, last: performance.now(), speedTxt: '' };
        body.innerHTML = `<div class="space-y-3"><div id="bw-wrap" style="border:4px solid var(--ink);box-shadow:0 5px 0 var(--ink);background:#081420">
            <canvas id="bw-cv" style="width:100%;display:block;image-rendering:pixelated;touch-action:none;cursor:grab"></canvas></div>
          <div class="win p-3"><div id="bw-msg" class="text-sm font-bold min-h-[20px]"></div>
            <div class="text-xs text-muted mt-1 leading-relaxed"><b class="text-bone">How to throw:</b> press on the ball and hold. Slide left or right to pick your spot, then flick it up the lane and let go. A faster flick throws a faster ball, but it is harder to aim. Curve your flick at the end to put spin on it. Keyboard: ← → to move, hold Space and let go to throw.</div></div>
          <div id="bw-card" class="overflow-x-auto"></div>
          <div class="grid grid-cols-2 gap-3"><button id="bw-quit" class="btn-game btn-coral py-2 text-sm">${S.online ? 'Leave game' : bot ? 'Forfeit' : 'End game'}</button><button id="bw-new" class="btn-game btn-graphite py-2 text-sm">New game</button></div></div>`;
        G.cv = $('bw-cv'); G.ctx = G.cv.getContext('2d');
        const fit = () => {
          const wrap = $('bw-wrap'); if (!wrap || !G) return;
          const cssW = wrap.clientWidth, aspect = cssW < 560 ? 1.05 : 0.6;
          const W = clamp(Math.round(cssW / 2), 240, 560), H = Math.round(W * aspect);
          if (G.cv.width !== W || G.cv.height !== H) { G.cv.width = W; G.cv.height = H; }
          G.cv.style.height = Math.round(cssW * aspect) + 'px';
          setView(W, H); camTo(CAM.z); G.ctx.imageSmoothingEnabled = false;
        };
        CAM.z = CAM.base;
        fit();
        if (wrapRO) wrapRO.disconnect();
        if (window.ResizeObserver) { wrapRO = new ResizeObserver(fit); wrapRO.observe($('bw-wrap')); } else gOn(window, 'resize', fit);
        // ---- throwing with the mouse / finger ----
        const at = (e) => { const r = G.cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * R.W / r.width, y: (e.clientY - r.top) * R.H / r.height, t: performance.now() }; };
        G.cv.onpointerdown = (e) => {
          if (!G || G.over || G.phase !== 'idle' || !me().human) return;
          const q = at(e), hp = handPos();
          if (q.y < R.H * 0.45 && hyp(q.x - hp.x, q.y - hp.y) > hp.r * 2.2) return;
          e.preventDefault(); try { G.cv.setPointerCapture(e.pointerId); } catch (er) {}
          G.hold = { pts: [q], cur: q, frozen: false }; G.cv.style.cursor = 'grabbing'; SFX.play('click');
        };
        gOn(window, 'pointermove', (e) => {
          if (!G || !G.hold) return;
          const q = at(e); G.hold.cur = q; G.hold.pts.push(q);
          while (G.hold.pts.length > 2 && q.t - G.hold.pts[0].t > 400) G.hold.pts.shift();
          // low on the screen you are choosing your spot; push up and the spot stays where it was
          if (q.y > R.H * 0.68 && !G.hold.frozen) G.aimX = clamp((q.x - R.W / 2) / (R.F / 3.45), -0.46, 0.46); else G.hold.frozen = true;
        });
        const up = () => { if (G && G.hold) release(); };
        gOn(window, 'pointerup', up); gOn(window, 'pointercancel', () => { if (G) { G.hold = null; G.cv.style.cursor = 'grab'; } });
        // ---- keyboard ----
        gOn(document, 'keydown', (e) => {
          if (!G || G.over || !me().human || G.phase !== 'idle' || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); G.aimX = clamp(G.aimX + (e.key === 'ArrowLeft' ? -0.03 : 0.03), -0.46, 0.46); }
          if (e.key === ' ' && !e.repeat) { e.preventDefault(); G.kb = performance.now(); msg('Swinging... let go of Space to throw.'); }
        });
        gOn(document, 'keyup', (e) => {
          if (!G || e.key !== ' ' || !G.kb) return;
          e.preventDefault(); const held = Math.min(1.4, (performance.now() - G.kb) / 1000); G.kb = 0;
          if (G.phase !== 'idle' || !me().human) return;
          const speed = (3.8 + held / 1.4 * 6.2) * G.wt.v; sendThrow(G.aimX, aimError(0, speed), speed, 0);
        });
        $('bw-new').onclick = () => npConfirmLeave(() => open($('game-root')));
        if (S.online) $('bw-new').textContent = 'Back to setup';
        S.on(apply, () => {});
        S.onLeftBowl = null;
        npBar('');
        let sure = false;
        $('bw-quit').onclick = (e) => { if (S.online) return npConfirmLeave(() => open($('game-root'))); if (!sure) { sure = true; e.target.textContent = 'Sure?'; gTimeout(() => { sure = false; if (G) e.target.textContent = G.bot ? 'Forfeit' : 'End game'; }, 3000); return; } finish(true); };
        card(); nextBall(); gRaf(loop);
      }
      // faster balls are harder to keep on line
      const aimError = (ang, speed) => ang + gauss() * (0.003 + 0.0028 * Math.pow(Math.max(0, speed - 5.5), 1.2));
      function release() {
        const h = G.hold; G.hold = null; G.cv.style.cursor = 'grab';
        const last = h.pts[h.pts.length - 1], now = last.t;
        const recent = h.pts.filter((q) => now - q.t <= 110), a = recent[0] || last;
        const dt = Math.max(0.016, (now - a.t) / 1000), vx = (last.x - a.x) / dt / R.H, vy = -(last.y - a.y) / dt / R.H; // screen heights per second
        if (vy < 0.9) { msg('Flick the ball up the lane and let go to throw it.'); return; }
        const speed = clamp(2.6 + vy * 1.45, 3.5, 11) * G.wt.v;
        // spin: how much the flick curved sideways at the very end
        const win = h.pts.filter((q) => now - q.t <= 240), mid = win[Math.floor(win.length / 2)] || a, first = win[0] || a;
        const v1 = (mid.x - first.x) / Math.max(0.016, (mid.t - first.t) / 1000) / R.H, v2 = (last.x - mid.x) / Math.max(0.016, (last.t - mid.t) / 1000) / R.H;
        const spin = clamp((v2 - v1) / vy * 1.4, -1, 1);
        const ang = clamp(vx / vy * 0.11, -0.1, 0.1);
        G.from = { x: clamp(last.x, 8, R.W - 8), y: clamp(last.y, R.H * 0.35, R.H - 6), r: handPos().r };
        sendThrow(G.aimX, aimError(ang, speed), speed, spin);
      }
      // your throw (or the computer's) goes to the table; every screen rolls it
      function sendThrow(x, ang, speed, spin) {
        G.phase = 'sent';
        G.S.act({ t: 'throw', s: G.cur, x, ang, speed, spin, b: G.players[G.cur].rolls.length });
      }
      function apply(a) {
        if (!G || G.over) return 0;
        if (a.t === 'throw') {
          if (a.s !== G.cur || a.b !== G.players[G.cur].rolls.length || !['idle', 'sent', 'botaim'].includes(G.phase)) return 0;
          const num = (v, lo, hi) => clamp(+v || 0, lo, hi);
          G.aimX = num(a.x, -0.46, 0.46);
          throwBall(G.aimX, num(a.ang, -0.2, 0.2), num(a.speed, 2, 12), num(a.spin, -1, 1), me().human ? G.from : null);
          G.from = null;
          return 0;
        }
        if (a.t === 'res') { if (a.s === G.cur && a.b === G.players[G.cur].rolls.length && G.sim) finishRoll(Array.isArray(a.left) ? a.left.filter((i) => G.standing0.includes(i)) : []); return 0; }
        if (a.t === '_left' || a.t === '_gone') {
          const q = G.players[a.s]; if (!q) return 0;
          q.human = false; q.name += ' (CPU)'; q.av = '🤖'; G.bot = G.bot || 1;
          if (G.S.n === 2 && a.s !== G.me) { G.left = a; finish(false); return 0; }
          if (a.s === G.cur && ['idle', 'sent'].includes(G.phase)) nextBall();
          card();
        }
        return 0;
      }
      function throwBall(x, ang, speed, spin, from) {
        const p = me();
        G.sim = { ball: mkBall(x, ang, speed, spin, G.wt.m), pins: G.pins.map((q) => ({ ...q })) };
        G.phase = 'roll'; G.ev = {}; G.rollT = 0; G.firstHit = false;
        G.release = { ...(from || handPos()), t: performance.now() };
        G.standing0 = G.pins.filter((q) => q.st === 'up').map((q) => q.i);
        const mph = Math.round(speed * 2.237);
        G.speedTxt = mph + ' MPH';
        SFX.play('roll');
        msg(`${p.name} throws: ${mph} mph${Math.abs(spin) > 0.25 ? (spin < 0 ? ', hooking left' : ', hooking right') : ''}.`);
      }

      /* ---- turns ---- */
      function nextBall() {
        if (G.over) return;
        const p = me(), st = frameState(p.rolls);
        if (st.done) return advance();
        G.phase = 'idle'; G.sim = null; G.hold = null;
        const bn = st.b + 1;
        msg(p.human ? `${G.players.length > 1 ? p.name + ': ' : ''}Frame ${st.f + 1}, ball ${st.f === 9 ? bn : Math.min(bn, 2)}. Grab the ball and flick it up the lane.` : `${p.name} is up (frame ${st.f + 1}).`);
        card();
        if (G.S.bot(G.cur) && G.S.isHost) { const tok = G.tok; gTimeout(() => { if (G && G.tok === tok && !G.over) botRoll(); }, 1000); }
      }
      function advance() {
        if (G.players.every((p) => frameState(p.rolls).done)) return finish(false);
        let n = G.cur; do { n = (n + 1) % G.players.length; } while (frameState(G.players[n].rolls).done && !G.players.every((p) => frameState(p.rolls).done));
        G.cur = n; G.pins = newPins(); G.aimX = 0; nextBall();
      }
      // the roll has settled on this screen: the thrower's screen (or the host, for a computer) tells the table
      function settledRoll() {
        G.phase = 'settled';
        const cur = G.cur, auth = G.S.mine(cur) || (G.S.bot(cur) && G.S.isHost);
        if (auth) G.S.act({ t: 'res', s: cur, b: G.players[cur].rolls.length, left: G.standing0.filter((i) => G.sim.pins[i].st === 'up') });
      }
      function finishRoll(left) {
        const S = G.sim, p = me();
        // make this screen's pins agree with the result
        G.standing0.forEach((i) => { const q = S.pins[i]; if (left.includes(i)) { if (q.st !== 'up') { const o = G.pins[i]; Object.assign(q, { st: 'up', x: o.x, z: o.z, vx: 0, vz: 0, t: 0 }); } } else if (q.st === 'up') { q.st = 'fall'; q.t = 0; q.dir = Math.PI / 2; } });
        const knocked = G.standing0.length - left.length;
        const st0 = frameState(p.rolls);
        p.rolls.push(knocked);
        const st = frameState(p.rolls);
        const isStrike = knocked === 10 && G.standing0.length === 10;
        const isSpare = !isStrike && knocked > 0 && left.length === 0;
        G.phase = 'result';
        if (isStrike) { SFX.play('strike'); flash('STRIKE!'); if (p.seat === G.me) G.strikes++; msg(`${p.name}: STRIKE!`); }
        else if (isSpare) { SFX.play('coin'); flash('SPARE!', '#34D399'); if (p.seat === G.me) G.spares++; msg(`${p.name}: Spare!`); }
        else if (G.ev.gutter && !knocked) { flash('GUTTER', '#FB7185'); SFX.play('nope'); msg(`${p.name} rolled a gutter ball.`); }
        else { flash(String(knocked), '#F7F4EC'); msg(`${p.name} knocked down ${knocked} pin${knocked === 1 ? '' : 's'}.`); }
        card();
        const tok = G.tok;
        gTimeout(() => {
          if (!G || G.tok !== tok) return;
          G.phase = 'sweep'; G.sweep0 = performance.now(); SFX.play('roll');
          gTimeout(() => {
            if (!G || G.tok !== tok) return;
            G.sim = null;
            if (st.done || st.f !== st0.f) return advance();
            G.pins = st.f === 9 && left.length === 0 ? newPins() : newPins(left);
            nextBall();
          }, 700);
        }, isStrike || isSpare ? 1700 : 1300);
      }

      /* ---- the bot ---- */
      function botPlan(standingIdx, skill) {
        const pro = skill === 2, pts = standingIdx.map((i) => PIN_POS[i]);
        let tx, spin, x0;
        if (standingIdx.length === 10) { tx = 0.07; spin = pro ? -0.55 : 0; x0 = pro ? 0.24 : 0.1; }
        else { // spare: aim at the front pin, leaning towards the middle of what is left, thrown straight
          const front = pts.slice().sort((a, b) => a[1] - b[1])[0], mean = pts.reduce((s, q) => s + q[0], 0) / pts.length;
          tx = front[0] + clamp(mean - front[0], -0.1, 0.1) * 0.7; spin = 0; x0 = clamp(-tx * 0.7, -0.35, 0.35);
        }
        const speed = pro ? 8.1 + gauss() * 0.25 : 6.4 + Math.random() * 2.2;
        let lo = -0.1, hi = 0.1;
        for (let k = 0; k < 18; k++) { const mid = (lo + hi) / 2; if (pathX(x0, mid, speed, spin, G ? G.wt.m : 6.4) < tx) lo = mid; else hi = mid; }
        return { x0, ang: (lo + hi) / 2 + gauss() * (pro ? 0.0024 : 0.011), speed, spin };
      }
      function botRoll() {
        const plan = botPlan(G.pins.filter((q) => q.st === 'up').map((q) => q.i), G.bot);
        G.phase = 'botaim'; G.botT0 = performance.now();
        const x0 = G.aimX, t0 = G.botT0, tok = G.tok;
        const slide = () => { if (!G || G.tok !== tok || G.phase !== 'botaim') return; const k = Math.min(1, (performance.now() - t0) / 700); G.aimX = x0 + (plan.x0 - x0) * k; if (k < 1) gRaf(slide); };
        gRaf(slide);
        gTimeout(() => { if (G && G.tok === tok && !G.over && G.phase === 'botaim') sendThrow(plan.x0, plan.ang, plan.speed, plan.spin); }, 950);
      }

      /* ---- the frame loop: physics, camera, drawing ---- */
      function loop(now) {
        if (!G || G.over && !G.sim) { if (G) draw(now || performance.now()); return; }
        now = now || performance.now();
        const dt = Math.min(0.05, (now - G.last) / 1000); G.last = now;
        if (G.phase === 'roll' && G.sim) {
          const S = G.sim, n = Math.max(1, Math.round(dt * 600));
          for (let k = 0; k < n; k++) simStep(S, dt / n, G.ev);
          G.rollT += dt;
          if (G.ev.ball && !G.firstHit) { G.firstHit = true; SFX.play('pins'); G.lastSnd = now; }
          if (G.ev.snd && now - G.lastSnd > 110) { SFX.play('pins'); G.lastSnd = now; G.ev.snd = 0; }
          if ((G.rollT > 1.2 && settled(S)) || G.rollT > 10) settledRoll();
        }
        // the camera glides down the lane behind the ball, waits for the pins, then comes back
        const b = G.sim && G.sim.ball;
        const target = G.phase === 'roll' && b ? clamp(b.z - 6.2, CAM.base, CAM.end) : G.phase === 'result' || G.phase === 'sweep' || G.phase === 'settled' ? CAM.end : CAM.base;
        camTo(CAM.z + (target - CAM.z) * (1 - Math.exp(-dt * (target < CAM.z ? 3.2 : 2.4))));
        draw(now);
        gRaf(loop);
      }

      /* ---- scoreboard ---- */
      function card() {
        const el = $('bw-card'); if (!el) return;
        el.innerHTML = G.players.map((p, pi) => {
          const sc = scoreFrames(p.rolls);
          const st = frameState(p.rolls);
          return `<table class="w-full text-center" style="border-collapse:collapse;min-width:640px;margin-bottom:8px;background:#0F2A44"><thead><tr><th class="text-left px-2 py-1 pix text-xs ${pi === G.cur && !G.over ? 'text-amber' : 'text-muted'}" style="width:130px">${p.av} ${esc(p.name)}</th>${Array.from({ length: 10 }, (_, f) => `<th class="pix text-xs text-muted" style="border:2px solid var(--ink);${f === 9 ? 'width:84px' : 'width:58px'}">${f + 1}</th>`).join('')}<th class="pix text-xs text-amber" style="border:2px solid var(--ink);width:64px">TOTAL</th></tr></thead>
            <tbody><tr><td></td>${sc.frames.map((fr, f) => { const mk = marks(fr, f); const act = pi === G.cur && st.f === f && !st.done && !G.over; return `<td style="border:2px solid var(--ink);height:56px;vertical-align:top;${act ? 'box-shadow:inset 0 0 0 3px #F5B041;' : ''}"><div class="flex justify-end gap-0.5 pix text-sm pr-1" style="min-height:22px">${(f === 9 ? [0, 1, 2] : [0, 1]).map((k) => `<span style="min-width:18px;border-left:2px solid var(--ink);border-bottom:2px solid var(--ink);color:${mk[k] === 'X' || mk[k] === '/' ? '#F5B041' : '#F7F4EC'}">${mk[k] || '&nbsp;'}</span>`).join('')}</div><div class="pix text-lg ${fr.cum === null ? 'text-muted' : 'text-bone'}">${fr.cum === null ? '' : fr.cum}</div></td>`; }).join('')}<td class="pix text-xl text-amber" style="border:2px solid var(--ink)">${sc.total}</td></tr></tbody></table>`;
        }).join('');
      }

      /* ---- results ---- */
      function finish(forfeit) {
        if (G.over) return; G.over = true; G.S.over = true;
        const tot = G.players.map((p) => scoreFrames(p.rolls).total);
        const mine = tot[G.me];
        if (G.S.online) return finishOnline(tot);
        const s = gstat('bowling'); s.games = (s.games || 0) + 1; s.pins = (s.pins || 0) + mine; s.high = Math.max(s.high || 0, mine); s.strikes = (s.strikes || 0) + G.strikes; s.spares = (s.spares || 0) + G.spares; s.perfect = (s.perfect || 0) + (mine === 300 ? 1 : 0);
        let res = 'done', elo = 0, title = 'Game over', sub = `You scored ${mine}.`;
        if (G.bot) {
          const bs = tot[1];
          if (forfeit) { res = 'loss'; elo = -6; title = 'You forfeited'; sub = 'The bot takes it.'; }
          else if (mine > bs) { res = 'win'; elo = G.bot === 2 ? 16 : 8; title = 'You win!'; sub = `${mine} to ${bs}.`; }
          else if (mine < bs) { res = 'loss'; elo = G.bot === 2 ? -4 : -7; title = 'You lose'; sub = `${mine} to ${bs}.`; }
          else { res = 'draw'; elo = 2; title = 'A tie!'; sub = `${mine} each.`; }
        } else title = mine === 300 ? 'PERFECT GAME!' : mine >= 200 ? 'Incredible!' : mine >= 150 ? 'Great game!' : mine >= 100 ? 'Solid game' : 'Keep rolling';
        reportGame('bowling', res, { elo, xp: 15 + Math.round(mine / 8), label: `${mine} pts${G.bot ? ' vs ' + G.players[1].name + ' (' + tot[1] + ')' : ' solo'}` });
        SFX.play(res === 'loss' ? 'lose' : 'win'); card();
        gTimeout(() => gameResult({ title, sub, tone: res === 'loss' ? 'coral' : 'amber', sprite: res === 'loss' ? 'anchor' : 'trophy', rows: [['Your score', mine, 'text-amber'], ...(G.bot ? [[G.players[1].name, tot[1], 'text-coral']] : []), ['Strikes', G.strikes, 'text-emerald'], ['Spares', G.spares, 'text-teal'], ...(G.bot ? [['Elo', (elo > 0 ? '+' : '') + elo, elo >= 0 ? 'text-emerald' : 'text-coral']] : [['High score', s.high, 'text-amber']])], againLabel: 'Bowl again', again: () => open($('game-root')) }), 900);
      }

      function finishOnline(tot) {
        const rank = G.players.map((p, i) => ({ p, i, t: tot[i] })).sort((a, b) => b.t - a.t), mine = tot[G.me];
        const won = !!G.left || (rank[0].i === G.me && (rank.length < 2 || rank[1].t < mine));
        const s = gstat('bowling'); s.games = (s.games || 0) + 1; s.pins = (s.pins || 0) + mine; s.high = Math.max(s.high || 0, mine); s.strikes = (s.strikes || 0) + G.strikes; s.spares = (s.spares || 0) + G.spares; s.online = (s.online || 0) + 1;
        const tok = G.tok;
        G.S.finish(won ? 'win' : 'loss').then((eloRow) => {
          if (!G || G.tok !== tok) return;
          reportGame('bowling', won ? 'win' : 'loss', { elo: 0, xp: 15 + Math.round(mine / 8), label: `Online · ${mine} pts` });
          SFX.play(won ? 'win' : 'lose'); card();
          gTimeout(() => gameResult({ title: G.left ? 'You win!' : won ? 'You win the lane!' : `${rank[0].p.name} wins`, sub: G.left ? `${G.S.name(G.left.s)} ${G.left.t === '_gone' ? 'disconnected' : 'left the game'}.` : `You scored ${mine}.`, tone: won ? 'amber' : 'coral', sprite: won ? 'trophy' : 'anchor',
            rows: rank.map((r, k) => [`${k + 1}. ${r.p.name}`, r.t, r.i === G.me ? 'text-amber' : 'text-bone']).concat(eloRow ? [eloRow] : []), againLabel: 'Back to setup', again: () => open($('game-root')) }), 900);
        });
      }

      const mod = {
        id: 'bowling', name: 'Bowling', icon: 'bowling', cats: ['sports'], sub: '1-4 PLAYERS · ~6 MIN', color: '#FB7185', tone: 'coral', btn: 'coral',
        blurb: 'Step up to the lane. Grab the ball, flick it at the pins and watch them fly. Full 10-frame scoring with strikes and spares.',
        rules: { tag: '10 FRAMES', steps: [
          '<strong class="text-bone">Throwing:</strong> Press on the ball and hold it. Slide left or right to pick where you stand, then flick it up the lane and let go. A faster flick throws a faster ball but makes it harder to aim. Curve the end of your flick to add spin so the ball hooks.',
          '<strong class="text-bone">Frames:</strong> You get 2 throws per frame to knock down all 10 pins. A <span class="text-amber font-bold">strike (X)</span> is all 10 on the first ball and a <span class="text-amber font-bold">spare (/)</span> is all 10 in two balls.',
          '<strong class="text-bone">Scoring:</strong> A strike scores 10 plus your next two balls. A spare scores 10 plus your next ball. The 10th frame gives bonus balls. A perfect game is 300.',
        ], tip: 'Aim for the pocket: just right of the head pin, between pins 1 and 3. A ball that hooks into the pocket knocks down the most pins.' },
        profileTiles: (s) => [['HIGH SCORE', s.high || 0, 'text-amber'], ['GAMES', s.games || 0, 'text-bone'], ['AVERAGE', s.games ? Math.round(s.pins / s.games) : 0, 'text-emerald'], ['STRIKES', s.strikes || 0, 'text-teal']],
        extraRows: (s) => srow('Spares', s.spares || 0) + srow('Perfect games', s.perfect || 0),
        online: { seats: (sel) => +sel.seats || 2, ranked: true, start: (body, sel, S) => start(body, sel, S) },
        engine: { frameState, scoreFrames, rollSim, pathX, botPlan, PIN_POS, newPins, state: () => G, throwBall: (x, a, sp, sn) => throwBall(x, a, sp, sn) },
        open, close() { if (wrapRO) { wrapRO.disconnect(); wrapRO = null; } G = null; },
      };
      registerGame(mod);
    })();

