// Round 6 prototype mock-ups, v2 (5 new games). Injected into the real page by shots.py; not part of the site.
// Layout: a slim game bar top-left (like the real games), everything else centred in the space below it.
(function () {
  const K = '#050E18';
  const css = `
  .p6{position:fixed;inset:0;z-index:90;background:#0A1A2B;overflow:hidden;font-family:Outfit,sans-serif;color:#F7F4EC;display:flex;flex-direction:column}
  .p6 *{box-sizing:border-box}
  .p6 .gbar{flex:none;display:flex;gap:8px;align-items:center;padding:12px 16px 0;position:relative;z-index:5}
  .p6 .gbar b{font-family:'Arcade Pixel';font-weight:400;font-size:19px;background:#12304C;border:3px solid ${K};box-shadow:0 4px 0 ${K};padding:2px 11px;color:#F7F4EC;white-space:nowrap}
  .p6 .gbar b.am{background:#F5B041;color:#231505}.p6 .gbar b.info{background:#0B1B2B;color:#9DB4CC}
  .p6 .body > :not(.tl):not(.ww):not(.tv):not(.fa){position:relative;z-index:1}
  .p6 .body{flex:1;min-height:0;position:static;display:flex;align-items:center;justify-content:center;padding:14px 24px 24px}
  .p6 .pix{font-family:'Arcade Pixel';font-weight:400}
  .p6 .pnl{background:#0F2338;border:3px solid ${K};box-shadow:0 6px 0 ${K}}
  .p6 .wb{background:#12304C;border-bottom:3px solid ${K};padding:5px 12px;font-family:'Arcade Pixel';font-size:18px;color:#9DB4CC}
  .p6 .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:800;border:3px solid ${K};box-shadow:0 5px 0 ${K};padding:10px 22px;font-size:17px;color:#231505;background:#F5B041;white-space:nowrap}
  .p6 .btn.te{background:#2DD4BF;color:#06201C}.p6 .btn.gr{background:#27496B;color:#F7F4EC}.p6 .btn.co{background:#FB7185;color:#2A0710}
  .p6 .tag{display:flex;align-items:center;gap:8px;background:#0B1B2B;border:3px solid ${K};box-shadow:0 4px 0 ${K};padding:5px 10px 5px 6px}
  .p6 .tag .av{font-size:22px;width:30px;text-align:center}.p6 .tag b{display:block;font-size:14px;line-height:1.2}.p6 .tag small{display:block;color:#9DB4CC;font-size:12px}
  .p6 .tag.turn{outline:3px solid #F5B041;outline-offset:2px}.p6 .tag.me{border-color:#2DD4BF}
  .p6 .tag .bub{margin-left:auto;background:#F5B041;color:#231505;font-weight:800;font-size:13px;min-width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:2px solid ${K}}
  .p6 .note{font-size:14px;color:#9DB4CC;line-height:1.45}
  .p6 .ico{display:inline-block;width:1em;height:1em;vertical-align:-0.15em}.p6 .ico svg{width:100%;height:100%;display:block}
  /* settings rows (room) */
  .p6 .sets{display:grid;gap:10px}
  .p6 .srow{display:grid;grid-template-columns:170px 1fr;align-items:center;gap:12px}
  .p6 .srow>span{font-family:'Arcade Pixel';font-size:17px;color:#9DB4CC}
  .p6 .chs{display:flex;gap:8px;flex-wrap:wrap}.p6 .ch{border:3px solid ${K};background:#12304C;padding:6px 14px;font-weight:800;font-size:15px;box-shadow:0 3px 0 ${K};display:flex;align-items:center;gap:8px}
  .p6 .ch.on{background:#F5B041;color:#231505}
  .p6 .hero{border:3px solid #F5B041;background:rgba(245,176,65,.08);padding:12px 14px}.p6 .hero .ch{font-size:18px;padding:9px 18px}.p6 .hero .ch .ico{font-size:24px}
  /* CARO */
  .cr{display:flex;gap:26px;align-items:center}
  .cr-board{display:grid;grid-template-columns:repeat(15,1fr);background:#F7F4EC;border:4px solid ${K};box-shadow:0 7px 0 ${K};width:min(calc(100vh - 120px),92vw);aspect-ratio:1}
  .cr-board i{border-right:1px solid #CFC8B4;border-bottom:1px solid #CFC8B4;position:relative;display:flex;align-items:center;justify-content:center}
  .cr-board i svg{width:74%;height:74%}
  .cr-board i.last{background:#FDE7B6}.cr-board i.win{background:#9FEBDB}.cr-board i.hov::after{content:'';position:absolute;inset:16%;border:2px dashed #0E7C70}
  .cr-side{width:300px;display:flex;flex-direction:column;gap:14px}
  .cr-banner{position:absolute;left:50%;top:6px;transform:translateX(-50%);background:#FB7185;color:#2A0710;border:3px solid ${K};box-shadow:0 5px 0 ${K};padding:4px 22px;font-family:'Arcade Pixel';font-size:24px;z-index:4;white-space:nowrap}
  /* THIRTEEN */
  .tl{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 48%,#1E7A55 0%,#145C40 55%,#0C3B2A 100%)}
  .tl-grid{position:absolute;inset:64px 20px 20px;display:grid;grid-template-columns:1fr 2.4fr 1fr;grid-template-rows:auto 1fr auto;gap:10px}
  .tl-seat{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
  .tl-fan{display:flex}.tl-fan .pcard{width:40px;height:56px;margin-left:-28px}.tl-fan .pcard:first-child{margin-left:0}
  .tl-mid{grid-column:2;grid-row:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
  .tl-cards{display:flex;gap:8px}.tl-cards .pcard{width:84px;height:118px}
  .tl-combo{font-family:'Arcade Pixel';font-size:24px;background:${K};color:#F5B041;padding:2px 14px;border:2px solid #F5B041}
  .tl-msg{background:rgba(5,14,24,.7);padding:5px 12px;font-size:15px}
  .tl-me{grid-column:1/4;display:flex;flex-direction:column;align-items:center;gap:12px}
  .tl-hand{display:flex;padding-top:26px}.tl-hand .pcard{width:84px;height:118px;margin-left:-26px}.tl-hand .pcard:first-child{margin-left:0}
  .tl-hand .pcard.up{transform:translateY(-24px);outline:3px solid #F5B041}
  .tl-ctl{display:flex;gap:12px;align-items:center;background:#0F2338;border:3px solid ${K};box-shadow:0 5px 0 ${K};padding:10px 14px 14px}
  .tl-out{font-family:'Arcade Pixel';font-size:16px;background:#27496B;color:#C9D6E3;border:2px solid ${K};padding:0 8px}
  /* WEREWOLF */
  .ww{position:absolute;inset:0;overflow:hidden}
  .ww.night{background:linear-gradient(#050E18 0%,#0B1B3A 60%,#14244A 100%)}
  .ww.day{background:linear-gradient(#6FB7E0 0%,#A9DAF0 55%,#E4D9A8 100%)}
  .ww .vil{position:absolute;left:0;right:0;bottom:0;width:100%;height:auto;display:block}
  .ww .sky{position:absolute;inset:0}
  .ww .col{position:absolute;inset:64px 24px 24px;display:flex;flex-direction:column;align-items:center;gap:16px}
  .ww .head{font-family:'Arcade Pixel';font-size:32px;padding:3px 22px;border:3px solid ${K};box-shadow:0 5px 0 ${K};display:flex;align-items:center;gap:12px}
  .ww .head .ico{font-size:30px}
  .ww .grid10{display:grid;grid-template-columns:repeat(5,170px);gap:18px}
  .ww .pl{background:#0F2338;border:3px solid ${K};box-shadow:0 5px 0 ${K};padding:14px 8px;text-align:center;position:relative}
  .ww .pl .av{font-size:40px;display:block;line-height:1.2}.ww .pl b{font-size:15px;display:block}.ww .pl small{color:#9DB4CC;font-size:12px}
  .ww .pl.pick{outline:4px solid #FB7185;outline-offset:2px}.ww .pl.dead{opacity:.5;filter:grayscale(1)}.ww .pl.dead small{color:#C9D6E3}
  .ww .pl.mate{border-color:#FB7185}
  .ww .pl .vt{position:absolute;top:-13px;right:-11px;background:#FB7185;color:#2A0710;font-weight:800;border:2px solid ${K};min-width:28px;height:28px;display:flex;align-items:center;justify-content:center}
  .ww .pl .claw{position:absolute;top:-13px;left:-11px;background:${K};border:2px solid #FB7185;padding:1px 6px;font-size:13px;color:#FB7185;font-weight:800;display:flex;gap:4px;align-items:center}
  .ww .card{position:absolute;right:24px;bottom:24px;width:190px;background:#F7F4EC;color:#231505;border:4px solid ${K};box-shadow:0 6px 0 ${K};text-align:center;padding:10px;z-index:3}
  .ww .card svg{width:110px;height:110px;display:block;margin:4px auto}
  .ww .card .nm{font-family:'Arcade Pixel';font-size:28px;color:#B2213A;line-height:1}
  .ww .tbar{width:420px;height:14px;background:#0B1B2B;border:3px solid ${K}}.ww .tbar i{display:block;height:100%;width:58%;background:#F5B041}
  .ww .news{background:#0F2338;border:3px solid ${K};box-shadow:0 6px 0 ${K};padding:12px 22px;text-align:center}
  .ww .chat{position:absolute;left:24px;bottom:24px;width:340px;z-index:3}
  .ww .roles{display:grid;grid-template-columns:repeat(3,330px);gap:14px}
  .ww .role{background:#0F2338;border:3px solid ${K};box-shadow:0 5px 0 ${K};padding:12px;display:flex;gap:14px;align-items:flex-start}
  .ww .role .ri{width:60px;height:60px;flex:none;background:#0B1B2B;border:2px solid ${K};padding:6px}.ww .role .ri svg{width:100%;height:100%}
  .ww .role b{font-size:18px;display:block}.ww .role p{font-size:13px;color:#C9D6E3;margin:2px 0 6px;line-height:1.35}
  .ww .role .ct{display:flex;align-items:center;gap:6px}.ww .role .ct i{font-style:normal;width:26px;height:26px;border:2px solid ${K};background:#27496B;display:flex;align-items:center;justify-content:center;font-weight:800}
  .ww .role .ct span{font-weight:800;min-width:20px;text-align:center}
  /* TRIVIA */
  .tv{position:absolute;inset:0;background:#0A1A2B;background-image:linear-gradient(rgba(45,212,191,.05) 2px,transparent 2px),linear-gradient(90deg,rgba(45,212,191,.05) 2px,transparent 2px);background-size:40px 40px}
  .tv-col{width:min(940px,100%);display:flex;flex-direction:column;gap:16px}
  .tv-cat{align-self:center;display:flex;align-items:center;gap:10px;font-family:'Arcade Pixel';font-size:21px;padding:3px 14px;border:3px solid ${K};box-shadow:0 4px 0 ${K};color:#06201C}
  .tv-cat .ico{font-size:24px}
  .tv-q{background:#F7F4EC;color:#0B1B2B;border:4px solid ${K};box-shadow:0 7px 0 ${K};padding:28px 30px;font-size:32px;font-weight:800;text-align:center;line-height:1.2}
  .tv-time{display:flex;align-items:center;gap:10px}.tv-time .tb{flex:1;height:16px;background:#0B1B2B;border:3px solid ${K}}.tv-time .tb i{display:block;height:100%;background:#F5B041}
  .tv-time b{font-family:'Arcade Pixel';font-size:22px;color:#F5B041;width:44px}
  .tv-ans{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .tv-a{display:flex;align-items:center;gap:14px;border:3px solid ${K};box-shadow:0 6px 0 ${K};padding:16px 18px;font-size:22px;font-weight:800;color:#06201C;position:relative;min-height:74px}
  .tv-a .k{font-family:'Arcade Pixel';font-size:26px;width:40px;height:40px;flex:none;display:flex;align-items:center;justify-content:center;background:${K};color:#F7F4EC}
  .tv-a .who{margin-left:auto;display:flex;gap:2px;font-size:20px}
  .tv-a.ok{outline:5px solid #F7F4EC;outline-offset:3px}.tv-a.no{filter:saturate(.25) brightness(.55)}
  .tv-a .plus{position:absolute;top:-17px;right:12px;background:#34D399;color:#06201C;font-weight:800;border:2px solid ${K};padding:0 8px;font-size:15px}
  .tv-a .tick{font-family:'Arcade Pixel';font-size:24px;margin-left:6px}
  .tv-fact{background:#0F2338;border:3px solid ${K};box-shadow:0 5px 0 ${K};padding:12px 16px;font-size:16px}
  .tv-scores{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:6px}
  .tv-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
  .tv-cg{border:3px solid ${K};box-shadow:0 4px 0 ${K};padding:10px 6px 8px;text-align:center;font-weight:800;color:#0B1B2B;font-size:14px;position:relative}
  .tv-cg .ico{font-size:40px;display:block;margin:0 auto 4px}.tv-cg.off{filter:saturate(.2) brightness(.5)}
  .tv-cg .ck{position:absolute;top:4px;right:4px;width:18px;height:18px;background:${K};color:#34D399;font-size:13px;display:flex;align-items:center;justify-content:center}
  /* FUNNY ANSWERS */
  .fa{position:absolute;inset:0;background:#0B1B2B;background-image:repeating-linear-gradient(45deg,rgba(245,176,65,.05) 0 18px,transparent 18px 36px)}
  .fa-col{width:min(1040px,100%);display:flex;flex-direction:column;align-items:center;gap:22px}
  .fa-step{font-family:'Arcade Pixel';font-size:20px;color:#9DB4CC}
  .fa-p{background:#F5B041;color:#231505;border:4px solid ${K};box-shadow:0 7px 0 ${K};padding:24px 30px;font-size:31px;font-weight:800;text-align:center;line-height:1.25;width:100%}
  .fa-vs{display:grid;grid-template-columns:1fr 70px 1fr;gap:14px;align-items:stretch;width:100%}
  .fa-a{background:#F7F4EC;color:#0B1B2B;border:4px solid ${K};box-shadow:0 7px 0 ${K};padding:34px 22px 22px;font-size:25px;font-weight:800;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:10px;position:relative;min-height:190px}
  .fa-a.win{outline:5px solid #34D399;outline-offset:4px}.fa-a.lose{opacity:.75}
  .fa-a .pc{position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-family:'Arcade Pixel';font-size:30px;background:${K};color:#F5B041;padding:0 14px}
  .fa-a .by{font-size:15px;color:#27496B;font-weight:800}
  .fa-a .vts{display:flex;justify-content:center;gap:3px;font-size:22px;min-height:26px}
  .fa-vsb{font-family:'Arcade Pixel';font-size:42px;color:#FB7185;display:flex;align-items:center;justify-content:center;text-shadow:3px 3px 0 ${K}}
  .fa-sweep{transform:rotate(-4deg);margin-top:4px;font-family:'Arcade Pixel';font-size:46px;background:#FB7185;color:#2A0710;border:4px solid ${K};box-shadow:0 7px 0 ${K};padding:2px 28px;z-index:4;white-space:nowrap}
  .fa-type{width:100%;background:#F7F4EC;color:#0B1B2B;border:4px solid ${K};box-shadow:0 6px 0 ${K};padding:18px 20px;font-size:26px;font-weight:800;display:flex;align-items:center;justify-content:space-between}
  .fa-type small{font-size:14px;color:#5C7A99;font-weight:700}
  .fa-wait{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
  .fa-wait .ok{color:#34D399;font-weight:800;margin-left:4px}
  .fa-6{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;width:100%}
  .fa-6 .fa-a{min-height:120px;font-size:19px;padding:22px 16px 14px}
  .fa-6 .medal{position:absolute;top:-14px;right:-10px;font-family:'Arcade Pixel';font-size:16px;border:2px solid ${K};padding:0 8px;color:#231505}
  /* room settings mock */
  .room{width:min(760px,100%)}
  @media (max-width:640px){
    .p6 .gbar{padding:8px 8px 0;gap:5px}.p6 .gbar b{font-size:14px;padding:1px 7px;box-shadow:0 3px 0 ${K};border-width:2px}.p6 .gbar b.hide-m{display:none}
    .p6 .body{padding:10px 10px 14px;align-items:flex-start}
    .cr{flex-direction:column;gap:12px;width:100%}.cr-board{width:100%}.cr-side{width:100%;flex-direction:row}.cr-side .tag{flex:1}.cr-side .pnl{display:none}
    .tl-grid{inset:44px 6px 10px;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:auto 1fr auto}
    .tl-seat .tag{padding:3px 6px;gap:4px}.tl-seat .tag small{display:none}.tl-seat .tag .av{font-size:18px;width:22px}.tl-fan .pcard{width:26px;height:36px;margin-left:-19px}
    .tl-mid{grid-column:1/4;grid-row:2}.tl-msg{font-size:13px;text-align:center}.tl-cards .pcard{width:52px;height:73px}.tl-cards{gap:4px}.tl-combo{font-size:18px}
    .tl-hand .pcard{width:50px;height:70px;margin-left:-30px}.tl-ctl .btn.gr:last-of-type{display:none}.tl-me{min-width:0}.tl-ctl{flex-wrap:wrap;justify-content:center;width:100%}.tl-ctl .note{display:none}.tl-ctl .btn{padding:8px 14px;font-size:15px}
    .tl-seat.l,.tl-seat.r,.tl-seat.t{grid-row:1}.tl-seat.l{grid-column:1}.tl-seat.t{grid-column:2}.tl-seat.r{grid-column:3}
    .ww .col{inset:46px 10px 10px;gap:10px}.ww .head{font-size:20px;padding:2px 12px}.ww .head .ico{font-size:20px}.ww .grid10{grid-template-columns:repeat(4,1fr);gap:8px;width:100%}
    .ww .pl{padding:6px 4px}.ww .pl .av{font-size:24px}.ww .pl b{font-size:13px}.ww .pl small{font-size:10px}.ww .tbar{width:100%}
    .ww .card{position:static;width:100%;display:flex;align-items:center;gap:10px;text-align:left;padding:6px 10px;margin-top:auto}.ww .card svg{width:50px;height:50px;margin:0}.ww .card .nm{font-size:22px}.ww .card .pix{display:none}
    .ww .moon{display:none}.ww .col>.note{font-size:13px!important;text-align:center}
    .tv-q{font-size:21px;padding:16px}.tv-ans{grid-template-columns:1fr;gap:10px}.tv-a{font-size:18px;padding:10px 12px;min-height:0}.tv-a .k{width:32px;height:32px;font-size:20px}
    .tv-col{gap:12px}.tv-fact{font-size:14px}.tv-scores .tag{padding:3px 6px}.tv-scores .tag small{font-size:11px}.tv-cat{font-size:16px}
    .fa-p{font-size:20px;padding:14px}.fa-vs{grid-template-columns:1fr;gap:12px}.fa-vsb{font-size:26px}.fa-a{min-height:0;font-size:19px;padding:26px 14px 16px}
    .fa-sweep{font-size:28px}.fa-col{gap:14px}
  }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- pixel art: rows of characters -> SVG squares ----------
  function px(rows, pal) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length)); let r = '';
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[ch]}"/>`; }));
    return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${r}</svg>`;
  }

  // round pixel shapes: f(x, y) -> palette letter or '' for each square of an n x n grid
  function grid(n, f) { const rows = []; for (let y = 0; y < n; y++) { let r = ''; for (let x = 0; x < n; x++) r += f(x + 0.5, y + 0.5) || '.'; rows.push(r); } return rows; }
  const D = (x, y, cx, cy) => Math.hypot(x - cx, y - cy);
  const ico = (svg) => `<span class="ico">${svg}</span>`;
  const k = K;
  const ART = {
    x: px(['k......k', 'kt....tk', '.kt..tk.', '..ktkk..', '..kktk..', '.kt..tk.', 'kt....tk', 'k......k'], { k: '#0E7C70', t: '#2DD4BF' }),
    o: px(['..kkkk..', '.kcccck.', 'kcc..cck', 'kc....ck', 'kc....ck', 'kcc..cck', '.kcccck.', '..kkkk..'], { k: '#B2213A', c: '#FB7185' }),
    wolf: px(['..k..........k..', '.kgk........kgk.', '.kggk......kggk.', '.kgggkkkkkkgggk.', '.kggggggggggggk.', 'kggggggggggggggk', 'kggyykggggkyyggk', 'kggykkggggkkyggk', 'kggggggggggggggk', '.kggggwwwwggggk.', '.kgggwwwwwwgggk.', '..kggwwkkwwggk..', '..kgwwwrrwwwgk..', '...kwwwwwwwwk...', '....kkwwwwkk....', '......kkkk......'], { k, g: '#5C6E86', y: '#F5B041', w: '#C9D6E3', r: '#FB7185' }),
    seer: px(grid(14, (x, y) => { if (y > 10.5) return (y > 12.5 || x < 2 || x > 12) ? (x > 1 && x < 13 ? 'k' : '') : (x > 2 && x < 12 ? 'y' : ''); const d = D(x, y, 7, 6); if (d < 5.6) return d > 4.7 ? 'k' : (D(x, y, 5, 4) < 1.3 ? 'w' : d < 2.5 ? 'p' : 't'); return ''; }), { k, t: '#2DD4BF', p: '#9FEBDB', w: '#F7F4EC', y: '#F5B041' }),
    doctor: px(['...kkkkkk...', '...keeeek...', '...keeeek...', 'kkkkeeeekkkk', 'keeeeeeeeeek', 'keeeeeeeeeek', 'kkkkeeeekkkk', '...keeeek...', '...keeeek...', '...kkkkkk...'], { k, e: '#34D399' }),
    hunter: px(['...kkk......', '..kbbk......', '.kbk.s......', '.kbk..s.....', 'kbk...s....y', 'kbkaaaaaaaay', 'kbk...s....y', '.kbk..s.....', '.kbk.s......', '..kbbk......', '...kkk......'], { k, b: '#D08A4E', s: '#F7F4EC', a: '#C9D6E3', y: '#F5B041' }),
    witch: px(grid(14, (x, y) => { if (y < 2) return x > 5 && x < 9 ? 'b' : ''; if (y < 5) return x > 5 && x < 9 ? (x < 6.1 || x > 7.9 ? 'k' : 'g') : ''; const d = D(x, y, 7, 9); if (d < 4.9) return d > 4 ? 'k' : (y < 7.6 ? 'g' : D(x, y, 5.5, 10) < 0.9 || D(x, y, 8.5, 11.5) < 0.7 ? 'w' : 'p'); return ''; }), { k, b: '#D08A4E', g: '#C9D6E3', p: '#34D399', w: '#F7F4EC' }),
    villager: px(['...kkkkkk...', '..kyyyyyyk..', '.kyyyyyyyyk.', 'kyykyyyykyyk', 'kyykyyyykyyk', 'kyyyyyyyyyyk', 'kyykyyyykyyk', 'kyyykkkkyyyk', '.kyyyyyyyyk.', '..kyyyyyyk..', '...kkkkkk...'], { k, y: '#F5B041' }),
    moon: px(grid(16, (x, y) => D(x, y, 8, 8) < 7.6 && D(x, y, 11.5, 5.2) > 6.2 ? (D(x, y, 8, 8) > 6.6 ? 'e' : (D(x, y, 5, 10) < 1.3 || D(x, y, 7.5, 13) < 0.9 ? 'c' : 'w')) : ''), { w: '#F7F4EC', e: '#C9D6E3', c: '#C9D6E3' }),
    sun: px(grid(18, (x, y) => { const d = D(x, y, 9, 9), a = Math.atan2(y - 9, x - 9); if (d < 5.2) return d > 4.3 ? 'o' : (D(x, y, 7.5, 7.5) < 1.6 ? 'w' : 'y'); if (d > 6.3 && d < 8.8 && Math.abs(Math.sin(a * 4)) < 0.28) return 'o'; return ''; }), { y: '#F5D06B', o: '#F5B041', w: '#FFF3C4' }),
    globe: px(['...kkkkkk...', '..kbbggbbk..', '.kbggggbbbk.', 'kbbgggbbbbbk', 'kbbbggbbggbk', 'kbbbbbbgggbk', 'kbbbbbggggbk', 'kbggbbbgggbk', 'kbgggbbbgbbk', '.kbgggbbbbk.', '..kbbgbbbk..', '...kkkkkk...'], { k, b: '#3E8EDE', g: '#34D399' }),
    film: px(['kkkkkkkkkkkk', 'kwkkwkkwkkwk', 'kkkkkkkkkkkk', 'kddddddddddk', 'kdwwwwwwwwdk', 'kdwwwwwwwwdk', 'kdwwwwwwwwdk', 'kddddddddddk', 'kkkkkkkkkkkk', 'kwkkwkkwkkwk', 'kkkkkkkkkkkk'], { k, w: '#F7F4EC', d: '#27496B' }),
    note: px(['......kk....', '......kyk...', '......kyyk..', '......kykyk.', '......kk.kk.', '......kk....', '......kk....', '..kkkkkk....', '.kyyyyyk....', 'kyyyyyyk....', '.kyyyyk.....', '..kkkk......'], { k, y: '#F5B041' }),
    ball: px(['...kkkkkk...', '..kwwwwwwk..', '.kwwwkkwwwk.', 'kwwwkkkkwwwk', 'kwwwkkkkwwwk', 'kkwwwkkwwwkk', 'kkkwwwwwwkkk', 'kwwwwwwwwwwk', 'kwwkkwwkkwwk', '.kwkkwwkkwk.', '..kwwwwwwk..', '...kkkkkk...'], { k, w: '#F7F4EC' }),
    flask: px(['...kkkkkk...', '....kwwk....', '....kwwk....', '....kwwk....', '...kwwwwk...', '..kwwwwwwk..', '.kggggggggk.', 'kggwggggggk.', 'kgggggggwggk', 'kgggggggggk.', '.kkkkkkkkkk.'], { k, w: '#C9D6E3', g: '#34D399' }),
    temple: px(['.....kk.....', '...kkwwkk...', '.kkwwwwwwkk.', 'kkkkkkkkkkkk', '.kwk.kwk.kwk', '.kwk.kwk.kwk', '.kwk.kwk.kwk', '.kwk.kwk.kwk', 'kkkkkkkkkkkk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk'], { k, w: '#F7F4EC' }),
    bowl: px(['........k...', '.......k..k.', '......k..k..', '..yyyyyykyy.', '.yyywyyyyyyy', 'kkkkkkkkkkkk', 'kcccccccccck', '.kccwcccccck', '..kccccccck.', '...kkkkkkk..'], { k, y: '#F5D06B', w: '#F7F4EC', c: '#FB7185' }),
    paw: px(['..kk....kk..', '.kppk..kppk.', '.kppk..kppk.', '..kk....kk..', 'kk...kk...kk', 'kpk.kppk.kpk', 'kk.kppppk.kk', '...kppppk...', '..kppppppk..', '..kppppppk..', '...kkkkkk...'], { k, p: '#D08A4E' }),
    pad: px(['..kkkkkkkk..', '.kggggggggk.', 'kggkggggrggk', 'kgkkkggrgrgk', 'kggkggggrggk', 'kggggggggggk', 'kgggkkkkgggk', '.kkk....kkk.'], { k, g: '#9DB4CC', r: '#FB7185' }),
    vn: px(['kkkkkkkkkkkk', 'krrrrrrrrrrk', 'krrrrryrrrrk', 'krrrryyyrrrk', 'krryyyyyyyrk', 'krrryyyyyrrk', 'krrryyryyrrk', 'krryrrrrryrk', 'krrrrrrrrrrk', 'kkkkkkkkkkkk'], { k, r: '#DA251D', y: '#FFDD00' }),
    us: px(['kkkkkkkkkkkk', 'kbbbbbrrrrrk', 'kbwbwbwwwwwk', 'kbbbbbrrrrrk', 'kbwbwbwwwwwk', 'kbbbbbrrrrrk', 'kwwwwwwwwwwk', 'krrrrrrrrrrk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk'], { k, b: '#2B4C9B', r: '#C8323C', w: '#F7F4EC' }),
    bulb: px(['...kkkkkk...', '..kyyyyyyk..', '.kyyywwyyyk.', '.kyywyyyyyk.', '.kyyyyyyyyk.', '..kyyyyyyk..', '...kyyyyk...', '...kkkkkk...', '...kddddk...', '...kkkkkk...', '....kddk....', '.....kk.....'], { k, y: '#F5D06B', w: '#F7F4EC', d: '#9DB4CC' }),
    bomb: px(['.......k.y', '......k.y.', '....kkkk..', '..kkkkkkk.', '.kkwkkkkkk', '.kwkkkkkkk', '.kkkkkkkkk', '.kkkkkkkkk', '..kkkkkkk.', '....kkk...'], { k: '#0B1B2B', w: '#9DB4CC', y: '#F5B041' }),
    claw: px(['k.k.k', 'k.k.k', 'kkkkk', '.kkk.'], { k: '#FB7185' }),
  };
  const flagChip = (code, label, on) => `<span class="ch ${on ? 'on' : ''}">${ico(ART[code])}${label}</span>`;

  const tag = (o) => `<div class="tag ${o.turn ? 'turn' : ''} ${o.me ? 'me' : ''}"><span class="av">${o.av}</span><span><b>${o.name}</b>${o.sub ? `<small>${o.sub}</small>` : ''}</span>${o.badge !== undefined ? `<span class="bub">${o.badge}</span>` : ''}</div>`;
  const card = (r, s, cls) => playingCardHTML({ r, s }, { cls: cls || '' });
  const back = () => playingCardHTML(null, { down: true });
  // the game bar: names shown in English, with the game's own items
  const gbar = (name, extra) => `<div class="gbar"><b>←<span class="hide-m"> Lobby</span></b><b class="am">${name}</b>${extra || ''}<b class="hide-m">⚙</b><b class="hide-m">?</b><b class="hide-m">♪</b></div>`;
  let el = null;
  function show(name, extra, body, bg) {
    clear(); el = document.createElement('div'); el.className = 'p6';
    el.innerHTML = (bg || '') + gbar(name, extra) + `<div class="body">${body}</div>`; document.body.appendChild(el); return el;
  }
  function clear() { if (el) el.remove(); el = null; }

  // ---------- CARO ----------
  function caro(win) {
    const B = {};
    [[7, 7, 'x'], [7, 8, 'o'], [6, 8, 'x'], [8, 6, 'o'], [5, 9, 'x'], [8, 8, 'o'], [4, 10, 'x'], [3, 11, 'o'], [8, 7, win ? 'o' : 'x'], [9, 6, 'o'], [6, 6, 'x'], [8, 9, 'o'],
      [win ? 9 : 8, 10, win ? 'x' : 'x'], [5, 7, 'o'], [9, 9, 'x'], [10, 5, 'o'], [6, 10, 'x'], [9, 8, 'x']].forEach(([r, c, v]) => { B[r + ',' + c] = v; });
    if (win) { B['8,10'] = 'o'; B['7,9'] = 'x'; }
    const W = new Set(win ? ['8,6', '8,7', '8,8', '8,9', '8,10'] : []);
    let cells = '';
    for (let r = 0; r < 15; r++) for (let c = 0; c < 15; c++) {
      const key = r + ',' + c, v = B[key];
      cells += `<i class="${W.has(key) ? 'win' : ''} ${!win && key === '10,5' ? 'last' : ''} ${!win && key === '7,9' ? 'hov' : ''}">${v ? ART[v] : ''}</i>`;
    }
    show('CARO', win ? '' : '<b class="info hide-m">GAME 2 OF 3 · 1–0</b>',
      `${win ? '<div class="cr-banner">LUNA WINS: FIVE IN A ROW!</div>' : ''}<div class="cr"><div class="cr-board">${cells}</div>
      <div class="cr-side">
        ${tag({ av: '🦊', name: 'You', sub: 'X · 0:42 left', me: true, turn: !win })}
        ${tag({ av: '🦉', name: 'Luna', sub: 'O · 1:10 left', turn: win })}
        <div class="pnl"><div class="wb">HOW TO WIN</div><div class="note" style="padding:10px 12px">Get <b style="color:#F7F4EC">five in a row</b>: across, down or diagonally. When the other player has <b style="color:#F7F4EC">three or four</b> in a row, block an end!</div></div>
        <div class="pnl"><div class="wb">ROOM SETTINGS</div><div class="note" style="padding:10px 12px">Board <b style="color:#F7F4EC">15 × 15</b><br>Five blocked at both ends doesn't win (Vietnamese rule): <b style="color:#F7F4EC">On</b><br>Match <b style="color:#F7F4EC">best of 3</b><br>Computer <b style="color:#F7F4EC">Easy / Medium / Hard</b></div></div>
      </div></div>`, '<div style="position:absolute;inset:0;background:#0A1A2B"></div>');
  }

  // ---------- THIRTEEN (Tiến Lên) ----------
  function thirteen(bomb) {
    const seat = (cls, o) => `<div class="tl-seat ${cls}"><div class="tl-fan">${Array.from({ length: Math.min(o.cards, 9) }, back).join('')}</div>${tag(o)}${o.out ? `<span class="tl-out">${o.out}</span>` : ''}</div>`;
    const hand = bomb ? [[3, 's'], [5, 'c'], [6, 'd'], [9, 's'], [9, 'c'], [9, 'd'], [9, 'h'], [12, 'd'], [13, 'h']]
      : [[3, 's'], [3, 'h'], [5, 'c'], [6, 'd'], [7, 'h'], [9, 's'], [10, 's'], [10, 'h'], [11, 'c'], [12, 'd'], [13, 'h'], [14, 'c'], [2, 'h']];
    const up = bomb ? [3, 4, 5, 6] : [];
    const mid = bomb
      ? `<div class="tl-cards">${card(2, 's')}</div><span class="tl-combo">A TWO!</span><span class="tl-msg">Luna played a 2, the highest card. Only a bomb can beat it.</span>`
      : `<div class="tl-cards">${card(4, 'd')}${card(5, 's')}${card(6, 'h')}${card(7, 'c')}${card(8, 'd')}</div><span class="tl-combo">STRAIGHT 4 → 8</span><span class="tl-msg">Luna played a straight. Beat it with a higher straight of 5, or pass.</span>`;
    show('THIRTEEN', '<b class="info hide-m">ROUND 2</b>', `<div class="tl"><div class="tl-grid">
      ${seat('l', { av: '🐻', name: 'Bao', sub: '9 cards', badge: 9, cards: 9, out: bomb ? 'PASSED' : '' })}
      ${seat('t', { av: '🦉', name: 'Luna', sub: '6 cards', badge: 6, cards: 6 })}
      ${seat('r', { av: '🐸', name: 'Minh', sub: '11 cards', badge: 11, cards: 11, out: bomb ? '' : 'PASSED' })}
      <div class="tl-mid">${mid}</div>
      <div class="tl-me"><div class="tl-hand">${hand.map(([r, s], i) => card(r, s, up.includes(i) ? 'up' : '')).join('')}</div>
        <div class="tl-ctl">${tag({ av: '🦊', name: 'You', sub: hand.length + ' cards', me: true, turn: true })}
          ${bomb ? `<span class="btn co">${ico(ART.bomb)} BOMB! PLAY FOUR 9s</span>` : '<span class="btn">▶ PLAY</span>'}<span class="btn gr">PASS</span><span class="btn gr">SORT</span>
          <span class="note" style="max-width:240px">${bomb ? 'Four of a kind beats a 2, and Luna pays a penalty.' : 'Tap cards to pick them, then Play. 3 is the lowest card, 2 the highest.'}</span></div></div>
    </div></div>`);
  }

  // ---------- WEREWOLF ----------
  const P = [['🦊', 'You'], ['🦉', 'Luna'], ['🐻', 'Bao'], ['🐸', 'Minh'], ['🦈', 'Kai'], ['🐼', 'Mai'], ['🦁', 'Leo'], ['🐙', 'Ivy'], ['🦖', 'Rex'], ['🚀', 'Zoe']];
  const house = (x, wall, roof, lit) => `<g transform="translate(${x},0)"><rect x="0" y="16" width="26" height="18" fill="${wall}"/><polygon points="-3,17 13,4 29,17" fill="${roof}"/><rect x="10" y="24" width="6" height="10" fill="#050E18"/><rect x="3" y="20" width="4" height="4" fill="${lit}"/><rect x="19" y="20" width="4" height="4" fill="${lit}"/></g>`;
  const village = (night) => `<svg class="vil" viewBox="0 0 400 38" shape-rendering="crispEdges">${[6, 50, 96, 140, 230, 274, 320, 366].map((x, i) => house(x, night ? ['#1A2B45', '#22385A'][i % 2] : ['#D08A4E', '#C9D6E3'][i % 2], night ? '#0F1C30' : '#B2213A', night ? (i % 3 ? '#0B1B2B' : '#F5B041') : '#7DD3FC')).join('')}
    <rect x="180" y="20" width="4" height="14" fill="${night ? '#0F1C30' : '#6B4A2B'}"/><rect x="172" y="12" width="20" height="10" fill="${night ? '#14301F' : '#3F8F4A'}"/><rect x="176" y="6" width="12" height="8" fill="${night ? '#14301F' : '#3F8F4A'}"/>
    <rect y="34" width="400" height="4" fill="${night ? '#0B1B2B' : '#5E8C3A'}"/></svg>`;
  const stars = () => `<div class="sky">${Array.from({ length: 46 }, (_, i) => `<i style="position:absolute;left:${(i * 37 + 11) % 100}%;top:${(i * 53) % 50}%;width:${i % 3 ? 2 : 3}px;height:${i % 3 ? 2 : 3}px;background:#F7F4EC;opacity:${0.35 + (i % 5) / 8}"></i>`).join('')}<div class="moon" style="position:absolute;right:9%;top:9%;width:70px">${ART.moon}</div></div>`;
  const roleCard = (big) => `<div class="card"><div class="pix" style="font-size:15px;color:#5C7A99">YOUR SECRET ROLE</div>${ART.wolf}<div><div class="nm">WEREWOLF</div>${big ? '<div style="font-size:12px;margin-top:6px;line-height:1.35">Each night, pick someone with your pack. In the day, act innocent!</div>' : ''}</div></div>`;
  function wwNight() {
    const sub = (i) => i === 0 ? 'you · wolf' : i === 3 ? 'wolf · your pack' : i === 8 ? 'out · was the Seer' : 'tap to choose';
    const g = P.map(([a, n], i) => `<div class="pl ${i === 5 ? 'pick' : ''} ${i === 8 ? 'dead' : ''} ${i === 3 || i === 0 ? 'mate' : ''}">${i === 5 ? `<span class="claw">${ico(ART.claw)} 2</span>` : ''}<span class="av">${a}</span><b>${n}</b><small>${sub(i)}</small></div>`).join('');
    show('WEREWOLF', '<b class="info">NIGHT 2</b>', `<div class="ww night">${stars()}${village(true)}
      <div class="col"><span class="head" style="background:#14244A;color:#FB7185">${ico(ART.moon)} THE WOLVES ARE HUNTING</span>
      <span class="note" style="color:#C9D6E3;font-size:16px">Everyone else is asleep. Agree with your pack: who do you take tonight?</span>
      <div class="tbar"><i></i></div><div class="grid10">${g}</div>${roleCard(true)}</div></div>`);
  }
  function wwDay() {
    const votes = { 2: 1, 5: 4, 3: 2 };
    const g = P.map(([a, n], i) => `<div class="pl ${i === 5 ? 'pick' : ''} ${i === 8 || i === 6 ? 'dead' : ''}">${votes[i] ? `<span class="vt">${votes[i]}</span>` : ''}<span class="av">${a}</span><b>${n}</b><small>${i === 8 ? 'out · Seer' : i === 6 ? 'out · Doctor' : i === 0 ? 'you' : i === 5 ? 'your vote' : 'tap to vote'}</small></div>`).join('');
    show('WEREWOLF', '<b class="info">DAY 3</b>', `<div class="ww day"><div class="sky"><div style="position:absolute;right:9%;top:9%;width:80px">${ART.sun}</div></div>${village(false)}
      <div class="col"><span class="head" style="background:#F5B041;color:#231505">${ico(ART.sun)} VILLAGE VOTE</span>
      <div class="news"><b style="font-size:19px">Leo was found this morning. He was the <span style="color:#34D399">DOCTOR</span>.</b><div class="note" style="margin-top:4px">Talk it over in the chat, then vote for who you think is a wolf. 0:48 left.</div></div>
      <div class="grid10">${g}</div></div>
      <div class="pnl chat"><div class="wb">TABLE CHAT</div><div style="padding:8px 12px;font-size:14px;line-height:1.55">
        <div><b style="color:#F5B041">Mai:</b> it's NOT me, Bao is too quiet</div><div><b style="color:#2DD4BF">Bao:</b> Mai voted for Rex yesterday, sus</div><div><b style="color:#FB7185">Kai:</b> voting Mai</div></div></div>
      ${roleCard(false)}</div>`);
  }
  function wwRoles() {
    const R = [['wolf', 'Werewolf', 'Each night the wolves pick someone. They win when there are as many wolves as villagers.', '#FB7185', 2],
      ['seer', 'Seer', 'Each night, look at one player\'s card: wolf or not?', '#2DD4BF', 1], ['doctor', 'Doctor', 'Each night, protect one player from the wolves.', '#34D399', 1],
      ['hunter', 'Hunter', 'If you go out, you take someone with you.', '#F5B041', 0], ['witch', 'Witch', 'One potion to save, one to poison. Each once.', '#F4A261', 0],
      ['villager', 'Villager', 'No power. Listen, argue and vote the wolves out!', '#C9D6E3', 6]];
    show('WEREWOLF', '<b class="info">ROOM</b>', `<div class="ww night">${stars()}${village(true)}<div class="col" style="justify-content:center;gap:20px">
      <span class="head" style="background:#14244A;color:#F5B041">ROLES IN THIS GAME</span>
      <div class="roles">${R.map(([a, n, d, c, cnt]) => `<div class="role" style="border-color:${c}"><span class="ri">${ART[a]}</span><div><b style="color:${c}">${n}</b><p>${d}</p><div class="ct"><i>−</i><span>${cnt}</span><i>+</i></div></div></div>`).join('')}</div>
      <div class="pnl" style="padding:10px 16px"><span class="note" style="color:#C9D6E3">10 players · Night 40 s · Day talk 2 min · A narrator voice tells everyone what happens ("Night falls. Everyone, close your eyes…")</span></div>
    </div></div>`);
  }

  // ---------- TRIVIA RUSH ----------
  const CATS = [['globe', 'Geography', '#2DD4BF'], ['film', 'Movies & TV', '#FB7185'], ['note', 'Music', '#F5B041'], ['ball', 'Sports', '#34D399'], ['flask', 'Science', '#7DD3FC'], ['temple', 'History', '#E9C46A'],
    ['bowl', 'Food', '#F4A261'], ['paw', 'Animals', '#A3E635'], ['pad', 'Games', '#9DB4CC'], ['vn', 'Vietnam', '#FB7185'], ['us', 'USA', '#7DD3FC'], ['bulb', 'Weird Facts', '#F5B041']];
  function tvRoom() {
    show('TRIVIA RUSH', '<b class="info">ROOM SETTINGS</b>', `<div class="tv"></div><div class="pnl room" style="width:min(940px,100%);position:relative"><div class="wb">GAME SETTINGS</div><div class="sets" style="padding:16px">
      <div class="srow hero"><span>QUESTIONS IN</span><div class="chs">${flagChip('us', 'English', true)}${flagChip('vn', 'Tiếng Việt', false)}</div></div>
      <div class="srow" style="align-items:start"><span>CATEGORIES</span><div class="tv-grid">${CATS.map(([a, n, c], i) => `<div class="tv-cg ${i === 8 ? 'off' : ''}" style="background:${c}">${i === 8 ? '' : '<span class="ck">✓</span>'}${ico(ART[a])}${n}</div>`).join('')}</div></div>
      <div class="srow"><span>QUESTIONS</span><div class="chs"><span class="ch">10</span><span class="ch on">15</span><span class="ch">20</span></div></div>
      <div class="srow"><span>TIME TO ANSWER</span><div class="chs"><span class="ch">10 s</span><span class="ch on">15 s</span><span class="ch">20 s</span></div></div>
      <div class="srow"><span>DIFFICULTY</span><div class="chs"><span class="ch on">Mixed</span><span class="ch">Easy</span><span class="ch">Hard</span></div></div>
    </div></div>`);
  }
  const SCORES = [['🦉', 'Luna', 5210, '🔥3'], ['🦊', 'You', 4870], ['🐸', 'Minh', 4400], ['🐻', 'Bao', 3920], ['🦈', 'Kai', 3100], ['🐼', 'Mai', 2650]];
  function tvQ(reveal, vi) {
    const Q = vi ? ['ĐỊA LÝ · VỪA', 'Quốc gia nào có nhiều hồ nước nhất thế giới?', ['Úc', 'Canada', 'Nga', 'Phần Lan'], '<b style="color:#F5B041">Bạn có biết?</b> Canada có hơn 2 triệu hồ, nhiều hơn tất cả các nước khác cộng lại.']
      : ['GEOGRAPHY · MEDIUM', 'Which country has the most lakes in the world?', ['Australia', 'Canada', 'Russia', 'Finland'], '<b style="color:#F5B041">Did you know?</b> Canada has over 2 million lakes, more than every other country put together.'];
    const COL = ['#2DD4BF', '#F5B041', '#FB7185', '#34D399'], who = { 1: '🦉🐸', 3: '🦊🐻🦈', 0: '🐼' };
    show('TRIVIA RUSH', `<b class="info">${vi ? 'CÂU' : 'Q'} 7 / 15</b>`, `<div class="tv"></div><div class="tv-col" style="position:relative">
      <span class="tv-cat" style="background:#2DD4BF">${ico(ART.globe)} ${Q[0]}</span>
      <div class="tv-q">${Q[1]}</div>
      ${reveal ? '' : '<div class="tv-time"><b>7</b><div class="tb"><i style="width:46%"></i></div></div>'}
      <div class="tv-ans">${Q[2].map((t, i) => `<div class="tv-a ${reveal ? (i === 1 ? 'ok' : 'no') : ''}" style="background:${COL[i]}"><span class="k">${'ABCD'[i]}</span>${t}${reveal && i === 1 ? '<span class="tick">✓</span>' : ''}${reveal && who[i] ? `<span class="who">${who[i]}</span>` : ''}${reveal && i === 1 ? '<span class="plus">+820</span>' : ''}</div>`).join('')}</div>
      ${reveal ? `<div class="tv-fact">${Q[3]}</div>` : ''}
      <div class="tv-scores">${SCORES.map(([a, n, s, f]) => tag({ av: a, name: n === 'You' && vi ? 'Bạn' : n, sub: (reveal && (n === 'Luna' || n === 'Minh') ? s + 820 : s) + (vi ? ' điểm' : ' pts') + (f && reveal ? ' 🔥4' : f ? ' 🔥3' : ''), me: n === 'You' })).join('')}</div>
    </div>`);
  }

  // ---------- FUNNY ANSWERS ----------
  function faRoom() {
    show('FUNNY ANSWERS', '<b class="info">ROOM SETTINGS</b>', `<div class="fa"></div><div class="pnl room" style="position:relative"><div class="wb">GAME SETTINGS</div><div class="sets" style="padding:16px">
      <div class="srow hero"><span>PROMPTS IN</span><div class="chs">${flagChip('us', 'English', true)}${flagChip('vn', 'Tiếng Việt', false)}</div></div>
      <div class="srow"><span>ROUNDS</span><div class="chs"><span class="ch">2</span><span class="ch on">3</span></div></div>
      <div class="srow"><span>TIME TO WRITE</span><div class="chs"><span class="ch">60 s</span><span class="ch on">90 s</span><span class="ch">2 min</span></div></div>
      <div class="srow"><span>PROMPTS</span><div class="chs"><span class="ch on">Crazy</span><span class="ch">Family friendly</span></div></div>
      <div class="note">3–8 players. Everyone plays on their own phone or computer. No computer players: only real people can be funny!</div>
    </div></div>`);
  }
  function faType() {
    show('FUNNY ANSWERS', '<b class="info">ROUND 1</b>', `<div class="fa"></div><div class="fa-col" style="position:relative">
      <span class="fa-step">PROMPT 1 OF 2 · 0:52 LEFT</span>
      <div class="fa-p">A terrible name for a pet goldfish</div>
      <div class="fa-type"><span>Lunch|</span><small>5 / 60</small></div>
      <span class="btn">SEND ANSWER</span>
      <span class="note">You and one other player get this prompt. Everyone else votes for the funnier answer.</span>
      <div class="fa-wait">${P.slice(1, 7).map(([a, n], i) => tag({ av: a, name: n, sub: i < 4 ? 'done <span class="ok">✓</span>' : 'writing…' })).join('')}</div>
    </div>`);
  }
  function faVote(res) {
    show('FUNNY ANSWERS', '<b class="info">ROUND 2 · ×2 POINTS</b>', `<div class="fa"></div><div class="fa-col" style="position:relative">
      <div class="fa-p">The worst thing to hear your pilot say over the speaker</div>
      <div class="fa-vs">
        <div class="fa-a ${res ? 'win' : ''}">${res ? '<span class="pc">100%</span>' : ''}"Okay, which one of these buttons is the brakes?"${res ? '<span class="by">🦉 Luna · +2000 + 500 bonus</span><span class="vts">🦊🐻🐸🦈🐼</span>' : ''}</div>
        <span class="fa-vsb">VS</span>
        <div class="fa-a ${res ? 'lose' : ''}">${res ? '<span class="pc">0%</span>' : ''}"Has anyone seen my glasses?"${res ? '<span class="by">🦁 Leo · 0</span><span class="vts"></span>' : ''}</div>
      </div>
      ${res ? '<div class="fa-sweep">CLEAN SWEEP!</div><span class="note">Everyone voted for Luna\'s answer.</span>' : '<span class="btn te">TAP THE FUNNIER ONE</span><span class="note">Names stay hidden until the votes are in.</span>'}
    </div>`);
  }
  function faLast() {
    const A = ['"National Nap Day: the whole country lies down at 2 pm"', '"Reverse Halloween: you give candy to kids who did NOT dress up"', '"Free Grandma Day: borrow anyone\'s grandma for soup"',
      '"Mute Monday: everyone talks only in emojis"', '"Pancake Throwing Day"', '"Say It Backwards Day: yad doog a evah"'];
    const M = [['GOLD', '#F5B041'], null, ['SILVER', '#C9D6E3'], null, null, ['BRONZE', '#D08A4E']];
    show('FUNNY ANSWERS', '<b class="info">FINAL ROUND · ×3</b>', `<div class="fa"></div><div class="fa-col" style="position:relative">
      <span class="fa-step" style="color:#FB7185">FINAL ROUND: EVERYONE ANSWERS</span>
      <div class="fa-p">Make up a new holiday. What do people do on it?</div>
      <div class="fa-6">${A.map((t, i) => `<div class="fa-a">${M[i] ? `<span class="medal" style="background:${M[i][1]}">${M[i][0]}</span>` : ''}${t}</div>`).join('')}</div>
      <span class="note">Tap your three favourites: gold, silver, bronze. You can't vote for your own.</span>
    </div>`);
  }

  window.P6 = { clear, caro, thirteen, wwNight, wwDay, wwRoles, tvRoom, tvQ, faRoom, faType, faVote, faLast };
})();
