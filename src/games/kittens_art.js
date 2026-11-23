    /* =========================================================================
       HOT POTATO CATS card art: original pixel pictures (16x16 grids, one letter per pixel).
       Palette letters: k ink, w white, c cream, o orange, r red, y yellow, b brown, d dark brown, g green,
       G dark green, p pink, P dark pink, u blue, U dark blue, s grey, S dark grey, t teal, m mauve, '.' empty.
       ========================================================================= */
    const KK_PAL = { k: '#050E18', w: '#F7F4EC', c: '#F3E3C3', o: '#F59E3B', r: '#E4572E', y: '#F5D041', b: '#B07A45', d: '#7A4E2A', g: '#34D399',
      G: '#1F8A5E', p: '#FB9DB0', P: '#E05A7A', u: '#7CC4F0', U: '#3C7FC0', s: '#B9C7D6', S: '#6E8299', t: '#2DD4BF', m: '#B8A3D9' };
    const KK_ART = {
      bomb: [ // the hot potato, steaming
        '......r..r......', '.....r.yr.r.....', '......ryyr......', '.......rr.......', '....kkkkkkkk....', '...kbbbbbbbbk...', '..kbbdbbbbbbbk..', '..kbbbbbbbdbbk..',
        '..kbbbbkbbkbbk..', '..kbdbbbbbbbbk..', '..kbbbkbbkbbbk..', '..kbbbbkkbbbdk..', '...kbbbbbbbbk...', '....kkkkkkkk....', '................', '................'],
      defuse: [ // oven mitt
        '................', '....kkkkk.......', '...kgggggk......', '...kgwgwgk......', '...kgggggk.kkk..', '...kgwgwgkkgggk.', '...kggggggggggk.', '...kgwgwgggwgk..',
        '...kgggggggggk..', '...kgwgwgwgggk..', '...kgggggggggk..', '...kkkkkkkkkkk..', '...kwwwwwwwwwk..', '...kwwwwwwwwwk..', '...kkkkkkkkkkk..', '................'],
      pounce: [ // attack: a paw swipe with claws
        '................', '..k...k...k.....', '..kk..kk..kk....', '...kk..kk..kk...', '....k...k...k...', '................', '....kkk.kkk.....', '...kooo kooo k..',
        '...kooookoooook.', '..kkkkkkkkkkkok.', '.koooooooooook..', '.kooopppooooook.', '.koopppppooooook', '..kopppppoooook.', '...kkkkkkkkkkk..', '................'],
      nap: [ // skip: a sleeping cat on a pillow
        '..........kkk...', '...........k....', '..........k..kk.', '..........kkk.k.', '.............k..', '...k...k....kk..', '..kok.kok.......', '..koookook......',
        '.kooooooook.....', '.kokkoookkok....', '.koooooooooook..', '..kooooooooooook', 'kkkkkkkkkkkkkkkk', 'kuuuuuuuuuuuuuuk', 'kUUUUUUUUUUUUUUk', 'kkkkkkkkkkkkkkkk'],
      shake: [ // shuffle: crossing arrows
        '................', '..........kk....', '..........kyk...', 'kkkk....kkkyyk..', 'kyyykk..kyyyyyk.', 'kkkkyyk.kkkyyk..', '....kyykk.kyk...', '.....kyyk..kk...',
        '.....kyyk..kk...', '....kyykk.kyk...', 'kkkkyyk.kkkyyk..', 'kyyykk..kyyyyyk.', 'kkkk....kkkyyk..', '..........kyk...', '..........kk....', '................'],
      peek: [ // peek: a big eye
        '................', '................', '.....kkkkkk.....', '...kkwwwwwwkk...', '..kwwwwkkwwwwk..', '.kwwwwkttkwwwwk.', 'kwwwwkttttkwwwwk', 'kwwwwkttkttkwwwk',
        'kwwwwkttttkwwwwk', '.kwwwwkttkwwwwk.', '..kwwwwkkwwwwk..', '...kkwwwwwwkk...', '.....kkkkkk.....', '................', '................', '................'],
      beg: [ // favor: a wrapped gift
        '................', '....kk....kk....', '...kppk..kppk...', '....kppkkppk....', '.kkkkkkPPkkkkkk.', '.kpppppPPpppppk.', '.kpppppPPpppppk.', '.kkkkkkPPkkkkkk.',
        '..kmmmmPPmmmmk..', '..kmmmmPPmmmmk..', '..kmmmmPPmmmmk..', '..kmmmmPPmmmmk..', '..kmmmmPPmmmmk..', '..kkkkkkkkkkkk..', '................', '................'],
      nope: [ // no way: a stop sign with a raised paw
        '................', '.....kkkkkk.....', '....krrrrrrk....', '...krrrwwrrrk...', '..krrrwwwwrrrk..', '.krrwwwwwwwwrrk.', '.krrwwwwwwwwrrk.', '.krrwwwwwwwwrrk.',
        '.krrrwwwwwwrrrk.', '.krrrrwwwwrrrrk.', '..krrrrrrrrrrk..', '...krrrrrrrrk...', '....krrrrrrk....', '.....kkkkkk.....', '................', '................'],
      c1: [ // sock cat: a cat peeking out of a striped sock
        '................', '...k......k.....', '..kok....kok....', '..koookkkooook..', '..kokkoookkok...', '..koooopoooook..', '...kooooooook...', '...kuuuuuuuuk...',
        '...kwwwwwwwwk...', '...kuuuuuuuuk...', '...kwwwwwwwwk...', '...kuuuuuuuukkk.', '...kwwwwwwwwwwk.', '...kuuuuuuuuuuk.', '...kkkkkkkkkkkk.', '................'],
      c2: [ // box cat: a cat sitting in a cardboard box
        '................', '................', '...k.......k....', '..ksk.....ksk...', '..ksskkkkkssk...', '..kskkssskkssk..', '..kssssPsssssk..', '..ksssssssssk...',
        'kkkkkkkkkkkkkkkk', 'kbbbbbbbbbbbbbbk', 'kbbbbbbbbbbbbbbk', 'kbbbbbdddbbbbbbk', 'kbbbbbbbbbbbbbbk', 'kbbbbbbbbbbbbbbk', 'kkkkkkkkkkkkkkkk', '................'],
      c3: [ // loaf cat: a cat tucked up like a bread loaf
        '................', '................', '................', '....k......k....', '...kyk....kyk...', '...kyykkkkyyk...', '..kyykkyyykkyk..', '..kyyyyyPyyyyyk.',
        '.kyyyyyyyyyyyyyk', '.kyddyyyyyyyddyk', '.kyyyyyyyyyyyyyk', '.kyyyyyyyyyyyyyk', '.kddyyyyyyyyyddk', '..kkkkkkkkkkkkk.', '................', '................'],
      c4: [ // yarn cat: a cat playing with a ball of yarn
        '................', '..k.....k.......', '.kSk...kSk......', '.kSSkkkSSk......', '.kSkkSSkkSk.....', '.kSSSSPSSSSk....', '..kSSSSSSSk..kkk.', '...kSSSSSSk.kPPPk',
        '...kSSSSSSkkPpPPk', '...kSSSSSSSkPPpPk', '...kSkSSkSk.kPPPk', '...kk.kk.kk..kkk.', '.............k...', '..............kk.', '................', '................'],
      c5: [ // toast cat: a cat face poking through a slice of toast
        '................', '..kkkkkkkkkkkk..', '.kddddddddddddk.', '.kdccccccccccdk.', '.kdckcccccckcdk.', '.kdckkcccckkcdk.', '.kdcckwccwkccdk.', '.kdccckkkkcccdk.',
        '.kdccccPPccccdk.', '.kdcccckkccccdk.', '.kdccccccccccdk.', '.kdccccccccccdk.', '.kdccccccccccdk.', '.kddddddddddddk.', '..kkkkkkkkkkkk..', '................'],
      back: [ // card back: a cat silhouette
        '................', '...k.......k....', '..kyk.....kyk...', '..kyykkkkkyyk...', '..kyyyyyyyyyyk..', '..kykkyyyykkyk..', '..kyyyyyyyyyyk..', '..kyyyykkyyyyk..',
        '...kyyyyyyyyk...', '....kkkkkkkk....', '...kyyyyyyyyk...', '..kyyyyyyyyyyk..', '..kyyyyyyyyyyk..', '..kyyyyyyyyyyk.k', '...kkkkkkkkkkkkk', '................'],
    };
    function kkArtSVG(t) {
      const rows = KK_ART[t] || KK_ART.back;
      let r = '';
      rows.forEach((row, y) => { for (let x = 0; x < 16; x++) { const ch = row[x]; if (ch && ch !== '.' && ch !== ' ' && KK_PAL[ch]) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${KK_PAL[ch]}"/>`; } });
      return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
    }
