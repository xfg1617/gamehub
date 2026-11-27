    /* =========================================================================
       TRIVIA RUSH — Nov 2026, Inna's list. Everyone gets the same question at the same time; four answers; faster right
       answers score more (20-100 points, like Doodle Guess), 3 right in a row = a 🔥 streak bonus. 12 categories, easy to hard,
       questions in English or Vietnamese (room setting). Questions: trivia_q1-3.js (window.TRIVIA_Q).
       Solo, or 2-8 players (computer players answer right more or less often by level). Netplay script style:
       everyone answers at once through S.collect.
       ========================================================================= */
    (function triviaGame() {
      const ABORT = { a: 1 };
      const CATS = {
        geo: ['Geography', 'Địa lý', '#2DD4BF'], film: ['Movies & TV', 'Phim ảnh', '#FB7185'], music: ['Music', 'Âm nhạc', '#F5B041'], sport: ['Sports', 'Thể thao', '#34D399'],
        sci: ['Science', 'Khoa học', '#7DD3FC'], hist: ['History', 'Lịch sử', '#E9C46A'], food: ['Food', 'Ẩm thực', '#F4A261'], animal: ['Animals', 'Động vật', '#A3E635'],
        games: ['Games', 'Trò chơi', '#9DB4CC'], vn: ['Vietnam', 'Việt Nam', '#FB7185'], usa: ['USA', 'Nước Mỹ', '#7DD3FC'], weird: ['Weird Facts', 'Chuyện lạ', '#F5B041'],
      };
      const LEVEL = ['', 'EASY', 'MEDIUM', 'HARD'], LEVEL_VI = ['', 'DỄ', 'VỪA', 'KHÓ'];
      const COL = ['#2DD4BF', '#F5B041', '#FB7185', '#34D399'];
      const BOTS = [['Luna', '🦉'], ['Bao', '🐻'], ['Minh', '🐸'], ['Kai', '🦈'], ['Mai', '🐼'], ['Leo', '🦁'], ['Ivy', '🐙']];

      // pixel icons for the categories (12×12)
      const px = (rows, pal) => { let r = ''; rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[ch]}"/>`; })); return `<svg viewBox="0 0 12 12" shape-rendering="crispEdges">${r}</svg>`; };
      const k = '#050E18';
      const ICON = {
        geo: px(['...kkkkkk...', '..kbbggbbk..', '.kbggggbbbk.', 'kbbgggbbbbbk', 'kbbbggbbggbk', 'kbbbbbbgggbk', 'kbbbbbggggbk', 'kbggbbbgggbk', 'kbgggbbbgbbk', '.kbgggbbbbk.', '..kbbgbbbk..', '...kkkkkk...'], { k, b: '#3E8EDE', g: '#34D399' }),
        film: px(['kkkkkkkkkkkk', 'kwkkwkkwkkwk', 'kkkkkkkkkkkk', 'kddddddddddk', 'kdwwwwwwwwdk', 'kdwwwwwwwwdk', 'kdwwwwwwwwdk', 'kddddddddddk', 'kkkkkkkkkkkk', 'kwkkwkkwkkwk', 'kkkkkkkkkkkk', '............'], { k, w: '#F7F4EC', d: '#27496B' }),
        music: px(['......kk....', '......kyk...', '......kyyk..', '......kykyk.', '......kk.kk.', '......kk....', '......kk....', '..kkkkkk....', '.kyyyyyk....', 'kyyyyyyk....', '.kyyyyk.....', '..kkkk......'], { k, y: '#F7F4EC' }),
        sport: px(['...kkkkkk...', '..kwwwwwwk..', '.kwwwkkwwwk.', 'kwwwkkkkwwwk', 'kwwwkkkkwwwk', 'kkwwwkkwwwkk', 'kkkwwwwwwkkk', 'kwwwwwwwwwwk', 'kwwkkwwkkwwk', '.kwkkwwkkwk.', '..kwwwwwwk..', '...kkkkkk...'], { k, w: '#F7F4EC' }),
        sci: px(['...kkkkkk...', '....kwwk....', '....kwwk....', '....kwwk....', '...kwwwwk...', '..kwwwwwwk..', '.kggggggggk.', 'kggwgggggggk', 'kgggggggwggk', 'kggggggggggk', '.kkkkkkkkkk.', '............'], { k, w: '#C9D6E3', g: '#34D399' }),
        hist: px(['.....kk.....', '...kkwwkk...', '.kkwwwwwwkk.', 'kkkkkkkkkkkk', '.kwk.kwk.kwk', '.kwk.kwk.kwk', '.kwk.kwk.kwk', '.kwk.kwk.kwk', 'kkkkkkkkkkkk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk', '............'], { k, w: '#F7F4EC' }),
        food: px(['........k...', '.......k..k.', '......k..k..', '..yyyyyykyy.', '.yyywyyyyyyy', 'kkkkkkkkkkkk', 'kcccccccccck', '.kccwcccccck', '..kccccccck.', '...kkkkkkk..', '............', '............'], { k, y: '#F5D06B', w: '#F7F4EC', c: '#FB7185' }),
        animal: px(['..kk....kk..', '.kppk..kppk.', '.kppk..kppk.', '..kk....kk..', 'kk...kk...kk', 'kpk.kppk.kpk', 'kk.kppppk.kk', '...kppppk...', '..kppppppk..', '..kppppppk..', '...kkkkkk...', '............'], { k, p: '#D08A4E' }),
        games: px(['............', '..kkkkkkkk..', '.kggggggggk.', 'kggkggggrggk', 'kgkkkggrgrgk', 'kggkggggrggk', 'kggggggggggk', 'kgggkkkkgggk', '.kkk....kkk.', '............', '............', '............'], { k, g: '#F7F4EC', r: '#FB7185' }),
        vn: px(['kkkkkkkkkkkk', 'krrrrrrrrrrk', 'krrrrryrrrrk', 'krrrryyyrrrk', 'krryyyyyyyrk', 'krrryyyyyrrk', 'krrryyryyrrk', 'krryrrrrryrk', 'krrrrrrrrrrk', 'kkkkkkkkkkkk', '............', '............'], { k, r: '#DA251D', y: '#FFDD00' }),
        usa: px(['kkkkkkkkkkkk', 'kbbbbbrrrrrk', 'kbwbwbwwwwwk', 'kbbbbbrrrrrk', 'kbwbwbwwwwwk', 'kbbbbbrrrrrk', 'kwwwwwwwwwwk', 'krrrrrrrrrrk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk', '............', '............'], { k, b: '#2B4C9B', r: '#C8323C', w: '#F7F4EC' }),
        weird: px(['...kkkkkk...', '..kyyyyyyk..', '.kyyywwyyyk.', '.kyywyyyyyk.', '.kyyyyyyyyk.', '..kyyyyyyk..', '...kyyyyk...', '...kkkkkk...', '...kddddk...', '...kkkkkk...', '....kddk....', '.....kk.....'], { k, y: '#F5D06B', w: '#F7F4EC', d: '#9DB4CC' }),
      };
      const vi = (sel) => sel.lang === 'vi';
      // the questions this game can use (shared dice: every screen gets the same list, the same answer order)
      function pool(sel) {
        const all = (window.TRIVIA_Q || []).filter((q) => (sel.cat === 'mix' || !sel.cat || q[0] === sel.cat) && (sel.diff === 'easy' ? q[1] === 1 : sel.diff === 'hard' ? q[1] >= 2 : true));
        return all.length >= 5 ? all : (window.TRIVIA_Q || []);
      }
      function build(sel, rng, n) {
        const p = rng.shuffle(pool(sel)).slice(0, n), L = vi(sel);
        return p.map((q) => {
          const en = q[3].split('|'), vs = q[5] ? q[5].split('|') : en;
          const order = rng.shuffle([0, 1, 2, 3]);
          return { cat: q[0], lvl: q[1], text: L ? q[4] : q[2], answers: order.map((i) => (L ? vs[i] : en[i])), right: order.indexOf(0) };
        });
      }
      // how often a computer player gets it right
      const botRight = (lvl, qlvl) => [0, 0.42, 0.68, 0.86][lvl] - (qlvl - 1) * 0.1;

      let G = null;
      const $ = (id) => document.getElementById(id);
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1100px] mx-auto');
        const def = typeof LANG !== 'undefined' && LANG.code === 'vi' ? 'vi' : 'en';
        setupScreen(body, mod, [
          { key: 'lang', label: 'QUESTIONS IN', def, hero: true, hint: 'Everyone at the table gets the questions in this language.', choices: [['en', '🇺🇸 English'], ['vi', '🇻🇳 Tiếng Việt']] },
          { key: 'cat', label: 'CATEGORY', def: 'mix', choices: [['mix', 'All mixed']].concat(Object.entries(CATS).map(([id, c]) => [id, c[0]])) },
          { key: 'qn', label: 'QUESTIONS', def: 15, choices: [[10, '10'], [15, '15'], [20, '20']] },
          { key: 'secs', label: 'TIME TO ANSWER', def: 15, choices: [[10, '10 sec'], [15, '15 sec'], [20, '20 sec']] },
          { key: 'diff', label: 'DIFFICULTY', def: 'mix', choices: [['mix', 'Mixed'], ['easy', 'Easy'], ['hard', 'Hard']] },
          { key: 'n', label: 'PLAYERS', def: 4, choices: [[1, 'Just me'], [2, '2'], [3, '3'], [4, '4'], [6, '6'], [8, '8']] },
          { key: 'lvl', label: 'COMPUTER LEVEL', def: 2, local: true, choices: [[1, 'Easy'], [2, 'Smart'], [3, 'Genius']] },
        ], (sel) => {
          const n = sel.net === 'here' ? 1 : Math.max(1, +sel.n || 1);
          start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(BOTS.slice(0, n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel));
        });
      }
      function start(body, sel, S) {
        const n = Math.min(+sel.qn || 15, 30);
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, pts: 0, right: 0, streak: 0, best: 0 }));
        G = { S, sel, me: S.online ? S.me : 0, players, qs: build(sel, S.rng, n), qi: -1, secs: +sel.secs || 15, lvl: +sel.lvl || 2, over: false, tok: ++GT.cur, L: vi(sel) };
        GT.started = true; GT.over = false;
        body.innerHTML = `<div class="tv-wrap"><div class="tv-col">
          <div class="tv-top"><span id="tv-cat" class="tv-cat"></span><span id="tv-num" class="tv-num pix"></span></div>
          <div id="tv-q" class="tv-q"></div>
          <div class="tv-time" id="tv-time"><b id="tv-sec"></b><div class="tb"><i id="tv-bar"></i></div></div>
          <div id="tv-ans" class="tv-ans"></div>
          <div id="tv-note" class="tv-note"></div>
          <div id="tv-scores" class="tv-scores"></div></div>
          </div>`;
        S.track();
        S.onLeft = (a) => { if (!G) return; const q = G.players[a.s]; q.name += ' (CPU)'; q.av = '🤖'; scores(); };
        S.onCollect = (key, got) => { if (!G || key !== 'q' + G.qi) return; G.got = got; scores(); };
        npBar('');
        run().catch((e) => { if (e !== ABORT) throw e; });
      }
      async function W(ms) { const t = G && G.tok; await gSleep(window.__fast ? Math.min(ms, 30) : ms); if (!G || G.tok !== t) throw ABORT; }
      const T = (en, v) => (typeof LANG !== 'undefined' && LANG.code === 'vi' ? v : en);   // the player's own language for buttons and messages
      function scores() {
        const el = $('tv-scores'); if (!el) return;
        const rank = G.players.slice().sort((a, b) => b.pts - a.pts);
        el.innerHTML = rank.map((q) => {
          const done = G.got && q.seat in G.got && !G.reveal, rv = G.reveal && G.reveal[q.seat];
          return `<div id="tv-seat-${q.seat}" class="tg-seat">${nameTag({ av: q.av, name: q.seat === G.me ? T('You', 'Bạn') : q.name, sub: `${q.pts.toLocaleString('en-US')} ${T('pts', 'điểm')}${q.streak >= 3 ? ' 🔥' + q.streak : ''}`, me: q.seat === G.me, badge: done ? '✓' : rv && rv.got ? '+' + rv.got : undefined })}</div>`;
        }).join('');
      }
      async function run() {
        for (G.qi = 0; G.qi < G.qs.length; G.qi++) { await ask(G.qs[G.qi]); if (!G || G.over) return; }
        finish();
      }
      async function ask(q) {
        const S = G.S, t = G.tok, key = 'q' + G.qi, me = G.players[G.me];
        G.got = {}; G.reveal = null; G.mine = null;
        const c = CATS[q.cat] || CATS.weird;
        $('tv-cat').innerHTML = `<span class="ico">${ICON[q.cat] || ''}</span>${(G.L ? c[1] : c[0]).toUpperCase()} · ${(G.L ? LEVEL_VI : LEVEL)[q.lvl]}`;
        $('tv-cat').style.background = c[2];
        $('tv-num').textContent = `${T('Q', 'CÂU')} ${G.qi + 1} / ${G.qs.length}`;
        $('tv-q').textContent = q.text; $('tv-note').innerHTML = '';
        $('tv-time').style.visibility = 'visible';
        const t0 = Date.now();
        $('tv-ans').innerHTML = q.answers.map((a, i) => `<button class="tv-a" data-i="${i}" style="background:${COL[i]}"><span class="k">${'ABCD'[i]}</span><span class="tx">${esc(a)}</span><span class="who"></span></button>`).join('');
        // you can change your answer until the question closes (Inna, Nov 2026): tap another one
        G.open = true;
        const answer = (i) => {
          if (!G.open || G.mine === i || !S.mine(me.seat) || G.qi < 0) return;
          G.mine = i; SFX.play('click');
          $('tv-ans').querySelectorAll('.tv-a').forEach((b) => b.classList.toggle('picked', +b.dataset.i === i));
          $('tv-note').innerHTML = `<span class="text-muted">${T(`You picked <b class="text-bone">${'ABCD'[i]}</b>. Changed your mind? Tap another answer before time's up.`, `Bạn chọn <b class="text-bone">${'ABCD'[i]}</b>. Đổi ý? Chạm đáp án khác trước khi hết giờ.`)}</span>`;
          S.act({ t: 'ans', key, s: me.seat, i, ms: Date.now() - t0 });
        };
        $('tv-ans').querySelectorAll('.tv-a').forEach((b) => { b.onclick = () => answer(+b.dataset.i); });
        G.keys = (e) => { const i = 'abcd1234'.indexOf(e.key.toLowerCase()) % 4; if (i >= 0 && 'abcd1234'.includes(e.key.toLowerCase())) answer(i); };
        // the countdown
        const tick = gInterval(() => {
          if (!G || G.tok !== t) return;
          const left = Math.max(0, G.secs - (Date.now() - t0) / 1000);
          const s = $('tv-sec'), bar = $('tv-bar'); if (s) s.textContent = Math.ceil(left); if (bar) { bar.style.width = (left / G.secs * 100) + '%'; bar.classList.toggle('low', left <= 3); }
          if (left <= 3 && left > 0 && G.mine === null && Math.ceil(left) !== G.lastTick) { G.lastTick = Math.ceil(left); SFX.play('tick'); }
        }, 100);
        scores();
        const seats = G.players.map((p) => p.seat);
        const got = await S.collect(key, seats, (s) => {
          const right = Math.random() < botRight(S.online ? (+(S.sel && S.sel.lvl) || 2) : G.lvl, q.lvl);
          const wrong = [0, 1, 2, 3].filter((x) => x !== q.right);
          return { t: 'ans', i: right ? q.right : wrong[Math.floor(Math.random() * 3)], ms: 1800 + Math.floor(Math.random() * (G.secs * 700)) };
        }, () => ({ t: 'ans', i: -1, ms: G.secs * 1000 }), G.secs + 0.3, { change: window.__fast && !S.online ? 60 : 2500 });
        G.open = false;
        if (!G || G.tok !== t) throw ABORT;
        gClearInt(tick); G.keys = null;
        // score it: a right answer = 20-100 by speed; 3+ in a row = +10 per extra
        G.reveal = {};
        G.players.forEach((p) => {
          const a = got[p.seat] || { i: -1, ms: G.secs * 1000 };
          let pts = 0;
          if (a.i === q.right) {
            p.right++; p.streak++; p.best = Math.max(p.best, p.streak);
            pts = Math.round(20 + 80 * Math.max(0, 1 - (a.ms || 0) / (G.secs * 1000))) + (p.streak >= 3 ? 10 * (p.streak - 2) : 0);   // like Doodle Guess: 20-100, faster = more
            if (p.streak === 5) funMoment('tv-seat-' + p.seat, { key: 'streak5', icon: '🔥', label: 'x5', fire: true, burst: 'ON FIRE!', sub: `${p.name} got 5 right in a row`, mine: p.seat === G.me });
          } else p.streak = 0;
          p.pts += pts; G.reveal[p.seat] = { i: a.i, got: pts };
        });
        // show the right answer and who picked what
        $('tv-time').style.visibility = 'hidden';
        $('tv-ans').querySelectorAll('.tv-a').forEach((b) => {
          const i = +b.dataset.i; b.disabled = true; b.classList.add(i === q.right ? 'ok' : 'no');
          b.querySelector('.who').innerHTML = G.players.filter((p) => G.reveal[p.seat].i === i).map((p) => `<i title="${esc(p.name)}">${p.av}</i>`).join('');
          if (i === q.right) b.insertAdjacentHTML('beforeend', '<span class="tick">✓</span>');
        });
        const mine = G.reveal[me.seat];
        if (mine.got) { SFX.play('coin'); $('tv-note').innerHTML = `<b class="text-emerald">${T('Right!', 'Chính xác!')} +${mine.got}</b>${me.streak >= 3 ? ` <span class="text-amber">🔥 ${me.streak} ${T('in a row', 'câu liên tiếp')}</span>` : ''}`; }
        else { SFX.play('wrong'); $('tv-note').innerHTML = `<b class="text-coral">${mine.i < 0 ? T("Time's up!", 'Hết giờ!') : T('Not quite!', 'Sai rồi!')}</b> <span class="text-muted">${T('The answer was', 'Đáp án là')} <b class="text-bone">${esc(q.answers[q.right])}</b>.</span>`; }
        scores();
        await W(3400);
      }
      async function finish() {
        G.over = true; G.S.over = true;
        const S = G.S, me = G.players[G.me], tok = G.tok;
        const rank = G.players.slice().sort((a, b) => b.pts - a.pts), place = rank.indexOf(me) + 1, solo = G.players.length === 1;
        const res = solo ? (me.right >= G.qs.length * 0.6 ? 'win' : 'loss') : place === 1 ? 'win' : 'loss';
        const row = S.online ? await S.finish(res) : null;
        if (!G || G.tok !== tok) return;
        const s = gstat('trivia'); s.right = (s.right || 0) + me.right; s.asked = (s.asked || 0) + G.qs.length; s.bestStreak = Math.max(s.bestStreak || 0, me.best); s.bestScore = Math.max(s.bestScore || 0, me.pts);
        reportGame('trivia', res, { place: solo ? undefined : place, solo, xp: 10 + me.right * 2, label: `${me.right}/${G.qs.length} right` });
        gameResult({ title: solo ? `${me.right} / ${G.qs.length} right!` : place === 1 ? 'You win!' : `You finished ${place}${['', 'st', 'nd', 'rd'][place] || 'th'}`,
          sub: solo ? `${me.pts.toLocaleString('en-US')} points` : rank.map((q, i) => `${i + 1}. ${q.seat === G.me ? 'You' : q.name} ${q.pts.toLocaleString('en-US')}`).join(' · '),
          tone: res === 'win' ? 'amber' : 'coral', sprite: res === 'win' ? 'trophy' : 'anchor',
          rows: [['Right answers', `${me.right} / ${G.qs.length}`, 'text-emerald'], ['Score', me.pts.toLocaleString('en-US'), 'text-amber'], ['Best streak', me.best, 'text-coral']].concat(row ? [row] : []),
          againLabel: S.online ? 'Back to setup' : 'Play again', again: () => open($('game-root')) });
      }
      document.addEventListener('keydown', (e) => { if (G && G.keys && !/INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) G.keys(e); });

      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      // tile icon: four answer blocks and a big question mark
      const QM = ['.KKKKKK.', 'KKwwwwKK', 'KwwKKwwK', 'KKKKKwwK', '...KwwKK', '..KwwKK.', '..KwwK..', '..KKKK..', '..KwwK..', '..KKKK..'];
      GICONS.trivia = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(1, 1, 22, 22, K)}${rr(2, 2, 9, 9, '#2DD4BF')}${rr(13, 2, 9, 9, '#F5B041')}${rr(2, 13, 9, 9, '#FB7185')}${rr(13, 13, 9, 9, '#34D399')}${QM.map((row, y) => [...row].map((c, x) => (c === 'K' ? rr(8 + x, 7 + y, 1, 1, K) : c === 'w' ? rr(8 + x, 7 + y, 1, 1, '#F7F4EC') : '')).join('')).join('')}</svg>`;
      const mod = {
        id: 'trivia', name: 'Trivia Rush', icon: 'trivia', cats: ['word', 'party'], sub: '1-8 PLAYERS · ~5 MIN', color: '#2DD4BF', tone: 'teal', btn: 'teal', flag: 'NEW',
        blurb: 'Quick-fire quiz: everyone gets the same question, fastest right answer scores most. 12 categories, English or Vietnamese.',
        rules: { tag: 'QUIZ · 1-8 PLAYERS', steps: [
          '<strong class="text-bone">Answer fast:</strong> everyone gets the same question with four answers. Tap one before the time runs out.',
          '<strong class="text-bone">Points:</strong> a right answer scores 20 to 100 points: the faster you answer, the more you get. Three right in a row adds a 🔥 streak bonus.',
          '<strong class="text-bone">Win:</strong> after the last question, the most points wins.',
        ], tip: 'Not sure? Rule out the answers that are clearly wrong, then go with your gut. A fast guess beats no answer.' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['RIGHT ANSWERS', s.right || 0, 'text-emerald'], ['BEST STREAK', s.bestStreak || 0, 'text-coral']],
        engine: { build, pool, get G() { return G; } }, open, close() { G = null; },
        online: { seats: (sel) => Math.max(2, +sel.n || 4), min: 2, ranked: false, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
