    /* =========================================================================
       SOUND & MUSIC (Inna, Nov 2026): four retro tunes made by the browser itself (no music files). One "Sound & Music"
       button (sidebar; ♪ SOUND in the phone header; ♪ in every game header) opens a panel: sound effects on/off, music on/off, volume, which music
       (Auto = follows what you are doing, one tune, or Shuffle) and "music during games". Saved per browser. Starts ON (quiet) for people; automated test browsers start with it off.
       Browsers only allow sound after the first tap, so the music starts then.
       ========================================================================= */
    const MUSIC = (() => {
      const KEY = 'ps_music_v1';
      const Q = { M: [0, 4, 7, 12], m: [0, 3, 7, 12], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11] };
      const TRACKS = {
        harbor: { name: 'Harbor Lights', mood: 'Calm', bpm: 84, lead: 'triangle', arpWave: 'square', swing: 0,
          chords: [[48, 'M'], [45, 'm'], [41, 'M'], [43, 'M'], [48, 'M'], [45, 'm'], [41, 'M'], [43, 'M']], arp: [0, 1, 2, 3, 2, 1, 2, 1],
          mel: [76, 0, 79, 0, 84, 0, 83, 79, 81, 0, 0, 79, 76, 0, 0, 0, 77, 0, 81, 0, 84, 0, 81, 77, 79, 0, 0, 0, 74, 0, 0, 0,
            72, 0, 76, 79, 0, 76, 72, 0, 76, 0, 72, 0, 69, 0, 0, 0, 69, 72, 77, 0, 76, 0, 74, 0, 74, 0, 79, 0, 0, 0, 0, 0], drum: 'k...s...' },
        arcade: { name: 'Arcade Morning', mood: 'Upbeat', bpm: 128, lead: 'square', arpWave: 'square', swing: 0,
          chords: [[43, 'M'], [38, 'M'], [40, 'm'], [36, 'M'], [43, 'M'], [38, 'M'], [40, 'm'], [36, 'M']], arp: [0, 2, 1, 2, 3, 2, 1, 2],
          mel: [79, 0, 78, 79, 0, 74, 0, 71, 74, 0, 78, 0, 81, 0, 78, 0, 79, 0, 76, 0, 71, 0, 74, 76, 72, 0, 76, 0, 79, 0, 0, 0,
            71, 74, 79, 74, 71, 74, 79, 83, 81, 0, 78, 0, 74, 0, 0, 0, 76, 79, 83, 79, 76, 79, 83, 86, 84, 0, 0, 79, 0, 76, 0, 0], drum: 'khshkksh' },
        card: { name: 'Card Room', mood: 'Jazzy', bpm: 100, lead: 'triangle', arpWave: 'triangle', swing: 0.33, walk: true,
          chords: [[43, 'm7'], [36, '7'], [41, 'maj7'], [38, 'm7'], [43, 'm7'], [36, '7'], [41, 'maj7'], [38, 'm7']], arp: [1, 2, 3, 2, 1, 2, 3, 2],
          mel: [82, 0, 81, 79, 0, 77, 0, 74, 76, 0, 79, 0, 82, 81, 79, 0, 81, 0, 0, 77, 0, 72, 0, 0, 74, 77, 81, 84, 0, 81, 0, 0,
            79, 0, 82, 0, 86, 0, 84, 82, 81, 0, 79, 0, 76, 0, 72, 0, 77, 0, 81, 84, 88, 0, 84, 0, 86, 0, 0, 0, 0, 0, 0, 0], drum: 'h.hhh.hh' },
        island: { name: 'Island Breeze', mood: 'Sunny', bpm: 108, lead: 'square', arpWave: 'triangle', swing: 0,
          chords: [[50, 'M'], [47, 'm'], [43, 'M'], [45, 'M'], [50, 'M'], [47, 'm'], [43, 'M'], [45, 'M']], arp: [0, 1, 2, 1, 3, 1, 2, 1],
          mel: [78, 0, 81, 83, 81, 0, 78, 76, 74, 0, 0, 78, 0, 76, 74, 0, 71, 74, 76, 0, 78, 0, 81, 0, 76, 0, 0, 0, 0, 0, 73, 76,
            86, 0, 83, 81, 0, 78, 81, 0, 83, 0, 78, 0, 74, 0, 0, 0, 79, 0, 78, 76, 0, 74, 0, 71, 73, 0, 76, 0, 81, 0, 0, 0], drum: 'k..hk.s.' },
      };
      const ORDER = ['harbor', 'arcade', 'card', 'island'];
      // Auto: what plays where
      const AUTO = { poker: 'card', blackjack: 'card', kittens: 'card', colorclash: 'card', isles: 'island', pool: 'island', bowling: 'island', tycoon: 'island',
        impostor: 'arcade', doodle: 'arcade', dominoes: 'arcade', tictactoe: 'arcade', c4: 'arcade' };
      const st = Object.assign({ on: !navigator.webdriver, vol: 0.35, pick: 'auto', inGames: true }, (() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } })());
      const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
      let ac = null, master = null, noiseBuf = null, timer = null, step = 0, nextT = 0, cur = null, shuffleAt = 0, unlocked = false;
      const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
      function setup() {
        if (ac) return true;
        try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
        master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
        const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        return true;
      }
      function tone(wave, f, t, dur, v) {
        const o = ac.createOscillator(), g = ac.createGain(); o.type = wave; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
      }
      function noise(t, dur, v, type, f) {
        const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
        s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f;
        g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
      }
      function kick(t) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.2);
      }
      function playStep(tr, i, t) {
        const sd = 60 / tr.bpm / 2, bar = Math.floor(i / 8) % tr.chords.length, s = i % 8;
        const [root, q] = tr.chords[bar], tones = Q[q];
        if (tr.swing && s % 2 === 1) t += sd * tr.swing;
        tone(tr.arpWave, hz(root + 12 + tones[tr.arp[s]]), t, sd * 0.9, 0.035);
        if (tr.walk) { if (s % 2 === 0) tone('triangle', hz(root - 12 + [0, tones[1], tones[2], tones[3] - 12][s / 2]), t, sd * 1.8, 0.16); }
        else if (s === 0 || s === 4) tone('triangle', hz(root - 12), t, sd * 3.5, 0.16);
        else if (s === 6) tone('triangle', hz(root - 12 + 7), t, sd * 1.5, 0.12);
        const m = tr.mel[i % tr.mel.length];
        if (m) { let len = 1; while (len < 4 && !tr.mel[(i + len) % tr.mel.length]) len++; tone(tr.lead, hz(m), t, sd * len * 0.95, tr.lead === 'square' ? 0.05 : 0.11); }
        const d = tr.drum[s];
        if (d === 'k') kick(t); else if (d === 's') noise(t, 0.12, 0.18, 'bandpass', 1800); else if (d === 'h') noise(t, 0.04, 0.07, 'highpass', 7000);
      }
      function tick() {
        if (!cur || !ac) return;
        const tr = TRACKS[cur], sd = 60 / tr.bpm / 2;
        if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;   // after a pause, carry on instead of rushing to catch up
        while (nextT < ac.currentTime + 0.15) { playStep(tr, step, nextT); step++; nextT += sd; }
        if (st.pick === 'shuffle' && step >= shuffleAt) { const k = ORDER.indexOf(cur); start(ORDER[(k + 1) % ORDER.length]); }
      }
      const inGame = () => (typeof activeGame !== 'undefined' && activeGame) || null;
      function wanted() {
        if (!st.on || !unlocked) return null;
        const g = inGame();
        if (g && !st.inGames) return null;
        if (st.pick === 'shuffle') return cur || ORDER[Math.floor(Math.random() * ORDER.length)];
        if (TRACKS[st.pick]) return st.pick;
        return (g && AUTO[g]) || 'harbor';
      }
      function start(id) {
        if (!setup()) return;
        cur = id; step = 0; nextT = ac.currentTime + 0.1; shuffleAt = TRACKS[id].mel.length * 4;
        if (!timer) timer = setInterval(tick, 25);
        master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(0, ac.currentTime); master.gain.linearRampToValueAtTime(st.vol * 0.6, ac.currentTime + 0.8);
        paint();
      }
      function stopAll() {
        if (timer) { clearInterval(timer); timer = null; }
        if (ac && master) { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(master.gain.value, ac.currentTime); master.gain.linearRampToValueAtTime(0, ac.currentTime + 0.3); }
        cur = null; paint();
      }
      // checked a few times a second: start, change or stop the music to match the settings and where you are
      function sync() {
        const w = wanted();
        if (!w) { if (cur) stopAll(); return; }
        if (ac && ac.state === 'suspended') ac.resume();
        if (w !== cur) start(w);
      }
      function set(k, v) {
        st[k] = v; save();
        if (k === 'vol' && ac && master && cur) { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(st.vol * 0.6, ac.currentTime); }
        if (k === 'pick') { cur = null; if (timer) { clearInterval(timer); timer = null; } }   // switch tune at once
        sync(); paint();
      }

      /* ---------- the button and the panel ---------- */
      const NOTE = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="5" y="2" width="9" height="2"/><rect x="5" y="2" width="2" height="9"/><rect x="12" y="2" width="2" height="8"/><rect x="2" y="10" width="5" height="4"/><rect x="9" y="9" width="5" height="4"/></svg>';
      function buttons() {
        const snd = document.getElementById('snd-btn');
        if (snd && !document.getElementById('mu-btn')) {
          const b = document.createElement('button'); b.id = 'mu-btn'; b.className = snd.className; b.setAttribute('style', snd.getAttribute('style') || ''); b.title = 'Sound effects and music';
          b.innerHTML = `${NOTE}<span id="mu-label">Sound & Music</span>`; snd.insertAdjacentElement('afterend', b); snd.style.display = 'none';
          b.onclick = (e) => { e.stopPropagation(); toggle(b); };
        }
        const m = document.getElementById('snd-btn-m');
        if (m && !document.getElementById('mu-btn-m')) {
          const b = document.createElement('button'); b.id = 'mu-btn-m'; b.className = 'pix text-xs text-muted'; b.title = 'Sound effects and music';
          m.insertAdjacentElement('afterend', b); m.style.display = 'none'; b.onclick = (e) => { e.stopPropagation(); toggle(b); };
        }
        // the older game screens (Sea Battle, Daily Word, Four-in-a-Row) get the same ♪ button in their header
        ['view-naval', 'view-daily', 'view-connect4'].forEach((id) => {
          const panel = document.querySelector(`#${id} > .panel`);
          if (!panel || panel.querySelector('.gs-snd')) return;
          const b = document.createElement('button'); b.className = 'btn-game btn-graphite px-3 py-2 text-xs gs-snd'; b.textContent = '♪'; b.title = 'Sound and music'; b.setAttribute('aria-label', 'Sound and music');
          b.onclick = (e) => { e.stopPropagation(); toggle(b); }; panel.appendChild(b);
        });
        paint();
      }
      function panelHTML() {
        const sw = (k) => `<button class="mu-sw ${st[k] ? 'on' : ''}" data-mu="${k}" role="switch" aria-checked="${st[k] ? 'true' : 'false'}"><i></i></button>`;
        const choice = (id, name, mood) => `<button class="mu-ch ${st.pick === id ? 'sel' : ''}" data-pick="${id}">${name}<small>${mood}</small></button>`;
        const sfx = typeof SFX !== 'undefined' && SFX.isOn();
        return `<div class="mu-hd"><span>♪ SOUND & MUSIC</span><button data-mu="close" aria-label="Close">✕</button></div>
          <div class="mu-bd">
            <div class="mu-row"><span>Sound effects<small>Clicks, dice, cards, wins...</small></span><button class="mu-sw ${sfx ? 'on' : ''}" data-mu="sfx" role="switch" aria-checked="${sfx ? 'true' : 'false'}"><i></i></button></div>
            <div class="mu-row"><span>Music<small>Background tunes</small></span>${sw('on')}</div>
            <div><div class="mu-lab">VOLUME</div><input id="mu-vol" class="mu-range" type="range" min="0" max="100" value="${Math.round(st.vol * 100)}" aria-label="Music volume"></div>
            <div><div class="mu-lab">WHICH MUSIC</div><div class="mu-grid">${choice('auto', 'Auto', 'Changes with the game')}${ORDER.map((k) => choice(k, TRACKS[k].name, TRACKS[k].mood)).join('')}${choice('shuffle', 'Shuffle', 'All of them')}</div></div>
            <div class="mu-row"><span>Music during games<small>Off = only on the menus</small></span>${sw('inGames')}</div>
            <div class="mu-now" id="mu-now"></div>
          </div>`;
      }
      function toggle(anchor) {
        let p = document.getElementById('mu-pop');
        if (p) { p.remove(); return; }
        unlock();
        p = document.createElement('div'); p.id = 'mu-pop'; p.className = 'mu-pop'; p.innerHTML = panelHTML(); document.body.appendChild(p);
        const r = anchor.getBoundingClientRect();
        if (window.innerWidth >= 1024 && r.left < 300) { p.style.left = (r.right + 12) + 'px'; p.style.top = Math.max(10, Math.min(window.innerHeight - p.offsetHeight - 10, r.bottom - p.offsetHeight)) + 'px'; }
        else if (window.innerWidth >= 700) { p.style.left = Math.max(10, Math.min(window.innerWidth - p.offsetWidth - 10, r.right - p.offsetWidth)) + 'px'; p.style.top = (r.top > window.innerHeight / 2 ? Math.max(10, r.top - p.offsetHeight - 10) : r.bottom + 10) + 'px'; }   // a button low on the screen (the game bar) opens it above
        else { p.style.left = '10px'; p.style.right = '10px'; p.style.width = 'auto'; p.style.top = Math.min(r.bottom + 10, window.innerHeight - p.offsetHeight - 10) + 'px'; }
        p.addEventListener('click', (e) => {
          e.stopPropagation();
          const b = e.target.closest('[data-mu],[data-pick]'); if (!b) return;
          if (b.dataset.mu === 'close') return p.remove();
          if (b.dataset.mu === 'sfx') { if (typeof toggleSound === 'function') toggleSound(); p.innerHTML = panelHTML(); wire(p); paint(); }
          else if (b.dataset.mu) { set(b.dataset.mu, !st[b.dataset.mu]); p.innerHTML = panelHTML(); wire(p); }
          else { set('pick', b.dataset.pick); p.innerHTML = panelHTML(); wire(p); }
        });
        wire(p); paint();
      }
      function wire(p) { const v = p.querySelector('#mu-vol'); if (v) v.oninput = () => set('vol', +v.value / 100); paint(); }
      function paint() {
        const sfx = typeof SFX !== 'undefined' && SFX.isOn();
        const lab = document.getElementById('mu-label'); if (lab) lab.innerHTML = `Sound & Music <small class="mu-state">${sfx ? 'ON' : 'OFF'} · ${st.on ? 'ON' : 'OFF'}</small>`;
        const m = document.getElementById('mu-btn-m'); if (m) { m.textContent = '♪ SOUND'; m.style.color = sfx || st.on ? '#2DD4BF' : ''; }
        const now = document.getElementById('mu-now');
        if (now) now.innerHTML = cur ? `<span class="mu-eq"><i></i><i></i><i></i><i></i></span>Now playing: <b>${TRACKS[cur].name}</b>` : (st.on ? (unlocked ? 'Quiet here (music during games is off)' : 'Starts when you tap anywhere') : 'Music is off');
      }
      function unlock() { if (unlocked) return; unlocked = true; setup(); if (ac && ac.state === 'suspended') ac.resume(); sync(); }
      document.addEventListener('pointerdown', unlock, { capture: true });
      document.addEventListener('keydown', unlock, { capture: true });
      document.addEventListener('click', (e) => { const p = document.getElementById('mu-pop'); if (p && !p.contains(e.target) && !e.target.closest('.gs-snd, #mu-btn, #mu-btn-m')) p.remove(); });
      // switching tabs pauses the music where it is and carries on from the same spot when you come back
      document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) { try { ac.suspend(); } catch (e) {} } else { try { ac.resume(); } catch (e) {} sync(); } });
      setInterval(sync, 600);
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buttons); else buttons();
      // the ♪ button in game headers (the side menu is hidden while playing) opens the same panel
      window.openSoundPanel = (anchor) => toggle(anchor);
      return { set, state: () => Object.assign({ playing: cur }, st), tracks: TRACKS, sync, _unlock: unlock };
    })();
    window.MUSIC = MUSIC;
