/* Case Files · Case #002 "The Night Gallery" (Nov 2026, our own story). REPLAYABLE: make({v, off, code}) builds one
   version. v picks which suspect did it (each has their own way and reason), off nudges the times, code is the guard's code.
   Every clue, camera frame, photo, lab result, statement and the ending are built from the same version, so they agree.
   New in this case: Detective A has a tool belt (flashlight, UV light, magnifier, evidence bag) and a "7:30 pm photo" of the
   gallery to compare; Detective B sits in the security control room (4 cameras with a time slider, the photographer's
   48 photos, the lab for bagged items, and a small cabinet of files). test/t_case2_fair.py checks every version is fair.
   Please don't write the solutions anywhere else (Inna plays these cases). */
window.CASE_DEFS = window.CASE_DEFS || [];
window.CASE_DEFS.push((face) => {
  const PEOPLE = {
    felix: { name: 'Felix Ward', role: 'Museum director, 61', col: ['#C9CED6', '#E3A988', '#2B4C7A'], art: face('#C9CED6', '#E3A988', '#2B4C7A', 'short') },
    iris: { name: 'Iris Moreno', role: 'Security guard, 24', col: ['#1B1B1B', '#C68A62', '#6B7A8C'], art: face('#1B1B1B', '#C68A62', '#6B7A8C', 'bun') },
    nora: { name: 'Nora Quinn', role: 'Painting restorer, 45', col: ['#B0362A', '#F1C6A0', '#3A7D44'], art: face('#B0362A', '#F1C6A0', '#3A7D44', 'long') },
    hollis: { name: 'Arthur Hollis', role: 'Art collector, 70', col: ['#EDEDED', '#E8B48C', '#7A2E3A'], art: face('#EDEDED', '#E8B48C', '#7A2E3A', 'bald') },
    theo: { name: 'Theo Lambert', role: 'Caterer, 31', col: ['#5A3A22', '#D9A07A', '#F7F4EC'], art: face('#5A3A22', '#D9A07A', '#F7F4EC', 'short') },
    rosa: { name: 'Rosa Diaz', role: 'Cleaner (witness), 58', col: ['#9AA6A0', '#C68A62', '#7DB8E0'], art: face('#9AA6A0', '#C68A62', '#7DB8E0', 'bun') },
    jun: { name: 'Jun Park', role: 'Gala photographer (witness), 29', col: ['#1B1B1B', '#E8B48C', '#2A2A2A'], art: face('#1B1B1B', '#E8B48C', '#2A2A2A', 'short') },
  };
  const SUSPECTS = ['felix', 'iris', 'nora', 'hollis', 'theo'];
  const VARIANTS = ['theo', 'felix', 'nora', 'hollis'];
  const HOW = [['crate', 'Hid the paintings in a long catering crate on the dessert trolley'], ['box', 'Carried them in a long cardboard box through the back corridor to an office'],
    ['sheet', 'Wrapped them in a bedsheet and hid them in a studio behind blank canvases'], ['portfolio', 'Carried them in a big flat portfolio case and walked out through the cloakroom'],
    ['frame', 'Lifted the whole frame off the wall in front of everyone during the speech']];
  const WHY = [['family', 'To take back what the artist\'s family was paid almost nothing for'], ['debt', 'To sell it in secret and pay off a big debt'],
    ['pride', 'To prove they were good enough after being passed over for a job'], ['collect', 'Wanted it for a private collection after being refused twice'], ['insurance', 'To claim the insurance money']];

  function make(cfg) {
    const V = VARIANTS[cfg.v % 4], off = cfg.off || 0, code = String(cfg.code || 4417);
    const W = { theo: 161, felix: 202, nora: 110, hollis: 182 }[V] + off;   // minutes after 7:00 pm when the gallery camera went off
    const on = (k, a, b) => (V === k ? a : b);
    const fmt = (m) => { const h = 7 + Math.floor(m / 60), mm = m % 60; return `${h > 12 ? h - 12 : h}:${String(mm).padStart(2, '0')} pm`; };
    const KEY = { theo: { who: 'theo', how: 'crate', why: 'family' }, felix: { who: 'felix', how: 'box', why: 'debt' }, nora: { who: 'nora', how: 'sheet', why: 'pride' }, hollis: { who: 'hollis', how: 'portfolio', why: 'collect' } }[V];

    // ---------- where everyone was, minute by minute (0 = 7:00 pm, 240 = 11:00 pm). [minute, place, x 0-1, carrying] ----------
    // carrying: T = dessert trolley with a long crate, B = long cardboard box, S = something flat in a bedsheet, P = big flat portfolio case
    const S = {
      felix: [[0, 'hall', 0.4], [30, 'hall', 0.55], [60, 'hall', 0.35], [75, 'hall', 0.45], [135, 'hall', 0.6], [158, 'hall', 0.12], [176, 'hall', 0.4], [192, 'hall', 0.55], [228, 'hall', 0.5]],
      iris: [[0, 'security', 0.5], [59, 'corridor', 0.15], [60, 'corridor', 1], [61, 'staff', 0.5], [74, 'corridor', 1], [75, 'corridor', 0.15], [76, 'security', 0.5],
        [W - 3, 'corridor', 0.15], [W - 2, 'corridor', 1], [W - 1, 'staff', 0.5], [W + 14, 'corridor', 1], [W + 15, 'corridor', 0.15], [W + 16, 'security', 0.5]],
      nora: [[0, 'hall', 0.3], [39, 'corridor', 0], [40, 'corridor', 0.55], [41, 'studio', 0.5], [46, 'corridor', 0.55], [47, 'corridor', 0], [48, 'hall', 0.35], [75, 'hall', 0.5], [135, 'hall', 0.66], [158, 'hall', 0.35], [180, 'hall', 0.72], [195, 'hall', 0.3], [230, 'hall', 0.6]],
      hollis: [[0, 'cloak', 0.8], [3, 'cloak', 0.3, 'P'], [4, 'cloak', 0.3], [5, 'hall', 0.6], [75, 'hall', 0.4], [134, 'cloak', 0.3], [136, 'cloak', 0.8, 'P'], [137, 'out', 0]],
      theo: [[0, 'kitchen', 0.5], [60, 'corridor', 0.75, 'T'], [61, 'corridor', 1, 'T'], [62, 'dock', 0.15, 'T'], [64, 'dock', 0.7, 'T'], [67, 'dock', 0.15, 'T'], [68, 'corridor', 1, 'T'], [69, 'corridor', 0.75, 'T'], [70, 'kitchen', 0.5],
        [80, 'hall', 0.7], [95, 'kitchen', 0.5], [100, 'hall', 0.45], [130, 'kitchen', 0.5], [150, 'hall', 0.85], [176, 'hall', 0.75], [230, 'kitchen', 0.5]],
      rosa: [[0, 'hall', 0.9], [50, 'corridor', 0], [52, 'corridor', 0.6], [56, 'corridor', 0], [57, 'hall', 0.92], [140, 'corridor', 0], [144, 'corridor', 0.5], [148, 'corridor', 0], [149, 'hall', 0.9],
        [W + 4, 'corridor', 0], [W + 6, 'corridor', 0.45], [W + 8, 'corridor', 0], [W + 9, 'hall', 0.9], [215, 'hall', 0.8]],
      jun: [[0, 'cloak', 0.5], [12, 'hall', 0.5], [50, 'hall', 0.3], [90, 'hall', 0.65], [130, 'hall', 0.2], [170, 'hall', 0.5], [210, 'hall', 0.4], [235, 'cloak', 0.5]],
      price: [[0, 'hall', 0.85], [193, 'hall', 0.15], [226, 'hall', 0.7]],
    };
    const route = (who, from, to, path) => {   // replace [from, to] with a new path, then carry on where they were
      const old = S[who], last = old.filter((e) => e[0] <= to).slice(-1)[0];
      S[who] = old.filter((e) => e[0] < from).concat(path, [[to + 1, last[1], last[2]]], old.filter((e) => e[0] > to + 1));
    };
    const HOME = { felix: ['office', 0.35, 'B'], nora: ['studio', 0.55, 'S'] };
    if (V === 'theo') route('theo', W - 5, W + 22, [[W - 5, 'kitchen', 0.5], [W - 4, 'corridor', 0.75, 'T'], [W - 3, 'corridor', 0.15, 'T'], [W - 2, 'security', 0.5], [W, 'corridor', 0.15, 'T'], [W + 1, 'corridor', 1, 'T'],
      [W + 2, 'gallery', 0.5, 'T'], [W + 9, 'corridor', 1, 'T'], [W + 10, 'corridor', 0.75, 'T'], [W + 11, 'kitchen', 0.5], [W + 13, 'corridor', 0.75, 'T'], [W + 14, 'corridor', 1, 'T'], [W + 15, 'dock', 0.15, 'T'],
      [W + 17, 'dock', 0.7, 'T'], [W + 19, 'dock', 0.15, 'T'], [W + 20, 'corridor', 1, 'T'], [W + 21, 'corridor', 0.75, 'T'], [W + 22, 'kitchen', 0.5]]);
    if (HOME[V]) { const [room, hx, F] = HOME[V]; const back = S[V].filter((e) => e[0] <= W - 6).slice(-1)[0];
      route(V, W - 6, W + 15, [[W - 6, 'corridor', 0], [W - 5, 'corridor', hx], [W - 4, room, 0.5], [W - 3, 'corridor', hx, F], [W - 2, 'security', 0.5], [W, 'corridor', 0.15, F], [W + 1, 'corridor', 1, F],
        [W + 2, 'gallery', 0.5, F], [W + 9, 'corridor', 1, F], [W + 10, 'corridor', hx, F], [W + 11, room, 0.5], [W + 13, 'corridor', hx], [W + 14, 'corridor', 0], [W + 15, 'hall', back[2]]]); }
    if (V === 'hollis') S.hollis = [[0, 'cloak', 0.8], [3, 'cloak', 0.3, 'P'], [4, 'cloak', 0.3], [5, 'hall', 0.6], [75, 'hall', 0.4], [135, 'hall', 0.78], [160, 'hall', 0.7], [176, 'hall', 0.82],
      [W - 7, 'cloak', 0.3], [W - 6, 'hall', 0.95, 'P'], [W - 5, 'corridor', 0, 'P'], [W - 3, 'corridor', 0.15, 'P'], [W - 2, 'security', 0.5], [W, 'corridor', 0.15, 'P'], [W + 1, 'corridor', 1, 'P'],
      [W + 2, 'gallery', 0.5, 'P'], [W + 9, 'corridor', 1, 'P'], [W + 10, 'corridor', 0, 'P'], [W + 11, 'hall', 0.95, 'P'], [W + 12, 'cloak', 0.3, 'P'], [W + 13, 'cloak', 0.8, 'P'], [W + 14, 'out', 0]];
    // guests: walk about the hall, some leave late through the cloakroom
    const GUESTCOL = ['#C9A227', '#D97757', '#5A3A22', '#E9C46A', '#8A6E4B', '#B07A9E', '#4E8B8B', '#A3A3A3', '#8A2E2E', '#34D399', '#C68A62', '#6B4A2E'];
    const EXTRA = { price: { name: 'Mr. Price (auctioneer)', col: ['#3A3A3A', '#E3A988', '#C9A227'] } };
    GUESTCOL.forEach((c, g) => {
      const t = [[0, 'cloak', 0.8], [2 + g % 6, 'cloak', 0.3], [3 + g % 6, 'hall', 0.62 + (g % 4) * 0.08]];
      for (let m = 30 + g * 3; m < 236; m += 33) t.push([m, 'hall', 0.05 + ((g * 37 + m * 13) % 90) / 100]);
      if (g % 3 === 0) { const lv = 205 + g * 2; t.splice(t.findIndex((e) => e[0] > lv) < 0 ? t.length : t.findIndex((e) => e[0] > lv)); t.push([lv, 'cloak', 0.3], [lv + 1, 'cloak', 0.8], [lv + 2, 'out', 0]); }
      S['g' + g] = t.sort((a, b) => a[0] - b[0]);
      EXTRA['g' + g] = { name: 'Guest', col: [['#2A2A2A', '#5A3A22', '#C9A227', '#9AA6A0'][g % 4], ['#E8B48C', '#C68A62', '#F1C6A0', '#8D5A3B'][(g + 1) % 4], c] };
    });
    Object.keys(S).forEach((k) => S[k].sort((a, b) => a[0] - b[0]));
    const CAMS = [{ id: 'c1', name: 'Camera 1 · Main hall (stage side)', place: 'hall', from: 0, to: 0.62 }, { id: 'c2', name: 'Camera 2 · East Gallery', place: 'gallery', off: [[W, W + 11]] },
      { id: 'c3', name: 'Camera 3 · Back corridor', place: 'corridor' }, { id: 'c4', name: 'Camera 4 · Loading dock (night view)', place: 'dock' }];

    // ---------- Detective A: 8 rooms. t = what you see, mag = magnifier, uv = UV light, lab = results per lab test; c/cm/cu = clue ids ----------
    const FAKE_MAG = on('nora', 'Up close: thick, glossy brush strokes. In the corners the paint is still a little soft.', 'Up close the picture is made of tiny, perfectly regular dots, like a magazine page. There is not a single brush stroke.');
    const FAKE_UV = on('nora', 'Under UV the whole picture glows evenly and brightly. Old varnish glows yellow-green and patchy; this does not.', 'Under UV the picture stays flat and dull. Old varnish would glow a patchy yellow-green. It does not glow at all.');
    const OLD = 'Old hand-woven linen threads, brittle and yellowed, with a speck of gold paint like the gilding on an old frame.';
    const ROOMS = {
      gallery: { name: 'East Gallery', wall: '#3B4A5A', floor: '#B89A6A', fl: 'wood', scene: 'A long quiet room for the museum\'s best paintings. "Lighthouse at Dawn" hangs alone on the end wall.',
        before: { 0: { tilt: 0 }, 2: { x: 250 } },
        items: [
          { k: 'bigframe', x: 230, y: 18, w: 150, h: 118, tilt: 2, n: '"Lighthouse at Dawn"', t: 'The famous painting in its heavy gold frame. Nora Quinn says it is a fake. To the eye it looks right.', c: 'g_fake', mag: FAKE_MAG, cm: 'g_fake_mag', uv: FAKE_UV, cu: 'g_fake_uv',
            lab: { mag: FAKE_MAG + ' The canvas under it is new, machine-woven cotton.', uv: FAKE_UV, prints: 'No fingerprints at all on the frame or the back. Wiped clean, or gloves.', threads: 'Bright new machine-woven cotton canvas, the kind sold in art shops.' } },
          { k: 'screws', x: 224, y: 60, w: 18, h: 30, n: 'Frame hooks', t: 'Two brass screws hold the frame to the wall hooks.', mag: 'Fresh bright scratches on both screw heads, as if a screwdriver slipped. The dust around them is smudged.', cm: 'g_screws' },
          { k: 'bench', x: 330, y: 230, w: 130, h: 50, n: 'Visitor bench', t: 'A padded bench for visitors.', uv: 'A clear shoe print glows on the seat: someone stood on the bench.', cu: 'g_bench' },
          { k: 'smallpic', x: 40, y: 34, w: 80, h: 62, col: '#7DB8E0', n: '"Harbor Boats"', t: 'A small painting of fishing boats.', mag: 'Real brush strokes and a fine web of cracks in the old paint. This one is genuine.' },
          { k: 'smallpic', x: 470, y: 30, w: 70, h: 80, col: '#C9A227', n: '"Portrait of a Lady"', t: 'A lady in a yellow dress.', mag: 'Brush strokes and old cracks. Genuine.' },
          { k: 'plaque', x: 400, y: 70, w: 50, h: 30, n: 'Wall label', t: '"Lighthouse at Dawn", 1958. M. Lambert. Oil on linen.' },
          { k: 'cctv', x: 548, y: 4, w: 46, h: 30, n: 'Camera 2', t: 'The gallery camera, high in the corner. Its little light is green again.' },
          { k: 'floormarks', x: 140, y: 200, w: 180, h: 110, n: 'Floor by the door', t: { theo: 'Two thin parallel lines on the polished floor, like small wheels, from the door to the painting and back.', felix: 'A few grey flakes of cardboard near the door, and a long straight scrape mark.', nora: 'Three tiny drops of white paint near the door, already dry on the surface.', hollis: 'A long curved scuff near the door, like the corner of something big and flat dragged along.' }[V], c: 'g_floor' },
          { k: 'window', x: 30, y: 150, w: 70, h: 90, n: 'Window', t: 'Locked from the inside. The latch has a thick layer of dust.' },
          { k: 'bin', x: 520, y: 270, w: 36, h: 50, n: 'Bin', t: 'Empty.', lab: {} },
        ] },
      hall: { name: 'Main hall', wall: '#5A3A22', floor: '#7A2E3A', fl: 'carpet', scene: 'Where the gala happened: dinner, the director\'s speech and the charity auction.',
        items: [
          { k: 'stage', x: 20, y: 120, w: 150, h: 110, n: 'Stage', t: 'A low stage with a microphone stand. The speech and the auction happened here.' },
          { k: 'rtable', x: 200, y: 190, w: 110, h: 70, n: 'Table 3', t: 'Napkins, place cards and half a cake.' },
          { k: 'rtable', x: 330, y: 230, w: 110, h: 70, n: 'Head table', t: 'Place cards: Felix Ward, Nora Quinn, Arthur Hollis, two board members.', lab: { prints: 'Too many fingerprints to read.' } },
          { k: 'counter', x: 460, y: 160, w: 130, h: 60, n: 'Bar', t: 'Glasses, an ice bucket, a tip jar.' },
          { k: 'auctionboard', x: 180, y: 40, w: 90, h: 90, n: 'Auction board', t: 'Lot 1: weekend by the sea. Lot 2: dinner with the director. Lot 3: a signed print of "Lighthouse at Dawn".' },
          { k: 'door', x: 300, y: 40, w: 60, h: 110, label: 'STAFF', n: 'Staff door', t: 'A plain door marked STAFF ONLY. It leads to the back corridor.', uv: 'The push plate is covered in smudged prints: lots of people used this door.' },
          { k: 'door', x: 380, y: 40, w: 60, h: 110, label: 'KITCHEN', n: 'Kitchen door', t: 'A swing door to the kitchen. Waiters went in and out all night.' },
          { k: 'cctv', x: 6, y: 4, w: 46, h: 30, n: 'Camera 1', t: 'The hall camera. It points at the stage and the tables on that side, not at the bar.' },
          { k: 'bin', x: 560, y: 260, w: 34, h: 50, n: 'Bin', t: 'Napkins, a broken glass, a programme with cake on it.', lab: {} },
        ] },
      security: { name: 'Security desk', wall: '#2F3F52', floor: '#6B7A8C', fl: 'tile', scene: 'A small room off the back corridor. The camera screens and the computer that runs them.',
        items: [
          { k: 'monitors', x: 150, y: 30, w: 220, h: 100, n: 'Camera screens', t: 'Four screens: the hall, the East Gallery, the back corridor and the loading dock.' },
          { k: 'desk', x: 140, y: 160, w: 260, h: 110, n: 'Desk', t: 'The guard\'s desk. A logbook, a pen, crumbs.' },
          { k: 'keyboard', x: 210, y: 140, w: 110, h: 18, n: 'Keyboard', t: 'The keyboard for the camera computer.', mag: 'The ENTER key and four number keys are shinier than the rest.', lab: { prints: { theo: 'A clear fresh print on ENTER. It matches no museum staff member on file (staff: Ward, Moreno, Quinn, Diaz).', hollis: 'A clear fresh print on ENTER. It matches no museum staff member on file (staff: Ward, Moreno, Quinn, Diaz).', felix: 'A clear fresh print on ENTER. It matches a museum staff member on file: Felix Ward.', nora: 'A clear fresh print on ENTER. It matches a museum staff member on file: Nora Quinn.' }[V] }, c: 's_keys' },
          { k: 'sticky', x: 330, y: 150, w: 26, h: 14, n: 'Under the keyboard', t: `A yellow sticky note with four numbers on it: ${code}.`, c: 's_note', lab: { prints: 'Iris Moreno\'s prints only.' } },
          { k: 'rota', x: 420, y: 40, w: 70, h: 90, n: 'Staff rota', t: `Pinned to the wall by the door, readable from the corridor: "Tonight. Guard breaks: Iris ${fmt(60)}-${fmt(75)} and ${fmt(W - 2)}-${fmt(W + 14)}."`, c: 's_rota' },
          { k: 'mug', x: 160, y: 136, w: 24, h: 24, n: 'Coffee mug', t: 'Cold coffee. "World\'s Okayest Guard" on the side.', lab: { prints: 'Iris Moreno\'s prints.' } },
          { k: 'chair', x: 60, y: 170, w: 60, h: 100, n: 'Chair', t: 'An office chair. Iris\'s cardigan hangs on it.' },
          { k: 'charger', x: 500, y: 190, w: 40, h: 40, n: 'Phone charger', t: 'Plugged into the wall. No phone on it.' },
          { k: 'door', x: 520, y: 40, w: 60, h: 110, n: 'Door', t: 'The door to the back corridor. No lock, just a handle.', uv: 'Smudged prints all over the handle. Too many to read.' },
        ] },
      kitchen: { name: 'Kitchen', wall: '#E8EEF2', floor: '#9DB4CC', fl: 'tile', scene: 'The catering kitchen. A swing door to the hall and a back door to the corridor.',
        items: [
          { k: 'stove', x: 30, y: 100, w: 120, h: 120, n: 'Stove', t: 'Cold now. A pot of soup left on it.' },
          { k: 'fridge', x: 160, y: 50, w: 70, h: 170, n: 'Fridge', t: 'Leftover desserts and cream.' },
          { k: 'trolley', x: 260, y: 170, w: 110, h: 90, n: 'Dessert trolley', t: { theo: 'The dessert trolley. The bottom shelf is empty and has long fresh scuffs, as if something long and flat rode there.' }[V] || 'The dessert trolley, stacked with dirty plates on both shelves.', c: 'k_trolley', lab: {} },
          { k: 'crate', x: 390, y: 220, w: 160, h: 50, label: 'TRAYS', n: 'Long crate "TRAYS"', t: 'A long, flat wooden crate stencilled TRAYS. ' + on('theo', 'It is empty.', 'It holds twelve silver trays.'), c: 'k_crate',
            mag: on('theo', 'A single loose thread is caught on a nail inside, yellowed and brittle.', 'Scratches from the trays. Nothing else.'), cm: 'k_crate_mag',
            lab: { threads: on('theo', OLD, 'Cotton fibres from tablecloths.'), prints: on('theo', 'Prints that match no museum staff member on file.', 'Prints from the catering team.') } },
          { k: 'menuboard', x: 420, y: 40, w: 120, h: 80, n: 'Menu board', t: 'Soup · Sea bass · Lemon tart · Coffee 10:45.' },
          { k: 'apron', x: 560, y: 40, w: 34, h: 100, n: 'Apron hooks', t: 'Four aprons. One hook is empty.' },
          { k: 'sink', x: 240, y: 100, w: 120, h: 60, n: 'Sink', t: 'Full of soaking pans.' },
          { k: 'bin', x: 560, y: 270, w: 34, h: 50, n: 'Bin', t: 'Food scraps and a torn delivery note: "Crates in: 6."', lab: {} },
        ] },
      dock: { name: 'Loading dock', wall: '#3A4553', floor: '#5A5A5A', fl: 'stone', dark: true, scene: 'Dark. The big door to the street where deliveries arrive. The lights are off: you will need a flashlight.',
        items: [
          { k: 'rolldoor', x: 300, y: 20, w: 250, h: 150, n: 'Dock door', t: 'A big roll-up door to the street. Locked now.' },
          { k: 'ramp', x: 300, y: 200, w: 250, h: 100, n: 'Ramp', t: on('theo', 'Fresh thin wheel marks run up the ramp to where the caterer\'s van was parked.', 'Old tyre marks and a dry puddle. Nothing fresh.'), c: 'd_ramp', uv: on('theo', 'A smear of cake cream on the edge of the ramp glows.', 'Nothing glows here.') },
          { k: 'scale', x: 60, y: 230, w: 110, h: 50, n: 'Floor scale', t: 'A scale for weighing deliveries. The numbers are dark.' },
          { k: 'pallet', x: 180, y: 250, w: 100, h: 40, n: 'Pallets', t: 'Empty wooden pallets.' },
          { k: 'shelfbox', x: 40, y: 60, w: 200, h: 100, n: 'Shelves', t: 'Cleaning supplies and spare light bulbs.' },
          { k: 'cctv', x: 560, y: 4, w: 36, h: 26, n: 'Camera 4', t: 'A night-vision camera over the dock door.' },
          { k: 'bin', x: 260, y: 160, w: 34, h: 50, n: 'Bin', t: on('theo', 'Empty. Someone emptied it tonight.', 'Flattened boxes from the caterer.'), lab: {} },
        ] },
      studio: { name: 'Restoration studio', wall: '#D9CBB0', floor: '#A07A4A', fl: 'wood', scene: 'Nora Quinn\'s workroom, where old paintings are cleaned and repaired. Smells of paint and turpentine.',
        items: [
          { k: 'easel', x: 220, y: 60, w: 130, h: 210, full: V !== 'nora', n: 'Easel', t: on('nora', 'An empty easel. Under it, fresh drips of white paint on the floor.', 'A half-finished copy of "Lighthouse at Dawn" on the easel: the sky is done, the sea and lighthouse are only pencil lines. The paint is dry.'), c: 'st_easel', uv: on('nora', 'The white drips glow brightly: very fresh paint.', 'Nothing glows. All the paint here is old and dry.') },
          { k: 'painttable', x: 380, y: 170, w: 150, h: 80, n: 'Paint table', t: 'Tubes of paint, brushes, rags.', mag: on('nora', 'A tube of titanium white squeezed almost flat. Its cap is still wet.', 'The tube caps are all crusted and dry.'), cm: 'st_paint' },
          { k: 'canvasstack', x: 40, y: 120, w: 140, h: 150, n: 'Stack of canvases', t: on('nora', 'Blank canvases leaning on the wall. At the back, a folded bedsheet.', 'Blank canvases, still in their plastic.'), c: 'st_stack', lab: { threads: on('nora', 'From the bedsheet: ' + OLD, 'Plastic wrap. No threads.') } },
          { k: 'lamp', x: 540, y: 60, w: 40, h: 160, n: 'Magnifying lamp', t: 'A big lamp with a magnifying glass, for close work.' },
          { k: 'coat', x: 560, y: 160, w: 34, h: 90, col: '#3A7D44', n: 'Nora\'s raincoat', t: 'A green raincoat on a hook. ' + on('nora', 'In the pocket: a shop receipt for one tube of titanium white, bought today at 4:12 pm.', 'In the pocket: a bus ticket and a lipstick.'), c: 'st_coat' },
          { k: 'sink', x: 400, y: 80, w: 110, h: 60, n: 'Sink', t: 'Brushes soaking in a jar.' },
          { k: 'window', x: 30, y: 20, w: 90, h: 80, n: 'Window', t: 'Painted shut years ago.' },
        ] },
      office: { name: 'Director\'s office', wall: '#2B4C7A', floor: '#5A3A22', fl: 'carpet', scene: 'Felix Ward\'s office, just off the back corridor. Very tidy.',
        items: [
          { k: 'desk', x: 200, y: 170, w: 220, h: 100, n: 'Desk', t: 'Very tidy. A pen set and a photo of a sailing boat.' },
          { k: 'filing', x: 450, y: 60, w: 90, h: 200, n: 'Filing cabinet', t: on('felix', 'A tall filing cabinet, pulled a little away from the wall. Behind it: an empty long cardboard box.', 'A tall filing cabinet, flat against the wall.'), c: 'o_cab',
            lab: { threads: on('felix', 'From inside the box: ' + OLD, 'Paper dust.'), prints: on('felix', 'Felix Ward\'s prints.', 'Felix Ward\'s prints.') } },
          { k: 'safe', x: 60, y: 200, w: 90, h: 80, n: 'Safe', t: 'A small safe. A sticker says "Petty cash".' },
          { k: 'shelf', x: 40, y: 20, w: 140, h: 150, n: 'Bookcase', t: 'Art books and museum reports.' },
          { k: 'coat', x: 560, y: 40, w: 34, h: 100, col: '#2B4C7A', n: 'Felix\'s overcoat', t: 'A navy overcoat on a hook. ' + on('felix', 'In the pocket: a napkin with a phone number and "Buyer: Monday 8 am, cash".', 'In the pocket: reading glasses and the gala invitation.'), c: 'o_coat' },
          { k: 'bin', x: 430, y: 270, w: 34, h: 50, n: 'Bin', t: 'Crumpled drafts of tonight\'s speech.', lab: {} },
          { k: 'window', x: 240, y: 20, w: 120, h: 90, n: 'Window', t: 'Locked. A view of the car park.' },
        ] },
      cloak: { name: 'Cloakroom', wall: '#6B4423', floor: '#8A6A44', fl: 'wood', scene: 'By the front door. Guests leave their coats and bags here and get a ticket.',
        items: [
          { k: 'counter', x: 20, y: 170, w: 230, h: 60, n: 'Counter', t: 'The attendant hands out tickets here. A bell and a ticket book stand.' },
          { k: 'coatrack', x: 300, y: 40, w: 110, h: 160, n: 'Coat rail', t: 'Rows of guests\' coats, mostly collected now.' },
          { k: 'bigrail', x: 430, y: 40, w: 150, h: 120, n: 'Rail for big items', t: on('hollis', 'A rail for big items. One hook is bent, and a long scratch runs down the rail, as if something big and flat was yanked off in a hurry.', 'A rail for umbrellas and big items. Two umbrellas hang here.'), c: 'cl_rail' },
          { k: 'coat', x: 260, y: 60, w: 34, h: 100, col: '#F7F4EC', n: 'Theo\'s jacket', t: 'A white kitchen jacket on the staff hook. ' + on('theo', 'In the pocket: the van keys and a note in pencil, "crate 6 = 60 x 45".', 'In the pocket: the van keys and chewing gum.'), c: 'cl_jacket' },
          { k: 'mirror', x: 140, y: 30, w: 80, h: 110, n: 'Mirror', t: 'A tall mirror. Lipstick marks on the glass.' },
          { k: 'umbrella', x: 520, y: 220, w: 50, h: 80, n: 'Umbrella stand', t: 'Three umbrellas, all dry.' },
          { k: 'bin', x: 30, y: 270, w: 34, h: 50, n: 'Bin', t: 'Ticket stubs and a lost glove.', lab: {} },
        ] },
    };

    // ---------- Detective B: a small cabinet of files (the cameras, photos and lab are drawn by the game) ----------
    const CLUES = {
      b_prog: { who: 'B', look: 'menu', icon: 'pen', title: 'Gala programme', rows: ['7:00 pm · Doors open, drinks', '8:15 pm · Dinner', '9:40 pm · Speech by the director, Felix Ward', '10:15 pm · Charity auction with Mr. Price', '10:45 pm · Coffee and dessert', '11:00 pm · Good night'] },
      b_guests: { who: 'B', look: 'log', icon: 'log', title: 'Guest list', table: true, rows: [['Arthur Hollis', 'collector', 'head table'], ['Felix Ward', 'director', 'head table'], ['Nora Quinn', 'restorer', 'head table'], ['The Okafors', 'donors', 'table 3'], ['Mrs. Bell', 'donor', 'table 3'], ['30 more guests', 'donors', 'tables 1-6']] },
      b_cloak: { who: 'B', look: 'notebook', icon: 'pen', title: 'Cloakroom ticket book', intro: 'Kept by the cloakroom attendant.', table: true,
        rows: [['7:03 pm', 'ticket 12', 'Mr. Hollis: coat + big flat portfolio case (light, empty)'], ['7:05 pm', 'ticket 13-30', 'guests\' coats']].concat(V === 'hollis'
          ? [[fmt(W - 7), 'ticket 12', 'Mr. Hollis took his portfolio out, said he\'d be right back'], [fmt(W + 12), 'ticket 12', 'Mr. Hollis took his coat, in a hurry. Portfolio with him.']]
          : [['9:14 pm', 'ticket 12', 'Mr. Hollis took coat + portfolio and left']]).concat([['10:27 pm', 'ticket 22', 'Mrs. Bell, coat'], ['10:40 pm', 'ticket 25', 'the Okafors']]) },
      b_camlog: { who: 'B', look: 'log', icon: 'log', title: 'Camera system log', intro: 'Printed from the camera computer at the security desk.', table: true,
        rows: [['6:55 pm', 'all cameras', 'ON'], ['7:32 pm', 'Camera 4', 'focus adjusted · code 2290 (Diaz)'], [fmt(W), 'Camera 2', `OFF · code ${code}`], [fmt(W + 11), 'Camera 2', `ON · code ${code}`], ['11:30 pm', 'all cameras', 'night mode']] },
      b_codes: { who: 'B', look: 'log', icon: 'key', title: 'Staff code list', table: true, rows: [['Felix Ward', '1958'], ['Iris Moreno', code], ['Nora Quinn', '7412'], ['Rosa Diaz', '2290']] },
      b_phone: { who: 'B', look: 'phone', icon: 'phone', title: 'Iris\'s phone records', intro: 'From the phone company, with Iris\'s permission.', rows: ['6:40 pm · from MUM: Good luck tonight!', `${fmt(61)} · to PIZZA PLACE · call, 2 min`, `${fmt(W - 1)} · to MUM · call, 14 min`, '11:52 pm · to MUM: home safe'] },
      b_card: { who: 'B', look: 'form', icon: 'pen', title: 'Collection index card', table: true, rows: [['Title', '"Lighthouse at Dawn"'], ['Artist', 'M. Lambert (1921-1990)'], ['Made', '1958, oil on old hand-woven linen'], ['Size', '60 x 45 cm'], ['Bought', '1962, from the artist, for $50']] },
      b_insure: { who: 'B', look: 'notice', icon: 'bolt', title: 'Insurance certificate', rows: ['Harbor Mutual Insurance', '"Lighthouse at Dawn": insured for $2,000,000.', 'A claim is paid only if the painting is lost and never found.'] },
      b_notes: { who: 'B', look: 'notebook', icon: 'pen', title: 'Restoration notes', intro: 'Nora Quinn\'s work diary.', table: true, rows: [['Oct 3', 'Started a practice copy of Lighthouse, for teaching students'], ['Nov 2', 'Sky finished on the copy'], ['Nov 20', 'No time this week, gala prep'], ['Nov 27', 'Cleaned frame of "Harbor Boats"']] },
      b_dock: { who: 'B', look: 'log', icon: 'log', title: 'Loading dock log', table: true, rows: [['5:40 pm', 'Harbor Catering van', '6 crates in'], ['6:20 pm', 'Flower delivery', '2 boxes in']].concat(V === 'theo' ? [[fmt(W + 17), 'Harbor Catering', 'crate 6 out to van (early)']] : []).concat([['11:20 pm', 'Harbor Catering', V === 'theo' ? '5 crates out' : '6 crates out']]) },
      b_order: { who: 'B', look: 'receipt', icon: 'glassdrink', title: 'Catering order', table: true, rows: [['Soup', '40'], ['Sea bass', '40'], ['Lemon tart', '40'], ['Coffee', '40'], ['Crates', '6 (trays, glasses, plates)']] },
      b_letter: { who: 'B', look: 'letter', icon: 'pen', title: 'Letter from Theo Lambert', rows: ['"Dear Mr. Ward, my grandfather painted Lighthouse at Dawn."', '"You paid him fifty dollars when he was sick and poor. It is now worth millions."', '"I am not asking for money. I am asking you to give it back to our family."', '"Theo Lambert" · (the museum replied: "We cannot.")'] },
      b_bank: { who: 'B', look: 'notice', icon: 'bolt', title: 'Bank letter to Felix Ward', rows: ['Seabright Bank · FINAL NOTICE', 'Mr. F. Ward: your loan of $180,000 is overdue.', 'If it is not repaid by Dec 15, we will take your house.'] },
      b_offer: { who: 'B', look: 'letter', icon: 'pen', title: 'Letter from Arthur Hollis', rows: ['"Dear Mr. Ward, for the second time I offer $3 million for Lighthouse at Dawn."', '"Every great painting finds its way to a collector who truly loves it."', '"I am a patient man. A. Hollis" · (refused, both times)'] },
      b_email: { who: 'B', look: 'phone', icon: 'phone', title: 'Email to Nora Quinn', intro: 'Printed from the museum\'s email.', rows: ['From: The Museum Board', 'To: Nora Quinn', '"After careful thought, the Head Restorer job will go to an outside candidate."', '"We thank you for your 20 years with us."'] },
      b_incident: { who: 'B', look: 'statement', icon: 'pen', title: 'Morning report', rows: ['"At 8:05 am Nora Quinn came to the security desk and said the painting in the East Gallery was a fake."', '"Nobody had entered the gallery since the gala closed at 11:00 pm (door alarm log)."', '"The swap must have happened during the gala." · I. Moreno'] },
    };
    const DRAWERS = [
      { name: 'Front office', docs: ['b_prog', 'b_guests', 'b_cloak'] },
      { name: 'Security', docs: ['b_camlog', 'b_codes', 'b_incident', 'b_phone'] },
      { name: 'Collection', docs: ['b_card', 'b_insure', 'b_notes'] },
      { name: 'Deliveries', docs: ['b_order', 'b_dock'] },
      { name: 'Letters', docs: ['b_letter', 'b_bank', 'b_offer', 'b_email'] },
    ];

    // ---------- interviews ----------
    const CAUGHT = {
      theo: 'He looks at the picture for a long time. "...All right. I went to the back. I had cake to deliver to the staff." His hands are shaking.',
      felix: '"I... needed some air. The auction runs itself." He loosens his tie.',
      nora: '"I went to fetch my glasses. Is that a crime now?" She won\'t look at you.',
      hollis: '"An old man forgets the time." He smiles, but his jaw is tight.',
    };
    const TALK = {
      felix: { q: [['Where were you during the evening?', on('felix', 'In the hall, the whole night. I gave my speech at 9:40 and I watched every lot of the auction.', 'In the hall, the whole night. My speech at 9:40, then I sat with the board for the auction.')],
          ['Who could read the guard\'s break times?', 'I write the rota. It\'s pinned up in the security room, by the door. Anyone in the back corridor could read it.'],
          ['Are you in money trouble?', on('felix', '"That is private and has nothing to do with this." He goes red.', '"My loan? I\'m selling my boat to pay it. It\'s embarrassing, not criminal."')]],
        show: { b_bank: on('felix', '"Where did you get that?" He goes very quiet.', '"Yes, the boat goes on sale next week. Ask the harbour."'), b_insure: '"The insurance only pays if it is never found. Find it and nobody gets a cent."',
          o_cab: on('felix', '"That box... came with new frames. It\'s nothing."', null), o_coat: on('felix', 'He stares at the napkin. "That\'s... a friend\'s number."', null), s_keys: on('felix', '"I use that computer all the time. Of course my prints are on it."', null) },
        shrug: '"I don\'t see what that has to do with me."' },
      iris: { q: [['Where were you when the gallery camera went off?', '"On my break, in the staff room, on the phone to my mum. I never touched the cameras!"'],
          ['The camera was switched off with your code.', '"I... keep it on a sticky note under the keyboard. I know. I know! Anyone could have read it."'],
          ['Did you see anyone on your way to your break?', '"I passed someone in the corridor, but I was already dialling Mum. I didn\'t look up. Sorry."']],
        show: { b_phone: '"See? Fourteen minutes with my mum. She talks a lot."', s_note: '"Yes, that\'s my code. I\'m going to get fired, aren\'t I."', b_camlog: '"That\'s my code, but it wasn\'t me! I was in the staff room."' },
        shrug: '"I don\'t know anything about that."' },
      nora: { q: [['Where were you during the evening?', on('nora', '"At the head table for dinner, then in the hall all night. I never left."', '"Dinner at the head table, then the hall. I popped to my studio early on, around 7:40, for my glasses."')],
          ['How did you know it was a fake?', '"The morning light. The colours were dead, flat. I have cleaned that painting three times. I know it like my own hand."'],
          ['Tell me about your copy in the studio.', on('nora', '"A teaching copy, half finished. It\'s on the easel. Go and look." She says it a little too fast.', '"A teaching copy. Half done, on the easel. Go and look."')]],
        show: { b_email: on('nora', '"Twenty years. And they give it to a stranger." Her voice cracks.', '"Yes, I was angry. I\'m still angry. I\'m also not a thief."'), st_easel: on('nora', '"I... moved it. To work on it at home."', null),
          st_coat: on('nora', '"I paint. I buy paint. Shocking."', null), b_notes: '"My diary. Yes, the copy is for teaching."', s_keys: on('nora', '"I... used that computer last week to check a camera."', null) },
        shrug: '"That means nothing to me."' },
      hollis: { q: [['When did you leave the gala?', on('hollis', '"A quarter past nine, I think. My knee was hurting."', '"About a quarter past nine. My knee was hurting."')],
          ['You wanted to buy the painting.', '"Twice. Refused twice. I am a patient man, detective. Patience is not a crime."'],
          ['What was in your portfolio case?', on('hollis', '"Nothing. Some papers."', '"Nothing at all. I hoped to buy the signed print in the auction. I left before it started."')]],
        show: { b_offer: '"My letters, yes. Generous offers, both of them."', b_cloak: on('hollis', 'He reads it twice. "Those times are wrong. The girl was busy."', '"There. 9:14 pm. I was home by ten."'), cl_rail: on('hollis', '"Many people use that rail."', null) },
        shrug: '"Fascinating. Unrelated."' },
      theo: { q: [['Where were you during the evening?', on('theo', '"Kitchen and hall, serving all night. I never went near the galleries."', '"Serving. Kitchen to hall and back, all night. Once out to the dock early on, for ice."')],
          ['Do you know the painting?', '"My grandfather painted it. They paid him fifty dollars. Fifty." He shrugs. "But tonight I\'m here to serve cake."'],
          ['What\'s in the TRAYS crate?', on('theo', '"Trays. What else would be in it?"', '"Twelve trays. Count them, if you like."')]],
        show: { b_letter: '"Yes, I wrote it. Asking is allowed."', b_card: '"Fifty dollars, see? Fifty."', b_dock: on('theo', '"I took a crate out early. Empty ones go back early."', '"Normal night. Six in, six out."'),
          k_crate: on('theo', '"It\'s empty because... I unpacked it."', null), cl_jacket: on('theo', '"Measurements for... a cake box."', null) },
        shrug: '"No idea, sorry. Want some lemon tart?"' },
      rosa: { q: [['What did you see tonight?', { theo: '"Late in the evening I saw the dessert trolley going down the back corridor towards the dock. Desserts go to the hall, not the street."', felix: '"Mr. Ward walked out of the hall during the auction. He never misses his own auction."', nora: '"During dinner Nora\'s chair at the head table was empty for a while."', hollis: '"I thought Mr. Hollis had gone home early, but later I saw him by the cloakroom, in a hurry."' }[V]],
          ['Did you see Iris tonight?', '"She went past me on her phone, to the staff room. Talking to her mother, as always."'],
          ['Where were you working?', '"The hall mostly, and the back corridor now and then."']],
        show: {}, shrug: '"I just clean, love."' },
      jun: { q: [['What did you photograph?', '"Everything in the hall, every few minutes, plus the arrivals at the cloakroom. They\'re all in the control room."'],
          ['Did anything strike you as odd?', '"People came and went from the staff door all night. I didn\'t pay attention."']], show: {}, shrug: '"I only see things through my lens."' },
    };
    Object.values(TALK).forEach((t) => Object.keys(t.show).forEach((k) => { if (t.show[k] == null) delete t.show[k]; }));

    // ---------- the answer, evidence that counts, the ending ----------
    const strongSet = ['g_fake_mag', 'g_fake_uv', 'g_screws', 'g_bench', 'g_floor', 's_note', 's_rota', 'b_camlog', 'b_codes', 'lab:s_keys:prints',
      ...{ theo: ['k_trolley', 'k_crate', 'k_crate_mag', 'lab:k_crate:threads', 'd_ramp', 'cl_jacket', 'b_dock', 'b_letter'], felix: ['o_cab', 'lab:o_cab:threads', 'o_coat', 'b_bank'],
        nora: ['st_easel', 'st_paint', 'st_stack', 'lab:st_stack:threads', 'st_coat', 'b_email', 'lab:g_fake:uv', 'lab:g_fake:mag'], hollis: ['cl_rail', 'b_cloak', 'b_offer'] }[V]];
    const NAME = PEOPLE[V].name;
    const story = {
      theo: `${NAME} brought a printed copy of the painting in the long TRAYS crate on his dessert trolley. During the director's speech, when everyone was in the hall and Iris had just left for her break, he used the code on the sticky note to switch off the gallery camera, swapped the canvas in the frame, and wheeled the real painting out to his van. His family had been paid fifty dollars for it.`,
      felix: `${NAME} owed the bank $180,000 and had a secret buyer waiting. During his own auction, while Mr. Price ran the lots and Iris was on her break, he switched off the gallery camera with the code from the sticky note, swapped in a printed copy, and hid the real painting in a long box behind his filing cabinet.`,
      nora: `${NAME} had just been passed over for Head Restorer after twenty years. She finished her "teaching copy" in secret and, during dinner, while Iris was on her break, switched off the gallery camera with the sticky-note code and swapped the paintings. The real one went into her studio wrapped in a bedsheet. Then she "discovered" the fake herself the next morning.`,
      hollis: `${NAME} pretended to leave early but stayed. Between the speech and the auction, while Iris was on her break, he took his empty portfolio case, slipped down the back corridor, switched off the gallery camera with the code from the sticky note, swapped in a printed copy and walked out through the cloakroom with the real painting.`,
    }[V];
    const timeline = [[fmt(W - 3), 'Iris leaves the security room for her break, on the phone to her mother.'], [fmt(W - 2), `${NAME} slips into the security room and reads the sticky note under the keyboard.`],
      [fmt(W), `Camera 2 (East Gallery) is switched off with the code ${code}.`], [fmt(W + 2), `${NAME} swaps the real painting for the fake.`], [fmt(W + 11), 'Camera 2 is switched back on.'],
      ...{ theo: [[fmt(W + 17), 'The crate goes out to the caterer\'s van at the loading dock.']], felix: [[fmt(W + 11), 'The real painting goes into a box behind the filing cabinet.']],
        nora: [[fmt(W + 11), 'The real painting goes into the studio, behind the blank canvases.']], hollis: [[fmt(W + 13), 'He collects his coat and leaves with the portfolio.']] }[V],
      ['8:05 am', 'Nora Quinn notices the fake.']];
    const herring = (k) => ({ felix: ['Felix Ward', 'had a big debt, but the hall camera and the photos show where he was when the camera went off.'], iris: ['Iris Moreno', 'had her code used, but she was on a 14-minute phone call in the staff room; her code was on a note anyone could read.'],
      nora: ['Nora Quinn', 'had a painted copy in her studio, but the fake is a print, and she was seen in the hall at the time.'], hollis: ['Arthur Hollis', 'wanted the painting badly, but the cloakroom book and photos show he was gone or in plain sight.'],
      theo: ['Theo Lambert', 'had the strongest reason of all, but he was serving in the hall at the time.'] })[k];
    return {
      id: 'gallery', num: '002', cat: 'standard', title: 'The Night Gallery', titleVi: 'Phòng Tranh Lúc Nửa Đêm', mins: '40-50', variant: V, W, code,
      org: 'Seabright Art Museum', desk: 'control', TOOLS: ['hand', 'light', 'uv', 'mag', 'bag'], BAG: 6,
      brief: `<p><b>Seabright Art Museum. A charity gala, Saturday night, 7 to 11 pm.</b></p>
        <p>The museum's most famous painting, <b>"Lighthouse at Dawn"</b>, hangs alone in the East Gallery. At 8:05 the next morning the restorer, Nora Quinn, looks at it in daylight and says: <b>"That is not our painting."</b></p>
        <p>It is a very good fake. The real painting was swapped during the gala, in a room with a camera, and nobody saw it go.</p>
        <p>Detective A searches the museum with a tool belt: a flashlight, a UV light, a magnifier and evidence bags for the lab. Detective B sits in the security control room: the cameras, the photographer's pictures, the lab and the files.</p>`,
      questions: ['When exactly was the painting swapped?', 'Who did it, and how did they get it out?', 'Why?'],
      PEOPLE, EXTRA, SUSPECTS, CLUES, ROOMS, DRAWERS, TALK, HOW, WHY, KEY, S, CAMS, CAUGHT,
      HINTS: ['First find out WHEN it happened. A machine wrote it down.', 'At that moment, who can you NOT see anywhere, on any camera or in any photo? And who walked into the security room just before?', 'Whoever did it had to carry the real painting somewhere. Search the rooms for where it went, and send what you find to the lab.'],
      STRONG: strongSet, KEYLIST: strongSet.filter((k) => !/^b_(prog|guests)$/.test(k)),
      culprit: V, solved: `${NAME} swapped "Lighthouse at Dawn".`, story, timeline,
      herrings: SUSPECTS.filter((k) => k !== V).map(herring),
      wrong: { who: (n) => `${n}? Check where they were when the camera went off: you can find them.`, how: 'Right person, wrong way. Where did the real painting go? Look for traces of it.', why: 'Right person and right way, but think again about why. What did they stand to gain?' },
      fmt, ALIBI: { iris: 'b_phone', hollis: 'b_cloak' },
    };
  }
  return { id: 'gallery', num: '002', cat: 'standard', title: 'The Night Gallery', titleVi: 'Phòng Tranh Lúc Nửa Đêm', mins: '40-50', make, variants: VARIANTS.length };
});
