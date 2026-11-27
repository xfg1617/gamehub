    /* =========================================================================
       OWNER STATS (Nov 2026, Inna: "a private stats page on the site for me")
       gamehub.us.com/my-stats, or the "Site stats" button in the side menu (it only appears for the owner).
       Private by the SERVER: the numbers come from owner_stats() (backend/owner-stats.sql), which refuses anyone who
       is not in the site_owners table; the page itself holds no numbers. Only counts, never a name or an email.
       ========================================================================= */
    (function ownerStats() {
      const nameOf = (id) => { const c = (typeof CATALOG !== 'undefined' && CATALOG.find((x) => x.id === id)) || (typeof GAME_MODS !== 'undefined' && GAME_MODS.find && GAME_MODS.find((x) => x.id === id)); return c ? c.name : id; };
      const fmtDay = (d) => { const [y, m, day] = d.split('-').map(Number); return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
      let el = null;
      // the time zone of this device (Inna: "my correct time wherever I go"): "today" and each day's bar follow it
      const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; } })();
      const tzName = () => { try { const p = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(new Date()).find((x) => x.type === 'timeZoneName'); return (TZ.split('/').pop() || TZ).replace(/_/g, ' ') + (p ? ' (' + p.value + ')' : ''); } catch (e) { return TZ; } };

      function shell(body) {
        if (!el) {
          el = document.createElement('div'); el.id = 'os-page'; el.setAttribute('data-no-tr', ''); document.body.appendChild(el);
          document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el && !el.classList.contains('hidden')) close(); });
        }
        el.className = 'os-page';
        el.innerHTML = `<div class="os-wrap"><div class="os-top"><h2 class="pix">MY SITE STATS</h2><span class="os-lock">🔒 Private: only your account can see this</span>
          <button class="btn-game btn-graphite os-btn" id="os-refresh">↻ Refresh</button><button class="btn-game btn-graphite os-btn" id="os-close">✕ Close</button></div>${body}</div>`;
        el.querySelector('#os-close').onclick = close;
        el.querySelector('#os-refresh').onclick = load;
      }
      function note(title, text, btn) {
        shell(`<div class="win os-note"><div class="winbar amber"><span>${esc(title)}</span></div><div class="p-5"><p>${text}</p>${btn || ''}</div></div>`);
      }
      function close() {
        if (el) el.classList.add('hidden');
        if (location.pathname === '/my-stats') history.replaceState({ p: '/' }, '', '/');
        document.title = 'GameHub';
      }

      async function load() {
        if (typeof NET === 'undefined' || !NET.on) return note('NOT CONNECTED', 'The stats page needs the online service. Check your internet connection and press Refresh.');
        if (!NET.account) return note('LOG IN FIRST', 'Log in with your own GameHub account to see your stats. Nobody else can see them.',
          `<button class="btn-game btn-amber w-full py-2.5 mt-4" onclick="openAuthModal('signin')">Log in</button>`);
        shell(`<div class="os-loading pix">Loading numbers…</div>`);
        let st;
        try { st = await NET.ownerStats(TZ); } catch (e) {
          const m = String((e && e.message) || e);
          if (/private|not allowed/i.test(m)) return note('PRIVATE PAGE', 'This page is private.');
          if (/does not exist|could not find|schema cache/i.test(m)) return note('ONE STEP LEFT', 'The stats aren\'t switched on yet: run <b>backend/owner-stats.sql</b> in Supabase, then add yourself as the owner (the steps are at the top of that file).');
          return note('COULD NOT LOAD', 'Something went wrong loading the numbers: ' + esc(m) + '. Press Refresh to try again.');
        }
        render(st || {});
      }

      function tile(n, label, sub, hi) { return `<div class="os-tile${hi ? ' hi' : ''}"><b>${Number(n || 0).toLocaleString('en-US')}</b><span class="pix">${label}</span><small>${sub}</small></div>`; }

      function render(st) {
        const days = st.days || [], games = st.games || [];
        const max = Math.max(1, ...days.map((d) => d.new || 0));
        const bars = days.map((d, i) => {
          const only = Math.max(0, (d.new || 0) - (d.played || 0)), hp = (d.played || 0) / max * 100, ho = only / max * 100;
          return `<div class="os-col" data-i="${i}" tabindex="0"><div class="os-stack">${only ? `<i class="os-b only" style="height:${ho}%"></i>` : ''}${d.played ? `<i class="os-b played" style="height:${hp}%"></i>` : ''}</div><span class="os-x">${(days.length - 1 - i) % 2 === 0 || days.length < 8 ? fmtDay(d.d) : ''}</span></div>`;
        }).join('');
        const gmax = Math.max(1, ...games.map((g) => g.n));
        const glist = games.slice(0, 12).map((g) => `<div class="os-g"><span class="os-gn">${esc(nameOf(g.g))}</span><span class="os-gbar"><i style="width:${g.n / gmax * 100}%"></i></span><span class="os-gv">${g.n.toLocaleString('en-US')} games · ${g.p} ${g.p === 1 ? 'player' : 'players'}</span></div>`).join('');
        const rows = days.slice().reverse().map((d) => `<tr><td>${fmtDay(d.d)}</td><td>${d.new}</td><td>${d.played}</td><td>${d.accounts}</td><td>${d.rooms}</td><td>${d.chats}</td></tr>`).join('');
        shell(`
          <p class="os-intro">Counted from your Supabase database. A "player" is one browser: the same person on a phone and a computer counts twice. Test players are left out.
            ${st.utc ? '<br><b class="text-amber">Days are in world time (UTC).</b> To see your own time, run the updated <b>backend/owner-stats.sql</b> in Supabase once.' : `<br>Days and "today" follow your time here: <b class="text-bone">${esc(tzName())}</b>.`}</p>
          <div class="os-tiles">
            ${tile(st.played, 'REAL PLAYERS', 'played at least one game (the best count of real people)', true)}
            ${tile(st.total, 'ALL VISITORS', 'every browser that opened the site online, including ones that left at once')}
            ${tile(st.returned, 'CAME BACK', 'opened the site again later')}
            ${tile(st.accounts, 'ACCOUNTS', 'signed up with email or Google')}
            ${tile(st.new_today, 'NEW TODAY', st.utc ? 'first visit today (UTC day)' : 'first visit today (your time)')}
            ${tile(st.active_today, 'ACTIVE TODAY', st.utc ? 'were on the site today (UTC day)' : 'were on the site today (your time)')}
            ${tile(st.games_total, 'GAMES PLAYED', 'all games ever played, all players')}
            ${tile(NET.count || 0, 'ONLINE NOW', 'on the site right this moment')}
          </div>
          <div class="win os-card"><div class="winbar"><span>NEW VISITORS · LAST 14 DAYS</span></div><div class="p-4">
            <div class="os-legend"><span><i class="played"></i>Played a game</span><span><i class="only"></i>Only looked</span></div>
            <div class="os-chart" id="os-chart">${bars}<div class="os-tip hidden" id="os-tip"></div></div>
            <details class="os-tbl"><summary class="pix">SHOW AS A TABLE</summary><table><thead><tr><th>Day</th><th>New visitors</th><th>Played</th><th>Signed up</th><th>Rooms opened</th><th>Chat messages</th></tr></thead><tbody>${rows}</tbody></table></details>
          </div></div>
          <div class="win os-card"><div class="winbar"><span>MOST PLAYED GAMES · ALL TIME</span></div><div class="p-4">${glist || '<p class="text-muted text-sm">No games played yet.</p>'}</div></div>`);
        // hover / tap on a day: the exact numbers for it
        const chart = el.querySelector('#os-chart'), tip = el.querySelector('#os-tip');
        const show = (col) => {
          const d = days[+col.dataset.i]; if (!d) return;
          tip.innerHTML = `<b>${fmtDay(d.d)}</b><div><i class="played"></i>Played a game <span>${d.played}</span></div><div><i class="only"></i>Only looked <span>${d.new - d.played}</span></div><div>Signed up <span>${d.accounts}</span></div><div>Rooms opened <span>${d.rooms}</span></div><div>Chat messages <span>${d.chats}</span></div>`;
          tip.classList.remove('hidden');
          const c = chart.getBoundingClientRect(), r = col.getBoundingClientRect();
          let x = r.left - c.left + r.width / 2 - tip.offsetWidth / 2; x = Math.max(0, Math.min(c.width - tip.offsetWidth, x));
          tip.style.left = x + 'px';
          chart.querySelectorAll('.os-col').forEach((k) => k.classList.toggle('on', k === col));
        };
        chart.querySelectorAll('.os-col').forEach((col) => { col.onmouseenter = col.onfocus = col.onclick = () => show(col); });
        chart.onmouseleave = () => { tip.classList.add('hidden'); chart.querySelectorAll('.os-col').forEach((k) => k.classList.remove('on')); };
      }

      function openOwnerStats() {
        shell(''); el.classList.remove('hidden');
        if (location.pathname !== '/my-stats' && /^https?:/.test(location.protocol)) history.pushState({ p: '/my-stats' }, '', '/my-stats');
        document.title = 'Site stats · GameHub';
        load();
      }
      window.openOwnerStats = openOwnerStats;

      // the "Site stats" button in the side menu, only for the owner (the server says who that is)
      let checked = '';
      async function ownerButton() {
        if (typeof NET === 'undefined' || !NET.on || !NET.account || !NET.isOwner || !NET.me) return;
        const id = NET.me.id || NET.me; if (checked === id) return; checked = id;
        if (!(await NET.isOwner()) || document.getElementById('nav-stats')) return;
        const after = document.getElementById('nav-discord'); if (!after) return;
        const b = document.createElement('button'); b.id = 'nav-stats'; b.className = 'side-link'; b.setAttribute('data-no-tr', '');
        b.innerHTML = '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="9" width="3" height="5"/><rect x="6.5" y="5" width="3" height="9"/><rect x="11" y="2" width="3" height="12"/></svg> Site stats';
        b.setAttribute('onclick', 'openOwnerStats()'); after.after(b);   // an attribute, so the phone ☰ menu can copy it
      }
      document.addEventListener('ps-online', () => setTimeout(ownerButton, 300));
      setInterval(ownerButton, 5000);   // also after logging in
    })();
