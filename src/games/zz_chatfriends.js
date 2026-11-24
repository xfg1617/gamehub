    /* =========================================================================
       FRIENDS IN THE GAME CHAT (Inna, Nov 2026): a "Friends" button in the chat window's header switches the window to
       your friends list; pick a friend to message them right there, without leaving the game. "← Room" goes back.
       Uses the same private messages as the Friends page (only friends can message each other).
       ========================================================================= */
    (() => {
      const CF = { on: false, sel: null, timer: 0 };
      const body = () => document.getElementById('chat-room');
      function headerButton() {
        const bar = document.querySelector('#chat-panel .winbar');
        if (!bar || document.getElementById('chat-fr-btn')) return;
        const b = document.createElement('button'); b.id = 'chat-fr-btn'; b.className = 'chat-fr-btn'; b.textContent = '👥 Friends'; b.title = 'Message your friends';
        b.onclick = (e) => { e.stopPropagation(); CF.on ? back() : openList(); };
        const name = document.getElementById('chat-room-name'); name.insertAdjacentElement('afterend', b);
      }
      function back() {
        CF.on = false; CF.sel = null; clearInterval(CF.timer);
        const b = document.getElementById('chat-fr-btn'); if (b) b.textContent = '👥 Friends';
        if (typeof CHAT !== 'undefined' && CHAT.room) chatMount(body(), CHAT.room);
      }
      async function openList() {
        CF.on = true; CF.sel = null; clearInterval(CF.timer);
        const b = document.getElementById('chat-fr-btn'); if (b) b.textContent = '← Room';
        const host = body(); if (!host) return;
        if (!NET.on) { host.innerHTML = '<div class="p-5 text-sm text-muted text-center">Friends need the online service.</div>'; return; }
        host.innerHTML = '<div class="p-5 text-sm text-muted text-center">Loading your friends...</div>';
        let list = [];
        try { list = (await NET.friends()).friends || []; } catch (e) {}
        if (!CF.on || CF.sel) return;
        host.innerHTML = `<div class="cf-list">${list.length ? list.map((f) => `<button class="cf-row" data-id="${esc(f.id)}"><span class="fr-dot ${NET.isOnline && NET.isOnline(f.id) ? 'on' : ''}"></span><span class="text-lg">${esc(f.avatar || '🙂')}</span><b>${esc(f.name || 'Player')}</b><span class="cf-go">Chat ▶</span></button>`).join('')
          : '<div class="p-5 text-sm text-muted text-center">No friends yet. Add people from the Friends page or by tapping their name in a chat.</div>'}</div>`;
        host.querySelectorAll('[data-id]').forEach((r) => { r.onclick = () => openDm(list.find((f) => f.id === r.dataset.id)); });
      }
      async function openDm(f) {
        if (!f) return;
        CF.sel = f; const host = body(); if (!host) return;
        host.innerHTML = `<div class="cf-head"><button class="cf-back">← Friends</button><span class="text-lg">${esc(f.avatar || '🙂')}</span><b>${esc(f.name)}</b></div>
          <div class="chatbox"><div class="chat-list" id="cf-msgs"></div><form class="chat-form" id="cf-form" autocomplete="off"><input maxlength="300" placeholder="Message ${esc(f.name)}..." aria-label="Message"><button type="submit">Send</button></form></div>`;
        host.querySelector('.cf-back').onclick = () => openList();
        const paint = async () => {
          if (!CF.on || CF.sel !== f) return;
          let ms = []; try { ms = await NET.dmHistory(f.id); } catch (e) {}
          const el = document.getElementById('cf-msgs'); if (!el) return;
          const me = NET.me && NET.me.id;
          el.innerHTML = ms.length ? ms.map((m) => `<div class="chat-msg ${(m.from || m.from_id) === me ? 'me' : ''}"><div class="min-w-0 flex-1"><div>${esc(m.text)}</div></div></div>`).join('') : '<div class="text-xs text-muted p-3">Say hi!</div>';
          el.scrollTop = el.scrollHeight;
        };
        paint(); clearInterval(CF.timer); CF.timer = setInterval(paint, 4000);
        document.getElementById('cf-form').onsubmit = async (e) => {
          e.preventDefault(); const inp = e.target.querySelector('input'), t = inp.value.trim(); if (!t) return;
          inp.value = '';
          try { await NET.dmSend(f.id, t); paint(); } catch (err) { showToast(err.message || 'Could not send', 'error'); }
        };
      }
      setInterval(headerButton, 1000);
      window.chatFriends = { openList, back };
    })();
