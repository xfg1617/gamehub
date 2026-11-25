    /* =========================================================================
       FIND THE IMPOSTOR: everyone has the same secret word except one. Give hints, then vote.
       ========================================================================= */
    (function impostorGame() {
      // [wordA, [hints], wordB, [hints]]
      const SETS = {
        Food: { gen: ['tasty', 'hungry', 'dinner', 'delicious', 'kitchen', 'yummy', 'eat'], pairs: [
          ['Pizza', ['cheese', 'slice', 'oven', 'pepperoni', 'delivery', 'round', 'crust'], 'Burger', ['bun', 'patty', 'grill', 'fries', 'ketchup', 'fast food', 'beef']],
          ['Coffee', ['morning', 'caffeine', 'bean', 'mug', 'espresso', 'cafe', 'bitter'], 'Tea', ['leaf', 'cup', 'herbal', 'kettle', 'green', 'British', 'steep']],
          ['Ice cream', ['cone', 'scoop', 'cold', 'vanilla', 'sweet', 'melts', 'summer'], 'Cake', ['birthday', 'candles', 'frosting', 'bake', 'slice', 'sweet', 'party']],
          ['Banana', ['yellow', 'peel', 'monkey', 'curved', 'potassium', 'smoothie', 'fruit'], 'Apple', ['red', 'tree', 'crunchy', 'doctor', 'pie', 'core', 'fruit']],
          ['Sushi', ['rice', 'Japan', 'raw fish', 'chopsticks', 'roll', 'seaweed', 'wasabi'], 'Taco', ['Mexico', 'shell', 'salsa', 'Tuesday', 'tortilla', 'spicy', 'folded']],
          ['Pancakes', ['syrup', 'breakfast', 'stack', 'flip', 'butter', 'fluffy', 'griddle'], 'Waffles', ['squares', 'syrup', 'breakfast', 'crispy', 'iron', 'Belgian', 'toppings']],
          ['Fries', ['salty', 'potato', 'crispy', 'ketchup', 'golden', 'side', 'dish'], 'Chips', ['bag', 'crunchy', 'potato', 'snack', 'salty', 'party', 'thin']],
          ['Popcorn', ['movie', 'butter', 'pop', 'kernels', 'microwave', 'salty', 'bucket'], 'Pretzel', ['twisted', 'salty', 'knot', 'dough', 'mall', 'baked', 'mustard']],
          ['Hot dog', ['bun', 'sausage', 'mustard', 'ballpark', 'grill', 'relish', 'stand'], 'Sandwich', ['bread', 'lunch', 'ham', 'layers', 'deli', 'toast', 'cut']],
          ['Chocolate', ['cocoa', 'sweet', 'bar', 'melt', 'brown', 'candy', 'dark'], 'Candy', ['sweet', 'sugar', 'wrapper', 'Halloween', 'lollipop', 'colorful', 'gummy']],
          ['Soup', ['bowl', 'spoon', 'hot', 'broth', 'noodles', 'warm', 'chicken'], 'Salad', ['lettuce', 'bowl', 'dressing', 'green', 'healthy', 'fresh', 'crunchy']],
        ] },
        Animals: { gen: ['furry', 'pet', 'wild', 'tail', 'zoo', 'animal', 'legs'], pairs: [
          ['Dog', ['bark', 'loyal', 'walk', 'fetch', 'bone', 'puppy', 'leash'], 'Cat', ['meow', 'purr', 'whiskers', 'nap', 'claws', 'kitten', 'litter']],
          ['Lion', ['mane', 'roar', 'king', 'savanna', 'pride', 'big cat', 'jungle'], 'Tiger', ['stripes', 'orange', 'Asia', 'roar', 'big cat', 'fierce', 'jungle']],
          ['Dolphin', ['smart', 'ocean', 'jump', 'clicks', 'swim', 'pod', 'flipper'], 'Shark', ['fin', 'teeth', 'ocean', 'jaws', 'swim', 'predator', 'bite']],
          ['Eagle', ['wings', 'soar', 'talons', 'America', 'nest', 'sharp eyes', 'bird'], 'Owl', ['night', 'hoot', 'wise', 'feathers', 'nest', 'wings', 'bird']],
          ['Horse', ['ride', 'saddle', 'gallop', 'hooves', 'farm', 'mane', 'stable'], 'Zebra', ['stripes', 'Africa', 'black', 'and', 'white', 'savanna', 'herd', 'wild']],
          ['Penguin', ['ice', 'waddle', 'Antarctica', 'tuxedo', 'cold', 'swim', 'flock'], 'Polar bear', ['ice', 'Arctic', 'white', 'fur', 'cold', 'snow', 'seal']],
          ['Frog', ['green', 'jump', 'pond', 'croak', 'lily', 'pad', 'tadpole', 'slimy'], 'Turtle', ['shell', 'slow', 'pond', 'swim', 'old', 'green', 'reptile']],
          ['Bee', ['honey', 'buzz', 'hive', 'sting', 'flower', 'yellow', 'queen'], 'Butterfly', ['wings', 'flower', 'colorful', 'caterpillar', 'flutter', 'garden', 'pretty']],
          ['Rabbit', ['ears', 'hop', 'carrot', 'bunny', 'fluffy', 'burrow', 'fast'], 'Squirrel', ['nuts', 'tree', 'tail', 'park', 'acorn', 'climb', 'fluffy']],
          ['Monkey', ['banana', 'climb', 'jungle', 'tail', 'swing', 'funny', 'tree'], 'Gorilla', ['big', 'strong', 'jungle', 'chest', 'silverback', 'ape', 'forest']],
        ] },
        Places: { gen: ['travel', 'visit', 'trip', 'tourists', 'map', 'big', 'famous'], pairs: [
          ['Beach', ['sand', 'waves', 'sunscreen', 'towel', 'shells', 'summer', 'surf'], 'Desert', ['dry', 'cactus', 'dunes', 'camel', 'heat', 'sand', 'oasis']],
          ['Library', ['books', 'quiet', 'shelves', 'borrow', 'read', 'librarian', 'study'], 'Museum', ['art', 'exhibit', 'history', 'tickets', 'quiet', 'statues', 'tour']],
          ['Hospital', ['doctor', 'nurse', 'bed', 'emergency', 'sick', 'white', 'surgery'], 'School', ['teacher', 'class', 'homework', 'bell', 'desk', 'students', 'books']],
          ['New York', ['skyscrapers', 'taxi', 'Broadway', 'Liberty', 'busy', 'subway', 'pizza'], 'Paris', ['tower', 'France', 'romantic', 'baguette', 'Seine', 'fashion', 'Louvre']],
          ['Airport', ['planes', 'gate', 'luggage', 'security', 'flight', 'travel', 'terminal'], 'Train station', ['platform', 'tracks', 'ticket', 'travel', 'schedule', 'rails', 'conductor']],
          ['Zoo', ['animals', 'cages', 'visit', 'lions', 'tickets', 'family', 'park'], 'Aquarium', ['fish', 'tank', 'sharks', 'glass', 'water', 'visit', 'jellyfish']],
          ['Mall', ['stores', 'shopping', 'food', 'court', 'escalator', 'parking', 'clothes'], 'Supermarket', ['groceries', 'cart', 'aisle', 'checkout', 'food', 'milk', 'cashier']],
          ['Castle', ['king', 'tower', 'medieval', 'walls', 'knights', 'moat', 'stone'], 'Palace', ['royal', 'queen', 'gold', 'rich', 'gardens', 'luxury', 'throne']],
          ['Gym', ['workout', 'weights', 'treadmill', 'sweat', 'muscles', 'trainer', 'fitness'], 'Park', ['trees', 'grass', 'bench', 'walk', 'dog', 'picnic', 'swings']],
          ['Las Vegas', ['casino', 'lights', 'desert', 'shows', 'gambling', 'strip', 'neon'], 'Hollywood', ['movies', 'stars', 'sign', 'California', 'actors', 'fame', 'studios']],
        ] },
        Objects: { gen: ['useful', 'everyday', 'home', 'carry', 'object', 'buy', 'use'], pairs: [
          ['Phone', ['call', 'screen', 'text', 'apps', 'charger', 'pocket', 'ring'], 'Laptop', ['keyboard', 'screen', 'work', 'battery', 'desk', 'typing', 'wifi']],
          ['Umbrella', ['rain', 'handle', 'open', 'wet', 'storm', 'protect', 'cover'], 'Sunglasses', ['sun', 'lenses', 'cool', 'summer', 'face', 'shade', 'beach']],
          ['Chair', ['sit', 'legs', 'back', 'table', 'wood', 'four', 'seat'], 'Sofa', ['cushion', 'living room', 'lounge', 'couch', 'sit', 'TV', 'comfy']],
          ['Guitar', ['strings', 'strum', 'band', 'chords', 'pick', 'acoustic', 'rock'], 'Piano', ['keys', 'black and white', 'pedal', 'grand', 'classical', 'notes', 'lessons']],
          ['Clock', ['time', 'hands', 'tick', 'wall', 'alarm', 'hour', 'minute'], 'Watch', ['time', 'wrist', 'strap', 'tick', 'hour', 'band', 'gift']],
          ['Mirror', ['reflection', 'glass', 'bathroom', 'look', 'face', 'selfie', 'wall'], 'Window', ['glass', 'view', 'open', 'curtain', 'light', 'house', 'frame']],
          ['Pillow', ['sleep', 'bed', 'soft', 'head', 'fluffy', 'case', 'night'], 'Blanket', ['warm', 'bed', 'cozy', 'cover', 'soft', 'winter', 'night']],
          ['Backpack', ['school', 'straps', 'carry', 'books', 'zipper', 'hiking', 'bag'], 'Suitcase', ['travel', 'wheels', 'luggage', 'pack', 'airport', 'clothes', 'trip']],
          ['Toothbrush', ['teeth', 'bristles', 'morning', 'brush', 'bathroom', 'clean', 'paste'], 'Comb', ['hair', 'teeth', 'plastic', 'brush', 'bathroom', 'neat', 'style']],
          ['Candle', ['wax', 'flame', 'light', 'birthday', 'smell', 'melt', 'match'], 'Lamp', ['light', 'bulb', 'switch', 'desk', 'night', 'shade', 'lamp', 'post']],
        ] },
        Sports: { gen: ['team', 'score', 'play', 'game', 'win', 'fans', 'coach'], pairs: [
          ['Soccer', ['goal', 'kick', 'pitch', 'World Cup', 'penalty', 'cleats', 'goalie'], 'Basketball', ['hoop', 'dunk', 'court', 'dribble', 'NBA', 'three-pointer', 'sneakers']],
          ['Tennis', ['racket', 'net', 'serve', 'court', 'Wimbledon', 'love', 'match'], 'Golf', ['club', 'hole', 'green', 'caddie', 'par', 'tee', 'course']],
          ['Swimming', ['pool', 'laps', 'goggles', 'stroke', 'water', 'dive', 'lane'], 'Running', ['track', 'marathon', 'shoes', 'sprint', 'race', 'jog', 'miles']],
          ['Baseball', ['bat', 'glove', 'home', 'run', 'pitcher', 'diamond', 'inning', 'base'], 'Cricket', ['bat', 'wicket', 'England', 'bowler', 'pitch', 'runs', 'innings']],
          ['Skiing', ['snow', 'mountain', 'poles', 'slope', 'winter', 'lift', 'goggles'], 'Snowboarding', ['board', 'snow', 'mountain', 'tricks', 'winter', 'slope', 'jump']],
          ['Boxing', ['gloves', 'ring', 'punch', 'knockout', 'round', 'fight', 'belt'], 'Wrestling', ['mat', 'pin', 'grab', 'throw', 'match', 'ring', 'champion']],
          ['Football', ['touchdown', 'helmet', 'quarterback', 'Super', 'Bowl', 'tackle', 'field', 'pass'], 'Rugby', ['scrum', 'try', 'oval', 'ball', 'tackle', 'field', 'team']],
          ['Bowling', ['pins', 'strike', 'lane', 'ball', 'shoes', 'spare', 'alley'], 'Darts', ['board', 'bullseye', 'throw', 'pub', 'aim', 'points', 'target']],
        ] },
        Jobs: { gen: ['work', 'career', 'uniform', 'job', 'paid', 'boss', 'office'], pairs: [
          ['Doctor', ['stethoscope', 'hospital', 'patients', 'white coat', 'medicine', 'checkup', 'surgery'], 'Teacher', ['class', 'homework', 'board', 'students', 'school', 'grades', 'chalk']],
          ['Chef', ['kitchen', 'knife', 'recipe', 'restaurant', 'hat', 'cook', 'menu'], 'Farmer', ['field', 'crops', 'tractor', 'barn', 'harvest', 'soil', 'cows']],
          ['Pilot', ['plane', 'cockpit', 'sky', 'captain', 'landing', 'airport', 'wings'], 'Astronaut', ['space', 'rocket', 'moon', 'NASA', 'suit', 'orbit', 'float']],
          ['Firefighter', ['fire', 'truck', 'hose', 'hero', 'helmet', 'ladder', 'rescue'], 'Police officer', ['badge', 'car', 'siren', 'law', 'arrest', 'uniform', 'patrol']],
          ['Dentist', ['teeth', 'drill', 'chair', 'cavity', 'braces', 'checkup', 'smile'], 'Barber', ['haircut', 'scissors', 'chair', 'razor', 'shave', 'salon', 'trim']],
          ['Singer', ['voice', 'microphone', 'songs', 'concert', 'stage', 'band', 'famous'], 'Dancer', ['moves', 'stage', 'music', 'ballet', 'steps', 'rhythm', 'studio']],
          ['Mail carrier', ['letters', 'packages', 'truck', 'route', 'mailbox', 'uniform', 'deliver'], 'Delivery driver', ['packages', 'van', 'boxes', 'route', 'doorstep', 'app', 'deliver']],
          ['Scientist', ['lab', 'experiment', 'coat', 'research', 'microscope', 'test', 'discovery'], 'Inventor', ['idea', 'machine', 'create', 'patent', 'build', 'gadget', 'workshop']],
        ] },
        Fun: { gen: ['entertainment', 'popular', 'fun', 'watch', 'enjoy', 'weekend', 'story'], pairs: [
          ['Movie', ['cinema', 'popcorn', 'actor', 'screen', 'ticket', 'director', 'trailer'], 'Video game', ['controller', 'level', 'console', 'player', 'score', 'boss', 'online']],
          ['Birthday', ['cake', 'candles', 'gift', 'party', 'age', 'balloons', 'song'], 'Wedding', ['bride', 'ring', 'dress', 'vows', 'cake', 'dance', 'married']],
          ['Camping', ['tent', 'fire', 'stars', 'woods', 'sleeping bag', 'marshmallows', 'outdoors'], 'Hotel', ['room', 'bed', 'lobby', 'key', 'stay', 'reception', 'pool']],
          ['Halloween', ['costume', 'candy', 'pumpkin', 'scary', 'trick', 'or', 'treat', 'ghost', 'October'], 'Christmas', ['tree', 'presents', 'Santa', 'December', 'snow', 'lights', 'family']],
          ['Concert', ['music', 'stage', 'band', 'tickets', 'crowd', 'loud', 'lights'], 'Festival', ['music', 'tents', 'crowd', 'summer', 'food', 'stages', 'outdoors']],
          ['Roller coaster', ['loop', 'scream', 'fast', 'ride', 'theme', 'park', 'drop', 'thrill'], 'Ferris wheel', ['slow', 'ride', 'view', 'tall', 'round', 'park', 'lights']],
          ['Board game', ['dice', 'pieces', 'table', 'family', 'turns', 'board', 'rules'], 'Card game', ['deck', 'shuffle', 'deal', 'hand', 'table', 'players', 'poker']],
          ['Karaoke', ['sing', 'microphone', 'lyrics', 'screen', 'party', 'songs', 'bar'], 'Dance party', ['music', 'dance', 'floor', 'DJ', 'lights', 'party', 'moves']],
        ] },
        Nature: { gen: ['outside', 'natural', 'weather', 'sky', 'earth', 'wild', 'beautiful'], pairs: [
          ['Snow', ['white', 'cold', 'winter', 'flakes', 'sled', 'melt', 'snowman'], 'Rain', ['wet', 'drops', 'umbrella', 'cloud', 'puddle', 'storm', 'gray']],
          ['Volcano', ['lava', 'erupt', 'hot', 'ash', 'mountain', 'magma', 'Hawaii'], 'Earthquake', ['shake', 'tremor', 'crack', 'fault', 'ground', 'scale', 'rumble']],
          ['Moon', ['night', 'craters', 'full', 'orbit', 'glow', 'phases', 'tides'], 'Sun', ['hot', 'day', 'bright', 'star', 'rays', 'sunrise', 'yellow']],
          ['Ocean', ['waves', 'salty', 'deep', 'blue', 'fish', 'huge', 'tide'], 'Lake', ['fresh', 'water', 'calm', 'boat', 'fishing', 'shore', 'swim']],
          ['Mountain', ['peak', 'climb', 'snow', 'tall', 'hike', 'rocks', 'summit'], 'Hill', ['small', 'climb', 'grass', 'slope', 'roll', 'green', 'walk']],
          ['Forest', ['trees', 'woods', 'green', 'animals', 'hike', 'shade', 'leaves'], 'Jungle', ['rainforest', 'vines', 'hot', 'humid', 'monkeys', 'dense', 'wild']],
          ['Thunder', ['loud', 'storm', 'boom', 'rumble', 'sky', 'scary', 'clouds'], 'Lightning', ['flash', 'storm', 'bright', 'bolt', 'sky', 'electric', 'strike']],
          ['Rainbow', ['colors', 'sky', 'after', 'rain', 'arc', 'pot', 'of', 'gold', 'seven'], 'Sunset', ['evening', 'orange', 'sky', 'sun', 'goes', 'down', 'beach', 'pink']],
        ] },
        'Things in a house': { gen: ['home', 'room', 'house', 'family', 'inside', 'clean', 'furniture'], pairs: [
          ['Kitchen', ['cook', 'fridge', 'stove', 'sink', 'food', 'oven', 'dishes'], 'Bathroom', ['shower', 'toilet', 'sink', 'towel', 'mirror', 'bath', 'soap']],
          ['Bed', ['sleep', 'pillow', 'sheets', 'bedroom', 'night', 'mattress', 'dream'], 'Couch', ['sit', 'living', 'room', 'TV', 'cushions', 'relax', 'lounge', 'nap']],
          ['Fridge', ['cold', 'food', 'milk', 'door', 'kitchen', 'ice', 'magnets'], 'Oven', ['hot', 'bake', 'cook', 'kitchen', 'pizza', 'door', 'timer']],
          ['Garage', ['car', 'tools', 'door', 'park', 'bikes', 'storage', 'cement'], 'Basement', ['downstairs', 'dark', 'storage', 'stairs', 'cold', 'laundry', 'cellar']],
          ['Television', ['shows', 'remote', 'screen', 'channels', 'watch', 'couch', 'news'], 'Computer', ['keyboard', 'mouse', 'internet', 'screen', 'work', 'games', 'email']],
        ] },
        'Transport': { gen: ['travel', 'ride', 'go', 'fast', 'seats', 'trip', 'move'], pairs: [
          ['Car', ['drive', 'wheels', 'road', 'gas', 'seatbelt', 'park', 'traffic'], 'Truck', ['big', 'wheels', 'road', 'cargo', 'drive', 'heavy', 'delivery']],
          ['Bicycle', ['pedal', 'two', 'wheels', 'helmet', 'ride', 'chain', 'bell'], 'Motorcycle', ['two', 'wheels', 'engine', 'fast', 'helmet', 'loud', 'ride']],
          ['Airplane', ['fly', 'wings', 'pilot', 'airport', 'sky', 'seats', 'takeoff'], 'Helicopter', ['blades', 'hover', 'fly', 'rotor', 'rescue', 'noisy', 'pilot']],
          ['Boat', ['water', 'sail', 'fish', 'lake', 'float', 'harbor', 'captain'], 'Submarine', ['underwater', 'deep', 'navy', 'periscope', 'ocean', 'dive', 'sealed']],
          ['Bus', ['stop', 'seats', 'route', 'driver', 'city', 'ticket', 'school'], 'Subway', ['underground', 'train', 'city', 'station', 'tunnel', 'map', 'rush', 'hour']],
        ] },
      };
      const NAMES = [['Mia', '🐙'], ['Kai', '🐸'], ['Zoe', '🦉'], ['Leo', '🐯'], ['Ava', '🦋']];
      const ABORT = { a: 1 };
      let G = null;
      const $ = (id) => document.getElementById(id);
      const lc = (s) => String(s).trim().toLowerCase();

      function pickRound(R) {
        R = R || { pick, shuffle, random: Math.random };
        const cat = R.pick(Object.keys(SETS)); const set = SETS[cat]; const pr = R.pick(set.pairs);
        const flip = R.random() < 0.5;
        const okH = (h) => h.filter((x) => !/^(or|of|and|the|a|to|after|goes|down|up|on|in)$/i.test(x));   // no filler words as hints
        const civ = flip ? { w: pr[2], h: okH(pr[3]) } : { w: pr[0], h: okH(pr[1]) }, imp = flip ? { w: pr[0], h: okH(pr[1]) } : { w: pr[2], h: okH(pr[3]) };
        const decoys = R.shuffle(set.pairs.flatMap((q) => [q[0], q[2]]).filter((w) => w !== civ.w && w !== imp.w)).slice(0, 4);
        return { cat, gen: set.gen, civ, imp, options: R.shuffle([civ.w, imp.w, ...decoys].slice(0, 6)) };
      }

      function open(root) {
        const body = gameShell(root, mod, '', 'max-w-[860px] mx-auto');
        setupScreen(body, mod, [
          { key: 'n', label: 'PLAYERS', def: 5, choices: [[4, '4 players'], [5, '5 players'], [6, '6 players']] },
          { key: 'clock', label: 'HINT TIMER', def: 30, choices: [[0, 'Off'], [20, '20 s'], [30, '30 s'], [45, '45 s']] },
        ], (sel) => start(body, sel, npLocal([{ name: profile.username, avatar: profile.avatar }].concat(NAMES.slice(0, +sel.n - 1).map(([name, avatar]) => ({ bot: true, name, avatar }))), sel)));
      }

      // seats come from the table (S): on this device seat 0 is you; online every screen has its own seat (G.me)
      function start(body, sel, S) {
        const n = S.n, round = pickRound(S.rng);
        const players = S.seats.map((x) => ({ name: x.name, av: x.avatar }));
        const impIdx = S.rng.rnd(n);
        players.forEach((p, i) => { p.imp = i === impIdx; p.word = p.imp ? round.imp.w : round.civ.w; p.hints = p.imp ? round.imp.h : round.civ.h; });
        G = { S, me: S.online ? S.me : 0, step: 0, body, players, round, secs: +sel.clock, impIdx, order: S.rng.shuffle(players.map((_, i) => i)), said: {}, tok: ++GT.cur, over: false };
        body.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_230px] gap-5 items-start"><div id="im-main" class="space-y-4 min-w-0"></div>
          <div class="space-y-3"><div class="win overflow-hidden"><div class="winbar amber"><span id="im-phase">ROLES</span></div><div class="p-3"><div id="im-clock"></div></div></div>
          <div class="win p-3"><div class="pix text-xs text-muted mb-1">CATEGORY</div><div class="font-display font-extrabold text-lg">${round.cat}</div><div class="pix text-xs text-muted mt-3 mb-1">YOUR WORD</div><div id="im-myword" class="pix text-lg text-amber">???</div></div></div></div>`;
        G.clock = makeClock($('im-clock'));
        G.clock.idle('Get ready', '—');
        S.track();
        S.onLeft = (a) => { if (!G) return; const q = G.players[a.s]; q.name += ' (CPU)'; q.av = '🤖'; };
        npBar('');
        flow().catch((e) => { if (e !== ABORT) throw e; });
      }
      async function W(ms) { const t = G && G.tok; await gSleep(ms); if (!G || G.tok !== t) throw ABORT; }
      const phase = (t) => { const e = $('im-phase'); if (e) e.textContent = t; };
      const main = (h) => { $('im-main').innerHTML = h; };
      const P = (i) => G.players[i];
      const ME = () => G.players[G.me];
      async function decide(i, kind, ui, botFn, ms) {
        const S = G.S, k = ++G.step, t = G.tok;
        if (S.mine(i) && ui) Promise.resolve(ui()).then((v) => { if (G && G.tok === t && v !== undefined) S.act({ t: kind, s: i, k, v }); });
        const a = await S.ask(i, () => ({ t: kind, k, v: botFn() }), ms, (x) => x.s === i && x.t === kind && x.k === k);
        if (!G || G.tok !== t) throw ABORT;
        return a.v;
      }
      const seatLine = (p, i, extra = '') => `<div class="flex items-start gap-3 ${extra}"><span class="avatar-tile w-10 h-10 text-xl shrink-0">${p.av}</span><div class="min-w-0"><div class="text-xs text-muted font-bold">${esc(p.name)}${i === G.me ? ' (you)' : ''}</div>`;

      async function flow() {
        // 1) reveal
        phase('YOUR WORD');
        await new Promise((res) => {
          main(`<div class="win max-w-md mx-auto overflow-hidden"><div class="winbar teal"><span>SECRET WORD</span></div><div class="p-6 text-center space-y-4">
            <p class="text-sm text-muted">One of the ${G.players.length} players has a <b class="text-bone">different</b> word. It could be you! Everybody else has the same word.</p>
            <button id="im-flip" class="w-full" style="background:#0A1624;border:4px solid var(--ink);padding:2rem 1rem;cursor:pointer"><span class="pix text-xs text-muted block mb-2">TAP TO REVEAL</span><span id="im-w" class="pix text-3xl text-amber">? ? ?</span></button>
            <button id="im-ready" class="btn-game btn-amber w-full py-3" disabled style="opacity:.5">I'm ready</button></div></div>`);
          let shown = false;
          $('im-flip').onclick = () => { shown = !shown; $('im-w').textContent = shown ? ME().word.toUpperCase() : '? ? ?'; $('im-myword').textContent = ME().word.toUpperCase(); $('im-ready').disabled = false; $('im-ready').style.opacity = 1; SFX.play('reveal'); };
          $('im-ready').onclick = () => res();
        });
        // 2) rounds of hints and a vote. A wrongly voted-out player leaves the game; play goes on until the impostor is
        //    caught or only 2 players are left (then the impostor wins). Inna, Nov 2026.
        G.outs = []; G.rounds = []; G.ties = 0;
        let res = null;
        while (!res) res = await oneRound();
        phase('RESULT');
        finish(res.votes, res.accused, res.caught, res.guessed, res.guessOk);
      }
      const alive = () => G.order.filter((i) => !G.outs.includes(i));
      // everything a player has said so far, oldest first
      const allSaid = (i) => G.rounds.map((r) => r[i]).filter((h) => h !== undefined);
      async function oneRound() {
        G.said = {}; G.rounds.push(G.said); const rn = G.rounds.length;
        phase(rn > 1 ? `HINTS · ROUND ${rn}` : 'HINTS');
        const past = (i) => G.rounds.slice(0, -1).map((r) => r[i]).filter((h) => h !== undefined);
        const bubbles = () => `<div class="space-y-3">${G.order.map((i) => { const p = P(i), h = G.said[i], out = G.outs.includes(i), pv = past(i);
          return `<div class="win p-3" style="${G.cur === i ? 'box-shadow: inset 0 0 0 3px #F5B041, 0 4px 0 var(--ink)' : ''}${out ? ';opacity:.45' : ''}">${seatLine(p, i)}${out ? '<div class="text-sm text-coral font-bold">voted out · not the impostor</div>' : h !== undefined ? `<div class="pix text-lg text-bone">${esc(h)}</div>` : `<div class="text-sm text-muted">${G.cur === i ? 'thinking...' : 'waiting'}</div>`}${pv.length ? `<div class="text-xs text-muted mt-1">Before: ${pv.map(esc).join(' · ')}</div>` : ''}</div></div></div>`; }).join('')}</div>`;
        const draw = (extra = '') => main(`<div class="text-sm text-muted">${rn > 1 ? `<b class="text-amber">Round ${rn}.</b> Give a <b class="text-bone">new</b> one-word hint.` : 'Say <b class="text-bone">one word</b> that hints at your secret word. Be clear enough for your team, vague enough to fool the impostor.'}</div>${bubbles()}${extra}`);
        for (const i of alive()) {
          G.cur = i; draw();
          const p = P(i);
          if (!G.S.mine(i)) G.clock.idle(p.name, '...');
          const h = await decide(i, 'hint', () => humanHint(), () => botHint(i), 1000 + rnd(900));
          G.said[i] = typeof h === 'string' && h.trim() ? NET.clean(h.trim().slice(0, 18)) : '(no hint)';
          SFX.play('word'); G.cur = -1; draw(); await W(450);
        }
        G.clock.idle('Discuss', '—');
        // 3) vote: everyone still in votes at the same time (the host votes for computer players, and for anyone too slow)
        phase('VOTE');
        const all = alive();
        if (G.S.mine(G.me) && all.includes(G.me)) humanVote().then((v) => { if (G && v !== undefined) { G.S.act({ t: 'vote', key: 'vote' + rn, v }); if (G.S.online) main(`<div class="win p-6 text-center space-y-2"><div class="pix text-lg text-amber">VOTE CAST</div><div id="im-vwait" class="text-sm text-muted">Waiting for the others to vote...</div></div>`); } });
        else if (!all.includes(G.me)) main(`<div class="win p-6 text-center space-y-2"><div class="pix text-lg text-amber">THE OTHERS ARE VOTING</div><div id="im-vwait" class="text-sm text-muted">You are out, so you watch this one.</div></div>`);
        G.S.onCollect = (key, got) => { const el = $('im-vwait'); if (el && all.includes(G.me)) el.textContent = `${Object.keys(got).length} of ${all.length} have voted...`; };
        const others = (i) => all.filter((j) => j !== i);
        const got = await G.S.collect('vote' + rn, all, (i) => ({ t: 'vote', v: botVote(i) }), (i) => ({ t: 'vote', v: pick(others(i)) }), Math.max(25, G.secs || 30) + 5);
        if (!G) throw ABORT;
        const votes = {}; G.players.forEach((_, i) => { votes[i] = []; });
        all.forEach((i) => { let v = +(got[i] && got[i].v); if (!Number.isInteger(v) || !all.includes(v) || v === i) v = others(i)[0]; votes[v].push(i); });
        G.votes = votes;
        await W(300);
        // 4) who is out?
        const max = Math.max(...all.map((i) => votes[i].length));
        const top = all.filter((i) => votes[i].length === max);
        const accused = top.length === 1 ? top[0] : -1;
        const tally = `<div class="space-y-1 mt-3">${all.map((i) => `<div class="flex justify-between text-sm"><span>${P(i).av} ${esc(P(i).name)}</span><span class="text-muted">${votes[i].length} vote${votes[i].length === 1 ? '' : 's'}</span></div>`).join('')}</div>`;
        if (accused === -1) {
          G.ties++;
          if (G.ties >= 2) return { votes, accused: -1, caught: false, guessed: null, guessOk: false };
          phase('TIE'); SFX.play('nope');
          main(`<div class="win p-6 text-center space-y-2"><div class="pix text-xl text-amber">TIED VOTE</div><div class="text-sm text-muted">Nobody is out. Another round of hints! (Another tie and the impostor escapes.)</div>${tally}</div>`);
          await W(3800); return null;
        }
        if (accused === G.impIdx) {
          phase('LAST CHANCE');
          if (!G.S.mine(G.impIdx)) main(`<div class="text-center text-sm text-muted py-6">${esc(P(G.impIdx).name)} was caught and gets one guess at the group's word...</div>`);
          let guessed = await decide(G.impIdx, 'guess', () => humanGuess(), () => botGuess(), 800);
          if (!G.round.options.includes(guessed)) guessed = null;
          return { votes, accused, caught: true, guessed, guessOk: guessed === G.round.civ.w };
        }
        // a civilian was voted out
        G.outs.push(accused); G.ties = 0; SFX.play('lose');
        const left = alive().length;
        if (left <= 2) return { votes, accused, caught: false, guessed: null, guessOk: false };
        phase('VOTED OUT');
        main(`<div class="win p-6 text-center space-y-2"><div class="pix text-xl text-coral">${esc(P(accused).name).toUpperCase()} IS OUT</div><div class="text-sm text-muted">${accused === G.me ? 'You were' : esc(P(accused).name) + ' was'} <b class="text-bone">not</b> the impostor! The impostor is still among the ${left} players left. Next round...</div>${tally}</div>`);
        await W(4200); return null;
      }

      function humanHint() {
        return new Promise((res) => {
          let done = false;
          const fin = (v) => { if (done) return; done = true; G.clock.stop(); res(v); };
          const box = `<div class="win p-3 space-y-2"><div class="text-sm font-bold">Your turn! Your word: <span class="text-amber">${esc(ME().word)}</span></div><div class="flex gap-2"><input id="im-in" maxlength="18" autocomplete="off" placeholder="type one word..." class="flex-1 min-w-0" style="background:#0A1624;border:3px solid var(--ink);color:#F7F4EC;padding:.55rem .7rem;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700"><button id="im-send" class="btn-game btn-amber px-5">Send</button></div><div id="im-err" class="text-xs text-coral min-h-[16px]"></div></div>`;
          const cur = G.cur; // already drawn: append input
          const m = $('im-main'); m.insertAdjacentHTML('beforeend', box);
          const inp = $('im-in'); inp.focus();
          const send = () => {
            const v = inp.value.trim();
            if (!v) { $('im-err').textContent = 'Type a hint first.'; return; }
            if (v.split(/\s+/).length > 2) { $('im-err').textContent = 'Keep it to one word (two at most).'; return; }
            if (lc(v).includes(lc(ME().word)) || lc(ME().word).includes(lc(v)) && v.length > 2) { $('im-err').textContent = 'You cannot use the secret word itself!'; SFX.play('wrong'); return; }
            fin(v);
          };
          $('im-send').onclick = send; inp.onkeydown = (e) => { if (e.key === 'Enter') send(); };
          if (G.secs) G.clock.start(G.secs, 'Your time', () => { if (!done) { showToast("Time's up! Your hint was skipped.", 'error'); fin('(no hint)'); } }, 6); else G.clock.idle('No timer', '∞');
        });
      }
      function botHint(i) {
        const p = P(i), used = G.rounds.flatMap((r) => Object.values(r)).map(lc);
        const pool = p.hints.filter((h) => !used.includes(lc(h)) && lc(h) !== lc(p.word));
        if (p.imp) { // blend in: prefer hints that fit the civilians' word too, or the category
          const civ = G.round.civ.h.map(lc); const blend = pool.filter((h) => civ.includes(lc(h)));
          const gen = G.round.gen.filter((h) => !used.includes(lc(h)));
          if (blend.length && Math.random() < 0.7) return pick(blend);
          if (Math.random() < 0.5) return pick(gen);
          return pick(pool.length ? pool : gen);
        }
        // civilians: mix of clear and vague
        const r = Math.random(), gen = G.round.gen.filter((h) => !used.includes(lc(h)));
        if (r < 0.2) return pick(gen); return pick(pool.length ? pool : gen);
      }

      function suspicion(i, j) { // how suspicious are j's hints (all rounds), from viewer i's point of view
        const me = P(i); let s = 0;
        for (const raw of allSaid(j)) {
          const h = lc(raw || '');
          if (!h || h === '(no hint)') s += 2;
          else if (me.hints.map(lc).includes(h)) s -= 3;
          else if (G.round.gen.map(lc).includes(h)) s -= 0.5;
          else s += 1;
        }
        return s;
      }
      function botVote(i) {
        const opts = alive().filter((j) => j !== i);
        if (P(i).imp) { // impostor points at someone random, slightly favouring people whose hints look unusual
          return pick(opts);
        }
        const sc = opts.map((j) => ({ j, s: suspicion(i, j) + Math.random() * 2.2 }));
        sc.sort((a, b) => b.s - a.s); return sc[0].j;
      }
      function botGuess() {
        const imp = P(G.impIdx);
        const civHints = G.rounds.flatMap((r) => Object.entries(r)).filter(([k]) => +k !== G.impIdx).map(([, v]) => lc(v));
        const scored = G.round.options.map((w) => { const hs = (w === G.round.civ.w ? G.round.civ.h : (Object.values(SETS).flatMap((s) => s.pairs).flatMap((q) => [[q[0], q[1]], [q[2], q[3]]]).find((x) => x[0] === w) || [w, []])[1]).map(lc); return { w, s: civHints.filter((h) => hs.includes(h)).length + Math.random() * 0.7 - (w === imp.word ? 5 : 0) }; });
        scored.sort((a, b) => b.s - a.s); return scored[0].w;
      }

      function humanVote() {
        return new Promise((res) => {
          let done = false;
          const fin = (v) => { if (done) return; done = true; G.clock.stop(); res(v); };
          const list = G.order.filter((i) => i !== G.me && !G.outs.includes(i)).map((i) => { const p = P(i); return `<button data-v="${i}" class="win p-3 w-full text-left" style="cursor:pointer">${seatLine(p, i)}<div class="pix text-lg text-bone">${esc(G.said[i])}</div>${allSaid(i).length > 1 ? `<div class="text-xs text-muted mt-1">All: ${allSaid(i).map(esc).join(' · ')}</div>` : ''}</div></div></button>`; }).join('');
          main(`<div class="text-center space-y-1"><div class="pix text-lg text-amber">WHO IS THE IMPOSTOR?</div><div class="text-sm text-muted">Your word was <b class="text-bone">${esc(ME().word)}</b>. Pick the player whose hint does not fit.</div></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${list}</div><div class="win p-3"><div class="pix text-xs text-muted mb-1">YOUR HINT</div><span class="pix">${esc(G.said[G.me] || '')}</span></div>`);
          document.querySelectorAll('[data-v]').forEach((b) => { b.onclick = () => { SFX.play('vote'); fin(+b.dataset.v); }; });
          if (G.secs) G.clock.start(Math.max(20, G.secs), 'Vote', () => { if (!done) { showToast("Time's up! A random vote was cast.", 'error'); fin(pick(alive().filter((j) => j !== G.me))); } }, 6); else G.clock.idle('No timer', '∞');
        });
      }
      function humanGuess() {
        return new Promise((res) => {
          main(`<div class="text-center space-y-3"><div class="pix text-lg text-coral">YOU WERE CAUGHT!</div><div class="text-sm text-muted">Last chance: guess the <b class="text-bone">other</b> players' word and you still win.</div><div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${G.round.options.filter((w) => w !== ME().word).map((w) => `<button data-g="${esc(w)}" class="btn-game btn-teal py-3">${esc(w)}</button>`).join('')}</div></div>`);
          document.querySelectorAll('[data-g]').forEach((b) => { b.onclick = () => res(b.dataset.g); });
          G.clock.idle('Guess', '?');
        });
      }

      function finish(votes, accused, caught, guessed, guessOk) {
        G.over = true; G.S.over = true; G.clock.stop();
        const me = ME(), n = G.players.length;
        const impWin = !caught || guessOk;
        const won = me.imp ? impWin : !impWin;
        const myVote = Object.keys(votes).find((k) => votes[k].includes(G.me));
        const s = gstat('impostor');
        if (me.imp) { s.asImp = (s.asImp || 0) + 1; if (won) s.impWins = (s.impWins || 0) + 1; } else { s.asCiv = (s.asCiv || 0) + 1; if (won) s.civWins = (s.civWins || 0) + 1; if (+myVote === G.impIdx) s.spotted = (s.spotted || 0) + 1; }
        // fun moment: an impostor who survived more than one round of votes
        if (impWin && G.rounds.length >= 2) funMoment('im-none', { key: 'disg', icon: '🕵️', label: 'DISGUISE', burst: 'MASTER OF DISGUISE!', sub: `${P(G.impIdx).name} fooled everyone for ${G.rounds.length} rounds`, mine: me.imp });
        const elo = G.S.online ? 0 : won ? (me.imp ? 12 : 7) : -4;
        reportGame('impostor', won ? 'win' : 'loss', { elo, xp: won ? 30 : 12, label: `${me.imp ? 'Impostor' : 'Civilian'} · ${won ? 'won' : 'lost'}` });
        SFX.play(won ? 'win' : 'lose');
        const verdict = accused === -1 ? 'Two tied votes in a row: the impostor escaped!' : !caught && G.players.length - G.outs.length <= 2 ? `${P(accused).name} was voted out and was NOT the impostor. Only 2 players are left, so the impostor wins!` : caught ? (guessOk ? `${P(G.impIdx).name} was caught but guessed "${G.round.civ.w}" and wins!` : `${P(G.impIdx).name} was caught${guessed ? ' and guessed "' + guessed + '". Wrong!' : '!'}`) : `The group voted for ${P(accused).name}, who was NOT the impostor.`;
        main(`<div class="win overflow-hidden"><div class="winbar ${won ? 'amber' : 'coral'}"><span>${won ? 'YOU WIN!' : 'YOU LOSE'}</span><span class="pix text-xs">${me.imp ? 'You were the impostor' : 'You were a civilian'}</span></div><div class="p-4 space-y-3">
          <div class="text-sm font-bold">${esc(verdict)}</div>${(() => { const pr = typeof pointsRow === 'function' && pointsRow(); return pr ? `<div class="pix text-emerald">${pr[1]} POINTS</div>` : ''; })()}
          <div class="grid grid-cols-2 gap-3"><div class="stat"><div class="lab">Civilians had</div><div class="val text-teal">${esc(G.round.civ.w)}</div></div><div class="stat"><div class="lab">Impostor had</div><div class="val text-coral">${esc(G.round.imp.w)}</div></div></div>
          <div class="space-y-2">${G.players.map((p, i) => `<div class="flex items-center justify-between gap-2 ${p.imp ? 'text-coral' : ''}"><span class="font-bold text-sm">${p.av} ${esc(p.name)}${p.imp ? ' 🕵️ IMPOSTOR' : ''}</span><span class="text-sm text-muted">${allSaid(i).map((h) => '"' + esc(h) + '"').join(' ')}${G.outs.includes(i) ? ' · voted out' : ` · ${votes[i].length} vote${votes[i].length === 1 ? '' : 's'}`}</span></div>`).join('')}</div>
          <div class="flex gap-3"><button id="im-again" class="btn-game btn-amber flex-1 py-3">Play again</button><button id="im-lobby" class="btn-game btn-graphite flex-1 py-3">Lobby</button></div></div></div>`);
        if (G.S.online) { $('im-again').textContent = 'Back to setup'; $('im-again').closest('.p-4').insertAdjacentHTML('beforeend', '<div id="im-rm"></div>'); npRematchSlot($('im-rm')); }
        $('im-again').onclick = () => open($('game-root')); $('im-lobby').onclick = () => navigateTo('home');
      }

      const mod = {
        id: 'impostor', name: 'Find the Impostor', icon: 'impostor', cats: ['party', 'word'], sub: '4-6 PLAYERS · ~5 MIN', color: '#FB7185', tone: 'coral', btn: 'coral',
        blurb: 'Everyone gets the same secret word except one player. Give hints, then vote out the impostor!',
        rules: { tag: '4-6 PLAYERS', steps: [
          '<strong class="text-bone">Secret words:</strong> Everyone sees a secret word. All players share the <b>same</b> word except one <span class="text-coral font-bold">impostor</span> who gets a similar but different one. Nobody knows who it is, not even the impostor!',
          '<strong class="text-bone">Rounds of hints:</strong> In turn, each player says <b>one word</b> as a hint. Be clear for your team but vague enough that the impostor cannot figure out your word.',
          '<strong class="text-bone">Vote:</strong> Everyone votes for who they think the impostor is. A wrongly voted-out player is out and a new round starts; when only 2 players are left, the impostor wins. Caught impostors get one last chance: guess the group\'s word to win anyway.',
        ], tip: 'Impostor? Copy the style of the other hints. Civilian? Watch for the hint that feels slightly off.' },
        profileTiles: (s) => [['WINS', s.wins, 'text-amber'], ['GAMES', s.played, 'text-bone'], ['IMPOSTOR WINS', s.impWins || 0, 'text-coral'], ['CIVILIAN WINS', s.civWins || 0, 'text-teal']],
        extraRows: (s) => srow('Impostors spotted', s.spotted || 0) + srow('Times impostor', s.asImp || 0),
        engine: { SETS, pickRound, get G() { return G; } }, open, close() { G = null; },
        online: { seats: (sel) => +sel.n || 5, min: 3, ranked: false, start: (body, sel, S) => start(body, sel, S) },
      };
      registerGame(mod);
    })();

