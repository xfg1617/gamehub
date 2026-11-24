    /* =========================================================================
       HOW TO PLAY: a grid of game titles; tap one for a step-by-step guide that uses the game's own pieces.
       Each guide: goal, steps (in sections), "what the pieces mean", tips, and how online play works for it.
       ========================================================================= */
    const HOWTO = (() => {
      const A = (id) => (GAME_MODS[id] && GAME_MODS[id].art) || {};
      const row = (items) => `<div class="ht-items">${items.map(([art, label, text]) => `<div class="ht-item"><div class="ht-art">${art}</div><div><div class="ht-lab">${label}</div><div class="ht-txt">${text}</div></div></div>`).join('')}</div>`;
      const sq = (c, t = '') => `<span class="ht-sq" style="background:${c}">${t}</span>`;
      const disc = (c, king) => `<span class="disc ${c}" style="width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center">${king ? '<span style="font-size:15px">♛</span>' : ''}</span>`;
      const tile = (ch, cls) => `<span class="tile ${cls}" style="width:40px;height:40px;font-size:1.2rem">${ch}</span>`;
      const ball = (c, n, stripe) => `<span class="ht-ball" style="background:${stripe ? '#F7F4EC' : c};${stripe ? `box-shadow: inset 0 9px 0 ${c}, inset 0 -9px 0 ${c}` : ''}">${n ? `<i>${n}</i>` : ''}</span>`;
      const card = (r, s) => (typeof playingCardHTML === 'function' ? playingCardHTML({ r, s }, { cls: 'sm' }) : '');
      const ship = (id, n) => (typeof shipSVG === 'function' ? `<span style="display:inline-block;width:${n * 22}px;height:22px">${shipSVG({ id, size: n }, 'H')}</span>` : '');
      const NET_2P = 'Pick <b>Online match</b> to play someone new (it is <b>ranked</b>: a win raises your rating, a loss lowers it). Pick <b>Private room</b> to play a friend: send them the code or link from the room. No one to play? Add a computer player in the room. Leaving a game early counts as a loss.';
      const NET_TABLE = 'Pick <b>Online match</b> to join a table with other players, or <b>Private room</b> to play with friends: send them the code or link from the room. The host presses Start. Empty seats can be filled with computer players. If someone leaves, a computer player takes over their seat.';
      const G = {
        naval: { tag: '1v1 · 10×10 GRID', goal: 'Sink all five of the enemy’s ships before they sink yours.', steps: [
          ['Hide your fleet', 'Drag each ship onto your grid. Tap a ship to turn it. Ships can’t overlap (and in some games they can’t touch either). Press <b>Ready</b> when you like your layout.'],
          ['Take a shot', 'On your turn, tap a square on the enemy grid. A <b class="text-coral">hit</b> shows a fire, a <b>miss</b> shows a splash. You have a few seconds per shot, so don’t wait too long!'],
          ['Hunt the ship down', 'After a hit, try the squares next to it: ships are straight lines, so the rest of it is up, down, left or right.'],
          ['Win', 'When every square of a ship is hit, it sinks. Sink all five to win.']],
          items: () => row([[ship('carrier', 5), 'Carrier', '5 squares long'], [ship('battleship', 4), 'Battleship', '4 squares'], [ship('cruiser', 3), 'Cruiser', '3 squares'], [ship('submarine', 3), 'Submarine', '3 squares'], [ship('destroyer', 2), 'Destroyer', '2 squares, the hardest to find']]),
          tip: 'Shoot in a checkerboard pattern at first: every ship is at least 2 squares long, so you will still find them all with half the shots.', online: 'Your ships stay secret: only your own screen knows where they are. ' + NET_2P },
        daily: { tag: 'SOLO · ONE WORD A DAY', goal: 'Guess the secret five-letter word in six tries or fewer.', steps: [
          ['Type a word', 'Type any real five-letter word and press Enter.'],
          ['Read the colours', 'Each letter turns a colour to tell you how close you are (see below).'],
          ['Use what you learned', 'Your next guess should use the green letters in the same spots and try the amber letters somewhere new.'],
          ['Come back tomorrow', 'Everyone gets the same word each day. Solve it every day to grow your streak. "Practice word" gives unlimited extra puzzles.']],
          items: () => row([[tile('S', 'tile-correct'), 'Green', 'Right letter, right spot'], [tile('T', 'tile-present'), 'Amber', 'In the word, but somewhere else'], [tile('O', 'tile-absent'), 'Grey', 'Not in the word at all']]),
          tip: 'Start with a word that has common letters, like CRANE or SLATE.', online: 'Daily Word is a puzzle you play alone. Want to race someone? Play <b>Word Duel</b>: same idea, same secret word for everyone.' },
        wordduel: { tag: '2-4 PLAYERS · WORD RACE', goal: 'Be the first to find the secret five-letter word.', steps: [
          ['Same word for everyone', 'Every player guesses the same secret word on their own board, all at the same time.'],
          ['Read your colours', 'Just like Daily Word: green = right spot, amber = in the word somewhere else, grey = not in the word.'],
          ['Watch your rivals', 'On the right you see everyone’s colours (but not their letters), so you know who is close.'],
          ['Win', 'The first player to get all five letters green wins. Everyone has six guesses.']],
          items: () => row([[tile('W', 'tile-correct'), 'Green', 'Right letter, right spot'], [tile('O', 'tile-present'), 'Amber', 'In the word, wrong spot'], [tile('R', 'tile-absent'), 'Grey', 'Not in the word']]),
          tip: 'Lots of green on a rival’s board? Take a risky guess instead of a safe one!', online: 'Pick <b>Online match</b> to race strangers, or <b>Private room</b> to race up to 3 friends. Alone in the room? Add a computer player to race.' },
        c4: { tag: '1v1 · 7 COLUMNS', goal: 'Get four of your discs in a line: across, up and down, or diagonally.', steps: [
          ['Drop a disc', 'On your turn, tap a column. Your disc falls to the lowest empty space.'],
          ['Take turns', 'Players take turns dropping one disc each. Watch the timer.'],
          ['Block!', 'If your opponent has three in a row with an empty space next to it, drop a disc there to stop them.'],
          ['Win', 'Four in a row wins. If the board fills up first, it is a draw.']],
          items: () => row([[disc('disc-amber'), 'Amber disc', 'The first player'], [disc('disc-coral'), 'Coral disc', 'The second player']]),
          tip: 'The middle column is the strongest. More lines of four go through it than any other column.', online: NET_2P },
        tictactoe: { tag: '1v1 · 3×3', goal: 'Get three of your marks in a row.', steps: [
          ['Place your mark', 'Tap an empty square. X goes first in the first game.'],
          ['Take turns', 'Players take turns, one mark each.'],
          ['Win a game', 'Three in a row across, down or diagonally wins the game. A full board with no line is a draw.'],
          ['Win the match', 'In a "best of 3" or "best of 5", the first to win most of the games wins the match. Players take turns starting.']],
          items: () => row([[`<span class="ht-mark" style="color:#FB7185">✕</span>`, 'X', 'Coral'], [`<span class="ht-mark" style="color:#2DD4BF">◯</span>`, 'O', 'Teal']]),
          tip: 'Take the centre if you can. If your opponent takes it, take a corner.', online: NET_2P },
        hedge: { tag: '2-4 PLAYERS · MAZE RACE', goal: 'Be the first to get your pawn to the other side of the garden.', steps: [
          ['Take a step', 'On your turn, tap one of the glowing squares to move there: up, down, left or right.'],
          ['Or plant a hedge', 'Press <b>Plant hedge</b>, tap a yellow dot between squares, then press <b>Plant</b>. Tap the dot again (or ↻ Turn it) to switch between lying flat and standing up.'],
          ['Hedges block the way', 'Nobody can walk through a hedge, so it makes rivals walk around. But you can never shut someone in completely: there must always be a way through.'],
          ['Jumping', 'If another pawn is right next to you, you can jump over it. If there is a hedge behind it, step to the side of it instead.']],
          items: () => row([[`<span style="display:inline-block;width:44px;height:10px;background:#1E7A3E;border:2px solid #050E18"></span>`, 'Hedge', '2 squares long. You have 10 (5 with 4 players)'], [`<span style="display:inline-block;width:30px;height:30px;background:#F7EBC0;box-shadow:inset 0 0 0 3px #2DD4BF"></span>`, 'Glowing square', 'Where you can move now'], [`<span style="display:inline-block;width:40px;height:6px;background:#F5B041"></span>`, 'Coloured edge', 'The side each player is racing to']]),
          tip: 'The panel shows how many steps everyone still needs. Save your hedges for when a rival is close to the finish.', online: NET_TABLE },
        chess: { tag: '1v1 · CLASSIC', goal: 'Trap the other king so it cannot escape. That is checkmate.', steps: [
          ['Move a piece', 'Tap one of your pieces, then a highlighted square. White moves first.'],
          ['Capture', 'Move onto an enemy piece to take it off the board.'],
          ['Check', 'If your king is attacked, you must get it out of danger on your next move.'],
          ['Special moves', '<b>Castling</b>: king and rook swap sides in one move. <b>Promotion</b>: a pawn that reaches the far side becomes a queen (or another piece). <b>En passant</b>: a special pawn capture.'],
          ['Win or draw', 'Checkmate wins. If a player has no legal move but is not in check, it is a draw (stalemate).']],
          items: () => { const p = A('chess').piece; return p ? row([[`<span class="ht-piece">${p('K')}</span>`, 'King', 'One square any way. Protect it!'], [`<span class="ht-piece">${p('Q')}</span>`, 'Queen', 'Any distance, any direction'], [`<span class="ht-piece">${p('R')}</span>`, 'Rook', 'Straight lines'], [`<span class="ht-piece">${p('B')}</span>`, 'Bishop', 'Diagonals'], [`<span class="ht-piece">${p('N')}</span>`, 'Knight', 'An L shape. Can jump over pieces'], [`<span class="ht-piece">${p('P')}</span>`, 'Pawn', 'Forward one (two on its first move), takes diagonally']]) : ''; },
          tip: 'Get your knights and bishops out early, and castle to keep your king safe.', online: NET_2P },
        checkers: { tag: '1v1 · 8×8', goal: 'Capture all your opponent’s pieces, or leave them with no moves.', steps: [
          ['Move', 'Pieces move one square diagonally forward, onto dark squares. Tap a piece, then a highlighted square.'],
          ['Jump', 'Hop over an enemy piece into the empty square behind it to capture it. If you can capture, you <b>must</b>.'],
          ['Keep jumping', 'If another jump is possible after landing, keep going in the same turn.'],
          ['King me', 'Reach the far row and your piece becomes a king, which can move backwards too.']],
          items: () => row([[disc('disc-amber'), 'Your piece', 'Moves diagonally forward'], [disc('disc-amber', true), 'King', 'Moves forward and backward'], [disc('disc-coral'), 'Opponent', 'Jump over these to capture']]),
          tip: 'Keep your back row filled as long as you can. It stops the other side from getting kings.', online: NET_2P },
        pool: { tag: '1v1 · 8-BALL', goal: 'Sink all your balls (solids or stripes), then sink the 8-ball.', steps: [
          ['Aim', 'Hold the table and drag to swing your aim. The dotted circle shows where your cue ball will hit, and the short arrows show where the balls will head.'],
          ['Power', 'Pull the power bar back to the left and let go to shoot. A longer pull hits harder.'],
          ['Spin (optional)', 'Tap the small cue-ball picture to hit it high (follows through), low (comes back) or on the side (curves off cushions).'],
          ['Solids or stripes', 'The first ball you sink after the break decides your group. Sink one of yours and you shoot again.'],
          ['Fouls', 'Sinking the white ball, hitting the wrong ball first, or no ball touching a cushion is a foul. Your opponent then gets "ball in hand" and can place the white anywhere.'],
          ['Win', 'Once your group is gone, sink the 8-ball. Sinking it too early loses the game!']],
          items: () => row([[ball('#F7F4EC'), 'Cue ball', 'The white one you hit'], [ball('#F5B041', 1), 'Solids 1-7', 'One full colour'], [ball('#FB7185', 11, true), 'Stripes 9-15', 'A coloured band'], [ball('#111A24', 8), '8-ball', 'Last!']]),
          tip: 'Don’t hit every shot hard. A softer shot keeps the white ball under control for your next turn.', online: 'You can watch your opponent aim and pull back the cue live. ' + NET_2P },
        bowling: { tag: '1-4 PLAYERS · 10 FRAMES', goal: 'Knock down as many pins as you can in 10 frames.', steps: [
          ['Grab the ball', 'Press on the ball and hold it. Slide left or right low on the screen to choose where you stand.'],
          ['Throw', 'Flick upward and let go. A faster flick throws faster but is harder to aim.'],
          ['Add spin', 'Curve the end of your flick and the ball will hook as it reaches the pins.'],
          ['Frames', 'You get two throws per frame to knock down all ten pins.'],
          ['Scoring', '<b>Strike (X)</b>: all ten on the first throw, worth 10 plus your next two throws. <b>Spare (/)</b>: all ten in two throws, worth 10 plus your next throw.']],
          items: () => row([[`<span class="ht-mark">X</span>`, 'Strike', 'All 10 pins, first throw'], [`<span class="ht-mark">/</span>`, 'Spare', 'All 10 pins, two throws'], [`<span class="ht-mark">-</span>`, 'Miss', 'No pins']]),
          tip: 'Aim just to the side of the front pin (the "pocket") with a little hook for the best chance of a strike.', online: 'Players take turns on the same lane; everyone watches every throw. A 2-player online match is ranked. ' },
        poker: { tag: '2-4 PLAYERS · TEXAS HOLD\'EM', goal: 'Win everyone’s chips. The last player with chips wins.', steps: [
          ['Your cards', 'You get two private cards. Five shared cards come out in the middle: three (the flop), then one (the turn), then one (the river).'],
          ['Betting', 'On your turn: <b>Fold</b> (give up the hand), <b>Check/Call</b> (stay in by matching the bet) or <b>Raise</b> (bet more).'],
          ['Showdown', 'If more than one player is left at the end, the best five-card hand made from your two cards and the five shared ones wins the pot.'],
          ['Blinds', 'Two players must put in a small bet each hand (the blinds). They grow over time so the game always ends.']],
          items: () => row([[`${card(14, 'h')}${card(13, 'h')}`, 'Your two cards', 'Only you can see them'], [`${typeof chipSVG === 'function' ? chipSVG(100, 36) : ''}`, 'Chips', 'What you bet with'], ]) + (A('poker').ranks ? `<div class="ht-lab mt-3 mb-2">HAND RANKS · BEST TO WORST</div>${A('poker').ranks()}` : ''),
          tip: 'You don’t have to play every hand. Folding weak cards early saves chips for the good ones.', online: NET_TABLE },
        blackjack: { tag: 'SOLO OR 1-4 PLAYERS', goal: 'Beat the dealer by getting closer to 21 without going over.', steps: [
          ['Bet', 'Tap chips to make your bet, then deal.'],
          ['Card values', 'Number cards count as their number, J Q K count as 10, and an Ace is 1 or 11 (whichever helps).'],
          ['Your turn', '<b>Hit</b> to take another card, <b>Stand</b> to stop, <b>Double</b> to double your bet for exactly one more card. Two cards that match can be <b>Split</b> into two hands (not online).'],
          ['Dealer’s turn', 'The dealer keeps drawing until reaching 17 or more.'],
          ['Results', 'Closer to 21 than the dealer wins your bet back doubled. Over 21 is a bust and loses. An Ace + a 10 card on the first two cards is a <b>blackjack</b> and pays 3 to 2.']],
          items: () => row([[`${card(14, 's')}${card(13, 'd')}`, 'Blackjack!', 'Ace + a 10-value card'], [`${card(10, 'c')}${card(6, 'h')}`, '16', 'A tough hand: hit or stand?'], [`${typeof chipSVG === 'function' ? chipSVG(25, 36) : ''}`, 'Chips', 'Your bet']]),
          tip: 'Always stand on 17 or more. Double on 11 when the dealer shows a small card.', online: 'Online, everyone sits at the same table against one dealer. Each player starts with 1,000 chips just for this table. After the last hand, whoever has the most chips wins.' },
        kittens: { tag: '2-4 PLAYERS · PUSH YOUR LUCK', goal: 'Don’t get stuck with the Hot Potato. The last cat standing wins!', steps: [
          ['Your turn', 'Play as many cards from your hand as you like (or none), then draw one card from the pile to end your turn.'],
          ['The Hot Potato', 'Hot Potatoes are hidden in the pile. Draw one and you are out, unless you have an Oven Mitt.'],
          ['Saved!', 'With an Oven Mitt you survive, and you secretly slide the Hot Potato back into the pile anywhere you like: right on top for the next player, or deep down.'],
          ['Skip & Attack', 'Skip ends your turn without drawing. Attack does too, and the next player has to take 2 turns in a row.'],
          ['Peek, Shuffle, Favor', 'Peek shows the top 3 cards. Shuffle mixes the pile. Favor makes a player give you a card of their choice.'],
          ['No Way!', 'Anyone can play No Way at any time to stop a card. You can even No Way a No Way!'],
          ['Cat combos', 'Cat cards do nothing alone. A pair: pick one of a player’s face-down cards. Three of a kind: name a card, and if they have it they must hand it over. Five different cats: take any card from the discard pile.']],
          items: () => { const c = A('kittens').card; return c ? row([[c('bomb'), 'Hot Potato', 'Draw it and you are out'], [c('defuse'), 'Oven Mitt', 'Saves you once'], [c('nope'), 'No Way', 'Stop any card'], [c('peek'), 'Peek', 'See the top 3 cards'], [c('nap'), 'Skip', 'End your turn without drawing'], [c('pounce'), 'Attack', 'Next player takes 2 turns'], [c('beg'), 'Favor', 'They give you a card'], [c('c3'), 'Cat cards', 'Pairs, threes, five different']]) : ''; },
          tip: 'Peek before you draw. If the Hot Potato is next, play Skip or Attack so you don’t have to draw it. Save your Oven Mitt: when someone asks with three cats, they usually name it!', online: NET_TABLE },
        colorclash: { tag: '2-4 PLAYERS · MATCH COLOURS', goal: 'Be the first to play all of your cards.', steps: [
          ['Match', 'Play a card that matches the top card by <b>colour</b> or by <b>number/symbol</b>.'],
          ['Can’t play?', 'Draw a card from the pile. If it fits, you can play it right away.'],
          ['Special cards', 'Some cards skip a player, reverse the direction, or make the next player draw (see below).'],
          ['Say CLASH!', 'When you are down to one card, press the CLASH! button quickly. Forget and you draw 2. Catch someone else who forgot and they draw 2!']],
          items: () => { const c = A('colorclash').card; return c ? row([[c({ c: 'a', v: 7 }), 'Number', 'Match colour or number'], [c({ c: 'b', v: 'skip' }), 'Skip', 'Next player misses a turn'], [c({ c: 'c', v: 'rev' }), 'Reverse', 'Turn order flips'], [c({ c: 'e', v: 'd2' }), '+2', 'Next player draws 2'], [c({ c: 'w', v: 'w' }), 'Wild', 'Pick any colour'], [c({ c: 'w', v: 'w4' }), 'Wild +4', 'Pick a colour, next draws 4']]) : ''; },
          tip: 'Each colour also has a symbol (★ ◆ ♥ ♣), so you can tell them apart without colours.', online: NET_TABLE },
        dominoes: { tag: '2-4 PLAYERS · DOUBLE-SIX', goal: 'Get rid of all your tiles first and score the dots left in your rivals’ hands.', steps: [
          ['Match an end', 'On your turn, play a tile whose number matches one of the two open ends of the line.'],
          ['Doubles', 'Tiles with the same number on both halves are laid crosswise.'],
          ['Stuck?', 'In a <b>Draw game</b> you take tiles from the boneyard until one fits. In a <b>Block game</b> you just pass.'],
          ['Scoring', 'Go out first and score all the dots left in the other hands. If nobody can play, the lowest hand wins the difference.']],
          items: () => { const t = A('dominoes').tile; return t ? row([[t(3, 5), '3 | 5', 'Fits next to a 3 or a 5'], [t(6, 6), 'Double six', 'The highest double starts the first round'], [t(0, 4), 'Blank | 4', 'Blank is zero']]) : ''; },
          tip: 'Play your big tiles early so you are not caught holding them.', online: NET_TABLE },
        tycoon: { tag: '2-4 PLAYERS · PROPERTY GAME', goal: 'Be the richest player when the rounds run out (Short, Medium or Long game) or the last one not bankrupt (Classic).', steps: [
          ['Roll', 'Hold the roll button to shake the dice and let go to throw. Move that many squares.'],
          ['Buy', 'Land on a property nobody owns and you can buy it. Skip it and it goes to auction for everyone.'],
          ['Rent', 'Land on someone else’s property and you pay them rent. Own a whole colour set to double the rent.'],
          ['Build', 'With a full colour set, build houses (and then a hotel) to charge much more rent. (Room setting: or build one house each time you land on your own plot.)'],
          ['Buy out (setting)', 'If the room turns it on: after paying rent you may buy that plot from its owner for 2 × (land price + its houses). Not a plot with a hotel, and not one from a full colour set.'],
          ['Cards and jail', 'Chance and Chest squares give a card that helps or hurts. Three doubles in a row, or the Go to Jail square, sends you to Jail.'],
          ['Short on cash?', 'Houses are sold and properties mortgaged for you automatically. If you still can’t pay, you are bankrupt.']],
          items: () => row([[sq('#FB7185') + sq('#FB7185') + sq('#FB7185'), 'Colour set', 'Own all of one colour'], [`<span class="ht-mark">🏠</span>`, 'House', 'More rent'], [`<span class="ht-mark">🏨</span>`, 'Hotel', 'The most rent'], [`<span class="ht-mark">🎲</span>`, 'Doubles', 'Roll again']]),
          tip: 'Railroads and the orange and red sets are great value. Build evenly across a set.', online: NET_TABLE },
        isles: { tag: '3-4 PLAYERS · BUILD AN ISLAND', goal: 'Be the first to reach the target points by building villages, towns and roads.', steps: [
          ['Start', 'Everyone places two villages and two roads. Corners touching numbers that come up often (6 and 8) are best.'],
          ['Roll', 'Each turn, roll the dice. Every land tile with that number gives its resource to anyone with a village (1 card) or town (2 cards) on its corners.'],
          ['Build', 'Spend resources: <b>Road</b> (Timber + Clay), <b>Village</b> (Timber + Clay + Wool + Grain), <b>Town</b> (2 Grain + 3 Stone, upgrades a village).'],
          ['Trade', 'Trade 4 of the same card for any 1 with the bank, or offer a deal to the other players.'],
          ['The Bandit', 'A roll of 7 moves the Bandit: it blocks a tile and steals a card. Anyone holding more than 7 cards loses half.'],
          ['Points', 'Village = 1 point, Town = 2 points, Longest Road = 2 points. First to the target wins.']],
          items: () => row([[sq('#1F6B42', '🌲'), 'Timber', 'From forests'], [sq('#9C4630', '🧱'), 'Clay', 'From clay pits'], [sq('#9BC97A', '🐑'), 'Wool', 'From pastures'], [sq('#E9C352', '🌾'), 'Grain', 'From fields'], [sq('#8E9CAD', '⛰️'), 'Stone', 'From mountains']]),
          tip: 'Settle next to different resources so you can always build something.', online: NET_TABLE },
        manor: { tag: '3-6 PLAYERS · WHODUNIT', goal: 'Be the first to work out who did it, with what, and in which room.', steps: [
          ['The secret', 'One suspect, one tool and one room are hidden in an envelope. The other cards are dealt out, so any card in your hand can’t be the answer.'],
          ['Walk', 'On your turn, walk to a room next to yours (corner rooms have secret passages to the opposite corner).'],
          ['Suggest', 'Name a suspect and a tool "in this room". The next player who holds one of those cards must secretly show you one.'],
          ['Take notes', 'Your notebook ticks cards you have seen. Cross off everything that can’t be the answer.'],
          ['Accuse', 'When you are sure, accuse! Right and you win. Wrong and you are out (but you still show cards).']],
          items: () => row([[`<span class="ht-mark text-coral">👤</span>`, '6 suspects', 'Who did it'], [`<span class="ht-mark text-teal">🔧</span>`, '6 tools', 'With what'], [`<span class="ht-mark text-amber">🚪</span>`, '9 rooms', 'Where']]),
          tip: 'Suggest cards you already hold to test the others. If nobody can show anything, the rest may be the answer!', online: 'When someone shows a card, only the player who asked gets to see it. ' + NET_TABLE },
        wordconnect: { tag: 'SOLO OR ONLINE RACE', goal: 'Find as many words as you can from the letter wheel.', steps: [
          ['Make a word', 'Tap letters on the wheel in order. As soon as they spell a word you haven’t found yet, it goes in by itself.'],
          ['Fix a mistake', 'Tap the last letter again (or ⌫ Back) to remove it. Clear starts over.'],
          ['The big word', 'At least one word uses every letter. Finding it scores the most.'],
          ['Stars', 'Find more of the hidden words to earn up to three stars. Hints show the first letters but cost points.']],
          items: () => row([[`<span class="ht-mark">🔀</span>`, 'Shuffle', 'Mix up the wheel to see new words'], [`<span class="ht-mark">💡</span>`, 'Hint', 'Shows the start of a word']]),
          tip: 'Look for little words first (3 letters), then add an -S or -ED.', online: 'Online is a race: everyone gets the same letters and you can see each other’s scores as you go. Most points when time runs out wins.' },
        impostor: { tag: '4-6 PLAYERS · PARTY', goal: 'Civilians: find the impostor. Impostor: blend in and don’t get caught.', steps: [
          ['Secret words', 'Everyone gets the same secret word except one player, the impostor, who gets a similar but different word. Nobody knows who it is, not even the impostor!'],
          ['Hints', 'Taking turns, each player types one word as a hint about their word. Clear enough for your team, vague enough to fool the impostor.'],
          ['Vote', 'Everyone votes for who they think the impostor is.'],
          ['Last chance', 'A caught impostor gets one guess at the group’s word. Guess right and they still win! A tied vote lets the impostor escape.']],
          items: () => row([[`<span class="ht-mark">🕵️</span>`, 'Impostor', 'Has a different word'], [`<span class="ht-mark">🗳️</span>`, 'Vote', 'Point at the odd one out']]),
          tip: 'If you think you might be the impostor, copy the style of the other hints.', online: 'Everyone types their hint on their own screen, then everyone votes at the same time. ' + NET_TABLE },
        doodle: { tag: '3-6 PLAYERS · DRAW & GUESS', goal: 'Have fun watching a drawing go wonderfully wrong as it is passed around.', steps: [
          ['Write', 'Everyone writes a silly thing to draw, like "a dragon afraid of fire".'],
          ['Draw', 'You get someone else’s prompt. Draw it as well as you can.'],
          ['Guess', 'Next, you see someone’s drawing (not the words) and write what you think it is.'],
          ['Repeat and reveal', 'Drawing and guessing keep alternating until every chain is done. Then everyone watches each chain from start to finish.']],
          items: () => row([[`<span class="ht-mark">✏️</span>`, 'Draw', 'Pick a colour and a pen size'], [`<span class="ht-mark">💬</span>`, 'Guess', 'Describe what you see']]),
          tip: 'Simple drawings work best. Big shapes, few details.', online: 'Everyone plays at the same time, each on a different chain. It needs at least 3 real players. Solo mode lets you guess doodles by yourself.' },
      };
      return G;
    })();
    // one game's guide (used by the How to Play page and by the pop-up inside a game or room)
    function guideHTML(id) {
      const h = HOWTO[id]; if (!h) return '';
      let items = ''; try { items = h.items ? h.items() : ''; } catch (e) { items = ''; }
      const c = CATALOG.find((x) => x.id === id) || {};
      return `<div class="flex items-center gap-4"><span class="ht-ico big">${GICONS[c.icon] || ''}</span><div><div class="pix text-xs text-muted">THE GOAL</div><div class="text-lg font-extrabold text-bone leading-snug">${h.goal}</div></div></div>
            <ol class="ht-steps">${h.steps.map(([t, x], i) => `<li><span class="step-n">${i + 1}</span><div><div class="font-bold text-bone">${t}</div><div class="text-sm text-muted leading-relaxed">${x}</div></div></li>`).join('')}</ol>
            ${items ? `<div><div class="pix text-xs text-muted mb-2">WHAT THINGS MEAN</div>${items}</div>` : ''}
            <div class="tip text-sm text-muted"><span class="tip-tag bg-amber">TIP</span>${h.tip}</div>
            <div class="tip text-sm text-muted"><span class="tip-tag bg-teal">ONLINE</span>${h.online}</div>`;
    }
    // the guide as a pop-up, so players can read it in a room or mid-game without leaving
    function openGuide(id) {
      id = { navalnet: 'naval', wordduel: HOWTO.wordduel ? 'wordduel' : 'daily' }[id] || id;
      if (!HOWTO[id]) return showToast('No guide for this game yet.', 'info');
      const c = CATALOG.find((x) => x.id === id) || { name: 'Game' };
      let el = document.getElementById('guide-modal');
      if (!el) { el = document.createElement('div'); el.id = 'guide-modal'; el.className = 'hidden fixed inset-0 z-[65] bg-black/80 overflow-y-auto p-4'; document.body.appendChild(el); el.onclick = (e) => { if (e.target === el) el.classList.add('hidden'); }; }
      el.innerHTML = `<div class="win max-w-2xl mx-auto my-4 sm:my-10 overflow-hidden"><div class="winbar amber"><span>HOW TO PLAY · ${esc(c.name.toUpperCase())}</span><button class="pix text-sm" id="guide-x" aria-label="Close">✕</button></div>
        <div class="p-5 space-y-5">${guideHTML(id)}<button class="btn-game btn-graphite w-full py-2.5" id="guide-ok">Got it</button></div></div>`;
      el.classList.remove('hidden');
      el.querySelector('#guide-x').onclick = el.querySelector('#guide-ok').onclick = () => el.classList.add('hidden');
    }
    window.openGuide = openGuide;
    function renderHowTo(openId) {
      const host = document.getElementById('howto'); if (!host) return;
      const live = CATALOG.filter((c) => c.live && HOWTO[c.id]);
      const seen = new Set(), list = live.filter((c) => (seen.has(c.id) ? false : seen.add(c.id))).sort((a, b) => a.name.localeCompare(b.name));
      if (!openId) {
        host.innerHTML = `<div class="ht-grid">${list.map((c) => `<button class="ht-tile" data-ht="${c.id}"><span class="ht-ico">${GICONS[c.icon] || ''}</span><span class="ht-name">${esc(c.name)}</span></button>`).join('')}</div>`;
        host.querySelectorAll('[data-ht]').forEach((b) => { b.onclick = () => { SFX.play('click'); renderHowTo(b.dataset.ht); window.scrollTo({ top: 0, behavior: 'instant' }); }; });
        return;
      }
      const c = list.find((x) => x.id === openId), h = HOWTO[openId]; if (!c || !h) return renderHowTo();
      host.innerHTML = `<div class="space-y-4">
        <button class="btn-game btn-graphite py-1.5 px-4 text-sm" id="ht-back">← All games</button>
        <div class="win overflow-hidden"><div class="winbar amber"><span>${esc(c.name.toUpperCase())}</span><span class="pix text-xs">${h.tag}</span></div>
          <div class="p-5 space-y-5">
            ${guideHTML(openId)}
            <button class="btn-game btn-amber w-full py-3" id="ht-play">Play ${esc(c.name)}</button>
          </div></div></div>`;
      document.getElementById('ht-back').onclick = () => { renderHowTo(); };
      document.getElementById('ht-play').onclick = () => { const fn = c.open; if (GAME_MODS[c.id]) openGame(c.id); else openSetup(c.id); };
    }
