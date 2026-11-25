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

* Live at **https://gamehub.us.com**. **Since Nov 24 2026 hosted on Cloudflare Pages** (project `gamehub`,
  gamehub-8w2.pages.dev, output `dist/site`, no build command; every push to `main` goes live in ~2 min, free).
  Domain registered at Porkbun, nameservers at Cloudflare (DNS: CNAME @ and www → gamehub-8w2.pages.dev, proxied).
  The old Netlify site is disconnected from GitHub and kept only as a backup for a week. Supabase backend,
  Google sign-in configured. Discord: https://discord.gg/BE5xR57DHm.
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

In `src/games/` (all registered through `registerGame`): Chess, Checkers, **Pool**, Poker,
Blackjack, Bowling, Word Connect, Find the Impostor, Hot Potato Cats, Color Clash, Property Tycoon,
Doodle Guess (was Doodle Chain), **Tic-Tac-Toe**, **Dominoes**, **Frontier Isles**, **Manor Mystery**, and since
Nov 24 2026 **Hedge Run**, **Bullshit** (was Fibber), **Tunnel Trouble**, **Guild Masters** (see 5o).

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
* **Waking up / flaky connections (Nov 2026, Inna's iPad: "permission denied for function quick_match", "TypeError: Load
  failed")**: every server call goes through `rpc()` in net.js: it refreshes the sign-in when it expires within a minute,
  and on a sign-in error (anon role → permission denied) or a dropped request it refreshes / waits 1.5 s and retries once.
  Still failing → plain messages ("Connection problem. Check your internet and try again." / "Your connection to GameHub
  timed out. Please try again."). The tab also refreshes the sign-in when it becomes visible. `test/t_net_recover.py`.
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

## 5l. Music and emotes (Nov 24 2026)

* **Music** (`src/games/zz_music.js`, CSS in `src/css/24-music-emotes.css`): four tunes made by the browser (Web Audio,
  no files): Harbor Lights (calm), Arcade Morning (upbeat), Card Room (jazzy swing), Island Breeze (sunny). The Sound & Music
  button (sidebar `#mu-btn`, phone header `#mu-btn-m`, ♪ in game headers; see 5m) opens `#mu-pop`: sound effects, music on/off, volume, which music
  (Auto = follows the game via `AUTO`, one tune, or Shuffle) and "music during games". Saved in `ps_music_v1`; default
  **on at 35 %** (off in automated test browsers: `navigator.webdriver`, or two test tabs of music slow the online
  tests enough to time out), starting on the first tap (browsers block sound before). Stops when the tab is hidden. `window.MUSIC`.
* **Emotes** (`src/games/zz_emotes.js`): 10 silent emotes (LOL, GG, RAGE, SOB, WHAT?!, HMM, BORED, OOPS, NICE!, HOT!) drawn
  as 16×16 pixel art for **13 characters**: one per profile picture (`AVS`: 🦊🐙🐻🦉🦈🐼🦁🐸🦖🚀⚡🎯) + 🤖 for computer
  players; other emojis borrow a character (`LIKE`, else a hash). At any netplay table (`NP.S.game === activeGame`, not
  in the lobby) a face button `#em-fab` (right of the CHAT button) opens `#em-menu`; it stays open while you tap (spam allowed, a
  streak counter x2, x3...), closes on an outside tap; "Mute others" (`ps_emote_mute`). Bubbles are fixed-position above
  the player's seat (`[id$="-seat-N"]`, `[id$="-pl-N"]`, else the `#np-bar` chip, else the button) for 3 s.
  Online they go over the table channel as `emo` (`S.emote` in `npOnline`, max 5/s to the network), not as game moves.
  Chess (own online system) has no emotes yet. Inna tried emote voices and asked for them silent. `test/t_emotes_music.py`.

## 5m. Full-screen games (Nov 24 2026, Inna: "the game only uses about half of the screen")

* While a game is open `body.in-game` is set (`navigateTo`: views game / naval / daily / connect4) and
  `body[data-game=<id>]` (`openGame`). `src/css/25-fullscreen.css`: the side menu, phone top bar and footer hide, `main`
  has no max width, the game header is slim; per game, boards are sized from the height left (`--av`, ≥1024 px wide) so
  nothing scrolls on a normal screen (1690×903 checked; 1280×720 laptops scroll a little for Poker/Pool/Manor).
* Move logs (`.logbox`) are hidden; **📜 Moves** in the game header (`toggleMoves`, shown only when the game has a log)
  pops the log out as a panel. Header also has **♪** = Sound & Music.
* **Sound & Music** is one button/panel (`zz_music.js`): sidebar "Sound & Music" (the old Sound button is hidden but
  `toggleSound` still works), phone header "♪ SOUND", ♪ in every game header and the older game screens
  (`openSoundPanel(anchor)`); the panel has Sound effects + Music switches, volume, which music, music during games.
* The emote button sits right of the CHAT button (`place()` in `zz_emotes.js`); the menu opens above them.
* **Round 2 (Inna: "proportions awkward", Poker buttons under CHAT)**: a strip at the bottom is reserved for CHAT +
  emote (`main` padding-bottom 72 px; `--av = 100vh - 150px`), so nothing sits under them. Each game is a centred group:
  board sized by height + a 340 px side panel next to it (chess/checkers/ttt/c4/tycoon/isles/manor; ttt and c4 boards
  have no max width in full screen); card tables capped at ~1.4–1.75 × the height so they aren't long thin strips;
  **Poker's Fold/Call/Raise moved to the top of the side panel** (`#pk-ctl`, poker.js). Cards/tiles grow in two steps by
  screen height (≥820, ≥1000 px): Color Clash, Hot Potato Cats, Poker, Dominoes, Word Connect wheel (transform scale),
  Daily Word (zoom). Checked at 1920×1080, 1690×903, 1366×768 (some games scroll a little) and 390 px phones.
  `test/shot_poker_turn.py` checks the Poker buttons never overlap CHAT/emote.
* **Round 3, immersive (Inna's reference pictures: a full-screen table, small player tags, one compact control bar)**:
  on computers (≥1024 px) the game header (`#gs-wrap > .panel:first-child`, and the first panel of the Naval / Daily /
  Four-in-a-Row views) is a **fixed floating bar at the bottom centre**; CHAT and the emote button sit right beside it
  (`placeChat()` / `place()` in zz_emotes.js, which also moves `#chat-panel` above CHAT). `--av = 100vh - 96px`.
  Card games (poker, kittens, colorclash, dominoes, blackjack) paint the felt over the whole page (body background) and
  their `.felt` boxes go transparent, with a faint dashed oval for the table; their panels are dark, slightly
  see-through. Phones keep the header at the top.
* **Name tags (Nov 2026, Inna's reference picture)**: `nameTag({av, name, sub, badge, turn, dealer, me})` in core + `.tg-*` CSS
  (40-shared-cards.css). Poker, Hot Potato Cats, Color Clash and Dominoes draw players as `.tg-seat` (ids `pk-/kk-/cc-/dm-
  seat-N` kept for emotes and card flights): cards on the table (opponents' face-down cards fanned in `.tg-fan`), a small
  tag under them (picture, name, chips / cards, yellow count bubble, D = dealer, gold outline on their turn, teal = you).
  `t_np_cc.py` clicks through `evaluate` (real mouse clicks hit cards mid-animation on the slow two-tab stand-in).
* `test/shot_full.py [games] [d|l|m]` screenshots every game at 1690×903, 1280×720 and phone; check page height.

## 5n. Nov 24 2026 big update, part 1 (Inna's list)

* **Music** pauses on tab switch and continues from the same spot (`ac.suspend/resume`, no restart).
* **Chess move list** shows again (`#ch-moves` is excluded from the hidden move logs).
* **Copyright**: footer "© 2026 GameHub. All rights reserved."; Terms §5 "Our content and copyright" (all rights, original
  games not affiliated with others, contact for claims).
* **Loading screen** when a game opens (`gameLoading` in core, ~1 s, icon + name + filling bar + tip; skipped when
  `navigator.webdriver`).
* **Phone menu**: ☰ (`#m-burger`) top-left opens `#m-drawer` (built from the sidebar nav + Sound & Music + sign up +
  Terms/Privacy); the phone sound buttons are hidden.
* **Home page**: `.hp-top` (title + stats in one line), `.hp-row` = Play with Friends + `.hp-side` (Ranked, Discord bar),
  `#shelves` = ALL GAMES grid with category buttons (`renderShelves`, `shelfCat`), `.hp-bottom` = open rooms + global chat.
* **Game layout v2 (computers)**: controls bar fixed top-left; card games' side panel floats top-left under it; Poker's
  `#pk-ctl` is a bottom-centre bar; CHAT + emote bottom-left; `.ring4` column gaps; bigger Poker / Color Clash / Dominoes /
  Blackjack cards by screen height (Hot Potato Cats unchanged).
* **Animations**: `chipStream(from, to, amount, opt)` in core (chips fly one by one, a "chip" sound each); Poker bets / sweeps
  / pot payouts and Blackjack chips use it; a Poker fold throws the two cards onto `#pk-deck` (folded seats show no
  cards); `celebrate()` = pixel confetti on win results (gameResult); views fade in (opacity only: a transform would
  move the fixed game bar).
* **Friends in the game chat** (`zz_chatfriends.js`): "👥 Friends" in the chat header lists friends; tap one to message
  them inside the chat window (`NET.dmHistory` / `dmSend`, refreshes every 4 s); "← Room" goes back.
* **Pool live aiming**: `S.peek(d)` / `S.onPeek(i, d)` (netplay, channel event `peek`, not stored): the shooter sends
  aim + power ~12×/s; other screens glide the cue to it (`G.peekAim`, `G.peekPow`). `engine.G` exposed for tests.

## 5o. Nov 24 2026 big update, part 2 (rest of Inna's list, all live)

* **Board-game player lists** (Isles, Tycoon, Manor) use the name-tag style (`.pl-tag`, `--pc` = player colour).
* **Welcome pop-up + rewards** (`zz_rewards.js`): guests see the approved small pop-up (`prototypes/welcome-popup.html`)
  once on their first visit (never when arriving by invite link; `ps_welcome_v1`), and once more after their first win.
  6 extra avatars unlock by level 5/10/15/20, 50 wins, playing every game (online they need an account; locked ones show
  a 🔒 and the reason). Badges = the site's existing `BADGES` list (base page + core.js); a toast says when a new one is
  earned (`REWARDS.earned()`). Don't add a second badge list.
* **Player cards + profile page** (`zz_friends.js`, `backend/player-stats.sql`): every browser publishes a small summary
  of its stats every 15 s when it changed (`publish_stats`: level, games, wins per game, earned badges, last 12 results;
  never an email). A player card shows Level / Games / Win %, plus "IN <GAME>" numbers when opened during a game, and
  "View full profile" (overview, badges, games played table with rating, recent games). `t_pstats.py`.
  **Supabase: run `backend/player-stats.sql` once** (until then cards just say "No games played yet").
* **Guides** (`zz_howto.js`): online texts describe the new room flow (Online match / Private room / computer players).
* **Pool feel**: sounds scale with how hard balls hit (`poolSnd`: ball, rail, pocket, cue); the cue follows through and
  fades after a shot (`G.follow`).
* **New original games** (all with computer players, online tables, guides, tests, link-preview banners):
  - **Hedge Run** (`hedge.js`, Quoridor-style): 9×9 garden, step or plant a 2-square hedge; a hedge may never shut anyone in
    (`wallProblem`). 2 players (10 hedges) or 4 (5). Computer Easy/Medium/Hard (`aiAction`: shortest paths). Your board is
    turned so your pawn starts at the bottom. `t_hedge.py`, `t_np_hedge.py`.
  - **Bullshit** (was Fibber, id still `fibber`, `fibber.js`, bluffing card game; Inna chose the name): put 1-4 cards face down as the current rank (A, 2 ... K), anyone can shout
    BULLSHIT! within a few seconds (first tap wins, `S.ask(-1, ...)`); liar or wrong shouter takes the pile. 3-5 players.
    The doubt countdown must be stopped when the window closes (`G.stopDoubt`), or it wipes the next turn's buttons.
    `t_fibber.py`, `t_np_fibber.py`.
  - **Tunnel Trouble** (`tunnel.js`, Saboteur-style): secret Diggers vs Rascals, tunnel pieces must fit and join the tunnel,
    break/fix pick & lamp, treasure map peek, cave-in. Roles dealt from n+1 cards (sometimes no Rascal). Computer games come
    out about 50/50 (`t_tunnel.py` plays 10). `t_np_tunnel.py`.
  - **Guild Masters** (`guild.js`, Citadels-style): pick one of 8 characters each round (Shadow, Pickpocket, Trader, Monarch,
    Abbot, Merchant, Architect, Captain), take 2 gold or keep 1 of 2 cards, build; game ends at 6/7/8 buildings.
    `t_guild.py`, `t_np_guild.py`.
* **Doodle Guess** (was Doodle Chain, id still `doodle`): main mode is live **Draw & Guess**: the drawer picks 1 of 3 words,
  strokes stream live over `S.peek` (`{k, n, c, s, p}` pieces, `u` = undo, `x` = clear), guesses go through `S.act`, the
  host's `tick` ends the turn / plays computer guesses; computer drawers animate a built-in doodle (`DOODLES`). Solo
  "Guess the Doodle" kept; the old chain code is still in the file but unreachable. `t_doodle_live.py`.
* `make_images.py` was re-run (24 banners). The welcome pop-up, music, loading screen and confetti are skipped when
  `navigator.webdriver` (tests).

## 5p. Game names (Nov 24 2026, Inna's choice)

* Shown names changed (ids, saved stats and file names unchanged): Color Clash → **Uno**, Property Tycoon → **Landlord**,
  Naval Grid → **Sea Battle**, Manor Mystery → **Whodunit**, Frontier Isles → **Island Settlers**, Hot Potato Cats →
  **Kaboom Cats**, Tunnel Trouble → **Mine Saboteurs**, Guild Masters → **Castles & Kings**, Hedge Run → **Wall Maze**,
  Fibber → **Bullshit**. Older notes in this file still use the old names. Inna was told "Uno" is a Mattel trademark
  and chose it anyway; no brand subtitles on tiles.

## 5q. Nov 25 2026 tweaks (Inna)

* **Bullshit**: computers think 2-3 s, TIME TO SHOUT 5/7/10 s (default 7), cards stay turned over 2.8 s. On computers
  players sit far apart round a big table, bigger cards (36-fibber.css); with 5 players the two across sit side by side
  (`#fb-opp > .r-top` no wrap), never stacked.
* **Wall Maze**: no Move / Plant buttons. Tap a glowing square to move; the gaps between squares are buttons (`.hr-gap`,
  `data-w="h r,c"` / `"v r,c"`: the hedge covers the tapped gap and the next one right/down). Mouse: hovering shows the
  hedge (`#hr-ghost`), one click plants. Touch: first tap shows it (`G.ghostW`), second tap plants.
* **Mine Saboteurs / Castles & Kings** full-screen on computers: players panel floats left (Saboteurs) / characters
  panel floats right (Castles); map / towns fill the rest, bigger cards and buildings.

## 5r. Doodle Guess words + Vietnamese, stage 1 (Nov 25 2026, Inna)

* **Doodle Guess** is people-only now (`online.bots: false`, no Solo, offline Start just says to make a room).
  `src/games/doodle_words.js` = `DOODLE_WORDS[en|vi][easy|medium|hard]` (~500 words). The drawer gets one word of each
  level (×1 / ×1.5 / ×2 points); guessers see `KHÓ · _ _ _` (level + dashes). Room setting WORDS = English / Tiếng Việt
  (`sel.lang`). Guesses ignore accents and đ (`norm`). Drawing time defaults to 60 s. `t_doodle_live.py`.
* **Word Connect words** (Nov 25): must-find words = common words only (`tools/make_words.py` writes `src/dict.json` from
  `src/dict_source.json` + SCOWL sizes 10-35, `DROP3` removes odd 3-letter words); bonus words up to size 55 (e.g. taro).
  `autoEnter` waits 1.3 s instead of 0.26 s when the letters so far could still become a longer word (tar → taro).
* **Language** (`src/games/zz_lang.js`): `LANG.code` ('en' | 'vi', saved in `ps_lang`), switch = `#nav-lang` in the side
  menu (the phone ☰ menu copies it), `setLang()` reloads. Vietnamese works by swapping exact English lines (`VI` table)
  and a few patterns (`PAT`) as they appear (MutationObserver); chat messages, guesses and logs are skipped. Stage 1 =
  menus, home, tiles, setup/room screens, profile, friends, leaderboard, common game buttons. Part 1
  (`src/games/zz_i18n_vi.js`, `VI_MORE`, loads just before zz_lang): game descriptions, every setup option / hint, loading
  screen lines + tips, room messages. Guides: `src/games/zz_howto_vi.js` = `HOWTO_VI[id]` {goal, steps, tip, online} used by `guideHTML` when Vietnamese;
  guide labels, card words (Kaboom Cats, Saboteurs, Poker ranks) are in `VI_MORE`. Not yet: in-game messages, results,
  toasts, Terms/Privacy. Add new lines to `VI` when you add English text. `t_lang.py`.

## 5s. Home page v3 (Nov 25 2026, Inna: "more clean, less busy, bigger code input box")

* Top = `.nh` bar (`#friends-banner`): left amber "Play with friends" + ＋ CREATE A ROOM (`openRoomModal`), right a big
  code box (`.nh-code.code-row`, `#quick-room-input` + JOIN → `quickJoinFromBar`). Under it two slim links: `#rank-link`
  (`openRankedModal`) and `#discord-link`. CSS `src/css/26-home.css`. The greeting, streak/Elo boxes, ranked arcade
  screen and Discord box are gone (their JS updates are null-safe). Tiles show no NEW / SOON labels (HOT and Daily Word's
  badge stay). The global chat window is hidden on home (CHAT button still opens it); open rooms are full width.

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

## 5t. Nov 25 2026: player feedback (Cael) + online reliability

* **Online tables survive lost messages** (`npOnline` in netplay.js): a guest's decision gets an `_id` and is re-sent every
  ~3 s until it comes back as a table move (the host ignores repeats via `seen`); every guest also sends `sync {from}`
  every 3 s so a lost LAST move is noticed (the host answers only when it has newer moves). `test/t_np_lossy.py` plays
  Sea Battle Online with 30% of messages thrown away. Before this, one lost message on a bad connection was never re-sent.
* **Sea Battle**: online, a fired shot is marked at once (`'pend'` in `ng.playerShots`, dashed amber box) until the
  defender answers; after 6 s with no answer the banner says "Slow connection...". The aimed square shows a FIRE! tag.
* **Bullshit**: play goes on until one player still has cards (`G.places`, `placeOut`); finishing order on the result
  screen; Elo/win = 1st place. Offline, once you're out, the side button becomes "See the results now" (`endNow`).
  Your hand and turned-over cards show real pips (`pipCard`, `PIPS`); the pile is big, grows with the cards, big count.
* **Mine Saboteurs**: a broken tool explains how to fix it (`fixHelp`), matching Fix cards glow with a USE ME tag, guide
  step "Broken pick or lamp?" + Fix card picture; peeked goal stones show a big GOLD / ROCK badge; bigger "?".
* **Castles & Kings**: instant info box over buildings (`#gm-tip`, `data-tip`; no `title`), thicker brighter colour strips.
* **Landlord**: dice total (`#ty-msg`) and "Your cash" much bigger. Room GAME SETTINGS rows no longer overflow (wrap).
* **Less clutter in games (Inna)**: the online name strip (`#np-bar`) only shows for a warning ("X disconnected");
  Give up / Leave table buttons are hidden in card and board games (`25-fullscreen.css`; ← Lobby leaves and asks first);
  Kaboom Cats / Uno side panels lost their title bar; Bullshit has no side panel at all (log kept for 📜 Moves).
* **Bullshit**: the rank is random every turn (never the same twice, `S.rng` so every screen agrees); `noDoubles()` after
  each pickup is a safety net (a player saw six Eights on the old version; not reproduced). `test/t_cards_unique.py` checks
  Uno, Kaboom Cats, Dominoes and Bullshit never have a card in two places.
* **Landlord**: whose turn it is shows above the dice (`#ty-title`); pawns fill their square (shrink when sharing), your
  own has a teal ring; tapping a pawn shows the square under it (deed card or a toast).
* **Friends in a game** (`zz_friends.js`, `zz_chatfriends.js`): a friend request pops up anywhere (`frReqPop`: Accept /
  See card / Not now); tapping a player's name tag at an online table opens their player card (Add friend); the chat's
  👥 Friends view lists AT THIS TABLE with + Add friend / Accept; "Chat" on a card during a game opens the chat window.
  Fixed: the first friend request after opening the site never popped up. `test/t_friends_ingame.py`.

## 5u. Nov 25 2026 round 2 (Inna's "update these" list)

* **Computer players are slower** so people can follow: in `S.ask` (netplay) a bot seat's wait under 2 s is x1.8 (max
  2.4 s; table timers, seat -1, keep their length); Tic-Tac-Toe, Checkers, Four-in-a-Row, Wall Maze and Chess wait
  ~1.3-2.1 s. `window.__fast` still makes tests quick.
* **Game log**: "📜 Log" in the game header opens/closes it (stays open until pressed again or Esc).
* **Room lock**: the host of a private room has 🔓 Lock room (`locked` in `npLobby`): nobody new is seated, a newcomer
  gets "This room is locked by the host." and leaves; players inside see 🔒 LOCKED. `test/t_np_lock.py`.
* **Chess emotes**: online chess opens a small channel `ce:<code>` and sets a minimal `NP.S` (seats, `emote`, `leave`)
  so the emote button works; the other player's emote shows at the top of the board. `test/t_chess_emotes.py`.
  Games without seat boxes show the other player's emote at the top of `#gs-body`.
* **Copy protection** (`protect()` in build.py): the LIVE copy `dist/site/index.html` has its main script minified with
  terser (tools/tailwind: `npm install` now also installs terser 5.31.0) and starts with an address lock (gamehub.us.com,
  *.gamehub.us.com, gamehub-8w2.pages.dev + previews, localhost, file://, gamehub.test). Elsewhere it shows "This is not
  the official GameHub". `dist/gamehub.html` stays readable for tests; `python3 build.py --readable` skips it.
  `test/t_protect.py`. Can't stop a determined copier (the code always reaches the browser); it deters casual copies.
* **Small laptops (≤820 px tall)**: Whodunit rooms are shorter, Pool's Resign/New game row is hidden, Poker's
  Fold/Call/Raise move to the left under the table panel; Poker, Pool and Whodunit fit 1280x720 without scrolling.
* **Vietnamese part 2** (`src/games/zz_i18n_vi2.js`, `VI_MORE2`): result screens, profile numbers, pop-up notes, common
  prompts, today's new lines (friends, places, Landlord turns, Sea Battle, room lock) + patterns in `PAT`; CSS labels
  (FIRE!, USE ME) switch via `html[lang="vi"]`. Move logs and chat stay untranslated.
* Not done (need Inna): CAPTCHA (needs a Cloudflare Turnstile site key + Supabase setting, in that order) and truly
  secret hidden cards (needs a server-side dealer per game).
* **Turn timer = the name tag's outline** (Inna, Nov 2026): `makeClock` (core.js) also sets `--turn-left` (0-1) on the page
  and `body.clk-on` / `clk-low`; the `.tg-tag.turn` / `.pl-tag.turn` outline is a gold line that runs out round the tag
  (red and blinking for the last seconds). Poker / Uno / Kaboom Cats hide their timer boxes (Uno and Kaboom Cats lost
  that side panel entirely); Uno and Kaboom Cats now show your own name tag above your hand (`#cc-me`, `#kk-me`).
* Home page has no chat (CHAT button hidden there); `t_online.py` chats in a game's room instead.
* **CAPTCHA (Cloudflare Turnstile)**: site key in `src/online.json` (`turnstile`, public; the SECRET key only goes into
  Supabase). `captcha()` / `withCaptcha()` in net.js add `captchaToken` to the guest sign-in, log in and password reset,
  only on https gamehub.us.com / gamehub-8w2.pages.dev; invisible unless Cloudflare wants a tap; on failure or after 20 s
  the call goes ahead without a token. Supabase: Authentication → Attack Protection → CAPTCHA (Turnstile + secret key),
  switched on only AFTER this code was live. `test/t_captcha.py` (stand-ins, no real service).

## 5v. Nov 25 2026 round 3 (Inna's list)

* **Bullshit turn timer**: setting TURN TIMER 20/30/45/Off (default 30); `G.clock` (makeClock on a hidden host) runs round
  the name tag of the person choosing; on their own screen a time-out puts down one card (`botPlay`). Your own tag
  (`#fb-seat-<me>`) replaces "YOUR CARDS". Computer turns show no ring.
* **Prompt above your cards** (Uno, Kaboom Cats, Bullshit): a small label as wide as its text, invisible when empty
  (keeps its height) instead of the full-width dark strip.
* **"What just happened" notices** (`gameNote` + a 350 ms watcher in core.js): new lines in the hidden game log that
  match `IMPORTANT` (jail, skip, steal, broken, bandit, bluff caught...) pop up at the top of the game for ~4 s.
* **Guides**: more detail for Landlord (START, doubles, Jail options, cards, rails/utilities, taxes, Free Parking,
  mortgages, tap to look), Island Settlers (where you can build, Bandit, Longest Road), Whodunit (who shows a card,
  wrong accusation), Castles & Kings (why a turn was skipped, gold from colours). English + Vietnamese.
* **Sea Battle**: name tags (you / opponent, `#ng-tags`, ids `ng-seat-N`) with the turn ring on yours; the timer box and
  bar are hidden. Result pop-up has "👁 See the boards" (`ngPeekBoards`, bar to bring it back). Online, each screen sends
  its fleet at the end (`S.peek({fleet})` → `ngShowEnemyFleet`), so the loser sees the winner's ships.
* **Chat at the table**: a message from someone at an online table shows as a speech bubble above their name tag
  (`seatSay` in zz_emotes.js, called from `chatPost`); the corner pop-up is only used when there's no tag. `t_chat_bubble.py`.
* **Phones**: the bottom tab bar is gone (`.mtabs` hidden; ☰ menu has everything); in games CHAT and emote are small icons.
* **Cards**: card numbers use Outfit (6 vs 8 were hard to tell in the pixel font); Uno 6 and 9 underlined (`u69`);
  Poker bet amounts (`.chip-amt`) and status lines like "All in" (`.tg-st`, red) are bigger. Timer ring stays under badges.
* **Real card faces everywhere** (`playingCardHTML` in core.js, `PC_PIPS`): 2-10 show their number of suit symbols, Aces one
  big suit, J/Q/K a big letter; pips are a % of the card width. Tiny cards (hand-ranks guide `.pk-rc`, guide items, `.xs`)
  show one big suit (`.pc-one`). Uno and Kaboom Cats keep their own cards. Don't use `container-type` on `.pcard`: it
  broke the Poker board row.
* **Poker layout (1280-1920 wide)**: the table's sides were 260 px empty, which squeezed the five shared cards onto
  several rows and pushed your cards under the button bar; now 40 px sides, `.pk-board` never wraps, and on screens up to
  950 px tall the cards shrink a little; Fold / Call / Raise ALWAYS stay at the bottom (Inna) and the table keeps
  ~92-104 px free under your seat for them. Numbers on card tables (tag counts, chips, POT, BANK, BET) use Outfit.
* **Court cards** (`courtSVG(rank, suit)` in core.js): J / Q / K show a double-headed pixel-art figure in a frame (King:
  crown, beard, sword; Queen: crown, golden hair, flower; Jack: feathered cap, halberd), drawn for GameHub (no copied deck
  art). The hand-ranks guide uses 46x66 cards with full faces.
* **Fluid card sizes** (`src/css/41-card-sizes.css`, Inna: "different sizes on different screens, fit perfectly"): each
  card game computes one card width `--cw` from the screen height/width (Poker `(100vh-440)/5.2` capped by 5.75vw,
  40-124 px; Blackjack `(100vh-450)/3.5` / 7vw, 48-160; Bullshit `(100vh-410)/6.3` / 7vw, 40-120, and your hand also
  shrinks so all cards stay on one row: `--n` = cards held, set in fibber.js). Corners, suit, pips, aces and court
  pictures scale from the card (`--k`). Checked at 1280x720, 1366x768, 1440x900, 1536x864, 1690x903, 1920x1080,
  2560x1440 and a 390 px phone: no scrolling, Poker's shared cards in one row and your seat above the button bar,
  Blackjack's Hit/Stand on screen. Re-measure with a script like this if a layout changes.
* **Blackjack online table** (Inna): players are name tags with the turn ring (`O.clock` = makeClock on a hidden host:
  25 s while betting on your own tag, 30 s on whoever's turn it is; computers get none). You always sit exactly in the
  middle (`.bjs-side.l` | you | `.bjs-side.r`, three grid columns), lowest and with full-size cards; the others sit in
  an arc to your left/right (ends higher). Phones: the others in a compact row on top, you underneath. Seat ids
  `bjo-seat-N` (emotes, chat bubbles). `t_np_bj.py` compares seats by id (each screen sees itself in the middle).
* **Log button fix**: the hide rule `.logbox:not(#ch-moves)` counts as an id, so it beat the show rule and the log never
  opened; the show rule now has the same `:not(#ch-moves)`. Bullshit's `#fb-log` sits outside its hidden box.
* **Daily Word**: no tile in the ALL GAMES grid (`noTile` in `renderShelves`; it's in the side menu) and it is not a
  full-screen game any more (`navigateTo` no longer adds `in-game` for 'daily'), so the side menu stays.
* **Button shadows**: the game bar, Poker's bet bar and the card-game prompts have more padding at the bottom so the
  3D buttons' 5 px shadow stays inside the bar.

## 5w. Nov 25 2026: Pool bigger, ball in hand, bigger rooms, emotes on names

* **Pool layout (computers)**: `.pl-lay` grid in 25-fullscreen.css: the table fills the left (sized from `--av`), player
  boxes (`#pl-seat-0/1`, were `pl-p0/1`) + controls (`.pl-ctl`) are a 320 px column on the right, the pull-back power
  bar runs under the table. Phones keep the stack (players, table, bar, controls).
* **Ball in hand = drag and drop**: press anywhere (or on the cue ball), drag, let go. After placing, the ball stays "in
  hand" (`G.bih`) until the shot, so you can grab it again and move it; a spot on another ball is refused.
  `test/t_pool_bih.py`.
* **Rooms (≥1280 px)**: private rooms are two columns (code / link / players | computer players / settings / Start),
  up to 1560 px wide, chat 400 px and as tall as the screen allows (22-netplay.css, CSS columns with a break before
  `.np-bots`).
* **Emote / chat bubbles on names**: `target()` in zz_emotes.js falls back to the smallest box showing the player's
  name (player panels, score boxes) before the screen corner; boxes inside `[data-bub="left"]` (Pool's side column) get
  the bubble to their left. `EMOTE.target` is exposed; `test/t_emote_targets.py` checks 18 games.

## 5x. Table designs for card games (Nov 25 2026, Inna chose them from `prototypes/table-designs.html`)

* `src/games/zz_tables.js` + `src/css/27-tables.css`: six looks (Classic Felt, Harbor Night, Royal Red, Saloon Planks,
  Arcade Grid, Lagoon) for `TABLE_GAMES` = Poker, Blackjack, Uno, Kaboom Cats, Bullshit, Dominoes. Each = screen
  background, a table with stepped pixel corners (rim `::before` + cloth with a faint emblem `::after`, under Poker's whole
  ring of seats, the middle of the others, Blackjack/Dominoes' felt) and the back of playing cards (`.pc-back`; Uno and
  Kaboom Cats keep their printed backs). Phones: the `.felt` box gets the cloth + a rim-coloured edge.
* Each player picks their own: **🎨 Table** in those games' header (`gameShell` → `openTablePicker`), saved in
  `ps_table_v1`, not sent online. Colours are CSS variables `--tb-*` set on `<html>` by `TABLES.apply`.
  `test/t_tables.py`. Mine Saboteurs / Castles & Kings have their own boards and are not included.

## 5y. Doodle Guess tweaks (Nov 25 2026, Inna)

* **Stricter guesses**: `matches` accepts only the exact word (capitals, spaces and Vietnamese accents may differ); the old
  "one typo / extra s" allowance is gone. A guess one letter off (`near`) shows "so close! Check the spelling." to the
  guesser only; everyone else sees "X is close!" (never the nearly-right text).
* **ROUNDS** 1 / 2 / 3 / 5, default 5.
* **More words**: `DOODLE_MORE` in doodle_words.js is merged in (duplicates skipped): ~550 English, ~460 Vietnamese.
* **Word language stands out**: setting `hero: true` (netplay sorts it first, `.np-set-hero` amber frame, hint line,
  bigger buttons, flags). Rooms with settings but no computer-players box (Doodle) also use the two-column room layout.
  `test/t_doodle_live.py` checks the near guess and the hero setting.
