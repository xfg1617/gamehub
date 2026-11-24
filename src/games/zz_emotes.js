    /* =========================================================================
       EMOTES (Inna, Nov 2026): at a game table, the face button (bottom right) opens a menu of 10 emotes. Each
       profile picture has its own pixel character (computer players are robots). Emotes are silent, can be sent as
       fast as you like (a counter shows a streak) and pop up above that player's seat for everyone at the table;
       the menu stays open until you tap outside it. "Mute others" hides other players' emotes (saved).
       Online they travel on the table's live channel ('emo'), not as game moves.
       ========================================================================= */
    (() => {
      const PAL = { k:'#050E18', o:'#F59E3B', r:'#E4572E', R:'#C23A2A', w:'#F7F4EC', u:'#7CC4F0', U:'#3C7FC0', s:'#B9C7D6', p:'#FB9DB0', P:'#E05A7A', y:'#F5D041', d:'#7A4E2A', g:'#34D399' };
      const pts = (c, list) => list.map(([x, y]) => [x, y, c]);
      const line = (c, x1, x2, y) => Array.from({ length: x2 - x1 + 1 }, (_, i) => [x1 + i, y, c]);
      const col = (c, x, y1, y2) => Array.from({ length: y2 - y1 + 1 }, (_, i) => [x, y1 + i, c]);
      const cheeks = pts('p', [[3, 9], [12, 9]]);
      const EMOTES = [
        { id:'lol', name:'LOL', anim:'a-laugh', face:'o', px:[
            ...pts('k', [[4,7],[5,6],[6,7],[9,7],[10,6],[11,7]]),
            ...line('k',6,9,9), ...pts('k',[[6,10],[9,10]]), ...line('k',6,9,11), ...pts('r',[[7,10],[8,10]]),
            ...pts('u', [[3,8],[3,9],[2,10],[12,8],[12,9],[13,10]]) ] },
        { id:'gg', name:'GG', anim:'a-bob', face:'o', extra:'<span class="emx em-gg">GG</span>', px:[
            ...line('k',3,12,6), ...line('k',3,6,7), ...line('k',9,12,7), ...line('k',4,5,8), ...line('k',10,11,8), ...pts('w',[[4,7],[9,7]]),
            ...pts('k',[[7,11],[8,11],[9,11],[10,10]]), ...cheeks ] },
        { id:'rage', name:'RAGE', anim:'a-shake', face:'r', px:[
            ...pts('k',[[4,5],[5,6],[6,6],[11,5],[10,6],[9,6]]), ...pts('k',[[5,7],[10,7]]),
            ...line('k',5,10,10), ...line('w',5,10,11), ...pts('k',[[7,11]]), ...line('k',5,10,12),
            ...pts('s',[[0,3],[1,2],[0,1],[15,3],[14,2],[15,1]]).map((p) => p.concat('puff')) ] },
        { id:'cry', name:'SOB', anim:'a-tremble', face:'o', px:[
            ...pts('k',[[4,6],[5,7],[6,6],[9,6],[10,7],[11,6]]), ...col('u',5,8,13), ...col('u',10,8,13),
            ...pts('k',[[6,11],[7,10],[8,10],[9,11]]) ] },
        { id:'shock', name:'WHAT?!', anim:'a-jump', face:'o', px:[
            ...line('w',4,6,6), ...line('w',4,6,7), ...line('w',4,6,8), ...line('w',9,11,6), ...line('w',9,11,7), ...line('w',9,11,8),
            ...pts('k',[[5,7],[10,7]]), ...pts('k',[[7,10],[8,10],[6,11],[9,11],[7,12],[8,12]]), ...pts('d',[[7,11],[8,11]]) ] },
        { id:'think', name:'HMM...', anim:'a-tilt', face:'o', extra:'<span class="emx em-dots">...</span>', px:[
            ...line('k',4,6,7), ...line('k',9,11,5), ...pts('k',[[10,7]]), ...pts('k',[[6,11],[7,11],[8,11],[9,10]]), ...cheeks ] },
        { id:'zzz', name:'BORED', anim:'a-bob', face:'o', extra:'<span class="emx em-zz">z Z</span>', px:[
            ...line('k',4,6,7), ...line('k',9,11,7), ...pts('k',[[7,10],[8,10],[7,11],[8,11]]), ...pts('d',[]), ...pts('u',[[9,12]]) ] },
        { id:'oops', name:'OOPS', anim:'a-shake', face:'o', px:[
            ...pts('k',[[5,7],[10,7]]), ...pts('k',[[5,11],[6,10],[7,11],[8,10],[9,11],[10,10]]),
            ...pts('u',[[13,3],[12,4],[13,4],[14,4],[13,5]]), ...cheeks ] },
        { id:'love', name:'NICE!', anim:'a-pulse', face:'o', px:[
            ...pts('P',[[2,6],[3,6],[5,6],[6,6]]), ...line('P',2,6,7), ...line('P',3,5,8), ...pts('P',[[4,9]]),
            ...pts('P',[[9,6],[10,6],[12,6],[13,6]]), ...line('P',9,13,7), ...line('P',10,12,8), ...pts('P',[[11,9]]),
            ...pts('k',[[6,11],[7,12],[8,12],[9,11]]) ] },
        { id:'potato', name:'HOT!', anim:'a-tremble', face:'y', px:[
            ...pts('k',[[4,7],[6,7],[5,6],[9,7],[11,7],[10,6]]), ...line('k',6,9,10), ...line('r',6,9,11), ...line('k',6,9,12),
            ...pts('r',[[2,1],[2,0],[13,1],[13,0]]).map((p) => p.concat('puff')), ...pts('u',[[1,6],[14,6]]) ] },
      ];
      const AVS = {
        '🦊': { name:'Fox', F:'#F59E3B', pal:{ c:'#FFF3E0' }, decor:{ 0:'..k.....', 1:'..kk....', 2:'..kck...', 3:'.kkcck..', 10:'.kcc....', 11:'.kccc...', 12:'..kccc..', 13:'...kccc.' } },
        '🐙': { name:'Octopus', F:'#FB7185', pal:{ c:'#FDB3BF' }, decor:{ 1:'....kkkk', 2:'...kFFFF', 3:'..kFcFFF', 13:'..kFFkFF', 14:'.kFk.kFk', 15:'..k...k.' } },
        '🐻': { name:'Bear', F:'#B07A45', pal:{ c:'#E8C28E' }, decor:{ 0:'..kkk...', 1:'.kFFFk..', 2:'.kFcFk..', 3:'.kkFFkkk', 9:'.....ccc', 10:'....cccc', 11:'....cccc', 12:'.....ccc' } },
        '🦉': { name:'Owl', F:'#9C6B3F', pal:{ c:'#E8D3B0', y:'#F5B041' }, decor:{ 0:'..k.....', 1:'..kk....', 2:'..kFk...', 3:'..kFFkkk', 5:'..cccc..', 6:'.kcccccc', 7:'.kcccccc', 8:'..cccc..', 9:'.......y', 10:'.......y' } },
        '🦈': { name:'Shark', F:'#7FA6C7', pal:{ c:'#F7F4EC' }, decor:{ 0:'.......k', 1:'......kF', 2:'.....kFF', 10:'.kcc....', 11:'.kccc...', 12:'..kccccc', 13:'...kcccc' } },
        '🐼': { name:'Panda', F:'#F7F4EC', pal:{ S:'#7A8DA3' }, decor:{ 0:'..kkk...', 1:'.kkkkk..', 2:'.kkkkk..', 6:'...SSS..', 7:'..SSSS..', 8:'..SSS...' } },
        '🦁': { name:'Lion', F:'#F5C04A', pal:{ m:'#C9661F' }, decor:{ 0:'...kkkkk', 1:'..kmmmmm', 2:'.kmmmmmm', 3:'kmmmkkkk', 4:'kmmk....', 5:'kmk.....', 6:'kmk.....', 7:'kmk.....', 8:'kmk.....', 9:'kmk.....', 10:'kmk.....', 11:'kmmk....', 12:'.kmmk...', 13:'.kmmmk..', 14:'..kmmmkk', 15:'...kkkkk' } },
        '🐸': { name:'Frog', F:'#34D399', pal:{ G:'#1F8A5E' }, decor:{ 1:'..kkk...', 2:'.kFFFk..', 3:'.kFFFkkk', 12:'..kGFFFF' } },
        '🦖': { name:'Dino', F:'#4CC38A', pal:{ y:'#F5B041' }, decor:{ 0:'......k.', 1:'...k.kyk', 2:'..kyk.ky', 3:'.kkkkkkk' }, extra:[[13,9,'k'],[13,10,'k'],[14,9,'k']] },
        '🚀': { name:'Rocket', F:'#DDE5EE', pal:{ R:'#E4572E', y:'#F5D041', O:'#F59E3B' }, decor:{ 0:'.......k', 1:'......kR', 2:'.....kRR', 3:'...kkRRR', 11:'kR......', 12:'kRk.....', 13:'kRRk....', 14:'kkkkk...', 15:'......Oy' } },
        '⚡': { name:'Bolt', F:'#F5D041', pal:{ O:'#F59E3B' }, decor:{ 0:'..k...k.', 1:'.kOk.kOk', 2:'kOOOkOOO', 3:'.kFFFFFF' } },
        '🎯': { name:'Target', F:'#F7F4EC', pal:{ R:'#E4572E' }, decor:{ 4:'..kRRRRR', 5:'.kRR....', 6:'.kR.....', 7:'.kR.....', 8:'.kR.....', 9:'.kR.....', 10:'.kR.....', 11:'.kRR....', 12:'..kRRRRR' }, extra:[[13,0,'d'],[12,1,'d'],[11,2,'d'],[14,0,'R'],[13,1,'R'],[14,1,'R']] },
        '🤖': { name:'Robot', F:'#B9C7D6', pal:{ y:'#F5D041', S:'#6E8299' }, decor:{ 0:'.......y', 1:'.......k', 2:'.......k', 7:'y.......', 8:'y.......', 12:'....SSSS' } },
      };
      // other profile pictures borrow the closest character; computer players are robots
      const LIKE = { '🐺': '🦊', '🐶': '🦊', '🐱': '🦊', '🐭': '🐼', '🐦': '🦉', '🐧': '🦉', '🐢': '🐸', '🦄': '⚡', '🐯': '🦁', '🐳': '🦈', '🐬': '🦈' };
      const ROBOTS = ['🤖', '🦾', '👾', '🛰️', '⚙️', '🔩', '🧩'];
      function charFor(av) {
        if (AVS[av]) return av; if (LIKE[av]) return LIKE[av]; if (ROBOTS.includes(av)) return '🤖';
        const keys = Object.keys(AVS); let h = 0; for (const ch of String(av || '')) h = (h * 31 + ch.codePointAt(0)) >>> 0; return keys[h % keys.length];
      }
      function headRows(a) {
        const rows = []; for (let y = 0; y < 16; y++) rows.push('................'.split(''));
        const put = (y, str) => str.split('').forEach((c, x) => { rows[y][x] = c; });
        put(3, '...kkkkkkkkkk...'); put(4, '..k' + 'F'.repeat(10) + 'k..');
        for (let y = 5; y <= 11; y++) put(y, '.k' + 'F'.repeat(12) + 'k.');
        put(12, '..k' + 'F'.repeat(10) + 'k..'); put(13, '...k' + 'F'.repeat(8) + 'k...'); put(14, '....kkkkkkkk....');
        Object.entries(a.decor || {}).forEach(([y, half]) => { half.split('').forEach((c, x) => { if (c === '.') return; const v = c === '_' ? '.' : c; rows[+y][x] = v; rows[+y][15 - x] = v; }); });
        (a.extra || []).forEach(([x, y, c]) => { rows[y][x] = c; });
        return rows;
      }
      const cache = {};
      function svg(e, av) {
        const ck = av + e.id; if (cache[ck]) return cache[ck];
        const a = AVS[charFor(av)], pal = Object.assign({}, PAL, a.pal), face = e.face === 'o' ? a.F : PAL[e.face];
        let r = '';
        headRows(a).forEach((row, y) => row.forEach((c, x) => { if (c !== '.') r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c === 'F' ? face : pal[c]}"/>`; }));
        e.px.forEach(([x, y, c, cls]) => { r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${PAL[c]}"${cls ? ` class="em-${cls}"` : ''}/>`; });
        return (cache[ck] = `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`);
      }
      const BY = {}; EMOTES.forEach((e) => { BY[e.id] = e; });
      const sprite = (e, av) => `<span class="em-spr em-${e.anim}">${svg(e, av)}${e.extra || ''}</span>`;
      let muted = false; try { muted = localStorage.getItem('ps_emote_mute') === '1'; } catch (e) {}

      // is there a game table on screen right now?
      const table = () => {
        const S = typeof NP !== 'undefined' && NP.S;
        if (!S || S.over || !S.game || S.game !== activeGame) return null;
        if (!document.getElementById('gs-body') || document.getElementById('np-lob')) return null;
        return S;
      };
      const myAv = (S) => (S.seats[S.me] && S.seats[S.me].avatar) || (typeof profile !== 'undefined' && profile.avatar) || '🦊';

      /* ---------- the bubble above a player's seat ---------- */
      const bubbles = {};
      function target(S, seat) {
        const root = document.getElementById('game-root'); if (!root) return null;
        const els = [...root.querySelectorAll(`[id$="-seat-${seat}"], [id$="-pl-${seat}"]`)].filter((el) => el.getBoundingClientRect().width > 0);
        if (els.length) return els[0];
        const chip = document.querySelectorAll('#np-bar .np-chip')[seat]; if (chip && chip.getBoundingClientRect().width > 0) return chip;
        return seat === S.me ? document.getElementById('em-fab') : null;
      }
      function show(seat, id) {
        const S = table(), e = BY[id]; if (!S || !e || !S.seats[seat]) return;
        if (seat !== S.me && muted) return;
        const t = target(S, seat); if (!t) return;
        let b = bubbles[seat];
        if (!b || !document.body.contains(b.el)) { const el = document.createElement('div'); el.className = 'em-bub'; document.body.appendChild(el); b = bubbles[seat] = { el, last: null, n: 0, timer: 0 }; }
        b.n = b.last === id && b.el.classList.contains('on') ? b.n + 1 : 1; b.last = id;
        b.el.innerHTML = sprite(e, S.seats[seat].avatar) + (b.n > 1 ? `<span class="em-count">x${b.n}</span>` : '');
        b.el.classList.remove('on'); void b.el.offsetWidth; b.el.classList.add('on');
        const r = t.getBoundingClientRect(), w = 70, h = 70;
        let x = r.left + r.width / 2 - w / 2, y = r.top - h - 12, below = false;
        if (y < 6) { y = r.bottom + 12; below = true; }
        x = Math.max(6, Math.min(window.innerWidth - w - 6, x));
        b.el.style.left = x + 'px'; b.el.style.top = y + 'px'; b.el.classList.toggle('below', below);
        clearTimeout(b.timer); b.timer = setTimeout(() => b.el.classList.remove('on'), 3000);
      }
      window.emoteShow = show;

      /* ---------- your emote button and menu ---------- */
      let sentAt = [];
      function send(id) {
        const S = table(); if (!S) return;
        show(S.me, id);
        // the network gets at most 5 a second (tapping faster still shows on your own screen)
        if (S.online && S.emote) { const now = Date.now(); sentAt = sentAt.filter((t) => now - t < 1000); if (sentAt.length < 5) { sentAt.push(now); S.emote(id); } }
      }
      function menuHTML(S) {
        const av = myAv(S);
        return `<div class="em-hd"><span>SEND AN EMOTE</span><span class="em-hint">tap outside to close</span></div>
          <div class="em-grid">${EMOTES.map((e) => `<button class="em-it" data-em="${e.id}" title="${e.name}">${sprite(e, av)}<span class="em-lab">${e.name}</span></button>`).join('')}</div>
          <div class="em-ft"><span>Everyone at the table sees it</span><button class="em-mute" data-mute>${muted ? '🔈 Show others' : '🔇 Mute others'}</button></div>`;
      }
      function closeMenu() { const m = document.getElementById('em-menu'); if (m) m.remove(); document.body.classList.remove('em-open'); }
      function openMenu() {
        const S = table(); if (!S) return;
        if (document.getElementById('em-menu')) return closeMenu();
        const m = document.createElement('div'); m.id = 'em-menu'; m.className = 'em-menu'; m.innerHTML = menuHTML(S); document.body.appendChild(m);
        document.body.classList.add('em-open'); place(document.getElementById('em-fab'));
        m.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const b = ev.target.closest('[data-em]'); if (b) return send(b.dataset.em);
          if (ev.target.closest('[data-mute]')) {
            muted = !muted; try { localStorage.setItem('ps_emote_mute', muted ? '1' : '0'); } catch (e) {}
            m.innerHTML = menuHTML(S);
            if (muted) Object.keys(bubbles).forEach((k) => { if (+k !== S.me) bubbles[k].el.classList.remove('on'); });
          }
        });
      }
      document.addEventListener('click', (ev) => { const m = document.getElementById('em-menu'); if (m && !m.contains(ev.target) && !ev.target.closest('#em-fab')) closeMenu(); });
      function syncFab() {
        placeChat();
        const S = table();
        let f = document.getElementById('em-fab');
        if (!S) { if (f) f.remove(); closeMenu(); Object.values(bubbles).forEach((b) => b.el.classList.remove('on')); return; }
        if (!f) {
          f = document.createElement('button'); f.id = 'em-fab'; f.className = 'em-fab'; f.title = 'Emotes'; f.setAttribute('aria-label', 'Emotes'); document.body.appendChild(f);
          f.onclick = (ev) => { ev.stopPropagation(); openMenu(); };
        }
        if (f.dataset.av !== myAv(S)) { f.innerHTML = svg(BY.gg, myAv(S)); f.dataset.av = myAv(S); }
        place(f);
      }
      // the emote button sits right beside the CHAT button; the menu opens above both
      // on computers, in a game, CHAT (and the emote button) sit right beside the floating control bar
      function gameBar() {
        if (!document.body.classList.contains('in-game') || window.innerWidth < 1024) return null;
        const b = document.querySelector('#gs-wrap > .panel:first-child, #view-naval:not(.hidden) > .panel:first-child, #view-daily:not(.hidden) > .panel:first-child, #view-connect4:not(.hidden) > .panel:first-child');
        return b && b.getBoundingClientRect().width ? b : null;
      }
      function placeChat() {
        const c = document.getElementById('chat-fab'), p = document.getElementById('chat-panel'), bar = gameBar();
        if (!c) return;
        if (!bar) { c.style.left = c.style.bottom = ''; if (p) { p.style.left = p.style.bottom = ''; } return; }
        // the game controls are top-left now; CHAT sits in the bottom-left corner
        c.style.left = '16px'; c.style.bottom = '14px';
        if (p) { const cr = c.getBoundingClientRect(); p.style.left = Math.max(8, Math.min(window.innerWidth - 350, cr.left)) + 'px'; p.style.bottom = Math.round(window.innerHeight - cr.top + 10) + 'px'; }
      }
      function place(f) {
        const c = document.getElementById('chat-fab'), r = c && c.getBoundingClientRect();
        if (r && r.width) { f.style.left = Math.round(r.right + 10) + 'px'; f.style.bottom = Math.round(window.innerHeight - r.bottom - (f.offsetHeight - r.height) / 2) + 'px'; }
        else { f.style.left = '16px'; f.style.bottom = window.innerWidth < 1024 ? '78px' : '18px'; }
        const m = document.getElementById('em-menu'), fr = f.getBoundingClientRect();
        if (m) { m.style.bottom = Math.round(window.innerHeight - fr.top + 10) + 'px'; if (window.innerWidth >= 1024) m.style.left = Math.max(16, Math.min(window.innerWidth - m.offsetWidth - 16, (r && r.width ? r.left : fr.left))) + 'px'; }
      }
      window.addEventListener('resize', () => { placeChat(); const f = document.getElementById('em-fab'); if (f) place(f); });
      setInterval(syncFab, 500);
      window.EMOTE = { send, show, list: EMOTES.map((e) => e.id), chars: AVS, charFor, sync: syncFab };
    })();
