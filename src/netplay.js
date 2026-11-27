    /* =========================================================================
       NETPLAY: one shared way to run a game table, on this device or online.
       A game plugs in with  mod.online = { seats(sel), min, bots, ranked, start(body, sel, S) }.
       Every change to the game goes through one ordered list of "actions":
         S.act(a)       a decision (a player's tap, or a computer player's choice) -> sent to the table
         S.on(apply, drive)
             apply(a)   changes the game for EVERY screen, in the same order (return ms to wait for an animation)
             drive()    runs only on the table's host after the screen is idle: computer players think here,
                        and timed steps ("next round") are scheduled with S.later(fn, ms)
         S.rng          the shared dice/shuffle (same seed on every screen) - use it inside apply only
       Online, the host's browser puts the actions in order and passes them to everyone (live channel,
       no database rows). If a player leaves, a computer player takes their seat (2-player games: the
       other player wins). If the host leaves, the next player becomes host.
       ========================================================================= */
    const NP = { S: null };
    function seeded(seed) {
      let a = seed >>> 0;
      const random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      const rn = (n) => Math.floor(random() * n);
      return { random, rnd: rn, pick: (arr) => arr[rn(arr.length)], shuffle: (arr) => { arr = arr.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = rn(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; } };
    }
    const NP_BOTS = [['Robo Rita', '🤖'], ['Captain Chip', '🦾'], ['Pixel Pete', '👾'], ['Nova', '🛰️'], ['Gizmo', '⚙️'], ['Sprocket', '🔩'], ['Bolt', '⚡'], ['Widget', '🧩']];

    /* ---------- the session object a game talks to ---------- */
    function npSession(o) {
      const S = {
        online: !!o.online, code: o.code || null, seats: o.seats, me: o.me, n: o.seats.length, sel: o.sel || {},
        ranked: !!o.ranked, isHost: o.online ? o.me === 0 : true, rng: seeded(o.seed >>> 0), seed: o.seed >>> 0,
        version: 0, over: false, tok: GT.cur, game: typeof activeGame !== 'undefined' ? activeGame : null,
      };
      S.bot = (i) => !!(S.seats[i] && S.seats[i].bot);
      S.human = (i) => !S.bot(i);
      // "mine": this screen may play for that seat (online: only your own seat; on one device: every human seat)
      S.mine = (i) => (S.online ? i === S.me : S.human(i));
      S.name = (i) => (S.seats[i] ? S.seats[i].name : '?');
      S.avatar = (i) => (S.seats[i] ? S.seats[i].avatar : '🙂');
      let apply = () => 0, drive = () => {};
      S.on = (ap, dr) => { apply = ap; drive = dr || (() => {}); S.tok = GT.cur; };
      S.track = () => { S.tok = GT.cur; S.script = true; };   // script games call this after their ++GT.cur
      const q = []; let busy = false;
      // "script" games (an async loop) read the actions one by one with S.ask instead of apply/drive
      const inbox = []; let waiter = null;
      const alive = () => GT.cur === S.tok && NP.S === S;
      function drain() {
        while (q.length && !busy && alive()) {
          const a = q.shift(); S.version++;
          if (a.t === '_left' || a.t === '_gone') { const st = S.seats[a.s]; if (st && !st.bot) { st.bot = true; st.left = true; } }
          if (a.t === '_back') { const st = S.seats[a.s]; if (st && st.left && st.uid) { st.bot = false; st.left = false; } if (S.script) continue; }
          if (S.script) { if (waiter) { const f = waiter; waiter = null; f(a); } else inbox.push(a); continue; }
          let w = 0; try { w = +apply(a) || 0; } catch (e) { console.error('game action failed', a, e); }
          if (w > 0) { busy = true; gTimeout(() => { busy = false; drain(); }, w); return; }
        }
        if (!q.length && !busy && alive() && S.isHost && !S.over) { try { drive(); } catch (e) { console.error(e); } }
      }
      S._push = (a) => { q.push(a); drain(); };
      S._kick = () => drain();
      // later(fn, ms): run fn after ms, unless the game moved on in the meantime (or this screen stopped being host)
      S.later = (fn, ms) => { const v = S.version; gTimeout(() => { if (alive() && S.version === v && S.isHost && !busy && !q.length && !S.over) fn(); }, ms); };
      // script games: wait for the next decision of one seat. The table's host plays for computer seats
      // (botFn returns the action, after `ms`). Players who leave become computer seats.
      S.ask = async (seat, botFn, ms, filter) => {
        S.script = true;
        for (;;) {
          // computer players take their time so people can follow (Inna, Nov 2026): short waits x1.8, up to 2.4 s;
          // table timers (seat -1: shout windows, time-outs) keep their real length
          const base = ms === undefined ? 800 : ms, paced = seat >= 0 && S.bot(seat) && base < 2000 ? Math.min(Math.max(base * 1.8, base), 2400) : base;
          const w = { seat, botFn, ms: window.__fast && !S.online ? 5 : paced, sent: false };
          S._wait = w; S._maybeBot();
          const a = inbox.length ? inbox.shift() : await new Promise((res) => { waiter = res; });
          if (a.t === '_left' || a.t === '_gone') { if (S.onLeft) S.onLeft(a); if (S.over) return new Promise(() => {}); continue; }
          if (a.t === '_back') continue;
          if (filter ? !filter(a) : a.s !== seat) continue;
          S._wait = null; return a;
        }
      };
      // everyone decides at the same time (bets, votes...): returns { seat: action } once every seat in `seats` has
      // answered. The host answers for computer seats right away, and for slow people after `secs` (autoFn).
      S.collect = async (key, seats, botFn, autoFn, secs) => {
        const got = {}, t0 = Date.now(), left = () => seats.filter((i) => !(i in got));
        while (left().length) {
          const bots = left().filter((i) => S.bot(i));
          const ms = bots.length ? 350 + Math.floor(Math.random() * 400) : Math.max(250, secs * 1000 - (Date.now() - t0));
          const a = await S.ask(-1, () => { const b = left().filter((i) => S.bot(i)); const k = b.length ? b[0] : left()[0]; return Object.assign((b.length ? botFn : autoFn)(k), { s: k, key, auto: !b.length }); }, ms,
            (x) => x.key === key && seats.includes(x.s) && !(x.s in got));
          got[a.s] = a;
          if (S.onCollect) S.onCollect(key, got);
        }
        return got;
      };
      S._maybeBot = () => {
        const w = S._wait;
        if (!w || w.sent || !S.isHost || !w.botFn || !(w.seat === -1 || S.bot(w.seat))) return;   // seat -1 = the table itself (timeouts)
        w.sent = true;
        gTimeout(() => { if (alive() && S._wait === w && S.isHost) { let a = null; try { a = w.botFn(); } catch (e) { console.error(e); } if (a) S.act(Object.assign({ s: w.seat }, a)); } else w.sent = false; }, w.ms);
      };
      S.script = false;
      // while a rejoining screen replays the missed moves it never sends anything itself
      S.act = (a) => { if (NP.catchup) return; if (a.s === undefined) a.s = S.me; if (o.send) o.send(a); else S._push(a); };
      S._idle = () => !q.length && !busy && !inbox.length;
      S.finish = async () => null;   // ranked Elo (online only), replaced below
      S.leave = () => {};
      S.peek = () => {};
      return S;
    }
    // a table on this device: seat 0 is you, the others are computer players (or friends on the same screen)
    function npLocal(seats, sel) { const S = npSession({ online: false, seats, me: 0, sel, seed: Math.floor(Math.random() * 2 ** 31) }); NP.S = S; return S; }
    const npBotSeat = (i) => ({ bot: true, name: NP_BOTS[i % NP_BOTS.length][0], avatar: NP_BOTS[i % NP_BOTS.length][1] });

    /* ---------- computer players in a private room ---------- */
    // games whose online table has no computer players, but which can play ONE computer opponent on this device
    const NP_LOCAL_VS = { wordduel: 1 };
    // the "how good are the computer players" choice for a game's room
    function npLevelOption(m) {
      if (m.id === 'navalnet') return { key: 'ai', label: 'COMPUTER LEVEL', def: 'smart', choices: [['easy', 'Rookie'], ['smart', 'Smart']] };
      if (m.id === 'bowling') return { key: 'mode', label: 'COMPUTER LEVEL', def: 'bot1', choices: [['bot1', 'Casual'], ['bot2', 'Pro']] };
      const k = botLevelKey(m.id), o = k && (m._opts || []).find((x) => x.key === k);
      return o ? { key: k, label: /SPEED|STYLE/.test(o.label) ? o.label.replace('BOT ', 'COMPUTER ') : 'COMPUTER LEVEL', def: o.def, choices: o.choices } : null;
    }
    const npLevelName = (m, v) => { const o = npLevelOption(m), c = o && o.choices.find((x) => String(x[0]) === String(v)); return c ? c[1] : null; };
    // can "just you + nb computer players" run as the game's own on-this-device version?
    function npCanLocal(m, nb) {
      if (['navalnet', 'tictactoe', 'caro', 'c4', 'checkers', 'chess', 'pool', 'wordduel', 'bowling'].includes(m.id)) return nb === 1;
      if (m.id === 'poker') return nb === 3;
      const sk = tableSizeKey(m.id), so = sk && (m._opts || []).find((o) => o.key === sk);
      return !!(so && so.choices.some((c) => +c[0] === nb + 1));
    }
    // the settings that version needs
    function npLocalSel(m, sel, nb, lvl) {
      const s = Object.assign({}, sel, { net: 'here' }), lk = botLevelKey(m.id), sk = tableSizeKey(m.id);
      delete s.room; delete s.rematch; delete s.rmRanked; delete s.rmBots;
      if (lk && lvl != null) s[lk] = lvl;
      if (sk) s[sk] = nb + 1;
      if (m.id === 'tictactoe') { s.mode = 'ai'; s.first = s.first || 'alt'; }
      if (m.id === 'c4') { s.mode = 'ai'; s.first = s.first || 'me'; }
      if (m.id === 'bowling') s.mode = lvl || 'bot1';
      return s;
    }
    // Sea Battle vs the computer (the offline version) with the room's settings
    function npNavalVsComputer(s) {
      GT.started = false; GT.over = true;
      BASE_SETUP.naval.go({ where: 'here', ai: s.ai || 'smart', clock: s.clock || 20, touch: s.touch === undefined ? 1 : s.touch });
    }

    /* ---------- the online lobby: find or open a table, wait for players, then start ---------- */
    async function npLobby(body, m, sel) {
      const O = m.online, minH = O.min || 2, quick = sel.net === 'quick', me = NET.me.id;
      const reopen = () => { if (activeGame === m.id) m.open(document.getElementById('game-root')); };
      let room = null, ch = null, gone = false, started = false, pingT = null, autoT = null, autoAt = 0, locked = false;   // locked: the host closed the room to new players
      let lobEl = null;
      const wait = (title, html) => {
        body.innerHTML = `<div class="np-room"><div class="win overflow-hidden np-room-main"><div class="winbar ${m.tone || 'teal'}"><span>${title}</span><span class="pix text-xs">${esc(m.name.toUpperCase())} ONLINE</span></div>
          <div class="p-6 space-y-4 text-center" id="np-lob">${html}</div></div>
          <div class="win overflow-hidden np-room-chat hidden" id="np-chatwin"><div class="winbar teal"><span>ROOM CHAT</span><span class="pix text-xs" id="np-chat-n"></span></div><div id="np-chat"></div></div></div>`;
        lobEl = body.querySelector('#np-lob');
      };
      // a running clock while you wait
      const qt0 = Date.now(), qClock = () => { const t = Math.floor((Date.now() - qt0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
      const qTick = gInterval(() => { const el = document.getElementById('np-qt'); if (el) el.textContent = qClock(); if (started || gone) gClearInt(qTick); }, 1000);
      const shut = () => { if (gone) return; gone = true; if (NP.lobby === (room && room.code)) { NP.lobby = null; if (window.ROUTER) ROUTER.sync(); } if (ch) ch.close(); if (pingT) gClearInt(pingT); if (room && room.host === me && !started) NET.leave(room.code); };
      const cancel = () => { shut(); reopen(); };
      // left the room some other way (Lobby button, sidebar, another game): close it quietly
      const watchdog = setInterval(() => { if (started || gone) return clearInterval(watchdog); if (lobEl && !lobEl.isConnected) { clearInterval(watchdog); shut(); } }, 1500);
      wait(quick ? 'FINDING A TABLE' : 'OPENING YOUR ROOM', '<div class="ch-wait"><i></i><i></i><i></i></div><p class="text-sm text-muted">Connecting...</p><button id="np-cancel" class="btn-game btn-graphite py-2 px-6 text-sm">Cancel</button>');
      document.getElementById('np-cancel').onclick = cancel;
      const settings = Object.assign({}, sel); delete settings.room; delete settings.net; delete settings.rematch; delete settings.rmRanked; delete settings.rmBots;
      // joining someone's room: their settings (table size...) come from the room, not from this screen
      let max = O.seats(sel);
      const sizeOf = (r) => { const st = Object.assign({}, sel, (r && r.settings) || {}); return O.seats(st); };
      try {
        if (quick && max === 2) room = await NET.quickMatch(m.id, settings);
        else if (quick) {
          const open = (await NET.openRooms()).filter((r) => r.game === m.id);
          for (const r of open) { const x = await NET.getRoom(r.code).catch(() => null); if (x && x.status === 'waiting' && sizeOf(x) === max) { room = x; break; } }
          if (!room) room = await NET.createRoom(m.id, settings, true, null);
        } else {
          const r = await NET.getRoom(sel.room);
          if (r && r.game === m.id) max = sizeOf(r);
          if (r && r.status !== 'done' && !(r.status === 'playing' && max > 2)) {
            if (r.game !== m.id) throw new Error('That code is for a different game.');
            if (r.host === me) throw new Error('That room is yours: this browser is already that player. To play yourself, open the second copy in another browser or a private window.');
            room = max === 2 ? await NET.joinRoom(r.code) : r;
          } else {
            const sk = tableSizeKey(m.id), so = sk && (m._opts || []).find((o) => o.key === sk);
            if (so && !sel.rematch) { const big = Math.max(...so.choices.map((c) => +c[0])); settings[sk] = big; sel[sk] = big; max = O.seats(sel); }
            room = await NET.createRoom(m.id, settings, !!sel.rmRanked && max === 2, sel.room);
          }
        }
      } catch (e) { showToast(e.message || 'Could not connect.', 'error'); return reopen(); }
      if (gone || activeGame !== m.id) return;
      const code = room.code, isHost = room.host === me, ranked = !!room.is_public && max === 2 && O.ranked !== false;
      NP.lobby = code; if (window.ROUTER) ROUTER.sync();   // the address bar shows the room's link (gamehub.us.com/r/CODE)
      const meta = { name: NET.me.name, avatar: NET.me.avatar, at: Date.now() };
      ch = NET.channel(code, meta);
      let seats = isHost ? [{ uid: me, name: meta.name, avatar: meta.avatar }] : [], hostSel = isHost ? settings : null, present = [];
      const link = inviteLink(m.id, code, Object.assign({}, settings, { net: 'room' }));
      // computer players (private room, host): how many and how good. Games without online bots can still
      // play one computer opponent when you are alone (that game then runs on this device).
      const lvOpt = npLevelOption(m), sk = tableSizeKey(m.id), so = sk && (m._opts || []).find((o) => o.key === sk);
      const minTable = so ? Math.min(...so.choices.map((c) => +c[0])) : Math.max(2, O.min || 2);
      let nb = +sel.rmBots || 0, lvl = lvOpt ? (lvOpt.key in sel && lvOpt.choices.some((c) => String(c[0]) === String(sel[lvOpt.key])) ? sel[lvOpt.key] : lvOpt.def) : null, nbSeen = 0, lvSeen = null;
      const botsCap = () => (quick || !isHost ? 0 : O.bots === false ? (NP_LOCAL_VS[m.id] && seats.length === 1 ? 1 : 0) : max - seats.length);
      const fixBots = () => { nb = Math.max(0, Math.min(nb, botsCap())); };
      const paint = () => {
        if (gone || started) return;
        fixBots();
        const nbV = isHost ? nb : nbSeen, lvV = isHost ? lvl : lvSeen;
        const botRow = (i) => `<div class="np-seat on bot"><span class="text-lg">🤖</span><span class="font-bold truncate">Computer ${i + 1}</span><span class="pix text-xs text-muted">${lvOpt ? esc((lvOpt.choices.find((c) => String(c[0]) === String(lvV)) || [0, 'CPU'])[1]).toUpperCase() : 'CPU'}</span></div>`;
        const _rows = Array.from({ length: max }, (_, i) => seats[i]
          ? `<div class="np-seat on"><span class="text-lg">${esc(seats[i].avatar)}</span><span class="font-bold truncate">${esc(seats[i].name)}</span>${i === 0 ? '<span class="pix text-xs text-amber">HOST</span>' : ''}${seats[i].uid === me ? '<span class="pix text-xs text-teal">YOU</span>' : ''}</div>`
          : i - seats.length < nbV ? botRow(i - seats.length)
          : `<div class="np-seat"><span class="text-lg">·</span><span class="text-muted">${quick && O.bots !== false ? 'Open seat · a computer player fills it if nobody joins' : 'Open seat'}</span></div>`).join('');
        const humans = seats.length, total = humans + nbV;
        const canStart = isHost && (quick ? humans >= minH : total >= Math.max(2, minTable));
        const cap = botsCap();
        const botsUI = !quick && isHost && (cap > 0 || nb > 0) ? `<div class="np-bots np-bots-hi"><div class="np-bots-h"><span>${max === 2 ? 'PLAY THE COMPUTER' : 'ADD COMPUTER PLAYERS'}</span></div>
            <div class="flex items-center justify-between gap-3"><span class="text-sm text-bone leading-snug">${max === 2 ? 'No friend around? Add a computer opponent.' : 'Not enough friends? Computer players fill the empty seats.'}</span>
            <span class="np-step"><button id="np-bm" class="btn-game btn-graphite" ${nb <= 0 ? 'disabled' : ''} aria-label="One less computer player">−</button><b id="np-bn">${nb}</b><button id="np-bp" class="btn-game btn-amber" ${nb >= cap ? 'disabled' : ''} aria-label="One more computer player">+</button></span></div>
            ${lvOpt && nb > 0 ? `<div class="pix text-xs tracking-wider text-muted mt-3 mb-1.5 text-left">${esc(lvOpt.label)}</div><div class="seg w-full">${lvOpt.choices.map((c) => `<button data-lv="${esc(c[0])}" class="seg-btn flex-1 ${String(c[0]) === String(lvl) ? 'on' : ''}">${esc(c[1])}</button>`).join('')}</div>` : ''}</div>` : '';
        // the game's settings: the host can change them while everyone is in the room (talk it over in the chat)
        const cur = hostSel || settings, rsel = Object.assign({}, cur, { net: sel.net });
        const ropts = !(quick && max === 2) ? (m._roomOpts || []).filter((o) => !o.when || o.when(rsel)) : [];
        const valTxt = (o) => esc((o.choices.find((c) => String(c[0]) === String(cur[o.key])) || o.choices.find((c) => String(c[0]) === String(o.def)) || ['', '?'])[1]);
        const setsUI = ropts.length ? `<div class="np-sets"><div class="flex items-center justify-between gap-2 mb-1"><span class="pix text-xs tracking-wider text-muted">GAME SETTINGS</span><span class="pix text-xs ${isHost ? 'text-amber' : 'text-muted'}">${isHost ? 'TAP TO CHANGE' : 'THE HOST CHOOSES'}</span></div>
          ${ropts.slice().sort((a, b) => (b.hero ? 1 : 0) - (a.hero ? 1 : 0)).map((o) => `<div class="np-set${o.hero ? ' np-set-hero' : ''}"><div class="np-set-l">${esc(o.label)}</div>${o.hero && o.hint ? `<div class="np-set-h">${esc(o.hint)}</div>` : ''}${isHost
            ? `<div class="seg w-full">${o.choices.map((c) => `<button data-sk="${esc(o.key)}" data-sv="${esc(c[0])}" class="seg-btn flex-1 ${String(c[0]) === String(cur[o.key] !== undefined ? cur[o.key] : o.def) ? 'on' : ''}">${esc(c[1])}</button>`).join('')}</div>`
            : `<div class="np-set-v">${valTxt(o)}</div>`}</div>`).join('')}</div>` : '';
        const auto = autoAt ? Math.max(0, Math.ceil((autoAt - Date.now()) / 1000)) : 0;
        const needMsg = total < Math.max(2, minTable) ? (cap > 0 ? `Invite friends or add computer players (at least ${Math.max(2, minTable)} players).` : `Waiting for friends to join (at least ${Math.max(2, minTable)} players)...`) : '';
        if (!lobEl || !lobEl.isConnected) return shut();
        lobEl.innerHTML = `<div class="flex items-center justify-center gap-2"><span class="pix text-xs text-muted">${quick ? 'SEARCHING' : 'WAITING'}</span><span id="np-qt" class="pix text-xl text-teal">${qClock()}</span></div>
          ${quick ? '' : `<p class="text-sm text-muted">${isHost ? 'Your room is open. Send the link to your friends.' : 'You are in the room. The host starts the game.'}</p>
            <div class="room-code mx-auto" style="max-width:220px">${esc(code)}</div>
            <div class="flex flex-wrap justify-center gap-2"><button id="np-copy" class="btn-game btn-amber py-2 px-5 text-sm">Copy invite link</button><button id="np-finv" class="btn-game btn-teal py-2 px-5 text-sm">Invite friends</button>${isHost && !quick ? `<button id="np-lock" class="btn-game ${locked ? 'btn-coral' : 'btn-graphite'} py-2 px-4 text-sm" title="A locked room lets nobody new in">${locked ? '🔒 Room locked' : '🔓 Lock room'}</button>` : !isHost && locked ? '<span class="pix text-xs text-coral self-center">🔒 LOCKED</span>' : ''}${navigator.share ? '<button id="np-share" class="btn-game btn-teal py-2 px-5 text-sm">Share…</button>' : ''}</div>
            <div class="np-linkline pix text-xs text-muted">${esc(link.replace(/^https?:\/\//, ''))}</div>`}
          ${quick && max === 2 ? '<p class="text-sm text-muted">You are in the queue. The next player who looks for a game is matched with you.</p><p class="text-xs text-muted">Testing on one computer? Two tabs of the same browser are the same player. Use a second browser, or a private window, for the other side.</p>' : ''}
          <div class="np-seats text-left">${_rows}</div>
          ${botsUI}
          ${setsUI}
          ${isHost && (!quick || max > 2) ? `<button id="np-start" class="btn-game btn-${m.btn || 'amber'} w-full py-2.5 text-sm" ${canStart ? '' : 'disabled'}>${canStart ? (quick && humans < max && O.bots !== false ? 'Start game (computer players fill the empty seats)' : 'Start game') : esc(needMsg || 'Waiting for at least one more player...')}</button>` : ''}
          ${max > 2 && !isHost ? '<p class="text-sm text-muted">Waiting for the host to start...</p>' : ''}
          ${auto ? `<p class="pix text-xs text-teal">STARTING IN ${auto}s</p>` : ''}
          <div class="flex flex-wrap justify-center gap-2"><button class="btn-game btn-graphite py-2 px-5 text-sm" onclick="openGuide('${m.id}')">? How to play</button><button id="np-cancel" class="btn-game btn-graphite py-2 px-6 text-sm">Leave room</button></div>`;
        const cp = document.getElementById('np-copy'); if (cp) cp.onclick = (e) => copyText(link, e.currentTarget);
        const fi = document.getElementById('np-finv'); if (fi) fi.onclick = () => inviteFriends(link, m.name);
        const sh = document.getElementById('np-share'); if (sh) sh.onclick = () => navigator.share({ title: `Play ${m.name.replace(' Online', '')} on GameHub`, text: `Play ${m.name.replace(' Online', '')} with me on GameHub!`, url: link }).catch(() => {});
        const st = document.getElementById('np-start'); if (st) st.onclick = () => startNow();
        const lk = document.getElementById('np-lock'); if (lk) lk.onclick = () => { locked = !locked; SFX.play('click'); showToast(locked ? 'Room locked: nobody new can join.' : 'Room open again: friends can join with the code or link.', 'info'); tellLobby(); paint(); };
        const bm = document.getElementById('np-bm'); if (bm) bm.onclick = () => { nb--; SFX.play('click'); tellLobby(); paint(); };
        const bp = document.getElementById('np-bp'); if (bp) bp.onclick = () => { nb++; SFX.play('click'); tellLobby(); paint(); };
        lobEl.querySelectorAll('[data-sk]').forEach((b) => { b.onclick = () => {
          const o = ropts.find((x) => x.key === b.dataset.sk); if (!o) return;
          const v = (o.choices.find((c) => String(c[0]) === b.dataset.sv) || [cur[o.key]])[0];
          hostSel = Object.assign({}, hostSel || settings, { [o.key]: v }); Object.assign(settings, { [o.key]: v });
          setupSave(m.id, Object.assign({}, setupLoad(m.id), { [o.key]: v })); SFX.play('click'); tellLobby(); paint();
        }; });
        lobEl.querySelectorAll('[data-lv]').forEach((b) => { b.onclick = () => { lvl = (lvOpt.choices.find((c) => String(c[0]) === b.dataset.lv) || [lvl])[0]; SFX.play('click'); tellLobby(); paint(); }; });
        document.getElementById('np-cancel').onclick = cancel;
      };
      const tellLobby = () => { if (isHost && !started) ch.send('lobby', { seats, sel: hostSel, max, nb, lvl, locked }); };
      // the host keeps the seat list: people present on the channel, in the order they arrived
      ch.presence((list) => {
        present = list.map((x) => x.uid);
        if (!isHost || started) return;
        const before = JSON.stringify(seats);
        seats = seats.filter((x) => x.uid === me || present.includes(x.uid));
        list.slice().sort((a, b) => (a.at || 0) - (b.at || 0)).forEach((x) => { if (!locked && seats.length < max && !seats.some((y) => y.uid === x.uid)) seats.push({ uid: x.uid, name: x.name || 'Player', avatar: x.avatar || '🙂' }); });
        if (JSON.stringify(seats) !== before) {
          SFX.play('pop'); tellLobby(); paint();
          if (quick && max === 2 && seats.length === 2) return begin();
          if (sel.rematch && seats.length >= sel.rematch) return begin();   // a rematch starts as soon as everyone is back
          if (quick && seats.length >= max) return begin();
          if (quick && seats.length >= minH && !autoAt) { autoAt = Date.now() + 20000; autoT = gInterval(() => { paint(); if (Date.now() >= autoAt) { gClearInt(autoT); begin(); } }, 1000); }
        }
      });
      ch.on('hi', () => { tellLobby(); if (started && startMsg) ch.send('start', startMsg); });
      ch.on('lobby', (d) => {
        if (isHost || started) return;
        if (hostSel && JSON.stringify(hostSel) !== JSON.stringify(d.sel)) showToast('The host changed the game settings.', 'info');
        seats = d.seats; hostSel = d.sel; nbSeen = d.nb || 0; lvSeen = d.lvl; locked = !!d.locked;
        if (!seats.some((x) => x.uid === me) && locked) { showToast('This room is locked by the host.', 'error'); return cancel(); }
        if (!seats.some((x) => x.uid === me) && seats.length >= d.max) { showToast('That table is full.', 'error'); return cancel(); }
        paint();
      });
      let startMsg = null, S = null;
      ch.on('start', (d) => { if (!isHost && !started) launch(d); });
      function startNow() {
        if (started || !isHost) return;
        fixBots();
        if (!quick && seats.length === 1 && nb > 0 && npCanLocal(m, nb)) return playLocal();
        begin();
      }
      // just you and computer players: close the room and play the game's own vs-computer version on this device
      function playLocal() {
        started = true; gone = true; if (autoT) gClearInt(autoT); if (pingT) gClearInt(pingT);
        try { ch.close(); } catch (e) {} NET.leave(code);
        const ls = npLocalSel(m, Object.assign({}, hostSel || settings), nb, lvl);
        if (m.id === 'navalnet') { GT.started = false; return npNavalVsComputer(ls); }
        if (m._onStart) settingsPop(m, ls, () => { if (m.id === activeGame) m._onStart(ls); }, { extra: [['🤖', 'Computer players', nb + (lvl != null ? ' · ' + (npLevelName(m, lvl) || lvl) : '')]] });
      }
      function begin() {
        if (started || !isHost) return; if (autoT) gClearInt(autoT);
        fixBots();
        const all = seats.slice();
        if (quick) { if (O.bots !== false) while (all.length < max) all.push(npBotSeat(all.length)); }
        else for (let k = 0; k < nb && all.length < max; k++) all.push(npBotSeat(all.length));
        const fin = Object.assign({}, hostSel);
        if (!quick) { const lk = botLevelKey(m.id); if (lk && lvl != null) fin[lk] = lvl; if (sk) fin[sk] = all.length; }
        startMsg = { seed: Math.floor(Math.random() * 2 ** 31), seats: all, sel: fin };
        ch.send('start', startMsg); NET.leave(code); launch(startMsg);
      }
      function launch(d) {
        const myIdx = d.seats.findIndex((x) => x.uid === me);
        if (myIdx < 0) { showToast('That game started without you.', 'error'); return cancel(); }
        started = true; if (autoT) gClearInt(autoT);
        S = npOnline({ code, ch, seats: d.seats, me: myIdx, seed: d.seed, sel: d.sel, ranked, room });
        NP.table = code; NP.lobby = null; CHAT.mode = 'table'; if (typeof chatOnView === 'function') chatOnView('game');
        if (window.ROUTER) ROUTER.sync();
        npRemember({ code, game: m.id, start: d, net: sel.net, ranked });
        NP.last = { code, game: m.id, sel: Object.assign({}, d.sel), ranked, bots: d.seats.filter((x) => x.bot).length, uids: d.seats.filter((x) => x.uid).map((x) => x.uid), names: Object.fromEntries(d.seats.filter((x) => x.uid).map((x) => [x.uid, x.name])) };
        if (ranked && pingT == null) { NET.ping(code); pingT = gInterval(() => NET.ping(code), 10000); }
        SFX.play('reveal');
        if (m.id === activeGame) { GT.started = true; GT.over = false; }
        // every screen shows how the game is set up for the same few seconds, then the game begins (Inna, Nov 2026)
        const nbots = d.seats.filter((x) => x.bot).length, lk = botLevelKey(m.id);
        const extra = [['👥', 'Players', d.seats.length + (nbots ? ` (${nbots} computer${nbots > 1 ? 's' : ''}${lk && d.sel[lk] != null ? ', ' + (npLevelName(m, d.sel[lk]) || d.sel[lk]) : ''})` : '')]];
        const go = () => { if (S.left || NP.S !== S && NP.S) return; O.start(body, Object.assign({}, d.sel, { net: sel.net, room: code }), S); };
        const ss = d.sel && d.sel.session;
        if (m.id === 'random' || (quick && max === 2 && !ss)) go();
        else settingsPop(m, d.sel, go, { online: true, extra, secs: ss ? 4 : 5, head: ss ? `GAME ${ss.k} OF ${ss.n} · UP NEXT` : 'GAME SETTINGS', tag: ss || d.sel.rnd ? '🎲 RANDOM' : '', sub: ss || d.sel.rnd ? 'Picked at random. Here is how this game is set up:' : quick ? 'Here is how this table is set up:' : 'Here is how the host set up this game:' });
      }
      await ch.ready;
      if (gone) return;
      if (!(quick && max === 2)) {   // the room's chat (same chat as during the game)
        NP.table = code; CHAT.mode = 'table'; if (typeof chatOnView === 'function') chatOnView('game');
        const cw = document.getElementById('np-chatwin'), cbox = document.getElementById('np-chat');
        if (cw && cbox) { cw.classList.remove('hidden'); netChatRoom('t:' + code); chatMount(cbox, 't:' + code); }
      }
      const tb = body.querySelector('.winbar span'); if (tb) tb.textContent = quick ? (max === 2 ? 'FINDING AN OPPONENT' : 'FINDING A TABLE') : isHost ? `YOUR ROOM · ${code}` : `ROOM ${code}`;
      if (isHost) { paint(); NET.ping(code); pingT = gInterval(() => { if (!started) NET.ping(code); }, 10000); }
      else { paint(); ch.send('hi', {}); gTimeout(() => { if (!started && !gone && !seats.length) ch.send('hi', {}); }, 2500); }
    }

    /* ---------- an online session: ordering actions, watching who is still here ---------- */
    function npOnline(o) {
      const ch = o.ch, me = NET.me.id;
      let host = 0; const log = []; let next = 0; const buf = {}; let asked = 0;
      // a guest's decision carries an id and is sent again until it comes back as a table move, so a lost
      // message can't freeze or skip a turn (the host ignores repeats); see the resend timer below
      const seen = new Set(), pending = {}; let reqN = 0;
      const S = npSession({ online: true, code: o.code, seats: o.seats, me: o.me, seed: o.seed, sel: o.sel, ranked: o.ranked, send: (a) => {
        if (S.isHost) return seq(a);
        a._id = me.slice(0, 8) + '.' + (++reqN) + '.' + Math.floor(Math.random() * 1e6);
        pending[a._id] = { a, at: Date.now(), tries: 1 }; ch.send('req', a);
      } });
      NP.S = S;
      const humanUp = (i) => S.seats[i] && !S.seats[i].bot && !S.seats[i].left;
      const pickHost = () => { for (let i = 0; i < S.n; i++) if (humanUp(i)) return i; return -1; };
      const mark = (a) => { if (a && a._id) { seen.add(a._id); delete pending[a._id]; } };
      function seq(a) { if (a._id && seen.has(a._id)) return; mark(a); a._n = log.length; log.push(a); next = log.length; ch.send('act', a); S._push(a); }
      function take(a) {
        if (a._n < next) return;
        if (a._n > next) { buf[a._n] = a; if (Date.now() - asked > 1500) { asked = Date.now(); ch.send('sync', { from: next }); } return; }
        mark(a); log.push(a); next++; S._push(a);
        while (buf[next]) { const b = buf[next]; delete buf[next]; mark(b); log.push(b); next++; S._push(b); }
      }
      ch.on('act', (a) => { if (!S.isHost) take(a); });
      S._load = (list) => { (list || []).forEach((a) => { if (a && a._n !== undefined) take(a); }); };
      ch.on('acts', (d) => { if (!S.isHost) (d.list || []).forEach(take); });
      ch.on('sync', (d) => { if (S.isHost && log.length > (d.from || 0)) ch.send('acts', { list: log.slice(d.from || 0) }); });
      // every 3 s: send again any of my decisions the table hasn't confirmed yet, and ask whether I missed the
      // latest move (a lost last message used to go unnoticed until the next one arrived)
      const resend = gInterval(() => {
        // after the game ends this screen still re-sends its own last decisions (e.g. the answer to the winning shot),
        // or a lost final message would leave the other screen waiting forever
        if (S._left || (S.over && !Object.keys(pending).length)) return;
        const now = Date.now();
        for (const id in pending) {
          const p = pending[id];
          if (p.tries >= 12) { delete pending[id]; continue; }
          if (now - p.at < 2500) continue;
          p.at = now; p.tries++;
          if (S.isHost) { delete pending[id]; seq(p.a); } else ch.send('req', p.a);
        }
        if (!S.isHost && !S.over) ch.send('sync', { from: next });
      }, 3000);
      ch.on('req', (a, from) => {
        if (!S.isHost || !a) return;
        const st = S.seats[a.s]; if (!st || st.uid !== from) return;          // you can only act for your own seat
        if (a.t === '_gone') { const w = S.seats[a.who]; if (w && !w.bot) seq({ t: '_gone', s: a.who }); return; }
        if (st.bot && a.t !== '_left') return;
        seq(a);
      });
      ch.on('hi', () => {});   // late lobby messages
      // emotes ride on the same live channel but are not game moves (no ordering, nothing to replay)
      S.emote = (id) => ch.send('emo', { id });
      // live "what I'm doing right now" (e.g. Pool aim + pull-back), sent often, never stored or replayed
      S.peek = (d) => ch.send('peek', d);
      ch.on('peek', (d, from) => { const i = S.seats.findIndex((x) => x && x.uid === from); if (i >= 0 && i !== S.me && S.onPeek) S.onPeek(i, d); });
      ch.on('emo', (d, from) => { const i = S.seats.findIndex((x) => x && x.uid === from); if (i >= 0 && i !== S.me && d && window.emoteShow) window.emoteShow(i, d.id); });
      // after every action: re-check who the host is (the first player still at the table)
      const origPush = S._push;
      S._push = (a) => { origPush(a); const h = pickHost(); if (h !== host) { host = h; const was = S.isHost; S.isHost = h === S.me; if (S.isHost && !was) { next = log.length; showToast('You are now hosting this table.', 'info'); S._kick(); } } if (S.script) S._maybeBot(); };
      // who is still here: a player missing for 20 s gets a warning, after 45 s a computer player takes the seat
      const missing = {};
      let present = S.seats.map((x) => x.uid);
      ch.presence((list) => { present = list.map((x) => x.uid); });
      const watch = gInterval(() => {
        if (S.over) return;
        const now = Date.now(); let warn = '';
        for (let i = 0; i < S.n; i++) {
          if (!humanUp(i) || i === S.me) continue;
          if (present.includes(S.seats[i].uid)) { if (missing[i]) { delete missing[i]; showToast(`${S.name(i)} is back.`, 'success'); } continue; }
          missing[i] = missing[i] || now;
          const t = now - missing[i];
          if (t > 15000) warn = `${S.name(i)} disconnected. ${S.n === 2 ? 'You win' : 'A computer player takes over'} in ${Math.max(0, Math.ceil((45000 - t) / 1000))}s if they don't come back.`;
          if (t > 45000) {
            // the first player still here sends it (so only one screen does)
            const first = [...Array(S.n).keys()].find((k) => humanUp(k) && (k === S.me || present.includes(S.seats[k].uid)));
            if (first === S.me) { const a = { t: '_gone', s: i }; if (S.isHost || host === i) { S.isHost = true; host = S.me; seq(a); } else ch.send('req', Object.assign(a, { s: S.me, who: i })); }
            missing[i] = now + 1e9;
          }
        }
        npBar(warn);
      }, 1000);
      // a player who dropped out comes back (Nov 2026, Inna: "allow player to rejoin if disconnect"): every screen still
      // at the table sends the moves so far (in parts); the host gives the seat back if a computer had taken it.
      ch.on('rejoin', (d, from) => {
        const i = S.seats.findIndex((x) => x && x.uid === from); if (i < 0 || i === S.me) return;
        if (S.over) return ch.send('rejoin-ok', { to: from, over: true });
        if (S.isHost && S.seats[i].bot && S.seats[i].left) seq({ t: '_back', s: i });
        delete missing[i];
        const parts = Math.max(1, Math.ceil(log.length / 150));
        for (let k = 0; k < parts; k++) ch.send('rejoin-ok', { to: from, part: k, total: parts, list: log.slice(k * 150, k * 150 + 150), n: log.length });
      });
      // leaving: tell the table, then the seat becomes a computer player (2 players: the other one wins)
      S.leave = () => {
        if (S._left) return; S._left = true;
        try { localStorage.removeItem('ps_np_cur:' + (NET.me && NET.me.id)); } catch (e) {}
        gClearInt(watch); gClearInt(resend);
        if (!S.over) { ch.send(S.isHost ? 'act' : 'req', S.isHost ? { t: '_left', s: S.me, _n: log.length } : { t: '_left', s: S.me }); if (S.ranked) NET.reportResult(S.code, 'loss').catch(() => {}); }
        setTimeout(() => ch.close(), 400);
        if (NP.S === S) NP.S = null;
      };
      // ranked result (2 players, quick match): both report, the service changes Elo once
      S.finish = async (res) => {
        S.over = true;
        if (!S.ranked) return null;
        let r = null;
        for (let k = 0; k < 30 && NP.S === S; k++) {
          try { r = await NET.reportResult(S.code, res); } catch (e) { r = null; }
          if (r && r.final) break;
          await new Promise((ok) => setTimeout(ok, k < 3 ? 1500 : 4000));
        }
        if (!r || !r.final) return ['Ranked Elo', 'Waiting for your opponent...', 'text-muted'];
        if (r.disputed) return ['Ranked Elo', 'Results did not match: no change', 'text-coral'];
        const isHost = o.room.host === me, elo = isHost ? r.host_elo : r.guest_elo, d = isHost ? r.delta_host : -r.delta_host;
        return ['Ranked Elo', `${elo} (${d >= 0 ? '+' : ''}${d})`, d >= 0 ? 'text-emerald' : 'text-coral'];
      };
      return S;
    }
    // a thin bar above an online game: the table, and warnings like "X disconnected"
    function npBar(warn) {
      const S = NP.S, root = document.getElementById('game-root'); if (!S || !S.online || !root) return;
      let bar = document.getElementById('np-bar');
      if (!bar) { const body = document.getElementById('gs-body'); if (!body) return; bar = document.createElement('div'); bar.id = 'np-bar'; bar.className = 'np-bar'; body.insertAdjacentElement('beforebegin', bar); }
      const seats = S.seats.map((x, i) => `<span class="np-chip ${x.left ? 'gone' : ''} ${i === S.me ? 'me' : ''}" title="${esc(x.name)}">${esc(x.avatar)} ${esc(x.name)}${x.bot && !x.left ? ' <i>CPU</i>' : ''}${x.left ? ' <i>LEFT</i>' : ''}</span>`).join('');
      const html = `<span class="pix text-xs text-teal">● ONLINE · ${esc(S.code)}</span><span class="np-chips">${seats}</span>${warn ? `<span class="np-warn">${esc(warn)}</span>` : ''}`;
      if (bar.innerHTML !== html) bar.innerHTML = html;
      // Inna (Nov 2026): the strip of player names is clutter during a game (the table already shows everyone);
      // it only appears for a warning such as "X disconnected"
      bar.classList.toggle('hidden', !warn);
    }
    // for games: the "Leave" button of an online table asks first, then leaves
    function npConfirmLeave(then) {
      const S = NP.S;
      if (!S || !S.online || S.over) return then();
      askConfirm({ title: 'LEAVE THIS GAME?', sub: S.n === 2 ? 'Leaving an online game counts as a loss, and your opponent wins.' : 'A computer player takes your seat and the others keep playing.' }).then((yes) => { if (yes) { S.leave(); then(); } });
    }

    /* ---------- REMATCH: after an online game, the same people can go again with one tap ----------
       Everyone still here meets on a small channel ('rm:' + the old room code). When all of them have said yes,
       the first of them opens a new room and the others join it; the table starts by itself. */
    /* ---------- which games a group can play, and random picks (Random Game, "what next?") ---------- */
    // the table sizes each online game allows, from its tile ("2-4 PLAYERS", "1v1")
    function npSizes(id) {
      const m = GAME_MODS[id]; if (!m || !m.online || id === 'random' || id === 'wordconnect') return null;
      const sub = String(m.sub || ''), r = /(\d)\s*-\s*(\d)\s*PLAYERS/i.exec(sub), one = /(\d)\s*PLAYERS/i.exec(sub);
      let lo = 2, hi = 2;
      if (/1v1/i.test(sub)) { lo = hi = 2; } else if (r) { lo = Math.max(2, +r[1]); hi = +r[2]; } else if (one) { lo = hi = +one[1]; }
      return { lo: Math.max(lo, m.online.min || 2), hi, bots: m.online.bots !== false };
    }
    // games n people can play together (computer players fill empty seats where the game has them)
    function npFitGames(n, kind) {
      const KIND = { card: 2, board: 1, party: 4 };
      const only = kind && KIND[kind] ? new Set(SHELVES[KIND[kind]].ids) : null;
      return Object.keys(GAME_MODS).filter((id) => { const z = npSizes(id); if (!z) return false;
        if (only && !only.has(id) && !(id === 'navalnet' && only.has('naval'))) return false;
        return n <= z.hi && (z.bots || n >= z.lo); });
    }
    const npGameName = (id) => (id === 'navalnet' ? 'Sea Battle' : (GAME_MODS[id] || {}).name || id);
    // the settings for the next table: size = people + computer players, within what the game allows
    function npNextSel(id, n, bots, extra) {
      const z = npSizes(id) || { lo: 2, hi: 2, bots: true }, sk = tableSizeKey(id);
      const total = Math.max(z.lo, Math.min(z.hi, n + (z.bots ? bots : 0)));
      const sel = Object.assign({ net: 'room', rematch: n, rmBots: z.bots ? Math.max(0, total - n) : 0 }, extra || {});
      if (sk) sel[sk] = total;
      return sel;
    }
    // everyone in the group moves to a new room for the next game (the leader opens it, the others join it)
    function npGoNext(d, leader) {
      const gm = document.getElementById('g-modal'); if (gm) gm.classList.add('hidden');
      document.querySelectorAll('.np-pick').forEach((e) => e.remove());
      try { localStorage.removeItem('ps_np_cur:' + (NET.me && NET.me.id)); } catch (e) {}
      if (typeof GT !== 'undefined') { GT.started = false; GT.over = true; }
      showToast(d.session ? `Game ${d.session.k} of ${d.session.n}: ${npGameName(d.game)}!` : `Next game: ${npGameName(d.game)}. Setting up the table...`, 'success');
      SETUP_PRESET = { id: d.game, sel: Object.assign({}, d.sel, { room: d.code, session: d.session || undefined }), code: d.code, host: leader };
      const start = () => { openGame(d.game); const g = document.querySelector('#game-root #su-go'); if (g) g.click(); };
      if (leader) return start();
      let k = 0; const tryJoin = () => NET.getRoom(d.code).then((r) => { if (r) start(); else if (++k < 24) setTimeout(tryJoin, 500); else showToast('The next room did not open.', 'error'); }).catch(() => setTimeout(tryJoin, 800));
      setTimeout(tryJoin, 400);
    }
    window.npFitGames = npFitGames; window.npSizes = npSizes; window.npNextSel = npNextSel; window.npGoNext = npGoNext; window.npGameName = npGameName;
    // pick the next game of a Random Game session (or a "Random game" choice)
    function npRandomNext(n, bots, s, rng) {
      rng = rng || { pick: (a) => a[Math.floor(Math.random() * a.length)] };
      let list = npFitGames(n, s && s.kind);
      if (!list.length) list = npFitGames(n);
      if (s && !s.rep) { const fresh = list.filter((g) => !(s.played || []).includes(g)); if (fresh.length) list = fresh; }
      return rng.pick(list);
    }
    window.npRandomNext = npRandomNext;

    /* ---------- after an online game: the same group stays together (Inna, Nov 2026) ----------
       The result screen gets a box: the host (the first player who is still here) picks the next game: the same one
       again, a random one, or any game that fits the group. In a Random Game session it shows the standings and
       "Next game", and after the last game the champion. Everyone still on the result screen moves on together. */
    function npRematchSlot(slot) {
      if (NP.rm) { try { NP.rm.close(); } catch (e) {} NP.rm = null; }
      const L = NP.last;
      if (!slot || !L || !L.uids || L.uids.length < 2 || typeof NET === 'undefined' || !NET.on || !GAME_MODS[L.game]) return;
      const me = NET.me.id;
      if (!L.uids.includes(me)) return;
      const ch = NET.channel('rm:' + L.code, { name: NET.me.name, avatar: NET.me.avatar, at: Date.now() });
      NP.rm = ch;
      const ses = L.sel && L.sel.session ? JSON.parse(JSON.stringify(L.sel.session)) : null;
      // everyone who just played is assumed to be here (the "who's here" list arrives a moment later): the choices
      // show at once, and a player only counts as gone after 10 s missing (Inna, Nov 2026: "player left" showed after
      // every game even when nobody left, and the next-game choice came late)
      // ...except players who left DURING the game (their seat was handed to a computer): they never count (Inna, Nov 2026:
      // "a player who already left still joined the next game")
      const leftU = new Set(((NP.S && NP.S.seats) || []).filter((x) => x && x.left && x.uid && x.uid !== me).map((x) => x.uid));
      const seen = {}; L.uids.forEach((u) => { seen[u] = leftU.has(u) ? 0 : Date.now(); });
      const byes = new Set(leftU);
      const here = (u) => u === me || (!byes.has(u) && Date.now() - (seen[u] || 0) < 10000);
      let present = L.uids.filter(here), gone = false, picking = false, autoT = null, autoLeft = 3;
      // leaving the result screen (Back to lobby, closing it, closing the tab) tells the others at once
      const bye = () => { if (gone) return; gone = true; try { ch.send('bye', {}); } catch (e) {} setTimeout(() => { try { ch.close(); } catch (e) {} }, 400); if (NP.rm === ch) NP.rm = null; window.removeEventListener('pagehide', bye); };
      window.addEventListener('pagehide', bye);
      let shown = false;
      const missingT = setInterval(() => { if (gone) return clearInterval(missingT); const vis = document.body.contains(slot) && slot.getClientRects().length > 0; if (vis) shown = true; else if (shown || !document.body.contains(slot)) { clearInterval(missingT); return bye(); } const was = present.join(); present = L.uids.filter(here); if (present.join() !== was) paint(); }, 1000);
      const pts = {}; const myP = (typeof POINTS !== 'undefined' && POINTS.last && Date.now() - POINTS.last.at < 60000) ? POINTS.last.p : 0; pts[me] = myP;
      const others = () => L.uids.filter((u) => u !== me && present.includes(u));
      const group = () => L.uids.filter((u) => u === me || present.includes(u));
      const leader = () => group()[0];
      const nm = (u) => esc(L.names[u] || (u === me ? NET.me.name : 'Player'));
      const total = (u) => ((ses && ses.sc && ses.sc[u]) || 0) + (pts[u] || 0);
      const standings = () => { const all = Object.keys(Object.assign({}, (ses && ses.names) || {}, L.names)).filter((u) => L.uids.includes(u) || (ses && ses.sc && ses.sc[u]));
        return all.sort((a, b) => total(b) - total(a)); };
      const table = () => `<div class="np-st">${standings().map((u, i) => `<div class="${u === me ? 'me' : ''}"><span class="rk">${i + 1}</span><span class="nm">${i === 0 && ses && ses.k >= ses.n ? '👑 ' : ''}${nm(u)}</span><span class="pl">${pts[u] !== undefined ? '+' + pts[u] : ''}</span><b>${total(u)}</b></div>`).join('')}</div>`;
      const paint = () => {
        if (gone || !document.body.contains(slot)) return;
        const o = others(), lead = leader() === me;
        if (!o.length) { slot.innerHTML = '<div class="text-xs text-muted pt-2">The other players have left the table.</div>'; return; }
        const n = group().length;
        if (ses) {
          const last = ses.k >= ses.n, ag = document.getElementById('g-modal-again'); if (ag) ag.style.display = 'none';
          slot.innerHTML = `<div class="pt-3 text-left space-y-2"><div class="pix text-sm text-amber">${last ? '🏆 SESSION OVER · CHAMPION: ' + nm(standings()[0]).toUpperCase() : `RANDOM SESSION · AFTER GAME ${ses.k} OF ${ses.n}`}</div>${table()}
            ${lead ? `<button id="np-next" class="btn-game btn-amber w-full py-2.5 text-sm">${last ? '🔁 New session' : `🎲 Next game (${ses.k + 1} of ${ses.n})${autoT ? ' · ' + autoLeft : ''}`}</button>` : `<div class="text-xs text-muted">${last ? '' : `Next game (${ses.k + 1} of ${ses.n}) in ${Math.max(0, autoLeft)}...`}</div>`}</div>`;
          const b = document.getElementById('np-next'); if (b) b.onclick = () => next(last ? 'newses' : 'random');
          return;
        }
        if (!lead) { slot.innerHTML = `<div class="pt-3 text-sm text-muted">Everyone stays together: <b class="text-bone">${nm(leader())}</b> is choosing the next game...</div>`; return; }
        const fits = npFitGames(n).filter((g) => g !== L.game);
        slot.innerHTML = `<div class="pt-3 space-y-2 text-left"><div class="pix text-xs text-muted">NEXT GAME · EVERYONE STAYS TOGETHER</div>
          <div class="grid grid-cols-2 gap-2"><button id="np-rm" class="btn-game btn-teal py-2.5 text-sm">🔁 ${esc(npGameName(L.game))} again</button><button id="np-rnd" class="btn-game btn-amber py-2.5 text-sm">🎲 Random game</button></div>
          <button id="np-other" class="btn-game btn-graphite w-full py-2 text-xs">Pick another game (${fits.length} fit ${n} players) ▾</button>
          <div id="np-grid" class="np-ngrid hidden">${fits.map((g) => `<button data-ng="${g}"><span class="spr">${GICONS[(GAME_MODS[g] || {}).icon] || ''}</span>${esc(npGameName(g))}</button>`).join('')}</div></div>`;
        document.getElementById('np-rm').onclick = () => next('same');
        document.getElementById('np-rnd').onclick = () => next('random');
        document.getElementById('np-other').onclick = () => document.getElementById('np-grid').classList.toggle('hidden');
        slot.querySelectorAll('[data-ng]').forEach((b) => { b.onclick = () => next(b.dataset.ng); });
      };
      // the leader decides; the choice goes to everyone still here
      const next = (what) => {
        if (gone || picking || leader() !== me) return; picking = true; SFX.play('click');
        const g = group(), n = g.length, bots = L.bots || 0, code = generateRoomCode();
        let game, sel, session = null;
        if (what === 'newses' && ses) { session = Object.assign({}, ses, { k: 1, played: [], sc: {} }); game = npRandomNext(n, bots, session); sel = npNextSel(game, n, bots, { rnd: 1, quick: session.spd === 'quick' ? 1 : 0 }); session.played = [game]; }
        else if (ses) { session = Object.assign({}, ses, { k: ses.k + 1, sc: Object.fromEntries(standings().map((u) => [u, total(u)])) }); game = npRandomNext(n, bots, session); session.played = (ses.played || []).concat(game); sel = npNextSel(game, n, bots, { rnd: 1, quick: session.spd === 'quick' ? 1 : 0 }); }
        else if (what === 'same') { game = L.game; sel = Object.assign({}, L.sel, { net: 'room', rematch: n, rmRanked: L.ranked, rmBots: bots }); }
        else if (what === 'random') { game = npRandomNext(n, bots, { played: [L.game] }); sel = npNextSel(game, n, bots, { rnd: 1 }); }
        else { game = what; sel = npNextSel(game, n, bots); }
        if (session) session.names = Object.assign({}, session.names || {}, L.names);
        const d = { code, n, game, sel, session };
        ch.send('go', d); go(d, true);
      };
      const go = (d, lead) => {
        if (gone) return; gone = true; if (autoT) clearInterval(autoT);
        setTimeout(() => ch.close(), 500); NP.rm = null;
        npGoNext(d, lead);
      };
      ch.on('go', (d) => { if (d && d.code && d.game) go(d, false); });
      ch.on('pts', (d, from) => { if (d && isFinite(d.p)) { pts[from] = Math.max(0, Math.min(40, +d.p)); paint(); } });
      ch.presence((list) => { const now = Date.now(); list.forEach((x) => { seen[x.uid] = now; }); const was = present.join(); present = L.uids.filter(here); if (present.join() !== was) paint(); });
      ch.on('bye', (d, from) => { if (!from || from === me) return; byes.add(from); present = L.uids.filter(here); paint(); });
      const keepSeen = setInterval(() => { if (gone || !document.body.contains(slot)) return clearInterval(keepSeen); try { (ch.members ? ch.members() : []).forEach((x) => { seen[x.uid] = Date.now(); }); } catch (e) {} }, 2000);
      // tell the others how many points this game gave me (for the session standings)
      const sayPts = () => { if (!gone) ch.send('pts', { p: myP }); };
      ch.ready && ch.ready.then ? ch.ready.then(() => { sayPts(); setTimeout(sayPts, 1500); }) : setTimeout(sayPts, 500);
      // in a session the next game starts by itself after a short countdown (the leader can press it sooner)
      if (ses && ses.k < ses.n) autoT = setInterval(() => { if (gone || !document.body.contains(slot)) return clearInterval(autoT); autoLeft--; if (autoLeft <= 0 && leader() === me) { clearInterval(autoT); autoT = null; next('random'); } else paint(); }, 1000);
      paint();
    }

    // after the password-reset email link: ask for the new password
    NET.onRecovery = () => {
      setTimeout(async () => {
        const pw = prompt('Choose a new password (at least 8 characters):');
        if (!pw || pw.length < 8) return showToast('Password not changed: it needs at least 8 characters.', 'error');
        const r = await NET.setPassword(pw);
        showToast(r && r.error ? r.error : 'Password changed!', r && r.error ? 'error' : 'success');
      }, 300);
    };

    /* ---------- rejoining a table after a reload, a closed tab or a lost connection (Nov 2026) ---------- */
    function npRemember(o) {
      try { localStorage.setItem('ps_np_cur:' + (NET.me && NET.me.id), JSON.stringify({ code: o.code, game: o.game, start: o.start, net: o.net, ranked: !!o.ranked, uid: NET.me && NET.me.id, at: Date.now() })); } catch (e) {}
    }
    function npSaved() {
      try { const v = JSON.parse(localStorage.getItem('ps_np_cur:' + (NET.me && NET.me.id)) || 'null'); if (v && v.code && Date.now() - v.at < 3 * 3600e3 && NET.me && v.uid === NET.me.id && GAME_MODS[v.game]) return v; } catch (e) {}
      return null;
    }
    async function npRejoin(sv) {
      const m = GAME_MODS[sv.game]; if (!m || !m.online || !NET.on) return;
      document.getElementById('np-rj') && document.getElementById('np-rj').remove();
      openGame(sv.game); await new Promise((r) => setTimeout(r, 350));
      const body = document.getElementById('gs-body'); if (!body) return;
      body.innerHTML = '<div class="win max-w-md mx-auto my-10 p-6 text-center space-y-2"><div class="pix text-xl text-amber">REJOINING...</div><div class="text-sm text-muted">Getting the moves you missed from the other players.</div></div>';
      const ch = NET.channel(sv.code, { name: NET.me.name, avatar: NET.me.avatar, at: Date.now() });
      await ch.ready;
      const got = await new Promise((res) => {
        let from = null, parts = [], done = false;
        const fin = (v) => { if (done) return; done = true; clearInterval(iv); clearTimeout(to); res(v); };
        ch.on('rejoin-ok', (d, who) => {
          if (!d || d.to !== NET.me.id) return;
          if (d.over) return fin({ over: true });
          if (from && who !== from) return; from = who;
          parts[d.part] = d.list || [];
          if (parts.filter(Boolean).length === d.total) fin({ log: [].concat(...parts) });
        });
        const ask = () => ch.send('rejoin', {}); ask();
        const iv = setInterval(ask, 3000), to = setTimeout(() => fin(null), 15000);
      });
      if (!got || got.over || activeGame !== sv.game) {
        try { localStorage.removeItem('ps_np_cur:' + (NET.me && NET.me.id)); } catch (e) {}
        ch.close(); showToast(got && got.over ? 'That game has already finished.' : 'Could not find that table any more. The game may have ended.', 'error');
        if (activeGame === sv.game) navigateTo('play', true);
        return;
      }
      const seats = JSON.parse(JSON.stringify(sv.start.seats)), me = seats.findIndex((x) => x.uid === NET.me.id);
      if (me < 0) { ch.close(); return; }
      NP.catchup = true;
      const S = npOnline({ code: sv.code, ch, seats, me, seed: sv.start.seed, sel: sv.start.sel, ranked: sv.ranked, room: null });
      NP.table = sv.code; if (window.ROUTER) ROUTER.sync(); if (typeof CHAT !== 'undefined') CHAT.mode = 'table'; if (typeof chatOnView === 'function') chatOnView('game');
      body.innerHTML = '';
      m.online.start(body, Object.assign({}, sv.start.sel, { net: sv.net, room: sv.code }), S);
      GT.started = true; GT.over = false;
      npRemember(sv);
      S._load(got.log);
      // replay at full speed until every missed move has been used, then play on as normal
      const t0 = Date.now(); let calm = 0;
      await new Promise((res) => { const iv = setInterval(() => { calm = S._idle() ? calm + 1 : 0; if (calm >= 4 || Date.now() - t0 > 25000) { clearInterval(iv); res(); } }, 80); });
      NP.catchup = false;
      S._kick(); window.dispatchEvent(new Event('resize'));
      SFX.play('reveal'); showToast('Welcome back! You are in your seat again.', 'success');
    }
    window.npRejoin = npRejoin;
    // when the page connects, offer to go back to the table you were at
    document.addEventListener('ps-online', () => setTimeout(() => {
      const sv = npSaved(); if (!sv || (NP.S && NP.S.online) || document.getElementById('np-rj') || NP.joining === sv.code) return;
      const nm = (GAME_MODS[sv.game] || {}).name || 'game';
      const el = document.createElement('div'); el.id = 'np-rj'; el.className = 'np-rj';
      el.innerHTML = `<div class="font-bold text-bone">You were in a ${esc(nm)} game (room ${esc(sv.code)}).</div><div class="text-sm text-muted">Go back to your seat?</div>
        <div class="flex gap-2 mt-2"><button class="btn-game btn-amber px-5 py-2" data-rj="yes">Rejoin</button><button class="btn-game btn-graphite px-4 py-2" data-rj="no">No thanks</button></div>`;
      document.body.appendChild(el);
      el.querySelector('[data-rj="yes"]').onclick = () => { el.remove(); npRejoin(sv); };
      el.querySelector('[data-rj="no"]').onclick = () => { el.remove(); try { localStorage.removeItem('ps_np_cur:' + (NET.me && NET.me.id)); } catch (e) {} };
    }, 600));
