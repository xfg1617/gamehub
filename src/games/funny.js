    /* =========================================================================
       FUNNY ANSWERS — Nov 2026, Inna's list (a party game of funny answers; our own prompts and look). People only, 3-8
       players, everyone on their own screen.
       Rounds 1 (and 2): every prompt goes to two players; everyone else votes for the funnier answer, names hidden until
       the votes are in. Each vote = 100 × round; the winner +100 × round; every vote = CLEAN SWEEP, +250 × round.
       Final round: one prompt for everyone; each player picks gold / silver / bronze (300 / 200 / 100).
       Prompts: funny_prompts.js (English and Vietnamese, "Crazy" or "Family friendly"). Netplay script style:
       writing and voting go through S.collect, so every screen moves together.
       ========================================================================= */
    (function funnyGame() {
      const ABORT = { a: 1 };
      let G = null;
      const $ = (id) => document.getElementById(id);
      const clean = (t) => { t = String(t || '').replace(/\s+/g, ' ').trim().slice(0, 80); try { if (typeof NET !== 'undefined' && NET.clean) t = NET.clean(t); } catch (e) {} return t; };
      const T = (en, v) => (typeof LANG !== 'undefined' && LANG.code === 'vi' ? v : en);   // the player's own language for buttons and messages
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1100px] mx-auto');
        const def = typeof LANG !== 'undefined' && LANG.code === 'vi' ? 'vi' : 'en';
        setupScreen(body, mod, [
          { key: 'lang', label: 'PROMPTS IN', def, hero: true, hint: 'Which language the prompts are in.', choices: [['en', '🇺🇸 English'], ['vi', '🇻🇳 Tiếng Việt']] },
          { key: 'n', label: 'PLAYERS', def: 8, choices: [[3, '3'], [4, '4'], [5, '5'], [6, '6'], [8, '8']] },
          { key: 'rounds', label: 'ROUNDS', def: 3, choices: [[2, '2'], [3, '3']], hint: 'The last round is always the final round, where everyone answers the same prompt.' },
          { key: 'wtime', label: 'TIME TO WRITE', def: 90, choices: [[60, '60 sec'], [90, '90 sec'], [120, '2 min']] },
          { key: 'kind', label: 'PROMPTS', def: 'crazy', choices: [['crazy', 'Crazy'], ['clean', 'Family friendly']] },
        ], () => showToast('Say What!? is played with friends online: create a room and invite them.', 'info'),
          'Everyone answers silly prompts, then votes for the funniest answer. Played with friends: create a room and send them the link.');
      }
      function start(body, sel, S) {
        const L = sel.lang === 'vi', P = (window.FUNNY_PROMPTS || {})[L ? 'vi' : 'en'] || { clean: ['???'] };
        const deck = S.rng.shuffle(sel.kind === 'clean' ? P.clean.slice() : P.clean.concat(P.crazy));
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, pts: 0, sweeps: 0, wins: 0 }));
        G = { S, sel, L, me: S.online ? S.me : 0, players, deck, dk: 0, rounds: +sel.rounds === 2 ? 2 : 3, wtime: +sel.wtime || 90, over: false, tok: ++GT.cur, done: {} };
        GT.started = true; GT.over = false;
        body.innerHTML = `<div class="fa-wrap"><div id="fa-stage" class="fa-stage"></div><div id="fa-tags" class="fa-tags"></div></div>`;
        S.track();
        S.onLeft = (a) => { if (!G) return; const q = G.players[a.s]; q.left = true; q.name += T(' (left)', ' (đã rời)'); tags(); };
        S.onCollect = (key, got) => { if (!G || key !== G.ckey) return; G.done = got; tags(); };
        npBar('');
        run().catch((e) => { if (e !== ABORT) throw e; });
      }
      async function W(ms) { const t = G && G.tok; await gSleep(window.__fast ? Math.min(ms, 40) : ms); if (!G || G.tok !== t) throw ABORT; }
      const stage = (h) => { const e = $('fa-stage'); if (e) e.innerHTML = h; };
      const nextPrompt = () => G.deck[(G.dk++) % G.deck.length];
      function tags(extra) {
        const el = $('fa-tags'); if (!el) return;
        el.innerHTML = G.players.map((q) => `<div id="fa-seat-${q.seat}" class="tg-seat">${nameTag({ av: q.av, name: q.seat === G.me ? T('You', 'Bạn') : q.name, sub: `${q.pts.toLocaleString('en-US')} ${T('pts', 'điểm')}`, me: q.seat === G.me, badge: G.ckey && G.done[q.seat] ? '✓' : (extra && extra[q.seat]) || undefined })}</div>`).join('');
      }
      // a countdown in the corner of the stage
      function countdown(secs, id) {
        const t0 = Date.now(), tok = G.tok;
        const iv = gInterval(() => { const e = $(id); if (!G || G.tok !== tok || !e) return gClearInt(iv); const left = Math.max(0, secs - (Date.now() - t0) / 1000); e.textContent = Math.floor(left / 60) + ':' + String(Math.ceil(left % 60) === 60 ? 0 : Math.ceil(left) % 60).padStart(2, '0'); e.classList.toggle('low', left <= 10); }, 250);
        return t0;
      }

      async function run() {
        for (let r = 1; r < G.rounds; r++) { await pairRound(r); await standings(T(`AFTER ROUND ${r}`, `SAU VÒNG ${r}`)); }
        await finalRound();
        finish();
      }
      // ---------- rounds with pairs ----------
      async function pairRound(r) {
        const S = G.S, n = G.players.length, t = G.tok;
        // prompt j goes to players j and j+1: everyone gets two prompts, every prompt has two writers
        const prompts = G.players.map((_, j) => ({ text: nextPrompt(), by: [j, (j + 1) % n] }));
        const mineIdx = (seat) => prompts.map((p, j) => (p.by.includes(seat) ? j : -1)).filter((j) => j >= 0);
        stage(`<div class="fa-banner pix">${T('ROUND', 'VÒNG')} ${r}${r > 1 ? ` · ×${r} ${T('POINTS', 'ĐIỂM')}` : ''}</div><div class="fa-sub">${T('Write a funny answer for each prompt. Two players get the same prompt, and everyone else votes!', 'Viết câu trả lời thật hài cho mỗi đề. Hai người cùng một đề, những người còn lại bình chọn!')}</div>`);
        await W(2600);
        const me = G.players[G.me], my = mineIdx(me.seat), key = 'w' + r;
        G.ckey = key; G.done = {}; tags();
        stage(`<div class="fa-step pix">${T('WRITE YOUR ANSWERS', 'VIẾT CÂU TRẢ LỜI')} · <span id="fa-cd" class="fa-cd"></span></div>
          ${my.map((j, k) => `<div class="fa-p">${esc(prompts[j].text)}</div><div class="fa-in"><input id="fa-a${k}" maxlength="80" autocomplete="off" placeholder="${T('Type something funny...', 'Gõ gì đó thật hài...')}"><small id="fa-c${k}">0 / 80</small></div>`).join('')}
          <button id="fa-send" class="btn-game btn-amber py-3 px-8">${T('SEND ANSWERS', 'GỬI CÂU TRẢ LỜI')}</button>
          <div class="fa-sub">${T('Names stay hidden while people vote.', 'Tên được giấu khi mọi người bình chọn.')}</div>`);
        countdown(G.wtime, 'fa-cd');
        let sent = false;
        const send = () => { if (sent || !G || G.tok !== t) return; sent = true; const a = my.map((_, k) => clean(($('fa-a' + k) || {}).value)); S.act({ t: 'ans', key, s: me.seat, a });
          stage(`<div class="fa-step pix">${T('ANSWERS SENT!', 'ĐÃ GỬI!')}</div><div class="fa-sub">${T('Waiting for the others to finish writing...', 'Đang chờ mọi người viết xong...')}</div>`); };
        my.forEach((_, k) => { const i = $('fa-a' + k); if (!i) return; i.oninput = () => { const c = $('fa-c' + k); if (c) c.textContent = i.value.length + ' / 80'; }; i.onkeydown = (e) => { if (e.key === 'Enter') { const nx = $('fa-a' + (k + 1)); if (nx) nx.focus(); else send(); } }; });
        $('fa-send').onclick = send;
        const f = $('fa-a0'); if (f && !('ontouchstart' in window)) f.focus();
        // send whatever was typed a moment before the time is up
        const auto = gTimeout(send, Math.max(1000, G.wtime * 1000 - 900));
        const got = await S.collect(key, G.players.map((p) => p.seat), () => ({ t: 'ans', a: [] }), () => ({ t: 'ans', a: [] }), G.wtime + 2);
        if (!G || G.tok !== t) throw ABORT;
        gClear(auto); G.ckey = null; tags();
        // put each answer on its prompt
        prompts.forEach((p, j) => { p.ans = p.by.map((seat) => { const k = mineIdx(seat).indexOf(j); return clean(((got[seat] || {}).a || [])[k]); }); });
        for (let j = 0; j < prompts.length; j++) await voteOn(prompts[j], r, j);
      }
      async function voteOn(p, r, j) {
        const S = G.S, t = G.tok, key = `v${r}_${j}`, me = G.players[G.me];
        if (!p.ans[0] && !p.ans[1]) return;
        const order = S.rng.shuffle([0, 1]), voters = G.players.filter((q) => !p.by.includes(q.seat) && !q.left).map((q) => q.seat);
        const mine = p.by.includes(me.seat), canVote = voters.includes(me.seat);
        const card = (k, extra) => { const i = order[k], txt = p.ans[i]; return `<button class="fa-a ${txt ? '' : 'empty'}" data-k="${k}" ${txt && canVote ? '' : 'disabled'}>${txt ? '"' + esc(txt) + '"' : T('(no answer)', '(không trả lời)')}${extra ? extra(i) : ''}</button>`; };
        G.ckey = key; G.done = {}; tags();
        stage(`<div class="fa-step pix">${T('ROUND', 'VÒNG')} ${r} · ${T('PROMPT', 'ĐỀ')} ${j + 1} / ${G.players.length} · <span id="fa-cd" class="fa-cd"></span></div>
          <div class="fa-p">${esc(p.text)}</div><div class="fa-vs">${card(0)}<span class="fa-vsb pix">VS</span>${card(1)}</div>
          <div class="fa-sub" id="fa-vnote">${mine ? T('This is your prompt! Wait while the others vote.', 'Đề của bạn đây! Chờ mọi người bình chọn nhé.') : canVote ? T('Tap the funnier one.', 'Chạm vào câu hài hơn.') : ''}</div>`);
        countdown(20, 'fa-cd');
        let voted = false;
        document.querySelectorAll('#fa-stage .fa-a').forEach((b) => { b.onclick = () => { if (voted || !canVote || !G || G.tok !== t) return; voted = true; b.classList.add('picked'); SFX.play('click'); const n = $('fa-vnote'); if (n) n.textContent = T('Vote in! Waiting for the others...', 'Đã bình chọn! Đang chờ mọi người...'); S.act({ t: 'vote', key, s: me.seat, pick: order[+b.dataset.k] }); }; });
        const got = voters.length ? await S.collect(key, voters, () => ({ t: 'vote', pick: -1 }), () => ({ t: 'vote', pick: -1 }), 20) : {};
        if (!G || G.tok !== t) throw ABORT;
        G.ckey = null;
        // count and score
        const votes = [0, 1].map((i) => voters.filter((v) => (got[v] || {}).pick === i)), cast = votes[0].length + votes[1].length;
        const gain = [0, 0], w = votes[0].length === votes[1].length ? -1 : votes[0].length > votes[1].length ? 0 : 1;
        [0, 1].forEach((i) => { gain[i] = votes[i].length * 100 * r; });
        let sweep = false;
        if (w >= 0) { gain[w] += 100 * r; if (votes[1 - w].length === 0 && voters.length >= 2 && cast === voters.length) { sweep = true; gain[w] += 250 * r; } G.players[p.by[w]].wins++; }
        p.by.forEach((seat, i) => { G.players[seat].pts += gain[i]; });
        if (sweep) G.players[p.by[w]].sweeps++;
        const pc = (i) => (cast ? Math.round(votes[i].length / cast * 100) : 0);
        stage(`<div class="fa-step pix">${T('ROUND', 'VÒNG')} ${r} · ${T('PROMPT', 'ĐỀ')} ${j + 1} / ${G.players.length}</div><div class="fa-p">${esc(p.text)}</div>
          <div class="fa-vs">${[0, 1].map((k) => { const i = order[k], q = G.players[p.by[i]]; return `<div class="fa-a res ${w === i ? 'win' : w >= 0 ? 'lose' : ''}"><span class="fa-pc pix">${pc(i)}%</span>${p.ans[i] ? '"' + esc(p.ans[i]) + '"' : T('(no answer)', '(không trả lời)')}<span class="fa-by">${q.av} ${esc(q.seat === G.me ? T('You', 'Bạn') : q.name)} · +${gain[i]}</span><span class="fa-vts">${votes[i].map((v) => G.players[v].av).join('')}</span></div>`; }).join('<span class="fa-vsb pix">VS</span>')}</div>
          ${sweep ? `<div class="fa-sweep pix">${T('CLEAN SWEEP!', 'THẮNG TUYỆT ĐỐI!')}</div>` : ''}`);
        if (sweep) { SFX.play('win'); funMoment('fa-seat-' + p.by[w], { key: 'sweep' + r + j, icon: '🧹', label: 'SWEEP', burst: T('CLEAN SWEEP!', 'THẮNG TUYỆT ĐỐI!'), sub: `${G.players[p.by[w]].name}: every vote`, mine: p.by[w] === G.me }); }
        else SFX.play(cast ? 'coin' : 'pop');
        tags(Object.fromEntries(p.by.map((seat, i) => [seat, gain[i] ? '+' + gain[i] : undefined])));
        await W(sweep ? 5200 : 4400);
      }
      // ---------- the final round: everyone answers the same prompt, everyone picks gold / silver / bronze ----------
      async function finalRound() {
        const S = G.S, t = G.tok, me = G.players[G.me], text = nextPrompt(), seats = G.players.filter((q) => !q.left).map((q) => q.seat);
        stage(`<div class="fa-banner pix co">${T('FINAL ROUND', 'VÒNG CHUNG KẾT')}</div><div class="fa-sub">${T('Everyone answers the same prompt. Then pick your gold, silver and bronze!', 'Mọi người cùng trả lời một đề. Sau đó chọn vàng, bạc, đồng!')}</div>`);
        await W(2600);
        G.ckey = 'fw'; G.done = {}; tags();
        stage(`<div class="fa-step pix">${T('FINAL ROUND', 'VÒNG CHUNG KẾT')} · <span id="fa-cd" class="fa-cd"></span></div><div class="fa-p">${esc(text)}</div>
          <div class="fa-in"><input id="fa-a0" maxlength="80" autocomplete="off" placeholder="${T('Your funniest answer...', 'Câu trả lời hài nhất của bạn...')}"><small id="fa-c0">0 / 80</small></div>
          <button id="fa-send" class="btn-game btn-amber py-3 px-8">${T('SEND ANSWER', 'GỬI CÂU TRẢ LỜI')}</button>`);
        countdown(G.wtime, 'fa-cd');
        let sent = false;
        const send = () => { if (sent || !G || G.tok !== t) return; sent = true; S.act({ t: 'ans', key: 'fw', s: me.seat, a: [clean(($('fa-a0') || {}).value)] }); stage(`<div class="fa-step pix">${T('ANSWER SENT!', 'ĐÃ GỬI!')}</div><div class="fa-sub">${T('Waiting for the others...', 'Đang chờ mọi người...')}</div>`); };
        const inp = $('fa-a0'); if (inp) { inp.oninput = () => { const c = $('fa-c0'); if (c) c.textContent = inp.value.length + ' / 80'; }; inp.onkeydown = (e) => { if (e.key === 'Enter') send(); }; if (!('ontouchstart' in window)) inp.focus(); }
        $('fa-send').onclick = send;
        const auto = gTimeout(send, Math.max(1000, G.wtime * 1000 - 900));
        const got = await S.collect('fw', seats, () => ({ t: 'ans', a: [] }), () => ({ t: 'ans', a: [] }), G.wtime + 2);
        if (!G || G.tok !== t) throw ABORT;
        gClear(auto); G.ckey = null;
        const list = S.rng.shuffle(seats.map((s) => ({ seat: s, text: clean(((got[s] || {}).a || [])[0]) })).filter((x) => x.text));
        if (!list.length) return;
        // vote: tap up to three favourites in order (not your own)
        const K = Math.min(3, Math.max(1, list.length - 1)), MED = [['GOLD', 'VÀNG', '#F5B041', 300], ['SILVER', 'BẠC', '#C9D6E3', 200], ['BRONZE', 'ĐỒNG', '#D08A4E', 100]];
        G.ckey = 'fv'; G.done = {}; tags();
        const picks = [];
        const draw = () => {
          stage(`<div class="fa-step pix">${T('PICK YOUR FAVOURITES', 'CHỌN CÂU YÊU THÍCH')} · <span id="fa-cd" class="fa-cd"></span></div><div class="fa-p">${esc(text)}</div>
            <div class="fa-grid">${list.map((x, i) => { const m = picks.indexOf(i); return `<button class="fa-a small ${x.seat === me.seat ? 'own' : ''}" data-i="${i}" ${x.seat === me.seat ? 'disabled' : ''}>${m >= 0 ? `<span class="fa-medal pix" style="background:${MED[m][2]}">${T(MED[m][0], MED[m][1])}</span>` : ''}"${esc(x.text)}"${x.seat === me.seat ? `<span class="fa-by">${T('your answer', 'câu của bạn')}</span>` : ''}</button>`; }).join('')}</div>
            <div class="fa-sub">${T(`Tap your ${K === 3 ? 'three favourites' : 'favourites'}: gold first. You can't vote for your own.`, 'Chạm vào câu bạn thích nhất trước (vàng), rồi bạc, rồi đồng. Không được chọn câu của mình.')}</div>
            <button id="fa-vgo" class="btn-game btn-teal py-2.5 px-8" ${picks.length ? '' : 'disabled'}>${T('SEND VOTES', 'GỬI BÌNH CHỌN')}</button>`);
          document.querySelectorAll('#fa-stage .fa-a').forEach((b) => { b.onclick = () => { const i = +b.dataset.i, at = picks.indexOf(i); if (at >= 0) picks.splice(at, 1); else if (picks.length < K) picks.push(i); SFX.play('click'); const keep = $('fa-cd') && $('fa-cd').textContent; draw(); if (keep && $('fa-cd')) $('fa-cd').textContent = keep; }; });
          const g = $('fa-vgo'); if (g) g.onclick = sendVotes;
        };
        let voted = false;
        const sendVotes = () => { if (voted) return; voted = true; S.act({ t: 'votes', key: 'fv', s: me.seat, p: picks.map((i) => list[i].seat) }); stage(`<div class="fa-step pix">${T('VOTES SENT!', 'ĐÃ BÌNH CHỌN!')}</div><div class="fa-sub">${T('Waiting for the others...', 'Đang chờ mọi người...')}</div>`); };
        draw(); countdown(30, 'fa-cd');
        const auto2 = gTimeout(() => { if (picks.length) sendVotes(); }, 29000);
        const vg = await S.collect('fv', seats, () => ({ t: 'votes', p: [] }), () => ({ t: 'votes', p: [] }), 30.5);
        if (!G || G.tok !== t) throw ABORT;
        gClear(auto2); G.ckey = null;
        const score = {}, medals = {};
        seats.forEach((v) => ((vg[v] || {}).p || []).slice(0, 3).forEach((s, m) => { if (s === v || !list.some((x) => x.seat === s)) return; score[s] = (score[s] || 0) + MED[m][3]; (medals[s] = medals[s] || [0, 0, 0])[m]++; }));
        Object.entries(score).forEach(([s, pts]) => { G.players[+s].pts += pts; });
        const ranked = list.slice().sort((a, b) => (score[b.seat] || 0) - (score[a.seat] || 0));
        stage(`<div class="fa-step pix">${T('FINAL ROUND RESULTS', 'KẾT QUẢ CHUNG KẾT')}</div><div class="fa-p">${esc(text)}</div>
          <div class="fa-grid">${ranked.map((x, i) => { const q = G.players[x.seat], m = medals[x.seat] || [0, 0, 0]; return `<div class="fa-a small res ${i === 0 && score[x.seat] ? 'win' : ''}">"${esc(x.text)}"<span class="fa-by">${q.av} ${esc(q.seat === G.me ? T('You', 'Bạn') : q.name)} · +${score[x.seat] || 0}</span><span class="fa-meds">${m.map((c, k) => (c ? `<i style="background:${MED[k][2]}">${c}</i>` : '')).join('')}</span></div>`; }).join('')}</div>`);
        SFX.play('win'); tags(Object.fromEntries(Object.entries(score).map(([s, v]) => [s, '+' + v])));
        await W(7000);
      }
      async function standings(title) {
        const rank = G.players.slice().sort((a, b) => b.pts - a.pts);
        stage(`<div class="fa-step pix">${title}</div><div class="fa-board">${rank.map((q, i) => `<div class="fa-row ${q.seat === G.me ? 'me' : ''}"><b class="pix">${i + 1}</b><span>${q.av}</span><span class="nm">${esc(q.seat === G.me ? T('You', 'Bạn') : q.name)}</span><b>${q.pts.toLocaleString('en-US')}</b></div>`).join('')}</div>`);
        tags(); await W(4500);
      }
      async function finish() {
        G.over = true; G.S.over = true;
        const S = G.S, me = G.players[G.me], tok = G.tok;
        const rank = G.players.slice().sort((a, b) => b.pts - a.pts), place = rank.indexOf(me) + 1, res = place === 1 ? 'win' : 'loss';
        const row = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        const s = gstat('funny'); s.sweeps = (s.sweeps || 0) + me.sweeps; s.duels = (s.duels || 0) + me.wins;
        reportGame('funny', res, { place, xp: 12 + me.wins * 4 + me.sweeps * 6, label: `${G.players.length} players` });
        gameResult({ title: place === 1 ? 'You\'re the funniest!' : `You finished ${place}${['', 'st', 'nd', 'rd'][place] || 'th'}`, sub: rank.map((q, i) => `${i + 1}. ${q.seat === G.me ? 'You' : q.name} ${q.pts.toLocaleString('en-US')}`).join(' · '),
          tone: res === 'win' ? 'amber' : 'coral', sprite: res === 'win' ? 'trophy' : 'anchor',
          rows: [['Your points', me.pts.toLocaleString('en-US'), 'text-amber'], ['Prompts won', me.wins, 'text-emerald'], ['Clean sweeps', me.sweeps, 'text-coral']].concat(row ? [row] : []),
          againLabel: 'Back to setup', again: () => open($('game-root')) });
      }

      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      // tile icon: two speech bubbles, one laughing
      GICONS.funny = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(1, 2, 14, 10, K)}${rr(2, 3, 12, 8, '#F5B041')}${rr(3, 12, 3, 3, K)}${rr(4, 12, 1, 2, '#F5B041')}${rr(4, 5, 2, 2, K)}${rr(10, 5, 2, 2, K)}${rr(5, 8, 6, 2, K)}${rr(6, 8, 4, 1, '#FB7185')}${rr(9, 11, 14, 10, K)}${rr(10, 12, 12, 8, '#F7F4EC')}${rr(18, 21, 3, 3, K)}${rr(19, 20, 1, 2, '#F7F4EC')}${rr(12, 14, 2, 1, K)}${rr(18, 14, 2, 1, K)}${rr(13, 17, 6, 1, K)}${rr(12, 16, 1, 1, K)}${rr(19, 16, 1, 1, K)}</svg>`;
      const mod = {
        id: 'funny', name: 'Say What!?', icon: 'funny', cats: ['party'], sub: '3-8 PLAYERS · ~15 MIN', color: '#F5B041', tone: 'amber', btn: 'amber', flag: 'NEW',
        blurb: 'Answer silly prompts, then vote for the funniest. Two players get the same prompt, and the room decides who wins!',
        rules: { tag: 'PARTY · 3-8 PLAYERS', steps: [
          '<strong class="text-bone">Write:</strong> You get two prompts. Type the funniest answer you can think of. Another player gets the same prompt.',
          '<strong class="text-bone">Vote:</strong> Everyone else sees the two answers side by side (no names) and votes for the funnier one. Every vote is points. Get every vote for a <b class="text-coral">CLEAN SWEEP</b> bonus!',
          '<strong class="text-bone">Final round:</strong> everyone answers the same prompt, then picks a gold, silver and bronze favourite. Most points at the end wins.',
        ], tip: 'Short and surprising beats long and clever. Make the room picture it!' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['PROMPTS WON', s.duels || 0, 'text-emerald'], ['CLEAN SWEEPS', s.sweeps || 0, 'text-coral']],
        engine: { get G() { return G; } }, open, close() { G = null; },
        online: { seats: (sel) => +sel.n || 8, min: 3, bots: false, ranked: false, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
