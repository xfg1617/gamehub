# GameHub (formerly PlayStack)

A U.S.-focused browser game hub, inspired by dautri.com, shipped as **one self-contained HTML file**
(`dist/gamehub.html`). Renamed from PlayStack to **GameHub** in Nov 2026 (saved-data keys still start with `ps_`
/`playstack_` on purpose, so nobody loses their profile). The folder is still called `playstack/`.
Offline it needs no server: profile, XP, stats and streaks live in the browser's localStorage. With an
online service configured (section 5e) it also gets real chat, rooms and ranked Elo.

Inna is the owner of this project. **She has no coding background** — explain things in plain English,
skip the jargon, and don't hand back code snippets as an explanation. She wants direct, practical
output: say what changed and what it does, not how clever the implementation is.

---

## 0. How Inna updates the site (live since Nov 2026)

* Live at **https://gamehub.us.com** (domain at Porkbun, hosted on Netlify by drag-and-drop, Supabase backend,
  Google sign-in configured). Discord: https://discord.gg/BE5xR57DHm.
* **The code lives on GitHub: https://github.com/xfg1617/gamehub (branch `main`)**, pushed Nov 23 2026. Work in a
  clone of it; after a change: `python3 build.py`, run the tests, commit (including the built `dist/site/`) and push
  `main`. Once Inna links the repo in Netlify (GITHUB-DEPLOY.md step 3), every push to `main` goes live by itself.
  `tools/tailwind/node_modules` is not in git: `cd tools/tailwind && npm install` in a fresh clone.
* **Deploys (Nov 2026): moving to GitHub → Netlify** (`backend/GITHUB-DEPLOY.md`). Netlify publishes `dist/site/`
  (`netlify.toml`): index.html + `og/*.png` banners + favicon + `_redirects` (`/r/*` → index.html), and runs
  `netlify/edge-functions/room-preview.js` (made by build.py) for link previews. **Commit the built `dist/site/`**
  (Netlify builds nothing). Until her repo is connected: send `dist/upload-to-netlify/index.html` (or the
  `dist/site` folder for drag-and-drop) and a fresh `gamehub.zip`.
* Each session: unzip / clone, read this file, make the change, `python3 build.py`, run `t_all.py` + the tests for
  what changed, then push (or send files).
* Always tell her whether Supabase needs a change (new SQL, settings). Usually it doesn't.
* Logos: `logo/` (full logo navy/transparent, 512 icon navy/transparent).

## 1. Non-negotiable design rules

These were decided over many rounds. Do not drift from them, and do not "modernise" the look.

* **Arcade / pixel-art look.** Navy ocean background, ink-outlined square panels with hard drop
  shadows, chunky 3D-press buttons that visibly depress.
* **Square corners everywhere.** Only actual game pieces (pool balls, checkers, poker chips) are round.
* **No purple or indigo gradients. No neon glows. No soft rounded-square "card" sections.**
  Anything that looks like a generic AI-generated website or a SaaS dashboard is wrong.
* **Fonts:** `Outfit` and `Plus Jakarta Sans` for UI text; `Arcade Pixel` (Jersey 15) for pixel labels,
  applied via the `.pix` class.
* **Palette** (set at runtime in the Tailwind config, also available as CSS variables):
  `ink #050E18`, `canvas`, `card`, `elevated`, `well`, `line`, `bone #F7F4EC`, `muted #9DB4CC`,
  `amber #F5B041`, `teal #2DD4BF`, `coral #FB7185`, `emerald #34D399`.
* **Art is hand-drawn SVG or canvas.** No stock images, no icon fonts, no emoji as the main artwork
  (emoji are fine as small avatars/labels).
* **Accounts (changed Nov 2026, Inna's request):** everyone starts as an invisible *anonymous* guest (no sign-in
  needed to play). "Save progress · Log in" lets a guest create a real account (email + password, or Google); the
  new account starts fresh (Inna's rule, Nov 2026; same Supabase user, upgraded). Logging in on another device loads
  the account's progress. 13+ only (checkbox on sign-up, Terms/Privacy page). Names are unique online.

## 2. How the file is built

The shipped artifact is `dist/gamehub.html`. **Never hand-edit it** — it is generated. Edit the files below
and rebuild.

```
base/playstack_base.html   the page itself: layout, menus, profile, Naval Grid, Daily Word,
                           Four-in-a-Row, sounds, navigation, the keyboard/bootstrap code
src/core.js                the shared game framework (registerGame, timers, setup screens, room codes,
                           leave check, chat, motion helpers, chips, ...)
src/icons.js               pixel icons for the older registered games' tiles (new games add their own)
src/css/NN-name.css        styles, added in file-name order — the number keeps the order CSS needs
src/games/*.js             one file per game, added in alphabetical order
src/dict.json              word list for Word Connect
build.py                   inserts the CSS before </style> and the JS before section "8. KEYBOARD LISTENERS"
```

```bash
python3 build.py              # rebuild dist/gamehub.html (styling is built in; add --cdn to skip that)
node --check dist/_check.js   # syntax-check the generated script block
```

**Styling is built into the file:** `build.py` runs Tailwind 3.4 from `tools/tailwind/` (its `node_modules` is not
in the zip — `cd tools/tailwind && npm install` to get it) over the finished page and puts the CSS at the END of
`<head>` (where the old CDN put it, so Tailwind classes win over the page's own rules — e.g. `lg:hidden` on the
phone tab bar). Without the tool the build keeps the CDN and says so. Classes made from pieces at run time must be
listed in `SAFELIST` in build.py.

Adding a new game needs **no build.py change**: drop `src/games/foo.js` (and `src/css/NN-foo.css`) in.
History: until Nov 2026 only the built HTML existed; `src/` was re-created from it and proven to rebuild it
byte-for-byte. All earlier edits to the old base (sound engine, navigation, profile stats) are now simply part
of `base/playstack_base.html`.

## 3. The game framework (`src/core.js`)

A game is one IIFE that ends with `registerGame(mod)`.

```js
const mod = {
  id, name, icon, cats, sub, color, tone, btn,     // tile + shelf placement
  blurb,                                            // one line on the tile
  rules: { tag, steps: [...], tip },                // shown in the Rules view
  profileTiles: (s) => [...], extraRows: (s) => '', // profile page stats
  engine: { ... },                                  // pure functions, for headless tests
  open(root) { ... }, close() { ... },
};
registerGame(mod);
```

Helpers available to every game — **always use these, never the raw browser equivalents**, because
they are cancelled automatically when the player leaves a game:

| use | instead of |
| --- | --- |
| `gTimeout` / `gClear` | `setTimeout` / `clearTimeout` |
| `gInterval` / `gClearInt` | `setInterval` |
| `gRaf` | `requestAnimationFrame` |
| `gOn(target, type, fn)` | `addEventListener` |
| `gSleep(ms)` | a bare promise (resolves `false` if the player left) |

Also: `gameShell(root, mod, toolsHTML, maxCls)` builds the header; `setupScreen(body, mod, opts, onStart)`
builds the pre-game options screen; `makeClock(host)` returns `{start, stop, idle}`;
`reportGame(id, result, {elo, xp, label})` records the match; `gstat(id)` gets that game's stat object;
`gameResult({...})` shows the end-of-game modal; `showToast(msg, 'error')`; `esc`, `pct`, `srow`,
`rnd`, `pick`, `shuffle`; `profile` (the live player object).

`GT.cur` is a session token. Every game does `tok: ++GT.cur` on start and checks
`if (G && G.tok === tok)` inside delayed callbacks, so a game that was closed can't keep running.

**Sound:** `SFX.play(name)`. Defined names include `move capture check card deal chip dice ball rail
pocket roll crash pins strike meow nope draw reveal vote coin word wrong win lose tick`. New sounds are
built with `SFX.def(name, fn)` using `SFX.tone({type,f1,f2,t,d,v})` and `SFX.noise({...})` — no audio files.

## 4. Games currently in the hub

In `base/` (older, not in `GAME_MODS`): **Naval Grid** and **Daily Word** (offline versions). Four-in-a-Row now
lives in `src/games/fourinarow.js`; online versions: `navalnet.js` (hidden tile) and `wordduel.js`.

In `src/games/` (16, all registered through `registerGame`): Chess, Checkers, **Pool**, Poker,
Blackjack, Bowling, Word Connect, Find the Impostor, Hot Potato Cats, Color Clash, Property Tycoon,
Doodle Chain, **Tic-Tac-Toe**, **Dominoes**, **Frontier Isles**, **Manor Mystery**.

Like Property Tycoon (our Monopoly-style game), **Frontier Isles** (Catan-style) and **Manor Mystery**
(Clue-style) are *original* games in a familiar genre: own names, art, suspects, tools and rooms. Never use
the trademarked names, characters or art of the games they resemble.

* **Tic-Tac-Toe** — 3 computer levels (Unbeatable = perfect minimax; `test/t_ttt.py` checks all 6,112
  games), pass & play, best of 1/3/5. Board squares must stay equal: rows/cols are `minmax(0,1fr)`.
* **Dominoes** — double-six, Draw or Block rules, 2–4 players, play to 100/150 or one round. The line is a
  "snake": rows alternate direction (`layoutLine`). Tiles keep `data-fk` ids, so `gFlip` slides played tiles
  from hand/seat to the table and drawn tiles out of the boneyard. `test/t_dom.py`.
* **Frontier Isles** — 19-hex island, 5 resources, roads/villages/towns, bank trade 4:1 (or 3:1), the
  Bandit on a 7, Longest Road, first to 8/10. Bots place by number probability ("dots") and spread.
  **Trading between players:** on your turn "🤝 Trade with players" builds any offer (give / want); each bot
  answers via `botAccepts` (it values cards by `wants`: what its next town / village / road needs) and
  refuses anyone within 2 points of winning; if several accept, you pick. Bots also ask the table on their
  turn (`botOffer`, 1-for-1, then 2-for-1): you get Accept / No thanks (auto-declines after 15 s), other bots
  may take it. Cards fly both ways (`swap`). `test/t_isles.py`, `test/t_itrade.py` (`window.__fast` speeds them up).
* **Manor Mystery** — deduction: 6 suspects, 6 tools, 9 rooms on a 3×3 map (corner passages). Bots keep a
  knowledge grid and deduce from passes, shown cards and hand sizes (`deduce`); Sharp bots only accuse when
  certain. Notebook auto-fills only direct facts. `test/t_manor.py`.
* **Word Connect** works by tapping letters (tap the last one again to undo, ⌫ Back); there is **no Enter
  button** — as soon as the letters spell a word not found yet, it goes in by itself (`autoEnter`, after a
  short pause). Dragging still submits on release; the Enter key still works. `test/t_wc_tap.py`.

## 5. Pool — the physics engine (`src/games/pool.js`)

Rewritten to be a real simulation; don't replace it with arcade approximations without being asked.

**Units.** 1 ball = 57 mm = 22 px, so **385 px = 1 m**; `g = 3777 px/s²`. Table playing surface is
912 × 452 px (2.37 m × 1.17 m). Frame is x-right, y-down, **z into the screen**.

**Ball state:** `x, y, vx, vy, wx, wy, wz, on, n, m` where `m` is a 9-float body→world orientation
matrix used only for drawing (so numbers and stripes really turn as the ball rolls).

**Constants:** `MU_S 0.2` (sliding), `MU_R 0.021` (rolling), `MU_BB 0.06` (ball-ball),
`MU_C 0.25` (cushion), `E_BB 0.95`, `ALPHA_Z 14` (spin decay), `DT 1/960`, `VMAX 2700` (7 m/s).

**The key idea:** a struck ball **slides** on the cloth until the contact point stops slipping
(slip `u = (vx + R·wy, vy − R·wx)`), then **rolls**. That one distinction is what produces draw,
follow and stun. Cushions lose energy with speed (`e = max(0.5, 0.86 − 0.04·v_in_m/s)`) and side-spin
changes the rebound angle. Cushion segments end in rounded jaw tips, so balls can rattle out of pockets.

**Verified behaviours** (keep these true if you touch the physics — `test/t_pphys.py` checks them):

| check | expected |
| --- | --- |
| ball rolling at 1 m/s | travels ≈ 2 m |
| centre hit, full contact | cue ball stops dead |
| natural roll, full contact | cue ends at 2/7 of impact speed |
| bottom spin | cue ball comes back |
| half-ball cut with stun | cue leaves at ≈ 90° to the object ball |
| running vs reverse english | ≈ −14° vs ≈ +8° off the no-spin rebound |
| 60 random breaks | no ball escapes the table, no NaN |
| one physics frame | well under 1 ms |

**Controls** (Inna specified these; don't "simplify" them):
press-and-drag anywhere on the table to swing the aim line; a full-width **pull-back power bar**
(pull left, release to shoot, < 3 % cancels); and a **cue-ball picture** to choose the hit point
(top = follow, bottom = draw, sides = english), which resets to centre after each shot.
Mouse wheel / arrow keys / ◀ ▶ buttons fine-tune the aim; Space re-fires at the last power.
The aim preview runs the *same* physics on a cloned table, so the ghost ball is exact.

## 5b. Motion — how fast things move (`MOTION` in `src/core.js`)

Inna found the games too fast and glitchy, so every game now shares one calm pace. Keep it.

* `MOTION` holds the timings (slide 480 ms, deal 440 ms, flip 340 ms, card-to-card stagger 150 ms).
* `gSnap(root)` + `gFlip(root, before, {from})` — give moving things a `data-fk` id (use `gKey(obj)`
  for card objects); after a redraw they slide from their old spot, new ones fly in from `from`
  (the deck), and a card whose `data-face` changed turns over. `gFlip` returns how long it takes, so
  the game can wait that long before the next move. `playingCardHTML(c, {fk})` supports this.
* `gSlide(el, fromRect(s))` slides one piece (chess, checkers hops); `gGhost(el)` fades a captured
  piece; `gFly(from, to, html)` sends a card across the table (Hot Potato Cats, poker chips).
* **Never put a CSS entry animation (like the old `deal-in`) on HTML that gets redrawn** — it replays on
  every redraw. That was the "cards blink" bug in poker and blackjack.
* Bots wait for the previous move to land, then "think" ~0.7–1.5 s before moving.
* Property Tycoon's board is built once and then only changed squares are updated; pawns live in
  their own layer and hop one square at a time. Below 560 px wide it switches to a tall 8×14 board.
  Square art is pixel SVG from the `ART` table in `tycoon.js` (no emoji). Each square's colour band faces
  the centre of the board; when a square is bought, its outer edge turns the owner's colour.
* Tycoon dice are **flat on purpose** (no CSS 3D): the earlier 3D cubes made some browsers flash
  semi-transparent dark lines/rectangles at random spots on the board while rolling. A throw = the die
  flies in, spins, flicks through faces (slowing down), squashes on two bounces and lands. The player
  holds the button (or the dice) to shake and lets go to throw; longer shake = harder throw. No see-through
  shadows under the dice. Don't bring back `perspective` / `preserve-3d` here.

* Chips (Poker, Blackjack) are drawn by `chipSVG(value)` (one chip from above) and `stackSVG(amount)`
  (towers of chips from the side) in `core.js`. Poker: a bet slides from the seat to the spot in front
  of it, bets sweep into the pot when a betting round ends, the pot slides to the winner. Blackjack:
  chips fly into the betting circle; at the end the dealer pays into the circle and you collect, or
  the dealer takes the bet.
* Checkers: the computer's slide is started *after* your turn begins, because starting your turn
  redraws the board (that redraw used to cut its slide off, so its pieces jumped).
* Property Tycoon auctions (setting, on by default): a skipped property goes to auction; bots value
  it by price, set completion and cash reserve (`botValue`). Naval Grid has a "Ships may touch"
  setting (`NG_TOUCH`, checked in `canPlace`).
* Tycoon board flicker fix: `sizeBoard()` sizes every square in whole *screen* pixels and lands the board
  on a screen pixel; the lines between squares are each square's own 1px border over a cream board
  (no dark gaps to shimmer). Don't put `gap` back on `.ty-board`.
* The board is re-fitted by a ResizeObserver on its column, not just on window resize. On a first visit the
  Tailwind CDN creates the two-column layout a moment *after* the board is drawn, so a board measured once
  came out ~1000px wide and pushed the side panel off screen (`test/t_tyfirst.py` reproduces this).
  Anything else that measures the page once at start-up has the same trap.
* Tycoon money is always visible: every cash change calls `moneyFlow(from, to, amount)` (a player index,
  or 'bank' = board centre, 'start', 'pot' = Free Parking, 'tile:N'), which flies green bills there.
  Balances on the player panels count up/down (`G.shown` → `G.goal`, `syncCash` runs at the end of each
  render), a receiver's balance waits until the bills arrive, and a red −$ / green +$ pops above the panel
  (or above the pawn when the panel is off screen on a phone). New money code must call `moneyFlow` too.

## 5a. Bowling (`bowling.js`) — first-person, pixel-art 3D

* Seen from the foul line through a perspective camera (`proj`, `setView`); drawn on a low-resolution
  canvas scaled up with `image-rendering: pixelated`. After a throw the camera glides down the lane and
  turns into a low "pin cam" (`camTo` blends height and tilt), then returns.
* Physics in real metres, seen from above: lane 1.054 m wide, 18.29 m to the head pin, ball 4.5–7.3 kg
  (setting), pins 1.55 kg. Straight on the oily front 11.6 m, then spin makes the ball hook. Pins topple
  when hit hard enough, slide, knock each other over and bounce off the deck's side walls. A little
  randomness (`scatter`, pins a few mm off their spots) keeps it from being the same every time.
* Checked by `test/t_bphys.py`: perfect pocket hit with hook ≈ 65–75 % strikes, head-on ≈ 10–15 %,
  slow straight ball ≈ 25 %, gutter = 0, Pro bot averages ≈ 190, Casual ≈ 130.
* Throwing (Inna asked for this): press on the ball, slide left/right low on the screen to choose the
  spot, flick upward and let go. Flick speed → ball speed (3.5–11 m/s); faster = more aim error
  (`aimError`); sideways flick → angle; the flick curving at the end → spin. Keyboard: ←/→ and hold Space.
  `test/t_bowl.py` throws with real mouse flicks and plays a whole game.

## 5c. Chat

* A global chat on the main menu and a chat room in every game (a CHAT button in the bottom-right,
  the room follows whichever game is open). Code is the CHAT block in `core.js`.
* **Offline:** just your own messages, kept in this browser (`ps_chat_v1`); no simulated people any more. **Online:** real messages only (`netChatRoom`), bots off,
  each message has a ⚑ report button.

## 5e. Online play (`src/net.js`, `backend/`)

* `src/online.json` holds the Supabase project URL + **anon public** key (never the service_role key).
  Empty = offline, and the hub behaves exactly as before (online choices hidden). `build.py` injects it
  as `window.PS_ONLINE`. Inna's setup steps: `backend/HOW-TO-GO-ONLINE.md`.
* `backend/supabase.sql` = all tables, row-level security and server functions. Players can't write
  ratings or rooms directly: `quick_match`, `create_room`, `join_room`, `add_move` (enforces turn order),
  `room_ping` (heartbeat), `report_result` (both players report; when they agree, Elo changes with K=32 for
  public/ranked rooms only; a loss counts at once; a win counts alone only if the opponent has had no
  heartbeat for 60 s), `open_rooms`. Chat: swear filter + 5 messages / 10 s limit (trigger), 3 reports hide a
  message. The file was run on a real PostgreSQL 16 with a mock of Supabase's `auth` schema: it runs cleanly
  twice and a full ranked game gives 1216 / 1184.
* Games only call `NET.*` (see the comment at the top of `net.js`). Two backends: Supabase, and a stand-in
  that links tabs of one browser (`localStorage.ps_net_local = '1'`) used by `test/t_online.py`.
* Online now: global + game chat, real "online now" count (presence), real open tables, the room-code box,
  and **Chess** (OPPONENT: Computer / Online · ranked / Friend · room code; ranked leaderboard). Next games to
  bring online: the other turn-based ones (Checkers, Four-in-a-Row, Tic-Tac-Toe, Naval Grid, Dominoes...).
* **Leaving / disconnecting (chess):** Leave (asks first: "counts as a loss"), the Lobby button, the sidebar or
  closing the page sends a `{t:'leave'}` move and reports a loss, so the other screen shows "Your opponent left
  the game. You win!" at once. A lost connection: `watchOpponent` tracks the opponent's heartbeat (by this
  computer's clock, not the server's); after 20 s it shows "X disconnected. You win in Ns" and at 65 s the
  player who stayed wins (the service accepts a lone win after 60 s). Closing a tab usually lands on this
  path (~60 s). `test/t_online_leave.py` checks all three on the real service.
* Setup screen options can be hidden with `when: (sel) => bool` (e.g. difficulty only vs the computer).
* **Inna's live project is configured** (`src/online.json`: kfydkerunjjdpcsjgmmw.supabase.co, publishable key).
  Newer Supabase projects need explicit table GRANTs (now in `supabase.sql`). `tlib.py` blocks the real
  service so ordinary tests never create junk players; only `test/t_online_real.py` connects on purpose, as
  "Test Pilot A/B" (passed: chat, presence, quick match, checkmate, Elo 1216/1184, leaderboard; a guest
  account editing `ratings` directly gets "permission denied"). Supabase-js is pinned at 2.118.0.
* Online identity is per browser (anonymous account): clearing site data or switching device = a new player.
  The local stand-in (`test/t_online.py`) shares localStorage between tabs, which Chromium syncs between
  renderer processes with a lag, so it can be flaky (duplicate names, lost result reports). Trust
  `test/t_online_real.py` for the online flow; it also covers room codes, resigning and "friendly = no Elo".
  `backend/cleanup-test-data.sql` removes the Test Pilot accounts.
  An optional "save my account with email" (Supabase can link an email to an anonymous user) would fix that.

## 5f. Online tables for every game (`src/netplay.js`)

One shared way to run a game table, used on this device AND online, so a game has one code path.
* A game sets `mod.online = { seats(sel), min, bots, ranked, start(body, sel, S) }`. The setup screen then gets
  a PLAY choice (This device / Online · quick match / Private room); options marked `local: true` (difficulty,
  pass & play...) only show for "This device". "Private room" shows the code box; Start opens the lobby (`npLobby`).
* Lobby: 2-seat games use the database rooms (quick match / join = ranked Elo for quick match, like chess).
  Bigger tables use the rooms table only as a registry for the code + open tables; the seats are whoever is on
  the live channel (`NET.channel(code)` = Supabase Realtime broadcast + presence, no new SQL needed). The host
  presses Start; empty seats get computer players (`NP_BOTS`).
* The session `S`: `S.seats`, `S.me`, `S.n`, `S.isHost`, `S.mine(i)`, `S.bot(i)`, `S.rng` (seeded: same shuffle on
  every screen; use it for ALL shared randomness), `S.act(a)` (a decision → the host orders it → every screen).
  Two styles:
  - **apply/drive** (Tic-Tac-Toe, Checkers): `S.on(apply, drive)`; apply(a) changes the game (returns ms to wait);
    drive() runs on the host when idle (computer moves, timed steps via `S.later`).
  - **script** (Dominoes, Color Clash, Kittens, Blackjack table): the game's async loop calls
    `await S.ask(seat, botFn, ms, filter)` at every decision; `S.ask(-1, ...)` = the table decides (timeouts,
    "first tap wins" windows like Nope / CLASH!); `S.collect(key, seats, botFn, autoFn, secs)` = everyone at once
    (bets). Call `S.track()` after `++GT.cur`.
* Offline the same code runs with `npLocal(seats)` (you = seat 0, others bots), so the offline tests cover it.
* Leaving: Leave/Lobby → `npConfirmLeave` → `_left`; missing from the channel 45 s → `_gone`. The seat becomes a
  computer player (`S.onLeft` hook); in 2-player games the other player wins. If the host leaves, the next player
  hosts. `npBar()` draws the strip under the game header (players, CPU/LEFT tags, "X disconnected" countdown).
* Blackjack online is a separate table mode (`startOnline`): 4 seats, 1,000 table chips each, N hands, no split.
* **Online so far:** Chess (own older system), Tic-Tac-Toe, Checkers, Four-in-a-Row, Dominoes, Color Clash, Kaboom
  Kittens, Blackjack, Poker, Property Tycoon (`G.NS` = table, `G.S` = money state), Word Connect (race: same letters,
  live scores, bots off), Word Duel (`wordduel.js`, Daily Word's head-to-head mode: same secret word; Daily Word
  itself stays a daily solo puzzle, its setup has a "Word Duel" choice), Bowling and Pool (the thrower's/shooter's
  screen sends the result — `res` / `end` with ball positions — so physics differences can't split the table).
* Four-in-a-Row was rebuilt as `src/games/fourinarow.js` (same id `c4`, same saved stats, uses `recordMatch` directly
  because the base page counts c4 stats there); the old base-page version is no longer reachable from the menus.
* Also online: Manor Mystery (only the asker/shower see a shown card), Find the Impostor (typed hints, everyone votes
  at once via `S.collect`), Doodle Chain (everyone plays at once on different chains; drawings sent as small JPEGs;
  3+ real players, no bots), Frontier Isles (every build/trade is a decision; offers are answered by everyone at
  once), and **Naval Grid Online** (`navalnet.js`, `hidden: true` so it has no tile; Naval Grid's setup has
  PLAY: vs the Computer / Online; fleets stay secret — the defender's screen answers each shot).
  So every game in the hub can be played online.
* Joining by code: the joiner reads the table size from the host's room (`r.settings`), not from its own screen
  (that bug sat 3-player tables as 2-player ones on the real service).
* Never use `_n` in a game action: the table puts its sequence number there.
* Tests: `test/nplib.py` (players(p, n[, real]) — on the stand-in the tabs are served from http://gamehub.test so
  window.open tabs share one process/storage; file:// tabs are cross-origin and lose updates), `t_np_ttt.py`,
  `t_np_checkers.py`, `t_np_c4.py`, `t_np_dom.py`, `t_np_cc.py`, `t_np_kk.py`, `t_np_bj.py`, `t_np_poker.py`,
  `t_np_tycoon.py`, `t_np_wc.py`, `t_np_wd.py`, `t_np_bowl.py`, `t_np_pool.py`, `t_np_manor.py`, `t_np_imp.py`,
  `t_np_doodle.py`, `t_np_isles.py`, `t_np_naval.py` (add `real` to use the real service; all pass on the stand-in;
  chess, ttt, dominoes (3 players) and kittens also passed on the real service).
* Main menu "Create Private Room" = a picker of ALL games (category tabs + compact grid, `openRoomModal` in the
  base page); the code box on the main menu looks the room up and opens the right game.

## 5g. Nov 2026 round 2 (Inna's list)

* **Hot Potato Cats** (was Kaboom Kittens; id still `kittens`): 🔥 Hot Potato (was bomb), 🧤 Oven Mitt (Defuse),
  ✋ No Way (Nope), 🍞 Toast replaced the potato cat card. Tile icon = cat holding a steaming potato.
* **Leaderboard**: online, one tab per ranked game (`rankedGames()`/`netLeaderboard` in core); the made-up offline
  board and its Overall/Naval/Streak buttons are hidden while online.
* **Queue timer**: SEARCHING/WAITING m:ss in the lobby (`np-qt`) and in chess's lobby (`ch-qt`).
* **Pool guide**: Classic (default: straight aim line to the ghost ball + two short arrows for where both balls head,
  no bounce paths) / Pro (line + ghost) / Off (short line). Like the popular online pool games.
* **Rematch** (`npRematchSlot` in netplay): every online result screen (gameResult, Impostor and Doodle end screens,
  chess) gets 🔁 Rematch. Players meet on channel `rm:<old code>`; when everyone still there agrees, the first of
  them opens a new room (ranked stays ranked) and the others join; `sel.rematch` makes the lobby start by itself.
* **Table chat**: at an online table the chat room is `t:<code>` (`NP.table`); a Table / All players switch in the
  chat header goes back to the game's general room.
* **Naval Grid Online = the offline Naval Grid** (Inna: "look and play exactly like the offline one"). `navalnet.js`
  borrows the base page's `#ng-setup-view` / `#ng-battle-view` into the game body (`giveBack()` returns them to
  `#view-naval` on close) and calls `initNavalGame(opponent, elo, 'RANKED'|'FRIENDLY')`. The base page talks to it
  through `ngNet = {ready, fire, skip, over, back}` (null offline): Deploy → `ready()`, firing → `fire(r,c)`, the turn
  timer → `skip()`; the session calls back `ngNetIncoming(r,c)` (defender answers {hit,sunk,all}) and
  `ngNetResult(r,c,res)` (shooter draws it; a sunk ship arrives as {id, cells}). The summary pop-up gets the ranked
  Elo row and a rematch slot (`#ng-sum-rm`). Test: `t_np_naval.py`.
* **Manor map**: `src/games/manor_art.js` — a cartoon manor seen from above: roof banner with chimneys, a floor
  pattern + furniture per room (greenhouse plants, library shelves, telescope, grand piano, chandelier, stove,
  barrels, billiard table, rowboat), doorways between rooms, trapdoors for the secret passages.
* **How to Play**: `src/games/zz_howto.js` (`HOWTO`, `renderHowTo`) — a grid of game titles; each opens a guide:
  goal, numbered steps, "what things mean" using real pieces (games expose `mod.art`: kittens/colorclash cards,
  dominoes tiles, chess pieces), tip, how online works, Play button.
* **Accounts** (`net.js`: `NET.upgrade / signIn / google / resetPassword / signOut / syncDown / syncUp`):
  table `saves` (`backend/accounts.sql`, one row per account, own-row access only). `saveProfileToStorage` pushes
  4 s later when logged in; at start the account's save replaces a different/older copy on the device. Google needs
  the real web address (not file://). Setup steps for Inna: `backend/GO-LIVE.md`. Tested on the stand-in
  (`test/t_accounts.py`); the real service needs Inna's Supabase steps first.
* **Legal**: `src/games/zz_legal.js` — Terms + Privacy (13+), a TEMPLATE for review; `LEGAL_INFO` filled in (owner GameHub, Inna's contact email, Indiana); domain gamehub.us.com (Porkbun)
  (owner, contact email, state). Footer links, sign-up checkbox, `#terms` / `#privacy` in the address.
* **Home page (Inna: "mainly about creating rooms and playing with friends")**: the big amber banner is now
  **Play with Friends** (`#friends-banner`: ＋ CREATE A ROOM → `openRoomModal`, and the room-code box
  `#quick-room-input` + Join). Ranked moved to the right column as a RANKED MATCH window (`.rank-screen` icon strip +
  "Find a Ranked Match").
* **Discord** (community: ideas, finding people to play with): `DISCORD_URL` + `openDiscord()` in the base page;
  buttons in the sidebar (`#nav-discord`), a COMMUNITY window in the home right column (`#discord-box`) and the footer.
  Link: https://discord.gg/BE5xR57DHm (empty = an "opening soon" toast). The pixel logo uses Discord's own blue only inside the icon.
* **Ranked Match** (right column): opens a picker of every ranked game (`openRankedModal` / `launchRanked` in the
  base page, reuses `#room-modal`; shows my Elo per game via `NET.rating`). Choosing one opens its setup with
  Online · quick match (chess: Online · ranked) and 2 players preset. Offline it says ranked needs online and opens
  the game vs the computer. The banner screen scrolls the ranked games' icons (no longer a Naval ship).
  Test: `t_ranked_banner.py`.
* **Fresh profiles (Inna: no fake "CaptainFox" profile)**: a new guest is `Player####` (random avatar), level 1,
  0 XP / streak / wins, Elo 1200 (`freshProfile(keep)`, `PROFILE_V = 2`). Profiles saved before this still had the
  made-up starting numbers: `mergeProfile` runs `removeDemoNumbers` once (subtracts `OLD_DEMO`, keeps what was really
  earned, renames CaptainFox to Player####). **A new account starts fresh** (Inna's rule): `NET.upgrade` and a
  first Google sign-in (no save online yet) reset the profile, keeping only the chosen name/avatar; online Elo in the
  `ratings` table stays with the same player. Sidebar button now reads "Sign up · Log in" and appears as soon as
  online starts (`ps-online` → `syncProfileUI`).
* **No made-up people anywhere** (Inna): `BASE_PLAYERS` (fake leaderboard) and `openTables` (fake open rooms) are
  empty, the fake "342 online" count is gone, and the pretend offline chatters (`CHAT_PEOPLE`) no longer post or
  reply. Online everything is real. `backend/cleanup-test-data.sql` removes the "Test Pilot" players Claude made on the
  real service during testing (safe after launch). Never use the real service for tests without cleaning up after.
* **Chat button** sits bottom-LEFT, next to the sidebar's profile button (`left: 254px`; phones: left, above the tab bar);
  the chat window opens above it.
* Tests added: `t_np_rematch.py`, `t_np_chat.py`, `t_accounts.py`, `t_ranked_banner.py`.

## 5h. Play modes, rooms with computer players, short links (Nov 2026, Inna)

* **PLAY = Online / Private room** for every game (+ **Solo** for games you can play alone: `SOLO_MODE` in core =
  Word Connect, Blackjack, Bowling (solo only), Doodle (Guess the Doodle); Daily Word keeps its own pop-up).
  **Pass & Play is gone** (choices matching `PASS_PLAY` are dropped). Default = Private room. With no online
  connection the old on-this-device options stay (minus Pass & Play).
* The setup screen has **no room code / link any more** when online: "Create room" opens the room first, and the code,
  invite link (+ Share) appear **in the room** (`npLobby`). The computer level (`BOT_LEVEL` key per game) and table size
  (`tableSizeKey`) are hidden on the setup screen: the room decides. A private room opens at the game's biggest table.
* **Room host controls**: COMPUTER PLAYERS [−] n [+] and COMPUTER LEVEL (`npLevelOption`; Naval = Rookie/Smart,
  Bowling = Casual/Pro). Start: alone + computers → the game's own vs-computer version on this device (`npCanLocal` /
  `npLocalSel`; Naval → `npNavalVsComputer` = offline Naval Grid); with friends → the online table with that many bot
  seats (their level rides in `sel`). Games without online bots (Word Duel: `NP_LOCAL_VS`) allow 1 computer when alone.
  Rematch brings the bots back (`rmBots`). Joiners see the bot rows (`lobby` message carries nb/lvl).
* **Naval Grid**: online the tile opens `navalnet`'s ONE setup screen (`openSetup` redirect); the old pop-up with
  "vs the Computer / Online" only shows offline. **Chess**: PLAY = Online / Private room; its room has a
  COMPUTER OPPONENT stepper (level + play as) that starts the vs-computer game.
* **Short links**: `inviteLink` = `<origin>/r/CODE` on http(s) (file:// keeps `#join=`). `handleJoinLink` reads
  `/r/CODE`, waits for the connection, looks the room up and joins. **Link previews**: the edge function asks Supabase
  `room_preview(code)` (`backend/link-preview.sql`: game, host name, has-account) and rewrites og:title/og:image:
  "Play Chess with Inna" (account) / "Play Chess together" (guest) + `og/<game>.png`. The plain site shares the logo
  banner `og/gamehub.png`. Pictures: `python3 tools/make_images.py` (after build) → `assets/site/` (banners, favicon,
  apple-touch-icon, games.json); re-run when a game or icon is added. Tab icon = favicon as a data URI in the page.
* Tests: `nplib.open_table` reads the code from the room; `nplib.start(pg)` adds computers up to the asked table size
  (or fills the room) and presses Start. `t_invite_link.py` covers short links. Checked: SQL on PostgreSQL 16 (twice,
  anon can call it), the edge function with mock rooms (account / guest / naval / closed).

## 5i. Nov 2026 round 4 (friends, new room flow, Hot Potato Cats rules, Tycoon cards)

* **Room flow (Inna: "1. choose online match or private 2. lobby with code/link, settings and chat")**: online,
  `setupScreen` first shows `pickMode()` = HOW DO YOU WANT TO PLAY? (Solo where it exists / Online match / Private
  room). Online → matchmaking; Private → the room opens at once. Presets (invite, rematch, Create Room, Ranked Match)
  skip the picker. Solo shows the old settings screen. **The room (`npLobby`)**: code + link + Invite friends + Share,
  seats + computer players, **GAME SETTINGS** the host can change while people wait (`m._roomOpts`; joiners see them
  read-only and get a toast on change), **? How to play**, Leave; the **room chat** (`t:<code>`) sits beside it
  (`.np-room`). **Private rooms never start by themselves**: the host presses Start (quick matches still auto-start).
  Chess has the same picker and room (move timer setting, room chat, Start; `ch.on('go')` starts the guest).
  Tests: `nplib.open_table` clicks `[data-mode]` and saves picks with `setupSave` first; `join()` presses the host's
  Start for 2-seat rooms; `start(pg)` for bigger tables.
* **Guide in game/room**: `openGuide(id)` (zz_howto, `guideHTML`) = pop-up; "? Guide" in every game header, "? How
  to play" in the picker and the room.
* **Chat pop-ups** (`chatPopup` in core): a new message in the current game/table chat pops up bottom-left for 4.5 s
  (and counts on the CHAT button), unless that chat is already on screen. Friend messages pop up anywhere.
* **Friends** (`src/games/zz_friends.js`, `backend/friends.sql`): Friends page (sidebar + phone header icon, badge),
  FIND A PLAYER (`search_players`), player cards (`player_card`: name, avatar, since, rankings, friend state; never an
  email), requests (Accept/Decline/Cancel), friends list with online dots (`NET.onlineIds` from presence), 1-to-1
  chat (`dms`, only friends can message, rate limit + swear filter + emails/phones hidden), Invite friends from a room
  (sends the room link; it shows a Join button → `joinRoomCode`). Tapping a name in any chat opens the card.
  Guests can use friends too (tip to make an account). `t_friends.py`.
* **Privacy**: emails never leave the account (masked on your own profile with SHOW; names can't be emails/phone
  numbers, client + SQL check; `NET.clean` and `hide_private()` hide emails/phone numbers in every chat).
* **Hot Potato Cats** closer to the familiar original, still original: generic action names (Attack, Skip, Favor,
  Shuffle, Peek, No Way), original cats (Sock, Box, Loaf, Yarn, Toast; the old Taco/Beard/Melon/Rainbow were too
  close), pixel-art cards (`kittens_art.js`, `kkArtSVG`; no emoji art). Combos: pair = **live pick** (their hand is
  shuffled with the shared rng and laid face down; you pick, they watch), three of a kind = name a card, five
  different cats = take any card from the discard pile. Favor = the target chooses. `t_kk_combos.py`.
* **Tycoon property cards** (`deedHTML` / `openDeed`, `window.tyDeed`): tap any property/rail/utility square, the
  "See the card" link when buying, or a name in your properties list. Rent by houses/hotel, set bonus, house and
  hotel cost, mortgage value; the current rent row is highlighted.
* **Slower result moments**: poker showdown holds 7.5 s (`SHOWDOWN_MS`) with a banner ("Luna wins 340 with a full
  house"), the winning five cards lit (`best5`), the rest dimmed, and a NEXT HAND IN countdown. Dominoes round end
  ~5 s, Blackjack table results 4.4 s, Tic-Tac-Toe between games 2.6 s.
* Supabase: run `backend/friends.sql` (plus `backend/link-preview.sql` from before).

## 5j. Nov 24 2026 update (held until Netlify is disconnected; goes live via Cloudflare)

* **Computer players box** in rooms stands out: amber header "ADD COMPUTER PLAYERS" / "PLAY THE COMPUTER", a line of
  explanation, bigger stepper (`.np-bots-hi`, also in Chess's room).
* **Word games use the device keyboard** (`deviceKeys(host, onKey, {tapTarget, button})` + `devkbButton()` in core):
  a hidden text box (two-space sentinel: shorter = Backspace, longer = letters; Enter as a real key) so Android
  keyboards that send no key events work too. "⌨ Use my keyboard" shows on touch screens only; tapping the board also
  opens it; the on-screen keys hide while typing (`body.devkb-on`). Daily Word, Word Duel, Word Connect. `t_devkb.py`.
* **Bigger word lists** (`tools/make_words.py` → `src/words.json`, SCOWL, licence in `src/WORDS-LICENSE.txt`; build.py
  puts them in their own `<script>` in `<head>` so they exist before the page code): ~4,900 accepted 5-letter guesses
  (`WORD_SET`), ~1,600 answers (`DW_ALL_ANSWERS` = old `WORD_DICT` + common new words; no plurals/-ed). **Daily puzzles
  up to #330 keep their old words** (`DW_SWITCH`); later days walk a fixed shuffled order (`DW_ORDER`, no repeats).
  Word Connect: puzzles still come from `src/dict.json`; ~14,000 rarer words count as **BONUS words** (`WC_EXTRA`,
  `G.bonus`, length×2 points, not needed to finish). Rude words blocked by exact form (`BLOCKED`) + a few strong
  substrings (`STRONG`); innocent words like grape/skill/canal stay. `t_words.py`.
* **Frontier Isles build buttons**: costs in words with ✓ / red, and why a button is grey ("Need 2 Stone",
  "No free spot: build a road first", "All 5 built"). `engine.render` exposed for tests. `t_isles_costs.py`.
* **Names**: saving your profile checks the online name at once ("already taken", box stays open); the auto-numbered
  name at start-up is saved with `saveProfileToStorage` (it used to call the profile-box `saveProfile`). `t_names.py`.
* **Cloudflare Pages preview**: `functions/r/[code].js` (made by build.py, same logic as the Netlify edge function,
  reads the page through `env.ASSETS`). Guide: `backend/CLOUDFLARE-MOVE.md`.
* Not done yet (Inna to decide): security fixes (room lock, CAPTCHA, hidden cards), copy protection.

## 5k. Nov 24 2026 round 2 (also held, not pushed)

* **Property Tycoon settings**: GAME LENGTH Short 15 / Medium 25 (id `quick`, kept for saved picks) / Long 40 / Classic
  (`G.timed`, `G.maxRound`). BUILDING HOUSES: whole colour (old rule) or **stand on your plot** (`G.landBuild`: one house
  per visit on the plot you landed on, `G.buildSpot`; no set or even-building needed). **Buy out land** toggle (off by
  default): after paying rent, buy the plot for 2 × (land + houses × house cost) (`buyoutPrice`, `canBuyout`, `buyout`):
  never with a hotel, never from the owner's full set (rails: all 4; utilities: both), needs the cash; houses go with it;
  bots buy only when rich and it helps a set. `window.__fast` speeds tycoon waits. `test/t_ty_rules.py`.
* **Frontier Isles dice**: every roll shows two big dice over the island (`.fi-rollfx`), the total pops up (7 = THE
  BANDIT!), lands with that number get an amber ring until the next roll (`G.hotN`). `test/t_isles_dice.py`.
* **Poker hand ranks**: `RANK_EX` / `ranksHTML` in poker.js (10 ranks, 5 example cards, the cards that make the hand lit);
  in the guide (`mod.art.ranks`) and a "🃏 Hand ranks" header button (`pkRanks()`, marks your current hand). `t_pk_ranks.py`.
* **Seats around the table**: `ringSlots(id)` / `ringFill(id, seats)` in core + `.ring4` CSS: next player on your left,
  then across, then right; phones = an arc above the table. Used by Poker, Hot Potato Cats, Color Clash. The Blackjack
  online table seats players in an arc facing the dealer (`.bj-arc`). Playing cards (Poker, Blackjack) are bigger on screens ≥ 640 px (`#gs-body`
  rules in 40-shared-cards.css; guides keep their small cards). Hot Potato Cats and Color Clash keep their original card
  and table sizes (Inna tried a bigger board and wanted the old size back). `test/shot_tables.py` takes screenshots.

## 5d. Game setup screens, room codes, leaving a game

* Every game opens on a setup screen (`setupScreen` in `core.js`). Options are `{ key, label, def,
  choices }`; add `toggle: true` for an On/Off switch shown under EXTRAS, and `hint` for a one-line
  explanation. Keep each game to a handful of options — Inna wants "customisable but not too much".
* The last settings a player picked are remembered per game (`ps_setup_v1`).
* Naval Grid and Daily Word use the same screen in a pop-up (`BASE_SETUP` + `openSetup`).
* Every setup screen has a ROOM CODE box with Copy code / Copy link / Share. The invite link is the page
  address plus `#join=CODE&g=game&s=settings` (`handleJoinLink` in core). **Online (fixed Nov 2026, Inna: "invite
  links aren't working")**: the link waits for the connection (`ps-online`; a failed start sets `NET.failed` and fires
  `ps-offline`), looks the room up with `NET.getRoom` (the room, not the link, says which game) and drops the friend
  straight into the host's table via `netJoin` (no extra Start press). A closed/not-yet-started room says so. It used
  to read the link before the page had connected, so online choices were hidden and the friend got a solo game.
  With no online service (or no connection) it opens that game's setup with the host's settings. Test: `t_invite_link.py`.
* Leaving a game that is in progress (Lobby button, sidebar, bottom tabs, closing the tab) asks
  "Leave this game?" first (`gameInProgress` + `askConfirm`). `GT.started` / `GT.over` track this for
  registered games; `gameResult()` marks a game as over.

## 6. Testing

Playwright + headless Chromium, driven from `test/`. `tlib.py` opens `dist/gamehub.html` and collects
page errors into `pg.errs`.

```bash
pip install playwright pillow && playwright install chromium
python3 build.py
python3 test/t_all.py      # every game opens on desktop + mobile with no console errors
```

Other checks in `test/`: `t_setup.py` (setup screens, room codes, invite links, leave check), `t_chat.py`,
`t_autoplay.py` (a scripted player clicks through games for 40 s), `t_auction.py`, `t_money.py` (Tycoon money
animations), `t_tyfirst.py` (Tycoon board fits on a first visit), `ck_ai.py` (computer's checkers pieces
slide), `chip_watch.py`, `t_bphys.py` + `t_bowl.py` (bowling physics and mouse-flick throws), `t_ttt.py`,
`t_dom.py`, `t_isles.py`, `t_itrade.py`, `t_manor.py`, `t_wc_tap.py`, `t_online.py` (two windows play
ranked chess and chat through the stand-in service). Several games honour `window.__fast` so tests can
fast-forward their waits.

If the Tailwind CDN is blocked (some sandboxes), `test/make_tw.py <folder with tailwindcss@3 installed>`
builds the same CSS locally into `test/tw_stub.js`, which `tlib.py` serves in place of the CDN. Not needed
on a normal computer. A `Failed to load resource` console line is that blocked CDN — harmless.

(Older notes mentioned `t_pphys.py`, `t_pui.py`, `t_pgame.py` for pool; those test files were not in the
folder that was handed over, so they do not exist here.)

**Always finish a change by running `t_all.py`** — one game throwing an error breaks the whole file.

## 7. Working habits for this project

* Build, then actually run the tests and look at a screenshot before saying something is done.
* Keep each game self-contained in its own file; shared behaviour goes in `core.js`.
* Mobile matters: the layout must work at 390 px wide. Check it.
* When Inna asks for a change to one game, change that game only — the other 14 are finished work.
