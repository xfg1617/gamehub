# PlayStack

A browser game hub that ships as one HTML file. Open `dist/playstack.html` in any browser and it works —
no server, no install, nothing to sign into.

## What's in here

| folder | what it is |
| --- | --- |
| `dist/playstack.html` | **the game hub** — this is the file you open, share or upload |
| `src/games/` | one file per game (19 games in the hub: 16 here, plus 3 in the base page) |
| `src/core.js`, `src/icons.js`, `src/css/`, `src/dict.json` | the shared parts every game uses |
| `base/playstack_base.html` | the page the games are put into |
| `build.py` | puts `src/` into `base/` and writes `dist/playstack.html` |
| `backend/` | the online service setup: `HOW-TO-GO-ONLINE.md` (start here) and `supabase.sql` |
| `src/online.json` | where the online service's address and public key go (empty = offline) |
| `test/` | automated tests that open the page in a real browser and play the games |
| `CLAUDE.md` | the project's memory — Claude Code reads this automatically every session |

## Rebuilding after a change

```bash
python3 build.py
```

That's it. `dist/playstack.html` is regenerated. Don't edit that file by hand — the next build
would wipe your changes. Edit the files in `src/` (or `base/`) instead.

## Running the tests (optional)

Once, to set up:

```bash
pip install playwright pillow
playwright install chromium
```

Then:

```bash
python3 test/t_all.py      # opens every game on desktop and phone sizes, checks for errors
```

Screenshots land in `test/shots/`.

## Starting a Claude Code session

```bash
cd playstack
claude
```

Claude Code picks up `CLAUDE.md` on its own, so it starts knowing the design rules, how the build
works and how every game is put together.
