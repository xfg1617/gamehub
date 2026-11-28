/* Case Files · Case #001 "The Harbor Pearl" (Nov 2026, our own story). A case is a function that gets the portrait
   maker (face) and returns everything the game needs. Solution + how it is meant to be solved:
   prototypes/round9/case-files-solution.html. Add more cases by pushing more functions onto CASE_DEFS.
   v2 (Inna: "rooms with items you click; many items, some with nothing; records you have to dig through"):
   ROOMS hold drawn objects (every one can be pinned) (kind + box on a 600x340 room picture); most objects hold nothing. RECORDS is a filing cabinet:
   drawers of folders; each document has a 'look' (log, receipt, phone, notebook, statement, letter, notice, form, menu) that sets how its paper is drawn; players mark the lines that matter themselves. */
window.CASE_DEFS = window.CASE_DEFS || [];
window.CASE_DEFS.push((face) => {
  const PEOPLE = {
    marcus: { name: 'Marcus Bell', role: "Owner's grandson, 27", tall: true, art: face('#3B2A1A', '#E8B48C', '#2F4858', 'short') },
    victor: { name: 'Victor Hale', role: 'Hotel manager, 58', art: face('#C9CED6', '#E3A988', '#1C2C44', 'bald') },
    daisy: { name: 'Daisy Moreau', role: 'Singer at the dinner, 30', art: face('#B0362A', '#F1C6A0', '#7A4FA0', 'long') },
    ethan: { name: 'Ethan Cross', role: 'Guest, antiques collector, 45', tall: true, art: face('#1B1B1B', '#C68A62', '#5A4632', 'short') },
    lily: { name: 'Lily Tran', role: 'Housekeeper, 24', art: face('#1B1B1B', '#EBC59B', '#2DD4BF', 'bun') },
    bao: { name: 'Chef Bao Nguyen', role: 'Witness · head chef', witness: true, art: face('#2A2A2A', '#D9A77F', '#F7F4EC', 'short') },
    rosa: { name: 'Rosa Diaz', role: 'Witness · bartender', witness: true, art: face('#4B2E1E', '#C68A62', '#1B1B1B', 'long') },
  };
  const SUSPECTS = ['marcus', 'victor', 'daisy', 'ethan', 'lily'];

  // ---------- evidence: A = found in the rooms, B = documents in the records cabinet ----------
  const CLUES = {
    a_case: { who: 'A', icon: 'glass', title: 'The display case', text: 'The glass case is open and empty. No scratches, no broken glass. A small brass keyhole on the side. A sticker on the back: "Alarm: runs on main power."' },
    a_prints: { who: 'A', icon: 'shoe', title: 'Wet prints on the carpet', text: 'Wet, muddy sneaker prints, quite big (about a men\'s size 11), with a zigzag sole. They come in from the garden door, go to the display case, and go back out the same way.' },
    a_door: { who: 'A', icon: 'door', title: 'The garden door', text: 'The door from the library to the garden terrace sticks and doesn\'t shut properly. There is rainwater on the floor just inside it.' },
    a_path: { who: 'A', icon: 'shoe', title: 'Prints on the muddy path', text: 'Fresh zigzag sneaker prints in the mud, going both ways between the library door and the back staircase up to floor 2.' },
    a_heels: { who: 'A', icon: 'heel', title: 'Prints by the bench', text: 'Small, pointed high-heel prints by the bench under the awning. Someone stood here for a while. They don\'t go anywhere near the library.' },
    a_cart: { who: 'A', icon: 'cart', title: 'The housekeeping cart', text: 'Parked right outside room 204, next to the back stairs. A ring of labelled spare keys hangs on it: LAUNDRY, LINEN, BAR-2, LIB-C... The hook marked LIB-C is empty.' },
    a_shoes: { who: 'A', icon: 'shoe', title: 'Sneakers in the closet', text: 'A pair of men\'s sneakers, size 11, zigzag soles, still wet and muddy. A damp hooded jacket hangs above them.' },
    a_card: { who: 'A', icon: 'card', title: 'A business card', text: 'JADE DRAGON PAWN & LOAN. Handwritten on the back: "Sat 9:00 AM. Brooch. Bring it."' },
    a_bar: { who: 'A', icon: 'glassdrink', title: 'Napkin at the bar', text: 'Three empty whisky glasses and a napkin covered in little drawings of brooches and rings.' },
    a_gen: { who: 'A', icon: 'gen', title: 'The generator', text: 'Fresh greasy handprints on the start lever. A flashlight with "V. HALE" written on it lies on top.' },
    a_pills: { who: 'A', icon: 'pen', title: 'Headache pills', text: 'A box of headache pills on the nightstand. Still sealed: never opened.' },
    // documents (B). rows = the lines a detective can mark
    b_doors: { who: 'B', look: 'log', icon: 'log', title: 'Floor 2 door log', intro: 'Smart locks on floor 2 (battery powered, they kept working in the power cut).', table: true,
      rows: [['7:52 pm', 'Room 201', 'guest card · D. Moreau'], ['8:44 pm', 'Room 204', 'guest card · M. Bell'], ['9:05 pm', 'Room 206', 'guest card · E. Cross'], ['9:11 pm', 'Linen room', 'staff card · L. Tran'], ['9:18 pm', 'Room 204', 'opened from INSIDE'], ['9:43 pm', 'Room 204', 'guest card · M. Bell'], ['9:52 pm', 'Room 206', 'guest card · E. Cross'], ['10:03 pm', 'Room 201', 'guest card · D. Moreau']] },
    b_guests: { who: 'B', look: 'log', icon: 'log', title: 'Guest list', table: true, rows: [['201', 'Daisy Moreau', 'performer, 1 night'], ['204', 'Marcus Bell', 'family, 2 nights (paid by E. Bell)'], ['206', 'Ethan Cross', 'guest, 3 nights'], ['208', 'empty', ''], ['210', 'Mr & Mrs Okafor', 'guests, 1 night']] },
    b_lost: { who: 'B', look: 'notebook', icon: 'pen', title: 'Lost & found book', table: true, rows: [['Thu', 'umbrella, black', 'lobby'], ['Fri 6 pm', 'reading glasses', 'library armchair'], ['Fri 8 pm', 'one earring, gold', 'dining hall']] },
    b_power: { who: 'B', look: 'notice', icon: 'bolt', title: 'Power company notice', rows: ['Seabright Power · storm outage report', 'Harbor Road: power off from 9:20 pm.', 'Power back on Harbor Road at 9:47 pm.', 'Buildings with their own generators may have light sooner.'] },
    b_gen: { who: 'B', look: 'log', icon: 'log', title: 'Generator log', table: true, rows: [['Mon 10:00', 'Monthly test · V.H.'], ['Fri 9:20 pm', 'Main power lost'], ['Fri 9:34 pm', 'Manual start · signed V.H.'], ['Fri 9:47 pm', 'Main power back · generator off']] },
    b_repair: { who: 'B', look: 'form', icon: 'pen', title: 'Repair requests', table: true, rows: [['Mar', 'Library garden door sticks, won\'t shut', 'not fixed'], ['Jul', 'Library garden door still sticks', 'not fixed'], ['Oct', 'Room 206 shower drips', 'fixed'], ['Nov', 'Jukebox skips', 'not fixed']] },
    b_weather: { who: 'B', look: 'notice', icon: 'bolt', title: 'Weather report', rows: ['Friday: heavy storm from 8 pm.', 'Harbor Road flooded from 9:30 pm.', 'Saturday: clear by morning.'] },
    b_bar: { who: 'B', look: 'receipt', icon: 'glassdrink', title: 'Bar receipts', intro: 'The card reader runs on a battery.', table: true,
      rows: [['8:40 pm', 'card ****2210 (Okafor)', 'two lemonades'], ['9:15 pm', 'card ****4471 (E. Cross)', 'whisky'], ['9:22 pm', 'cash', 'beer'], ['9:28 pm', 'card ****4471 (E. Cross)', 'whisky'], ['9:41 pm', 'card ****4471 (E. Cross)', 'tab closed'], ['9:55 pm', 'card ****2210 (Okafor)', 'tea']] },
    b_menu: { who: 'B', look: 'menu', icon: 'pen', title: 'Anniversary dinner menu', rows: ['Crab soup', 'Grilled sea bass, lemon butter', 'Anniversary cake: 50 candles', 'Music by Daisy Moreau, 8:30 to 9:20'] },
    b_orders: { who: 'B', look: 'notebook', icon: 'log', title: 'Kitchen order sheet', table: true, rows: [['8:50 pm', 'Table 3', 'extra bread'], ['9:05 pm', 'Table 1', 'cake served'], ['9:20 pm', 'ALL', 'stove off (power cut)']] },
    b_house: { who: 'B', look: 'notebook', icon: 'pen', title: 'Housekeeping log', intro: 'Written by Lily Tran.', table: true,
      rows: [['8:30 pm', 'Turned down beds, rooms 201-210'], ['9:10 pm', 'Left cart on floor 2 outside 204, went down to laundry'], ['9:48 pm', 'Back to cart'], ['9:50 pm', 'SPARE KEY LIB-C MISSING!! Told Mr. Hale']] },
    b_porter: { who: 'B', look: 'notebook', icon: 'log', title: "Night porter's log", intro: 'Sam Okafor, night porter.', table: true, rows: [['8:00 pm', 'Started shift, front door'], ['9:12-9:47 pm', 'Basement laundry with L. Tran, folding linen by flashlight'], ['9:55 pm', 'Back at front door']] },
    b_keys: { who: 'B', look: 'log', icon: 'key', title: 'Spare key list', table: true, rows: [['LAUNDRY', 'laundry room'], ['LINEN', 'linen room, floor 2'], ['BAR-2', 'bar store room'], ['LIB-C', 'library display case (for cleaning the glass)'], ['GATE', 'garden gate']] },
    b_laundry: { who: 'B', look: 'notebook', icon: 'pen', title: 'Laundry list', rows: ['40 towels', '22 sheets', '2 tablecloths (wine stain)'] },
    b_bell: { who: 'B', look: 'statement', icon: 'pen', title: "Mrs. Bell's statement", rows: ['"I locked the Harbor Pearl in its case myself at six o\'clock."', '"Mr. Cross offered me $20,000 for it last month. I told him never."', '"My grandson Marcus has been asking me for money again. I said no. He was very upset."', '"Victor has worked here for 30 years. I trust him completely."'] },
    b_phone: { who: 'B', look: 'phone', icon: 'phone', title: "Marcus's phone records", intro: 'From the phone company (with permission).',
      rows: ['6:02 pm · from MOM: Be nice to Grandma tonight!', '7:30 pm · to PIZZA PALACE: call, 2 min', '8:47 pm · from RICKY $$: 12k by Monday. Last warning.', '9:44 pm · to RICKY $$: Relax. You\'ll have it tomorrow.', '10:15 pm · from MOM: How was the party?'] },
    b_daisy: { who: 'B', look: 'letter', icon: 'pen', title: "Daisy's contract", rows: ['Daisy Moreau will sing 8:30 pm to 9:20 pm.', 'Fee: $400, paid in advance.', 'Room 201 for the night is included.'] },
    b_letter: { who: 'B', look: 'letter', icon: 'pen', title: "Ethan's letter", rows: ['"Dear Mrs. Bell, my offer of $20,000 for the Harbor Pearl still stands."', '"If you ever change your mind, I am in room 206 all weekend."', '"With respect, Ethan Cross"'] },
  };

  // ---------- the rooms (Detective A). x, y on the hotel map; items on a 600x340 picture ----------
  const ROOMS = {
    library: { name: 'Library', x: 10, y: 10, w: 180, h: 110, col: '#3C5A3A', wall: '#4A3A2E', floor: '#6B4A32', fl: 'wood', scene: 'Rows of old books. The glass case stands in the middle. Rain taps on the garden door.',
      items: [{ k: 'shelf', x: 20, y: 40, w: 130, h: 150, n: 'Bookshelf', t: 'Old sea captains\' diaries. Dusty: nobody has touched them for years.' },
        { k: 'painting', x: 175, y: 30, w: 90, h: 70, n: 'Painting', t: 'A painting of the hotel in 1976, with a young Mrs. Bell on the steps.' },
        { k: 'case', x: 265, y: 175, w: 80, h: 110, n: 'Display case', c: 'a_case' },
        { k: 'rug', x: 150, y: 270, w: 290, h: 55, n: 'The carpet', c: 'a_prints' },
        { k: 'glassdoor', x: 480, y: 30, w: 90, h: 170, n: 'Garden door', c: 'a_door' },
        { k: 'armchair', x: 40, y: 210, w: 90, h: 90, n: 'Armchair', t: 'A soft old armchair. A dent in the cushion where someone sat earlier.' },
        { k: 'fireplace', x: 340, y: 60, w: 110, h: 110, n: 'Fireplace', t: 'Cold ashes. Nobody lit it tonight.' },
        { k: 'desk', x: 440, y: 230, w: 120, h: 70, n: 'Writing desk', t: 'The guest book. The last entry is from this afternoon: "Happy 50th, Eleanor!"' }] },
    garden: { name: 'Garden terrace', x: 200, y: 10, w: 180, h: 110, col: '#2F6A3C', wall: '#2B3E5A', floor: '#3E7A44', fl: 'grass', scene: 'Dark and wet. A muddy path runs from the library door, past a bench, to the iron back staircase.',
      items: [{ k: 'path', x: 120, y: 200, w: 380, h: 70, n: 'Muddy path', c: 'a_path' },
        { k: 'bench', x: 40, y: 220, w: 110, h: 60, n: 'Bench', c: 'a_heels' },
        { k: 'awning', x: 20, y: 30, w: 170, h: 60, n: 'Awning', t: 'Rain drips off the edge. A pink umbrella leans against the wall.' },
        { k: 'pot', x: 220, y: 150, w: 50, h: 60, n: 'Flower pot', t: 'Wet geraniums. Another pot was knocked over by the wind.' },
        { k: 'lamp', x: 300, y: 60, w: 30, h: 150, n: 'Garden lamp', t: 'Off: no power. A moth is stuck inside.' },
        { k: 'statue', x: 380, y: 80, w: 70, h: 130, n: 'Stone mermaid', t: 'A stone mermaid covered in moss. Nothing else.' },
        { k: 'stairs', x: 480, y: 20, w: 100, h: 230, n: 'Back staircase', t: 'Iron stairs up to the floor 2 hallway. The steps are wet and muddy.' }] },
    dining: { name: 'Dining hall', x: 390, y: 10, w: 160, h: 110, col: '#6A3E2A', wall: '#6A2E2E', floor: '#7A5A3A', fl: 'wood', scene: 'The anniversary party. Plates are still on the table. A small stage in the corner.',
      items: [{ k: 'stage', x: 20, y: 120, w: 140, h: 150, n: 'Stage', t: 'Daisy\'s microphone, switched off. Her set list ends with "9:20 · last song".' },
        { k: 'table', x: 190, y: 200, w: 260, h: 80, n: 'Long table', t: 'Half-eaten anniversary cake and 50 melted candles.' },
        { k: 'piano', x: 460, y: 140, w: 120, h: 120, n: 'Piano', t: 'Sheet music: "Harbor Waltz". The lid is down.' },
        { k: 'window', x: 220, y: 30, w: 120, h: 100, n: 'Window', t: 'Rain on the glass. You can just see the garden terrace and the bench.' },
        { k: 'coatrack', x: 380, y: 40, w: 50, h: 150, n: 'Coat rack', t: 'Coats and umbrellas. One hook is empty.' }] },
    bar: { name: 'Bar', x: 10, y: 130, w: 130, h: 100, col: '#5A2E46', wall: '#3A2440', floor: '#5A3A2A', fl: 'wood', scene: 'A long wooden counter. Rosa the bartender is drying glasses.',
      items: [{ k: 'counter', x: 40, y: 170, w: 500, h: 80, n: 'The counter', t: 'Polished wood. A few wet rings from glasses.' },
        { k: 'glasses', x: 140, y: 140, w: 90, h: 40, n: "Ethan's seat", c: 'a_bar' },
        { k: 'bottles', x: 60, y: 30, w: 220, h: 110, n: 'Bottle shelf', t: 'Whisky, rum and wine. Nothing odd.' },
        { k: 'register', x: 380, y: 120, w: 80, h: 55, n: 'Card reader', t: 'A small card reader with its own battery: it still worked in the power cut.' },
        { k: 'jukebox', x: 470, y: 40, w: 90, h: 120, n: 'Jukebox', t: 'Off: no power. A note on it says "SKIPS!"' },
        { k: 'bin', x: 300, y: 270, w: 50, h: 55, n: 'Bin', t: 'Lemon peels and paper napkins.' }] },
    kitchen: { name: 'Kitchen', x: 150, y: 130, w: 120, h: 100, col: '#4A5560', wall: '#8A9AA8', floor: '#C9CED6', fl: 'tile', scene: 'Pots everywhere. Chef Bao is cleaning up.',
      items: [{ k: 'stove', x: 40, y: 140, w: 140, h: 120, n: 'Stove', t: 'Pots of crab soup, cold now: the stove went off with the power.' },
        { k: 'fridge', x: 210, y: 60, w: 90, h: 200, n: 'Fridge', t: 'Fish, butter and a box of mooncakes with "BAO" written on it.' },
        { k: 'sink', x: 330, y: 150, w: 120, h: 100, n: 'Sink', t: 'Dishes soaking.' },
        { k: 'backdoor', x: 480, y: 50, w: 90, h: 210, n: 'Back door', t: 'Bolted from the inside. Nobody has used it tonight.' },
        { k: 'shelfbox', x: 340, y: 30, w: 120, h: 80, n: 'Shelf', t: 'Spices and big jars of fish sauce.' }] },
    floor2: { name: 'Floor 2 hallway', x: 280, y: 130, w: 130, h: 100, col: '#2B4C7A', wall: '#3A5A8A', floor: '#7A2E3A', fl: 'carpet', scene: 'Guest rooms. At the quiet end, next to the door to the back staircase, a housekeeping cart.',
      items: [{ k: 'cart', x: 230, y: 170, w: 130, h: 110, n: 'Housekeeping cart', c: 'a_cart' },
        { k: 'door', x: 70, y: 40, w: 80, h: 170, n: 'Room 206', t: 'Ethan Cross\'s room. Locked. A "Do not disturb" sign hangs on the handle.', label: '206' },
        { k: 'door', x: 380, y: 40, w: 80, h: 170, n: 'Room 204', t: 'Marcus Bell\'s room. Go into ROOM 204 on the map to look inside.', label: '204' },
        { k: 'outdoor', x: 490, y: 40, w: 90, h: 170, n: 'Door to the back stairs', t: 'A glass door to the outside staircase. Wet, muddy marks on the mat in front of it.' },
        { k: 'extinguisher', x: 180, y: 110, w: 30, h: 70, n: 'Fire extinguisher', t: 'Full. Last checked in June.' },
        { k: 'window', x: 230, y: 40, w: 110, h: 90, n: 'Window', t: 'Looks down on the garden terrace and the muddy path.' }] },
    room204: { name: 'Room 204', x: 420, y: 130, w: 130, h: 100, col: '#3A4A7A', wall: '#C9B48A', floor: '#6A5A8A', fl: 'carpet', scene: "Marcus Bell's room. He let you look around.",
      items: [{ k: 'bed', x: 40, y: 170, w: 200, h: 110, n: 'Bed', t: 'Barely slept in. The pillow is still neat and cold.' },
        { k: 'nightstand', x: 250, y: 190, w: 60, h: 70, n: 'Nightstand', c: 'a_pills' },
        { k: 'closet', x: 450, y: 30, w: 120, h: 230, n: 'Closet', c: 'a_shoes' },
        { k: 'desk', x: 300, y: 110, w: 130, h: 70, n: 'Desk', c: 'a_card' },
        { k: 'bin', x: 330, y: 260, w: 50, h: 55, n: 'Waste bin', t: 'A torn envelope marked "FINAL NOTICE". It is empty.' },
        { k: 'window', x: 90, y: 30, w: 120, h: 100, n: 'Window', t: 'Closed. Below: the garden path and the back staircase.' },
        { k: 'bathdoor', x: 230, y: 30, w: 60, h: 140, n: 'Bathroom', t: 'A wet towel on the floor.' }] },
    basement: { name: 'Basement', x: 560, y: 70, w: 130, h: 160, col: '#3A3A44', wall: '#4A4A52', floor: '#6A6A70', fl: 'stone', scene: 'The laundry room and the hotel generator.',
      items: [{ k: 'generator', x: 40, y: 140, w: 170, h: 130, n: 'Generator', c: 'a_gen' },
        { k: 'washer', x: 260, y: 150, w: 100, h: 110, n: 'Washing machine', t: 'Stopped mid-wash by the power cut.' },
        { k: 'baskets', x: 380, y: 200, w: 110, h: 80, n: 'Laundry baskets', t: 'Clean towels, freshly folded. Two people were busy here.' },
        { k: 'fusebox', x: 260, y: 40, w: 70, h: 80, n: 'Fuse box', t: 'The main switch tripped in the storm.' },
        { k: 'shelfbox', x: 400, y: 40, w: 170, h: 100, n: 'Shelves', t: 'Paint tins and spare light bulbs.' }] },
  };
  // ---------- the records cabinet (Detective B) ----------
  const DRAWERS = [
    { name: 'Front desk', docs: ['b_guests', 'b_doors', 'b_lost'] },
    { name: 'Maintenance', docs: ['b_repair', 'b_gen', 'b_power', 'b_weather'] },
    { name: 'Bar & kitchen', docs: ['b_menu', 'b_bar', 'b_orders'] },
    { name: 'Housekeeping', docs: ['b_laundry', 'b_keys', 'b_house', 'b_porter'] },
    { name: 'Statements & phones', docs: ['b_daisy', 'b_bell', 'b_letter', 'b_phone'] },
  ];

  // ---------- interviews: questions, and what each person says when shown a card from the board ----------
  const TALK = {
    marcus: { q: [['Where were you during dinner?', "I had a headache. I went up to my room before nine and slept until Grandma screamed. I didn't leave my room all evening."],
        ['Did you hear anything?', 'Thunder. Lots of thunder. That\'s it.'], ['How do you get on with your grandmother?', 'Fine. She\'s... careful with money. That\'s all.']],
      show: { b_doors: '...Okay, I stepped out for some air. It was stuffy. That\'s not a crime.', a_shoes: 'I... went for a walk in the garden. In the rain. People do that.',
        b_phone: 'Where did you get that? ...That\'s private. I want to talk to my grandmother.', a_card: '(He stares at the card and says nothing.)', a_pills: 'I... must have had some others. In my bag.' },
      shrug: 'No idea what that is. Can I go back to bed?' },
    victor: { q: [['Where were you when the lights went out?', 'In the kitchen with Chef Bao, calming him down. Then I took my flashlight down to the basement and got the generator going.'],
        ['Who has a key to the display case?', 'I have one, on my belt. It never left me. And there\'s a spare on the housekeeping key ring, so the girls can clean the glass.'],
        ['Is the library garden door locked at night?', 'It should be. It sticks; it never really shuts. I\'ve asked Mrs. Bell to fix it for a year.']],
      show: { b_house: 'Lily told me at ten to ten. I was on my way to check the library when Mrs. Bell found the case open.', a_gen: 'Yes, that\'s my flashlight. I left it there after I got the generator going.', b_gen: 'That\'s my signature. 9:34, in the basement.' },
      shrug: 'I don\'t see what that has to do with me, detective.' },
    daisy: { q: [['Where were you?', 'I sang until the power went at 9:20. Then I went out to the terrace for some air, under the awning by the bench.'],
        ['Did you see anyone?', 'Someone tall in a hooded jacket, with a phone light, walking along the garden path toward the library. Around 9:25. I thought it was staff. A few minutes later the same light went back toward the stairs.']],
      show: { a_heels: 'Yes, those are mine. I stood right there the whole time. My shoes are ruined.', a_path: 'That\'s the path the light went along! Toward the library, then back to the stairs.' },
      shrug: 'Sorry, darling, that means nothing to me.' },
    ethan: { q: [['Where were you?', 'At the bar. All night. Ask the bartender.'], ['What do you think of the Harbor Pearl?', 'Exquisite. I offered Eleanor a fair price for it. She is very sentimental.']],
      show: { a_bar: 'I sketch jewelry. It\'s my job. Sketching isn\'t stealing.', b_bar: 'Exactly. Paid for a drink in the middle of the blackout. At the bar.', b_letter: 'I wanted to BUY it. Honestly. Thieves don\'t write letters.' },
      shrug: 'Fascinating. Is there a point to this?' },
    lily: { q: [['Where were you?', 'At ten past nine I left my cart outside room 204 and went down to the laundry with Sam. When I came back up, the LIB-C key was gone.'],
        ['Who could reach your cart?', 'It\'s at the quiet end, by the back stairs. Only Mr. Marcus\'s room is down there. His light was off.'], ['Did you take the key?', 'No! I would lose my job. Sam was with me the whole time.']],
      show: { a_cart: 'Yes, that\'s my cart. The LIB-C hook was full when I left it, I promise.', b_porter: 'See? Sam wrote it down. We were together the whole time.' },
      shrug: 'I don\'t know anything about that, sorry.' },
    bao: { q: [['Where was Victor during the blackout?', 'With me, from when the lights went out until about half past nine. Then he grabbed his flashlight and went down to the basement. The lights came back a few minutes later.']], show: {}, shrug: 'I only know about my kitchen.' },
    rosa: { q: [['Did Ethan Cross leave the bar?', 'Not once, from nine until about quarter to ten. He complained about the dark the whole time and kept ordering whisky.']], show: { a_bar: 'He drew on napkins all night. Brooches, rings. Strange man.' }, shrug: 'Never seen that before.' },
  };
  const HINTS = [
    'Start with WHEN: the case alarm needs main power. When was it off? (It\'s in the records: maintenance.)',
    'HOW: the case wasn\'t forced, so someone used a key. Victor\'s never left his belt... where was the other one? (Look upstairs.)',
    'WHO: check every alibi against a record. Whose story does a record prove false?',
  ];
  const KEY = { who: 'marcus', how: 'spare', why: 'debt' };
  const USEFUL = ['b_power', 'b_gen', 'b_bar', 'b_porter', 'b_bell', 'b_keys', 'b_repair'];
  const STRONG = ['b_doors', 'a_shoes', 'a_prints', 'a_cart', 'b_house', 'a_card', 'b_phone', 'a_path', 'a_pills'];
  const HOW = [['master', "Used Victor's own key while he was busy"], ['spare', 'Took the spare key from the housekeeping cart and came in through the garden door during the blackout'], ['smash', 'Forced the case open'], ['early', 'Swapped it for a fake before dinner']];
  const WHY = [['collect', 'Wanted it for a collection'], ['debt', 'Needed money fast to pay a debt'], ['revenge', 'Revenge on Mrs. Bell'], ['job', 'To get someone else fired']];

  return {
    id: 'harbor', num: '001', cat: 'quick', org: 'Grand Harbor Hotel', title: 'The Harbor Pearl', titleVi: 'Viên Ngọc Bến Cảng', mins: '20-30',
    brief: `<p><b>Grand Harbor Hotel, Seabright. A stormy Friday night.</b></p>
      <p>Mrs. Eleanor Bell, 70, is celebrating fifty years of her family's hotel. Her most precious thing, a pearl and gold brooch called <b>the Harbor Pearl</b>, sits in a locked glass case in the library for guests to admire.</p>
      <p>At 9:20 pm a storm knocks out the power. The hotel goes dark. At <b>9:58 pm</b>, Mrs. Bell walks into the library and finds the case open and empty.</p>
      <p>Nobody has left the hotel since: the road is flooded. The thief is still here.</p>`,
    questions: ['Who took the Harbor Pearl?', 'How did they open the case?', 'Why did they do it?'],
    mapW: 700, mapH: 240,
    PEOPLE, SUSPECTS, CLUES, ROOMS, DRAWERS, TALK, HINTS, KEY, STRONG, USEFUL, HOW, WHY,
    culprit: 'marcus', solved: 'Marcus Bell took the Harbor Pearl.',
    story: 'The police find the Harbor Pearl sewn into the lining of Marcus\'s hooded jacket. He owed $12,000 to a man called Ricky and had booked a pawn shop for Saturday morning. His grandmother had refused to lend him the money that week.',
    timeline: [['8:44 pm', 'Marcus goes up to room 204 "with a headache" (the pills are never opened).'], ['8:47 pm', 'Ricky texts: "12k by Monday. Last warning."'],
      ['9:10 pm', 'Lily parks her cart outside 204 and goes down to the laundry with Sam. Marcus sees the spare keys hanging on it.'],
      ['9:18 pm', 'Marcus slips out of 204 and takes the LIB-C spare key from the cart.'], ['9:20 pm', 'The storm cuts the power. The case alarm goes dead.'],
      ['9:25 pm', 'Hooded, using his phone light, he goes down the back stairs, along the garden path and in through the library door that never shuts. Daisy sees a tall figure on the path.'],
      ['~9:27 pm', 'He opens the case with the key, takes the Harbor Pearl and goes back the same way, leaving zigzag prints.'],
      ['9:34 pm', 'Victor gets the generator running. The lights come back.'], ['9:43 pm', 'Marcus\'s card opens room 204. At 9:44 pm he texts Ricky: "You\'ll have it tomorrow."'],
      ['9:50 pm', 'Lily notices the key is gone. At 9:58 pm Mrs. Bell finds the empty case.']],
    herrings: [['Ethan', 'wanted the brooch, but his card paid at the bar at 9:28, in the middle of the blackout, and Rosa says he never left.'],
      ['Victor', 'has a key, but Chef Bao was with him until 9:30 and he signed the generator log at 9:34 in the basement.'],
      ['Daisy', 'was outside, but her prints are small heels by the bench, not size 11 sneakers. She\'s the witness.'],
      ['Lily', 'had the key on her cart, but Sam\'s log puts her in the laundry from 9:12 to 9:47.']],
    wrong: { who: (name) => `${name} has an alibi that holds up. Check the records again.`, how: 'Right person, but that is not how it was done. Look at the case and the keys again.', why: 'Right person and method, but think about the motive again.' },
  };
});
