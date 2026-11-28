/* Case Files · Case #001 "The Harbor Pearl" (Nov 2026, our own story). A case is a function that gets the portrait
   maker (face) and returns everything the game needs. Solution + how it is meant to be solved:
   prototypes/round9/case-files-solution.html. Add more cases by pushing more functions onto CASE_DEFS. */
window.CASE_DEFS = window.CASE_DEFS || [];
window.CASE_DEFS.push((face) => {
  const PEOPLE = {
  marcus: { name: 'Marcus Bell', role: "Owner's grandson, 27", tall: true, art: face('#3B2A1A', '#E8B48C', '#2F4858', 'short') },
  victor: { name: 'Victor Hale', role: 'Hotel manager, 58', art: face('#C9CED6', '#E3A988', '#1C2C44', 'bald') },
  daisy:  { name: 'Daisy Moreau', role: 'Singer at the dinner, 30', art: face('#B0362A', '#F1C6A0', '#7A4FA0', 'long') },
  ethan:  { name: 'Ethan Cross', role: 'Guest, antiques collector, 45', tall: true, art: face('#1B1B1B', '#C68A62', '#5A4632', 'short') },
  lily:   { name: 'Lily Tran', role: 'Housekeeper, 24', art: face('#1B1B1B', '#EBC59B', '#2DD4BF', 'bun') },
  bao:    { name: 'Chef Bao Nguyen', role: 'Witness · head chef', witness: true, art: face('#2A2A2A', '#D9A77F', '#F7F4EC', 'short') },
  rosa:   { name: 'Rosa Diaz', role: 'Witness · bartender', witness: true, art: face('#4B2E1E', '#C68A62', '#1B1B1B', 'long') },
};
  const SUSPECTS = ['marcus', 'victor', 'daisy', 'ethan', 'lily'];

  const CLUES = {
  // ---- Detective A: the scene ----
  a_case:  { who: 'A', icon: 'glass', title: 'The display case', short: 'Opened with a key. No damage.', text: 'The glass case is open and empty. No scratches, no broken glass: <b>someone opened it with its small brass key</b>. A sticker on the back: "Alarm: runs on main power."' },
  a_prints:{ who: 'A', icon: 'shoe', title: 'Wet sneaker prints', short: "Men's size 11, zigzag sole, garden door ↔ case.", text: "Wet, muddy sneaker prints on the carpet, about <b>men's size 11</b>, with a <b>zigzag sole</b>. They come in from the garden door, go straight to the display case, and go back out the same way." },
  a_door:  { who: 'A', icon: 'door', title: 'Library garden door', short: 'Sticks, never fully shuts. Rain inside.', text: 'The door from the library to the garden terrace <b>sticks and doesn\'t shut properly</b>. There is rainwater on the floor just inside it.' },
  a_path:  { who: 'A', icon: 'shoe', title: 'Prints on the garden path', short: 'Same zigzag prints → back staircase.', text: 'Fresh zigzag sneaker prints in the mud lead from the library door along the path to the <b>back staircase</b>, which goes up to the guest rooms on floor 2. They also come back down the same way.' },
  a_heels: { who: 'A', icon: 'heel', title: 'Heel prints by the bench', short: 'Small pointed heels. Someone stood here.', text: 'Small, <b>pointed high-heel prints</b> by the bench outside the dining hall, under the awning. Someone stood here for a while. They don\'t go near the library.' },
  a_cart:  { who: 'A', icon: 'cart', title: 'Housekeeping cart', short: 'Outside room 204. Spare key LIB-C missing.', text: 'Lily\'s cart is parked in the floor 2 hallway <b>right outside room 204</b>, at the quiet end next to the back staircase. A ring of labelled spare keys hangs on it. The hook marked <b>LIB-C (library case)</b> is empty.' },
  a_shoes: { who: 'A', icon: 'shoe', title: 'Sneakers in room 204', short: 'Size 11, zigzag, wet and muddy.', text: "In Marcus's closet: a pair of men's sneakers, <b>size 11, zigzag soles, still wet and muddy</b>. A damp hooded jacket hangs above them." },
  a_card:  { who: 'A', icon: 'card', title: 'Pawn shop card', short: '"Sat 9:00 AM · brooch · bring it"', text: 'On the desk in room 204: a business card for <b>JADE DRAGON PAWN & LOAN</b>. Handwritten on the back: <i>"Sat 9:00 AM. Brooch. Bring it."</i>' },
  a_bar:   { who: 'A', icon: 'glassdrink', title: "Ethan's seat at the bar", short: 'Napkin with jewelry doodles.', text: "Three empty glasses and a napkin covered in <b>doodles of brooches and rings</b> at Ethan Cross's seat." },
  a_gen:   { who: 'A', icon: 'gen', title: 'The generator', short: 'Fresh handprints on the start lever.', text: 'Fresh greasy handprints on the generator\'s start lever. A flashlight with "V. HALE" written on it lies on top.' },
  // ---- Detective B: the records ----
  b_doors: { who: 'B', icon: 'log', title: 'Floor 2 door log', short: 'Room 204: out 9:18 pm, in 9:43 pm.', html: () => `<p>The smart locks on floor 2 record every time a door opens.</p><table class="tbl">
      <tr><td>8:44 pm</td><td>Room 204</td><td>opened with guest card · M. Bell</td></tr>
      <tr><td>9:05 pm</td><td>Room 206</td><td>opened with guest card · E. Cross</td></tr>
      <tr class="hl"><td>9:18 pm</td><td>Room 204</td><td>opened from INSIDE</td></tr>
      <tr class="hl"><td>9:43 pm</td><td>Room 204</td><td>opened with guest card · M. Bell</td></tr>
      <tr><td>9:52 pm</td><td>Room 206</td><td>opened with guest card · E. Cross</td></tr></table>
      <p>(The locks run on batteries, so they kept working during the power cut.)</p>` },
  b_power: { who: 'B', icon: 'bolt', title: 'Power company notice', short: 'Storm cut the power 9:20 pm.', text: 'Seabright Power: storm outage on Harbor Road from <b>9:20 pm</b> to 9:47 pm. (The hotel\'s own generator can bring the lights back sooner.)' },
  b_gen:   { who: 'B', icon: 'log', title: 'Generator log', short: 'Started by hand at 9:34 pm, signed V.H.', html: () => `<table class="tbl"><tr><td>9:20 pm</td><td>Main power lost</td></tr><tr class="hl"><td>9:34 pm</td><td>Manual start · signed <b>V.H.</b></td></tr><tr><td>9:47 pm</td><td>Main power back · generator off</td></tr></table>` },
  b_bar:   { who: 'B', icon: 'glassdrink', title: 'Bar receipts', short: "Ethan's card: 9:15, 9:28, 9:41 pm.", html: () => `<p>Card ending 4471 (E. Cross):</p><table class="tbl"><tr><td>9:15 pm</td><td>Whisky, neat</td></tr><tr class="hl"><td>9:28 pm</td><td>Whisky, neat (paid during the power cut, battery card reader)</td></tr><tr><td>9:41 pm</td><td>Tab closed</td></tr></table>` },
  b_house: { who: 'B', icon: 'pen', title: 'Housekeeping log', short: 'Cart left by 204 at 9:10. Key gone at 9:50.', html: () => `<p>Written by Lily Tran:</p><table class="tbl"><tr class="hl"><td>9:10 pm</td><td>Left cart on floor 2 outside 204, went down to laundry</td></tr><tr><td>9:48 pm</td><td>Back to cart</td></tr><tr class="hl"><td>9:50 pm</td><td>SPARE KEY LIB-C MISSING!! Told Mr. Hale</td></tr></table>` },
  b_porter:{ who: 'B', icon: 'log', title: "Night porter's log", short: 'Sam + Lily in the laundry 9:12–9:47.', html: () => `<p>Night porter Sam Okafor:</p><table class="tbl"><tr class="hl"><td>9:12–9:47 pm</td><td>Basement laundry with L. Tran, folding linen by flashlight</td></tr></table>` },
  b_phone: { who: 'B', icon: 'phone', title: "Marcus's phone records", short: '"12k by Monday" · "You\'ll have it tomorrow."', html: () => `<p>From the phone company (with permission). Contact saved as <b>RICKY $$</b>:</p>
      <div class="sms in"><small>8:47 pm · from RICKY $$</small>12k by Monday. Last warning.</div>
      <div class="sms out"><small>9:44 pm · to RICKY $$</small>Relax. You'll have it tomorrow.</div>` },
  b_bell:  { who: 'B', icon: 'pen', title: "Mrs. Bell's statement", short: "Ethan offered $20k. Marcus begged for money.", text: 'Eleanor Bell, owner: "Mr. Cross offered me $20,000 for the Harbor Pearl last month. I told him never. And my grandson Marcus has been asking me for money again. <b>I said no. He was very upset.</b>"' },
};
  const ROOMS = {
  library: { name: 'Library', x: 20, y: 20, w: 220, h: 150, col: '#3C5A3A', scene: 'Rows of old books. The empty glass case stands in the middle. Rain taps on the garden door.', spots: [['The display case', 'a_case'], ['The carpet', 'a_prints'], ['The garden door', 'a_door']] },
  garden: { name: 'Garden terrace', x: 250, y: 20, w: 250, h: 150, col: '#2F6A3C', scene: 'A muddy path runs from the library door, past a bench, to the back staircase.', spots: [['The muddy path', 'a_path'], ['The bench under the awning', 'a_heels']] },
  dining: { name: 'Dining hall', x: 20, y: 180, w: 220, h: 120, col: '#6A3E2A', scene: "The anniversary dinner. A small stage where Daisy sang. Nothing here was touched.", spots: [] },
  bar: { name: 'Bar', x: 250, y: 180, w: 120, h: 120, col: '#5A2E46', scene: 'A long wooden counter. Rosa the bartender is cleaning glasses.', spots: [["Ethan's seat", 'a_bar']] },
  kitchen: { name: 'Kitchen', x: 380, y: 180, w: 120, h: 120, col: '#4A5560', scene: 'Pots everywhere. Chef Bao says the cooker went off with the lights.', spots: [] },
  floor2: { name: 'Floor 2 · room 204', x: 510, y: 20, w: 170, h: 150, col: '#2B4C7A', scene: "Guest rooms. At the quiet end, by the back stairs: Lily's cart, and room 204 (Marcus Bell). Marcus let you look around his room.", spots: [['The housekeeping cart', 'a_cart'], ['Room 204 closet', 'a_shoes'], ['Room 204 desk', 'a_card']] },
  basement: { name: 'Basement', x: 510, y: 180, w: 170, h: 120, col: '#3A3A44', scene: 'The laundry room and the generator.', spots: [['The generator', 'a_gen']] },
};
  const TALK = {
  marcus: [
    ['Where were you during dinner?', "I had a headache. I went up to my room before nine and slept until Grandma screamed. I didn't leave my room all evening."],
    ['Did you hear anything?', 'Thunder. Lots of thunder. That\'s it.'],
    ['How do you get on with your grandmother?', 'Fine. She\'s... careful with money. That\'s all.'],
    { need: 'b_doors', q: 'Show him the door log (out 9:18, back 9:43)', a: '...Okay, I stepped out for some air. It was stuffy. That\'s not a crime.', hot: true },
    { need: 'a_shoes', q: 'Ask why his sneakers are soaking wet', a: 'I... went for a walk in the garden. In the rain. People do that.', hot: true },
    { need: 'b_phone', q: 'Show him the messages from "RICKY $$"', a: 'Where did you get that? ...That\'s private. I want to talk to my grandmother.', hot: true },
    { need: 'a_card', q: 'Show him the pawn shop card', a: '(He stares at the card and says nothing.)', hot: true },
  ],
  victor: [
    ['Where were you when the lights went out?', 'In the kitchen with Chef Bao, calming him down. Then I took my flashlight down to the basement and got the generator going.'],
    ['Who has a key to the display case?', 'I have one, on my belt. It never left me. And there\'s a spare on the housekeeping key ring, so the girls can clean the glass.'],
    ['Is the library garden door locked at night?', 'It should be. It sticks; it never really shuts. I\'ve asked Mrs. Bell to fix it for a year.'],
    { need: 'b_house', q: 'Ask about the missing spare key', a: 'Lily told me at ten to ten. I was on my way to check the library when Mrs. Bell found the case open.' },
  ],
  daisy: [
    ['Where were you?', 'I sang until the power went at 9:20. Then I went out to the terrace for some air, under the awning by the bench.'],
    ['Did you see anyone?', '<b>Someone tall in a hooded jacket</b>, with a phone light, walking along the garden path toward the library. Around 9:25. I thought it was staff. A few minutes later the same light went back toward the stairs.', true],
    { need: 'a_heels', q: 'Show her the heel prints by the bench', a: 'Yes, those are mine. I stood right there the whole time. My shoes are ruined.' },
  ],
  ethan: [
    ['Where were you?', 'At the bar. All night. Ask the bartender.'],
    ['What do you think of the Harbor Pearl?', 'Exquisite. I offered Eleanor a fair price for it. She is very sentimental.'],
    { need: 'a_bar', q: 'Show him the napkin doodles', a: 'I sketch jewelry. It\'s my job. Sketching isn\'t stealing.' },
    { need: 'b_bar', q: 'Ask about the 9:28 pm receipt', a: 'Exactly. Paid for a drink in the middle of the blackout. At the bar.' },
  ],
  lily: [
    ['Where were you?', 'At ten past nine I left my cart outside room 204 and went down to the laundry with Sam. When I came back up, the LIB-C key was gone.'],
    ['Who could reach your cart?', 'It\'s at the quiet end, by the back stairs. Only Mr. Marcus\'s room is down there. His light was off.'],
    ['Did you take the key?', 'No! I would lose my job. Sam was with me the whole time.'],
  ],
  bao: [['Where was Victor during the blackout?', 'With me, from when the lights went out until about half past nine. Then he grabbed his flashlight and went down to the basement. The lights came back a few minutes later.']],
  rosa: [['Did Ethan Cross leave the bar?', 'Not once, from nine until about quarter to ten. He complained about the dark the whole time and kept ordering whisky.']],
};
  const HINTS = [
  'Start with WHEN: the alarm needs main power. When was it off? (Detective B has the power records.)',
  'HOW: the case wasn\'t forced, so someone had a key. Victor\'s never left his belt... where was the other one? (Detective A: check floor 2.)',
  'WHO: check every alibi against a record. Whose story does a record prove false?',
];
  const KEY = { who: 'marcus', how: 'spare', why: 'debt' };
  const STRONG = ['b_doors', 'a_shoes', 'a_prints', 'a_cart', 'b_house', 'a_card', 'b_phone', 'a_path'];

  const HOW = [['master', "Used Victor's own key while he was busy"], ['spare', 'Took the spare key from the housekeeping cart and came in through the garden door during the blackout'], ['smash', 'Forced the case open'], ['early', 'Swapped it for a fake before dinner']];
  const WHY = [['collect', 'Wanted it for a collection'], ['debt', 'Needed money fast to pay a debt'], ['revenge', 'Revenge on Mrs. Bell'], ['job', 'To get someone else fired']];

  return {
    id: 'harbor', num: '001', title: 'The Harbor Pearl', titleVi: 'Viên Ngọc Bến Cảng', mins: '20-30',
    brief: `<p><b>Grand Harbor Hotel, Seabright. A stormy Friday night.</b></p>
      <p>Mrs. Eleanor Bell, 70, is celebrating fifty years of her family's hotel. Her most precious thing, a pearl and gold brooch called <b>the Harbor Pearl</b>, sits in a locked glass case in the library for guests to admire.</p>
      <p>At 9:20 pm a storm knocks out the power. The hotel goes dark. At <b>9:58 pm</b>, Mrs. Bell walks into the library and finds the case open and empty.</p>
      <p>Nobody has left the hotel since: the road is flooded. The thief is still here.</p>`,
    questions: ['Who took the Harbor Pearl?', 'How did they open the case?', 'Why did they do it?'],
    mapW: 700, mapH: 320, mapExtra: `<g pointer-events="none"><rect x="225" y="80" width="30" height="28" fill="#8A5A2B" stroke="#050E18" stroke-width="3"/><text x="214" y="124" font-size="11" fill="#F7F4EC" font-family="Outfit" font-weight="700">garden door</text>
      <rect x="490" y="120" width="30" height="40" fill="#555" stroke="#050E18" stroke-width="3"/><text x="452" y="175" font-size="11" fill="#F7F4EC" font-family="Outfit" font-weight="700">back stairs</text></g>`,
    PEOPLE, SUSPECTS, CLUES, ROOMS, TALK, HINTS, KEY, STRONG, HOW, WHY,
    culprit: 'marcus', solved: 'Marcus Bell took the Harbor Pearl.',
    story: 'The police find the Harbor Pearl sewn into the lining of Marcus\'s hooded jacket. He owed $12,000 to a man called Ricky and had booked a pawn shop for Saturday morning. His grandmother had refused to lend him the money that week.',
    timeline: [['8:44 pm', 'Marcus goes up to room 204 "with a headache".'], ['8:47 pm', 'Ricky texts: "12k by Monday. Last warning."'],
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
