    /* =========================================================================
       BLACKJACK: 6-deck shoe, hit / stand / double / split, blackjack pays 3:2
       ========================================================================= */
    (function blackjackGame() {
      const val = (c) => (c.r === 14 ? 11 : c.r >= 10 ? 10 : c.r);
      function total(hand) {
        let t = 0, aces = 0;
        for (const c of hand) { t += val(c); if (c.r === 14) aces++; }
        while (t > 21 && aces) { t -= 10; aces--; }
        return { t, soft: aces > 0 };
      }
      const isBJ = (h) => h.length === 2 && total(h).t === 21;
      const START = 1000;
      let G = null;

      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[900px] mx-auto');
        setupScreen(body, mod, [
          { key: 'decks', label: 'DECKS IN THE SHOE', def: 6, choices: [[1, '1 deck'], [2, '2 decks'], [6, '6 decks']] },
          { key: 'h17', label: 'DEALER ON SOFT 17', def: 0, choices: [[0, 'Stands'], [1, 'Hits']], hint: 'Soft 17 is 17 with an Ace counted as 11.' },
          { key: 'hands', label: 'HANDS TO PLAY', def: 8, when: (s) => s.net && s.net !== 'here', choices: [[5, '5 hands'], [8, '8 hands'], [12, '12 hands']], hint: 'Online everyone starts with 1,000 table chips. Most chips at the end wins.' },
          { key: 'totals', label: 'Show hand totals', toggle: true, def: 1, hint: 'Turn off to count the cards yourself.', choices: [[1, 'On'], [0, 'Off']] },
        ], (sel) => begin(body, sel));
      }
      function begin(body, sel) {
        const s = gstat('blackjack');
        if (s.chips === undefined || s.chips < 5) { if (s.chips !== undefined) s.rebuys = (s.rebuys || 0) + 1; s.chips = s.chips === undefined ? START : 500; saveProfile(); }
        const decks = +sel.decks || 6;
        G = { body, decks, h17: !!+sel.h17, totals: !!+sel.totals, shoe: newDeck(decks), cut: Math.round(decks * 52 * 0.28), hands: [], dealer: [], bet: 0, lastBet: 0, phase: 'bet', cur: 0, busy: false, tok: ++GT.cur };
        betScreen();
      }
      const chips = () => gstat('blackjack').chips;
      const setChips = (n) => { const s = gstat('blackjack'); s.chips = n; s.bestChips = Math.max(s.bestChips || START, n); saveProfile(); };
      function draw() { if (G.shoe.length < G.cut) { G.shoe = newDeck(G.decks); showToast('Shoe reshuffled', 'info'); } return G.shoe.pop(); }

      function frame(inner) {
        G.body.innerHTML = `<div class="felt p-4 sm:p-6 space-y-5">
          <div class="flex items-center justify-between gap-3"><span class="chip-tag flex items-center gap-1.5" id="bj-bankbox">${chipSVG(100, 18)}BANK <b id="bj-bank">${chips() - (G.bankLag || 0)}</b></span><span class="pix text-xs text-bone/70 text-center">BLACKJACK PAYS 3 TO 2 · DEALER STANDS ON 17</span><span id="bj-shoe" class="g-deck">${playingCardHTML(null, { cls: 'sm' })}</span></div>
          ${inner}</div><div id="bj-msg" class="text-center pix text-sm mt-3 min-h-[22px] text-amber"></div>`;
      }
      const CH = [[5, '#E8EEF5'], [25, '#34D399'], [100, '#60A5FA'], [500, '#FB7185']];
      function betScreen() {
        GT.over = true; // between hands it is safe to leave: your chips are already saved
        G.phase = 'bet'; G.bet = 0; G.hands = []; G.dealer = []; G.bankLag = 0;
        frame(`<div class="text-center space-y-4 py-6">
          <div class="pix text-sm text-bone/80">PLACE YOUR BET</div>
          <div class="flex items-center justify-center gap-3 flex-wrap">${[5, 25, 100, 500].map((v) => `<button class="chip-btn" data-ch="${v}" aria-label="Bet ${v}">${chipSVG(v, 58)}</button>`).join('')}</div>
          <div class="flex justify-center"><div id="bj-betspot" class="chip-spot ring"></div></div>
          <div class="pix text-2xl text-amber">BET: <span id="bj-bet">0</span></div>
          <div class="flex justify-center gap-3 flex-wrap"><button id="bj-clear" class="btn-game btn-graphite py-2 px-4 text-sm">Clear</button><button id="bj-max" class="btn-game btn-graphite py-2 px-4 text-sm">All in</button>${G.lastBet ? '<button id="bj-again" class="btn-game btn-graphite py-2 px-4 text-sm">Same bet</button>' : ''}<button id="bj-deal" class="btn-game btn-amber py-2 px-8 text-base">Deal</button></div></div>`);
        // the chips sitting in the betting circle (they only show once the flying chip lands)
        let shown = 0;
        const paintSpot = () => { const s = document.getElementById('bj-betspot'); if (s) s.innerHTML = stackSVG(shown, { scale: 1.5 }); };
        const upd = () => { document.getElementById('bj-bet').textContent = G.bet; shown = G.bet; paintSpot(); };
        G.body.querySelectorAll('[data-ch]').forEach((b) => { b.onclick = () => {
          const v = +b.dataset.ch;
          if (G.bet + v > chips()) return showToast('Not enough chips', 'error');
          G.bet += v; SFX.play('chip'); document.getElementById('bj-bet').textContent = G.bet;
          const target = G.bet;
          gFly(b, '#bj-betspot', chipSVG(v, 40), { ms: 420 }).then(() => { if (G && G.phase === 'bet' && G.bet >= target) { shown = Math.max(shown, target); paintSpot(); SFX.play('click'); } });
        }; });
        document.getElementById('bj-clear').onclick = () => { G.bet = 0; upd(); };
        document.getElementById('bj-max').onclick = () => { G.bet = chips(); SFX.play('chip'); upd(); };
        const again = document.getElementById('bj-again'); if (again) again.onclick = () => { G.bet = Math.min(G.lastBet, chips()); SFX.play('chip'); upd(); };
        document.getElementById('bj-deal').onclick = () => { if (G.bet < 5) return showToast('Bet at least 5 chips', 'error'); deal(); };
      }

      function deal() {
        GT.over = false;
        G.lastBet = G.bet; setChips(chips() - G.bet);
        G.hands = [{ cards: [], bet: G.bet, done: false, doubled: false, split: false }]; G.dealer = []; G.cur = 0; G.phase = 'play';
        G.busy = true;
        const seq = [[0], ['d'], [0], ['d']];
        let i = 0;
        const step = () => {
          if (!G) return;
          const t = seq[i++];
          if (t[0] === 'd') G.dealer.push(draw()); else G.hands[0].cards.push(draw());
          SFX.play('deal'); const ms = table(true);
          if (i < seq.length) gTimeout(step, 560); else gTimeout(afterDeal, ms + 450);
        };
        step();
      }
      function afterDeal() {
        G.busy = false;
        const pb = isBJ(G.hands[0].cards), db = isBJ(G.dealer);
        if (pb || db) { G.hands[0].done = true; return dealerPlay(); }
        table(false);
      }

      const handHTML = (cards, hideSecond) => `<div class="flex gap-2 justify-center flex-wrap">${cards.map((c, i) => playingCardHTML(c, { down: hideSecond && i === 1, fk: gKey(c) })).join('')}</div>`;
      // redraws the table; returns how long the card movement takes
      function table(hideDealer) {
        const before = gSnap(G.body);
        const showAll = G.phase === 'done' || !hideDealer;
        const hide = !(G.phase === 'done' || G.dealerRevealed);
        const dt = total(hide ? G.dealer.slice(0, 1) : G.dealer);
        const hands = G.hands.map((h, i) => {
          const tt = total(h.cards);
          return `<div class="seat ${G.phase === 'play' && G.cur === i && !G.busy ? 'turn' : ''}" style="min-width:150px"><div class="flex justify-center mb-2"><div id="bj-spot-${i}" class="chip-spot">${stackSVG(h.show === undefined ? h.bet : h.show, { scale: 1.3 })}</div></div>${handHTML(h.cards, false)}<div class="mt-2 pix text-sm">${G.totals ? tt.t : '?'}${G.totals && tt.soft && tt.t < 21 ? ' (soft)' : ''} <span class="text-amber">· bet ${h.bet}</span></div>${h.res ? `<div class="pix text-sm ${h.net > 0 ? 'text-emerald' : h.net < 0 ? 'text-coral' : 'text-bone'}">${h.res}</div>` : ''}</div>`;
        }).join('');
        const canAct = G.phase === 'play' && !G.busy;
        const h = G.hands[G.cur];
        const can2 = canAct && h && h.cards.length === 2 && chips() >= h.bet;
        const canSplit = can2 && G.hands.length < 4 && val(h.cards[0]) === val(h.cards[1]);
        frame(`<div class="text-center" id="bj-dealer"><div class="pix text-xs text-bone/70 mb-2">DEALER ${G.dealer.length && G.totals ? '· ' + dt.t : ''}</div>${handHTML(G.dealer, hide)}</div>
          <div class="flex justify-center gap-4 flex-wrap">${hands}</div>
          <div class="flex justify-center gap-3 flex-wrap min-h-[48px]">${canAct ? `<button id="bj-hit" class="btn-game btn-amber py-2 px-5">Hit</button><button id="bj-stand" class="btn-game btn-teal py-2 px-5">Stand</button>${can2 ? '<button id="bj-dbl" class="btn-game btn-coral py-2 px-5">Double</button>' : ''}${canSplit ? '<button id="bj-spl" class="btn-game btn-graphite py-2 px-5">Split</button>' : ''}` : ''}${G.phase === 'done' ? `<button id="bj-next" class="btn-game btn-amber py-2.5 text-base" style="padding-left:2rem;padding-right:2rem">Next hand</button>` : ''}</div>`);
        if (canAct) {
          document.getElementById('bj-hit').onclick = hit; document.getElementById('bj-stand').onclick = stand;
          const d = document.getElementById('bj-dbl'); if (d) d.onclick = dbl;
          const s = document.getElementById('bj-spl'); if (s) s.onclick = split;
        }
        const nx = document.getElementById('bj-next'); if (nx) nx.onclick = () => { if (chips() < 5) setChips(500); betScreen(); };
        if (G.msg) document.getElementById('bj-msg').textContent = G.msg;
        return gFlip(G.body, before, { from: '#bj-shoe' });
      }
      function nextHand() {
        const h = G.hands[G.cur]; h.done = true;
        if (G.cur < G.hands.length - 1) { G.cur++; const nh = G.hands[G.cur]; if (nh.cards.length === 1) { nh.cards.push(draw()); SFX.play('deal'); } const t = table(true); if (total(nh.cards).t === 21) { G.busy = true; gTimeout(() => { G.busy = false; nextHand(); }, t + 700); } }
        else dealerPlay();
      }
      function hit() { if (G.busy) return; const h = G.hands[G.cur]; h.cards.push(draw()); SFX.play('deal'); const t = total(h.cards).t; G.busy = true; const ms = table(true);
        // buttons come back once the card has landed, so a double tap can't take two cards
        if (t > 21) gTimeout(() => { SFX.play('nope'); G.busy = false; nextHand(); }, ms + 650);
        else if (t === 21) gTimeout(() => { G.busy = false; nextHand(); }, ms + 600);
        else gTimeout(() => { G.busy = false; table(true); }, ms); }
      function stand() { if (!G.busy) nextHand(); }
      function dbl() { if (G.busy) return; const h = G.hands[G.cur]; gFly('#bj-bankbox', '#bj-spot-' + G.cur, stackSVG(h.bet), { ms: 480 }); setChips(chips() - h.bet); h.bet *= 2; h.doubled = true; h.cards.push(draw()); SFX.play('chip'); G.busy = true; const ms = table(true); gTimeout(() => { G.busy = false; nextHand(); }, ms + 750); }
      function split() { if (G.busy) return; const h = G.hands[G.cur]; gFly('#bj-bankbox', '#bj-spot-' + G.cur, stackSVG(h.bet), { ms: 480 }); setChips(chips() - h.bet); const c2 = h.cards.pop(); G.hands.splice(G.cur + 1, 0, { cards: [c2], bet: h.bet, done: false, split: true }); h.split = true; h.cards.push(draw()); SFX.play('chip'); G.splitUsed = true; G.busy = true; const ms = table(true); if (total(h.cards).t === 21) gTimeout(() => { G.busy = false; nextHand(); }, ms + 600); else gTimeout(() => { G.busy = false; table(true); }, ms); }

      function dealerPlay() {
        G.busy = true; G.dealerRevealed = true; table(true); SFX.play('deal');
        const live = G.hands.some((h) => total(h.cards).t <= 21 && !(isBJ(h.cards) && !h.split)) && !isBJ(G.dealer);
        const go = () => {
          if (!G) return;
          const dt = total(G.dealer);
          if (live && (dt.t < 17 || (G.h17 && dt.t === 17 && dt.soft))) { G.dealer.push(draw()); SFX.play('deal'); const t = table(true); gTimeout(go, t + 550); } else gTimeout(settle, 700);
        };
        gTimeout(go, 1000);
      }
      function settle() {
        G.phase = 'done'; G.busy = false;
        const dt = total(G.dealer).t, dbj = isBJ(G.dealer);
        let net = 0, wins = 0, loss = 0, pushes = 0, bjs = 0, back = 0;
        for (const h of G.hands) {
          const pt = total(h.cards).t, pbj = isBJ(h.cards) && !h.split;
          let pay = 0, label = '';
          if (pt > 21) { label = 'BUST'; }
          else if (pbj && !dbj) { pay = h.bet * 2.5; label = 'BLACKJACK!'; bjs++; }
          else if (dbj && !pbj) label = 'DEALER BJ';
          else if (dt > 21 || pt > dt) { pay = h.bet * 2; label = 'WIN'; }
          else if (pt === dt) { pay = h.bet; label = 'PUSH'; }
          else label = 'LOSE';
          h.net = pay - h.bet; h.res = (h.net > 0 ? '+' : '') + h.net + ' ' + label;
          net += h.net; back += pay;
          if (h.net > 0) wins++; else if (h.net < 0) loss++; else pushes++;
        }
        setChips(chips() + back);
        const s = gstat('blackjack'); s.hands = (s.hands || 0) + G.hands.length; s.blackjacks = (s.blackjacks || 0) + bjs; s.biggestWin = Math.max(s.biggestWin || 0, net);
        const result = net > 0 ? 'win' : net < 0 ? 'loss' : 'draw';
        reportGame('blackjack', result, { elo: 0, xp: net > 0 ? 6 : 3, label: `${net >= 0 ? '+' : ''}${net} chips (${chips()} total)` });
        G.msg = net > 0 ? `You won ${net} chips!` : net < 0 ? `You lost ${-net} chips.` : 'Push. Your bet is back.';
        SFX.play(net > 0 ? 'win' : net < 0 ? 'lose' : 'pop');
        G.bankLag = back; // the bank number catches up when the chips arrive
        table(true);
        const tok = G.tok;
        const spot = (k) => (G && G.hands === hs ? document.getElementById('bj-spot-' + k) : null);
        const hs = G.hands; // if you start the next hand early, the old chips just finish quietly
        const setSpot = (k, amt) => { hs[k].show = amt; if (G.hands !== hs) return; const s = spot(k); if (s) s.innerHTML = stackSVG(amt, { scale: 1.3 }); };
        let last = 0;
        G.hands.forEach((h, k) => {
          const pay = h.net + h.bet, d0 = 350 + k * 300;
          if (pay > h.bet) { // dealer pays the winnings into your circle, then you collect it all
            gTimeout(() => { gFly('#bj-dealer', spot(k), stackSVG(pay - h.bet), { ms: 520 }); SFX.play('chip'); }, d0);
            gTimeout(() => setSpot(k, pay), d0 + 520);
            gTimeout(() => { gFly(spot(k), '#bj-bankbox', stackSVG(pay), { ms: 560 }); setSpot(k, 0); SFX.play('coin'); }, d0 + 1000);
            last = Math.max(last, d0 + 1560);
          } else if (pay === h.bet) { // push: your bet comes back
            gTimeout(() => { gFly(spot(k), '#bj-bankbox', stackSVG(pay), { ms: 560 }); setSpot(k, 0); }, d0 + 200);
            last = Math.max(last, d0 + 760);
          } else { // the dealer takes the bet
            gTimeout(() => { gFly(spot(k), '#bj-dealer', stackSVG(h.bet), { ms: 560 }); setSpot(k, 0); SFX.play('chip'); }, d0 + 200);
            last = Math.max(last, d0 + 760);
          }
        });
        gTimeout(() => { if (G && G.tok === tok) { G.bankLag = 0; const b = document.getElementById('bj-bank'); if (b) b.textContent = chips(); } }, last);
        if (chips() < 5) { document.getElementById('bj-msg').textContent += ' You are broke, so the bank gives you 500 chips.'; }
      }

      /* =================== ONLINE TABLE: up to 4 players against one dealer ===================
         Everyone gets 1,000 table chips (your own bank is not used). Each hand: everyone bets at the same time,
         then plays in seat order (hit / stand / double), then the dealer plays. Most chips after N hands wins. */
      let O = null;
      const oBotBet = (st) => Math.max(5, Math.min(st.chips, [25, 50, 100][Math.floor(Math.random() * 3)]));
      function oBotMove(h, up) {
        const t = total(h.cards), d = val(up);
        if (h.cards.length === 2 && (t.t === 10 || t.t === 11) && d < 10 && O.seats[O.cur].chips >= h.bet) return 'dbl';
        if (t.t >= 17) return 'stand';
        if (t.t >= 13 && d >= 2 && d <= 6 && !t.soft) return 'stand';
        if (t.t === 12 && d >= 4 && d <= 6) return 'stand';
        return 'hit';
      }
      async function startOnline(body, sel, S) {
        S.track();
        const deck = () => { const d = []; for (let k = 0; k < 6; k++) for (const su of SUITS) for (let r = 2; r <= 14; r++) d.push({ r, s: su }); return S.rng.shuffle(d); };
        O = { S, body, me: S.me, tok: ++GT.cur, hands: +sel.hands || 8, hand: 0, shoe: deck(), deck, seats: S.seats.map((x, i) => ({ i, name: x.name, av: x.avatar, chips: 1000, bet: 0, cards: [], res: '' })), dealer: [], phase: 'bet', cur: -1, msg: '', totals: sel.totals === undefined ? true : !!+sel.totals, over: false };
        S.onLeft = (a) => { if (!O) return; O.seats[a.s].name += ' (CPU)'; O.seats[a.s].av = '🤖'; oPaint(); };
        S.track();
        body.innerHTML = `<div class="felt p-4 sm:p-5 space-y-4" id="bjo"><div class="flex items-center justify-between gap-2"><span class="pix text-sm text-bone/80" id="bjo-hand"></span><span class="pix text-xs text-bone/70">DEALER STANDS ON 17 · BLACKJACK PAYS 3:2</span><span class="pix text-xs text-bone/70" id="bjo-shoe">SHOE</span></div>
          <div class="text-center" id="bjo-dealer"></div><div id="bjo-seats" class="grid grid-cols-2 lg:grid-cols-4 gap-3"></div>
          <div id="bjo-ctl" class="flex flex-wrap items-center justify-center gap-3 min-h-[60px]"></div><div id="bjo-msg" class="text-center pix text-sm min-h-[22px] text-amber"></div>
          <div class="flex justify-end"><button id="bjo-leave" class="btn-game btn-graphite py-1.5 px-4 text-xs">Leave table</button></div></div>`;
        document.getElementById('bjo-leave').onclick = () => npConfirmLeave(() => open(document.getElementById('game-root')));
        npBar('');
        const tok = O.tok, live = () => O && O.tok === tok;
        const W = async (ms) => { await gSleep(ms); if (!live()) throw 'stop'; };
        try {
          for (O.hand = 1; O.hand <= O.hands && live(); O.hand++) {
            const playing = O.seats.filter((x) => x.chips >= 5).map((x) => x.i);
            if (playing.length < 1) break;
            O.phase = 'bet'; O.dealer = []; O.cur = -1; O.seats.forEach((x) => { x.bet = 0; x.cards = []; x.res = ''; x.doubled = false; x.ready = false; });
            if (O.shoe.length < 90) { O.shoe = O.deck(); O.msg = 'Fresh shoe'; }
            oPaint();
            S.onCollect = (key, got) => { if (key === 'bet' + O.hand) { Object.values(got).forEach((a) => { const st = O.seats[a.s]; st.bet = Math.max(5, Math.min(st.chips, Math.floor(+a.amt || 5))); st.ready = true; }); oPaint(); } };
            const bets = await S.collect('bet' + O.hand, playing, (i) => ({ t: 'bet', amt: oBotBet(O.seats[i]) }), (i) => ({ t: 'bet', amt: Math.min(O.seats[i].chips, O.seats[i].last || 25) }), 25);
            if (!live()) return;
            Object.values(bets).forEach((a) => { const st = O.seats[a.s]; st.bet = Math.max(5, Math.min(st.chips, Math.floor(+a.amt || 5))); st.chips -= st.bet; st.last = st.bet; });
            O.phase = 'deal'; SFX.play('chip'); oPaint(); await W(500);
            for (let r = 0; r < 2; r++) { for (const i of playing) { O.seats[i].cards.push(O.shoe.pop()); SFX.play('deal'); await W(oPaint() + 120); } O.dealer.push(O.shoe.pop()); SFX.play('deal'); await W(oPaint() + 120); }
            const dealerBJ = isBJ(O.dealer);
            O.phase = 'play';
            for (const i of dealerBJ ? [] : playing) {
              const st = O.seats[i]; O.cur = i;
              while (live() && total(st.cards).t < 21 && !st.doubled) {
                const mine = S.mine(i);
                O.msg = mine ? 'Your turn: hit, stand or double.' : `${st.name} is playing...`; oPaint();
                const a = await S.ask(i, () => ({ t: 'mv', m: oBotMove(st, O.dealer[0]) }), 900 + Math.floor(Math.random() * 500), (x) => x.s === i && x.t === 'mv');
                if (!live()) return;
                if (a.m === 'stand') break;
                if (a.m === 'dbl' && st.cards.length === 2 && st.chips >= st.bet) { st.chips -= st.bet; st.bet *= 2; st.doubled = true; SFX.play('chip'); }
                st.cards.push(O.shoe.pop()); SFX.play('deal'); await W(oPaint() + 250);
                if (total(st.cards).t > 21) { st.res = 'BUST'; SFX.play('nope'); }
              }
            }
            O.cur = -1; O.phase = 'dealer'; O.msg = 'Dealer plays...'; await W(oPaint() + 600);
            const alive = playing.some((i) => total(O.seats[i].cards).t <= 21 && !isBJ(O.seats[i].cards));
            while (alive && !dealerBJ && total(O.dealer).t < 17) { O.dealer.push(O.shoe.pop()); SFX.play('deal'); await W(oPaint() + 450); }
            const dt = total(O.dealer).t;
            for (const i of playing) {
              const st = O.seats[i], pt = total(st.cards).t, pbj = isBJ(st.cards);
              let pay = 0, lab;
              if (pt > 21) lab = 'BUST'; else if (pbj && !dealerBJ) { pay = st.bet * 2.5; lab = 'BLACKJACK!'; } else if (dealerBJ && !pbj) lab = 'DEALER BJ';
              else if (dt > 21 || pt > dt) { pay = st.bet * 2; lab = 'WIN'; } else if (pt === dt) { pay = st.bet; lab = 'PUSH'; } else lab = 'LOSE';
              pay = Math.floor(pay); st.chips += pay; st.res = `${pay - st.bet >= 0 ? '+' : ''}${pay - st.bet} ${lab}`;
            }
            const me = O.seats[O.me]; O.phase = 'done';
            O.msg = playing.includes(O.me) ? me.res : 'You are out of chips. Watching...';
            SFX.play(me.res.startsWith('+') && !me.res.startsWith('+0') ? 'win' : me.res.startsWith('-') ? 'lose' : 'pop');
            oPaint(); await W(4400);   // time to read every hand's result
          }
          oFinish();
        } catch (e) { if (e !== 'stop') throw e; }
      }
      function oPaint() {
        if (!O || !document.getElementById('bjo')) return 0;
        const before = gSnap(O.body), S = O.S, hide = O.phase !== 'dealer' && O.phase !== 'done';
        document.getElementById('bjo-hand').textContent = `HAND ${Math.min(O.hand, O.hands)} / ${O.hands}`;
        document.getElementById('bjo-shoe').textContent = `SHOE · ${O.shoe.length}`;
        const dtv = total(hide ? O.dealer.slice(0, 1) : O.dealer).t;
        document.getElementById('bjo-dealer').innerHTML = `<div class="pix text-xs text-bone/70 mb-2">DEALER${O.dealer.length && O.totals ? ' · ' + dtv : ''}</div><div class="flex gap-2 justify-center flex-wrap min-h-[90px]">${O.dealer.map((c, k) => playingCardHTML(c, { down: hide && k === 1, fk: gKey(c), cls: 'sm' })).join('')}</div>`;
        document.getElementById('bjo-seats').innerHTML = O.seats.map((st) => {
          const tt = total(st.cards).t;
          return `<div class="seat ${O.cur === st.i ? 'turn' : ''} ${st.chips < 5 && !st.bet ? 'out' : ''}" style="min-width:0"><div class="text-sm font-display font-extrabold truncate ${st.i === O.me ? 'text-amber' : ''}">${esc(st.av)} ${esc(st.name)}</div>
            <div class="pix text-xs text-bone/80">${st.chips} chips</div><div class="chip-spot mx-auto" id="bjo-spot-${st.i}">${st.bet ? stackSVG(st.bet, { scale: 0.9 }) : O.phase === 'bet' ? `<span class="pix text-xs ${st.ready ? 'text-emerald' : 'text-bone/50'}">${st.ready ? 'READY' : 'BETTING...'}</span>` : ''}</div>
            <div class="flex gap-1 justify-center flex-wrap min-h-[64px]">${st.cards.map((c) => playingCardHTML(c, { fk: gKey(c), cls: 'sm' })).join('')}</div>
            <div class="pix text-xs ${st.res.startsWith('+') && !st.res.startsWith('+0') ? 'text-emerald' : st.res ? 'text-coral' : 'text-bone/70'}">${st.res || (st.cards.length && O.totals ? tt : '')}</div></div>`;
        }).join('');
        const ctl = document.getElementById('bjo-ctl'), me = O.seats[O.me];
        if (O.phase === 'bet' && S.mine(O.me) && !me.ready && me.chips >= 5) {
          const amt = O.myBet === undefined ? Math.min(me.chips, me.last || 25) : O.myBet;
          ctl.innerHTML = `${[5, 25, 100, 500].map((v) => `<button class="chip-btn" data-ch="${v}" aria-label="Add ${v}">${chipSVG(v, 44)}</button>`).join('')}<span class="pix text-xl text-amber">BET ${amt}</span><button id="bjo-clr" class="btn-game btn-graphite py-1.5 px-3 text-sm">Clear</button><button id="bjo-bet" class="btn-game btn-amber py-2 px-6">Bet ${amt}</button>`;
          O.myBet = amt;
          ctl.querySelectorAll('[data-ch]').forEach((b) => { b.onclick = () => { O.myBet = Math.min(me.chips, (O.myBet || 0) + +b.dataset.ch); SFX.play('chip'); oPaint(); }; });
          document.getElementById('bjo-clr').onclick = () => { O.myBet = 0; oPaint(); };
          document.getElementById('bjo-bet').onclick = () => { if (O.myBet < 5) return showToast('Bet at least 5 chips', 'error'); S.act({ t: 'bet', key: 'bet' + O.hand, amt: O.myBet }); me.ready = true; O.myBet = undefined; oPaint(); };
        } else if (O.phase === 'play' && O.cur === O.me && S.mine(O.me)) {
          const canDbl = me.cards.length === 2 && me.chips >= me.bet;
          ctl.innerHTML = `<button id="bjo-hit" class="btn-game btn-amber py-2 px-5">Hit</button><button id="bjo-stand" class="btn-game btn-teal py-2 px-5">Stand</button>${canDbl ? '<button id="bjo-dbl" class="btn-game btn-coral py-2 px-5">Double</button>' : ''}`;
          const key = O.hand + ':' + me.cards.length;
          const go = (m) => { if (O.sent === key) return; O.sent = key; ctl.innerHTML = ''; S.act({ t: 'mv', m, h: O.hand }); };
          if (O.timer !== key) { O.timer = key; gTimeout(() => { if (O && O.cur === O.me && O.sent !== key && O.phase === 'play') { showToast("Time's up! You stand.", 'error'); go('stand'); } }, 30000); }
          document.getElementById('bjo-hit').onclick = () => go('hit'); document.getElementById('bjo-stand').onclick = () => go('stand');
          const d = document.getElementById('bjo-dbl'); if (d) d.onclick = () => go('dbl');
        } else ctl.innerHTML = '';
        document.getElementById('bjo-msg').textContent = O.msg || '';
        npBar('');
        return gFlip(O.body, before, { from: '#bjo-shoe' });
      }
      function oFinish() {
        if (!O || O.over) return; O.over = true; O.S.over = true;
        const rank = O.seats.slice().sort((a, b) => b.chips - a.chips), me = O.seats[O.me], won = rank[0] === me;
        const s = gstat('blackjack'); s.online = (s.online || 0) + 1;
        reportGame('blackjack', won ? 'win' : 'loss', { elo: 0, xp: won ? 20 : 8, label: `Online table · ${me.chips} chips` });
        SFX.play(won ? 'win' : 'lose');
        gameResult({ title: won ? 'You beat the table!' : `${rank[0].name} wins`, sub: `Most chips after ${O.hands} hands.`, tone: won ? 'amber' : 'coral', sprite: won ? 'trophy' : 'anchor',
          rows: rank.map((x) => [x.name, x.chips, x.i === O.me ? 'text-amber' : 'text-bone']), againLabel: 'Back to setup', again: () => open(document.getElementById('game-root')) });
      }

      const mod = {
        id: 'blackjack', name: 'Blackjack', icon: 'blackjack', cats: ['card'], sub: '1-4 PLAYERS · CHIPS', color: '#34D399', tone: 'emerald', btn: 'emerald', noScore: false,
        blurb: 'Beat the dealer to 21 without going over. Your chip bank is saved on this device.',
        rules: { tag: 'SOLO · CHIPS', steps: [
          '<strong class="text-bone">Goal:</strong> Get closer to 21 than the dealer without going over. Number cards count face value, J Q K are 10, and an Ace is 1 or 11.',
          '<strong class="text-bone">Your turn:</strong> <b>Hit</b> to take a card, <b>Stand</b> to stop, <b>Double</b> to double your bet for exactly one more card, <b>Split</b> a pair into two hands.',
          '<strong class="text-bone">Dealer:</strong> Draws until 17 and stops. A natural blackjack (Ace + 10 card) pays <span class="text-amber font-bold">3 to 2</span>.',
        ], tip: 'Always stand on hard 17 or more, and double down on 11 when the dealer shows a small card.' },
        profileTiles: (s) => [['CHIPS', s.chips ?? START, 'text-amber'], ['BEST BANK', s.bestChips ?? START, 'text-emerald'], ['HANDS', s.hands || 0, 'text-bone'], ['WIN RATE', pct(s.wins, s.played) + '%', 'text-teal']],
        extraRows: (s) => srow('Blackjacks', s.blackjacks || 0) + srow('Biggest win', s.biggestWin || 0) + srow('Rebuys', s.rebuys || 0),
        engine: { total, isBJ }, open, close() { G = null; O = null; },
        online: { seats: () => 4, min: 2, ranked: false, start: (body, sel, S) => startOnline(body, sel, S).catch((e) => console.error(e)) },
      };
      registerGame(mod);
    })();

