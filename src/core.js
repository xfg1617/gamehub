    /* =========================================================================
       9. MORE GAMES: shared framework (registry, lobby shelves, stats, timers, sounds)
       ========================================================================= */
    const GAME_MODS = {};
    let activeGame = null;
    const GT = { cur: 0, timers: new Set(), raf: new Set(), ints: new Set(), ons: [], started: false, over: false };
    // event listeners that are removed automatically when you leave a game
    function gOn(target, type, fn, opts) { target.addEventListener(type, fn, opts); GT.ons.push([target, type, fn, opts]); }

    // timers that are cleaned up automatically when you leave a game
    function gTimeout(fn, ms) {
      const t = { id: null };
      t.id = setTimeout(() => { GT.timers.delete(t); fn(); }, ms);
      GT.timers.add(t);
      return t;
    }
    function gClear(t) { if (t) { clearTimeout(t.id); GT.timers.delete(t); } }
    function gInterval(fn, ms) { const t = { id: setInterval(fn, ms) }; GT.ints.add(t); return t; }
    function gClearInt(t) { if (t) { clearInterval(t.id); GT.ints.delete(t); } }
    function gRaf(fn) { const t = { id: 0 }; t.id = requestAnimationFrame((x) => { GT.raf.delete(t); fn(x); }); GT.raf.add(t); return t; }
    function gSleep(ms) { const tok = GT.cur; return new Promise((res) => gTimeout(() => res(tok === GT.cur), ms)); } // resolves false if you left the game

    /* ---------- CHAT ----------
       A global chat on the main menu and a chat room inside every game.
       PROTOTYPE: there is no server yet, so the other people in the rooms are simulated players.
       Your own messages are kept in this browser. To make it real, only chatSend() and the
       simulated-player timer need to talk to a chat server instead. */
    const CHAT_PEOPLE = [['SaltyKraken', '🐙'], ['SunnyBear', '🐻'], ['NightOwl', '🦉'], ['FinShark', '🦈'], ['PixelPanda', '🐼'], ['RoarRex', '🦖'], ['LuckyLlama', '🦙'], ['TacoTiger', '🐯'], ['DizzyDuck', '🦆'], ['BlueJay', '🐦'], ['MossyFrog', '🐸'], ['HoneyBadger', '🦡'], ['CosmoCat', '🐱'], ['RocketRaccoon', '🦝']];
    const CHAT_GENERIC = ['gg everyone', 'anyone up for a rematch?', 'this one is close!', 'lol', 'ok that was lucky', 'nice one!', 'brb snack run', 'i keep losing to the bot 😩', 'one more round then bed', 'who else is on the east coast?'];
    const CHAT_LINES = {
      global: ['anyone want to play naval grid?', 'daily word was tough today', 'pool physics on here are wild', 'just hit a 6 game streak 🔥', 'who wants to start a tycoon game', 'what is everyone playing tonight?', 'hi from texas 👋', 'poker table needs one more', 'the chess bot on hard is no joke', 'got 3 stars on word connect finally', 'hello hello', 'hot potato cats is chaos lol'],
      chess: ['castle early, trust me', 'that knight fork tho', 'hard bot found mate in 3 on me', 'italian or sicilian?', 'never trade your queen for 2 pawns lol'],
      checkers: ['forced captures get me every time', 'kings are so op', 'double jump!!', 'medium bot is perfect for practice'],
      pool: ['the bank shot preview is so good', 'scratched on the 8 again 😭', 'draw shots are finally clicking', 'break harder!'],
      poker: ['all in or nothing 😤', 'the river was brutal', 'who keeps raising lol', 'folded aces once, never again', 'blinds are getting big'],
      blackjack: ['always split aces', 'dealer had 21 AGAIN', 'doubled on 11 and won 💰', 'stand on 17 people'],
      bowling: ['first strike of the night!', 'that curve is nasty', 'spare city', 'gutter ball lol'],
      wordconnect: ['found a 7 letter word!', 'stuck on the last 4 letter one', 'hint button saved me', 'how is that a word lol'],
      impostor: ['sus', 'i think it is the one who said "round"', 'my hint was too obvious', 'impostor won again 😂'],
      kittens: ['who has the defuse 👀', 'nope nope nope', 'pounce on me again and see', 'KABOOM'],
      colorclash: ['wild +4 for you 😈', 'forgot to say CLASH lol', 'reverse reverse', 'one card left!!'],
      tycoon: ['buy the orange set, trust', 'rent on the blue ones hurts', 'jail again 😭', 'doubles!!', 'who owns all the railroads'],
      doodle: ['my drawing is a masterpiece', 'is that a horse or a dog', 'the chain went so off track lol', '10/10 doodle'],
      naval: ['B7 every time', 'my carrier is hiding 😏', 'sunk your sub!', 'corner ships are sneaky'],
      c4: ['center column first', 'blocked you!', 'four in a row, diagonal 😎', 'that was close'],
      daily: ['no spoilers please!', 'got it in 3 today', 'started with CRANE again', 'that word was evil'],
    };
    const CHAT_QUICK = { global: ['👋 Hi all', 'Anyone up for a game?', 'GG', '😂'], _game: ['Good luck!', 'Nice move!', 'GG', 'Rematch?', '😂', '🔥'] };
    const CHAT_REPLY = [
      [/^(hi|hey|hello|yo|sup|hiya)\b/i, ['hey {me}!', 'yo {me} 👋', 'hi hi', 'welcome {me}!', 'hey hey']],
      [/\bgg\b|good game/i, ['gg!', 'ggs 🤝', 'gg wp']],
      [/good luck|gl\b/i, ['you too!', 'thanks, gl!', 'may the dice be kind 🎲']],
      [/rematch|play|game\?|anyone up/i, ['i\'m in!', 'sure, after this round', 'maybe later, playing pool rn', 'yes! send a room code']],
      [/nice|wow|great/i, ['thanks 😄', 'right??', 'pure luck lol']],
      [/\?\s*$/, ['hmm good question', 'not sure tbh', 'i think so?', 'ask me after this round lol']],
      [/lol|haha|lmao|😂/i, ['😂', 'lol', 'haha']],
    ];
    const CHAT = { rooms: {}, room: null, open: false, unread: 0, next: {}, typing: {}, here: {} };
    const chatKeyFor = (view) => (view === 'game' ? (typeof NP !== 'undefined' && NP.table && CHAT.mode !== 'game' ? 't:' + NP.table : activeGame) : view === 'naval' ? 'naval' : view === 'connect4' ? 'c4' : view === 'daily' ? 'daily' : null);
    const chatRoomName = (k) => (k === 'global' ? 'Global chat' : String(k).startsWith('t:') ? `Table ${k.slice(2)} chat` : ((GAME_MODS[k] && GAME_MODS[k].name) || { naval: 'Naval Grid', c4: 'Four-in-a-Row', daily: 'Daily Word' }[k] || 'Game') + ' room');
    function chatLoad() { try { const d = JSON.parse(localStorage.getItem('ps_chat_v1') || '{}'); if (d && typeof d === 'object') CHAT.rooms = d; } catch (e) {} }
    function chatSave() { try { localStorage.setItem('ps_chat_v1', JSON.stringify(CHAT.rooms)); } catch (e) {} }
    function chatHere(k) { if (!CHAT.here[k]) CHAT.here[k] = shuffle(CHAT_PEOPLE).slice(0, k === 'global' ? 9 : 3 + rnd(3)); return CHAT.here[k]; }
    function chatMsgs(k) {
      if (NET.on) return (CHAT.net[k] = CHAT.net[k] || []);
      // offline (no connection): no made-up people, just your own messages (Inna, Nov 2026)
      CHAT.rooms[k] = (CHAT.rooms[k] || []).filter((m) => m.me);
      return CHAT.rooms[k];
    }
    const chatTime = (at) => new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const chatMsgHTML = (m, isNew) => `<div class="chat-msg ${m.me ? 'me' : ''} ${isNew ? 'new' : ''}"><span class="av">${esc(m.a)}</span><div class="min-w-0 flex-1"><div>${m.uid && !m.me ? `<button class="who" data-uid="${esc(m.uid)}" title="See ${esc(m.n)}'s player card">${esc(m.n)}</button>` : `<span class="who">${esc(m.n)}</span>`}<span class="tm">${chatTime(m.at)}</span>${m.id && !m.me ? `<button class="chat-rep" data-rep="${m.id}" title="Report this message" aria-label="Report this message">⚑</button>` : ''}</div><div class="tx">${esc(m.t)}</div></div></div>`;
    // build a chat box (list + typing line + quick phrases + input) inside host, for room k
    function chatMount(host, k) {
      if (!host) return;
      const quick = k === 'global' ? CHAT_QUICK.global : CHAT_QUICK._game;
      host.innerHTML = `<div class="chatbox" data-room="${k}"><div class="chat-list"></div><div class="chat-typing"></div>
        <div class="chat-quick">${quick.map((q) => `<button type="button">${esc(q)}</button>`).join('')}</div>
        <form class="chat-form" autocomplete="off"><input maxlength="200" placeholder="Say something nice…" aria-label="Chat message"><button type="submit">Send</button></form></div>`;
      const box = host.firstElementChild, input = box.querySelector('input');
      box.querySelector('form').onsubmit = (e) => { e.preventDefault(); chatSend(box.dataset.room, input.value); input.value = ''; };
      box.querySelectorAll('.chat-quick button').forEach((b) => { b.onclick = () => chatSend(box.dataset.room, b.textContent); });
      ['keydown', 'keyup', 'keypress'].forEach((t) => input.addEventListener(t, (e) => e.stopPropagation())); // typing here never moves a game piece
      // report a message (online only): 3 reports hide it for everyone
      box.querySelector('.chat-list').onclick = (e) => {
        const who = e.target.closest('[data-uid]'); if (who && typeof openPlayerCard === 'function') return openPlayerCard(who.dataset.uid);
        const b = e.target.closest('[data-rep]'); if (!b || !NET.on) return;
        askConfirm({ title: 'REPORT MESSAGE?', sub: 'Report this message as rude or unsafe? Messages reported by several players are hidden.', yes: 'Report', no: 'Cancel' })
          .then((ok) => { if (ok) NET.report(+b.dataset.rep, 'reported').then(() => showToast('Thanks, the message was reported.', 'success')).catch(() => showToast('Already reported.', 'info')); });
      };
      chatPaint(box);
    }
    function chatPaint(box, newest) {
      if (!box) return;
      const k = box.dataset.room, list = box.querySelector('.chat-list'), ms = chatMsgs(k);
      const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
      if (newest && list.childElementCount) list.insertAdjacentHTML('beforeend', chatMsgHTML(newest, true));
      else list.innerHTML = ms.map((m) => chatMsgHTML(m)).join('') || '<div class="chat-sys">No messages yet. Say hi!</div>';
      while (list.childElementCount > 60) list.firstElementChild.remove();
      if (nearBottom || newest && newest.me || !newest) list.scrollTop = list.scrollHeight;
      const ty = box.querySelector('.chat-typing'); if (ty) ty.textContent = CHAT.typing[k] ? `${CHAT.typing[k]} is typing…` : '';
    }
    const chatBoxes = (k) => [...document.querySelectorAll(`.chatbox[data-room="${k}"]`)];
    function chatPost(k, m) {
      const ms = chatMsgs(k); ms.push(m); if (ms.length > 60) ms.splice(0, ms.length - 60);
      if (!NET.on) chatSave();
      chatBoxes(k).forEach((b) => chatPaint(b, m));
      const shown = chatBoxes(k).some((b) => !b.closest('#chat-panel') && b.offsetParent);   // e.g. the room's own chat is on screen
      if (k !== 'global' && k === CHAT.room && !CHAT.open && !m.me && !shown) { CHAT.unread++; chatBadge(); chatPopup(m, () => chatToggle(true)); }
    }
    // a new message pops up for a few seconds (near the chat button), then fades; the button keeps the unread count
    function chatPopup(m, onOpen) {
      let box = document.getElementById('chat-pops');
      if (!box) { box = document.createElement('div'); box.id = 'chat-pops'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
      const el = document.createElement('button');
      el.className = 'chat-pop';
      el.innerHTML = `<span class="av">${esc(m.a || '🙂')}</span><span class="min-w-0"><span class="who">${esc(m.n || 'Player')}${m.tag ? ` <i>${esc(m.tag)}</i>` : ''}</span><span class="tx">${esc(String(m.t || '').slice(0, 140))}</span></span>`;
      el.onclick = () => { el.remove(); if (onOpen) onOpen(); };
      box.appendChild(el);
      while (box.childElementCount > 3) box.firstElementChild.remove();
      if (window.SFX) SFX.play('pop');
      setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 4500);
    }
    function chatSend(k, text) {
      text = String(text || '').trim().slice(0, 200); if (!text) return;
      if (NET.on) { NET.chatSend(k, text).then(() => SFX.play('click')).catch((e) => showToast(e.message || 'Message not sent.', 'error')); return; }
      chatPost(k, { n: profile.username, a: profile.avatar, t: text, at: Date.now(), me: true });
      SFX.play('click');
    }
    function chatTyping(k, who) { CHAT.typing[k] = who; chatBoxes(k).forEach((b) => { const ty = b.querySelector('.chat-typing'); if (ty) ty.textContent = who ? `${who} is typing…` : ''; }); }
    function chatBadge() { const b = document.getElementById('chat-badge'); if (b) { b.textContent = CHAT.unread > 9 ? '9+' : CHAT.unread; b.classList.toggle('on', CHAT.unread > 0); } }
    function chatToggle(force) {
      CHAT.open = force === undefined ? !CHAT.open : force;
      const p = document.getElementById('chat-panel'); if (!p) return;
      p.classList.toggle('show', CHAT.open && !!CHAT.room);
      if (CHAT.open) { CHAT.unread = 0; chatBadge(); chatPaint(p.querySelector('.chatbox')); const i = p.querySelector('input'); if (i && window.innerWidth >= 1024) i.focus(); }
    }
    // the in-game chat button follows the game you are in
    function chatOnView(view) {
      const k = chatKeyFor(view), fab = document.getElementById('chat-fab');
      if (!fab) return;
      fab.classList.toggle('show', !!k);
      if (!k) { CHAT.room = null; chatToggle(false); return; }
      if (k !== CHAT.room) {
        CHAT.room = k; CHAT.unread = 0; chatBadge();
        document.getElementById('chat-room-name').textContent = chatRoomName(k).toUpperCase();
        // at an online table you can switch between the table's own chat and everyone playing this game
        const nameEl = document.getElementById('chat-room-name');
        let sw = document.getElementById('chat-switch');
        const atTable = view === 'game' && typeof NP !== 'undefined' && NP.table;
        if (atTable) {
          if (!sw) { sw = document.createElement('span'); sw.id = 'chat-switch'; sw.className = 'chat-switch'; nameEl.insertAdjacentElement('afterend', sw); }
          const tbl = CHAT.mode !== 'game';
          sw.innerHTML = `<button data-cm="table" class="${tbl ? 'on' : ''}">Table</button><button data-cm="game" class="${tbl ? '' : 'on'}">All players</button>`;
          sw.querySelectorAll('[data-cm]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); CHAT.mode = b.dataset.cm; chatOnView('game'); }; });
        } else if (sw) sw.remove();
        document.getElementById('chat-room-count').textContent = NET.on ? `● ${NET.count} online` : `● ${chatHere(k).length + 1} here`;
        if (NET.on) netChatRoom(k);
        chatMount(document.getElementById('chat-room'), k);
        CHAT.next[k] = Date.now() + 6000 + rnd(8000);
      }
      if (CHAT.open) chatToggle(true);
    }
    function chatInit() {
      chatLoad();
      chatMount(document.getElementById('chat-global'), 'global');
      const gc = document.getElementById('gchat-count'); if (gc) gc.textContent = `● ${chatHere('global').length + 1} chatting`;
      CHAT.next.global = Date.now() + 4000;
      // simulated players chat in whichever rooms you can currently see
      setInterval(() => {
        if (true) return; // no made-up chatters any more (online: real people; offline: just you)
        const live = [];
        if (typeof activeView !== 'undefined' && activeView === 'play') live.push('global');
        if (CHAT.room) live.push(CHAT.room);
        const now = Date.now();
        live.forEach((k) => {
          if (CHAT.typing[k] || now < (CHAT.next[k] || 0)) return;
          CHAT.next[k] = now + (k === 'global' ? 8000 + rnd(9000) : 14000 + rnd(14000));
          const [n, a] = pick(chatHere(k)), line = pick(Math.random() < 0.75 ? (CHAT_LINES[k] || CHAT_GENERIC) : CHAT_GENERIC);
          chatTyping(k, n);
          setTimeout(() => { chatTyping(k, null); chatPost(k, { n, a, t: line, at: Date.now() }); }, 1300 + rnd(1200));
        });
      }, 1000);
    }

    /* ---------- going online: real chat, real "online now", real open rooms and leaderboard ---------- */
    CHAT.net = {}; CHAT.subs = {};
    // follow a chat room on the service: load its recent messages, then add new ones as they arrive
    function netChatRoom(k) {
      if (!NET.on || CHAT.subs[k]) return;
      const toMsg = (m) => ({ id: m.id, uid: m.uid, n: m.name, a: m.avatar, t: m.text, at: m.at, me: m.uid === NET.me.id });
      CHAT.net[k] = [];
      CHAT.subs[k] = NET.chatSub(k, (m) => { if (!CHAT.net[k].some((x) => x.id === m.id)) chatPost(k, toMsg(m)); });
      NET.chatHistory(k).then((ms) => { CHAT.net[k] = ms.map(toMsg); chatBoxes(k).forEach((b) => chatPaint(b)); }).catch(() => {});
    }
    function netOpenRooms() {
      const grid = document.getElementById('open-tables-grid'); if (!grid) return;
      NET.openRooms().then((rows) => {
        const names = {}; Object.values(GAME_MODS).forEach((m) => { names[m.id] = m.name; });
        grid.innerHTML = rows.length ? rows.map((r) => `<div class="room-row" style="--c:#2DD4BF"><span class="room-ico">${GICONS[r.game] || ''}</span>
          <div class="min-w-0 flex-1"><div class="font-display font-extrabold text-sm">${esc(names[r.game] || r.game)} · ${esc(r.avatar)} ${esc(r.name)}</div><div class="pix text-xs text-muted">${GAME_MODS[r.game] && GAME_MODS[r.game].online && GAME_MODS[r.game].online.seats({}) > 2 ? 'OPEN TABLE' : `ELO ${r.elo} · RANKED`} · CODE ${esc(r.code)}</div></div>
          <button class="btn-game btn-teal py-1.5 px-4 text-sm" data-join="${esc(r.code)}" data-game="${esc(r.game)}">Join</button></div>`).join('')
          : `<div class="p-6 text-center text-sm text-muted">No open tables right now.<br>Pick a game and choose <b class="text-bone">Online · quick match</b>: others can join you here.</div>`;
        grid.querySelectorAll('[data-join]').forEach((b) => { b.onclick = () => netJoin(b.dataset.join, b.dataset.game, 'online'); });
      }).catch(() => {});
    }
    // join a room by its code: look it up, then open the right game straight into it
    function joinRoomCode(code) {
      code = String(code || '').toUpperCase();
      if (!NET.on) return showToast('Joining rooms needs the online service.', 'error');
      NET.getRoom(code).then((r) => {
        if (!r || r.status === 'done') return showToast(`Room ${code} isn't open right now.`, 'error');
        const go = () => { navigateTo('play', true); netJoin(code, r.game, r.game === 'chess' ? 'friend' : 'room'); };
        if (gameInProgress()) askConfirm({ title: 'JOIN THIS ROOM?', sub: 'Leaving will end the game you are playing.', yes: 'Join room', no: 'Stay here' }).then((ok) => ok && go()); else go();
      }).catch(() => showToast('Could not reach the online service.', 'error'));
    }
    window.joinRoomCode = joinRoomCode;
    // open a game straight into an online room
    function netJoin(code, game, kind) {
      if (!GAME_MODS[game]) return showToast('That game is not online yet.', 'error');
      SETUP_PRESET = { id: game, sel: game === 'chess' ? { opp: kind || 'friend', room: code } : { net: kind === 'online' ? 'room' : (kind || 'room'), room: code }, code };
      openGame(game);
      const go = document.querySelector('#game-root #su-go'); if (go) go.click();
    }
    // the online leaderboard: one tab per ranked game (2-player quick matches change Elo)
    let lbGame = 'chess';
    function rankedGames() {
      const ids = ['chess'].concat(Object.values(GAME_MODS).filter((m) => m.online && m.online.ranked !== false && m.id !== 'chess').map((m) => m.id));
      return ids.filter((id) => GAME_MODS[id]).map((id) => [id, id === 'navalnet' ? 'Naval Grid' : GAME_MODS[id].name]);
    }
    function netLeaderboard() {
      let box = document.getElementById('net-lb');
      if (!box) { const v = document.getElementById('view-leaderboard'); if (!v) return; box = document.createElement('div'); box.id = 'net-lb'; v.firstElementChild.insertAdjacentElement('afterend', box); }
      const view = document.getElementById('view-leaderboard');
      if (view) [...view.children].forEach((c) => { if (c !== view.firstElementChild && c !== box) c.style.display = 'none'; });   // the made-up offline board
      if (view) view.querySelectorAll('.lb-btn').forEach((b) => { const seg = b.parentElement; if (seg) seg.style.display = 'none'; });
      const games = rankedGames(), name = (games.find((g) => g[0] === lbGame) || games[0])[1];
      const head = `<div class="winbar teal"><span>RANKED ONLINE · ${esc(name.toUpperCase())}</span><span class="pix text-xs" id="net-lb-n">LIVE</span></div>
        <div class="p-3 pb-0"><div class="rp-tabs" style="flex-wrap:wrap;overflow:visible">${games.map(([id, nm]) => `<button class="rp-tab ${id === lbGame ? 'on' : ''}" data-lbg="${id}">${esc(nm)}</button>`).join('')}</div></div>`;
      box.innerHTML = `<div class="win overflow-hidden">${head}<div class="p-4 text-sm text-muted">Loading...</div></div>`;
      const wire = () => box.querySelectorAll('[data-lbg]').forEach((b) => { b.onclick = () => { lbGame = b.dataset.lbg; SFX.play('click'); netLeaderboard(); }; });
      wire();
      const want = lbGame;
      NET.leaderboard(lbGame).then((rows) => {
        if (want !== lbGame) return;
        box.innerHTML = `<div class="win overflow-hidden">${head}
          ${rows.length ? `<div class="divide-y-2 divide-ink mt-3">${rows.map((r, i) => `<div class="flex items-center gap-3 px-4 py-2 ${r.id === NET.me.id ? 'bg-elevated' : ''}"><span class="pix text-amber w-8">#${i + 1}</span><span class="text-lg">${esc(r.avatar)}</span><span class="font-bold flex-1 min-w-0 truncate">${esc(r.name)}${r.id === NET.me.id ? ' <span class="pix text-xs text-teal">YOU</span>' : ''}</span><span class="text-xs text-muted">${r.wins}W ${r.losses}L ${r.draws}D</span><span class="pix text-lg text-bone w-14 text-right">${r.elo}</span></div>`).join('')}</div>`
            : `<div class="p-4 text-sm text-muted">No ranked ${esc(name)} games yet. Play an <b class="text-bone">Online · quick match</b> to be first on the board!</div>`}</div>`;
        const n = document.getElementById('net-lb-n'); if (n) n.textContent = `${rows.length} PLAYERS`;
        wire();
      }).catch(() => {});
    }
    document.addEventListener('ps-online', () => {
      if (typeof syncProfileUI === 'function') syncProfileUI();   // shows "Sign up · Log in" now that accounts are reachable
      CHAT.net = {};
      netChatRoom('global'); if (CHAT.room) netChatRoom(CHAT.room);
      NET.onOnline((n) => {
        const oc = document.getElementById('online-count'); if (oc) oc.textContent = n;
        const gc = document.getElementById('gchat-count'); if (gc) gc.textContent = `● ${n} online`;
        const rc = document.getElementById('chat-room-count'); if (rc && CHAT.room) rc.textContent = `● ${n} online`;
      });
      if (typeof activeView !== 'undefined' && activeView === 'play') netOpenRooms();
      setInterval(() => { if (!document.hidden && typeof activeView !== 'undefined' && activeView === 'play') netOpenRooms(); }, 10000);
    });

    /* ---------- CHIPS: hand-drawn casino chips for Poker and Blackjack ----------
       chipSVG(value, size) is one chip seen from above; stackSVG(amount) draws the amount as
       little towers of chips seen from the side (biggest value on the left). */
    const CHIP_DEN = [
      { v: 1000, body: '#FB923C', dark: '#C2410C', edge: '#F7F4EC', txt: '#050E18', lab: '1K' },
      { v: 500, body: '#2DD4BF', dark: '#0F766E', edge: '#F7F4EC', txt: '#050E18', lab: '500' },
      { v: 100, body: '#1E293B', dark: '#0B1220', edge: '#F7F4EC', txt: '#F7F4EC', lab: '100' },
      { v: 25, body: '#16A34A', dark: '#0F6B31', edge: '#F7F4EC', txt: '#F7F4EC', lab: '25' },
      { v: 5, body: '#DC2626', dark: '#8F1717', edge: '#F7F4EC', txt: '#F7F4EC', lab: '5' },
      { v: 1, body: '#E8EEF5', dark: '#AEBBCB', edge: '#2563EB', txt: '#050E18', lab: '1' },
    ];
    const chipDen = (v) => CHIP_DEN.find((d) => d.v === v) || CHIP_DEN[CHIP_DEN.length - 1];
    function chipSVG(v, size = 40) {
      const d = chipDen(v);
      let edge = ''; for (let k = 0; k < 8; k++) edge += `<rect x="18" y="2.6" width="4" height="5.4" fill="${d.edge}" transform="rotate(${k * 45} 20 20)"/>`;
      return `<svg class="chip-svg" viewBox="0 0 40 42" width="${size}" height="${size * 1.05}" aria-hidden="true"><circle cx="20" cy="22" r="18.6" fill="#050E18"/><circle cx="20" cy="20" r="18.6" fill="#050E18"/><circle cx="20" cy="20" r="17" fill="${d.body}"/>${edge}<circle cx="20" cy="20" r="11.6" fill="none" stroke="${d.edge}" stroke-width="1.3" stroke-dasharray="2.3 2.1"/><circle cx="20" cy="20" r="9.6" fill="${d.dark}"/><text x="20" y="${d.lab.length > 2 ? 23.3 : 24}" text-anchor="middle" font-family="Arcade Pixel, Outfit, sans-serif" font-size="${d.lab.length > 2 ? 9.5 : 12}" fill="${d.txt}">${d.lab}</text></svg>`;
    }
    // break an amount into chips, biggest first
    function chipsFor(amount) { const out = []; let left = Math.max(0, Math.round(amount)); for (const d of CHIP_DEN) { const n = Math.floor(left / d.v); if (n) { out.push([d.v, n]); left -= n * d.v; } } return out; }
    function stackSVG(amount, o = {}) {
      const cols = chipsFor(amount).slice(0, o.cols || 5), per = o.per || 9;
      if (!cols.length) return '';
      const W = 28, H = 7 + Math.min(per, Math.max(...cols.map((c) => c[1]))) * 4 + 6;
      let g = '';
      cols.forEach(([v, n], ci) => {
        const d = chipDen(v), cx = 14 + ci * W, cnt = Math.min(n, per);
        for (let j = 0; j < cnt; j++) {
          const y = H - 10 - j * 4;
          g += `<ellipse cx="${cx}" cy="${y + 5}" rx="12.5" ry="4" fill="${d.dark}" stroke="#050E18" stroke-width="1.2"/><rect x="${cx - 12.5}" y="${y}" width="25" height="5" fill="${d.body}"/><rect x="${cx - 9}" y="${y}" width="3" height="5" fill="${d.edge}"/><rect x="${cx - 1.5}" y="${y}" width="3" height="5" fill="${d.edge}"/><rect x="${cx + 6}" y="${y}" width="3" height="5" fill="${d.edge}"/><line x1="${cx - 12.5}" y1="${y}" x2="${cx - 12.5}" y2="${y + 5}" stroke="#050E18" stroke-width="1.2"/><line x1="${cx + 12.5}" y1="${y}" x2="${cx + 12.5}" y2="${y + 5}" stroke="#050E18" stroke-width="1.2"/>`;
        }
        const ty = H - 10 - (cnt - 1) * 4;
        g += `<ellipse cx="${cx}" cy="${ty}" rx="12.5" ry="4" fill="${d.body}" stroke="#050E18" stroke-width="1.2"/><ellipse cx="${cx}" cy="${ty}" rx="7.5" ry="2.3" fill="none" stroke="${d.edge}" stroke-width="1" stroke-dasharray="1.6 1.4"/>`;
      });
      const w = cols.length * W;
      return `<svg class="chip-stack" viewBox="0 0 ${w} ${H}" width="${w * (o.scale || 1)}" height="${H * (o.scale || 1)}" aria-hidden="true">${g}</svg>`;
    }

    /* ---------- MOTION: one calm, shared pace for everything that moves ----------
       Games redraw their HTML whenever something changes. These helpers make the change
       readable instead of instant: pieces slide, dealt cards fly out of the deck, cards flip,
       removed pieces fade. Nothing here changes game state, it only animates what is drawn. */
    const MOTION = { slide: 480, hop: 260, deal: 440, flip: 340, fade: 320, stagger: 150, think: 900, ease: 'cubic-bezier(.3,.7,.25,1)' };
    const motionOff = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const _gkeys = new WeakMap(); let _gkeyN = 0;
    // a stable id for any object (a card, a token...) so it can be followed from one redraw to the next
    function gKey(o) { if (o === null || typeof o !== 'object') return String(o); let k = _gkeys.get(o); if (!k) { k = 'k' + (++_gkeyN); _gkeys.set(o, k); } return k; }
    const _ctr = (r) => [r.left + r.width / 2, r.top + r.height / 2];
    const _rect = (x) => (!x ? null : typeof x === 'string' ? (document.querySelector(x) || { getBoundingClientRect: () => null }).getBoundingClientRect() : x.getBoundingClientRect ? x.getBoundingClientRect() : x);
    // remember where every element marked data-fk="..." sits right now (call before a redraw)
    function gSnap(root) {
      const m = new Map(); if (!root) return m;
      root.querySelectorAll('[data-fk]').forEach((el) => { m.set(el.dataset.fk, { r: el.getBoundingClientRect(), face: el.dataset.face || '' }); });
      return m;
    }
    // after a redraw: things that moved slide from their old spot, new things come in from `from`
    // (an element, selector or rect, e.g. the deck), one after another; flipped cards turn over.
    function gFlip(root, before, opt = {}) {
      if (!root || !before || motionOff()) return 0;
      let n = 0, longest = 0;
      root.querySelectorAll('[data-fk]').forEach((el) => {
        const old = before.get(el.dataset.fk), now = el.getBoundingClientRect();
        if (!now.width) return;
        if (old) {
          const [ox, oy] = _ctr(old.r), [nx, ny] = _ctr(now), dx = ox - nx, dy = oy - ny, turned = old.face !== (el.dataset.face || '');
          const sw = old.r.width / now.width, sh = old.r.height / now.height;
          if (Math.abs(dx) + Math.abs(dy) > 2) {
            const ms = opt.ms || MOTION.slide;
            const k = [{ translate: `${dx}px ${dy}px`, scale: `${sw} ${sh}` }, { translate: '0 0', scale: '1 1' }];
            if (turned) k.splice(1, 0, { translate: `${dx / 2}px ${dy / 2}px`, scale: `0.02 ${(1 + sh) / 2}` });
            el.animate(k, { duration: ms, easing: MOTION.ease }); el.style.zIndex = 5; setTimeout(() => { el.style.zIndex = ''; }, ms);
            longest = Math.max(longest, ms);
          } else if (turned) { el.animate([{ scale: '1 1' }, { scale: '0.02 1.04', offset: 0.5 }, { scale: '1 1' }], { duration: MOTION.flip, easing: 'ease-in-out' }); longest = Math.max(longest, MOTION.flip); }
          return;
        }
        if (opt.enter === false) return;
        const delay = (opt.delay || 0) + n * (opt.stagger === undefined ? MOTION.stagger : opt.stagger); n++;
        const src = _rect(typeof opt.from === 'function' ? opt.from(el) : opt.from), ms = opt.enterMs || MOTION.deal;
        let k;
        if (src && src.width) {
          const [sx, sy] = _ctr(src), [ex, ey] = _ctr(now);
          k = [{ translate: `${sx - ex}px ${sy - ey}px`, scale: '0.85', opacity: 0 }, { translate: `${sx - ex}px ${sy - ey}px`, scale: '0.85', opacity: 1, offset: 0.06 }, { translate: '0 0', scale: '1', opacity: 1 }];
        } else k = [{ translate: '0 -18px', opacity: 0 }, { translate: '0 0', opacity: 1 }];
        el.animate(k, { duration: ms, delay, easing: MOTION.ease, fill: 'backwards' });
        longest = Math.max(longest, delay + ms);
      });
      return longest;
    }
    // redraw something and animate the difference in one go; returns how long the movement takes (ms)
    function gMove(root, redraw, opt) { const b = gSnap(root); redraw(); return gFlip(root, b, opt); }
    // slide one element to where it is now, starting from another element/rect and passing any waypoints
    function gSlide(el, from, opt = {}) {
      if (!el || motionOff()) return 0;
      const now = el.getBoundingClientRect(), [ex, ey] = _ctr(now);
      const pts = (Array.isArray(from) ? from : [from]).map(_rect).filter((r) => r && r.width);
      if (!pts.length) return 0;
      const per = opt.ms || MOTION.slide, ms = per * pts.length;
      const k = pts.map((r, i) => { const [x, y] = _ctr(r); return { translate: `${x - ex}px ${y - ey}px`, scale: i && opt.lift ? '1.12' : '1', offset: i / pts.length }; });
      if (opt.lift && pts.length === 1) k.push({ translate: `${(_ctr(pts[0])[0] - ex) / 2}px ${(_ctr(pts[0])[1] - ey) / 2}px`, scale: '1.12', offset: 0.5 });
      k.push({ translate: '0 0', scale: '1', offset: 1 });
      el.style.zIndex = 6; el.style.position = el.style.position || 'relative';
      el.animate(k, { duration: ms, easing: pts.length > 1 ? 'linear' : MOTION.ease, delay: opt.delay || 0, fill: 'backwards' });
      setTimeout(() => { el.style.zIndex = ''; }, ms + (opt.delay || 0));
      return ms + (opt.delay || 0);
    }
    // a piece that is about to be removed fades out where it stood (call BEFORE the redraw)
    function gGhost(el, opt = {}) {
      if (!el || motionOff()) return 0;
      const r = el.getBoundingClientRect(); if (!r.width) return 0;
      const g = el.cloneNode(true);
      g.classList.add('g-fx'); g.removeAttribute('id'); g.removeAttribute('data-fk');
      Object.assign(g.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', margin: 0, zIndex: 60, pointerEvents: 'none' });
      document.body.appendChild(g);
      const ms = opt.ms || MOTION.fade, delay = opt.delay || 0;
      g.animate([{ opacity: 1, scale: '1' }, { opacity: 0, scale: opt.scale || '0.6' }], { duration: ms, delay, easing: 'ease-in', fill: 'forwards' }).onfinish = () => g.remove();
      setTimeout(() => g.remove(), ms + delay + 400);
      return ms + delay;
    }
    // a card (any HTML) travels from one spot to another on top of everything, then disappears.
    // Resolves when it lands. Use it for moves that have no element at both ends (deck -> hand).
    function gFly(from, to, html, opt = {}) {
      const a = _rect(from), b = _rect(to);
      if (motionOff() || !a || !b || !a.width || !b.width) return Promise.resolve(true);
      const tok = GT.cur;
      const f = document.createElement('div');
      f.className = 'g-fx g-fly'; f.innerHTML = html;
      document.body.appendChild(f);
      const fr = f.getBoundingClientRect();
      const [ax, ay] = _ctr(a), [bx, by] = _ctr(b);
      Object.assign(f.style, { left: ax - fr.width / 2 + 'px', top: ay - fr.height / 2 + 'px' });
      const ms = opt.ms || MOTION.deal;
      const sc = opt.scale || 1;
      const anim = f.animate([{ translate: '0 0', scale: String(sc), rotate: '0deg' }, { translate: `${(bx - ax) / 2}px ${(by - ay) / 2 - (opt.arc || 0)}px`, scale: String(sc * 1.06), rotate: (opt.spin || 0) / 2 + 'deg', offset: 0.5 }, { translate: `${bx - ax}px ${by - ay}px`, scale: String(opt.endScale || sc), rotate: (opt.spin || 0) + 'deg' }],
        { duration: ms, delay: opt.delay || 0, easing: MOTION.ease, fill: 'both' });
      return new Promise((res) => { const done = () => { f.remove(); res(tok === GT.cur); }; anim.onfinish = done; setTimeout(done, ms + (opt.delay || 0) + 500); });
    }

    function closeActiveGame() {
      const id = activeGame;
      if (typeof NP !== 'undefined' && NP.S) { try { NP.S.leave(); } catch (e) {} NP.S = null; }
      if (typeof NP !== 'undefined') NP.table = null;
      activeGame = null; delete document.body.dataset.game;
      GT.cur++;
      GT.timers.forEach((t) => clearTimeout(t.id)); GT.timers.clear();
      GT.ints.forEach((t) => clearInterval(t.id)); GT.ints.clear();
      GT.raf.forEach((t) => cancelAnimationFrame(t.id)); GT.raf.clear();
      GT.ons.forEach(([tg, ty, fn, op]) => tg.removeEventListener(ty, fn, op)); GT.ons = [];
      document.querySelectorAll('.g-fx').forEach((el) => el.remove());
      document.body.classList.remove('show-moves');
      if (id && GAME_MODS[id] && GAME_MODS[id].close) { try { GAME_MODS[id].close(); } catch (e) {} }
      const gm = document.getElementById('g-modal'); if (gm) gm.classList.add('hidden');
    }

    function openGame(id, opts) {
      const m = GAME_MODS[id];
      if (!m) { showToast('Coming soon!'); return; }
      closeActiveGame();
      navigateTo('game');
      activeGame = id; document.body.dataset.game = id;
      chatOnView('game');
      const root = document.getElementById('game-root');
      root.innerHTML = '';
      m.open(root, opts || {});
    }

    const rnd = (n) => Math.floor(Math.random() * n);
    const pick = (a) => a[rnd(a.length)];
    function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const fmt = (n) => Number(n).toLocaleString('en-US');

    /* ---------- shell: back button + title + a body area ---------- */
    function gameShell(root, m, toolsHTML = '', maxCls = '') {
      root.innerHTML = `<div class="space-y-5 ${maxCls}" id="gs-wrap">
        <div class="panel flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div class="flex items-center gap-3.5">
            <button onclick="navigateTo('play')" class="btn-game btn-graphite px-3.5 py-2 text-xs">← Lobby</button>
            <span class="spr w-8 h-8">${GICONS[m.icon]}</span>
            <h2 class="text-lg font-extrabold text-bone">${m.name}</h2>
          </div>
          <div class="flex items-center gap-2.5 flex-wrap" id="gs-tools">${toolsHTML}<button class="btn-game btn-graphite px-3 py-2 text-xs gs-moves" onclick="toggleMoves()" title="Show the moves so far">📜 Moves</button><button class="btn-game btn-graphite px-3 py-2 text-xs" onclick="openGuide('${m.id}')" title="How to play ${esc(m.name)}">? Guide</button><button class="btn-game btn-graphite px-3 py-2 text-xs gs-snd" onclick="openSoundPanel(this)" title="Sound and music" aria-label="Sound and music">♪</button></div>
        </div>
        <div id="gs-body"></div></div>`;
      return document.getElementById('gs-body');
    }

    // full-screen games keep the move log out of the way; the 📜 Moves button shows it as a pop-out panel
    function toggleMoves(force) {
      const on = force === undefined ? !document.body.classList.contains('show-moves') : !!force;
      document.body.classList.toggle('show-moves', on);
      if (on) { const lb = document.querySelector('#game-root .logbox'); if (lb) lb.scrollTop = lb.scrollHeight; }
    }
    window.toggleMoves = toggleMoves;
    document.addEventListener('click', (e) => { if (document.body.classList.contains('show-moves') && !e.target.closest('#game-root .logbox, .gs-moves')) toggleMoves(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMoves(false); });

    /* ---------- word games: type with the phone's / iPad's own keyboard (Inna, Nov 2026) ---------- */
    // A hidden text box sits in the game; tapping the board (or the "Use my keyboard" button) focuses it, which opens
    // the device keyboard. Phone keyboards don't send normal key presses for letters, so we read what was typed:
    // the box always holds two spaces; more text = letters typed, less = Backspace. Enter comes as a real key.
    // onKey gets 'A'..'Z', '⌫' or 'ENTER'. Returns { focus, el }.
    const SENT = '  ';
    function deviceKeys(host, onKey, opts = {}) {
      if (!host) return null;
      const box = document.createElement('input');
      box.type = 'text'; box.className = 'devkb-input'; box.dataset.devkb = '1'; box.value = SENT;
      ['autocomplete', 'autocorrect', 'autocapitalize'].forEach((a) => box.setAttribute(a, 'off'));
      box.setAttribute('spellcheck', 'false'); box.setAttribute('enterkeyhint', opts.enter || 'go'); box.setAttribute('aria-label', 'Type letters');
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      host.appendChild(box);
      const reset = () => { box.value = SENT; try { box.setSelectionRange(SENT.length, SENT.length); } catch (e) {} };
      box.addEventListener('input', () => {
        const v = box.value;
        if (v.length < SENT.length) { for (let k = v.length; k < SENT.length; k++) onKey('⌫'); }
        else (v.startsWith(SENT) ? v.slice(SENT.length) : v.replace(/\s/g, '')).toUpperCase().replace(/[^A-Z]/g, '').split('').forEach((ch) => onKey(ch));
        reset();
      });
      box.addEventListener('keydown', (e) => {
        e.stopPropagation();   // the page's own keyboard shortcuts must not see these keys too
        if (e.key === 'Enter') { e.preventDefault(); onKey('ENTER'); }
        else if (e.key === 'Escape') box.blur();
      });
      box.addEventListener('focus', () => { reset(); document.body.classList.add('devkb-on'); });
      box.addEventListener('blur', () => document.body.classList.remove('devkb-on'));
      const focus = () => { box.focus({ preventScroll: true }); reset(); };
      // on touch screens: tapping the board opens the keyboard, plus a clear button for it
      if (opts.tapTarget) opts.tapTarget.addEventListener('click', () => { if (matchMedia('(pointer: coarse)').matches) focus(); });
      if (opts.button) { opts.button.classList.add('devkb-btn'); opts.button.onclick = (e) => { e.preventDefault(); focus(); }; }
      return { focus, el: box };
    }
    window.deviceKeys = deviceKeys;
    const devkbButton = () => '<button type="button" class="devkb-show btn-game btn-graphite py-1.5 px-4 text-xs">⌨ Use my keyboard</button>';
    window.devkbButton = devkbButton;

    /* ---------- a menu screen: title, a few option rows, and a start button ---------- */
    // opts: [{key,label,choices:[[value,label]], def}]
    // settings you picked last time are remembered per game
    function setupLoad(id) { try { return (JSON.parse(localStorage.getItem('ps_setup_v1') || '{}') || {})[id] || {}; } catch (e) { return {}; } }
    function setupSave(id, sel) { try { const all = JSON.parse(localStorage.getItem('ps_setup_v1') || '{}') || {}; all[id] = sel; localStorage.setItem('ps_setup_v1', JSON.stringify(all)); } catch (e) {} }
    let SETUP_PRESET = null; // filled in when you open somebody's invite link
    // short invite links on the real site: gamehub.us.com/r/CODE (the room says which game; the link preview shows the
    // game's banner and "Play <game> with <host>"). Opened as a file there is no server, so the long form stays.
    const inviteLink = (id, code, sel) => (/^https?:$/.test(location.protocol)
      ? `${location.origin}/r/${code}`
      : `${location.href.split('#')[0]}#join=${code}&g=${id}&s=${encodeURIComponent(JSON.stringify(sel))}`);
    function copyText(text, btn) {
      const done = () => { if (btn) { const old = btn.textContent; btn.textContent = 'Copied!'; btn.classList.add('copied'); setTimeout(() => { btn.textContent = old; btn.classList.remove('copied'); }, 1400); } SFX.play('click'); };
      const fallback = () => { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove(); done(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    }
    // Solo play stays for games you can play alone (Inna): which options a Solo game keeps narrowed to
    const SOLO_MODE = { wordconnect: {}, blackjack: {}, bowling: { mode: ['solo'] }, doodle: { mode: ['solo'] } };
    const PASS_PLAY = /pass\s*&\s*play/i;
    // which setup option is the computer players' level, and which one is the table size, per game
    const BOT_LEVEL = { checkers: 'lvl', c4: 'lvl', pool: 'lvl', tictactoe: 'lvl', wordduel: 'lvl', dominoes: 'lvl', isles: 'lvl', manor: 'lvl', poker: 'style', bowling: 'mode', chess: 'lvl', navalnet: 'ai' };
    const botLevelKey = (id) => BOT_LEVEL[id] || null;
    const tableSizeKey = (id) => (id === 'bowling' ? 'seats' : ['dominoes', 'colorclash', 'kittens', 'tycoon', 'isles', 'manor', 'impostor'].includes(id) ? 'n' : null);
    // the screen before a game starts: its settings, plus a room code and invite link to share
    // an option is { key, label, def, choices: [[value, 'Text'], ...], toggle?: true, hint?: '...' }
    function setupScreen(body, m, opts, onStart, blurb) {
      if (typeof NP !== 'undefined' && NP.S) { try { NP.S.leave(); } catch (e) {} NP.S = null; }
      if (typeof NP !== 'undefined' && NP.table) { NP.table = null; chatOnView('game'); }
      if (typeof NP !== 'undefined') { NP.last = null; if (NP.rm) { try { NP.rm.close(); } catch (e) {} NP.rm = null; } }
      // PLAY (Inna, Nov 2026): Online (quick match) or Private room. Games you can play alone also get Solo.
      // Pass & Play is gone. In a private room the host adds computer players and picks their level, so the
      // computer-level and player-count options live in the room, not here. Options marked  local: true  only
      // show for Solo. With no online connection the old on-this-device options stay (minus Pass & Play).
      m._opts = opts; m._onStart = onStart;
      const netOn = !!(m.online && typeof NET !== 'undefined' && NET.on);
      const solo = !!(SOLO_MODE[m.id] && !(m.online && m.online.noLocal));
      const lvKey = botLevelKey(m.id), sizeKey = tableSizeKey(m.id);
      const noPass = (o) => { const keep = o.choices.filter((c) => !PASS_PLAY.test(String(c[1]))); return keep.length === o.choices.length ? o : Object.assign({}, o, { choices: keep, def: keep.some((c) => String(c[0]) === String(o.def)) ? o.def : keep[0][0] }); };
      opts = opts.filter((o) => !/PASS & PLAY/.test(o.label)).map(noPass).filter((o) => o.choices.length);
      if (netOn) {
        const soloKeep = SOLO_MODE[m.id] || {};
        const narrow = (o) => (soloKeep[o.key] ? Object.assign({}, o, { choices: o.choices.filter((c) => soloKeep[o.key].includes(c[0])), def: soloKeep[o.key][0] }) : o);
        opts = [{ key: 'net', label: 'PLAY', def: 'room', choices: (solo ? [['here', 'Solo']] : []).concat([['quick', 'Online'], ['room', 'Private room']]),
          hint: '' }]
          .concat(opts.map((o) => {
            if (o.local || o.key === lvKey) return Object.assign({}, narrow(o), { when: (sel) => sel.net === 'here' && o.key !== lvKey && (!o.when || o.when(sel)) });
            if (o.key === sizeKey) return Object.assign({}, o, { when: (sel) => sel.net === 'quick' && (!o.when || o.when(sel)) });
            return o;
          }));
      } else opts = opts.filter((o) => o.key !== 'net');
      const netHint = (sel) => sel.net === 'here' ? 'Just you. Your best scores count on your profile.'
        : sel.net === 'quick' ? (m.online.seats({}) === 2 && m.online.ranked !== false ? 'We find you a real player. Quick matches are ranked (Elo).' : 'We find you a table with real players. Empty seats get computer players.')
        : `Your own room: you get a link to invite friends${m.online && m.online.bots === false ? '' : ', and you can add computer players'}.`;
      const saved = setupLoad(m.id);
      const preset = SETUP_PRESET && SETUP_PRESET.id === m.id ? SETUP_PRESET : null; SETUP_PRESET = null;
      const sel = {};
      opts.forEach((o) => {
        const has = (v) => v !== undefined && o.choices.some((c) => String(c[0]) === String(v));
        const v = preset && has(preset.sel[o.key]) ? preset.sel[o.key] : has(saved[o.key]) ? saved[o.key] : o.def;
        sel[o.key] = (o.choices.find((c) => String(c[0]) === String(v)) || o.choices[0])[0];
      });
      if (preset) ['rematch', 'rmRanked', 'rmBots'].forEach((k) => { if (preset.sel[k] !== undefined) sel[k] = preset.sel[k]; });   // a rematch's extra details ride along
      const code = preset ? preset.code : generateRoomCode();
      if (m.id === activeGame) { GT.started = false; GT.over = false; }
      const segHTML = (o) => `<div class="seg ${o.toggle ? '' : 'w-full'}">${o.choices.map((c) => `<button data-k="${o.key}" data-v="${c[0]}" class="seg-btn ${o.toggle ? '' : 'flex-1'} ${String(sel[o.key]) === String(c[0]) ? 'on' : ''}">${c[1]}</button>`).join('')}</div>`;
      const draw = () => {
        const vis = opts.filter((o) => !o.when || o.when(sel));
        const main = vis.filter((o) => !o.toggle && !(netOn && o.key === 'net')), toggles = vis.filter((o) => o.toggle);
        const link = inviteLink(m.id, code, netOn ? Object.assign({}, sel, { net: 'room' }) : sel);
        body.innerHTML = `<div class="win max-w-xl mx-auto overflow-hidden">
          <div class="winbar ${m.tone || 'amber'}"><span>${m.name.toUpperCase()}</span><span class="spr w-5 h-5">${GICONS[m.icon]}</span></div>
          <div class="p-6 space-y-5">
            ${netOn ? '<button id="su-back" class="pix text-xs text-amber hover:text-bone">← CHOOSE HOW TO PLAY</button>' : ''}
            <div class="flex items-center gap-4"><span class="gart" style="--c:${m.color}"><span style="display:contents">${GICONS[m.icon]}</span></span>
              <p class="text-sm text-muted leading-relaxed">${blurb || m.blurb || ''}</p></div>
            ${preset ? (preset.host ? `<div class="tip text-sm"><span class="tip-tag bg-amber">ROOM</span>Pick the settings, then press Create room. You get the invite link in the room.</div>` : `<div class="tip text-sm"><span class="tip-tag bg-emerald">JOINED</span>You joined room <b class="text-amber">${esc(code)}</b>. The host's settings are already picked.</div>`) : ''}
            ${main.map((o) => `<div><div class="pix text-xs tracking-wider text-muted mb-1.5">${o.label}</div>${segHTML(o)}${o.key === 'net' ? `<div class="set-hint">${netHint(sel)}</div>` : o.hint ? `<div class="set-hint">${o.hint}</div>` : ''}</div>`).join('')}
            ${toggles.length ? `<div><div class="pix text-xs tracking-wider text-muted mb-1">EXTRAS</div><div>${toggles.map((o) => `<div class="set-row"><div class="min-w-0"><div class="text-sm font-bold text-bone">${o.label}</div>${o.hint ? `<div class="set-hint">${o.hint}</div>` : ''}</div>${segHTML(o)}</div>`).join('')}</div></div>` : ''}
            ${!netOn ? `            <div class="room-box space-y-2.5">
              <div class="flex items-center justify-between"><span class="pix text-xs tracking-wider text-muted">ROOM CODE</span><span class="pix text-xs text-emerald">● OPEN</span></div>
              <div class="flex gap-2"><div class="room-code" id="su-code">${esc(code)}</div><button data-copy="code" class="btn-game btn-graphite px-4 text-sm">Copy code</button></div>
              <div class="pix text-xs tracking-wider text-muted pt-1">INVITE LINK</div>
              <div class="flex"><input class="room-link" id="su-link" readonly value="${esc(link)}" aria-label="Invite link"><button data-copy="link" class="btn-game btn-amber px-4 text-sm">Copy link</button></div>
              ${navigator.share ? '<button data-share="1" class="btn-game btn-teal w-full py-2 text-sm">Share invite…</button>' : ''}
              <div class="set-hint">Online play is not connected, so the link opens this game with your settings on your friend's device.</div>
            </div>` : ''}
            <button id="su-go" class="btn-game btn-${m.btn || 'amber'} w-full py-3 text-base">${!netOn || sel.net === 'here' ? 'Start game' : sel.net === 'quick' ? 'Find a game' : preset && !preset.host ? 'Join room' : 'Create room'}</button>
          </div></div>`;
        body.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => { const k = b.dataset.k; const o = opts.find((x) => x.key === k); const raw = o.choices.find((c) => String(c[0]) === b.dataset.v)[0]; sel[k] = raw; SFX.play('click'); draw(); }; });
        const cc = body.querySelector('[data-copy="code"]'); if (cc) cc.onclick = (e) => copyText(code, e.currentTarget);
        const cl = body.querySelector('[data-copy="link"]'); if (cl) cl.onclick = (e) => copyText(link, e.currentTarget);
        const sh = body.querySelector('[data-share]'); if (sh) sh.onclick = () => navigator.share({ title: `GameHub · ${m.name}`, text: `Play ${m.name} with me on GameHub! Room ${code}`, url: link }).catch(() => {});
        const li = body.querySelector('#su-link'); if (li) li.onfocus = () => li.select();
        const bk = body.querySelector('#su-back'); if (bk) bk.onclick = () => { SFX.play('click'); pickMode(); };
        body.querySelector('#su-go').onclick = () => { setupSave(m.id, sel); if (m.id === activeGame) { GT.started = true; GT.over = false; } const go = Object.assign({}, sel, { room: code }); if (netOn && sel.net && sel.net !== 'here') return npLobby(body, m, go); onStart(go); };
      };
      // the room settings: everything a private room can change while people wait (not the computer level or
      // table size: the room has its own controls for those)
      m._roomOpts = opts.filter((o) => o.key !== 'net' && !o.local && o.key !== lvKey && o.key !== sizeKey);
      const goRoom = (net) => { sel.net = net; setupSave(m.id, sel); if (m.id === activeGame) { GT.started = true; GT.over = false; } npLobby(body, m, Object.assign({}, sel, { net, room: code })); };
      // step 1 (Inna, Nov 2026): choose Solo / Online match / Private room. Online goes straight to matchmaking and
      // Private room straight into your new room, where the settings, chat and invite link are.
      function pickMode() {
        sel.net = undefined;
        const modes = (solo ? [['here', 'Solo', 'Just you. Pick your settings and play.', 'emerald']] : [])
          .concat([['quick', 'Online match', m.online.seats({}) === 2 && m.online.ranked !== false ? 'Get paired with a real player at your level. Ranked.' : 'Join a table with real players.', 'teal'],
            ['room', 'Private room', `Your own room: invite friends with a link${m.online.bots === false ? '' : ', add computer players'}, choose the settings together and chat.`, 'amber']]);
        body.innerHTML = `<div class="win max-w-xl mx-auto overflow-hidden">
          <div class="winbar ${m.tone || 'amber'}"><span>${m.name.toUpperCase()}</span><span class="spr w-5 h-5">${GICONS[m.icon]}</span></div>
          <div class="p-6 space-y-5">
            <div class="flex items-center gap-4"><span class="gart" style="--c:${m.color}"><span style="display:contents">${GICONS[m.icon]}</span></span>
              <p class="text-sm text-muted leading-relaxed">${blurb || m.blurb || ''}</p></div>
            <div class="pix text-xs tracking-wider text-muted">HOW DO YOU WANT TO PLAY?</div>
            <div class="su-modes">${modes.map(([v, t, d, c]) => `<button class="su-mode" data-mode="${v}" style="--c:${({ emerald: '#34D399', teal: '#2DD4BF', amber: '#F5B041' })[c]}"><span class="su-mode-t">${t}</span><span class="su-mode-d">${d}</span><span class="su-mode-go">▶</span></button>`).join('')}</div>
            <button class="btn-game btn-graphite w-full py-2.5 text-sm" onclick="openGuide('${m.id}')">? How to play ${esc(m.name)}</button>
          </div></div>`;
        body.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => { SFX.play('click'); const v = b.dataset.mode; if (v === 'here') { sel.net = 'here'; draw(); } else goRoom(v); }; });
      }
      if (!netOn) return draw();
      if (preset && (preset.sel.net === 'room' || preset.sel.net === 'quick')) return goRoom(preset.sel.net);
      pickMode();
    }

    // the older games (Naval Grid, Four-in-a-Row, Daily Word) get the same setup screen, in a pop-up
    const BASE_SETUP = {
      naval: {
        m: { id: 'naval', name: 'Naval Grid', icon: 'naval', color: '#2DD4BF', tone: 'teal', btn: 'teal', blurb: 'Hide your fleet, then take turns firing at the enemy grid. Sink all five ships to win.' },
        opts: [
          { key: 'where', label: 'PLAY', def: 'here', when: () => typeof NET !== 'undefined' && NET.on, choices: [['here', 'vs the Computer'], ['online', 'Online · vs a person']], hint: 'Online opens Naval Grid Online: quick match (ranked) or a private room.' },
          { key: 'ai', label: 'ENEMY ADMIRAL', def: 'smart', when: (s) => s.where !== 'online', choices: [['easy', 'Rookie'], ['smart', 'Smart']] },
          { key: 'clock', label: 'SHOT TIMER', def: 20, choices: [[15, '15 s'], [20, '20 s'], [30, '30 s']] },
          { key: 'touch', label: 'Ships may touch', toggle: true, def: 1, hint: 'Off: every ship needs open water all around it, corners too.', choices: [[1, 'Yes'], [0, 'No']] },
        ],
        go: (s) => { if (s.where === 'online' && typeof NET !== 'undefined' && NET.on) return openGame('navalnet'); NG_TOUCH = s.touch === undefined ? true : !!+s.touch; NG_TURN_SECS = +s.clock; launchNavalGrid(s.ai === 'easy' ? 'Rookie_AI' : 'Admiral_AI', s.ai === 'easy' ? 1050 : 1250, 'RANKED'); ng.aiLevel = s.ai; },
      },
      daily: {
        m: { id: 'daily', name: 'Daily Word', icon: 'daily', color: '#34D399', tone: 'emerald', btn: 'emerald', blurb: 'Guess the five-letter word in six tries. Green is the right spot, yellow is in the word.' },
        opts: [
          { key: 'puzzle', label: 'PUZZLE', def: 'today', choices: [['today', "Today's word"], ['practice', 'Practice word'], ['duel', 'Word Duel']], hint: 'Word Duel: race a friend (or the computer) to the same secret word. It can be played online.' },
          { key: 'hard', label: 'Hard mode', toggle: true, def: 0, hint: 'Letters you have found must be used in every next guess.', choices: [[0, 'Off'], [1, 'On']] },
        ],
        go: (s) => { if (s.puzzle === 'duel') return openGame('wordduel'); openDailyWord(s.puzzle === 'practice'); dw.hard = !!+s.hard; },
      },
    };
    function openSetup(key) {
      // Naval Grid online = one setup screen (Online / Private room, the computer is added in the room)
      if (key === 'naval' && typeof NET !== 'undefined' && NET.on && GAME_MODS.navalnet) return openGame('navalnet');
      if (GAME_MODS[key]) return openGame(key);
      const b = BASE_SETUP[key]; if (!b) return;
      let el = document.getElementById('bs-modal');
      if (!el) { el = document.createElement('div'); el.id = 'bs-modal'; el.className = 'hidden fixed inset-0 z-50 bg-black/80 overflow-y-auto p-4'; document.body.appendChild(el); el.onclick = (e) => { if (e.target === el) el.classList.add('hidden'); }; }
      el.innerHTML = `<div class="max-w-xl mx-auto my-4 sm:my-10"><div class="flex justify-end mb-2"><button class="btn-game btn-graphite py-1 px-3 text-sm" id="bs-close">✕ Close</button></div><div id="bs-body"></div></div>`;
      el.classList.remove('hidden');
      el.querySelector('#bs-close').onclick = () => el.classList.add('hidden');
      setupScreen(el.querySelector('#bs-body'), b.m, b.opts, (sel) => { el.classList.add('hidden'); b.go(sel); });
    }
    // Opening an invite link puts you straight into the host's room. Online, the page may still be connecting when
    // the link is read, so it waits for the connection first, then looks the room up (the room says which game it is).
    // With no online service, it opens that game's setup screen with the host's settings (each person plays their own copy).
    function handleJoinLink() {
      const h = location.hash || '', pm = /^\/r\/([A-Za-z0-9]{3,8})\/?$/.exec(location.pathname || '');
      if (!h.startsWith('#join=') && !pm) return;
      const q = new URLSearchParams(pm ? '' : h.slice(1)); const code = (pm ? pm[1] : q.get('join') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6), g = q.get('g');
      let sel = {}; try { sel = JSON.parse(q.get('s') || '{}') || {}; } catch (e) {}
      try { history.replaceState(null, '', pm ? '/' : location.href.split('#')[0]); } catch (e) {}
      if (!code) return;
      const go = (fn) => {
        if (gameInProgress()) { askConfirm({ title: 'JOIN ANOTHER ROOM?', sub: `You were invited to room ${code}. Leaving will end the game you are playing.`, yes: 'Join room', no: 'Stay here' }).then((ok) => { if (ok) { navigateTo('play', true); fn(); } }); return; }
        fn();
      };
      // no online play (none set up, or it could not connect): same game + the host's settings on this device
      const local = (why) => {
        if (!g || !(GAME_MODS[g] || BASE_SETUP[g])) { if (why) showToast(why, 'error'); return; }
        const id = g === 'navalnet' ? 'naval' : g;
        go(() => { SETUP_PRESET = { id, sel, code }; openSetup(id); showToast(why || `Room ${code}: same game and settings as your friend.`, why ? 'error' : 'success'); });
      };
      const viaNet = typeof NET !== 'undefined' && NET.mode && NET.mode !== 'off';
      if (!viaNet) return local();
      const join = () => NET.getRoom(code).then((r) => {
        if (!r || r.status === 'done') return showToast(`Room ${code} isn't open right now. Your friend may not have pressed Start yet, or the game has ended. Ask them to check and send the link again.`, 'error');
        if (!GAME_MODS[r.game]) return showToast('That game is not online yet.', 'error');
        go(() => { netJoin(code, r.game, r.game === 'chess' ? 'friend' : 'room'); showToast(`Joining room ${code}...`, 'success'); });
      }).catch(() => showToast('Could not reach the online service. Check your connection and open the link again.', 'error'));
      if (NET.on) return join();
      if (NET.failed) return local("Couldn't connect to play online, so you can play the same game on this device. Check your connection and open the link again to join your friend.");
      showToast(`Connecting to room ${code}...`);
      let done = false;
      const fin = (ok) => { if (done) return; done = true; document.removeEventListener('ps-online', onUp); document.removeEventListener('ps-offline', onDown);
        if (ok || NET.on) join(); else local("Couldn't connect to play online, so you can play the same game on this device. Check your connection and open the link again to join your friend."); };
      const onUp = () => fin(true), onDown = () => fin(false);
      document.addEventListener('ps-online', onUp); document.addEventListener('ps-offline', onDown);
      setTimeout(() => fin(false), 20000);
    }

    // ---------- "Leave this game?" — stops a misclick from throwing a game away ----------
    function askConfirm(o) {
      return new Promise((res) => {
        let el = document.getElementById('cf-modal');
        if (!el) { el = document.createElement('div'); el.id = 'cf-modal'; el.className = 'hidden fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4'; document.body.appendChild(el); }
        el.innerHTML = `<div class="win w-full max-w-sm overflow-hidden" role="alertdialog" aria-modal="true" aria-labelledby="cf-t"><div class="winbar coral"><span id="cf-t">${esc(o.title || 'ARE YOU SURE?')}</span></div>
          <div class="p-5 space-y-4"><p class="text-sm text-bone leading-relaxed">${esc(o.sub || '')}</p>
          <div class="grid grid-cols-2 gap-3"><button id="cf-no" class="btn-game btn-graphite py-2.5 text-sm">${esc(o.no || 'Stay')}</button><button id="cf-yes" class="btn-game btn-coral py-2.5 text-sm">${esc(o.yes || 'Leave')}</button></div></div></div>`;
        el.classList.remove('hidden');
        const fin = (v) => { el.classList.add('hidden'); document.removeEventListener('keydown', key, true); res(v); };
        const key = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fin(false); } };
        document.addEventListener('keydown', key, true);
        el.querySelector('#cf-no').onclick = () => fin(false);
        el.querySelector('#cf-yes').onclick = () => fin(true);
        el.onclick = (e) => { if (e.target === el) fin(false); };
        el.querySelector('#cf-no').focus();
      });
    }
    // is a game in progress on the current screen?
    function gameInProgress() {
      try {
        if (activeView === 'game') return !!(activeGame && GT.started && !GT.over && !document.querySelector('#game-root #su-go'));
        if (activeView === 'naval') return !!(ng && ng.phase === 'battle');
        if (activeView === 'connect4') return !!(c4 && !c4.over && c4.board && c4.board.some((r) => r.some((v) => v)));
        if (activeView === 'daily') return !!(dw && dw.status === 'playing' && (dw.guesses.length || dw.current));
      } catch (e) {}
      return false;
    }
    window.addEventListener('hashchange', () => handleJoinLink()); // an invite link opened in a tab that already has the hub
    window.addEventListener('beforeunload', (e) => { if (gameInProgress()) { e.preventDefault(); e.returnValue = ''; } });

    /* ---------- a turn clock: number + bar ---------- */
    function makeClock(host, mod) {
      host.innerHTML = `<div class="flex items-center gap-3"><div class="timer-box shrink-0 clk-box"><div class="lab clk-lab">Your time</div><div class="val clk-val">0:00</div></div><div class="timer-bar flex-1 clk-wrap"><span class="clk-bar"></span></div></div>`;
      const q = (s) => host.querySelector(s);
      let t = null;
      const look = (txt, pc, low) => { q('.clk-val').textContent = txt; q('.clk-bar').style.width = pc + '%'; q('.clk-box').classList.toggle('low', low); q('.clk-wrap').classList.toggle('low', low); };
      const api = {
        stop() { if (t) gClearInt(t.id); t = null; },
        idle(label, txt) { api.stop(); q('.clk-lab').textContent = label; look(txt || '...', 0, false); },
        start(sec, label, onOut, lowAt = 5) {
          api.stop();
          q('.clk-lab').textContent = label || 'Your time';
          const total = sec * 1000, end = Date.now() + total;
          t = { id: null, last: 99 };
          const tick = () => {
            const left = Math.max(0, end - Date.now()), s = Math.ceil(left / 1000), low = s <= lowAt;
            if (low && s > 0 && s !== t.last) SFX.play('tick');
            t.last = s;
            look(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, (left / total) * 100, low);
            if (left <= 0) { api.stop(); onOut && onOut(); }
          };
          t.id = gInterval(tick, 200);
          tick();
        },
      };
      return api;
    }

    /* ---------- stats + result reporting ---------- */
    function gstat(id) {
      if (!profile.stats[id]) profile.stats[id] = { played: 0, wins: 0, losses: 0, draws: 0 };
      return profile.stats[id];
    }
    // result: 'win' | 'loss' | 'draw' | 'done'. Updates counters, Elo, XP and the match log, then saves.
    function reportGame(id, result, o = {}) {
      const g = gstat(id);
      g.played++;
      if (result === 'win') { g.wins++; profile.wins++; } else if (result === 'loss') { g.losses++; profile.losses++; } else if (result === 'draw') g.draws++;
      const elo = o.elo || 0;
      profile.elo = Math.max(800, profile.elo + elo);
      recordMatch(id, result, elo, { label: o.label || '' });
      if (o.xp) awardXP(o.xp); else saveProfileToStorage();
    }

    function gameResult(o) {
      GT.over = true;
      let el = document.getElementById('g-modal');
      if (!el) { el = document.createElement('div'); el.id = 'g-modal'; el.className = 'hidden fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4'; document.body.appendChild(el); }
      const tone = o.tone || 'amber';
      const toneCls = { amber: 'bg-amber', teal: 'bg-teal', coral: 'bg-coral', emerald: 'bg-emerald' }[tone] || 'bg-amber';
      const btnCls = { amber: 'btn-amber', teal: 'btn-teal', coral: 'btn-coral', emerald: 'btn-emerald' }[tone] || 'btn-amber';
      const rows = (o.rows || []).map((r) => `<div class="stat"><div class="lab">${r[0]}</div><div class="val ${r[2] || 'text-bone'}">${r[1]}</div></div>`).join('');
      el.innerHTML = `<div class="panel w-full max-w-sm p-6 pt-9 text-center space-y-5 relative">
        <div class="icon-tile absolute -top-9 left-1/2 -translate-x-1/2 w-[72px] h-[72px] ${toneCls}"><span class="spr w-11 h-11">${SPRITES[o.sprite || 'trophy']}</span></div>
        <div class="space-y-1 pt-3"><h3 class="text-3xl font-extrabold text-bone">${o.title}</h3><p class="text-sm text-muted">${o.sub || ''}</p></div>
        ${rows ? `<div class="grid gap-2.5" style="grid-template-columns:repeat(${Math.min(3, o.rows.length)},minmax(0,1fr))">${rows}</div>` : ''}
        <div class="grid grid-cols-2 gap-3 pt-1"><button id="g-modal-lobby" class="btn-game btn-graphite py-3 text-sm">Back to Lobby</button><button id="g-modal-again" class="btn-game ${btnCls} py-3 text-sm">${o.againLabel || 'Play Again'}</button></div><div id="g-modal-rm"></div></div>`;
      el.classList.remove('hidden');
      if (typeof npRematchSlot === 'function') npRematchSlot(el.querySelector('#g-modal-rm'));
      el.querySelector('#g-modal-lobby').onclick = () => { el.classList.add('hidden'); navigateTo('play'); };
      el.querySelector('#g-modal-again').onclick = () => { el.classList.add('hidden'); o.again && o.again(); };
    }

    /* ---------- extra sounds (all made with the same synth, no files) ---------- */
    (function addSounds() {
      const t = SFX.tone, n = SFX.noise;
      SFX.def('move', () => { t({ type: 'triangle', f1: 210, f2: 120, d: 0.07, v: 0.5 }); n({ type: 'bandpass', f1: 900, q: 2, d: 0.03, v: 0.35 }); });
      SFX.def('capture', () => { t({ type: 'triangle', f1: 180, f2: 80, d: 0.12, v: 0.7 }); n({ type: 'bandpass', f1: 1400, q: 1.5, d: 0.06, v: 0.6 }); });
      SFX.def('check', () => { t({ f1: 880, d: 0.09, v: 0.22 }); t({ f1: 1175, t: 0.1, d: 0.14, v: 0.22 }); });
      SFX.def('card', () => { n({ type: 'bandpass', f1: 2400, f2: 900, q: 1.2, d: 0.07, v: 0.5 }); });
      SFX.def('deal', () => { n({ type: 'bandpass', f1: 3000, f2: 1200, q: 1, d: 0.05, v: 0.4 }); t({ f1: 420, f2: 300, d: 0.04, v: 0.1 }); });
      SFX.def('chip', () => { for (let i = 0; i < 2; i++) t({ type: 'triangle', f1: 1500 + i * 300, f2: 900, t: i * 0.055, d: 0.04, v: 0.28 }); n({ type: 'highpass', f1: 4000, d: 0.03, v: 0.15 }); });
      SFX.def('dice', () => { for (let i = 0; i < 6; i++) t({ type: 'triangle', f1: 260 + rnd(200), f2: 140, t: i * 0.07 + Math.random() * 0.03, d: 0.05, v: 0.3 }); });
      SFX.def('ball', () => { t({ f1: 1100, f2: 520, d: 0.05, v: 0.45 }); n({ type: 'highpass', f1: 3500, d: 0.02, v: 0.3 }); });
      SFX.def('rail', () => { t({ type: 'triangle', f1: 220, f2: 140, d: 0.06, v: 0.35 }); });
      SFX.def('pocket', () => { t({ f1: 160, f2: 60, d: 0.2, v: 0.7 }); n({ type: 'lowpass', f1: 800, f2: 200, d: 0.18, v: 0.4 }); });
      SFX.def('roll', () => { n({ type: 'lowpass', f1: 420, f2: 300, a: 0.05, d: 0.9, v: 0.55 }); });
      SFX.def('crash', () => { n({ type: 'highpass', f1: 2500, a: 0.002, d: 0.12, v: 0.7 }); n({ type: 'bandpass', f1: 1800, q: 1.4, d: 0.5, v: 0.5, r: 0.2 }); for (let i = 0; i < 9; i++) t({ type: 'triangle', f1: 600 + rnd(900), f2: 300, t: Math.random() * 0.5, d: 0.05, v: 0.2 }); t({ f1: 110, f2: 45, d: 0.4, v: 0.6 }); });
      SFX.def('pins', () => { for (let i = 0; i < 4; i++) t({ type: 'triangle', f1: 700 + rnd(900), f2: 350, t: Math.random() * 0.3, d: 0.05, v: 0.22 }); n({ type: 'bandpass', f1: 1500, q: 1.5, d: 0.25, v: 0.3 }); });
      SFX.def('strike', () => { SFX.play('crash'); [523, 659, 784, 1047, 1319].forEach((f, i) => t({ type: 'square', f1: f, t: 0.35 + i * 0.07, d: 0.1, v: 0.1 })); });
      SFX.def('meow', () => { t({ type: 'sawtooth', f1: 480, f2: 900, a: 0.03, d: 0.14, v: 0.12 }); t({ type: 'sawtooth', f1: 900, f2: 520, t: 0.17, a: 0.02, d: 0.2, v: 0.12 }); });
      SFX.def('nope', () => { t({ type: 'square', f1: 240, f2: 120, d: 0.2, v: 0.2 }); });
      SFX.def('draw', () => { n({ type: 'bandpass', f1: 2000, q: 2, d: 0.04, v: 0.25 }); });
      SFX.def('reveal', () => { [392, 523, 659].forEach((f, i) => t({ type: 'triangle', f1: f, t: i * 0.09, d: 0.12, v: 0.22 })); });
      SFX.def('vote', () => { t({ type: 'triangle', f1: 300, f2: 450, d: 0.08, v: 0.35 }); });
      SFX.def('coin', () => { t({ type: 'square', f1: 988, d: 0.07, v: 0.12 }); t({ type: 'square', f1: 1319, t: 0.08, d: 0.2, v: 0.12 }); });
      SFX.def('word', () => { [660, 880].forEach((f, i) => t({ type: 'triangle', f1: f, t: i * 0.07, d: 0.11, v: 0.25 })); });
      SFX.def('wrong', () => { t({ type: 'square', f1: 200, f2: 130, d: 0.14, v: 0.14 }); });
    })();

    /* ---------- the lobby catalogue (feeds the home shelves, My Profile and the rules page) ---------- */
    const CATALOG = [
      { id: 'naval', name: 'Naval Grid', icon: 'naval', sub: '1v1 · ~5 MIN', open: "openSetup('naval')", live: true, flag: 'HOT' },
      { id: 'daily', name: 'Daily Word', icon: 'daily', sub: 'SOLO · ~3 MIN', open: "openSetup('daily')", live: true, flag: 'NEW', badgeId: 'card-daily-badge' },
      { id: 'dominoes', name: 'Dominoes', icon: 'dominoes', sub: '2–4 PLAYERS', open: "showToast('Dominoes is coming soon!')", live: false },
      { id: 'trivia', name: 'Trivia Rush', icon: 'trivia', sub: '2–6 PLAYERS', open: "showToast('Trivia Rush is coming soon!')", live: false },
    ];
    const SHELVES = [
      { title: 'NEW & HOT', color: '#F5B041', ids: ['isles', 'manor', 'dominoes', 'bowling', 'chess', 'poker', 'naval', 'daily'] },
      { title: 'BOARD GAMES', color: '#2DD4BF', ids: ['chess', 'checkers', 'tycoon', 'isles', 'manor', 'naval', 'c4', 'dominoes', 'tictactoe'] },
      { title: 'CARD GAMES', color: '#FB7185', ids: ['poker', 'blackjack', 'kittens', 'colorclash'] },
      { title: 'WORD & PUZZLE', color: '#34D399', ids: ['daily', 'wordduel', 'wordconnect', 'impostor', 'trivia'] },
      { title: 'PARTY GAMES', color: '#F5B041', ids: ['impostor', 'manor', 'doodle', 'kittens', 'colorclash'] },
      { title: 'SPORTS & ARCADE', color: '#2DD4BF', ids: ['pool', 'bowling'] },
    ];

    function registerGame(m) {
      GAME_MODS[m.id] = m;
      if (m.hidden) return;   // reachable from another game's menu only (e.g. Naval Grid Online)
      CATALOG.push({ id: m.id, name: m.name, icon: m.icon, sub: m.sub, open: `openGame('${m.id}')`, live: true, flag: m.flag || 'NEW', mod: m });
      const old = GAMES.findIndex((g) => g.id === m.id);
      if (old >= 0) GAMES.splice(old, 1);
      GAMES.push({
        id: m.id, name: m.name, icon: m.icon, color: m.color, tone: m.tone || 'amber', live: true,
        unit: m.unit || 'MATCHES', play: `openGame('${m.id}')`,
        played: (p) => (p.stats[m.id] && p.stats[m.id].played) || 0,
        details: (p) => {
          const s = p.stats[m.id] || { played: 0, wins: 0, losses: 0, draws: 0 };
          const tiles = m.profileTiles ? m.profileTiles(s) : [['MATCHES', s.played, 'text-bone'], ['WIN RATE', `${pct(s.wins, s.played)}%`, 'text-emerald'], ['WON', s.wins, 'text-teal'], ['LOST', s.losses, 'text-coral']];
          const rows = (m.noScore ? '' : srow('Won – Lost – Draws', `${s.wins} – ${s.losses} – ${s.draws}`)) + (m.extraRows ? m.extraRows(s) : '');
          return { tiles, rows, extra: m.extraHTML ? m.extraHTML(s) : '' };
        },
      });
    }

    function renderShelves() {
      const host = document.getElementById('shelves');
      if (!host) return;
      const byId = {};
      CATALOG.forEach((c) => { byId[c.id] = c; });
      let seenBadge = false;
      host.innerHTML = SHELVES.map((sh) => {
        const items = sh.ids.map((id) => byId[id]).filter(Boolean);
        return `<div class="space-y-5"><h2 class="shelf-h"><span class="sq" style="background:${sh.color}"></span>${sh.title}<span class="count">${items.length}</span></h2>
          <div class="flex flex-wrap gap-x-5 gap-y-7 pl-1">${items.map((c) => {
            let flag = '';
            if (!c.live) flag = '<span class="flag flag-soon">SOON</span>';
            else if (sh.title === 'NEW & HOT' || c.id === 'daily') {
              const idAttr = c.badgeId && !seenBadge ? ` id="${c.badgeId}"` : '';
              if (c.badgeId) seenBadge = true;
              if (c.flag) flag = `<span${idAttr} class="flag ${c.flag === 'HOT' ? 'flag-hot' : ''}">${c.flag}</span>`;
            }
            return `<button class="gtile ${c.live ? '' : 'soon'}" onclick="${c.open}">
              <span class="gart">${flag}${GICONS[c.icon]}</span>
              <span><span class="gname block">${c.name}</span><span class="gsub block">${c.sub}</span></span></button>`;
          }).join('')}</div></div>`;
      }).join('');
    }

    function renderExtraRules() {
      const host = document.getElementById('rules-extra');
      if (!host) return;
      const tones = { amber: ['bg-amber', 'text-amber', 'btn-amber'], teal: ['bg-teal', 'text-teal', 'btn-teal'], coral: ['bg-coral', 'text-coral', 'btn-coral'], emerald: ['bg-emerald', 'text-emerald', 'btn-emerald'] };
      host.innerHTML = CATALOG.filter((c) => c.mod && c.mod.rules).map((c) => {
        const m = c.mod, t = tones[m.tone || 'amber'];
        return `<div class="win rule-row">
          <div class="rule-side p-6 flex flex-col justify-between gap-6">
            <div class="space-y-4"><span class="icon-tile w-16 h-16 ${t[0]}"><span class="spr w-10 h-10">${GICONS[m.icon]}</span></span>
              <div><h2 class="text-2xl font-extrabold text-bone leading-tight">${m.name}</h2><p class="pix text-xs ${t[1]} mt-1">${m.rules.tag}</p></div></div>
            <button onclick="openGame('${m.id}')" class="btn-game ${t[2]} w-full py-2.5 text-sm">Play ${m.name}</button>
          </div>
          <div class="p-6 grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">
            <ul class="space-y-4 text-sm text-muted leading-relaxed">${m.rules.steps.map((s, i) => `<li class="step"><span class="step-n">${i + 1}</span><span>${s}</span></li>`).join('')}</ul>
            <div class="tip text-xs text-muted"><span class="tip-tag ${t[0]}">TIP</span>${m.rules.tip}</div>
          </div></div>`;
      }).join('');
    }

    /* ---------- playing-card art (shared by Poker, Blackjack) ---------- */
    const SUITS = ['s', 'h', 'd', 'c'];
    const SUIT_COL = { s: '#16212E', c: '#16212E', h: '#D13B55', d: '#D13B55' };
    function suitSVG(s, size = 18) {
      const f = SUIT_COL[s];
      const p = {
        h: `<path d="M12 21 L3 12 C0 8 3 3 7.5 4.5 C9.5 5.2 11 6.5 12 8 C13 6.5 14.5 5.2 16.5 4.5 C21 3 24 8 21 12 Z" fill="${f}"/>`,
        d: `<path d="M12 2 L21 12 L12 22 L3 12 Z" fill="${f}"/>`,
        s: `<path d="M12 2 C12 2 3 9 3 14 C3 17.5 7.5 18.5 10 16 C9.5 19 8.5 20.5 7 22 H17 C15.5 20.5 14.5 19 14 16 C16.5 18.5 21 17.5 21 14 C21 9 12 2 12 2 Z" fill="${f}"/>`,
        c: `<g fill="${f}"><circle cx="12" cy="7" r="4.5"/><circle cx="6.5" cy="13.5" r="4.5"/><circle cx="17.5" cy="13.5" r="4.5"/><path d="M12 12 L9 22 H15 Z"/></g>`,
      }[s];
      return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${p}</svg>`;
    }
    const RANK_LAB = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
    const rankLab = (r) => RANK_LAB[r] || String(r);
    // card = { r: 2..14, s: 's'|'h'|'d'|'c' }
    /* ---------- seats around a card table (Inna, Nov 2026: "players at 4 sides of the table") ----------
       ringSlots(id) = the three seat places (left, across, right) for a .ring4 grid; ringFill(id, seats) puts the other
       players' seat HTML there in playing order: the next player sits on your left, then across, then right. */
    const ringSlots = (id) => `<div class="r-left" id="${id}-rl"></div><div class="r-top" id="${id}-rt"></div><div class="r-right" id="${id}-rr"></div>`;
    function ringFill(id, seats) {
      const n = seats.length, L = [], T = [], R = [];
      if (n === 1) T.push(seats[0]); else if (n === 2) { L.push(seats[0]); R.push(seats[1]); } else if (n > 2) { L.push(seats[0]); R.push(seats[n - 1]); T.push(...seats.slice(1, n - 1)); }
      [['rl', L], ['rt', T], ['rr', R]].forEach(([k, a]) => { const el = document.getElementById(id + '-' + k); if (el) el.innerHTML = a.join(''); });
    }
    window.ringSlots = ringSlots; window.ringFill = ringFill;
    function playingCardHTML(c, o = {}) {
      const fk = o.fk ? ` data-fk="${o.fk}" data-face="${!c || o.down ? 'down' : 'up'}"` : '';
      if (!c || o.down) return `<div class="pcard back ${o.cls || ''}"${fk}><div class="pc-back"></div></div>`;
      const col = SUIT_COL[c.s];
      return `<div class="pcard ${o.cls || ''}"${fk} style="color:${col}"><span class="pc-corner">${rankLab(c.r)}<i>${suitSVG(c.s, 14)}</i></span><span class="pc-mid">${suitSVG(c.s, 34)}</span><span class="pc-corner br">${rankLab(c.r)}<i>${suitSVG(c.s, 14)}</i></span></div>`;
    }
    function newDeck(n = 1) {
      const d = [];
      for (let k = 0; k < n; k++) for (const s of SUITS) for (let r = 2; r <= 14; r++) d.push({ r, s });
      return shuffle(d);
    }

    /* ---------- extra badges for the new games ---------- */
    (function addBadges() {
      const st = (p, id) => (p.stats && p.stats[id]) || {};
      BADGES.push(
        { name: 'Explorer', desc: 'Play 5 different games', sprite: 'disc', ok: (p) => GAMES.filter((g) => g.live && g.played && g.played(p)).length >= 5 },
        { name: 'Chess Mind', desc: 'Win 3 Chess games', sprite: 'crown', ok: (p) => (st(p, 'chess').wins || 0) >= 3 },
        { name: 'High Roller', desc: 'Grow your Blackjack bank to 2500 chips', sprite: 'trophy', ok: (p) => (st(p, 'blackjack').bestChips || 0) >= 2500 },
        { name: 'Pin Pal', desc: 'Score 150+ in Bowling', sprite: 'anchor', ok: (p) => (st(p, 'bowling').high || 0) >= 150 },
        { name: 'Word Master', desc: 'Earn 3 stars in Word Connect', sprite: 'tile', ok: (p) => (st(p, 'wordconnect').bestStars || 0) >= 3 },
        { name: 'Sleuth', desc: 'Spot the impostor 3 times', sprite: 'flame', ok: (p) => (st(p, 'impostor').spotted || 0) >= 3 },
      );
    })();

