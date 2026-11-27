// Round 6 prototype mock-ups (5 new games). Injected into the real page by shots.py; not part of the site.
(function () {
  const K = '#050E18';
  const css = `
  .p6{position:fixed;inset:0;z-index:90;overflow:auto;font-family:Outfit,sans-serif;color:#F7F4EC}
  .p6 *{box-sizing:border-box}
  .p6 .bar{position:absolute;top:12px;left:16px;display:flex;gap:8px;align-items:center;z-index:3}
  .p6 .bar b{font-family:'Arcade Pixel';font-weight:400;font-size:20px;background:#12304C;border:3px solid ${K};box-shadow:0 4px 0 ${K};padding:3px 12px;color:#F7F4EC}
  .p6 .bar b.am{background:#F5B041;color:#231505}
  .p6 .pix{font-family:'Arcade Pixel';font-weight:400;letter-spacing:.5px}
  .p6 .panel6{background:#0F2338;border:3px solid ${K};box-shadow:0 6px 0 ${K}}
  .p6 .wb{background:#12304C;border-bottom:3px solid ${K};padding:6px 12px;font-family:'Arcade Pixel';font-size:18px;color:#9DB4CC}
  .p6 .wb.am{background:#F5B041;color:#231505}.p6 .wb.co{background:#FB7185;color:#2A0710}.p6 .wb.te{background:#2DD4BF;color:#06201C}
  .p6 .btn{display:inline-flex;align-items:center;justify-content:center;font-weight:800;border:3px solid ${K};box-shadow:0 5px 0 ${K};padding:10px 22px;font-size:17px;color:#231505;background:#F5B041}
  .p6 .btn.te{background:#2DD4BF;color:#06201C}.p6 .btn.gr{background:#27496B;color:#F7F4EC}.p6 .btn.co{background:#FB7185;color:#2A0710}
  .p6 .tag{display:flex;align-items:center;gap:8px;background:#0B1B2B;border:3px solid ${K};box-shadow:0 4px 0 ${K};padding:5px 10px 5px 6px;min-width:120px}
  .p6 .tag .av{font-size:22px;width:30px;text-align:center}.p6 .tag b{display:block;font-size:14px}.p6 .tag small{display:block;color:#9DB4CC;font-size:12px}
  .p6 .tag.turn{outline:3px solid #F5B041;outline-offset:2px}.p6 .tag.me{border-color:#2DD4BF}
  .p6 .tag .bub{margin-left:auto;background:#F5B041;color:#231505;font-weight:800;font-size:13px;min-width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:2px solid ${K}}
  .p6 .note{font-size:13px;color:#9DB4CC}
  /* CARO */
  .cr-wrap{display:flex;gap:22px;justify-content:center;align-items:center;height:100%;padding:70px 20px 30px}
  .cr-board{display:grid;grid-template-columns:repeat(15,1fr);background:#F7F4EC;border:4px solid ${K};box-shadow:0 7px 0 ${K};width:min(78vh,92vw);aspect-ratio:1}
  .cr-board i{border-right:1px solid #C9C2AE;border-bottom:1px solid #C9C2AE;position:relative;display:flex;align-items:center;justify-content:center}
  .cr-board i svg{width:78%;height:78%}
  .cr-board i.last{background:#FDE7B6}.cr-board i.win{background:#BDF3E7}.cr-board i.hov::after{content:'';position:absolute;inset:18%;border:2px dashed #2DD4BF}
  .cr-side{width:300px;display:flex;flex-direction:column;gap:14px}
  .cr-win{position:absolute;left:50%;top:14px;transform:translateX(-50%);background:#2DD4BF;color:#06201C;border:3px solid ${K};box-shadow:0 5px 0 ${K};padding:6px 20px;font-family:'Arcade Pixel';font-size:24px;z-index:4}
  /* TIEN LEN */
  .tl{background:radial-gradient(ellipse at 50% 45%,#1E7A55 0%,#145C40 55%,#0C3B2A 100%);height:100%;position:relative}
  .tl .oval{position:absolute;left:12%;right:12%;top:16%;bottom:30%;border:3px dashed rgba(247,244,236,.16);border-radius:50%}
  .tl .st6{position:absolute;display:flex;flex-direction:column;align-items:center;gap:6px}
  .tl .fn6{display:flex}.tl .fn6 .pcard{margin-left:-30px}.tl .fn6 .pcard:first-child{margin-left:0}
  .tl .mid{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:10px}
  .tl .mid .cd6{display:flex;gap:6px}
  .tl .cb6{font-family:'Arcade Pixel';font-size:24px;background:${K};color:#F5B041;padding:2px 14px;border:2px solid #F5B041}
  .tl .hd6{position:absolute;left:50%;bottom:110px;transform:translateX(-50%);display:flex}
  .tl .hd6 .pcard{margin-left:-14px;transition:none}.tl .hd6 .pcard:first-child{margin-left:0}.tl .hd6 .pcard.up{transform:translateY(-26px);outline:3px solid #F5B041}
  .tl .ct6{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);display:flex;gap:12px;align-items:center;background:#0F2338;border:3px solid ${K};box-shadow:0 5px 0 ${K};padding:10px 14px 14px}
  .tl .pcard{width:78px;height:110px}.tl .fn6 .pcard{width:44px;height:62px;margin-left:-28px}
  .tl .ps6{font-family:'Arcade Pixel';font-size:16px;background:#27496B;color:#9DB4CC;border:2px solid ${K};padding:0 6px}
  /* WEREWOLF */
  .ww{height:100%;position:relative;overflow:hidden}
  .ww.night{background:linear-gradient(#050E18 0%,#0B1B3A 55%,#14244A 100%)}
  .ww.day{background:linear-gradient(#7CC4E8 0%,#B9E2F2 50%,#E9D9A6 100%)}
  .ww .village{position:absolute;left:0;right:0;bottom:0;height:130px}
  .ww .sg6{position:absolute;inset:70px 24px 150px;display:flex;flex-direction:column;align-items:center;gap:18px}
  .ww .bn6{align-self:center;font-family:'Arcade Pixel';font-size:34px;padding:4px 22px;border:3px solid ${K};box-shadow:0 5px 0 ${K}}
  .ww .rg6{display:grid;grid-template-columns:repeat(5,150px);gap:14px;justify-content:center}
  .ww .pl{background:#0F2338;border:3px solid ${K};box-shadow:0 5px 0 ${K};padding:10px 8px;text-align:center;position:relative}
  .ww .pl .av{font-size:36px;display:block}.ww .pl b{font-size:15px;display:block}.ww .pl small{color:#9DB4CC;font-size:12px}
  .ww .pl.pick{outline:4px solid #FB7185;outline-offset:2px}.ww .pl.dead{opacity:.45;filter:grayscale(1)}
  .ww .pl .vt{position:absolute;top:-12px;right:-10px;background:#FB7185;color:#2A0710;font-weight:800;border:2px solid ${K};min-width:28px;height:28px;display:flex;align-items:center;justify-content:center}
  .ww .pl .claws{position:absolute;top:-12px;left:-10px;background:#050E18;border:2px solid #FB7185;padding:2px 4px;font-size:12px;color:#FB7185;font-weight:800}
  .ww .rl6{position:absolute;right:26px;bottom:26px;width:200px;background:#F7F4EC;color:#231505;border:4px solid ${K};box-shadow:0 6px 0 ${K};text-align:center;padding:10px}
  .ww .rl6 svg{width:120px;height:120px;display:block;margin:0 auto}
  .ww .rl6 .nm{font-family:'Arcade Pixel';font-size:28px;color:#B2213A}
  .ww .tm6{width:420px;height:14px;background:#0B1B2B;border:3px solid ${K}}.ww .tm6 i{display:block;height:100%;width:58%;background:#F5B041}
  .ww .rv6{background:#0F2338;border:3px solid ${K};box-shadow:0 6px 0 ${K};padding:16px 22px;text-align:center;max-width:620px}
  /* TRIVIA */
  .tv{height:100%;background:#0A1A2B;position:relative;background-image:linear-gradient(rgba(45,212,191,.05) 2px,transparent 2px),linear-gradient(90deg,rgba(45,212,191,.05) 2px,transparent 2px);background-size:40px 40px}
  .tv .q{position:absolute;left:50%;top:64px;transform:translateX(-50%);width:min(900px,94vw);display:flex;flex-direction:column;gap:16px}
  .tv .cat{align-self:center;display:flex;align-items:center;gap:8px;font-family:'Arcade Pixel';font-size:20px;padding:2px 14px;border:3px solid ${K};box-shadow:0 4px 0 ${K}}
  .tv .qtext{background:#F7F4EC;color:#0B1B2B;border:4px solid ${K};box-shadow:0 7px 0 ${K};padding:26px 30px;font-size:30px;font-weight:800;text-align:center;line-height:1.2}
  .tv .ans{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .tv .a{display:flex;align-items:center;gap:14px;border:3px solid ${K};box-shadow:0 6px 0 ${K};padding:16px 18px;font-size:21px;font-weight:800;color:#06201C;position:relative}
  .tv .a .k{font-family:'Arcade Pixel';font-size:26px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;background:${K};color:#F7F4EC}
  .tv .a .who{margin-left:auto;display:flex;gap:2px;font-size:20px}
  .tv .a.ok{outline:5px solid #34D399;outline-offset:3px}.tv .a.dim{opacity:.35}
  .tv .scores{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);display:flex;gap:10px}
  .tv .tbar{height:16px;background:#0B1B2B;border:3px solid ${K}}.tv .tbar i{display:block;height:100%;background:#F5B041;width:40%}
  .tv .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .tv .cg{border:3px solid ${K};box-shadow:0 5px 0 ${K};padding:14px 10px;text-align:center;font-weight:800;color:#0B1B2B}
  .tv .cg svg{width:48px;height:48px;display:block;margin:0 auto 6px}.tv .cg small{display:block;font-weight:600;font-size:12px;opacity:.75}
  .tv .cg.off{opacity:.35;filter:grayscale(.6)}
  .tv .plus{position:absolute;top:-16px;right:10px;background:#34D399;color:#06201C;font-weight:800;border:2px solid ${K};padding:0 8px;font-size:15px}
  /* FUNNY ANSWERS */
  .fa{height:100%;background:#0B1B2B;position:relative;background-image:repeating-linear-gradient(45deg,rgba(245,176,65,.06) 0 18px,transparent 18px 36px)}
  .fa .sg6{position:absolute;left:50%;top:60px;transform:translateX(-50%);width:min(1000px,94vw);display:flex;flex-direction:column;align-items:center;gap:20px}
  .fa .prompt{background:#F5B041;color:#231505;border:4px solid ${K};box-shadow:0 7px 0 ${K};padding:20px 28px;font-size:28px;font-weight:800;text-align:center;line-height:1.25;width:100%}
  .fa .vs{display:grid;grid-template-columns:1fr auto 1fr;gap:18px;align-items:center;width:100%}
  .fa .ansc{background:#F7F4EC;color:#0B1B2B;border:4px solid ${K};box-shadow:0 7px 0 ${K};padding:24px 20px;font-size:24px;font-weight:800;text-align:center;min-height:150px;display:flex;flex-direction:column;justify-content:center;position:relative}
  .fa .ansc.win{outline:5px solid #34D399;outline-offset:4px}
  .fa .ansc .by{font-size:14px;color:#5C7A99;margin-top:10px;font-weight:700}
  .fa .ansc .pc{position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-family:'Arcade Pixel';font-size:30px;background:${K};color:#F5B041;padding:0 12px}
  .fa .ansc .vts{display:flex;justify-content:center;gap:2px;margin-top:8px;font-size:22px}
  .fa .vsb{font-family:'Arcade Pixel';font-size:40px;color:#FB7185;text-shadow:3px 3px 0 ${K}}
  .fa .sweep{font-family:'Arcade Pixel';font-size:36px;background:#FB7185;color:#2A0710;border:4px solid ${K};box-shadow:0 6px 0 ${K};padding:2px 24px;transform:rotate(-3deg)}
  .fa .typebox{width:100%;background:#0B1B2B;border:3px solid #27496B;padding:16px;font-size:22px;color:#F7F4EC;min-height:64px}
  .fa .wait{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
  .fa .wait .tag.done::after{content:'✓';margin-left:6px;color:#34D399;font-weight:800}
  .p6 .cap{position:absolute;left:16px;bottom:12px;font-size:13px;color:#9DB4CC;background:rgba(5,14,24,.7);padding:4px 8px;z-index:5}
  @media (max-width:640px){
    .p6 .bar{top:8px;left:8px;gap:5px}.p6 .bar b{font-size:13px;padding:1px 7px;box-shadow:0 3px 0 ${K};border-width:2px;white-space:nowrap}
    .cr-side .panel6{display:none}.cr-side .tag{min-width:0}
    .tl .st6{top:52px!important;transform:none!important}.tl .st6:nth-of-type(2){left:2%!important}.tl .st6:nth-of-type(3){left:35%!important}.tl .st6:nth-of-type(4){left:auto!important;right:2%!important}
    .tl .st6 .tag{min-width:0;padding:3px 6px}.tl .st6 .tag small{display:none}.tl .oval{display:none}
    .ww .moon6{width:44px!important;right:6px!important;top:44px!important;opacity:.7}
    .ww .rl6{display:flex;align-items:center;gap:8px;width:92%!important;text-align:left}.ww .rl6 .pix{display:none}.ww .rl6 svg{width:54px!important;height:54px!important;margin:0}
    .ww .sg6{bottom:110px!important}.ww .sg6>.note{font-size:13px!important}
    .fa .sg6,.tv .q{top:52px}.tv .q{gap:10px}
    .cr-wrap{flex-direction:column;padding:60px 10px 16px;gap:12px;justify-content:flex-start}.cr-side{width:100%;flex-direction:row;flex-wrap:wrap}.cr-side>*{flex:1}
    .tl .pcard{width:44px;height:62px}.tl .hd6{bottom:150px}.tl .hd6 .pcard{margin-left:-17px}.tl .fn6 .pcard{width:28px;height:40px;margin-left:-20px}.tl .ct6{flex-wrap:wrap;width:94%;justify-content:center}.tl .ct6 .note{display:none}.tl .mid{top:44%}
    .tl .ct6{padding:8px 10px 12px}.tl .cb6{font-size:18px}
    .ww .rg6{grid-template-columns:repeat(3,1fr);gap:10px;width:100%}.ww .pl .av{font-size:26px}.ww .bn6{align-self:center;font-size:22px}
    .ww .sg6{inset:60px 10px 210px}.ww .rl6{right:auto;left:50%;transform:translateX(-50%);bottom:12px;width:170px;padding:6px}.ww .rl6 svg{width:70px;height:70px}.ww .rl6 .nm{font-size:20px}.ww .tm6{width:100%}
    .tv .qtext{font-size:21px;padding:16px}.tv .ans{grid-template-columns:1fr}.tv .a{font-size:17px;padding:11px 12px}.tv .grid{grid-template-columns:repeat(2,1fr)}
    .tv .scores{flex-wrap:wrap;justify-content:center;width:100%;bottom:10px}.tv .scores .tag{min-width:0}
    .fa .prompt{font-size:20px;padding:14px}.fa .vs{grid-template-columns:1fr;gap:10px}.fa .vsb{text-align:center;font-size:28px}.fa .ansc{min-height:90px;font-size:19px;padding:20px 14px}
  }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // tiny pixel-art helper: rows of characters -> SVG rectangles
  function px(rows, pal, w) {
    const h = rows.length, ww = w || rows[0].length; let r = '';
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[ch]}"/>`; }));
    return `<svg viewBox="0 0 ${ww} ${h}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${r}</svg>`;
  }
  const X = px(['k......k', 'kt....tk', '.kt..tk.', '..ktkk..', '..kktk..', '.kt..tk.', 'kt....tk', 'k......k'].map((r) => r), { k: '#0E7C70', t: '#2DD4BF' });
  const O = px(['..kkkk..', '.kcccck.', 'kcc..cck', 'kc....ck', 'kc....ck', 'kcc..cck', '.kcccck.', '..kkkk..'], { k: '#B2213A', c: '#FB7185' });
  const WOLF = px([
    '..k..........k..',
    '.kgk........kgk.',
    '.kggk......kggk.',
    '.kgggkkkkkkgggk.',
    '.kggggggggggggk.',
    'kgggggggggggggk.',
    'kggyykggggkyyggk',
    'kggykkggggkkyggk',
    'kgggggggggggggk.',
    '.kggggwwwwggggk.',
    '.kgggwwwwwwgggk.',
    '..kggwwkkwwggk..',
    '..kgwwwrrwwwgk..',
    '...kwwwwwwwwk...',
    '....kkwwwwkk....',
    '......kkkk......'], { k: '#050E18', g: '#5C6E86', y: '#F5B041', w: '#C9D6E3', r: '#FB7185' });
  const MOON = '<svg viewBox="0 0 20 20"><path d="M13 1A9 9 0 1 0 19 14A7.5 7.5 0 1 1 13 1Z" fill="#F7F4EC"/></svg>';
  const house = (x, c, r) => `<g transform="translate(${x},0)"><rect x="0" y="14" width="22" height="16" fill="${c}"/><polygon points="-3,15 11,3 25,15" fill="${r}"/><rect x="8" y="21" width="6" height="9" fill="#050E18"/><rect x="2" y="17" width="4" height="4" fill="#F5B041"/><rect x="16" y="17" width="4" height="4" fill="#F5B041"/></g>`;
  const village = (night) => `<svg class="village" viewBox="0 0 300 30" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges"><rect y="26" width="300" height="4" fill="${night ? '#0B1B2B' : '#5E8C3A'}"/>${[10, 48, 90, 140, 182, 226, 268].map((x, i) => house(x, night ? ['#1A2B45', '#203352'][i % 2] : ['#D08A4E', '#C9D6E3'][i % 2], night ? '#0F1C30' : '#B2213A')).join('')}</svg>`;
  const stars = () => Array.from({ length: 40 }, (_, i) => `<i style="position:absolute;left:${(i * 37) % 100}%;top:${(i * 53) % 45}%;width:${i % 3 ? 2 : 3}px;height:${i % 3 ? 2 : 3}px;background:#F7F4EC;opacity:${0.4 + (i % 5) / 8}"></i>`).join('');

  const tag = (o) => `<div class="tag ${o.turn ? 'turn' : ''} ${o.me ? 'me' : ''} ${o.cls || ''}"><span class="av">${o.av}</span><span><b>${o.name}</b>${o.sub ? `<small>${o.sub}</small>` : ''}</span>${o.badge !== undefined ? `<span class="bub">${o.badge}</span>` : ''}</div>`;
  const card = (r, s, cls) => playingCardHTML({ r, s }, { cls: cls || '' });
  const back = () => playingCardHTML(null, { down: true });
  const bar = (t, extra) => `<div class="bar"><b>← Lobby</b><b class="am">${t}</b>${extra || ''}<b>⚙</b><b>?</b><b>♪</b></div>`;
  let el = null;
  function show(html, cls) { clear(); el = document.createElement('div'); el.className = 'p6 ' + (cls || ''); el.innerHTML = html; document.body.appendChild(el); return el; }
  function clear() { if (el) el.remove(); el = null; }

  // ---------- CARO ----------
  function caro(win) {
    const B = {}; const put = (r, c, v) => { B[r + ',' + c] = v; };
    [[7, 7, 'x'], [7, 8, 'o'], [6, 8, 'x'], [8, 6, 'o'], [5, 9, 'x'], [8, 8, 'o'], [4, 10, 'x'], [3, 11, 'o'], [8, 7, 'x'], [9, 6, 'o'], [6, 6, 'x'], [8, 9, 'o'], [8, 10, 'x'], [5, 7, 'o'], [9, 9, 'x'], [10, 5, 'o']].forEach(([r, c, v]) => put(r, c, v));
    const winSet = win ? new Set(['8,6', '8,7', '8,8', '8,9', '8,10'].map(String)) : new Set();
    if (win) { put(8, 7, 'o'); put(8, 10, 'o'); put(7, 9, 'x'); }
    let cells = '';
    for (let r = 0; r < 15; r++) for (let c = 0; c < 15; c++) {
      const v = B[r + ',' + c], k = r + ',' + c;
      const cl = [win && winSet.has(k) ? 'win' : '', !win && k === '10,5' ? 'last' : '', !win && k === '7,9' ? 'hov' : ''].join(' ');
      cells += `<i class="${cl}">${v === 'x' ? X : v === 'o' ? O : ''}</i>`;
    }
    show(`${bar('CARO')}${win ? '<div class="cr-win">LUNA WINS: FIVE IN A ROW!</div>' : ''}
      <div class="cr-wrap"><div class="cr-board">${cells}</div>
      <div class="cr-side">
        ${tag({ av: '🦊', name: 'You', sub: 'X · 0:42 left', me: true, turn: !win })}
        ${tag({ av: '🦉', name: 'Luna', sub: 'O · 1:10 left', turn: win })}
        <div class="panel6"><div class="wb">HOW TO WIN</div><div style="padding:10px 12px" class="note">Get <b style="color:#F7F4EC">five in a row</b> across, down or diagonally. Block the other player when they have four!</div></div>
        <div class="panel6"><div class="wb">SETTINGS</div><div style="padding:10px 12px" class="note">Board 15 × 15 · Exactly 5 or more · Blocked ends (Vietnamese rule): <b style="color:#F7F4EC">On</b> · Best of 3 · Computer: Easy / Medium / Hard</div></div>
      </div></div>`, '');
    el.style.background = '#0A1A2B';
  }

  // ---------- TIEN LEN ----------
  function tienlen(bomb) {
    const opp = (pos, o) => `<div class="st6" style="${pos}">${o.cards ? `<div class="fn6">${Array.from({ length: Math.min(o.cards, 8) }, back).join('')}</div>` : ''}${tag(o)}${o.passed ? '<span class="ps6">PASSED</span>' : ''}</div>`;
    const hand = bomb ? [[3, 's'], [5, 'c'], [6, 'd'], [9, 's'], [9, 'c'], [9, 'd'], [9, 'h'], [12, 'd'], [13, 'h']]
      : [[3, 's'], [3, 'h'], [5, 'c'], [6, 'd'], [7, 'h'], [9, 's'], [10, 's'], [10, 'h'], [11, 'c'], [12, 'd'], [13, 'h'], [14, 'c'], [2, 'h']];
    const up = bomb ? [3, 4, 5, 6] : [];
    const mid = bomb
      ? `<div class="cd6">${card(2, 's')}</div><span class="cb6">TWO OF SPADES</span><span class="note" style="color:#F7F4EC;background:rgba(5,14,24,.6);padding:4px 10px">Luna played a 2, the highest card. Only a bomb can beat it!</span>`
      : `<div class="cd6">${card(4, 'd')}${card(5, 's')}${card(6, 'h')}${card(7, 'c')}${card(8, 'd')}</div><span class="cb6">STRAIGHT 4 → 8</span>`;
    show(`${bar('TIẾN LÊN')}<div class="tl"><div class="oval"></div>
      ${opp('left:3%;top:34%', { av: '🐻', name: 'Bao', sub: '9 cards', badge: 9, cards: 9, passed: bomb })}
      ${opp('left:50%;top:6%;transform:translateX(-50%)', { av: '🦉', name: 'Luna', sub: '6 cards', badge: 6, cards: 6, turn: false })}
      ${opp('right:3%;top:34%', { av: '🐸', name: 'Minh', sub: '11 cards', badge: 11, cards: 11, passed: !bomb })}
      <div class="mid">${mid}</div>
      <div class="hd6">${hand.map(([r, s], i) => card(r, s, up.includes(i) ? 'up' : '')).join('')}</div>
      <div class="ct6">${tag({ av: '🦊', name: 'You', sub: (bomb ? 9 : 13) + ' cards', me: true, turn: true })}
        <span class="btn${bomb ? ' co' : ''}">${bomb ? '💣 BOMB! PLAY FOUR 9s' : '▶ PLAY'}</span><span class="btn gr">PASS</span><span class="btn gr" style="font-size:14px">SORT</span>
        <span class="note" style="max-width:220px">${bomb ? 'Four of a kind beats a 2! Luna gets a penalty.' : 'Tap cards to pick them. Beat the straight with a higher one of 5 cards (5 → 9 or better), or pass.'}</span></div>
    </div>`);
  }

  // ---------- WEREWOLF ----------
  const P = [['🦊', 'You'], ['🦉', 'Luna'], ['🐻', 'Bao'], ['🐸', 'Minh'], ['🦈', 'Kai'], ['🐼', 'Mai'], ['🦁', 'Leo'], ['🐙', 'Ivy'], ['🦖', 'Rex'], ['🚀', 'Zoe']];
  function wwNight() {
    const ring = P.map(([a, n], i) => `<div class="pl ${i === 5 ? 'pick' : ''} ${i === 8 ? 'dead' : ''}">${i === 5 ? '<span class="claws">🐺 2</span>' : ''}<span class="av">${a}</span><b>${n}</b><small>${i === 0 ? 'you · wolf' : i === 3 ? 'wolf (your pack)' : i === 8 ? 'out · Seer' : 'tap to choose'}</small></div>`).join('');
    show(`${bar('WEREWOLF', '<b>NIGHT 2</b>')}<div class="ww night">${stars()}<div class="moon6" style="position:absolute;right:12%;top:12%;width:90px">${MOON}</div>
      <div class="sg6"><span class="bn6" style="background:#14244A;color:#FB7185">🌙 THE WOLVES ARE HUNTING</span>
      <span class="note" style="color:#C9D6E3;font-size:16px">Everyone else is asleep. Agree with your pack: who do you take tonight?</span>
      <div class="tm6"><i></i></div><div class="rg6">${ring}</div></div>
      ${village(true)}
      <div class="rl6"><div class="pix" style="font-size:15px;color:#5C7A99">YOUR SECRET ROLE</div>${WOLF}<div class="nm">WEREWOLF</div><div style="font-size:12px">Each night, pick someone with your pack. In the day, act innocent!</div></div></div>`);
  }
  function wwDay() {
    const votes = { 2: 1, 5: 4, 3: 2 };
    const ring = P.map(([a, n], i) => `<div class="pl ${i === 5 ? 'pick' : ''} ${i === 8 || i === 6 ? 'dead' : ''}">${votes[i] ? `<span class="vt">${votes[i]}</span>` : ''}<span class="av">${a}</span><b>${n}</b><small>${i === 8 ? 'out · Seer' : i === 6 ? 'out last night' : i === 0 ? 'you' : 'vote'}</small></div>`).join('');
    show(`${bar('WEREWOLF', '<b>DAY 3</b>')}<div class="ww day">
      <div class="sg6"><span class="bn6" style="background:#F5B041;color:#231505">☀ VILLAGE VOTE</span>
      <div class="rv6" style="max-width:720px"><b style="font-size:19px">Leo was found this morning. He was the <span style="color:#2DD4BF">DOCTOR</span>.</b><div class="note" style="margin-top:6px">Talk it over in the chat, then vote for who you think is a wolf. Most votes is out. 0:48 left.</div></div>
      <div class="rg6">${ring}</div></div>
      ${village(false)}
      <div class="panel6" style="position:absolute;left:24px;bottom:24px;width:330px"><div class="wb">CHAT</div><div style="padding:8px 12px;font-size:14px;line-height:1.5">
        <div><b style="color:#F5B041">Mai:</b> it's NOT me, Bao is too quiet</div><div><b style="color:#2DD4BF">Bao:</b> Mai voted for Rex yesterday, sus</div><div><b style="color:#FB7185">Kai:</b> I'm voting Mai 👀</div></div></div>
      <div class="rl6" style="width:180px"><div class="pix" style="font-size:14px;color:#5C7A99">YOUR SECRET ROLE</div>${WOLF}<div class="nm" style="font-size:24px">WEREWOLF</div></div></div>`);
  }
  function wwRoles() {
    const R = [['🐺', 'Werewolf', 'Each night the wolves pick someone. Win when wolves are as many as villagers.', '#FB7185'], ['🔮', 'Seer', 'Each night, look at one player\'s card: wolf or not?', '#2DD4BF'], ['💉', 'Doctor', 'Each night, protect one player (yourself once).', '#34D399'], ['🏹', 'Hunter', 'If you go out, take someone with you.', '#F5B041'], ['🧪', 'Witch', 'One save potion and one poison, once each.', '#F4A261'], ['🙂', 'Villager', 'No power: listen, argue and vote the wolves out!', '#C9D6E3']];
    show(`${bar('WEREWOLF')}<div class="ww night">${stars()}<div class="sg6" style="inset:70px 24px 40px">
      <span class="bn6" style="background:#14244A;color:#F5B041">ROOM SETTINGS · ROLES</span>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:1000px">${R.map(([i, n, d, c], k) => `<div class="pl" style="text-align:left;display:flex;gap:12px;align-items:flex-start;border-color:${c}"><span style="font-size:40px">${i}</span><div><b style="font-size:18px;color:${c}">${n}</b><div style="font-size:13px;color:#C9D6E3;margin-top:2px">${d}</div><div class="pix" style="margin-top:6px;color:#9DB4CC">${['2 wolves', 'On', 'On', 'Off', 'Off', '5 villagers'][k]}</div></div></div>`).join('')}</div>
      <div class="note" style="color:#C9D6E3;font-size:15px">6–12 players · Night 40 s · Day talk 2 min · A friendly game host voice says what happens ("The village wakes up…") · Computer players can fill empty seats</div>
    </div></div>`);
  }

  // ---------- TRIVIA ----------
  const CATS = [['🌎', 'Geography', '#2DD4BF'], ['🎬', 'Movies & TV', '#FB7185'], ['🎵', 'Music', '#F5B041'], ['⚽', 'Sports', '#34D399'], ['🔬', 'Science', '#7DD3FC'], ['🏛', 'History', '#E9C46A'], ['🍜', 'Food', '#F4A261'], ['🐾', 'Animals', '#A3E635'], ['🎮', 'Games', '#F4A261'], ['🇻🇳', 'Vietnam', '#FB7185'], ['🇺🇸', 'USA', '#7DD3FC'], ['🤯', 'Weird Facts', '#F5B041']];
  function tvCats() {
    show(`${bar('TRIVIA RUSH')}<div class="tv"><div class="q" style="top:70px">
      <span class="cat" style="background:#F5B041;color:#231505">ROOM SETTINGS · CATEGORIES</span>
      <div class="grid">${CATS.map(([i, n, c], k) => `<div class="cg ${k === 8 ? 'off' : ''}" style="background:${c}"><span style="font-size:36px;display:block">${i}</span>${n}<small>${[310, 280, 240, 260, 300, 270, 200, 220, 180, 220, 230, 250][k]} questions</small></div>`).join('')}</div>
      <div class="panel6" style="padding:12px 16px" ><span class="note">QUESTIONS <b style="color:#F7F4EC">10 / 15 / 20</b> · TIME <b style="color:#F7F4EC">10 s / 15 s / 20 s</b> · DIFFICULTY <b style="color:#F7F4EC">Mixed / Easy / Hard</b> · Faster right answers score more (up to 1000) · 3 in a row = 🔥 streak bonus</span></div>
    </div></div>`);
  }
  function tvQ(reveal) {
    const A = [['A', 'Australia', '#2DD4BF'], ['B', 'Canada', '#F5B041'], ['C', 'Russia', '#FB7185'], ['D', 'Finland', '#34D399']];
    const who = { 1: '🦉🐸', 3: '🦊🐻🦈', 0: '🐼' };
    show(`${bar('TRIVIA RUSH', '<b>Q 7 / 15</b>')}<div class="tv"><div class="q">
      <span class="cat" style="background:#2DD4BF;color:#06201C">🌎 GEOGRAPHY · MEDIUM</span>
      <div class="qtext">Which country has the most lakes in the world?</div>
      <div class="tbar"><i style="width:${reveal ? 0 : 46}%"></i></div>
      <div class="ans">${A.map(([k, t, c], i) => `<div class="a ${reveal ? (i === 1 ? 'ok' : 'dim') : ''}" style="background:${c}"><span class="k">${k}</span>${t}${reveal && who[i] ? `<span class="who">${who[i]}</span>` : ''}${reveal && i === 1 ? '<span class="plus">+820</span>' : ''}</div>`).join('')}</div>
      ${reveal ? '<div class="panel6" style="padding:10px 16px;font-size:15px"><b style="color:#F5B041">Did you know?</b> Canada has over 2 million lakes, more than every other country put together.</div>' : ''}
      </div>
      <div class="scores">${[['🦉', 'Luna', 5210, 1], ['🦊', 'You', 4870, 0, 1], ['🐸', 'Minh', 4400], ['🐻', 'Bao', 3920], ['🦈', 'Kai', 3100], ['🐼', 'Mai', 2650]].map(([a, n, s, t, me]) => tag({ av: a, name: n, sub: (reveal && (n === 'Luna' || n === 'Minh') ? s + 820 : s) + ' pts' + (n === 'Luna' ? ' 🔥3' : ''), me })).join('')}</div>
    </div>`);
  }

  // ---------- FUNNY ANSWERS ----------
  function faType() {
    show(`${bar('FUNNY ANSWERS', '<b>ROUND 1</b>')}<div class="fa"><div class="sg6">
      <span class="pix" style="font-size:20px;color:#9DB4CC">PROMPT 1 OF 2 · 0:52 LEFT</span>
      <div class="prompt">A terrible name for a pet goldfish</div>
      <div class="typebox">Lunch|</div>
      <span class="btn">SEND ANSWER</span>
      <span class="note">Only you and one other player get this prompt. Everyone else will vote on the funniest.</span>
      <div class="wait">${P.slice(1, 7).map(([a, n], i) => tag({ av: a, name: n, sub: i < 4 ? 'done' : 'typing…', cls: i < 4 ? 'done' : '' })).join('')}</div>
    </div></div>`);
  }
  function faVote(res) {
    show(`${bar('FUNNY ANSWERS', '<b>ROUND 2 · ×2 POINTS</b>')}<div class="fa"><div class="sg6">
      <div class="prompt">The worst thing to hear your pilot say over the speaker</div>
      <div class="vs">
        <div class="ansc ${res ? 'win' : ''}">${res ? '<span class="pc">100%</span>' : ''}"Okay, which one of these buttons is the brakes?"${res ? '<div class="by">🦉 Luna · +2000 + SWEEP BONUS</div><div class="vts">🦊🐻🐸🦈🐼</div>' : ''}</div>
        <span class="vsb">VS</span>
        <div class="ansc">${res ? '<span class="pc">0%</span>' : ''}"Has anyone seen my glasses?"${res ? '<div class="by">🦁 Leo · 0</div>' : ''}</div>
      </div>
      ${res ? '<span class="sweep">CLEAN SWEEP!</span>' : '<span class="btn te">TAP THE FUNNIER ONE</span><span class="note">Names stay hidden until the votes are in.</span>'}
    </div></div>`);
  }
  function faLast() {
    show(`${bar('FUNNY ANSWERS', '<b>FINAL ROUND</b>')}<div class="fa"><div class="sg6">
      <span class="bn6 pix" style="font-size:26px;background:#FB7185;color:#2A0710;border:3px solid ${K};padding:2px 18px;box-shadow:0 5px 0 ${K}">FINAL ROUND: EVERYONE ANSWERS</span>
      <div class="prompt">Make up a new holiday. What do people do on it?</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;width:100%">${['"National Nap Day: the whole country lies down at 2 pm"', '"Reverse Halloween: you give candy to kids who did NOT dress up"', '"Free Grandma Day: borrow anyone\'s grandma for soup"', '"Mute Monday: everyone talks only in emojis"', '"Pancake Throwing Day"', '"Say It Backwards Day: yad doog a evah"'].map((t, i) => `<div class="ansc" style="min-height:96px;font-size:17px;padding:14px">${t}<div class="vts" style="font-size:14px;color:#5C7A99">${['🥇 3 votes', '', '🥈 2 votes', '', '', '🥉 1 vote'][i]}</div></div>`).join('')}</div>
      <span class="note">Pick your top 3 (gold, silver, bronze). Points ×3!</span>
    </div></div>`);
  }

  window.P6 = { clear, caro, tienlen, wwNight, wwDay, wwRoles, tvCats, tvQ, faType, faVote, faLast };
})();
