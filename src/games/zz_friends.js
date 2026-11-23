    /* =========================================================================
       FRIENDS (Nov 2026, Inna): look up players, player cards, friend requests, a friends list with who is
       online, 1-to-1 friend chat, and inviting friends to your room. Needs the online service
       (backend/friends.sql). Emails are never shown: cards only have name, avatar, member since, rankings.
       ========================================================================= */
    const FR = { list: { friends: [], incoming: [], outgoing: [] }, sel: null, unread: {}, msgs: {}, off: null, started: false, q: '', results: null };
    const frOn = () => typeof NET !== 'undefined' && NET.on;
    const frGameName = (id) => (GAME_MODS[id] && GAME_MODS[id].name) || { naval: 'Naval Grid', navalnet: 'Naval Grid', c4: 'Four-in-a-Row', daily: 'Daily Word' }[id] || id;
    function friendsBadge() {
      const n = FR.list.incoming.length + Object.values(FR.unread).reduce((a, b) => a + b, 0);
      ['nav-friends-badge', 'mnav-friends-badge'].forEach((id) => { const b = document.getElementById(id); if (b) { b.textContent = n > 9 ? '9+' : n; b.classList.toggle('hidden', !n); } });
    }
    async function frLoad() {
      if (!frOn()) return;
      try { FR.list = await NET.friends(); } catch (e) { return; }
      friendsBadge();
      if (activeView === 'friends') renderFriends();
    }
    // a room link inside a message gets a Join button
    const frRoomCode = (t) => { const m = /\/r\/([A-Za-z0-9]{4,6})\b/.exec(t) || /#join=([A-Za-z0-9]{4,6})/.exec(t); return m ? m[1].toUpperCase() : null; };
    function frStart() {
      if (FR.started || !frOn()) return; FR.started = true;
      frLoad();
      let knownIn = null;
      FR.off = NET.onSocial(async (ev) => {
        if (ev.type === 'dm') {
          const list = FR.msgs[ev.from]; if (list && !list.some((x) => x.id === ev.id)) list.push(ev);
          if (activeView === 'friends' && FR.sel === ev.from) return paintFriendChat();
          FR.unread[ev.from] = (FR.unread[ev.from] || 0) + 1; friendsBadge();
          const p = await NET.profileOf(ev.from).catch(() => ({ name: 'Friend', avatar: '🙂' }));
          chatPopup({ n: p.name, a: p.avatar, t: frRoomCode(ev.text) ? '🎮 invited you to their room' : ev.text, tag: 'FRIEND' }, () => openFriendChat(ev.from));
        } else {
          const before = new Set((FR.list.incoming || []).map((x) => x.id));
          await frLoad();
          if (knownIn !== null) FR.list.incoming.filter((x) => !before.has(x.id)).forEach((x) => { showToast(`${x.name} wants to be your friend.`, 'info'); SFX.play('pop'); });
          knownIn = true;
        }
      });
      setInterval(() => { if (activeView === 'friends') paintFriendList(); }, 10000);
    }
    document.addEventListener('ps-online', frStart);

    /* ---------- the Friends page ---------- */
    function renderFriends() {
      const root = document.getElementById('friends-root'); if (!root) return;
      if (!frOn()) { root.innerHTML = `<div class="win p-6 text-center text-sm text-muted max-w-md mx-auto">Friends need the online service. Check your connection and refresh the page.</div>`; return; }
      root.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <div class="space-y-6 min-w-0">
          ${!(typeof NET !== 'undefined' && NET.account) ? `<div class="tip text-sm"><span class="tip-tag bg-amber">TIP</span>You're playing as a guest. <button class="underline text-amber font-bold" onclick="openAuthModal('signup')">Create an account</button> so your friends list follows you to any device.</div>` : ''}
          <div class="win overflow-hidden"><div class="winbar amber"><span>FIND A PLAYER</span></div>
            <div class="p-4 space-y-3"><div class="code-row"><input id="fr-q" type="text" maxlength="20" placeholder="Type a player name" aria-label="Player name" value="${esc(FR.q)}" style="letter-spacing:0;text-transform:none"><button id="fr-go">Search</button></div>
            <div id="fr-results" class="space-y-2"></div></div></div>
          <div class="win overflow-hidden"><div class="winbar teal"><span>MY FRIENDS</span><span class="pix text-xs" id="fr-count"></span></div><div id="fr-list" class="p-3 space-y-2"></div></div>
        </div>
        <div class="win overflow-hidden lg:sticky lg:top-4" id="fr-chatwin"></div>
      </div>`;
      const q = root.querySelector('#fr-q');
      const go = () => { FR.q = q.value.trim(); frSearch(); };
      root.querySelector('#fr-go').onclick = go;
      q.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') go(); };
      ['keyup', 'keypress'].forEach((t) => q.addEventListener(t, (e) => e.stopPropagation()));
      paintResults(); paintFriendList(); paintFriendChat();
    }
    const frRow = (p, right) => `<div class="fr-row"><button class="fr-who" data-card="${esc(p.id)}"><span class="avatar-tile w-9 h-9 text-xl">${esc(p.avatar)}</span>${p.dot !== undefined ? `<span class="fr-dot ${p.dot ? 'on' : ''}" title="${p.dot ? 'Online' : 'Offline'}"></span>` : ''}<span class="min-w-0"><span class="block font-bold text-bone truncate">${esc(p.name)}</span>${p.sub ? `<span class="block pix text-xs text-muted">${p.sub}</span>` : ''}</span></button><span class="flex gap-1.5 shrink-0">${right || ''}</span></div>`;
    async function frSearch() {
      const box = document.getElementById('fr-results'); if (!box) return;
      if (FR.q.length < 2) { FR.results = null; return paintResults(); }
      box.innerHTML = '<div class="text-sm text-muted">Searching...</div>';
      try { FR.results = (await NET.searchPlayers(FR.q)).filter((p) => p.id !== NET.me.id); } catch (e) { FR.results = []; }
      paintResults();
    }
    function paintResults() {
      const box = document.getElementById('fr-results'); if (!box) return;
      if (!FR.results) { box.innerHTML = '<div class="text-sm text-muted">Look up anyone by their player name, see their rankings, and add them as a friend.</div>'; return; }
      box.innerHTML = FR.results.length ? FR.results.map((p) => frRow(p, `<button class="btn-game btn-graphite py-1.5 px-3 text-xs" data-card="${esc(p.id)}">View</button>`)).join('') : '<div class="text-sm text-muted">No player with that name.</div>';
      box.querySelectorAll('[data-card]').forEach((b) => { b.onclick = () => openPlayerCard(b.dataset.card); });
    }
    function paintFriendList() {
      const box = document.getElementById('fr-list'); if (!box) return;
      const L = FR.list, fl = L.friends.map((f) => Object.assign({}, f, { dot: NET.isOnline(f.id) })).sort((a, b) => (b.dot - a.dot) || a.name.localeCompare(b.name));
      const cnt = document.getElementById('fr-count'); if (cnt) cnt.textContent = `${fl.filter((f) => f.dot).length} ONLINE · ${fl.length}`;
      box.innerHTML = (L.incoming.length ? `<div class="pix text-xs text-amber px-1">FRIEND REQUESTS</div>${L.incoming.map((p) => frRow(Object.assign({ sub: 'WANTS TO BE FRIENDS' }, p), `<button class="btn-game btn-emerald py-1.5 px-3 text-xs" data-acc="${esc(p.id)}">Accept</button><button class="btn-game btn-graphite py-1.5 px-3 text-xs" data-rm="${esc(p.id)}">Decline</button>`)).join('')}` : '')
        + (fl.length ? fl.map((p) => frRow(Object.assign({ sub: p.dot ? 'ONLINE' : 'OFFLINE' }, p), `${FR.unread[p.id] ? `<span class="badge on fr-badge">${FR.unread[p.id]}</span>` : ''}<button class="btn-game btn-teal py-1.5 px-3 text-xs" data-chat="${esc(p.id)}">Chat</button>`)).join('')
          : `<div class="text-sm text-muted px-1 py-2">No friends yet. Look players up above, or tap a name in any chat, then press <b class="text-bone">Add friend</b>.</div>`)
        + (L.outgoing.length ? `<div class="pix text-xs text-muted px-1 pt-2">WAITING FOR AN ANSWER</div>${L.outgoing.map((p) => frRow(Object.assign({ sub: 'REQUEST SENT' }, p), `<button class="btn-game btn-graphite py-1.5 px-3 text-xs" data-rm="${esc(p.id)}">Cancel</button>`)).join('')}` : '');
      box.querySelectorAll('[data-card]').forEach((b) => { b.onclick = () => openPlayerCard(b.dataset.card); });
      box.querySelectorAll('[data-chat]').forEach((b) => { b.onclick = () => openFriendChat(b.dataset.chat); });
      box.querySelectorAll('[data-acc]').forEach((b) => { b.onclick = async () => { b.disabled = true; await NET.acceptFriend(b.dataset.acc).catch((e) => showToast(e.message, 'error')); SFX.play('reveal'); showToast('You are now friends!', 'success'); frLoad(); }; });
      box.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = async () => { b.disabled = true; await NET.removeFriend(b.dataset.rm).catch(() => {}); frLoad(); }; });
    }
    function openFriendChat(id) {
      FR.sel = id; FR.unread[id] = 0; friendsBadge();
      if (activeView !== 'friends') navigateTo('friends'); else { paintFriendList(); paintFriendChat(); }
    }
    async function paintFriendChat() {
      const win = document.getElementById('fr-chatwin'); if (!win) return;
      const f = FR.sel && FR.list.friends.find((x) => x.id === FR.sel);
      if (!f) { win.innerHTML = `<div class="winbar"><span>FRIEND CHAT</span></div><div class="p-6 text-center text-sm text-muted">Pick a friend and press <b class="text-bone">Chat</b>. Only the two of you can read your messages.</div>`; return; }
      if (!FR.msgs[f.id]) { FR.msgs[f.id] = []; NET.dmHistory(f.id).then((ms) => { FR.msgs[f.id] = ms; paintFriendChat(); }).catch(() => {}); }
      const on = NET.isOnline(f.id), ms = FR.msgs[f.id];
      const keep = win.querySelector('input') ? win.querySelector('input').value : '';
      win.innerHTML = `<div class="winbar teal"><span class="flex items-center gap-2"><span class="fr-dot ${on ? 'on' : ''}"></span>${esc(f.name.toUpperCase())}</span><span class="pix text-xs">${on ? 'ONLINE' : 'OFFLINE'}</span></div>
        <div class="chatbox"><div class="chat-list" id="fr-msgs">${ms.length ? ms.map((m) => {
          const mine = m.from === NET.me.id, code = frRoomCode(m.text);
          return `<div class="chat-msg ${mine ? 'me' : ''}"><span class="av">${esc(mine ? NET.me.avatar : f.avatar)}</span><div class="min-w-0 flex-1"><div><span class="who">${esc(mine ? NET.me.name : f.name)}</span><span class="tm">${new Date(m.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div>
            <div class="tx">${code ? `🎮 ${mine ? 'You invited them to' : 'Join my'} room <b>${esc(code)}</b>` : esc(m.text)}</div>${code && !mine ? `<button class="btn-game btn-amber py-1 px-3 text-xs mt-1" data-join="${esc(code)}">Join room</button>` : ''}</div></div>`;
        }).join('') : '<div class="chat-sys">Say hi to your friend!</div>'}</div>
        <div class="chat-quick">${['Wanna play?', 'GG!', 'Join my room', 'Be right back'].map((q) => `<button type="button">${q}</button>`).join('')}</div>
        <form class="chat-form" autocomplete="off"><input maxlength="300" placeholder="Message ${esc(f.name)}…" aria-label="Message"><button type="submit">Send</button></form></div>
        <div class="p-3 flex gap-2 border-t-[3px] border-ink"><button class="btn-game btn-graphite py-1.5 px-3 text-xs" data-card="${esc(f.id)}">Player card</button><button class="btn-game btn-graphite py-1.5 px-3 text-xs" id="fr-unf">Remove friend</button></div>`;
      const list = win.querySelector('#fr-msgs'); list.scrollTop = list.scrollHeight;
      const input = win.querySelector('input'); input.value = keep;
      ['keydown', 'keyup', 'keypress'].forEach((t) => input.addEventListener(t, (e) => e.stopPropagation()));
      const send = (t) => { t = String(t || '').trim(); if (!t) return; NET.dmSend(f.id, t).then(() => { FR.msgs[f.id].push({ id: 'l' + Date.now(), from: NET.me.id, to: f.id, text: NET.clean(t), at: Date.now() }); input.value = ''; SFX.play('click'); paintFriendChat(); }).catch((e) => showToast(e.message || 'Message not sent.', 'error')); };
      win.querySelector('form').onsubmit = (e) => { e.preventDefault(); send(input.value); };
      win.querySelectorAll('.chat-quick button').forEach((b) => { b.onclick = () => send(b.textContent); });
      win.querySelectorAll('[data-join]').forEach((b) => { b.onclick = () => joinRoomCode(b.dataset.join); });
      win.querySelectorAll('[data-card]').forEach((b) => { b.onclick = () => openPlayerCard(b.dataset.card); });
      win.querySelector('#fr-unf').onclick = () => askConfirm({ title: 'REMOVE FRIEND?', sub: `Remove ${f.name} from your friends? Your messages stay hidden from everyone else.`, yes: 'Remove', no: 'Keep' }).then(async (ok) => { if (!ok) return; await NET.removeFriend(f.id).catch(() => {}); FR.sel = null; frLoad(); });
    }

    /* ---------- a player's card: look-up result, chat names, leaderboard ---------- */
    async function openPlayerCard(id) {
      if (!frOn() || !id) return;
      let el = document.getElementById('pcard-modal');
      if (!el) { el = document.createElement('div'); el.id = 'pcard-modal'; el.className = 'hidden fixed inset-0 z-[66] bg-black/80 overflow-y-auto p-4'; document.body.appendChild(el); el.onclick = (e) => { if (e.target === el) el.classList.add('hidden'); }; }
      el.innerHTML = '<div class="win max-w-sm mx-auto my-10 p-6 text-center text-sm text-muted">Loading...</div>'; el.classList.remove('hidden');
      const c = await NET.playerCard(id).catch(() => null);
      if (!c) { el.innerHTML = '<div class="win max-w-sm mx-auto my-10 p-6 text-center text-sm text-muted">That player could not be found.</div>'; return; }
      const on = NET.isOnline(id);
      const btn = { me: '', friends: `<button class="btn-game btn-teal w-full py-2.5 text-sm" data-act="chat">Chat</button>`, sent: '<button class="btn-game btn-graphite w-full py-2.5 text-sm" disabled>Friend request sent</button>',
        asked: `<button class="btn-game btn-emerald w-full py-2.5 text-sm" data-act="add">Accept friend request</button>`, none: `<button class="btn-game btn-amber w-full py-2.5 text-sm" data-act="add">＋ Add friend</button>` }[c.friend] || '';
      el.innerHTML = `<div class="win max-w-sm mx-auto my-6 sm:my-12 overflow-hidden"><div class="winbar amber"><span>PLAYER CARD</span><button class="pix text-sm" data-act="x" aria-label="Close">✕</button></div>
        <div class="p-6 space-y-4 text-center">
          <div class="avatar-tile w-24 h-24 text-5xl mx-auto">${esc(c.avatar)}</div>
          <div><div class="text-2xl font-extrabold text-bone">${esc(c.name)}</div><div class="pix text-xs mt-1 ${on ? 'text-emerald' : 'text-muted'}">${on ? '● ONLINE' : 'OFFLINE'} · PLAYING SINCE ${esc(String(c.since || '').toUpperCase())}${c.friend === 'friends' ? ' · FRIEND' : ''}</div></div>
          <div class="text-left"><div class="pix text-xs tracking-wider text-muted mb-1.5">RANKINGS</div>${(c.ratings || []).length ? c.ratings.map((r) => srow(esc(frGameName(r.game)), `${r.elo} Elo · ${r.wins}/${r.games} won`)).join('') : '<div class="text-sm text-muted">No ranked games yet.</div>'}</div>
          ${btn}
          ${c.friend === 'friends' ? '<button class="pix text-xs text-muted hover:text-coral" data-act="rm">Remove friend</button>' : ''}
        </div></div>`;
      el.querySelectorAll('[data-act]').forEach((b) => { b.onclick = async () => {
        const a = b.dataset.act;
        if (a === 'x') return el.classList.add('hidden');
        if (a === 'chat') { el.classList.add('hidden'); return openFriendChat(id); }
        if (a === 'add') { b.disabled = true; try { await NET.addFriend(id); SFX.play('pop'); showToast(c.friend === 'asked' ? 'You are now friends!' : `Friend request sent to ${c.name}.`, 'success'); } catch (e) { showToast(e.message || 'Could not send the request.', 'error'); } frLoad(); return openPlayerCard(id); }
        if (a === 'rm') { await NET.removeFriend(id).catch(() => {}); frLoad(); return openPlayerCard(id); }
      }; });
    }
    window.openPlayerCard = openPlayerCard; window.renderFriends = renderFriends; window.openFriendChat = openFriendChat;

    /* ---------- invite friends to your room (from the room screen) ---------- */
    function inviteFriends(link, gameName) {
      if (!frOn()) return;
      let el = document.getElementById('finv-modal');
      if (!el) { el = document.createElement('div'); el.id = 'finv-modal'; el.className = 'hidden fixed inset-0 z-[66] bg-black/80 overflow-y-auto p-4'; document.body.appendChild(el); el.onclick = (e) => { if (e.target === el) el.classList.add('hidden'); }; }
      const fl = FR.list.friends.map((f) => Object.assign({}, f, { dot: NET.isOnline(f.id) })).sort((a, b) => b.dot - a.dot);
      el.innerHTML = `<div class="win max-w-sm mx-auto my-6 sm:my-12 overflow-hidden"><div class="winbar teal"><span>INVITE FRIENDS</span><button class="pix text-sm" id="finv-x" aria-label="Close">✕</button></div>
        <div class="p-4 space-y-2">${fl.length ? fl.map((p) => frRow(Object.assign({ sub: p.dot ? 'ONLINE' : 'OFFLINE' }, p), `<button class="btn-game btn-amber py-1.5 px-3 text-xs" data-inv="${esc(p.id)}">Invite</button>`)).join('')
          : '<div class="text-sm text-muted">No friends yet. Add friends from the Friends page, or copy the invite link.</div>'}</div></div>`;
      el.classList.remove('hidden');
      el.querySelector('#finv-x').onclick = () => el.classList.add('hidden');
      el.querySelectorAll('[data-inv]').forEach((b) => { b.onclick = () => { b.disabled = true; NET.dmSend(b.dataset.inv, `Join my ${gameName} room! ${link}`).then(() => { b.textContent = 'Sent ✓'; SFX.play('pop'); }).catch((e) => { b.disabled = false; showToast(e.message || 'Could not send.', 'error'); }); }; });
    }
    window.inviteFriends = inviteFriends;
