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
        caro: { tag: '1v1 · 15×15 · FIVE IN A ROW', goal: 'Be the first to get five of your marks in a row.', steps: [
          ['Place your mark', 'Tap an empty square. <b class="text-teal">X</b> and <b class="text-coral">O</b> take turns, one mark each. Your last move is lit up in yellow.'],
          ['Five in a row wins', 'Five (or more) of your marks in a straight line, across, down or diagonally, wins the game.'],
          ['Block them', 'When the other player has three in a row with both ends open, or four in a row, put your mark at an end. An open four can no longer be stopped!'],
          ['Vietnamese rule (optional)', 'With this setting on, five in a row with the other player\'s marks at <b>both</b> ends doesn\'t count.'],
          ['Win the match', 'In a "best of 3" or "best of 5", the first to win most of the games wins. Players take turns starting.']],
          items: () => row([[`<span class="ht-mark" style="color:#2DD4BF">✕</span>`, 'X', 'Teal, moves first'], [`<span class="ht-mark" style="color:#FB7185">◯</span>`, 'O', 'Coral']]),
          tip: 'Attack with two threats at once (for example a four and an open three): your opponent can only block one of them.', online: NET_2P },
        thirteen: { tag: '2-4 PLAYERS · SHEDDING', goal: 'Be the first to play all 13 of your cards.', steps: [
          ['Card order', '3 is the lowest card and <b>2 is the highest</b>: 3 4 5 6 7 8 9 10 J Q K A 2. When two cards have the same number, the suit decides: ♠ is lowest, then ♣, ♦, and ♥ is highest.'],
          ['What you can play', 'One card, a pair, three or four of a kind, a <b>straight</b> (3 or more in a row, like 7 8 9; no 2s) or <b>pairs in a row</b> (3 or more pairs, like 5 5 6 6 7 7).'],
          ['Starting', 'In the first hand, whoever has the 3♠ (or the lowest card) starts and must play it. Later hands, the winner of the last hand starts with anything.'],
          ['Beat it or pass', 'Play the same kind with the same number of cards, but higher (a higher pair on a pair, a higher 4-card straight on a 4-card straight). Or pass: then you sit out until the trick is over.'],
          ['Win the trick', 'When everyone else has passed, the last player to play clears the table and starts again with any play.'],
          ['Bombs', 'Three pairs in a row or four of a kind beat a <b>single 2</b>. Four pairs in a row (or four of a kind) beat a <b>pair of 2s</b>. Bombing a 2 takes a point from that player!'],
          ['Places and points', 'The first player out of cards is 1st, the others play on for 2nd and 3rd. Each hand, 1st gets the most points. After the last hand, most points wins.']],
          items: () => row([[card(3, 's'), 'Lowest card', '3 of spades'], [card(2, 'h'), 'Highest card', '2 of hearts'], [card(7, 'c') + card(8, 'd') + card(9, 'h'), 'Straight', 'three or more in a row']]),
          tip: 'Keep your 2s and bombs for the end, and get rid of low single cards early while it is still easy.', online: NET_TABLE },
        trivia: { tag: '1-8 PLAYERS · QUIZ', goal: 'Answer quiz questions right, and fast, to score the most points.', steps: [
          ['Pick the settings', 'In the room, choose the language of the questions (English or Tiếng Việt), a category (or all mixed), how many questions and how hard.'],
          ['Answer', 'Everyone sees the same question at the same time. Tap one of the four answers before the time runs out. Changed your mind? Tap another answer before the question closes (speed counts from your last tap).'],
          ['Score', 'A right answer gets 20 to 100 points: answer straight away for 100, at the last second for 20. Three or more right in a row adds a 🔥 streak bonus. At the end, your place gives you points for the leaderboard, like every game.'],
          ['See who got it', 'After each question the right answer lights up, and you see which answer everyone picked.'],
          ['Win', 'After the last question, the player with the most points wins. Playing alone? Try to beat your best score.']],
          tip: 'Not sure? Rule out the answers that are clearly wrong, then go with your gut. A quick guess scores more than no answer.', online: NET_TABLE },
        funny: { tag: '3-8 PLAYERS · PARTY', goal: 'Write the funniest answers and win the most votes.', steps: [
          ['Make a room', 'Say What!? is played with friends: create a room, send them the link, pick the language of the prompts and press Start. Everyone plays on their own phone or computer.'],
          ['Write', 'Each round you get two prompts, like "A terrible name for a pet goldfish". Type the funniest answer you can think of. One other player gets the same prompt.'],
          ['Vote', 'The two answers to each prompt appear side by side, with no names. Everyone who didn\'t write them taps the funnier one.'],
          ['Points', 'Every vote is 100 points (×2 in round 2), and the winner of each prompt gets a bonus. Win every single vote for a <b class="text-coral">CLEAN SWEEP</b>!'],
          ['Final round', 'Everyone answers the same prompt, then picks a gold, silver and bronze favourite (not their own). Most points at the end wins.']],
          tip: 'Short and surprising beats long and clever. Make the room picture it!', online: 'Say What!? needs at least 3 people and has no computer players (they aren\'t funny enough). Create a room and invite your friends with the link.' },
        werewolf: { tag: '5-12 PLAYERS · SECRET ROLES', goal: 'Village: find and vote out every wolf. Wolves: take the village one by one without being caught.', steps: [
          ['Make a room', 'Werewolf is played with friends: 5 to 12 people, each on their own phone or computer. Create a room, send the link, choose the roles in the room settings and press Start.'],
          ['Your secret role', 'At the start everyone sees their own role card. Keep it secret! Most players are Villagers. A few are Werewolves, and the wolves know who the other wolves are.'],
          ['Night', 'Everyone taps a player. If you are a <b>Werewolf</b>, your pack\'s taps choose who you take tonight (you see your packmates\' picks). If you are the <b>Seer</b>, your tap shows you if that player is a wolf. The <b>Doctor</b>\'s tap protects someone. Villagers tap who they suspect: it does nothing, but nobody can tell who has a power.'],
          ['Morning', 'Everyone finds out who was taken in the night (and their role, if that setting is on). If the Doctor protected the right person, nobody is out!'],
          ['Day: talk', 'Talk it over in the table chat: who is acting strange? Wolves will try to blend in. Press <b>Ready to vote</b> when you are done talking.'],
          ['Day: vote', 'Tap the player you think is a wolf. The player with the most votes is out. A tie means nobody goes out today.'],
          ['Extra roles', 'Turn them on in the room settings (each one is On / Off):<br>• <b>Hunter</b>: when they go out, they take someone with them.<br>• <b>Witch</b>: once per game she can save the wolves\' target, and once she can poison someone.<br>• <b>Cupid</b>: on the first night, picks two players who fall in love. If one lover goes out, the other goes out too, with a broken heart.<br>• <b>Elder</b>: survives the first wolf attack (the second one counts).<br>• <b>Village Fool</b>: if the village votes them out, everyone laughs and they stay, but they can\'t vote any more.<br>• <b>Jester</b>: wins alone if the village votes them out, so they act suspicious on purpose!<br>• <b>Wolf Cub</b>: one of the wolves. If the cub goes out, the angry pack takes two players the next night.<br>• <b>Lycan</b>: on the village side, but the Seer sees them as a wolf.'],
          ['Winning', 'The village wins when every wolf is out. The wolves win when there are as many wolves as everyone else. Players who are out can still watch, and they see every role.']],
          items: () => row([['🐺', 'Werewolf', 'takes someone each night'], ['🔮', 'Seer', 'checks one player each night'], ['💉', 'Doctor', 'protects one player each night'], ['🏹', 'Hunter', 'takes someone when out'], ['🧪', 'Witch', 'one save, one poison'], ['💘', 'Cupid', 'makes two lovers'], ['👴', 'Elder', 'survives one bite'], ['🤪', 'Village Fool', 'survives the vote once'], ['🃏', 'Jester', 'wins if voted out'], ['🐾', 'Wolf Cub', 'revenge: two taken'], ['🌗', 'Lycan', 'looks like a wolf'], ['🙂', 'Villager', 'talks and votes']]),
          tip: 'Wolves: don\'t be too quiet, and don\'t be too loud. Villagers: watch who keeps changing their story, and who votes together.', online: 'Werewolf needs at least 5 people and has no computer players. Create a room and invite your friends with the link. A voice call makes it even more fun!' },
        bumpoff: { tag: '2-6 PLAYERS · BUMPER BOATS', goal: 'Be the last boat floating: knock the others off the pond.', steps: [
          ['Where you start', 'The room picks where the boats start: random spots, evenly around the edge, or all close together in the middle (chaos!).'],
          ['Plan in secret', 'You can see every boat, but not where they will go. Move the mouse and the arrow follows it (on a phone, drag your finger); its tip shows where your boat would stop, so the longer the arrow, the more power. Click, or let go of your finger, to lock your move in (keyboard: arrow keys + Enter). If the time runs out, the arrow you have is used.'],
          ['Reveal', 'When everyone is ready, all the planned arrows appear at once. Now you see who is coming for you, but it is too late to change!'],
          ['GO!', 'All boats move at the same time. Boats that meet bounce off each other: BONK! Anyone pushed off the edge of the pond is out: SPLASH!'],
          ['Next turn', 'Plan again from wherever you stopped. From the 3rd turn the pond gets a little smaller every turn (a room setting).'],
          ['Winning', 'The last boat floating wins the round. The first player to win the set number of rounds wins the match.']],
          tip: 'Aim where someone will be, not where they are. A small sidestep can beat a big charge, and a boat near the edge is an easy target.', online: 'Play with friends in a private room or an online match; computer boats fill the empty seats. Everyone plans at the same time, so it is fast even with 6 players.' },
        tictactoe: { tag: '1v1 · 3×3', goal: 'Get three of your marks in a row.', steps: [
          ['Place your mark', 'Tap an empty square. X goes first in the first game.'],
          ['Take turns', 'Players take turns, one mark each.'],
          ['Win a game', 'Three in a row across, down or diagonally wins the game. A full board with no line is a draw.'],
          ['Win the match', 'In a "best of 3" or "best of 5", the first to win most of the games wins the match. Players take turns starting.']],
          items: () => row([[`<span class="ht-mark" style="color:#FB7185">✕</span>`, 'X', 'Coral'], [`<span class="ht-mark" style="color:#2DD4BF">◯</span>`, 'O', 'Teal']]),
          tip: 'Take the centre if you can. If your opponent takes it, take a corner.', online: NET_2P },
        hedge: { tag: '2-4 PLAYERS · MAZE RACE', goal: 'Be the first to get your pawn to the other side of the garden.', steps: [
          ['Take a step', 'On your turn, tap one of the glowing squares to move there: up, down, left or right.'],
          ['Or plant a hedge', 'Tap a <b>gap between two squares</b>. On a computer the hedge shows as you point at a gap, and one click plants it; on a phone, tap once to see it and again to plant. A gap along a row makes a flat hedge, a gap along a column a standing one.'],
          ['Hedges block the way', 'Nobody can walk through a hedge, so it makes rivals walk around. But you can never shut someone in completely: there must always be a way through.'],
          ['Jumping', 'If another pawn is right next to you, you can jump over it. If there is a hedge behind it, step to the side of it instead.']],
          items: () => row([[`<span style="display:inline-block;width:44px;height:10px;background:#1E7A3E;border:2px solid #050E18"></span>`, 'Hedge', '2 squares long. You have 10 (5 with 4 players)'], [`<span style="display:inline-block;width:30px;height:30px;background:#F7EBC0;box-shadow:inset 0 0 0 3px #2DD4BF"></span>`, 'Glowing square', 'Where you can move now'], [`<span style="display:inline-block;width:40px;height:6px;background:#F5B041"></span>`, 'Coloured edge', 'The side each player is racing to']]),
          tip: 'The panel shows how many steps everyone still needs. Save your hedges for when a rival is close to the finish.', online: NET_TABLE },
        random: { tag: '2-8 PLAYERS · SURPRISE', goal: 'Score the most points over a session of random games.', steps: [
          ['Meet up', 'Open a private room and send the link to your friends, or join an online match. The host can add computer players to fill seats.'],
          ['Choose the session', 'Quickie is 1 game, or play 3 or 5 games in a row. You can keep it to card games, board games or party games.'],
          ['Surprise!', 'When the host presses Start, a random game is picked that fits everyone. A box shows how it is set up before it begins.'],
          ['Points add up', 'Every game gives points: 1st 10, 2nd 6, 3rd 3, everyone else 1. After each game you see the standings, then the next game starts.'],
          ['The champion', 'After the last game, the player with the most points is the champion. Press New session to go again.']],
          tip: 'Not sure how a game works? Every game has its own guide and video, one tap away in its top bar.', online: 'Everyone stays together from game to game: the same people, the same chat. The host starts each next game.' },
        fibber: { tag: '3-5 PLAYERS · BLUFFING', goal: 'Be the first to get rid of all your cards. The others play on for 2nd, 3rd... until one player is left holding cards.', steps: [
          ['A new rank every turn', 'Every turn has a rank, picked at random (never the same one twice in a row). The middle of the table shows which rank it is now.'],
          ['Put cards down', 'On your turn, tap 1 to 4 of your cards and press <b>Put down</b>. They go face down and you say they are that rank. Don’t have any? Bluff!'],
          ['BULLSHIT!', 'After each play, everyone has a few seconds to press <b>BULLSHIT!</b> if they think it was a lie. The cards are turned over.'],
          ['Who picks up', 'If any card was wrong, the player who lied picks up the whole pile. If they were all true, the person who shouted picks it up. Get rid of your last card (without being caught) to win.']],
          items: () => row([[card(7, 'h'), 'A true card', 'Matches the rank everyone is on'], [card(12, 's'), 'A lie', 'Any other card played as that rank'], [`<span class="btn-game btn-coral" style="padding:6px 10px;font-size:12px">BULLSHIT!</span>`, 'Shout', 'Turn the last cards over']]),
          tip: 'There are only four of each rank. If you hold three Sevens and someone says "two Sevens", they must be bluffing.', online: NET_TABLE },
        tunnel: { tag: '3-6 PLAYERS · SECRET TEAMS', goal: 'Diggers: dig a tunnel from the entrance to the gold. Rascals: secretly stop them.', steps: [
          ['Find out your team', 'At the start, a banner tells you if you are a <b class="text-teal">Digger</b> or a <b class="text-coral">Rascal</b>. Nobody else can see it.'],
          ['Play a card', 'On your turn, tap a card in your hand. A tunnel piece goes on a glowing square (↻ turns it around). It must fit the pieces next to it and join the tunnel.'],
          ['Action cards', 'Break a player’s pick or lamp (they can’t dig until it’s fixed), fix one, use a treasure map to secretly look under one of the three goal stones, or cause a cave-in to remove a tunnel piece.'],
          ['Broken pick or lamp?', 'You can’t dig with a broken tool. Play a <b class="text-emerald">Fix card</b> (the same tool with a green ✓): tap it, then tap yourself. A friend can also fix it for you. Your Fix cards glow while you need one.'],
          ['Can’t help? Throw one away', 'Press 🗑 Throw away. You always draw a new card after your turn while the deck lasts.'],
          ['Who wins', 'When the tunnel reaches the gold, the Diggers win. If everyone runs out of cards first, the Rascals win.']],
          items: () => row([[GAME_MODS.tunnel.art.card({ k: 'tun', e: 15 }), 'Tunnel', 'Join it to the tunnel'], [GAME_MODS.tunnel.art.card({ k: 'tun', e: 5, dead: true }), 'Dead end', 'The tunnel stops here'], [GAME_MODS.tunnel.art.card({ k: 'break', tool: 'pick' }), 'Break', 'Stops someone digging'], [GAME_MODS.tunnel.art.card({ k: 'fix', tool: 'pick' }), 'Fix', 'Mends a broken tool'], [GAME_MODS.tunnel.art.card({ k: 'map' }), 'Map', 'Peek under a stone']]),
          tip: 'Watch who plays dead ends and who breaks tools. That is probably a Rascal!', online: NET_TABLE },
        guild: { tag: '3-6 PLAYERS · CHARACTERS & TOWNS', goal: 'Build the town worth the most points.', steps: [
          ['Pick a character', 'Each round, everyone secretly picks one character. The player with the crown 👑 picks first, so the best ones may be gone by your turn.'],
          ['Turns go by number', 'Character 1 plays first, then 2, and so on. On your turn, take <b>2 gold</b> or look at <b>2 building cards and keep 1</b>.'],
          ['Build', 'Tap a building card you can afford, then press <b>Build</b>. You can’t build two of the same. The Architect can build up to 3.'],
          ['Use your power', 'Each character has a power (see below). The Shadow and the Pickpocket name a character by number, without knowing who has it!'],
          ['Why was my turn skipped?', 'If the <b>Shadow</b> named your character, you miss your whole turn. If the <b>Pickpocket</b> named it, all your gold goes to the Pickpocket when your turn starts. The <b>Captain</b> can knock down one of your buildings by paying its cost minus 1.'],
          ['Gold from colours', 'The Monarch (gold), Abbot (blue), Merchant (green) and Captain (red) earn 1 gold for every building of their colour in their town.'],
          ['The end', 'When someone has the target number of buildings, the round is finished. Points: each building’s cost, +3 for all five colours, +4 for finishing first (+2 for the others who finish), +2 for each wonder.']],
          items: () => row([1, 2, 3, 4, 5, 6, 7, 8].map((r) => { const R = GAME_MODS.guild.engine.ROLES[r]; return [`<span class="ht-num" style="--rc:${R.col}">${r}</span>`, R.name, R.txt]; })),
          tip: 'Try to collect buildings in your character’s colour: the Monarch, Abbot, Merchant and Captain earn a gold for each one.', online: NET_TABLE },
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
        colorclash: { tag: '2-4 PLAYERS · MATCH COLOURS', goal: 'Be the first to play all of your cards. The others play on for 2nd, 3rd and 4th place until one player is left holding cards.', steps: [
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
          ['Buy out (setting)', 'If the room turns it on: after paying rent you may make the owner an offer for that plot (at least what it is worth: land + houses). The owner can sell, refuse, or ask for more; then you pay that price or walk away. Not a plot with a hotel, and not one from a full colour set.'],
          ['START', 'Every time you pass or land on START you collect <b>$200</b>.'],
          ['Doubles', 'Roll the same number on both dice and you move, then roll again. Roll doubles <b>three times in a row</b> and you go straight to Jail (no $200).'],
          ['Jail', 'You go to Jail by landing on Go to Jail, by a card, or by 3 doubles. In Jail you can <b>pay $50</b>, use a <b>Get Out of Jail Free</b> card, or try to <b>roll doubles</b> (up to 3 turns; after the third miss you pay $50 and move). Just landing on the Jail square is only “visiting”.'],
          ['Surprise and Mystery cards', 'Land on these squares to draw a card: it may pay you, make you pay, move you, or send you to Jail.'],
          ['Railroads and utilities', 'Rent for railroads goes up with every railroad the owner has. Utilities charge a multiple of your dice roll.'],
          ['Taxes and Free Parking', 'Tax squares make you pay the bank. With the Free Parking jackpot turned on, taxes and fines pile up in the middle and whoever lands on Free Parking takes them all.'],
          ['Short on cash?', 'Houses are sold back for half their price and properties are mortgaged for you automatically (a mortgaged property charges no rent). If you still can’t pay, you are bankrupt and out.'],
          ['Tap to look', 'Tap any property on the board to see its card: rent with houses, house cost and mortgage value. Tap a pawn to see where that player is standing.']],
          items: () => row([[sq('#FB7185') + sq('#FB7185') + sq('#FB7185'), 'Colour set', 'Own all of one colour'], [`<span class="ht-mark">🏠</span>`, 'House', 'More rent'], [`<span class="ht-mark">🏨</span>`, 'Hotel', 'The most rent'], [`<span class="ht-mark">🎲</span>`, 'Doubles', 'Roll again']]),
          tip: 'Railroads and the orange and red sets are great value. Build evenly across a set.', online: NET_TABLE },
        isles: { tag: '3-4 PLAYERS · BUILD AN ISLAND', goal: 'Be the first to reach the target points by building villages, towns and roads.', steps: [
          ['Start', 'Everyone places two villages and two roads. Corners touching numbers that come up often (6 and 8) are best.'],
          ['Roll', 'Each turn, roll the dice. Every land tile with that number gives its resource to anyone with a village (1 card) or town (2 cards) on its corners.'],
          ['Build', 'Spend resources: <b>Road</b> (Timber + Clay), <b>Village</b> (Timber + Clay + Wool + Grain), <b>Town</b> (2 Grain + 3 Stone, upgrades a village).'],
          ['Where you can build', 'Roads join your own roads or buildings. A village goes on a free corner at the end of your road, and <b>no other village may be on a neighbouring corner</b> (one empty corner between villages). A grey button tells you why you can’t build yet.'],
          ['Trade', 'Trade 4 of the same card for any 1 with the bank, or offer a deal to the other players.'],
          ['The Bandit', 'A roll of 7 pays nobody. Anyone holding <b>more than 7 cards loses half</b> of them. Then the Bandit moves to a land: that land pays nothing until the Bandit moves again, and its owner loses one random card.'],
          ['Longest Road', 'The first player with an unbroken road of <b>5 or more</b> pieces gets Longest Road (2 points). Someone with a longer road takes it from them.'],
          ['Points', 'Village = 1 point, Town = 2 points, Longest Road = 2 points. First to the target wins.']],
          items: () => row([[sq('#1F6B42', '🌲'), 'Timber', 'From forests'], [sq('#9C4630', '🧱'), 'Clay', 'From clay pits'], [sq('#9BC97A', '🐑'), 'Wool', 'From pastures'], [sq('#E9C352', '🌾'), 'Grain', 'From fields'], [sq('#8E9CAD', '⛰️'), 'Stone', 'From mountains']]),
          tip: 'Settle next to different resources so you can always build something.', online: NET_TABLE },
        manor: { tag: '3-6 PLAYERS · WHODUNIT', goal: 'Be the first to work out who did it, with what, and in which room.', steps: [
          ['The secret', 'One suspect, one tool and one room are hidden in an envelope. The other cards are dealt out, so any card in your hand can’t be the answer.'],
          ['Walk', 'On your turn, walk to a room next to yours (corner rooms have secret passages to the opposite corner).'],
          ['Suggest', 'Name a suspect and a tool "in this room". The next player who holds one of those cards must secretly show you one.'],
          ['Take notes', 'Your notebook ticks cards you have seen. Cross off everything that can’t be the answer.'],
          ['Who shows a card?', 'Players are asked one by one, going round the table. The first one who holds the suspect, the tool or the room shows you <b>one</b> of them (only you see it). If nobody can show anything, those cards are either in the envelope or in your own hand.'],
          ['Accuse', 'When you are sure, accuse! Right and you win. Wrong and you are out: you can’t move or win any more, but you still show cards when asked.']],
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
          ['Vote', 'Everyone votes for who they think the impostor is. If the group votes out someone who is NOT the impostor, that player is out and a new round of hints begins.'],
          ['Until 2 are left', 'Keep going round after round. If only 2 players are left, the impostor wins. Two tied votes in a row also let the impostor escape.'],
          ['Last chance', 'A caught impostor gets one guess at the group’s word. Guess right and they still win!']],
          items: () => row([[`<span class="ht-mark">🕵️</span>`, 'Impostor', 'Has a different word'], [`<span class="ht-mark">🗳️</span>`, 'Vote', 'Point at the odd one out']]),
          tip: 'If you think you might be the impostor, copy the style of the other hints.', online: 'Everyone types their hint on their own screen, then everyone votes at the same time. ' + NET_TABLE },
        doodle: { tag: '2-8 PLAYERS · DRAW & GUESS', goal: 'Guess other players’ drawings fast, and draw well so they can guess yours.', steps: [
          ['Pick a word', 'When it’s your turn to draw, choose an <b>easy</b>, <b>medium</b> or <b>hard</b> word. Harder words are worth more points (×1, ×1.5, ×2). Only you can see it.'],
          ['Draw it', 'Draw on the white board. Pick a colour and a pen size; Undo and Clear help. No letters or numbers!'],
          ['Everyone guesses', 'The others type guesses in the box on the right. A right guess gets points: the faster, the more. Wrong guesses show in the list for everyone.'],
          ['Hints', 'Guessers see the level and a dash for every letter. When time runs low, some letters appear. Accents don’t matter: “meo” counts for “mèo”.'],
          ['Winning', 'Everyone draws once per round. After the last round, the most points wins.']],
          items: () => row([[`<span class="ht-mark">✏️</span>`, 'Drawer', 'Gets points when people guess'], [`<span class="ht-mark">💬</span>`, 'Guessers', 'Faster guesses score more'], [`<span class="pix" style="letter-spacing:3px">_ _ T _</span>`, 'Hint', 'Letters appear as time runs out']]),
          tip: 'Draw the most important shape first, big and simple. Details can wait.', online: 'Everyone sees the drawing live as it’s made. It’s played with real people only (no computer players): create a room and send your friends the link. The room can pick English or Vietnamese words.' },
      };
      return G;
    })();
    // one game's guide (used by the How to Play page and by the pop-up inside a game or room)
    function guideHTML(id) {
      let h = HOWTO[id]; if (!h) return '';
      if (typeof LANG !== 'undefined' && LANG.code === 'vi' && window.HOWTO_VI && HOWTO_VI[id]) h = Object.assign({}, h, HOWTO_VI[id]);   // Vietnamese guide
      // no emoji in the written guide (Inna, Nov 2026); the pictures under "what things mean" keep their art
      const ne = (t) => String(t || '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '').replace(/ {2,}/g, ' ').trim();
      h = Object.assign({}, h, { goal: ne(h.goal), tip: ne(h.tip), online: ne(h.online), steps: (h.steps || []).map(([t, x]) => [ne(t), ne(x)]) });
      let items = ''; try { items = h.items ? h.items() : ''; } catch (e) { items = ''; }
      const c = CATALOG.find((x) => x.id === id) || {};
      const vi = typeof LANG !== 'undefined' && LANG.code === 'vi';
      return `<button class="btn-game btn-teal w-full py-3 text-base hv-btn" onclick="playHowTo('${id}')">▶ ${vi ? 'Xem cách chơi (có giọng đọc)' : 'Watch how to play (with voice)'}</button>
            <div class="flex items-center gap-4"><span class="ht-ico big">${GICONS[c.icon] || ''}</span><div><div class="pix text-xs text-muted">THE GOAL</div><div class="text-lg font-extrabold text-bone leading-snug">${h.goal}</div></div></div>
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
