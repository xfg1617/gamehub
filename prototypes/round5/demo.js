// Sample "watch how to play" demo for Bullshit (prototype). Plays a short animated scene using the site's own cards.
(async function () {
  const K = '#050E18';
  const st = document.createElement('style');
  st.textContent = `
  #dm{position:fixed;inset:0;z-index:200;background:radial-gradient(ellipse at 50% 45%,#1E7A4F 0,#14593A 55%,#0B3322 100%);font-family:Outfit,sans-serif;color:#F7F4EC;overflow:hidden}
  #dm .pcard{width:78px!important;height:112px!important;--cw:78px;transition:transform .7s cubic-bezier(.3,.7,.3,1),opacity .4s}
  #dm .tbl{position:absolute;left:8%;right:8%;top:16%;bottom:26%;border:6px solid #6B4423;box-shadow:0 0 0 4px ${K},inset 0 0 0 4px ${K};background:#1B8A57}
  #dm .opp{position:absolute;top:4%;display:flex;flex-direction:column;align-items:center;gap:6px}
  #dm .opp .fan{display:flex}#dm .opp .fan .pcard{width:44px!important;height:62px!important;margin-left:-26px}#dm .opp .fan .pcard:first-child{margin-left:0}
  #dm .hand{position:absolute;bottom:4%;left:50%;transform:translateX(-50%);display:flex;gap:8px}
  #dm .hand .pcard.up{transform:translateY(-26px)}
  #dm .pile{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);width:90px;height:124px}
  #dm .pile .pcard{position:absolute;left:0;top:0}
  #dm .rank{position:absolute;left:50%;top:22%;transform:translateX(-50%);background:${K};border:3px solid #F5B041;padding:6px 16px;font-family:'Arcade Pixel';font-size:30px;color:#F7F4EC;opacity:0;transition:opacity .4s}
  #dm .rank b{color:#F5B041;font-weight:400}
  #dm .cap{position:absolute;left:50%;bottom:26%;transform:translate(-50%,0);width:min(820px,90%);background:${K};border:3px solid ${K};box-shadow:0 5px 0 rgba(0,0,0,.4);display:flex;gap:14px;align-items:center;padding:12px 18px;opacity:0;transition:opacity .35s}
  #dm .cap .n{flex:none;width:40px;height:40px;background:#F5B041;color:#231505;font-family:'Arcade Pixel';font-size:28px;display:flex;align-items:center;justify-content:center;border:3px solid ${K}}
  #dm .cap p{font-size:22px;font-weight:700;line-height:1.3;margin:0}
  #dm .bub{position:absolute;background:#F7F4EC;color:${K};font-weight:800;font-size:20px;padding:6px 12px;border:3px solid ${K};box-shadow:0 4px 0 ${K};opacity:0;transition:opacity .3s,transform .3s;transform:scale(.6)}
  #dm .bub.on{opacity:1;transform:scale(1)}
  #dm .bs{position:absolute;font-family:'Arcade Pixel';font-size:84px;color:#FB7185;text-shadow:5px 5px 0 ${K};opacity:0;transform:scale(.3) rotate(-8deg);transition:transform .35s cubic-bezier(.3,1.6,.5,1),opacity .2s;pointer-events:none}
  #dm .bs.on{opacity:1;transform:scale(1) rotate(-8deg)}
  #dm .timer{position:absolute;left:50%;top:62%;transform:translateX(-50%);width:260px;height:14px;border:3px solid ${K};background:#0B1B2B;opacity:0;transition:opacity .3s}
  #dm .timer i{display:block;height:100%;background:#F5B041;width:100%;transition:width 3.2s linear}
  #dm .title{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#0B1B2B;transition:opacity .5s;z-index:5}
  #dm .title .ic{width:140px;height:140px;background:#12304C;border:4px solid ${K};box-shadow:0 6px 0 ${K};display:flex;align-items:center;justify-content:center}
  #dm .title .ic svg{width:100px;height:100px}
  #dm .title h1{font-size:56px;font-weight:800;margin:0}#dm .title p{color:#9DB4CC;font-size:22px;margin:0}
  #dm .title .tag{font-family:'Arcade Pixel';color:#F5B041;font-size:24px;letter-spacing:.08em}
  #dm .mark{position:absolute;right:-12px;top:-12px;width:38px;height:38px;border:3px solid ${K};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;z-index:3}
  #dm .brand{position:absolute;right:18px;top:14px;font-family:'Arcade Pixel';color:rgba(247,244,236,.6);font-size:20px;z-index:6}
  #dm .prog{position:absolute;left:0;bottom:0;height:6px;background:#F5B041;z-index:6;width:0}
  `;
  document.head.appendChild(st);
  const C = (r, s, o) => playingCardHTML({ r, s }, o || {});
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const d = document.createElement('div'); d.id = 'dm';
  const opp = (x, av, name, n) => `<div class="opp" style="left:${x}%;transform:translateX(-50%)" id="o-${name}"><div class="fan">${Array.from({ length: 6 }, () => C(0, 0, { down: true })).join('')}</div>${nameTag({ av, name, sub: n + ' cards' })}</div>`;
  const hand = [[7, 'h'], [7, 's'], [13, 'c'], [4, 'd'], [9, 's'], [12, 'h']];
  d.innerHTML = `<div class="tbl"></div>
    ${opp(25, '🐙', 'Luna', 9)}${opp(50, '🦉', 'Cael', 8)}${opp(75, '🦈', 'Mako', 10)}
    <div class="pile" id="pile"></div><div class="rank" id="rank">PUT DOWN: <b>SEVENS</b></div>
    <div class="timer" id="timer"><i></i></div>
    <div class="hand" id="hand">${hand.map(([r, s], i) => `<div data-i="${i}">${C(r, s)}</div>`).join('')}</div>
    <div class="cap" id="cap"><span class="n" id="capn">1</span><p id="capt"></p></div>
    <div class="bub" id="bme" style="left:calc(50% + 160px);bottom:20%">"Two sevens!"</div>
    <div class="bs" id="bs" style="left:27%;top:9%">BULLSHIT!</div>
    <div class="brand">GAMEHUB · HOW TO PLAY</div><div class="prog" id="prog"></div>
    <div class="title" id="title"><div class="ic">${GICONS[GAME_MODS.fibber.icon]}</div><span class="tag">HOW TO PLAY</span><h1>Bullshit</h1><p>3-5 players · bluff your way out of cards</p></div>`;
  document.body.appendChild(d);
  const $ = (id) => document.getElementById(id);
  const T0 = Date.now(), TOTAL = 34000; const tick = setInterval(() => { $('prog').style.width = Math.min(100, (Date.now() - T0) / TOTAL * 100) + '%'; }, 100);
  const cap = async (n, t) => { $('cap').style.opacity = 0; await sleep(300); $('capn').textContent = n; $('capt').innerHTML = t; $('cap').style.opacity = 1; };
  const fly = (el, to, flip) => {
    const a = el.getBoundingClientRect(), b = to.getBoundingClientRect();
    const c = el.cloneNode(true); c.style.cssText = `position:fixed;left:${a.left}px;top:${a.top}px;margin:0;z-index:20;transition:transform .8s cubic-bezier(.3,.7,.3,1)`;
    if (flip) c.innerHTML = C(0, 0, { down: true }).replace(/^<div class="pcard back/, '<div class="pcard back'); 
    document.getElementById('dm').appendChild(c); el.style.visibility = 'hidden';
    requestAnimationFrame(() => { c.style.transform = `translate(${b.left - a.left}px,${b.top - a.top}px) rotate(${(Math.random() * 16 - 8).toFixed(1)}deg)`; });
    return c;
  };
  await sleep(2600); $('title').style.opacity = 0; await sleep(500); $('title').remove();
  await cap(1, 'Goal: be the <b style="color:#F5B041">first to get rid of all your cards</b>.');
  await sleep(3600);
  $('rank').style.opacity = 1;
  await cap(2, 'Each turn the game names a rank. Put <b style="color:#F5B041">1 to 4 cards face down</b> and say they are that rank.');
  await sleep(1800);
  const hs = [...document.querySelectorAll('#hand > div')];
  hs[0].firstChild.classList.add('up'); await sleep(500); hs[2].firstChild.classList.add('up'); await sleep(900);
  const p = $('pile');
  const c1 = fly(hs[0].firstChild, p, true); await sleep(250); const c2 = fly(hs[2].firstChild, p, true); c2.style.marginLeft = '14px';
  await sleep(800); hs[0].style.display = 'none'; hs[2].style.display = 'none';
  await sleep(700); $('bme').classList.add('on'); await sleep(2600);
  await cap(3, 'Think someone is lying? Shout <b style="color:#FB7185">BULLSHIT!</b> before the timer runs out.');
  $('timer').style.opacity = 1; await sleep(100); $('timer').firstChild.style.width = '35%'; await sleep(2200);
  $('bs').classList.add('on'); try { SFX.play('nope'); } catch (e) {}
  document.querySelector('#o-Luna .tg-tag').style.boxShadow = '0 0 0 3px #FB7185'; await sleep(2000);
  $('bs').classList.remove('on'); $('bme').classList.remove('on'); $('timer').style.opacity = 0;
  await cap(4, 'The cards are turned over. <b style="color:#FB7185">Caught lying?</b> You take the whole pile. <b style="color:#34D399">Telling the truth?</b> The shouter takes it.');
  // flip the two cards
  [[c1, 7, 'h', true], [c2, 13, 'c', false]].forEach(([c, r, s, ok], i) => {
    c.style.transition = 'transform .8s cubic-bezier(.3,.7,.3,1)'; const tr = c.style.transform;
    c.style.transform = tr + ` translateX(${i ? 50 : -50}px)`;
    setTimeout(() => { c.innerHTML = C(r, s) + `<span class="mark" style="background:${ok ? '#34D399' : '#FB7185'}">${ok ? '✓' : '✗'}</span>`; c.style.position = 'fixed'; }, 450);
  });
  await sleep(3200);
  // the pile comes back to you
  const hb = $('hand').getBoundingClientRect();
  [c1, c2].forEach((c) => { c.style.transition = 'transform .9s cubic-bezier(.5,0,.3,1)'; const a = c.getBoundingClientRect(); c.style.transform += ` translate(${hb.right - a.left + 10}px,${hb.top - a.top}px)`; });
  await sleep(1000); c1.remove(); c2.remove();
  $('hand').insertAdjacentHTML('beforeend', `<div>${C(7, 'h')}</div><div>${C(13, 'c')}</div>`);
  document.querySelector('#o-Luna .tg-tag').style.boxShadow = '';
  await sleep(1400);
  await cap(5, 'Tip: mix real cards with bluffs, and watch how many cards the others put down.');
  await sleep(4300);
  $('cap').style.opacity = 0;
  const end = document.createElement('div'); end.className = 'title'; end.style.opacity = 0;
  end.innerHTML = `<div class="ic">${GICONS[GAME_MODS.fibber.icon]}</div><h1>Now you try!</h1><button class="btn-game btn-amber px-10 py-4 text-xl">▶ Play Bullshit</button>`;
  d.appendChild(end); await sleep(50); end.style.opacity = 1;
  await sleep(2600); clearInterval(tick); window.__demoDone = true;
})();
