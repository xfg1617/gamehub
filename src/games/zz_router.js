    /* =========================================================================
       ADDRESSES FOR EVERY PAGE (Nov 2026, Inna: "every time I go to a different page the URL changes")
       gamehub.us.com/            home            /friends   /profile   /leaderboard   /how-to-play   /daily-word
       gamehub.us.com/chess       a game (its shown name as a slug: /landlord, /castles-and-kings, /sea-battle...)
       gamehub.us.com/r/CODE      room invite links (unchanged, handled by handleJoinLink in core)
       The browser's Back / Forward buttons move between them (leaving a game in progress still asks first),
       a refresh stays on the same page, and a link like gamehub.us.com/poker opens Poker straight away.
       Cloudflare Pages already serves the page for any address (there is no 404.html), so no server setup.
       Only on http(s): a file:// copy (tests) keeps working without addresses.
       ========================================================================= */
    (function router() {
      if (!/^https?:$/.test(location.protocol) || !window.history || !history.pushState) return;
      const PAGES = { play: '/', leaderboard: '/leaderboard', rules: '/how-to-play', daily: '/daily-word', profile: '/profile', friends: '/friends', naval: '/sea-battle', connect4: '/four-in-a-row' };
      const TITLES = { '/': 'GameHub', '/leaderboard': 'Leaderboard', '/how-to-play': 'How to Play', '/daily-word': 'Daily Word', '/profile': 'My Profile', '/friends': 'Friends', '/sea-battle': 'Sea Battle', '/four-in-a-row': 'Four-in-a-Row' };
      const slug = (s) => String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const gameSlug = (id) => { const m = GAME_MODS[id]; if (!m) return null; if (id === 'navalnet') return 'sea-battle'; return slug(m.name); };
      // the address for what is on screen right now
      function here() {
        // in a room or at an online table: the room's own link, so a friend (or you, after a lost connection) can use it
        if (activeView === 'game' && typeof NP !== 'undefined' && (NP.table || NP.lobby) && activeGame) return '/r/' + (NP.table || NP.lobby);
        if (activeView === 'game' && typeof activeGame !== 'undefined' && activeGame) { const s = gameSlug(activeGame); return s ? '/' + s : '/'; }
        return PAGES[activeView] || '/';
      }
      function titleFor(p) {
        if (/^\/r\//.test(p)) { const m = activeGame && GAME_MODS[activeGame]; return `${m ? m.name + ' · ' : ''}Room ${p.slice(3)} · GameHub`; }
        if (TITLES[p]) return p === '/' ? 'GameHub · Play with friends' : `${TITLES[p]} · GameHub`;
        const id = idFor(p); const m = id && GAME_MODS[id];
        return m ? `${m.name} · GameHub` : 'GameHub';
      }
      // which game an address means
      function idFor(p) {
        const s = String(p || '').replace(/^\/+|\/+$/g, '').toLowerCase(); if (!s) return null;
        if (s === 'sea-battle') return 'naval';
        return Object.keys(GAME_MODS).find((id) => !GAME_MODS[id].hidden && gameSlug(id) === s) || null;
      }
      // show what an address means (from a link, a refresh, or Back / Forward)
      function open(p) {
        p = p || '/';
        if (/^\/r\//i.test(p)) return;                                   // room invites: handleJoinLink does those
        const page = Object.keys(PAGES).find((k) => PAGES[k] === p && k !== 'naval' && k !== 'connect4');
        if (page === 'daily') return openDailyWord(false);
        if (page) return navigateTo(page, true);
        const id = idFor(p);
        if (id === 'naval') return openSetup('naval');
        if (id) return openGame(id);
        navigateTo('play', true);
      }
      // after every page change: put its address in the address bar (a new history entry, so Back works)
      let quiet = false, last = location.pathname;
      function sync() {
        if (quiet) return;
        const p = here();
        if (p === location.pathname) { document.title = titleFor(p); return; }
        // keep an invite address until the friend has actually landed in the game
        if (/^\/r\//i.test(location.pathname) && p === '/' && typeof NP !== 'undefined' && NP.joining && !NP.lobby && !NP.table) return;
        history.pushState({ p }, '', p);
        last = p; document.title = titleFor(p);
      }
      const later = () => setTimeout(sync, 0);                           // openGame sets the game just after navigateTo
      const nav0 = window.navigateTo, game0 = window.openGame;
      window.navigateTo = function () { const r = nav0.apply(this, arguments); later(); return r; };
      window.openGame = function () { const r = game0.apply(this, arguments); later(); return r; };
      try { navigateTo = window.navigateTo; openGame = window.openGame; } catch (e) {}   // the page calls them by name
      // Back / Forward
      window.addEventListener('popstate', () => {
        const p = location.pathname;
        if (p === here()) return;
        const go = () => { quiet = true; try { open(p); } finally { quiet = false; } last = p; document.title = titleFor(p); };
        if (typeof gameInProgress === 'function' && gameInProgress()) {
          const back = here();
          history.pushState({ p: back }, '', back);                     // stay put until they say yes
          askConfirm({ title: 'LEAVE THIS GAME?', sub: 'Your game is still going. If you leave now, this game will be lost.', yes: 'Leave game', no: 'Keep playing' })
            .then((ok) => { if (!ok) return; if (typeof GT !== 'undefined') { GT.started = false; GT.over = true; } if (typeof NP !== 'undefined' && NP.S && NP.S.online && NP.S.leave) NP.S.leave(); history.replaceState({ p }, '', p); go(); });
          return;
        }
        go();
      });
      // a link or a refresh on a page / game address: open it once the site is ready (online games wait for the
      // connection, so the online choices are there)
      const start = location.pathname;
      if (start !== '/' && !/^\/r\//i.test(start) && (idFor(start) || Object.values(PAGES).includes(start))) {
        let done = false;
        const run = () => { if (done) return; done = true; quiet = true; try { open(start); } finally { quiet = false; } history.replaceState({ p: here() }, '', here()); document.title = titleFor(here()); };
        if (typeof NET !== 'undefined' && NET.mode && NET.mode !== 'off') {
          document.addEventListener('ps-online', () => setTimeout(run, 50), { once: true });
          document.addEventListener('ps-offline', () => setTimeout(run, 50), { once: true });
          setTimeout(run, 8000);
        } else setTimeout(run, 300);
      } else if (start === '/my-stats') {
        // the owner's private stats page (zz_ownerstats.js): waits for the connection, then asks the server
        let done = false; const run = () => { if (done) return; done = true; if (window.openOwnerStats) openOwnerStats(); };
        document.addEventListener('ps-online', () => setTimeout(run, 50), { once: true });
        document.addEventListener('ps-offline', () => setTimeout(run, 50), { once: true });
        setTimeout(run, 8000);
      } else if (!/^\/r\//i.test(start) && start !== '/') history.replaceState({ p: '/' }, '', '/');   // an unknown address: home
      history.replaceState({ p: location.pathname }, '', location.pathname + location.hash);
      window.ROUTER = { here, open, idFor, gameSlug, sync };
    })();
