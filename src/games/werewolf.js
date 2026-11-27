    /* =========================================================================
       WEREWOLF (Ma Sói) — Nov 2026, Inna's list. People only, 5-12 players, everyone on their own screen.
       Secret roles: Werewolves, Seer, Doctor, optional Hunter and Witch, the rest Villagers.
       NIGHT: everyone taps a player (so nobody can tell who has a power): the wolves' taps choose who they take (majority),
       the Seer's tap shows that player's side on the Seer's screen only, the Doctor's tap protects. Villagers' taps are
       just a "who do I suspect" note. If there is a Witch with potions left, she then gets a moment to save the wolves'
       target and/or poison someone.
       DAY: who was taken is announced (and their role, if that setting is on); everyone talks in the table chat, then
       votes; most votes is out (a tie: nobody). A Hunter who goes out takes someone with them.
       The village wins when every wolf is out; the wolves win when they are as many as everyone else.
       A narrator voice reads what happens (the browser's own voice; off in tests). Netplay script style: every step is
       an S.collect, so all screens move together; out players watch and see every role.
       ========================================================================= */
    (function werewolfGame() {
      const ABORT = { a: 1 };
      let G = null;
      const $ = (id) => document.getElementById(id);
      const T = (en, vi) => (typeof LANG !== 'undefined' && LANG.code === 'vi' ? vi : en);
      // the roles
      const R = {
        wolf: { en: 'Werewolf', vi: 'Ma Sói', col: '#FB7185', team: 'wolf', d: ['Each night, choose someone with your pack. In the day, act innocent!', 'Mỗi đêm, cùng bầy chọn một người. Ban ngày, giả vờ vô tội!'] },
        seer: { en: 'Seer', vi: 'Tiên Tri', col: '#2DD4BF', team: 'village', d: ['Each night, tap a player to see if they are a wolf.', 'Mỗi đêm, chạm vào một người để xem họ có phải sói không.'] },
        doctor: { en: 'Doctor', vi: 'Bác Sĩ', col: '#34D399', team: 'village', d: ['Each night, tap a player to protect them from the wolves. Not the same player two nights in a row.', 'Mỗi đêm, chạm vào một người để bảo vệ họ khỏi sói. Không bảo vệ cùng một người hai đêm liền.'] },
        hunter: { en: 'Hunter', vi: 'Thợ Săn', col: '#F5B041', team: 'village', d: ['If you go out, you take someone with you.', 'Nếu bạn bị loại, bạn được kéo theo một người.'] },
        witch: { en: 'Witch', vi: 'Phù Thủy', col: '#F4A261', team: 'village', d: ['One potion to save the wolves\' target, one to poison someone. Each once.', 'Một bình cứu người bị sói cắn, một bình độc. Mỗi bình dùng một lần.'] },
        villager: { en: 'Villager', vi: 'Dân Làng', col: '#C9D6E3', team: 'village', d: ['No power. Listen, argue and vote the wolves out!', 'Không có chức năng. Lắng nghe, tranh luận và vote sói ra!'] },
      };
      const rname = (r) => T(R[r].en, R[r].vi);
      // pixel art for the role cards (built from simple shapes)
      const pxs = (rows, pal) => { let r = '', w = Math.max(...rows.map((x) => x.length)); rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[ch]}"/>`; })); return `<svg viewBox="0 0 ${w} ${rows.length}" shape-rendering="crispEdges">${r}</svg>`; };
      const grid = (n, f) => { const rows = []; for (let y = 0; y < n; y++) { let r = ''; for (let x = 0; x < n; x++) r += f(x + 0.5, y + 0.5) || '.'; rows.push(r); } return rows; };
      const D = (x, y, cx, cy) => Math.hypot(x - cx, y - cy), k = '#050E18';
      const ART = {
        wolf: pxs(['..k..........k..', '.kgk........kgk.', '.kggk......kggk.', '.kgggkkkkkkgggk.', '.kggggggggggggk.', 'kggggggggggggggk', 'kggyykggggkyyggk', 'kggykkggggkkyggk', 'kggggggggggggggk', '.kggggwwwwggggk.', '.kgggwwwwwwgggk.', '..kggwwkkwwggk..', '..kgwwwrrwwwgk..', '...kwwwwwwwwk...', '....kkwwwwkk....', '......kkkk......'], { k, g: '#5C6E86', y: '#F5B041', w: '#C9D6E3', r: '#FB7185' }),
        seer: pxs(grid(14, (x, y) => { if (y > 10.5) return (y > 12.5 || x < 2 || x > 12) ? (x > 1 && x < 13 ? 'k' : '') : (x > 2 && x < 12 ? 'y' : ''); const d = D(x, y, 7, 6); if (d < 5.6) return d > 4.7 ? 'k' : (D(x, y, 5, 4) < 1.3 ? 'w' : d < 2.5 ? 'p' : 't'); return ''; }), { k, t: '#2DD4BF', p: '#9FEBDB', w: '#F7F4EC', y: '#F5B041' }),
        doctor: pxs(['...kkkkkk...', '...keeeek...', '...keeeek...', 'kkkkeeeekkkk', 'keeeeeeeeeek', 'keeeeeeeeeek', 'kkkkeeeekkkk', '...keeeek...', '...keeeek...', '...kkkkkk...'], { k, e: '#34D399' }),
        hunter: pxs(['...kkk......', '..kbbk......', '.kbk.s......', '.kbk..s.....', 'kbk...s....y', 'kbkaaaaaaaay', 'kbk...s....y', '.kbk..s.....', '.kbk.s......', '..kbbk......', '...kkk......'], { k, b: '#D08A4E', s: '#F7F4EC', a: '#C9D6E3', y: '#F5B041' }),
        witch: pxs(grid(14, (x, y) => { if (y < 2) return x > 5 && x < 9 ? 'b' : ''; if (y < 5) return x > 5 && x < 9 ? (x < 6.1 || x > 7.9 ? 'k' : 'g') : ''; const d = D(x, y, 7, 9); if (d < 4.9) return d > 4 ? 'k' : (y < 7.6 ? 'g' : D(x, y, 5.5, 10) < 0.9 || D(x, y, 8.5, 11.5) < 0.7 ? 'w' : 'p'); return ''; }), { k, b: '#D08A4E', g: '#C9D6E3', p: '#34D399', w: '#F7F4EC' }),
        villager: pxs(['...kkkkkk...', '..kyyyyyyk..', '.kyyyyyyyyk.', 'kyykyyyykyyk', 'kyykyyyykyyk', 'kyyyyyyyyyyk', 'kyykyyyykyyk', 'kyyykkkkyyyk', '.kyyyyyyyyk.', '..kyyyyyyk..', '...kkkkkk...'], { k, y: '#F5B041' }),
        moon: pxs(grid(16, (x, y) => (D(x, y, 8, 8) < 7.6 && D(x, y, 11.5, 5.2) > 6.2 ? (D(x, y, 8, 8) > 6.6 ? 'e' : 'w') : '')), { w: '#F7F4EC', e: '#C9D6E3' }),
        sun: pxs(grid(18, (x, y) => { const d = D(x, y, 9, 9), a = Math.atan2(y - 9, x - 9); if (d < 5.2) return d > 4.3 ? 'o' : (D(x, y, 7.5, 7.5) < 1.6 ? 'w' : 'y'); if (d > 6.3 && d < 8.8 && Math.abs(Math.sin(a * 4)) < 0.28) return 'o'; return ''; }), { y: '#F5D06B', o: '#F5B041', w: '#FFF3C4' }),
      };
      const house = (x, wall, roof, lit) => `<g transform="translate(${x},0)"><rect x="0" y="16" width="26" height="18" fill="${wall}"/><polygon points="-3,17 13,4 29,17" fill="${roof}"/><rect x="10" y="24" width="6" height="10" fill="#050E18"/><rect x="3" y="20" width="4" height="4" fill="${lit}"/><rect x="19" y="20" width="4" height="4" fill="${lit}"/></g>`;
      const village = (night) => `<svg class="ww-vil" viewBox="0 0 400 38" shape-rendering="crispEdges">${[6, 50, 96, 140, 230, 274, 320, 366].map((x, i) => house(x, night ? ['#1A2B45', '#22385A'][i % 2] : ['#D08A4E', '#C9D6E3'][i % 2], night ? '#0F1C30' : '#B2213A', night ? (i % 3 ? '#0B1B2B' : '#F5B041') : '#7DD3FC')).join('')}<rect x="180" y="20" width="4" height="14" fill="${night ? '#0F1C30' : '#6B4A2B'}"/><rect x="172" y="12" width="20" height="10" fill="${night ? '#14301F' : '#3F8F4A'}"/><rect x="176" y="6" width="12" height="8" fill="${night ? '#14301F' : '#3F8F4A'}"/><rect y="34" width="400" height="4" fill="${night ? '#0B1B2B' : '#5E8C3A'}"/></svg>`;

      // the narrator (the browser's own voice; never in automated tests)
      function say(en, vi) {
        if (!G || !G.voice || navigator.webdriver || !window.speechSynthesis) return;
        try {
          const L = typeof LANG !== 'undefined' && LANG.code === 'vi', u = new SpeechSynthesisUtterance(L ? vi : en);
          u.lang = L ? 'vi-VN' : 'en-US'; u.rate = 0.95; u.pitch = 0.85;
          const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith(L ? 'vi' : 'en'));
          if (v) u.voice = v; else if (L) return;
          speechSynthesis.cancel(); speechSynthesis.speak(u);
        } catch (e) {}
      }
      SFX.def('howl', () => { SFX.tone({ type: 'sawtooth', f1: 330, f2: 520, t: 0, d: 0.5, v: 0.05 }); SFX.tone({ type: 'sawtooth', f1: 520, f2: 300, t: 0.5, d: 0.9, v: 0.05 }); });

      // how many of each role for n players (settings can turn the extras off)
      function deal(n, sel, rng) {
        const wolves = sel.wolves === 'auto' || !sel.wolves ? (n <= 6 ? 1 : n <= 10 ? 2 : 3) : Math.min(+sel.wolves, Math.floor((n - 1) / 2));
        const roles = Array(wolves).fill('wolf');
        if (+sel.seer !== 0) roles.push('seer');
        if (+sel.doctor !== 0) roles.push('doctor');
        if (+sel.hunter && roles.length < n - 1) roles.push('hunter');
        if (+sel.witch && roles.length < n - 1) roles.push('witch');
        while (roles.length < n) roles.push('villager');
        return rng.shuffle(roles.slice(0, n));
      }
      function winner(players) {
        const alive = players.filter((p) => p.alive), w = alive.filter((p) => p.role === 'wolf').length;
        if (!w) return 'village';
        if (w >= alive.length - w) return 'wolf';
        return null;
      }

      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1200px] mx-auto');
        setupScreen(body, mod, [
          { key: 'n', label: 'PLAYERS', def: 12, choices: [[5, '5'], [6, '6'], [7, '7'], [8, '8'], [10, '10'], [12, '12']] },
          { key: 'wolves', label: 'WEREWOLVES', def: 'auto', choices: [['auto', 'Auto'], [1, '1'], [2, '2'], [3, '3']], hint: 'Auto: 1 wolf for up to 6 players, 2 for 7-10, 3 for 11-12.' },
          { key: 'night', label: 'NIGHT TIME', def: 40, choices: [[30, '30 sec'], [40, '40 sec'], [60, '60 sec']] },
          { key: 'day', label: 'DAY TALK', def: 120, choices: [[60, '1 min'], [120, '2 min'], [180, '3 min']], hint: 'Time to talk in the chat before the vote. Everyone can press "Ready to vote" to start it sooner.' },
          { key: 'seer', label: 'Seer', toggle: true, def: 1, choices: [[1, 'On'], [0, 'Off']], hint: 'Each night, sees if one player is a wolf.' },
          { key: 'doctor', label: 'Doctor', toggle: true, def: 1, choices: [[1, 'On'], [0, 'Off']], hint: 'Each night, protects one player.' },
          { key: 'hunter', label: 'Hunter', toggle: true, def: 0, choices: [[1, 'On'], [0, 'Off']], hint: 'Takes someone with them when they go out.' },
          { key: 'witch', label: 'Witch', toggle: true, def: 0, choices: [[1, 'On'], [0, 'Off']], hint: 'One save potion and one poison.' },
          { key: 'reveal', label: 'Show the role of players who go out', toggle: true, def: 1, choices: [[1, 'On'], [0, 'Off']] },
        ], () => showToast(T('Werewolf is played with friends online: create a room and invite 4 or more people.', 'Ma Sói chơi cùng bạn bè online: tạo phòng và mời từ 4 người trở lên.'), 'info'),
          'Secret roles, a village, and wolves hiding among you. Played with friends: create a room and send them the link.');
      }
      function start(body, sel, S) {
        const roles = deal(S.n, sel, S.rng);
        const players = S.seats.map((x, i) => ({ seat: i, name: x.name, av: x.avatar, role: roles[i], alive: true }));
        G = { S, sel, me: S.online ? S.me : 0, players, night: 0, day: 0, nightT: +sel.night || 40, dayT: +sel.day || 120, reveal: +sel.reveal !== 0, potions: { save: true, poison: true }, lastSaved: -1,
          over: false, tok: ++GT.cur, log: [], voice: true, seen: {}, phase: 'start' };
        GT.started = true; GT.over = false;
        body.innerHTML = `<div class="ww-wrap" id="ww-wrap"><div class="ww-sky" id="ww-sky"></div>
          <div class="ww-col"><div id="ww-head" class="ww-head"></div><div id="ww-news" class="ww-news"></div><div class="ww-tbar"><i id="ww-bar"></i></div>
            <div id="ww-grid" class="ww-grid"></div><div id="ww-act" class="ww-act"></div></div>
          <div id="ww-card" class="ww-card"></div><div id="ww-log" class="logbox" style="height:220px"></div></div>`;
        S.track();
        S.onLeft = (a) => { if (!G) return; const q = G.players[a.s]; if (q.alive) { q.alive = false; q.left = true; log(`${esc(q.name)} ${T('left the game.', 'đã rời trò chơi.')}`); draw(); } };
        S.onCollect = (key, got) => { if (!G || key !== G.ckey) return; G.got = got; draw(); };
        npBar('');
        const mine = G.players[G.me];
        log(T(`You are the <b>${rname(mine.role)}</b>.`, `Bạn là <b>${rname(mine.role)}</b>.`));
        run().catch((e) => { if (e !== ABORT) throw e; });
      }
      async function W(ms) { const t = G && G.tok; await gSleep(window.__fast ? Math.min(ms, 40) : ms); if (!G || G.tok !== t) throw ABORT; }
      const log = (t) => { G.log.push(t); const el = $('ww-log'); if (el) { el.innerHTML = G.log.slice(-60).map((x) => `<div>${x}</div>`).join(''); el.scrollTop = el.scrollHeight; } };
      const me = () => G.players[G.me];
      const alive = () => G.players.filter((p) => p.alive);
      const nm = (p) => (p.seat === G.me ? T('You', 'Bạn') : p.name);
      // what this screen may know: your own role; wolves know each other; the dead and the game's end see everything
      const knows = (p) => p.seat === G.me || !me().alive || G.over || (me().role === 'wolf' && p.role === 'wolf') || (!p.alive && G.reveal) || (G.seen[p.seat] && me().role === 'seer');
      function sky(night) {
        const w = $('ww-wrap'); if (!w) return;
        w.classList.toggle('night', night); w.classList.toggle('day', !night);
        document.body.classList.toggle('ww-night', night); document.body.classList.toggle('ww-day', !night);
        $('ww-sky').innerHTML = (night ? Array.from({ length: 46 }, (_, i) => `<i style="left:${(i * 37 + 11) % 100}%;top:${(i * 53) % 50}%;width:${i % 3 ? 2 : 3}px;height:${i % 3 ? 2 : 3}px;opacity:${0.35 + (i % 5) / 8}"></i>`).join('') : '')
          + `<div class="ww-orb">${night ? ART.moon : ART.sun}</div>` + village(night);
      }
      function head(txt, cls, icon) { const h = $('ww-head'); if (h) h.innerHTML = `<span class="ww-banner pix ${cls || ''}">${icon ? `<span class="ico">${icon}</span>` : ''}${txt}</span>`; }
      function news(h) { const n = $('ww-news'); if (n) { n.innerHTML = h || ''; n.classList.toggle('on', !!h); } }
      function act(h) { const a = $('ww-act'); if (a) a.innerHTML = h || ''; }
      // the timer bar under the news
      function timer(secs) {
        const t0 = Date.now(), tok = G.tok, b = $('ww-bar');
        if (b) b.parentNode.style.visibility = secs ? 'visible' : 'hidden';
        if (!secs) return;
        const iv = gInterval(() => { const e = $('ww-bar'); if (!G || G.tok !== tok || !e) return gClearInt(iv); const left = Math.max(0, 1 - (Date.now() - t0) / (secs * 1000)); e.style.width = left * 100 + '%'; e.classList.toggle('low', left < 0.2); if (left <= 0) gClearInt(iv); }, 200);
      }
      // the players: tap one when the step allows it (G.pick = { ok(p), go(p) })
      function draw() {
        const g = $('ww-grid'); if (!g || !G) return;
        const my = me(), tally = {};
        // live counts: wolves see the pack's picks at night; everyone sees the day vote
        if (G.got && G.ckey) Object.entries(G.got).forEach(([s, a]) => { const voter = G.players[+s]; if (a.target === undefined || a.target < 0) return; if (G.ckey.startsWith('n') && !(my.role === 'wolf' && voter.role === 'wolf')) return; if (G.ckey.startsWith('n') && my.role !== 'wolf') return; tally[a.target] = (tally[a.target] || 0) + 1; });
        g.innerHTML = G.players.map((p) => {
          const can = G.pick && p.alive && G.pick.ok(p), mine = G.myPick === p.seat;
          const role = knows(p) ? `<span class="ww-role" style="color:${R[p.role].col}">${rname(p.role)}</span>` : '';
          const sub = !p.alive ? `<small>${T('out', 'đã ra')}${G.reveal || !my.alive || G.over ? ' · ' + rname(p.role) : ''}</small>` : p.seat === G.me ? `<small>${T('you', 'bạn')}</small>` : `<small>${can ? (G.pick.verb || T('tap', 'chạm')) : '&nbsp;'}</small>`;
          const cnt = tally[p.seat] ? `<span class="ww-cnt ${G.ckey && G.ckey.startsWith('n') ? 'wolf' : ''}">${G.ckey && G.ckey.startsWith('n') ? '🐺 ' : ''}${tally[p.seat]}</span>` : '';
          const ready = G.ckey && G.ckey.startsWith('r') && G.got && G.got[p.seat] ? '<span class="ww-ok">✓</span>' : '';
          return `<button id="ww-seat-${p.seat}" class="ww-pl ${p.alive ? '' : 'dead'} ${can ? 'can' : ''} ${mine ? 'pick' : ''} ${my.role === 'wolf' && p.role === 'wolf' && my.alive ? 'mate' : ''}" data-s="${p.seat}" ${can ? '' : 'disabled'}>${cnt}${ready}<span class="av">${p.av}</span><b>${esc(nm(p))}</b>${role}${sub}</button>`;
        }).join('');
        g.querySelectorAll('.ww-pl.can').forEach((b) => { b.onclick = () => { if (!G.pick) return; const p = G.players[+b.dataset.s]; G.myPick = p.seat; SFX.play('click'); G.pick.go(p); draw(); }; });
        card();
      }
      function card() {
        const c = $('ww-card'); if (!c) return;
        const p = me(), r = R[p.role];
        c.innerHTML = `<div class="pix ww-cl">${T('YOUR SECRET ROLE', 'VAI BÍ MẬT CỦA BẠN')}</div><div class="ww-art">${ART[p.role]}</div><div class="ww-cn pix" style="color:${p.role === 'villager' ? '#27496B' : r.col === '#C9D6E3' ? '#27496B' : r.col}">${rname(p.role).toUpperCase()}</div>
          <div class="ww-cd">${T(r.d[0], r.d[1])}${p.role === 'wolf' ? `<br><b>${T('Your pack', 'Bầy của bạn')}:</b> ${G.players.filter((q) => q.role === 'wolf' && q !== p).map((q) => esc(q.name)).join(', ') || T('just you', 'chỉ mình bạn')}` : ''}${p.role === 'witch' ? `<br>${G.potions.save ? '🧪' : '·'} ${T('save', 'cứu')} &nbsp; ${G.potions.poison ? '☠️' : '·'} ${T('poison', 'độc')}` : ''}</div>${p.alive ? '' : `<div class="ww-outtag pix">${T('YOU ARE OUT', 'BẠN ĐÃ RA')}</div>`}`;
        c.classList.toggle('dead', !p.alive);
      }

      async function run() {
        // 1. everyone sees their secret role
        sky(true); head(T('YOUR SECRET ROLE', 'VAI BÍ MẬT CỦA BẠN'), 'am');
        const my = me();
        news(`<div class="ww-reveal"><div class="ww-art big">${ART[my.role]}</div><div><div class="pix" style="font-size:30px;color:${R[my.role].col}">${rname(my.role).toUpperCase()}</div><div class="ww-cd">${T(R[my.role].d[0], R[my.role].d[1])}</div>${my.role === 'wolf' ? `<div class="ww-cd"><b>${T('Your pack', 'Bầy của bạn')}:</b> ${G.players.filter((q) => q.role === 'wolf' && q !== my).map((q) => esc(q.name)).join(', ') || T('just you', 'chỉ mình bạn')}</div>` : ''}<div class="ww-cd text-muted">${T('Keep it secret!', 'Giữ bí mật nhé!')}</div></div></div>`);
        draw(); timer(0);
        say('Welcome to the village. Look at your secret role, and keep it to yourself.', 'Chào mừng đến với ngôi làng. Hãy xem vai bí mật của bạn, và giữ kín nhé.');
        await W(9000);
        while (G && !G.over) {
          await nightPhase(); if (G.over) return;
          await dayPhase(); if (G.over) return;
        }
      }
      // ---------- night ----------
      async function nightPhase() {
        const S = G.S, t = G.tok; G.night++; G.phase = 'night';
        sky(true); head(`${T('NIGHT', 'ĐÊM')} ${G.night}`, 'night', ART.moon);
        SFX.play('howl');
        say('Night falls on the village. Everyone, close your eyes.', 'Màn đêm buông xuống. Mọi người nhắm mắt lại.');
        const my = me(), key = 'n' + G.night;
        const lines = {
          wolf: [T('The wolves are hunting. Tap who your pack takes tonight.', 'Bầy sói đi săn. Chạm vào người bầy bạn chọn đêm nay.'), T('take', 'cắn')],
          seer: [T('Tap a player to see if they are a wolf.', 'Chạm vào một người để xem họ có phải sói không.'), T('look', 'soi')],
          doctor: [T('Tap a player to protect tonight.', 'Chạm vào người bạn muốn bảo vệ đêm nay.'), T('protect', 'bảo vệ')],
        };
        const L = my.alive ? lines[my.role] || [T('Everyone is asleep. Tap the player you suspect most.', 'Mọi người đang ngủ. Chạm vào người bạn nghi nhất.'), T('suspect', 'nghi')] : null;
        news(my.alive ? `<b>${L[0]}</b>` : `<span class="text-muted">${T('You are out. Watch the night unfold...', 'Bạn đã ra. Xem đêm nay diễn ra thế nào...')}</span>`);
        G.ckey = key; G.got = {}; G.myPick = null;
        G.pick = my.alive ? { verb: L[1], ok: (p) => (my.role === 'wolf' ? p.role !== 'wolf' : my.role === 'doctor' ? p.seat !== G.lastProtect : my.role === 'seer' ? p.seat !== my.seat : p.seat !== my.seat), go: (p) => {
          if (my.role === 'seer') { G.seen[p.seat] = true; news(`<b>${esc(p.name)}</b> ${p.role === 'wolf' ? `<b class="text-coral">${T('IS A WOLF!', 'LÀ SÓI!')}</b>` : `<b class="text-emerald">${T('is not a wolf.', 'không phải sói.')}</b>`}`); log(T(`You looked at ${esc(p.name)}: ${p.role === 'wolf' ? 'a wolf' : 'not a wolf'}.`, `Bạn soi ${esc(p.name)}: ${p.role === 'wolf' ? 'là sói' : 'không phải sói'}.`)); G.pick = null; }
          S.act({ t: 'night', key, s: my.seat, target: p.seat });
          if (my.role !== 'seer') news(`<b>${L[0]}</b> <span class="text-muted">· ${T('you chose', 'bạn chọn')} ${esc(p.name)}</span>`);
        } } : null;
        draw(); timer(G.nightT);
        const seats = alive().map((p) => p.seat);
        const got = await S.collect(key, seats, () => ({ t: 'night', target: -1 }), () => ({ t: 'night', target: -1 }), G.nightT);
        if (!G || G.tok !== t) throw ABORT;
        G.pick = null; G.ckey = null; draw();
        // the wolves' target: most wolf picks (a tie: the shared dice pick)
        const wolves = alive().filter((p) => p.role === 'wolf'), cnt = {};
        wolves.forEach((w) => { const x = (got[w.seat] || {}).target; if (x >= 0 && G.players[x].alive && G.players[x].role !== 'wolf') cnt[x] = (cnt[x] || 0) + 1; });
        let target = -1; const top = Math.max(0, ...Object.values(cnt));
        if (top) { const tied = Object.keys(cnt).filter((x) => cnt[x] === top).map(Number).sort((a, b) => a - b); target = tied[S.rng.rnd(tied.length)]; }
        else { const prey = alive().filter((p) => p.role !== 'wolf'); if (prey.length && wolves.length) target = prey[S.rng.rnd(prey.length)].seat; }   // no pick: they take someone anyway
        const doc = alive().find((p) => p.role === 'doctor'), prot = doc ? (got[doc.seat] || {}).target : -1;
        G.lastProtect = prot;
        // the witch
        let saved = false, poisoned = -1;
        const witch = alive().find((p) => p.role === 'witch');
        if (witch && (G.potions.save || G.potions.poison)) {
          const wk = 'w' + G.night; G.ckey = wk; G.got = {};
          if (witch.seat === G.me) {
            const victim = target >= 0 ? G.players[target] : null;
            news(`<b>${victim ? T(`The wolves chose ${esc(nm(victim))}.`, `Sói đã chọn ${esc(nm(victim))}.`) : T('The wolves chose nobody.', 'Sói không chọn ai.')}</b> ${T('Use a potion?', 'Dùng bình thuốc không?')}`);
            let save = false, poison = -1, sent = false;
            const send = () => { if (sent) return; sent = true; G.pick = null; S.act({ t: 'witch', key: wk, s: G.me, save, poison }); act(''); news(`<span class="text-muted">${T('The night goes on...', 'Đêm vẫn tiếp tục...')}</span>`); draw(); };
            const ui = () => { act(`${victim && G.potions.save && target !== G.me ? `<button id="ww-save" class="btn-game ${save ? 'btn-teal' : 'btn-graphite'} py-2 px-4 text-sm">🧪 ${save ? T('Saving', 'Sẽ cứu') : T('Save', 'Cứu')} ${esc(victim.name)}</button>` : ''}
              ${G.potions.poison ? `<span class="text-muted text-sm">${poison >= 0 ? `☠️ ${T('Poison', 'Độc')}: <b>${esc(G.players[poison].name)}</b>` : T('Tap a player to poison them (optional).', 'Chạm vào một người để đầu độc (tùy chọn).')}</span>` : ''}
              <button id="ww-wdone" class="btn-game btn-amber py-2 px-5 text-sm">${T('Done', 'Xong')}</button>`);
              const sv = $('ww-save'); if (sv) sv.onclick = () => { save = !save; ui(); };
              $('ww-wdone').onclick = send; };
            G.pick = G.potions.poison ? { verb: T('poison', 'đầu độc'), ok: (p) => p.seat !== G.me, go: (p) => { poison = poison === p.seat ? -1 : p.seat; ui(); } } : null;
            G.myPick = null; ui(); draw();
          } else if (me().alive) news(`<span class="text-muted">${T('The night goes on...', 'Đêm vẫn tiếp tục...')}</span>`);
          timer(20);
          const wg = await S.collect(wk, [witch.seat], () => ({ t: 'witch', save: false, poison: -1 }), () => ({ t: 'witch', save: false, poison: -1 }), 20);
          if (!G || G.tok !== t) throw ABORT;
          act(''); G.pick = null; G.ckey = null;
          const a = wg[witch.seat] || {};
          if (a.save && G.potions.save && target >= 0) { saved = true; G.potions.save = false; }
          if (a.poison >= 0 && G.potions.poison && G.players[a.poison] && G.players[a.poison].alive) { poisoned = a.poison; G.potions.poison = false; }
        }
        // dawn
        const out = [];
        if (target >= 0 && target !== prot && !saved) out.push(target);
        if (poisoned >= 0 && !out.includes(poisoned)) out.push(poisoned);
        G.dawn = { out, protectedSomeone: target >= 0 && (target === prot || saved) };
      }
      // ---------- day ----------
      async function dayPhase() {
        const S = G.S, t = G.tok; G.day++; G.phase = 'day';
        sky(false); head(`${T('DAY', 'NGÀY')} ${G.day}`, 'am', ART.sun);
        const out = G.dawn.out.map((s) => G.players[s]);
        out.forEach((p) => { p.alive = false; });
        const roleTxt = (p) => (G.reveal ? ` ${p.seat === G.me ? T('You were the', 'Bạn là') : T('They were the', 'Họ là')} <b style="color:${R[p.role].col}">${rname(p.role)}</b>.` : '');
        if (out.length) {
          news(out.map((p) => `<div>${p.seat === G.me ? `<b>${T('You were found this morning.', 'Sáng nay người ta tìm thấy bạn.')}</b>` : `<b>${esc(p.name)}</b> ${T('was found this morning.', 'đã bị phát hiện sáng nay.')}`}${roleTxt(p)}</div>`).join(''));
          out.forEach((p) => log(T(`Morning: ${esc(p.name)} is out (${rname(p.role)}).`, `Sáng: ${esc(p.name)} đã ra (${rname(p.role)}).`)));
          SFX.play('lose');
          say(out.length === 1 ? `The village wakes up. ${out[0].name} was found this morning.` : 'The village wakes up. It was a terrible night.', out.length === 1 ? `Dân làng thức dậy. Sáng nay người ta tìm thấy ${out[0].name}.` : 'Dân làng thức dậy. Một đêm thật kinh hoàng.');
        } else {
          news(`<b>${T('Everyone wakes up safe!', 'Mọi người thức dậy an toàn!')}</b> ${G.dawn.protectedSomeone ? T('Someone was saved in the night...', 'Có người đã được cứu trong đêm...') : ''}`);
          log(T('Morning: nobody is out.', 'Sáng: không ai ra.')); SFX.play('coin');
          say('The village wakes up. Everyone is safe, this time.', 'Dân làng thức dậy. Lần này mọi người đều an toàn.');
        }
        draw(); timer(0);
        await W(5500);
        for (const p of out) if (p.role === 'hunter') await hunterShot(p);
        if (await checkEnd()) return;
        // talk, then vote
        const rk = 'r' + G.day; G.ckey = rk; G.got = {}; G.pick = null;
        const my = me();
        news(`<b>${T('Talk it over in the chat. Who is a wolf?', 'Bàn bạc trong khung chat. Ai là sói?')}</b> <span class="text-muted">${T('The vote starts when the time is up, or when everyone is ready.', 'Bỏ phiếu khi hết giờ, hoặc khi mọi người sẵn sàng.')}</span>`);
        act(my.alive ? `<button id="ww-chat" class="btn-game btn-teal py-2 px-4 text-sm">💬 ${T('Open chat', 'Mở chat')}</button><button id="ww-ready" class="btn-game btn-amber py-2 px-5 text-sm">${T('Ready to vote', 'Sẵn sàng bỏ phiếu')}</button>` : `<span class="text-muted">${T('You are out: you can watch, and read the chat.', 'Bạn đã ra: bạn có thể xem và đọc chat.')}</span>`);
        const ch = $('ww-chat'); if (ch) ch.onclick = () => { try { const b = document.getElementById('chat-fab'); if (b) b.click(); } catch (e) {} };
        const rd = $('ww-ready'); if (rd) rd.onclick = () => { rd.disabled = true; rd.textContent = T('Waiting for the others...', 'Đang chờ mọi người...'); S.act({ t: 'ready', key: rk, s: my.seat }); };
        say('Talk it over. Who do you think is a wolf?', 'Mọi người bàn bạc đi. Ai là sói?');
        draw(); timer(G.dayT);
        await S.collect(rk, alive().map((p) => p.seat), () => ({ t: 'ready' }), () => ({ t: 'ready' }), G.dayT);
        if (!G || G.tok !== t) throw ABORT;
        act('');
        // the vote
        const vk = 'v' + G.day; G.ckey = vk; G.got = {}; G.myPick = null;
        head(T('VILLAGE VOTE', 'BỎ PHIẾU'), 'am', ART.sun);
        news(my.alive ? `<b>${T('Vote: tap who you think is a wolf.', 'Bỏ phiếu: chạm vào người bạn nghĩ là sói.')}</b> <span class="text-muted">${T('Most votes is out. A tie: nobody.', 'Nhiều phiếu nhất sẽ ra. Hòa: không ai ra.')}</span>` : `<span class="text-muted">${T('The village is voting...', 'Dân làng đang bỏ phiếu...')}</span>`);
        say('Time to vote.', 'Đến giờ bỏ phiếu.');
        G.pick = my.alive ? { verb: T('vote', 'bầu'), ok: (p) => p.seat !== my.seat, go: (p) => { S.act({ t: 'vote', key: vk, s: my.seat, target: p.seat }); G.pick = null; news(`<b>${T('You voted for', 'Bạn đã bầu')} ${esc(p.name)}.</b> <span class="text-muted">${T('Waiting for the others...', 'Đang chờ mọi người...')}</span>`); } } : null;
        act(my.alive ? `<button id="ww-skip" class="btn-game btn-graphite py-2 px-4 text-sm">${T('Skip vote', 'Bỏ qua')}</button>` : '');
        const sk = $('ww-skip'); if (sk) sk.onclick = () => { if (!G.pick) return; G.pick = null; S.act({ t: 'vote', key: vk, s: my.seat, target: -1 }); act(''); draw(); };
        draw(); timer(40);
        const got = await S.collect(vk, alive().map((p) => p.seat), () => ({ t: 'vote', target: -1 }), () => ({ t: 'vote', target: -1 }), 40);
        if (!G || G.tok !== t) throw ABORT;
        G.pick = null; act(''); G.got = got; draw(); G.ckey = null;
        const cnt = {}; Object.values(got).forEach((a) => { if (a.target >= 0 && G.players[a.target].alive) cnt[a.target] = (cnt[a.target] || 0) + 1; });
        const top = Math.max(0, ...Object.values(cnt)), tied = Object.keys(cnt).filter((x) => cnt[x] === top);
        timer(0);
        if (!top || tied.length > 1) {
          news(`<b>${T('A tie! Nobody is voted out today.', 'Hòa phiếu! Hôm nay không ai bị loại.')}</b>`); log(T('Vote: a tie, nobody out.', 'Bỏ phiếu: hòa, không ai ra.'));
          say('A tie. Nobody leaves the village today.', 'Hòa phiếu. Hôm nay không ai rời làng.');
          await W(4000);
        } else {
          const p = G.players[+tied[0]]; p.alive = false;
          news(`<b>${esc(nm(p))}</b> ${p.seat === G.me ? T(`are voted out with ${top} vote${top > 1 ? 's' : ''}.`, `bị loại với ${top} phiếu.`) : T(`is voted out with ${top} vote${top > 1 ? 's' : ''}.`, `bị loại với ${top} phiếu.`)}${G.reveal ? ` ${T('They were the', 'Họ là')} <b style="color:${R[p.role].col}">${rname(p.role)}</b>${p.role === 'wolf' ? ' 🐺' : ''}.` : ''}`);
          log(T(`Vote: ${esc(p.name)} is out (${rname(p.role)}).`, `Bỏ phiếu: ${esc(p.name)} ra (${rname(p.role)}).`));
          SFX.play(p.role === 'wolf' ? 'win' : 'lose');
          say(`${p.name} is voted out.${G.reveal ? (p.role === 'wolf' ? ' And they were a werewolf!' : ' They were not a wolf.') : ''}`, `${p.name} bị loại.${G.reveal ? (p.role === 'wolf' ? ' Và đó là một con sói!' : ' Họ không phải sói.') : ''}`);
          if (p.role === 'wolf' && me().role !== 'wolf' && got[G.me] && got[G.me].target === p.seat) funMoment('ww-seat-' + G.me, { key: 'caught' + G.day, icon: '🎯', label: 'CAUGHT', burst: T('WOLF CAUGHT!', 'BẮT ĐƯỢC SÓI!'), sub: `${p.name} was a wolf`, mine: true });
          draw(); await W(5000);
          if (p.role === 'hunter') await hunterShot(p);
        }
        await checkEnd();
      }
      async function hunterShot(h) {
        const S = G.S, t = G.tok, key = 'h' + G.day + '_' + h.seat;
        G.ckey = key; G.got = {}; G.myPick = null;
        news(h.seat === G.me ? `<b>${T('You are the Hunter! Tap someone to take with you.', 'Bạn là Thợ Săn! Chạm vào một người để kéo theo.')}</b>` : `<b>${esc(h.name)} ${T('was the Hunter, and takes aim...', 'là Thợ Săn, đang ngắm bắn...')}</b>`);
        G.pick = h.seat === G.me ? { verb: T('take', 'kéo'), ok: (p) => p.seat !== G.me, go: (p) => { S.act({ t: 'shot', key, s: G.me, target: p.seat }); G.pick = null; } } : null;
        draw(); timer(20);
        const got = await S.collect(key, [h.seat], () => ({ t: 'shot', target: -1 }), () => ({ t: 'shot', target: -1 }), 20);
        if (!G || G.tok !== t) throw ABORT;
        G.pick = null; G.ckey = null;
        const x = (got[h.seat] || {}).target;
        if (x >= 0 && G.players[x].alive) {
          const p = G.players[x]; p.alive = false;
          news(`<b>${esc(h.name)}</b> ${T('takes', 'kéo theo')} <b>${esc(nm(p))}</b>!${G.reveal ? ` ${T('They were the', 'Họ là')} <b style="color:${R[p.role].col}">${rname(p.role)}</b>.` : ''}`);
          log(T(`The Hunter takes ${esc(p.name)} (${rname(p.role)}).`, `Thợ Săn kéo theo ${esc(p.name)} (${rname(p.role)}).`));
          SFX.play('crash'); draw(); await W(4500);
          if (p.role === 'hunter') await hunterShot(p);
        }
      }
      async function checkEnd() {
        const w = winner(G.players);
        if (!w) return false;
        G.over = true; G.S.over = true; G.pick = null;
        sky(w === 'wolf');
        head(w === 'wolf' ? T('THE WOLVES WIN!', 'BẦY SÓI THẮNG!') : T('THE VILLAGE WINS!', 'DÂN LÀNG THẮNG!'), w === 'wolf' ? 'night' : 'am', w === 'wolf' ? ART.wolf : ART.sun);
        news(`<b>${w === 'wolf' ? T('The wolves are as many as everyone else. The village is lost!', 'Số sói đã bằng số dân. Ngôi làng thất thủ!') : T('Every wolf is out. The village is safe!', 'Tất cả sói đã bị loại. Ngôi làng an toàn!')}</b>`);
        say(w === 'wolf' ? 'The wolves win!' : 'The village wins!', w === 'wolf' ? 'Bầy sói chiến thắng!' : 'Dân làng chiến thắng!');
        draw(); timer(0); await W(4500);
        const S = G.S, my = me(), won = (R[my.role].team === w), tok = G.tok;
        const row = S.online ? await S.finish(won ? 'win' : 'loss') : null;
        if (!G || G.tok !== tok) return true;
        const s = gstat('werewolf'); if (my.role === 'wolf') s.wolfGames = (s.wolfGames || 0) + 1; if (won && my.role === 'wolf') s.wolfWins = (s.wolfWins || 0) + 1; if (my.alive) s.survived = (s.survived || 0) + 1;
        reportGame('werewolf', won ? 'win' : 'loss', { xp: won ? 30 : 12, label: `${rname(my.role)} · ${G.players.length} players` });
        gameResult({ title: won ? 'Your side wins!' : 'Your side lost', sub: G.players.map((p) => `${p.av} ${p.seat === G.me ? 'You' : p.name}: ${R[p.role].en}`).join(' · '),
          tone: won ? 'amber' : 'coral', sprite: won ? 'trophy' : 'anchor',
          rows: [['Your role', rname(my.role), 'text-amber'], ['Winners', w === 'wolf' ? 'The wolves' : 'The village', won ? 'text-emerald' : 'text-coral'], ['You survived', my.alive ? 'Yes' : 'No', 'text-bone']].concat(row ? [row] : []),
          againLabel: 'Back to setup', again: () => open($('game-root')) });
        return true;
      }

      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      // tile icon: a wolf's head under the moon
      GICONS.werewolf = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(0, 0, 24, 24, '#0B1B3A')}${rr(17, 1, 3, 1, '#F7F4EC')}${rr(16, 2, 5, 1, '#F7F4EC')}${rr(15, 3, 7, 3, '#F7F4EC')}${rr(16, 6, 5, 1, '#F7F4EC')}${rr(17, 7, 3, 1, '#F7F4EC')}${rr(18, 1, 2, 1, '#0B1B3A')}${rr(18, 2, 3, 1, '#0B1B3A')}${rr(18, 3, 4, 3, '#0B1B3A')}${rr(18, 6, 3, 1, '#0B1B3A')}${rr(18, 7, 2, 1, '#0B1B3A')}${rr(4, 6, 2, 3, K)}${rr(14, 6, 2, 3, K)}${rr(4, 8, 12, 2, K)}${rr(3, 10, 14, 8, K)}${rr(5, 7, 1, 2, '#5C6E86')}${rr(14, 7, 1, 2, '#5C6E86')}${rr(4, 10, 12, 7, '#5C6E86')}${rr(6, 12, 2, 1, '#F5B041')}${rr(12, 12, 2, 1, '#F5B041')}${rr(7, 15, 6, 4, '#C9D6E3')}${rr(9, 15, 2, 1, K)}${rr(8, 18, 4, 2, K)}${rr(0, 21, 24, 3, '#14244A')}</svg>`;
      const mod = {
        id: 'werewolf', name: 'Werewolf', icon: 'werewolf', cats: ['party'], sub: '5-12 PLAYERS · ~20 MIN', color: '#FB7185', tone: 'coral', btn: 'coral', flag: 'NEW',
        blurb: 'Secret roles: wolves hide among the villagers. Each night they strike; each day the village talks and votes someone out.',
        rules: { tag: 'SECRET ROLES · 5-12 PLAYERS', steps: [
          '<strong class="text-bone">Secret roles:</strong> most players are Villagers, a few are Werewolves. The Seer can check one player each night, the Doctor can protect one.',
          '<strong class="text-bone">Night:</strong> everyone taps a player. The wolves\' taps choose who they take; the Seer and Doctor use their powers. Nobody can tell who did what.',
          '<strong class="text-bone">Day:</strong> find out who was taken, talk it over in the chat, then vote. Most votes is out.',
          '<strong class="text-bone">Win:</strong> the village wins when every wolf is out; the wolves win when they are as many as everyone else.',
        ], tip: 'Wolves: don\'t be too quiet, and don\'t be too loud. Village: watch who keeps changing their story.' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['WOLF WINS', s.wolfWins || 0, 'text-coral'], ['SURVIVED', s.survived || 0, 'text-emerald']],
        engine: { deal, winner, get G() { return G; } }, open, close() { if (G) { document.body.classList.remove('ww-night', 'ww-day'); try { speechSynthesis.cancel(); } catch (e) {} } G = null; },
        online: { seats: (sel) => +sel.n || 12, min: 5, bots: false, ranked: false, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
