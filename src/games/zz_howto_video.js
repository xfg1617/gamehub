    /* =========================================================================
       "WATCH HOW TO PLAY" (Nov 2026, Inna: "video instruction" + "add voice for instruction videos").
       Every guide gets a short animated video made from the guide itself: the goal, each step with the game's own
       pieces, what things mean, a tip, then "Play". A voice reads each caption (the browser's built-in speech, in
       English or Vietnamese, no files). With no voice on the device, the captions move on by themselves.
       Controls: pause / next / voice on-off / close. playHowTo(id) opens it; the guide has a "▶ Watch" button.
       ========================================================================= */
    (function howtoVideo() {
      const strip = (h) => { const d = document.createElement('div'); d.innerHTML = String(h || ''); return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
      let V = null;   // the video that is playing
      const voiceOn = () => { try { return localStorage.getItem('ps_hv_voice') !== '0'; } catch (e) { return true; } };
      function pickVoice(lang) {
        const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
        const want = lang === 'vi' ? /^vi/i : /^en/i;
        return vs.find((v) => want.test(v.lang) && /female|samantha|google|natural/i.test(v.name)) || vs.find((v) => want.test(v.lang)) || null;
      }
      function slidesFor(id) {
        let h = HOWTO[id]; if (!h) return null;
        const vi = typeof LANG !== 'undefined' && LANG.code === 'vi';
        if (vi && window.HOWTO_VI && HOWTO_VI[id]) h = Object.assign({}, h, HOWTO_VI[id]);
        const c = CATALOG.find((x) => x.id === id) || {}, name = (vi && window.VI_TABLE && VI_TABLE[c.name]) || c.name || 'Game';
        const T = vi ? { how: 'CÁCH CHƠI', goal: 'MỤC TIÊU', tip: 'MẸO', mean: 'Ý NGHĨA', play: 'Chơi ngay', now: 'Đến lượt bạn!', step: 'BƯỚC' } : { how: 'HOW TO PLAY', goal: 'THE GOAL', tip: 'TIP', mean: 'WHAT THINGS MEAN', play: 'Play now', now: 'Now you try!', step: 'STEP' };
        const S = [{ k: 'title', head: name, tag: T.how, say: `${vi ? 'Cách chơi' : 'How to play'} ${name}.` }, { k: 'goal', tag: T.goal, text: strip(h.goal), say: strip(h.goal) }];
        (h.steps || []).forEach(([t, x], i) => S.push({ k: 'step', n: i + 1, tag: `${T.step} ${i + 1}`, head: strip(t), text: strip(x), say: `${strip(t)}. ${strip(x)}` }));
        let items = ''; try { items = h.items ? h.items() : ''; } catch (e) { items = ''; }
        if (items) { const d = document.createElement('div'); d.innerHTML = items; d.querySelectorAll('.ht-item').forEach((it) => { const lab = strip(it.querySelector('.ht-lab') && it.querySelector('.ht-lab').innerHTML), txt = strip(it.querySelector('.ht-txt') && it.querySelector('.ht-txt').innerHTML); S.push({ k: 'item', tag: T.mean, art: it.querySelector('.ht-art') ? it.querySelector('.ht-art').innerHTML : '', head: lab, text: txt, say: `${lab}: ${txt}` }); }); }
        if (h.tip) S.push({ k: 'tip', tag: T.tip, text: strip(h.tip), say: strip(h.tip) });
        S.push({ k: 'end', head: T.now, play: T.play, say: T.now });
        return { id, name, icon: GICONS[c.icon] || '', slides: S, lang: vi ? 'vi' : 'en' };
      }
      function stop() {
        if (!V) return; try { speechSynthesis.cancel(); } catch (e) {} clearTimeout(V.t); clearInterval(V.tw);
        V.el.remove(); document.removeEventListener('keydown', V.key, true); V = null;
      }
      function show(i) {
        if (!V) return; clearTimeout(V.t); clearInterval(V.tw); try { speechSynthesis.cancel(); } catch (e) {}
        V.i = i; const s = V.slides[i], el = V.el;
        if (!s) return stop();
        el.querySelectorAll('.hv-prog i').forEach((b, k) => { b.className = k < i ? 'done' : k === i ? 'on' : ''; });
        const stage = el.querySelector('.hv-stage');
        const art = s.k === 'title' || s.k === 'end' ? `<div class="hv-icon big">${V.icon}</div>` : s.k === 'item' ? `<div class="hv-art">${s.art}</div>` : s.k === 'step' ? `<div class="hv-num">${s.n}</div>` : `<div class="hv-icon">${V.icon}</div>`;
        stage.innerHTML = `<div class="hv-slide hv-${s.k}">${art}${s.tag ? `<div class="hv-tag">${esc(s.tag)}</div>` : ''}${s.head ? `<div class="hv-head">${esc(s.head)}</div>` : ''}
          ${s.text ? `<div class="hv-text"></div>` : ''}${s.k === 'end' ? `<button class="btn-game btn-amber px-10 py-4 text-xl hv-play">▶ ${esc(s.play)}</button>` : ''}</div>`;
        if (s.k === 'end') { stage.querySelector('.hv-play').onclick = () => { const id = V.id; stop(); const g = document.getElementById('guide-modal'); if (g) g.classList.add('hidden'); if (GAME_MODS[id]) openGame(id); else openSetup(id); }; }
        // the caption types itself out while the voice reads it
        const tx = stage.querySelector('.hv-text'), words = (s.text || '').split(' ');
        if (tx) { let w = 0; tx.textContent = ''; V.tw = setInterval(() => { if (w >= words.length) return clearInterval(V.tw); tx.textContent += (w ? ' ' : '') + words[w++]; }, Math.max(60, Math.min(180, 2600 / Math.max(1, words.length)))); }
        if (V.paused) return;
        const next = () => { if (V && V.i === i && !V.paused) V.t = setTimeout(() => show(i + 1), s.k === 'end' ? 999999 : 700); };
        const fallback = () => { V.t = setTimeout(() => show(i + 1), s.k === 'end' ? 999999 : Math.max(3200, (s.say || '').length * 62)); };
        if (V.voice && window.speechSynthesis && s.say) {
          const u = new SpeechSynthesisUtterance(s.say); const v = pickVoice(V.lang);
          if (v) u.voice = v; u.lang = V.lang === 'vi' ? 'vi-VN' : 'en-US'; u.rate = 1; u.pitch = 1.05;
          if (V.lang === 'vi' && !v) return fallback();   // no Vietnamese voice on this device: captions only
          let started = false; u.onstart = () => { started = true; }; u.onend = next; u.onerror = () => { if (V && V.i === i) fallback(); };
          speechSynthesis.speak(u);
          setTimeout(() => { if (V && V.i === i && !started && !speechSynthesis.speaking) fallback(); }, 1500);   // some browsers stay silent
        } else fallback();
      }
      function playHowTo(id) {
        id = { navalnet: 'naval', wordduel: HOWTO.wordduel ? 'wordduel' : 'daily' }[id] || id;
        stop(); const d = slidesFor(id); if (!d) return showToast('No guide for this game yet.', 'info');
        const el = document.createElement('div'); el.className = 'hv'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'How to play video');
        el.innerHTML = `<div class="hv-top"><span class="hv-brand pix">GAMEHUB · ${esc(d.name.toUpperCase())}</span><div class="hv-prog">${d.slides.map(() => '<i></i>').join('')}</div></div>
          <div class="hv-stage"></div>
          <div class="hv-ctl"><button data-hv="prev" aria-label="Back">⏮</button><button data-hv="pause" aria-label="Pause">⏸</button><button data-hv="next" aria-label="Next">⏭</button><button data-hv="voice" aria-label="Voice on or off"></button><button data-hv="x" aria-label="Close">✕</button></div>`;
        document.body.appendChild(el);
        V = Object.assign(d, { el, i: 0, paused: false, voice: voiceOn() });
        const vb = el.querySelector('[data-hv="voice"]'); const paintV = () => { vb.textContent = V.voice ? '🔊 Voice' : '🔇 Voice'; }; paintV();
        el.querySelector('[data-hv="x"]').onclick = stop;
        el.querySelector('[data-hv="next"]').onclick = () => show(Math.min(V.slides.length - 1, V.i + 1));
        el.querySelector('[data-hv="prev"]').onclick = () => show(Math.max(0, V.i - 1));
        el.querySelector('[data-hv="pause"]').onclick = (e) => { V.paused = !V.paused; e.target.textContent = V.paused ? '▶' : '⏸'; if (V.paused) { clearTimeout(V.t); try { speechSynthesis.cancel(); } catch (x) {} } else show(V.i); };
        vb.onclick = () => { V.voice = !V.voice; try { localStorage.setItem('ps_hv_voice', V.voice ? '1' : '0'); } catch (e) {} paintV(); show(V.i); };
        V.key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); stop(); } else if (e.key === 'ArrowRight') show(Math.min(V.slides.length - 1, V.i + 1)); else if (e.key === 'ArrowLeft') show(Math.max(0, V.i - 1)); };
        document.addEventListener('keydown', V.key, true);
        if (window.speechSynthesis && !speechSynthesis.getVoices().length) speechSynthesis.onvoiceschanged = () => {};   // voices load late in some browsers
        show(0);
      }
      window.playHowTo = playHowTo; window.howtoSlides = slidesFor;
    })();
