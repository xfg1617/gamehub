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
      const V = { tries: {}, fail: {}, code: null, ch: null, peers: {}, stream: null, mode: 'ptt', live: false, talk: {}, muted: {}, names: {}, joining: false, ice: null, iceAt: 0, open: false };
      const MAX = 8;
      try { const s = JSON.parse(localStorage.getItem('ps_voice_v1') || '{}'); if (s.mode === 'open') V.mode = 'open'; V.muted = s.muted || {}; V.vol = typeof s.vol === 'number' ? s.vol : 1; } catch (e) { V.vol = 1; }
      const save = () => { try { localStorage.setItem('ps_voice_v1', JSON.stringify({ mode: V.mode, muted: V.muted, vol: V.vol })); } catch (e) {} };
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
        const base = [{ urls: 'stun:stun.cloudflare.com:3478' }, { urls: 'stun:stun.l.google.com:19302' }];
        if (window.__vcIceDelay) await new Promise((r) => setTimeout(r, window.__vcIceDelay));   // tests: act like a slow network
        if (!/^https?:$/.test(location.protocol) || location.hostname === 'gamehub.test') return base;
        if (V.ice && Date.now() - V.iceAt < 3000e3) return base.concat(V.ice);
        try {
          const r = await fetch('/api/turn', { cache: 'no-store' }); const j = r.ok ? await r.json() : null;
          if (j && Array.isArray(j.iceServers) && j.iceServers.length) { V.ice = j.iceServers; V.iceAt = Date.now(); return base.concat(V.ice); }
        } catch (e) {}
        return base;
      }

      // ---------- joining / leaving ----------
      async function join(o) {
        o = o || {};
        if (V.ch || V.joining) return;
        const code = roomCode(); if (!code) return;
        if (NET.isGuest && NET.isGuest()) { if (typeof openAuthModal === 'function') openAuthModal('signup'); return showToast('Sign up to use voice chat. It\'s free!', 'error'); }
        if (!can()) return showToast('This browser can\'t do voice chat. Try Chrome, Safari or Firefox.', 'error');
        V.joining = true; hideNudge(); paint();
        try {
          V.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
        } catch (e) {
          V.joining = false; paint();
          return showToast(e && e.name === 'NotAllowedError' ? 'Microphone blocked. Allow the microphone for this site (the 🔒 next to the address), then try again.' : 'No microphone found.', 'error');
        }
        if (roomCode() !== code) { stopMic(); V.joining = false; return paint(); }
        V.iceList = await iceServers();                                  // ready before anyone calls, so no message waits on it
        if (roomCode() !== code) { stopMic(); V.joining = false; return paint(); }
        V.code = code; V.live = false; gate();
        if (L) { try { L.ch.close(); } catch (e) {} L = null; }              // the listen-only peek is not needed once you are in
        V.ch = NET.channel('vc:' + code, { name: NET.me.name, avatar: NET.me.avatar, at: Date.now() });
        V.ch.on('sig', onSig);
        V.ch.on('talk', (d, from) => { V.talk[from] = !!(d && d.on); marks(); paint(); });
        V.ch.presence((list) => sync(list));
        await V.ch.ready;
        V.joining = false; meter(); SFX.play('reveal');
        try { sessionStorage.setItem('ps_vc_auto', '1'); } catch (e) {}      // the next private room joins voice by itself
        seenMark(code, 'joined');
        closePop(); paint(); coach(o.auto);
        sync(V.ch.members());
      }
      function stopMic() { if (V.stream) V.stream.getTracks().forEach((t) => t.stop()); V.stream = null; }
      function userLeave() { try { sessionStorage.removeItem('ps_vc_auto'); } catch (e) {} leave(); hideCoach(); }
      function leave() {
        Object.keys(V.peers).forEach(drop);
        if (V.ch) { try { V.ch.close(); } catch (e) {} } V.ch = null;
        stopMic(); V.code = null; V.inVoice = null; V.talk = {}; V.tries = {}; V.fail = {}; V.live = false; V.joining = false;
        if (V.meterT) clearInterval(V.meterT); V.meterT = null; if (V.ac) { try { V.ac.close(); } catch (e) {} V.ac = null; }
        marks(); paint();
      }

      // ---------- the connections (one per other person in voice) ----------
      function sync(list) {
        if (!V.ch) return;
        const ids = (list || []).map((x) => x.uid).filter((u) => u && u !== me());
        (list || []).forEach((x) => { if (x.uid) V.names[x.uid] = { name: x.name || 'Player', av: x.avatar || '🙂' }; });
        const was = V.inVoice || ids;
        ids.filter((u) => !was.includes(u)).forEach((u) => note(`${V.names[u].av} <b>${esc(V.names[u].name)}</b> ${T('joined voice', 'đã vào thoại')}`));
        was.filter((u) => !ids.includes(u)).forEach((u) => V.names[u] && note(`${V.names[u].av} <b>${esc(V.names[u].name)}</b> ${T('left voice', 'đã rời thoại')}`));
        V.inVoice = ids;
        Object.keys(V.peers).forEach((u) => { if (!ids.includes(u)) drop(u); });
        ids.slice(0, MAX - 1).forEach((u) => { if (!V.peers[u] && me() < u) connect(u, true); });   // the smaller id calls
        paint();
      }
      // Each side sends ONE message with everything the other needs (its whole address list, gathered first),
      // so nothing can arrive before the other screen is ready for it (that left people stuck on "connecting").
      const settle = (pc) => new Promise((res) => {
        if (pc.iceGatheringState === 'complete') return res();
        const t = setTimeout(res, 3500);
        pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } });
      });
      const sdpOf = (pc) => { const d = pc.localDescription; return d && d.toJSON ? d.toJSON() : { type: d.type, sdp: d.sdp }; };
      function connect(u, caller) {
        const pc = new RTCPeerConnection({ iceServers: V.iceList || [{ urls: 'stun:stun.cloudflare.com:3478' }] });
        const P = { pc, u, audio: null, q: [], caller, at: Date.now(), tries: (V.tries[u] || 0) };
        V.peers[u] = P;
        if (V.stream) V.stream.getTracks().forEach((t) => pc.addTrack(t, V.stream));
        pc.ontrack = (e) => {
          let a = P.audio; if (!a) { a = P.audio = document.createElement('audio'); a.autoplay = true; a.setAttribute('playsinline', ''); a.dataset.vc = u; box().appendChild(a); }
          a.srcObject = e.streams[0] || new MediaStream([e.track]); a.muted = !!V.muted[u]; a.volume = V.vol; a.play().catch(() => {});
        };
        pc.onconnectionstatechange = () => {
          const st = pc.connectionState; if (st === 'connected') { V.tries[u] = 0; V.fail[u] = false; } paint();
          if (st === 'failed' && V.peers[u] === P) retry(u, P);
        };
        if (caller) (async () => {
          try { await pc.setLocalDescription(await pc.createOffer()); await settle(pc); if (V.peers[u] === P && V.ch) V.ch.send('sig', { to: u, sdp: sdpOf(pc) }); } catch (e) { retry(u, P); }
        })();
        return P;
      }
      // not connected after a while: the caller starts again (3 tries), then the row says there's no connection
      function retry(u, P) {
        if (V.peers[u] !== P) return;
        drop(u);
        const n = (V.tries[u] || 0) + 1; V.tries[u] = n;
        if (n >= 3) { V.fail[u] = true; paint(); }
        if (V.ch && me() < u) setTimeout(() => { if (V.ch && !V.peers[u] && (V.ch.members() || []).some((x) => x.uid === u)) connect(u, true); }, n >= 3 ? 10000 : 1200);
        else if (V.ch) V.ch.send('sig', { to: u, again: 1 });       // ask the caller to start again
      }
      setInterval(() => { Object.values(V.peers).forEach((P) => { const st = P.pc.connectionState; if (st !== 'connected' && Date.now() - P.at > 15000) retry(P.u, P); }); }, 2000);
      function drop(u) { const P = V.peers[u]; if (!P) return; delete V.peers[u]; try { P.pc.close(); } catch (e) {} if (P.audio) { P.audio.srcObject = null; P.audio.remove(); } delete V.talk[u]; }
      async function onSig(d, from) {
        if (!V.ch || !d || d.to !== me() || !from || from === me()) return;
        let P = V.peers[from];
        try {
          if (d.again) { if (me() < from) { if (P) drop(from); connect(from, true); } return; }
          if (d.sdp && d.sdp.type === 'offer') {
            if (P && P.caller) return;                                     // both called at once: the smaller id wins
            if (P) drop(from);                                             // a fresh call from them (they reconnected)
            if (Object.keys(V.peers).length >= MAX - 1) return;
            P = connect(from, false);
            await P.pc.setRemoteDescription(d.sdp);
            await P.pc.setLocalDescription(await P.pc.createAnswer());
            await settle(P.pc);
            if (V.peers[from] === P && V.ch) V.ch.send('sig', { to: from, sdp: sdpOf(P.pc) });
          } else if (d.sdp && d.sdp.type === 'answer') {
            if (P && P.pc.signalingState === 'have-local-offer') await P.pc.setRemoteDescription(d.sdp);
          } else if (d.ice && P && P.pc.remoteDescription) await P.pc.addIceCandidate(d.ice).catch(() => {});
        } catch (e) { if (P) retry(from, P); }
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
        if (on) { hideCoach(true); try { SFX.play('tick'); } catch (e) {} }
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
          f.oncontextmenu = (e) => e.preventDefault();
          f.onpointerdown = (e) => { if (V.ch && V.mode === 'ptt') { V.pressAt = Date.now(); setLive(true); } };
          const upf = () => { if (V.pressAt) { const long = Date.now() - V.pressAt > 300; V.pressAt = 0; setLive(false); if (long) f.dataset.skipClick = '1'; } };
          f.onpointerup = upf; f.onpointerleave = upf; f.onpointercancel = upf;
          f.addEventListener('click', (e) => { if (f.dataset.skipClick) { delete f.dataset.skipClick; e.stopImmediatePropagation(); } }, true);
          document.body.appendChild(f);
        }
        const n = V.ch ? Object.keys(V.peers).length + 1 : 0, talking = V.ch && (V.mode === 'open' ? !V.selfMute : V.live);
        f.className = 'vc-fab' + (V.ch ? ' on' : '') + (talking ? ' live' : '') + (V.ch && V.mode === 'ptt' && !talking && document.getElementById('vc-coach') && !document.querySelector('#vc-coach.good') ? ' coach' : '') + (V.ch && Object.keys(V.talk).some((u) => u !== me() && V.talk[u]) ? ' hear' : '');
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
      function openPop() { V.open = true; hideNudge(); hideCoach(); paint(); }
      function closePop() { V.open = false; const p = document.getElementById('vc-pop'); if (p) p.remove(); }
      function person(u, nm, isMe) {
        const P = V.peers[u], st = isMe ? 'you' : !P ? 'connecting' : P.pc.connectionState;
        const word = isMe ? 'YOU' : st === 'connected' ? '' : V.fail[u] ? 'NO CONNECTION' : 'CONNECTING...';
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
            ${Object.keys(V.fail).some((u) => V.fail[u]) ? '<p class="text-xs text-coral">Can\'t reach someone: their internet (or yours) blocks direct voice. Still trying every few seconds. Trying another Wi-Fi or mobile data can help.</p>' : ''}
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
        if (q('#vc-join')) q('#vc-join').onclick = () => join();
        if (q('#vc-leave')) q('#vc-leave').onclick = userLeave;
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
        if (code !== V.roomAt.code) V.roomAt = { code, at: Date.now() };
        listen(V.ch ? null : code);
        autoJoin(code);
        nudge(); placeBubbles();
      }, 800);
      // phones/tablets may block the friends' voices until the page is tapped once: start them on the next tap
      document.addEventListener('pointerdown', () => { Object.values(V.peers).forEach((P) => { if (P.audio && P.audio.paused && P.audio.srcObject) P.audio.play().catch(() => {}); }); }, true);
      window.addEventListener('pagehide', () => { if (V.ch) leave(); });

      // ---------- making it easy (Inna, Nov 2026): a reminder to join, a tip after joining, notes when people come and go ----------
      const T = (en, vi) => (typeof LANG !== 'undefined' && LANG.code === 'vi' ? vi : en);
      V.roomAt = { code: null, at: 0 };
      let L = null;                                       // listen-only peek at who is in voice (you are not counted)
      function listen(code) {
        if (L && L.code === code) return;
        if (L) { try { L.ch.close(); } catch (e) {} L = null; }
        if (!code || typeof NET === 'undefined' || !NET.channel) return;
        const ch = NET.channel('vc:' + code, {}, { quiet: true });
        L = { code, ch, list: [] };
        ch.presence((list) => { if (L && L.ch === ch) { L.list = (list || []).filter((x) => x.uid && x.uid !== me()); nudge(); } });
      }
      const seenAll = () => { try { return JSON.parse(sessionStorage.getItem('ps_vc_seen') || '{}'); } catch (e) { return {}; } };
      const seen = (code) => seenAll()[code] || {};
      function seenMark(code, k, v) { const a = seenAll(); a[code] = Object.assign({}, a[code], { [k]: v === undefined ? 1 : v }); try { sessionStorage.setItem('ps_vc_seen', JSON.stringify(a)); } catch (e) {} }
      // you joined voice in the last room and the microphone is already allowed: join again by yourself
      async function autoJoin(code) {
        if (!code || V.ch || V.joining || V.autoTried === code) return;
        let on = false; try { on = sessionStorage.getItem('ps_vc_auto') === '1'; } catch (e) {}
        if (!on || (NET.isGuest && NET.isGuest()) || seen(code).left) return;
        V.autoTried = code;
        try { const st = navigator.permissions && await navigator.permissions.query({ name: 'microphone' }); if (st && st.state !== 'granted') return; } catch (e) { return; }
        if (roomCode() === code && !V.ch) join({ auto: true });
      }
      function bubble(id, cls) { let b = document.getElementById(id); if (!b) { b = document.createElement('div'); b.id = id; b.className = 'vc-bub ' + (cls || ''); b.onclick = (e) => e.stopPropagation(); document.body.appendChild(b); } return b; }
      function hideNudge() { const b = document.getElementById('vc-nudge'); if (b) b.remove(); }
      function nudge() {
        const code = roomCode(), f = document.getElementById('vc-fab');
        const blocked = !code || !f || V.ch || V.joining || V.open || document.getElementById('vc-coach') || document.querySelector('#em-menu:not(.hidden)') || (document.getElementById('chat-panel') && !document.getElementById('chat-panel').classList.contains('hidden') && document.getElementById('chat-panel').offsetWidth);
        if (blocked) return hideNudge();
        const sn = seen(code), others = (L && L.code === code ? L.list : []), guest = NET.isGuest && NET.isGuest();
        let msg = null;
        if (others.length && others.length > (sn.n || 0)) {
          const names = others.slice(0, 2).map((x) => `<b>${esc(x.name || 'Player')}</b>`).join(T(' and ', ' và ')) + (others.length > 2 ? T(` +${others.length - 2} more`, ` +${others.length - 2} người`) : '');
          msg = { key: 'n' + others.length, t: `${names} ${others.length > 1 ? T('are talking in voice chat.', 'đang nói chuyện trong thoại.') : T('is in voice chat.', 'đang ở trong thoại.')} ${T('Join them!', 'Vào cùng nhé!')}`, n: others.length };
        } else if (!guest && !sn.invite && Date.now() - V.roomAt.at > 2500) msg = { key: 'inv', t: T('Want to talk while you play? <b>Join voice chat</b> with the players in this room.', 'Muốn vừa chơi vừa nói chuyện? <b>Vào thoại</b> với mọi người trong phòng.'), n: 0, invite: true };
        if (!msg) return hideNudge();
        const b = bubble('vc-nudge');
        if (b.dataset.k !== msg.key) {
          b.dataset.k = msg.key; b.dataset.at = Date.now();
          b.innerHTML = `<button class="vc-bx" aria-label="Close">✕</button><div class="vc-bt"><span class="vc-bi">🎙</span><span>${msg.t}</span></div>
            <div class="vc-bb">${guest ? `<button class="btn-game btn-amber py-1.5 px-3 text-sm" data-a="signup">${T('Sign up to talk', 'Đăng ký để nói')}</button>` : `<button class="btn-game btn-teal py-1.5 px-4 text-sm" data-a="join">🎤 ${T('Join voice', 'Vào thoại')}</button>`}<button class="vc-later" data-a="later">${T('Not now', 'Để sau')}</button></div>`;
          const done = () => { seenMark(code, 'invite'); seenMark(code, 'n', others.length); hideNudge(); };
          b.querySelector('.vc-bx').onclick = done; b.querySelector('[data-a="later"]').onclick = done;
          const j = b.querySelector('[data-a="join"]'); if (j) j.onclick = () => { done(); join(); };
          const su = b.querySelector('[data-a="signup"]'); if (su) su.onclick = () => { done(); if (typeof openAuthModal === 'function') openAuthModal('signup'); };
          SFX.play('tick');
        }
        if (msg.invite && Date.now() - +b.dataset.at > 14000) { seenMark(code, 'invite'); hideNudge(); }   // the first invite fades away by itself
      }
      // after joining: how to talk
      function coach(auto) {
        hideNudge();
        let n = 0; try { n = +localStorage.getItem('ps_vc_coach') || 0; localStorage.setItem('ps_vc_coach', String(n + 1)); } catch (e) {}
        const short = n >= 3 || auto, ptt = V.mode === 'ptt';
        const b = bubble('vc-coach', 'coach');
        b.innerHTML = `<button class="vc-bx" aria-label="Close">✕</button>
          <div class="vc-bt"><span class="vc-bi">${ptt ? '✋' : '🎙'}</span><span>${auto ? T('<b>Voice chat is on.</b> ', '<b>Đã bật thoại.</b> ') : T('<b>You\'re in voice chat!</b> ', '<b>Bạn đã vào thoại!</b> ') }${ptt
            ? T('<b>Hold the 🎤 button</b> to talk, let go to stop.', '<b>Giữ nút 🎤</b> để nói, thả ra để dừng.') + (short || (window.matchMedia && matchMedia('(pointer: coarse)').matches) ? '' : T(' You can also hold the <b>V</b> key.', ' Cũng có thể giữ phím <b>V</b>.'))
            : T('Your mic is on: everyone in voice hears you. Tap 🎤 to mute.', 'Mic đang bật: mọi người trong thoại đều nghe bạn. Chạm 🎤 để tắt.')}</span></div>
          ${short ? '' : `<div class="vc-bb"><span class="vc-try">${ptt ? T('Try it now: hold 🎤 and say hi!', 'Thử ngay: giữ 🎤 và chào mọi người!') : ''}</span><button class="btn-game btn-teal py-1.5 px-4 text-sm" data-a="ok">${T('Got it', 'Đã hiểu')}</button></div>`}`;
        b.querySelector('.vc-bx').onclick = () => hideCoach(); const ok = b.querySelector('[data-a="ok"]'); if (ok) ok.onclick = () => hideCoach();
        const f = document.getElementById('vc-fab'); if (f && ptt) f.classList.add('coach');
        clearTimeout(V.coachT); V.coachT = setTimeout(() => hideCoach(), short ? 5000 : 14000);
        placeBubbles();
      }
      function hideCoach(talked) {
        const b = document.getElementById('vc-coach'); if (!b) return;
        clearTimeout(V.coachT); const f = document.getElementById('vc-fab'); if (f) f.classList.remove('coach');
        if (talked) { b.classList.add('good'); b.innerHTML = `<div class="vc-bt"><span class="vc-bi">✅</span><span>${T('<b>That\'s it!</b> Your friends can hear you while you hold it.', '<b>Đúng rồi!</b> Bạn bè nghe bạn khi bạn giữ nút.')}</span></div>`; setTimeout(() => b.remove(), 2200); }
        else b.remove();
      }
      // small notes while you are in voice: "Bao joined voice"
      function note(html) {
        if (!V.ch) return;
        const b = bubble('vc-note', 'note'); b.innerHTML = `<div class="vc-bt">${html}</div>`; b.style.display = '';
        clearTimeout(V.noteT); V.noteT = setTimeout(() => { const x = document.getElementById('vc-note'); if (x) x.remove(); }, 3200);
        placeBubbles();
      }
      function placeBubbles() {
        const f = document.getElementById('vc-fab');
        ['vc-nudge', 'vc-coach', 'vc-note'].forEach((id) => {
          const b = document.getElementById(id); if (!b) return;
          if (!f) return b.remove();
          const r = f.getBoundingClientRect(), w = b.offsetWidth;
          const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - 34));
          b.style.left = left + 'px'; b.style.bottom = Math.round(window.innerHeight - r.top + 30) + 'px';   // room for the HOLD label above the button
          b.style.setProperty('--ax', Math.round(r.left + r.width / 2 - left) + 'px');
        });
      }
      window.addEventListener('resize', placeBubbles);
      function setVol(v) { V.vol = Math.max(0, Math.min(1, +v || 0)); save(); Object.values(V.peers).forEach((P) => { if (P.audio) P.audio.volume = V.vol; }); }
      window.VOICE = { join, leave: userLeave, setLive, setVol, getVol: () => (typeof V.vol === 'number' ? V.vol : 1), state: () => ({ code: V.code, on: !!V.ch, mode: V.mode, live: V.live, talk: Object.assign({}, V.talk), peers: Object.fromEntries(Object.entries(V.peers).map(([u, P]) => [u, P.pc.connectionState])) }),
        stats: async () => { const out = {}; for (const [u, P] of Object.entries(V.peers)) { let rx = 0; (await P.pc.getStats()).forEach((r) => { if (r.type === 'inbound-rtp' && r.kind === 'audio') rx += r.bytesReceived || 0; }); out[u] = rx; } return out; } };
    })();
