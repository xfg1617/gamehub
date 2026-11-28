    /* =========================================================================
       CASE FILES (Nov 2026, Inna: "detective cases, solve together with evidence"; prototype prototypes/round9/case-files.html)
       Co-op detective game for two. Detective A has THE SCENE (hotel map, searching, interviews), Detective B has THE
       RECORDS (logs, receipts, phone records, statements). Each sees only their own half; anything pinned to the shared
       EVIDENCE BOARD is seen by both. Some interview questions only unlock once the right clue is pinned. To close the
       case one partner proposes an accusation (who / how / why + 3 pieces of evidence) and the other agrees.
       Solo: one player holds both halves and switches between them.
       Every change is a table action (apply), so both screens stay the same and a rejoin rebuilds the board.
       Cases live in case_NNN.js (window.CASE_DEFS).
       ========================================================================= */
    (function caseFilesGame() {
      const T = (en, vi) => (typeof LANG !== 'undefined' && LANG.code === 'vi' ? vi : en);
      const $ = (s) => document.querySelector(s);
      let G = null, CASES = null;
      // ---------- pixel art (our own) ----------
      const PAL = { k: '#050E18', w: '#F7F4EC', s: '#E8B48C', S: '#C68A62', d: '#8D5A3B', r: '#B0362A', y: '#F5B041', g: '#6B7A8C', b: '#2B6FA8', t: '#2DD4BF', c: '#FB7185', n: '#4B2E1E', h: '#2A2A2A', o: '#D9A441', p: '#7A4FA0', e: '#1B1B1B', m: '#9DB4CC', l: '#3A7D44', z: '#C0C7D0' };
      function pixSVG(rows, extra) {
        const P = Object.assign({}, PAL, extra || {}); let out = '';
        rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') out += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${P[ch] || ch}"/>`; }));
        return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
      }
      function face(hair, skin, cloth, style) {
        const H = { short: ['....HHHHHHHH....', '...HHHHHHHHHH...', '...HHFFFFFFHH...'], long: ['....HHHHHHHH....', '...HHHHHHHHHH...', '..HHHFFFFFFHHH..'],
          bald: ['................', '.....FFFFFF.....', '....FFFFFFFF....'], bun: ['......HHHH......', '....HHHHHHHH....', '...HHFFFFFFHH...'] }[style];
        const side = style === 'long' ? 'HH' : '..';
        const rows = ['................', H[0], H[1], H[2], `..${side[0]}FFFFFFFFFF${side[1]}..`, '...FFkFFFFkFF...', '...FFFFFFFFFF...', '...FFFFSSFFFF...', '....FFFFFFFF....', '....FFrrrrFF....', '.....FFFFFF.....', '......FFFF......', '...CCCCCCCCCC...', '..CCCCCCCCCCCC..', '.CCCCCCCCCCCCCC.', '.CCCCCCCCCCCCCC.'];
        return pixSVG(rows.map((r) => r.padEnd(16, '.').slice(0, 16)), { H: hair, F: skin, C: cloth });
      }
      const ICON = {
        key: ['......kkkk..', '.....kyyyyk.', '.....ky..yk.', '.....kyyyyk.', '......kyk...', '......kyk...', '......kyyk..', '......kyk...', '......kyyk..', '......kkk...', '............', '............'],
        shoe: ['............', '...kk.......', '..kddk......', '..kddk......', '..kdddk.....', '..kddddkkk..', '..kddddddk..', '..kkkkkkkk..', '..k.k.k.k...', '............', '............', '............'],
        card: ['............', 'kkkkkkkkkkk.', 'kwwwwwwwwwk.', 'kwrrrwwwwwk.', 'kwwwwwwwwwk.', 'kwgggggggwk.', 'kwgggggwwwk.', 'kwwwwwwwwwk.', 'kkkkkkkkkkk.', '............', '............', '............'],
        log: ['.kkkkkkkkk..', '.kwwwwwwwk..', '.kwgggggwk..', '.kwwwwwwwk..', '.kwgggggwk..', '.kwwwwwwwk..', '.kwyyyyywk..', '.kwwwwwwwk..', '.kwgggggwk..', '.kwwwwwwwk..', '.kkkkkkkkk..', '............'],
        phone: ['...kkkkkk...', '...kmmmmk...', '...kmttmk...', '...kmmmmk...', '...kmccmk...', '...kmmmmk...', '...kmttmk...', '...kmmmmk...', '...kkwwkk...', '...kkkkkk...', '............', '............'],
        bolt: ['......kkk...', '.....kyyk...', '....kyyk....', '...kyyyyyk..', '....kkyyk...', '.....kyk....', '....kyk.....', '....kk......', '............', '............', '............', '............'],
        glass: ['............', '..kkkkkkkk..', '..kzzzzzzk..', '..kz....zk..', '..kz....zk..', '..kz....zk..', '..kzzzzzzk..', '..kddddddk..', '..kkkkkkkk..', '............', '............', '............'],
        door: ['..kkkkkkk...', '..knnnnnk...', '..kndddnk...', '..kndddnk...', '..knnnnyk...', '..kndddnk...', '..kndddnk...', '..knnnnnk...', '..kkkkkkk...', '............', '............', '............'],
        cart: ['............', '.kkkkkkkk...', '.kwwwwwwk...', '.kmmmmmmk.k.', '.kwwwwwwkkk.', '.kmmmmmmk...', '.kkkkkkkk...', '..k....k....', '.kkk..kkk...', '............', '............', '............'],
        glassdrink: ['............', '..kkkkkk....', '..koooook...', '..kooooook..', '...kooook...', '....kook....', '.....kk.....', '.....kk.....', '...kkkkkk...', '............', '............', '............'],
        heel: ['............', '.....kk.....', '....kcck....', '...kccck....', '..kccck.....', '..kcck......', '..kkkk..kk..', '........kk..', '............', '............', '............', '............'],
        gen: ['............', '.kkkkkkkkkk.', '.kggggggggk.', '.kgkkgggggk.', '.kgkkggyygk.', '.kggggggggk.', '.kggggggggk.', '.kkkkkkkkkk.', '..kk....kk..', '............', '............', '............'],
        pen: ['............', '.kkkkkkkkk..', '.kwwwwwwwk..', '.kwggggwwk..', '.kwwwwwwwk..', '.kwggwwwwk..', '.kwwwwwwkr..', '.kwwwwwkry..', '.kkkkkkkk...', '............', '............', '............'],
      };
      const icon = (n) => pixSVG((ICON[n] || ICON.log).map((r) => r.padEnd(12, '.')));
      const cases = () => { if (!CASES) CASES = (window.CASE_DEFS || []).map((f) => f(face)); return CASES; };

      // ---------- setup ----------
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1400px] mx-auto');
        setupScreen(body, mod, [
          { key: 'case', label: 'THE CASE', def: 'harbor', hero: true, hint: 'More cases are coming. Each one takes about 20-30 minutes.', choices: cases().map((c) => [c.id, `#${c.num} · ${c.title}`]) },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }], sel)),
        'A co-op detective case for two. One of you has the crime scene, the other has the records. Work it out together!');
      }
      function start(body, sel, S) {
        const C = cases().find((c) => c.id === sel.case) || cases()[0];
        const solo = S.n === 1;
        G = { S, C, solo, me: S.online ? S.me : 0, view: 'A', tab: 'brief', room: Object.keys(C.ROOMS)[0], open: null, sus: C.SUSPECTS[0],
          found: {}, pins: [], strings: [], asked: {}, feed: [], hints: 0, tries: 0, acc: { who: null, how: null, why: null, ev: [] }, prop: null, solved: false, selPin: null, noteN: 0, over: false, tok: ++GT.cur, t0: Date.now() };
        G.role = solo ? 'both' : G.me === 0 ? 'A' : 'B';
        if (G.role === 'B') G.view = 'B';
        GT.started = true; GT.over = false;
        body.innerHTML = `<div class="cf-wrap"><div class="cf-top" id="cf-top"></div><div class="cf-tabs" id="cf-tabs"></div><div id="cf-view"></div></div>`;
        S.on(apply, () => {});
        S.onLeft = (a) => { if (!G || G.solo) return; G.role = 'both'; G.partnerLeft = true; feed(a.s, T('left the case. You now hold both halves.', 'đã rời vụ án. Giờ bạn giữ cả hai nửa.')); render(); };
        bind(body);
        npBar('');
        render();
      }
      const partner = () => (G.solo ? null : G.S.name(1 - G.me));
      const myName = (s) => (s === G.me ? T('You', 'Bạn') : G.S.name(s));
      function feed(s, txt) { G.feed.unshift({ s, txt }); }
      const sees = (who) => G.role === 'both' ? who === G.view : who === G.role;

      // ---------- every change, in the same order on both screens ----------
      function apply(a) {
        if (!G) return 0;
        const C = G.C, title = (id) => (C.CLUES[id] ? C.CLUES[id].title : T('a note', 'một ghi chú'));
        if (a.t === 'find') { if (!G.found[a.id]) { G.found[a.id] = 1; if (a.s !== G.me) feed(a.s, `${T('found', 'tìm thấy')} <b>${esc(title(a.id))}</b>`); } }
        else if (a.t === 'pin') { if (!G.pins.some((p) => p.id === a.id)) { G.pins.push({ id: a.id, by: a.s, x: a.x, y: a.y, text: a.text }); feed(a.s, `${T('pinned', 'đã ghim')} <b>${esc(a.text ? T('a sticky note', 'một ghi chú') : title(a.id))}</b>`); if (a.s !== G.me) toast(`📌 ${esc(G.S.name(a.s))} ${T('pinned', 'đã ghim')} "${esc(a.text ? T('a note', 'ghi chú') : title(a.id))}"`); } }
        else if (a.t === 'unpin') { G.pins = G.pins.filter((p) => p.id !== a.id); G.strings = G.strings.filter((s) => !s.includes(a.id)); G.acc.ev = G.acc.ev.filter((x) => x !== a.id); feed(a.s, T('took a card off the board', 'gỡ một thẻ khỏi bảng')); }
        else if (a.t === 'move') { const p = G.pins.find((q) => q.id === a.id); if (p) { p.x = a.x; p.y = a.y; } }
        else if (a.t === 'tie') { const i = G.strings.findIndex((s) => s.includes(a.a) && s.includes(a.b)); if (i >= 0) G.strings.splice(i, 1); else { G.strings.push([a.a, a.b]); feed(a.s, `${T('tied', 'nối')} <b>${esc(title(a.a))}</b> ${T('to', 'với')} <b>${esc(title(a.b))}</b>`); } }
        else if (a.t === 'ask') { const k = a.sus + a.i; if (!G.asked[k]) { G.asked[k] = 1; const q = C.TALK[a.sus][a.i]; if (!Array.isArray(q)) feed(a.s, `${T('confronted', 'chất vấn')} <b>${esc(C.PEOPLE[a.sus].name)}</b>`); } }
        else if (a.t === 'hint') { if (G.hints < C.HINTS.length) { G.hints++; feed(a.s, T('used a hint (−1 star)', 'dùng một gợi ý (−1 sao)')); } }
        else if (a.t === 'propose') { G.prop = { s: a.s, who: a.who, how: a.how, why: a.why, ev: a.ev }; if (G.solo) return decide(true); feed(a.s, T('wants to make an accusation', 'muốn buộc tội')); if (a.s !== G.me) { G.tab = 'acc'; SFX.play('reveal'); } }
        else if (a.t === 'answer') { if (G.prop && a.s !== G.prop.s) return decide(!!a.ok); }
        else if (a.t === 'cancel') { G.prop = null; }
        else if (a.t === '_left' || a.t === '_gone') { /* handled by onLeft */ }
        if (!G.dragging) render();
        return 0;
      }
      function decide(ok) {
        const C = G.C, p = G.prop; G.prop = null;
        if (!ok) { feed(1 - p.s, T('wants to keep looking', 'muốn điều tra thêm')); toast(T('Not yet: your partner wants to keep looking.', 'Chưa: cộng sự muốn điều tra thêm.')); render(); return 0; }
        if (p.who === C.KEY.who && p.how === C.KEY.how && p.why === C.KEY.why) {
          G.weak = p.ev.filter((x) => C.STRONG.includes(x)).length < 3 ? 1 : 0; G.solved = true; G.tab = 'acc'; G.over = true; GT.over = true;
          SFX.play('win'); render(); finish(); return 0;
        }
        G.tries++; SFX.play('wrong');
        toast('❌ ' + (p.who !== C.KEY.who ? C.wrong.who(C.PEOPLE[p.who].name) : p.how !== C.KEY.how ? C.wrong.how : C.wrong.why));
        render(); return 0;
      }
      const stars = () => Math.max(1, 5 - G.hints - G.tries - (G.weak || 0));
      function finish() {
        const s = stars(), mins = Math.max(1, Math.round((Date.now() - G.t0) / 60000));
        const st = gstat('casefiles'); st.cases = (st.cases || 0) + 1; st.stars = Math.max(st.stars || 0, s);
        reportGame('casefiles', 'win', { solo: G.solo, xp: 20 + s * 8, label: `Case #${G.C.num} solved, ${s}★` });
        G.S.over = true; try { if (G.S.online) localStorage.removeItem('ps_np_cur:' + (NET.me && NET.me.id)); } catch (e) {}   // nothing to rejoin
        G.mins = mins;
      }
      const act = (a) => G.S.act(Object.assign({ s: G.me }, a));
      let toastT = null;
      function toast(t) { const el = $('#cf-toast') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'cf-toast', className: 'cf-toast' })); el.innerHTML = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600); }

      // ---------- views ----------
      function render() {
        if (!G || !$('#cf-view')) return;
        const C = G.C;
        const who = G.role === 'both'
          ? `<div class="cf-who"><button class="a ${G.view === 'A' ? 'on' : ''}" data-view="A">${T('Scene', 'Hiện trường')}</button><button class="b ${G.view === 'B' ? 'on' : ''}" data-view="B">${T('Records', 'Hồ sơ')}</button></div>`
          : `<span class="cf-me ${G.role.toLowerCase()}">${G.role === 'A' ? T('YOU: THE SCENE', 'BẠN: HIỆN TRƯỜNG') : T('YOU: THE RECORDS', 'BẠN: HỒ SƠ')}</span>`;
        $('#cf-top').innerHTML = `<span class="cf-case pix">CASE #${C.num} · ${esc(C.title).toUpperCase()}</span>${who}<span class="cf-note">${G.solo ? T('Playing alone: you hold both halves. Switch between the scene and the records.', 'Chơi một mình: bạn giữ cả hai nửa. Chuyển qua lại giữa hiện trường và hồ sơ.')
          : G.partnerLeft ? T('Your partner left: you now hold both halves.', 'Cộng sự đã rời: giờ bạn giữ cả hai nửa.')
          : `${T('Partner', 'Cộng sự')}: <b>${esc(partner())}</b> · ${G.role === 'A' ? T('the records', 'hồ sơ') : T('the scene', 'hiện trường')}. ${T('Pin clues so they can see them, and talk!', 'Ghim manh mối để họ thấy, và trao đổi nhé!')}`}</span>`;
        const v = G.view, myN = Object.keys(G.found).filter((k) => C.CLUES[k] && sees(C.CLUES[k].who)).length;
        const list = [['brief', T('Briefing', 'Tóm tắt')], ['inv', v === 'A' ? T('Crime scene', 'Hiện trường') : T('Records', 'Hồ sơ'), myN], ['sus', T('Interviews', 'Thẩm vấn')], ['board', T('Evidence board', 'Bảng chứng cứ'), G.pins.length], ['acc', T('Accuse', 'Buộc tội'), G.prop ? '!' : 0]];
        $('#cf-tabs').innerHTML = list.map(([k, l, n]) => `<button class="cf-tab ${G.tab === k ? 'on' : ''}" data-tab="${k}">${l}${n ? `<span class="n">${n}</span>` : ''}</button>`).join('');
        const el = $('#cf-view');
        el.innerHTML = G.tab === 'brief' ? briefHTML() : G.tab === 'inv' ? (v === 'A' ? sceneHTML() : recordsHTML()) : G.tab === 'sus' ? susHTML() : G.tab === 'board' ? boardHTML() : accHTML();
        if (G.tab === 'board') drawStrings();
      }
      function briefHTML() {
        const C = G.C;
        return `<div class="cf-brief"><div class="cf-paper"><span class="cf-stamp">CASE #${C.num}</span><h3>${esc(C.title)}</h3>${C.brief}
            <ul class="cf-qs">${C.questions.map((q) => `<li>${q}</li>`).join('')}</ul></div>
          <div class="cf-roles"><div class="cf-role a"><b>${T('Detective A · the scene', 'Thám tử A · hiện trường')}</b><p>${T('Walks the hotel, searches rooms and talks to the suspects. Sees what is physically there.', 'Đi khắp khách sạn, lục soát các phòng và thẩm vấn nghi phạm. Thấy những gì có thật ở hiện trường.')}</p></div>
            <div class="cf-role b"><b>${T('Detective B · the records', 'Thám tử B · hồ sơ')}</b><p>${T('Has the paperwork: door logs, receipts, the power company, phone records, written statements.', 'Giữ giấy tờ: nhật ký cửa, hóa đơn, công ty điện, dữ liệu điện thoại, lời khai.')}</p></div>
            <div class="cf-panel"><div class="cf-ph">${T('HOW TO PLAY', 'CÁCH CHƠI')}</div><div class="cf-pb cf-how">
              1. ${T('Each detective digs through their own half.', 'Mỗi thám tử điều tra nửa của mình.')}<br>2. ${T('<b>Pin</b> anything useful to the shared evidence board, so your partner sees it.', '<b>Ghim</b> manh mối hữu ích lên bảng chứng cứ chung để cộng sự thấy.')}<br>3. ${T('Talk it through: a record can prove someone is lying.', 'Bàn bạc: một hồ sơ có thể chứng minh ai đó nói dối.')}<br>4. ${T('Use the board\'s clues to <b>confront</b> suspects.', 'Dùng manh mối trên bảng để <b>chất vấn</b> nghi phạm.')}<br>5. ${T('Accuse: who, how and why, with your 3 best pieces of evidence. Your partner has to agree.', 'Buộc tội: ai, bằng cách nào, vì sao, kèm 3 bằng chứng tốt nhất. Cộng sự phải đồng ý.')}<br><br>
              ${T('Stuck?', 'Bí?')} <button class="btn-game btn-amber py-1 px-3 text-xs" data-hint ${G.hints >= G.C.HINTS.length ? 'disabled' : ''}>${T('Get a hint', 'Xem gợi ý')}</button> <span class="text-muted">${T('(each hint costs a star)', '(mỗi gợi ý trừ một sao)')}</span>
              ${G.C.HINTS.slice(0, G.hints).map((h, i) => `<div class="cf-hint"><b>${T('Hint', 'Gợi ý')} ${i + 1}:</b> ${h}</div>`).join('')}</div></div></div></div>`;
      }
      function clueCard(id) {
        const c = G.C.CLUES[id], pinned = G.pins.some((p) => p.id === id);
        return `<div class="cf-clue"><span class="cf-by ${c.who.toLowerCase()}">${c.who === 'A' ? T('SCENE', 'HIỆN TRƯỜNG') : T('RECORD', 'HỒ SƠ')}</span>
          <h4><span class="ic">${icon(c.icon)}</span>${c.title}</h4>${c.html ? c.html() : `<div>${c.text}</div>`}
          <div class="acts">${pinned ? `<span class="cf-pinned">📌 ${T('On the board', 'Đã ở trên bảng')}</span>` : `<button class="btn-game btn-teal py-1.5 px-3 text-xs" data-pin="${id}">📌 ${T('Pin to the board', 'Ghim lên bảng')}</button>`}</div></div>`;
      }
      function sceneHTML() {
        const C = G.C, r = C.ROOMS[G.room];
        const map = `<svg class="cf-map" viewBox="0 0 ${C.mapW} ${C.mapH}">${Object.entries(C.ROOMS).map(([k, o]) => {
          const n = o.spots.length, got = o.spots.filter(([, id]) => G.found[id]).length;
          return `<g class="cf-room ${G.room === k ? 'sel' : ''}" data-room="${k}"><rect class="r" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="${o.col}"/>
            <text x="${o.x + 10}" y="${o.y + 26}">${o.name.toUpperCase()}</text><text class="cnt" x="${o.x + 10}" y="${o.y + o.h - 12}" fill="${!n ? '#9DB4CC' : got === n ? '#34D399' : '#F5B041'}">${n ? `${got}/${n} ${T('searched', 'đã lục soát')}` : T('nothing to search', 'không có gì')}</text></g>`;
        }).join('')}${C.mapExtra || ''}</svg>`;
        const open = G.open && C.CLUES[G.open] && C.CLUES[G.open].who === 'A' ? clueCard(G.open) : '';
        return `<div class="cf-inv"><div class="cf-panel"><div class="cf-ph">${T('THE HOTEL', 'KHÁCH SẠN')} <small>${T('tap a room', 'chạm vào một phòng')}</small></div><div class="cf-pb">${map}</div></div>
          <div class="cf-panel"><div class="cf-ph">${esc(r.name).toUpperCase()}</div><div class="cf-pb"><p class="cf-scene">${r.scene}</p>
            ${r.spots.map(([n, id]) => `<div class="cf-spot ${G.found[id] ? 'done' : ''}" data-search="${id}"><span class="ic">${icon(C.CLUES[id].icon)}</span><span><b>${G.found[id] ? C.CLUES[id].title : n}</b><small>${G.found[id] ? C.CLUES[id].short : T('Search here', 'Lục soát ở đây')}</small></span>${G.found[id] ? `<span class="ok">${T('FOUND', 'ĐÃ THẤY')}</span>` : ''}</div>`).join('') || `<p class="cf-scene">${T('Nothing useful here.', 'Không có gì hữu ích ở đây.')}</p>`}
            ${open}</div></div></div>`;
      }
      function recordsHTML() {
        const C = G.C, ids = Object.keys(C.CLUES).filter((k) => C.CLUES[k].who === 'B');
        const open = G.open && C.CLUES[G.open] && C.CLUES[G.open].who === 'B' ? clueCard(G.open) : `<p class="cf-scene">${T('Open a folder to read it.', 'Mở một tập hồ sơ để đọc.')}</p>`;
        return `<div class="cf-inv"><div class="cf-panel"><div class="cf-ph">${T('RECORDS DRAWER', 'NGĂN HỒ SƠ')} <small>${ids.filter((k) => G.found[k]).length}/${ids.length} ${T('read', 'đã đọc')}</small></div><div class="cf-pb"><div class="cf-drawer">${ids.map((k) => `<div class="cf-folder ${G.found[k] ? 'read' : ''}" data-search="${k}"><span class="ic">${icon(C.CLUES[k].icon)}</span><b>${C.CLUES[k].title}</b><small>${G.found[k] ? C.CLUES[k].short : T('Not read yet', 'Chưa đọc')}</small></div>`).join('')}</div></div></div>
          <div class="cf-panel"><div class="cf-ph">${T('READING', 'ĐANG ĐỌC')}</div><div class="cf-pb">${open}</div></div></div>`;
      }
      function susHTML() {
        const C = G.C, list = Object.keys(C.PEOPLE), p = C.PEOPLE[G.sus], qs = C.TALK[G.sus] || [];
        const canAsk = G.role !== 'B';
        const talk = `<div class="cf-talk"><div class="big">${p.art}<b>${p.name}</b><small>${p.role}</small></div><div>
          ${canAsk ? '' : `<div class="cf-ans"><span class="q">${T('DETECTIVE B', 'THÁM TỬ B')}</span>${T(`${esc(partner() || '')} (the scene) asks the questions. You see the answers here. Find records that prove someone is lying and pin them, so they can confront them.`, `${esc(partner() || '')} (hiện trường) đặt câu hỏi. Bạn thấy câu trả lời ở đây. Hãy tìm hồ sơ chứng minh ai đó nói dối và ghim lên bảng để họ chất vấn.`)}</div>`}
          ${qs.map((q, i) => {
            const k = G.sus + i, conf = !Array.isArray(q), need = conf && q.need, has = !need || G.pins.some((x) => x.id === need), qq = conf ? q.q : q[0];
            if (!canAsk && !G.asked[k]) return '';
            return (canAsk ? `<button class="cf-q ${conf ? 'conf' : ''} ${G.asked[k] ? 'asked' : ''}" data-ask="${i}" ${has ? '' : 'disabled'}>${conf ? '🔎 ' : '💬 '}${qq}${!has ? ` <span class="lock">· ${T('pin', 'ghim')} "${C.CLUES[need].title}" ${T('to the board first', 'lên bảng trước')}</span>` : ''}</button>` : `<div class="cf-q asked">${conf ? '🔎 ' : '💬 '}${qq}</div>`)
              + (G.asked[k] ? `<div class="cf-ans ${conf && q.hot ? 'hot' : ''}">${conf ? q.a : q[1]}</div>` : '');
          }).join('')}</div></div>`;
        return `<div class="cf-panel"><div class="cf-ph">${T('INTERVIEWS', 'THẨM VẤN')} <small>${C.SUSPECTS.length} ${T('suspects', 'nghi phạm')} · ${list.length - C.SUSPECTS.length} ${T('witnesses', 'nhân chứng')}</small></div><div class="cf-pb">
          <div class="cf-sus">${list.map((k) => `<div class="cf-sc ${G.sus === k ? 'sel' : ''}" data-sus="${k}">${C.PEOPLE[k].art}<span><b>${C.PEOPLE[k].name}</b><small>${C.PEOPLE[k].role}${C.PEOPLE[k].tall ? ' · ' + T('tall', 'cao') : ''}</small></span></div>`).join('')}</div>${talk}</div></div>`;
      }
      function boardHTML() {
        const C = G.C;
        return `<div class="cf-boardwrap"><div class="cf-cork" id="cf-cork"><svg class="strings" id="cf-strings"></svg>
          ${G.pins.map((p) => { const c = C.CLUES[p.id]; return c ? `<div class="cf-pin ${c.who.toLowerCase()} ${G.selPin === p.id ? 'sel' : ''}" data-p="${p.id}" style="left:${p.x}px;top:${p.y}px"><span class="x" data-unpin="${p.id}">✕</span><b>${c.title}</b>${c.short}</div>`
            : `<div class="cf-pin note ${G.selPin === p.id ? 'sel' : ''}" data-p="${p.id}" style="left:${p.x}px;top:${p.y}px"><span class="x" data-unpin="${p.id}">✕</span>${esc(p.text || '')}<i>${esc(myName(p.by))}</i></div>`; }).join('')}
          ${G.pins.length ? '' : `<div class="cf-empty">${T('Nothing pinned yet.<br>Find clues and press 📌 Pin to the board.', 'Chưa ghim gì.<br>Tìm manh mối và bấm 📌 Ghim lên bảng.')}</div>`}</div>
          <div class="cf-panel"><div class="cf-ph">${T('SHARED BOARD', 'BẢNG CHUNG')}</div><div class="cf-pb">
            <div class="cf-legend"><span><i style="background:#2DD4BF"></i>${T('scene', 'hiện trường')}</span><span><i style="background:#FB7185"></i>${T('records', 'hồ sơ')}</span><span><i style="background:#FFF2A6"></i>${T('note', 'ghi chú')}</span></div>
            <p class="cf-how">${T('<b>Drag</b> cards around. <b>Tap one card, then another</b> to tie them with red string (tie again to untie). Your partner sees every change.', '<b>Kéo</b> thẻ để sắp xếp. <b>Chạm một thẻ rồi thẻ khác</b> để nối bằng dây đỏ (nối lại để gỡ). Cộng sự thấy mọi thay đổi.')}</p>
            <textarea id="cf-notetxt" maxlength="160" placeholder="${T('Write a sticky note...', 'Viết ghi chú...')}"></textarea>
            <button class="btn-game btn-amber py-1.5 px-3 text-xs" data-addnote>${T('Add sticky note', 'Thêm ghi chú')}</button>
            <div class="cf-feed">${G.feed.slice(0, 16).map((f) => `<div><b class="${f.s === 0 ? 'a' : 'b'}">${esc(myName(f.s))}</b> ${f.txt}</div>`).join('') || T('Board activity shows here.', 'Hoạt động trên bảng hiện ở đây.')}</div></div></div></div>`;
      }
      function drawStrings() {
        const svg = $('#cf-strings'), cork = $('#cf-cork'); if (!svg || !cork) return;
        const cr = cork.getBoundingClientRect();
        const at = (id) => { const el = cork.querySelector(`[data-p="${id}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return [r.left - cr.left + r.width / 2, r.top - cr.top + 4]; };
        svg.innerHTML = G.strings.map(([a, b]) => { const p = at(a), q = at(b); if (!p || !q) return ''; const mx = (p[0] + q[0]) / 2, my = Math.max(p[1], q[1]) + 30;
          return `<path d="M${p[0]},${p[1]} Q${mx},${my} ${q[0]},${q[1]}" stroke="#050E18" stroke-width="5" fill="none"/><path d="M${p[0]},${p[1]} Q${mx},${my} ${q[0]},${q[1]}" stroke="#D2382C" stroke-width="3" fill="none"/>`; }).join('');
      }
      function accHTML() {
        const C = G.C, a = G.acc, pinned = G.pins.filter((p) => C.CLUES[p.id]);
        if (G.solved) return revealHTML();
        if (G.prop) {
          const p = G.prop, mine = p.s === G.me;
          return `<div class="cf-panel"><div class="cf-ph">${T('ACCUSATION', 'BUỘC TỘI')}</div><div class="cf-pb cf-prop">
            <p>${mine ? T(`Waiting for <b>${esc(partner())}</b> to agree...`, `Đang chờ <b>${esc(partner())}</b> đồng ý...`) : T(`<b>${esc(G.S.name(p.s))}</b> wants to accuse:`, `<b>${esc(G.S.name(p.s))}</b> muốn buộc tội:`)}</p>
            <div class="cf-propbox"><div>${C.PEOPLE[p.who].art}</div><div><b>${C.PEOPLE[p.who].name}</b><br>${T('How', 'Cách')}: ${esc((C.HOW.find((h) => h[0] === p.how) || ['', ''])[1])}<br>${T('Why', 'Vì sao')}: ${esc((C.WHY.find((h) => h[0] === p.why) || ['', ''])[1])}<br>${T('Evidence', 'Bằng chứng')}: ${p.ev.map((x) => esc(C.CLUES[x] ? C.CLUES[x].title : '')).join(' · ')}</div></div>
            <div class="flex gap-3 flex-wrap mt-3">${mine ? `<button class="btn-game btn-graphite py-2 px-4 text-sm" data-cancel>${T('Take it back', 'Rút lại')}</button>` : `<button class="btn-game btn-coral py-2 px-5 text-sm" data-answer="1">⚖ ${T('Agree, accuse!', 'Đồng ý, buộc tội!')}</button><button class="btn-game btn-graphite py-2 px-4 text-sm" data-answer="0">${T('Not yet', 'Chưa')}</button>`}</div></div></div>`;
        }
        const ready = a.who && a.how && a.why && a.ev.length === 3;
        return `<div class="cf-acc">
          <div class="cf-accq"><b>1 · ${T('WHO DID IT?', 'AI LÀM?')}</b><div class="cf-opts">${C.SUSPECTS.map((k) => `<button class="cf-opt ${a.who === k ? 'on' : ''}" data-acc="who" data-v="${k}">${C.PEOPLE[k].art}${C.PEOPLE[k].name}</button>`).join('')}</div></div>
          <div class="cf-accq"><b>2 · ${T('HOW?', 'BẰNG CÁCH NÀO?')}</b><div class="cf-opts">${C.HOW.map(([k, t]) => `<button class="cf-opt ${a.how === k ? 'on' : ''}" data-acc="how" data-v="${k}">${t}</button>`).join('')}</div></div>
          <div class="cf-accq"><b>3 · ${T('WHY?', 'VÌ SAO?')}</b><div class="cf-opts">${C.WHY.map(([k, t]) => `<button class="cf-opt ${a.why === k ? 'on' : ''}" data-acc="why" data-v="${k}">${t}</button>`).join('')}</div></div>
          <div class="cf-accq"><b>4 · ${T('YOUR 3 BEST PIECES OF EVIDENCE', '3 BẰNG CHỨNG TỐT NHẤT')}</b><p class="cf-sub">${T('Picked from the board', 'Chọn từ trên bảng')} (${a.ev.length}/3)</p>
            <div class="cf-opts">${pinned.length ? pinned.map((p) => `<button class="cf-opt ${a.ev.includes(p.id) ? 'on' : ''}" data-ev="${p.id}"><span class="ic">${icon(C.CLUES[p.id].icon)}</span>${C.CLUES[p.id].title}</button>`).join('') : `<span class="text-muted">${T('Pin clues to the board first.', 'Hãy ghim manh mối lên bảng trước.')}</span>`}</div></div>
          <div class="flex gap-3 items-center flex-wrap"><button class="btn-game btn-coral py-2.5 px-5 text-sm" data-propose ${ready ? '' : 'disabled'}>⚖ ${G.solo ? T('Make the accusation', 'Buộc tội') : T('Propose this accusation', 'Đề xuất buộc tội')}</button>
            <span class="text-muted text-sm">${G.solo ? '' : T('Your partner has to agree. ', 'Cộng sự phải đồng ý. ')}${T('A wrong accusation costs a star.', 'Buộc tội sai bị trừ một sao.')}${G.tries ? ` ${T('Wrong so far', 'Sai')}: ${G.tries}.` : ''}</span></div></div>`;
      }
      function revealHTML() {
        const C = G.C, s = stars(), all = Object.keys(C.CLUES), got = all.filter((k) => G.found[k]), miss = all.filter((k) => !G.found[k]);
        return `<div class="cf-panel"><div class="cf-ph">${T('CASE CLOSED', 'ĐÃ PHÁ ÁN')} <small>Case #${C.num} · ${esc(C.title)}</small></div><div class="cf-pb">
          <div class="cf-verdict"><div class="pic">${C.PEOPLE[C.culprit].art}</div><div><div class="big">${T('SOLVED!', 'PHÁ ÁN!')}</div><div class="who">${C.solved}</div>
            <div class="cf-stars">${'★'.repeat(s)}<i>${'★'.repeat(5 - s)}</i></div><div class="text-muted text-sm">${G.hints} ${T('hints', 'gợi ý')} · ${G.tries} ${T('wrong accusations', 'lần buộc tội sai')}${G.weak ? ' · ' + T('weaker evidence picked', 'bằng chứng chưa mạnh') : ''}${G.mins ? ` · ${G.mins} min` : ''}</div></div></div>
          <p class="cf-story">${C.story}</p>
          <b class="pix cf-h">${T('WHAT REALLY HAPPENED', 'CHUYỆN GÌ ĐÃ XẢY RA')}</b>
          <div class="cf-tl">${C.timeline.map(([t, x]) => `<div><b>${t}</b>${x}</div>`).join('')}</div>
          <b class="pix cf-h">${T('THE RED HERRINGS', 'NHỮNG MANH MỐI GÂY NHIỄU')}</b>
          <p class="cf-story">${C.herrings.map(([n, x]) => `<b>${n}</b> ${x}`).join('<br>')}</p>
          <div class="cf-found"><div><b class="got">${T('Found', 'Tìm thấy')} ${got.length} / ${all.length}</b><br>${got.map((k) => C.CLUES[k].title).join(' · ') || '-'}</div><div><b class="miss">${T('Missed', 'Bỏ sót')}</b><br>${miss.map((k) => C.CLUES[k].title).join(' · ') || T('Nothing. Perfect detective work!', 'Không gì cả. Thám tử hoàn hảo!')}</div></div>
          <div class="mt-4 flex gap-3 flex-wrap"><button class="btn-game btn-amber py-2 px-5 text-sm" data-again>${T('Back to the cases', 'Về danh sách vụ án')}</button></div></div></div>`;
      }

      // ---------- input ----------
      function bind(body) {
        gOn(body, 'click', (e) => {
          const t = e.target.closest('[data-tab],[data-view],[data-room],[data-search],[data-pin],[data-sus],[data-ask],[data-unpin],[data-addnote],[data-acc],[data-ev],[data-propose],[data-answer],[data-cancel],[data-hint],[data-again]');
          if (!t || !G) return;
          const C = G.C;
          if (t.dataset.tab) { G.tab = t.dataset.tab; G.selPin = null; }
          else if (t.dataset.view) { G.view = t.dataset.view; G.open = null; if (G.tab === 'inv') G.tab = 'inv'; }
          else if (t.dataset.room) { G.room = t.dataset.room; G.open = null; }
          else if (t.dataset.search) { const id = t.dataset.search; G.open = id; if (!G.found[id]) { act({ t: 'find', id }); SFX.play('reveal'); return; } }
          else if (t.dataset.pin) { const n = G.pins.length; act({ t: 'pin', id: t.dataset.pin, x: 16 + (n % 4) * 182 + rnd(12), y: 18 + Math.floor(n / 4) * 120 + rnd(12) }); SFX.play('click'); return; }
          else if (t.dataset.unpin) { e.stopPropagation(); act({ t: 'unpin', id: t.dataset.unpin }); return; }
          else if (t.dataset.sus) G.sus = t.dataset.sus;
          else if (t.dataset.ask !== undefined) { if (!G.asked[G.sus + t.dataset.ask]) { act({ t: 'ask', sus: G.sus, i: +t.dataset.ask }); return; } }
          else if (t.dataset.addnote !== undefined) { const v = ((body.querySelector('#cf-notetxt') || {}).value || '').trim(); if (!v) return; const n = G.pins.length; act({ t: 'pin', id: 'note' + G.me + '_' + (++G.noteN) + '_' + rnd(9999), text: v.slice(0, 160), x: 30 + (n % 4) * 170, y: 30 + Math.floor(n / 4) * 120 }); return; }
          else if (t.dataset.acc) G.acc[t.dataset.acc] = t.dataset.v;
          else if (t.dataset.ev) { const id = t.dataset.ev, ev = G.acc.ev; if (ev.includes(id)) G.acc.ev = ev.filter((x) => x !== id); else if (ev.length < 3) ev.push(id); }
          else if (t.dataset.propose !== undefined) { const a = G.acc; act({ t: 'propose', who: a.who, how: a.how, why: a.why, ev: a.ev.slice() }); return; }
          else if (t.dataset.answer !== undefined) { act({ t: 'answer', ok: t.dataset.answer === '1' ? 1 : 0 }); return; }
          else if (t.dataset.cancel !== undefined) { act({ t: 'cancel' }); return; }
          else if (t.dataset.hint !== undefined) { act({ t: 'hint' }); return; }
          else if (t.dataset.again !== undefined) { G = null; open($('#game-root') || document.getElementById('game-root')); return; }
          render();
        });
        // dragging + tying cards on the board (the move is shared when you let go)
        let drag = null;
        gOn(body, 'pointerdown', (e) => {
          const el = e.target.closest('.cf-pin'); if (!el || e.target.closest('.x') || !G) return;
          const id = el.dataset.p, p = G.pins.find((x) => x.id === id), cr = $('#cf-cork').getBoundingClientRect();
          drag = { id, p, el, dx: e.clientX - cr.left - p.x, dy: e.clientY - cr.top - p.y, moved: false, sx: e.clientX, sy: e.clientY };
          try { el.setPointerCapture(e.pointerId); } catch (x) {}
        });
        gOn(body, 'pointermove', (e) => {
          if (!drag || !G) return; if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 5) drag.moved = true;
          if (!drag.moved) return; G.dragging = true;
          const cr = $('#cf-cork').getBoundingClientRect();
          drag.p.x = Math.round(Math.max(0, Math.min(cr.width - drag.el.offsetWidth, e.clientX - cr.left - drag.dx))); drag.p.y = Math.round(Math.max(8, Math.min(cr.height - drag.el.offsetHeight, e.clientY - cr.top - drag.dy)));
          drag.el.style.left = drag.p.x + 'px'; drag.el.style.top = drag.p.y + 'px'; drawStrings();
        });
        gOn(body, 'pointerup', () => {
          if (!drag || !G) return; const { id, moved, p } = drag; drag = null; G.dragging = false;
          if (moved) { act({ t: 'move', id, x: p.x, y: p.y }); return; }
          if (!G.selPin) G.selPin = id; else if (G.selPin === id) G.selPin = null; else { act({ t: 'tie', a: G.selPin, b: id }); G.selPin = null; return; }
          render();
        });
        gOn(window, 'resize', () => { if (G && G.tab === 'board') drawStrings(); });
      }

      // ---------- tile icon: a magnifying glass over a case folder ----------
      const K = '#050E18', rr = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
      GICONS.casefiles = `<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rr(0, 0, 24, 24, '#0F2338')}${rr(2, 5, 8, 3, K)}${rr(2, 7, 17, 14, K)}${rr(3, 6, 6, 2, '#E9C46A')}${rr(3, 8, 15, 12, '#E9C46A')}${rr(5, 11, 8, 1, '#8A6A2A')}${rr(5, 13, 6, 1, '#8A6A2A')}${rr(5, 15, 7, 1, '#8A6A2A')}
        ${rr(13, 9, 8, 8, K)}${rr(14, 10, 6, 6, '#7DD3FC')}${rr(15, 11, 2, 2, '#F7F4EC')}${rr(19, 16, 2, 2, K)}${rr(20, 17, 3, 3, K)}${rr(21, 18, 1, 1, '#B0362A')}</svg>`;
      const mod = {
        id: 'casefiles', name: 'Case Files', icon: 'casefiles', cats: ['party', 'word'], sub: '1-2 PLAYERS · ~25 MIN', color: '#E9C46A', tone: 'amber', btn: 'amber', flag: 'NEW',
        blurb: 'A co-op detective case: one of you has the crime scene, the other has the records. Pin the evidence and catch the culprit together.',
        rules: { tag: 'DETECTIVE · CO-OP FOR 2', steps: [
          '<strong class="text-bone">Two halves:</strong> Detective A searches the scene and interviews suspects; Detective B reads the records.',
          '<strong class="text-bone">Share:</strong> pin clues to the shared evidence board so your partner can see them, tie them with string, add notes.',
          '<strong class="text-bone">Confront:</strong> some questions only unlock when the right clue is on the board.',
          '<strong class="text-bone">Accuse:</strong> who, how and why, with your 3 best pieces of evidence. Your partner has to agree.',
        ], tip: 'Check every alibi against a record. Whose story does a record prove false?' },
        profileTiles: (s) => [['CASES SOLVED', s.cases || 0, 'text-amber'], ['BEST STARS', (s.stars || 0) + '★', 'text-teal']],
        engine: { get G() { return G; }, cases, act: (a) => act(a), apply: (a) => apply(a) },
        open, close() { G = null; },
        online: { seats: () => 2, min: 2, bots: false, ranked: false, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();
