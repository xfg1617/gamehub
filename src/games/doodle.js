    /* =========================================================================
       DOODLE CHAIN: write → draw → describe, passed around (pass & play), plus a solo "Guess the Doodle"
       ========================================================================= */
    (function doodleGame() {
      const circ = (x, y, r) => `M${x - r} ${y} A${r} ${r} 0 1 0 ${x + r} ${y} A${r} ${r} 0 1 0 ${x - r} ${y}`;
      const DOODLES = [
        { w: ['house', 'home'], s: ['M15 48 L50 16 L85 48 Z', 'M22 48 L22 86 L78 86 L78 48', 'M42 86 L42 62 L58 62 L58 86', 'M64 30 L64 20 L74 20 L74 38', 'M28 56 h10 v10 h-10 z'] },
        { w: ['tree'], s: ['M44 92 L44 60', 'M56 92 L56 60', 'M50 12 C78 12 90 40 72 56 C62 66 38 66 28 56 C10 40 22 12 50 12 Z', circ(40, 34, 3), circ(60, 42, 3)] },
        { w: ['sun'], s: [circ(50, 50, 20), 'M50 6 L50 20', 'M50 80 L50 94', 'M6 50 L20 50', 'M80 50 L94 50', 'M19 19 L29 29', 'M71 71 L81 81', 'M81 19 L71 29', 'M19 81 L29 71'] },
        { w: ['cat', 'kitten'], s: ['M25 42 L30 14 L43 30 L57 30 L70 14 L75 42 C82 66 66 82 50 82 C34 82 18 66 25 42 Z', 'M38 48 L38 54', 'M62 48 L62 54', 'M46 60 L54 60 L50 65 Z', 'M14 58 L36 61', 'M14 68 L36 65', 'M86 58 L64 61', 'M86 68 L64 65'] },
        { w: ['fish'], s: ['M18 50 C34 22 66 22 80 50 C66 78 34 78 18 50 Z', 'M80 50 L96 34 L96 66 Z', circ(34, 46, 2.5), 'M52 36 C58 50 52 64 48 68', 'M45 30 L52 20 L60 30'] },
        { w: ['car', 'automobile'], s: ['M8 64 L8 50 L24 47 L36 30 L66 30 L80 47 L94 50 L94 64 Z', circ(30, 66, 9), circ(72, 66, 9), 'M40 34 L40 47 L60 47 L60 34 Z', 'M8 58 L14 58'] },
        { w: ['flower'], s: ['M50 92 L50 48', 'M50 78 C66 66 74 72 72 80 C64 86 56 84 50 78', circ(50, 40, 6), 'M50 34 C38 12 62 12 50 34', 'M44 40 C22 30 22 52 44 40', 'M56 40 C78 30 78 52 56 40', 'M50 46 C38 68 62 68 50 46'] },
        { w: ['star'], s: ['M50 8 L62 38 L94 38 L68 57 L78 90 L50 70 L22 90 L32 57 L6 38 L38 38 Z'] },
        { w: ['heart'], s: ['M50 88 C6 56 12 14 34 16 C44 17 50 26 50 34 C50 26 56 17 66 16 C88 14 94 56 50 88 Z'] },
        { w: ['boat', 'ship', 'sailboat'], s: ['M14 62 L86 62 L72 82 L28 82 Z', 'M50 62 L50 12', 'M52 16 L84 56 L52 56 Z', 'M4 92 q5 -6 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0'] },
        { w: ['umbrella'], s: ['M8 52 C8 14 92 14 92 52 C82 44 72 44 64 52 C56 44 44 44 36 52 C28 44 18 44 8 52 Z', 'M50 30 L50 82 C50 94 36 94 36 82'] },
        { w: ['apple'], s: ['M50 30 C18 18 8 62 30 84 C40 94 46 86 50 86 C54 86 60 94 70 84 C92 62 82 18 50 30 Z', 'M50 30 L53 12', 'M53 20 C62 8 76 14 76 14 C72 26 60 26 53 20'] },
        { w: ['rocket', 'spaceship'], s: ['M50 6 C68 24 68 56 62 76 L38 76 C32 56 32 24 50 6 Z', circ(50, 38, 7), 'M38 62 L22 84 L38 76', 'M62 62 L78 84 L62 76', 'M43 82 L50 98 L57 82'] },
        { w: ['moon'], s: ['M66 10 C30 14 14 52 30 74 C46 94 76 90 90 70 C60 78 40 54 52 34 C56 26 62 18 66 10 Z', 'M82 22 L82 28', 'M76 25 L88 25'] },
        { w: ['key'], s: [circ(28, 34, 16), circ(28, 34, 5), 'M40 46 L88 84', 'M74 73 L66 83', 'M84 81 L76 91'] },
        { w: ['cup', 'mug', 'coffee', 'tea'], s: ['M22 32 L28 84 L72 84 L78 32 Z', 'M78 44 C98 44 98 70 74 70', 'M38 22 C32 14 44 10 38 2', 'M56 22 C50 14 62 10 56 2'] },
        { w: ['clock', 'watch'], s: [circ(50, 50, 40), 'M50 50 L50 22', 'M50 50 L70 60', 'M50 14 L50 20', 'M50 80 L50 86', 'M14 50 L20 50', 'M80 50 L86 50'] },
        { w: ['pizza'], s: ['M50 92 L8 26 C34 10 66 10 92 26 Z', 'M8 26 C34 10 66 10 92 26', circ(40, 38, 6), circ(62, 40, 6), circ(50, 62, 6)] },
        { w: ['snowman'], s: [circ(50, 76, 22), circ(50, 46, 16), circ(50, 22, 12), 'M42 8 L58 8 M45 8 L45 2 L55 2 L55 8', 'M47 22 L58 24 L47 26 Z', circ(46, 19, 1.4), circ(54, 19, 1.4), 'M34 46 L12 34', 'M66 46 L88 34'] },
        { w: ['mushroom'], s: ['M10 56 C10 14 90 14 90 56 Z', 'M40 56 L40 88 L60 88 L60 56', circ(30, 40, 6), circ(58, 32, 5), circ(72, 46, 4)] },
        { w: ['ice cream', 'icecream', 'cone'], s: ['M30 52 L50 94 L70 52', circ(50, 38, 22), 'M32 54 L68 54', 'M60 22 C64 14 70 14 72 8'] },
      ];
      const PROMPTS = ['A cat wearing a tiny hat', 'Pizza on the moon', 'A dragon afraid of fire', 'A fish riding a bicycle', 'An octopus playing drums', 'Grandma skateboarding', 'A sleepy volcano', 'A robot eating spaghetti', 'A penguin on vacation', 'The world\'s tallest sandwich', 'A ghost doing laundry', 'A dog driving a taxi', 'A cow on a trampoline', 'A banana with sunglasses', 'Two snails racing', 'A pirate who hates water', 'A snowman at the beach', 'A giraffe in a tiny car', 'An alien ordering coffee', 'A shark with a toothbrush', 'A squirrel with a jetpack', 'A knight afraid of a mouse', 'A birthday party for a monster', 'A pig flying a kite', 'A chef made of cheese', 'A turtle winning a race', 'A bear playing the guitar', 'A superhero doing homework', 'A frog on a surfboard', 'A cactus getting a hug', 'A unicorn eating tacos', 'A tiny house on a giant pumpkin', 'A rocket made of cardboard', 'A lion at the dentist', 'A duck wearing roller skates', 'A mermaid with a laptop', 'A bee delivering pizza', 'A monkey painting a picture', 'A sheep counting people', 'A walrus on a swing'];
      const COLS = ['#16212E', '#E11D48', '#F59E0B', '#16A34A', '#2563EB', '#92400E', '#FFFFFF'];
      const CANVAS_BG = '#FDFBF5';
      const ABORT = { a: 1 };
      let G = null;
      const $ = (id) => document.getElementById(id);

      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[900px] mx-auto');
        setupScreen(body, mod, [
          { key: 'mode', label: 'MODE', def: 'live', local: true, choices: [['live', 'Draw & Guess'], ['solo', 'Solo: Guess the Doodle']] },
          { key: 'n', label: 'PLAYERS', def: 4, when: (s) => s.mode !== 'solo', choices: [[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']] },
          { key: 'rounds', label: 'ROUNDS', def: 2, when: (s) => s.mode !== 'solo', choices: [[1, '1'], [2, '2'], [3, '3']], hint: 'In each round, everyone draws once.' },
          { key: 'dtime', label: 'DRAWING TIME', def: 80, when: (s) => s.mode !== 'solo', choices: [[60, '60 sec'], [80, '80 sec'], [100, '100 sec']] },
        ], (sel) => (sel.mode === 'solo' ? solo(body) : live(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(['Doodlebot', 'Sketchy', 'Pencil Pal', 'Crayon', 'Scribbles'].slice(0, (+sel.n || 4) - 1).map((name, i) => ({ bot: true, name, avatar: ['🤖', '🦊', '🐻', '🐙', '🦉'][i] }))), sel))),
          'Draw & Guess: take turns drawing a word while everyone else races to guess it. Solo: watch a doodle appear and guess what it is.');
      }

      /* ====================== ONLINE: everyone plays at once, each on a different chain ====================== */
      // a drawing travels as a small JPEG so it fits in one message
      function shrink(url) {
        return new Promise((res) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = 380; c.height = 240; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 380, 240); res(c.toDataURL('image/jpeg', 0.6)); }; im.onerror = () => res(''); im.src = url; });
      }
      async function onlineChain(body, sel, S) {
        const n = S.n;
        G = { mode: 'chain', online: true, S, body, n, names: S.seats.map((x) => x.name), chains: S.seats.map((_, i) => ({ start: i, steps: [] })), step: 0, speed: +sel.speed || 0, tok: ++GT.cur, over: false };
        S.track(); npBar('');
        body.innerHTML = `<div id="dd-main"></div>`;
        const tok = G.tok, all = S.seats.map((_, i) => i), limit = (G.speed || 90) * 1.2 + 20;
        try {
          for (let st = 0; st < n; st++) {
            G.step = st;
            const c = (S.me - st + n * 4) % n, prev = G.chains[c].steps[st - 1];
            const key = 's' + st;
            let mine = Promise.resolve();
            if (S.mine(S.me)) {
              mine = (st === 0 ? writeTurn(S.me) : st % 2 === 1 ? drawTurn(S.me, prev.data) : describeTurn(S.me, prev.type === 'img' ? prev.data : ''))
                .then(async (v) => { if (st % 2 === 1) v = await shrink(v); else v = NET.clean(String(v).slice(0, 70)); if (G && G.tok === tok) S.act({ t: 'step', key, v }); });
              mine.then(() => { if (G && G.tok === tok && G.step === st) main(`<div class="win max-w-md mx-auto p-6 text-center space-y-2"><div class="pix text-lg text-amber">DONE! STEP ${st + 1}/${n}</div><div id="dd-wait" class="text-sm text-muted">Waiting for the others...</div></div>`); });
            }
            S.onCollect = (k, got) => { const el = $('dd-wait'); if (el && k === key) el.textContent = `${Object.keys(got).length} of ${n} are done...`; };
            const fallback = () => ({ t: 'step', v: st === 0 ? pick(PROMPTS) : st % 2 === 1 ? '' : 'a mystery scribble' });
            const got = await S.collect(key, all, fallback, fallback, limit);
            if (!G || G.tok !== tok) return;
            all.forEach((p) => { const cc = (p - st + n * 4) % n; const v = got[p] && typeof got[p].v === 'string' ? got[p].v : ''; G.chains[cc].steps.push({ type: st === 0 || st % 2 === 0 ? 'text' : 'img', data: st % 2 === 1 && !/^data:image\/(jpeg|png);base64,/.test(v) ? '' : v, by: p }); });
          }
          G.S.over = true;
          await reveal();
        } catch (e) { if (e !== ABORT) throw e; }
      }

      /* ====================== PASS & PLAY ====================== */
      function names(body, sel) {
        const n = +sel.n;
        body.innerHTML = `<div class="win max-w-lg mx-auto overflow-hidden"><div class="winbar teal"><span>WHO IS PLAYING?</span></div><div class="p-5 space-y-3">
          ${Array.from({ length: n }, (_, i) => `<div class="flex items-center gap-3"><span class="pix text-amber w-6">${i + 1}</span><input class="dn flex-1 min-w-0" maxlength="14" value="${i === 0 ? esc(profile.username) : 'Player ' + (i + 1)}" style="background:#0A1624;border:3px solid var(--ink);color:#F7F4EC;padding:.5rem .7rem;font-weight:700"></div>`).join('')}
          <p class="text-xs text-muted">Everyone uses this one device. A hand-off screen hides each turn so nobody peeks.</p><button id="dn-go" class="btn-game btn-amber w-full py-3">Start</button></div></div>`;
        $('dn-go').onclick = () => { const nm = [...body.querySelectorAll('.dn')].map((e, i) => e.value.trim() || 'Player ' + (i + 1)); startChain(body, nm, +sel.speed); };
      }
      function startChain(body, nm, speed) {
        const n = nm.length;
        G = { mode: 'chain', body, n, names: nm, chains: nm.map((_, i) => ({ start: i, steps: [] })), step: 0, speed, tok: ++GT.cur, over: false };
        body.innerHTML = `<div id="dd-main"></div>`;
        chainFlow().catch((e) => { if (e !== ABORT) throw e; });
      }
      const wait = (fn) => new Promise((res) => fn(res));
      const main = (h) => { $('dd-main').innerHTML = h; };
      const tlim = (draw) => (G.speed ? (draw ? G.speed : Math.round(G.speed / 2)) : 0);
      async function chainFlow() {
        for (let s = 0; s < G.n; s++) {
          G.step = s;
          for (let p = 0; p < G.n; p++) {
            const c = (p - s + G.n * 4) % G.n;
            await handoff(p, s);
            const prev = G.chains[c].steps[s - 1];
            let out;
            if (s === 0) out = { type: 'text', data: await writeTurn(p) };
            else if (s % 2 === 1) out = { type: 'img', data: await drawTurn(p, prev.data) };
            else out = { type: 'text', data: await describeTurn(p, prev.data) };
            out.by = p; G.chains[c].steps.push(out);
          }
        }
        await reveal();
      }
      function handoff(p, s) {
        return wait((res) => {
          const what = s === 0 ? 'write a silly prompt' : s % 2 === 1 ? 'draw what you are given' : 'describe the drawing';
          main(`<div class="win max-w-md mx-auto overflow-hidden"><div class="winbar amber"><span>PASS THE DEVICE</span><span class="pix text-xs">STEP ${s + 1}/${G.n}</span></div><div class="p-6 text-center space-y-4"><div class="text-5xl">📱</div><div class="pix text-2xl text-amber">${esc(G.names[p])}</div><p class="text-sm text-muted">Everyone else look away! It is time to <b class="text-bone">${what}</b>.</p><button id="dd-rdy" class="btn-game btn-amber w-full py-3 text-base">I'm ${esc(G.names[p])}, ready!</button></div></div>`);
          $('dd-rdy').onclick = () => { SFX.play('click'); res(); };
        });
      }
      function timerBox(sec, onOut) {
        if (!sec) return { stop() {} , html: '' };
        const host = $('dd-clock'); const clk = makeClock(host); clk.start(sec, 'Time left', onOut, 8); return clk;
      }
      function writeTurn(p) {
        return wait((res) => {
          let clk = null, done = false;
          const fin = (v) => { if (done) return; done = true; if (clk) clk.stop(); res(v); };
          main(`<div class="win max-w-xl mx-auto overflow-hidden"><div class="winbar teal"><span>${esc(G.names[p])}: WRITE A PROMPT</span></div><div class="p-5 space-y-3"><div id="dd-clock"></div><p class="text-sm text-muted">Write something fun to draw. A person, a place or a silly situation.</p>
            <textarea id="dd-txt" rows="2" maxlength="70" placeholder="e.g. A dragon afraid of fire" style="width:100%;background:#0A1624;border:3px solid var(--ink);color:#F7F4EC;padding:.6rem .8rem;font-weight:700;resize:none"></textarea>
            <div class="flex gap-3"><button id="dd-rand" class="btn-game btn-graphite py-2 px-4 text-sm">🎲 Surprise me</button><button id="dd-ok" class="btn-game btn-amber flex-1 py-2">Done</button></div><div id="dd-err" class="text-xs text-coral min-h-[16px]"></div></div></div>`);
          $('dd-txt').focus();
          $('dd-rand').onclick = () => { $('dd-txt').value = pick(PROMPTS); SFX.play('click'); };
          $('dd-ok').onclick = () => { const v = $('dd-txt').value.trim(); if (!v) { $('dd-err').textContent = 'Write something first (or tap Surprise me).'; return; } fin(v); };
          if (G.speed) clk = timerBox(tlim(false), () => fin($('dd-txt').value.trim() || pick(PROMPTS)));
        });
      }
      function describeTurn(p, img) {
        return wait((res) => {
          let clk = null, done = false;
          const fin = (v) => { if (done) return; done = true; if (clk) clk.stop(); res(v); };
          main(`<div class="win max-w-xl mx-auto overflow-hidden"><div class="winbar teal"><span>${esc(G.names[p])}: WHAT IS THIS?</span></div><div class="p-5 space-y-3"><div id="dd-clock"></div><img src="${img}" alt="drawing" style="width:100%;background:${CANVAS_BG};border:4px solid var(--ink)">
            <input id="dd-txt" maxlength="70" placeholder="Describe the drawing in a sentence..." style="width:100%;background:#0A1624;border:3px solid var(--ink);color:#F7F4EC;padding:.6rem .8rem;font-weight:700"><button id="dd-ok" class="btn-game btn-amber w-full py-2">Done</button><div id="dd-err" class="text-xs text-coral min-h-[16px]"></div></div></div>`);
          $('dd-txt').focus(); $('dd-txt').onkeydown = (e) => { if (e.key === 'Enter') $('dd-ok').click(); };
          $('dd-ok').onclick = () => { const v = $('dd-txt').value.trim(); if (!v) { $('dd-err').textContent = 'Type what you see.'; return; } fin(v); };
          if (G.speed) clk = timerBox(tlim(false), () => fin($('dd-txt').value.trim() || 'a mystery scribble'));
        });
      }
      function drawTurn(p, text) {
        return wait((res) => {
          let clk = null, done = false;
          const fin = (v) => { if (done) return; done = true; if (clk) clk.stop(); res(v); };
          main(`<div class="win overflow-hidden"><div class="winbar teal"><span>${esc(G.names[p])}: DRAW THIS</span></div><div class="p-4 space-y-3"><div id="dd-clock"></div><div class="pix text-lg text-amber text-center">${esc(text)}</div>
            <canvas id="dd-cv" width="760" height="480" style="width:100%;touch-action:none;background:${CANVAS_BG};border:4px solid var(--ink);cursor:crosshair"></canvas>
            <div class="flex flex-wrap items-center gap-2 justify-center"><div id="dd-cols" class="flex gap-1.5">${COLS.map((c, i) => `<button data-c="${c}" style="width:30px;height:30px;background:${c};border:3px solid var(--ink);${i === 0 ? 'outline:3px solid #F5B041;' : ''}" title="${c === '#FFFFFF' ? 'Eraser' : 'Colour'}"></button>`).join('')}</div>
            <div class="seg"><button data-sz="4" class="seg-btn">Thin</button><button data-sz="9" class="seg-btn on">Medium</button><button data-sz="20" class="seg-btn">Fat</button></div>
            <button id="dd-undo" class="btn-game btn-graphite py-1.5 px-3 text-sm">Undo</button><button id="dd-clr" class="btn-game btn-graphite py-1.5 px-3 text-sm">Clear</button><button id="dd-ok" class="btn-game btn-amber py-1.5 px-6">Done</button></div></div></div>`);
          const cv = $('dd-cv'), ctx = cv.getContext('2d');
          let col = COLS[0], size = 9, strokes = [], cur = null;
          const redraw = () => { ctx.fillStyle = CANVAS_BG; ctx.fillRect(0, 0, cv.width, cv.height); for (const st of strokes) paint(st); };
          const paint = (st) => { ctx.strokeStyle = st.c === '#FFFFFF' ? CANVAS_BG : st.c; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = st.s; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; if (st.p.length === 1) { ctx.beginPath(); ctx.arc(st.p[0][0], st.p[0][1], st.s / 2, 0, 7); ctx.fill(); return; } ctx.beginPath(); ctx.moveTo(st.p[0][0], st.p[0][1]); for (let i = 1; i < st.p.length; i++) ctx.lineTo(st.p[i][0], st.p[i][1]); ctx.stroke(); };
          const pt = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
          redraw();
          cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); cur = { c: col, s: size, p: [pt(e)] }; strokes.push(cur); paint(cur); };
          cv.onpointermove = (e) => { if (!cur) return; cur.p.push(pt(e)); const n = cur.p.length; if (n >= 2) { ctx.strokeStyle = cur.c === '#FFFFFF' ? CANVAS_BG : cur.c; ctx.lineWidth = cur.s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cur.p[n - 2][0], cur.p[n - 2][1]); ctx.lineTo(cur.p[n - 1][0], cur.p[n - 1][1]); ctx.stroke(); } };
          cv.onpointerup = cv.onpointercancel = () => { cur = null; };
          document.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => { col = b.dataset.c; document.querySelectorAll('[data-c]').forEach((x) => { x.style.outline = x === b ? '3px solid #F5B041' : 'none'; }); }; });
          document.querySelectorAll('[data-sz]').forEach((b) => { b.onclick = () => { size = +b.dataset.sz; document.querySelectorAll('[data-sz]').forEach((x) => x.classList.toggle('on', x === b)); }; });
          $('dd-undo').onclick = () => { strokes.pop(); redraw(); }; $('dd-clr').onclick = () => { strokes = []; redraw(); };
          $('dd-ok').onclick = () => fin(cv.toDataURL('image/png'));
          if (G.speed) clk = timerBox(tlim(true), () => fin(cv.toDataURL('image/png')));
        });
      }
      async function reveal() {
        G.over = true;
        let k = 0;
        const show = () => {
          const c = G.chains[k];
          main(`<div class="space-y-4"><div class="flex items-center justify-between"><div class="pix text-lg text-amber">CHAIN ${k + 1}/${G.n}</div><div class="text-sm text-muted">started by <b class="text-bone">${esc(G.names[c.start])}</b></div></div>
            ${c.steps.map((st, i) => `<div class="win p-3"><div class="text-xs text-muted font-bold mb-1">${esc(G.names[st.by])} ${st.type === 'text' ? (i === 0 ? 'wrote' : 'guessed') : 'drew'}:</div>${st.type === 'text' ? `<div class="pix text-lg text-bone">${esc(st.data)}</div>` : !st.data ? '<div class="text-sm text-muted">(ran out of time before drawing)</div>' : `<img src="${st.data}" alt="drawing" style="width:100%;max-width:520px;background:${CANVAS_BG};border:4px solid var(--ink)">`}</div>`).join('')}
            <div class="flex gap-3"><button id="dd-next" class="btn-game btn-amber flex-1 py-3">${k < G.n - 1 ? 'Next chain ▶' : 'Finish'}</button></div></div>`);
          SFX.play('reveal');
          $('dd-next').onclick = () => { if (k < G.n - 1) { k++; show(); window.scrollTo(0, 0); } else end(); };
        };
        const end = () => {
          const s = gstat('doodle'); s.chains = (s.chains || 0) + G.n; s.drawings = (s.drawings || 0) + G.chains.reduce((a, c) => a + c.steps.filter((x) => x.type === 'img').length, 0);
          reportGame('doodle', 'done', { elo: 0, xp: 25, label: `${G.online ? 'Online' : 'Pass & Play'} with ${G.n} players` });
          SFX.play('win');
          main(`<div class="win max-w-md mx-auto overflow-hidden"><div class="winbar amber"><span>THAT WAS FUN!</span></div><div class="p-6 text-center space-y-4"><div class="text-5xl">🎨</div><p class="text-sm text-muted">${G.n} chains finished. Hope the drawings were as bad as the guesses.</p><div class="flex gap-3"><button id="dd-again" class="btn-game btn-amber flex-1 py-3">Play again</button><button id="dd-home" class="btn-game btn-graphite flex-1 py-3">Lobby</button></div></div></div>`);
          $('dd-again').onclick = () => open($('game-root')); $('dd-home').onclick = () => navigateTo('home');
          if (G.online) { $('dd-again').parentElement.insertAdjacentHTML('afterend', '<div id="dd-rm"></div>'); npRematchSlot($('dd-rm')); }
        };
        show();
      }

      /* ====================== SOLO: GUESS THE DOODLE ====================== */
      const norm = (s) => String(s).toLowerCase().replace(/[^a-z]/g, '');
      function lev(a, b) { const m = a.length, n = b.length; const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
      function matches(guess, doodle) { const g = norm(guess); if (!g) return false; return doodle.w.some((w) => { const x = norm(w); return g === x || g === x + 's' || (x.length >= 5 && lev(g, x) <= 1); }); }
      const ROUNDS = 6, TIME = 30;
      function solo(body) {
        G = { mode: 'solo', body, round: 0, score: 0, right: 0, order: shuffle(DOODLES.map((_, i) => i)).slice(0, ROUNDS), tok: ++GT.cur, over: false };
        body.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-5 items-start"><div id="dd-main"></div><div class="space-y-3"><div class="win overflow-hidden"><div class="winbar amber"><span id="sd-round"></span></div><div class="p-3"><div id="dd-clock"></div></div></div><div class="stat"><div class="lab">Score</div><div id="sd-score" class="val text-amber">0</div></div></div></div>`;
        G.clock = makeClock($('dd-clock'));
        soloRound().catch((e) => { if (e !== ABORT) throw e; });
      }
      async function W(ms) { const t = G && G.tok; await gSleep(ms); if (!G || G.tok !== t) throw ABORT; }
      async function soloRound() {
        const d = DOODLES[G.order[G.round]];
        $('sd-round').textContent = `ROUND ${G.round + 1}/${ROUNDS}`;
        const word = d.w[0];
        main(`<div class="win overflow-hidden"><div class="winbar teal"><span>A BOT IS DRAWING...</span><span id="sd-hint" class="pix text-sm tracking-widest">${word.replace(/[a-z]/gi, '_ ').trim()}</span></div><div class="p-4 space-y-3">
          <svg viewBox="0 0 100 100" style="width:100%;max-width:420px;margin:0 auto;display:block;background:${CANVAS_BG};border:4px solid var(--ink)" fill="none" stroke="#16212E" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${d.s.map((p, i) => `<path id="sp${i}" d="${p}" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1"/>`).join('')}</svg>
          <div class="flex gap-2"><input id="sd-in" autocomplete="off" placeholder="What is it?" style="flex:1;min-width:0;background:#0A1624;border:3px solid var(--ink);color:#F7F4EC;padding:.6rem .8rem;font-weight:700"><button id="sd-go" class="btn-game btn-amber px-5">Guess</button></div><div id="sd-msg" class="text-sm min-h-[20px] text-muted"></div></div></div>`);
        const per = 20 / d.s.length;
        d.s.forEach((_, i) => { const el = $('sp' + i); el.style.transition = `stroke-dashoffset ${per}s linear ${i * per}s`; });
        await W(60);
        d.s.forEach((_, i) => { const el = $('sp' + i); if (el) el.style.strokeDashoffset = 0; });
        $('sd-in').focus();
        let t0 = Date.now(), solved = false, left = TIME, revealed = 0;
        const result = await wait((res) => {
          const finish = (ok) => { G.clock.stop(); res(ok ? Math.max(0, TIME - (Date.now() - t0) / 1000) : -1); };
          const send = () => { const v = $('sd-in').value; if (!v.trim()) return; if (matches(v, d)) { SFX.play('win'); finish(true); } else { SFX.play('wrong'); $('sd-msg').textContent = `Not "${v.trim()}". Try again!`; $('sd-in').value = ''; } };
          $('sd-go').onclick = send; $('sd-in').onkeydown = (e) => { if (e.key === 'Enter') send(); };
          G.clock.start(TIME, 'Time', () => finish(false), 8);
          const hintTimer = gInterval(() => { const el = (Date.now() - t0) / 1000; const want = el > 20 ? 2 : el > 10 ? 1 : 0; if (want > revealed && $('sd-hint')) { revealed = want; const letters = word.split(''); let shown = 0; $('sd-hint').textContent = letters.map((ch, i) => (ch === ' ' ? '  ' : (i === 0 && revealed >= 1) || (i === letters.length - 1 && revealed >= 2) ? ch.toUpperCase() : '_')).join(' '); } }, 500);
        });
        const pts = result < 0 ? 0 : Math.round(20 + 80 * result / TIME - revealed * 8);
        if (result >= 0) { G.right++; G.score += Math.max(10, pts); }
        $('sd-score').textContent = G.score;
        // reveal full doodle
        d.s.forEach((_, i) => { const el = $('sp' + i); if (el) { el.style.transition = 'none'; el.style.strokeDashoffset = 0; } });
        const m = $('sd-msg'); if (m) m.innerHTML = result >= 0 ? `<b class="text-emerald">Correct! +${Math.max(10, pts)}</b> It was a <b>${word}</b>.` : `<b class="text-coral">Time's up!</b> It was a <b>${word}</b>.`;
        const inp = $('sd-in'); if (inp) inp.disabled = true;
        await W(1700);
        G.round++;
        if (G.round >= ROUNDS) return soloEnd();
        return soloRound();
      }
      function soloEnd() {
        G.over = true;
        const s = gstat('doodle'); s.guessed = (s.guessed || 0) + G.right; s.bestSolo = Math.max(s.bestSolo || 0, G.score);
        reportGame('doodle', 'done', { elo: 0, xp: 10 + G.right * 4, label: `Guess the Doodle: ${G.right}/${ROUNDS}, ${G.score} pts` });
        gameResult({ title: G.right >= 5 ? 'Art critic!' : G.right >= 3 ? 'Nice eye!' : 'Keep guessing!', sub: `You guessed ${G.right} of ${ROUNDS} doodles.`, tone: 'amber', sprite: 'trophy', rows: [['Doodles guessed', `${G.right}/${ROUNDS}`, 'text-amber'], ['Score', G.score, 'text-emerald'], ['Best score', s.bestSolo, 'text-teal']], againLabel: 'Play again', again: () => open($('game-root')) });
      }

      /* ====================== DRAW & GUESS (live, Nov 2026): one player draws, everyone else races to guess ======================
         Works on this device (you + computer players) and online. A computer player draws one of the built-in doodles
         stroke by stroke; a person draws on the canvas and every stroke is sent live (S.peek, not stored). Guesses go
         through the table (S.act), so scores agree on every screen. The table's host ends each turn when time is up. */
      const WORDS = ['apple', 'banana', 'rocket', 'castle', 'guitar', 'snowman', 'pizza', 'rainbow', 'spider', 'umbrella', 'robot', 'dragon', 'island', 'camera', 'balloon', 'penguin', 'volcano', 'sandwich', 'ladder', 'candle', 'glasses', 'trophy', 'whale', 'turtle', 'cactus', 'kite', 'anchor', 'crown', 'ghost', 'bridge', 'cookie', 'flower', 'pirate', 'rabbit', 'shoe', 'clock', 'moon', 'star', 'bicycle', 'giraffe'];
      async function LW(ms) { const t = G && G.tok; await gSleep(window.__fast && !G.S.online ? Math.min(ms, 40) : ms); if (!G || G.tok !== t) throw ABORT; }
      function live(body, sel, S) {
        G = { mode: 'live', S, body, me: S.online ? S.me : 0, score: S.seats.map(() => 0), rounds: +sel.rounds || 2, time: +sel.dtime || 80, tok: ++GT.cur, over: false, step: 0, view: {} };
        GT.started = true; GT.over = false;
        S.track(); npBar('');
        body.innerHTML = `<div class="dg-wrap grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
          <div class="space-y-3 min-w-0"><div class="win overflow-hidden"><div class="winbar teal"><span id="dg-who">DRAW & GUESS</span><span id="dg-hint" class="pix text-base tracking-widest"></span></div>
            <div class="p-3 space-y-3"><div id="dd-clock"></div><div id="dg-stage" class="dg-stage"></div><div id="dg-tools"></div></div></div></div>
          <div class="space-y-3 min-w-0"><div class="win overflow-hidden"><div class="winbar amber"><span>PLAYERS</span><span id="dg-round" class="pix text-xs"></span></div><div class="p-2 space-y-1.5" id="dg-board"></div></div>
            <div class="win overflow-hidden"><div class="winbar"><span>GUESSES</span></div><div id="dg-feed" class="dg-feed"></div>
              <form id="dg-form" class="chat-form" autocomplete="off"><input id="dg-in" maxlength="40" placeholder="Type your guess..." aria-label="Your guess"><button type="submit">Guess</button></form></div>
            <button id="dg-quit" class="btn-game btn-coral w-full py-2 text-sm">${S.online ? 'Leave table' : 'Give up'}</button></div></div>`;
        G.clock = makeClock($('dd-clock'));
        $('dg-form').onsubmit = (e) => { e.preventDefault(); const v = $('dg-in').value.trim(); $('dg-in').value = ''; if (!v || !G.k || G.drawer === G.me || G.guessed.has(G.me)) return; S.act({ t: 'guess', s: G.me, k: G.k, txt: NET.clean ? NET.clean(v).slice(0, 40) : v.slice(0, 40) }); };
        S.onLeft = (a) => { if (!G) return; feed(`<i>${esc(S.name(a.s))} ${a.t === '_gone' ? 'disconnected' : 'left'}. A computer player takes the seat.</i>`); board(); };
        S.onPeek = (i, d) => { if (G && i === G.drawer && d.k === G.k) viewStroke(d); };
        let sure = false;
        $('dg-quit').onclick = (e) => { if (S.online) return npConfirmLeave(() => open($('game-root'))); if (!sure) { sure = true; e.target.textContent = 'Really give up?'; gTimeout(() => { sure = false; e.target.textContent = 'Give up'; }, 3000); return; } if (!G.over) { G.tok++; liveEnd(true); } };
        board();
        (async () => {
          for (let r = 1; r <= G.rounds; r++) for (let d = 0; d < S.seats.length; d++) { G.round = r; await liveTurn(d); }
          liveEnd(false);
        })().catch((e) => { if (e !== ABORT) throw e; });
      }
      const feed = (h) => { const el = $('dg-feed'); if (!el) return; el.insertAdjacentHTML('beforeend', `<div>${h}</div>`); while (el.children.length > 60) el.firstChild.remove(); el.scrollTop = el.scrollHeight; };
      function board() {
        const S = G.S, el = $('dg-board'); if (!el) return;
        const order = S.seats.map((_, i) => i).sort((a, b) => G.score[b] - G.score[a]);
        el.innerHTML = order.map((i) => `<div class="pl-tag flex items-center gap-2.5 ${i === G.drawer ? 'turn' : ''} ${i === G.me ? 'me' : ''}" style="--pc:${G.guessed && G.guessed.has(i) ? '#34D399' : '#9DB4CC'}"><span class="tg-av">${esc(S.seats[i].avatar || '🙂')}</span><span class="min-w-0 flex-1"><b class="block truncate text-bone text-sm">${esc(S.name(i))}${S.bot(i) ? ' <small class="text-muted">CPU</small>' : ''}</b><small class="text-xs ${G.guessed && G.guessed.has(i) ? 'text-emerald' : 'text-muted'}">${i === G.drawer ? '✏️ drawing' : G.guessed && G.guessed.has(i) ? '✓ guessed it' : ''}</small></span><b class="pix text-amber text-lg">${G.score[i]}</b></div>`).join('');
        $('dg-round').textContent = G.round ? `ROUND ${G.round}/${G.rounds}` : '';
      }
      const hintOf = (word, shown) => word.split('').map((ch, i) => (ch === ' ' ? ' ' : shown.includes(i) ? ch.toUpperCase() : '_')).join(' ');
      async function liveTurn(d) {
        const S = G.S, k = ++G.step, t = G.tok;
        G.k = null; G.drawer = d; G.guessed = new Set(); G.view = { strokes: {} }; G.word = ''; board();
        $('dg-who').textContent = S.mine(d) ? 'YOUR TURN TO DRAW' : `${S.name(d).toUpperCase()} IS CHOOSING A WORD...`;
        $('dg-hint').textContent = ''; $('dg-tools').innerHTML = ''; G.clock.idle('Get ready', '...');
        $('dg-stage').innerHTML = `<div class="dg-wait">${esc(S.seats[d].avatar || '🙂')}<b>${esc(S.name(d))}</b> ${S.mine(d) ? 'is you! Pick a word to draw.' : 'is picking a word...'}</div>`;
        // 1. the drawer picks a word (a computer player picks one of the built-in doodles)
        if (S.mine(d)) {
          const opts = shuffle(WORDS.concat(DOODLES.map((x) => x.w[0]))).slice(0, 3);
          $('dg-stage').innerHTML = `<div class="dg-wait"><b>Choose a word to draw:</b><div class="flex gap-2 flex-wrap justify-center mt-3">${opts.map((w) => `<button class="btn-game btn-amber py-2 px-5" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div></div>`;
          document.querySelectorAll('#dg-stage [data-w]').forEach((b) => { b.onclick = () => { const di = DOODLES.findIndex((x) => x.w[0] === b.dataset.w); S.act(Object.assign({ t: 'word', s: d, k }, di >= 0 ? { di } : { w: b.dataset.w })); $('dg-stage').innerHTML = ''; }; });
        }
        const a = await S.ask(d, () => ({ t: 'word', k, di: Math.floor(Math.random() * DOODLES.length), bot: 1 }), 900 + rnd(600), (x) => x.s === d && x.t === 'word' && x.k === k);
        if (!G || G.tok !== t) throw ABORT;
        const doodle = a.di !== undefined && DOODLES[a.di] ? DOODLES[a.di] : null;
        const word = (doodle ? doodle.w[0] : String(a.w || 'apple')).toLowerCase().slice(0, 24);
        G.word = word; G.k = k; G.t0 = Date.now();
        const letters = word.split('').map((_, i) => i).filter((i) => word[i] !== ' '), shown = [];
        const paintHint = () => { const h = $('dg-hint'); if (h) h.textContent = S.mine(d) ? word.toUpperCase() : hintOf(word, shown); };
        paintHint();
        $('dg-who').textContent = S.mine(d) ? `DRAW: ${word.toUpperCase()}` : `${S.name(d).toUpperCase()} IS DRAWING`;
        feed(`<i>${esc(S.name(d))} is drawing now.</i>`);
        // 2. the drawing
        if (S.mine(d)) drawPad(k);
        else if (a.bot || !doodle || S.bot(d)) { if (doodle && (a.bot || S.bot(d))) botDraw(doodle); else viewPad(); }
        else viewPad();
        G.clock.start(G.time, 'Time left', () => {}, 10);
        const hintT = gInterval(() => { const el = (Date.now() - G.t0) / 1000; const want = el > G.time * 0.75 ? 2 : el > G.time * 0.45 ? 1 : 0; while (shown.length < Math.min(want, letters.length - 1)) { const left = letters.filter((i) => !shown.includes(i)); shown.push(left[(word.length * 7 + shown.length * 3) % left.length]); } paintHint(); }, 500);
        // 3. guesses until time is up or everyone has it (the host decides for computer players and the clock)
        const others = S.seats.map((_, i) => i).filter((i) => i !== d);
        const tick = () => {
          const el = (Date.now() - G.t0) / 1000;
          if (el >= G.time || others.every((i) => G.guessed.has(i))) return { t: 'end', k };
          for (const b of shuffle(others.filter((i) => S.bot(i) && !G.guessed.has(i)))) {
            const r = Math.random(), pr = Math.min(0.55, (el / G.time) * (S.mine(d) ? 0.5 : 0.9) + 0.03);
            if (r < pr) return { t: 'guess', s: b, k, txt: word };
            if (r < pr + 0.18) return { t: 'guess', s: b, k, txt: pick(WORDS.concat(DOODLES.map((x) => x.w[0])).filter((w) => w !== word)) };
          }
          return { t: 'tick', k };
        };
        for (;;) {
          const g = await S.ask(-1, tick, window.__fast && !S.online ? 30 : 1500 + rnd(1800), (x) => x.k === k && (x.t === 'tick' || x.t === 'end' || (x.t === 'guess' && x.s !== d && !G.guessed.has(x.s))));
          if (!G || G.tok !== t) { gClearInt(hintT); throw ABORT; }
          if (g.t === 'end') break;
          if (g.t !== 'guess') continue;
          const right = doodle ? matches(g.txt, doodle) : matches(g.txt, { w: [word] });
          if (right) {
            G.guessed.add(g.s);
            const left = Math.max(0, G.time - (Date.now() - G.t0) / 1000), pts = Math.max(20, Math.round(30 + 70 * left / G.time) - shown.length * 5);
            G.score[g.s] += pts; G.score[d] += Math.round(pts / 3);
            feed(`<b class="text-emerald">✓ ${esc(S.name(g.s))} guessed the word! +${pts}</b>`);
            SFX.play(g.s === G.me ? 'win' : 'coin'); board();
            if (g.s === G.me) { $('dg-in').disabled = true; $('dg-in').placeholder = 'You got it! Wait for the others...'; }
            if (others.every((i) => G.guessed.has(i))) break;
          } else feed(`<b>${esc(S.name(g.s))}:</b> ${esc(String(g.txt || '').slice(0, 40))}`);
        }
        gClearInt(hintT); G.clock.stop(); G.k = null;
        if (G.pad) { G.pad.off(); G.pad = null; }
        $('dg-in').disabled = false; $('dg-in').placeholder = 'Type your guess...';
        $('dg-hint').textContent = word.toUpperCase();
        $('dg-who').textContent = `THE WORD WAS: ${word.toUpperCase()}`;
        feed(`<i>The word was <b class="text-amber">${esc(word)}</b>.</i>`);
        if (doodle && (a.bot || S.bot(d))) botDraw(doodle, true);
        SFX.play('reveal'); board();
        await LW(3200);
      }
      // a computer player draws a built-in doodle, stroke by stroke (or all at once at the end)
      function botDraw(d, now) {
        const stage = $('dg-stage'); if (!stage) return;
        if (!now || !stage.querySelector('svg')) stage.innerHTML = `<svg viewBox="0 0 100 100" class="dg-svg" fill="none" stroke="#16212E" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${d.s.map((p, i) => `<path id="dgp${i}" d="${p}" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1"/>`).join('')}</svg>`;
        const per = now ? 0 : Math.min(4, (G.time * 0.55) / d.s.length);
        d.s.forEach((_, i) => { const el = $('dgp' + i); if (!el) return; el.style.transition = now ? 'none' : `stroke-dashoffset ${per}s linear ${i * per}s`; });
        gTimeout(() => d.s.forEach((_, i) => { const el = $('dgp' + i); if (el) el.style.strokeDashoffset = 0; }), now ? 0 : 60);
      }
      // watching a person draw: strokes arrive in small pieces
      function viewPad() {
        $('dg-stage').innerHTML = `<canvas id="dg-cv" width="760" height="480" class="dg-cv"></canvas>`;
        const cv = $('dg-cv'); G.view = { cv, ctx: cv.getContext('2d'), strokes: {} };
        G.view.ctx.fillStyle = CANVAS_BG; G.view.ctx.fillRect(0, 0, 760, 480);
      }
      function viewStroke(d) {
        const V = G.view; if (!V || !V.ctx) return;
        const ctx = V.ctx, redraw = () => { ctx.fillStyle = CANVAS_BG; ctx.fillRect(0, 0, 760, 480); Object.keys(V.strokes).sort((a, b) => a - b).forEach((n) => seg(V.strokes[n], 0)); };
        const seg = (st, from) => { ctx.strokeStyle = st.c === '#FFFFFF' ? CANVAS_BG : st.c; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = st.s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          if (st.p.length === 1) { ctx.beginPath(); ctx.arc(st.p[0][0], st.p[0][1], st.s / 2, 0, 7); ctx.fill(); return; }
          ctx.beginPath(); ctx.moveTo(st.p[Math.max(0, from - 1)][0], st.p[Math.max(0, from - 1)][1]); for (let i = Math.max(1, from); i < st.p.length; i++) ctx.lineTo(st.p[i][0], st.p[i][1]); ctx.stroke(); };
        if (d.x) { V.strokes = {}; return redraw(); }
        if (d.u !== undefined) { delete V.strokes[d.u]; return redraw(); }
        const st = V.strokes[d.n] || (V.strokes[d.n] = { c: d.c, s: d.s, p: [] });
        const from = st.p.length; st.p.push(...(d.p || [])); seg(st, from);
      }
      // my turn to draw: the canvas, colours, sizes, undo, clear; strokes go out about 15 times a second
      function drawPad(k) {
        $('dg-stage').innerHTML = `<canvas id="dg-cv" width="760" height="480" class="dg-cv draw"></canvas>`;
        $('dg-tools').innerHTML = `<div class="flex flex-wrap items-center gap-2 justify-center"><div class="flex gap-1.5">${COLS.map((c, i) => `<button data-c="${c}" class="dg-col ${i === 0 ? 'on' : ''}" style="background:${c}" title="${c === '#FFFFFF' ? 'Eraser' : 'Colour'}"></button>`).join('')}</div>
          <div class="seg"><button data-sz="4" class="seg-btn">Thin</button><button data-sz="9" class="seg-btn on">Medium</button><button data-sz="20" class="seg-btn">Fat</button></div>
          <button id="dg-undo" class="btn-game btn-graphite py-1.5 px-3 text-sm">Undo</button><button id="dg-clr" class="btn-game btn-graphite py-1.5 px-3 text-sm">Clear</button></div>`;
        const cv = $('dg-cv'), ctx = cv.getContext('2d'), S = G.S;
        let col = COLS[0], size = 9, strokes = [], cur = null, n = 0, out = null, sent = 0;
        const paint = (st) => { ctx.strokeStyle = st.c === '#FFFFFF' ? CANVAS_BG : st.c; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = st.s; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; if (st.p.length === 1) { ctx.beginPath(); ctx.arc(st.p[0][0], st.p[0][1], st.s / 2, 0, 7); ctx.fill(); return; } ctx.beginPath(); ctx.moveTo(st.p[0][0], st.p[0][1]); for (let i = 1; i < st.p.length; i++) ctx.lineTo(st.p[i][0], st.p[i][1]); ctx.stroke(); };
        const redraw = () => { ctx.fillStyle = CANVAS_BG; ctx.fillRect(0, 0, cv.width, cv.height); strokes.forEach(paint); };
        const pt = (e) => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) * cv.width / r.width), Math.round((e.clientY - r.top) * cv.height / r.height)]; };
        const flush = () => { if (!cur || !out || cur.p.length <= sent) return; S.peek({ k, n: cur.n, c: cur.c, s: cur.s, p: cur.p.slice(sent) }); sent = cur.p.length; };
        const timer = gInterval(flush, 70);
        redraw();
        cv.onpointerdown = (e) => { if (!G.k) return; cv.setPointerCapture(e.pointerId); cur = { n: n++, c: col, s: size, p: [pt(e)] }; strokes.push(cur); paint(cur); out = true; sent = 0; flush(); };
        cv.onpointermove = (e) => { if (!cur) return; cur.p.push(pt(e)); const m = cur.p.length; ctx.strokeStyle = cur.c === '#FFFFFF' ? CANVAS_BG : cur.c; ctx.lineWidth = cur.s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cur.p[m - 2][0], cur.p[m - 2][1]); ctx.lineTo(cur.p[m - 1][0], cur.p[m - 1][1]); ctx.stroke(); };
        cv.onpointerup = cv.onpointercancel = () => { flush(); cur = null; out = null; };
        document.querySelectorAll('#dg-tools [data-c]').forEach((b) => { b.onclick = () => { col = b.dataset.c; document.querySelectorAll('#dg-tools [data-c]').forEach((x) => x.classList.toggle('on', x === b)); }; });
        document.querySelectorAll('#dg-tools [data-sz]').forEach((b) => { b.onclick = () => { size = +b.dataset.sz; document.querySelectorAll('#dg-tools [data-sz]').forEach((x) => x.classList.toggle('on', x === b)); }; });
        $('dg-undo').onclick = () => { const st = strokes.pop(); if (st) { redraw(); S.peek({ k, u: st.n }); } };
        $('dg-clr').onclick = () => { strokes = []; redraw(); S.peek({ k, x: 1 }); };
        G.pad = { off: () => { gClearInt(timer); cv.onpointerdown = null; cv.onpointermove = null; $('dg-tools').innerHTML = ''; } };
      }
      async function liveEnd(gaveUp) {
        if (G.over) return; G.over = true; G.S.over = true;
        const S = G.S, me = G.me, tok = G.tok;
        const order = S.seats.map((_, i) => i).sort((a, b) => G.score[b] - G.score[a]);
        const res = gaveUp ? 'loss' : order[0] === me ? 'win' : 'loss';
        const eloRow = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        const s = gstat('doodle'); s.guessed = (s.guessed || 0); s.bestLive = Math.max(s.bestLive || 0, G.score[me]);
        reportGame('doodle', res, { elo: 0, xp: 10 + Math.round(G.score[me] / 25), label: `Draw & Guess: ${G.score[me]} pts` });
        gameResult({ title: gaveUp ? 'You gave up' : res === 'win' ? 'You win!' : `${S.name(order[0])} wins`, sub: 'Points for fast guesses, and for the drawer when people guess their drawing.',
          tone: res === 'win' ? 'amber' : 'coral', sprite: res === 'win' ? 'trophy' : 'anchor',
          rows: order.slice(0, 4).map((i) => [i === me ? 'You' : S.name(i), G.score[i], i === me ? 'text-amber' : 'text-bone']).concat(eloRow ? [eloRow] : []),
          againLabel: S.online ? 'Back to setup' : 'Play again', again: () => open($('game-root')) });
      }

      const mod = {
        id: 'doodle', name: 'Doodle Guess', icon: 'doodle', cats: ['party'], sub: '2-6 PLAYERS · SOLO', color: '#F5B041', tone: 'amber', btn: 'amber',
        blurb: 'Take turns drawing a secret word while everyone races to guess it. The faster you guess, the more points you get.',
        rules: { tag: 'DRAW & GUESS · 2-6 PLAYERS', steps: [
          '<strong class="text-bone">Drawing:</strong> When it is your turn, pick one of 3 words and draw it. No letters or numbers! Everyone sees your drawing as you make it.',
          '<strong class="text-bone">Guessing:</strong> Everyone else types guesses. The faster you guess right, the more points you get. Letters of the word show up as hints when time runs low.',
          '<strong class="text-bone">Points:</strong> The drawer gets points too, for every player who guesses. After everyone has drawn (1, 2 or 3 rounds), the most points wins.',
          '<strong class="text-bone">Solo:</strong> A computer player draws a doodle stroke by stroke. Type what it is as fast as you can.',
        ], tip: 'Draw the most important shape first, big and simple. Details can wait.' },
        profileTiles: (s) => [['GAMES', s.played, 'text-bone'], ['WINS', s.wins || 0, 'text-amber'], ['GUESSED', s.guessed || 0, 'text-emerald'], ['BEST SOLO', s.bestSolo || 0, 'text-teal']],
        extraRows: (s) => srow('Drawings made', s.drawings || 0),
        online: { seats: (sel) => +sel.n || 6, min: 2, ranked: false, start: (body, sel, S) => live(body, sel, S) },
        engine: { DOODLES, matches, word: () => (G && G.word) || '' }, open, close() { G = null; },
      };
      registerGame(mod);
    })();

