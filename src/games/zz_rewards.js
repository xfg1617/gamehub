    /* =========================================================================
       REWARDS + WELCOME (Inna, Nov 2026)
       * Unlockable avatars: 6 extra pictures on top of the 12 free ones, unlocked by level or wins. Online they need an
         account (guests see them locked with "Make a free account"); offline the condition is enough.
       * Badges: earned by playing (first win, 10 wins, 7-day streak, checkmate, pool win, play every game). Shown on your
         profile page; a toast says when you earn one. Saved in profile.badges (so they move with the account).
       * Welcome pop-up: guests on their first visit (never from an invite link), once more after their first win.
       ========================================================================= */
    (() => {
      const lvl = () => Math.floor((profile.xp || 0) / 100) + 1;
      const totalWins = () => { let w = 0; Object.values(profile.stats || {}).forEach((s) => { w += (s && (s.wins || s.solved)) || 0; }); return Math.max(w, profile.wins || 0); };
      const playedGames = () => Object.values(profile.stats || {}).filter((s) => s && (s.played || 0) > 0).length;
      const allGames = () => Object.keys(GAME_MODS).filter((id) => !GAME_MODS[id].hidden).length + 2;   // + Naval Grid and Daily Word
      const hasAccount = () => !(typeof NET !== 'undefined' && NET.on) || !!NET.account;
      const EXTRA = [
        { av: '🐯', label: 'LV5', why: 'Reach level 5', ok: () => lvl() >= 5 },
        { av: '🐧', label: 'LV10', why: 'Reach level 10', ok: () => lvl() >= 10 },
        { av: '🦄', label: 'LV15', why: 'Reach level 15', ok: () => lvl() >= 15 },
        { av: '🐲', label: 'LV20', why: 'Reach level 20', ok: () => lvl() >= 20 },
        { av: '👑', label: '50W', why: 'Win 50 games', ok: () => totalWins() >= 50 },
        { av: '🛸', label: 'ALL', why: 'Play every game at least once', ok: () => playedGames() >= allGames() },
      ];
      const BADGES = [
        { id: 'first', icon: '🥇', name: 'First win', why: 'Win any game', ok: () => totalWins() >= 1 },
        { id: 'ten', icon: '⭐', name: 'Ten wins', why: 'Win 10 games', ok: () => totalWins() >= 10 },
        { id: 'streak', icon: '🔥', name: 'On fire', why: 'Solve Daily Word 7 days in a row', ok: () => (profile.dailyStreak || 0) >= 7 || ((profile.stats.daily || {}).bestStreak || 0) >= 7 },
        { id: 'mate', icon: '♛', name: 'Checkmate!', why: 'Win a game of Chess', ok: () => ((profile.stats.chess || {}).wins || 0) >= 1 },
        { id: 'pool', icon: '🎱', name: 'Pool shark', why: 'Win a game of Pool', ok: () => ((profile.stats.pool || {}).wins || 0) >= 1 },
        { id: 'all', icon: '🎲', name: 'Explorer', why: 'Play every game at least once', ok: () => playedGames() >= allGames() },
      ];
      const unlocked = (e) => hasAccount() && e.ok();
      window.REWARDS = { EXTRA, BADGES, unlocked, earned: () => (profile.badges || []).slice() };

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

      /* ---------- badges: earned as you play, shown on your profile ---------- */
      function checkBadges() {
        if (!hasAccount() || typeof profile === 'undefined' || !profile.stats) return;
        profile.badges = profile.badges || [];
        BADGES.forEach((b) => {
          if (!profile.badges.includes(b.id) && b.ok()) {
            profile.badges.push(b.id);
            showToast(`New badge: ${b.icon} ${b.name}!`, 'success');
            if (typeof saveProfileToStorage === 'function') saveProfileToStorage();
          }
        });
      }
      function badgesHTML() {
        const have = new Set(profile.badges || []);
        return `<div class="win overflow-hidden" id="bd-box"><div class="winbar amber"><span>BADGES</span><span class="pix text-xs">${have.size} / ${BADGES.length}</span></div>
          <div class="bd-grid">${BADGES.map((b) => `<div class="bd ${have.has(b.id) ? 'on' : ''}" title="${esc(b.why)}"><span class="bd-ic">${b.icon}</span><b>${esc(b.name)}</b><small>${have.has(b.id) ? 'Earned' : esc(b.why)}</small></div>`).join('')}</div>
          ${hasAccount() ? '' : '<div class="px-4 pb-4 text-xs text-muted">Make a free account to earn badges and unlock new avatars. <button class="text-amber underline" onclick="openAuthModal(\'signup\')">Create account</button></div>'}</div>`;
      }
      function paintProfileBadges() {
        const root = document.getElementById('profile-root'), view = document.getElementById('view-profile');
        if (!root || !view || view.classList.contains('hidden') || !root.firstElementChild) return;
        const box = document.getElementById('bd-box'), html = badgesHTML();
        if (!box) { const d = document.createElement('div'); d.innerHTML = html; root.appendChild(d.firstElementChild); }
        else if (box.dataset.sig !== html.length + '|' + (profile.badges || []).join()) { box.outerHTML = html; }
        const nb = document.getElementById('bd-box'); if (nb) nb.dataset.sig = html.length + '|' + (profile.badges || []).join();
      }
      setInterval(() => { try { checkBadges(); paintProfileBadges(); } catch (e) {} }, 1500);

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
      window.addEventListener('ps-online', maybeWelcome);
      if (typeof NET !== 'undefined' && NET.on) maybeWelcome();
      // once more, after a guest's first win
      setInterval(() => {
        if (typeof NET === 'undefined' || !NET.on || NET.account || seen().win || totalWins() < 1) return;
        const m = document.getElementById('g-modal'); if (!m || m.classList.contains('hidden')) return;
        mark('win'); setTimeout(() => welcome('win'), 1800);
      }, 1500);
      window.showWelcome = welcome;
    })();
