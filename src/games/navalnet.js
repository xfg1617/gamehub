    /* =========================================================================
       SEA BATTLE ONLINE (id 'navalnet', no tile of its own): the SAME game as offline Sea Battle - its setup
       screen (drag ships, tap to turn, 60 s), its boards, missiles, explosions, banners, turn clock and summary.
       The offline screens are borrowed into this game's page while you play and handed back afterwards.
       Only the opponent is different: a real person. Each fleet stays secret: you send a shot, the other
       player's screen answers hit / miss / sunk (ngNetIncoming / ngNetResult in the base page).
       ========================================================================= */
    (function navalOnline() {
      let G = null;
      const $ = (id) => document.getElementById(id);
      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[1000px] mx-auto');
        if (!(typeof NET !== 'undefined' && NET.on)) { body.innerHTML = '<div class="win p-6 text-center text-sm text-muted max-w-md mx-auto">Sea Battle Online needs the online service. You can still play Sea Battle against the computer from the main menu.</div>'; return; }
        setupScreen(body, mod, [
          { key: 'clock', label: 'SHOT TIMER', def: 20, choices: [[15, '15 s'], [20, '20 s'], [30, '30 s']] },
          { key: 'touch', label: 'Ships may touch', toggle: true, def: 1, hint: 'Off: every ship needs open water all around it, corners too.', choices: [[1, 'Yes'], [0, 'No']] },
        ], () => showToast('Pick Online or Private room above.', 'info'));
      }
      // give the borrowed screens back to the offline Sea Battle page
      function giveBack() {
        if (!G || !G.home) return;
        ['ng-setup-view', 'ng-battle-view'].forEach((id) => { const el = $(id); if (el && el.parentElement !== G.home) G.home.appendChild(el); });
        G.home = null;
      }
      async function start(body, sel, S) {
        const me = S.me, opp = 1 - me, root = $('game-root');
        G = { S, tok: ++GT.cur, over: false, home: $('view-naval') };
        S.track();
        body.innerHTML = '';
        body.appendChild($('ng-setup-view')); body.appendChild($('ng-battle-view'));
        NG_TOUCH = sel.touch === undefined ? true : !!+sel.touch; NG_TURN_SECS = +sel.clock || 20;
        const oppElo = await NET.rating('naval').catch(() => ({ elo: 1200 })).then((r) => r.elo || 1200);
        initNavalGame(S.name(opp), oppElo, S.ranked ? 'RANKED' : 'FRIENDLY');
        npBar('');
        const tok = G.tok, live = () => G && G.tok === tok && !G.over;
        let k = 0;
        ngNet = {
          ready: () => S.act({ t: 'ready', key: 'ready' }),
          fire: (r, c) => S.act({ t: 'shot', k, r, c }),
          skip: () => S.act({ t: 'skip', k }),
          over: (won, cb) => { G.over = true; S.finish(won ? 'win' : 'loss').then(cb); },
          back: () => { giveBack(); open(root); },
        };
        S.onLeft = (a) => {
          if (!live() || a.s !== opp) return;
          G.over = true; ng.phase = 'battle';
          setBattleBanner('🏳️', `${S.name(opp)} ${a.t === '_gone' ? 'disconnected' : 'left the game'}.`, 'You win!');
          finishNavalMatch(true);
          const sub = $('ng-sum-sub'); if (sub) sub.textContent = `${S.name(opp)} ${a.t === '_gone' ? 'disconnected' : 'left the game'}. You win!`;
        };
        try {
          // 1. both fleets placed (60 s on the clock, like offline)
          await S.collect('ready', [0, 1], () => ({ t: 'ready' }), () => ({ t: 'ready' }), 80);
          if (!live()) return;
          if (ng.phase === 'setup') startNavalBattle();   // the other player was quicker: launch with my current fleet
          // 2. turns, one missile each
          let turn = S.rng.rnd(2);
          for (k = 0; k < 400 && live(); k++) {
            const def = 1 - turn;
            if (turn === me) { setBattleBanner('🎯', 'Your turn! Pick a target in Enemy Waters.', 'Click a square to aim, then click it again to fire.'); beginPlayerTurn(); renderNavalBattle(); }
            else { ng.playerTurn = false; showEnemyTurnClock(); $('ng-turn-timer-lab').textContent = 'Their turn'; if (k === 0) setBattleBanner('⏳', `${S.name(opp)} fires first.`, 'Get ready to strike back!'); renderNavalBattle(); }
            const a = await S.ask(turn, null, 0, (x) => x.s === turn && (x.t === 'shot' || x.t === 'skip') && x.k === k);
            if (!live()) return;
            if (a.t === 'shot') {
              const r = Math.max(0, Math.min(9, a.r | 0)), c = Math.max(0, Math.min(9, a.c | 0));
              if (def === me) {
                SFX.play('whoosh');
                await new Promise((ok) => gTimeout(ok, 320));
                const res = ngNetIncoming(r, c);
                S.act({ t: 'res', k, r, c, hit: res.hit, sunk: res.sunk, all: res.all });
                if (res.all) { finishNavalMatch(false); return; }
              }
              const res = await S.ask(def, null, 0, (x) => x.s === def && x.t === 'res' && x.k === k);
              if (!live()) return;
              if (turn === me) { ngNetResult(r, c, { hit: !!res.hit, sunk: res.sunk && Array.isArray(res.sunk.cells) ? res.sunk : null, all: !!res.all }); if (res.all) return; }
            } else if (turn !== me) setBattleBanner('⏱', `${S.name(opp)} ran out of time.`, 'Your turn!');
            await new Promise((ok) => gTimeout(ok, 850));
            turn = def;
          }
        } catch (e) { console.error(e); }
      }
      const mod = {
        id: 'navalnet', name: 'Sea Battle', icon: 'naval', hidden: true, cats: ['board'], sub: '1v1 ONLINE', color: '#2DD4BF', tone: 'teal', btn: 'teal',
        blurb: 'Hide your fleet, then take turns firing at the enemy grid. Sink all five ships to win.',
        open, close() { stopNgTimer(); giveBack(); ngNet = null; G = null; },
        online: { seats: () => 2, ranked: true, noLocal: true, start: (body, sel, S) => start(body, sel, S).catch((e) => console.error(e)) },
      };
      registerGame(mod);
    })();
