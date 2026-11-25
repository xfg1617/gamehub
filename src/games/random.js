    /* =========================================================================
       RANDOM GAME (Inna, Nov 2026): a tile like the others, first in the grid. Players meet in a room (or a quick
       match), then we pick the game and its settings at random. SESSION: 1 game (Quickie), 3 or 5 games; points from
       every game add up and the most points at the end is the champion (the standings and "next game" live in the
       result screen box, npRematchSlot in netplay.js). On this device (Solo / offline) it plays random games against
       computer players, one after another.
       ========================================================================= */
    (function randomGame() {
      const K = '#050E18';
      GICONS.random = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="6" width="14" height="14" fill="${K}"/><rect x="3" y="7" width="12" height="12" fill="#F7F4EC"/><rect x="5" y="9" width="3" height="3" fill="#FB7185"/><rect x="10" y="14" width="3" height="3" fill="#FB7185"/><rect x="8" y="11" width="2" height="3" fill="#FB7185"/><rect x="9" y="1" width="14" height="14" fill="${K}"/><rect x="10" y="2" width="12" height="12" fill="#F5B041"/><rect x="13" y="4" width="6" height="2" fill="${K}"/><rect x="17" y="6" width="2" height="2" fill="${K}"/><rect x="15" y="8" width="2" height="2" fill="${K}"/><rect x="15" y="11" width="2" height="2" fill="${K}"/></svg>`;
      const OPTS = [
        { key: 'ses', label: 'SESSION', def: 3, choices: [[1, 'Quickie · 1 game'], [3, '3 games'], [5, 'Long · 5 games']], hint: 'Points from every game add up. Most points at the end is the champion.' },
        { key: 'spd', label: 'GAME LENGTH', def: 'quick', choices: [['quick', 'Quick versions'], ['normal', 'Normal']], hint: 'Quick versions use the short settings of each game.' },
        { key: 'kind', label: 'WHICH GAMES', def: 'all', choices: [['all', 'Any game'], ['card', 'Card games'], ['board', 'Board games'], ['party', 'Party games']] },
        { key: 'rep', label: 'Same game twice', toggle: true, def: 0, choices: [[1, 'Yes'], [0, 'No']], hint: 'Off: every game in the session is different.' },
      ];
      const session = (sel, names) => ({ n: +sel.ses || 1, k: 1, kind: sel.kind === 'all' ? null : sel.kind, spd: sel.spd, rep: !!+sel.rep, played: [], sc: {}, names: names || {} });
      let LOCAL = null;   // a session on this device: { s: session, my: total points }
      window.RANDOM_LOCAL = () => LOCAL;

      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[900px] mx-auto');
        setupScreen(body, mod, OPTS, (sel) => startLocal(sel));
      }
      // on this device: random games against computer players
      function startLocal(sel) {
        LOCAL = { s: session(sel), my: 0 };
        nextLocal();
      }
      function nextLocal() {
        const s = LOCAL.s;
        // games with computer players that run on this device (not Sea Battle Online, Doodle, Word Duel)
        let list = npFitGames(1, s.kind).filter((g) => (npSizes(g) || {}).bots && g !== 'navalnet');
        if (!list.length) list = npFitGames(1).filter((g) => (npSizes(g) || {}).bots && g !== 'navalnet');
        if (!s.rep) { const fresh = list.filter((g) => !s.played.includes(g)); if (fresh.length) list = fresh; }
        const game = list[Math.floor(Math.random() * list.length)];
        s.played.push(game); LOCAL.game = game;
        const z = npSizes(game) || { lo: 2, hi: 2 }, sk = tableSizeKey(game);
        const sel = { net: 'here', rnd: 1, quick: s.spd === 'quick' ? 1 : 0 };
        if (sk) sel[sk] = Math.max(z.lo, Math.min(z.hi, 3));
        if (game === 'tictactoe' || game === 'c4') sel.mode = 'ai';
        if (game === 'bowling') sel.mode = 'bot1';
        const id = game;
        SETUP_PRESET = { id, sel, code: generateRoomCode() };
        showToast(`Game ${s.k} of ${s.n}: ${npGameName(game)}!`, 'success');
        openGame(id);
        setTimeout(() => { const g = document.querySelector('#game-root #su-go'); if (g) g.click(); }, 150);
      }
      // the result screen of a game in a session on this device: standings + next game / final score
      window.randomLocalSlot = (slot) => {
        if (!LOCAL || !slot || activeGame !== LOCAL.game) return false;
        const s = LOCAL.s, p = (typeof POINTS !== 'undefined' && POINTS.last && Date.now() - POINTS.last.at < 60000) ? POINTS.last.p : 0;
        if (!s._counted || s._counted !== s.k) { LOCAL.my += p; s._counted = s.k; }
        const last = s.k >= s.n;
        slot.innerHTML = `<div class="pt-3 text-left space-y-2"><div class="pix text-sm text-amber">${last ? '🏆 SESSION OVER' : `RANDOM SESSION · AFTER GAME ${s.k} OF ${s.n}`}</div>
          <div class="np-st"><div class="me"><span class="rk">★</span><span class="nm">${esc(profile.username)} (you)</span><span class="pl">+${p}</span><b>${LOCAL.my}</b></div></div>
          <button id="rg-next" class="btn-game btn-amber w-full py-2.5 text-sm">${last ? '🔁 New session' : `🎲 Next game (${s.k + 1} of ${s.n})`}</button></div>`;
        const modal = document.getElementById('g-modal'); const again = modal && modal.querySelector('#g-modal-again'); if (again) again.style.display = 'none';
        document.getElementById('rg-next').onclick = () => {
          if (modal) modal.classList.add('hidden');
          if (last) { const keep = LOCAL.s; LOCAL = { s: Object.assign({}, keep, { k: 1, played: [] }), my: 0 }; } else s.k++;
          GT.started = false; GT.over = true; nextLocal();
        };
        return true;
      };
      // leaving the session (back to the menus) ends it
      document.addEventListener('click', (e) => { if (LOCAL && e.target.closest && e.target.closest('#g-modal-lobby')) LOCAL = null; }, true);

      // online: everyone at the Random Game table picks the same game (shared dice), then the group moves to its room
      function startOnline(body, sel, S) {
        LOCAL = null;
        const humans = S.seats.filter((x) => !x.bot), n = humans.length, bots = S.n - n;
        const s = session(sel, Object.fromEntries(humans.map((x) => [x.uid, x.name])));
        const game = npRandomNext(n, bots, s, S.rng);
        s.played = [game];
        const C = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', code = Array.from({ length: 4 }, () => C[S.rng.rnd(C.length)]).join('');
        const lead = humans[0] && humans[0].uid === (NET.me && NET.me.id);
        const icons = npFitGames(n).slice(0, 14);
        body.innerHTML = `<div class="win max-w-md mx-auto my-8 overflow-hidden"><div class="winbar amber"><span>🎲 PICKING A GAME</span><span class="pix">${s.n > 1 ? `SESSION · ${s.n} GAMES` : 'QUICKIE'}</span></div>
          <div class="p-6 text-center space-y-3"><div class="rg-spin" id="rg-spin">${GICONS[(GAME_MODS[icons[0]] || {}).icon] || ''}</div><div id="rg-name" class="text-2xl font-extrabold text-bone">...</div><div class="text-sm text-muted">${n} player${n > 1 ? 's' : ''}${bots ? ` + ${bots} computer${bots > 1 ? 's' : ''}` : ''}</div></div></div>`;
        let k = 0; const iv = gInterval(() => { const g = icons[k++ % icons.length]; const sp = document.getElementById('rg-spin'), nmE = document.getElementById('rg-name'); if (sp) sp.innerHTML = GICONS[(GAME_MODS[g] || {}).icon] || ''; if (nmE) nmE.textContent = npGameName(g); SFX.play('tick'); }, 140);
        gTimeout(() => {
          gClearInt(iv);
          const sp = document.getElementById('rg-spin'), nmE = document.getElementById('rg-name');
          if (sp) sp.innerHTML = GICONS[(GAME_MODS[game] || {}).icon] || ''; if (nmE) nmE.textContent = npGameName(game);
          SFX.play('reveal');
          gTimeout(() => {
            const nsel = npNextSel(game, n, bots, { rnd: 1, quick: s.spd === 'quick' ? 1 : 0 });
            if (S.online) { try { localStorage.removeItem('ps_np_cur:' + (NET.me && NET.me.id)); } catch (e) {} }
            npGoNext({ code, n, game, sel: nsel, session: s }, lead);
          }, 1400);
        }, 2600);
      }

      const mod = {
        id: 'random', name: 'Random Game', icon: 'random', cats: ['party'], sub: '2-8 PLAYERS · 1-5 GAMES', color: '#F5B041', tone: 'amber', btn: 'amber', flag: 'NEW',
        blurb: 'We pick the game and the settings. Play one game or a whole session: points from every game add up, and the most points wins.',
        rules: { tag: '2-8 PLAYERS', steps: [
          '<strong class="text-bone">Meet up:</strong> open a room and invite friends (computer players can fill seats), or join an online match.',
          '<strong class="text-bone">Surprise:</strong> when the host presses Start, a random game is picked that fits everyone. A box shows its settings before it begins.',
          '<strong class="text-bone">Session:</strong> play 1, 3 or 5 games in a row. Every game gives points (1st 10, 2nd 6, 3rd 3, others 1). Most points at the end is the champion!',
        ], tip: 'Pick "Card games" or "Party games" if your group prefers one kind.' },
        profileTiles: (st) => [['SESSIONS', st.played || 0, 'text-bone']],
        engine: { npRandomNext: (...a) => npRandomNext(...a) }, open, close() {},
        online: { seats: () => 8, min: 2, bots: true, ranked: false, start: (body, sel, S) => startOnline(body, sel, S) },
      };
      SOLO_MODE.random = {};
      registerGame(mod);
    })();
