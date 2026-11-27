    /* =========================================================================
       VOICE CHAT (Nov 2026, Inna: "option B" = voice built into GameHub)
       Only in PRIVATE rooms and their tables (never quick match with strangers), only for players with an account.
       Off until you press Join voice; push-to-talk by default (hold the button or the V key), or open mic.
       Voices go straight between the players' browsers (WebRTC, peer to peer). The room's live channel
       ('vc:<code>', NET.channel) is only used to introduce the browsers to each other. Nothing is recorded or stored.
       Networks that block direct connections use a relay (Cloudflare TURN): /api/turn (functions/api/turn.js) hands out
       short-lived relay passwords when Inna has added the TURN key in Cloudflare; without it only direct connections work.
       Mute anyone just for yourself (the 🔇 next to their name). A mesh like this suits up to ~8 people.
       ========================================================================= */
    (function voiceChat() {
      const V = { code: null, ch: null, peers: {}, stream: null, mode: 'ptt', live: false, talk: {}, muted: {}, names: {}, joining: false, ice: null, iceAt: 0, open: false };
      const MAX = 8;
      try { const s = JSON.parse(localStorage.getItem('ps_voice_v1') || '{}'); if (s.mode === 'open') V.mode = 'open'; V.muted = s.muted || {}; } catch (e) {}
      const save = () => { try { localStorage.setItem('ps_voice_v1', JSON.stringify({ mode: V.mode, muted: V.muted })); } catch (e) {} };
      const me = () => (typeof NET !== 'undefined' && NET.me ? NET.me.id : '');
      const can = () => typeof RTCPeerConnection !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
      // the room we are in, if voice is allowed there (private rooms only)
      function roomCode() {
        if (typeof NP === 'undefined' || typeof NET === 'undefined' || !NET.on) return null;
        const c = NP.lobby || NP.table;
        return c && npIsPrivate(c) ? c : null;
      }

      // ---------- relay servers ----------
      async function iceServers() {
        const base = [{ urls: 'stun:stun.cloudflare.com:3478' }];
        if (!/^https?:$/.test(location.protocol) || location.hostname === 'gamehub.test') return base;
        if (V.ice && Date.now() - V.iceAt < 3000e3) return base.concat(V.ice);
        try {
          const r = await fetch('/api/turn', { cache: 'no-store' }); const j = r.ok ? await r.json() : null;
          if (j && Array.isArray(j.iceServers) && j.iceServers.length) { V.ice = j.iceServers; V.iceAt = Date.now(); return base.concat(V.ice); }
        } catch (e) {}
        return base;
      }

      // ---------- joining / leaving ----------
      async function join() {
        if (V.ch || V.joining) return;
        const code = roomCode(); if (!code) return;
        if (NET.isGuest && NET.isGuest()) { if (typeof openAuthModal === 'function') openAuthModal('signup'); return showToast('Sign up to use voice chat. It\'s free!', 'error'); }
        if (!can()) return showToast('This browser can\'t do voice chat. Try Chrome, Safari or Firefox.', 'error');
        V.joining = true; paint();
        try {
          V.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
        } catch (e) {
          V.joining = false; paint();
          return showToast(e && e.name === 'NotAllowedError' ? 'Microphone blocked. Allow the microphone for this site (the 🔒 next to the address), then try again.' : 'No microphone found.', 'error');
        }
        if (roomCode() !== code) { stopMic(); V.joining = false; return paint(); }
        V.code = code; V.live = false; gate();
        V.ch = NET.channel('vc:' + code, { name: NET.me.name, avatar: NET.me.avatar, at: Date.now() });
        V.ch.on('sig', onSig);
        V.ch.on('talk', (d, from) => { V.talk[from] = !!(d && d.on); marks(); paint(); });
        V.ch.presence((list) => sync(list));
        await V.ch.ready;
        V.joining = false; meter(); paint(); SFX.play('reveal');
        sync(V.ch.members());
      }
      function stopMic() { if (V.stream) V.stream.getTracks().forEach((t) => t.stop()); V.stream = null; }
      function leave() {
        Object.keys(V.peers).forEach(drop);
        if (V.ch) { try { V.ch.close(); } catch (e) {} } V.ch = null;
        stopMic(); V.code = null; V.talk = {}; V.live = false; V.joining = false;
        if (V.meterT) clearInterval(V.meterT); V.meterT = null; if (V.ac) { try { V.ac.close(); } catch (e) {} V.ac = null; }
        marks(); paint();
      }

      // ---------- the connections (one per other person in voice) ----------
      function sync(list) {
        if (!V.ch) return;
        const ids = (list || []).map((x) => x.uid).filter((u) => u && u !== me());
        (list || []).forEach((x) => { if (x.uid) V.names[x.uid] = { name: x.name || 'Player', av: x.avatar || '🙂' }; });
        Object.keys(V.peers).forEach((u) => { if (!ids.includes(u)) drop(u); });
        ids.slice(0, MAX - 1).forEach((u) => { if (!V.peers[u] && me() < u) connect(u, true); });   // the smaller id calls
        paint();
      }
      async function connect(u, caller) {
        const pc = new RTCPeerConnection({ iceServers: await iceServers() });
        const P = { pc, u, audio: null, q: [], caller };
        V.peers[u] = P;
        if (V.stream) V.stream.getTracks().forEach((t) => pc.addTrack(t, V.stream));
        pc.onicecandidate = (e) => { if (e.candidate && V.ch) V.ch.send('sig', { to: u, ice: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
        pc.ontrack = (e) => {
          let a = P.audio; if (!a) { a = P.audio = document.createElement('audio'); a.autoplay = true; a.setAttribute('playsinline', ''); a.dataset.vc = u; box().appendChild(a); }
          a.srcObject = e.streams[0] || new MediaStream([e.track]); a.muted = !!V.muted[u]; a.play().catch(() => {});
        };
        pc.onconnectionstatechange = () => {
          const st = pc.connectionState; paint();
          if (st === 'failed' && V.peers[u] === P) { drop(u); if (V.ch && caller) setTimeout(() => { if (V.ch && !V.peers[u] && (V.ch.members() || []).some((x) => x.uid === u)) connect(u, true); }, 1500); }
        };
        if (caller) { const o = await pc.createOffer(); await pc.setLocalDescription(o); V.ch.send('sig', { to: u, sdp: pc.localDescription.toJSON ? pc.localDescription.toJSON() : pc.localDescription }); }
        return P;
      }
      function drop(u) { const P = V.peers[u]; if (!P) return; delete V.peers[u]; try { P.pc.close(); } catch (e) {} if (P.audio) { P.audio.srcObject = null; P.audio.remove(); } delete V.talk[u]; }
      async function onSig(d, from) {
        if (!V.ch || !d || d.to !== me() || !from || from === me()) return;
        let P = V.peers[from];
        try {
          if (d.sdp) {
            if (d.sdp.type === 'offer') {
              if (P && P.caller) return;                                   // both called at once: the smaller id wins (never happens normally)
              if (P) drop(from);                                           // a fresh call from them (they reconnected)
              if (Object.keys(V.peers).length >= MAX - 1) return;
              P = await connect(from, false);
              await P.pc.setRemoteDescription(d.sdp);
              const a = await P.pc.createAnswer(); await P.pc.setLocalDescription(a);
              V.ch.send('sig', { to: from, sdp: P.pc.localDescription.toJSON ? P.pc.localDescription.toJSON() : P.pc.localDescription });
            } else if (P && d.sdp.type === 'answer' && P.pc.signalingState === 'have-local-offer') await P.pc.setRemoteDescription(d.sdp);
            if (P) { for (const c of P.q) await P.pc.addIceCandidate(c).catch(() => {}); P.q = []; }
          } else if (d.ice) {
            if (!P) return;
            if (!P.pc.remoteDescription) P.q.push(d.ice); else await P.pc.addIceCandidate(d.ice).catch(() => {});
          }
        } catch (e) { /* a broken handshake: the caller tries again when the connection fails */ }
      }

      // ---------- talking ----------
      function gate() {
        const on = !!V.stream && (V.mode === 'open' ? !V.selfMute : V.live);
        if (V.stream) V.stream.getAudioTracks().forEach((t) => { t.enabled = on; });
        return on;
      }
      function setLive(on) {
        if (!V.ch || V.mode !== 'ptt' || V.live === on) return;
        V.live = on; gate(); V.ch.send('talk', { on }); V.talk[me()] = on; marks(); paint();
      }
      // open mic: tell the others when you are actually speaking (a simple loudness check, sent only when it changes)
      function meter() {
        if (V.meterT || !V.stream) return;
        try {
          const AC = window.AudioContext || window.webkitAudioContext; V.ac = new AC();
          const src = V.ac.createMediaStreamSource(V.stream), an = V.ac.createAnalyser(); an.fftSize = 512; src.connect(an);
          const buf = new Uint8Array(an.fftSize); let lastOn = false, quietAt = 0;
          V.meterT = setInterval(() => {
            if (!V.ch || V.mode !== 'open') return;
            an.getByteTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) { const x = (buf[i] - 128) / 128; s += x * x; }
            const loud = !V.selfMute && Math.sqrt(s / buf.length) > 0.04, now = Date.now();
            if (loud) quietAt = now;
            const on = loud || now - quietAt < 400;
            if (on !== lastOn) { lastOn = on; V.talk[me()] = on; V.ch.send('talk', { on }); marks(); paint(); }
          }, 120);
        } catch (e) {}
      }
      // a green speaker mark on the name tag of whoever is talking (at a table); the voice panel shows it too
      function marks() {
        document.querySelectorAll('.vc-speak').forEach((el) => el.classList.remove('vc-speak'));
        const S = typeof NP !== 'undefined' && NP.S; if (!S || !S.seats || !V.ch) return;
        Object.keys(V.talk).forEach((u) => { if (!V.talk[u]) return; const i = S.seats.findIndex((x) => x && x.uid === u); if (i < 0) return;
          const el = document.querySelector(`[id$="-seat-${i}"]`) || document.querySelector(`[id$="-pl-${i}"]`); if (el) el.classList.add('vc-speak'); });
      }
      // hold V to talk (not while typing)
      const typing = (e) => /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '') || (e.target && e.target.isContentEditable);
      window.addEventListener('keydown', (e) => { if ((e.key === 'v' || e.key === 'V') && !e.repeat && V.ch && V.mode === 'ptt' && !typing(e)) { V.keyHeld = true; setLive(true); } });
      window.addEventListener('keyup', (e) => { if (e.key === 'v' || e.key === 'V') { V.keyHeld = false; setLive(false); } });
      // letting go anywhere stops talking (the talk button is redrawn while held, so don't rely on it alone)
      window.addEventListener('pointerup', () => { if (!V.keyHeld) setLive(false); }, true);
      window.addEventListener('pointercancel', () => { if (!V.keyHeld) setLive(false); }, true);
      window.addEventListener('blur', () => setLive(false));

      // ---------- the button and the panel ----------
      function box() { let b = document.getElementById('vc-audio'); if (!b) { b = document.createElement('div'); b.id = 'vc-audio'; b.style.display = 'none'; document.body.appendChild(b); } return b; }
      const MIC = (c) => `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><rect x="6" y="1" width="4" height="9" fill="#050E18"/><rect x="7" y="2" width="2" height="7" fill="${c}"/><rect x="4" y="7" width="1" height="3" fill="#050E18"/><rect x="11" y="7" width="1" height="3" fill="#050E18"/><rect x="5" y="10" width="6" height="1" fill="#050E18"/><rect x="7" y="11" width="2" height="2" fill="#050E18"/><rect x="5" y="13" width="6" height="2" fill="#050E18"/></svg>`;
      function fab() {
        const code = roomCode();
        let f = document.getElementById('vc-fab');
        if (!code) { if (f) f.remove(); closePop(); return null; }
        if (!f) {
          f = document.createElement('button'); f.id = 'vc-fab'; f.className = 'vc-fab'; f.setAttribute('aria-label', 'Voice chat'); f.title = 'Voice chat';
          f.onclick = (e) => { e.stopPropagation(); V.open ? closePop() : openPop(); };
          // push-to-talk straight from the button: hold it
          f.onpointerdown = (e) => { if (V.ch && V.mode === 'ptt') { V.pressAt = Date.now(); setLive(true); } };
          const upf = () => { if (V.pressAt) { const long = Date.now() - V.pressAt > 300; V.pressAt = 0; setLive(false); if (long) f.dataset.skipClick = '1'; } };
          f.onpointerup = upf; f.onpointerleave = upf; f.onpointercancel = upf;
          f.addEventListener('click', (e) => { if (f.dataset.skipClick) { delete f.dataset.skipClick; e.stopImmediatePropagation(); } }, true);
          document.body.appendChild(f);
        }
        const n = V.ch ? Object.keys(V.peers).length + 1 : 0, talking = V.ch && (V.mode === 'open' ? !V.selfMute : V.live);
        f.className = 'vc-fab' + (V.ch ? ' on' : '') + (talking ? ' live' : '') + (V.ch && Object.keys(V.talk).some((u) => u !== me() && V.talk[u]) ? ' hear' : '');
        const html = MIC(V.ch ? (talking ? '#34D399' : '#2DD4BF') : '#9DB4CC') + (n ? `<b>${n}</b>` : '');
        if (f.dataset.h !== html) { f.innerHTML = html; f.dataset.h = html; }
        place(f);
        return f;
      }
      function place(f) {
        const ref = ['em-fab', 'chat-fab'].map((id) => document.getElementById(id)).find((x) => x && x.getBoundingClientRect().width);
        if (ref) { const r = ref.getBoundingClientRect(); f.style.left = Math.round(r.right + 10) + 'px'; f.style.bottom = Math.round(window.innerHeight - r.bottom + (r.height - f.offsetHeight) / 2) + 'px'; }
        else { f.style.left = '16px'; f.style.bottom = window.innerWidth < 1024 ? '78px' : '18px'; }
        const p = document.getElementById('vc-pop');
        if (p) { const fr = f.getBoundingClientRect(); p.style.bottom = Math.round(window.innerHeight - fr.top + 10) + 'px'; p.style.left = Math.max(8, Math.min(window.innerWidth - p.offsetWidth - 8, fr.left)) + 'px'; }
      }
      function openPop() { V.open = true; paint(); }
      function closePop() { V.open = false; const p = document.getElementById('vc-pop'); if (p) p.remove(); }
      function person(u, nm, isMe) {
        const P = V.peers[u], st = isMe ? 'you' : !P ? 'connecting' : P.pc.connectionState;
        const word = isMe ? 'YOU' : st === 'connected' ? '' : st === 'failed' ? 'NO CONNECTION' : 'CONNECTING...';
        return `<div class="vc-row ${V.talk[u] ? 'talk' : ''}"><span class="vc-av">${esc(nm.av)}</span><span class="vc-nm">${esc(nm.name)}</span>
          ${word ? `<span class="pix vc-st">${word}</span>` : ''}<span class="vc-bars"><i></i><i></i><i></i></span>
          ${isMe ? '' : `<button class="vc-mute ${V.muted[u] ? 'on' : ''}" data-vm="${esc(u)}" title="${V.muted[u] ? 'Unmute' : 'Mute for me'}" aria-label="${V.muted[u] ? 'Unmute' : 'Mute for me'}">${V.muted[u] ? '🔇' : '🔊'}</button>`}</div>`;
      }
      function paint() {
        const f = fab();
        if (!f || !V.open) { if (!f) closePop(); return; }
        let p = document.getElementById('vc-pop');
        if (!p) { p = document.createElement('div'); p.id = 'vc-pop'; p.className = 'vc-pop'; p.onclick = (e) => e.stopPropagation(); document.body.appendChild(p); }
        const guest = NET.isGuest && NET.isGuest();
        let body;
        if (guest) body = `<p class="text-sm text-bone">Voice chat is for players with an account.</p><button class="btn-game btn-amber w-full py-2 text-sm" onclick="openAuthModal('signup')">Sign up free</button>`;
        else if (!V.ch) body = `<ul class="vc-notes"><li>Talk with the players in this private room.</li><li>Your voice goes straight to them. Nothing is recorded or saved.</li><li>You can mute anyone, just for you.</li><li>Be kind. Never share personal details.</li></ul>
          <button id="vc-join" class="btn-game btn-teal w-full py-2.5 text-sm" ${V.joining ? 'disabled' : ''}>${V.joining ? 'Connecting...' : '🎤 Join voice'}</button>`;
        else {
          const ids = Object.keys(V.peers), mine = { name: NET.me.name, av: NET.me.avatar };
          const talking = V.mode === 'open' ? !V.selfMute : V.live;
          body = `<div class="vc-list">${person(me(), mine, true)}${ids.map((u) => person(u, V.names[u] || { name: 'Player', av: '🙂' }, false)).join('')}${ids.length ? '' : '<p class="text-xs text-muted">Nobody else has joined voice yet. Ask your friends to press 🎤.</p>'}</div>
            <div class="seg w-full"><button data-vmode="ptt" class="seg-btn flex-1 ${V.mode === 'ptt' ? 'on' : ''}">Hold to talk</button><button data-vmode="open" class="seg-btn flex-1 ${V.mode === 'open' ? 'on' : ''}">Open mic</button></div>
            ${V.mode === 'ptt' ? `<button id="vc-ptt" class="btn-game ${talking ? 'btn-emerald' : 'btn-teal'} w-full py-3 text-sm">${talking ? '🎙 TALKING...' : '🎙 HOLD TO TALK'}</button><p class="text-xs text-muted text-center">Or hold the <b class="text-bone">V</b> key, or hold the 🎤 button.</p>`
              : `<button id="vc-self" class="btn-game ${V.selfMute ? 'btn-coral' : 'btn-emerald'} w-full py-2.5 text-sm">${V.selfMute ? '🔇 Your mic is off · tap to turn on' : '🎙 Your mic is on · tap to mute'}</button>`}
            <button id="vc-leave" class="btn-game btn-graphite w-full py-2 text-sm">Leave voice</button>`;
        }
        const html = `<div class="vc-head"><span class="pix">VOICE CHAT</span><span class="pix text-xs text-muted">ROOM ${esc(roomCode() || '')}</span><button class="vc-x" id="vc-x" aria-label="Close">✕</button></div><div class="vc-body">${body}</div>`;
        if (p.dataset.h === html) return place(f);
        // keep a held talk button pressed while repainting
        p.innerHTML = html; p.dataset.h = html;
        const q = (s) => p.querySelector(s);
        if (q('#vc-x')) q('#vc-x').onclick = closePop;
        if (q('#vc-join')) q('#vc-join').onclick = join;
        if (q('#vc-leave')) q('#vc-leave').onclick = leave;
        if (q('#vc-self')) q('#vc-self').onclick = () => { V.selfMute = !V.selfMute; gate(); paint(); };
        p.querySelectorAll('[data-vmode]').forEach((b) => { b.onclick = () => { V.mode = b.dataset.vmode; V.live = false; V.selfMute = false; save(); gate(); if (V.ch) { V.ch.send('talk', { on: false }); V.talk[me()] = false; } paint(); }; });
        p.querySelectorAll('[data-vm]').forEach((b) => { b.onclick = () => { const u = b.dataset.vm; V.muted[u] = !V.muted[u]; if (!V.muted[u]) delete V.muted[u]; save(); const P = V.peers[u]; if (P && P.audio) P.audio.muted = !!V.muted[u]; paint(); }; });
        const ptt = q('#vc-ptt');
        if (ptt) { ptt.onpointerdown = (e) => { e.preventDefault(); try { ptt.setPointerCapture(e.pointerId); } catch (x) {} setLive(true); }; ptt.onpointerup = ptt.onpointercancel = () => setLive(false); ptt.oncontextmenu = (e) => e.preventDefault(); }
        place(f);
      }
      document.addEventListener('click', (e) => { if (V.open && !e.target.closest('#vc-pop, #vc-fab')) closePop(); });
      window.addEventListener('resize', () => { const f = document.getElementById('vc-fab'); if (f) place(f); });
      // leave voice by itself when you leave the room; keep the button in step
      setInterval(() => {
        const code = roomCode();
        if (V.ch && V.code !== code) leave();
        if (V.ch && (NET.isGuest && NET.isGuest())) leave();
        fab(); if (V.open) paint(); marks();
      }, 800);
      window.addEventListener('pagehide', () => { if (V.ch) leave(); });
      window.VOICE = { join, leave, setLive, state: () => ({ code: V.code, on: !!V.ch, mode: V.mode, live: V.live, talk: Object.assign({}, V.talk), peers: Object.fromEntries(Object.entries(V.peers).map(([u, P]) => [u, P.pc.connectionState])) }),
        stats: async () => { const out = {}; for (const [u, P] of Object.entries(V.peers)) { let rx = 0; (await P.pc.getStats()).forEach((r) => { if (r.type === 'inbound-rtp' && r.kind === 'audio') rx += r.bytesReceived || 0; }); out[u] = rx; } return out; } };
    })();
