    /* =========================================================================
       WORD DUEL: Daily Word's head-to-head mode. Everyone guesses the SAME secret five-letter word at the same
       time; you see the others' coloured rows (not their letters). First to solve it wins.
       On this device you race the computer; online it is 2-4 real players.
       ========================================================================= */
    (function wordDuelGame() {
      const KB = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']];
      function score(guess, target) {
        const ev = Array(5).fill('absent'), t = target.split(''), g = guess.split('');
        for (let i = 0; i < 5; i++) if (g[i] === t[i]) { ev[i] = 'correct'; t[i] = null; g[i] = null; }
        for (let i = 0; i < 5; i++) if (g[i] !== null) { const k = t.indexOf(g[i]); if (k >= 0) { ev[i] = 'present'; t[k] = null; } }
        return ev;
      }
      // the computer: always guesses a word that fits everything it has seen so far
      function botGuess(rows) {
        const ok = WORD_DICT.filter((w) => rows.every((r) => score(r.w, w).join() === r.ev.join()));
        return pick(ok.length ? ok : WORD_DICT);
      }
      let G = null;
      const $ = (id) => document.getElementById(id);
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1000px] mx-auto');
        setupScreen(body, mod, [
          { key: 'lvl', label: 'COMPUTER SPEED', def: 9, local: true, choices: [[14, 'Relaxed'], [9, 'Normal'], [6, 'Quick']], hint: 'How many seconds the computer takes for each guess.' },
          { key: 'hard', label: 'Hard mode', toggle: true, def: 0, hint: 'Letters you have found must be used in every next guess.', choices: [[0, 'Off'], [1, 'On']] },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }, { bot: true, name: 'Word Bot', avatar: '🤖' }], sel)));
      }
      function start(body, sel, S) {
        const target = S.rng.pick(WORD_DICT);
        G = { S, me: S.online ? S.me : 0, target, hard: !!+sel.hard, speed: +sel.lvl || 9, cur: '', tok: ++GT.cur, over: false, done: false, keys: {},
          ps: S.seats.map((x) => ({ name: x.name, av: x.avatar, rows: [], solved: false, out: false, left: false })), order: [] };
        body.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
          <div class="space-y-3 w-full mx-auto" style="max-width:340px"><div id="wd-msg" class="text-center text-sm min-h-[20px] text-muted">Same secret word for everyone. First to find it wins!</div>
            <div id="wd-board" class="grid grid-rows-6 gap-2"></div><div id="wd-kb" class="space-y-1.5 pt-2"></div></div>
          <div class="space-y-3"><div class="win overflow-hidden"><div class="winbar emerald"><span>WORD DUEL</span><span class="pix text-xs">${S.n} PLAYERS</span></div><div id="wd-opp" class="p-3 space-y-3"></div></div>
            <button id="wd-quit" class="btn-game btn-coral w-full py-2 text-sm">${S.online ? 'Leave duel' : 'Give up'}</button></div></div>`;
        $('wd-quit').onclick = () => { if (S.online) return npConfirmLeave(() => open($('game-root'))); if (!G.over) S.act({ t: 'giveup', s: 0 }); };
        gOn(document, 'keydown', (e) => { if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key === 'Enter' ? 'ENTER' : e.key === 'Backspace' ? '⌫' : /^[a-z]$/i.test(e.key) ? e.key.toUpperCase() : null; if (k) { e.preventDefault(); press(k); } });
        S.on(apply, drive);
        paint(); npBar('');
      }
      function press(k) {
        if (!G || G.over || G.done || G.wait) return;
        if (k === '⌫') G.cur = G.cur.slice(0, -1);
        else if (k === 'ENTER') return submit();
        else if (G.cur.length < 5) G.cur += k;
        paint();
      }
      function submit() {
        const w = G.cur;
        if (w.length < 5) return say('Five letters, please.', 'text-coral');
        if (!WORD_SET.has(w)) { SFX.play('wrong'); return say(`"${w}" is not in the word list.`, 'text-coral'); }
        if (G.hard) {
          for (const r of G.ps[G.me].rows) for (let i = 0; i < 5; i++) {
            if (r.ev[i] === 'correct' && w[i] !== r.w[i]) return say(`Hard mode: ${r.w[i]} must be letter ${i + 1}.`, 'text-coral');
            if (r.ev[i] === 'present' && !w.includes(r.w[i])) return say(`Hard mode: your guess must use ${r.w[i]}.`, 'text-coral');
          }
        }
        G.wait = true;
        G.S.act({ t: 'guess', s: G.me, w });
      }
      const say = (t, cls) => { const m = $('wd-msg'); if (m) { m.textContent = t; m.className = `text-center text-sm min-h-[20px] ${cls || 'text-muted'}`; } };
      // every guess, from everyone, in the same order on every screen
      function apply(a) {
        if (!G || G.over) return 0;
        const p = G.ps[a.s];
        if (a.t === 'guess' && p && !p.solved && !p.out && typeof a.w === 'string' && a.w.length === 5 && WORD_SET.has(a.w.toUpperCase())) {
          const w = a.w.toUpperCase(), ev = score(w, G.target);
          p.rows.push({ w, ev });
          if (a.s === G.me) { G.cur = ''; G.wait = false; ev.forEach((e, i) => { const k = w[i], old = G.keys[k]; if (e === 'correct' || (e === 'present' && old !== 'correct') || (!old)) G.keys[k] = e; }); SFX.play('reveal'); }
          if (ev.every((e) => e === 'correct')) { p.solved = true; G.order.push(a.s); if (a.s === G.me) say(`Solved in ${p.rows.length}!`, 'text-emerald font-bold'); }
          else if (p.rows.length >= 6) { p.out = true; if (a.s === G.me) say(`Out of guesses. The others are still going...`, 'text-coral'); }
        } else if (a.s === G.me) G.wait = false;
        if ((a.t === 'giveup' || a.t === '_left' || a.t === '_gone') && p) { p.out = true; p.left = a.t !== 'giveup'; }
        paint();
        const me = G.ps[G.me];
        if (G.order.length || G.ps.every((x) => x.solved || x.out) || (me.out && !G.S.online)) end();
        return 0;
      }
      // the host plays for computer seats
      function drive() {
        if (!G || G.over) return;
        G.ps.forEach((p, i) => {
          if (!G.S.bot(i) || p.solved || p.out || G.botBusy) return;
          G.botBusy = true;
          gTimeout(() => { G.botBusy = false; if (G && !G.over && G.S.isHost) G.S.act({ t: 'guess', s: i, w: botGuess(p.rows) }); }, (G.speed + Math.random() * 3) * 1000);
        });
      }
      function paint() {
        const me = G.ps[G.me];
        $('wd-board').innerHTML = Array.from({ length: 6 }, (_, r) => {
          const row = me.rows[r], typing = !row && r === me.rows.length && !me.solved && !me.out;
          return `<div class="grid grid-cols-5 gap-2">${Array.from({ length: 5 }, (_, c) => {
            if (row) return `<div class="tile tile-${row.ev[c]}">${row.w[c]}</div>`;
            const ch = typing ? G.cur[c] || '' : '';
            return `<div class="tile ${ch ? 'tile-typed' : 'tile-empty'}">${ch}</div>`;
          }).join('')}</div>`;
        }).join('');
        $('wd-kb').innerHTML = KB.map((row) => `<div class="flex gap-1.5 justify-center">${row.map((k) => `<button class="key ${k.length > 1 ? 'px-3 text-xs' : 'w-9 text-sm'} ${G.keys[k] ? 'key-' + G.keys[k] : ''}" data-k="${k}">${k}</button>`).join('')}</div>`).join('');
        $('wd-kb').querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => press(b.dataset.k); });
        $('wd-opp').innerHTML = G.ps.map((p, i) => i === G.me ? '' : `<div><div class="flex items-center justify-between text-sm font-bold"><span class="truncate">${esc(p.av)} ${esc(p.name)}</span><span class="pix text-xs ${p.solved ? 'text-emerald' : p.out ? 'text-coral' : 'text-muted'}">${p.solved ? 'SOLVED' : p.left ? 'LEFT' : p.out ? 'OUT' : p.rows.length + '/6'}</span></div>
          <div class="grid gap-1 mt-1" style="grid-template-rows:repeat(6,10px)">${Array.from({ length: 6 }, (_, r) => `<div class="grid grid-cols-5 gap-1">${Array.from({ length: 5 }, (_, c) => { const e = p.rows[r] && p.rows[r].ev[c]; return `<span style="height:10px;border:2px solid #050E18;background:${e === 'correct' ? '#34D399' : e === 'present' ? '#F5B041' : e === 'absent' ? '#2A4466' : '#0A1624'}"></span>`; }).join('')}</div>`).join('')}</div></div>`).join('');
      }
      function end() {
        if (G.over) return; G.over = true; G.S.over = true;
        const first = G.order[0], won = first === G.me, me = G.ps[G.me];
        const res = first === undefined ? 'draw' : won ? 'win' : 'loss';
        const s = gstat('wordduel'); if (won) s.fastest = Math.min(s.fastest || 9, me.rows.length);
        reportGame('wordduel', res, { elo: G.S.online ? 0 : { win: 6, loss: -3, draw: 0 }[res], xp: won ? 25 : 8, label: `${G.S.online ? 'Online' : 'vs Word Bot'} · ${G.target}` });
        SFX.play(won ? 'win' : res === 'draw' ? 'pop' : 'lose');
        const winner = first !== undefined ? G.ps[first] : null;
        gTimeout(() => gameResult({ title: won ? 'You won the duel!' : winner ? `${winner.name} found it first` : 'Nobody found it', sub: `The word was ${G.target}.`, tone: won ? 'amber' : 'coral', sprite: won ? 'trophy' : 'anchor',
          rows: G.ps.map((p, i) => [p.name, p.solved ? `${p.rows.length} guess${p.rows.length > 1 ? 'es' : ''}` : p.left ? 'Left' : 'Not solved', i === G.me ? 'text-amber' : 'text-bone']), againLabel: G.S.online ? 'Back to setup' : 'Play again', again: () => open($('game-root')) }), 900);
      }
      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      GICONS.wordduel = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(1, 3, 10, 10, K)}${rr(2, 4, 8, 8, '#34D399')}${rr(13, 3, 10, 10, K)}${rr(14, 4, 8, 8, '#F5B041')}${rr(1, 14, 10, 7, K)}${rr(2, 15, 8, 5, '#2A4466')}${rr(13, 14, 10, 7, K)}${rr(14, 15, 8, 5, '#34D399')}${rr(5, 6, 2, 4, K)}${rr(17, 6, 2, 4, K)}</svg>`;
      const mod = {
        id: 'wordduel', name: 'Word Duel', icon: 'wordduel', cats: ['word'], sub: '2-4 PLAYERS · ~3 MIN', color: '#34D399', tone: 'emerald', btn: 'emerald',
        blurb: 'Daily Word, head to head: everyone guesses the same secret word at once. You see their colours, not their letters. First to find it wins.',
        rules: { tag: 'WORD RACE', steps: [
          '<strong class="text-bone">Same word:</strong> Everyone in the duel is guessing the same five-letter word, each on their own board, at the same time.',
          '<strong class="text-bone">Colours:</strong> <b class="text-emerald">Green</b> is the right letter in the right spot, <b class="text-amber">amber</b> is in the word somewhere else. You can see your rivals’ colours, but not their letters.',
          '<strong class="text-bone">Win:</strong> The first player to find the word wins. Six guesses each.',
        ], tip: 'Watch your rivals’ rows: lots of green means you need to hurry!' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['DUELS', s.played, 'text-bone'], ['WIN RATE', pct(s.wins, s.played) + '%', 'text-emerald'], ['FASTEST', s.fastest ? s.fastest + ' guesses' : '-', 'text-teal']],
        engine: { score, botGuess }, open, close() { G = null; },
        online: { seats: () => 4, min: 2, bots: false, ranked: false, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
