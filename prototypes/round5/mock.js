// Prototype mock-ups for Inna's Nov 2026 list (round 5). Injected into the real page by shots.py; not part of the site.
(function () {
  const K = '#050E18';
  const css = `
  .pm-back{position:fixed;inset:0;z-index:80;background:rgba(5,14,24,.8);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto}
  .pm-rows{display:grid;gap:6px;margin:14px 0}
  .pm-row{display:grid;grid-template-columns:30px 1fr auto;align-items:center;gap:10px;background:#0B1B2B;border:2px solid ${K};padding:8px 10px}
  .pm-row .i{font-size:18px;text-align:center}.pm-row .l{color:#9DB4CC;font-size:13px}.pm-row .v{color:#F7F4EC;font-weight:800;font-size:14px;text-align:right}
  .pm-row .v small{display:block;color:#9DB4CC;font-weight:500;font-size:11px}
  .pm-bar{height:10px;background:#0B1B2B;border:2px solid ${K};margin-top:6px}.pm-bar i{display:block;height:100%;width:62%;background:#F5B041}
  .pm-h{font-family:Outfit;font-weight:800;color:#F7F4EC}
  .pm-sub{color:#9DB4CC;font-size:13px}
  .pm-list{display:grid;gap:4px}
  .pm-li{display:grid;grid-template-columns:28px 32px 1fr auto auto;align-items:center;gap:8px;background:#0B1B2B;border:2px solid ${K};padding:6px 10px;color:#F7F4EC;font-size:14px}
  .pm-li.me{border-color:#2DD4BF}.pm-li .rk{font-family:'Arcade Pixel';color:#9DB4CC;font-size:18px}.pm-li .av{font-size:20px}
  .pm-li .pts{font-weight:800}.pm-li .plus{color:#34D399;font-weight:800;font-size:12px;min-width:34px;text-align:right}
  .pm-li.g1 .rk{color:#F5B041}.pm-li.g2 .rk{color:#C9D6E3}.pm-li.g3 .rk{color:#D08A4E}
  .pm-pod{display:flex;align-items:flex-end;justify-content:center;gap:10px;margin:10px 0 4px}
  .pm-pod>div{width:120px;text-align:center}.pm-pod .av{font-size:34px;display:block}.pm-pod .nm{color:#F7F4EC;font-weight:800;font-size:14px}
  .pm-pod .blk{border:3px solid ${K};box-shadow:0 4px 0 ${K};display:flex;flex-direction:column;justify-content:flex-start;align-items:center;padding-top:6px;font-family:'Arcade Pixel';font-size:28px;color:#231505}
  .pm-crown{display:block;margin:0 auto -4px;width:40px;height:28px}
  .pm-tbl{width:100%;border-collapse:collapse;font-size:13px;color:#F7F4EC;margin-top:12px}
  .pm-tbl th{font-family:'Arcade Pixel';font-weight:400;color:#9DB4CC;padding:4px;font-size:14px}.pm-tbl td{padding:5px 4px;text-align:center;border-top:2px solid #0B1B2B}
  .pm-tbl td:first-child{text-align:left}.pm-tbl .tot{font-weight:800;color:#F5B041;font-size:15px}
  .pm-tbl .gi{width:24px;height:24px;display:inline-block}
  .pm-gpick{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:8px}
  .pm-g{background:#0B1B2B;border:3px solid ${K};box-shadow:0 3px 0 ${K};padding:8px 4px 6px;text-align:center;color:#F7F4EC;font-weight:800;font-size:12px}
  .pm-g .gi{width:40px;height:40px;display:block;margin:0 auto 4px}.pm-g.off{opacity:.35}.pm-g.on{border-color:#F5B041;box-shadow:0 0 0 2px #F5B041,0 3px 0 ${K}}
  .pm-g small{display:block;color:#9DB4CC;font-weight:500;font-size:10px}
  .pm-big{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
  .pm-seat{display:flex;align-items:center;gap:8px;background:#0B1B2B;border:2px solid ${K};padding:6px 10px;color:#F7F4EC;font-size:14px}
  .pm-tag{font-family:'Arcade Pixel';font-size:13px;padding:0 5px;border:2px solid ${K};margin-left:auto}
  .pm-tabs{display:flex;gap:6px;margin-bottom:12px}.pm-tabs b{font-family:'Arcade Pixel';font-weight:400;font-size:16px;padding:4px 12px;border:3px solid ${K};background:#12304C;color:#9DB4CC}.pm-tabs b.on{background:#F5B041;color:#231505}
  .pm-how{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}.pm-how div{background:#0B1B2B;border:2px solid ${K};padding:6px;text-align:center;color:#F7F4EC;font-weight:800}.pm-how small{display:block;color:#9DB4CC;font-weight:500;font-size:11px}
  /* friends chat */
  .pm-chat{display:grid;grid-template-columns:230px 1fr;height:520px;width:min(760px,100%)}
  .pm-fl{border-right:3px solid ${K};background:#0B1B2B;overflow:hidden}
  .pm-fs{margin:8px;background:${K};border:2px solid #27496B;color:#5C7A99;padding:6px 8px;font-size:13px}
  .pm-fr{display:grid;grid-template-columns:36px 1fr auto;gap:8px;align-items:center;padding:8px 10px;border-bottom:2px solid #0F2338;color:#F7F4EC}
  .pm-fr.on{background:#12304C;box-shadow:inset 4px 0 0 #2DD4BF}.pm-fr .av{font-size:22px;position:relative;text-align:center}
  .pm-fr .av i{position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border:2px solid ${K};background:#34D399}.pm-fr .av i.off{background:#5C7A99}
  .pm-fr b{font-size:14px;display:block}.pm-fr small{color:#9DB4CC;font-size:12px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px}
  .pm-un{background:#FB7185;color:${K};font-weight:800;font-size:11px;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;border:2px solid ${K}}
  .pm-cv{display:flex;flex-direction:column;min-width:0}
  .pm-ch{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:3px solid ${K};background:#12304C;color:#F7F4EC}
  .pm-ch .av{font-size:26px}.pm-ch small{color:#34D399;font-size:12px;display:block}
  .pm-ms{flex:1;padding:14px;display:flex;flex-direction:column;gap:6px;overflow:hidden;background:#0F2338}
  .pm-day{align-self:center;font-family:'Arcade Pixel';color:#5C7A99;font-size:13px;margin:4px 0}
  .pm-m{max-width:70%;padding:7px 11px;border:2px solid ${K};font-size:14px;line-height:1.35;color:#F7F4EC;background:#1A3856;align-self:flex-start;box-shadow:0 2px 0 ${K}}
  .pm-m.me{align-self:flex-end;background:#2DD4BF;color:#06201C}
  .pm-m time{display:block;font-size:10px;opacity:.65;margin-top:2px;text-align:right}
  .pm-inv{align-self:flex-start;background:#F5B041;color:#231505;border:2px solid ${K};padding:8px 11px;font-weight:800;font-size:13px;box-shadow:0 2px 0 ${K}}
  .pm-type{display:flex;gap:8px;padding:10px;border-top:3px solid ${K};background:#12304C}
  .pm-type div{flex:1;background:${K};border:2px solid #27496B;color:#5C7A99;padding:8px 10px;font-size:14px}
  /* guest card */
  .pm-gc .avb{width:84px;height:84px;margin:0 auto;background:#0B1B2B;border:3px solid ${K};display:flex;align-items:center;justify-content:center;font-size:48px}
  .pm-guest{display:inline-block;font-family:'Arcade Pixel';font-size:15px;background:#5C7A99;color:${K};border:2px solid ${K};padding:0 6px;margin-left:6px;vertical-align:middle}
  /* fire streak */
  @keyframes pmFl{0%{transform:scaleY(1) translateY(0)}50%{transform:scaleY(1.18) translateY(-2px)}100%{transform:scaleY(.94) translateY(1px)}}
  .pm-fire{position:relative}
  .pm-fire .tg-tag{border-color:#FB923C !important;box-shadow:0 0 0 2px #F97316 !important}
  .pm-flames{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(100% - 6px);display:flex;gap:1px;pointer-events:none;z-index:3}
  .pm-flames svg{width:18px;height:24px;animation:pmFl .35s steps(2) infinite alternate;transform-origin:bottom}
  .pm-flames svg:nth-child(2){width:24px;height:32px;animation-delay:.12s}.pm-flames svg:nth-child(3){animation-delay:.2s}
  .pm-stk{position:absolute;right:-14px;top:-14px;background:#F97316;color:#fff;font-family:'Arcade Pixel';font-size:16px;padding:0 6px;border:2px solid ${K};box-shadow:0 2px 0 ${K};z-index:4}
  .pm-burst{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%) rotate(-4deg);z-index:70;text-align:center;pointer-events:none}
  .pm-burst b{display:block;font-family:'Arcade Pixel';font-size:64px;color:#F97316;text-shadow:4px 4px 0 ${K},-2px -2px 0 #FDE68A;letter-spacing:.04em;line-height:1}
  .pm-burst span{display:inline-block;background:${K};color:#F7F4EC;font-weight:800;padding:4px 12px;font-size:15px;margin-top:6px}
  .pm-mini{display:inline-flex;align-items:center;gap:3px;font-family:'Arcade Pixel';font-size:13px;background:${K};color:#FDE68A;padding:0 5px;border:2px solid #F97316}
  /* movable log */
  .pm-log{position:fixed;left:400px;top:190px;width:330px;z-index:60;box-shadow:0 6px 0 ${K},0 0 0 3px ${K}}
  .pm-log .winbar{cursor:move}.pm-log .grip{font-family:'Arcade Pixel';font-size:13px;opacity:.8}
  .pm-log .lines{max-height:240px;overflow:hidden;padding:8px 10px;font-size:13px;color:#C9D6E3;display:grid;gap:4px;background:#0B1B2B}
  .pm-log .rs{position:absolute;right:2px;bottom:2px;width:12px;height:12px;border-right:3px solid #5C7A99;border-bottom:3px solid #5C7A99}
  .pm-ghost{position:fixed;left:70px;top:330px;width:330px;height:270px;border:3px dashed #5C7A99;z-index:59}
  .pm-arrow{position:fixed;left:250px;top:300px;z-index:61;color:#F5B041;font-family:'Arcade Pixel';font-size:18px}
  #gm-note{display:none!important}
  /* manor */
  .pmm .mm-roof,.pmm .mm-lawn{display:none}
  .pmm .mm-house{background:none;border:0;box-shadow:none;padding:0}
  .pmm .mm-house .mm-map{border:4px solid ${K};box-shadow:0 5px 0 ${K};background:${K};gap:6px}
  .pmm .mm-room{min-height:172px}
  .pmm .mm-art{filter:brightness(.72) saturate(.85)}
  .pmm .mm-room.here .mm-art,.pmm .mm-room.go .mm-art{filter:brightness(.9)}
  .pmm .mm-rn{font-size:1.2rem;align-self:center;background:rgba(5,14,24,.85);padding:3px 10px 2px;border:2px solid ${K}}
  .pmm .mm-toks{justify-content:center;gap:10px;margin:auto 0 18px}
  .pmm .mm-tok{width:46px;height:46px;font-size:25px;border:3px solid #F7F4EC;box-shadow:0 0 0 3px ${K},0 5px 0 3px ${K};position:relative;overflow:visible}
  .pmm .mm-tok.me{border-color:#2DD4BF}
  .pmm .mm-tok .nm{position:absolute;top:calc(100% + 7px);left:50%;transform:translateX(-50%);white-space:nowrap;background:${K};color:#F7F4EC;font:800 11px Outfit;padding:1px 5px;border-radius:0}
  .pmm .mm-sus{position:absolute;left:6px;bottom:6px}
  @keyframes pmFlick{0%,100%{opacity:1;transform:scale(1)}40%{opacity:.75;transform:scale(.85,1.1)}70%{opacity:.9;transform:scale(1.1,.9)}}
  @keyframes pmWalk{0%{left:-10%}100%{left:105%}}
  @keyframes pmTw{0%,100%{opacity:.2}50%{opacity:1}}
  @keyframes pmSway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
  @keyframes pmSteam{0%{transform:translateY(0);opacity:.8}100%{transform:translateY(-26px);opacity:0}}
  .pm-amb{position:absolute;pointer-events:none;z-index:1}
  .pm-flick{animation:pmFlick .5s steps(3) infinite}
  .pm-cat{bottom:8px;animation:pmWalk 14s linear infinite;width:34px;height:22px}
  .pm-tw{animation:pmTw 1.6s steps(3) infinite}
  .pm-sway{animation:pmSway 3s ease-in-out infinite;transform-origin:bottom}
  .pm-steam{animation:pmSteam 1.8s linear infinite}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const gi = (id) => `<span class="gi spr">${GICONS[(GAME_MODS[id] || {}).icon || id] || ''}</span>`;
  const gname = (id) => (GAME_MODS[id] || {}).name || id;
  const back = (html) => { const d = document.createElement('div'); d.className = 'pm-back'; d.id = 'pm-over'; d.innerHTML = html; document.body.appendChild(d); return d; };
  const clear = () => document.querySelectorAll('#pm-over,.pm-burst,.pm-log,.pm-ghost,.pm-arrow').forEach((e) => e.remove());
  const RANDOM_ICON = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="5" width="15" height="15" fill="${K}"/><rect x="3" y="6" width="13" height="13" fill="#F7F4EC"/><rect x="5" y="8" width="3" height="3" fill="#FB7185"/><rect x="11" y="14" width="3" height="3" fill="#FB7185"/><rect x="8" y="11" width="3" height="3" fill="#FB7185"/><rect x="9" y="1" width="14" height="14" fill="${K}"/><rect x="10" y="2" width="12" height="12" fill="#F5B041"/><rect x="13" y="4" width="6" height="2" fill="${K}"/><rect x="17" y="6" width="2" height="2" fill="${K}"/><rect x="15" y="8" width="2" height="2" fill="${K}"/><rect x="15" y="11" width="2" height="2" fill="${K}"/></svg>`;
  GICONS.random = RANDOM_ICON;

  const M = window.PM = {};
  M.clear = clear;

  // 1. Random Game tile first + its settings
  M.registerRandom = function () {
    if (GAME_MODS.random) return;
    const mod = { id: 'random', name: 'Random Game', icon: 'random', cats: ['party'], sub: '2-8 PLAYERS · 1-5 GAMES', color: '#F5B041', tone: 'amber', btn: 'amber',
      blurb: 'We pick the game and the settings. Play one game or a whole session: points from every game add up, most points wins.',
      open(root) {
        const body = gameShell(root, mod, '', 'max-w-[900px] mx-auto');
        setupScreen(body, mod, [
          { key: 'ses', label: 'SESSION', def: 3, choices: [[1, 'Quickie · 1 game'], [3, '3 games'], [5, 'Long · 5 games']], hint: 'Points from every game add up. Most points at the end is the champion.' },
          { key: 'spd', label: 'GAME LENGTH', def: 'quick', choices: [['quick', 'Quick versions'], ['normal', 'Normal']], hint: 'Quick versions use the short settings (Landlord 15 rounds, Uno first out wins...).' },
          { key: 'kind', label: 'WHICH GAMES', def: 'all', choices: [['all', 'Any game'], ['card', 'Card games'], ['board', 'Board games'], ['party', 'Party games']] },
          { key: 'rep', label: 'Same game twice', toggle: true, def: 0, choices: [[1, 'Yes'], [0, 'No']], hint: 'Off: every game in the session is different.' },
        ], () => {});
      }, close() {} };
    registerGame(mod);
  };
  M.home = function () {
    M.registerRandom(); renderShelves();
    const g = document.querySelector('.hp-grid'); const t = [...g.children].find((b) => /Random Game/.test(b.textContent));
    g.prepend(t); t.style.cssText = 'border-color:#F5B041;box-shadow:0 0 0 3px #F5B041, 0 5px 0 #050E18';
    t.querySelector('.gart').insertAdjacentHTML('afterbegin', '<span class="flag flag-hot">NEW</span>');
    const r = document.getElementById('rank-link'); if (r) r.innerHTML = r.innerHTML.replace(/Ranked match/, 'Points leaderboard').replace(/play someone at your level/, "this week's top players");
  };

  // 2. settings pop-up before a game (random session and normal game)
  M.settingsPop = function (random) {
    const id = random ? 'tycoon' : 'poker';
    const rows = random ? [['⏱', 'Game length', 'Short', '15 rounds, richest wins'], ['🏠', 'Building houses', 'Stand on your plot', 'one house per visit'], ['🤝', 'Buy out land', 'On', 'make an offer after paying rent'], ['🔨', 'Auctions', 'On', ''], ['🤖', 'Computer players', '1 · Medium', '']]
      : [['💰', 'Starting chips', '1,000', ''], ['📈', 'Blinds', '10 / 20', 'go up every 10 hands'], ['⏱', 'Turn timer', '30 s', ''], ['🤖', 'Computer players', '2 · Sharp', '']];
    back(`<div class="win" style="width:min(470px,100%)">
      <div class="winbar amber"><span>${random ? 'GAME 2 OF 5 · UP NEXT' : 'GAME SETTINGS'}</span><span class="pix">${random ? '🎲 RANDOM' : 'PRIVATE ROOM'}</span></div>
      <div style="padding:18px 18px 16px">
        <div class="flex items-center gap-4"><span class="gart" style="--c:${GAME_MODS[id].color}">${GICONS[GAME_MODS[id].icon]}</span>
          <div><div class="pm-h text-2xl">${gname(id)}</div><div class="pm-sub">${random ? 'Picked at random. Here is how this game is set up:' : 'Here is how the host set up this game:'}</div></div></div>
        <div class="pm-rows">${rows.map(([i, l, v, s]) => `<div class="pm-row"><span class="i">${i}</span><span class="l">${l}</span><span class="v">${v}${s ? `<small>${s}</small>` : ''}</span></div>`).join('')}</div>
        <div class="pm-sub flex justify-between"><span>Starting in <b class="text-bone">7</b></span><span>3 of 4 players ready</span></div><div class="pm-bar"><i></i></div>
        <div class="grid grid-cols-2 gap-3 mt-4"><button class="btn-game btn-graphite py-3 text-sm">? How to play</button><button class="btn-game btn-amber py-3 text-sm">Got it ✓</button></div>
      </div></div>`);
  };

  const P4 = [['🦊', 'Inna', 16, 6, 1], ['🐙', 'Luna', 20, 10, 0], ['🦉', 'Cael', 9, 3, 0], ['🤖', 'Bot Max', 4, 1, 0]];
  // 3. result screen with points (session game)
  M.resultPoints = function () {
    const s = [...P4].sort((a, b) => b[2] - a[2]);
    back(`<div class="panel w-full max-w-md p-6 pt-9 text-center space-y-4 relative">
      <div class="icon-tile absolute -top-9 left-1/2 -translate-x-1/2 w-[72px] h-[72px] bg-teal"><span class="spr w-11 h-11">${SPRITES.trophy}</span></div>
      <div class="space-y-1 pt-3"><h3 class="text-3xl font-extrabold text-bone">2nd place!</h3><p class="text-sm text-muted">Luna won Landlord with $4,210.</p></div>
      <div class="grid grid-cols-3 gap-2.5"><div class="stat"><div class="lab">PLACE</div><div class="val text-bone">2nd</div></div><div class="stat"><div class="lab">POINTS</div><div class="val text-emerald">+6</div></div><div class="stat"><div class="lab">SESSION</div><div class="val text-amber">2nd</div></div></div>
      <div class="text-left"><div class="pix text-sm text-muted mb-1">SESSION AFTER GAME 2 OF 5</div>
        <div class="pm-list">${s.map((p, i) => `<div class="pm-li g${i + 1} ${p[1] === 'Inna' ? 'me' : ''}"><span class="rk">${i + 1}</span><span class="av">${p[0]}</span><span>${p[1]}</span><span class="plus">+${p[3]}</span><span class="pts">${p[2]} pts</span></div>`).join('')}</div></div>
      <div class="grid grid-cols-2 gap-3 pt-1"><button class="btn-game btn-graphite py-3 text-sm">Leave session</button><button class="btn-game btn-amber py-3 text-sm">Next game ▶</button></div>
      <div class="pm-sub">Game 3 starts in 10 s · 🎲 the next game is a surprise</div></div>`);
  };
  // 4. final champion
  M.final = function () {
    const games = ['poker', 'tycoon', 'fibber', 'colorclash', 'kittens'];
    const T = [['🐙', 'Luna', [10, 10, 3, 6, 10]], ['🦊', 'Inna', [6, 6, 10, 10, 3]], ['🦉', 'Cael', [3, 3, 6, 3, 6]], ['🤖', 'Bot Max', [1, 1, 1, 1, 1]]];
    const crown = `<svg class="pm-crown" viewBox="0 0 20 14" shape-rendering="crispEdges"><rect x="0" y="2" width="20" height="12" fill="${K}"/><rect x="1" y="7" width="18" height="6" fill="#F5B041"/><rect x="1" y="3" width="3" height="4" fill="#F5B041"/><rect x="8" y="3" width="4" height="4" fill="#F5B041"/><rect x="16" y="3" width="3" height="4" fill="#F5B041"/><rect x="9" y="8" width="2" height="3" fill="#FB7185"/><rect x="4" y="9" width="2" height="2" fill="#2DD4BF"/><rect x="14" y="9" width="2" height="2" fill="#2DD4BF"/><rect x="0" y="0" width="0" height="0"/></svg>`;
    const tot = T.map((t) => t[2].reduce((a, b) => a + b, 0));
    back(`<div class="win" style="width:min(600px,100%)">
      <div class="winbar amber"><span>SESSION OVER · 5 GAMES</span><span class="pix">🎲 RANDOM</span></div>
      <div style="padding:16px 20px 18px">
        <div class="text-center"><div class="pix text-amber text-xl">CHAMPION</div><div class="pm-h text-3xl">Luna</div><div class="pm-sub">39 points · won 3 of 5 games</div></div>
        <div class="pm-pod">
          <div><span class="av">🦊</span><span class="nm">Inna · 35</span><div class="blk" style="height:70px;background:#C9D6E3">2</div></div>
          <div>${crown}<span class="av">🐙</span><span class="nm">Luna · 39</span><div class="blk" style="height:98px;background:#F5B041">1</div></div>
          <div><span class="av">🦉</span><span class="nm">Cael · 21</span><div class="blk" style="height:50px;background:#D08A4E">3</div></div></div>
        <table class="pm-tbl"><tr><th></th>${games.map((g) => `<th title="${gname(g)}">${gi(g)}</th>`).join('')}<th>TOTAL</th></tr>
          ${T.map((t, i) => `<tr><td>${t[0]} ${t[1]}</td>${t[2].map((v) => `<td class="${v === 10 ? 'text-amber font-extrabold' : ''}">${v}</td>`).join('')}<td class="tot">${tot[i]}</td></tr>`).join('')}</table>
        <div class="pm-sub mt-2">Session points also go on everyone's profile and the weekly leaderboard.</div>
        <div class="grid grid-cols-2 gap-3 mt-4"><button class="btn-game btn-graphite py-3 text-sm">Back to the room</button><button class="btn-game btn-amber py-3 text-sm">🔁 New session</button></div>
      </div></div>`);
    if (typeof celebrate === 'function') celebrate();
  };
  // 5. back in the same room after a game: choose what next
  M.roomNext = function () {
    const fits = ['poker', 'tycoon', 'colorclash', 'kittens', 'fibber', 'dominoes', 'isles', 'manor', 'tunnel', 'guild', 'impostor', 'doodle', 'blackjack', 'hedge'];
    const no = ['chess', 'checkers', 'tictactoe', 'c4', 'pool', 'wordduel'];
    back(`<div class="win" style="width:min(820px,100%)">
      <div class="winbar teal"><span>ROOM KQ7P · 4 PLAYERS · WHAT NEXT?</span><span class="pix">HOST: INNA</span></div>
      <div style="padding:16px 18px 18px" class="grid gap-4" >
        <div class="grid grid-cols-2 gap-2">${P4.map((p, i) => `<div class="pm-seat"><span style="font-size:20px">${p[0]}</span><b>${p[1]}</b>${i === 0 ? '<span class="pm-tag" style="background:#F5B041">HOST</span>' : i === 3 ? '<span class="pm-tag" style="background:#5C7A99">CPU</span>' : '<span class="pm-tag" style="background:#34D399">READY</span>'}</div>`).join('')}</div>
        <div class="pm-big"><button class="btn-game btn-teal py-4 text-base">🔁 Landlord again</button><button class="btn-game btn-amber py-4 text-base">🎲 Random game</button></div>
        <div><div class="pix text-sm text-muted mb-2">OR PICK ANOTHER GAME · 14 FIT 4 PLAYERS</div>
        <div class="pm-gpick">${fits.map((g, i) => `<div class="pm-g ${i === 2 ? 'on' : ''}">${gi(g)}${gname(g)}</div>`).join('')}${no.map((g) => `<div class="pm-g off">${gi(g)}${gname(g)}<small>2 players only</small></div>`).join('')}</div></div>
        <div class="flex gap-3 items-center"><span class="pm-sub flex-1">Uno chosen. Everyone stays in the room and the chat keeps going.</span><button class="btn-game btn-graphite py-3 px-5 text-sm">⚙ Settings</button><button class="btn-game btn-amber py-3 px-8 text-sm">Start Uno ▶</button></div>
      </div></div>`);
  };
  // 6. points leaderboard (no Elo)
  M.board = function () {
    const rows = [['🐙', 'Luna', 18, 1240, 96, 51], ['🦈', 'Mako', 15, 1105, 88, 40], ['🦉', 'Cael', 14, 980, 74, 37], ['🐼', 'Bao', 12, 860, 70, 29], ['🦁', 'Leo', 11, 790, 61, 26], ['🐸', 'Kiki', 10, 655, 58, 20], ['🚀', 'Nova', 9, 610, 49, 22]];
    back(`<div class="win" style="width:min(760px,100%)">
      <div class="winbar amber"><span>LEADERBOARD · POINTS</span><span class="pix">RESETS MONDAY</span></div>
      <div style="padding:16px 18px 18px">
        <div class="pm-tabs"><b class="on">THIS WEEK</b><b>ALL TIME</b><b>FRIENDS</b><b>BY GAME ▾</b></div>
        <div class="pm-list">${rows.map((r, i) => `<div class="pm-li g${i + 1}" style="grid-template-columns:34px 32px 1fr 70px 70px 90px"><span class="rk">${i + 1}</span><span class="av">${r[0]}</span><span><b>${r[1]}</b> <span class="text-muted text-xs">Lv ${r[2]}</span></span><span class="text-muted text-xs">${r[4]} games</span><span class="text-muted text-xs">${r[5]} wins</span><span class="pts text-right">${r[3].toLocaleString()} pts</span></div>`).join('')}
          <div class="pm-li me" style="grid-template-columns:34px 32px 1fr 70px 70px 90px;margin-top:6px"><span class="rk">128</span><span class="av">🦊</span><span><b>Inna (you)</b> <span class="text-muted text-xs">Lv 6</span></span><span class="text-muted text-xs">22 games</span><span class="text-muted text-xs">9 wins</span><span class="pts text-right">184 pts</span></div></div>
        <div class="pix text-sm text-muted mt-4">HOW POINTS WORK</div>
        <div class="pm-how"><div>10<small>1st place</small></div><div>6<small>2nd place</small></div><div>3<small>3rd place</small></div><div>1<small>everyone else</small></div></div>
        <div class="pm-sub mt-2">Two-player games: win 10, draw 5, loss 1. Against computer players you get half. Fun moments (🔥 streaks, 🦃 turkeys...) add +2. Solo games give up to 5.</div>
      </div></div>`);
  };
  // 7. friends chat
  M.friendsChat = function () {
    const fr = [['🐙', 'Luna', 'see you at 8!', 2, 1], ['🦉', 'Cael', 'gg that was close', 0, 1], ['🦈', 'Mako', 'You: haha yes', 0, 0], ['🐼', 'Bao', 'invite me next time', 0, 0], ['🦁', 'Leo', 'You: Poker?', 0, 0]];
    back(`<div class="win pm-chat" style="padding:0;grid-template-rows:auto 1fr">
      <div class="winbar teal" style="grid-column:1/-1"><span>💬 FRIENDS</span><span class="pix">✕</span></div>
      <div class="pm-fl"><div class="pm-fs">🔍 Search friends</div>${fr.map((f, i) => `<div class="pm-fr ${i === 0 ? 'on' : ''}"><span class="av">${f[0]}<i class="${f[4] ? '' : 'off'}"></i></span><span><b>${f[1]}</b><small>${f[2]}</small></span>${f[3] ? `<span class="pm-un">${f[3]}</span>` : '<span></span>'}</div>`).join('')}</div>
      <div class="pm-cv"><div class="pm-ch"><span class="av">🐙</span><div><b>Luna</b><small>● Online · playing Poker</small></div><button class="btn-game btn-graphite px-3 py-1.5 text-xs ml-auto">Player card</button><button class="btn-game btn-amber px-3 py-1.5 text-xs">Invite to my room</button></div>
        <div class="pm-ms"><span class="pm-day">YESTERDAY</span>
          <div class="pm-m">that last Bullshit game was wild 😂<time>9:41 PM</time></div>
          <div class="pm-m me">I KNEW you had no sevens<time>9:42 PM</time></div>
          <span class="pm-day">TODAY</span>
          <div class="pm-m">game night again?<time>6:02 PM</time></div>
          <div class="pm-m">see you at 8!<time>6:02 PM</time></div>
          <div class="pm-inv">🎲 Luna invited you to Room KQ7P (Random Game) <button class="btn-game btn-teal px-3 py-1 text-xs ml-2">Join</button></div></div>
        <div class="pm-type"><div>Message Luna…</div><button class="btn-game btn-teal px-4 py-2 text-sm">Send</button></div></div></div>`);
  };
  // 8. guest player card
  M.guestCard = function () {
    back(`<div class="win pm-gc" style="width:min(360px,100%)">
      <div class="winbar"><span>PLAYER</span><span class="pix">✕</span></div>
      <div style="padding:18px;text-align:center">
        <div class="avb">🐻</div>
        <div class="pm-h text-2xl mt-3">Player4821<span class="pm-guest">GUEST</span></div>
        <div class="pm-sub mt-1">Playing without an account</div>
        <div class="grid grid-cols-2 gap-2 mt-4"><div class="stat"><div class="lab">IN THIS GAME</div><div class="val text-bone">2nd</div></div><div class="stat"><div class="lab">LEVEL</div><div class="val text-bone">3</div></div></div>
        <div class="pm-row" style="grid-template-columns:30px 1fr;text-align:left;margin-top:14px"><span class="i">🔒</span><span class="l">Guests don't have a profile yet, so they can't be added as friends. Once Player4821 signs up, you'll be able to add them.</span></div>
        <button class="btn-game btn-graphite w-full py-2.5 text-sm mt-4">Close</button></div></div>`);
  };
  // 9. fire streak (Bullshit)
  const flame = (h) => `<svg viewBox="0 0 8 11" shape-rendering="crispEdges"><rect x="3" y="0" width="2" height="2" fill="#FDE68A"/><rect x="2" y="2" width="4" height="3" fill="#FB923C"/><rect x="1" y="4" width="6" height="5" fill="#F97316"/><rect x="3" y="5" width="2" height="4" fill="#FDE68A"/><rect x="0" y="7" width="8" height="4" fill="#EA580C"/><rect x="2" y="8" width="4" height="3" fill="#FB923C"/><rect x="3" y="9" width="2" height="2" fill="#FDE68A"/></svg>`;
  M.fire = function (seatSel, burst) {
    const s = document.querySelector(seatSel); if (!s) return 'no seat';
    s.classList.add('pm-fire'); const tag = s.querySelector('.tg-tag'); tag.style.position = 'relative';
    tag.insertAdjacentHTML('beforeend', `<span class="pm-flames">${flame()}${flame()}${flame()}</span><span class="pm-stk">🔥x2</span>`);
    if (burst) document.body.insertAdjacentHTML('beforeend', `<div class="pm-burst"><b>ON FIRE!</b><span>Luna called BULLSHIT right twice in a row</span></div>`);
    return 'ok';
  };
  M.miniBadges = function () {
    // badges that stay on name tags for the rest of the game
    const seats = [...document.querySelectorAll('.tg-seat')];
    const t = document.querySelector('#fb-seat-2 .tg-txt small'); if (t) t.insertAdjacentHTML('afterend', '<span class="pm-mini">🎭 SMOOTH LIAR</span>');
  };
  // 10. movable log
  M.log = function () {
    document.body.insertAdjacentHTML('beforeend', `<div class="win pm-log"><div class="winbar"><span>📜 GAME LOG</span><span class="grip">✥ DRAG TO MOVE · ✕</span></div>
      <div class="lines"><div>Luna rolled 8 and landed on Harbor Street.</div><div>Luna paid Inna $40 rent.</div><div>Cael rolled doubles (5 + 5)!</div><div>Cael bought Rail North for $200.</div><div>Cael rolled again: 7.</div><div>Bot Max went to Jail.</div><div>Inna rolled 9 and landed on Free Parking: +$150.</div><div>Inna built a house on Elm Road.</div></div><span class="rs"></span></div>`);
  };
  // 11. Whodunit cleaner map + moving details
  M.manor = function () {
    document.body.classList.add('pmm');
    const map = document.getElementById('mm-map'); if (!map) return 'no map';
    map.querySelectorAll('.mm-tok').forEach((t, i) => { if (i === 0) { t.classList.add('me'); t.insertAdjacentHTML('beforeend', '<span class="nm" style="background:#2DD4BF;color:#050E18">YOU</span>'); } });
    const rooms = map.querySelectorAll('.mm-room'); const add = (i, h) => rooms[i] && rooms[i].insertAdjacentHTML('beforeend', h);
    const px = (w, h, rs) => `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" width="100%" height="100%">${rs}</svg>`;
    // candle flames in the cellar
    add(6, `<span class="pm-amb pm-flick" style="right:24px;top:36px;width:10px;height:14px">${px(5, 7, '<rect x="1" y="0" width="3" height="4" fill="#FDE68A"/><rect x="0" y="3" width="5" height="4" fill="#F97316"/>')}</span>`);
    // the cat walking through the grand hall
    add(4, `<span class="pm-amb pm-cat">${px(17, 11, `<rect x="0" y="2" width="2" height="5" fill="${K}"/><rect x="2" y="4" width="11" height="5" fill="${K}"/><rect x="3" y="5" width="9" height="3" fill="#F5B041"/><rect x="12" y="1" width="5" height="6" fill="${K}"/><rect x="13" y="2" width="3" height="4" fill="#F5B041"/><rect x="12" y="0" width="1" height="2" fill="${K}"/><rect x="16" y="0" width="1" height="2" fill="${K}"/><rect x="3" y="9" width="2" height="2" fill="${K}"/><rect x="10" y="9" width="2" height="2" fill="${K}"/>`)}</span>`);
    // twinkling stars in the observatory
    [[30, 50], [120, 40], [200, 90], [80, 100], [260, 60]].forEach(([x, y], k) => add(2, `<span class="pm-amb pm-tw" style="left:${x}px;top:${y}px;width:5px;height:5px;background:#FDE68A;animation-delay:${k * 0.3}s"></span>`));
    // steam from the kitchen pot
    [0, 0.6, 1.2].forEach((d) => add(5, `<span class="pm-amb pm-steam" style="left:calc(50% - 4px);top:30%;width:8px;height:8px;background:rgba(247,244,236,.6);animation-delay:${d}s"></span>`));
    // swaying plants
    add(0, `<span class="pm-amb pm-sway" style="left:18px;bottom:10px;width:22px;height:30px">${px(11, 15, '<rect x="5" y="4" width="1" height="11" fill="#1E7A3E"/><rect x="1" y="2" width="4" height="3" fill="#34D399"/><rect x="6" y="0" width="4" height="3" fill="#34D399"/><rect x="2" y="7" width="3" height="2" fill="#2EB67D"/><rect x="6" y="6" width="4" height="2" fill="#2EB67D"/>')}</span>`);
    return 'ok';
  };
})();
