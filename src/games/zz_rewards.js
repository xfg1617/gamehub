    /* =========================================================================
       REWARDS + WELCOME (Inna, Nov 2026)
       * Unlockable avatars: 6 extra pictures on top of the 12 free ones, unlocked by level or wins. Online they need an
         account (guests see them locked with "Make a free account"); offline the condition is enough.
       * Badges: the site's existing badge list (profile page); a pop-up now says when you earn a new one.
       * Welcome pop-up: guests on their first visit (never from an invite link), once more after their first win.
       ========================================================================= */
    (() => {
      const lvl = () => Math.floor((profile.xp || 0) / 100) + 1;
      const totalWins = () => { let w = 0; Object.values(profile.stats || {}).forEach((s) => { w += (s && (s.wins || s.solved)) || 0; }); return Math.max(w, profile.wins || 0); };
      const playedGames = () => Object.values(profile.stats || {}).filter((s) => s && (s.played || 0) > 0).length;
      const allGames = () => Object.keys(GAME_MODS).filter((id) => !GAME_MODS[id].hidden).length + 2;   // + Sea Battle and Daily Word
      const hasAccount = () => !(typeof NET !== 'undefined' && NET.on) || !!NET.account;
      const EXTRA = [
        { av: '🐯', label: 'LV5', why: 'Reach level 5', ok: () => lvl() >= 5 },
        { av: '🐧', label: 'LV10', why: 'Reach level 10', ok: () => lvl() >= 10 },
        { av: '🦄', label: 'LV15', why: 'Reach level 15', ok: () => lvl() >= 15 },
        { av: '🐲', label: 'LV20', why: 'Reach level 20', ok: () => lvl() >= 20 },
        { av: '👑', label: '50W', why: 'Win 50 games', ok: () => totalWins() >= 50 },
        { av: '🛸', label: 'ALL', why: 'Play every game at least once', ok: () => playedGames() >= allGames() },
      ];
      const unlocked = (e) => hasAccount() && e.ok();
      // badges: the site's badge list (BADGES in the base page, more added in core.js), with their pixel pictures
      const badgeList = () => (typeof BADGES !== 'undefined' ? BADGES : []).map((b) => ({ id: b.name, name: b.name, why: b.desc, icon: (typeof SPRITES !== 'undefined' && SPRITES[b.sprite]) || '🏅' }));
      const earnedNames = () => (typeof BADGES !== 'undefined' ? BADGES : []).filter((b) => { try { return b.ok(profile); } catch (e) { return false; } }).map((b) => b.name);
      window.REWARDS = { EXTRA, get BADGES() { return badgeList(); }, unlocked, earned: earnedNames };

      /* ---------- avatars: the 6 extra pictures appear in the profile's avatar picker ---------- */
      if (typeof renderAvatarGrid === 'function') {
        const orig = renderAvatarGrid;
        renderAvatarGrid = function () {
          orig();
          const grid = document.getElementById('prof-avatar-grid'); if (!grid) return;
          EXTRA.forEach((e) => {
            const open = unlocked(e), btn = document.createElement('button');
            btn.type = 'button'; btn.className = `opt avatar-opt av-extra ${open ? '' : 'locked'} ${e.av === draftAvatar ? 'on' : ''}`;
            btn.innerHTML = `<span>${e.av}</span>${open ? '' : `<small>${e.label}</small><i>🔒</i>`}`;
            btn.title = open ? 'Unlocked' : (hasAccount() ? e.why : `${e.why} with a free account`);
            btn.onclick = () => {
              if (!open) return showToast(hasAccount() ? `🔒 ${e.why} to unlock this avatar.` : `🔒 ${e.why} with a free account to unlock this avatar.`, 'info');
              draftAvatar = e.av; renderAvatarGrid();
            };
            grid.appendChild(btn);
          });
        };
      }

      /* ---------- badges: a pop-up when you earn a new one (the badges themselves are on your profile page) ---------- */
      let known = null;
      setInterval(() => {
        try {
          if (typeof profile === 'undefined' || !profile.stats) return;
          const now = earnedNames();
          if (known === null) { known = new Set(now); return; }   // the ones you already had when the page opened
          now.filter((n) => !known.has(n)).forEach((n) => { known.add(n); showToast(`New badge: ${n}!`, 'success'); });
        } catch (e) {}
      }, 1500);

      /* ---------- welcome pop-up for guests ---------- */
      const KEY = 'ps_welcome_v1';
      const seen = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
      const mark = (k) => { const s = seen(); s[k] = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
      function welcome(kind) {
        if (navigator.webdriver || document.getElementById('wl-pop')) return;
        const win = kind === 'win';
        const d = document.createElement('div'); d.id = 'wl-pop'; d.className = 'wl-back';
        d.innerHTML = `<div class="win wl"><div class="winbar amber"><span>${win ? 'NICE WIN!' : 'WELCOME!'}</span><button class="pix text-sm" data-x aria-label="Close">✕</button></div>
          <div class="wl-bd"><h3>${win ? 'Save this win' : 'Save your progress'}</h3><p>Make a free account to keep what you earn.</p>
            <div class="wl-perks"><div><span>💾</span><b>Progress</b></div><div><span>🦄</span><b>Avatars</b></div><div><span>🏅</span><b>Badges</b></div></div>
            <button class="btn-game btn-amber w-full py-2.5 text-sm" data-go="signup">Create free account</button>
            <button class="pix text-xs text-amber mt-3 block mx-auto" data-go="signin">I already have an account</button>
            <button class="wl-later" data-x>Maybe later</button></div></div>`;
        document.body.appendChild(d);
        d.addEventListener('click', (e) => {
          const go = e.target.closest('[data-go]');
          if (go) { d.remove(); return openAuthModal(go.dataset.go); }
          if (e.target === d || e.target.closest('[data-x]')) d.remove();
        });
      }
      function maybeWelcome() {
        if (typeof NET === 'undefined' || !NET.on || NET.account || seen().first) return;
        if (/\/r\/|join=/i.test(location.pathname + location.hash)) { mark('first'); return; }   // came from an invite: let them play first
        setTimeout(() => { if (!NET.account && typeof activeView !== 'undefined' && activeView === 'play' && !seen().first) { mark('first'); welcome('first'); } }, 2000);
      }
      document.addEventListener('ps-online', maybeWelcome);   // net.js announces the connection on document
      if (typeof NET !== 'undefined' && NET.on) maybeWelcome();
      // once more, after a guest's first win
      setInterval(() => {
        if (typeof NET === 'undefined' || !NET.on || NET.account || seen().win || totalWins() < 1) return;
        const m = document.getElementById('g-modal'); if (!m || m.classList.contains('hidden')) return;
        mark('win'); setTimeout(() => welcome('win'), 1800);
      }, 1500);
      window.showWelcome = welcome;
    })();
